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

// Save translations to a CSV file
function saveTranslations(data) {
    const inputs = document.querySelectorAll(".translation-input");

    // Update annotations object with current inputs
    inputs.forEach(input => {
        annotations[input.id] = input.value;
    });

    // Save progress in local storage
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

// Load saved translations from local storage
function loadTranslations() {
    const savedData = localStorage.getItem(`progress_${annotator}`);
    if (savedData) {
        const progress = JSON.parse(savedData);
        annotations = progress.annotations || {};
        currentRow = progress.currentRow || 0;
        alert("Translations loaded successfully!");
    } else {
        alert("No saved translations found.");
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

    const dialectSelect = document.getElementById("dialect");
    dialects.forEach(dialect => {
        let option = document.createElement("option");
        option.value = dialect;
        option.textContent = dialect;
        dialectSelect.appendChild(option);
    });

    // Annotator selection event
    userSelect.addEventListener("change", async () => {
        annotator = userSelect.value;
        if (!annotator) return;

        const csvData = await loadCSV("data.csv");
        const parsedData = parseCSV(csvData);
        totalRows = parsedData.rows.length;

        loadAnnotatorProgress();
        displayRow(parsedData, currentRow);

        // Event listeners for buttons
        document.getElementById("save-button").addEventListener("click", () => saveTranslations(parsedData));
        document.getElementById("load-button").addEventListener("click", loadTranslations);
        document.getElementById("next-button").addEventListener("click", () => loadNextRow(parsedData));

        updateProgress(currentRow, totalRows);
    });
}

document.addEventListener("DOMContentLoaded", init);
