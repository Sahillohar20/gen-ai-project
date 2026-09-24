const interviewReportModel = require("../models/interviewReport.model");
const {
  generateInterviewReport,
  generateResumePdf
} = require("../services/ai.servics");

function resumeToText(file) {
  if (!file?.buffer) return "";
  return file.buffer.toString("base64");
}

function ensureObjectArray(value, keys) {
  if (Array.isArray(value)) {
    return value.filter((item) => item && typeof item === "object");
  }

  if (!value || typeof value !== "object") {
    return [];
  }

  if (keys.some((key) => Object.prototype.hasOwnProperty.call(value, key))) {
    return [value];
  }

  return Object.values(value).filter(
    (item) => item && typeof item === "object"
  );
}

async function generateInterViewReportController(req, res) {
  try {
    const { jobDescription = "", selfDescription = "" } = req.body;
    const resume = resumeToText(req.file);

    if (!jobDescription.trim()) {
      return res.status(400).json({ message: "Job description is required" });
    }

    if (!resume && !selfDescription.trim()) {
      return res.status(400).json({
        message: "Upload a resume or provide a self-description"
      });
    }

    const generatedReport = await generateInterviewReport({
      resume,
      selfDescription,
      jobDescription
    });

    const fallbackTitle =
      jobDescription
        .split("\\n")
        .map((line) => line.trim())
        .find(Boolean)
        ?.slice(0, 120) || "Interview Preparation Plan";

    const normalizedReport = {
      ...generatedReport,
      title:
        typeof generatedReport?.title === "string" && generatedReport.title.trim()
          ? generatedReport.title.trim()
          : fallbackTitle,
      technicalQuestions: ensureObjectArray(
        generatedReport?.technicalQuestions,
        ["question", "intention", "answer"]
      ),
      behavioralQuestions: ensureObjectArray(
        generatedReport?.behavioralQuestions,
        ["question", "intention", "answer"]
      ),
      skillGaps: ensureObjectArray(
        generatedReport?.skillGaps,
        ["skill", "severity"]
      ),
      preparationPlan: ensureObjectArray(
        generatedReport?.preparationPlan,
        ["day", "focus", "tasks"]
      )
    };

    console.log("Report data before save:", {
      matchScore: normalizedReport.matchScore,
      technicalQuestions: normalizedReport.technicalQuestions.length,
      behavioralQuestions: normalizedReport.behavioralQuestions.length,
      skillGaps: normalizedReport.skillGaps.length,
      preparationPlan: normalizedReport.preparationPlan.length
    });

    const interviewReport = await interviewReportModel.create({
      ...normalizedReport,
      jobDescription,
      resume,
      selfDescription,
      user: req.user.id
    });

    const reportData = interviewReport.toObject();

    return res.status(201).json({
      message: "Interview report generated successfully",
      interviewReport: {
        ...reportData,
        _id: reportData._id.toString(),
        id: reportData._id.toString()
      }
    });
  } catch (error) {
    console.error("Generate interview report error:", error);
    return res.status(500).json({
      message: error.message || "Could not generate interview report"
    });
  }
}

async function getInterviewReportByIdController(req, res) {
  try {
    const interviewReport = await interviewReportModel.findOne({
      _id: req.params.interviewId,
      user: req.user.id
    });

    if (!interviewReport) {
      return res.status(404).json({ message: "Interview report not found" });
    }

    return res.status(200).json({ interviewReport });
  } catch (error) {
    console.error("Get interview report error:", error);
    return res.status(400).json({ message: "Invalid interview report ID" });
  }
}

async function getAllInterviewReportsController(req, res) {
  try {
    const interviewReports = await interviewReportModel
      .find({ user: req.user.id })
      .sort({ createdAt: -1 });

    return res.status(200).json({ interviewReports });
  } catch (error) {
    console.error("Get interview reports error:", error);
    return res.status(500).json({ message: "Could not fetch interview reports" });
  }
}

async function deleteInterviewReportController(req, res) {
  try {
    const deletedReport = await interviewReportModel.findOneAndDelete({
      _id: req.params.interviewId,
      user: req.user.id
    });

    if (!deletedReport) {
      return res.status(404).json({
        message: "Interview report not found"
      });
    }

    return res.status(200).json({
      message: "Interview report deleted successfully",
      interviewReportId: req.params.interviewId
    });
  } catch (error) {
    console.error("Delete interview report error:", error);
    return res.status(400).json({
      message: "Invalid interview report ID"
    });
  }
}

async function generateResumePdfController(req, res) {
  try {
    const interviewReport = await interviewReportModel.findOne({
      _id: req.params.interviewReportId,
      user: req.user.id
    });

    if (!interviewReport) {
      return res.status(404).json({ message: "Interview report not found" });
    }

    const pdfBuffer = await generateResumePdf({
      resume: interviewReport.resume,
      selfDescription: interviewReport.selfDescription,
      jobDescription: interviewReport.jobDescription
    });

    res.set({
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="resume_${interviewReport._id}.pdf"`
    });

    return res.status(200).send(pdfBuffer);
  } catch (error) {
    console.error("Generate resume PDF error:", error);
    return res.status(500).json({ message: "Could not generate resume PDF" });
  }
}

module.exports = {
  generateInterViewReportController,
  getInterviewReportByIdController,
  getAllInterviewReportsController,
  deleteInterviewReportController,
  generateResumePdfController
};

