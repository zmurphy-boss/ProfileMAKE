const form = document.getElementById('uploadForm');
const submitBtn = document.getElementById('submitBtn');
const statusEl = document.getElementById('status');
const resultsEl = document.getElementById('results');
const outputLinks = document.getElementById('outputLinks');

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  setStatus('info', 'Uploading files and starting extraction...');
  submitBtn.disabled = true;
  resultsEl.classList.add('hidden');
  outputLinks.innerHTML = '';

  const formData = new FormData(form);

  try {
    const response = await fetch('/api/run', {
      method: 'POST',
      body: formData,
    });

    const data = await response.json();

    if (!response.ok) {
      setStatus('error', `Error: ${data.error || 'Unknown error'}`);
      return;
    }

    if (data.pendingReview) {
      setStatus('info', 'Track B is pending human review. Review the KPI data and submit approval.');
      // TODO: render Track B review UI
      return;
    }

    setStatus('success', `Extraction complete. Session: ${data.sessionId}`);
    renderOutputs(data.outputs);

  } catch (err) {
    setStatus('error', `Request failed: ${err.message}`);
  } finally {
    submitBtn.disabled = false;
  }
});

function setStatus(type, message) {
  statusEl.className = `status ${type}`;
  statusEl.textContent = message;
  statusEl.classList.remove('hidden');
}

function renderOutputs(outputs) {
  if (!outputs) return;
  resultsEl.classList.remove('hidden');
  outputLinks.innerHTML = '';

  const files = [
    { label: 'Profile Document (.html)', path: outputs.documentPath },
    { label: 'Data Spreadsheet (.xlsx)', path: outputs.spreadsheetPath },
    { label: 'Pipeline Summary (.json)', path: outputs.summaryPath },
  ];

  for (const file of files) {
    if (!file.path) continue;
    const li = document.createElement('li');
    const a = document.createElement('a');
    a.href = `/api/download?file=${encodeURIComponent(file.path)}`;
    a.textContent = file.label;
    a.download = '';
    li.appendChild(a);
    outputLinks.appendChild(li);
  }
}
