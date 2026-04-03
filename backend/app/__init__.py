import os
from dotenv import load_dotenv
from flask import Flask, render_template, send_from_directory, send_file
from flask_cors import CORS
from flask_jwt_extended import JWTManager
from werkzeug.security import generate_password_hash

from .config import Config
from .models import db, Admin


# Resolve paths relative to this package so templates load in any environment
PACKAGE_DIR = os.path.abspath(os.path.dirname(__file__))
FRONTEND_DIR = os.path.abspath(os.path.join(PACKAGE_DIR, '..', 'frontend - Copy'))
BASE_DIR = os.path.abspath(os.path.join(PACKAGE_DIR, '..'))
load_dotenv(os.path.join(BASE_DIR, '.env'))


def create_app():
    app = Flask(
        __name__,
        static_folder=FRONTEND_DIR,
        static_url_path='',
        template_folder=FRONTEND_DIR
    )
    app.config.from_object(Config)

    # ── Initialize extensions ──
    db.init_app(app)
    CORS(app)
    JWTManager(app)

    # ── Create upload directories ──
    os.makedirs(os.path.join(app.config['UPLOAD_FOLDER'], 'documents'), exist_ok=True)
    os.makedirs(os.path.join(app.config['UPLOAD_FOLDER'], 'qrcodes'), exist_ok=True)

    # ── Register blueprints ──
    from .user_routes import user_bp
    from .admin_routes import admin_bp
    app.register_blueprint(user_bp)
    app.register_blueprint(admin_bp)

    # ── Create tables & seed default admin ──
    with app.app_context():
        db.create_all()

        # Seed required admin accounts (idempotent so it won't overwrite existing)
        default_admins = [
            ('admin@resqr.com', 'admin123'),
            ('admin1@resqr.com', 'admin123'),
        ]
        created_any = False
        for email, password in default_admins:
            if not Admin.query.filter_by(email=email).first():
                db.session.add(Admin(email=email, password_hash=generate_password_hash(password)))
                created_any = True
                print(f'[ok] Admin created: {email} / {password}')
        if created_any:
            db.session.commit()

    # ── Serve Frontend HTML Pages ──
    @app.route('/')
    def index():
        return send_from_directory(FRONTEND_DIR, 'index.html')
    
    @app.route('/login')
    def login():
        return send_from_directory(FRONTEND_DIR, 'login.html')
    
    @app.route('/register')
    def register():
        return send_from_directory(FRONTEND_DIR, 'register.html')
    
    @app.route('/dashboard')
    def dashboard():
        return send_from_directory(FRONTEND_DIR, 'dashboard.html')
    
    @app.route('/profile')
    def profile():
        return send_from_directory(FRONTEND_DIR, 'profile.html')
    
    # ── Catch-all for SPA routing ──
    @app.route('/<path:path>')
    def catch_all(path):
        if path and os.path.exists(os.path.join(FRONTEND_DIR, f'{path}.html')):
            return send_from_directory(FRONTEND_DIR, f'{path}.html')
        return send_from_directory(FRONTEND_DIR, 'index.html')

    # ── Health check route ──
    @app.route('/api/health')
    def health():
        return {'status': 'ok', 'app': 'ResQr API', 'version': '1.0.0'}

    @app.route('/uploads/qrcodes/<filename>')
    def serve_qr(filename):
        return send_from_directory(os.path.join(app.config['UPLOAD_FOLDER'], 'qrcodes'), filename)

    @app.route('/uploads/documents/<filename>')
    def serve_doc(filename):
        return send_from_directory(os.path.join(app.config['UPLOAD_FOLDER'], 'documents'), filename)

    return app

