from app import create_app
from app.models import db, User
from app.qr_utils import generate_qr_code

app = create_app()

def repair_missing_tokens():
    with app.app_context():
        # Find all approved users who have NO qr_token
        users = User.query.filter_by(status='approved').filter(User.qr_token == None).all()
        
        if not users:
            print("✅ All approved users already have tokens. No repair needed.")
            return

        print(f"🛠 Found {len(users)} users missing QR tokens. Repairing...")
        
        # Use a dummy host_url since it's just stored for consistency in some routes, 
        # but the token itself is what matters.
        host_url = "https://qrscan-for-users.onrender.com" 

        for user in users:
            try:
                qr_token, qr_path = generate_qr_code(user.id, host_url)
                user.qr_token = qr_token
                user.qr_code_path = qr_path
                print(f"  - Repaired: {user.name} ({user.email})")
            except Exception as e:
                print(f"  - ❌ Failed to repair {user.name}: {str(e)}")
        
        db.session.commit()
        print("✅ Repair complete.")

if __name__ == "__main__":
    repair_missing_tokens()
