document.addEventListener("DOMContentLoaded", () => {
    // API URL base
    const API_URL = "http://localhost:5000/api";
    
    // Check authentication token
    const token = localStorage.getItem("token");
    if (!token) {
        // Redirect to login if not authenticated
        window.location.href = "index.html";
        return;
    }
    
    // Set up Auth header for API requests
    const authHeader = { 'Authorization': 'Bearer ' + token };
    
    // Get job ID from URL parameter
    const urlParams = new URLSearchParams(window.location.search);
    const jobId = urlParams.get('id');
    
    if (!jobId) {
        alert("No job ID specified");
        window.location.href = "home.html";
        return;
    }
    
    // Load dark mode preference
    if (localStorage.getItem("dark-mode") === "enabled") {
        document.body.classList.add("dark-mode");
        document.querySelectorAll("header, nav a, button").forEach(el => el.classList.add("dark-mode"));
    }

    // Dark mode toggle
    const darkModeToggle = document.getElementById("dark-mode-toggle");
    if (darkModeToggle) {
        darkModeToggle.addEventListener("click", () => {
            document.body.classList.toggle("dark-mode");
            document.querySelectorAll("header, nav a, button").forEach(el => el.classList.toggle("dark-mode"));

            if (document.body.classList.contains("dark-mode")) {
                localStorage.setItem("dark-mode", "enabled");
            } else {
                localStorage.setItem("dark-mode", "disabled");
            }
        });
    }
    
    // Add logout functionality
    document.getElementById('logout-btn').addEventListener('click', function(e) {
        e.preventDefault();
        localStorage.removeItem('token');
        window.location.href = 'index.html';
    });
    
    // Back to list button
    document.getElementById('back-btn').addEventListener('click', () => {
        window.location.href = 'home.html';
    });
    
    // Load job details
    loadJobDetails();
    
    // Button event listeners
    document.getElementById('edit-btn').addEventListener('click', toggleEditMode);
    document.getElementById('cancel-edit-btn').addEventListener('click', cancelEdit);
    document.getElementById('delete-btn').addEventListener('click', deleteJob);
    document.getElementById('edit-form').addEventListener('submit', saveChanges);
    
    // Function to load job details
    async function loadJobDetails() {
        try {
            const response = await fetch(`${API_URL}/jobs/${jobId}`, {
                headers: {
                    ...authHeader,
                    'Content-Type': 'application/json'
                }
            });
            
            const data = await response.json();
            
            if (data.success) {
                displayJobDetails(data.job);
            } else {
                console.error("Failed to load job details:", data.message);
                alert("Failed to load job details. Redirecting to job list.");
                window.location.href = "home.html";
            }
        } catch (error) {
            console.error("Error loading job details:", error);
            alert("Error loading job details. Redirecting to job list.");
            window.location.href = "home.html";
        }
    }
    
    // Function to display job details
    function displayJobDetails(job) {
        // Set values in view mode
        document.getElementById('job-title-display').textContent = job.title;
        document.getElementById('job-company-display').textContent = job.company;
        document.getElementById('application-date-display').textContent = formatDate(job.application_date);
        document.getElementById('deadline-date-display').textContent = job.deadline_date ? formatDate(job.deadline_date) : 'None';
        document.getElementById('status-display').textContent = capitalizeFirstLetter(job.status);
        document.getElementById('notes-display').textContent = job.notes || 'No notes added.';
        
        // Set status badge
        const statusBadge = document.getElementById('job-status-badge');
        statusBadge.textContent = capitalizeFirstLetter(job.status);
        statusBadge.className = `status-badge status-${job.status}`;
        
        // Set values in edit mode
        document.getElementById('job-title-input').value = job.title;
        document.getElementById('job-company-input').value = job.company;
        document.getElementById('application-date-input').value = job.application_date ? job.application_date : '';
        document.getElementById('deadline-date-input').value = job.deadline_date ? job.deadline_date : '';
        document.getElementById('status-input').value = job.status;
        document.getElementById('notes-input').value = job.notes || '';
    }
    
    // Function to toggle edit mode
    function toggleEditMode() {
        document.getElementById('view-mode').style.display = 'none';
        document.getElementById('edit-mode').style.display = 'block';
    }
    
    // Function to cancel edit
    function cancelEdit() {
        document.getElementById('edit-mode').style.display = 'none';
        document.getElementById('view-mode').style.display = 'block';
        loadJobDetails(); // Reload data to discard changes
    }
    
    // Function to save changes
    async function saveChanges(e) {
        e.preventDefault();
        
        const updatedJob = {
            title: document.getElementById('job-title-input').value,
            company: document.getElementById('job-company-input').value,
            application_date: document.getElementById('application-date-input').value,
            deadline_date: document.getElementById('deadline-date-input').value || null,
            status: document.getElementById('status-input').value,
            notes: document.getElementById('notes-input').value
        };
        
        try {
            const response = await fetch(`${API_URL}/jobs/${jobId}`, {
                method: 'PUT',
                headers: {
                    ...authHeader,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(updatedJob)
            });
            
            const data = await response.json();
            
            if (data.success) {
                // Switch back to view mode and display updated data
                document.getElementById('edit-mode').style.display = 'none';
                document.getElementById('view-mode').style.display = 'block';
                displayJobDetails(data.job);
            } else {
                console.error("Failed to update job:", data.message);
                alert("Failed to update job: " + data.message);
            }
        } catch (error) {
            console.error("Error updating job:", error);
            alert("Error updating job. Please try again.");
        }
    }
    
    // Function to delete job
    async function deleteJob() {
        if (confirm("Are you sure you want to delete this job application? This cannot be undone.")) {
            try {
                const response = await fetch(`${API_URL}/jobs/${jobId}`, {
                    method: 'DELETE',
                    headers: authHeader
                });
                
                const data = await response.json();
                
                if (data.success) {
                    alert("Job deleted successfully");
                    window.location.href = "home.html";
                } else {
                    console.error("Failed to delete job:", data.message);
                    alert("Failed to delete job: " + data.message);
                }
            } catch (error) {
                console.error("Error deleting job:", error);
                alert("Error deleting job. Please try again.");
            }
        }
    }
    
    // Helper function to format date
    function formatDate(dateString) {
        if (!dateString) return '';
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
    }
    
    // Helper function to capitalize first letter
    function capitalizeFirstLetter(string) {
        return string.charAt(0).toUpperCase() + string.slice(1);
    }
});