# Deltabotix Frontend

React + Blockly frontend for Deltabotix (visual programming for embedded systems).  
Talks to backend at `http://localhost:3000` by default.

## Setup

```bash
npm install
npm run dev
```

App: `http://localhost:5173` (Vite) or `http://localhost:3001` (if configured).

## Push to Git (separate repo)

Use a **separate** GitHub/GitLab repo for frontend (e.g. `deltabotix-frontend`).

```bash
cd frontend
git init
git add .
git commit -m "Initial commit: Deltabotix frontend"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/deltabotix-frontend.git
git push -u origin main
```

Replace `YOUR_USERNAME/deltabotix-frontend` with your repo URL.

## Scripts

- `npm run dev` - Dev server
- `npm run build` - Production build
- `npm run preview` - Preview build
- `npm run lint` - ESLint

## Tech

- React 18, Vite 6, Blockly 12, TypeScript, Axios.

