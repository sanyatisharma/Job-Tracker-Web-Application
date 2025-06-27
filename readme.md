# Internship Tracker

A full-stack web application to help students and professionals manage their internship/job applications, track statuses, and stay organized.

## 🚀 Features

- User Registration and Login (with JWT auth)
- Add and view internships/jobs
- Track application status: bookmarked, applied, interviewed, accepted, rejected
- View job list with filters
- Responsive UI built with HTML, CSS, JavaScript
- RESTful API with Flask backend
- MySQL database integration

## 🛠️ Tech Stack

- **Frontend:** HTML, CSS, JavaScript
- **Backend:** Python, Flask, Flask-JWT-Extended
- **Database:** MySQL (hosted locally or via Railway.app)
- **ORM:** SQLAlchemy

## 🧑‍💻 Setup Instructions

### Backend Setup

```bash
cd backend
python -m venv venv
venv\Scripts\activate      # On Windows
pip install -r requirements.txt
python -m backend.app      # Starts the backend server on http://127.0.0.1:5000
```
### Ensure you have a valid .env file with your MySQL connection string: 
DATABASE_URL=mysql+pymysql://username:password@localhost/job_tracker_db

### Frontend Setup
```bash
cd frontend
npm install
npm start       # Runs on http://localhost:5000
```
## 🤝 Contributors
- Vasu - https://linkedin.com/in/Vasusingh11/
- Sanyati - https://linkedin.com/in/Sanyatisharma
- Sneha - https://www.linkedin.com/in/muppalasneha/
