# ⚔️ Deadline Commander

> Turn your deadlines into missions. Plan smarter, execute faster, and defeat every deadline.

Deadline Commander is a productivity-focused RPG web application built around a simple problem:

**When you have multiple assignments, projects, exams, and personal tasks, it becomes difficult to know what to work on first and whether you are actually on track.**

Instead of giving users another basic to-do list, Deadline Commander turns their workload into a structured mission system.

Your deadlines become **bosses**, your work becomes **missions**, and completing important work helps your character progress.

---

## 🎯 Why Deadline Commander?

Most productivity apps tell you:

> "You have 8 tasks remaining."

Deadline Commander tries to answer a more useful question:

> **"What should I work on right now so I don't miss my important deadlines?"**

The application considers things such as:

- Deadline urgency
- Task importance
- Estimated workload
- Task dependencies
- Available time
- Current progress

It then creates a prioritized plan for the user.

---

## 🧩 How It Works

The basic flow is:

```text
Add Goals / Deadlines
        ↓
Break them into Tasks
        ↓
Analyze Priority & Risk
        ↓
Generate Missions
        ↓
Complete Work
        ↓
Earn XP & Rewards
        ↓
Track Progress
        ↓
Adjust the Plan
```

## Deploying the frontend on Vercel

Set the Vercel project Root Directory to `frontend`. Vercel detects Vite; use
`npm run build` as the build command and `dist` as the output directory.

- Demo mode needs no environment variables.
- For live authentication and snapshot sync, set `VITE_API_URL` to the public
  HTTPS URL of the separately deployed API, without a trailing slash.
- Configure the API with `JWT_SECRET`, `MONGODB_URI`, and `CORS_ORIGIN` set to
  the deployed Vercel frontend URL.
