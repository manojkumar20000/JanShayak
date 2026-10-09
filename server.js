<!DOCTYPE html>

<html lang="en">

<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">

```
<title>JanSahayak - Admin Dashboard</title>

<link rel="stylesheet" href="style.css">
```

</head>

<body>

```
<header class="main-header">
    <div class="logo">
        <h1>JanSahayak</h1>
        <p>Citizen Problem Portal</p>
    </div>

    <nav>
        <a href="index.html">Home</a>
        <a href="index.html#report-section">Report Problem</a>
        <a href="index.html#track-section">Track Complaint</a>

        <button type="button" id="logoutButton" class="admin-logout-btn">
            Logout
        </button>
    </nav>
</header>

<main class="admin-dashboard">

    <div class="admin-title">
        <h1>Admin Dashboard</h1>
        <p>Manage and monitor citizen complaints</p>
    </div>

    <section class="dashboard-stats">

        <div class="stat-card">
            <h3>Total Complaints</h3>
            <p id="totalComplaints">0</p>
        </div>

        <div class="stat-card">
            <h3>Pending</h3>
            <p id="reportedComplaints">0</p>
        </div>

        <div class="stat-card">
            <h3>In Progress</h3>
            <p id="progressComplaints">0</p>
        </div>

        <div class="stat-card">
            <h3>Resolved</h3>
            <p id="resolvedComplaints">0</p>
        </div>

    </section>

    <section class="analytics-section">
        <h2>Complaint Analytics</h2>

        <div class="analytics-grid">

            <div class="analytics-card">
                <h3>Road</h3>
                <p id="roadCount">0</p>
            </div>

            <div class="analytics-card">
                <h3>Garbage</h3>
                <p id="garbageCount">0</p>
            </div>

            <div class="analytics-card">
                <h3>Street Light</h3>
                <p id="streetLightCount">0</p>
            </div>

            <div class="analytics-card">
                <h3>Water</h3>
                <p id="waterCount">0</p>
            </div>

            <div class="analytics-card">
                <h3>Other</h3>
                <p id="otherCount">0</p>
            </div>

        </div>

        <div class="category-chart">
            <h3>Category Distribution</h3>

            <div class="chart-row">
                <span>Road</span>
                <div class="chart-bar">
                    <div id="roadBar"></div>
                </div>
                <strong id="roadChartNumber">0</strong>
            </div>

            <div class="chart-row">
                <span>Garbage</span>
                <div class="chart-bar">
                    <div id="garbageBar"></div>
                </div>
                <strong id="garbageChartNumber">0</strong>
            </div>

            <div class="chart-row">
                <span>Street Light</span>
                <div class="chart-bar">
                    <div id="streetLightBar"></div>
                </div>
                <strong id="streetLightChartNumber">0</strong>
            </div>

            <div class="chart-row">
                <span>Water</span>
                <div class="chart-bar">
                    <div id="waterBar"></div>
                </div>
                <strong id="waterChartNumber">0</strong>
            </div>

            <div class="chart-row">
                <span>Other</span>
                <div class="chart-bar">
                    <div id="otherBar"></div>
                </div>
                <strong id="otherChartNumber">0</strong>
            </div>
        </div>
    </section>

    <section class="admin-search-section">
        <h2>Search Complaints</h2>

        <div class="admin-search-box">

            <input
                type="text"
                id="searchComplaint"
                placeholder="Search by ID, name, mobile or area"
                oninput="filterComplaints()">

            <select id="statusFilter" onchange="filterComplaints()">
                <option value="">All Statuses</option>
                <option value="Pending">Pending</option>
                <option value="Reported">Reported (Old)</option>
                <option value="In Progress">In Progress</option>
                <option value="Resolved">Resolved</option>
                <option value="Rejected">Rejected</option>
            </select>

            <select id="categoryFilter" onchange="filterComplaints()">
                <option value="">All Categories</option>
                <option value="Road">Road</option>
                <option value="Garbage">Garbage</option>
                <option value="Street Light">Street Light</option>
                <option value="Water">Water</option>
                <option value="Other">Other</option>
            </select>

            <button type="button" id="resetFiltersButton">
                Reset
            </button>

        </div>
    </section>

    <section class="admin-complaints">
        <h2>All Complaints</h2>

        <div id="adminComplaintList" aria-live="polite">
            <p>Loading complaints...</p>
        </div>
    </section>

    <div
        id="complaintDetailsModal"
        class="complaint-modal"
        style="display: none;">

        <div class="complaint-modal-content">

            <div class="complaint-modal-header">
                <h2>Complaint Details</h2>

                <button
                    type="button"
                    class="modal-close-btn"
                    id="closeModalTop">
                    ×
                </button>
            </div>

            <div id="complaintDetailsContent">
                <p>Loading details...</p>
            </div>

            <div class="modal-status-section">

                <input type="hidden" id="modalComplaintId">

                <label for="modalStatus">
                    <strong>Change Status:</strong>
                </label>

                <select id="modalStatus">
                    <option value="Pending">Pending</option>
                    <option value="In Progress">In Progress</option>
                    <option value="Resolved">Resolved</option>
                    <option value="Rejected">Rejected</option>
                </select>

                <button
                    type="button"
                    id="updateStatusButton">
                    Update Status
                </button>

            </div>

            <div class="complaint-modal-footer">
                <button
                    type="button"
                    class="modal-close-button"
                    id="closeModalBottom">
                    Close
                </button>
            </div>

        </div>
    </div>

</main>

<script>
    (function () {
        const loggedIn =
            sessionStorage.getItem("janSahayakAdminLoggedIn");

        const token =
            sessionStorage.getItem("janSahayakAdminToken");

        if (loggedIn !== "true" || !token) {
            sessionStorage.removeItem("janSahayakAdminLoggedIn");
            sessionStorage.removeItem("janSahayakAdminToken");

            window.location.replace("admin-login.html");
        }
    })();

    document.getElementById("logoutButton").addEventListener("click", function () {
        sessionStorage.removeItem("janSahayakAdminLoggedIn");
        sessionStorage.removeItem("janSahayakAdminToken");

        window.location.replace("admin-login.html");
    });
</script>

<script src="admin.js?v=4"></script>
```

</body>
</html>
