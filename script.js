document.addEventListener("DOMContentLoaded", function() {
    // Mock user data
    const users = ["Annotator1", "Annotator2", "Annotator3"];
    const dialects = ["Dialect A", "Dialect B", "Dialect C"];
    
    // Populate dropdowns
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

    // Update progress bar
    const progressBar = document.getElementById("progress-bar");
    progressBar.value = 30; // Mock progress
});
