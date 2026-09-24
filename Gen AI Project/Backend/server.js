require("dotenv").config();

const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");

const connectToDB = require("./src/config/database");
const authRouter = require("./src/routes/auth.routes");
const interviewRouter = require("./src/routes/interview.routes");



const app = express();

// Set FRONTEND_URL in Vercel's env vars to your deployed frontend's exact
// URL (e.g. https://your-frontend.vercel.app), with no trailing slash.
const allowedOrigins = [
  "http://localhost:5173",
  process.env.FRONTEND_URL
].filter(Boolean);

app.use(cors({
  origin: allowedOrigins,
  credentials: true
} ));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

app.use("/api/auth", authRouter);
app.use("/api/interview", interviewRouter);

app.get("/api/health", (req, res) => {
  res.json({ status: "ok" });
});

module.exports = app;

connectToDB().catch((err) => {
  console.error("Could not connect to MongoDB:", err.message);
  // On a long-running local/server process it's safer to exit than keep
  // serving requests with no DB. On Vercel's serverless runtime, process.exit
  // would kill the whole function instance for every request, so just log there.
  if (process.env.VERCEL === undefined) {
    process.exit(1);
  }
});

if (process.env.NODE_ENV !== "production") {
  app.listen(3000, () => {
    console.log("Server is running on port 3000");
  });
}
