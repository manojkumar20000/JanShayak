const express = require("express");
const cors = require("cors");
const fs = require("fs");
const path = require("path");

const app = express();

const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json({ limit: "10mb" }));

const databaseFile = path.join(__dirname, "complaints.json");

function loadComplaints() {
    if (!fs.existsSync(databaseFile)) {
        fs.writeFileSync(databaseFile, "[]", "utf8");
        return [];
    }

    try {
        const data = fs.readFileSync(databaseFile, "utf8");

        if (!data.trim()) {
            return [];
        }

        const complaints = JSON.parse(data);

        return Array.isArray(complaints) ? complaints : [];

    } catch (error) {
        console.error("Database read error:", error.message);
        return [];
    }
}

function saveComplaints(complaints) {
    try {
        fs.writeFileSync(
            databaseFile,
            JSON.stringify(complaints, null, 4),
            "utf8"
        );

        return true;

    } catch (error) {
        console.error("Database save error:", error.message);
        return false;
    }
}

app.get("/", (req, res) => {
    res.send("JanSahayak Backend is Running!");
});

app.get("/api/test", (req, res) => {
    res.json({
        success: true,
        message: "JanSahayak API is working"
    });
});

app.get("/api/complaints", (req, res) => {
    const complaints = loadComplaints();

    res.json({
        success: true,
        complaints: complaints
    });
});

app.post("/api/complaints", (req, res) => {
    try {
        const complaint = req.body;

        if (!complaint || !complaint.complaintId) {
            return res.status(400).json({
                success: false,
                message: "Complaint ID is required"
            });
        }

        const complaints = loadComplaints();

        const exists = complaints.some(
            item => item.complaintId === complaint.complaintId
        );

        if (exists) {
            return res.status(409).json({
                success: false,
                message: "Complaint ID already exists"
            });
        }

        if (!complaint.status) {
            complaint.status = "Reported";
        }

        if (!complaint.lastUpdated) {
            complaint.lastUpdated = new Date().toLocaleString();
        }

        if (!Array.isArray(complaint.statusHistory)) {
            complaint.statusHistory = [
                {
                    status: complaint.status,
                    date: complaint.lastUpdated
                }
            ];
        }

        complaints.push(complaint);

        const saved = saveComplaints(complaints);

        if (!saved) {
            return res.status(500).json({
                success: false,
                message: "Complaint save failed"
            });
        }

        console.log("NEW COMPLAINT:", complaint.complaintId);

        res.status(201).json({
            success: true,
            message: "Complaint saved successfully",
            complaint: complaint
        });

    } catch (error) {
        console.error("Create complaint error:", error.message);

        res.status(500).json({
            success: false,
            message: "Server error"
        });
    }
});

app.get("/api/complaints/:id", (req, res) => {
    const complaintId = req.params.id.toUpperCase();

    const complaints = loadComplaints();

    const complaint = complaints.find(
        item => String(item.complaintId).toUpperCase() === complaintId
    );

    if (!complaint) {
        return res.status(404).json({
            success: false,
            message: "Complaint not found"
        });
    }

    res.json({
        success: true,
        complaint: complaint
    });
});

app.put("/api/complaints/:id/status", (req, res) => {
    const complaintId = req.params.id.toUpperCase();
    const newStatus = req.body.status;

    const allowedStatuses = [
        "Reported",
        "In Progress",
        "Resolved"
    ];

    if (!allowedStatuses.includes(newStatus)) {
        return res.status(400).json({
            success: false,
            message: "Invalid status"
        });
    }

    const complaints = loadComplaints();

    const index = complaints.findIndex(
        item => String(item.complaintId).toUpperCase() === complaintId
    );

    if (index === -1) {
        return res.status(404).json({
            success: false,
            message: "Complaint not found"
        });
    }

    const currentComplaint = complaints[index];

    if (!Array.isArray(currentComplaint.statusHistory)) {
        currentComplaint.statusHistory = [
            {
                status: currentComplaint.status,
                date: currentComplaint.lastUpdated
            }
        ];
    }

    if (currentComplaint.status !== newStatus) {

        const updatedTime = new Date().toLocaleString();

        currentComplaint.status = newStatus;
        currentComplaint.lastUpdated = updatedTime;

        currentComplaint.statusHistory.push({
            status: newStatus,
            date: updatedTime
        });
    }

    const saved = saveComplaints(complaints);

    if (!saved) {
        return res.status(500).json({
            success: false,
            message: "Status save failed"
        });
    }

    console.log(
        "STATUS UPDATED:",
        complaintId,
        "=>",
        newStatus
    );

    res.json({
        success: true,
        message: "Status updated successfully",
        complaint: currentComplaint
    });
});

app.listen(PORT, "0.0.0.0", () => {
    console.log("");
    console.log("=================================");
    console.log("      JANSAHAYAK BACKEND");
    console.log("=================================");
    console.log("Server running on port:", PORT);
    console.log("Database:");
    console.log(databaseFile);
    console.log("=================================");
});
