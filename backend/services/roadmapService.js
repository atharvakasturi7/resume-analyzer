const Groq = require("groq-sdk");

const groq = new Groq({
    apiKey: process.env.GROQ_API_KEY,
});

async function analyzeRoadmap(resumeText, jobDescription) {
    try {
        // Input Validation
        if (!resumeText || typeof resumeText !== "string" || !resumeText.trim()) {
            throw new Error("resumeText is required");
        }

        if (!jobDescription || typeof jobDescription !== "string" || !jobDescription.trim()) {
            throw new Error("jobDescription is required");
        }

        // Prevent extremely large payloads
        const MAX_CHARS = 15000;

        resumeText = resumeText.slice(0, MAX_CHARS);
        jobDescription = jobDescription.slice(0, MAX_CHARS);

        console.log("Sending Resume + Job Description to Groq for Career Roadmap...");

        const response = await groq.chat.completions.create({
            model: "llama-3.3-70b-versatile",
            response_format: {
                type: "json_object"
            },
            temperature: 0.1,
            messages: [
                {
                    role: "system",
                    content: `
You are an expert AI Career Coach and Software Engineering Mentor.

Your job is to compare the candidate's resume with the provided job description and generate a practical, realistic career improvement roadmap that helps the candidate become a stronger fit for the target role.

IMPORTANT

- You are NOT calculating the candidate's current Resume-to-Job Match Score.
- You are ONLY predicting a realistic future match score AFTER the candidate completes the recommended learning roadmap.
- Your recommendations must be evidence-based and derived only from the resume and the job description.

OBJECTIVE

Compare the resume against the job description and identify only the skills, technologies, frameworks, tools, databases, cloud platforms, testing frameworks, software engineering concepts, or knowledge areas that are clearly important for the target role but are NOT clearly demonstrated in the resume.
Then generate a realistic and practical career improvement roadmap.

SKILL IDENTIFICATION RULES

Before recommending any skill:

1. Search the ENTIRE resume, including:
   - Skills
   - Work Experience
   - Projects
   - Certifications
   - Publications
   - Technical Summary

2. Consider equivalent technologies and commonly accepted aliases before deciding a skill is missing.

3. Do NOT recommend a skill if the resume clearly demonstrates practical experience with it.

4. If the resume shows only limited or indirect experience with a technology, prefer recommending more advanced learning in that area instead of treating it as completely missing.

5. Recommend only genuine knowledge gaps that would significantly improve the candidate's suitability for the target role.

RULES

1. Use evidence strictly from the resume and the job description.
2. Never assume the candidate knows something unless it is clearly demonstrated in the resume.
3. Do not recommend skills that are already clearly demonstrated in the resume.
4. Do not include vague generic skills such as "communication", "teamwork", "leadership", "problem solving", or "hardworking" unless they are explicitly required in the job description and are central to the role.
5. Treat technologies, frameworks, tools, databases, cloud platforms, testing frameworks, programming concepts, software engineering concepts, and knowledge areas as skills when categorizing priorities.
6. Prioritize recommendations based on their importance, frequency, and relevance in the job description.
6.1 If multiple missing skills contribute to the same learning objective, prioritize recommending the most foundational skill rather than listing every related technology.
Example:
Recommend Docker before Kubernetes.
Recommend React before Next.js.
Recommend SQL before Prisma.
7. High priority skills should represent the most important learning goals that the candidate should learn FIRST because they have the greatest impact on improving suitability for the role.
8. Medium priority skills should be useful supporting skills that should be learned after the high priority skills.
9. Low priority skills should be optional, secondary, or nice-to-have skills that provide additional value but are not major hiring requirements.
10. A skill must appear in only ONE category. Never repeat the same skill across multiple categories.
11. Use concise and industry-standard names for skills, for example:
    - React
    - Docker
    - REST APIs
    - JWT Authentication
    - MongoDB Aggregation
    - Unit Testing
    - CI/CD
12. recommendedProjects must contain 3 to 5 practical portfolio-quality project ideas that directly help the candidate learn the missing high and medium priority skills.
13. Every recommended project must:
    - be realistic for an individual developer,
    - be suitable for a software engineering portfolio,
    - be resume-friendly,
    - be concise,
    - focus on different combinations of missing skills,
    - avoid suggesting multiple variations of the same project.
14. estimatedLearningTime must be a realistic estimate based on the candidate's current skill level inferred from the resume.
15. estimatedLearningTime must be a single concise string such as:
    - "4-6 weeks"
    - "2-3 months"
    - "3-4 months"
    - "6 months"
16. potentialMatchScoreAfterLearning must be a realistic INTEGER between 0 and 100.
17. Do NOT assume completing the roadmap guarantees a perfect match. Consider remaining factors such as years of experience, domain expertise, certifications, and seniority before estimating the future score.
18. If the resume is already a strong match, keep all priority skill arrays small and recommend only advanced or specialization topics instead of inventing unnecessary gaps.
19. If there is insufficient evidence for any category, return an empty array for that category.
20. Every array must contain UNIQUE items only.
21. Return ONLY valid JSON.
22. Do NOT return markdown.
23. Do NOT return code fences.
24. Do NOT include explanations.
25. Do NOT include comments.
26. Do NOT include any additional keys.

Return ONLY the JSON object.
`
                },
                {
                    role: "user",
                    content: `
Compare the resume against the job description and generate a career improvement roadmap.

Return JSON in EXACTLY this format:

{
  "highPrioritySkills": [],
  "mediumPrioritySkills": [],
  "lowPrioritySkills": [],
  "recommendedProjects": [],
  "estimatedLearningTime": "",
  "potentialMatchScoreAfterLearning": 0
}

FIELD RULES

* highPrioritySkills must contain the most important missing skills to learn first.
* mediumPrioritySkills must contain useful supporting skills to learn after the high priority skills.
* lowPrioritySkills must contain secondary or optional skills that are helpful but not major blockers.
* recommendedProjects must contain 3-5 practical, distinct, portfolio-quality project ideas.
* estimatedLearningTime must be a concise string.
* potentialMatchScoreAfterLearning must be an integer from 0 to 100.

* If no skills belong in a category, return an empty array.
* Do not return strings such as "None", "N/A", or "No skills".

VALIDATION RULES

* Do not recommend reviewing or relearning skills that are already clearly demonstrated through projects, work experience, or the technical skills section. Focus on genuine knowledge gaps or meaningful next-level skills.
* Do not repeat the same skill across multiple categories.
* Do not include extra keys.
* Return valid JSON only.

====================
RESUME
====================

${resumeText}

====================
JOB DESCRIPTION
====================

${jobDescription}
`
                }
            ]
        });

        console.log("Career Roadmap Analysis Received.");

        const rawContent = response?.choices?.[0]?.message?.content;

        if (!rawContent) {
            throw new Error("Empty AI response");
        }

        let parsedResult;

        try {
            parsedResult = JSON.parse(rawContent);
        } catch (parseError) {
            console.error("Invalid JSON:", rawContent);
            throw new Error("Invalid JSON returned by AI");
        }

        // Validation
        if (
            typeof parsedResult.estimatedLearningTime !== "string" ||
            !parsedResult.estimatedLearningTime.trim() ||
            !Number.isFinite(parsedResult.potentialMatchScoreAfterLearning) ||
            !Array.isArray(parsedResult.highPrioritySkills) ||
            !Array.isArray(parsedResult.mediumPrioritySkills) ||
            !Array.isArray(parsedResult.lowPrioritySkills) ||
            !Array.isArray(parsedResult.recommendedProjects)
        ) {
            throw new Error("Invalid AI response format");
        }

        // Score Sanitization
        parsedResult.potentialMatchScoreAfterLearning = Math.max(
            0,
            Math.min(100, Math.round(parsedResult.potentialMatchScoreAfterLearning))
        );

        const sanitizeArray = (arr) =>
            [...new Set(
                (arr || [])
                    .filter(item => typeof item === "string")
                    .map(item => item.trim())
                    .filter(Boolean)
            )];

        parsedResult.highPrioritySkills =
            sanitizeArray(parsedResult.highPrioritySkills)
                .map(skill => skill.slice(0, 50))
                .slice(0, 10);
        parsedResult.mediumPrioritySkills =
            sanitizeArray(parsedResult.mediumPrioritySkills)
                .map(skill => skill.slice(0, 50))
                .slice(0, 10);
        parsedResult.lowPrioritySkills =
            sanitizeArray(parsedResult.lowPrioritySkills).map(skill => skill.slice(0, 50)).slice(0, 10);
        parsedResult.recommendedProjects =
            sanitizeArray(parsedResult.recommendedProjects)
                .map(project => project.slice(0, 100))
                .slice(0, 5);
        parsedResult.estimatedLearningTime =
            parsedResult.estimatedLearningTime.trim().slice(0, 30);

        return parsedResult;
    } catch (error) {
        console.error("Groq Roadmap Error:", error);
        throw error;
    }
}

module.exports = {
    analyzeRoadmap,
};