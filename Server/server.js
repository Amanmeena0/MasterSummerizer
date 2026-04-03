import express from "express";
import fetch from "node-fetch";
import cors from "cors";
import dotenv from "dotenv";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const HF_TOKEN = process.env.HF_TOKEN;
const HF_MODEL_URL = "https://router.huggingface.co/hf-inference/models/sshleifer/distilbart-cnn-12-6";

app.get("/health", (_req, res) => {
  res.json({ ok: true });
});

app.post("/summarize", async (req, res) => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 22000);

  try {
    if (!HF_TOKEN) {
      return res.status(500).json({ error: "HF_TOKEN is missing on the server." });
    }

    const { text } = req.body;

    if (!text) {
      return res.status(400).json({ error: "Text is required" });
    }

    const safeText = String(text).slice(0, 1500);

    const response = await fetch(HF_MODEL_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${HF_TOKEN}`,
        "Content-Type": "application/json",
      },
      signal: controller.signal,
      body: JSON.stringify({
        inputs: safeText,
        parameters: {
          max_length: 90,
          min_length: 20,
        },
        options: {
          wait_for_model: true,
        },
      }),
    });

    const data = await response.json();

    if (response.status === 503 || data?.error?.toLowerCase?.().includes("loading")) {
      return res.status(503).json({
        error: "MODEL_LOADING",
        estimatedTime: data?.estimated_time,
      });
    }

    if (!response.ok) {
      return res.status(response.status).json({
        error: data?.error || "Hugging Face request failed.",
      });
    }

    if (!Array.isArray(data) || !data[0]?.summary_text) {
      return res.status(502).json({ error: "Unexpected summarizer response format." });
    }

    res.json(data);

  } catch (err) {
    if (err.name === "AbortError") {
      return res.status(504).json({ error: "Summarization timed out. Please retry." });
    }

    res.status(500).json({ error: err.message });
  } finally {
    clearTimeout(timeoutId);
  }
});

app.listen(3000, () => {
  console.log("✅ Backend running on http://localhost:3000");
});