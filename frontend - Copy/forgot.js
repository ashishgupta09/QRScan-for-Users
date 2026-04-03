document.addEventListener("DOMContentLoaded", () => {
  const forgotRequestForm = document.getElementById("forgotRequestForm");
  const verifyTokenForm = document.getElementById("verifyTokenForm");
  const fpEmail = document.getElementById("fpEmail");
  const fpConfirmEmail = document.getElementById("fpConfirmEmail");
  const fpToken = document.getElementById("fpToken");
  const fpStatus = document.getElementById("fpStatus");
  const fpResetStatus = document.getElementById("fpResetStatus");
  const sendCodeBtn = document.getElementById("sendCodeBtn");
  const verifyBtn = document.getElementById("verifyBtn");

  if (forgotRequestForm) {
    forgotRequestForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      const email = fpEmail.value.trim();
      if (!email) {
        showToast("Please enter the email linked to your account", "error", 5000);
        return;
      }

      sendCodeBtn.disabled = true;
      fpStatus.textContent = "";

      try {
        const response = await fetch(
          "https://qrscan-for-users.onrender.com/api/user/forgot-password",
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email }),
          },
        );
        const result = await response.json();
        if (response.ok) {
          // If backend returns token in dev, include in toast for convenience
          const extra = result.reset_token ? ` (OTP: ${result.reset_token})` : "";
          showToast(
            (result.message || "Reset instructions sent.") + extra,
            "success",
            5000,
          );
          fpConfirmEmail.value = email;
        } else {
          showToast(result.error || "Unable to start reset.", "error", 5000);
        }
      } catch (err) {
        console.error(err);
        showToast("Network error. Please try again.", "error", 5000);
      } finally {
        sendCodeBtn.disabled = false;
      }
    });
  }

  if (verifyTokenForm) {
    verifyTokenForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      const email = fpConfirmEmail.value.trim();
      const token = fpToken.value.trim();
      if (!email || !token) {
        showToast("Please enter both email and the OTP code", "error");
        return;
      }

      verifyBtn.disabled = true;
      fpResetStatus.textContent = "Verifying code...";
      fpResetStatus.style.color = "#444";

      try {
        const response = await fetch(
          "https://qrscan-for-users.onrender.com/api/user/verify-reset",
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email, token }),
          },
        );
        const result = await response.json();
        if (response.ok) {
          fpResetStatus.textContent = "Code verified. Redirecting...";
          fpResetStatus.style.color = "#2e7d32";
          const params = new URLSearchParams({ email, token });
          window.location.href = `./reset_confirm.html?${params.toString()}`;
        } else {
          fpResetStatus.textContent = result.error || "Verification failed.";
          fpResetStatus.style.color = "#d32f2f";
        }
      } catch (err) {
        console.error(err);
        fpResetStatus.textContent = "Network error. Please try again.";
        fpResetStatus.style.color = "#d32f2f";
      } finally {
        verifyBtn.disabled = false;
      }
    });
  }
});
