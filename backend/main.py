from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
import models
from database import engine, SessionLocal
import auth
from auth import get_current_user
from fastapi.security import OAuth2PasswordRequestForm
from datetime import timedelta, datetime
from fastapi import File, UploadFile
import os
import shutil
from services.extraction_service import InvoiceExtractor
from services.workflow_service import WorkflowService
from services.insights_service import InsightsService
from services.export_service import ExportService
from fastapi.responses import Response, JSONResponse
from typing import Optional
import logging
import traceback

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Create database tables
models.Base.metadata.create_all(bind=engine)

app = FastAPI()

# Initialize the invoice extractor
extractor = InvoiceExtractor()

# Allow React frontend to connect
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "https://invoice-management-mu.vercel.app",  # Add this!
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Database dependency
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@app.get("/")
def read_root():
    return {"message": "Invoice System API is running!"}

@app.post("/token")
async def login(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    user = auth.authenticate_user(db, form_data.username, form_data.password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    access_token_expires = timedelta(minutes=auth.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = auth.create_access_token(
        data={"sub": user.username, "role": user.role}, 
        expires_delta=access_token_expires
    )
    return {
        "access_token": access_token, 
        "token_type": "bearer", 
        "role": user.role,
        "username": user.username
    }

@app.post("/upload")
async def upload_file(
    file: UploadFile = File(...),
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # Create uploads directory if it doesn't exist
    upload_dir = "uploads"
    if not os.path.exists(upload_dir):
        os.makedirs(upload_dir)
    
    # Save file temporarily
    file_path = f"{upload_dir}/{datetime.now().timestamp()}_{file.filename}"
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
    
    logger.info(f"\n📤 File uploaded by {current_user.username}: {file.filename}")
    
    # EXTRACT DATA WITH AI
    extracted_data = {}
    try:
        if file.filename.lower().endswith('.pdf'):
            extracted_data = extractor.extract_from_pdf(file_path)
            logger.info("✅ AI Extraction complete!")
        else:
            # Delete non-PDF file immediately
            os.remove(file_path)
            raise HTTPException(
                status_code=400,
                detail={
                    "error": "Invalid file format",
                    "message": "Only PDF files are accepted. Please upload a PDF document."
                }
            )
    except HTTPException:
        # Re-raise HTTP exceptions
        raise
    except Exception as e:
        logger.error(f"❌ Extraction error: {e}")
        logger.error(traceback.format_exc())
        extracted_data = {
            'vendor': 'Extraction Failed',
            'invoice_number': 'Error',
            'amount': 0,
            'vat_amount': 0,
            'date': None
        }
    
    # DOCUMENT TYPE VALIDATION - Check if it's an invoice or credit note
    filename_lower = file.filename.lower()
    extracted_text = extracted_data.get('raw_text', '').lower() if extracted_data else ''
    
    # Check for invoice/credit note indicators in filename
    is_invoice_filename = 'invoice' in filename_lower
    is_credit_filename = 'credit' in filename_lower or 'creditnote' in filename_lower
    
    # Check for indicators in extracted text
    has_invoice_indicators = any(ind in extracted_text for ind in ['invoice', 'tax invoice', 'invoice number'])
    has_credit_indicators = any(ind in extracted_text for ind in ['credit note', 'creditnote', 'credit memo'])
    
    # Check if we have key invoice fields (more reliable)
    has_key_fields = (
        extracted_data.get('vendor') and extracted_data['vendor'] not in ['Unknown', 'Extraction Failed'] and
        extracted_data.get('invoice_number') and extracted_data['invoice_number'] not in ['Unknown', 'N/A', 'Error'] and
        extracted_data.get('amount', 0) > 0
    )
    
    # Determine if document is valid
    is_valid_document = (
        (is_invoice_filename or is_credit_filename or has_invoice_indicators or has_credit_indicators) or
        has_key_fields
    )
    
    # If not valid, reject the upload
    if not is_valid_document:
        # Delete the temporary file
        os.remove(file_path)
        
        logger.warning(f"🚫 Rejected upload: {file.filename} - Not an invoice or credit note")
        
        raise HTTPException(
            status_code=400,
            detail={
                "error": "Invalid document type",
                "message": "Only invoices and credit notes are allowed. Please upload a valid invoice or credit note document.",
                "help": "The document doesn't appear to be an invoice or credit note. Check that it contains typical invoice fields or has 'invoice'/'credit' in the filename."
            }
        )
    
    # Determine document type for database
    if is_credit_filename or has_credit_indicators:
        doc_type = "credit_note"
    else:
        doc_type = "invoice"
    
    # CHECK FOR DUPLICATES - NOW WITH BLOCKING
    from services.duplicate_service import DuplicateChecker
    duplicate_checker = DuplicateChecker(db)
    
    duplicate_result = duplicate_checker.check_document(
        vendor=extracted_data.get('vendor', 'Unknown'),
        invoice_number=extracted_data.get('invoice_number', 'Unknown'),
        amount=extracted_data.get('amount', 0),
        date=extracted_data.get('date')
    )
    
    # 🚫 BLOCK DUPLICATES - Return error immediately
    if duplicate_result["is_duplicate"]:
        # Delete the temporary file
        os.remove(file_path)
        
        # Return 400 error with duplicate info
        raise HTTPException(
            status_code=400,
            detail={
                "error": "Duplicate document detected",
                "reason": duplicate_result["reason"],
                "original_document_id": duplicate_result["original_id"]
            }
        )
    
    # ONLY SAVE IF NOT DUPLICATE AND VALID DOCUMENT TYPE
    doc = models.Document(
        filename=file.filename,
        file_path=file_path,
        document_type=doc_type,  # Use determined type instead of just filename check
        status="pending_review",  # Start at stage 1
        upload_date=datetime.now(),
        vendor=extracted_data.get('vendor', 'Unknown'),
        invoice_number=extracted_data.get('invoice_number', 'Unknown'),
        amount=extracted_data.get('amount', 0),
        vat_amount=extracted_data.get('vat_amount', 0),
        date=extracted_data.get('date'),
        uploaded_by=current_user.id,  # Use actual user ID from token
        is_duplicate=False,  # We already checked
        duplicate_reason=None,
        original_document_id=None,
        current_approver_role="reviewer"  # First approver
    )
    
    db.add(doc)
    db.commit()
    db.refresh(doc)
    
    logger.info(f"✅ Document saved with ID: {doc.id}, Status: {doc.status}, Uploaded by: {current_user.username}")
    
    return {
        "success": True,
        "id": doc.id,
        "filename": doc.filename,
        "document_type": doc.document_type,
        "extracted_data": {
            "vendor": doc.vendor,
            "invoice_number": doc.invoice_number,
            "amount": doc.amount,
            "vat_amount": doc.vat_amount,
            "date": str(doc.date) if doc.date else None
        },
        "status": doc.status
    }

@app.get("/documents")
def get_documents(
    status: Optional[str] = None,
    vendor: Optional[str] = None,
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """Get documents with optional filters"""
    query = db.query(models.Document)
    
    if status:
        query = query.filter(models.Document.status == status)
    if vendor:
        query = query.filter(models.Document.vendor.ilike(f"%{vendor}%"))
    if start_date:
        try:
            query = query.filter(models.Document.date >= datetime.fromisoformat(start_date))
        except:
            pass
    if end_date:
        try:
            query = query.filter(models.Document.date <= datetime.fromisoformat(end_date))
        except:
            pass
    
    documents = query.order_by(models.Document.upload_date.desc()).all()
    
    # Format for response
    result = []
    for doc in documents:
        result.append({
            "id": doc.id,
            "filename": doc.filename,
            "document_type": doc.document_type,
            "status": doc.status,
            "vendor": doc.vendor,
            "invoice_number": doc.invoice_number,
            "amount": doc.amount,
            "vat_amount": doc.vat_amount,
            "date": str(doc.date) if doc.date else None,
            "upload_date": str(doc.upload_date),
            "uploaded_by": doc.uploaded_by,
            "is_duplicate": doc.is_duplicate
        })
    
    return result

@app.get("/pending-approvals")
def get_pending_approvals(
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get documents pending approval for current user's role"""
    if not current_user:
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    logger.info(f"🔍 Getting pending approvals for user: {current_user.username} (ID: {current_user.id}, Role: {current_user.role})")
    
    workflow = WorkflowService(db)
    pending = workflow.get_pending_documents(current_user.role)
    
    logger.info(f"✅ Found {len(pending)} pending documents for role {current_user.role}")
    return pending

@app.post("/documents/{document_id}/approve")
def approve_document(
    document_id: int,
    comments: str = None,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Approve a document at current stage"""
    if not current_user:
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    logger.info(f"✅ User {current_user.username} (ID: {current_user.id}, Role: {current_user.role}) approving document {document_id}")
    
    workflow = WorkflowService(db)
    document = workflow.approve_document(
        document_id, 
        current_user.id,
        comments
    )
    return {"message": "Document approved", "document": document}

@app.post("/documents/{document_id}/reject")
def reject_document(
    document_id: int,
    reason: str,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Reject a document"""
    if not current_user:
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    logger.info(f"❌ User {current_user.username} (ID: {current_user.id}, Role: {current_user.role}) rejecting document {document_id}")
    
    workflow = WorkflowService(db)
    document = workflow.reject_document(
        document_id, 
        current_user.id,
        reason
    )
    return {"message": "Document rejected", "document": document}

@app.get("/documents/{document_id}/workflow")
def get_workflow_status(
    document_id: int,
    db: Session = Depends(get_db)
):
    """Get workflow history for a document"""
    workflow = WorkflowService(db)
    status = workflow.get_workflow_status(document_id)
    return status

@app.get("/insights")
def get_insights(
    start_date: str = None,
    end_date: str = None,
    db: Session = Depends(get_db)
):
    """Get AI-powered insights on spending from approved documents"""
    try:
        insights_service = InsightsService(db)
        insights = insights_service.get_spending_insights(start_date, end_date)
        return insights
    except Exception as e:
        logger.error(f"Insights error: {e}")
        logger.error(traceback.format_exc())
        return JSONResponse(
            status_code=500,
            content={"error": f"Failed to generate insights: {str(e)}"}
        )

# 🆕 NEW ENDPOINT: Workflow insights
@app.get("/insights/workflow")
def get_workflow_insights(
    start_date: str = None,
    end_date: str = None,
    db: Session = Depends(get_db)
):
    """Get workflow efficiency insights"""
    try:
        insights_service = InsightsService(db)
        insights = insights_service.get_workflow_insights(start_date, end_date)
        return insights
    except Exception as e:
        logger.error(f"Workflow insights error: {e}")
        return JSONResponse(
            status_code=500,
            content={"error": f"Failed to generate workflow insights: {str(e)}"}
        )

# 🆕 NEW ENDPOINT: Vendor performance insights
@app.get("/insights/vendors")
def get_vendor_insights(
    vendor: str = None,
    db: Session = Depends(get_db)
):
    """Get detailed vendor performance insights"""
    try:
        insights_service = InsightsService(db)
        insights = insights_service.get_vendor_performance(vendor)
        return insights
    except Exception as e:
        logger.error(f"Vendor insights error: {e}")
        return JSONResponse(
            status_code=500,
            content={"error": f"Failed to generate vendor insights: {str(e)}"}
        )

@app.get("/export/excel")
def export_excel(
    vendor: str = None,
    status: str = None,
    start_date: str = None,
    end_date: str = None,
    doc_type: str = None,
    db: Session = Depends(get_db)
):
    """Export documents to Excel"""
    try:
        filters = {
            'vendor': vendor,
            'status': status,
            'start_date': start_date,
            'end_date': end_date,
            'doc_type': doc_type
        }
        
        export_service = ExportService(db)
        excel_data = export_service.export_to_excel(filters)
        
        return Response(
            content=excel_data,
            media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            headers={"Content-Disposition": f"attachment; filename=documents_{datetime.now().strftime('%Y%m%d')}.xlsx"}
        )
    except Exception as e:
        logger.error(f"Excel export error: {e}")
        return JSONResponse(
            status_code=500,
            content={"error": f"Excel export failed: {str(e)}"}
        )

@app.get("/export/pdf")
def export_pdf(
    vendor: str = None,
    status: str = None,
    start_date: str = None,
    end_date: str = None,
    doc_type: str = None,
    db: Session = Depends(get_db)
):
    """Export documents to PDF"""
    try:
        filters = {
            'vendor': vendor,
            'status': status,
            'start_date': start_date,
            'end_date': end_date,
            'doc_type': doc_type
        }
        
        export_service = ExportService(db)
        pdf_data = export_service.export_to_pdf(filters)
        
        # Check if it's a valid PDF
        if pdf_data and pdf_data.startswith(b'%PDF'):
            return Response(
                content=pdf_data,
                media_type="application/pdf",
                headers={"Content-Disposition": f"attachment; filename=documents_{datetime.now().strftime('%Y%m%d')}.pdf"}
            )
        else:
            # Return as text if not a valid PDF
            return Response(
                content=pdf_data,
                media_type="text/plain",
                headers={"Content-Disposition": f"attachment; filename=error_{datetime.now().strftime('%Y%m%d')}.txt"}
            )
    except Exception as e:
        logger.error(f"PDF export error: {e}")
        logger.error(traceback.format_exc())
        return JSONResponse(
            status_code=500,
            content={"error": f"PDF export failed: {str(e)}"}
        )

@app.get("/users/me")
async def get_current_user_info(
    current_user: models.User = Depends(get_current_user)
):
    """Get current user info"""
    if not current_user:
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    return {
        "id": current_user.id,
        "username": current_user.username,
        "email": current_user.email,
        "role": current_user.role,
        "is_active": current_user.is_active
    }

@app.get("/users/me/role")
async def get_current_user_role(
    current_user: models.User = Depends(get_current_user)
):
    """Get just the user role - useful for frontend"""
    if not current_user:
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    return {"role": current_user.role}

@app.get("/health")
async def health_check():
    return {"status": "healthy", "timestamp": datetime.now().isoformat()}

@app.get("/users")
def get_users(
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get all users (admin only)"""
    # Optional: Add admin check here
    # if current_user.role != "admin":
    #     raise HTTPException(status_code=403, detail="Admin access required")
    
    users = db.query(models.User).all()
    return [
        {
            "id": user.id,
            "username": user.username,
            "email": user.email,
            "role": user.role,
            "is_active": user.is_active
        }
        for user in users
    ]

# Optional: Add a debug endpoint to check document status distribution
@app.get("/debug/document-stats")
def get_document_stats(db: Session = Depends(get_db)):
    """Debug endpoint to see document status distribution"""
    from sqlalchemy import func
    
    total = db.query(func.count(models.Document.id)).scalar()
    approved = db.query(func.count(models.Document.id)).filter(models.Document.status == "approved").scalar()
    rejected = db.query(func.count(models.Document.id)).filter(models.Document.status == "rejected").scalar()
    pending = db.query(func.count(models.Document.id)).filter(models.Document.status == "pending_review").scalar()
    
    return {
        "total": total,
        "approved": approved,
        "rejected": rejected,
        "pending": pending,
        "insights_will_use": approved  # Only approved documents
    }