document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("confirmResetForm");
  const rcEmail = document.getElementById("rcEmail");
  const rcToken = document.getElementById("rcToken");
  const rcNewPassword = document.getElementById("rcNewPassword");
  const rcConfirmPassword = document.getElementById("rcConfirmPassword");
  const rcStatus = document.getElementById("rcStatus");
  const resetBtn = document.getElementById("resetBtn");

  const params = new URLSearchParams(window.location.search);
  const email = params.get("email") || "";
  const token = params.get("token") || "";
  rcEmail.value = email;
  rcToken.value = token;

  if (!email || !token) {
    rcStatus.textContent = "Missing verification info. Please restart the reset flow.";
    rcStatus.style.color = "#d32f2f";
    resetBtn.disabled = true;
    return;
  }

  const isStrong = (pwd) => pwd.length >= 8 && /[A-Za-z]/.test(pwd) && /\d/.test(pwd);

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const newPassword = rcNewPassword.value.trim();
    const confirmPassword = rcConfirmPassword.value.trim();

    if (!newPassword || !confirmPassword) {
      showToast("Please fill out both password fields", "error");
      return;
    }
    if (!isStrong(newPassword)) {
      showToast("Password must be 8+ chars and include letters and numbers", "error");
      return;
    }
    if (newPassword !== confirmPassword) {
      showToast("Passwords do not match", "error");
      return;
    }

    resetBtn.disabled = true;
    rcStatus.textContent = "Updating password...";
    rcStatus.style.color = "#444";

    try {
      const response = await fetch(
        "https://qrscan-for-users.onrender.com/api/user/reset-password",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, token, new_password: newPassword }),
        },
      );
      const result = await response.json();
      if (response.ok) {
        rcStatus.textContent = "Password updated. Redirecting to login...";
        rcStatus.style.color = "#2e7d32";
        showToast("Password reset successful. Please log in.", "success");
        setTimeout(() => (window.location.href = "./login.html"), 1200);
      } else {
        rcStatus.textContent = result.error || "Reset failed.";
        rcStatus.style.color = "#d32f2f";
      }
    } catch (err) {
      console.error(err);
      rcStatus.textContent = "Network error. Please try again.";
      rcStatus.style.color = "#d32f2f";
    } finally {
      resetBtn.disabled = false;
    }
  });
});
