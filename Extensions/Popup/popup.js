const button = document.getElementById("summarizeBtn");
const status = document.getElementById("status");
const output = document.getElementById("output");

function setUiState(kind, statusText, outputText) {
  status.className = "status";
  if (kind === "warn") {
    status.classList.add("warn");
  }
  if (kind === "error") {
    status.classList.add("error");
  }

  status.innerText = statusText;
  output.innerText = outputText;
}

function sendRuntimeMessage(message) {
  return new Promise((resolve, reject) => {
    chrome.runtime.sendMessage(message, (response) => {
      if (chrome.runtime.lastError) {
        reject(new Error(chrome.runtime.lastError.message));
        return;
      }

      resolve(response);
    });
  });
}

async function getSelectedTextFromTab(tabId) {
  const result = await chrome.scripting.executeScript({
    target: { tabId },
    func: () => window.getSelection().toString(),
  });

  return result?.[0]?.result ?? "";
}

button.addEventListener("click", async () => {
  button.disabled = true;
  setUiState("info", "Working", "Getting selected text...");

  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

    if (!tab || !tab.id) {
      setUiState("error", "Failed", "Could not find the active tab.");
      return;
    }

    let text = await getSelectedTextFromTab(tab.id);

    if (!text || text.trim().length === 0) {
      setUiState("warn", "No selection", "Please select some text on the page first.");
      return;
    }

    text = text.slice(0, 1500);
    setUiState("info", "Working", "Summarizing selected text...");

    const response = await sendRuntimeMessage({ type: "SUMMARIZE", text });

    if (!response?.success) {
      setUiState("error", "Failed", response?.error || "Unknown extension error.");
      return;
    }

    const payload = response.data;

    if (payload?.error === "MODEL_LOADING") {
      const seconds = Number(payload.estimatedTime || 0);
      const waitHint = seconds > 0 ? `about ${Math.ceil(seconds)}s` : "a short moment";
      setUiState("warn", "Model loading", `The model is waking up. Retry in ${waitHint}.`);
      return;
    }

    if (Array.isArray(payload) && payload[0]?.summary_text) {
      setUiState("info", "Done", payload[0].summary_text);
      return;
    }

    setUiState("error", "Failed", "Unexpected response from backend.");
  } catch (error) {
    setUiState("error", "Failed", error.message || "Could not summarize right now.");
  } finally {
    button.disabled = false;
  }
});