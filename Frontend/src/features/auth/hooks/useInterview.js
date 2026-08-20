import {
    getAllInterviewReports,
    generateInterviewReport,
    getInterviewReportById
} from "../../interview/services/interview.api";

import { useContext } from "react";
import { InterviewContext } from "../../interview/interview.context";

export const useInterview = () => {

    const context = useContext(InterviewContext);

    if (!context) {
        throw new Error(
            "useInterview must be used within an InterviewProvider"
        );
    }

    const {
        loading,
        setLoading,
        report,
        setReport,
        reports,
        setReports
    } = context;

    // Generate report
    const generateReport = async ({
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

            console.log("Generated report:", response);

            setReport(response.interviewReport);

            return response.interviewReport;

        } catch (error) {

            console.error(
                "Generate report error:",
                error.response?.data || error.message
            );

            throw error;

        } finally {

            setLoading(false);

        }
    };


    // Get report by ID
    const getReportById = async (interviewId) => {

        setLoading(true);

        try {

            const response = await getInterviewReportById(interviewId);

            console.log("Fetched report:", response);

            setReport(response.interviewReport);

            return response.interviewReport;

        } catch (error) {

            console.error(
                "Get report error:",
                error.response?.data || error.message
            );

            throw error;

        } finally {

            setLoading(false);

        }
    };


    // Get all reports
    const getReports = async () => {

        setLoading(true);

        try {

            const response = await getAllInterviewReports();

            console.log("All reports:", response);

            setReports(response.interviewReports);

            return response.interviewReports;

        } catch (error) {

            console.error(
                "Get reports error:",
                error.response?.data || error.message
            );

            throw error;

        } finally {

            setLoading(false);

        }
    };


    return {
        loading,
        report,
        reports,
        generateReport,
        getReports,
        getReportById
    };
};