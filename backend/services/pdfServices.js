const fs = require('fs');
const { PDFParse } = require('pdf-parse'); 
const extractTextFromPdf = async (filePath) => {
    try {
        // 1. Read file into a raw binary buffer
        const dataBuffer = fs.readFileSync(filePath);
        
        // 2. Initialize the parser instance
        const parser = new PDFParse({ data: dataBuffer });
        
        // 3. Call the modern async method to extract text contents
        const result = await parser.getText(); // This returns a raw string text!
        
        // 4. Safely destroy the parser instance from temporary memory
        await parser.destroy();
        
        // 5. FIXED: Return the result directly because it IS the extracted string text!
        return result.text; 
    } catch (error) {
        console.error("Error reading PDF inside service:", error);
        throw new Error("Failed to process the PDF document.");
    }
};

module.exports = {
    extractTextFromPdf
};
