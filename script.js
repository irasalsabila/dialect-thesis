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

// Display dialogue in the left box
function displayDialogue(data) {
    const dialogueBox = document.getElementById("dialogue");
    dialogueBox.innerHTML = ""; // Clear previous content

    data.rows.forEach((row, index) => {
        row.forEach((text, idx) => {
            const speaker = data.headers[idx];
            const div = document.createElement("div");
            div.className = "dialogue-item";
            div.innerHTML = `
                <strong>${speaker}</strong>: ${text}
                <input type="text" placeholder="Translate to your dialect" class="translation-input" id="${speaker}-${index}">
            `;
            dialogueBox.appendChild(div);
        });
    });
}

// Populate dropdowns
function populateDropdowns(users, dialects) {
    const userSelect = document.getElementById("username");
    const dialectSelect = document.getElementById("dialect");

    users.forEach(user => {
        let option = document.createElement("option");
        option.value = user;
        option.textContent = user;
        userSelect.appendChild(option);
    });

    dialects.forEach(dialect => {
        let option = document.createElement("option");
        option.value = dialect;
        option.textContent = dialect;
        dialectSelect.appendChild(option);
    });
}

// Update progress bar
function updateProgress(progress) {
    const progressBar = document.getElementById("progress-bar");
    progressBar.value = progress;
}

// Save translation data (Mocking POST request)
function saveTranslations() {
    const inputs = document.querySelectorAll(".translation-input");
    const translations = {};

    inputs.forEach(input => {
        const id = input.id;
        const text = input.value;
        translations[id] = text;
    });

    console.log("Saving translations:", translations);

    // Mock saving to local storage for demonstration
    localStorage.setItem("translations", JSON.stringify(translations));
    alert("Translations saved successfully!");
}

// Load saved translations (Mocking GET request)
function loadTranslations() {
    const savedData = localStorage.getItem("translations");
    if (savedData) {
        const translations = JSON.parse(savedData);
        Object.keys(translations).forEach(id => {
            const input = document.getElementById(id);
            if (input) {
                input.value = translations[id];
            }
        });
        alert("Translations loaded successfully!");
    } else {
        alert("No saved translations found.");
    }
}

// Initialize the page
async function init() {
    // Mock user and dialect data
    const users = ["Annotator1", "Annotator2", "Annotator3"];
    const dialects = ["Dialect A", "Dialect B", "Dialect C"];

    // Populate dropdowns
    populateDropdowns(users, dialects);

    // Load dialogue data from CSV
    const csvData = await loadCSV("data.csv");
    const parsedData = parseCSV(csvData);
    displayDialogue(parsedData);

    // Event listener for saving translations
    const saveButton = document.getElementById("save-button");
    saveButton.addEventListener("click", saveTranslations);

    // Event listener for loading saved translations
    const loadButton = document.getElementById("load-button");
    loadButton.addEventListener("click", loadTranslations);

    // Initial progress
    updateProgress(30); // Mocked value
}

document.addEventListener("DOMContentLoaded", init);
