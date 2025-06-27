from flask import Flask, request, jsonify, send_from_directory
from flask_sqlalchemy import SQLAlchemy
from flask_cors import CORS
from flask_jwt_extended import JWTManager, create_access_token, jwt_required, get_jwt_identity
from werkzeug.security import generate_password_hash, check_password_hash
from datetime import datetime, timedelta, timezone
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Initialize Flask app
app = Flask(__name__, static_folder='.')
CORS(app)

# Configuration
app.config['SECRET_KEY'] = os.environ.get('SECRET_KEY', 'job-tracker-secret-key')
app.config['SQLALCHEMY_DATABASE_URI'] = os.environ.get('DATABASE_URI', 'mysql://Vasu:1885@localhost/job_tracker_db')
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
app.config['JWT_SECRET_KEY'] = os.environ.get('JWT_SECRET_KEY', 'job-tracker-jwt-secret-key')
app.config['JWT_ACCESS_TOKEN_EXPIRES'] = timedelta(hours=24)
# JWT configuration
app.config['JWT_ERROR_MESSAGE_KEY'] = 'message'
# Make sure token identity is stored as a string
app.config['JWT_IDENTITY_CLAIM'] = 'sub'
# Enable CORS support
app.config['JWT_HEADER_TYPE'] = 'Bearer'
app.config['JWT_HEADER_NAME'] = 'Authorization'

# Initialize extensions
db = SQLAlchemy(app)
jwt = JWTManager(app)

# Models
class User(db.Model):
    __tablename__ = 'users'
    
    user_id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(50), unique=True, nullable=False)
    email = db.Column(db.String(100), unique=True, nullable=False)
    password_hash = db.Column(db.String(255), nullable=False)
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))
    last_login = db.Column(db.DateTime)
    
    jobs = db.relationship('Job', backref='user', lazy=True, cascade='all, delete-orphan')

class Job(db.Model):
    __tablename__ = 'jobs'
    
    job_id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.user_id', ondelete='CASCADE'), nullable=False)
    title = db.Column(db.String(100), nullable=False)
    company = db.Column(db.String(100), nullable=False)
    status = db.Column(db.Enum('bookmark', 'applied', 'interview', 'accepted', 'rejected'), default='applied', nullable=False)
    application_date = db.Column(db.Date, default=lambda: datetime.now(timezone.utc).date())
    deadline_date = db.Column(db.Date)
    notes = db.Column(db.Text)
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

# JWT error handlers
@jwt.expired_token_loader
def expired_token_callback(jwt_header, jwt_payload):
    return jsonify(success=False, message="Token has expired"), 401

@jwt.invalid_token_loader
def invalid_token_callback(error):
    return jsonify(success=False, message=f"Invalid token: {error}"), 422

@jwt.unauthorized_loader
def missing_token_callback(error):
    return jsonify(success=False, message=f"Missing authorization: {error}"), 401

# Routes
# Frontend routes
@app.route('/', defaults={'path': ''})
@app.route('/<path:path>')
def serve_frontend(path):
    if path and os.path.exists(path):
        return send_from_directory('.', path)
    return send_from_directory('.', 'index.html')

# API routes
@app.route('/api/register', methods=['POST'])
def register():
    try:
        data = request.json
        
        username = data.get('username')
        email = data.get('email')
        password = data.get('password')
        
        if not username or not email or not password:
            return jsonify(success=False, message="Missing required fields"), 400
        
        # Check if username or email already exists
        existing_user = User.query.filter((User.username == username) | (User.email == email)).first()
        if existing_user:
            return jsonify(success=False, message="Username or email already exists"), 409
        
        # Hash password
        password_hash = generate_password_hash(password, method='sha256')
        
        # Create new user
        new_user = User(
            username=username,
            email=email,
            password_hash=password_hash
        )
        
        db.session.add(new_user)
        db.session.commit()
        
        # Create JWT token - convert user_id to string
        access_token = create_access_token(identity=str(new_user.user_id))
        
        return jsonify(
            success=True,
            user={
                'user_id': new_user.user_id,
                'username': username,
                'email': email
            },
            token=access_token
        ), 201
    except Exception as e:
        return jsonify(success=False, message=f"Registration error: {str(e)}"), 500

@app.route('/api/login', methods=['POST'])
def login():
    try:
        data = request.json
        
        email = data.get('email')
        password = data.get('password')
        
        if not email or not password:
            return jsonify(success=False, message="Email and password are required"), 400
        
        user = User.query.filter_by(email=email).first()
        
        if not user or not check_password_hash(user.password_hash, password):
            return jsonify(success=False, message="Invalid credentials"), 401
        
        # Update last login
        user.last_login = datetime.now(timezone.utc)
        db.session.commit()
        
        # Create JWT - convert user_id to string
        access_token = create_access_token(identity=str(user.user_id))
        
        return jsonify(
            success=True,
            user={
                'user_id': user.user_id,
                'username': user.username,
                'email': user.email
            },
            token=access_token
        )
    except Exception as e:
        return jsonify(success=False, message=f"Login error: {str(e)}"), 500

@app.route('/api/jobs', methods=['GET'])
@jwt_required()
def get_jobs():
    try:
        # Get the identity and convert to int
        current_user_id = int(get_jwt_identity())
        
        # Get query parameters for filtering
        status = request.args.get('status')
        search = request.args.get('search')
        limit = request.args.get('limit', type=int)
        
        # Build query
        query = Job.query.filter_by(user_id=current_user_id)
        
        # Apply filters
        if status and status != 'all':
            query = query.filter_by(status=status)
        
        if search:
            search_term = f'%{search}%'
            query = query.filter((Job.title.like(search_term)) | (Job.company.like(search_term)))
        
        # Apply order
        query = query.order_by(Job.application_date.desc())
        
        # Apply limit if specified
        if limit:
            jobs = query.limit(limit).all()
        else:
            jobs = query.all()
        
        print(f"Fetched {len(jobs)} jobs for user {current_user_id}")
        
        jobs_data = [{
            'job_id': job.job_id,
            'title': job.title,
            'company': job.company,
            'status': job.status,
            'application_date': job.application_date.isoformat() if job.application_date else None,
            'deadline_date': job.deadline_date.isoformat() if job.deadline_date else None,
            'notes': job.notes,
            'created_at': job.created_at.isoformat(),
            'updated_at': job.updated_at.isoformat()
        } for job in jobs]
        
        return jsonify(success=True, jobs=jobs_data)
    except Exception as e:
        return jsonify(success=False, message=f"Error fetching jobs: {str(e)}"), 500

@app.route('/api/jobs/<int:job_id>', methods=['GET'])
@jwt_required()
def get_job_by_id(job_id):
    try:
        # Get the identity and convert to int
        current_user_id = int(get_jwt_identity())
        
        # Find job
        job = Job.query.filter_by(job_id=job_id, user_id=current_user_id).first()
        
        if not job:
            return jsonify(success=False, message="Job not found"), 404
        
        job_data = {
            'job_id': job.job_id,
            'title': job.title,
            'company': job.company,
            'status': job.status,
            'application_date': job.application_date.isoformat() if job.application_date else None,
            'deadline_date': job.deadline_date.isoformat() if job.deadline_date else None,
            'notes': job.notes,
            'created_at': job.created_at.isoformat(),
            'updated_at': job.updated_at.isoformat()
        }
        
        return jsonify(success=True, job=job_data)
    except Exception as e:
        return jsonify(success=False, message=f"Error fetching job: {str(e)}"), 500

@app.route('/api/jobs', methods=['POST'])
@jwt_required()
def create_job():
    try:
        # Get the identity and convert to int
        current_user_id = int(get_jwt_identity())
        data = request.json
        
        if not data:
            return jsonify(success=False, message="No data provided"), 400
        
        title = data.get('title')
        company = data.get('company')
        status = data.get('status', 'applied')
        application_date = data.get('application_date')
        deadline_date = data.get('deadline_date')
        notes = data.get('notes')
        
        # Debug info
        print(f"Received data: {data}")
        
        if not title or not company:
            return jsonify(success=False, message="Job title and company are required"), 400
        
        # Validate status
        valid_statuses = ['bookmark', 'applied', 'interview', 'accepted', 'rejected']
        if status not in valid_statuses:
            return jsonify(success=False, message=f"Invalid status: '{status}'. Must be one of: {', '.join(valid_statuses)}"), 400
        
        # Parse dates
        try:
            parsed_application_date = None
            if application_date:
                parsed_application_date = datetime.strptime(application_date, '%Y-%m-%d').date()
            else:
                parsed_application_date = datetime.now(timezone.utc).date()
                
            parsed_deadline_date = None
            if deadline_date:
                parsed_deadline_date = datetime.strptime(deadline_date, '%Y-%m-%d').date()
        except ValueError as e:
            return jsonify(success=False, message=f"Date format error: {str(e)}. Use YYYY-MM-DD format."), 400
        
        # Create new job
        new_job = Job(
            user_id=current_user_id,
            title=title,
            company=company,
            status=status,
            application_date=parsed_application_date,
            deadline_date=parsed_deadline_date,
            notes=notes
        )
        
        db.session.add(new_job)
        db.session.commit()
        
        return jsonify(
            success=True,
            job={
                'job_id': new_job.job_id,
                'title': title,
                'company': company,
                'status': status,
                'application_date': parsed_application_date.isoformat() if parsed_application_date else None,
                'deadline_date': parsed_deadline_date.isoformat() if parsed_deadline_date else None,
                'notes': notes,
                'created_at': new_job.created_at.isoformat(),
                'updated_at': new_job.updated_at.isoformat()
            }
        ), 201
    except Exception as e:
        import traceback
        traceback.print_exc()
        return jsonify(success=False, message=f"Error creating job: {str(e)}"), 500

# Continue with the rest of the code updated to convert user_id from JWT to int
@app.route('/api/jobs/<int:job_id>', methods=['PUT'])
@jwt_required()
def update_job(job_id):
    try:
        # Get the identity and convert to int
        current_user_id = int(get_jwt_identity())
        data = request.json
        
        # Find job
        job = Job.query.filter_by(job_id=job_id, user_id=current_user_id).first()
        
        if not job:
            return jsonify(success=False, message="Job not found"), 404
        
        # Validate status if provided
        if 'status' in data:
            valid_statuses = ['bookmark', 'applied', 'interview', 'accepted', 'rejected']
            if data['status'] not in valid_statuses:
                return jsonify(success=False, message=f"Invalid status: '{data['status']}'. Must be one of: {', '.join(valid_statuses)}"), 400
        
        # Update fields
        if 'title' in data and data['title']:
            job.title = data['title']
        if 'company' in data and data['company']:
            job.company = data['company']
        if 'status' in data:
            job.status = data['status']
        if 'notes' in data:
            job.notes = data['notes']
        
        # Parse dates carefully
        try:
            if 'application_date' in data and data['application_date']:
                job.application_date = datetime.strptime(data['application_date'], '%Y-%m-%d').date()
            if 'deadline_date' in data:
                if data['deadline_date']:
                    job.deadline_date = datetime.strptime(data['deadline_date'], '%Y-%m-%d').date()
                else:
                    job.deadline_date = None
        except ValueError as e:
            return jsonify(success=False, message=f"Date format error: {str(e)}. Use YYYY-MM-DD format."), 400
        
        db.session.commit()
        
        return jsonify(
            success=True,
            job={
                'job_id': job.job_id,
                'title': job.title,
                'company': job.company,
                'status': job.status,
                'application_date': job.application_date.isoformat() if job.application_date else None,
                'deadline_date': job.deadline_date.isoformat() if job.deadline_date else None,
                'notes': job.notes,
                'created_at': job.created_at.isoformat(),
                'updated_at': job.updated_at.isoformat()
            }
        )
    except Exception as e:
        return jsonify(success=False, message=f"Error updating job: {str(e)}"), 500

@app.route('/api/jobs/<int:job_id>', methods=['DELETE'])
@jwt_required()
def delete_job(job_id):
    try:
        # Get the identity and convert to int
        current_user_id = int(get_jwt_identity())
        
        # Find job
        job = Job.query.filter_by(job_id=job_id, user_id=current_user_id).first()
        
        if not job:
            return jsonify(success=False, message="Job not found"), 404
        
        db.session.delete(job)
        db.session.commit()
        
        return jsonify(success=True, message="Job deleted successfully")
    except Exception as e:
        return jsonify(success=False, message=f"Error deleting job: {str(e)}"), 500

@app.route('/api/user', methods=['GET'])
@jwt_required()
def get_user_profile():
    try:
        # Get the identity and convert to int
        current_user_id = int(get_jwt_identity())
        user = User.query.get(current_user_id)
        
        if not user:
            return jsonify(success=False, message="User not found"), 404
        
        return jsonify(
            success=True,
            user={
                'user_id': user.user_id,
                'username': user.username,
                'email': user.email,
                'created_at': user.created_at.isoformat(),
                'last_login': user.last_login.isoformat() if user.last_login else None
            }
        )
    except Exception as e:
        return jsonify(success=False, message=f"Error fetching user profile: {str(e)}"), 500

@app.route('/api/user', methods=['PUT'])
@jwt_required()
def update_user_profile():
    try:
        # Get the identity and convert to int
        current_user_id = int(get_jwt_identity())
        user = User.query.get(current_user_id)
        
        if not user:
            return jsonify(success=False, message="User not found"), 404
        
        data = request.json
        username = data.get('username')
        email = data.get('email')
        
        if not username or not email:
            return jsonify(success=False, message="Username and email are required"), 400
        
        # Check if username or email already exists (excluding current user)
        existing_user = User.query.filter(
            (User.username == username) | (User.email == email), 
            User.user_id != current_user_id
        ).first()
        
        if existing_user:
            return jsonify(success=False, message="Username or email already exists"), 409
        
        # Update user profile
        user.username = username
        user.email = email
        db.session.commit()
        
        return jsonify(
            success=True,
            user={
                'user_id': user.user_id,
                'username': user.username,
                'email': user.email,
                'created_at': user.created_at.isoformat(),
                'last_login': user.last_login.isoformat() if user.last_login else None
            }
        )
    except Exception as e:
        return jsonify(success=False, message=f"Error updating user profile: {str(e)}"), 500

@app.route('/api/user/password', methods=['PUT'])
@jwt_required()
def update_user_password():
    try:
        # Get the identity and convert to int
        current_user_id = int(get_jwt_identity())
        user = User.query.get(current_user_id)
        
        if not user:
            return jsonify(success=False, message="User not found"), 404
        
        data = request.json
        current_password = data.get('current_password')
        new_password = data.get('new_password')
        
        if not current_password or not new_password:
            return jsonify(success=False, message="Current password and new password are required"), 400
        
        # Check current password
        if not check_password_hash(user.password_hash, current_password):
            return jsonify(success=False, message="Current password is incorrect"), 401
        
        # Update password
        user.password_hash = generate_password_hash(new_password, method='sha256')
        db.session.commit()
        
        return jsonify(success=True, message="Password updated successfully")
    except Exception as e:
        return jsonify(success=False, message=f"Error updating password: {str(e)}"), 500

@app.route('/api/dashboard', methods=['GET'])
@jwt_required()
def get_dashboard_stats():
    try:
        # Get the identity and convert to int
        current_user_id = int(get_jwt_identity())
        
        # Get counts by status
        bookmark_count = Job.query.filter_by(user_id=current_user_id, status='bookmark').count()
        applied_count = Job.query.filter_by(user_id=current_user_id, status='applied').count()
        interview_count = Job.query.filter_by(user_id=current_user_id, status='interview').count()
        accepted_count = Job.query.filter_by(user_id=current_user_id, status='accepted').count()
        rejected_count = Job.query.filter_by(user_id=current_user_id, status='rejected').count()
        total_count = bookmark_count + applied_count + interview_count + accepted_count + rejected_count
        
        # Get upcoming deadlines
        today = datetime.now(timezone.utc).date()
        upcoming_deadlines = Job.query.filter(
            Job.user_id == current_user_id,
            Job.deadline_date >= today,
            Job.deadline_date <= today + timedelta(days=7)
        ).order_by(Job.deadline_date).all()
        
        deadline_data = [{
            'job_id': job.job_id,
            'title': job.title,
            'company': job.company,
            'deadline_date': job.deadline_date.isoformat() if job.deadline_date else None,
            'days_remaining': (job.deadline_date - today).days
        } for job in upcoming_deadlines]
        
        # Get application counts by month (for timeline chart)
        six_months_ago = today.replace(day=1) - timedelta(days=1)
        six_months_ago = six_months_ago.replace(day=1)
        
        # This section might need to be adjusted based on your database
        try:
            # For MySQL
            from sqlalchemy import text
            monthly_stats = db.session.execute(
                text("""
                SELECT DATE_FORMAT(application_date, '%Y-%m') as month, status, COUNT(*) as count
                FROM jobs
                WHERE user_id = :user_id AND application_date >= :six_months_ago
                GROUP BY month, status
                ORDER BY month
                """),
                {"user_id": current_user_id, "six_months_ago": six_months_ago}
            ).fetchall()
            
            monthly_data = {}
            for row in monthly_stats:
                month = row[0]  # Accessing by index since the result is a tuple
                status = row[1]
                count = row[2]
                if month not in monthly_data:
                    monthly_data[month] = {'bookmark': 0, 'applied': 0, 'interview': 0, 'accepted': 0, 'rejected': 0}
                monthly_data[month][status] = count
        except Exception as e:
            # Fallback if the SQL query fails
            monthly_data = {"error": str(e)}
        
        # Get most recent activity
        recent_activity = Job.query.filter_by(
            user_id=current_user_id
        ).order_by(
            Job.updated_at.desc()
        ).limit(5).all()
        
        activity_data = [{
            'job_id': job.job_id,
            'title': job.title,
            'company': job.company,
            'status': job.status,
            'updated_at': job.updated_at.isoformat(),
            'type': 'status_update'
        } for job in recent_activity]
        
        return jsonify(
            success=True,
            stats={
                'total_jobs': total_count,
                'bookmark': bookmark_count,
                'applied': applied_count,
                'interview': interview_count,
                'accepted': accepted_count,
                'rejected': rejected_count,
                'upcoming_deadlines': deadline_data,
                'monthly_stats': monthly_data,
                'recent_activity': activity_data
            }
        )
    except Exception as e:
        return jsonify(success=False, message=f"Error fetching dashboard stats: {str(e)}"), 500

# Error handlers
@app.errorhandler(404)
def not_found(error):
    return jsonify(success=False, message="Not found"), 404

@app.errorhandler(500)
def server_error(error):
    return jsonify(success=False, message=f"Server error: {str(error)}"), 500

@app.errorhandler(422)
def unprocessable_entity(error):
    return jsonify(success=False, message=f"Unprocessable entity: {str(error)}"), 422

# Create tables
@app.before_first_request
def create_tables():
    db.create_all()

# Main entry point
if __name__ == '__main__':
    # Ensure tables are created
    with app.app_context():
        db.create_all()
    app.run(debug=True)