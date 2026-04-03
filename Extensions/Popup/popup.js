const summarizeBtn = document.getElementById("summarizeBtn");
const output = document.getElementById("output");

const saveTokenBtn = document.getElementById("saveToken");
const tokenInput = document.getElementById("tokenInput");

// Save API Token
saveTokenBtn.addEventListener("click", () => {
  const token = tokenInput.value.trim();

  if (!token) {
    alert("Enter a valid token");
    return;
  }

  chrome.storage.local.set({ token }, () => {
    alert("Token saved successfully");
  });
});

// Summarize button click
summarizeBtn.addEventListener("click", async () => {
  output.innerText = "⏳ Getting selected text...";

  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

  const result = await chrome.scripting.executeScript({
    target: { tabId: tab.id },
    func: () => window.getSelection().toString()
  });

  let text = result[0].result;

  if (!text || text.trim().length === 0) {
    output.innerText = "⚠️ Please select some text first.";
    return;
  }

  text = text.slice(0, 1500);

  output.innerText = "⏳ Summarizing...";

  chrome.runtime.sendMessage(
    { type: "SUMMARIZE", text },
    (response) => {
      if (!response.success) {
        output.innerText = "❌ " + response.error;
        return;
      }

      if (response.data.error) {
        output.innerText = "⏳ Model loading... try again.";
        return;
      }

      output.innerText = response.data[0].summary_text;
    }
  );
});