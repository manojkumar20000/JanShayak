
const BACKEND_URL = "https://janshayak-backend.onrender.com";

let allComplaints = [];


// =====================================================
//                  ADMIN AUTHENTICATION
// =====================================================

function getAdminToken() {
    return sessionStorage.getItem("janSahayakAdminToken");
}

function adminHeaders() {
    return {
        "Content-Type": "application/json",
        "Authorization": "Bearer " + getAdminToken()
    };
}

function redirectToAdminLogin() {
    sessionStorage.removeItem("janSahayakAdminToken");
    window.location.href = "admin-login.html";
}


// Escape user-submitted text before displaying it in HTML.
function escapeHTML(value) {
    return String(value ?? "").replace(/[&<>"']/g, function (character) {
        const entities = {
            "&": "&amp;",
            "<": "&lt;",
            ">": "&gt;",
            '"': "&quot;",
            "'": "&#39;"
        };

        return entities[character];
    });
}


// Only allow supported base64 image data URLs.
function getSafePhoto(photo) {
    if (
        typeof photo === "string" &&
        /^data:image\/(png|jpeg|jpg|webp|gif);base64,[a-z0-9+/=\s]+$/i.test(photo)
    ) {
        return photo;
    }

    return "";
}


// =====================================================
//                  LOAD COMPLAINTS
// =====================================================

async function loadAdminComplaints() {
    const container = document.getElementById("adminComplaintList");
    const token = getAdminToken();

    if (!token) {
        redirectToAdminLogin();
        return;
    }

    if (container) {
        container.textContent = "Loading complaints...";
    }

    try {
        const response = await fetch(
            BACKEND_URL + "/api/complaints",
            {
                method: "GET",
                headers: adminHeaders()
            }
        );

        if (response.status === 401) {
            redirectToAdminLogin();
            return;
        }

        const data = await response.json();

        if (!response.ok || !data.success) {
            throw new Error(data.message || "Could not load complaints.");
        }

        allComplaints = Array.isArray(data.complaints)
            ? data.complaints
            : [];

        updateDashboardStats();
        updateAnalytics();
        displayComplaints(allComplaints);

    } catch (error) {
        console.error("Could not load admin complaints:", error.message);

        if (container) {
            container.textContent =
                "Complaints load nahi ho paayin. Connection check karke dobara try karein.";
        }
    }
}


// =====================================================
//                  DASHBOARD STATS
// =====================================================

function setText(elementId, value) {
    const element = document.getElementById(elementId);

    if (element) {
        element.textContent = value;
    }
}

function updateDashboardStats() {
    const total = allComplaints.length;

    const reported = allComplaints.filter(
        complaint => complaint.status === "Reported"
    ).length;

    const progress = allComplaints.filter(
        complaint => complaint.status === "In Progress"
    ).length;

    const resolved = allComplaints.filter(
        complaint => complaint.status === "Resolved"
    ).length;

    setText("totalComplaints", total);
    setText("reportedComplaints", reported);
    setText("progressComplaints", progress);
    setText("resolvedComplaints", resolved);
}


// =====================================================
//                  ANALYTICS
// =====================================================

function updateAnalytics() {
    const road = allComplaints.filter(
        complaint => complaint.category === "Road"
    ).length;

    const garbage = allComplaints.filter(
        complaint => complaint.category === "Garbage"
    ).length;

    const streetLight = allComplaints.filter(
        complaint => complaint.category === "Street Light"
    ).length;

    const water = allComplaints.filter(
        complaint => complaint.category === "Water"
    ).length;

    const other = allComplaints.filter(
        complaint => ![
            "Road",
            "Garbage",
            "Street Light",
            "Water"
        ].includes(complaint.category)
    ).length;

    setText("roadCount", road);
    setText("garbageCount", garbage);
    setText("streetLightCount", streetLight);
    setText("waterCount", water);
    setText("otherCount", other);

    updateBar("roadBar", "roadChartNumber", road);
    updateBar("garbageBar", "garbageChartNumber", garbage);
    updateBar("streetLightBar", "streetLightChartNumber", streetLight);
    updateBar("waterBar", "waterChartNumber", water);
    updateBar("otherBar", "otherChartNumber", other);
}


// =====================================================
//                  BAR CHART
// =====================================================

function updateBar(barId, numberId, count) {
    const bar = document.getElementById(barId);
    const number = document.getElementById(numberId);

    if (number) {
        number.textContent = count;
    }

    if (!bar) {
        return;
    }

    const maxCount = Math.max(allComplaints.length, 1);
    const width = Math.min((count / maxCount) * 100, 100);

    bar.style.width = width + "%";
}


// =====================================================
//                  DISPLAY COMPLAINTS
// =====================================================

function displayComplaints(complaints) {
    const container = document.getElementById("adminComplaintList");

    if (!container) {
        return;
    }

    if (!Array.isArray(complaints) || complaints.length === 0) {
        container.textContent = "No complaints found.";
        return;
    }

    container.innerHTML = complaints.map(complaint => {
        const id = escapeHTML(complaint.complaintId || "N/A");
        const name = escapeHTML(
            complaint.name || complaint.citizenName || "N/A"
        );
        const category = escapeHTML(complaint.category || "N/A");
        const area = escapeHTML(
            complaint.area || complaint.location || "N/A"
        );
        const priority = escapeHTML(complaint.priority || "Low");
        const status = escapeHTML(complaint.status || "Reported");

        return `
            <div class="admin-complaint-card">
                <h3>${id}</h3>

                <p>
                    <strong>Name:</strong> ${name}
                </p>

                <p>
                    <strong>Category:</strong> ${category}
                </p>

                <p>
                    <strong>Area:</strong> ${area}
                </p>

                <p>
                    <strong>Priority:</strong> ${priority}
                </p>

                <p>
                    <strong>Status:</strong> ${status}
                </p>

                <button
                    type="button"
                    class="view-complaint-button"
                    data-complaint-id="${id}"
                >
                    View Full Details
                </button>
            </div>
        `;
    }).join("");

    // Attach click handlers without placing complaint IDs in inline JavaScript.
    container.querySelectorAll(".view-complaint-button").forEach(button => {
        button.addEventListener("click", function () {
            openComplaintDetails(
                this.getAttribute("data-complaint-id")
            );
        });
    });
}


// =====================================================
//                  FILTER COMPLAINTS
// =====================================================

function filterComplaints() {
    const search = (
        document.getElementById("searchComplaint")?.value || ""
    ).trim().toLowerCase();

    const status = document.getElementById("statusFilter")?.value || "";
    const category = document.getElementById("categoryFilter")?.value || "";

    const filtered = allComplaints.filter(complaint => {
        const complaintId = String(
            complaint.complaintId || ""
        ).toLowerCase();

        const name = String(
            complaint.name || complaint.citizenName || ""
        ).toLowerCase();

        const mobile = String(
            complaint.mobile || complaint.citizenMobile || ""
        ).toLowerCase();

        const area = String(
            complaint.area || complaint.location || ""
        ).toLowerCase();

        const matchesSearch =
            complaintId.includes(search) ||
            name.includes(search) ||
            mobile.includes(search) ||
            area.includes(search);

        const matchesStatus =
            !status || complaint.status === status;

        const matchesCategory =
            !category || complaint.category === category;

        return matchesSearch && matchesStatus && matchesCategory;
    });

    displayComplaints(filtered);
}


// =====================================================
//                  RESET FILTERS
// =====================================================

function resetFilters() {
    const searchInput = document.getElementById("searchComplaint");
    const statusFilter = document.getElementById("statusFilter");
    const categoryFilter = document.getElementById("categoryFilter");

    if (searchInput) {
        searchInput.value = "";
    }

    if (statusFilter) {
        statusFilter.value = "";
    }

    if (categoryFilter) {
        categoryFilter.value = "";
    }

    displayComplaints(allComplaints);
}


// =====================================================
//              OPEN COMPLAINT DETAILS
// =====================================================

function openComplaintDetails(complaintId) {
    const complaint = allComplaints.find(item =>
        String(item.complaintId || "").toUpperCase() ===
        String(complaintId || "").toUpperCase()
    );

    if (!complaint) {
        alert("Complaint not found.");
        return;
    }

    const modal = document.getElementById("complaintDetailsModal");
    const content = document.getElementById("complaintDetailsContent");

    if (!modal || !content) {
        return;
    }

    const modalComplaintId = document.getElementById("modalComplaintId");
    const modalStatus = document.getElementById("modalStatus");

    if (modalComplaintId) {
        modalComplaintId.value = complaint.complaintId || "";
    }

    if (modalStatus) {
        modalStatus.value = complaint.status || "Reported";
    }

    // Complaint photo
    let photoHTML = "";
    const safePhoto = getSafePhoto(complaint.photo);

    if (safePhoto) {
        photoHTML = `
            <div class="admin-photo-section">
                <h3>📸 Complaint Photo</h3>

                <img
                    id="adminComplaintPhoto"
                    src="${safePhoto}"
                    alt="Complaint Photo"
                    style="
                        max-width: 100%;
                        max-height: 300px;
                        border-radius: 10px;
                        margin-top: 10px;
                        display: block;
                    "
                >
            </div>
        `;
    } else {
        photoHTML = `
            <p>
                <strong>📸 Complaint Photo:</strong>
                No photo available
            </p>
        `;
    }

    // Status history
    const history = Array.isArray(complaint.statusHistory)
        ? complaint.statusHistory
        : [];

    let historyHTML = "";

    if (history.length > 0) {
        historyHTML = `
            <div class="modal-history">
                <h3>📍 Status History</h3>

                ${history.map(item => `
                    <div class="modal-history-status">
                        <strong>${escapeHTML(item.status || "N/A")}</strong>
                        <br>
                        <small>🕒 ${escapeHTML(item.date || "N/A")}</small>
                    </div>
                `).join("")}
            </div>
        `;
    } else {
        historyHTML = "<p>No status history available.</p>";
    }

    // Complaint details
    content.innerHTML = `
        <p>
            <strong>Complaint ID:</strong>
            ${escapeHTML(complaint.complaintId || "N/A")}
        </p>

        <p>
            <strong>👤 Name:</strong>
            ${escapeHTML(complaint.name || complaint.citizenName || "N/A")}
        </p>

        <p>
            <strong>📱 Mobile:</strong>
            ${escapeHTML(complaint.mobile || complaint.citizenMobile || "N/A")}
        </p>

        <p>
            <strong>📌 Category:</strong>
            ${escapeHTML(complaint.category || "N/A")}
        </p>

        <p>
            <strong>🏢 Department:</strong>
            ${escapeHTML(complaint.department || "N/A")}
        </p>

        <p>
            <strong>📍 Area:</strong>
            ${escapeHTML(complaint.area || complaint.location || "N/A")}
        </p>

        <p>
            <strong>📝 Description:</strong>
            ${escapeHTML(complaint.description || "N/A")}
        </p>

        <p>
            <strong>⚠️ Priority:</strong>
            ${escapeHTML(complaint.priority || "Low")}
        </p>

        <p>
            <strong>📊 Status:</strong>
            ${escapeHTML(complaint.status || "Reported")}
        </p>

        <p>
            <strong>🕒 Submitted:</strong>
            ${escapeHTML(complaint.date || complaint.createdAt || "N/A")}
        </p>

        <p>
            <strong>🔄 Last Updated:</strong>
            ${escapeHTML(complaint.lastUpdated || "N/A")}
        </p>

        ${photoHTML}
        ${historyHTML}
    `;

    modal.style.display = "flex";
}


// =====================================================
//          UPDATE STATUS FROM MODAL
// =====================================================

async function updateComplaintStatusFromModal() {
    const complaintId =
        document.getElementById("modalComplaintId")?.value;

    const newStatus =
        document.getElementById("modalStatus")?.value;

    if (!complaintId) {
        alert("Complaint ID not found.");
        return;
    }

    if (!["Reported", "In Progress", "Resolved"].includes(newStatus)) {
        alert("Please select a valid status.");
        return;
    }

    await updateComplaintStatus(complaintId, newStatus);
}


// =====================================================
//                  UPDATE STATUS
// =====================================================

async function updateComplaintStatus(complaintId, newStatus) {
    const token = getAdminToken();

    if (!token) {
        redirectToAdminLogin();
        return;
    }

    try {
        const response = await fetch(
            BACKEND_URL +
            "/api/complaints/" +
            encodeURIComponent(complaintId) +
            "/status",
            {
                method: "PATCH",
                headers: adminHeaders(),
                body: JSON.stringify({
                    status: newStatus
                })
            }
        );

        if (response.status === 401) {
            redirectToAdminLogin();
            return;
        }

        const data = await response.json();

        if (!response.ok || !data.success) {
            alert(data.message || "Status update failed.");
            return;
        }

        await loadAdminComplaints();

        const updatedComplaint = allComplaints.find(item =>
            String(item.complaintId || "").toUpperCase() ===
            String(complaintId).toUpperCase()
        );

        if (updatedComplaint) {
            const modalStatus = document.getElementById("modalStatus");

            if (modalStatus) {
                modalStatus.value = updatedComplaint.status || newStatus;
            }

            // Refresh the details currently visible in the modal.
            openComplaintDetails(complaintId);
        }

        alert("✅ Complaint status updated successfully!");

    } catch (error) {
        console.error("Status update failed:", error.message);

        alert("❌ Server se status update nahi ho paya. Connection check karein.");
    }
}


// =====================================================
//                  CLOSE MODAL
// =====================================================

function closeComplaintDetails() {
    const modal = document.getElementById("complaintDetailsModal");

    if (modal) {
        modal.style.display = "none";
    }
}


// =====================================================
//              OUTSIDE MODAL CLICK
// =====================================================

window.addEventListener("click", function (event) {
    const modal = document.getElementById("complaintDetailsModal");

    if (modal && event.target === modal) {
        closeComplaintDetails();
    }
});


// =====================================================
//                  START
// =====================================================

document.addEventListener("DOMContentLoaded", function () {
    loadAdminComplaints();
});
```
