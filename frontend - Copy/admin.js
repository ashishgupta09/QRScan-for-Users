const token = localStorage.getItem("token");
if (!token || localStorage.getItem("role") !== "admin") {
  showToast("Access denied. Please login as Admin.", "error");
  window.location.href = "./login.html";
}

document.addEventListener("DOMContentLoaded", () => {
  // Check for login success parameter and show single toast
  const params = new URLSearchParams(window.location.search);
  if (params.get("login") === "success") {
    // Remove the login parameter from URL to prevent duplicate toasts on refresh
    window.history.replaceState({}, document.title, window.location.pathname);
    showToast("Login successful as Admin", "success", 4000);
  }

  fetchUsers();

  // Close success overlay (if any)
  const closeBtn = document.querySelector(".close-btn");
  if (closeBtn) {
    closeBtn.addEventListener("click", () => {
      document.querySelector(".approvedBox").style.display = "none";
    });
  }
  // Auto-hide approved box if visible on load (safety)
  const approvedBox = document.querySelector(".approvedBox");
  if (approvedBox && approvedBox.style.display !== "none") {
    setTimeout(() => (approvedBox.style.display = "none"), 5000);
  }
  // Logout functionality
  const logoutBtn = document.getElementById("logoutBtn");
  if (logoutBtn) {
    logoutBtn.addEventListener("click", (e) => {
      e.preventDefault();
      localStorage.clear();
      window.location.href = "./login.html";
    });
  }
});

async function fetchUsers() {
  try {
    const response = await fetch(
      "https://qrscan-for-users.onrender.com/api/admin/users",
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    );

    const data = await response.json();

    if (response.ok) {
      renderUsers(data.users);
    } else {
      console.error("Error fetching users:", data.error);
    }
  } catch (error) {
    console.error("Connection error:", error);
  }
}

function renderUsers(users) {
  // Sort ascending by ID for clear 1..N ordering
  users = [...users].sort(
    (a, b) => Number(a.id || 0) - Number(b.id || 0),
  );
  const tbody = document.querySelector(".userTable tbody");
  tbody.innerHTML = "";

  users.forEach((user) => {
    const tr = document.createElement("tr");
    // Standardize status for CSS classes (ensure lowercase)
    const statusClass = user.status.toLowerCase();

    tr.innerHTML = `
            <td>${user.id}</td>
            <td>${user.name}</td>
            <td>${user.phone}</td>
            <td><span class="pill bloodPill">${user.blood_group}</span></td>
            <td>${user.has_disease ? "Yes" : "No"}</td>
            <td><span class="pill statusPill ${statusClass}">${user.status.charAt(0).toUpperCase() + user.status.slice(1)}</span></td>
            <td>
                ${statusClass === "approved" ? `<button type="button" class="qrBtn" onclick="viewQR('${user.qr_image_url}')">View QR</button>` : "-"}
            </td>
            <td>
                ${
                  statusClass === "pending"
                    ? `<button class="btn-approve" onclick="updateStatus(${user.id}, 'approve')">Approve</button>
                     <button class="btn-reject" onclick="updateStatus(${user.id}, 'reject')">Reject</button>`
                    : '<span style="color: var(--text-muted); font-size: 13px;">DONE</span>'
                }
            </td>
        `;
    tbody.appendChild(tr);
  });
}

async function updateStatus(id, action) {
  try {
    const response = await fetch(
      `https://qrscan-for-users.onrender.com/api/admin/users/${id}/${action}`,
      {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    );

    const result = await response.json();

    if (response.ok) {
      fetchUsers(); // Refresh the list
      const box = document.querySelector(".approvedBox");
      if (box) {
        const msg = result.message || (action === "approve" ? "User approved" : "User rejected");
        box.querySelector("span").textContent = msg;
        box.classList.toggle("error", action === "reject");
        box.style.display = "flex";
        setTimeout(() => {
          box.style.display = "none";
        }, 5000);
      }
    } else {
      showToast(result.error || "Something went wrong", "error", 5000);
    }
  } catch (error) {
    console.error("Error:", error);
    showToast("Server unreachable. Please retry.", "error", 5000);
  }
}

function viewQR(qrImageUrl) {
  if (!qrImageUrl) return;
  const fullUrl = `https://qrscan-for-users.onrender.com${qrImageUrl}`;
  window.open(fullUrl, "_blank");
}

// Make functions global for onclick events
window.updateStatus = updateStatus;
window.viewQR = viewQR;
