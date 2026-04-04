const token = localStorage.getItem("token");
if (!token || localStorage.getItem("role") !== "user") {
  showToast("Access denied. Please login to your user account.", "error");
  window.location.href = "./login.html";
}

document.addEventListener("DOMContentLoaded", async () => {
  // Check for login success parameter and show single toast
  const params = new URLSearchParams(window.location.search);
  if (params.get("login") === "success") {
    // Remove the login parameter from URL to prevent duplicate toasts on refresh
    window.history.replaceState({}, document.title, window.location.pathname);
    showToast("Login successful", "success", 4000);
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
  const pendingSection = document.getElementById("pendingSection");

  // Status pill mapping
  const statusClass = user.status || "pending";
  const statusText = user.status.charAt(0).toUpperCase() + user.status.slice(1);

  // Update profile content with new structure
  const infoItems = profileContent.querySelectorAll('.info-value');
  const infoData = [
    user.name,
    user.email,
    user.phone,
    `<span class="status-badge ${statusClass}">${statusText}</span>`,
    user.blood_group,
    user.has_disease ? '<span style="color: var(--error-red); font-weight: 600;">Yes</span>' : '<span style="color: var(--success-green); font-weight: 600;">No</span>'
  ];

  infoItems.forEach((item, index) => {
    if (infoData[index]) {
      item.innerHTML = infoData[index];
    }
  });

  // Show appropriate QR section and medical document section
  if (user.status === "approved") {
    qrSection.style.display = "block";
    pendingSection.style.display = "none";
    const viewQrBtn = document.getElementById("viewQrBtn");
    viewQrBtn.onclick = () => {
      // Open the actual image URL
      window.open(
        `https://qrscan-for-users.onrender.com` + user.qr_image_url,
        "_blank",
      );
    };
  } else {
    qrSection.style.display = "none";
    pendingSection.style.display = "block";
  }

  // Show medical document section if user has disease and document
  const medicalDocumentCard = document.getElementById("medicalDocumentCard");
  if (user.has_disease && user.disease_document) {
    medicalDocumentCard.style.display = "block";
    const viewDocBtn = document.getElementById("viewDocBtn");
    viewDocBtn.onclick = () => {
      // Extract filename from path
      const filename = user.disease_document.split('\\').pop().split('/').pop();
      const documentUrl = `https://qrscan-for-users.onrender.com/uploads/documents/${filename}`;
      
      // Use document preview instead of direct download
      if (window.showDocumentPreview) {
        window.showDocumentPreview(documentUrl, filename);
      } else {
        // Fallback to direct opening if preview not available
        window.open(documentUrl, '_blank');
      }
    };
  } else {
    medicalDocumentCard.style.display = "none";
  }
}
