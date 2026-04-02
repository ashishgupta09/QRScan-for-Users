const token = localStorage.getItem("token");
if (!token || localStorage.getItem("role") !== "user") {
  showToast("Access denied. Please login to your user account.", "error");
  window.location.href = "./login.html";
}

document.addEventListener("DOMContentLoaded", async () => {
  // Logout functionality
  const logoutBtn = document.getElementById("logoutBtn");
  if (logoutBtn) {
    logoutBtn.addEventListener("click", (e) => {
      e.preventDefault();
      localStorage.clear();
      window.location.href = "./login.html";
    });
  }

  // Fetch user data
  try {
    const response = await fetch(
      "https://qrscan-for-users.onrender.com/api/user/profile",
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    );

    const data = await response.json();

    if (response.ok) {
      renderProfile(data.user);
    } else {
      console.error("Error fetching profile:", data.error);
      showToast("Failed to load profile. Please login again.", "error");
      localStorage.clear();
      window.location.href = "./login.html";
    }
  } catch (error) {
    console.error("Error:", error);
    showToast("Server unreachable. Please check your backend.", "error");
  }
});

function renderProfile(user) {
  const profileContent = document.getElementById("profileContent");
  const qrSection = document.getElementById("qrSection");

  // Status pill mapping
  const statusClass = user.status || "pending";
  const statusText = user.status.charAt(0).toUpperCase() + user.status.slice(1);

  profileContent.innerHTML = `
        <div class="profile-item">
            <span class="profile-label">Name:</span> <span>${user.name}</span>
        </div>
        <div class="profile-item">
            <span class="profile-label">Email:</span> <span>${user.email}</span>
        </div>
        <div class="profile-item">
            <span class="profile-label">Phone:</span> <span>${user.phone}</span>
        </div>
        <div class="profile-item">
            <span class="profile-label">Status:</span> 
            <span class="status-badge ${statusClass}">${statusText}</span>
        </div>
        <div class="profile-item">
            <span class="profile-label">Blood Group:</span> <span>${user.blood_group}</span>
        </div>
    `;

  // Show QR section if approved
  if (user.status === "approved") {
    qrSection.style.display = "block";
    const viewQrBtn = document.getElementById("viewQrBtn");
    viewQrBtn.onclick = () => {
      // Open the actual image URL
      window.open(
        `https://qrscan-for-users.onrender.com` + user.qr_image_url,
        "_blank",
      );
    };
  } else {
    profileContent.innerHTML += `<p style="color: #666; font-style: italic;">Your QR code will appear here once an admin approves your registration.</p>`;
  }
}
