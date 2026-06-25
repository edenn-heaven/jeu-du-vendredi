import sqlite3

db = sqlite3.connect("database.db")
cursor = db.cursor()

print("1 - Supprimer un utilisateur")
print("2 - Supprimer un quiz")

choix = input("Choix : ")

if choix == "1":
    username = input("Nom d'utilisateur : ")

    cursor.execute(
        "DELETE FROM users WHERE username = ?",
        (username,)
    )

    db.commit()

    if cursor.rowcount:
        print("Utilisateur supprimé.")
    else:
        print("Utilisateur introuvable.")

elif choix == "2":
    quiz = input("Nom du quiz : ")

    cursor.execute(
        "DELETE FROM quiz WHERE name = ?",
        (quiz,)
    )

    db.commit()

    if cursor.rowcount:
        print("Quiz supprimé.")
    else:
        print("Quiz introuvable.")

db.close()