const { extractTextFromPdf } = require('../services/pdfServices');

const getHealth = (req, res) => {
    res.send("I am fine");
};

const getAbout = (req, res) => {
    res.send("This is about section");
};

const getResume = (req, res) => {
    let { username, id } = req.params;
    console.log(req.params);
    res.send(`This is ${username}'s resume with id : ${id}`);
};

const searchApplicant = (req, res) => {
    let { skill, level } = req.query;
    console.log(req.query);
    res.send(`search results = skill : ${skill}, level = ${level}`);
};

const uploadResume = async (req, res) => {
    console.log("--- Executing via Controller ---");
    console.log("Text Fields:", req.body);
    console.log("File Data:", req.file);

    if (!req.file) {
        return res.status(400).send("No file uploaded");
    }

    try {
        // Added 'await' here to wait for the class instance to finish resolving
        const extractedText = await extractTextFromPdf(req.file.path);

        console.log("--- PDF Successfully Parsed ---");
        console.log(extractedText.substring(0, 1000));

        return res.status(200).json({
            message: "File uploaded and parsed successfully!",
            textLength: extractedText.length,
            preview: extractedText.substring(0, 1000)
        });
    } catch (error) {
        console.log("--- PDF Parsing Failed ---");
        return res.status(500).send(error.message);
    }
};

module.exports = {
    getHealth,
    getAbout,
    getResume,
    searchApplicant,
    uploadResume
};
