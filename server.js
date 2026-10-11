require("dotenv").config();

const express = require("express");
const cors = require("cors");
const crypto = require("crypto");
const { MongoClient } = require("mongodb");

const app = express();

const PORT = process.env.PORT || 3000;
const MONGODB_URI =
    process.env.MONGODB_URI || process.env.MONGO_URI;
const DB_NAME = process.env.MONGODB_DB || "jansahayak";

let complaintsCollection;
const adminTokens = new Set();

const ALLOWED_STATUSES = [
    "Pending",
    "Reported",
    "In Progress",
    "Resolved",
    "Rejected"
];

app.use(cors());
app.use(express.json({ limit: "10mb" }));

// HOME
app.get("/", (req, res) => {
    res.send("JanSahayak Backend is Running!");
});

// API TEST
app.get("/api/test", (req, res) => {
    res.json({
        success: true,
        message: "JanSahayak API is working"
    });
});

// ADMIN AUTHENTICATION
function requireAdmin(req, res, next) {
    const authHeader = req.headers.authorization || "";
    const token = authHeader.startsWith("Bearer ")
        ? authHeader.slice(7)
        : "";

    if (!token || !adminTokens.has(token)) {
        return res.status(401).json({
            success: false,
            message: "Admin login required"
        });
    }

    next();
}

// ADMIN LOGIN
app.post("/api/admin/login", (req, res) => {
    const username = String(req.body?.username || "");
    const password = String(req.body?.password || "");

    const adminUsername = process.env.ADMIN_USERNAME;
    const adminPassword = process.env.ADMIN_PASSWORD;

    if (!adminUsername || !adminPassword) {
        return res.status(503).json({
            success: false,
            message: "Admin credentials are not configured"
        });
    }

    if (
        username !== adminUsername ||
        password !== adminPassword
    ) {
        return res.status(401).json({
            success: false,
            message: "Invalid username or password"
        });
    }

    const token = crypto.randomBytes(32).toString("hex");
    adminTokens.add(token);

    res.json({
        success: true,
        message: "Login successful",
        token
    });
});

// PRIORITY
function getPriority(category) {
    const value = String(category || "").toLowerCase();

    if (value === "road" || value === "water") {
        return "High";
    }

    if (value === "garbage" || value === "street light") {
        return "Medium";
    }

    return "Low";
}

// SUBMIT COMPLAINT
app.post("/api/complaints", async (req, res) => {
    try {
        const body = req.body || {};

        const name = String(
            body.citizenName || body.name || ""
        ).trim();

        const mobile = String(
            body.citizenMobile || body.mobile || ""
        ).trim();

        const category = String(
            body.problemCategory || body.category || ""
        ).trim();

        const area = String(
            body.problemArea || body.area || body.location || ""
        ).trim();

        const description = String(
            body.problemDescription || body.description || ""
        ).trim();

        const photo = body.problemPhoto || body.photo || "";

        if (!name || !mobile || !category || !area || !description) {
            return res.status(400).json({
                success: false,
                message: "Please fill in all required fields"
            });
        }

        const now = new Date().toISOString();

        const complaint = {
            complaintId: "JS" + crypto.randomInt(100000, 1000000),
            name,
            mobile,
            category,
            area,
            description,
            photo,
            priority: getPriority(category),
            status: "Reported",
            department: "",
            date: now,
            createdAt: now,
            lastUpdated: now,
            statusHistory: [
                {
                    status: "Reported",
                    date: now
                }
            ]
        };

        await complaintsCollection.insertOne(complaint);

        res.status(201).json({
            success: true,
            message: "Complaint submitted successfully",
            complaintId: complaint.complaintId,
            complaint
        });
    } catch (error) {
        console.error("Submit complaint error:", error);

        res.status(500).json({
            success: false,
            message: "Could not submit complaint"
        });
    }
});

// TRACK COMPLAINT
async function trackComplaint(req, res) {
    try {
        const complaint = await complaintsCollection.findOne({
            complaintId: String(req.params.complaintId).trim()
        });

        if (!complaint) {
            return res.status(404).json({
                success: false,
                message: "Complaint not found"
            });
        }

        const { _id, ...result } = complaint;

        res.json({
            success: true,
            complaint: result
        });
    } catch (error) {
        console.error("Track complaint error:", error);

        res.status(500).json({
            success: false,
            message: "Could not track complaint"
        });
    }
}

app.get("/api/complaints/track/:complaintId", trackComplaint);
app.get("/api/complaints/:complaintId", trackComplaint);

// ADMIN: GET ALL COMPLAINTS
app.get("/api/complaints", requireAdmin, async (req, res) => {
    try {
        const complaints = await complaintsCollection
            .find({})
            .sort({ createdAt: -1 })
            .toArray();

        res.json({
            success: true,
            complaints: complaints.map(({ _id, ...item }) => item)
        });
    } catch (error) {
        console.error("Fetch complaints error:", error);

        res.status(500).json({
            success: false,
            message: "Could not load complaints"
        });
    }
});

// ADMIN: UPDATE STATUS
app.patch(
    "/api/complaints/:complaintId/status",
    requireAdmin,
    async (req, res) => {
        try {
            const status = req.body?.status;

            if (!ALLOWED_STATUSES.includes(status)) {
                return res.status(400).json({
                    success: false,
                    message: "Invalid complaint status"
                });
            }

            const now = new Date().toISOString();

            const result = await complaintsCollection.updateOne(
                { complaintId: req.params.complaintId },
                {
                    $set: {
                        status,
                        lastUpdated: now
                    },
                    $push: {
                        statusHistory: {
                            status,
                            date: now
                        }
                    }
                }
            );

            if (result.matchedCount === 0) {
                return res.status(404).json({
                    success: false,
                    message: "Complaint not found"
                });
            }

            res.json({
                success: true,
                message: "Complaint status updated",
                status
            });
        } catch (error) {
            console.error("Update status error:", error);

            res.status(500).json({
                success: false,
                message: "Could not update complaint status"
            });
        }
    }
);

// START SERVER
async function startServer() {
    if (!MONGODB_URI) {
        throw new Error(
            "MONGODB_URI is missing in Render Environment"
        );
    }

    const client = new MongoClient(MONGODB_URI);

    await client.connect();

    const database = client.db(DB_NAME);
    complaintsCollection = database.collection("complaints");

    console.log("MongoDB connected successfully");
    console.log("Database:", DB_NAME);

    app.listen(PORT, "0.0.0.0", () => {
        console.log(`JanSahayak backend running on port ${PORT}`);
    });
}

startServer().catch((error) => {
    console.error("Backend startup failed:", error);
    process.exit(1);
});
