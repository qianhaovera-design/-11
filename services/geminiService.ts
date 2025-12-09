
import { GoogleGenAI, Type } from "@google/genai";
import { GeneratedMessage } from "../types";

const processEnvApiKey = process.env.API_KEY;

// Fallback mock if API key is missing (to prevent app crash in preview, though strict guidelines say assume it exists)
// We will strictly follow the instruction to use process.env.API_KEY.
const ai = new GoogleGenAI({ apiKey: processEnvApiKey });

export const generateHolidayGreeting = async (mood: string): Promise<GeneratedMessage> => {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: `Write a very short, luxurious, and poetic Christmas greeting card message for the year 2025.
      The mood is: ${mood}.
      The brand is "Interactive Christmas Tree".
      Return JSON format with:
      - 'title' (max 5 words)
      - 'body' (max 20 words, English)
      - 'translation' (The Chinese translation of the body).`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING },
            body: { type: Type.STRING },
            translation: { type: Type.STRING },
          },
          required: ["title", "body", "translation"],
        },
      },
    });

    const text = response.text;
    if (!text) throw new Error("No response from AI");
    
    return JSON.parse(text) as GeneratedMessage;
  } catch (error) {
    console.error("AI Generation Error:", error);
    return {
      title: "Interactive Christmas Tree",
      body: "Wishing you a season of golden moments and emerald dreams.",
      translation: "愿您拥有一个充满金色时刻和翡翠美梦的季节。"
    };
  }
};
