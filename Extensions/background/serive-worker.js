import { summarizeText } from "../utils/api.js";

async function handleSummarize(text) {
  const token = await getToken();
  return await summarizeText(text, token);
}