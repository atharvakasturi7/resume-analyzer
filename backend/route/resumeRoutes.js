const express = require('express');
const router = express.Router();
const upload = require('../middleware/uploadMiddleware');
const {getHealth, getAbout,getResume, searchApplicant,uploadResume,matchResumeToJob} = require('../controllers/resumeController');
const {validSearch} = require('../middleware/loggerMiddleware')


router.get('/resume/:username/:id', getResume);
router.get('/health', getHealth);
router.get('/about', getAbout);

router.get('/search',validSearch, searchApplicant);

router.post('/resume/upload', upload.single('resumeFile'), uploadResume)

router.post(
    '/resume/match-job',
    upload.single('resumeFile'),
    matchResumeToJob
);

module.exports = router;