import torch
import torch.nn as nn
import torch.optim as optim
import random
import numpy as np
from collections import deque

class SARSANetwork(nn.Module):
    def __init__(self, input_dim, output_dim):
        super(SARSANetwork, self).__init__()
        self.fc1 = nn.Linear(input_dim, 128)
        self.fc2 = nn.Linear(128, 128)
        self.fc3 = nn.Linear(128, output_dim)
        
    def forward(self, x):
        x = torch.relu(self.fc1(x))
        x = torch.relu(self.fc2(x))
        return self.fc3(x)

class SARSAAgent:
    def __init__(self, state_size, action_size, lr=0.001, gamma=0.99, epsilon=1.0, epsilon_decay=0.995):
        self.state_size = state_size
        self.action_size = action_size
        self.gamma = gamma
        self.epsilon = epsilon
        self.epsilon_min = 0.01
        self.epsilon_decay = epsilon_decay
        
        self.model = SARSANetwork(state_size, action_size)
        self.optimizer = optim.Adam(self.model.parameters(), lr=lr)
        self.criterion = nn.MSELoss()
        
    def act(self, state):
        if np.random.rand() <= self.epsilon:
            return random.randrange(self.action_size)
        
        state_tensor = torch.FloatTensor(state).unsqueeze(0)
        q_values = self.model(state_tensor)
        return torch.argmax(q_values[0]).item()
        
    def learn(self, state, action, reward, next_state, next_action, done):
        state_tensor = torch.FloatTensor(state).unsqueeze(0)
        next_state_tensor = torch.FloatTensor(next_state).unsqueeze(0)
        
        q_values = self.model(state_tensor)
        next_q_values = self.model(next_state_tensor)
        
        q_value = q_values[0][action]
        next_q_value = next_q_values[0][next_action]
        
        target = reward
        if not done:
            target = reward + self.gamma * next_q_value
            
        loss = self.criterion(q_value, torch.tensor(target))
        
        self.optimizer.zero_grad()
        loss.backward()
        self.optimizer.step()
        
        if self.epsilon > self.epsilon_min:
            self.epsilon *= self.epsilon_decay
