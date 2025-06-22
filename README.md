# generateur-doc-sql
Générateur de documentation SQL au format DOCX

## Installer le projet
  Le projet fonctionne avec une version de Node supérieure à 18.16 ainsi qu'avec une version de npm supérieure à 8.18.0.
  ```sh
$ node -v && npm -v
v18.16.0
8.18.0
```
Après avoir cloné le répertoire, lancer un `npm install` et le tour est joué !

## Description du contenu du projet
Ce projet permet de générer une documentation SQL à partir du script SQL de génération de la base.

Le fichier contenant le schema de la base à générer se trouve dans `ressources/schema.sql`.

Les fichiers générés (un modèle logique de données et un modèle physique de données) sont enregistrés dans `doc_generes`.

