const express = require("express");
const cors = require("cors");
const crypto = require("crypto");
const { MongoClient } = require("mongodb");

require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 3000;

const MONGODB_URI = process.env.MONGODB_URI;
const ADMIN_USERNAME = process.env.ADMIN_USERNAME;
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;

app.use(cors());
app.use(express.json({ limit: "10mb" }));

let complaintsCollection;

function safeCompare(first, second) {
    if (typeof first !== "string" || typeof second !== "string") {
        return false;
    }

    const a = Buffer.from(first);
    const b = Buffer.from(second);

    return a.length === b.length &&
        crypto.timingSafeEqual(a, b);
}

function createAdminToken() {
    const expiresAt = Date.now() + 8 * 60 * 60 * 1000;
    const payload = Buffer.from(
        JSON.stringify({
            username: ADMIN_USERNAME,
            expiresAt
        })
    ).toString("base64url");

    const signature = crypto
        .createHmac("sha256", ADMIN_PASSWORD)
        .update(payload)
        .digest("base64url");

    return `${payload}.${signature}`;
}

function requireAdmin(req, res, next) {
    const authorization = req.headers.authorization || "";
    const parts = authorization.split(" ");

    if (parts.length !== 2 || parts[0] !== "Bearer") {
        return res.status(401).json({
            success: false,
            message: "Admin login required"
        });
    }

    const tokenParts = parts[1].split(".");

    if (tokenParts.length !== 2) {
        return res.status(401).json({
            success: false,
            message: "Invalid admin token"
        });
    }

    const [payload, suppliedSignature] = tokenParts;

    const expectedSignature = crypto
        .createHmac("sha256", ADMIN_PASSWORD)
        .update(payload)
        .digest("base64url");

    if (!safeCompare(suppliedSignature, expectedSignature)) {
        return res.status(401).json({
            success: false,
            message: "Invalid admin token"
        });
    }

    try {
        const decoded = JSON.parse(
            Buffer.from(payload, "base64url").toString("utf8")
        );

        if (
            decoded.username !== ADMIN_USERNAME ||
            !Number.isFinite(decoded.expiresAt) ||
            decoded.expiresAt <= Date.now()
        ) {
            return res.status(401).json({
                success: false,
                message: "Admin session expired. Please login again."
            });
        }

        next();
    } catch (error) {
        return res.status(401).json({
            success: false,
            message: "Invalid admin token"
        });
    }
}

async function connectDatabase() {
    if (!MONGODB_URI) {
        throw new Error("MONGODB_URI environment variable is missing");
    }

    if (!ADMIN_USERNAME || !ADMIN_PASSWORD) {
        throw new Error("Admin environment variables are missing");
    }

    const client = new MongoClient(MONGODB_URI);
    await client.connect();

    const db = client.db("jansahayak");
    complaintsCollection = db.collection("complaints");

    console.log("MONGODB CONNECTED");
    console.log("Database: jansahayak");
    console.log("Collection: complaints");
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

// Admin login
app.post("/api/admin/login", (req, res) => {
    const username = req.body?.username;
    const password = req.body?.password;

    if (
        !safeCompare(username, ADMIN_USERNAME) ||
        !safeCompare(password, ADMIN_PASSWORD)
    ) {
        return res.status(401).json({
            success: false,
            message: "Invalid username or password"
        });
    }

    res.json({
        success: true,
        message: "Login successful",
        token: createAdminToken()
    });
});

// Get all complaints: admin only
app.get("/api/complaints", requireAdmin, async (req, res) => {
    try {
        const complaints = await complaintsCollection
            .find({})
            .sort({ _id: -1 })
            .toArray();

        res.json({
            success: true,
            complaints
        });
    } catch (error) {
        console.error("Get complaints error:", error.message);

        res.status(500).json({
            success: false,
            message: "Failed to get complaints"
        });
    }
});

// Create a complaint
app.post("/api/complaints", async (req, res) => {
    try {
        const complaint = req.body;

        if (
            !complaint ||
            typeof complaint.complaintId !== "string" ||
            !/^[A-Z0-9-]{4,40}$/i.test(complaint.complaintId)
        ) {
            return res.status(400).json({
                success: false,
                message: "A valid complaint ID is required"
            });
        }

        const existingComplaint = await complaintsCollection.findOne({
            complaintId: complaint.complaintId
        });

        if (existingComplaint) {
            return res.status(409).json({
                success: false,
                message: "Complaint ID already exists"
            });
        }

        complaint.status = "Reported";
        complaint.lastUpdated = new Date().toISOString();
        complaint.statusHistory = [{
            status: "Reported",
            date: complaint.lastUpdated
        }];

        await complaintsCollection.insertOne(complaint);

        console.log("NEW COMPLAINT:", complaint.complaintId);

        res.status(201).json({
            success: true,
            message: "Complaint saved successfully",
            complaint
        });
    } catch (error) {
        console.error("Create complaint error:", error.message);

        res.status(500).json({
            success: false,
            message: "Failed to save complaint"
        });
    }
});

// Public tracking: return only non-sensitive information
app.get("/api/complaints/:id", async (req, res) => {
    try {
        const complaintId = req.params.id;

        const complaint = await complaintsCollection.findOne({
            complaintId: {
                $regex: `^${complaintId.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`,
                $options: "i"
            }
        });

        if (!complaint) {
            return res.status(404).json({
                success: false,
                message: "Complaint not found"
            });
        }

        res.json({
            success: true,
            complaint: {
                complaintId: complaint.complaintId,
                category: complaint.category,
                status: complaint.status,
                lastUpdated: complaint.lastUpdated,
                statusHistory: complaint.statusHistory || []
            }
        });
    } catch (error) {
        console.error("Complaint tracking error:", error.message);

        res.status(500).json({
            success: false,
            message: "Server error"
        });
    }
});

// Update status: admin only
app.put("/api/complaints/:id/status", requireAdmin, async (req, res) => {
    try {
        const complaintId = req.params.id;
        const newStatus = req.body?.status;

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

        const currentComplaint = await complaintsCollection.findOne({
            complaintId: {
                $regex: `^${complaintId.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`,
                $options: "i"
            }
        });

        if (!currentComplaint) {
            return res.status(404).json({
                success: false,
                message: "Complaint not found"
            });
        }

        if (currentComplaint.status !== newStatus) {
            const updatedTime = new Date().toISOString();

            const statusHistory = Array.isArray(currentComplaint.statusHistory)
                ? currentComplaint.statusHistory
                : [];

            statusHistory.push({
                status: newStatus,
                date: updatedTime
            });

            await complaintsCollection.updateOne(
                { _id: currentComplaint._id },
                {
                    $set: {
                        status: newStatus,
                        lastUpdated: updatedTime,
                        statusHistory
                    }
                }
            );

            currentComplaint.status = newStatus;
            currentComplaint.lastUpdated = updatedTime;
            currentComplaint.statusHistory = statusHistory;
        }

        console.log("STATUS UPDATED:", complaintId, "=>", newStatus);

        res.json({
            success: true,
            message: "Status updated successfully",
            complaint: currentComplaint
        });
    } catch (error) {
        console.error("Status update error:", error.message);

        res.status(500).json({
            success: false,
            message: "Server error"
        });
    }
});

connectDatabase()
    .then(() => {
        app.listen(PORT, "0.0.0.0", () => {
            console.log("JANSAHAYAK BACKEND");
            console.log("Server running on port:", PORT);
        });
    })
    .catch((error) => {
        console.error("Startup error:", error.message);
        process.exit(1);
    });
