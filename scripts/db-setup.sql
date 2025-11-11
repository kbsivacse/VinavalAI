-- Create database (run this separately if needed)
-- CREATE DATABASE assessment_db;

-- Connect to the database
-- \c assessment_db;

-- Questions table
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
);

-- Create index on level for faster queries
CREATE INDEX IF NOT EXISTS idx_questions_level ON questions(level);

-- Assessments table for tracking student results
CREATE TABLE IF NOT EXISTS assessments (
    id SERIAL PRIMARY KEY,
    student_id VARCHAR(100),  -- Optional: can be added later for student tracking
    level VARCHAR(50) NOT NULL,
    total_time INTEGER NOT NULL,
    pass_percentage INTEGER NOT NULL,
    score INTEGER NOT NULL,
    total_questions INTEGER NOT NULL,
    percentage NUMERIC(5,2) NOT NULL,
    passed BOOLEAN NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create index on created_at for faster date-based queries
CREATE INDEX IF NOT EXISTS idx_assessments_created_at ON assessments(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_assessments_level ON assessments(level);

-- Sample data insertion (optional - for testing)
-- INSERT INTO questions (question, option1, option2, option3, option4, correct_answer, level) VALUES
-- ('What is 2 + 2?', '3', '4', '5', '6', 1, 'Easy'),
-- ('What is the capital of France?', 'London', 'Berlin', 'Paris', 'Madrid', 2, 'Easy'),
-- ('What is the square root of 144?', '10', '11', '12', '13', 2, 'Medium'),
-- ('What is the chemical symbol for gold?', 'Go', 'Au', 'Gd', 'Ag', 1, 'Medium'),
-- ('What is the derivative of x^2?', 'x', '2x', 'x^2', '2', 1, 'Hard');

-- Query to view all questions
-- SELECT * FROM questions ORDER BY level, id;

-- Query to view assessment results
-- SELECT * FROM assessments ORDER BY created_at DESC;