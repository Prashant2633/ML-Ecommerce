from sqlalchemy import Column, Integer, String, Float, ForeignKey, DateTime, JSON
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from .database import Base

class User(Base):
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True)
    hashed_password = Column(String)
    region_preference = Column(String, nullable=True)
    saved_addresses = Column(JSON, nullable=True)
    saved_payment_methods = Column(JSON, nullable=True)
    wishlist = Column(JSON, nullable=True)
    cart = Column(JSON, nullable=True)
    
    interactions = relationship("InteractionLog", back_populates="user")

class Product(Base):
    __tablename__ = "products"
    
    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, index=True)
    description = Column(String)
    price = Column(Float)
    image_url = Column(String)
    category = Column(String, index=True)
    rating = Column(Float, default=5.0)
    review_count = Column(Integer, default=0)
    availability = Column(JSON, nullable=True)

class Order(Base):
    __tablename__ = "orders"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    order_number = Column(String, unique=True, index=True)
    region_code = Column(String)
    items = Column(JSON)  # list of items: [{product_id, title, price, quantity, size}]
    subtotal = Column(Float)
    tax = Column(Float)
    shipping_cost = Column(Float)
    total = Column(Float)
    shipping_address = Column(JSON)  # {name, email, address, city, state, zip_code}
    payment_method = Column(String)
    status = Column(String, default="Completed")
    created_at = Column(DateTime(timezone=True), server_default=func.now())

class InteractionLog(Base):
    """
    Records telemetry of user behaviour to train the RL agent.
    action_type can be: 'view', 'click', 'add_to_cart', 'purchase'
    """
    __tablename__ = "interaction_logs"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    product_id = Column(Integer, ForeignKey("products.id"))
    action_type = Column(String, index=True)
    session_id = Column(String, index=True)
    timestamp = Column(DateTime(timezone=True), server_default=func.now())
    
    user = relationship("User", back_populates="interactions")
