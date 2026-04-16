import express from "express";
import cloudinary from "cloudinary";
import multer from "multer";
import { GoogleGenAI } from "@google/genai";

const router = express.Router();

const upload = multer({ storage: multer.memoryStorage() });

router.post("/upload", upload.single("file"), async (req, res) => {
  try {
    console.log("FILE:", req.file);
    console.log("BODY:", req.body);

    const public_id = req.body.public_id;

    if (!req.file) {
      return res.status(400).json({
        message: "File is required",
      });
    }

    if (public_id) {
      await cloudinary.v2.uploader.destroy(public_id);
    }
    // convert buffer to base64 data URI for Cloudinary
    const fileBase64 = `data:${req.file.mimetype};base64,${req.file.buffer.toString("base64")}`;

    const cloud = await cloudinary.v2.uploader.upload(fileBase64);

    console.log("cloud", cloud);

    res.json({
      url: cloud.secure_url,
      public_id: cloud.public_id,
    });
  } catch (error: any) {
    console.log("scscscscscscs");

    console.log(error);
    return res.status(500).json({ message: error.message });
  }
});

router.post("/career", async (req, res) => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY_GEMINI });
  try {
    const { skills } = req.body;

    if (!skills) {
      return res.status(400).json({
        message: "Skills Required",
      });
    }

    const prompt = ` 
            Based on the following skills: ${skills}. 
            
            Please act as a career advisor and generate a career path suggestion. 
            Your entire response must be in a valid JSON format. Do not include any text or markdown 
            formatting outside of the JSON structure. 
            
            The JSON object should have the following structure: 
            { 
            "summary": "A brief, encouraging summary of the user's skill set and their general job 
            title.", 
            "jobOptions": [ 
            { 
            "title": "The name of the job role.", 
            "responsibilities": "A description of what the user would do in this role.", 
            "why": "An explanation of why this role is a good fit for their skills." 
            } 
            ], 
            "skillsToLearn": [ 
            { 
            "category": "A general category for skill improvement (e.g., 'Deepen Your Existing Stack 
            Mastery', 'DevOps & Cloud').", 
            "skills": [ 
            { 
            "title": "The name of the skill to learn.", 
            "why": "Why learning this skill is important.", 
            "how": "Specific examples of how to learn or apply this skill." 
            } 
            ] 
            } 
            ], 
            "learningApproach": { 
            "title": "How to Approach Learning", 
            "points": ["A bullet point list of actionable advice for learning."] 
            } 
            } 
            `;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
      },
    });
    let jsonResponse;
    try {
      const rawText = response.text?.trim();
      if (!rawText) {
        return res.status(500).json({
          message: "Empty response from AI",
        });
      }

      jsonResponse = JSON.parse(rawText);
    } catch (error) {
      return res.status(500).json({
        message: "Ai returned response that was not valid JSON",
        rawResponse: response.text,
      });
    }
    res.json(jsonResponse);
  } catch (error: any) {
    res.status(500).json({
      message: error.message,
    });
  }
});

router.post("/resume-analyser", upload.single("file"), async (req, res) => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY_GEMINI });

  try {
    console.log("FILE:", req.file);
    console.log("BODY:", req.body);

    if (!req.file) {
      return res.status(400).json({
        message: "File is required",
      });
    }

    const fileBase64 = `data:${req.file.mimetype};base64,${req.file.buffer.toString("base64")}`;
    if (!fileBase64) {
      return res.status(400).json({
        message: "File is required",
      });
    }

    const prompt = ` 
You are an expert ATS (Applicant Tracking System) analyzer. Analyze the following resume 
and provide: 
1. An ATS compatibility score (0-100) 
2. Detailed suggestions to improve the resume for better ATS performance 
 
Your entire response must be in valid JSON format. Do not include any text or markdown 
formatting outside of the JSON structure. 
 
The JSON object should have the following structure: 
{ 
  "atsScore": 85, 
  "scoreBreakdown": { 
    "formatting": { 
      "score": 90, 
      "feedback": "Brief feedback on formatting" 
    }, 
    "keywords": { 
      "score": 80, 
      "feedback": "Brief feedback on keyword usage" 
    }, 
    "structure": { 
      "score": 85, 
      "feedback": "Brief feedback on resume structure" 
    }, 
    "readability": { 
      "score": 88, 
      "feedback": "Brief feedback on readability" 
    } 
  }, 
  "suggestions": [ 
    { 
      "category": "Category name (e.g., 'Formatting', 'Content', 'Keywords', 
'Structure')", 
      "issue": "Description of the issue found", 
      "recommendation": "Specific actionable recommendation to fix it", 
      "priority": "high/medium/low" 
    } 
  ], 
  "strengths": [ 
    "List of things the resume does well for ATS" 
  ], 
  "summary": "A brief 2-3 sentence summary of the overall ATS performance" 
} 
 
Focus on: - File format and structure compatibility - Proper use of standard section headings - Keyword optimization - Formatting issues (tables, columns, graphics, special characters) - Contact information placement - Date formatting - Use of action verbs and quantifiable achievements - Section organization and flow 
`;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",

      contents: [
        {
          role: "user",
          parts: [
            {
              text: prompt,
            },
            {
              inlineData: {
                mimeType: "application/pdf",
                data: fileBase64.replace(/^data:application\/pdf;base64,/, ""),
              },
            },
          ],
        },
      ],
      config: {
        responseMimeType: "application/json",
      },
    });

    let jsonResponse;
    try {
      const rawText = response.text?.trim();
      if (!rawText) {
        return res.status(500).json({
          message: "Empty response from AI",
        });
      }

      jsonResponse = JSON.parse(rawText);
    } catch (error) {
      return res.status(500).json({
        message: "Ai returned response that was not valid JSON",
        rawResponse: response.text,
      });
    }
    res.json(jsonResponse);
  } catch (error: any) {
    res.status(500).json({
      message: error.message,
    });
  }
});
export default router;
