# Rinth - How to Start the App

## Prerequisites

- Node.js (v16 or higher)
- npm or yarn package manager

---

## Installation & Setup

### 1. Navigate to the Frontend Directory

```bash
cd frontend
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Start the Development Server

```bash
npm run dev
```

The app will start at `http://localhost:5173` (or another port if 5173 is busy).

---

## Do Users Need to Login to Puter.js?

**No, users do NOT need to login to Puter.js to use Rinth.**

### How It Works:

- **Puter.js runs in the background** automatically when users visit your app
- **No authentication required** - The free AI features work immediately
- **Anonymous usage** - Puter.js provides free unlimited access to Gemini AI models without user login
- **Zero configuration** - Just include the Puter.js script in your HTML (already set up in `index.html`)

### What Users Can Do Without Login:

✅ Generate engineering projects with AI  
✅ Create AI-generated 3D project images  
✅ Get component buying links  
✅ Use the contextual chat assistant  
✅ Download project PDFs  

### Optional: Rinth User Authentication

While Puter.js doesn't require login, **Rinth has its own optional authentication** (via Supabase) for:
- Saving projects to user history
- Sharing projects to the community
- Managing personal project library

Users can use Rinth as **guest users** or **sign up** to save their work.

---

## Quick Start Summary

```bash
# Clone the repository
git clone https://github.com/CoreMaTriX-0/Rinth.git

# Navigate to frontend
cd Rinth/frontend

# Install dependencies
npm install

# Start development server
npm run dev
```

Open `http://localhost:5173` in your browser and start building projects! 🚀
