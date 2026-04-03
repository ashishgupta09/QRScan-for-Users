document.addEventListener("DOMContentLoaded", () => {
  const loginForm = document.querySelector(".login-form");
  const roleTabs = document.querySelectorAll(".role-tab");
  const loginTitle = document.getElementById("loginTitle");
  if (!loginForm) return;

  const endpoints = {
    admin: "https://qrscan-for-users.onrender.com/api/admin/login",
    user: "https://qrscan-for-users.onrender.com/api/user/login",
  };

  const updateRoleUI = (role) => {
    loginForm.dataset.role = role;
    if (loginTitle) loginTitle.textContent = role === "admin" ? "Admin Login" : "User Login";
    const submitBtn = loginForm.querySelector('button[type="submit"]');
    if (submitBtn) submitBtn.textContent = role === "admin" ? "Login as Admin" : "Login as User";
  };

  roleTabs.forEach((tab) => {
    tab.addEventListener("click", () => {
      const role = tab.dataset.role;
      roleTabs.forEach((t) => {
        t.classList.toggle("active", t === tab);
        t.setAttribute("aria-selected", t === tab ? "true" : "false");
      });
      updateRoleUI(role);
    });
  });

  // Initialize default UI state
  updateRoleUI(loginForm.dataset.role || "user");

  loginForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const email = document.getElementById("username").value.trim();
    const password = document.getElementById("password").value.trim();
    const role = loginForm.dataset.role || "user";

    if (!email || !password) {
      showToast("Please enter both email and password", "error");
      return;
    }

    const endpoint = endpoints[role];
    if (!endpoint) {
      showToast("Unknown role selected.", "error");
      return;
    }

    try {
      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const result = await response.json();

      if (response.ok) {
        localStorage.setItem("token", result.token);
        localStorage.setItem("user", JSON.stringify(result.user || { email }));
        localStorage.setItem("role", role);

        showToast(`Login successful as ${role}`, "success");
        const redirect = role === "admin" ? "./dashboard.html?login=success" : "./profile.html?login=success";
        window.location.href = redirect;
      } else {
        showToast(result.error || "Invalid credentials", "error");
      }
    } catch (error) {
      console.error("Error:", error);
      showToast("Connection error. Is the backend running?", "error");
    }
  });
});
