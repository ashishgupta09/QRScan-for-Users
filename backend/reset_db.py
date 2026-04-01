from app import create_app
from app.models import db, Admin
from werkzeug.security import generate_password_hash

app = create_app()

with app.app_context():
    print("🗑️  Dropping all tables...")
    db.drop_all()
    
    print("🏗️  Recreating all tables from scratch...")
    db.create_all()
    
    print("🌱 Seeding default admin...")
    default_admin = Admin(
        email='admin@resqr.com',
        password_hash=generate_password_hash('admin123')
    )
    db.session.add(default_admin)
    db.session.commit()
    
    print("✅ Database has been completely reset!")
    print("Admin: admin@resqr.com / admin123")
