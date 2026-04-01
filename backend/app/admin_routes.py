from flask import Blueprint, request, jsonify
from flask_jwt_extended import create_access_token, jwt_required, get_jwt_identity
from werkzeug.security import check_password_hash
from .models import db, User, Admin
from .qr_utils import generate_qr_code

admin_bp = Blueprint('admin', __name__, url_prefix='/api/admin')


# ─── ADMIN LOGIN ─────────────────────────────────────────────────────
@admin_bp.route('/login', methods=['POST'])
def admin_login():
    data = request.get_json()
    if not data:
        return jsonify({'error': 'Request body is required'}), 400

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

    return jsonify({
        'message': 'User details retrieved successfully',
        'user': {
            'name': user.name,
            'address': user.address,
            'phone': user.phone,
            'alternate_phone': user.alternate_phone,
            'dob': user.dob.isoformat() if user.dob else None,
            'blood_group': user.blood_group,
            'has_disease': user.has_disease,
            'status': user.status,
        }
    }), 200
