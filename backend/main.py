from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .routers import products, users, recommendations, telemetry
from .database import engine, Base

# Create database tables
Base.metadata.create_all(bind=engine)

app = FastAPI(title="ML E-commerce Platform API")

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # In production, restrict this
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(products.router, prefix="/api/products", tags=["Products"])
app.include_router(users.router, prefix="/api/users", tags=["Users"])
app.include_router(recommendations.router, prefix="/api/recommendations", tags=["Recommendations"])
app.include_router(telemetry.router, prefix="/api/telemetry", tags=["Telemetry"])

@app.get("/")
def read_root():
    return {"message": "Welcome to the ML E-commerce Platform API"}
