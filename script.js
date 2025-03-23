// Global Variables
let currentRow = 0;
let totalRows = 0;
let currentAnnotator = null;
let annotations = {};
let parsedData = [];
let usersData = [];
let currentDialect = "";
let currentRegion = "";

// Load CSV data (async)
async function loadCSV(file) {
    try {
        const response = await fetch(file);
        if (!response.ok) throw new Error(`Failed to load ${file}`);
        return await response.text();
    } catch (error) {
        console.error(error);
        alert(`Error loading file: ${file}`);
        return "";
    }
}

// Parse CSV data
function parseCSV(data) {
    const rows = data.trim().split('\n');
    const headers = rows[0].split(',');
    const parsedRows = rows.slice(1).map(row => row.split(','));
    return { headers, rows: parsedRows };
}

// Initialize the interface
async function init() {
    const csvData = await loadCSV('data.csv');
    const userCsvData = await loadCSV('users.csv');
    parsedData = parseCSV(csvData);
    usersData = parseCSV(userCsvData).rows;
    totalRows = parsedData.rows.length;
    populateUserDropdown();
    updateProgress();
}

// Populate user dropdown from users.csv
function populateUserDropdown() {
    const usernameSelect = document.getElementById("username");
    usernameSelect.innerHTML = '<option value="">Select User</option>';
    usersData.forEach(user => {
        const option = document.createElement("option");
        option.value = user[0];
        option.textContent = user[0];
        usernameSelect.appendChild(option);
    });
}

// Handle user change
function onUserChange() {
    const usernameSelect = document.getElementById("username");
    currentAnnotator = usernameSelect.value;

    const user = usersData.find(u => u[0] === currentAnnotator);
    if (user) {
        currentDialect = user[1];
        currentRegion = user[2];
        document.getElementById("dialect").textContent = currentDialect;
        document.getElementById("region").textContent = currentRegion;
    }
    loadAnnotations();
    displayDialogue();
}

// Display dialogue and input fields
function displayDialogue() {
    const dialogueBox = document.getElementById("dialogue-content");
    const translateBox = document.getElementById("translation-content");
    dialogueBox.innerHTML = "";
    translateBox.innerHTML = "";

    if (currentRow >= totalRows) {
        dialogueBox.innerHTML = "<p>All annotations finished</p>";
        translateBox.innerHTML = "<p>All annotations finished</p>";
        updateProgress();
        return;
    }

    const row = parsedData.rows[currentRow];
    parsedData.headers.forEach((header, index) => {
        const dialogue = row[index];

        // Original Dialogue Display
        const dialogueElement = document.createElement("p");
        dialogueElement.innerHTML = `<strong>${header}:</strong> ${dialogue}`;
        dialogueBox.appendChild(dialogueElement);

        // Translation Box with Speaker Name
        const translateLabel = document.createElement("label");
        translateLabel.textContent = `${header}:`;
        translateLabel.style.fontWeight = "bold";
        const translateInput = document.createElement("input");
        translateInput.type = "text";
        translateInput.required = true; // Make input required
        translateInput.placeholder = "Translate to your dialect";
        translateInput.value = annotations[currentRow]?.[index] || "";
        translateInput.oninput = () => saveTranslation(index, translateInput.value);

        // Add the label and input to the translation box
        translateBox.appendChild(translateLabel);
        translateBox.appendChild(translateInput);
    });

    updateProgress();
}

// Save translation for the current row
function saveTranslation(index, value) {
    if (!annotations[currentRow]) {
        annotations[currentRow] = [];
    }
    annotations[currentRow][index] = value;
    saveAnnotations();
}

// Validate all translations are filled
function validateTranslations() {
    const inputs = document.querySelectorAll("#translation-content input");
    for (let input of inputs) {
        if (input.value.trim() === "") {
            alert("Please fill all translation fields before saving or moving to the next row.");
            return false;
        }
    }
    return true;
}

// Save annotations to localStorage
function saveAnnotations() {
    localStorage.setItem(`annotations_${currentAnnotator}`, JSON.stringify(annotations));
}

// Load annotations from localStorage
function loadAnnotations() {
    const storedData = localStorage.getItem(`annotations_${currentAnnotator}`);
    annotations = storedData ? JSON.parse(storedData) : {};
    currentRow = Object.keys(annotations).length;
    updateProgress();
    displayDialogue();
}

// Update progress bar
function updateProgress() {
    const progressBar = document.getElementById("progress-bar-fill");
    const progressText = document.getElementById("progress");
    const progress = Math.min(currentRow / totalRows * 100, 100);
    progressBar.style.width = progress + "%";
    progressText.textContent = `${currentRow}/${totalRows}`;
}

// Move to next row
function nextRow() {
    collectAllTranslations();  // Collect all inputs before moving to the next row
    if (validateTranslations()) {
        currentRow++;
        if (currentRow >= totalRows) {
            currentRow = totalRows;
            alert("All annotations completed!");
        }
        displayDialogue();
    }
}

// Reset all annotations
function resetAnnotations() {
    localStorage.clear();
    annotations = {};
    currentRow = 0;
    updateProgress();
    displayDialogue();
    alert("All annotations have been reset!");
}

// Admin login
function adminLogin() {
    const username = prompt("Enter Admin Username:");
    const password = prompt("Enter Admin Password:");

    if (username === "ira" && password === "1234") {
        alert("Admin login successful!");
        displayAdminDashboard();
    } else {
        alert("Invalid credentials!");
    }
}

// Display admin dashboard
function displayAdminDashboard() {
    const dashboard = document.getElementById("admin-dashboard");
    dashboard.style.display = "block";
    const tableBody = document.getElementById("dashboard-body");
    tableBody.innerHTML = "";

    usersData.forEach(user => {
        const annotator = user[0];
        const dialect = user[1];
        const annotationCount = localStorage.getItem(`annotations_${annotator}`) ? Object.keys(JSON.parse(localStorage.getItem(`annotations_${annotator}`))).length : 0;
        const progress = `${annotationCount}/${totalRows}`;

        const row = `<tr>
            <td>${annotator}</td>
            <td>${dialect}</td>
            <td>${progress}</td>
            <td><button class="view-btn" onclick="viewAnnotations('${annotator}')">View</button></td>
        </tr>`;
        tableBody.innerHTML += row;
    });
}

// View annotations in a structured table format and enable download
function viewAnnotations(annotator) {
    const data = JSON.parse(localStorage.getItem(`annotations_${annotator}`)) || {};
    const annotationTable = document.getElementById("annotation-table");
    const annotationHeader = document.getElementById("annotation-header");
    const annotationBody = document.getElementById("annotation-body");
    annotationHeader.innerHTML = "";
    annotationBody.innerHTML = "";

    const user = usersData.find(u => u[0] === annotator);
    const dialect = user ? user[1] : "Unknown";

    // Generate headers dynamically
    const headers = ["annotator", "dialect", ...parsedData.headers];
    let csvContent = headers.join(",") + "\n";

    // Create header row
    const headerRow = document.createElement("tr");
    headers.forEach(header => {
        const th = document.createElement("th");
        th.textContent = header;
        headerRow.appendChild(th);
    });
    annotationHeader.appendChild(headerRow);

    // Create table rows and CSV content
    Object.keys(data).forEach((rowIndex) => {
        const row = data[rowIndex];
        const tr = document.createElement("tr");

        // Ensure annotation and dialect columns are filled
        const rowData = [annotator, dialect];
        
        // Add annotation and dialect cells
        const annotationCell = document.createElement("td");
        annotationCell.textContent = annotator;
        tr.appendChild(annotationCell);

        const dialectCell = document.createElement("td");
        dialectCell.textContent = dialect;
        tr.appendChild(dialectCell);

        // Add data from CSV columns
        row.forEach((value) => {
            const td = document.createElement("td");
            td.textContent = value || "-";
            tr.appendChild(td);
            rowData.push(value || "-");
        });

        annotationBody.appendChild(tr);
        csvContent += rowData.join(",") + "\n";
    });

    // Add download button for CSV
    const downloadBtn = document.getElementById("download-annotations");
    downloadBtn.style.display = "inline-block";
    downloadBtn.onclick = () => downloadCSV(csvContent, `${annotator}_annotations.csv`);

    // Show annotation details
    const annotationDetails = document.getElementById("annotation-details");
    annotationDetails.style.display = "block";
}


// Download CSV function
function downloadCSV(content, filename) {
    const blob = new Blob([content], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = filename;
    link.click();
}

// Close the annotation details view
function closeAnnotationDetails() {
    const annotationDetails = document.getElementById("annotation-details");
    annotationDetails.style.display = "none";
}

// Save current progress without moving to the next row
function saveCurrentProgress() {
    collectAllTranslations();  // Collect all inputs before saving
    if (validateTranslations()) {
        saveAnnotations();
        alert("Progress saved!");
    }
}

// Collect all translation inputs before saving
function collectAllTranslations() {
    const inputs = document.querySelectorAll("#translation-content input");
    inputs.forEach((input, index) => {
        const value = input.value.trim();
        saveTranslation(index, value);
    });
}

// Event listeners
document.getElementById("username").addEventListener("change", onUserChange);
document.getElementById("next").addEventListener("click", nextRow);
document.getElementById("save").addEventListener("click", saveCurrentProgress);
document.getElementById("reset").addEventListener("click", resetAnnotations);
document.getElementById("admin-login").addEventListener("click", adminLogin);

// Initialize on page load
window.onload = init;