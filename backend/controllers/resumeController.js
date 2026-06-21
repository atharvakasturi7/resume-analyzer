const getHealth = (req,res) => {
    res.send("I am fine");
}

const getAbout = (req,res) => {
    res.send("This is about section");
}


const getResume = (req,res) => {
    let {username, id} = (req.params);
    console.log(req.params);
    res.send(`This is ${username}'s resume with id : ${id}`);
}

const searchApplicant = (req,res) => {
    let{skill, level} = req.query
    console.log(req.query);
    res.send(`search results = skill : ${skill}, level = ${level}`);
}


const uploadResume = (req,res) => {
    console.log("--- Executing via Controller ---");
    console.log("Text Fields:", req.body); 
    console.log("File Data:", req.file); 

    if(!req.file){
        return res.status(400).send("No file uploaded");
    }

    res.send(`File "${req.file.originalname}" was uploaded via controller succesfully! `);
}

module.exports = {
    getHealth,
    getAbout,
    getResume,
    searchApplicant,
    uploadResume
}