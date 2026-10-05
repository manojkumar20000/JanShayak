// =====================================================
//              JANSAHAYAK ADMIN LOGIN
// =====================================================


const adminLoginForm =
    document.getElementById(
        "adminLoginForm"
    );


if (adminLoginForm) {

    adminLoginForm.addEventListener(
        "submit",
        function (event) {

            event.preventDefault();


            const username =
                document
                    .getElementById("adminUsername")
                    .value
                    .trim();


            const password =
                document
                    .getElementById("adminPassword")
                    .value;


            const message =
                document.getElementById(
                    "loginMessage"
                );


            // =============================================
            //              ADMIN LOGIN
            // =============================================

            if (
                username === "admin" &&
                password === "1234"
            ) {

                sessionStorage.setItem(
                    "janSahayakAdminLoggedIn",
                    "true"
                );


                message.textContent =
                    "✅ Login successful!";


                message.className =
                    "login-message success";


                setTimeout(
                    function () {

                        window.location.href =
                            "admin.html";

                    },
                    500
                );

            }

            else {

                message.textContent =
                    "❌ Invalid username or password.";


                message.className =
                    "login-message error";

            }

        }
    );

}