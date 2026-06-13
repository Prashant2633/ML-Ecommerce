"""
ML Inference Module — serves real-time recommendations from the trained RL agents.

The module maintains a singleton QLearningAgent (fastest for synchronous inference).
On startup it initialises with random weights; in production you would load a
checkpoint saved by trainer.py (torch.save / torch.load).

Usage (inside a FastAPI route):
    from ..ml.inference import get_recommendations
    product_ids = get_recommendations(user_interactions, num_products=8, top_k=5)
"""

import numpy as np
import torch
from typing import List

from .agents.q_learning import QLearningAgent

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


class _RecommendationEngine:
    """
    Singleton wrapper around QLearningAgent.
    Keeps the model loaded in memory between requests.
    """

    def __init__(self):
        self._agent: QLearningAgent | None = None

    def _get_agent(self) -> QLearningAgent:
        """Lazy-initialise the agent on first call (avoids import-time GPU work)."""
        if self._agent is None:
            self._agent = QLearningAgent(
                state_size=STATE_SIZE,
                action_size=NUM_PRODUCTS,
                epsilon=0.0,          # Pure exploitation during inference
                epsilon_decay=1.0,    # Never decay during serving
            )
            # ── Optional: load pre-trained weights ───────────────────────────
            # import os
            # ckpt = os.path.join(os.path.dirname(__file__), "checkpoints", "q_agent.pt")
            # if os.path.exists(ckpt):
            #     self._agent.model.load_state_dict(torch.load(ckpt, map_location="cpu"))
            #     self._agent.model.eval()
        return self._agent

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
        agent = self._get_agent()
        state = self.build_state(interactions)

        state_tensor = torch.FloatTensor(state).unsqueeze(0)

        with torch.no_grad():
            q_values: torch.Tensor = agent.model(state_tensor)[0]

        # Clamp to the actual number of products in the DB
        effective_actions = min(num_db_products, NUM_PRODUCTS)
        q_values = q_values[:effective_actions]

        # Get top-k action indices (0-indexed product slots)
        top_k = min(top_k, effective_actions)
        top_indices = torch.topk(q_values, k=top_k).indices.tolist()

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
