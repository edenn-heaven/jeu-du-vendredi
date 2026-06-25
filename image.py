import sqlite3
import os

DB_PATH = os.path.join(os.path.dirname(__file__), "databaseImage.db")

db = sqlite3.connect(DB_PATH)
cursor = db.cursor()

cursor.execute("""CREATE TABLE IF NOT EXISTS images (
    id INTEGER PRIMARY KEY,
    quiz_question_ref TEXT,
    filename TEXT NOT NULL,
    original_name TEXT NOT NULL,
    mime_type TEXT NOT NULL,
    data BLOB NOT NULL,
    uploaded_at DATETIME DEFAULT CURRENT_TIMESTAMP
)""")

db.commit()

cursor.execute("SELECT name FROM sqlite_master WHERE type='table';")
print("Tables créées :", cursor.fetchall())

db.close()
print("Base de données databaseImage.db initialisée avec succès.")
