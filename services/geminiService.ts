
import { GoogleGenAI, Type } from "@google/genai";
import { Friend, AIInsight } from "../types";

// Note: process.env.API_KEY is automatically injected in this environment
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const getAIInsights = async (friends: Friend[]): Promise<AIInsight | null> => {
  try {
    const prompt = `Analise este grupo de amigos e seus status: ${JSON.stringify(friends)}. 
    Crie um resumo criativo e uma recomendação divertida para o evento.`;

    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            summary: { type: Type.STRING },
            funnyFact: { type: Type.STRING },
            recommendation: { type: Type.STRING },
          },
          required: ["summary", "funnyFact", "recommendation"],
        },
      },
    });

    return JSON.parse(response.text.trim());
  } catch (error) {
    console.error("Gemini Error:", error);
    return null;
  }
};
