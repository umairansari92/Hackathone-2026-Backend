import { GoogleGenerativeAI } from "@google/generative-ai";
import DiagnosisLog from "../models/DiagnosisLog.js";

// Initialize Gemini
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// @desc    Get Smart Diagnosis from AI
// @route   POST /api/ai/diagnosis
// @access  Private (Doctor)
export const getSmartDiagnosis = async (req, res) => {
  try {
    const { symptoms, age, gender, history } = req.body;

    if (!symptoms) {
      return res.status(400).json({ message: "Symptoms are required" });
    }

    const prompt = `
      You are an expert medical AI assistant for doctors. 
      Analyze the following patient data to provide a concise clinical assessment.
      
      Patient Info:
      Age: ${age || "Unknown"}
      Gender: ${gender || "Unknown"}
      Medical History: ${history || "None provided"}
      Current Symptoms: ${symptoms}

      Provide your response strictly in the following JSON format:
      {
        "possibleConditions": ["Condition 1", "Condition 2"],
        "riskLevel": "Low | Medium | High | Critical",
        "suggestedTests": ["Test 1", "Test 2"],
        "briefExplanation": "Short explanation of the assessment."
      }
    `;

    // Non-blocking fallback logic
    let aiResponseData;
    let fallbackUsed = false;

    try {
      const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
      const result = await model.generateContent(prompt);
      const response = await result.response;
      let text = response.text();

      // Clean up markdown formatting if Gemini returns it
      text = text
        .replace(/```json/g, "")
        .replace(/```/g, "")
        .trim();
      aiResponseData = JSON.parse(text);
    } catch (aiError) {
      console.error("AI API Error:", aiError);
      fallbackUsed = true;
      aiResponseData = {
        possibleConditions: ["Manual assessment required (AI Unavailable)"],
        riskLevel: "Medium",
        suggestedTests: ["Doctor's discretion"],
        briefExplanation:
          "The AI Diagnosis service is currently unavailable. Please proceed with manual diagnosis.",
        error: aiError.message,
      };
    }

    // Save to DiagnosisLog for analytics
    const logEntry = new DiagnosisLog({
      doctorId: req.user._id,
      symptoms,
      aiResponse: aiResponseData,
      riskLevel: aiResponseData.riskLevel || (fallbackUsed ? "Medium" : "Low"),
    });

    await logEntry.save();

    res.json({
      success: !fallbackUsed,
      data: aiResponseData,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Generate Patient-friendly Prescription Explanation
// @route   POST /api/ai/explain-prescription
// @access  Private (Doctor, Patient)
export const explainPrescription = async (req, res) => {
  try {
    const { medicines, condition, language = "English" } = req.body;

    if (!medicines || medicines.length === 0) {
      return res.status(400).json({ message: "Medicines array is required" });
    }

    const medsString = medicines
      .map((m) => `${m.name} (${m.dosage})`)
      .join(", ");

    const prompt = `
      You are a helpful virtual pharmacist and doctor's assistant.
      The patient has been diagnosed with: ${condition || "a medical condition"}.
      They have been prescribed the following medicines: ${medsString}.

      Provide a simple, easy-to-understand explanation of what these medicines do, 
      along with 3 practical lifestyle or preventive tips.
      Respond entirely in the requested language: ${language}.
      Keep the tone reassuring and professional.
    `;

    try {
      const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
      const result = await model.generateContent(prompt);
      const response = await result.response;

      res.json({ explanation: response.text() });
    } catch (aiError) {
      console.error("AI API Error:", aiError);
      res.status(503).json({
        message: "AI explanation service is currently unavailable.",
        fallbackExplanation:
          "Please follow the dosage instructions on your prescription carefully and consult your doctor if you have any questions.",
      });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
