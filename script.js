const BACKEND_URL = "http://127.0.0.1:3000";

console.log("JANSAHAYAK SCRIPT LOADED");


/* =====================================================
   DEPARTMENT
===================================================== */

function getDepartment(category) {

    const normalizedCategory =
        String(category || "")
            .trim()
            .toLowerCase();

    const departmentMap = {

        "road": "PWD",

        "garbage": "Nagar Nigam",

        "street light": "Electricity Department",

        "water": "Jal Vibhag",

        "other": "General Administration"

    };

    return departmentMap[normalizedCategory] || "";
}


/* =====================================================
   PRIORITY
===================================================== */

function getPriority(category) {

    const normalizedCategory =
        String(category || "")
            .trim()
            .toLowerCase();

    if (
        normalizedCategory === "road" ||
        normalizedCategory === "water"
    ) {

        return "High";

    }

    if (
        normalizedCategory === "street light" ||
        normalizedCategory === "garbage"
    ) {

        return "Medium";

    }

    return "Low";
}


/* =====================================================
   STATUS CLASS
===================================================== */

function getStatusClass(status) {

    const safeStatus =
        String(status || "Reported")
            .trim();

    if (safeStatus === "In Progress") {

        return "status-progress";

    }

    if (safeStatus === "Resolved") {

        return "status-resolved";

    }

    return "status-reported";
}


/* =====================================================
   STATUS BADGE
===================================================== */

function createStatusBadge(status) {

    const safeStatus =
        status || "Reported";

    const statusClass =
        getStatusClass(safeStatus);

    return `
        <span class="history-status ${statusClass}">
            ${escapeHTML(safeStatus)}
        </span>
    `;
}


/* =====================================================
   COMPLAINT ID
===================================================== */

function generateComplaintId() {

    const randomNumber =
        Math.floor(
            100000 +
            Math.random() * 900000
        );

    return "JS" + randomNumber;
}


/* =====================================================
   ESCAPE HTML
===================================================== */

function escapeHTML(value) {

    if (
        value === null ||
        value === undefined
    ) {

        return "";

    }

    return String(value)

        .replace(/&/g, "&amp;")

        .replace(/</g, "&lt;")

        .replace(/>/g, "&gt;")

        .replace(/"/g, "&quot;")

        .replace(/'/g, "&#039;");
}


/* =====================================================
   IMAGE TO BASE64
===================================================== */

function convertImageToBase64(file) {

    return new Promise(
        (resolve, reject) => {

            if (!file) {

                resolve("");

                return;

            }

            const reader =
                new FileReader();

            reader.onload =
                function () {

                    resolve(
                        reader.result
                    );

                };

            reader.onerror =
                function () {

                    reject(
                        new Error(
                            "Image could not be read"
                        )
                    );

                };

            reader.readAsDataURL(file);

        }
    );
}


/* =====================================================
   PRIVATE HISTORY
===================================================== */

function getPrivateHistory() {

    try {

        const history =
            JSON.parse(
                localStorage.getItem(
                    "janSahayakHistory"
                ) || "[]"
            );

        return Array.isArray(history)
            ? history
            : [];

    } catch (error) {

        console.error(
            "History read error:",
            error
        );

        return [];

    }
}


/* =====================================================
   SAVE PRIVATE HISTORY
===================================================== */

function saveToPrivateHistory(complaint) {

    const history =
        getPrivateHistory();

    const existingIndex =
        history.findIndex(
            item =>
                item.complaintId ===
                complaint.complaintId
        );

    if (existingIndex !== -1) {

        history[existingIndex] =
            complaint;

    } else {

        history.unshift(
            complaint
        );

    }

    localStorage.setItem(
        "janSahayakHistory",
        JSON.stringify(history)
    );
}


/* =====================================================
   LOAD PRIVATE HISTORY
===================================================== */

function loadPrivateHistory() {

    const container =
        document.getElementById(
            "complaintHistory"
        );

    if (!container) {

        return;

    }

    const history =
        getPrivateHistory();

    if (history.length === 0) {

        container.innerHTML = `

            <div class="no-history">

                <div class="empty-icon">
                    📭
                </div>

                <h3>
                    No Complaint History
                </h3>

                <p>
                    Your submitted complaints
                    will appear here.
                </p>

            </div>

        `;

        return;

    }

    container.innerHTML =

        history.map(
            complaint => {

                const department =
                    complaint.department ||
                    getDepartment(
                        complaint.category
                    ) ||
                    "N/A";

                const priority =
                    complaint.priority ||
                    getPriority(
                        complaint.category
                    );

                const status =
                    complaint.status ||
                    "Reported";

                const statusClass =
                    getStatusClass(
                        status
                    );

                return `

                    <div class="history-item">

                        <div class="history-main">

                            <strong>
                                ${escapeHTML(
                                    complaint.complaintId ||
                                    "N/A"
                                )}
                            </strong>

                            <span>
                                ${escapeHTML(
                                    complaint.category ||
                                    "N/A"
                                )}
                            </span>

                        </div>


                        <div class="history-info">

                            <span
                                class="history-status ${statusClass}"
                            >
                                ${escapeHTML(
                                    status
                                )}
                            </span>


                            <small>
                                Department:
                                ${escapeHTML(
                                    department
                                )}
                            </small>


                            <small>
                                Priority:
                                ${escapeHTML(
                                    priority
                                )}
                            </small>


                            <small>
                                Updated:
                                ${escapeHTML(
                                    complaint.lastUpdated ||
                                    "N/A"
                                )}
                            </small>


                            <button
                                type="button"
                                onclick="trackComplaint('${escapeHTML(
                                    complaint.complaintId || ""
                                )}')"
                            >
                                Track Complaint
                            </button>

                        </div>

                    </div>

                `;

            }
        ).join("");
}


/* =====================================================
   CLEAR PRIVATE HISTORY
===================================================== */

function clearPrivateHistory() {

    localStorage.removeItem(
        "janSahayakHistory"
    );

    loadPrivateHistory();

    alert(
        "Complaint history cleared."
    );
}


/* =====================================================
   UPDATE HISTORY STATUS
===================================================== */

function updatePrivateHistoryStatus(
    complaint
) {

    const history =
        getPrivateHistory();

    const index =
        history.findIndex(
            item =>
                item.complaintId ===
                complaint.complaintId
        );

    if (index !== -1) {

        history[index] =
            complaint;

        localStorage.setItem(
            "janSahayakHistory",
            JSON.stringify(history)
        );

    }
}


/* =====================================================
   CATEGORY → DEPARTMENT
===================================================== */

document.addEventListener(
    "DOMContentLoaded",
    function () {

        const categorySelect =
            document.getElementById(
                "problemCategory"
            );

        const departmentInput =
            document.getElementById(
                "problemDepartment"
            );

        if (
            categorySelect &&
            departmentInput
        ) {

            function updateDepartment() {

                const category =
                    categorySelect.value.trim();

                const department =
                    getDepartment(
                        category
                    );

                departmentInput.value =
                    department;

                console.log(
                    "Category:",
                    category,
                    "Department:",
                    department
                );
            }

            categorySelect.addEventListener(
                "change",
                updateDepartment
            );

            updateDepartment();
        }

        loadPrivateHistory();

    }
);


/* =====================================================
   CLOSE SUCCESS MODAL
===================================================== */

window.closeSuccessModal =
    function () {

        const successModal =
            document.getElementById(
                "successModal"
            );

        if (successModal) {

            successModal.style.setProperty(
                "display",
                "none",
                "important"
            );

            successModal.style.setProperty(
                "visibility",
                "hidden",
                "important"
            );

            successModal.style.setProperty(
                "opacity",
                "0",
                "important"
            );

            console.log(
                "SUCCESS POPUP CLOSED"
            );

        }
    };


/* =====================================================
   SHOW SUCCESS MODAL
===================================================== */

function showSuccessModal(
    complaintId,
    department,
    priority
) {

    const successModal =
        document.getElementById(
            "successModal"
        );

    const successModalDetails =
        document.getElementById(
            "successModalDetails"
        );

    console.log(
        "SUCCESS MODAL:",
        successModal
    );

    console.log(
        "SUCCESS MODAL DETAILS:",
        successModalDetails
    );

    if (
        !successModal ||
        !successModalDetails
    ) {

        console.error(
            "Success modal elements not found!"
        );

        alert(
            "Complaint submitted successfully!\n\n" +
            "Complaint ID: " +
            complaintId
        );

        return;
    }


    /* -----------------------------------------
       MODAL CONTENT
    ----------------------------------------- */

    successModalDetails.innerHTML = `

        <div
            style="
                display:grid;
                grid-template-columns:repeat(2, 1fr);
                gap:12px;
                margin-top:20px;
                text-align:left;
            "
        >

            <div
                style="
                    padding:15px;
                    background:#f7f9fc;
                    border-radius:10px;
                    border:1px solid #e5e7eb;
                "
            >

                <strong>
                    Complaint ID
                </strong>

                <br>

                <span>
                    ${escapeHTML(
                        complaintId
                    )}
                </span>

            </div>


            <div
                style="
                    padding:15px;
                    background:#f7f9fc;
                    border-radius:10px;
                    border:1px solid #e5e7eb;
                "
            >

                <strong>
                    Department
                </strong>

                <br>

                <span>
                    ${escapeHTML(
                        department
                    )}
                </span>

            </div>


            <div
                style="
                    padding:15px;
                    background:#f7f9fc;
                    border-radius:10px;
                    border:1px solid #e5e7eb;
                "
            >

                <strong>
                    Priority
                </strong>

                <br>

                <span>
                    ${escapeHTML(
                        priority
                    )}
                </span>

            </div>


            <div
                style="
                    padding:15px;
                    background:#f7f9fc;
                    border-radius:10px;
                    border:1px solid #e5e7eb;
                "
            >

                <strong>
                    Status
                </strong>

                <br>

                <span>
                    Reported
                </span>

            </div>

        </div>

    `;


    /* -----------------------------------------
       FORCE POPUP VISIBLE
    ----------------------------------------- */

    successModal.style.setProperty(
        "display",
        "flex",
        "important"
    );

    successModal.style.setProperty(
        "visibility",
        "visible",
        "important"
    );

    successModal.style.setProperty(
        "opacity",
        "1",
        "important"
    );

    successModal.style.setProperty(
        "z-index",
        "999999",
        "important"
    );

    successModal.style.setProperty(
        "animation",
        "none",
        "important"
    );

    successModal.style.setProperty(
        "transition",
        "none",
        "important"
    );


    /* -----------------------------------------
       PREVENT ACCIDENTAL HIDE
    ----------------------------------------- */

    successModal.dataset.open =
        "true";


    console.log(
        "SUCCESS POPUP OPENED:",
        complaintId
    );


    /* -----------------------------------------
       DEBUG CHECK
    ----------------------------------------- */

    setTimeout(
        function () {

            console.log(
                "POPUP AFTER 3 SECONDS:",
                successModal.style.display
            );

            console.log(
                "POPUP VISIBILITY:",
                successModal.style.visibility
            );

            console.log(
                "POPUP OPACITY:",
                successModal.style.opacity
            );

        },
        3000
    );

}


/* =====================================================
   REPORT COMPLAINT
===================================================== */

window.reportProblem =
    async function () {

        console.log(
            "REPORT BUTTON CLICKED"
        );

        try {

            /* -----------------------------------------
               GET FORM VALUES
            ----------------------------------------- */

            const name =
                document.getElementById(
                    "problemName"
                )?.value.trim();

            const mobile =
                document.getElementById(
                    "problemMobile"
                )?.value.trim();

            const category =
                document.getElementById(
                    "problemCategory"
                )?.value.trim();

            const description =
                document.getElementById(
                    "problemDescription"
                )?.value.trim();

            const location =
                document.getElementById(
                    "problemLocation"
                )?.value.trim();

            const photoInput =
                document.getElementById(
                    "problemPhoto"
                );


            /* -----------------------------------------
               VALIDATION
            ----------------------------------------- */

            if (
                !name ||
                !mobile ||
                !category ||
                !description ||
                !location
            ) {

                alert(
                    "Please fill all required fields."
                );

                return;
            }


            if (
                !/^[0-9]{10}$/.test(
                    mobile
                )
            ) {

                alert(
                    "Please enter a valid 10-digit mobile number."
                );

                return;
            }


            /* -----------------------------------------
               DEPARTMENT
            ----------------------------------------- */

            const department =
                getDepartment(
                    category
                );


            /* -----------------------------------------
               PRIORITY
            ----------------------------------------- */

            const priority =
                getPriority(
                    category
                );


            /* -----------------------------------------
               COMPLAINT ID
            ----------------------------------------- */

            const complaintId =
                generateComplaintId();


            /* -----------------------------------------
               PHOTO
            ----------------------------------------- */

            let photo = "";

            if (
                photoInput &&
                photoInput.files &&
                photoInput.files.length > 0
            ) {

                photo =
                    await convertImageToBase64(
                        photoInput.files[0]
                    );

            }


            /* -----------------------------------------
               TIME
            ----------------------------------------- */

            const now =
                new Date().toLocaleString();


            /* -----------------------------------------
               COMPLAINT OBJECT
            ----------------------------------------- */

            const complaint = {

                complaintId:
                    complaintId,

                name:
                    name,

                mobile:
                    mobile,

                category:
                    category,

                department:
                    department,

                priority:
                    priority,

                description:
                    description,

                location:
                    location,

                photo:
                    photo,

                status:
                    "Reported",

                lastUpdated:
                    now,

                statusHistory: [

                    {
                        status:
                            "Reported",

                        date:
                            now
                    }

                ]

            };


            console.log(
                "Sending complaint:",
                complaint
            );


            /* -----------------------------------------
               SEND TO BACKEND
            ----------------------------------------- */

            const response =
                await fetch(
                    `${BACKEND_URL}/api/complaints`,
                    {

                        method:
                            "POST",

                        headers: {

                            "Content-Type":
                                "application/json"

                        },

                        body:
                            JSON.stringify(
                                complaint
                            )

                    }
                );


            /* -----------------------------------------
               READ RESPONSE
            ----------------------------------------- */

            const data =
                await response.json();

            console.log(
                "Backend response:",
                data
            );


            /* -----------------------------------------
               CHECK RESPONSE
            ----------------------------------------- */

            if (!response.ok) {

                throw new Error(
                    data.message ||
                    "Complaint submission failed"
                );

            }


            /* -----------------------------------------
               SAVE HISTORY
            ----------------------------------------- */

            const savedComplaint =
                data.complaint ||
                complaint;

            saveToPrivateHistory(
                savedComplaint
            );


            /* -----------------------------------------
               TRACK INPUT
            ----------------------------------------- */

            const trackInput =
                document.getElementById(
                    "trackComplaintId"
                );

            if (trackInput) {

                trackInput.value =
                    complaintId;

            }


            /* -----------------------------------------
               REFRESH HISTORY
            ----------------------------------------- */

            loadPrivateHistory();


            /* -----------------------------------------
               RESET FORM
            ----------------------------------------- */

            const form =
                document.getElementById(
                    "complaintForm"
                );

            if (form) {

                form.reset();

            }


            /* -----------------------------------------
               CLEAR DEPARTMENT
            ----------------------------------------- */

            const departmentInput =
                document.getElementById(
                    "problemDepartment"
                );

            if (departmentInput) {

                departmentInput.value =
                    "";

            }


            /* -----------------------------------------
               SHOW POPUP
            ----------------------------------------- */

            showSuccessModal(
                complaintId,
                department,
                priority
            );


            console.log(
                "Complaint submitted successfully:",
                complaintId
            );

        }

        catch (error) {

            console.error(
                "Complaint submission error:",
                error
            );

            alert(
                "Complaint submit nahi ho payi.\n\n" +
                error.message
            );

        }

    };


/* =====================================================
   TRACK COMPLAINT
===================================================== */

window.trackComplaint =
    async function (
        complaintIdFromHistory = null
    ) {

        try {

            const input =
                document.getElementById(
                    "trackComplaintId"
                );

            const result =
                document.getElementById(
                    "trackingResult"
                );

            const complaintId =
                complaintIdFromHistory ||
                input?.value.trim();


            /* -----------------------------------------
               VALIDATION
            ----------------------------------------- */

            if (!complaintId) {

                alert(
                    "Please enter Complaint ID."
                );

                return;

            }


            /* -----------------------------------------
               LOADING
            ----------------------------------------- */

            if (result) {

                result.innerHTML = `

                    <div class="tracking-card">

                        <p>
                            🔄 Loading complaint details...
                        </p>

                    </div>

                `;

            }


            /* -----------------------------------------
               FETCH COMPLAINT
            ----------------------------------------- */

            const response =
                await fetch(
                    `${BACKEND_URL}/api/complaints/${encodeURIComponent(
                        complaintId
                    )}`
                );


            const data =
                await response.json();


            if (!response.ok) {

                throw new Error(
                    data.message ||
                    "Complaint not found"
                );

            }


            const complaint =
                data.complaint;


            /* -----------------------------------------
               UPDATE PRIVATE HISTORY
            ----------------------------------------- */

            updatePrivateHistoryStatus(
                complaint
            );


            /* -----------------------------------------
               DEPARTMENT
            ----------------------------------------- */

            const department =
                complaint.department ||
                getDepartment(
                    complaint.category
                ) ||
                "N/A";


            /* -----------------------------------------
               PRIORITY
            ----------------------------------------- */

            const priority =
                complaint.priority ||
                getPriority(
                    complaint.category
                );


            /* -----------------------------------------
               STATUS
            ----------------------------------------- */

            const status =
                complaint.status ||
                "Reported";


            /* -----------------------------------------
               STATUS HISTORY
            ----------------------------------------- */

            let historyHTML = "";


            if (
                Array.isArray(
                    complaint.statusHistory
                ) &&
                complaint.statusHistory.length > 0
            ) {

                historyHTML =

                    complaint.statusHistory

                        .map(
                            item => {

                                return `

                                    <div
                                        class="status-history-item"
                                    >

                                        <strong>
                                            ${escapeHTML(
                                                item.status ||
                                                "Reported"
                                            )}
                                        </strong>

                                        <span>
                                            ${escapeHTML(
                                                item.date ||
                                                "N/A"
                                            )}
                                        </span>

                                    </div>

                                `;

                            }
                        )
                        .join("");


            } else {

                historyHTML = `

                    <p>
                        No status history available.
                    </p>

                `;

            }


            /* -----------------------------------------
               PHOTO
            ----------------------------------------- */

            let photoHTML = "";


            if (complaint.photo) {

                photoHTML = `

                    <div class="tracking-photo">

                        <h4>
                            📷 Uploaded Photo
                        </h4>

                        <img
                            src="${escapeHTML(
                                complaint.photo
                            )}"

                            alt="Complaint Photo"

                            style="
                                max-width:300px;
                                width:100%;
                                border-radius:8px;
                                margin-top:8px;
                            "
                        >

                    </div>

                `;

            }


            /* -----------------------------------------
               TRACKING RESULT
            ----------------------------------------- */

            if (result) {

                result.innerHTML = `

                    <div class="tracking-card">

                        <h3>
                            📋 Complaint Details
                        </h3>


                        <p>

                            <strong>
                                Complaint ID:
                            </strong>

                            ${escapeHTML(
                                complaint.complaintId
                            )}

                        </p>


                        <p>

                            <strong>
                                Name:
                            </strong>

                            ${escapeHTML(
                                complaint.name
                            )}

                        </p>


                        <p>

                            <strong>
                                Category:
                            </strong>

                            ${escapeHTML(
                                complaint.category
                            )}

                        </p>


                        <p>

                            <strong>
                                Department:
                            </strong>

                            ${escapeHTML(
                                department
                            )}

                        </p>


                        <p>

                            <strong>
                                Priority:
                            </strong>

                            ${escapeHTML(
                                priority
                            )}

                        </p>


                        <p>

                            <strong>
                                Description:
                            </strong>

                            ${escapeHTML(
                                complaint.description
                            )}

                        </p>


                        <p>

                            <strong>
                                Location:
                            </strong>

                            ${escapeHTML(
                                complaint.location
                            )}

                        </p>


                        <p>

                            <strong>
                                Status:
                            </strong>

                            ${createStatusBadge(
                                status
                            )}

                        </p>


                        <p>

                            <strong>
                                Last Updated:
                            </strong>

                            ${escapeHTML(
                                complaint.lastUpdated ||
                                "N/A"
                            )}

                        </p>


                        ${photoHTML}


                        <div class="status-history">

                            <h4>
                                📌 Status History
                            </h4>

                            ${historyHTML}

                        </div>

                    </div>

                `;

            }


            /* -----------------------------------------
               REFRESH HISTORY
            ----------------------------------------- */

            loadPrivateHistory();

        }

        catch (error) {

            console.error(
                "Tracking error:",
                error
            );

            const result =
                document.getElementById(
                    "trackingResult"
                );

            if (result) {

                result.innerHTML = `

                    <div class="error-message">

                        <h3>
                            ❌ Complaint Not Found
                        </h3>

                        <p>
                            ${escapeHTML(
                                error.message
                            )}
                        </p>

                    </div>

                `;

            }

        }

    };