from sqlalchemy.orm import Session
from sqlalchemy import or_, and_
import models
from datetime import datetime, timedelta

class DuplicateChecker:
    def __init__(self, db: Session):
        self.db = db
    
    def check_document(self, vendor: str, invoice_number: str, amount: float, date: datetime = None) -> dict:
        """
        Check if document is duplicate
        Returns: (is_duplicate, reason, original_document_id)
        """
        
        # PRIMARY CHECK: Exact invoice number match
        if invoice_number and invoice_number != "Unknown" and invoice_number != "N/A":
            exact_match = self.db.query(models.Document).filter(
                models.Document.invoice_number == invoice_number,
                models.Document.status.in_(['approved', 'pending_review', 'pending_manager', 'pending_finance'])
            ).first()
            
            if exact_match:
                return {
                    "is_duplicate": True,
                    "reason": f"Invoice number '{invoice_number}' already exists",
                    "original_id": exact_match.id
                }
        
        # SECONDARY CHECK: Vendor + Amount (within 30 days)
        if vendor and vendor != "Unknown" and amount > 0:
            thirty_days_ago = datetime.now() - timedelta(days=30)
            
            similar_match = self.db.query(models.Document).filter(
                models.Document.vendor == vendor,
                models.Document.amount == amount,
                models.Document.upload_date >= thirty_days_ago,
                models.Document.status.in_(['approved', 'pending_review', 'pending_manager', 'pending_finance'])
            ).first()
            
            if similar_match:
                return {
                    "is_duplicate": True,
                    "reason": f"Similar document from {vendor} for ${amount} found within 30 days",
                    "original_id": similar_match.id
                }
        
        # No duplicates found
        return {
            "is_duplicate": False,
            "reason": None,
            "original_id": None
        }
    
    def get_duplicate_stats(self) -> dict:
        """Get statistics about duplicates"""
        total_duplicates = self.db.query(models.Document).filter(
            models.Document.is_duplicate == True
        ).count()
        
        return {
            "total_duplicates": total_duplicates,
            "duplicate_rate": total_duplicates / max(self.db.query(models.Document).count(), 1) * 100
        }