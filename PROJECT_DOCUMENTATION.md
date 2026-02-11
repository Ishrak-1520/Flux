# 🌌 Flux: Technical Specifications & Documentation

## 📌 Overview
**Flux** is an advanced AI Project Architect designed to transform raw product ideas into professional-grade technical documentation. It streamlines the software development lifecycle by automating the generation of Market Gap Analyses, PRDs, System Requirement Specifications (SRS), and implementation Roadmaps.

---

## 🎨 Design System: "The Flux Theme"
The application adheres to a **Cyber-minimalist, Deep Space, and Glassmorphism** aesthetic.
- **Color Palette**: 
  - `dark-bg`: Slate-950 (#020617)
  - `flux-accent`: Gradient from Violet-500 (#8b5cf6) to Cyan-400 (#22d3ee)
  - `glass`: Translucent panels with background blur and subtle borders.
- **Typography**: Space Grotesk (Sans) and JetBrains Mono (Code/Mono).
- **Animations**: Floating elements, pulsing glows, and smooth gradient transitions.

---

## 🚀 Core Features

### 1. The Vault (Dashboard)
- **Centralized project management** for all generated blueprints.
- **Interactive Project Cards**: Featuring glassmorphism, status badges, and hover-triggered actions (Open/Delete).
- **Rename Functionality**: Inline renaming of project titles directly from the vault or within the project view.

### 2. AI Architect (Ideation & Research)
- **Dual-Entry Ideation**: Support for "Freestyle" prompts or "Guided" category selection (e.g., E-commerce, SaaS, AI Tool).
- **Deep Gap Analysis**: Analyzes market landscape, identifies critical gaps, and proposes 3 unique project blueprints.
- **Citation Protocol**: Every AI generation includes a mandatory "References & Analysis Sources" section, citing user context and simulated market standards.
- **Emoji-Free Output**: Strict constraints ensure a professional technical tone suitable for enterprise-grade documents.

### 3. Planning Suite (Technical Viewer)
- **Sidebar-driven Document Viewer**: Seamlessly switch between Roadmap, PRD, SRS, and `.cursorrules`.
- **technical Schematic Aesthetic**: Document content is rendered with clean typography and code blocks optimized for developer readability.
- **Export Ready**: Tools for copying content to the clipboard and (planned) file exports.

---

## 🏗️ Technical Stack

### Backend (Python/FastAPI)
- **FastAPI**: High-performance async API framework.
- **aiomysql**: Asynchronous connection pooling for MySQL database.
- **OpenAI/LongCat SDK**: Handles streaming completions using `Flash-Thinking` and `Flash-Chat` models.
- **SSE (Server-Sent Events)**: Provides real-time "Thinking" and "Content" streams to the frontend.
- **JWT Authentication**: Secure user sessions with Bcrypt password hashing.

### Frontend (Vanilla JS/Tailwind)
- **Zero-Build SPA**: Pure HTML/JS/CSS without heavy bundlers for maximum speed and simplicity.
- **Tailwind CSS 3.x**: Utility-first styling with a custom "Flux" theme configuration.
- **Custom Router**: Client-side hashing for seamless view transitions.
- **SSE Parser**: Robust buffer-based stream reader for handling real-time AI increments.

---

## 📂 File Structure & Responsibilities

### Root Directory
- `PROJECT_DOCUMENTATION.md`: (This file) Complete project guide.
- `requirements.txt`: Python package dependencies.
- `schema.sql`: Database initialization script.
- `vercel.json`: Deployment configuration.

### `api/` (Backend Logic)
- **`index.py`**: Main application router and core API endpoints.
- **`ai_engine.py`**: AI prompt management, citation protocols, and stream generators.
- **`db.py`**: MySQL database layer (CRUD operations, connection pool).
- **`auth.py`**: JWT token logic, password security, and dependency injection.
- **`models.py`**: Pydantic models for request validation and response schemas.

### `static/` (Frontend SPA)
- **`index.html`**: Entry point and Tailwind/Theme configuration.
- **`js/app.js`**: Core application router and state manager.
- **`js/api.js`**: Wrapper for `fetch` calls and persistent auth headers.
- **`js/views/`**:
  - `auth.js`: Login/Registration with glass cards.
  - `dashboard.js`: The "Vault" project grid logic.
  - `ideation.js`: Idea capturing and category selection.
  - `research.js`: Real-time streaming research and blueprint selection.
  - `planning.js`: Advanced technical document viewer with sidebar.
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
*Documentation generated on 2026-02-11.*
