// Global state variables
let currentRow = 0;
let totalRows = 0;
let annotator = "";
let annotations = {};

// Utility function to load CSV data
async function loadCSV(url) {
    try {
        const response = await fetch(url);
        if (!response.ok) throw new Error("Failed to fetch CSV data");
        const data = await response.text();
        return data;
    } catch (error) {
        console.error("Error loading CSV:", error);
    }
}

// Parse CSV data
function parseCSV(data) {
    const lines = data.trim().split("\n");
    const headers = lines[0].split(",");
    const rows = lines.slice(1).map(row => row.split(","));
    return { headers, rows };
}

// Display progress
function updateProgress(current, total) {
    const progressBar = document.getElementById("progress-bar");
    const progressText = document.getElementById("progress-text");
    const progressPercentage = (current / total) * 100;

    progressBar.value = progressPercentage;
    progressText.textContent = `${current + 1}/${total}`;
}

// Load progress for the current annotator
function loadAnnotatorProgress() {
    const savedData = localStorage.getItem(`progress_${annotator}`);
    if (savedData) {
        const progress = JSON.parse(savedData);
        currentRow = progress.currentRow || 0;
        annotations = progress.annotations || {};
    } else {
        currentRow = 0;
        annotations = {};
    }
    updateProgress(currentRow, totalRows);
}

// Save progress for the current annotator
function saveAnnotatorProgress() {
    const progress = { currentRow, annotations };
    localStorage.setItem(`progress_${annotator}`, JSON.stringify(progress));
}

// Display a single row of dialogue and translation input
function displayRow(data, rowIndex) {
    const dialogueBox = document.getElementById("dialogue");
    const translationBox = document.getElementById("translation");

    dialogueBox.innerHTML = "";
    translationBox.innerHTML = "";

    const row = data.rows[rowIndex];
    data.headers.forEach((speaker, idx) => {
        const text = row[idx] || "";

        // Original dialogue display
        const dialogueDiv = document.createElement("div");
        dialogueDiv.className = "dialogue-item";
        dialogueDiv.innerHTML = `<strong>${speaker}:</strong> ${text}`;
        dialogueBox.appendChild(dialogueDiv);

        // Translation input display
        const inputDiv = document.createElement("div");
        inputDiv.className = "translation-item";
        const inputId = `${speaker}-${rowIndex}`;
        const savedTranslation = annotations[inputId] || "";
        inputDiv.innerHTML = `
            <label for="${inputId}">${speaker}:</label>
            <input type="text" id="${inputId}" class="translation-input" placeholder="Translate to your dialect" value="${savedTranslation}">
        `;
        translationBox.appendChild(inputDiv);
    });

    updateProgress(currentRow, totalRows);
}

// Save translations to localStorage
function saveTranslations(data) {
    const inputs = document.querySelectorAll(".translation-input");

    // Update annotations object with current inputs
    inputs.forEach(input => {
        annotations[input.id] = input.value;
    });

    // Save progress in local storage
    saveAnnotatorProgress();

    alert("Translations saved successfully!");
}

// Show the summary of all annotations
function showSummary(data) {
    const summaryBox = document.getElementById("summary-box");
    const summaryDiv = document.getElementById("summary");
    summaryDiv.innerHTML = "";

    data.rows.forEach((row, rowIndex) => {
        const annotatedRow = data.headers.map((speaker, colIndex) => annotations[`${speaker}-${rowIndex}`] || "");
        const rowDiv = document.createElement("div");
        rowDiv.className = "summary-item";
        rowDiv.innerText = `Row ${rowIndex + 1}: ${annotatedRow.join(" | ")}`;
        summaryDiv.appendChild(rowDiv);
    });

    summaryBox.style.display = "block";
}

// Download all annotations as CSV
function downloadAnnotations(data) {
    const translatedRows = data.rows.map((row, rowIndex) => 
        data.headers.map((speaker, colIndex) => annotations[`${speaker}-${rowIndex}`] || "")
    );
    const csvContent = [data.headers.join(",")].concat(
        translatedRows.map(row => row.join(","))
    ).join("\n");

    // Trigger download
    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "annotated_translations.csv";
    a.click();
    URL.revokeObjectURL(url);
}

// Load the next row or show summary if finished
function loadNextRow(data) {
    if (currentRow < totalRows - 1) {
        currentRow++;
        displayRow(data, currentRow);
        updateProgress(currentRow, totalRows);
        saveAnnotatorProgress();
    } else {
        showSummary(data);
    }
}

// Initialize the page
async function init() {
    const users = ["Annotator1", "Annotator2", "Annotator3"];

    // Populate annotator dropdown
    const userSelect = document.getElementById("username");
    users.forEach(user => {
        let option = document.createElement("option");
        option.value = user;
        option.textContent = user;
        userSelect.appendChild(option);
    });

    // Handle annotator selection
    userSelect.addEventListener("change", async () => {
        annotator = userSelect.value;
        if (!annotator) return;

        const csvData = await loadCSV("data.csv");
        const parsedData = parseCSV(csvData);
        totalRows = parsedData.rows.length;

        loadAnnotatorProgress();
        displayRow(parsedData, currentRow);

        // Event listeners
        document.getElementById("save-button").addEventListener("click", () => saveTranslations(parsedData));
        document.getElementById("next-button").addEventListener("click", () => loadNextRow(parsedData));
        document.getElementById("download-button").addEventListener("click", () => downloadAnnotations(parsedData));

        updateProgress(currentRow, totalRows);
    });
}

document.addEventListener("DOMContentLoaded", init);
