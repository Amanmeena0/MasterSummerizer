// utils/api.js

const API_URL = "https://api-inference.huggingface.co/models/sshleifer/distilbart-cnn-12-6";

export async function summarizeText(text, token) {
  const response = await fetch(API_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      inputs: text,
      parameters: {
        max_length: 100,
        min_length: 30
      }
    })
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || "API request failed");
  }

  return data;
}