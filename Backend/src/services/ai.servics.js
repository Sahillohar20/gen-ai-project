const { GoogleGenAI } = require("@google/genai");

const { z } = require("zod");
const { zodToJsonSchema } = require("zod-to-json-schema")
const puppeteer = require("puppeteer")

const ai = new GoogleGenAI({
    apiKey: process.env.GOOGLE_GENAI_API_KEY
})


const interviewReportSchema = z.object({
    matchScore: z.number().describe("A score between 0 and 100 indicating how well the candidate's profile matches the job describe"),
    technicalQuestions: z.array(z.object({
        question: z.string().describe("The technical question can be asked in the interview"),
        intention: z.string().describe("The intention of interviewer behind asking this question"),
        answer: z.string().describe("How to answer this question, what points to cover, what approach to take etc.")
    })).describe("Technical questions that can be asked in the interview along with their intention and how to answer them"),
    behavioralQuestions: z.array(z.object({
        question: z.string().describe("The technical question can be asked in the interview"),
        intention: z.string().describe("The intention of interviewer behind asking this question"),
        answer: z.string().describe("How to answer this question, what points to cover, what approach to take etc.")
    })).describe("Behavioral questions that can be asked in the interview along with their intention and how to answer them"),
    skillGaps: z.array(z.object({
        skill: z.string().describe("The skill which the candidate is lacking"),
        severity: z.enum([ "low", "medium", "high" ]).describe("The severity of this skill gap, i.e. how important is this skill for the job and how much it can impact the candidate's chances")
    })).describe("List of skill gaps in the candidate's profile along with their severity"),
    preparationPlan: z.array(z.object({
        day: z.number().describe("The day number in the preparation plan, starting from 1"),
        focus: z.string().describe("The main focus of this day in the preparation plan, e.g. data structures, system design, mock interviews etc."),
        tasks: z.array(z.string()).describe("List of tasks to be done on this day to follow the preparation plan, e.g. read a specific book or article, solve a set of problems, watch a video etc.")
    })).describe("A day-wise preparation plan for the candidate to follow in order to prepare for the interview effectively"),
    title: z.string().describe("The title of the job for which the interview report is generated"),
})

async function generateWithRetry(request, attempts = 4) {
    let lastError;

    for (let attempt = 0; attempt < attempts; attempt += 1) {
        try {
            return await ai.models.generateContent(request);
        } catch (error) {
            lastError = error;

            if (![429, 500, 503].includes(error.status)) {
                throw error;
            }

            const delay = 3000 * 2 ** attempt;
            console.log(`Gemini busy. Retrying in ${delay / 1000} seconds...`);
            await new Promise((resolve) => setTimeout(resolve, delay));
        }
    }

    throw lastError;
}

function parseJsonResponse(text) {
    if (typeof text !== "string") {
        throw new Error("Gemini returned an empty response");
    }

    const cleaned = text
        .replace(/^```(?:json)?\s*/i, "")
        .replace(/\s*```$/i, "")
        .trim();

    try {
        return JSON.parse(cleaned);
    } catch (error) {
        console.error("Invalid Gemini JSON response:", cleaned.slice(0, 1000));
        throw new Error("Gemini returned invalid JSON");
    }
}

function asArray(value, itemKeys) {
    if (Array.isArray(value)) return value;
    if (!value || typeof value !== "object") return [];

    if (itemKeys.some((key) => Object.prototype.hasOwnProperty.call(value, key))) {
        return [value];
    }

    return Object.values(value).filter((item) => item && typeof item === "object");
}

function normalizeInterviewReport(rawReport) {
    const report = rawReport?.interviewReport ?? rawReport?.report ?? rawReport ?? {};

    return {
        title: report.title || report.jobTitle || "Interview Preparation Plan",
        matchScore: Number(report.matchScore ?? report.match_score ?? 0),
        technicalQuestions: asArray(
            report.technicalQuestions ?? report.technical_questions ?? report.technical,
            ["question", "intention", "answer"]
        ),
        behavioralQuestions: asArray(
            report.behavioralQuestions ?? report.behavioral_questions ?? report.behavioral,
            ["question", "intention", "answer"]
        ),
        skillGaps: asArray(
            report.skillGaps ?? report.skill_gaps,
            ["skill", "severity"]
        ),
        preparationPlan: asArray(
            report.preparationPlan ?? report.preparation_plan ?? report.roadmap,
            ["day", "focus", "tasks"]
        )
    };
}

async function generateInterviewReport({ resume, selfDescription, jobDescription }) {
    const prompt = `Generate a complete interview preparation report as JSON for this candidate.

Candidate resume:
${resume || "Not provided"}

Candidate self-description:
${selfDescription || "Not provided"}

Job description:
${jobDescription}

The JSON must contain these exact fields and must not omit any field:
{
  "title": "short job title",
  "matchScore": 0,
  "technicalQuestions": [{ "question": "", "intention": "", "answer": "" }],
  "behavioralQuestions": [{ "question": "", "intention": "", "answer": "" }],
  "skillGaps": [{ "skill": "", "severity": "low" }],
  "preparationPlan": [{ "day": 1, "focus": "", "tasks": [""] }]
}
Return only valid JSON. Generate useful non-empty content for every array.`;

    const response = await generateWithRetry({
        model: "gemini-3.6-flash",
        contents: prompt,
        config: {
            responseMimeType: "application/json"
        }
    });

    console.log("Raw Gemini interview response:", response.text);
    const parsed = parseJsonResponse(response.text);
    const normalized = normalizeInterviewReport(parsed);

    if (!normalized.technicalQuestions.length || !normalized.behavioralQuestions.length || !normalized.preparationPlan.length) {
        throw new Error("Gemini returned an incomplete interview report");
    }

    return normalized;
}



async function generatePdfFromHtml(htmlContent) {
    const browser = await puppeteer.launch()
    const page = await browser.newPage();
    await page.setContent(htmlContent, { waitUntil: "networkidle0" })

    const pdfBuffer = await page.pdf({
        format: "A4", margin: {
            top: "20mm",
            bottom: "20mm",
            left: "15mm",
            right: "15mm"
        }
    })

    await browser.close()

    return pdfBuffer
}

async function generateResumePdf({ resume, selfDescription, jobDescription }) {

    const resumePdfSchema = z.object({
        html: z.string().describe("The HTML content of the resume which can be converted to PDF using any library like puppeteer")
    })

    const prompt = `Generate resume for a candidate with the following details:
                        Resume: ${resume}
                        Self Description: ${selfDescription}
                        Job Description: ${jobDescription}

                        the response should be a JSON object with a single field "html" which contains the HTML content of the resume which can be converted to PDF using any library like puppeteer.
                        The resume should be tailored for the given job description and should highlight the candidate's strengths and relevant experience. The HTML content should be well-formatted and structured, making it easy to read and visually appealing.
                        The content of resume should be not sound like it's generated by AI and should be as close as possible to a real human-written resume.
                        you can highlight the content using some colors or different font styles but the overall design should be simple and professional.
                        The content should be ATS friendly, i.e. it should be easily parsable by ATS systems without losing important information.
                        The resume should not be so lengthy, it should ideally be 1-2 pages long when converted to PDF. Focus on quality rather than quantity and make sure to include all the relevant information that can increase the candidate's chances of getting an interview call for the given job description.
                    `

    const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: prompt,
        config: {
            responseMimeType: "application/json",
            responseSchema: zodToJsonSchema(resumePdfSchema),
        }
    })


    const jsonContent = JSON.parse(response.text)

    const pdfBuffer = await generatePdfFromHtml(jsonContent.html)

    return pdfBuffer

}

module.exports = { generateInterviewReport, generateResumePdf }