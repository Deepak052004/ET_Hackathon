# SafetyNexus AI

Industrial Safety Intelligence Platform — built for the ET AI Hackathon 2026.

## Structure
- `/backend`: FastAPI Python backend, Neo4j Knowledge Graph, ChromaDB RAG, Predictive Analytics.
- `docker-compose.yml`: Local infrastructure (PostgreSQL, Neo4j, Redis, ChromaDB, FastAPI).
- `SHUBHRANSHU_HANDOFF.md`: Frontend developer handoff and API specification document.
- `api-contracts.md`: Initial API contracts.

## Getting Started

1. Clone this repository.
2. Ensure you have Docker and Docker Compose installed.
3. Copy `.env.example` to `backend/.env` and fill in your `GEMINI_API_KEY`.
4. Run `docker-compose up --build` from the root directory.
5. The backend API will be available at `http://localhost:8000/api`.

See `SHUBHRANSHU_HANDOFF.md` for full API details.
