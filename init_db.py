from app import app, db
import os
# In your init_db.py script, add this:
import os

db_path = os.path.abspath('job_tracker.db')
print(f"Using absolute database path: {db_path}")

# Replace the existing db URI configuration with:
app.config['SQLALCHEMY_DATABASE_URI'] = f'sqlite:///{db_path}'

with app.app_context():
    db.create_all()
    print("Database tables created successfully!")
try:
    print("Current working directory:", os.getcwd())
    print("Creating database tables...")
    with app.app_context():
        db.create_all()
        print("Database tables created successfully!")
    
    # Check if the file exists
    db_path = 'job_tracker.db'
    if os.path.exists(db_path):
        print(f"Database file created at: {os.path.abspath(db_path)}")
    else:
        print(f"Database file NOT found at: {os.path.abspath(db_path)}")
        
        # Check if SQLAlchemy is using a different path
        db_uri = app.config['SQLALCHEMY_DATABASE_URI']
        print(f"Configured database URI: {db_uri}")
        
except Exception as e:
    print(f"Error creating database: {str(e)}")