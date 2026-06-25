## Modifications à effectuer
1. Possibilité d'ajouter des images.
3. Réarranger les boutons sur [[quiz.html]]
> 2. Refaire la navbar (logo, jeu du vendredi)
> 4. Rendre les stats de [[community.html]] fonctionnelles
> 5. Ajouter des animations sur [[quiz.html]]
> 6. Possibilité de choisir le nombre de réponses possibles sur [[create.html]]
> 7. Ajouter des options pour la partie sur [[prequiz.html]]
> 8. Rendre le css fonctionnel sur <button type="submit">Se connecter</button> sur [[login.html]]
> 9. Modifier l'interface des filtres sur [[community.html]]
> 10. Rendre les boutons modify et delete de [[create.html]] fonctionnels.
> 11. Charger un fichier .json de questions

## Que faut il ajouter/retirer:

Débug les boutons de [[prequiz.html]] car ils ne marchent pas. Détecter les bugs et les régler. Ajouter une possibilité d'ajouter des images sur [[create.html]], qui seront dans une autre base de donnée sqlite que tu créeras avec, comme pour sqlite.py, mais tu metteras image.py (databaseImage.db). Il faudra un programme simple pour accéder à la database pour supprimer des images.

## Modifications effectuées

### Bug prequiz.js — CORRIGÉ
Le fichier `prequiz.js` contenait le code entier en double : l'IIFE `(() => { ... })()` se refermait au milieu du fichier, puis toutes les fonctions et listeners étaient répétés en dehors, sans accès aux variables locales. Cela causait des `ReferenceError` et rendait les boutons non-fonctionnels. Le doublon a été supprimé.

### Système d'images — AJOUTÉ
- **`image.py`** : initialise la base `databaseImage.db` avec la table `images` (id, filename, original_name, mime_type, data BLOB, quiz_question_ref, uploaded_at).
- **`admin_images.py`** : outil CLI pour gérer les images (list, delete <id>, delete-all, info <id>).
- **`server.py`** : 4 nouvelles routes API :
  - `POST /api/images/upload` — upload multipart d'une image
  - `GET /api/images` — liste des images (sans le binaire)
  - `GET /api/images/<id>` — récupère le binaire d'une image
  - `DELETE /api/images/<id>` — supprime une image
- **`create.html` + `create.js`** : nouvelle section "Ajouter une image" avec aperçu avant envoi, référence question optionnelle, galerie des images enregistrées avec bouton supprimer.
