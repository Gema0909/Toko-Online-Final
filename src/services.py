# src/services.py
from src.repositories import Repository
import datetime

class CommerceService:
    def __init__(self):
        self.repo = Repository()

    # --- KELOLA USER (AUTENTIKASI) ---
    def login(self, username, password):
        user = self.repo.get_user_by_username(username)
        # Jika user ditemukan dan password cocok
        if user and user['password'] == password:
            return user
        return None

    def register_user(self, username, password, address):
        # Cek apakah username sudah ada
        existing_user = self.repo.get_user_by_username(username)
        if existing_user:
            return {"status": "error", "message": "Username sudah terdaftar! Silakan gunakan yang lain."}
        
        # Tambahkan user baru (default role 'user')
        user_dict = {
            "username": username,
            "password": password,
            "role": "user",
            "address": address
        }
        self.repo.add_user(user_dict)
        return {"status": "success", "message": "Registrasi berhasil! Silakan login."}


    # --- KELOLA PRODUK (KATALOG) ---
    def get_catalog(self):
        return self.repo.get_all_products()

    def add_new_product(self, name, price, stock, category, description, filename):
        product_dict = {
            "name": name,
            "price": int(price),
            "stock": int(stock),
            "category": category,
            "description": description,
            "image": filename
        }
        self.repo.add_product(product_dict)

    def edit_product(self, product_id, name, price, stock, category, description, filename):
        # Ambil data produk lama
        existing_product = self.repo.get_product_by_id(product_id)
        if not existing_product:
            return
            
        # Jika admin tidak mengunggah gambar baru (filename kosong/None), gunakan gambar lama
        image_to_use = filename if filename else existing_product['image']
        
        updated_data = {
            "name": name,
            "price": int(price),
            "stock": int(stock),
            "category": category,
            "description": description,
            "image": image_to_use
        }
        self.repo.update_product(product_id, updated_data)

    def delete_product(self, product_id):
        self.repo.delete_product(product_id)


    # --- KELOLA TRANSAKSI / PESANAN ---
    def checkout_cart(self, user_id, cart, address, payment_method, filename):
        if not cart or len(cart) == 0:
            return {"status": "error", "message": "Keranjang belanja kosong."}

        # Hitung total harga
        total_amount = 0
        for item in cart:
            product = self.repo.get_product_by_id(item['product_id'])
            if product:
                total_amount += (product['price'] * item['quantity'])

        # Susun data pesanan
        order_dict = {
            "user_id": user_id,
            "items": cart,
            "total_amount": total_amount,
            "address": address,
            "status": "Menunggu Konfirmasi", 
            "payment_method": payment_method,
            "payment_status": "Sedang Dicek" if filename else "Belum Bayar",
            "payment_proof": filename if filename else "",
            "date": datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        }
        
        self.repo.add_order(order_dict)
        return {"status": "success", "message": "Pesanan berhasil dibuat!"}

    def get_user_orders(self, user_id):
        return self.repo.get_orders_by_user(user_id)

    def get_admin_orders(self):
        return self.repo.get_all_orders()

    def update_status_pesanan(self, order_id, new_status):
        self.repo.update_order_status(order_id, new_status)

    def verify_payment(self, order_id):
        self.repo.verify_payment(order_id)

    def reject_payment(self, order_id):
        self.repo.reject_payment(order_id)