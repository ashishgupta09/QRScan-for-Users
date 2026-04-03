import os
import re
import secrets
import smtplib
import ssl
from email.message import EmailMessage
from datetime import datetime, timedelta
from flask import Blueprint, request, jsonify, current_app
from flask_jwt_extended import create_access_token, jwt_required, get_jwt_identity
from werkzeug.security import generate_password_hash, check_password_hash
from werkzeug.utils import secure_filename
from .models import db, User, PasswordResetToken, RegistrationOTP

user_bp = Blueprint('user', __name__, url_prefix='/api/user')

VALID_BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']
ALLOWED_EXTENSIONS = {'pdf', 'png', 'jpg', 'jpeg', 'doc', 'docx'}


def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS


# --- USER REGISTRATION -------------------------------------------
@user_bp.route('/register', methods=['POST'])
def register():
    """
    Register a new user with form-data (multipart).
    Required: email, password, name, address, phone, dob, blood_group, has_disease
    Optional: alternate_phone. No file upload required even if disease=yes.
    """
    if request.is_json:
        data = request.get_json() or {}
    else:
        data = request.form

    email = data.get('email', '').strip()
    password = data.get('password', '').strip()
    name = data.get('name', '').strip()
    address = data.get('address', '').strip()
    phone = data.get('phone', '').strip()
    alternate_phone = data.get('alternate_phone', '').strip()
    dob_str = data.get('dob', '').strip()
    blood_group = data.get('blood_group', '').strip()
    has_disease_str = str(data.get('has_disease', '')).strip().lower()

    required_fields = {
        'email': email,
        'password': password,
        'name': name,
        'address': address,
        'phone': phone,
        'dob': dob_str,
        'blood_group': blood_group,
    }
    for field, value in required_fields.items():
        if not value:
            return jsonify({'error': f'Missing or invalid field: {field}'}), 400

    if not re.match(r'^\d{10}$', phone):
        return jsonify({'error': 'Phone number must be exactly 10 digits'}), 400
    if alternate_phone and not re.match(r'^\d{10}$', alternate_phone):
        return jsonify({'error': 'Alternate phone number must be exactly 10 digits'}), 400

    if blood_group not in VALID_BLOOD_GROUPS:
        return jsonify({'error': f'Invalid blood group. Must be one of: {", ".join(VALID_BLOOD_GROUPS)}'}), 400

    try:
        dob = datetime.strptime(dob_str, '%Y-%m-%d').date()
    except ValueError:
        return jsonify({'error': 'DOB must be in YYYY-MM-DD format'}), 400

    truthy_values = {'yes', 'true', '1', 'on'}
    falsy_values = {'no', 'false', '0', 'off'}
    has_disease = has_disease_str in truthy_values
    disease_doc_path = None  # file not required

    if User.query.filter_by(email=email).first():
        return jsonify({'error': 'Email already registered'}), 409

    user = User(
        email=email,
        password_hash=generate_password_hash(password),
        name=name,
        address=address,
        phone=phone,
        alternate_phone=alternate_phone or None,
        dob=dob,
        blood_group=blood_group,
        has_disease=has_disease,
        disease_document=disease_doc_path,
        status='pending',
    )
    db.session.add(user)
    db.session.commit()

    # Issue email verification OTP (15 min)
    RegistrationOTP.query.filter_by(email=email, used=False).update({'used': True})
    otp_code = f"{secrets.randbelow(1_000_000):06d}"
    otp_hash = generate_password_hash(otp_code)
    expires_at = datetime.utcnow() + timedelta(minutes=15)
    db.session.add(RegistrationOTP(
        email=email,
        token_hash=otp_hash,
        expires_at=expires_at,
        used=False
    ))
    db.session.commit()

    host_url = request.host_url.rstrip('/')
    verify_link = f"{host_url}/verify.html?email={email}"
    _send_verification_email(email, otp_code, verify_link)

    return jsonify({
        'message': 'Form submitted successfully. Please verify your email.',
        'user': user.to_dict(),
        'verify_expires_at': expires_at.isoformat() + 'Z'
    }), 201


# --- USER LOGIN -------------------------------------------
@user_bp.route('/login', methods=['POST'])
def login():
    if request.is_json:
        data = request.get_json() or {}
    else:
        data = request.form

    email = data.get('email', '').strip()
    password = data.get('password', '').strip()

    if not email or not password:
        return jsonify({'error': 'Email and password are required'}), 400

    user = User.query.filter_by(email=email).first()
    if not user or not check_password_hash(user.password_hash, password):
        return jsonify({'error': 'Invalid email or password'}), 401

    token = create_access_token(identity=str(user.id), additional_claims={'role': 'user'})
    return jsonify({'message': 'Login successful', 'token': token, 'user': user.to_dict()}), 200


# --- GET OWN PROFILE -------------------------------------------
@user_bp.route('/profile', methods=['GET'])
@jwt_required()
def profile():
    user_id = int(get_jwt_identity())
    user = User.query.get(user_id)
    if not user:
        return jsonify({'error': 'User not found'}), 404
    return jsonify({'user': user.to_dict()}), 200


# --- FORGOT PASSWORD ---
@user_bp.route('/forgot-password', methods=['POST'])
def forgot_password():
    data = request.get_json() or {}
    email = data.get('email', '').strip()

    if not email:
        return jsonify({'error': 'Email is required'}), 400

    user = User.query.filter_by(email=email).first()
    generic_message = 'If an account exists for this email, a reset code has been sent.'
    if not user:
        return jsonify({'message': generic_message}), 200

    PasswordResetToken.query.filter_by(user_id=user.id, used=False).update({'used': True})

    reset_token = f"{secrets.randbelow(1_000_000):06d}"
    token_hash = generate_password_hash(reset_token)
    expires_at = datetime.utcnow() + timedelta(minutes=30)

    reset_entry = PasswordResetToken(
        user_id=user.id,
        token_hash=token_hash,
        expires_at=expires_at,
        used=False,
    )
    db.session.add(reset_entry)
    db.session.commit()

    sent = _send_reset_email(email, reset_token)
    response = {'message': generic_message, 'expires_at': expires_at.isoformat() + 'Z'}
    if os.getenv('DEBUG_RESET_TOKEN') == '1' and not sent:
        response['reset_token'] = reset_token
    return jsonify(response), 200


# --- RESET PASSWORD ---
@user_bp.route('/reset-password', methods=['POST'])
def reset_password():
    data = request.get_json() or {}
    email = data.get('email', '').strip()
    token = data.get('token', '').strip()
    new_password = data.get('new_password', '').strip()

    if not email or not token or not new_password:
        return jsonify({'error': 'Email, token, and new password are required'}), 400
    if len(new_password) < 6:
        return jsonify({'error': 'Password must be at least 6 characters long'}), 400

    user = User.query.filter_by(email=email).first()
    if not user:
        return jsonify({'error': 'Invalid email or token'}), 400

    now = datetime.utcnow()
    reset_entry = PasswordResetToken.query.filter(
        PasswordResetToken.user_id == user.id,
        PasswordResetToken.used == False,
        PasswordResetToken.expires_at >= now
    ).order_by(PasswordResetToken.created_at.desc()).first()

    if not reset_entry or not check_password_hash(reset_entry.token_hash, token):
        return jsonify({'error': 'Invalid or expired reset token'}), 400

    user.password_hash = generate_password_hash(new_password)
    reset_entry.used = True
    db.session.commit()

    return jsonify({'message': 'Password reset successful'}), 200


# --- VERIFY RESET TOKEN (UI step) ---
@user_bp.route('/verify-reset', methods=['POST'])
def verify_reset():
    data = request.get_json() or {}
    email = data.get('email', '').strip()
    token = data.get('token', '').strip()

    if not email or not token:
        return jsonify({'error': 'Email and token are required'}), 400

    user = User.query.filter_by(email=email).first()
    if not user:
        return jsonify({'error': 'Invalid email or token'}), 400

    now = datetime.utcnow()
    reset_entry = PasswordResetToken.query.filter(
        PasswordResetToken.user_id == user.id,
        PasswordResetToken.used == False,
        PasswordResetToken.expires_at >= now
    ).order_by(PasswordResetToken.created_at.desc()).first()

    if not reset_entry or not check_password_hash(reset_entry.token_hash, token):
        return jsonify({'error': 'Invalid or expired reset token'}), 400

    return jsonify({'message': 'Token verified', 'email': email}), 200


# --- VERIFY REGISTRATION EMAIL (OTP) ---
@user_bp.route('/verify-email', methods=['POST'])
def verify_email():
    data = request.get_json() or {}
    email = str(data.get('email', '') or '').strip()
    token = str(data.get('token', '') or '').strip()

    if not email or not token:
        return jsonify({'error': 'Email and token are required'}), 400

    user = User.query.filter_by(email=email).first()
    if not user:
        return jsonify({'error': 'Invalid email or token'}), 400

    now = datetime.utcnow()
    otp_entry = RegistrationOTP.query.filter(
        RegistrationOTP.email == email,
        RegistrationOTP.used == False,
        RegistrationOTP.expires_at >= now
    ).order_by(RegistrationOTP.created_at.desc()).first()

    if not otp_entry or not check_password_hash(otp_entry.token_hash, token):
        return jsonify({'error': 'Invalid or expired verification code'}), 400

    otp_entry.used = True
    db.session.commit()

    return jsonify({'message': 'Email verified successfully', 'email': email}), 200


def _send_reset_email(email, code):
    smtp_host = os.getenv('SMTP_HOST')
    smtp_port = int(os.getenv('SMTP_PORT', '587'))
    smtp_user = os.getenv('SMTP_USER')
    smtp_pass = os.getenv('SMTP_PASS')
    from_addr = os.getenv('SMTP_FROM', smtp_user or 'no-reply@resqr.local')

    if not smtp_host or not smtp_user or not smtp_pass:
        print(f"[PasswordReset] Email not configured. Code for {email}: {code}")
        return False

    msg = EmailMessage()
    msg['Subject'] = 'Your ResQr password reset code'
    msg['From'] = from_addr
    msg['To'] = email
    msg.set_content(
        f"Here is your password reset code: {code}\n"
        "It expires in 30 minutes. If you did not request this, you can ignore this email."
    )

    context = ssl.create_default_context()
    with smtplib.SMTP(smtp_host, smtp_port) as server:
        server.starttls(context=context)
        server.login(smtp_user, smtp_pass)
        server.send_message(msg)
    return True


def _send_verification_email(email, code, verify_link):
    smtp_host = os.getenv('SMTP_HOST')
    smtp_port = int(os.getenv('SMTP_PORT', '587'))
    smtp_user = os.getenv('SMTP_USER')
    smtp_pass = os.getenv('SMTP_PASS')
    from_addr = os.getenv('SMTP_FROM', smtp_user or 'no-reply@resqr.local')

    if not smtp_host or not smtp_user or not smtp_pass:
        print(f"[VerifyEmail] Email not configured. Code for {email}: {code} | Link: {verify_link}")
        return False

    msg = EmailMessage()
    msg['Subject'] = 'Verify your ResQr email'
    msg['From'] = from_addr
    msg['To'] = email
    msg.set_content(
        f"Welcome to ResQr!\n\nYour verification code: {code}\nVerification link: {verify_link}\nThis code expires in 15 minutes."
    )

    context = ssl.create_default_context()
    with smtplib.SMTP(smtp_host, smtp_port) as server:
        server.starttls(context=context)
        server.login(smtp_user, smtp_pass)
        server.send_message(msg)
    return True

