"""
Seed script — populates the database with 58 demo products and 2 users.
Downloads unique high-quality public domain images from Unsplash to ensure
every product has a distinct visual preview.
Run with:  python -m backend.seed
"""
import sys
import os
import urllib.request

sys.path.append(os.path.dirname(os.path.dirname(__file__)))

from backend.database import SessionLocal, engine, Base
from backend.models import Product, User

# Ensure tables are created
Base.metadata.create_all(bind=engine)

# Map image filenames to their respective Unsplash photo IDs
UNSPLASH_MAP = {
    # Premium Audio
    "studio_monitor.png": "photo-1545048702-79362596cdc9",
    "verge_earbuds.png": "photo-1590658268037-6bf12165a8df",
    # Footwear
    "monarch_loafers.png": "photo-1533867617858-e7b97e060509",
    "court_hightops.png": "photo-1549298916-b41d501d3772",
    "running_shoes.png": "photo-1542291026-7eec264c27ff",
    "cozy_slippers.png": "photo-1608228088998-57828365d486",
    # Apparel
    "cashmere_hoodie.png": "photo-1556821840-3a63f95609a7",
    "dinner_suit.png": "photo-1593032465175-481ac7f401a0",
    "linen_shirt.png": "photo-1596755094514-f87e34085b2c",
    "merino_mockneck.png": "photo-1614975058789-41316d0e2e9c",
    "leather_jacket.png": "photo-1551028719-00167b16eac5",
    "heritage_sherwani.png": "photo-1610030469983-98e550d6193c",
    "printed_kurti.png": "photo-1608748010899-18f300247112",
    "silk_kurti.png": "photo-1617627143750-d86bc21e42bb",
    "cotton_pyjamas.png": "photo-1562157873-818bc0726f68",
    "satin_pajamas.png": "photo-1608228088998-57828365d486",
    # Accessories
    "leather_cardholder.png": "photo-1622560480605-d83c853bc5c3",
    "brass_cuff.png": "photo-1611591437281-460bfbe1220a",
    "wool_scarf.png": "photo-1607604276583-eef5d076aa5f",
    "blue_light_glasses.png": "photo-1572635196237-14b3f281503f",
    "leather_belt.png": "photo-1614162692292-7ac56d7f7f1e",
    "silk_necktie.png": "photo-1598033129183-c4f50c736f10",
    # Watches
    "submariner_watch.png": "photo-1547996160-81dfa63595aa",
    "grand_tourer_watch.png": "photo-1522312346375-d1a52e2b99b3",
    "heritage_dress_watch.png": "photo-1524805444758-089113d48a6d",
    # Electronics
    "wireless_charger.png": "photo-1583863788434-e58a36330cf0",
    "power_bank.png": "photo-1609081219090-a6d81d3085bf",
    # Home & Kitchen
    "chef_knife.png": "photo-1599940824399-b87987ceb72a",
    "knife_set.png": "photo-1509440159596-0249088772ff",
    "espresso_machine.png": "photo-1517701604599-bb29b565090c",
    "blender.png": "photo-1578643463396-0997cb5328c1",
    "air_fryer.png": "photo-1621972750749-0fbb1abb7736",
    "water_bottle.png": "photo-1602143407151-7111542de6e8",
    "ceramic_mug.png": "photo-1514228742587-6b1558fcca3d",
    "scented_candle.png": "photo-1603006905003-be475563bc59",
    # Fitness & Outdoors
    "yoga_mat.png": "photo-1592432678016-e910b452f9a2",
    "dumbbells.png": "photo-1638536532686-d610adfc8e5c",
    "resistance_bands.png": "photo-1517838277536-f5f99be501cd",
    "camping_tent.png": "photo-1504280390367-361c6d9f38f4",
    "office_chair.png": "photo-1505797149-43b0069ec26b",
    "desk_lamp.png": "photo-1507473885765-e6ed057f782c",
}

def ensure_images_downloaded():
    """Downloads all missing Unsplash images into frontend/public/images/."""
    target_dir = os.path.join(os.path.dirname(os.path.dirname(__file__)), "frontend", "public", "images")
    os.makedirs(target_dir, exist_ok=True)
    
    print("Verifying product image assets...")
    for filename, photo_id in UNSPLASH_MAP.items():
        filepath = os.path.join(target_dir, filename)
        if os.path.exists(filepath):
            continue
            
        url = f"https://images.unsplash.com/{photo_id}?auto=format&fit=crop&w=600&h=600&q=80"
        print(f"Downloading {filename} from Unsplash...")
        try:
            req = urllib.request.Request(
                url, 
                headers={'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AntigravityAgent/1.0'}
            )
            with urllib.request.urlopen(req, timeout=15) as response:
                with open(filepath, "wb") as f:
                    f.write(response.read())
            print(f"Successfully saved {filename}.")
        except Exception as e:
            print(f"Warning: Could not download {filename} from Unsplash: {e}")

PRODUCTS = [
    # 1. Luxury Watch
    {"title": "Chronos Elite Watch", "description": "Soft gold accents with a hand-stitched leather strap and automatic movement.", "price": 4950.00, "category": "Luxury Watch", "image_url": "/images/chronos_elite.jpg"},
    {"title": "Apex Smartwatch", "description": "Sapphire glass screen with brushed titanium frame and real-time heart metrics.", "price": 2499.00, "category": "Luxury Watch", "image_url": "/images/apex_smartwatch.png"},
    {"title": "Submariner Prestige Watch", "description": "Classic diving watch with ceramic bezel, luminous markers, and oystersteel band.", "price": 8500.00, "category": "Luxury Watch", "image_url": "/images/submariner_watch.png"},
    {"title": "Grand Tourer Chrono Watch", "description": "Racing-inspired chronograph watch with carbon fiber dial and black rubber racing strap.", "price": 3200.00, "category": "Luxury Watch", "image_url": "/images/grand_tourer_watch.png"},
    {"title": "Heritage Dress Watch", "description": "Ultra-thin 18k rose gold dress watch with manual wind and subsecond dial.", "price": 6200.00, "category": "Luxury Watch", "image_url": "/images/heritage_dress_watch.png"},

    # 2. Premium Audio
    {"title": "Aura Headphones", "description": "Sleek over-ear audio with custom acoustic profile and hybrid active noise cancellation.", "price": 850.00, "category": "Premium Audio", "image_url": "/images/aura_headphones.jpg"},
    {"title": "Studio Reference Monitor", "description": "Active bi-amplified studio monitor with beryllium dome tweeter and carbon fiber woofer.", "price": 1800.00, "category": "Premium Audio", "image_url": "/images/studio_monitor.png"},
    {"title": "Verge Wireless Earbuds", "description": "Ultra-compact true wireless earbuds with custom adaptive audio tuning and secure fit.", "price": 299.00, "category": "Premium Audio", "image_url": "/images/verge_earbuds.png"},

    # 3. Designer Bags
    {"title": "Aria Crossbody", "description": "Handcrafted calfskin leather crossbody bag with structured metal hardware.", "price": 1200.00, "category": "Designer Bags", "image_url": "/images/aria_crossbody.jpg"},
    {"title": "Voyager Leather Duffle", "description": "Spacious weekender bag crafted from water-resistant pebble-grain leather.", "price": 1650.00, "category": "Designer Bags", "image_url": "/images/voyager_duffle.png"},
    {"title": "Vanguard Briefcase", "description": "Structured saffiano leather briefcase with padded laptop sleeve and combination lock.", "price": 980.00, "category": "Designer Bags", "image_url": "/images/vanguard_briefcase.png"},
    {"title": "Summit Rolltop Backpack", "description": "Water-resistant canvas backpack with leather straps and solid brass quick-release clips.", "price": 850.00, "category": "Designer Bags", "image_url": "/images/rolltop_backpack.png"},

    # 4. Apparel
    {"title": "Modern Essential Blazer", "description": "Minimalist double-breasted structured blazer in premium wool blend.", "price": 950.00, "category": "Apparel", "image_url": "/images/modern_essential.jpg"},
    {"title": "Sartorial Trench Coat", "description": "Bespoke cotton-gabardine storm coat with signature horn buttons.", "price": 1850.00, "category": "Apparel", "image_url": "/images/sartorial_trench.png"},
    {"title": "Luxe Cashmere Hoodie", "description": "Knit from 100% Mongolian cashmere with a relaxed fit and gold-tipped drawstrings.", "price": 580.00, "category": "Apparel", "image_url": "/images/cashmere_hoodie.png"},
    {"title": "Savile Row Dinner Suit", "description": "Bespoke double-breasted tux in midnight navy with satin peak lapels.", "price": 2800.00, "category": "Apparel", "image_url": "/images/dinner_suit.png"},
    {"title": "Classic Linen Shirt", "description": "Breathable Italian linen shirt with a tailored fit, perfect for warm coastal evenings.", "price": 180.00, "category": "Apparel", "image_url": "/images/linen_shirt.png"},
    {"title": "Merino Wool Mockneck", "description": "Fine-gauge merino wool sweater with ribbed collar and cuffs, exceptionally soft.", "price": 240.00, "category": "Apparel", "image_url": "/images/merino_mockneck.png"},
    {"title": "Park Avenue Leather Jacket", "description": "Buttery soft lambskin leather bomber jacket with custom gold zippers and silk lining.", "price": 1450.00, "category": "Apparel", "image_url": "/images/leather_jacket.png"},
    {"title": "Royal Silk Kurta", "description": "Hand-loomed raw silk Kurta in deep gold with intricate embroidery around the collar.", "price": 380.00, "category": "Apparel", "image_url": "/images/royal_silk_kurta.png"},
    {"title": "Sovereign Nehru Jacket", "description": "Bespoke textured Nehru jacket with gold-plated brass buttons, designed to layer over kurtas.", "price": 420.00, "category": "Apparel", "image_url": "/images/nehru_jacket.png"},
    {"title": "Heritage Sherwani", "description": "Luxury embroidered Sherwani coat crafted from fine jacquard silk with traditional motifs.", "price": 1250.00, "category": "Apparel", "image_url": "/images/heritage_sherwani.png"},
    {"title": "Traditional Printed Kurti", "description": "Charming cotton A-line Kurti with block print motifs, perfect for casual style.", "price": 140.00, "category": "Apparel", "image_url": "/images/printed_kurti.png"},
    {"title": "Designer Silk Kurti", "description": "Flowy pure silk Kurti with delicate zari embroidery, ideal for festive evenings.", "price": 280.00, "category": "Apparel", "image_url": "/images/silk_kurti.png"},
    {"title": "Classic Cotton Pyjamas", "description": "Super-breathable lightweight cotton pajama set with checkered print.", "price": 95.00, "category": "Apparel", "image_url": "/images/cotton_pyjamas.png"},
    {"title": "Satin Pajama Set", "description": "Silk-smooth satin pajama top and pants set with contrast piping trim.", "price": 160.00, "category": "Apparel", "image_url": "/images/satin_pajamas.png"},

    # 5. Accessories
    {"title": "Eclipse Sunglasses", "description": "Classic tortoiseshell frame with lightweight polarized Carl Zeiss lenses.", "price": 420.00, "category": "Accessories", "image_url": "/images/eclipse_sunglasses.png"},
    {"title": "Metro Leather Cardholder", "description": "Slim pebble-grain leather card wallet with 4 slots and a central bill pocket.", "price": 150.00, "category": "Accessories", "image_url": "/images/leather_cardholder.png"},
    {"title": "Atlas Brass Cuff", "description": "Minimalist solid brass wrist cuff with hand-engraved geometric telemetry patterns.", "price": 280.00, "category": "Accessories", "image_url": "/images/brass_cuff.png"},
    {"title": "Nomad Wool Scarf", "description": "Over-sized knit scarf in pure extrafine wool with classic fringed borders.", "price": 190.00, "category": "Accessories", "image_url": "/images/wool_scarf.png"},
    {"title": "Optic Blue-Light Glasses", "description": "Acetate frame glasses with blue-light filtering lenses for digital console sessions.", "price": 240.00, "category": "Accessories", "image_url": "/images/blue_light_glasses.png"},
    {"title": "Classic Leather Belt", "description": "Genuine full-grain leather belt with solid brass buckle, hand-finished edges.", "price": 120.00, "category": "Accessories", "image_url": "/images/leather_belt.png"},
    {"title": "Premium Silk Necktie", "description": "Hand-stitched heavy silk jacquard necktie, classic width with refined texture.", "price": 95.00, "category": "Accessories", "image_url": "/images/silk_necktie.png"},

    # 6. Electronics
    {"title": "Quantum Pro Laptop", "description": "Supercharged 16-inch workstation with liquid-cooled chip and premium anodized obsidian finish.", "price": 2499.00, "category": "Electronics", "image_url": "/images/quantum_laptop.png"},
    {"title": "AeroPhone 15 Pro", "description": "Brushed titanium smartphone with high-fidelity triple camera and 120Hz ceramic screen.", "price": 1299.00, "category": "Electronics", "image_url": "/images/aerophone.png"},
    {"title": "Nomad Mechanical Keyboard", "description": "Machined aluminum gasket-mount keyboard with silent linear switches and custom gold keycaps.", "price": 350.00, "category": "Electronics", "image_url": "/images/nomad_keyboard.png"},
    {"title": "Dual Wireless Charging Stand", "description": "Fast-charging qi-compatible dual device stand with soft-touch leather backing.", "price": 89.00, "category": "Electronics", "image_url": "/images/wireless_charger.png"},
    {"title": "Ultra-Compact Power Bank", "description": "Pocket-sized 20,000mAh external battery pack with dual USB-C power delivery ports.", "price": 59.00, "category": "Electronics", "image_url": "/images/power_bank.png"},

    # 7. Footwear
    {"title": "Stratus Knit Sneakers", "description": "Ultra-breathable recycled knit upper with responsive foam cushioning for all-day comfort.", "price": 220.00, "category": "Footwear", "image_url": "/images/stratus_sneakers.png"},
    {"title": "Sovereign Chelsea Boots", "description": "Italian suede chelsea boots with elastic side panels and durable Goodyear-welted crepe soles.", "price": 650.00, "category": "Footwear", "image_url": "/images/chelsea_boots.png"},
    {"title": "Monarch Leather Loafers", "description": "Polished full-grain leather penny loafers with hand-stitched detailing and padded footbeds.", "price": 480.00, "category": "Footwear", "image_url": "/images/monarch_loafers.png"},
    {"title": "Apex Court High-Tops", "description": "Retro-inspired premium leather high-top sneakers with gold-accented eyelets.", "price": 280.00, "category": "Footwear", "image_url": "/images/court_hightops.png"},
    {"title": "Resilient Running Shoes", "description": "High-performance running shoes with breathable mesh and shock-absorbent gel sole.", "price": 160.00, "category": "Footwear", "image_url": "/images/running_shoes.png"},
    {"title": "Memory Foam Cozy Slippers", "description": "Luxuriously soft fleece slippers with memory foam insoles for indoor comfort.", "price": 45.00, "category": "Footwear", "image_url": "/images/cozy_slippers.png"},

    # 8. Home & Kitchen
    {"title": "Professional Chef Knife", "description": "Forged high-carbon steel 8-inch chef's knife, balanced bolster, and ergonomic rosewood handle.", "price": 180.00, "category": "Home & Kitchen", "image_url": "/images/chef_knife.png"},
    {"title": "Precision Carving Knife Set", "description": "Professional 3-piece stainless steel carving set including utility knife, slicer, and meat fork.", "price": 299.00, "category": "Home & Kitchen", "image_url": "/images/knife_set.png"},
    {"title": "Artisan Espresso Machine", "description": "High-pressure pump espresso maker with integrated steam wand for barista-quality drinks.", "price": 899.00, "category": "Home & Kitchen", "image_url": "/images/espresso_machine.png"},
    {"title": "High-Speed Food Blender", "description": "Heavy-duty 1200W blender with stainless steel blades, variable speeds, and travel jars.", "price": 149.00, "category": "Home & Kitchen", "image_url": "/images/blender.png"},
    {"title": "Compact Digital Air Fryer", "description": "Rapid air circulation technology with easy-to-use digital touchscreen, nonstick basket.", "price": 129.00, "category": "Home & Kitchen", "image_url": "/images/air_fryer.png"},
    {"title": "Double-Walled Smart Bottle", "description": "Vacuum-insulated stainless steel flask with LCD temperature display cap.", "price": 49.00, "category": "Home & Kitchen", "image_url": "/images/water_bottle.png"},
    {"title": "Handcrafted Ceramic Mug", "description": "Artisanal stoneware coffee mug with unique reactive glaze, comfortably sized handle.", "price": 35.00, "category": "Home & Kitchen", "image_url": "/images/ceramic_mug.png"},
    {"title": "Aromatic Soy Scented Candle", "description": "Clean-burning soy wax candle in frosted glass jar, scented with natural cedarwood oil.", "price": 28.00, "category": "Home & Kitchen", "image_url": "/images/scented_candle.png"},

    # 9. Fitness & Outdoors
    {"title": "Non-Slip Alignment Yoga Mat", "description": "Eco-friendly natural rubber yoga mat with laser-etched posture alignment guidelines.", "price": 68.00, "category": "Fitness & Outdoors", "image_url": "/images/yoga_mat.png"},
    {"title": "Adjustable Dumbbell Set", "description": "Space-saving dumbbell system, adjustable from 5 to 50 lbs with quick turn dial.", "price": 349.00, "category": "Fitness & Outdoors", "image_url": "/images/dumbbells.png"},
    {"title": "High-Resistance Bands Kit", "description": "Set of 5 heavy-duty latex loop bands with dynamic resistance weights, carry pouch.", "price": 39.00, "category": "Fitness & Outdoors", "image_url": "/images/resistance_bands.png"},
    {"title": "4-Person Waterproof Camping Tent", "description": "Double-layer outdoor dome tent with weather protection rainfly and ventilated windows.", "price": 249.00, "category": "Fitness & Outdoors", "image_url": "/images/camping_tent.png"},
    {"title": "Ergonomic Office Chair", "description": "High-back mesh desk chair with adjustable lumbar support, headrest, and 3D armrests.", "price": 499.00, "category": "Fitness & Outdoors", "image_url": "/images/office_chair.png"},
    {"title": "Minimalist LED Desk Lamp", "description": "Sleek eye-caring aluminum desk lamp with dimmable modes and built-in USB ports.", "price": 79.00, "category": "Fitness & Outdoors", "image_url": "/images/desk_lamp.png"}
]

USERS = [
    {"email": "alice@nexcart.io", "hashed_password": "hashed_pw_alice"},
    {"email": "bob@nexcart.io", "hashed_password": "hashed_pw_bob"},
]

def seed():
    # Make sure missing images are downloaded first
    ensure_images_downloaded()
    
    db = SessionLocal()
    try:
        # Clear existing tables to prevent key clashes and duplicate entries
        db.query(Product).delete()
        db.query(User).delete()
        db.commit()

        for idx, p in enumerate(PRODUCTS):
            # Dynamic ID generation for consistency with frontend
            p_id = idx + 1
            p_avail = {
                "US": { "available": True, "stock": 15 + (len(p["title"]) % 10), "priceOverride": None, "shippingDays": 3 },
                "IN": { "available": True, "stock": 5 + (len(p["title"]) % 5), "priceOverride": None, "shippingDays": 5 },
                "GB": { "available": True, "stock": 8 + (len(p["title"]) % 8), "priceOverride": None, "shippingDays": 4 },
                "AE": { "available": True, "stock": 12 + (len(p["title"]) % 7), "priceOverride": None, "shippingDays": 2 },
                "DE": { "available": True, "stock": 10 + (len(p["title"]) % 6), "priceOverride": None, "shippingDays": 3 }
            }

            # Local overrides to match frontend precisely
            if p["title"] == "Chronos Elite Watch":
                p_avail["US"]["stock"] = 0
            elif p["title"] == "Aura Headphones":
                p_avail["IN"]["stock"] = 0
            elif p["title"] == "Royal Silk Kurta":
                p_avail["GB"]["available"] = False
                p_avail["DE"]["available"] = False
            elif p["title"] == "Quantum Pro Laptop":
                p_avail["AE"]["available"] = False
            elif p["title"] == "AeroPhone 15 Pro":
                p_avail["IN"]["priceOverride"] = 109900
                p_avail["AE"]["priceOverride"] = 4799

            p_rating = round(4.2 + (len(p["title"]) % 8) * 0.1, 1)
            p_review_count = 12 + (len(p["title"]) * 5) % 180
            mock_reviews = [
                {
                    "name": "Alexander Mercer",
                    "rating": 5,
                    "comment": f"Absolutely stunning {p['title']}. Exceeded all of my expectations! Built quality is incredible.",
                    "date": "June 14, 2026"
                },
                {
                    "name": "Sophia Chen",
                    "rating": 4,
                    "comment": f"Very good quality and fits my preferences. The shipping was incredibly fast, arrived within a few days.",
                    "date": "June 09, 2026"
                }
            ]

            p_data = p.copy()
            p_data["id"] = p_id
            p_data["availability"] = p_avail
            p_data["rating"] = p_rating
            p_data["review_count"] = p_review_count
            p_data["reviews"] = mock_reviews
            db.add(Product(**p_data))
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
