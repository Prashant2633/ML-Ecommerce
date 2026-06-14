"""
ML Trainer — trains Q-Learning, SARSA, and Policy Gradient agents
using interaction logs from the database.

Run with:  python -m backend.ml.trainer
"""
import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.dirname(__file__))))

import numpy as np
from backend.ml.environment import EcommerceEnvironment
from backend.ml.agents.q_learning import QLearningAgent
from backend.ml.agents.sarsa import SARSAAgent
from backend.ml.agents.policy_gradient import PolicyGradientAgent

# ─── Hyperparameters ────────────────────────────────────────────────
NUM_PRODUCTS  = 100      # Action space size
STATE_SIZE    = 10       # Session history depth
EPISODES      = 50
BATCH_SIZE    = 32

# Interaction types used in simulation
INTERACTION_SEQUENCE = ['view', 'click', 'add_to_cart', 'purchase']

def simulate_interaction(episode: int) -> str:
    """Simulates a user interaction signal — weights shift toward
    higher-reward actions as training progresses (curriculum learning)."""
    progress = episode / EPISODES
    weights  = [
        max(0.1, 0.4 - 0.3 * progress),   # view weight decreasing
        max(0.1, 0.4 - 0.2 * progress),   # click
        min(0.4, 0.1 + 0.3 * progress),   # add_to_cart increasing
        min(0.2, 0.0 + 0.2 * progress),   # purchase increasing
    ]
    total = sum(weights)
    weights = [w / total for w in weights]
    return np.random.choice(INTERACTION_SEQUENCE, p=weights)


def train_q_learning(env: EcommerceEnvironment, episodes: int) -> tuple:
    agent  = QLearningAgent(STATE_SIZE, NUM_PRODUCTS)
    rewards_history = []

    for ep in range(episodes):
        state    = env.reset()
        ep_reward = 0.0
        done     = False

        while not done:
            action      = agent.act(state)
            interaction = simulate_interaction(ep)
            next_state, reward, done, _ = env.step(action, interaction)

            agent.remember(state, action, reward, next_state, done)
            agent.replay(BATCH_SIZE)

            state      = next_state
            ep_reward += reward

        rewards_history.append(ep_reward)
        if (ep + 1) % 50 == 0:
            avg = np.mean(rewards_history[-50:])
            print(f"[Q-Learning] Episode {ep+1}/{episodes} | Avg Reward (last 50): {avg:.2f} | epsilon={agent.epsilon:.3f}")

    return rewards_history, agent


def train_sarsa(env: EcommerceEnvironment, episodes: int) -> list:
    agent  = SARSAAgent(STATE_SIZE, NUM_PRODUCTS)
    rewards_history = []

    for ep in range(episodes):
        state    = env.reset()
        action   = agent.act(state)
        ep_reward = 0.0
        done     = False

        while not done:
            interaction = simulate_interaction(ep)
            next_state, reward, done, _ = env.step(action, interaction)
            next_action = agent.act(next_state)

            agent.learn(state, action, reward, next_state, next_action, done)

            state      = next_state
            action     = next_action
            ep_reward += reward

        rewards_history.append(ep_reward)
        if (ep + 1) % 50 == 0:
            avg = np.mean(rewards_history[-50:])
            print(f"[SARSA]      Episode {ep+1}/{episodes} | Avg Reward (last 50): {avg:.2f} | epsilon={agent.epsilon:.3f}")

    return rewards_history


def train_policy_gradient(env: EcommerceEnvironment, episodes: int) -> list:
    agent  = PolicyGradientAgent(STATE_SIZE, NUM_PRODUCTS)
    rewards_history = []

    for ep in range(episodes):
        state    = env.reset()
        ep_reward = 0.0
        done     = False

        while not done:
            action      = agent.act(state)
            interaction = simulate_interaction(ep)
            next_state, reward, done, _ = env.step(action, interaction)

            agent.rewards.append(reward)
            state      = next_state
            ep_reward += reward

        agent.learn()   # REINFORCE update at episode end
        rewards_history.append(ep_reward)

        if (ep + 1) % 50 == 0:
            avg = np.mean(rewards_history[-50:])
            print(f"[Policy-Grad] Episode {ep+1}/{episodes} | Avg Reward (last 50): {avg:.2f}")

    return rewards_history


if __name__ == "__main__":
    print("=" * 60)
    print("  NexCart ML Recommendation Engine - Training")
    print("=" * 60)

    env = EcommerceEnvironment(num_products=NUM_PRODUCTS, state_size=STATE_SIZE)

    print("\n>>> Training Q-Learning Agent...")
    ql_rewards, ql_agent = train_q_learning(env, EPISODES)

    print("\n>>> Training SARSA Agent...")
    sarsa_rewards = train_sarsa(env, EPISODES)

    print("\n>>> Training Policy Gradient Agent...")
    pg_rewards = train_policy_gradient(env, EPISODES)

    print("\n" + "=" * 60)
    print("  Training Complete - Final Avg Rewards (last 100 episodes)")
    print("=" * 60)
    print(f"  Q-Learning:      {np.mean(ql_rewards[-100:]):.2f}")
    print(f"  SARSA:           {np.mean(sarsa_rewards[-100:]):.2f}")
    print(f"  Policy Gradient: {np.mean(pg_rewards[-100:]):.2f}")

    # Save trained Q-Learning agent weights to NumPy compressed format for production deployment
    weights = {
        'w1': ql_agent.model.fc1.weight.data.cpu().numpy().T,
        'b1': ql_agent.model.fc1.bias.data.cpu().numpy(),
        'w2': ql_agent.model.fc2.weight.data.cpu().numpy().T,
        'b2': ql_agent.model.fc2.bias.data.cpu().numpy(),
        'w3': ql_agent.model.fc3.weight.data.cpu().numpy().T,
        'b3': ql_agent.model.fc3.bias.data.cpu().numpy(),
    }
    weights_path = os.path.join(os.path.dirname(__file__), "q_agent_weights.npz")
    np.savez(weights_path, **weights)
    print(f"  Saved trained Q-Learning weights to {weights_path}")
