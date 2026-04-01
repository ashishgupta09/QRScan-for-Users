"""Quick test script to verify all ResQr API endpoints."""
import requests

BASE = "http://127.0.0.1:5000"

def sep(title):
    print(f"\n{'='*50}\n  {title}\n{'='*50}")

# 1. Health check
sep("1. Health Check")
r = requests.get(f"{BASE}/")
print(f"  Status: {r.status_code} | Body: {r.json()}")

# 2. User registration (valid)
sep("2. User Registration (valid)")
r = requests.post(f"{BASE}/api/user/register", data={
    "email": "test2@gmail.com",
    "password": "Test@1234",
    "name": "Priya Patel",
    "address": "789 Park Street, Delhi",
    "phone": "8765432109",
    "alternate_phone": "9988776655",
    "dob": "1998-03-20",
    "blood_group": "O+",
    "has_disease": "no",
})
print(f"  Status: {r.status_code} | Message: {r.json().get('message')}")

# 3. User registration (missing fields)
sep("3. User Registration (missing name)")
r = requests.post(f"{BASE}/api/user/register", data={
    "email": "bad@test.com",
    "password": "pass",
    "name": "",
    "address": "addr",
    "phone": "1234567890",
    "dob": "1990-01-01",
    "blood_group": "A+",
    "has_disease": "no",
})
print(f"  Status: {r.status_code} | Error: {r.json().get('error')}")

# 4. User registration (bad phone)
sep("4. User Registration (invalid phone)")
r = requests.post(f"{BASE}/api/user/register", data={
    "email": "bad2@test.com",
    "password": "pass",
    "name": "Test",
    "address": "addr",
    "phone": "123",
    "dob": "1990-01-01",
    "blood_group": "A+",
    "has_disease": "no",
})
print(f"  Status: {r.status_code} | Error: {r.json().get('error')}")

# 5. User registration (bad blood group)
sep("5. User Registration (invalid blood group)")
r = requests.post(f"{BASE}/api/user/register", data={
    "email": "bad3@test.com",
    "password": "pass",
    "name": "Test",
    "address": "addr",
    "phone": "1234567890",
    "dob": "1990-01-01",
    "blood_group": "X",
    "has_disease": "no",
})
print(f"  Status: {r.status_code} | Error: {r.json().get('error')}")

# 6. User login
sep("6. User Login")
r = requests.post(f"{BASE}/api/user/login", json={
    "email": "test2@gmail.com",
    "password": "Test@1234",
})
user_token = r.json().get("token")
print(f"  Status: {r.status_code} | Token: {user_token[:30]}...")

# 7. User profile
sep("7. User Profile (JWT protected)")
r = requests.get(f"{BASE}/api/user/profile", headers={
    "Authorization": f"Bearer {user_token}"
})
print(f"  Status: {r.status_code} | Name: {r.json()['user']['name']}")

# 8. Admin login
sep("8. Admin Login")
r = requests.post(f"{BASE}/api/admin/login", json={
    "email": "admin@resqr.com",
    "password": "admin123",
})
admin_token = r.json().get("token")
print(f"  Status: {r.status_code} | Token: {admin_token[:30]}...")

# 9. Admin view all users
sep("9. Admin - View All Users")
r = requests.get(f"{BASE}/api/admin/users", headers={
    "Authorization": f"Bearer {admin_token}"
})
data = r.json()
print(f"  Status: {r.status_code} | Total users: {data['total']}")
for u in data["users"]:
    print(f"    - ID:{u['id']} | {u['name']} | status:{u['status']}")

# 10. Admin approve user ID 1
sep("10. Admin - Approve User 1")
r = requests.put(f"{BASE}/api/admin/users/1/approve", headers={
    "Authorization": f"Bearer {admin_token}"
})
resp = r.json()
print(f"  Status: {r.status_code} | Message: {resp.get('message')}")
print(f"  QR Path: {resp.get('qr_code_path')}")
scan_url = resp.get("scan_url", "")
print(f"  Scan URL: {scan_url}")

# 11. Admin reject user ID 2
sep("11. Admin - Reject User 2")
r = requests.put(f"{BASE}/api/admin/users/2/reject", headers={
    "Authorization": f"Bearer {admin_token}"
})
print(f"  Status: {r.status_code} | Message: {r.json().get('message')}")

# 12. Scan QR (use the token from approval)
sep("12. Scan QR Code (for approved user)")
if scan_url:
    r = requests.get(scan_url)
    print(f"  Status: {r.status_code} | User Details: {r.json()}")
else:
    print("  Skipped - no scan URL available")

# 13. Scan invalid QR
sep("13. Scan Invalid QR Code")
r = requests.get(f"{BASE}/api/admin/scan/invalidtoken123")
print(f"  Status: {r.status_code} | Error: {r.json().get('error')}")

print(f"\n{'='*50}")
print("  ALL TESTS COMPLETED!")
print(f"{'='*50}")
