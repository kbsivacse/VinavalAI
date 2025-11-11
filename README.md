# VinavalAI - Learning Assessment Platform

A comprehensive web application for conducting learning assessments with admin controls and student testing capabilities.

## Features

### Admin Features
- Upload questions via CSV file with format: `question, option1, option2, option3, option4, correctAnswer(0-3), level`
- Configure assessment parameters (level, time limit, pass percentage)
- Multiple difficulty levels support

### Student Features
- Select assessment level and configure time/pass criteria
- Randomized questions and answer options
- Navigate back and forth between questions
- Real-time timer countdown
- Question navigator showing answered/unanswered questions
- Automatic submission when time expires
- Detailed score report with pass/fail status

## Technology Stack

- **Frontend**: React with Tailwind CSS
- **Backend**: Python FastAPI
- **Database**: PostgreSQL

## Prerequisites

- Node.js (v16 or higher)
- Python 3.8+
- PostgreSQL 12+

## Installation

### 1. Database Setup

```bash
# Install PostgreSQL (if not already installed)
# For Ubuntu/Debian:
sudo apt-get install postgresql postgresql-contrib

# For macOS:
brew install postgresql

# Start PostgreSQL service
sudo service postgresql start  # Linux
brew services start postgresql  # macOS

# Create database
sudo -u postgres psql
CREATE DATABASE assessment_db;
\q

# Run the schema
psql -U postgres -d assessment_db -f database_schema.sql
```

### 2. Backend Setup

```bash
# Create a virtual environment
python -m venv venv

# Activate virtual environment
# On Windows:
venv\Scripts\activate
# On macOS/Linux:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Set environment variables (optional)
export DB_HOST=localhost
export DB_NAME=assessment_db
export DB_USER=postgres
export DB_PASSWORD=your_password
export DB_PORT=5432

# Run the FastAPI server
python main.py
```

The backend will start at `http://localhost:8000`

### 3. Frontend Setup

```bash
# Create React app (if starting fresh)
npx create-react-app assessment-frontend
cd assessment-frontend

# Install dependencies
npm install lucide-react

# Copy the React component code to src/App.js

# Start the development server
npm start
```

The frontend will start at `http://localhost:3000`

## CSV File Format

Create a CSV file with the following format (no headers):

```csv
What is 2 + 2?,3,4,5,6,1,Easy
What is the capital of France?,London,Berlin,Paris,Madrid,2,Easy
What is the square root of 144?,10,11,12,13,2,Medium
What is the chemical symbol for gold?,Go,Au,Gd,Ag,1,Medium
What is the derivative of x^2?,x,2x,x^2,2,1,Hard
```

**Format**: `question, option1, option2, option3, option4, correctAnswer(0-3), level`

Where:
- **correctAnswer**: 0 = option1, 1 = option2, 2 = option3, 3 = option4
- **level**: Any string value (e.g., Easy, Medium, Hard, Beginner, Advanced)

## Usage

### Admin Workflow

1. Click "Admin Login"
2. Upload questions via CSV file
3. View available levels in the system
4. Configure assessment settings (optional)

### Student Workflow

1. Click "Student Login"
2. Select a difficulty level
3. Set time limit (minutes) and pass percentage
4. Click "Start Assessment"
5. Answer questions with the ability to navigate back and forth
6. Submit before time expires or wait for automatic submission
7. View detailed results

## API Endpoints

- `GET /` - Health check
- `GET /levels` - Get all available question levels
- `POST /upload-questions` - Upload questions from CSV
- `POST /start-assessment` - Start an assessment with configuration
- `POST /submit-assessment` - Submit answers and get results

## Configuration

Backend configuration can be customized via environment variables:

```env
DB_HOST=localhost
DB_NAME=assessment_db
DB_USER=postgres
DB_PASSWORD=your_password
DB_PORT=5432
```

## Database Schema

### questions table
- `id`: Primary key
- `question`: Question text
- `option1-4`: Four answer options
- `correct_answer`: Index of correct answer (0-3)
- `level`: Difficulty level
- `created_at`: Timestamp

### assessments table
- `id`: Primary key
- `level`: Assessment level
- `total_time`: Time allocated (minutes)
- `pass_percentage`: Minimum percentage to pass
- `score`: Number of correct answers
- `total_questions`: Total questions attempted
- `percentage`: Score percentage
- `passed`: Boolean pass/fail status
- `created_at`: Timestamp

## Security Considerations

For production deployment:

1. Add authentication/authorization
2. Use HTTPS
3. Implement rate limiting
4. Add input validation and sanitization
5. Use environment variables for sensitive data
6. Implement student session management
7. Add database connection pooling
8. Enable CORS only for specific domains

## Future Enhancements

- Student registration and authentication
- Assessment history tracking per student
- Analytics dashboard for admin
- Export results to PDF/Excel
- Question bank management (edit/delete)
- Multiple question types (multiple choice, true/false, short answer)
- Timed individual questions
- Question categories and tags
- Bulk question import from Excel

## Troubleshooting

**Database Connection Error**: Verify PostgreSQL is running and credentials are correct

**CORS Error**: Ensure backend allows requests from frontend origin

**CSV Upload Fails**: Check CSV format matches specification exactly

**Timer Not Working**: Ensure JavaScript is enabled in browser

## License

MIT License

## Support

For issues and questions, please create an issue in the repository.