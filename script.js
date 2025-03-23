// Global state variables
let currentRow = 0;
let totalRows = 0;
let annotator = "";
let annotations = {};
let isAdmin = false;
let users = {};

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

// Load users from users.csv and populate the dropdown
async function loadUsers() {
    const csvData = await loadCSV("users.csv");
    const parsedData = parseCSV(csvData);

    parsedData.rows.forEach(row => {
        const username = row[0];
        const dialect = row[1];
        const region = row[2];
        users[username] = { dialect, region };

        const usernameSelect = document.getElementById("username");
        const option = document.createElement("option");
        option.value = username;
        option.textContent = username;
        usernameSelect.appendChild(option);
    });
}

// Display user information (dialect and region) when username is selected
function updateUserInfo(username) {
    if (users[username]) {
        document.getElementById("dialect-info").textContent = users[username].dialect;
        document.getElementById("region-info").textContent = users[username].region;
    }
}

// Display progress
function updateProgress(current, total) {
    const progressBar = document.getElementById("progress-bar");
    const progressText = document.getElementById("progress-text");
    const progressPercentage = ((current + 1) / total) * 100;

    progressBar.value = progressPercentage;
    progressText.textContent = `${Math.min(current + 1, total)}/${total}`;

    const nextButton = document.getElementById("next-button");
    nextButton.textContent = current + 1 === total ? "Finish" : "Next";
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
function saveTranslations() {
    const inputs = document.querySelectorAll(".translation-input");
    inputs.forEach(input => {
        annotations[input.id] = input.value;
    });

    const userInfo = users[annotator] || {};
    annotations.dialect = userInfo.dialect || "N/A";
    localStorage.setItem(`annotations_${annotator}`, JSON.stringify(annotations));
}

// Load the next row or show the finished message
function loadNextRow(data) {
    saveTranslations();

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
            const progressValue = Object.keys(data).length / 8;
            progressRow.innerHTML = `
                <td>${annotatorName}</td>
                <td>${data.dialect || "N/A"}</td>
                <td>${Math.floor(progressValue)}/2</td>
                <td><button class="details-button" onclick="viewDetails('${annotatorName}')">View</button></td>
            `;
            progressList.appendChild(progressRow);
        }
    }
}

// View annotation details
async function viewDetails(annotatorName) {
    const annotationDetails = document.getElementById("annotation-details");
    const annotationBody = document.getElementById("annotation-body");
    const annotationTable = document.getElementById("annotation-table");
    annotationDetails.style.display = "block";

    // Load the CSV file to get the header columns dynamically
    const csvData = await loadCSV("data.csv");
    const parsedData = parseCSV(csvData);

    // Create table headers dynamically based on CSV headers
    const tableHead = annotationTable.querySelector("thead");
    tableHead.innerHTML = `
        <tr>
            <th>Annotator</th>
            <th>Dialect</th>
            ${parsedData.headers.map(header => `<th>${header}</th>`).join("")}
        </tr>
    `;

    // Load annotation data from localStorage
    const data = JSON.parse(localStorage.getItem(`annotations_${annotatorName}`)) || {};
    annotationBody.innerHTML = "";
    const row = document.createElement("tr");

    // Fill the row with annotation data
    row.innerHTML = `
        <td>${annotatorName}</td>
        <td>${data.dialect || "N/A"}</td>
        ${parsedData.headers.map(header => `<td>${data[header] || ""}</td>`).join("")}
    `;
    annotationBody.appendChild(row);
}

// Initialize the page
async function init() {
    await loadUsers();

    const csvData = await loadCSV("data.csv");
    const parsedData = parseCSV(csvData);
    totalRows = parsedData.rows.length;

    document.getElementById("username").addEventListener("change", () => {
        annotator = document.getElementById("username").value;
        updateUserInfo(annotator);

        annotations = JSON.parse(localStorage.getItem(`annotations_${annotator}`)) || {};
        if (Object.keys(annotations).length >= totalRows * 8) {
            displayFinishedMessage();
        } else {
            currentRow = 0;
            displayRow(parsedData, currentRow);
        }
    });

    document.getElementById("save-button").addEventListener("click", saveTranslations);
    document.getElementById("next-button").addEventListener("click", () => loadNextRow(parsedData));
}

document.addEventListener("DOMContentLoaded", init);