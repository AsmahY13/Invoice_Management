from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, Enum, Boolean, Text
from sqlalchemy.orm import relationship
from database import Base
import enum
from datetime import datetime

class UserRole(str, enum.Enum):
    ADMIN = "admin"
    APPROVER = "approver"      # Stage 3
    MANAGER = "manager"         # Stage 2
    REVIEWER = "reviewer"       # Stage 1
    VIEWER = "viewer"

class DocumentStatus(str, enum.Enum):
    PENDING_REVIEW = "pending_review"        # Stage 1
    PENDING_MANAGER = "pending_manager"      # Stage 2
    PENDING_FINANCE = "pending_finance"      # Stage 3
    APPROVED = "approved"
    REJECTED = "rejected"

class User(Base):
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True)
    email = Column(String, unique=True, index=True)
    hashed_password = Column(String)
    role = Column(String)  # Will store UserRole values
    is_active = Column(Integer, default=1)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    uploaded_documents = relationship("Document", foreign_keys="Document.uploaded_by", back_populates="uploader")
    approved_documents = relationship("ApprovalRecord", back_populates="approver")

class Document(Base):
    __tablename__ = "documents"
    
    id = Column(Integer, primary_key=True, index=True)
    filename = Column(String)
    file_path = Column(String)
    document_type = Column(String)  # invoice or credit_note
    status = Column(String, default="pending_review")
    upload_date = Column(DateTime, default=datetime.utcnow)
    
    # Extracted data
    vendor = Column(String)
    invoice_number = Column(String)
    amount = Column(Float, default=0)
    vat_amount = Column(Float, default=0)
    date = Column(DateTime, nullable=True)
    
    # Duplicate tracking
    is_duplicate = Column(Boolean, default=False)
    duplicate_reason = Column(String, nullable=True)
    original_document_id = Column(Integer, ForeignKey('documents.id'), nullable=True)
    
    # Workflow tracking
    uploaded_by = Column(Integer, ForeignKey("users.id"))
    current_approver_role = Column(String, nullable=True)  # Which role should approve next
    rejection_reason = Column(String, nullable=True)
    approved_at = Column(DateTime, nullable=True)
    
    # Relationships
    uploader = relationship("User", foreign_keys=[uploaded_by], back_populates="uploaded_documents")
    approvals = relationship("ApprovalRecord", back_populates="document", cascade="all, delete-orphan")
    original_document = relationship("Document", remote_side=[id])

class ApprovalRecord(Base):
    __tablename__ = "approval_records"
    
    id = Column(Integer, primary_key=True, index=True)
    document_id = Column(Integer, ForeignKey("documents.id"))
    approver_id = Column(Integer, ForeignKey("users.id"))
    stage = Column(Integer)  # 1, 2, or 3
    action = Column(String)  # approve or reject
    comments = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    document = relationship("Document", back_populates="approvals")
    approver = relationship("User", back_populates="approved_documents")

class AuditLog(Base):
    __tablename__ = "audit_logs"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    action = Column(String)
    details = Column(Text)
    ip_address = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)