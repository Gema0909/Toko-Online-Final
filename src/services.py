# src/services.py
from datetime import datetime
from src.repositories import Repository
from src.models import Product, User, Order

repo = Repository()

class CommerceService:
    def login(self, username, password):
        user = repo.get_user_by_username(username)
        if user and user['password'] == password:
            return user
        return None

    def register_user(self, username, password, address=''):
        if repo.get_user_by_username(username):
            return {"status": "error", "message": "Username sudah terdaftar!"}
        
        users = repo.get_all_users()
        new_id = (max(u['id'] for u in users) + 1) if users else 1
        
        new_user = User(new_id, username, password, role='customer', address=address)
        repo.add_user(new_user.to_dict())
        return {"status": "success", "message": "Pendaftaran berhasil! Silakan login."}

    def get_catalog(self):
        return repo.get_all_products()

    def checkout_cart(self, user_id, cart_items, shipping_address, payment_method, payment_proof):
        """
        cart_items format: [{"product_id": 101, "quantity": 2}, ...]
        """
        if not cart_items:
            return {"status": "error", "message": "Keranjang belanja Anda kosong!"}

        verified_items = []
        total_amount = 0

        # Validasi ketersediaan stok produk sebelum membuat pesanan
        for item in cart_items:
            p = repo.get_product_by_id(item['product_id'])
            if not p:
                return {"status": "error", "message": "Salah satu produk tidak ditemukan!"}
            if p['stock'] < item['quantity']:
                return {"status": "error", "message": f"Stok produk '{p['name']}' tidak mencukupi!"}
            
            subtotal = p['price'] * item['quantity']
            total_amount += subtotal
            verified_items.append({
                "product_id": p['id'],
                "name": p['name'],
                "quantity": item['quantity'],
                "price": p['price'],
                "subtotal": subtotal
            })

        # Update kurangi stok produk yang sah dibeli
        for item in cart_items:
            p = repo.get_product_by_id(item['product_id'])
            p['stock'] -= item['quantity']
            repo.update_product(p['id'], p)

        # Generate pesanan baru
        orders = repo.get_all_orders()
        new_order_id = (max(o['id'] for o in orders) + 1) if orders else 10001

        new_order = Order(
            id=new_order_id,
            user_id=user_id,
            items=verified_items,
            total_amount=total_amount,
            status='Pending',
            address=shipping_address,
            date=datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
            payment_method=payment_method,
            payment_status="Menunggu Verifikasi" if payment_method != "COD" else "Belum Dibayar",
            payment_proof=payment_proof
        )

        repo.add_order(new_order.to_dict())
        return {"status": "success", "message": "Pesanan Anda berhasil dibuat!", "order_id": new_order_id}

    def get_user_orders(self, user_id):
        return repo.get_orders_by_user(user_id)

    def get_admin_orders(self):
        return repo.get_all_orders()

    def update_status_pesanan(self, order_id, status):
        return repo.update_order_status(order_id, status)
    
    def verify_payment(self, order_id):
        return repo.verify_payment(order_id)
    
    def reject_payment(self, order_id):
        return repo.reject_payment(order_id)

    # --- METODE ADMIN KELOLA BARANG TOKO ---
    def add_new_product(self, name, price, stock, category, description, image):
        products = repo.get_all_products()
        new_id = (max(p['id'] for p in products) + 1) if products else 101
        product = Product(new_id, name, int(price), int(stock), category, description, image)
        repo.add_product(product.to_dict())

    def edit_product(self, product_id, name, price, stock, category, description, image):
        p = repo.get_product_by_id(product_id)
        if p:
            p['name'] = name
            p['price'] = int(price)
            p['stock'] = int(stock)
            p['category'] = category
            p['description'] = description

            # Jika ada gambar baru, update
            if image:
                p['image'] = image

            repo.update_product(product_id, p)

    def delete_product(self, product_id):
        return repo.delete_product(product_id)