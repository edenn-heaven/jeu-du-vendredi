import sqlite3
import os

DB_PATH = os.path.join(os.path.dirname(__file__), "database.db")

db = sqlite3.connect(DB_PATH)
cursor = db.cursor()

cursor.execute("""CREATE TABLE IF NOT EXISTS quiz (
    id INTEGER PRIMARY KEY,
    name TEXT NOT NULL,
    creator TEXT NOT NULL,
    creation_date DATE NOT NULL,
    average_score REAL DEFAULT 0,
    player_count INTEGER DEFAULT 0,
    tags TEXT
)""")

cursor.execute("""CREATE TABLE IF NOT EXISTS question (
    id INTEGER PRIMARY KEY,
    quiz_id INTEGER NOT NULL,
    question TEXT NOT NULL,
    FOREIGN KEY (quiz_id) REFERENCES quiz(id)
)""")

cursor.execute("""CREATE TABLE IF NOT EXISTS answer (
    id INTEGER PRIMARY KEY,
    question_id INTEGER NOT NULL,
    answer TEXT NOT NULL,
    is_correct BOOLEAN NOT NULL,
    FOREIGN KEY (question_id) REFERENCES question(id)
)""")

cursor.execute("""CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY,
    username TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    average_score REAL DEFAULT 0,
    account_creation_date DATE NOT NULL
)""")

cursor.execute("""CREATE TABLE IF NOT EXISTS quiz_results (
    id INTEGER PRIMARY KEY,
    user_id INTEGER NOT NULL,
    quiz_id INTEGER NOT NULL,
    score REAL NOT NULL,
    play_date DATE NOT NULL,

    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (quiz_id) REFERENCES quiz(id)
)""")

cursor.execute("SELECT name FROM sqlite_master WHERE type='table';")
print(cursor.fetchall())
