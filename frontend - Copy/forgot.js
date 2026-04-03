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
        showToast("Please enter the email linked to your account", "error");
        return;
      }

      sendCodeBtn.disabled = true;
      fpStatus.textContent = "Sending reset code...";
      fpStatus.style.color = "#444";

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
          fpStatus.textContent = result.message || "Reset instructions sent. Check your email for the code.";
          fpStatus.style.color = "#2e7d32";
          fpConfirmEmail.value = email;
          showToast("OTP sent. Please check your email.", "success");
        } else {
          fpStatus.textContent = result.error || "Unable to start reset.";
          fpStatus.style.color = "#d32f2f";
        }
      } catch (err) {
        console.error(err);
        fpStatus.textContent = "Network error. Please try again.";
        fpStatus.style.color = "#d32f2f";
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
