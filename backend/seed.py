"""
Seed script — populates the database with 8 demo products and 2 users.
Run with:  python -m backend.seed
"""
import sys, os
sys.path.append(os.path.dirname(os.path.dirname(__file__)))

from backend.database import SessionLocal, engine, Base
from backend.models import Product, User

Base.metadata.create_all(bind=engine)

PRODUCTS = [
    {"title": "Sony WH-1000XM5 Headphones",    "description": "Industry-leading noise cancellation, 30-hour battery.", "price": 349.99, "category": "Electronics",     "image_url": ""},
    {"title": "Apple MacBook Air M3",            "description": "Supercharged by M3 chip with 18-hour battery.",          "price": 1299.0, "category": "Computers",       "image_url": ""},
    {"title": "Nike Air Max 270",                "description": "Engineered mesh with Air Max cushioning.",               "price": 149.99, "category": "Footwear",        "image_url": ""},
    {"title": "Samsung 4K OLED Smart TV 55\"",  "description": "Quantum HDR OLED with AI-powered upscaling.",            "price": 1499.99,"category": "Electronics",     "image_url": ""},
    {"title": "Kindle Paperwhite Signature",     "description": "6.8\" display with warm light and wireless charging.",   "price": 189.99, "category": "Books & Reading", "image_url": ""},
    {"title": "Dyson V15 Detect Vacuum",         "description": "Laser reveals invisible dust with particle counts.",     "price": 749.99, "category": "Home Appliances", "image_url": ""},
    {"title": "Levi's 501 Original Jeans",       "description": "The original straight leg fit since 1873.",             "price": 69.99,  "category": "Clothing",        "image_url": ""},
    {"title": "Instant Pot Duo 7-in-1",          "description": "Pressure cooker, slow cooker, rice cooker and more.",   "price": 99.99,  "category": "Kitchen",         "image_url": ""},
]

USERS = [
    {"email": "alice@nexcart.io", "hashed_password": "hashed_pw_alice"},
    {"email": "bob@nexcart.io",   "hashed_password": "hashed_pw_bob"},
]

def seed():
    db = SessionLocal()
    try:
        if db.query(Product).count() == 0:
            for p in PRODUCTS:
                db.add(Product(**p))
            print(f"Seeded {len(PRODUCTS)} products.")

        if db.query(User).count() == 0:
            for u in USERS:
                db.add(User(**u))
            print(f"Seeded {len(USERS)} users.")

        db.commit()
        print("Database seeding complete.")
    finally:
        db.close()

if __name__ == "__main__":
    seed()
