chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.type === "SUMMARIZE") {
    handleSummarize(request.text)
      .then((data) => sendResponse({ success: true, data }))
      .catch((err) => sendResponse({ success: false, error: err.message }));

    return true;
  }
});

async function handleSummarize(text) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 25000);

  try {
    const response = await fetch("http://localhost:3000/summarize", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ text }),
      signal: controller.signal,
    });

    let data;
    try {
      data = await response.json();
    } catch {
      throw new Error("Backend returned invalid JSON.");
    }

    if (!response.ok) {
      throw new Error(data?.error || `Backend request failed (${response.status}).`);
    }

    return data;
  } catch (error) {
    if (error.name === "AbortError") {
      throw new Error("Request timed out. Try shorter text or retry in a moment.");
    }

    throw error;
  } finally {
    clearTimeout(timeoutId);
  }
}