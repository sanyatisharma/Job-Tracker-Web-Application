# Job Tracker - Full-Stack Application to Manage Job Applications

# Overview
Job Tracker is a full-stack web application designed to simplify the job and internship search process. It serves as a one-stop platform for users to store and manage their job applications, interviews, and job offers. Built using a MySQL database, a Python-based Flask backend, and a clean HTML/CSS frontend, the system provides an integrated solution for tracking career opportunities, ensuring users stay organized and proactive in their job hunt.
Students often rely on spreadsheets or memory to track multiple applications, interviews, and deadlines, this lack of structure leads to missed opportunities and confusion. Job Tracker bridges this gap by offering user-friendly tools such as a customizable dashboard, real-time application status tracking, automated reminders, and dynamic filtering by company, job type, or application status. The system follows a carefully planned development cycle including database modeling, backend API creation, frontend design, and complete system integration, resulting in a professional and user-centric solution.

# Objectives :
1. Develop a centralized platform for job seekers to manage their job and internship applications.
2. Provide users with an intuitive interface to add, update, and track the status of their applications.
3. Enable filtering and search functionality by company, job type, and application status.
4. Offer a dashboard with visual insights into application statistics and status breakdowns.

## Key Features

- **User Authentication** using JWT (Login/Signup)
- **Add, View, Edit, Delete** job applications
- **Track statuses**: Bookmark, Applied, Interview, Accepted, Rejected
- **Dashboard Analytics** with Pie & Bar charts (Chart.js)
- **Deadline reminders** with urgency indicators
- **Job Detail View** with editable notes
- **Filter & Search** by title, company, or status
- **Dark Mode** toggle with preference persistence
- **User Profile** update and password reset
-  Fully responsive for desktop and mobile

## Tech Stack

## Frontend
- **HTML5, CSS3, JavaScript**
- **Chart.js** for interactive data visualization
- **Responsive UI** with custom CSS (no framework used)
- **LocalStorage** for session token and dark mode state

## Backend (Python Flask)
- **Flask**: Web server and API framework
- **Flask-JWT-Extended**: JWT authentication
- **Flask-SQLAlchemy**: ORM for database access
- **MySQL**: Primary database
- **Flask-CORS**: Cross-origin resource sharing

## Tools & Libraries
- **python-dotenv**: Environment variable management
- **Werkzeug, Jinja2**: Template and request utilities
- **Chart.js**: Visualization library
- **MySQLClient**: Python-MySQL connector

## Screenshots
<img width="504" alt="Screenshot 2025-06-27 at 7 52 48 PM" src="https://github.com/user-attachments/assets/89163c8f-3645-4d72-bb13-e04d17d416d4" />


<img width="577" alt="Screenshot 2025-06-27 at 7 54 25 PM" src="https://github.com/user-attachments/assets/6e7896d7-2192-46b7-b864-057a9275a005" />


<img width="545" alt="Screenshot 2025-06-27 at 7 55 04 PM" src="https://github.com/user-attachments/assets/0d7cb412-efcb-46c3-8c5a-94702ccf96f2" />

## Project Structure

```bash
├── app.py                 # Main Flask app
├── create_tables.py       # DB schema definition
├── init_db.py             # DB initializer
├── scripts.sql            # SQL schema setup
├── templates/
│   ├── index.html         # Login page
│   ├── signup.html        # Registration page
│   ├── home.html          # Job listing + add form
│   ├── dashboard.html     # Visual dashboard
│   ├── job-detail.html    # Job detail + edit
│   └── profile.html       # Profile management
├── static/
│   ├── script.js          # Main app logic
│   ├── dashboard.js       # Dashboard-specific logic
│   ├── job-detail.js      # Job detail page logic
│   ├── profile.js         # Profile update logic
│   └── style.css          # Global styles
└── requirements.txt       # Python package dependencies
