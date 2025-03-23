// Global state variables
let currentRow = 0;
let totalRows = 0;
let annotator = "";
let annotations = {};
let isAdmin = false;

// Simple hashing function using SHA-256
async function hashPassword(password) {
    const encoder = new TextEncoder();
    const data = encoder.encode(password);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(byte => byte.toString(16).padStart(2, '0')).join('');
}

// Admin login with hashed password check
async function adminLogin() {
    const username = document.getElementById("admin-username").value;
    const password = document.getElementById("admin-password").value;
    const hashedPassword = await hashPassword(password);

    const validHashedPassword = "8cb2237d0679ca88db6464eac60da96345513964";

    if (username === "ira" && hashedPassword === validHashedPassword) {
        isAdmin = true;
        alert("Admin login successful!");
        document.getElementById("admin-login").style.display = "none";
        document.getElementById("admin-dashboard").style.display = "block";
        loadAdminDashboard();
    } else {
        alert("Invalid username or password!");
    }
}

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

// Display "All annotations finished" when done
function displayFinishedMessage() {
    const dialogueBox = document.getElementById("dialogue");
    const translationBox = document.getElementById("translation");

    dialogueBox.innerHTML = "<strong>All annotations finished</strong>";
    translationBox.innerHTML = "<strong>All annotations finished</strong>";

    updateProgress(totalRows, totalRows);
}

// Save progress for the current annotator
function saveAnnotatorProgress() {
    const progress = { currentRow, annotations };
    localStorage.setItem(`progress_${annotator}`, JSON.stringify(progress));
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

// Display a single row of dialogue and translation input
function displayRow(data, rowIndex) {
    const dialogueBox = document.getElementById("dialogue");
    const translationBox = document.getElementById("translation");

    dialogueBox.innerHTML = "";
    translationBox.innerHTML = "";

    if (rowIndex >= data.rows.length) {
        displayFinishedMessage();
        return;
    }

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

// Load the next row or show the finished message
function loadNextRow(data) {
    if (currentRow < totalRows - 1) {
        currentRow++;
        displayRow(data, currentRow);
        updateProgress(currentRow, totalRows);
        saveAnnotatorProgress();
    } else {
        displayFinishedMessage();
    }
}

// Annotator selection logic
async function onAnnotatorChange() {
    annotator = document.getElementById("username").value;
    if (!annotator) return;

    const csvData = await loadCSV("data.csv");
    const parsedData = parseCSV(csvData);
    totalRows = parsedData.rows.length;

    loadAnnotatorProgress();
    displayRow(parsedData, currentRow);

    // Event listeners for buttons
    document.getElementById("save-button").addEventListener("click", () => saveTranslations(parsedData));
    document.getElementById("next-button").addEventListener("click", () => loadNextRow(parsedData));

    updateProgress(currentRow, totalRows);
}

// Admin dashboard progress list
function loadAdminDashboard() {
    const progressList = document.getElementById("progress-list");
    progressList.innerHTML = "<h3>Annotator Progress:</h3>";

    for (const key in localStorage) {
        if (key.startsWith("progress_")) {
            const annotatorName = key.replace("progress_", "");
            const progress = JSON.parse(localStorage.getItem(key));
            const completed = progress.currentRow + 1;
            progressList.innerHTML += `${annotatorName} - ${completed}/${totalRows}<br>`;
        }
    }
}

// Initialize the page
async function init() {
    const users = ["Annotator1", "Annotator2", "Annotator3"];

    const userSelect = document.getElementById("username");
    users.forEach(user => {
        let option = document.createElement("option");
        option.value = user;
        option.textContent = user;
        userSelect.appendChild(option);
    });

    // Event listeners
    document.getElementById("admin-login-button").addEventListener("click", adminLogin);
    userSelect.addEventListener("change", onAnnotatorChange);
}

document.addEventListener("DOMContentLoaded", init);