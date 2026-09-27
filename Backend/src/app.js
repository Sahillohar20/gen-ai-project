const express = require("express");
const cookieParser = require("cookie-parser");

const authRouter = require("./routes/auth.routes");
const interviewRouter = require("./routes/interview.routes");

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

app.use("/api/auth", authRouter);
app.use("/api/interview", interviewRouter);

app.get("/", (req, res) => {
  res.json({ message: "Backend API is running" });
});

module.exports = app;