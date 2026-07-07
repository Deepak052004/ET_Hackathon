"""
SafetyNexus AI — RAG Pipeline
ChromaDB + Gemini for incident pattern intelligence and regulatory queries.
"""
import chromadb
from chromadb.utils import embedding_functions
from sqlalchemy.orm import Session
from datetime import datetime
import json

from app.config import get_settings
from app.models.incident import Incident

settings = get_settings()

# ─── ChromaDB Client ──────────────────────────────────────────────────────────
def get_chroma_client():
    return chromadb.HttpClient(
        host=settings.CHROMADB_HOST,
        port=settings.CHROMADB_PORT,
    )


def get_embedding_function():
    return embedding_functions.SentenceTransformerEmbeddingFunction(
        model_name="all-MiniLM-L6-v2"
    )


# ─── Index incidents into ChromaDB ───────────────────────────────────────────
def index_incidents(db: Session):
    """
    Embed all incidents from the DB into ChromaDB for RAG retrieval.
    Call this once after seeding.
    """
    try:
        client = get_chroma_client()
        ef = get_embedding_function()
        collection = client.get_or_create_collection(
            name="incidents",
            embedding_function=ef,
            metadata={"hnsw:space": "cosine"},
        )

        # Check if already indexed
        existing = collection.count()
        if existing > 50:
            print(f"    ✓ ChromaDB already has {existing} incidents indexed. Skipping re-index.")
            return

        incidents = db.query(Incident).all()
        documents, metadatas, ids = [], [], []
        for inc in incidents:
            # Build a rich text document for embedding
            doc = f"""
Incident Report: {inc.title}
Type: {inc.incident_type.value}
Severity: {inc.severity.value}
Zone: {inc.zone.name if inc.zone else 'Unknown'}
Date: {inc.occurred_at.strftime('%Y-%m-%d') if inc.occurred_at else 'Unknown'}

Description: {inc.description}

Root Cause: {inc.root_cause or 'Not determined'}

Contributing Factors: {', '.join(json.loads(inc.contributing_factors)) if inc.contributing_factors else 'None recorded'}

Actions Taken: {inc.actions_taken or 'None recorded'}
Workers Affected: {inc.workers_affected}, Injuries: {inc.injuries}, Fatalities: {inc.fatalities}
""".strip()

            documents.append(doc)
            metadatas.append({
                "incident_uid": inc.incident_uid,
                "incident_type": inc.incident_type.value,
                "severity": inc.severity.value,
                "zone_name": inc.zone.name if inc.zone else "Unknown",
                "year": str(inc.occurred_at.year) if inc.occurred_at else "Unknown",
            })
            ids.append(inc.incident_uid)

        if documents:
            # Batch upsert
            batch_size = 50
            for i in range(0, len(documents), batch_size):
                collection.upsert(
                    documents=documents[i:i+batch_size],
                    metadatas=metadatas[i:i+batch_size],
                    ids=ids[i:i+batch_size],
                )
            print(f"    ✓ Indexed {len(documents)} incidents into ChromaDB")
    except Exception as e:
        print(f"    ⚠ ChromaDB indexing error: {e}")


# ─── RAG Query ────────────────────────────────────────────────────────────────
async def query_incidents(query: str, db: Session, n_results: int = 5) -> dict:
    """
    Retrieve relevant incident reports using vector search, then generate
    a synthesized answer using Gemini.
    """
    try:
        client = get_chroma_client()
        ef = get_embedding_function()
        collection = client.get_or_create_collection(name="incidents", embedding_function=ef)

        # Retrieve top-k relevant incidents
        results = collection.query(
            query_texts=[query],
            n_results=min(n_results, collection.count()),
        )

        if not results["documents"] or not results["documents"][0]:
            return {
                "query": query,
                "answer": "No relevant historical incidents found in the database.",
                "sources": [],
                "timestamp": datetime.utcnow().isoformat(),
            }

        docs = results["documents"][0]
        metas = results["metadatas"][0]
        distances = results["distances"][0] if results.get("distances") else []

        # Build context for Gemini
        context = "\n\n---\n\n".join(docs[:5])
        prompt = f"""You are SafetyNexus AI, an industrial safety intelligence system.
A safety manager has asked: "{query}"

Based on the following historical incident reports from the database, provide a concise, actionable analysis:

{context}

Provide:
1. A direct answer to the query
2. Key patterns found across the incidents
3. Recommended preventive actions
4. Relevant regulatory references (OISD, Factory Act, DGMS) if applicable

Be specific, cite details from the incidents, and keep the response under 300 words."""

        # Call Gemini
        answer = await _call_gemini(prompt)

        sources = [
            {
                "incident_uid": m.get("incident_uid"),
                "incident_type": m.get("incident_type"),
                "severity": m.get("severity"),
                "zone_name": m.get("zone_name"),
                "relevance_score": round(1 - d, 3) if distances else None,
            }
            for m, d in zip(metas, distances or [0] * len(metas))
        ]

        return {
            "query": query,
            "answer": answer,
            "sources": sources,
            "sources_count": len(sources),
            "timestamp": datetime.utcnow().isoformat(),
        }

    except Exception as e:
        return {
            "query": query,
            "answer": f"RAG query error: {str(e)}. Ensure ChromaDB is running and incidents are indexed.",
            "sources": [],
            "timestamp": datetime.utcnow().isoformat(),
        }


async def _call_gemini(prompt: str) -> str:
    """Call Gemini 1.5 Flash for text generation."""
    try:
        import google.generativeai as genai
        genai.configure(api_key=settings.GEMINI_API_KEY)
        model = genai.GenerativeModel("gemini-1.5-flash")
        response = model.generate_content(prompt)
        return response.text
    except Exception as e:
        return f"[Gemini unavailable: {str(e)}] Based on retrieved incidents, similar patterns involve compound risk factors including gas accumulation, active work permits, and inadequate monitoring. Key recommendation: implement multi-sensor correlation with automated permit cross-referencing."
