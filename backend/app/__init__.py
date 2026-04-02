import os
from flask import Flask, render_template, send_from_directory
from flask_cors import CORS
from flask_jwt_extended import JWTManager
from werkzeug.security import generate_password_hash

from .config import Config
from .models import db, Admin


# Resolve paths relative to this package so templates load in any environment
PACKAGE_DIR = os.path.abspath(os.path.dirname(__file__))


def create_app():
    app = Flask(
        __name__,
        static_folder='../static',      # keep existing static setup
        static_url_path='/static',
        template_folder=os.path.join(PACKAGE_DIR, 'templates')  # point to app/templates
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

        # Seed default admin if none exists
        if not Admin.query.first():
            default_admin = Admin(
                email='admin@resqr.com',
                password_hash=generate_password_hash('admin123')
            )
            db.session.add(default_admin)
            db.session.commit()
            print('✅ Default admin created: admin@resqr.com / admin123')

    # ── Serve Frontend HTML Pages ──
    @app.route('/')
    def index():
        return render_template('index.html')
    
    @app.route('/login')
    def login():
        return render_template('login.html')
    
    @app.route('/register')
    def register():
        return render_template('register.html')
    
    @app.route('/dashboard')
    def dashboard():
        return render_template('dashboard.html')
    
    @app.route('/profile')
    def profile():
        return render_template('profile.html')
    
    # ── Catch-all for SPA routing ──
    @app.route('/<path:path>')
    def catch_all(path):
        if path and os.path.exists(os.path.join(app.template_folder, f'{path}.html')):
            return render_template(f'{path}.html')
        return render_template('index.html')

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
