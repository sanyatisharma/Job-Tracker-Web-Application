Running the Job Tracker Application
Follow these steps to set up and run the Job Tracker application.

Step 1: Setup the Environment
Make sure you have Python 3.8 or higher installed:
bash
python --version
Create and activate a virtual environment (recommended):
bash
# On Windows
python -m venv venv
venv\Scripts\activate

# On macOS/Linux
python -m venv venv
source venv/bin/activate
Step 2: Install Dependencies
Install all required packages:
bash
pip install -r requirements.txt
Step 3: Configure the Application
Ensure your .env file is set up in the project root with the following variables:
SECRET_KEY=job-tracker-secret-key-change-in-production
JWT_SECRET_KEY=job-tracker-jwt-secret-key-change-in-production
DATABASE_URI=sqlite:///job_tracker.db
DEBUG=True
Step 4: Initialize the Database
Initialize the database with the following command:
bash
python -c "from app import app, db; app.app_context().push(); db.create_all()"
Step 5: Start the Application
Run the Flask application:
bash
python app.py
You should see output similar to:
* Running on http://127.0.0.1:5000/ (Press CTRL+C to quit)
* Restarting with stat
* Debugger is active!
* Debugger PIN: xxx-xxx-xxx
Step 6: Access the Application
Open your web browser and navigate to:
http://localhost:5000
You should see the login page.
Step 7: Create an Account
Click on "Sign Up" to create a new account.
Fill in the registration form with your username, email, and password.
Submit the form to create your account and be automatically logged in.
Step 8: Using the Application
Once logged in, you'll be redirected to the dashboard.
Use the form at the top to add new job applications.
View, filter, and manage your job applications in the table below.
Click on job details to edit them directly in the table.
Use the status dropdown to update the status of your applications.
Click the delete icon to remove job entries.
Use the search bar to find specific jobs.
Use the status filter to view jobs by their current status.
Toggle dark mode with the button in the header.
Click "Logout" when you're done to securely exit the application.
Troubleshooting
Database Issues
If you encounter database errors, try deleting the job_tracker.db file and reinitializing the database:

bash
rm job_tracker.db
python -c "from app import app, db; app.app_context().push(); db.create_all()"
CORS Issues
If you're experiencing CORS errors in the browser console, ensure that the Flask CORS extension is properly configured in app.py.

Authentication Issues
If you're getting authentication errors, try clearing your browser's local storage:

Open developer tools (F12)
Go to Application > Local Storage
Clear the stored token
Log in again
Port Already in Use
If port 5000 is already in use, modify the app.run() line in app.py to use a different port:

python
app.run(debug=True, port=5001)
