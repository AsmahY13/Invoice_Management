from database import SessionLocal
import models
import auth

db = SessionLocal()

# Create users with different roles
users = [
    models.User(
        username="reviewer1",
        email="reviewer@example.com",
        hashed_password=auth.get_password_hash("reviewer123"),
        role="reviewer",
        is_active=1
    ),
    models.User(
        username="manager1",
        email="manager@example.com",
        hashed_password=auth.get_password_hash("manager123"),
        role="manager",
        is_active=1
    ),
    models.User(
        username="finance1",
        email="finance@example.com",
        hashed_password=auth.get_password_hash("finance123"),
        role="finance",
        is_active=1
    ),
    models.User(
        username="viewer1",
        email="viewer@example.com",
        hashed_password=auth.get_password_hash("viewer123"),
        role="viewer",
        is_active=1
    )
]

for user in users:
    # Check if user already exists
    existing = db.query(models.User).filter(models.User.username == user.username).first()
    if not existing:
        db.add(user)
        print(f"✅ Created user: {user.username}")

db.commit()
db.close()

print("\n" + "="*50)
print("USERS CREATED SUCCESSFULLY!")
print("="*50)
print("reviewer1 / reviewer123 - Can do stage 1 approvals")
print("manager1 / manager123   - Can do stage 2 approvals")
print("finance1 / finance123   - Can do final approval")
print("viewer1 / viewer123     - Can only view reports")
print("admin / admin123        - Super admin")
print("="*50)