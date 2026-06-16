"""
Seed script — populates the database with 31 demo products and 2 users.
Run with:  python -m backend.seed
"""
import sys, os
sys.path.append(os.path.dirname(os.path.dirname(__file__)))

from backend.database import SessionLocal, engine, Base
from backend.models import Product, User

Base.metadata.create_all(bind=engine)

PRODUCTS = [
    {"title": "Chronos Elite Watch", "description": "Soft gold accents with a hand-stitched leather strap and automatic movement.", "price": 4950.00, "category": "Luxury Watch", "image_url": "/images/chronos_elite.jpg"},
    {"title": "Aura Headphones", "description": "Sleek over-ear audio with custom acoustic profile and hybrid active noise cancellation.", "price": 850.00, "category": "Premium Audio", "image_url": "/images/aura_headphones.jpg"},
    {"title": "Aria Crossbody", "description": "Handcrafted calfskin leather crossbody bag with structured metal hardware.", "price": 1200.00, "category": "Designer Bags", "image_url": "/images/aria_crossbody.jpg"},
    {"title": "Modern Essential Blazer", "description": "Minimalist double-breasted structured blazer in premium wool blend.", "price": 950.00, "category": "Curated Looks", "image_url": "/images/modern_essential.jpg"},
    {"title": "Voyager Leather Duffle", "description": "Spacious weekender bag crafted from water-resistant pebble-grain leather.", "price": 1650.00, "category": "Designer Bags", "image_url": "/images/voyager_duffle.png"},
    {"title": "Eclipse Sunglasses", "description": "Classic tortoiseshell frame with lightweight polarized Carl Zeiss lenses.", "price": 420.00, "category": "Accessories", "image_url": "/images/eclipse_sunglasses.png"},
    {"title": "Apex Smartwatch", "description": "Sapphire glass screen with brushed titanium frame and real-time heart metrics.", "price": 2499.00, "category": "Luxury Watch", "image_url": "/images/apex_smartwatch.png"},
    {"title": "Sartorial Trench Coat", "description": "Bespoke cotton-gabardine storm coat with signature horn buttons.", "price": 1850.00, "category": "Curated Looks", "image_url": "/images/sartorial_trench.png"},
    {"title": "Quantum Pro Laptop", "description": "Supercharged 16-inch workstation with liquid-cooled chip and premium anodized obsidian finish.", "price": 2499.00, "category": "Electronics", "image_url": "/images/quantum_laptop.png"},
    {"title": "AeroPhone 15 Pro", "description": "Brushed titanium smartphone with high-fidelity triple camera and 120Hz ceramic screen.", "price": 1299.00, "category": "Electronics", "image_url": "/images/aerophone.png"},
    {"title": "Nomad Mechanical Keyboard", "description": "Machined aluminum gasket-mount keyboard with silent linear switches and custom gold keycaps.", "price": 350.00, "category": "Electronics", "image_url": "/images/nomad_keyboard.png"},
    {"title": "Studio Reference Monitor", "description": "Active bi-amplified studio monitor with beryllium dome tweeter and carbon fiber woofer.", "price": 1800.00, "category": "Premium Audio", "image_url": "/images/aura_headphones.jpg"},
    {"title": "Verge Wireless Earbuds", "description": "Ultra-compact true wireless earbuds with custom adaptive audio tuning and secure fit.", "price": 299.00, "category": "Premium Audio", "image_url": "/images/aura_headphones.jpg"},
    {"title": "Stratus Knit Sneakers", "description": "Ultra-breathable recycled knit upper with responsive foam cushioning for all-day comfort.", "price": 220.00, "category": "Footwear", "image_url": "/images/stratus_sneakers.png"},
    {"title": "Sovereign Chelsea Boots", "description": "Italian suede chelsea boots with elastic side panels and durable Goodyear-welted crepe soles.", "price": 650.00, "category": "Footwear", "image_url": "/images/chelsea_boots.png"},
    {"title": "Monarch Leather Loafers", "description": "Polished full-grain leather penny loafers with hand-stitched detailing and padded footbeds.", "price": 480.00, "category": "Footwear", "image_url": "/images/chelsea_boots.png"},
    {"title": "Apex Court High-Tops", "description": "Retro-inspired premium leather high-top sneakers with gold-accented eyelets.", "price": 280.00, "category": "Footwear", "image_url": "/images/stratus_sneakers.png"},
    {"title": "Luxe Cashmere Hoodie", "description": "Knit from 100% Mongolian cashmere with a relaxed fit and gold-tipped drawstrings.", "price": 580.00, "category": "Curated Looks", "image_url": "/images/modern_essential.jpg"},
    {"title": "Savile Row Dinner Suit", "description": "Bespoke double-breasted tux in midnight navy with satin peak lapels.", "price": 2800.00, "category": "Curated Looks", "image_url": "/images/modern_essential.jpg"},
    {"title": "Classic Linen Shirt", "description": "Breathable Italian linen shirt with a tailored fit, perfect for warm coastal evenings.", "price": 180.00, "category": "Curated Looks", "image_url": "/images/modern_essential.jpg"},
    {"title": "Merino Wool Mockneck", "description": "Fine-gauge merino wool sweater with ribbed collar and cuffs, exceptionally soft.", "price": 240.00, "category": "Curated Looks", "image_url": "/images/modern_essential.jpg"},
    {"title": "Park Avenue Leather Jacket", "description": "Buttery soft lambskin leather bomber jacket with custom gold zippers and silk lining.", "price": 1450.00, "category": "Curated Looks", "image_url": "/images/modern_essential.jpg"},
    {"title": "Vanguard Briefcase", "description": "Structured saffiano leather briefcase with padded laptop sleeve and combination lock.", "price": 980.00, "category": "Designer Bags", "image_url": "/images/vanguard_briefcase.png"},
    {"title": "Summit Rolltop Backpack", "description": "Water-resistant canvas backpack with leather straps and solid brass quick-release clips.", "price": 850.00, "category": "Designer Bags", "image_url": "/images/rolltop_backpack.png"},
    {"title": "Metro Leather Cardholder", "description": "Slim pebble-grain leather card wallet with 4 slots and a central bill pocket.", "price": 150.00, "category": "Accessories", "image_url": "/images/vanguard_briefcase.png"},
    {"title": "Submariner Prestige Watch", "description": "Classic diving watch with ceramic bezel, luminous markers, and oystersteel band.", "price": 8500.00, "category": "Luxury Watch", "image_url": "/images/chronos_elite.jpg"},
    {"title": "Grand Tourer Chrono Watch", "description": "Racing-inspired chronograph watch with carbon fiber dial and black rubber racing strap.", "price": 3200.00, "category": "Luxury Watch", "image_url": "/images/chronos_elite.jpg"},
    {"title": "Heritage Dress Watch", "description": "Ultra-thin 18k rose gold dress watch with manual wind and subsecond dial.", "price": 6200.00, "category": "Luxury Watch", "image_url": "/images/chronos_elite.jpg"},
    {"title": "Atlas Brass Cuff", "description": "Minimalist solid brass wrist cuff with hand-engraved geometric telemetry patterns.", "price": 280.00, "category": "Accessories", "image_url": "/images/aria_crossbody.jpg"},
    {"title": "Nomad Wool Scarf", "description": "Over-sized knit scarf in pure extrafine wool with classic fringed borders.", "price": 190.00, "category": "Accessories", "image_url": "/images/modern_essential.jpg"},
    {"title": "Optic Blue-Light Glasses", "description": "Acetate frame glasses with blue-light filtering lenses for digital console sessions.", "price": 240.00, "category": "Accessories", "image_url": "/images/eclipse_sunglasses.png"},
    {"title": "Royal Silk Kurta", "description": "Hand-loomed raw silk Kurta in deep gold with intricate embroidery around the collar.", "price": 380.00, "category": "Curated Looks", "image_url": "/images/royal_silk_kurta.png"},
    {"title": "Sovereign Nehru Jacket", "description": "Bespoke textured Nehru jacket with gold-plated brass buttons, designed to layer over kurtas.", "price": 420.00, "category": "Curated Looks", "image_url": "/images/nehru_jacket.png"},
    {"title": "Heritage Sherwani", "description": "Luxury embroidered Sherwani coat crafted from fine jacquard silk with traditional motifs.", "price": 1250.00, "category": "Curated Looks", "image_url": "/images/royal_silk_kurta.png"}
]

USERS = [
    {"email": "alice@nexcart.io", "hashed_password": "hashed_pw_alice"},
    {"email": "bob@nexcart.io", "hashed_password": "hashed_pw_bob"},
]

def seed():
    db = SessionLocal()
    try:
        # Clear existing tables to prevent key clashes and duplicate entries
        db.query(Product).delete()
        db.query(User).delete()
        db.commit()

        for p in PRODUCTS:
            db.add(Product(**p))
        print(f"Seeded {len(PRODUCTS)} products.")

        for u in USERS:
            db.add(User(**u))
        print(f"Seeded {len(USERS)} users.")

        db.commit()
        print("Database seeding complete.")
    finally:
        db.close()

if __name__ == "__main__":
    seed()

