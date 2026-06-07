require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { GoogleGenerativeAI } = require('@google/generative-ai');

const app = express();
app.use(cors());
app.use(express.json());

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

app.post('/analyze', async (req, res) => {
    try {
        const userCode = req.body.code;
        if (!userCode) return res.status(400).json({ error: "No code provided" });

        const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
        
        const prompt = `
        Analyze the following code for Big O complexity.
        Return ONLY a raw JSON object. No code blocks, no markdown, no conversational text.
        JSON format:
        {
            "time_complexity": "O(N)",
            "space_complexity": "O(1)"
        }
        Code to analyze:
        ${userCode}
        `;
        
        const result = await model.generateContent(prompt);
        const responseText = result.response.text().replace(/```json/g, '').replace(/```/g, '').trim();
        
        const jsonResult = JSON.parse(responseText);
        res.json(jsonResult);
    } catch (error) {
        res.status(500).json({ error: "Analysis Failed: " + error.message });
    }
});

app.listen(5000, () => console.log("Server running on port 5000"));