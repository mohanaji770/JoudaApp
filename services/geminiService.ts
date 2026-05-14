
import { GoogleGenAI, Type, Schema } from "@google/genai";
import { SYSTEM_PROMPT } from "../constants";
import { AnalysisResult, VerdictType } from "../types";

// Initialize API client
// Note: process.env.API_KEY is injected by Vite at build time
const apiKey = process.env.API_KEY;

if (!apiKey) {
  console.error("GEMINI API KEY IS MISSING! Please check your .env file or Vercel Environment Variables.");
}

const ai = new GoogleGenAI({ apiKey: apiKey || "DUMMY_KEY_TO_PREVENT_CRASH_ON_INIT" });

const analysisSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    verdict: {
      type: Type.STRING,
      enum: ["SAFE", "RISKY", "UNSAFE"],
      description: "The final safety verdict. SAFE = Green, RISKY = Yellow, UNSAFE = Red.",
    },
    verdictTitle: {
      type: Type.STRING,
      description: "A short Arabic title for the verdict (e.g. 'آمن تماماً', 'خطر محتمل', 'غير آمن').",
    },
    analysis: {
      type: Type.STRING,
      description: "Detailed analysis of ingredients or visual cues in Arabic.",
    },
    guidance: {
      type: Type.STRING,
      description: "Actionable advice for the patient in Arabic.",
    },
    alternatives: {
      type: Type.STRING,
      description: "Suggested gluten-free alternatives if the item is unsafe (optional).",
    },
    matchedStoreItem: {
      type: Type.STRING,
      description: "If the analyzed item matches a product in Jouda's inventory (or is a direct alternative available in inventory), output the exact product name here. Otherwise return null/empty.",
    },
  },
  required: ["verdict", "verdictTitle", "analysis", "guidance"],
};

const modelId = "gemini-2.5-flash";
const config = {
  systemInstruction: SYSTEM_PROMPT,
  responseMimeType: "application/json",
  responseSchema: analysisSchema,
  temperature: 0.2, // Low temperature for more deterministic/strict safety analysis
};

// Helper to handle API errors
const handleApiError = (error: unknown) => {
  console.error("Gemini Analysis Error:", error);
  const errorMessage = error instanceof Error ? error.message.toLowerCase() : String(error).toLowerCase();
  
  // Check for quota exhaustion or rate limiting (429)
  if (errorMessage.includes("429") || errorMessage.includes("quota") || errorMessage.includes("exhausted") || errorMessage.includes("resource has been exhausted")) {
    throw new Error("QUOTA_EXCEEDED");
  }
  
  throw new Error("فشل في تحليل البيانات. يرجى المحاولة مرة أخرى.");
};

export const analyzeImageWithGemini = async (base64Image: string): Promise<AnalysisResult> => {
  if (!apiKey) {
    throw new Error("مفتاح API غير موجود. يرجى التأكد من إعدادات النظام.");
  }
  
  try {
    const response = await ai.models.generateContent({
      model: modelId,
      contents: {
        parts: [
          {
            inlineData: {
              data: base64Image,
              mimeType: "image/jpeg", 
            },
          },
          {
            text: "Analyze this image for Gluten content based on the system instructions. Check against store inventory.",
          },
        ],
      },
      config: config,
    });

    return parseResponse(response.text);
  } catch (error) {
    handleApiError(error);
    throw error; // Should be unreachable due to handleApiError throwing, but for TS safety
  }
};

export const analyzeTextWithGemini = async (productName: string): Promise<AnalysisResult> => {
  if (!apiKey) {
    throw new Error("مفتاح API غير موجود. يرجى التأكد من إعدادات النظام.");
  }

  try {
    const response = await ai.models.generateContent({
      model: modelId,
      contents: {
        parts: [
          {
            text: `Analyze this food product name for Gluten content strictly: "${productName}". Check if it matches Jouda Store inventory.`,
          },
        ],
      },
      config: config,
    });

    return parseResponse(response.text);
  } catch (error) {
    handleApiError(error);
    throw error;
  }
};

const parseResponse = (text: string | undefined): AnalysisResult => {
  if (!text) {
    throw new Error("No response from Gemini");
  }

  try {
    const data = JSON.parse(text) as Omit<AnalysisResult, 'timestamp' | 'imageUrl'>;
    return {
      ...data,
      verdict: data.verdict as VerdictType,
      timestamp: Date.now(),
    };
  } catch (e) {
    throw new Error("Invalid JSON response from model");
  }
};
