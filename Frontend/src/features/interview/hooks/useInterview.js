import { useContext, useEffect, useCallback } from "react";
import { useParams } from "react-router-dom";
import { InterviewContext } from "../interview.context";
import {
  getAllInterviewReports,
  generateInterviewReport,
  getInterviewReportById,
  deleteInterviewReport,
  generateResumePdf
} from "../services/interview.api";

export const useInterview = () => {
  const context = useContext(InterviewContext);
  const { interviewId } = useParams();

  if (!context) {
    throw new Error("useInterview must be used within an InterviewProvider");
  }

  const {
    loading,
    setLoading,
    report,
    setReport,
    reports = [],
    setReports
  } = context;

  const generateReport = useCallback(async ({
    jobDescription,
    selfDescription,
    resumeFile
  }) => {
    setLoading(true);

    try {
      const response = await generateInterviewReport({
        jobDescription,
        selfDescription,
        resumeFile
      });

      console.log("Generate report API response:", response);

      const interviewReport =
        response?.interviewReport ??
        response?.report ??
        response?.data?.interviewReport ??
        response?.data ??
        response;

      if (!interviewReport?._id && !interviewReport?.id) {
        throw new Error(
          "The server did not return a valid interview report. Check the Network response for /api/interview/."
        );
      }

      const normalizedReport = {
        ...interviewReport,
        _id: interviewReport._id ?? interviewReport.id
      };

      setReport(normalizedReport);
      return normalizedReport;
    } finally {
      setLoading(false);
    }
  }, [setLoading, setReport]);

  const getReportById = useCallback(async (id) => {
    setLoading(true);

    try {
      const response = await getInterviewReportById(id);
      const interviewReport = response?.interviewReport ?? response?.report;

      if (!interviewReport) {
        throw new Error("Interview report was not found in the response");
      }

      setReport(interviewReport);
      return interviewReport;
    } finally {
      setLoading(false);
    }
  }, [setLoading, setReport]);

  const getReports = useCallback(async () => {
    setLoading(true);

    try {
      const response = await getAllInterviewReports();
      const interviewReports = Array.isArray(response?.interviewReports)
        ? response.interviewReports
        : [];

      setReports(interviewReports);
      return interviewReports;
    } finally {
      setLoading(false);
    }
  }, [setLoading, setReports]);

  const deleteReport = useCallback(async (id) => {
    setLoading(true);

    try {
      await deleteInterviewReport(id);
      setReports((currentReports) =>
        currentReports.filter((item) => (item._id ?? item.id) !== id)
      );

      if ((report?._id ?? report?.id) === id) {
        setReport(null);
      }
    } finally {
      setLoading(false);
    }
  }, [report, setLoading, setReport, setReports]);

  const getResumePdf = useCallback(async (id) => {
    setLoading(true);

    try {
      const pdfData = await generateResumePdf({ interviewReportId: id });
      const url = window.URL.createObjectURL(
        new Blob([pdfData], { type: "application/pdf" })
      );
      const link = document.createElement("a");
      link.href = url;
      link.download = `resume_${id}.pdf`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } finally {
      setLoading(false);
    }
  }, [setLoading]);

  useEffect(() => {
    if (interviewId) {
      getReportById(interviewId).catch((error) => {
        console.error("Could not load interview report:", error);
      });
    } else {
      getReports().catch((error) => {
        console.error("Could not load interview reports:", error);
      });
    }
  }, [interviewId, getReportById, getReports]);

  return {
    loading,
    report,
    reports,
    generateReport,
    getReportById,
    getReports,
    deleteReport,
    getResumePdf
  };
};

