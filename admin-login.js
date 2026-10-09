const BACKEND_URL = "https://janshayak-backend.onrender.com";

const adminLoginForm = document.getElementById("adminLoginForm");

if (adminLoginForm) {
adminLoginForm.addEventListener("submit", async function (event) {
event.preventDefault();

```
    const username = document.getElementById("adminUsername").value.trim();
    const password = document.getElementById("adminPassword").value;
    const message = document.getElementById("loginMessage");
    const loginButton = adminLoginForm.querySelector('button[type="submit"]');

    message.textContent = "Logging in...";
    message.className = "login-message";

    if (loginButton) {
        loginButton.disabled = true;
    }

    try {
        const response = await fetch(`${BACKEND_URL}/api/admin/login`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                username: username,
                password: password
            })
        });

        const data = await response.json();

        if (!response.ok || !data.success) {
            throw new Error(data.message || "Invalid username or password.");
        }

        const token = data.token || data.accessToken;

        if (!token) {
            throw new Error("Login response did not contain an authentication token.");
        }

        sessionStorage.setItem("janSahayakAdminLoggedIn", "true");
        sessionStorage.setItem("janSahayakAdminToken", token);

        message.textContent = "Login successful! Opening dashboard...";
        message.className = "login-message success";

        window.location.href = "admin.html";

    } catch (error) {
        message.textContent = error.message || "Unable to log in. Please try again.";
        message.className = "login-message error";
    } finally {
        if (loginButton) {
            loginButton.disabled = false;
        }
    }
});
```

}
