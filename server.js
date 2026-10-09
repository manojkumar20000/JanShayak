const express = require("express");
const cors = require("cors");
const crypto = require("crypto");
const { MongoClient } = require("mongodb");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json({ limit: "10mb" }));

const MONGODB_URI = process.env.MONGODB_URI;
const ADMIN_USERNAME = process.env.ADMIN_USERNAME;
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;

const TOKEN_SECRET = process.env.TOKEN_SECRET;

let complaintsCollection;
const activeTokens = new Set();

function createToken(username) {
    const payload = Buffer.from(
        JSON.stringify({
            username,
            expires: Date.now() + 8 * 60 * 60 * 1000
        })
    ).toString("base64url");

    const signature = crypto
        .createHmac("sha256", TOKEN_SECRET)
        .update(payload)
        .digest("base64url");

    const token = payload + "." + signature;
    activeTokens.add(token);

    return token;
}

function verifyAdmin(req, res, next) {
    const authorization = req.headers.authorization || "";
    const token = authorization.startsWith("Bearer ")
        ? authorization.slice(7)
        : "";

    if (!token || !activeTokens.has(token)) {
        return res.status(401).json({
            success: false,
            message: "Please login again."
        });
    }

    try {
        const parts = token.split(".");
        if (parts.length !== 2) {
            throw new Error("Invalid token");
        }

        const expectedSignature = crypto
            .createHmac("sha256", TOKEN_SECRET)
            .update(parts[0])
            .digest("base64url");

        const signatureBuffer = Buffer.from(parts[1]);
        const expectedBuffer = Buffer.from(expectedSignature);

        if (
            signatureBuffer.length !== expectedBuffer.length ||
            !crypto.timingSafeEqual(signatureBuffer, expectedBuffer)
        ) {
            throw new Error("Invalid signature");
        }

        const payload = JSON.parse(
            Buffer.from(parts[0], "base64url").toString("utf8")
        );

        if (payload.expires < Date.now()) {
            activeTokens.delete(token);
            throw new Error("Token expired");
        }

        req.admin = payload;
        next();
    } catch (error) {
        return res.status(401).json({
            success: false,
            message: "Invalid or expired login. Please login again."
        });
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

app.post("/api/admin/login", (req, res) => {
    const { username, password } = req.body || {};

    if (!ADMIN_USERNAME || !ADMIN_PASSWORD || !TOKEN_SECRET) {
        return res.status(500).json({
            success: false,
            message: "Admin login environment variables are missing."
        });
    }

    if (
        typeof username !== "string" ||
        typeof password !== "string" ||
        username !== ADMIN_USERNAME ||
        password !== ADMIN_PASSWORD
    ) {
        return res.status(401).json({
            success: false,
            message: "Incorrect username or password."
        });
    }

    const token = createToken(username);

    res.json({
        success: true,
        message: "Login successful.",
        token
    });
});

app.post("/api/complaints", async (req, res) => {
    try {
        const {
            citizenName,
            citizenMobile,
            problemCategory,
            problemArea,
            problemDescription,
            problemPhoto
        } = req.body || {};

        if (
            !citizenName ||
            !citizenMobile ||
            !problemCategory ||
            !problemArea ||
            !problemDescription
        ) {
            return res.status(400).json({
                success: false,
                message: "Please fill in all required fields."
            });
        }

        const complaint = {
            complaintId: "JS" + Date.now().toString().slice(-8),
            citizenName,
            citizenMobile,
            category: problemCategory,
            area: problemArea,
            description: problemDescription,
            photo: problemPhoto || "",
            status: "Pending",
            priority: ["Road", "Water"].includes(problemCategory)
                ? "High"
                : ["Garbage", "Street Light"].includes(problemCategory)
                    ? "Medium"
                    : "Low",
            createdAt: new Date()
        };

        await complaintsCollection.insertOne(complaint);

        res.status(201).json({
            success: true,
            message: "Complaint submitted successfully.",
            complaintId: complaint.complaintId
        });
    } catch (error) {
        console.error("Complaint submission error:", error);
        res.status(500).json({
            success: false,
            message: "Unable to submit complaint."
        });
    }
});

app.get("/api/complaints/:id", async (req, res) => {
    try {
        const complaint = await complaintsCollection.findOne({
            complaintId: req.params.id
        });

        if (!complaint) {
            return res.status(404).json({
                success: false,
                message: "Complaint not found."
            });
        }

        res.json({
            success: true,
            complaint: {
                complaintId: complaint.complaintId,
                category: complaint.category,
                area: complaint.area,
                description: complaint.description,
                status: complaint.status,
                priority: complaint.priority,
                createdAt: complaint.createdAt
            }
        });
    } catch (error) {
        console.error("Complaint tracking error:", error);
        res.status(500).json({
            success: false,
            message: "Unable to track complaint."
        });
    }
});

app.get("/api/complaints", verifyAdmin, async (req, res) => {
    try {
        const complaints = await complaintsCollection
            .find({})
            .sort({ createdAt: -1 })
            .toArray();

        res.json({
            success: true,
            complaints
        });
    } catch (error) {
        console.error("Fetching complaints error:", error);
        res.status(500).json({
            success: false,
            message: "Unable to fetch complaints."
        });
    }
});

app.patch("/api/complaints/:id/status", verifyAdmin, async (req, res) => {
    try {
        const { status } = req.body || {};
        const allowedStatuses = [
            "Pending",
            "In Progress",
            "Resolved",
            "Rejected"
        ];

        if (!allowedStatuses.includes(status)) {
            return res.status(400).json({
                success: false,
                message: "Invalid complaint status."
            });
        }

        const result = await complaintsCollection.updateOne(
            { complaintId: req.params.id },
            { $set: { status } }
        );

        if (result.matchedCount === 0) {
            return res.status(404).json({
                success: false,
                message: "Complaint not found."
            });
        }

        res.json({
            success: true,
            message: "Complaint status updated."
        });
    } catch (error) {
        console.error("Updating complaint status error:", error);
        res.status(500).json({
            success: false,
            message: "Unable to update complaint status."
        });
    }
});

async function startServer() {
    if (!MONGODB_URI) {
        console.error("Missing MONGODB_URI environment variable.");
        process.exit(1);
    }

    if (!TOKEN_SECRET) {
        console.error("Missing TOKEN_SECRET environment variable.");
        process.exit(1);
    }

    const client = new MongoClient(MONGODB_URI);

    try {
        await client.connect();

        const database = client.db("jansahayak");
        complaintsCollection = database.collection("complaints");

        console.log("MONGODB CONNECTED");
        console.log("Database: jansahayak");
        console.log("Collection: complaints");

        app.listen(PORT, "0.0.0.0", () => {
            console.log("JANSAHAYAK BACKEND");
            console.log("Server running on port:", PORT);
        });
    } catch (error) {
        console.error("MongoDB connection failed:", error);
        process.exit(1);
    }
}

startServer();
