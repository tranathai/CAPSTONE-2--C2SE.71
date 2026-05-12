import { getConfig, setConfig, listConfig } from "../models/systemConfig.model.js";

export async function getAllConfig(req, res, next) {
  try {
    const config = await listConfig();
    return res.status(200).json({ success: true, data: config });
  } catch (error) {
    next(error);
  }
}

export async function updateConfig(req, res, next) {
  try {
    const { key, value, description } = req.body;
    if (!key || key.trim() === "") {
      return res.status(400).json({ success: false, message: "config_key không được để trống" });
    }
    await setConfig(key.trim(), value, description);
    return res.status(200).json({ success: true, message: "Cập nhật cấu hình thành công" });
  } catch (error) {
    next(error);
  }
}

export async function summarizeFeedback(req, res, next) {
  try {
    const { content } = req.body;
    const normalizedContent = typeof content === "string" ? content.trim() : "";
    if (!normalizedContent) {
      return res.status(400).json({ success: false, message: "Nội dung feedback không được để trống" });
    }

    const rawKeys = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY || "";
    const apiKeys = String(rawKeys)
      .split(/[\n,;]/)
      .map((k) => k.trim())
      .filter(Boolean);
    if (apiKeys.length === 0) {
      return res.status(503).json({
        success: false,
        message: "Thiếu GEMINI_API_KEY (hoặc GOOGLE_API_KEY) trong cấu hình backend",
      });
    }

    const prompt = `Bạn là trợ lý tóm tắt phản hồi của giảng viên cho sinh viên. Hãy tóm tắt nội dung sau thành 3-5 điểm chính ngắn gọn (mỗi điểm dưới 20 từ). Nếu nội dung ngắn dưới 100 từ, chỉ cần liệt kê 1-2 điểm chính. Trả lời bằng tiếng Việt.\n\nNội dung phản hồi:\n${normalizedContent}`;

    let summary = "";
    let lastErr = "";
    for (const apiKey of apiKeys) {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: { maxOutputTokens: 512, temperature: 0.3 },
          }),
        },
      );
      if (!response.ok) {
        lastErr = await response.text();
        continue;
      }
      const data = await response.json();
      summary = data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || "";
      if (summary) break;
    }

    if (!summary) {
      if (lastErr) console.error("Gemini API error:", lastErr);
      return res.status(503).json({
        success: false,
        message: "Tính năng AI tạm thời không khả dụng",
      });
    }

    return res.status(200).json({ success: true, data: { summary } });
  } catch (error) {
    console.error("AI summarization error:", error);
    return res.status(503).json({
      success: false,
      message: "Tính năng AI tạm thời không khả dụng",
    });
  }
}
