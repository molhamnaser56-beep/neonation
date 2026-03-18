
import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export async function generateGlobalNews(gameState: any, playerCountry: any) {
  try {
    const prompt = `أنت راوٍ للعبة استراتيجية كبرى مثل Dummynation.
    اللاعب يتحكم في دولة: ${playerCountry?.name || 'دولة ما'}.
    يوم اللعبة الحالي هو: ${gameState.day}.
    قم بتوليد 3 عناوين أخبار عالمية قصيرة وواقعية باللغة العربية تعكس التوترات الدولية، التحولات الاقتصادية، أو أحداث عالمية عشوائية.
    يجب أن تكون الاستجابة بصيغة JSON كمصفوفة من الكائنات تحتوي على 'message' و 'type' (economy, war, diplomacy, or world).`;

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              message: { type: Type.STRING },
              type: { type: Type.STRING }
            },
            required: ['message', 'type']
          }
        }
      }
    });

    return JSON.parse(response.text);
  } catch (error) {
    console.error("Gemini News Error:", error);
    return [
      { message: "استقرار الأسواق العالمية مع إعادة فتح طرق التجارة.", type: "economy" },
      { message: "استئناف المحادثات الدبلوماسية في المنطقة المحايدة.", type: "diplomacy" }
    ];
  }
}
