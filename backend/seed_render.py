from database import SessionLocal
import models
import auth

db = SessionLocal()

# This will create all tables if they don't exist
models.Base.metadata.create_all(bind=db.bind)

# Create the test users
users = [
    models.User(
        username="admin",
        email="admin@example.com",
        hashed_password=auth.get_password_hash("admin123"),
        role="admin",
        is_active=1
    ),
    models.User(
        username="reviewer1",
        email="reviewer@example.com",
        hashed_password=auth.get_password_hash("reviewer123"),
        role="reviewer",
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
        username="manager1",
        email="manager@example.com",
        hashed_password=auth.get_password_hash("manager123"),
        role="manager",
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
    db.add(user)
    print(f"✅ Added user: {user.username}")

db.commit()
db.close()

print("\n Users created successfully!")
print("You can now login with:")
print("  admin / admin123")
print("  reviewer1 / reviewer123")
print("  finance1 / finance123")
print("  manager1 / manager123")
print("  viewer1 / viewer123")