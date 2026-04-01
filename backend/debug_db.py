from app import create_app
from app.models import db, User, Admin

app = create_app()
with app.app_context():
    print("--- USERS ---")
    users = User.query.all()
    for u in users:
        print(f"ID: {u.id} | Email: {u.email} | Name: {u.name}")
    
    print("\n--- ADMINS ---")
    admins = Admin.query.all()
    for a in admins:
        print(f"ID: {a.id} | Email: {a.email}")
