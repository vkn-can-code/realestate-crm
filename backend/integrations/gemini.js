/**
 * Google Gemini API Client Integration (Gemini 2.0 Flash)
 */
class GeminiClient {
  constructor() {
    this.apiKey = process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY || "";
    this.baseUrl = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent";
  }

  async generateText(prompt, options = {}) {
    const apiKey = this.apiKey;
    if (!apiKey) {
      console.warn("[Gemini API Warning] GEMINI_API_KEY not set in environment.");
      return options.json ? "{}" : "Gemini API key is not configured.";
    }

    try {
      const body = {
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: options.json
          ? { responseMimeType: "application/json" }
          : {},
      };

      if (options.systemInstruction) {
        body.systemInstruction = {
          parts: [{ text: options.systemInstruction }],
        };
      }

      const response = await fetch(`${this.baseUrl}?key=${apiKey}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        const errText = await response.text();
        throw new Error(`Gemini API HTTP Error ${response.status}: ${errText}`);
      }

      const data = await response.json();
      const text = data.candidates?.[0]?.content?.parts?.[0]?.text || "";
      return text;
    } catch (err) {
      console.error("[Gemini Integration Error]", err.message);
      throw err;
    }
  }
}

export default new GeminiClient();
