
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
    
    // Form event listeners
    document.getElementById('profile-form').addEventListener('submit', updateProfile);
    document.getElementById('password-form').addEventListener('submit', updatePassword);
    
    // Load user data and stats
    loadUserProfile();
    loadUserStats();
    
    // Function to load user profile
    async function loadUserProfile() {
        try {
            const response = await fetch(`${API_URL}/user`, {
                headers: {
                    ...authHeader,
                    'Content-Type': 'application/json'
                }
            });
            
            const data = await response.json();
            
            if (data.success) {
                displayUserProfile(data.user);
            } else {
                console.error("Failed to load user profile:", data.message);
                alert("Failed to load user profile");
            }
        } catch (error) {
            console.error("Error loading user profile:", error);
            alert("Error loading user profile");
        }
    }
    
    // Function to load user stats
    async function loadUserStats() {
        try {
            const response = await fetch(`${API_URL}/dashboard`, {
                headers: {
                    ...authHeader,
                    'Content-Type': 'application/json'
                }
            });
            
            const data = await response.json();
            
            if (data.success) {
                displayUserStats(data.stats);
            } else {
                console.error("Failed to load user stats:", data.message);
            }
        } catch (error) {
            console.error("Error loading user stats:", error);
        }
    }
    
    // Function to display user profile
    function displayUserProfile(user) {
        // Set profile header
        document.getElementById('profile-username').textContent = user.username;
        document.getElementById('profile-email').textContent = user.email;
        
        // Set avatar initial
        document.getElementById('profile-avatar').textContent = user.username.charAt(0).toUpperCase();
        
        // Set form values
        document.getElementById('username').value = user.username;
        document.getElementById('email').value = user.email;
        
        // Set member since
        const createdDate = new Date(user.created_at);
        document.getElementById('member-since').textContent = createdDate.toLocaleDateString('en-US', { 
            month: 'short', 
            year: 'numeric' 
        });
    }
    
    // Function to display user stats
    function displayUserStats(stats) {
        document.getElementById('total-jobs').textContent = stats.total_jobs;
        
        // Calculate active jobs (applied + interview)
        const activeJobs = stats.applied + stats.interview;
        document.getElementById('active-jobs').textContent = activeJobs;
        
        // Calculate interview rate
        let interviewRate = 0;
        if (stats.total_jobs > 0) {
            interviewRate = Math.round((stats.interview / stats.total_jobs) * 100);
        }
        document.getElementById('interview-rate').textContent = `${interviewRate}%`;
    }
    
    // Function to update profile
    async function updateProfile(e) {
        e.preventDefault();
        
        const username = document.getElementById('username').value;
        const email = document.getElementById('email').value;
        
        // Validation
        if (!username || !email) {
            alert("Username and email are required");
            return;
        }
        
        try {
            const response = await fetch(`${API_URL}/user`, {
                method: 'PUT',
                headers: {
                    ...authHeader,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    username,
                    email
                })
            });
            
            const data = await response.json();
            
            if (data.success) {
                alert("Profile updated successfully");
                displayUserProfile(data.user);
            } else {
                console.error("Failed to update profile:", data.message);
                alert("Failed to update profile: " + data.message);
            }
        } catch (error) {
            console.error("Error updating profile:", error);
            alert("Error updating profile. Please try again.");
        }
    }
    
    // Function to update password
    async function updatePassword(e) {
        e.preventDefault();
        
        const currentPassword = document.getElementById('current-password').value;
        const newPassword = document.getElementById('new-password').value;
        const confirmPassword = document.getElementById('confirm-password').value;
        
        // Validation
        if (!currentPassword || !newPassword || !confirmPassword) {
            alert("All fields are required");
            return;
        }
        
        if (newPassword !== confirmPassword) {
            alert("New passwords do not match");
            return;
        }
        
        if (newPassword.length < 6) {
            alert("New password must be at least 6 characters long");
            return;
        }
        
        try {
            const response = await fetch(`${API_URL}/user/password`, {
                method: 'PUT',
                headers: {
                    ...authHeader,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    current_password: currentPassword,
                    new_password: newPassword
                })
            });
            
            const data = await response.json();
            
            if (data.success) {
                alert("Password updated successfully");
                document.getElementById('password-form').reset();
            } else {
                console.error("Failed to update password:", data.message);
                alert("Failed to update password: " + data.message);
            }
        } catch (error) {
            console.error("Error updating password:", error);
            alert("Error updating password. Please try again.");
        }
    }
});