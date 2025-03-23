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
    progressText.textContent = `${current}/${total}`;
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
        const div = document.createElement("div");
        div.className = "dialogue-item";
        div.innerHTML = `<strong>${speaker}:</strong> ${text}`;
        dialogueBox.appendChild(div);

        const inputDiv = document.createElement("div");
        inputDiv.className = "translation-item";
        const inputId = `${speaker}-${rowIndex}`;
        inputDiv.innerHTML = `
            <label for="${inputId}">${speaker}:</label>
            <input type="text" id="${inputId}" class="translation-input" placeholder="Translate to your dialect" value="${annotations[inputId] || ''}">
        `;
        translationBox.appendChild(inputDiv);
    });
}

// Save translations to a file
function saveTranslations(data) {
    const inputs = document.querySelectorAll(".translation-input");

    inputs.forEach(input => {
        annotations[input.id] = input.value;
    });

    saveAnnotatorProgress();

    // Prepare CSV data
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
    a.download = "translate.csv";
    a.click();
    URL.revokeObjectURL(url);

    alert("Translations saved successfully!");
}

// Load the next row
function loadNextRow(data) {
    if (currentRow < totalRows - 1) {
        currentRow++;
        displayRow(data, currentRow);
        updateProgress(currentRow, totalRows);
        saveAnnotatorProgress();
    } else {
        alert("All rows have been completed!");
    }
}

// Initialize the page
async function init() {
    const users = ["Annotator1", "Annotator2", "Annotator3"];
    const dialects = ["Dialect A", "Dialect B", "Dialect C"];

    // Populate dropdowns
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
        const csvData = await loadCSV("data.csv");
        const parsedData = parseCSV(csvData);
        totalRows = parsedData.rows.length;
        loadAnnotatorProgress();
        displayRow(parsedData, currentRow);

        // Event listeners for buttons
        document.getElementById("save-button").addEventListener("click", () => saveTranslations(parsedData));
        document.getElementById("next-button").addEventListener("click", () => loadNextRow(parsedData));

        updateProgress(currentRow, totalRows);
    });
}

document.addEventListener("DOMContentLoaded", init);
