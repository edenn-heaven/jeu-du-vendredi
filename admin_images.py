"""
admin_images.py — Gestionnaire d'images pour databaseImage.db
Usage :
    python admin_images.py list                  # Lister toutes les images
    python admin_images.py delete <id>           # Supprimer une image par son ID
    python admin_images.py delete-all            # Supprimer toutes les images
    python admin_images.py info <id>             # Afficher les détails d'une image
"""

import sqlite3
import os
import sys

DB_PATH = os.path.join(os.path.dirname(__file__), "databaseImage.db")


def get_db():
    if not os.path.exists(DB_PATH):
        print("Erreur : databaseImage.db introuvable. Lancez d'abord image.py pour créer la base.")
        sys.exit(1)
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn


def list_images():
    with get_db() as conn:
        rows = conn.execute(
            "SELECT id, filename, original_name, mime_type, quiz_question_ref, uploaded_at, LENGTH(data) as size FROM images ORDER BY id"
        ).fetchall()

    if not rows:
        print("Aucune image dans la base de données.")
        return

    print(f"\n{'ID':<5} {'Nom original':<30} {'Type MIME':<20} {'Taille':<12} {'Référence question':<20} {'Date upload'}")
    print("-" * 110)
    for row in rows:
        size_kb = round(row["size"] / 1024, 1)
        ref = row["quiz_question_ref"] or "—"
        print(f"{row['id']:<5} {row['original_name']:<30} {row['mime_type']:<20} {size_kb} Ko{'':<7} {ref:<20} {row['uploaded_at']}")
    print(f"\nTotal : {len(rows)} image(s)")


def delete_image(image_id):
    with get_db() as conn:
        row = conn.execute("SELECT id, original_name FROM images WHERE id = ?", (image_id,)).fetchone()
        if not row:
            print(f"Erreur : aucune image avec l'ID {image_id}.")
            return

        confirm = input(f"Supprimer l'image '{row['original_name']}' (ID {image_id}) ? [o/N] ").strip().lower()
        if confirm != "o":
            print("Suppression annulée.")
            return

        conn.execute("DELETE FROM images WHERE id = ?", (image_id,))
        conn.commit()
        print(f"Image ID {image_id} supprimée.")


def delete_all():
    with get_db() as conn:
        count = conn.execute("SELECT COUNT(*) FROM images").fetchone()[0]
        if count == 0:
            print("Aucune image à supprimer.")
            return

        confirm = input(f"Supprimer TOUTES les {count} image(s) ? Cette action est irréversible. [o/N] ").strip().lower()
        if confirm != "o":
            print("Suppression annulée.")
            return

        conn.execute("DELETE FROM images")
        conn.commit()
        print(f"{count} image(s) supprimée(s).")


def image_info(image_id):
    with get_db() as conn:
        row = conn.execute(
            "SELECT id, filename, original_name, mime_type, quiz_question_ref, uploaded_at, LENGTH(data) as size FROM images WHERE id = ?",
            (image_id,)
        ).fetchone()

    if not row:
        print(f"Erreur : aucune image avec l'ID {image_id}.")
        return

    print(f"\n--- Image ID {row['id']} ---")
    print(f"  Nom original      : {row['original_name']}")
    print(f"  Nom fichier (DB)  : {row['filename']}")
    print(f"  Type MIME         : {row['mime_type']}")
    print(f"  Taille            : {round(row['size'] / 1024, 1)} Ko")
    print(f"  Référence         : {row['quiz_question_ref'] or '—'}")
    print(f"  Uploadée le       : {row['uploaded_at']}")


def print_help():
    print(__doc__)


if __name__ == "__main__":
    args = sys.argv[1:]

    if not args or args[0] in ("-h", "--help", "help"):
        print_help()
    elif args[0] == "list":
        list_images()
    elif args[0] == "delete" and len(args) == 2:
        try:
            delete_image(int(args[1]))
        except ValueError:
            print("Erreur : l'ID doit être un entier.")
    elif args[0] == "delete-all":
        delete_all()
    elif args[0] == "info" and len(args) == 2:
        try:
            image_info(int(args[1]))
        except ValueError:
            print("Erreur : l'ID doit être un entier.")
    else:
        print("Commande inconnue. Utilisez --help pour voir les options.")
        print_help()
