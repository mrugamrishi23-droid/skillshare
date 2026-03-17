"""
Run this script after seeding skills to add quiz questions.
Usage: cd backend && python seed_quizzes.py
"""
import sys
sys.path.insert(0, '.')
from database import SessionLocal
import models, json

QUIZZES = {
    "Python": [
        {"id": 1, "question": "What is the output of: print(type([]))?", "options": ["<class 'list'>", "<class 'array'>", "<class 'tuple'>", "<class 'dict'>"], "correct": 0},
        {"id": 2, "question": "Which keyword is used to define a function in Python?", "options": ["func", "define", "def", "function"], "correct": 2},
        {"id": 3, "question": "What does 'PEP 8' refer to?", "options": ["A Python library", "Python's style guide", "A data structure", "An error type"], "correct": 1},
        {"id": 4, "question": "Which of the following is immutable?", "options": ["list", "dict", "tuple", "set"], "correct": 2},
        {"id": 5, "question": "What is the result of 7 // 2 in Python?", "options": ["3.5", "4", "3", "2"], "correct": 2},
    ],
    "JavaScript": [
        {"id": 1, "question": "What does 'typeof null' return in JavaScript?", "options": ["'null'", "'undefined'", "'object'", "'boolean'"], "correct": 2},
        {"id": 2, "question": "Which method adds an element to the end of an array?", "options": ["push()", "append()", "add()", "insert()"], "correct": 0},
        {"id": 3, "question": "What is the difference between '==' and '==='?", "options": ["No difference", "'===' checks value only", "'===' checks value and type", "'==' checks type only"], "correct": 2},
        {"id": 4, "question": "What does 'async/await' handle?", "options": ["Synchronous code", "Promises/asynchronous code", "Error handling", "Loops"], "correct": 1},
        {"id": 5, "question": "Which keyword creates a block-scoped variable?", "options": ["var", "let", "global", "static"], "correct": 1},
    ],
    "React": [
        {"id": 1, "question": "What hook is used for side effects in React?", "options": ["useState", "useEffect", "useContext", "useRef"], "correct": 1},
        {"id": 2, "question": "What is JSX?", "options": ["A new programming language", "A JavaScript syntax extension for UI", "A CSS framework", "A build tool"], "correct": 1},
        {"id": 3, "question": "When does a component re-render?", "options": ["Only on page load", "When state or props change", "Every second", "When the user scrolls"], "correct": 1},
        {"id": 4, "question": "What does React.memo() do?", "options": ["Stores data in memory", "Memoizes a component to prevent re-renders", "Creates a new context", "Handles errors"], "correct": 1},
        {"id": 5, "question": "What is the virtual DOM?", "options": ["The real DOM", "A lightweight copy of the DOM React uses", "A browser API", "A CSS concept"], "correct": 1},
    ],
    "UI/UX Design": [
        {"id": 1, "question": "What does 'affordance' mean in UX design?", "options": ["The cost of a design", "Visual cues that suggest how something is used", "Page loading speed", "Color theory"], "correct": 1},
        {"id": 2, "question": "What is a wireframe?", "options": ["A finished design", "A low-fidelity skeletal layout", "A code framework", "A user interview"], "correct": 1},
        {"id": 3, "question": "What does 'accessibility' (a11y) focus on?", "options": ["Making apps fast", "Ensuring designs are usable by everyone", "Mobile design", "SEO"], "correct": 1},
        {"id": 4, "question": "What is the purpose of a user persona?", "options": ["A fake social profile", "A representation of a target user type", "A legal document", "A color palette"], "correct": 1},
        {"id": 5, "question": "In typography, what is 'kerning'?", "options": ["Font weight", "Space between individual letters", "Line height", "Font color"], "correct": 1},
    ],
    "Machine Learning": [
        {"id": 1, "question": "What is 'overfitting' in ML?", "options": ["Model too simple", "Model memorizes training data, fails on new data", "Too much training data", "Model never converges"], "correct": 1},
        {"id": 2, "question": "What does 'supervised learning' require?", "options": ["Unlabeled data", "Labeled data with known outputs", "No data", "Real-time data only"], "correct": 1},
        {"id": 3, "question": "What is the purpose of a train/test split?", "options": ["Speed up training", "Evaluate model on unseen data", "Reduce data size", "Improve accuracy on training data"], "correct": 1},
        {"id": 4, "question": "Which algorithm is used for classification?", "options": ["Linear regression", "K-means", "Random Forest", "PCA"], "correct": 2},
        {"id": 5, "question": "What is a 'feature' in machine learning?", "options": ["A bug", "An input variable used for prediction", "An output label", "A model parameter"], "correct": 1},
    ],
}

def seed_quizzes():
    db = SessionLocal()
    try:
        for skill_name, questions in QUIZZES.items():
            skill = db.query(models.Skill).filter(models.Skill.name == skill_name).first()
            if skill:
                skill.quiz_questions = questions
                print(f"  Added {len(questions)} questions to {skill_name}")
            else:
                print(f"  Skill '{skill_name}' not found - run /api/skills/seed first")
        db.commit()
        print("\nQuizzes seeded successfully!")
    finally:
        db.close()

if __name__ == "__main__":
    seed_quizzes()
