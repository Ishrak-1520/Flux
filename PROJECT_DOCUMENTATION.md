# 🌌 Flux: Technical Specifications & Documentation

## 📌 Overview
**Flux** is an intelligent AI Project Mentor designed to guide students and beginners from a raw idea to a fully scaffolded codebase. It acts as a "Senior Developer" companion, automating market research, generating educational project blueprints, and producing professional technical documentation (PRDs, Roadmaps) with a focus on learning and clarity.

---

## 🎨 Design System: "The Flux Theme"
The application adheres to a **Cyber-minimalist, Deep Space, and Glassmorphism** aesthetic, designed to feel futuristic yet accessible.
- **Color Palette**: 
  - `dark-bg`: Slate-950 (#020617)
  - `flux-accent`: Gradient from Violet-500 (#8b5cf6) to Cyan-400 (#22d3ee)
  - `glass`: Translucent panels with background blur and subtle borders.
- **Typography**: Space Grotesk (Sans) and JetBrains Mono (Code/Mono).
- **Animations**: Floating elements, pulsing glows, and smooth gradient transitions.

---

## 🚀 Core Features

### 1. The Vault (Dashboard)
- **Centralized Project Hub**: Manage all your ideas in one place.
- **Interactive Project Cards**: Featuring glassmorphism, status badges, and hover-triggered actions.
- **Rename Functionality**: Inline renaming of project titles directly from the vault.

### 2. Idea Explorer (Research)
- **Agentic RAG**: Uses **DuckDuckGo** to perform real-time, live web searches to ground ideas in current market data.
- **Mentor Persona**: The AI adopts a friendly, encouraging tone, explaining technical jargon in simple terms.
- **Educational Blueprints**: Generates 3 unique "Starter Ideas" (Blueprints).
- **"Why This Stack?"**: Every recommended technology includes a specific reason (e.g., "React is great for beginners due to its community") to help students learn.

### 3. Improvement Ideas (Planning)
- **Sidebar-driven Document Viewer**: Seamlessly switch between Improvement Ideas (Roadmap), Product Plan (PRD), Step-by-Step Logic (SRS), and AI Instructions (`.cursorrules`).
- **Refinement Toolbar**: Highlight any text to ask the AI to rewrite, simplify, or expand it.
- **Plan-to-Code Bridge**: A dedicated "Send to Code Generator" button that transfers your selected plan directly to the scaffold engine.

### 4. Code Generator (The Forge)
- **Context-Aware Scaffolding**: Generates a non-generic project skeleton based *exactly* on your selected Blueprint's tech stack and database schema.
- **One-Click Download**: Zips the entire generated codebase for immediate download and local use.

---

## 🏗️ Technical Stack

### Backend (Python/FastAPI)
- **FastAPI**: High-performance async API framework.
- **aiomysql**: Asynchronous connection pooling for MySQL database.
- **OpenAI/LongCat SDK**: Handles streaming completions using `Flash-Thinking` and `Flash-Chat` models.
- **DuckDuckGo Search**: For real-time, agentic web research.
- **SSE (Server-Sent Events)**: Provides real-time "Thinking" and "Content" streams to the frontend.
- **JWT Authentication**: Secure user sessions with Bcrypt password hashing.

### Frontend (Vanilla JS/Tailwind)
- **Zero-Build SPA**: Pure HTML/JS/CSS without heavy bundlers for maximum speed and simplicity.
- **Tailwind CSS 3.x**: Utility-first styling with a custom "Flux" theme configuration.
- **Custom Router**: Client-side hashing for seamless view transitions.
- **Markdown Rendering**: Uses `marked.js` with specific configurations for code blocks and Mermaid diagrams.

---

## 📂 File Structure & Responsibilities

### Root Directory
- `PROJECT_DOCUMENTATION.md`: (This file) Complete project guide.
- `requirements.txt`: Python package dependencies.
- `schema.sql`: Database initialization script.
- `vercel.json`: Deployment configuration.

### `api/` (Backend Logic)
- **`index.py`**: Main application router and core API endpoints.
- **`ai_engine.py`**: AI prompt management, Mentor persona, citation protocols, and stream generators.
- **`agent_search.py`**: Module for executing live web searches via DuckDuckGo.
- **`db.py`**: MySQL database layer (CRUD operations, connection pool).
- **`auth.py`**: JWT token logic, password security, and dependency injection.
- **`models.py`**: Pydantic models, including the new `TechStackItem` with educational reasons.

### `static/` (Frontend SPA)
- **`index.html`**: Entry point and Tailwind/Theme configuration.
- **`js/app.js`**: Core application router and state manager.
- **`js/api.js`**: Wrapper for `fetch` calls and persistent auth headers.
- **`js/views/`**:
  - `auth.js`: Login/Registration with glass cards.
  - `dashboard.js`: The "Vault" project grid logic.
  - `idetaion.js`: Idea capturing and category selection.
  - `research.js`: "Idea Explorer" with real-time streaming and educational blueprint cards.
  - `planning.js`: "Improvement Ideas" viewer with refinement tools and Plan-to-Code bridge.
  - `forge.js`: "Code Generator" for scaffolding projects.
- **`js/components/`**: Reusable UI elements like `card.js` and `header.js`.

---

## 🛠️ Setup & Installation

1. **Database**: Import `schema.sql` into a MySQL server and update `.env` credentials.
2. **Environment**:
   ```bash
   pip install -r requirements.txt
   ```
3. **Run Server**:
   ```bash
   python -m uvicorn api.index:app --reload
   ```
4. **Access**: Open `http://localhost:8000` in your browser.

---
*Documentation updated to reflect Student-First UX overhaul.*
