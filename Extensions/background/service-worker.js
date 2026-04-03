chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.type === "SUMMARIZE") {
    handleSummarize(request.text)
      .then((data) => sendResponse({ success: true, data }))
      .catch((err) => sendResponse({ success: false, error: err.message }));

    return true;
  }
});

async function handleSummarize(text) {
  const response = await fetch("http://localhost:3000/summarize", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ text }),
  });

  const data = await response.json();
  return data;
}