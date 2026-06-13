# NexCart — E-commerce Platform with ML Recommendations

> Full-stack e-commerce platform with product search, payment integration, and a custom AI recommendation engine — implementing Q-Learning, SARSA, and Policy Gradient methods from scratch using deep learning (PyTorch). Deployed on GCP with cloud-native, horizontally scalable architecture.

---

## Architecture

```
ml-ecommerce/
├── backend/                  # FastAPI backend
│   ├── main.py               # App entry point
│   ├── database.py           # SQLAlchemy + PostgreSQL setup
│   ├── models.py             # ORM models (Product, User, InteractionLog)
│   ├── seed.py               # Database seeder
│   ├── routers/
│   │   ├── products.py       # GET /api/products
│   │   ├── telemetry.py      # POST /api/telemetry  (RL signal input)
│   │   ├── recommendations.py# GET /api/recommendations/{user_id}
│   │   └── users.py          # GET /api/users
│   ├── ml/
│   │   ├── environment.py    # RL environment + reward function
│   │   ├── trainer.py        # Training loop for all 3 agents
│   │   ├── inference.py      # Singleton inference engine (Q-Learning → live API)
│   │   └── agents/
│   │       ├── q_learning.py # Deep Q-Network (DQN) agent
│   │       ├── sarsa.py      # SARSA agent
│   │       └── policy_gradient.py  # REINFORCE agent
│   ├── tests/
│   │   ├── test_api.py       # FastAPI integration tests
│   │   └── test_agents.py    # RL agent unit tests
│   ├── Dockerfile
│   └── requirements.txt
├── frontend/                 # Next.js 14 frontend
│   ├── src/app/
│   │   ├── page.tsx          # Homepage: catalog + AI picks
│   │   ├── products/[id]/    # Product detail with SARSA recommendations
│   │   └── checkout/         # Multi-step payment flow
│   ├── src/components/
│   │   ├── Navbar.tsx
│   │   ├── ProductCard.tsx   # Tracks click & add_to_cart signals
│   │   └── CartDrawer.tsx
│   ├── src/lib/
│   │   ├── telemetry.ts      # Fire-and-forget interaction tracking
│   │   └── products.ts       # Shared product types & mock data
│   ├── Dockerfile
│   └── next.config.js
├── k8s/
│   ├── backend-deployment.yaml   # Deployment + HPA (3–10 replicas)
│   └── frontend-deployment.yaml  # LoadBalancer service + HPA
├── docker-compose.yml        # Local dev: PostgreSQL + Redis
└── .env.example
```

---

## ML Recommendation Engine

### Reinforcement Learning Setup

| Component | Description |
|-----------|-------------|
| **State** | User session history — last N product interactions encoded as a fixed-size vector |
| **Action** | Product ID to recommend |
| **Reward** | Computed from interaction type and session depth |

### Reward Function

```
view       → +0.1
click      → +1.0
add_to_cart → +5.0
purchase   → +20.0
fatigue penalty: -0.05 × session_depth
```

### Inference (Live API)

The `ml/inference.py` module exposes a module-level singleton `_RecommendationEngine` that:

1. Lazy-initialises a `QLearningAgent` on first request (avoids import-time GPU overhead)
2. Builds a numeric state vector from the user's last 10 interaction events fetched from the DB
3. Runs a forward pass through the DQN (no gradient, `torch.no_grad()`)
4. Returns the top-K product IDs ranked by Q-value
5. Optionally loads pre-trained weights from `ml/checkpoints/q_agent.pt` if present

The `/api/recommendations/{user_id}` endpoint integrates this engine and includes:
- DB validation (only returns IDs that exist in the products table)
- Safe fallback to latest products when the DB is empty
- Anonymous session support (matches on `session_id` when `user_id` has no history)

### Agents
| Agent | Algorithm | Key Trait |
|-------|-----------|-----------|
| `q_learning.py` | Deep Q-Network with experience replay | Off-policy; stable via minibatch |
| `sarsa.py` | SARSA (on-policy TD) | Conservative; uses actual next action |
| `policy_gradient.py` | REINFORCE (Monte Carlo PG) | Learns stochastic policy; end-of-episode update |

---

## Running Locally

### 1. Start Infrastructure
```bash
docker-compose up -d
```

### 2. Backend
```bash
cd backend
pip install -r requirements.txt

# Seed database
python -m backend.seed

# Start API
uvicorn main:app --reload --port 8000
```

### 3. Frontend
```bash
cd frontend
npm install
npm run dev        # → http://localhost:3000
```

### 4. Train RL Agents
```bash
python -m backend.ml.trainer
```

### 5. Run Tests
```bash
# API integration tests
pytest backend/tests/test_api.py -v

# RL agent unit tests
pytest backend/tests/test_agents.py -v
```

---

## GCP Deployment

### Prerequisites
- GCP Project with GKE and Cloud SQL enabled
- `gcloud` CLI and `kubectl` configured

### Deploy to GKE
```bash
# Build and push Docker images
docker build -t gcr.io/$GCP_PROJECT_ID/ml-ecommerce-backend ./backend
docker build -t gcr.io/$GCP_PROJECT_ID/ml-ecommerce-frontend ./frontend
docker push gcr.io/$GCP_PROJECT_ID/ml-ecommerce-backend
docker push gcr.io/$GCP_PROJECT_ID/ml-ecommerce-frontend

# Apply Kubernetes manifests
kubectl apply -f k8s/backend-deployment.yaml
kubectl apply -f k8s/frontend-deployment.yaml
```

The HPA is configured to scale from **3 to 10 pods** based on CPU utilisation (70% threshold for backend, 60% for frontend).

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 14, TailwindCSS, TypeScript |
| Backend | FastAPI, SQLAlchemy, Pydantic |
| Database | PostgreSQL, Redis |
| ML Engine | PyTorch (Q-Learning, SARSA, Policy Gradients) |
| Infrastructure | Docker, Kubernetes (GKE), GCP Load Balancer |
| Tests | pytest, httpx |
