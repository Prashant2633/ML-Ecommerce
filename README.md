# NexCart — E-commerce Platform with AI Recommendations

> Full-stack e-commerce platform with product search, payment integration, and a custom serverless AI recommendation engine — implementing Content-Based Filtering (similar items) and Popularity-based Filtering (trending items). Optimized to avoid heavy ML packages (like PyTorch) for fast startup speeds (<45ms) and seamless deployment within Vercel's 500MB Lambda limit.

---

## Architecture

```
ml-ecommerce/
├── backend/                  # FastAPI backend
│   ├── main.py               # App entry point
│   ├── database.py           # SQLAlchemy setup
│   ├── models.py             # ORM models (Product, User, InteractionLog)
│   ├── seed.py               # Database seeder (populates demo catalog)
│   ├── routers/
│   │   ├── products.py       # GET /api/products
│   │   ├── telemetry.py      # POST /api/telemetry (logs user behavior)
│   │   ├── recommendations.py# GET /api/recommendations/{user_id}
│   │   └── users.py          # GET /api/users
│   ├── ml/
│   │   └── inference.py      # Recommendations: Content-Based & Popularity similarities
│   ├── tests/
│   │   └── test_api.py       # FastAPI integration tests
│   ├── Dockerfile
│   └── requirements.txt
├── frontend/                 # Next.js frontend
│   ├── src/app/
│   │   ├── page.tsx          # Homepage: catalog + Bento Grid AI Picks
│   │   ├── products/[id]/    # Product detail page with similar recommendations
│   │   └── checkout/         # Multi-step PCI-DSS/Luhn payment flow
│   ├── src/components/
│   │   ├── Navbar.tsx        # Responsive, mobile-friendly navigation
│   │   ├── ProductCard.tsx   # Catalog product display
│   │   └── CartDrawer.tsx
│   ├── src/lib/
│   │   ├── telemetry.ts      # Telemetry client event tracking
│   │   └── products.ts       # Shared product schemas
│   ├── Dockerfile
│   └── next.config.js
├── k8s/
│   ├── backend-deployment.yaml   # Deployment config
│   └── frontend-deployment.yaml  
├── docker-compose.yml        
└── .env.example
```

---

## ML Recommendation Engine

### Similarity Filtering Setup

| Method | Recommendation Logic | Trigger |
|--------|----------------------|---------|
| **Content-Based Filtering** | Calculates Cosine-like similarity using category matching, word token overlap in description/title, and price delta proximity. | Product details page (via `product_id` query param) |
| **Popularity-based Filtering** | Counts interaction frequencies (views, clicks, add-to-carts, purchases) dynamically in telemetry logs. | Homepage |

### Inference Speed
By avoiding heavy deep learning models and PyTorch libraries, recommendations are calculated using pure Python and NumPy arrays:
- **Fast Startup**: Under **45ms** latency.
- **Serverless Friendly**: Fits cleanly under the **500MB** serverless bundle limit.
- **Real-Time updates**: Weights shift dynamically as new telemetry is recorded.

---

## Running Locally

### 1. Backend API
```bash
cd backend

# Install dependencies (ensure python virtualenv is active)
pip install -r requirements.txt

# Seed database with SQLite demo catalog
python -m backend.seed

# Start Uvicorn development server
uvicorn backend.main:app --reload --port 8000
```

### 2. Frontend App
```bash
cd frontend

# Install packages
npm install

# Start Next.js development server
npm run dev        # Runs on http://localhost:3000
```

### 3. Run Tests
```bash
# Run API integration test suite
pytest backend/tests/test_api.py -v
```

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js, Vanilla CSS, TypeScript |
| Backend | FastAPI, SQLAlchemy (SQLite/PostgreSQL) |
| Recommendations | NumPy / Pure Python Text Similarity |
| Infrastructure | Docker, Kubernetes (GKE) |
| Tests | pytest, HTTPX TestClient |
