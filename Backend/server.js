require("dotenv").config();

const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");

const connectToDB = require("./src/config/database");
const authRouter = require("./src/routes/auth.routes");
const interviewRouter = require("./src/routes/interview.routes");



const app = express();

app.use(cors({
  origin: [
    "http://localhost:5173",
    "https://gen-ai-project-frontend-ekdpyu1jy-sahil-03cf.vercel.app"
  ],
  credentials: true
}));

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
  console.error("Could not connect to MongoDB, exiting:", err.message);
  process.exit(1);
});

if (process.env.NODE_ENV !== "production") {
  app.listen(3000, () => {
    console.log("Server is running on port 3000");
  });
}
