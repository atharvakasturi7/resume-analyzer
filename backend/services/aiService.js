const Groq = require("groq-sdk");

const groq = new Groq({
    apiKey: process.env.GROQ_API_KEY,
});

async function analyzeResume(resumeText) {
    try {
        console.log("Sending resume to Groq...");

        const layoutWarning = `
IMPORTANT CONTEXT: This resume text was extracted from a PDF. You cannot see the original visual layout, fonts, columns, colors, graphics, or formatting. You only have the extracted plain text.

Because of this, apply these rules strictly:
- Do NOT award points for single-column layout or ATS-safe formatting unless the text is provably clean, linear, and non-garbled. Default layout score: 3/10.
- Do NOT award points for standard fonts or spacing. Default: 2/5.
- Do NOT award points for data extractability unless contact fields (name, email, phone) appear as clearly labeled plain text in a natural reading order. Default: 5/10.
- Skills listed as keywords (comma-separated or one-per-line) are preferred for ATS parsing.
- Skills embedded inside long paragraphs or descriptive sentences are less ATS-friendly and should receive a lower score.
- If projects are listed with only a name and no tech stack or outcome, score them as incomplete.
`;

        const response = await groq.chat.completions.create({
            model: "llama-3.3-70b-versatile",
            messages: [
                {
                    role: "system",
                    content: `
You are an experienced resume reviewer and ATS compatibility evaluator.

Your job is to estimate how ATS-friendly a resume is based ONLY on extracted text.

You cannot see the original PDF layout, fonts, colors, spacing, tables, graphics, or visual formatting. Therefore, never assume ATS-safe formatting unless it is strongly suggested by the extracted text.


SCORING PRINCIPLES:
- Evaluate all criteria independently.
- Award points only when supported by evidence in the extracted text.
- Do not assume missing information exists.
- Because visual formatting is unavailable, be conservative when scoring layout-related categories.
- Use the full 0-100 scale when justified.
- A strong resume may score above 80 if the extracted text demonstrates excellent structure, skills, projects, experience, and quantified achievements.
- Reserve scores above 90 for exceptionally strong resumes with clear evidence across all categories.

Return ONLY valid JSON. No markdown. No code blocks. No explanations. No backticks. Just the raw JSON object.
`,
                },
                {
                    role: "user",
                    content: `
${layoutWarning}

Analyze the following resume text and return a realistic ATS compatibility score.

Return JSON in this exact format:
{
  "atsScore": number,
  "layoutAnalyzed": boolean,
  "summary": "",
  "strengths": [],
  "weaknesses": [],
  "suggestions": []
}

IMPORTANT:
layoutAnalyzed must always be the boolean value false.
Do not return it as a string. 

Rules:
- atsScore must be a number between 0 and 100.
- strengths: specific things that are actually present and verifiable in the text.
- weaknesses: honest, critical issues found in the text.
- suggestions: actionable fixes the candidate can make.
- summary: 2-3 sentence honest ATS assessment based only on what the text shows.
- layoutAnalyzed must always be false because visual resume formatting was not available for analysis.

============================
SCORING CRITERIA (Total: 100)
============================

--- 1. PARSEABILITY & FORMATTING (35 points) ---

a) Layout Structure (10 points)
   - You CANNOT see the layout. Award maximum 4/10 unless the extracted text reads in a perfectly clean, linear, logical order with no garbled or merged content.
   - If contact info, education, and sidebar content appear mixed together in the text, deduct heavily.

b) ATS-Breaking Elements (10 points)
   - You cannot see graphics. Award maximum 5/10 as default.
   - If skills are written as sentences instead of lists, this suggests a graphic/designed template: deduct 3.
   - If the text flow seems non-linear or jumbled: deduct 3.

c) Font & Spacing (5 points)
   - Cannot be verified from text. Award 2/5 as default.

d) Data Extractability (10 points)
   - Name clearly present in text: +2
   - Email clearly present as plain text: +2
   - Phone clearly present as plain text: +2
   - LinkedIn or other profile links present: +1
   - Job titles and company names are clearly labeled: +3
   - Deduct 2 for each field that is missing or ambiguous.

--- 2. CORE SECTIONS PRESENCE (25 points) ---

- Contact info block (name + email + phone all present): +5, partial if any missing
- Work Experience section with standard "Experience" header: +5
- Education section: +5
- Skills section: +5 if it's a list, +2 if skills are buried in sentences

- Professional Summary present: +5

- Career Objective present: +3
- If the candidate appears to be a student, fresher, intern, or entry-level applicant, a Career Objective is acceptable and should not be treated as a major weakness.
- For experienced professionals, a Professional Summary is generally preferred over a Career Objective.

- Non-standard headers like "Projects/Professional Development": −3

--- 3. SKILLS QUALITY (20 points) ---

   - Hard/technical skills present (HTML, CSS, JS, C++, Python, etc.): +8
   - Skills listed as clean keywords (comma-separated or line-by-line): +10
   - Skills written as full sentences ("Proficient in HTML for dynamic pages"): award only 3/10 for this category, deduct 7
   - Only soft skills or vague traits: deduct 8
   - Skills embedded in experience bullets rather than a dedicated parseable section: deduct 5

--- 4. CONTENT CLARITY (10 points) ---

   - Bullet points used for experience (not paragraphs): +3
   - Action verbs at start of bullets (Built, Led, Reduced, Developed, Automated): +3
     - Weak openers like "Proficient in", "Familiar with", "Have experience", "Collaborated on": −3
   - Quantified achievements (numbers, %, metrics): +4
     - Zero quantified achievements anywhere: −4

--- 5. CONSISTENCY & ERROR CHECK (10 points) ---

   - Consistent date format throughout: +3 (deduct 2 if mixed formats like "Oct 2025" vs "October 2025" vs "July 2025")
   - Consistent formatting of titles and headers: +2
   - No spelling/grammar errors: +5, deduct 2 per error found

============================
RED FLAGS — DEDUCT IMMEDIATELY IF FOUND
============================

- Skills described in sentences instead of listed as keywords: −8
- Bullet points starting with "Proficient in", "Familiar with", "Have experience with": −5
- No numbers, percentages, or metrics anywhere in the resume: −7
- Projects listed with only a name, no description or tech stack: −4 per project
- Experience entries with no bullet points (just title + date, no details): −5
- "Objective" section instead of "Summary/Professional Summary": −2
- Non-standard section header like "Projects/Professional Development": −3
- CGPA or grades listed without context of scale (e.g., "9.42" with no "/10"): −1

============================
STRICT SCORE BENCHMARKS
============================

90–100: Exceptional. Clean linear text, all sections with standard headers, keyword-list skills, quantified achievements in every role, no errors. Extremely rare.
80–89: Strong. All sections present, mostly keyword skills, some metrics. Minor gaps only.
70–79: Decent. Has most sections but skills written as sentences, no metrics, or minor structural issues.
60–69: Average. Missing sections, or skills not parseable, or no achievements.
50–59: Below average. Multiple issues — no metrics, skills buried in sentences, weak structure.
35–50: Poor. Significant structural problems, missing key sections, no parseable skills list, no achievements.


FINAL SCORING SAFEGUARD

Before assigning the final score, ask yourself:

1. Did I actually verify all awarded points from the extracted text?
2. Am I accidentally giving credit for formatting I cannot see?
3. Am I assuming layout quality without evidence?
4. Does the score realistically reflect only the information available in the text?

If visual formatting cannot be verified, do not award full points for formatting-related categories.

Resume text to analyze:
${resumeText}
`,
                },
            ],
            temperature: 0.1,
        });

        console.log("Groq analysis received.");

        return response.choices[0].message.content;
    } catch (error) {
        console.error("Groq Error:", error);
        throw error;
    }
}

module.exports = {
    analyzeResume,
};