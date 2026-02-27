from sqlalchemy.orm import Session
import models
from datetime import datetime
from fastapi import HTTPException

class WorkflowService:
    def __init__(self, db: Session):
        self.db = db
        self.workflow_stages = {
            "pending_review": {"role": "reviewer", "next": "pending_manager", "stage": 1},
            "pending_manager": {"role": "manager", "next": "pending_finance", "stage": 2},
            "pending_finance": {"role": "finance", "next": "approved", "stage": 3}  # Changed from "admin" to "finance"
        }
    
    def get_pending_documents(self, user_role: str) -> list:
        """Get documents pending approval for a specific role"""
        status_map = {
            "reviewer": ["pending_review"],
            "manager": ["pending_manager"],
            "finance": ["pending_finance"],  # Added finance role
            "admin": ["pending_finance"],     # Keep admin for backward compatibility
            "approver": ["pending_finance"]
        }
        
        pending_statuses = status_map.get(user_role.lower(), [])
        if not pending_statuses:
            return []
        
        return self.db.query(models.Document).filter(
            models.Document.status.in_(pending_statuses)
        ).all()
    
    # Rest of the methods remain exactly the same...
    def approve_document(self, document_id: int, user_id: int, comments: str = None) -> models.Document:
        """Process an approval"""
        document = self.db.query(models.Document).filter(models.Document.id == document_id).first()
        if not document:
            raise HTTPException(status_code=404, detail="Document not found")
        
        user = self.db.query(models.User).filter(models.User.id == user_id).first()
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        
        # Check if user has correct role for current stage
        current_stage_info = self.workflow_stages.get(document.status)
        if not current_stage_info:
            raise HTTPException(status_code=400, detail="Document not in approval workflow")
        
        if user.role != current_stage_info["role"]:
            raise HTTPException(status_code=403, detail=f"Only {current_stage_info['role']}s can approve at this stage")
        
        # Create approval record
        approval = models.ApprovalRecord(
            document_id=document_id,
            approver_id=user_id,
            stage=current_stage_info["stage"],
            action="approve",
            comments=comments
        )
        self.db.add(approval)
        
        # Update document status
        next_status = current_stage_info["next"]
        document.status = next_status
        document.current_approver_role = self.workflow_stages.get(next_status, {}).get("role")
        
        if next_status == "approved":
            document.approved_at = datetime.utcnow()
        
        self.db.commit()
        self.db.refresh(document)
        
        return document
    
    def reject_document(self, document_id: int, user_id: int, reason: str) -> models.Document:
        """Process a rejection"""
        document = self.db.query(models.Document).filter(models.Document.id == document_id).first()
        if not document:
            raise HTTPException(status_code=404, detail="Document not found")
        
        user = self.db.query(models.User).filter(models.User.id == user_id).first()
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        
        # Check if user has correct role for current stage
        current_stage_info = self.workflow_stages.get(document.status)
        if not current_stage_info:
            raise HTTPException(status_code=400, detail="Document not in approval workflow")
        
        if user.role != current_stage_info["role"]:
            raise HTTPException(status_code=403, detail=f"Only {current_stage_info['role']}s can reject at this stage")
        
        # Create rejection record
        approval = models.ApprovalRecord(
            document_id=document_id,
            approver_id=user_id,
            stage=current_stage_info["stage"],
            action="reject",
            comments=reason
        )
        self.db.add(approval)
        
        # Update document
        document.status = "rejected"
        document.rejection_reason = reason
        
        self.db.commit()
        self.db.refresh(document)
        
        return document
    
    def get_workflow_status(self, document_id: int) -> dict:
        """Get detailed workflow status for a document"""
        document = self.db.query(models.Document).filter(models.Document.id == document_id).first()
        if not document:
            return None
        
        approvals = self.db.query(models.ApprovalRecord).filter(
            models.ApprovalRecord.document_id == document_id
        ).order_by(models.ApprovalRecord.stage).all()
        
        return {
            "document_id": document.id,
            "current_status": document.status,
            "approval_history": [
                {
                    "stage": a.stage,
                    "action": a.action,
                    "approver": a.approver.username if a.approver else None,
                    "comments": a.comments,
                    "date": a.created_at
                }
                for a in approvals
            ],
            "next_approver_role": self.workflow_stages.get(document.status, {}).get("role")
        }