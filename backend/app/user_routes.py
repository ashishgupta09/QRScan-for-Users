import os
import re
from datetime import datetime
from flask import Blueprint, request, jsonify, current_app
from flask_jwt_extended import create_access_token, jwt_required, get_jwt_identity
from werkzeug.security import generate_password_hash, check_password_hash
from werkzeug.utils import secure_filename
from .models import db, User

user_bp = Blueprint('user', __name__, url_prefix='/api/user')

VALID_BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']
ALLOWED_EXTENSIONS = {'pdf', 'png', 'jpg', 'jpeg', 'doc', 'docx'}


def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS


# ─── USER REGISTRATION ──────────────────────────────────────────────
@user_bp.route('/register', methods=['POST'])
def register():
    """
    Register a new user with form-data (multipart).
    Required fields: email, password, name, address, phone, dob, blood_group, has_disease
    Optional: alternate_phone, disease_document (file, required if has_disease=yes)
    """
    # Collect form fields
    email = request.form.get('email', '').strip()
    password = request.form.get('password', '').strip()
    name = request.form.get('name', '').strip()
    address = request.form.get('address', '').strip()
    phone = request.form.get('phone', '').strip()
    alternate_phone = request.form.get('alternate_phone', '').strip()
    dob_str = request.form.get('dob', '').strip()
    blood_group = request.form.get('blood_group', '').strip()
    has_disease_str = request.form.get('has_disease', '').strip().lower()

    # ── Validate required fields ──
    required = {
        'email': email,
        'password': password,
        'name': name,
        'address': address,
        'phone': phone,
        'dob': dob_str,
        'blood_group': blood_group,
        'has_disease': has_disease_str,
    }
    for field, value in required.items():
        if not value:
            return jsonify({'error': 'Valid details in all fields'}), 400

    # ── Phone validation (10 digits) ──
    if not re.match(r'^\d{10}$', phone):
        return jsonify({'error': 'Phone number must be exactly 10 digits'}), 400

    if alternate_phone and not re.match(r'^\d{10}$', alternate_phone):
        return jsonify({'error': 'Alternate phone number must be exactly 10 digits'}), 400

    # ── Blood group validation ──
    if blood_group not in VALID_BLOOD_GROUPS:
        return jsonify({
            'error': f'Invalid blood group. Must be one of: {", ".join(VALID_BLOOD_GROUPS)}'
        }), 400

    # ── DOB parsing ──
    try:
        dob = datetime.strptime(dob_str, '%Y-%m-%d').date()
    except ValueError:
        return jsonify({'error': 'DOB must be in YYYY-MM-DD format'}), 400

    # ── Disease validation ──
    has_disease = has_disease_str == 'yes'
    disease_doc_path = None

    if has_disease:
        file = request.files.get('disease_document')
        if not file or file.filename == '':
            return jsonify({'error': 'Disease document is required when disease is "yes"'}), 400
        if not allowed_file(file.filename):
            return jsonify({'error': f'Allowed file types: {", ".join(ALLOWED_EXTENSIONS)}'}), 400

        doc_dir = os.path.join(current_app.config['UPLOAD_FOLDER'], 'documents')
        os.makedirs(doc_dir, exist_ok=True)
        filename = secure_filename(f"{email}_{file.filename}")
        filepath = os.path.join(doc_dir, filename)
        file.save(filepath)
        disease_doc_path = filepath

    # ── Check duplicate email ──
    if User.query.filter_by(email=email).first():
        return jsonify({'error': 'Email already registered'}), 409

    # ── Create user ──
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

    return jsonify({
        'message': 'Form submitted successfully',
        'user': user.to_dict()
    }), 201


# ─── USER LOGIN ──────────────────────────────────────────────────────
@user_bp.route('/login', methods=['POST'])
def login():
    data = request.get_json()
    if not data:
        return jsonify({'error': 'Request body is required'}), 400

    email = data.get('email', '').strip()
    password = data.get('password', '').strip()

    if not email or not password:
        return jsonify({'error': 'Email and password are required'}), 400

    user = User.query.filter_by(email=email).first()
    if not user or not check_password_hash(user.password_hash, password):
        return jsonify({'error': 'Invalid email or password'}), 401

    token = create_access_token(identity=str(user.id), additional_claims={'role': 'user'})
    return jsonify({
        'message': 'Login successful',
        'token': token,
        'user': user.to_dict()
    }), 200


# ─── GET OWN PROFILE ────────────────────────────────────────────────
@user_bp.route('/profile', methods=['GET'])
@jwt_required()
def profile():
    user_id = int(get_jwt_identity())
    user = User.query.get(user_id)
    if not user:
        return jsonify({'error': 'User not found'}), 404

    return jsonify({'user': user.to_dict()}), 200
