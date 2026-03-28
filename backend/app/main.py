from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.database import engine, Base
from app.routers import accounts, transactions, categories, envelopes, imports, exports

Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="Personal Budget Tracker API",
    description="API for managing personal budget with envelope system",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(accounts.router)
app.include_router(transactions.router)
app.include_router(categories.router)
app.include_router(envelopes.router)
app.include_router(imports.router)
app.include_router(exports.router)


@app.get("/health")
def health_check():
    return {"status": "healthy", "version": "1.0.0"}


@app.get("/")
def root():
    return {"message": "Personal Budget Tracker API"}
