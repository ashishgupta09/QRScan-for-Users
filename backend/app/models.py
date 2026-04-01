from datetime import datetime
from flask_sqlalchemy import SQLAlchemy

db = SQLAlchemy()


class User(db.Model):
    __tablename__ = 'users'

    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password_hash = db.Column(db.String(256), nullable=False)
    name = db.Column(db.String(100), nullable=False)
    address = db.Column(db.String(300), nullable=False)
    phone = db.Column(db.String(15), nullable=False)
    alternate_phone = db.Column(db.String(15), nullable=True)
    dob = db.Column(db.Date, nullable=False)
    blood_group = db.Column(db.String(5), nullable=False)
    has_disease = db.Column(db.Boolean, default=False)
    disease_document = db.Column(db.String(300), nullable=True)
    status = db.Column(db.String(20), default='pending')  # pending / approved / rejected
    qr_code_path = db.Column(db.String(300), nullable=True)
    qr_token = db.Column(db.String(64), unique=True, nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            'id': self.id,
            'email': self.email,
            'name': self.name,
            'address': self.address,
            'phone': self.phone,
            'alternate_phone': self.alternate_phone,
            'dob': self.dob.isoformat() if self.dob else None,
            'blood_group': self.blood_group,
            'has_disease': self.has_disease,
            'disease_document': self.disease_document,
            'status': self.status,
            'qr_code_path': self.qr_code_path,
            'qr_token': self.qr_token,
            'created_at': self.created_at.isoformat() if self.created_at else None,
        }


class Admin(db.Model):
    __tablename__ = 'admins'

    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password_hash = db.Column(db.String(256), nullable=False)
