import requests
import os

BASE_URL = 'https://qrscan-for-users.onrender.com/api/user/register'

# Create a dummy file
with open('test_doc.pdf', 'w') as f:
    f.write('Dummy PDF content')

data = {
    'email': 'manual_test@example.com',
    'password': 'password123',
    'name': 'Manual Test User',
    'address': 'Test Address',
    'phone': '1234567891',
    'dob': '1990-01-01',
    'blood_group': 'B+',
    'has_disease': 'yes'
}

# Open the file for reading and ensure it's closed properly
with open('test_doc.pdf', 'rb') as f:
    files = {
        'disease_document': ('test_doc.pdf', f, 'application/pdf')
    }

    try:
        print(f"Testing registration at {BASE_URL}...")
        response = requests.post(BASE_URL, data=data, files=files)
        print(f"Status Code: {response.status_code}")
        print(f"Response: {response.json()}")
        
        if response.status_code in [201, 409]: # 201 Created or 409 Conflict if already exists
            print("\nTesting User Login...")
            login_url = 'https://qrscan-for-users.onrender.com/api/user/login'
            login_data = {'email': 'manual_test@example.com', 'password': 'password123'}
            login_resp = requests.post(login_url, json=login_data)
            print(f"Login Status: {login_resp.status_code}")
            print(f"Login Response: {login_resp.json()}")

    except Exception as e:
        print(f"Error: {e}")

# Now safe to remove
if os.path.exists('test_doc.pdf'):
    os.remove('test_doc.pdf')
