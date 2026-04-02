document.addEventListener("DOMContentLoaded", () => {
  const loginForm = document.querySelector(".login-form");
  if (loginForm) {
    loginForm.addEventListener("submit", async (e) => {
      e.preventDefault();

      const email = document.getElementById("username").value.trim();
      const password = document.getElementById("password").value.trim();

      if (!email || !password) {
        showToast("Please enter both email and password", "error");
        return;
      }

      // Determine if it's admin or user login based on the page context or just try both
      // For now, let's try admin login first if it's the admin page
      const isAdminPage = document
        .querySelector("h1")
        .textContent.toLowerCase()
        .includes("admin");
      const endpoint = isAdminPage
        ? "https://qrscan-for-users.onrender.com/api/admin/login"
        : "https://qrscan-for-users.onrender.com/api/user/login";

      try {
        const response = await fetch(endpoint, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ email, password }),
        });

        const result = await response.json();

        if (response.ok) {
          localStorage.setItem("token", result.token);
          localStorage.setItem(
            "user",
            JSON.stringify(result.user || { email }),
          );
          localStorage.setItem("role", isAdminPage ? "admin" : "user");

          showToast("Login successful!", "success");

          if (isAdminPage || result.role === "admin") {
            window.location.href = "./dashboard.html";
          } else {
            window.location.href = "./profile.html";
          }
        } else {
          showToast(result.error || "Invalid credentials", "error");
        }
      } catch (error) {
        console.error("Error:", error);
        showToast("Connection error. Is the backend running?", "error");
      }
    });
  }
});
