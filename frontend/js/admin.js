const token = localStorage.getItem('token');
if (!token || localStorage.getItem('role') !== 'admin') {
    alert('Access denied. Please login as Admin.');
    window.location.href = './login.html';
}

document.addEventListener('DOMContentLoaded', () => {
    fetchUsers();

    // Close success overlay (if any)
    const closeBtn = document.querySelector('.close-btn');
    if (closeBtn) {
        closeBtn.addEventListener('click', () => {
            document.querySelector('.approvedBox').style.display = 'none';
        });
    }
    // Logout functionality
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', (e) => {
            e.preventDefault();
            localStorage.clear();
            window.location.href = './login.html';
        });
    }
});

async function fetchUsers() {
    try {
        const response = await fetch('http://127.0.0.1:5000/api/admin/users', {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        const data = await response.json();
        
        if (response.ok) {
            renderUsers(data.users);
        } else {
            console.error('Error fetching users:', data.error);
        }
    } catch (error) {
        console.error('Connection error:', error);
    }
}

function renderUsers(users) {
    const tbody = document.querySelector('.userTable tbody');
    tbody.innerHTML = '';

    users.forEach(user => {
        const tr = document.createElement('tr');
        // Standardize status for CSS classes (ensure lowercase)
        const statusClass = user.status.toLowerCase();
        
        tr.innerHTML = `
            <td>${user.id}</td>
            <td>${user.name}</td>
            <td>${user.phone}</td>
            <td><span class="pill bloodPill">${user.blood_group}</span></td>
            <td>${user.has_disease ? 'Yes' : 'No'}</td>
            <td><span class="pill statusPill ${statusClass}">${user.status.charAt(0).toUpperCase() + user.status.slice(1)}</span></td>
            <td>
                ${statusClass === 'approved' ? `<button type="button" class="qrBtn" onclick="viewQR('${user.qr_image_url}')">View QR</button>` : '-'}
            </td>
            <td>
                ${statusClass === 'pending' ? 
                    `<button class="btn-approve" onclick="updateStatus(${user.id}, 'approve')">Approve</button>
                     <button class="btn-reject" onclick="updateStatus(${user.id}, 'reject')">Reject</button>` 
                    : '<span style="color: var(--text-muted); font-size: 13px;">DONE</span>'}
            </td>
        `;
        tbody.appendChild(tr);
    });
}

async function updateStatus(id, action) {
    if (!confirm(`Are you sure you want to ${action} this user?`)) return;

    try {
        const response = await fetch(`http://127.0.0.1:5000/api/admin/users/${id}/${action}`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        const result = await response.json();

        if (response.ok) {
            alert(result.message);
            fetchUsers(); // Refresh the list
            if (action === 'approve') {
                document.querySelector('.approvedBox').style.display = 'flex';
            }
        } else {
            alert('Error: ' + (result.error || 'Server error'));
        }
    } catch (error) {
        console.error('Error:', error);
    }
}

function viewQR(qrImageUrl) {
    if (!qrImageUrl) return;
    const fullUrl = `http://127.0.0.1:5000${qrImageUrl}`;
    window.open(fullUrl, '_blank');
}

// Make functions global for onclick events
window.updateStatus = updateStatus;
window.viewQR = viewQR;
