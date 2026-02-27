from database import SessionLocal
import models

db = SessionLocal()
users = db.query(models.User).all()

print("\n📋 USER LIST")
print("-" * 40)
for user in users:
    print(f"👤 {user.username:10} | Role: {user.role:10} | Created: {user.created_at}")
print("-" * 40)
print(f"Total: {len(users)} users")

db.close()