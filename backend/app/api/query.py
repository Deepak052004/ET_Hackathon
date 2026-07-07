"""
Plan: POST /api/query — Natural language safety queries (RAG pipeline)
Plan: GET /api/knowledge/equipment/{id}/risks — Knowledge graph queries
"""
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from pydantic import BaseModel
from app.models.db import get_db

router = APIRouter(prefix="/api", tags=["query"])


class QueryRequest(BaseModel):
    query: str


@router.post("/query")
async def natural_language_query(body: QueryRequest, db: Session = Depends(get_db)):
    """
    Plan: POST /api/query — natural language safety queries via RAG pipeline.
    Shubhranshu's Incident Investigation View calls this endpoint.
    """
    from app.services.rag import query_incidents
    results = await query_incidents(body.query, db)
    return results
