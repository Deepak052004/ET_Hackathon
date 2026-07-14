<div align="center">
  <img src="frontend/public/icons.svg" alt="SafetyNexus AI Logo" width="120" />
  <h1>SafetyNexus AI</h1>
  <p><strong>AI-Powered Industrial Safety Intelligence for Zero-Harm Operations</strong></p>
  
  [![Live Demo](https://img.shields.io/badge/Live%20Demo-safetynexus.vercel.app-00DAF3?style=for-the-badge&logo=vercel)](https://safetynexus.vercel.app)
  [![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)](https://reactjs.org/)
  [![FastAPI](https://img.shields.io/badge/FastAPI-005571?style=for-the-badge&logo=fastapi)](https://fastapi.tiangolo.com/)
  [![Gemini](https://img.shields.io/badge/Google%20Gemini-8E75B2?style=for-the-badge&logo=google)](https://deepmind.google/technologies/gemini/)
</div>

<br />

## 🚨 The Problem: The High Cost of Data Silos
In January 2025, eight workers tragically died at the Visakhapatnam Steel Plant due to an entrapped gas explosion. A post-incident investigation revealed a heartbreaking truth: **The warning signals were there.** The pressure sensors were firing, and the permit logs were documented. 

However, because these systems were disconnected, no human or software could connect the dots in time. **Data was present, but intelligence was absent.**

## 🛡️ The Solution: SafetyNexus AI
**SafetyNexus AI** is a predictive, industrial command center that fuses IoT telemetry, worker permit logs, and Generative AI to transition heavy industries from *reactive compliance* to *predictive intelligence*. 

By actively monitoring compound risk across a facility, SafetyNexus AI prevents fatalities before they happen.

---

## ✨ X-Factor Features

### 1. 🚁 Autonomous Drone Vision
When critical compound risk is detected (e.g., elevated H2S near a Hot Work permit), the system autonomously dispatches a drone. Using simulated computer vision, the platform visually confirms entrapped gas leaks instantly—without sending human inspectors into hazardous zones.

### 2. 🧠 Multi-Agent Auto-RCA (GenAI)
Safety officers no longer spend days writing reports. Powered by a Multi-Agent RAG Query Engine, SafetyNexus synthesizes live telemetry against **OISD Guidelines** and the **Factory Act**, typing out a comprehensive Root Cause Analysis and corrective action plan in under 3 seconds.

### 3. 🚨 Predictive Emergency Evacuation
When an unavoidable threat is confirmed, the system initiates an autonomous Emergency Protocol. The Sector Infrastructure Map dynamically calculates safe routing and tracks the real-time evacuation of workers away from danger zones.

### 4. 🔀 Permit Conflict Resolution Engine
Automatically cross-references spatial data with the Permit to Work (PTW) database to flag overlapping hazards (e.g., Hot Work authorized next to Confined Space Entry) before work begins.

---

## 🛠️ Technology Stack

**Frontend (Mission Control UI)**
* React.js & Vite
* Tailwind CSS (Custom Dark Mode Industrial Design)
* Zustand (Global State Management)
* React-Leaflet (Geospatial Mapping)

**Backend (Data & AI Layer)**
* FastAPI (Python)
* PostgreSQL (Relational Data)
* Neo4j (Knowledge Graph Topology)
* ChromaDB (Vector Database for RAG)
* Redis (Real-time WebSocket Pub/Sub)
* Google Gemini (Generative AI & RCA)

---

## 🚀 Live Demonstration
The frontend is fully decoupled and features a robust **Mock Data Engine**, allowing the entire UI—including AI Chatbots, Drone Feeds, and live maps—to be presented instantly without spinning up the 5-container backend architecture.

**👉 View the Live Demo:** [https://safetynexus.vercel.app](https://safetynexus.vercel.app)

---

## 💻 Local Development

### Running the Frontend (UI Only)
The frontend can run completely standalone using its internal mock data engine.
```bash
cd frontend
npm install
npm run dev
```

### Running the Full Stack (With Backend)
If you wish to run the full Data & AI layer, ensure Docker is installed.
```bash
# 1. Copy the environment template
cp .env.example .env

# 2. Add your Gemini API Key to .env
# GEMINI_API_KEY=your_key_here

# 3. Spin up the 5-container architecture
docker-compose up --build
```
*The backend API will be available at `http://localhost:8000/api`.*
