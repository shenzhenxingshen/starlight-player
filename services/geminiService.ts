
import { GoogleGenAI } from "@google/genai";

export const getZenQuote = async () => {
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: "请提供一句简短的佛学智慧语录（中文），用于冥想应用。只需要提供语录文本。",
      config: {
        systemInstruction: "你是一位智慧的禅修大师。你的回答应当简短、宁静且具有启发性。",
        temperature: 0.8,
      },
    });
    return response.text;
  } catch (error) {
    console.error("Error fetching Zen quote:", error);
    return "静能生慧，定能生福。";
  }
};
