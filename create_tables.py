from app import app, db
import sys

try:
    with app.app_context():
        # Create tables
        db.create_all()
        print("Tables created in MySQL database")
        
        # Test connection (modern SQLAlchemy way)
        with db.engine.connect() as connection:
            result = connection.execute(db.text("SELECT 1"))
            print("Database connection successful!")
        
        # List existing tables (MySQL specific)
        with db.engine.connect() as connection:
            result = connection.execute(db.text("SHOW TABLES"))
            print("Existing tables:")
            for row in result:
                print(f"- {row[0]}")
except Exception as e:
    print(f"Database error: {e}")
    sys.exit(1)