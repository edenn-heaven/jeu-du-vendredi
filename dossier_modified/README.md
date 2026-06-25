# Le Jeu du Vendredi
Bienvenue sur **Le Jeu du Vendredi**, une plateforme permettant de créer, partager et participer à des quiz interactifs.
# Lancer l'application
## Prérequis
* Python 3 doit être installé sur votre machine.
* Tous les fichiers du projet doivent être présents dans leur emplacement d'origine.
## Démarrage
1. Ouvrez un terminal dans le dossier racine du projet.
2. Exécutez la commande suivante :
```bash
python server.py
```
3. Suivez les éventuelles instructions affichées dans la console.
4. Ouvrez ensuite votre navigateur à l'adresse :
```text
http://[votre ip]:5000/
```
L'application est désormais prête à être utilisée.
# Résolution des problèmes
## Vérification de l'arborescence
En cas de problème lors du lancement, vérifiez que tous les fichiers et dossiers du projet sont présents.
Si certains fichiers sont manquants, téléchargez à nouveau le projet ou restaurez les fichiers concernés.
## Base de données principale
Si le fichier `database.db` est absent :
```bash
python sqlite.py
```
Une nouvelle base de données sera créée automatiquement.
## Base de données des images
Si le fichier `databaseImage.db` est absent :
```bash
python image.py
```
Une nouvelle base de données dédiée aux images sera créée automatiquement.
# Architecture du projet
## Dossier `JSON TEST`
Ce dossier contient des exemples de quiz pouvant être importés dans l'application. Il n'est pas nécessaire à son fonctionnement mais permet une prise en main plus rapide.
### Fichiers disponibles
* `arts.json`
* `cinema.json`
* `informatique.json`
* `languefrancaise.json`
* `musique.json`
## Structure du projet
```text
Projet
│
├── JSON TEST
│   ├── arts.json
│   ├── cinema.json
│   ├── informatique.json
│   ├── languefrancaise.json
│   └── musique.json
│
├── Javascript
│   ├── community
│   │   ├── community.js
│   │   └── login.js
│   ├── create.js
│   ├── prequiz.js
│   ├── quiz.js
│   ├── results.js
│   └── storage.js
│
├── Medias
│   └── logo.avif
│
├── Pages
│   ├── community
│   │   ├── community.html
│   │   └── login.html
│   ├── create.html
│   ├── index.html
│   ├── prequiz.html
│   ├── quiz.html
│   └── results.html
│
├── admin.py
├── admin_images.py
├── database.db
├── databaseImage.db
├── image.py
├── README.md
├── server.py
├── sqlite.py
└── style.css
```
# Description des principaux fichiers
| Fichier           | Description                               |
| ----------------- | ----------------------------------------- |
| `server.py`       | Lance le serveur web de l'application.    |
| `sqlite.py`       | Initialise la base de données principale. |
| `image.py`        | Initialise la base de données des images. |
| `admin.py`        | Outils d'administration des quiz.         |
| `admin_images.py` | Outils d'administration des images.       |
| `style.css`       | Feuille de style principale du site.      |
# Remarques
* Le projet fonctionne sur le réseau local à l'aide d'un serveur Python.
* Les fichiers présents dans `JSON TEST` peuvent être importés afin de tester rapidement les fonctionnalités de l'application.
* Les bases de données peuvent être recréées automatiquement à l'aide des scripts dédiés si elles sont absentes.
* Pour éviter tout dysfonctionnement, il est recommandé de conserver l'arborescence du projet telle qu'elle est fournie.
