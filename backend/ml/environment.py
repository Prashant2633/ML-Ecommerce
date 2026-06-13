import torch
import numpy as np

class EcommerceEnvironment:
    """
    Simulated E-commerce Environment for Reinforcement Learning.
    State: User session history (sequence of product categories or embeddings).
    Action: Recommend a product.
    Reward: Based on user interaction (click, cart, purchase).
    """
    def __init__(self, num_products, state_size):
        self.num_products = num_products
        self.state_size = state_size
        self.reset()
        
    def reset(self):
        # Reset session state
        self.state = np.zeros(self.state_size)
        self.session_depth = 0
        return self.state
        
    def step(self, action, user_interaction):
        """
        Takes an action (recommending a product) and receives real user interaction.
        In a real scenario, the interaction comes from telemetry.
        """
        self.session_depth += 1
        
        # Calculate reward
        reward = calculate_reward(user_interaction, self.session_depth)
        
        # Update state (e.g., shift history and append new action context)
        self.state = np.roll(self.state, -1)
        self.state[-1] = action # Simplistic state update
        
        done = user_interaction == 'purchase' or self.session_depth >= 20
        
        return self.state, reward, done, {}

def calculate_reward(interaction_type, session_depth):
    """
    Tuned reward function based on user interaction signals.
    """
    base_rewards = {
        'view': 0.1,
        'click': 1.0,
        'add_to_cart': 5.0,
        'purchase': 20.0
    }
    
    reward = base_rewards.get(interaction_type, 0.0)
    
    # Penalty for deep sessions without conversion (user fatigue)
    fatigue_penalty = 0.05 * session_depth
    
    return max(0.0, reward - fatigue_penalty)
