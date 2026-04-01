import os
from flask import Flask
from flask_cors import CORS
from flask_jwt_extended import JWTManager
from werkzeug.security import generate_password_hash

from .config import Config
from .models import db, Admin


def create_app():
    app = Flask(__name__)
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

    # ── Health check route ──
    @app.route('/')
    def health():
        return {'status': 'ok', 'app': 'ResQr API', 'version': '1.0.0'}

    @app.route('/uploads/qrcodes/<filename>')
    def serve_qr(filename):
        from flask import send_from_directory
        return send_from_directory(os.path.join(app.config['UPLOAD_FOLDER'], 'qrcodes'), filename)

    @app.route('/uploads/documents/<filename>')
    def serve_doc(filename):
        from flask import send_from_directory
        return send_from_directory(os.path.join(app.config['UPLOAD_FOLDER'], 'documents'), filename)

    return app