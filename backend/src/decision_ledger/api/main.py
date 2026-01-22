"""FastAPI application entry point for Decision Ledger."""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from decision_ledger.config import get_settings
from decision_ledger.api.routes import claims, decisions, governance, catalogs, qa

settings = get_settings()

app = FastAPI(
    title="Decision Ledger API",
    description="Deterministic, versioned decision engine for insurance claims",
    version="0.1.0",
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(claims.router, prefix="/api/claims", tags=["claims"])
app.include_router(decisions.router, prefix="/api/decisions", tags=["decisions"])
app.include_router(governance.router, prefix="/api/governance", tags=["governance"])
app.include_router(catalogs.router, prefix="/api/catalogs", tags=["catalogs"])
app.include_router(qa.router, prefix="/api/qa", tags=["qa"])


@app.get("/health")
async def health_check() -> dict:
    """Health check endpoint."""
    return {"status": "ok", "version": "0.1.0"}


@app.post("/api/reset")
async def reset_demo_data() -> dict:
    """Reset demo data to initial state."""
    # TODO: Implement reset logic
    return {"status": "reset", "message": "Demo data has been reset"}
