import { GoogleGenerativeAI } from "@google/generative-ai";

function buildSummaryPrompt(content) {
  return [
    "Ban la tro ly hoc thuat. Hay tom tat noi dung sau thanh 3-5 y chinh ngan gon, de hieu, action-oriented:",
    content,
  ].join("\n\n");
}

export async function summarizeText(req, res, next) {
  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return res.status(400).json({ success: false, message: "Thieu GEMINI_API_KEY" });
    }
    const text = req.body.text || "";
    if (!text.trim()) {
      return res.status(400).json({ success: false, message: "Noi dung can tom tat khong duoc rong" });
    }
    const client = new GoogleGenerativeAI(apiKey);
    const model = client.getGenerativeModel({
      model: process.env.GEMINI_MODEL || "gemini-1.5-flash",
    });
    const result = await model.generateContent(buildSummaryPrompt(text.slice(0, 20000)));
    const summary = result.response.text();
    return res.status(200).json({ success: true, data: { summary } });
  } catch (error) {
    return next(error);
  }
}
