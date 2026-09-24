const express = require("express");

const authMiddleware = require("../middlewares/auth.middleware");
const interviewController = require("../controllers/interview.controller");
const upload = require("../middlewares/file.middleware");

console.log("upload.single =", typeof upload.single);

const interviewRouter = express.Router();


console.log("authUser:", typeof authMiddleware.authUser);

console.log(
    "generateInterViewReportController:",
    typeof interviewController.generateInterViewReportController
);

console.log(
    "getInterviewReportByIdController:",
    typeof interviewController.getInterviewReportByIdController
);

console.log(
    "getAllInterviewReportsController:",
    typeof interviewController.getAllInterviewReportsController
);

console.log(
    "generateResumePdfController:",
    typeof interviewController.generateResumePdfController
);

/**
 * POST /api/interview/
 */
interviewRouter.post(
    "/",
    authMiddleware.authUser,
    upload.single("resume"),
    interviewController.generateInterViewReportController
);

/**
 * GET /api/interview/report/:interviewId
 */
interviewRouter.get(
    "/report/:interviewId",
    authMiddleware.authUser,
    interviewController.getInterviewReportByIdController
);

/**
 * GET /api/interview/
 */
interviewRouter.get(
    "/",
    authMiddleware.authUser,
    interviewController.getAllInterviewReportsController
);

/**
 * DELETE /api/interview/report/:interviewId
 */
interviewRouter.delete(
    "/report/:interviewId",
    authMiddleware.authUser,
    interviewController.deleteInterviewReportController
);

/**
 * POST /api/interview/resume/pdf/:interviewReportId
 */
interviewRouter.post(
    "/resume/pdf/:interviewReportId",
    authMiddleware.authUser,
    interviewController.generateResumePdfController
);

module.exports = interviewRouter;