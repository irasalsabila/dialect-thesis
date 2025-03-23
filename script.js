// Global state variables
let currentRow = 0;
let totalRows = 0;
let annotator = "";
let annotations = {};
let isAdmin = false;

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

// Save translations
function saveTranslations(data) {
    const inputs = document.querySelectorAll(".translation-input");
    inputs.forEach(input => {
        annotations[input.id] = input.value;
    });
    saveAnnotatorProgress();
    alert("Translations saved successfully!");
}

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

    const validHashedPassword = "78186cf44fa8a43d8c3d6e705a0f17e5d706bc3cf69b61f0a649a3cf9b27f203";

    if (username === "Ira" && hashedPassword === validHashedPassword) {
        isAdmin = true;
        alert("Admin login successful!");
        document.getElementById("admin-login").style.display = "none";
        document.getElementById("admin-dashboard").style.display = "block";
        loadAdminDashboard();
    } else {
        alert("Invalid username or password!");
    }
}

// Load admin dashboard
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

// Admin download all annotations
function downloadAllAnnotations() {
    let allAnnotations = [];
    for (const key in localStorage) {
        if (key.startsWith("progress_")) {
            const progress = JSON.parse(localStorage.getItem(key));
            allAnnotations.push(progress.annotations);
        }
    }
    const blob = new Blob([JSON.stringify(allAnnotations, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "all_annotations.json";
    a.click();
    URL.revokeObjectURL(url);
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

// Initialize the page
async function init() {
    const users = ["Annotator1", "Annotator2", "Annotator3", "Ira"];

    const userSelect = document.getElementById("username");
    users.forEach(user => {
        let option = document.createElement("option");
        option.value = user;
        option.textContent = user;
        userSelect.appendChild(option);
    });

    // Event listeners
    document.getElementById("save-button").addEventListener("click", saveTranslations);
    document.getElementById("next-button").addEventListener("click", loadNextRow);
    document.getElementById("admin-login-button").addEventListener("click", adminLogin);
    document.getElementById("admin-download-button").addEventListener("click", downloadAllAnnotations);

    // Admin login section visibility
    if (isAdmin) {
        document.getElementById("admin-login").style.display = "none";
        document.getElementById("admin-dashboard").style.display = "block";
    } else {
        document.getElementById("admin-login").style.display = "block";
    }
}

document.addEventListener("DOMContentLoaded", init);