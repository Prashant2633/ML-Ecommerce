"""
Unit tests for the RL agents.
Run with: pytest backend/tests/test_agents.py -v
"""
import pytest
import numpy as np
from backend.ml.environment import EcommerceEnvironment, calculate_reward
from backend.ml.agents.q_learning import QLearningAgent
from backend.ml.agents.sarsa import SARSAAgent
from backend.ml.agents.policy_gradient import PolicyGradientAgent

STATE_SIZE   = 10
NUM_PRODUCTS = 20


# ── Reward Function ────────────────────────────────────────────────────────────

def test_reward_hierarchy():
    """Purchase should always yield more reward than a click."""
    assert calculate_reward('purchase', 1) > calculate_reward('click', 1)
    assert calculate_reward('click', 1)    > calculate_reward('view', 1)

def test_reward_fatigue_penalty():
    """Deep sessions without conversion should reduce reward."""
    early = calculate_reward('click', 1)
    late  = calculate_reward('click', 18)
    assert early > late

def test_reward_floor():
    """Reward should never go negative."""
    assert calculate_reward('view', 100) >= 0.0


# ── Environment ───────────────────────────────────────────────────────────────

def test_env_reset():
    env   = EcommerceEnvironment(NUM_PRODUCTS, STATE_SIZE)
    state = env.reset()
    assert state.shape == (STATE_SIZE,)
    assert np.all(state == 0)

def test_env_step_returns_correct_shape():
    env   = EcommerceEnvironment(NUM_PRODUCTS, STATE_SIZE)
    state = env.reset()
    next_state, reward, done, _ = env.step(0, 'click')
    assert next_state.shape == (STATE_SIZE,)
    assert isinstance(reward, float)
    assert isinstance(done, bool)

def test_env_done_on_purchase():
    env = EcommerceEnvironment(NUM_PRODUCTS, STATE_SIZE)
    env.reset()
    _, _, done, _ = env.step(0, 'purchase')
    assert done is True


# ── Q-Learning Agent ──────────────────────────────────────────────────────────

def test_q_agent_action_in_range():
    agent  = QLearningAgent(STATE_SIZE, NUM_PRODUCTS)
    state  = np.zeros(STATE_SIZE)
    action = agent.act(state)
    assert 0 <= action < NUM_PRODUCTS

def test_q_agent_epsilon_decays():
    agent = QLearningAgent(STATE_SIZE, NUM_PRODUCTS, epsilon=1.0)
    state = np.zeros(STATE_SIZE)
    agent.remember(state, 0, 1.0, state, False)
    agent.replay(1)
    assert agent.epsilon < 1.0


# ── SARSA Agent ───────────────────────────────────────────────────────────────

def test_sarsa_action_in_range():
    agent  = SARSAAgent(STATE_SIZE, NUM_PRODUCTS)
    state  = np.zeros(STATE_SIZE)
    action = agent.act(state)
    assert 0 <= action < NUM_PRODUCTS


# ── Policy Gradient Agent ─────────────────────────────────────────────────────

def test_pg_action_in_range():
    agent  = PolicyGradientAgent(STATE_SIZE, NUM_PRODUCTS)
    state  = np.zeros(STATE_SIZE)
    action = agent.act(state)
    assert 0 <= action < NUM_PRODUCTS

def test_pg_learn_clears_buffers():
    agent  = PolicyGradientAgent(STATE_SIZE, NUM_PRODUCTS)
    state  = np.zeros(STATE_SIZE)
    agent.act(state)
    agent.rewards.append(1.0)
    agent.learn()
    assert len(agent.saved_log_probs) == 0
    assert len(agent.rewards) == 0
