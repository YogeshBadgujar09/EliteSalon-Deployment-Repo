const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const path = require("path");
require("dotenv").config();

const app = express();

const allowedOrigins = (process.env.FRONTEND_URL || "http://localhost:3000")
  .split(",")
  .map((origin) => origin.trim().replace(/\/$/, ""))
  .filter(Boolean);

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (e.g., mobile apps, curl, server-to-server)
      if (!origin) return callback(null, true);
      const normalized = origin.replace(/\/$/, "");
      if (allowedOrigins.includes(normalized)) {
        return callback(null, true);
      }
      return callback(new Error("Not allowed by CORS"));
    },
    credentials: true,
  })
);

app.use(express.json());

const uploadDir = process.env.UPLOAD_DIR || path.join(__dirname, "uploads");
const profilesDir = path.join(__dirname, "profiles");

app.use("/uploads/default", express.static(profilesDir));
app.use("/default", express.static(profilesDir));
app.use("/uploads", express.static(uploadDir));

// Connect to MongoDB
const mongoUrl = process.env.MONGO_URL || "mongodb://127.0.0.1:27017/elitesaloon";
mongoose
  .connect(mongoUrl)
  .then(() => console.log("MongoDB connected"))
  .catch((err) => console.error("MongoDB connection error:", err));

app.get("/health", (req, res) => {
  res.status(200).json({ status: "ok" });
});

app.use("/customer", require("./routes/customerRoutes"));
app.use("/owner", require("./routes/ownerRoutes"));
app.use("/admin", require("./routes/adminRoutes"));
app.use("/appointment", require("./routes/appointmentRoutes"));
app.use("/subscription", require("./routes/subscriptionRouter"));
app.use("/payment", require("./routes/paymentRoutes"));
app.use("/guest", require("./routes/guestRoutes"));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
