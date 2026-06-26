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

Treat the following terms as equivalent when matching resume skills with job description requirements.

Programming Languages

* JS = JavaScript
* TS = TypeScript

Frontend

* React = React.js
* ReactJS = React.js
* React JS = React.js
* Vue = Vue.js
* VueJS = Vue.js
* Vue JS = Vue.js

Backend

* Node = Node.js
* Express = Express.js

Databases

* Mongo = MongoDB
* Mongo Atlas = MongoDB Atlas
* MongoDB Atlas = MongoDB
* PostgreSQL = Postgres
* PostgreSQL = PostgreSQL
* MySQL = My SQL

APIs

* REST API = REST APIs
* RESTful API = REST APIs
* RESTful APIs = REST APIs

Authentication & Security

* JWT = JWT Authentication
* JSON Web Token = JWT Authentication
* OAuth = OAuth Authentication

Version Control

* GitHub = Github
* Git = Git Version Control

Cloud & Deployment

* AWS S3 = AWS
* AWS EC2 = AWS
* AWS Lambda = AWS
* Amazon Web Services = AWS
* DigitalOcean = Cloud Deployment
* Heroku = Cloud Deployment
* Vercel = Cloud Deployment
* Netlify = Cloud Deployment
* Render = Cloud Deployment

CI/CD

* Continuous Integration = CI/CD
* Continuous Deployment = CI/CD
* Continuous Integration / Continuous Deployment = CI/CD
* CI Pipeline = CI/CD
* CD Pipeline = CI/CD

Testing

* Jest = Unit Testing
* Jest/Enzyme = Unit Testing
* Enzyme = Unit Testing
* Integration Testing = Integration Testing

CSS

* Tailwind = Tailwind CSS
* Bootstrap = Bootstrap CSS

Containers

* Docker Compose = Docker

Communication & Collaboration

* Slack = Team Collaboration
* Trello = Project Management
* Jira = Project Management

IMPORTANT

Use these mappings ONLY to recognize equivalent technologies.

Do NOT assume broader knowledge than what is explicitly demonstrated.

Examples:

- AWS S3 does NOT imply knowledge of AWS Lambda, ECS, IAM, or CloudFormation.
- MongoDB Atlas does NOT imply advanced MongoDB administration.
- Docker Compose does NOT imply Kubernetes.
- Jest does NOT imply expertise in all testing frameworks.

Only award credit for the specific technology or its accepted alias.

SKILL MATCHING RULES

Before classifying a skill as matched, partial, or missing:

1. Search the ENTIRE resume including:
   - Skills section
   - Work experience
   - Projects
   - Certifications
   - Publications
   - Responsibilities
   - Technical summaries

2. Apply all Technology Alias Rules before determining whether a skill is missing.

3. If clear evidence exists anywhere in the resume, include the skill in matchedSkills.

4. If only limited, indirect, or related evidence exists, include the skill in partialSkills.

5. Include a skill in missingSkills ONLY if there is no meaningful evidence after checking the entire resume.

6. Never place the same skill in matchedSkills, partialSkills, and missingSkills simultaneously.

SENIORITY RULES

* Student or fresher applying for a role requiring 2+ years experience must score below 50.
* Student or fresher applying for internships may still score highly.
* Junior applying for Senior role should be penalized heavily.
* Missing required professional experience should reduce score significantly.
* If the candidate has significantly MORE relevant professional experience than required, classify seniorityAlignment as "Overqualified" unless major required skills are missing.
* Do not classify an experienced professional as "Slightly Junior" solely because they exceed the required years of experience.

Experience Evaluation Rules

1. Compare the resume's relevant professional experience with the job's required experience.

2. If the candidate exceeds the required experience by more than 2 years, classify seniorityAlignment as "Overqualified".

3. If the experience closely matches the requirement, classify as "Well Aligned".

4. Only use "Slightly Junior" or "Significantly Junior" when the candidate has LESS experience than required.

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

SKILL CLASSIFICATION PROCESS

For every important requirement in the job description:

Step 1
Search the entire resume.

Step 2
Apply the Technology Alias Rules.

Step 3
If strong evidence exists → matchedSkills.

Step 4
Else if limited evidence exists → partialSkills.

Step 5
Else → missingSkills.

A skill may appear in ONE category only.

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

* matchedSkills must include technologies found through the Technology Alias Rules.

If an equivalent technology is found using a Technology Alias Rule:

- Add it to matchedSkills if the resume clearly demonstrates practical use.
- Add it to partialSkills only if the resume indicates limited exposure.
- NEVER include that same skill in missingSkills.

Examples:

AWS S3 → AWS

Continuous Integration / Continuous Deployment → CI/CD

Jest/Enzyme → Unit Testing

JWT → JWT Authentication

MongoDB Atlas → MongoDB

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

        // ----------------------------
        // Remove duplicate skills across categories
        // ----------------------------

        const matchedSkills = new Set(
            parsedResult.matchedSkills.map(skill => skill.toLowerCase())
        );

        const partialSkills = new Set(
            parsedResult.partialSkills.map(skill => skill.toLowerCase())
        );

        parsedResult.missingSkills = parsedResult.missingSkills.filter(
            skill =>
                !matchedSkills.has(skill.toLowerCase()) &&
                !partialSkills.has(skill.toLowerCase())
        );

        // ----------------------------
        // Technology Alias Normalization
        // ----------------------------

        const aliases = {
            "react": "react.js",
            "node": "node.js",
            "express": "express.js",
            "mongodb atlas": "mongodb",
            "mongo": "mongodb",
            "rest api": "rest apis",
            "jwt": "jwt authentication",
            "aws s3": "aws",
            "continuous integration": "ci/cd",
            "continuous deployment": "ci/cd",
            "continuous integration / continuous deployment": "ci/cd",
            "jest": "unit testing",
            "jest/enzyme": "unit testing"
        };

        const normalizeSkill = (skill) =>
            aliases[skill.toLowerCase()] || skill.toLowerCase();

        const normalizedMatchedSkills = new Set(
            parsedResult.matchedSkills.map(normalizeSkill)
        );

        const normalizedPartialSkills = new Set(
            parsedResult.partialSkills.map(normalizeSkill)
        );

        parsedResult.missingSkills = parsedResult.missingSkills.filter(
            skill =>
                !normalizedMatchedSkills.has(normalizeSkill(skill)) &&
                !normalizedPartialSkills.has(normalizeSkill(skill))
        );

        // ----------------------------
        // Seniority Consistency Check
        // ----------------------------

        const experienceGap = parsedResult.experienceGap.toLowerCase();

        if (
            experienceGap.includes("exceeds") &&
            parsedResult.seniorityAlignment === "Slightly Junior"
        ) {
            parsedResult.seniorityAlignment = "Overqualified";
        }

        return parsedResult;

    } catch (error) {
        console.error("Groq Job Match Error:", error);
        throw error;
    }
}

module.exports = {
    analyzeJobMatch,
};