import os
import uuid
import qrcode
from flask import current_app


def generate_qr_code(user_id, host_url):
    """
    Generate a unique QR token and QR code image for a user.
    The QR encodes a scan URL: {host_url}/api/admin/scan/{token}
    Returns (qr_token, qr_image_path)
    """
    qr_token = uuid.uuid4().hex

    scan_url = f"{host_url}/api/admin/scan/{qr_token}"

    # Create QR code image
    qr = qrcode.QRCode(
        version=1,
        error_correction=qrcode.constants.ERROR_CORRECT_H,
        box_size=10,
        border=4,
    )
    qr.add_data(scan_url)
    qr.make(fit=True)

    img = qr.make_image(fill_color="black", back_color="white")

    # Save QR code
    qr_dir = os.path.join(current_app.config['UPLOAD_FOLDER'], 'qrcodes')
    os.makedirs(qr_dir, exist_ok=True)

    filename = f"user_{user_id}_{qr_token[:8]}.png"
    filepath = os.path.join(qr_dir, filename)
    img.save(filepath)

    return qr_token, filepath
