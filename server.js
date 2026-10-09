```javascript
const BACKEND_URL = "https://janshayak-backend.onrender.com";

const adminLoginForm = document.getElementById("adminLoginForm");

if (adminLoginForm) {
    adminLoginForm.addEventListener("submit", async function (event) {
        event.preventDefault();

        const username = document.getElementById("adminUsername").value.trim();
        const password = document.getElementById("adminPassword").value;
        const message = document.getElementById("loginMessage");

        message.textContent = "Checking login...";
        message.className = "login-message";

        try {
            const response = await fetch(BACKEND_URL + "/api/admin/login", {
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

            if (!response.ok || !data.success || !data.token) {
                message.textContent = data.message || "Login failed.";
                message.className = "login-message error";
                return;
            }

            sessionStorage.setItem("janSahayakAdminToken", data.token);

            message.textContent = "Login successful!";
            message.className = "login-message success";

            setTimeout(function () {
                window.location.href = "admin.html";
            }, 500);

        } catch (error) {
            message.textContent = "Server connection failed. Please try again.";
            message.className = "login-message error";
        }
    });
}
```
