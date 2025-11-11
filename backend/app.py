from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import psycopg2
from psycopg2.extras import RealDictCursor
import csv
import io
import random
from typing import List, Dict, Any
import os

app = FastAPI()

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Database configuration
DB_CONFIG = {
    "host": os.getenv("DB_HOST", "localhost"),
    "database": os.getenv("DB_NAME", "assessment_db"),
    "user": os.getenv("DB_USER", "postgres"),
    "password": os.getenv("DB_PASSWORD", "password"),
    "port": os.getenv("DB_PORT", 5432)
}

def get_db_connection():
    """Create and return a database connection"""
    return psycopg2.connect(**DB_CONFIG, cursor_factory=RealDictCursor)

# Pydantic models
class AssessmentConfig(BaseModel):
    level: str
    totalTime: int
    passPercentage: int

class Question(BaseModel):
    id: int
    question: str
    shuffledOptions: List[str]
    correctAnswerIndex: int

class SubmissionData(BaseModel):
    questions: List[Dict[str, Any]]
    answers: Dict[str, int]
    passPercentage: int

@app.on_event("startup")
async def startup_event():
    """Initialize database tables on startup"""
    conn = get_db_connection()
    cur = conn.cursor()
    
    # Create questions table
    cur.execute("""
        CREATE TABLE IF NOT EXISTS questions (
            id SERIAL PRIMARY KEY,
            question TEXT NOT NULL,
            option1 TEXT NOT NULL,
            option2 TEXT NOT NULL,
            option3 TEXT NOT NULL,
            option4 TEXT NOT NULL,
            correct_answer INTEGER NOT NULL CHECK (correct_answer >= 0 AND correct_answer <= 3),
            level VARCHAR(50) NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    """)
    
    # Create assessments table for tracking
    cur.execute("""
        CREATE TABLE IF NOT EXISTS assessments (
            id SERIAL PRIMARY KEY,
            level VARCHAR(50) NOT NULL,
            total_time INTEGER NOT NULL,
            pass_percentage INTEGER NOT NULL,
            score INTEGER,
            total_questions INTEGER,
            percentage NUMERIC(5,2),
            passed BOOLEAN,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    """)
    
    conn.commit()
    cur.close()
    conn.close()

@app.get("/")
async def root():
    return {"message": "Learning Assessment API"}

@app.get("/levels")
async def get_levels():
    """Get all unique levels from questions table"""
    conn = get_db_connection()
    cur = conn.cursor()
    
    cur.execute("SELECT DISTINCT level FROM questions ORDER BY level")
    rows = cur.fetchall()
    levels = [row['level'] for row in rows]
    
    cur.close()
    conn.close()
    
    return {"levels": levels}

@app.post("/upload-questions")
async def upload_questions(file: UploadFile = File(...)):
    """Upload questions from CSV file"""
    if not file.filename.endswith('.csv'):
        raise HTTPException(status_code=400, detail="File must be a CSV")
    
    contents = await file.read()
    csv_file = io.StringIO(contents.decode('utf-8'))
    csv_reader = csv.reader(csv_file)
    
    conn = get_db_connection()
    cur = conn.cursor()
    
    uploaded_count = 0
    for row in csv_reader:
        if len(row) < 7:
            continue
        
        question = row[0].strip()
        option1 = row[1].strip()
        option2 = row[2].strip()
        option3 = row[3].strip()
        option4 = row[4].strip()
        correct_answer = int(row[5].strip())
        level = row[6].strip()
        
        cur.execute("""
            INSERT INTO questions (question, option1, option2, option3, option4, correct_answer, level)
            VALUES (%s, %s, %s, %s, %s, %s, %s)
        """, (question, option1, option2, option3, option4, correct_answer, level))
        uploaded_count += 1
    
    conn.commit()
    cur.close()
    conn.close()
    
    return {"message": f"Successfully uploaded {uploaded_count} questions"}

@app.post("/start-assessment")
async def start_assessment(config: AssessmentConfig):
    """Start an assessment and return randomized questions"""
    conn = get_db_connection()
    cur = conn.cursor()
    
    # Fetch all questions for the selected level
    cur.execute("""
        SELECT id, question, option1, option2, option3, option4, correct_answer
        FROM questions
        WHERE level = %s
    """, (config.level,))
    
    rows = cur.fetchall()
    cur.close()
    conn.close()
    
    if not rows:
        raise HTTPException(status_code=404, detail="No questions found for this level")
    
    # Randomize question order
    random.shuffle(rows)
    
    # Prepare questions with shuffled options
    questions = []
    for row in rows:
        options = [row['option1'], row['option2'], row['option3'], row['option4']]
        correct_answer = row['correct_answer']
        
        # Create mapping of original to new positions
        indices = list(range(4))
        random.shuffle(indices)
        
        shuffled_options = [options[i] for i in indices]
        new_correct_index = indices.index(correct_answer)
        
        questions.append({
            "id": row['id'],
            "question": row['question'],
            "shuffledOptions": shuffled_options,
            "correctAnswerIndex": new_correct_index
        })
    
    return {"questions": questions}

@app.post("/submit-assessment")
async def submit_assessment(submission: SubmissionData):
    """Submit assessment and calculate score"""
    correct_count = 0
    total_questions = len(submission.questions)
    
    # Calculate score
    for question in submission.questions:
        question_id = str(question['id'])
        if question_id in submission.answers:
            user_answer = submission.answers[question_id]
            correct_answer = question['correctAnswerIndex']
            if user_answer == correct_answer:
                correct_count += 1
    
    percentage = (correct_count / total_questions * 100) if total_questions > 0 else 0
    passed = percentage >= submission.passPercentage
    
    # Store assessment result
    conn = get_db_connection()
    cur = conn.cursor()
    
    cur.execute("""
        INSERT INTO assessments (level, total_time, pass_percentage, score, total_questions, percentage, passed)
        VALUES (%s, %s, %s, %s, %s, %s, %s)
    """, ('N/A', 0, submission.passPercentage, correct_count, total_questions, percentage, passed))
    
    conn.commit()
    cur.close()
    conn.close()
    
    return {
        "score": correct_count,
        "total": total_questions,
        "percentage": percentage,
        "passPercentage": submission.passPercentage,
        "passed": passed
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)