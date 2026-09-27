require("dotenv").config();

const express = require("express");
const cookieParser = require("cookie-parser");

const connectToDB = require("./src/config/database");
const authRouter = require("./src/routes/auth.routes");
const interviewRouter = require("./src/routes/interview.routes");

const app = express();

const allowedOrigin =
  "https://gen-ai-project-frontend-q7cx5ge3t-sahil-03cf.vercel.app";

app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", allowedOrigin);
  res.header("Access-Control-Allow-Credentials", "true");
  res.header(
    "Access-Control-Allow-Methods",
    "GET,POST,PUT,PATCH,DELETE,OPTIONS"
  );
  res.header(
    "Access-Control-Allow-Headers",
    "Content-Type, Authorization"
  );

  if (req.method === "OPTIONS") {
    return res.sendStatus(204);
  }

  next();
});

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

app.use("/api/auth", authRouter);
app.use("/api/interview", interviewRouter);

app.get("/api/health", (req, res) => {
  res.json({
    status: "ok",
  });
});

module.exports = app;

connectToDB()
  .then(() => {
    console.log("Connected to Database");
  })
  .catch((err) => {
    console.error("Could not connect to MongoDB:", err.message);
    process.exit(1);
  });

if (process.env.NODE_ENV !== "production") {
  app.listen(3000, () => {
    console.log("Server is running on port 3000");
  });
}