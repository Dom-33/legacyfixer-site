const inputText = document.querySelector("#inputText");
const resultBox = document.querySelector("#resultBox");
const fileInput = document.querySelector("#fileInput");
const fixButton = document.querySelector("#fixButton");
const sampleButton = document.querySelector("#sampleButton");

const sample = `flask==0.12
jinja2==2.10
requests==2.19.1
urllib3==1.24.1`;

fileInput.addEventListener("change", async () => {
  const file = fileInput.files?.[0];
  if (!file) return;
  inputText.value = await file.text();
  resultBox.textContent = `Loaded ${file.name}. Ready for static dependency preview.`;
});

sampleButton.addEventListener("click", () => {
  inputText.value = sample;
  resultBox.textContent = "Sample Python dependencies loaded. Click Preview dependency check.";
});

fixButton.addEventListener("click", () => {
  const text = inputText.value.trim();

  if (!text) {
    resultBox.textContent = "Paste or upload a Python dependency file first.";
    return;
  }

  const findings = [];

  if (/flask==0\.12/i.test(text)) {
    findings.push({
      issue: "Outdated Flask dependency",
      fix: "flask==3.1.3"
    });
  }

  if (/jinja2==2\.10/i.test(text)) {
    findings.push({
      issue: "Outdated Jinja2 dependency",
      fix: "jinja2==3.1.6"
    });
  }

  if (/urllib3==1\.24\.1/i.test(text)) {
    findings.push({
      issue: "Old urllib3 version",
      fix: "urllib3==2.5.0"
    });
  }

  if (!findings.length) {
    resultBox.textContent =
`Analysis complete.

No demo rule matched this input.

Beta engine scope:
- selected GitHub repositories
- Python dependency/security checks
- queued cloud scans
- controlled pull requests through repo settings

This public page is a static dependency preview, not the live GitHub App.`;
    return;
  }

  const output = [
    "Analysis complete.",
    "",
    "Demo dependency findings:",
    ...findings.map((f, i) => `${i + 1}. ${f.issue} -> ${f.fix}`),
    "",
    "Potential dependency updates:",
    ...findings.map(f => `+ ${f.fix}`),
    "",
    "No repository or file was changed. This is a static dependency preview."
  ];

  resultBox.textContent = output.join("\n");
});
