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
    const progressPercentage = ((current + 1) / total) * 100;

    progressBar.value = progressPercentage;
    progressText.textContent = `${Math.min(current + 1, total)}/${total}`;
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
    inputs.forEach(input => {
        annotations[input.id] = input.value;
    });

    localStorage.setItem(`annotations_${annotator}`, JSON.stringify(annotations));
}

// Load the next row or show the finished message
function loadNextRow(data) {
    saveTranslations(data); // Auto-save before moving to next row

    if (currentRow < totalRows - 1) {
        currentRow++;
        displayRow(data, currentRow);
        updateProgress(currentRow, totalRows);
    } else {
        displayFinishedMessage();
    }
}

// Display finished message
function displayFinishedMessage() {
    const dialogueBox = document.getElementById("dialogue");
    const translationBox = document.getElementById("translation");

    dialogueBox.innerHTML = "<strong>All annotations finished</strong>";
    translationBox.innerHTML = "<strong>All annotations finished</strong>";

    updateProgress(totalRows, totalRows);
}

// Admin login submission
document.getElementById("admin-login-submit").addEventListener("click", () => {
    const username = document.getElementById("admin-username").value;
    const password = document.getElementById("admin-password").value;

    if (username === "Ira" && password === "qwerty12345") {
        alert("Admin login successful!");
        isAdmin = true;
        document.getElementById("admin-login").style.display = "none";
        document.getElementById("admin-dashboard").style.display = "block";
        loadAdminDashboard();
    } else {
        alert("Invalid username or password!");
    }
});

// Admin login toggle
document.getElementById("admin-login-button").addEventListener("click", () => {
    const adminLogin = document.getElementById("admin-login");
    adminLogin.style.display = adminLogin.style.display === "block" ? "none" : "block";
});

// Load Admin Dashboard
function loadAdminDashboard() {
    const progressList = document.getElementById("progress-list");
    progressList.innerHTML = "";

    for (const key in localStorage) {
        if (key.startsWith("annotations_")) {
            const annotatorName = key.replace("annotations_", "");
            const data = JSON.parse(localStorage.getItem(key));
            const progressRow = document.createElement("tr");
            progressRow.innerHTML = `
                <td>${annotatorName}</td>
                <td>${data.dialect || "N/A"}</td>
                <td>${Object.keys(data).length}/${totalRows}</td>
                <td><button class="details-button" onclick="viewDetails('${annotatorName}')">View</button></td>
            `;
            progressList.appendChild(progressRow);
        }
    }
}

// View annotation details
function viewDetails(annotatorName) {
    const annotationDetails = document.getElementById("annotation-details");
    const annotationBody = document.getElementById("annotation-body");
    annotationDetails.style.display = "block";

    const data = JSON.parse(localStorage.getItem(`annotations_${annotatorName}`));
    annotationBody.innerHTML = "";
    for (const [key, value] of Object.entries(data)) {
        const row = document.createElement("tr");
        row.innerHTML = `<td>${annotatorName}</td><td>${data.dialect}</td><td>${key}</td><td>${value}</td>`;
        annotationBody.appendChild(row);
    }
}

// Initialize the page
async function init() {
    const csvData = await loadCSV("data.csv");
    const parsedData = parseCSV(csvData);
    totalRows = parsedData.rows.length;

    // Set predefined usernames
    const usernameSelect = document.getElementById("username");
    ["Aldo", "Budi", "Cika"].forEach(name => {
        const option = document.createElement("option");
        option.value = name;
        option.textContent = name;
        usernameSelect.appendChild(option);
    });

    document.getElementById("username").addEventListener("change", () => {
        annotator = document.getElementById("username").value;
        currentRow = 0;
        displayRow(parsedData, currentRow);
    });

    document.getElementById("save-button").addEventListener("click", () => saveTranslations(parsedData));
    document.getElementById("next-button").addEventListener("click", () => loadNextRow(parsedData));
}

document.addEventListener("DOMContentLoaded", init);