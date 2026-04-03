import os
import secrets
import smtplib
import ssl
from email.message import EmailMessage
from datetime import datetime, timedelta
from flask import Blueprint, request, jsonify, render_template
from flask_jwt_extended import create_access_token, jwt_required, get_jwt_identity
from werkzeug.security import check_password_hash, generate_password_hash
from .models import db, User, Admin, AdminResetToken
from .qr_utils import generate_qr_code

admin_bp = Blueprint('admin', __name__, url_prefix='/api/admin')


# ─── ADMIN LOGIN ─────────────────────────────────────────────────────
@admin_bp.route('/login', methods=['POST'])
def admin_login():
    # Collect data from JSON or Form
    if request.is_json:
        data = request.get_json() or {}
    else:
        data = request.form

    email = data.get('email', '').strip()
    password = data.get('password', '').strip()

    if not email or not password:
        return jsonify({'error': 'Email and password are required'}), 400

    admin = Admin.query.filter_by(email=email).first()
    if not admin or not check_password_hash(admin.password_hash, password):
        return jsonify({'error': 'Invalid admin credentials'}), 401

    token = create_access_token(identity=str(admin.id), additional_claims={'role': 'admin'})
    return jsonify({
        'message': 'Admin login successful',
        'token': token
    }), 200


# ─── VIEW ALL USERS ──────────────────────────────────────────────────
@admin_bp.route('/users', methods=['GET'])
@jwt_required()
def get_all_users():
    """List all registered users. Optional query param: ?status=pending|approved|rejected"""
    status_filter = request.args.get('status')
    query = User.query

    if status_filter and status_filter in ('pending', 'approved', 'rejected'):
        query = query.filter_by(status=status_filter)

    users = query.order_by(User.created_at.desc()).all()
    return jsonify({
        'total': len(users),
        'users': [u.to_dict() for u in users]
    }), 200


# ─── VIEW SINGLE USER ────────────────────────────────────────────────
@admin_bp.route('/users/<int:user_id>', methods=['GET'])
@jwt_required()
def get_user(user_id):
    user = User.query.get(user_id)
    if not user:
        return jsonify({'error': 'User not found'}), 404
    return jsonify({'user': user.to_dict()}), 200


# ─── APPROVE USER ────────────────────────────────────────────────────
@admin_bp.route('/users/<int:user_id>/approve', methods=['PUT'])
@jwt_required()
def approve_user(user_id):
    user = User.query.get(user_id)
    if not user:
        return jsonify({'error': 'User not found'}), 404

    if user.status == 'approved':
        return jsonify({'message': 'User is already approved', 'user': user.to_dict()}), 200

    # Generate QR code
    host_url = request.host_url.rstrip('/')
    qr_token, qr_path = generate_qr_code(user.id, host_url)

    user.status = 'approved'
    user.qr_token = qr_token
    user.qr_code_path = qr_path
    db.session.commit()

    return jsonify({
        'message': 'User approved and QR code generated',
        'user': user.to_dict(),
        'qr_code_path': qr_path,
        'scan_url': f"{host_url}/api/admin/scan/{qr_token}"
    }), 200


# ─── REJECT USER ─────────────────────────────────────────────────────
@admin_bp.route('/users/<int:user_id>/reject', methods=['PUT'])
@jwt_required()
def reject_user(user_id):
    user = User.query.get(user_id)
    if not user:
        return jsonify({'error': 'User not found'}), 404

    user.status = 'rejected'
    user.qr_token = None
    user.qr_code_path = None
    db.session.commit()

    return jsonify({
        'message': 'User rejected. QR code NOT generated.',
        'user': user.to_dict()
    }), 200


# ─── SCAN QR CODE ────────────────────────────────────────────────────
@admin_bp.route('/scan/<string:qr_token>', methods=['GET'])
def scan_qr(qr_token):
    """
    Public endpoint — called when someone scans the QR code.
    Returns the user details associated with the QR token.
    """
    user = User.query.filter_by(qr_token=qr_token).first()
    if not user:
        return jsonify({'error': 'Invalid or expired QR code'}), 404

    if user.status != 'approved':
        return jsonify({'error': 'User is not approved. QR code is invalid.'}), 403

    # Switch from JSON to a beautiful Scan Result Page
    return render_template('scan_result.html', user=user)


# ─── ADMIN FORGOT PASSWORD ─────────────────────────────────────────────────────
@admin_bp.route('/forgot-password', methods=['POST'])
def admin_forgot_password():
    data = request.get_json() or {}
    email = data.get('email', '').strip()

    if not email:
        return jsonify({'error': 'Email is required'}), 400

    admin = Admin.query.filter_by(email=email).first()
    generic_message = 'If an account exists for this email, a reset code has been sent.'
    if not admin:
        return jsonify({'message': generic_message}), 200

    AdminResetToken.query.filter_by(admin_id=admin.id, used=False).update({'used': True})

    reset_token = f"{secrets.randbelow(1_000_000):06d}"
    token_hash = generate_password_hash(reset_token)
    expires_at = datetime.utcnow() + timedelta(minutes=30)

    entry = AdminResetToken(
        admin_id=admin.id,
        token_hash=token_hash,
        expires_at=expires_at,
        used=False,
    )
    db.session.add(entry)
    db.session.commit()

    sent = _send_admin_reset_email(email, reset_token)
    response = {'message': generic_message, 'expires_at': expires_at.isoformat() + 'Z'}
    if os.getenv('DEBUG_RESET_TOKEN') == '1' and not sent:
        response['reset_token'] = reset_token
    return jsonify(response), 200


# ─── ADMIN RESET PASSWORD ──────────────────────────────────────────────────────
@admin_bp.route('/reset-password', methods=['POST'])
def admin_reset_password():
    data = request.get_json() or {}
    email = data.get('email', '').strip()
    token = data.get('token', '').strip()
    new_password = data.get('new_password', '').strip()

    if not email or not token or not new_password:
        return jsonify({'error': 'Email, token, and new password are required'}), 400
    if len(new_password) < 6:
        return jsonify({'error': 'Password must be at least 6 characters long'}), 400

    admin = Admin.query.filter_by(email=email).first()
    if not admin:
        return jsonify({'error': 'Invalid email or token'}), 400

    now = datetime.utcnow()
    reset_entry = AdminResetToken.query.filter(
        AdminResetToken.admin_id == admin.id,
        AdminResetToken.used == False,
        AdminResetToken.expires_at >= now
    ).order_by(AdminResetToken.created_at.desc()).first()

    if not reset_entry or not check_password_hash(reset_entry.token_hash, token):
        return jsonify({'error': 'Invalid or expired reset token'}), 400

    admin.password_hash = generate_password_hash(new_password)
    reset_entry.used = True
    db.session.commit()

    return jsonify({'message': 'Password reset successful'}), 200


def _send_admin_reset_email(email, code):
    smtp_host = os.getenv('SMTP_HOST')
    smtp_port = int(os.getenv('SMTP_PORT', '587'))
    smtp_user = os.getenv('SMTP_USER')
    smtp_pass = os.getenv('SMTP_PASS')
    from_addr = os.getenv('SMTP_FROM', smtp_user or 'no-reply@resqr.local')

    if not smtp_host or not smtp_user or not smtp_pass:
        print(f"[AdminReset] Email not configured. Code for {email}: {code}")
        return False

    msg = EmailMessage()
    msg['Subject'] = 'Your ResQr admin password reset code'
    msg['From'] = from_addr
    msg['To'] = email
    msg.set_content(
        f"Here is your admin password reset code: {code}\n"
        "It expires in 30 minutes. If you did not request this, you can ignore this email."
    )

    context = ssl.create_default_context()
    with smtplib.SMTP(smtp_host, smtp_port) as server:
        server.starttls(context=context)
        server.login(smtp_user, smtp_pass)
        server.send_message(msg)
    return True
