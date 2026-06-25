const Groq = require("groq-sdk");

const groq = new Groq({
    apiKey: process.env.GROQ_API_KEY,
});

async function analyzeJobMatch(resumeText, jobDescription) {
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

        console.log("Sending Resume + Job Description to Groq...");

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
You are a strict senior technical recruiter with 15+ years of experience hiring software engineers, developers, analysts, and technology professionals.

Your task is to compare a resume against a job description and provide a realistic hiring assessment.

IMPORTANT RULES

- Evaluate ONLY what is explicitly present in the resume.
- Never assume missing skills, experience, certifications, or qualifications.
- Do not reward repeated keywords more than once.
- Be conservative and realistic.
- Weak matches should receive weak scores.
- Strong matches require evidence.
- If a skill is marked as "learning", "currently learning",
  "basic knowledge", "beginner", or "familiar with",
  do NOT treat it as a full skill match.
  Add it to partialSkills instead of matchedSkills.




TECHNOLOGY ALIAS RULES

Treat these as equivalent:

* React = React.js
* Node = Node.js
* Mongo = MongoDB
* JS = JavaScript
* TS = TypeScript
* Express = Express.js
* PostgreSQL = Postgres
* AWS EC2 = EC2
* REST API = REST APIs

SENIORITY RULES

* Student or fresher applying for a role requiring 2+ years experience must score below 50.
* Student or fresher applying for internships may still score highly.
* Junior applying for Senior role should be penalized heavily.
* Missing required professional experience should reduce score significantly.

SCORING PHILOSOPHY

* Start mentally at 30.
* Add points only when evidence exists.
* Missing required skills must reduce the score.
* Missing required experience must reduce the score.
* Most matches should naturally fall between 30 and 70.
* Scores above 80 should be uncommon.
* Scores above 90 should be extremely rare.

Return ONLY valid JSON.

No markdown.
No explanations.
No code blocks.

Only the JSON object.

The JSON must contain EXACTLY these keys:

matchScore
matchLevel
summary
matchedSkills
missingSkills
partialSkills
experienceGap
seniorityAlignment
suggestions
`
                },
                {
                    role: "user",
                    content: `
Compare the resume against the job description.

Return JSON in EXACTLY this format:

{
"matchScore": 0,
"matchLevel": "",
"summary": "",
"matchedSkills": [],
"missingSkills": [],
"partialSkills": [],
"experienceGap": "",
"seniorityAlignment": "",
"suggestions": []
}

FIELD RULES

* matchScore must be an integer from 0 to 100.

* matchLevel must be one of:
  "Excellent Match"
  "Strong Match"
  "Moderate Match"
  "Weak Match"
  "Poor Match"

* summary must be 2-3 sentences.

* matchedSkills must contain skills found in BOTH resume and JD.

* missingSkills must contain important JD requirements missing from the resume.

* partialSkills must contain weak or partial matches.
* Skills marked as "learning", "currently learning", "basic knowledge",
  "beginner", or "familiar with" must be placed in partialSkills.
* Such skills should not receive full match credit.

* experienceGap must be a single sentence.

* seniorityAlignment must be one of:
  "Overqualified"
  "Well Aligned"
  "Slightly Junior"
  "Significantly Junior"
  "Mismatched"

* suggestions must contain 3-5 actionable recommendations.

* If no skills are missing, return:
  "missingSkills": []
  Do not return strings such as "None", "N/A", or "No missing skills".

MATCHING CRITERIA

1. Technical Skills (35%)

* Required technologies
* Frameworks
* Languages
* Databases
* Tools

2. Experience Relevance (25%)

* Professional experience
* Internship experience
* Project experience
* Years of experience

3. Education Alignment (15%)

* Degree relevance
* Certifications
* Academic background

4. Project Relevance (15%)

* Technologies used
* Project complexity
* Real-world applicability

5. Role Alignment (10%)

* Domain fit
* Keywords
* Responsibilities

MATCH LEVELS

85-100 = Excellent Match
70-84 = Strong Match
55-69 = Moderate Match
40-54 = Weak Match
0-39 = Poor Match

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

        console.log("Job Match Analysis Received.");

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

        const validMatchLevels = [
            "Excellent Match",
            "Strong Match",
            "Moderate Match",
            "Weak Match",
            "Poor Match"
        ];

        const validSeniorityAlignments = [
            "Overqualified",
            "Well Aligned",
            "Slightly Junior",
            "Significantly Junior",
            "Mismatched"
        ];

        // Validation
        if (
            typeof parsedResult.matchScore !== "number" ||
            typeof parsedResult.matchLevel !== "string" ||
            typeof parsedResult.summary !== "string" ||
            typeof parsedResult.experienceGap !== "string" ||
            typeof parsedResult.seniorityAlignment !== "string" ||
            !Array.isArray(parsedResult.matchedSkills) ||
            !Array.isArray(parsedResult.missingSkills) ||
            !Array.isArray(parsedResult.partialSkills) ||
            !Array.isArray(parsedResult.suggestions)
        ) {
            throw new Error("Invalid AI response format");
        }

        if (!validMatchLevels.includes(parsedResult.matchLevel)) {
            throw new Error("Invalid match level");
        }

        if (!validSeniorityAlignments.includes(parsedResult.seniorityAlignment)) {
            throw new Error("Invalid seniority alignment");
        }

        // Score Sanitization
        parsedResult.matchScore = Math.max(
            0,
            Math.min(100, Math.round(parsedResult.matchScore))
        );

        const sanitizeArray = (arr) =>
            [...new Set(
                (arr || [])
                    .filter(item => typeof item === "string")
                    .map(item => item.trim())
                    .filter(Boolean)
            )];

        parsedResult.matchedSkills =
            sanitizeArray(parsedResult.matchedSkills).slice(0, 15);

        parsedResult.missingSkills =
            sanitizeArray(parsedResult.missingSkills).slice(0, 15);

        parsedResult.partialSkills =
            sanitizeArray(parsedResult.partialSkills).slice(0, 15);

        parsedResult.suggestions =
            sanitizeArray(parsedResult.suggestions).slice(0, 5);

        parsedResult.summary =
            parsedResult.summary.trim();

        parsedResult.experienceGap =
            parsedResult.experienceGap.trim();

        parsedResult.seniorityAlignment =
            parsedResult.seniorityAlignment.trim();

        parsedResult.matchLevel =
            parsedResult.matchLevel.trim();

        return parsedResult;

    } catch (error) {
        console.error("Groq Job Match Error:", error);
        throw error;
    }
}

module.exports = {
    analyzeJobMatch,
};