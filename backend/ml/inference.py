"""
ML Inference Module — serves real-time recommendations from the trained RL agents.

The module maintains a singleton NumpyDQN (fastest for synchronous inference).
On startup it initialises with random weights; in production you would load a
checkpoint saved by trainer.py (np.savez / np.load).

Usage (inside a FastAPI route):
    from ..ml.inference import get_recommendations
    product_ids = get_recommendations(user_interactions, num_products=8, top_k=5)
"""

import numpy as np
from typing import List

# ── Hyper-parameters must match whatever was used during training ──────────────
STATE_SIZE   = 10   # session history depth
NUM_PRODUCTS = 100  # action-space size (must be >= number of seeded products)

# ── Reward weights — mirrors environment.py ────────────────────────────────────
ACTION_WEIGHTS = {
    "purchase":    20.0,
    "add_to_cart":  5.0,
    "click":        1.0,
    "view":         0.1,
}


class NumpyDQN:
    """
    Pure NumPy implementation of the Deep Q-Network.
    Bypasses PyTorch during inference to keep dependencies lightweight.
    """
    def __init__(self, state_size: int, action_size: int):
        self.state_size = state_size
        self.action_size = action_size
        self.w1 = None
        self.b1 = None
        self.w2 = None
        self.b2 = None
        self.w3 = None
        self.b3 = None
        self.load_or_init()

    def load_or_init(self):
        import os
        # Look for weights file next to this module
        weights_path = os.path.join(os.path.dirname(__file__), "q_agent_weights.npz")

        if os.path.exists(weights_path):
            try:
                data = np.load(weights_path)
                self.w1 = data['w1']
                self.b1 = data['b1']
                self.w2 = data['w2']
                self.b2 = data['b2']
                self.w3 = data['w3']
                self.b3 = data['b3']
                return
            except Exception:
                pass

        # Fallback: Deterministic initialization matching PyTorch's default linear init
        # PyTorch uses uniform(-1/sqrt(in_features), 1/sqrt(in_features))
        rng = np.random.default_rng(42)
        
        limit1 = 1.0 / np.sqrt(self.state_size)
        self.w1 = rng.uniform(-limit1, limit1, (self.state_size, 128))
        self.b1 = rng.uniform(-limit1, limit1, 128)
        
        limit2 = 1.0 / np.sqrt(128)
        self.w2 = rng.uniform(-limit2, limit2, (128, 128))
        self.b2 = rng.uniform(-limit2, limit2, 128)
        
        limit3 = 1.0 / np.sqrt(128)
        self.w3 = rng.uniform(-limit3, limit3, (128, self.action_size))
        self.b3 = rng.uniform(-limit3, limit3, self.action_size)

    def forward(self, state: np.ndarray) -> np.ndarray:
        h1 = np.maximum(0, np.dot(state, self.w1) + self.b1)
        h2 = np.maximum(0, np.dot(h1, self.w2) + self.b2)
        q_values = np.dot(h2, self.w3) + self.b3
        return q_values


class _RecommendationEngine:
    """
    Singleton wrapper around NumpyDQN.
    Keeps the model loaded in memory between requests.
    """

    def __init__(self):
        self._model: NumpyDQN | None = None

    def _get_model(self) -> NumpyDQN:
        """Lazy-initialise the model on first call."""
        if self._model is None:
            self._model = NumpyDQN(
                state_size=STATE_SIZE,
                action_size=NUM_PRODUCTS,
            )
        return self._model

    def build_state(self, interactions: List[dict]) -> np.ndarray:
        """
        Encode the most recent STATE_SIZE interactions as a fixed-length state vector.

        Each interaction contributes a weighted score at its position in the history
        window. This gives the agent a numeric representation of the session.

        Args:
            interactions: List of dicts with keys 'product_id' and 'action_type',
                          ordered oldest-first (as returned by a DB query).

        Returns:
            numpy array of shape (STATE_SIZE,)
        """
        state = np.zeros(STATE_SIZE, dtype=np.float32)

        # Take the last STATE_SIZE events
        recent = interactions[-STATE_SIZE:]

        for i, event in enumerate(recent):
            weight = ACTION_WEIGHTS.get(event.get("action_type", "view"), 0.1)
            # Normalise product_id into [0, 1] range
            pid_norm = (event.get("product_id", 0) % NUM_PRODUCTS) / NUM_PRODUCTS
            state[i] = pid_norm * weight

        return state

    def recommend(
        self,
        interactions: List[dict],
        top_k: int = 5,
        num_db_products: int = NUM_PRODUCTS,
    ) -> List[int]:
        """
        Return a ranked list of up to `top_k` product IDs for the given session.

        Args:
            interactions: Raw interaction history for this user/session.
            top_k:        How many recommendations to return.
            num_db_products: Actual number of products in the database
                             (clamps action space to valid IDs).

        Returns:
            List of 1-indexed product IDs (matching the DB primary key).
        """
        model = self._get_model()
        state = self.build_state(interactions)

        # Forward pass through our NumPy model
        q_values = model.forward(state)

        # Clamp to the actual number of products in the DB
        effective_actions = min(num_db_products, NUM_PRODUCTS)
        q_values = q_values[:effective_actions]

        # Get top-k action indices (sorted highest Q-value to lowest)
        top_k = min(top_k, effective_actions)
        top_indices = np.argsort(q_values)[::-1][:top_k].tolist()

        # Convert 0-indexed slots → 1-indexed DB product IDs
        product_ids = [idx + 1 for idx in top_indices]
        return product_ids


# ── Module-level singleton ─────────────────────────────────────────────────────
_engine = _RecommendationEngine()


def get_recommendations(
    interactions: List[dict],
    top_k: int = 5,
    num_db_products: int = NUM_PRODUCTS,
) -> List[int]:
    """
    Public API for the inference engine.

    Args:
        interactions:    List of {'product_id': int, 'action_type': str} dicts,
                         representing the user/session history.
        top_k:           Number of product IDs to return.
        num_db_products: Cap results to this many products (set to DB product count).

    Returns:
        List[int] of recommended product IDs (1-indexed, matching DB).
    """
    return _engine.recommend(interactions, top_k=top_k, num_db_products=num_db_products)
