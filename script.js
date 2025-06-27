document.addEventListener("DOMContentLoaded", () => {
    const jobForm = document.getElementById("add-job-form");
    const jobListBody = document.getElementById("job-list-body");
    const filterSelect = document.getElementById("filter-status");
    const searchBar = document.getElementById("search-bar");
    const darkModeToggle = document.getElementById("dark-mode-toggle");

    // API URL base
    const API_URL = "http://localhost:5000/api";
    
    // Check authentication token
    const token = localStorage.getItem("token");
    if (!token && !window.location.pathname.includes("index.html") && 
        !window.location.pathname.includes("signup.html")) {
        // Redirect to login if not authenticated
        window.location.href = "index.html";
    }
    
    // Set up Auth header for API requests
    const authHeader = token ? { 'Authorization': 'Bearer ' + token } : {};
    
    // Load dark mode preference
    if (localStorage.getItem("dark-mode") === "enabled") {
        document.body.classList.add("dark-mode");
        document.querySelectorAll("header, nav a, button, .job-table").forEach(el => el.classList.add("dark-mode"));
    }

    // Dark mode toggle
    if (darkModeToggle) {
        darkModeToggle.addEventListener("click", () => {
            document.body.classList.toggle("dark-mode");
            document.querySelectorAll("header, nav a, button, .job-table").forEach(el => el.classList.toggle("dark-mode"));

            if (document.body.classList.contains("dark-mode")) {
                localStorage.setItem("dark-mode", "enabled");
            } else {
                localStorage.setItem("dark-mode", "disabled");
            }
        });
    }

    // Check if we're on the home page with job form
    if (jobForm) {
        loadJobs();
        
        jobForm.addEventListener("submit", (e) => {
            e.preventDefault();
            const title = document.getElementById("job-title").value;
            const company = document.getElementById("company-name").value;
            const applicationDate = document.getElementById("application-date").value;
            const deadlineDate = document.getElementById("deadline-date").value;
            const status = document.getElementById("job-status").value;
            const notes = document.getElementById("job-notes").value;

            const jobData = { title, company, status };

            if (applicationDate) jobData.application_date = applicationDate;

            if (deadlineDate) jobData.deadline_date = deadlineDate;

            if (notes) jobData.notes = notes;

            addJob(jobData)
        });

        // Search and filter handlers
        if (filterSelect) {
            filterSelect.addEventListener("change", loadJobs);
        }
        
        if (searchBar) {
            searchBar.addEventListener("input", loadJobs);
        }
    }

    // Login form handler
    const loginForm = document.querySelector(".login-form");
    if (loginForm) {
        loginForm.addEventListener("submit", (e) => {
            e.preventDefault();
            const email = document.getElementById("email").value;
            const password = document.getElementById("password").value;
            
            login(email, password);
        });
    }
    
    // Signup form handler
    const signupForm = document.querySelector("form");
    if (signupForm && window.location.pathname.includes("signup.html")) {
        signupForm.addEventListener("submit", (e) => {
            e.preventDefault();
            const name = document.querySelector("input[type='text']").value;
            const email = document.querySelector("input[type='email']").value;
            const password = document.querySelector("input[type='password']").value;
            
            register(name, email, password);
        });
    }

    // Function to check if a job deadline is past
    function isPastDeadline(deadline) {
        if (!deadline) return false;
        const today = new Date();
        const deadlineDate = new Date(deadline);
        return deadlineDate < today;
    }

    // Function to load jobs from the API
    // Make sure the loadJobs function properly fetches and displays all jobs:
// Function to load jobs from the API
async function loadJobs() {
    try {
        const status = filterSelect ? filterSelect.value : 'all';
        const search = searchBar ? searchBar.value : '';
        
        const queryParams = new URLSearchParams();
        if (status !== 'all') queryParams.append('status', status);
        if (search) queryParams.append('search', search);
        
        console.log("Fetching jobs with query params:", queryParams.toString());
        
        const response = await fetch(`${API_URL}/jobs?${queryParams.toString()}`, {
            headers: {
                ...authHeader,
                'Content-Type': 'application/json'
            }
        });
        
        console.log("Response status:", response.status);
        const data = await response.json();
        console.log("Response data:", data);
        
        if (data.success) {
            console.log("Jobs received:", data.jobs.length);
            renderJobs(data.jobs);
        } else {
            console.error("Failed to load jobs:", data.message);
            // Display error message on the page
            if (jobListBody) {
                jobListBody.innerHTML = `<tr><td colspan="6" class="text-center">Error loading jobs: ${data.message}</td></tr>`;
            }
        }
    } catch (error) {
        console.error("Error loading jobs:", error);
        // Display error message on the page
        if (jobListBody) {
            jobListBody.innerHTML = `<tr><td colspan="6" class="text-center">Error loading jobs. Please check console for details.</td></tr>`;
        }
    }
}

    // Function to render jobs to the table
    // Function to render jobs to the table
function renderJobs(jobs) {
    if (!jobListBody) return;
    
    jobListBody.innerHTML = "";
    
    if (jobs.length === 0) {
        const row = document.createElement("tr");
        row.innerHTML = `<td colspan="6" class="text-center">No jobs found. Add your first job application above!</td>`;
        jobListBody.appendChild(row);
        return;
    }
    
    console.log("Rendering jobs:", jobs);

    jobs.forEach((job) => {
        const row = document.createElement("tr");
        
        row.innerHTML = `
            <td>
                <a href="job-detail.html?id=${job.job_id}" class="job-title-link">${job.title}</a>
            </td>
            <td>
                ${job.company}
            </td>
            <td>${formatDate(job.application_date) || ''}</td>
            <td>
                ${job.notes ? job.notes.substring(0, 50) + (job.notes.length > 50 ? '...' : '') : ''}
            </td>
            <td class="${isPastDeadline(job.deadline_date) ? 'deadline-warning' : ''}">
                ${job.deadline_date ? formatDate(job.deadline_date) : ''}
            </td>
            <td>
                <select onchange="updateJobStatus(${job.job_id}, this.value)">
                    <option value="bookmark" ${job.status === "bookmark" ? "selected" : ""}>Bookmark</option>
                    <option value="applied" ${job.status === "applied" ? "selected" : ""}>Applied</option>
                    <option value="interview" ${job.status === "interview" ? "selected" : ""}>Interview</option>
                    <option value="accepted" ${job.status === "accepted" ? "selected" : ""}>Accepted</option>
                    <option value="rejected" ${job.status === "rejected" ? "selected" : ""}>Rejected</option>
                </select>
                <a href="job-detail.html?id=${job.job_id}" class="view-details-btn" title="View Details">👁️</a>
                <button onclick="deleteJob(${job.job_id})" title="Delete">🗑️</button>
            </td>
        `;

        jobListBody.appendChild(row);
    });
}

    // Function to add a new job
    async function addJob(jobData) {
        try {
            console.log("Sending job data:", jobData);
            
            const response = await fetch(`${API_URL}/jobs`, {
                method: 'POST',
                headers: {
                    ...authHeader,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(jobData)
            });
            
            console.log("Response status:", response.status);
            const data = await response.json();
            console.log("Response data:", data);
            
            if (data.success) {
                jobForm.reset();
                loadJobs();
            } else {
                alert("Error adding job: " + (data.message || "Unknown error"));
            }
        } catch (error) {
            console.error("Error adding job:", error);
            alert("Error adding job. Please try again.");
        }
    }
    
    // Authentication functions
    async function login(email, password) {
        try {
            const response = await fetch(`${API_URL}/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ email, password })
            });
            
            const data = await response.json();
            
            if (data.success) {
                localStorage.setItem("token", data.token);
                window.location.href = "home.html";
            } else {
                alert("Login failed: " + data.message);
            }
        } catch (error) {
            console.error("Login error:", error);
            alert("Login failed. Please try again.");
        }
    }
    
    async function register(username, email, password) {
        try {
            const response = await fetch(`${API_URL}/register`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ username, email, password })
            });
            
            const data = await response.json();
            
            if (data.success) {
                localStorage.setItem("token", data.token);
                window.location.href = "home.html";
            } else {
                alert("Registration failed: " + data.message);
            }
        } catch (error) {
            console.error("Registration error:", error);
            alert("Registration failed. Please try again.");
        }
    }

    // Expose functions to window for inline event handlers
    window.updateJobStatus = async (jobId, newStatus) => {
        try {
            const response = await fetch(`${API_URL}/jobs/${jobId}`, {
                method: 'PUT',
                headers: {
                    ...authHeader,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ status: newStatus })
            });
            
            const data = await response.json();
            
            if (!data.success) {
                console.error("Failed to update job status:", data.message);
                loadJobs(); // Refresh to revert UI
            }
        } catch (error) {
            console.error("Error updating job status:", error);
            loadJobs(); // Refresh to revert UI
        }
    };

    window.updateJobField = async (jobId, field, newValue) => {
        try {
            const payload = {};
            payload[field] = newValue.trim();
            
            const response = await fetch(`${API_URL}/jobs/${jobId}`, {
                method: 'PUT',
                headers: {
                    ...authHeader,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(payload)
            });
            
            const data = await response.json();
            
            if (!data.success) {
                console.error(`Failed to update ${field}:`, data.message);
                loadJobs(); // Refresh to revert UI
            }
        } catch (error) {
            console.error(`Error updating ${field}:`, error);
            loadJobs(); // Refresh to revert UI
        }
    };

    window.deleteJob = async (jobId) => {
        if (confirm("Are you sure you want to delete this job?")) {
            try {
                const response = await fetch(`${API_URL}/jobs/${jobId}`, {
                    method: 'DELETE',
                    headers: authHeader
                });
                
                const data = await response.json();
                
                if (data.success) {
                    loadJobs();
                } else {
                    console.error("Failed to delete job:", data.message);
                }
            } catch (error) {
                console.error("Error deleting job:", error);
            }
        }
    };
});
function isPastDeadline(deadline) {
    if (!deadline) return false;
    const today = new Date();
    const deadlineDate = new Date(deadline);
    return deadlineDate < today;
}

// Function to format date
function formatDate(dateString) {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
}