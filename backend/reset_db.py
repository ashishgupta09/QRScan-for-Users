from app import create_app
from app.models import db, Admin
from werkzeug.security import generate_password_hash

app = create_app()

with app.app_context():
    print("[reset] Dropping all tables...")
    db.drop_all()

    print("[reset] Recreating all tables from scratch...")
    db.create_all()

    print("[reset] Seeding default admins...")
    default_admins = [
        ("admin@resqr.com", "admin123"),
        ("admin1@resqr.com", "admin123"),
    ]
    for email, password in default_admins:
        db.session.add(Admin(email=email, password_hash=generate_password_hash(password)))
        print(f"   - {email} / {password}")

    db.session.commit()
    print("[reset] Database has been completely reset!")
    print("[reset] Admins created: admin@resqr.com, admin1@resqr.com (password: admin123)")
