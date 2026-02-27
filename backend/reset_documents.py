from database import SessionLocal
import models

db = SessionLocal()

print("\n" + "="*60)
print("🗑️  DOCUMENT RESET TOOL")
print("="*60)

# Count before deletion
doc_count = db.query(models.Document).count()
approval_count = db.query(models.ApprovalRecord).count()

print(f"\n📊 Current counts:")
print(f"   - Documents: {doc_count}")
print(f"   - Approval Records: {approval_count}")

# Ask for confirmation
confirm = input("\n⚠️  This will DELETE ALL documents and approval records! Type 'yes' to continue: ")

if confirm.lower() == 'yes':
    # Delete approval records first (due to foreign key constraints)
    print("\n🗑️  Deleting approval records...")
    deleted_approvals = db.query(models.ApprovalRecord).delete()
    
    # Delete all documents
    print("🗑️  Deleting documents...")
    deleted_docs = db.query(models.Document).delete()
    
    # Commit the changes
    db.commit()
    
    print(f"\n✅ Deleted {deleted_approvals} approval records")
    print(f"✅ Deleted {deleted_docs} documents")
    print("\n🎉 Database is now clean!")
else:
    print("\n❌ Operation cancelled")

db.close()

print("\n" + "="*60)
print("You can now upload new invoices!")
print("="*60)