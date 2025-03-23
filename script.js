let totalRows = 0;
let currentIndex = 0;
let annotations = [];
let annotatorProgress = {};
let users = [];
let originalData = [];
let localStorageKey = "annotationData";

// Load CSV data
async function loadCSV(filename) {
    const response = await fetch(filename);
    const text = await response.text();
    return text;
}

// Parse CSV
function parseCSV(text) {
    const lines = text.split("\n");
    const headers = lines[0].split(",");
    const rows = lines.slice(1).map(line => line.split(","));
    return { headers, rows };
}

// Load users from CSV
async function loadUsers() {
    const csvData = await loadCSV("users.csv");
    const parsedData = parseCSV(csvData);
    users = parsedData.rows;
    populateUserDropdown(users);
}

// Populate user dropdown
function populateUserDropdown(users) {
    const usernameSelect = document.getElementById("username");
    users.forEach(user => {
        const option = document.createElement("option");
        option.value = user[0];
        option.textContent = user[0];
        usernameSelect.appendChild(option);
    });
}

// Load annotation data from localStorage
function loadLocalAnnotations() {
    const savedData = localStorage.getItem(localStorageKey);
    return savedData ? JSON.parse(savedData) : {};
}

// Save annotation data to localStorage
function saveLocalAnnotations(data) {
    localStorage.setItem(localStorageKey, JSON.stringify(data));
}

// Initialize page
async function init() {
    await loadUsers();
    const csvData = await loadCSV("data.csv");
    const parsedData = parseCSV(csvData);
    totalRows = parsedData.rows.length;
    originalData = parsedData.rows;
    annotatorProgress = loadLocalAnnotations();
    updateProgress();
}

// Update progress
function updateProgress() {
    const progressText = `${currentIndex}/${totalRows}`;
    document.getElementById("progress-text").textContent = progressText;
    const progressPercent = (currentIndex / totalRows) * 100;
    document.getElementById("progress-bar-fill").style.width = `${progressPercent}%`;
}

// Display dialogue and translation
function displayDialogue() {
    const dialogueBox = document.getElementById("original-dialogue");
    const translationBox = document.getElementById("translation-box");
    dialogueBox.innerHTML = "";
    translationBox.innerHTML = "";

    if (currentIndex >= totalRows) {
        dialogueBox.innerHTML = "<p>All annotations finished</p>";
        translationBox.innerHTML = "<p>All annotations finished</p>";
        return;
    }

    const row = originalData[currentIndex];
    row.forEach((text, index) => {
        const dialogueDiv = document.createElement("div");
        dialogueDiv.innerHTML = `<b>${originalData[0][index]}:</b> ${text}`;
        dialogueBox.appendChild(dialogueDiv);

        const translationDiv = document.createElement("div");
        translationDiv.innerHTML = `<label>${originalData[0][index]}:</label>
                                    <textarea id="translation-${index}" placeholder="Translate to your dialect"></textarea>`;
        translationBox.appendChild(translationDiv);
    });
}

// Save annotations
function saveAnnotations() {
    const username = document.getElementById("username").value;
    const translations = [];
    originalData[currentIndex].forEach((_, index) => {
        const input = document.getElementById(`translation-${index}`);
        translations.push(input.value);
    });

    if (!annotatorProgress[username]) {
        annotatorProgress[username] = [];
    }

    annotatorProgress[username].push(translations);
    saveLocalAnnotations(annotatorProgress);
    currentIndex++;
    updateProgress();
    displayDialogue();
}

// Reset annotations
function resetAnnotations() {
    annotatorProgress = {};
    saveLocalAnnotations(annotatorProgress);
    currentIndex = 0;
    updateProgress();
    displayDialogue();
}

// Next button click
function nextDialogue() {
    saveAnnotations();
    if (currentIndex >= totalRows) {
        alert("All annotations finished!");
    } else {
        displayDialogue();
    }
}

// Admin login
function adminLogin() {
    const username = document.getElementById("admin-username").value;
    const password = document.getElementById("admin-password").value;
    if (username === "Ira" && password === "qwerty12345") {
        document.getElementById("admin-dashboard").style.display = "block";
        loadAdminDashboard();
    } else {
        alert("Invalid username or password!");
    }
}

// Load admin dashboard
function loadAdminDashboard() {
    const dashboardBody = document.getElementById("dashboard-body");
    dashboardBody.innerHTML = "";

    Object.keys(annotatorProgress).forEach(username => {
        const userProgress = annotatorProgress[username].length;
        const row = document.createElement("tr");
        row.innerHTML = `<td>${username}</td>
                         <td>${userProgress}/${totalRows}</td>
                         <td><button onclick="viewDetails('${username}')">View</button></td>`;
        dashboardBody.appendChild(row);
    });
}

// View annotation details
function viewDetails(username) {
    const detailBody = document.getElementById("annotation-body");
    detailBody.innerHTML = "";

    annotatorProgress[username].forEach((annotation, index) => {
        const row = document.createElement("tr");
        row.innerHTML = `<td>${username}</td><td>${index + 1}</td>`;
        annotation.forEach(text => {
            row.innerHTML += `<td>${text}</td>`;
        });
        detailBody.appendChild(row);
    });

    document.getElementById("annotation-details").style.display = "block";
}

// Event listeners
document.getElementById("save-button").addEventListener("click", saveAnnotations);
document.getElementById("next-button").addEventListener("click", nextDialogue);
document.getElementById("admin-login").addEventListener("click", adminLogin);
document.getElementById("reset-button").addEventListener("click", resetAnnotations);

// Initialize the page
init();