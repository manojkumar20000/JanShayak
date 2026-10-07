const BACKEND_URL = "https://janshayak-backend.onrender.com";

let allComplaints = [];


// =====================================================
//                  LOAD COMPLAINTS
// =====================================================

async function loadAdminComplaints() {

    try {

        const response = await fetch(
            BACKEND_URL + "/api/complaints"
        );

        const data = await response.json();

        console.log("ADMIN DATA:", data);


        if (data.success) {

            allComplaints = data.complaints || [];

            updateDashboardStats();

            updateAnalytics();

            displayComplaints(allComplaints);

        } else {

            console.error(
                "Could not load complaints:",
                data.message
            );

        }

    } catch (error) {

        console.error(
            "ADMIN ERROR:",
            error
        );

        const container =
            document.getElementById("adminComplaintList");

        if (container) {

            container.innerHTML =
                "<p>❌ Backend server se connection nahi ho pa raha.</p>";

        }

    }
}


// =====================================================
//                  DASHBOARD STATS
// =====================================================

function updateDashboardStats() {

    const total =
        allComplaints.length;


    const reported =
        allComplaints.filter(
            complaint =>
                complaint.status === "Reported"
        ).length;


    const progress =
        allComplaints.filter(
            complaint =>
                complaint.status === "In Progress"
        ).length;


    const resolved =
        allComplaints.filter(
            complaint =>
                complaint.status === "Resolved"
        ).length;


    document.getElementById(
        "totalComplaints"
    ).textContent = total;


    document.getElementById(
        "reportedComplaints"
    ).textContent = reported;


    document.getElementById(
        "progressComplaints"
    ).textContent = progress;


    document.getElementById(
        "resolvedComplaints"
    ).textContent = resolved;

}


// =====================================================
//                  ANALYTICS
// =====================================================

function updateAnalytics() {

    const road =
        allComplaints.filter(
            complaint =>
                complaint.category === "Road"
        ).length;


    const garbage =
        allComplaints.filter(
            complaint =>
                complaint.category === "Garbage"
        ).length;


    const streetLight =
        allComplaints.filter(
            complaint =>
                complaint.category === "Street Light"
        ).length;


    const water =
        allComplaints.filter(
            complaint =>
                complaint.category === "Water"
        ).length;


    const other =
        allComplaints.filter(
            complaint =>
                ![
                    "Road",
                    "Garbage",
                    "Street Light",
                    "Water"
                ].includes(complaint.category)
        ).length;


    document.getElementById(
        "roadCount"
    ).textContent = road;


    document.getElementById(
        "garbageCount"
    ).textContent = garbage;


    document.getElementById(
        "streetLightCount"
    ).textContent = streetLight;


    document.getElementById(
        "waterCount"
    ).textContent = water;


    document.getElementById(
        "otherCount"
    ).textContent = other;


    updateBar(
        "roadBar",
        "roadChartNumber",
        road
    );


    updateBar(
        "garbageBar",
        "garbageChartNumber",
        garbage
    );


    updateBar(
        "streetLightBar",
        "streetLightChartNumber",
        streetLight
    );


    updateBar(
        "waterBar",
        "waterChartNumber",
        water
    );


    updateBar(
        "otherBar",
        "otherChartNumber",
        other
    );

}


// =====================================================
//                  BAR CHART
// =====================================================

function updateBar(
    barId,
    numberId,
    count
) {

    const bar =
        document.getElementById(barId);


    const number =
        document.getElementById(numberId);


    if (!bar || !number) {
        return;
    }


    number.textContent = count;


    const maxCount =
        Math.max(
            allComplaints.length,
            1
        );


    const width =
        (count / maxCount) * 100;


    bar.style.width =
        width + "%";

}


// =====================================================
//                  DISPLAY COMPLAINTS
// =====================================================

function displayComplaints(
    complaints
) {

    const container =
        document.getElementById(
            "adminComplaintList"
        );


    if (!container) {
        return;
    }


    if (
        !complaints ||
        complaints.length === 0
    ) {

        container.innerHTML =
            "<p>No complaints found.</p>";

        return;
    }


    container.innerHTML =
        complaints.map(
            complaint => `

        <div class="admin-complaint-card">

            <h3>
                ${complaint.complaintId || "N/A"}
            </h3>

            <p>
                <strong>Name:</strong>
                ${complaint.name || "N/A"}
            </p>

            <p>
                <strong>Category:</strong>
                ${complaint.category || "N/A"}
            </p>

            <p>
                <strong>Area:</strong>
                ${complaint.area || "N/A"}
            </p>

            <p>
                <strong>Priority:</strong>
                ${complaint.priority || "Low"}
            </p>

            <p>
                <strong>Status:</strong>
                ${complaint.status || "Reported"}
            </p>

            <button
                type="button"
                onclick="openComplaintDetails('${complaint.complaintId}')"
            >
                View Full Details
            </button>

        </div>

        `
        ).join("");

}


// =====================================================
//                  FILTER COMPLAINTS
// =====================================================

function filterComplaints() {

    const search =
        document.getElementById(
            "searchComplaint"
        )?.value
            .trim()
            .toLowerCase() || "";


    const status =
        document.getElementById(
            "statusFilter"
        )?.value || "";


    const category =
        document.getElementById(
            "categoryFilter"
        )?.value || "";


    const filtered =
        allComplaints.filter(
            complaint => {

                const complaintId =
                    String(
                        complaint.complaintId || ""
                    ).toLowerCase();


                const name =
                    String(
                        complaint.name || ""
                    ).toLowerCase();


                const mobile =
                    String(
                        complaint.mobile || ""
                    ).toLowerCase();


                const area =
                    String(
                        complaint.area || ""
                    ).toLowerCase();


                const matchesSearch =
                    complaintId.includes(search) ||
                    name.includes(search) ||
                    mobile.includes(search) ||
                    area.includes(search);


                const matchesStatus =
                    !status ||
                    complaint.status === status;


                const matchesCategory =
                    !category ||
                    complaint.category === category;


                return (
                    matchesSearch &&
                    matchesStatus &&
                    matchesCategory
                );

            }
        );


    displayComplaints(filtered);

}


// =====================================================
//                  RESET FILTERS
// =====================================================

function resetFilters() {

    const searchInput =
        document.getElementById(
            "searchComplaint"
        );


    const statusFilter =
        document.getElementById(
            "statusFilter"
        );


    const categoryFilter =
        document.getElementById(
            "categoryFilter"
        );


    if (searchInput) {
        searchInput.value = "";
    }


    if (statusFilter) {
        statusFilter.value = "";
    }


    if (categoryFilter) {
        categoryFilter.value = "";
    }


    displayComplaints(
        allComplaints
    );

}


// =====================================================
//              OPEN COMPLAINT DETAILS
// =====================================================

function openComplaintDetails(
    complaintId
) {

    const complaint =
        allComplaints.find(
            item =>
                String(
                    item.complaintId
                ).toUpperCase() ===
                String(
                    complaintId
                ).toUpperCase()
        );


    if (!complaint) {

        alert(
            "Complaint not found."
        );

        return;
    }


    const modal =
        document.getElementById(
            "complaintDetailsModal"
        );


    const content =
        document.getElementById(
            "complaintDetailsContent"
        );


    if (!modal || !content) {
        return;
    }


    const modalComplaintId =
        document.getElementById(
            "modalComplaintId"
        );


    if (modalComplaintId) {

        modalComplaintId.value =
            complaint.complaintId;

    }


    const modalStatus =
        document.getElementById(
            "modalStatus"
        );


    if (modalStatus) {

        modalStatus.value =
            complaint.status ||
            "Reported";

    }


    // =================================================
```javascript
//                  PHOTO
// =================================================

let photoHTML = "";

if (
    complaint.photo &&
    complaint.photo.trim() !== ""
) {

    photoHTML = `

        <div class="admin-photo-section">

            <h3>
                📸 Complaint Photo
            </h3>

            <img
                src="${complaint.photo}"
                alt="Complaint Photo"
                style="
                    max-width:100%;
                    max-height:300px;
                    border-radius:10px;
                    margin-top:10px;
                    cursor:pointer;
                    display:block;
                "
                onclick="window.open(this.src, '_blank')"
            >

        </div>

    `;

} else {

    photoHTML = `

        <p>
            <strong>
                📸 Complaint Photo:
            </strong>
            No photo available
        </p>

    `;

}
```

    // =================================================
    //              STATUS HISTORY
    // =================================================

    let historyHTML = "";


    const history =
        Array.isArray(
            complaint.statusHistory
        )
            ? complaint.statusHistory
            : [];


    if (history.length > 0) {

        historyHTML = `

            <div class="modal-history">

                <h3>
                    📍 Status History
                </h3>

                ${history.map(
                    item => `

                    <div class="modal-history-status">

                        <strong>
                            ${item.status}
                        </strong>

                        <br>

                        <small>
                            🕒 ${item.date}
                        </small>

                    </div>

                `
                ).join("")}

            </div>

        `;

    }


    // =================================================
    //              COMPLAINT DETAILS
    // =================================================

    content.innerHTML = `

        <p>
            <strong>
                Complaint ID:
            </strong>
            ${complaint.complaintId || "N/A"}
        </p>


        <p>
            <strong>
                👤 Name:
            </strong>
            ${complaint.name || "N/A"}
        </p>


        <p>
            <strong>
                📱 Mobile:
            </strong>
            ${complaint.mobile || "N/A"}
        </p>


        <p>
            <strong>
                📌 Category:
            </strong>
            ${complaint.category || "N/A"}
        </p>


        <p>
            <strong>
                📍 Area:
            </strong>
            ${complaint.area || "N/A"}
        </p>


        <p>
            <strong>
                📝 Description:
            </strong>
            ${complaint.description || "N/A"}
        </p>


        <p>
            <strong>
                ⚠️ Priority:
            </strong>
            ${complaint.priority || "Low"}
        </p>


        <p>
            <strong>
                📊 Status:
            </strong>
            ${complaint.status || "Reported"}
        </p>


        <p>
            <strong>
                🕒 Submitted:
            </strong>
            ${complaint.date || "N/A"}
        </p>


        <p>
            <strong>
                🔄 Last Updated:
            </strong>
            ${complaint.lastUpdated || "N/A"}
        </p>


        ${photoHTML}


        ${historyHTML}

    `;


    modal.style.display =
        "flex";

}


// =====================================================
//          UPDATE STATUS FROM MODAL
// =====================================================

async function updateComplaintStatusFromModal() {

    const complaintId =
        document.getElementById(
            "modalComplaintId"
        )?.value;


    const newStatus =
        document.getElementById(
            "modalStatus"
        )?.value;


    if (!complaintId) {

        alert(
            "Complaint ID not found."
        );

        return;
    }


    if (!newStatus) {

        alert(
            "Please select a status."
        );

        return;
    }


    await updateComplaintStatus(
        complaintId,
        newStatus
    );

}


// =====================================================
//                  UPDATE STATUS
// =====================================================

async function updateComplaintStatus(
    complaintId,
    newStatus
) {

    try {

        const response =
            await fetch(

                BACKEND_URL +
                "/api/complaints/" +
                encodeURIComponent(
                    complaintId
                ) +
                "/status",

                {
                    method: "PUT",

                    headers: {
                        "Content-Type":
                            "application/json"
                    },

                    body: JSON.stringify({
                        status: newStatus
                    })
                }

            );


        const data =
            await response.json();


        console.log(
            "STATUS UPDATE RESPONSE:",
            data
        );


        if (
            !response.ok ||
            !data.success
        ) {

            alert(
                data.message ||
                "Status update failed."
            );

            return;
        }


        await loadAdminComplaints();


        const updatedComplaint =
            allComplaints.find(
                item =>
                    String(
                        item.complaintId
                    ).toUpperCase() ===
                    String(
                        complaintId
                    ).toUpperCase()
            );


        if (updatedComplaint) {

            const modalStatus =
                document.getElementById(
                    "modalStatus"
                );


            if (modalStatus) {

                modalStatus.value =
                    updatedComplaint.status;

            }

        }


        alert(
            "✅ Complaint status updated successfully!"
        );

    }

    catch (error) {

        console.error(
            "STATUS UPDATE ERROR:",
            error
        );


        alert(
            "❌ Server se status update nahi ho paya."
        );

    }

}


// =====================================================
//                  CLOSE MODAL
// =====================================================

function closeComplaintDetails() {

    const modal =
        document.getElementById(
            "complaintDetailsModal"
        );


    if (modal) {

        modal.style.display =
            "none";

    }

}


// =====================================================
//              OUTSIDE MODAL CLICK
// =====================================================

window.addEventListener(
    "click",
    function(event) {

        const modal =
            document.getElementById(
                "complaintDetailsModal"
            );


        if (
            modal &&
            event.target === modal
        ) {

            closeComplaintDetails();

        }

    }
);


// =====================================================
//                  START
// =====================================================

document.addEventListener(
    "DOMContentLoaded",
    function() {

        console.log(
            "✅ Admin JavaScript connected!"
        );

        loadAdminComplaints();

    }
);
