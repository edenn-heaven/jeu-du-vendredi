import sqlite3
import hashlib
import os
import base64
from datetime import date
from flask import Flask, request, jsonify, send_from_directory, session, Response
from flask_cors import CORS

BASE_DIR = os.path.dirname(__file__)

app = Flask(__name__, static_folder=BASE_DIR, static_url_path="")
app.secret_key = "vendredi-secret-key-change-moi"
CORS(app, supports_credentials=True)

DB_PATH = os.path.join(BASE_DIR, "database.db")
IMAGE_DB_PATH = os.path.join(BASE_DIR, "databaseImage.db")

ALLOWED_MIME_TYPES = {"image/jpeg", "image/png", "image/gif", "image/webp"}
MAX_IMAGE_SIZE = 5 * 1024 * 1024  # 5 Mo

def get_image_db():
    conn = sqlite3.connect(IMAGE_DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

def get_db():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA foreign_keys = ON")
    return conn

def hash_password(password: str) -> str:
    """Hash SHA-256 simple. Remplace par bcrypt en production."""
    return hashlib.sha256(password.encode()).hexdigest()

@app.route("/")
def index():
    return send_from_directory(os.path.join(BASE_DIR, "Pages"), "index.html")

@app.route("/Pages/<path:filename>")
def pages(filename):
    return send_from_directory(os.path.join(BASE_DIR, "Pages"), filename)

@app.route("/Javascript/<path:filename>")
def javascript(filename):
    return send_from_directory(os.path.join(BASE_DIR, "Javascript"), filename)

@app.route("/Medias/<path:filename>")
def medias(filename):
    return send_from_directory(os.path.join(BASE_DIR, "Medias"), filename)

@app.route("/style.css")
def style():
    return send_from_directory(BASE_DIR, "style.css")

@app.route("/api/login", methods=["POST"])
def login():
    """
    Connexion ou création automatique de compte.
    Body JSON : { "username": "...", "password": "..." }
    """
    data = request.get_json(silent=True)
    if not data:
        return jsonify({"error": "Données manquantes"}), 400

    username = (data.get("username") or "").strip()
    password = data.get("password") or ""

    if not username or not password:
        return jsonify({"error": "Nom d'utilisateur et mot de passe requis"}), 400

    hashed = hash_password(password)

    with get_db() as conn:
        user = conn.execute(
            "SELECT * FROM users WHERE username = ?", (username,)
        ).fetchone()

        if user is None:
            # ── Création automatique du compte ──
            conn.execute(
                """INSERT INTO users (username, password, average_score, account_creation_date)
                   VALUES (?, ?, 0, ?)""",
                (username, hashed, date.today().isoformat()),
            )
            conn.commit()
            user = conn.execute(
                "SELECT * FROM users WHERE username = ?", (username,)
            ).fetchone()
            created = True
        else:
            # ── Vérification du mot de passe ──
            if user["password"] != hashed:
                return jsonify({"error": "Mot de passe incorrect"}), 401
            created = False

    session["user_id"] = user["id"]
    session["username"] = user["username"]

    return jsonify({
        "success": True,
        "created": created,
        "user": {
            "id": user["id"],
            "username": user["username"],
            "average_score": user["average_score"],
            "account_creation_date": user["account_creation_date"],
        },
        "message": "Compte créé et connecté !" if created else "Connecté !",
    }), 200


@app.route("/api/logout", methods=["POST"])
def logout():
    session.clear()
    return jsonify({"success": True}), 200


@app.route("/api/me", methods=["GET"])
def me():
    """Retourne les infos de l'utilisateur connecté."""
    if "user_id" not in session:
        return jsonify({"error": "Non connecté"}), 401

    with get_db() as conn:
        user = conn.execute(
            "SELECT id, username, average_score, account_creation_date FROM users WHERE id = ?",
            (session["user_id"],),
        ).fetchone()

    if not user:
        session.clear()
        return jsonify({"error": "Utilisateur introuvable"}), 404

    return jsonify(dict(user)), 200



@app.route("/api/community/leaderboard", methods=["GET"])
def leaderboard():
    """
    Classement : ratio (total des points) / (moyenne du % de réussite).
    """
    with get_db() as conn:
        rows = conn.execute("""
            SELECT
                u.id,
                u.username,
                u.average_score,
                COALESCE(SUM(qr.score), 0)   AS total_score,
                COUNT(qr.id)                  AS games_played
            FROM users u
            LEFT JOIN quiz_results qr ON qr.user_id = u.id
            GROUP BY u.id
            ORDER BY total_score DESC, u.average_score DESC
        """).fetchall()

    result = []
    for rank, row in enumerate(rows, start=1):
        result.append({
            "rank": rank,
            "id": row["id"],
            "username": row["username"],
            "total_score": round(row["total_score"], 1),
            "average_score": round(row["average_score"], 1),
            "games_played": row["games_played"],
        })

    return jsonify(result), 200

@app.route("/api/community/quizzes", methods=["GET"])
def quizzes():
    """
    Liste tous les quiz.
    Paramètre optionnel : ?tag=Histoire  (filtre par tag)
    """
    tag_filter = request.args.get("tag", "").strip()

    with get_db() as conn:
        if tag_filter:
            rows = conn.execute("""
                SELECT * FROM quiz
                WHERE ',' || tags || ',' LIKE ?
                ORDER BY player_count DESC
            """, (f"%,{tag_filter},%",)).fetchall()
        else:
            rows = conn.execute(
                "SELECT * FROM quiz ORDER BY player_count DESC"
            ).fetchall()

    result = []
    for row in rows:
        result.append({
            "id": row["id"],
            "name": row["name"],
            "creator": row["creator"],
            "creation_date": row["creation_date"],
            "average_score": round(row["average_score"], 1),
            "player_count": row["player_count"],
            "tags": [t.strip() for t in (row["tags"] or "").split(",") if t.strip()],
        })

    return jsonify(result), 200


@app.route("/api/community/tags", methods=["GET"])
def tags():
    """Retourne tous les tags existants dans la base, triés alphabétiquement."""
    with get_db() as conn:
        rows = conn.execute("SELECT tags FROM quiz WHERE tags IS NOT NULL AND tags != ''").fetchall()

    all_tags = set()
    for row in rows:
        for tag in row["tags"].split(","):
            t = tag.strip()
            if t:
                all_tags.add(t)

    return jsonify(sorted(all_tags)), 200

@app.route("/api/community/quizzes/<int:quiz_id>", methods=["GET"])
def quiz_detail(quiz_id):
    """Retourne un quiz complet avec ses questions et réponses."""
    with get_db() as conn:
        quiz = conn.execute(
            "SELECT * FROM quiz WHERE id = ?",
            (quiz_id,),
        ).fetchone()

        if not quiz:
            return jsonify({"error": "Quiz introuvable"}), 404

        question_rows = conn.execute(
            "SELECT id, question FROM question WHERE quiz_id = ? ORDER BY id",
            (quiz_id,),
        ).fetchall()

        questions = []
        for question_row in question_rows:
            answer_rows = conn.execute(
                "SELECT answer, is_correct FROM answer WHERE question_id = ? ORDER BY id",
                (question_row["id"],),
            ).fetchall()
            answers = [row["answer"] for row in answer_rows]
            correct_answers = [
                index for index, row in enumerate(answer_rows) if row["is_correct"]
            ]
            questions.append({
                "id": question_row["id"],
                "question": question_row["question"],
                "answers": answers,
                "correctAnswers": correct_answers,
                "type": "truefalse" if answers == ["Vrai", "Faux"] else "multiple",
            })

    return jsonify({
        "id": quiz["id"],
        "title": quiz["name"],
        "creator": quiz["creator"],
        "createdAt": quiz["creation_date"],
        "average_score": round(quiz["average_score"], 1),
        "player_count": quiz["player_count"],
        "tags": [tag.strip() for tag in (quiz["tags"] or "").split(",") if tag.strip()],
        "questions": questions,
    }), 200

@app.route("/api/quiz/publish", methods=["POST"])
def publish_quiz():
    """
    Publie un quiz dans la communauté.
    Body JSON : { "name": "...", "tags": ["Histoire", ...], "questions": [...] }
    Nécessite d'être connecté.
    """
    if "user_id" not in session:
        return jsonify({"error": "Connectez-vous pour publier un quiz"}), 401

    data = request.get_json(silent=True)
    if not data or not data.get("name"):
        return jsonify({"error": "Nom du quiz manquant"}), 400

    name = data["name"].strip()
    tags_list = data.get("tags", [])
    questions = data.get("questions", [])

    if not questions:
        return jsonify({"error": "Ajoutez au moins une question avant de publier le quiz"}), 400

    for question in questions:
        if not (question.get("question") or "").strip():
            return jsonify({"error": "Une question est vide"}), 400
        answers = question.get("answers", [])
        if len(answers) < 2:
            return jsonify({"error": "Chaque question doit avoir au moins deux réponses"}), 400
        if not any(answer.get("is_correct") for answer in answers):
            return jsonify({"error": "Chaque question doit avoir au moins une bonne réponse"}), 400

    tags_str = ", ".join(tags_list)
    creator = session["username"]

    with get_db() as conn:
        cursor = conn.execute(
            """INSERT INTO quiz (name, creator, creation_date, average_score, player_count, tags)
               VALUES (?, ?, ?, 0, 0, ?)""",
            (name, creator, date.today().isoformat(), tags_str),
        )
        quiz_id = cursor.lastrowid

        for q in questions:
            qcursor = conn.execute(
                "INSERT INTO question (quiz_id, question) VALUES (?, ?)",
                (quiz_id, q.get("question", "")),
            )
            question_id = qcursor.lastrowid
            for answer in q.get("answers", []):
                conn.execute(
                    "INSERT INTO answer (question_id, answer, is_correct) VALUES (?, ?, ?)",
                    (question_id, answer.get("text", ""), bool(answer.get("is_correct", False))),
                )
        conn.commit()

    return jsonify({"success": True, "quiz_id": quiz_id}), 201

@app.route("/api/quiz/result", methods=["POST"])
def save_result():

    if "user_id" not in session:
        return jsonify({"error": "Non connecté"}), 401

    data = request.get_json()

    quiz_id = data.get("quiz_id")
    score = data.get("score")

    with get_db() as conn:

        conn.execute("""
            INSERT INTO quiz_results
            (user_id, quiz_id, score, play_date)
            VALUES (?, ?, ?, ?)
        """, (
            session["user_id"],
            quiz_id,
            score,
            date.today().isoformat()
        ))

        conn.execute("""
            UPDATE quiz
            SET
                average_score = (
                    SELECT AVG(score)
                    FROM quiz_results
                    WHERE quiz_id = ?
                ),
                player_count = (
                    SELECT COUNT(*)
                    FROM quiz_results
                    WHERE quiz_id = ?
                )
            WHERE id = ?
        """, (quiz_id, quiz_id, quiz_id))

        conn.execute("""
            UPDATE users
            SET average_score = (
                SELECT AVG(score)
                FROM quiz_results
                WHERE user_id = ?
            )
            WHERE id = ?
        """, (session["user_id"], session["user_id"]))

        conn.commit()

    print("DATA =", data)
    print("QUIZ ID =", quiz_id)
    print("SCORE =", score)

    return jsonify({"success": True})


# ── Routes Images ─────────────────────────────────────────────────────────────

@app.route("/api/images/upload", methods=["POST"])
def upload_image():
    """
    Upload une image dans databaseImage.db.
    Multipart form : champ 'image' (fichier) + champ optionnel 'quiz_question_ref'.
    """
    if "image" not in request.files:
        return jsonify({"error": "Aucun fichier envoyé (champ 'image' manquant)"}), 400

    file = request.files["image"]
    if file.filename == "":
        return jsonify({"error": "Nom de fichier vide"}), 400

    mime_type = file.mimetype
    if mime_type not in ALLOWED_MIME_TYPES:
        return jsonify({"error": f"Type de fichier non autorisé. Types acceptés : {', '.join(ALLOWED_MIME_TYPES)}"}), 400

    data = file.read()
    if len(data) > MAX_IMAGE_SIZE:
        return jsonify({"error": "Image trop grande (max 5 Mo)"}), 400

    original_name = file.filename
    # Nom de stockage unique basé sur le timestamp + nom original
    import time
    filename = f"{int(time.time() * 1000)}_{original_name}"
    quiz_question_ref = request.form.get("quiz_question_ref", "")

    # S'assurer que la table existe
    with get_image_db() as conn:
        conn.execute("""CREATE TABLE IF NOT EXISTS images (
            id INTEGER PRIMARY KEY,
            quiz_question_ref TEXT,
            filename TEXT NOT NULL,
            original_name TEXT NOT NULL,
            mime_type TEXT NOT NULL,
            data BLOB NOT NULL,
            uploaded_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )""")
        cursor = conn.execute(
            "INSERT INTO images (quiz_question_ref, filename, original_name, mime_type, data) VALUES (?, ?, ?, ?, ?)",
            (quiz_question_ref, filename, original_name, mime_type, data)
        )
        image_id = cursor.lastrowid
        conn.commit()

    return jsonify({"success": True, "id": image_id, "filename": filename}), 201


@app.route("/api/images", methods=["GET"])
def list_images():
    """Liste toutes les images (sans le contenu binaire)."""
    with get_image_db() as conn:
        conn.execute("""CREATE TABLE IF NOT EXISTS images (
            id INTEGER PRIMARY KEY,
            quiz_question_ref TEXT,
            filename TEXT NOT NULL,
            original_name TEXT NOT NULL,
            mime_type TEXT NOT NULL,
            data BLOB NOT NULL,
            uploaded_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )""")
        rows = conn.execute(
            "SELECT id, filename, original_name, mime_type, quiz_question_ref, uploaded_at, LENGTH(data) as size FROM images ORDER BY id DESC"
        ).fetchall()

    result = [
        {
            "id": row["id"],
            "filename": row["filename"],
            "original_name": row["original_name"],
            "mime_type": row["mime_type"],
            "quiz_question_ref": row["quiz_question_ref"],
            "uploaded_at": row["uploaded_at"],
            "size_kb": round(row["size"] / 1024, 1),
        }
        for row in rows
    ]
    return jsonify(result), 200


@app.route("/api/images/<int:image_id>", methods=["GET"])
def get_image(image_id):
    """Retourne le contenu binaire de l'image (pour l'afficher dans une balise <img>)."""
    with get_image_db() as conn:
        row = conn.execute(
            "SELECT data, mime_type FROM images WHERE id = ?", (image_id,)
        ).fetchone()

    if not row:
        return jsonify({"error": "Image introuvable"}), 404

    return Response(row["data"], mimetype=row["mime_type"])


@app.route("/api/images/<int:image_id>", methods=["DELETE"])
def delete_image(image_id):
    """Supprime une image de la base."""
    with get_image_db() as conn:
        row = conn.execute("SELECT id FROM images WHERE id = ?", (image_id,)).fetchone()
        if not row:
            return jsonify({"error": "Image introuvable"}), 404
        conn.execute("DELETE FROM images WHERE id = ?", (image_id,))
        conn.commit()

    return jsonify({"success": True}), 200


if __name__ == "__main__":
    print("Serveur démarré sur http://localhost:5000")
    app.run(host="0.0.0.0", port=5000)