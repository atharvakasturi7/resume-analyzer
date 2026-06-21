
const healthLogger = (req,res,next) => {
    // console.log("Health route was pinged!");

    const {method,url} = req;
    const time = new Date().toLocaleTimeString();

    console.log(`[${method}] ${url} - ${time} `);
    next();
}

const validSearch = (req,res,next) => {
    let{skill, level} = req.query;
    console.log(req.query);
    if(!skill){
        res.status(400).send("Skill is required to search!");
    }else if(!level){
        res.status(400).send("Level is required to search!");
    }  
    else{
        next();
    }

}

const aboutLogger = (req,res,next) => {
    const {method, url} = req;
    console.log(`[${method}] ${url}`);
    next();
}

const resumeLogger = (req,res,next) => {
    const {method, url} = req;
    console.log(`[${method}] ${url}`);
    next();
}


const globalLogger = (req, res, next) => {
    const { method, url } = req;
    const time = new Date().toLocaleTimeString();
    
    // This will dynamically print: [GET] /about - 10:20:00 AM, etc.
    console.log(`[${method}] ${url} - ${time}`);
    
    next();
};


module.exports = {
    healthLogger,
    validSearch,
    aboutLogger,
    resumeLogger,
    globalLogger
}