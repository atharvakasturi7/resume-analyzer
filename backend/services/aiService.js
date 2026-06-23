const Groq = require("groq-sdk");

const groq = new Groq({
    apiKey: process.env.GROQ_API_KEY,
});

async function analyzeResume(resumeText) {
    try {
        console.log("Sending resume to Groq...");

        const response = await groq.chat.completions.create({
            model: "llama-3.3-70b-versatile",
            messages: [
                {
                    role: "system",
                    content: `
You are an expert resume reviewer.

Return ONLY valid JSON.

Rules:
- Do not use markdown.
- Do not use code blocks.
- Do not write explanations.
- Do not wrap the response inside \`\`\`json.
- Return only the JSON object.
`,
                },
                {
                    role: "user",
                    content: `
Analyze the following resume.

Return JSON in this exact format:

{
  "summary": "",
  "strengths": [],
  "weaknesses": [],
  "suggestions": []
}

Resume:
${resumeText}
`,
                },
            ],
            temperature: 0.3,
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