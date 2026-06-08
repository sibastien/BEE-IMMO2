# Bee Consulting

Projet immobilier avec backend Node.js + Express + MongoDB Atlas et frontend HTML/CSS/JavaScript.

## Structure

```text
backend/
  server.js
  config/
  controllers/
  middleware/
  models/
  routes/
  .env
  package.json

frontend/
  index.html
  admin.html
  property.html
  config.js
  styles.css
  home.js
  app.js
  property.js
  vercel.json
```

## Installation

```bash
cd backend
npm install
```

Copiez le fichier `.env.example` vers `.env`, puis mettez votre vraie connexion MongoDB Atlas.

```env
PORT=5000
MONGO_URI=mongodb+srv://USERNAME:PASSWORD@CLUSTER.mongodb.net/bee_immo?retryWrites=true&w=majority
CLIENT_ORIGIN=http://localhost:5000,http://127.0.0.1:5000,https://your-frontend.vercel.app
ADMIN_EMAIL=admin@beeconsulting.local
ADMIN_PASSWORD=admin123
AUTH_SECRET=change-this-secret-key
```

Dans MongoDB Atlas, pensez aussi a autoriser votre adresse IP dans **Network Access**.

## Connexion admin

Par defaut, connectez-vous dans l'interface avec :

```text
Email: admin@beeconsulting.local
Mot de passe: admin123
```

Changez ces valeurs dans `.env` avant une vraie mise en ligne.

## Lancer le projet

```bash
cd backend
npm run dev
```

L'API sera disponible sur :

```text
http://localhost:5000
```

Le site public sera disponible sur :

```text
http://localhost:5000
```

Le dashboard admin sera disponible sur :

```text
http://localhost:5000/admin
```

Les pages detail d'annonce utilisent cette forme :

```text
http://localhost:5000/property/ID_DE_L_ANNONCE
```

## Routes disponibles

```text
POST   /api/properties
GET    /api/properties
GET    /api/properties/:id
PUT    /api/properties/:id
DELETE /api/properties/:id
```

## Deploiement Render + Vercel

### 1. Publier le projet sur GitHub

Ne publiez jamais le fichier `backend/.env`. Le fichier `.gitignore` le bloque deja.

Option VS Code :

```text
Source Control > Publish to GitHub
```

Option terminal, si Git est installe :

```bash
git init
git add .
git commit -m "Initial Bee Consulting website"
git branch -M main
git remote add origin https://github.com/VOTRE_NOM/bee-consulting.git
git push -u origin main
```

Ensuite, connectez Render et Vercel a ce meme repository GitHub.

### 2. Backend sur Render

Le fichier `render.yaml` est pret pour creer le service backend.

Parametres Render si vous le faites manuellement :

```text
Root Directory: backend
Build Command: npm install
Start Command: npm start
```

Variables d'environnement a ajouter dans Render :

```text
NODE_ENV=production
MONGO_URI=votre_connexion_mongo_atlas
CLIENT_ORIGIN=https://votre-site.vercel.app
ADMIN_EMAIL=admin@beeconsulting.local
ADMIN_PASSWORD=mot_de_passe_solide
AUTH_SECRET=long_secret_aleatoire
```

Apres le deploiement, testez l'API avec :

```text
https://votre-backend-render.onrender.com/api/health
```

### 3. Frontend sur Vercel

Dans Vercel, deployez le dossier `frontend`.

Parametres Vercel :

```text
Framework Preset: Other
Build Command: laisser vide
Output Directory: .
```

Avant de deployer le frontend, ouvrez `frontend/config.js` et remplacez :

```js
API_BASE_URL: '',
```

par l'URL de votre backend Render :

```js
API_BASE_URL: 'https://votre-backend-render.onrender.com',
```

Puis ajoutez le domaine Vercel dans `CLIENT_ORIGIN` sur Render pour autoriser les appels API.

## Exemple de creation

```json
{
  "title": "Villa moderne a Hammamet",
  "description": "Belle villa lumineuse proche de la plage.",
  "price": 450000,
  "transactionType": "sale",
  "propertyType": "villa",
  "city": "Hammamet",
  "district": "Yasmine Hammamet",
  "address": "Rue principale",
  "surface": 280,
  "bedrooms": 4,
  "bathrooms": 3,
  "images": [
    "https://example.com/image-1.jpg",
    "https://example.com/image-2.jpg"
  ],
  "status": "available"
}
```
