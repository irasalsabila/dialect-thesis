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
    const response = await fetch(file);
    return await response.text();
}

// Parse CSV data
function parseCSV(data) {
    const rows = data.split('\n');
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

// Update user info when selecting a user
function onUserChange() {
    const usernameSelect = document.getElementById("username");
    currentAnnotator = usernameSelect.value;

    const user = usersData.find(u => u[0] === currentAnnotator);
    if (user) {
        currentDialect = user[1];
        currentRegion = user[2];
        document.getElementById("dialect").textContent = `Dialect: ${currentDialect}`;
        document.getElementById("region").textContent = `Region: ${currentRegion}`;
    }
    loadAnnotations();
    displayDialogue();
}

// Display dialogue and input fields
function displayDialogue() {
    const dialogueBox = document.getElementById("original-dialogue");
    const translateBox = document.getElementById("translate-dialogue");
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
        const translateInput = document.createElement("input");
        translateInput.type = "text";
        translateInput.placeholder = "Translate to your dialect";
        translateInput.value = annotations[currentRow]?.[index] || "";
        translateInput.oninput = () => saveTranslation(index, translateInput.value);

        dialogueBox.innerHTML += `<p><strong>${header}:</strong> ${dialogue}</p>`;
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
    const progressText = document.getElementById("progress-text");
    const progress = Math.min(currentRow / totalRows * 100, 100);
    progressBar.style.width = progress + "%";
    progressText.textContent = `${currentRow}/${totalRows}`;
}

// Move to next row
function nextRow() {
    currentRow++;
    if (currentRow >= totalRows) {
        currentRow = totalRows;
        alert("All annotations completed!");
    }
    displayDialogue();
}

// Save all annotations to CSV
function downloadAnnotations() {
    let csvContent = "Annotator,Dialect,Region";
    parsedData.headers.forEach(header => {
        csvContent += `,${header}`;
    });
    csvContent += "\n";

    Object.keys(annotations).forEach(row => {
        const rowData = annotations[row].join(",");
        csvContent += `${currentAnnotator},${currentDialect},${currentRegion},${rowData}\n`;
    });

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'annotations.csv';
    a.click();
}

// Reset all annotations
function resetAnnotations() {
    localStorage.clear();
    annotations = {};
    currentRow = 0;
    updateProgress();
    displayDialogue();
}

// Admin login
function adminLogin() {
    const username = document.getElementById("admin-username").value;
    const password = document.getElementById("admin-password").value;
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
    const tableBody = document.getElementById("dashboard-table-body");
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
            <td><button onclick="viewAnnotations('${annotator}')">View</button></td>
        </tr>`;
        tableBody.innerHTML += row;
    });
}

// View annotations
function viewAnnotations(annotator) {
    const data = JSON.parse(localStorage.getItem(`annotations_${annotator}`));
    alert(`Annotations for ${annotator}: ${JSON.stringify(data)}`);
}

// Initialize on page load
window.onload = init;