import os
import pymysql
from flask import Flask, render_template, request, jsonify, redirect, session
import mysql.connector

# 1. Inisialisasi Aplikasi Flask & Kunci Sesi
app = Flask(__name__)
app.secret_key = os.environ.get('SECRET_KEY', 'rahasia_super_aman_123')

# 2. Fungsi Koneksi Database (Otomatis Mendukung Lokal & Railway)
def get_db_connection():
    return pymysql.connect(
        host=os.environ.get('MYSQLHOST', 'localhost'),
        user=os.environ.get('MYSQLUSER', 'root'),
        password=os.environ.get('MYSQLPASSWORD', ''),
        database=os.environ.get('MYSQLDATABASE', 'toko_online'),
        port=int(os.environ.get('MYSQLPORT', 3306)),
        cursorclass=pymysql.cursors.DictCursor
    )

# ==========================================
#          ROUTE HALAMAN UTAMA (HTML)
# ==========================================

# Halaman Katalog Produk (Shop)
@app.route('/')
def index():
    return render_template('shop.html')

# Halaman Login
@app.route('/login')
def login_page():
    return render_template('login.html')

# Halaman Register
@app.route('/register')
def register_page():
    return render_template('register.html')

# Halaman Keranjang Belanja
@app.route('/cart')
def cart_page():
    return render_template('cart.html')

# Halaman Pesanan Saya
@app.route('/orders')
def orders_page():
    return render_template('orders.html')

# Halaman Dashboard Admin Kelola Barang
@app.route('/admin')
def admin_page():
    return render_template('admin.html')


# ==========================================
#          ROUTE API SISTEM (JSON)
# ==========================================

# API Ambil Data Produk dari Database (Dipanggil oleh shop.js)
@app.route('/api/products')
def api_products():
    try:
        conn = get_db_connection()
        with conn.cursor() as cursor:
            cursor.execute("SELECT * FROM products")
            products = cursor.fetchall()
        conn.close()
        return jsonify(products)
    except Exception as e:
        print("Error get products:", e)
        return jsonify([])

# API Login dengan Deteksi Peran/Role (Admin vs User)
@app.route('/api/login', methods=['POST'])
def api_login():
    try:
        # 1. Ambil data secara aman dari Form Data (dari JavaScript/HTML)
        username = request.form.get('username')
        password = request.form.get('password')
        
        # 2. Fallback (cadangan) jika suatu saat Anda mengirim JSON murni
        if not username and request.is_json:
            username = request.json.get('username')
            password = request.json.get('password')
            
        # 3. Validasi jika kosong
        if not username or not password:
            return jsonify({"success": False, "message": "Username & Password wajib diisi!"}), 400
            
        conn = get_db_connection()
        with conn.cursor() as cursor:
            cursor.execute("SELECT * FROM users WHERE username = %s AND password = %s", (username, password))
            user = cursor.fetchone()
        conn.close()
        
        # ... kode pencarian user di database tetap sama ...
        if user:
            user_role = user.get('role', 'user')
            if username.lower() == 'admin':
                user_role = 'admin'

            # --- TAMBAHKAN DUA BARIS INI (Untuk menyimpan sesi login) ---
            session['user'] = {"username": user['username'], "role": user_role}
            session['cart'] = [] # Menginisialisasi keranjang belanja
            # -------------------------------------------------------------

            return jsonify({
                "success": True, 
                "message": "Login sukses!",
                "user": {
                    "username": user['username'],
                    "role": user_role
                }
            })
        else:
            return jsonify({"success": False, "message": "Username atau Password salah!"}), 401
            
    except Exception as e:
        print("Error sistem login:", e)
        return jsonify({"success": False, "message": f"Terjadi kesalahan sistem: {str(e)}"}), 500
    
# ==========================================
#          ROUTE KERANJANG (API)
# ==========================================
@app.route('/api/cart', methods=['POST'])
def add_to_cart():
    try:
        # 1. Pastikan user sudah login
        if 'user' not in session:
            return jsonify({"success": False, "message": "Silakan login terlebih dahulu untuk berbelanja!"}), 401

        # 2. Ambil data yang dikirim dari tombol
        product_id = request.form.get('id') or (request.json.get('id') if request.is_json else None)
        product_name = request.form.get('name') or (request.json.get('name') if request.is_json else None)
        product_price = request.form.get('price') or (request.json.get('price') if request.is_json else None)

        if not product_name:
            return jsonify({"success": False, "message": "Data produk tidak valid!"}), 400

        # 3. Siapkan keranjang di dalam sesi jika belum ada
        if 'cart' not in session:
            session['cart'] = []

        # 4. Tambahkan barang ke keranjang
        cart = session['cart']
        cart.append({
            "id": product_id,
            "name": product_name,
            "price": product_price,
            "qty": 1
        })
        
        # 5. Simpan perubahan keranjang
        session['cart'] = cart
        session.modified = True 

        return jsonify({"success": True, "message": f"{product_name} berhasil masuk keranjang!"})

    except Exception as e:
        print("Error tambah keranjang:", e)
        return jsonify({"success": False, "message": "Gagal memasukkan ke keranjang."}), 500
    
# API Hapus Produk berdasarkan ID (Tambahkan di main.py)
@app.route('/api/products/<int:product_id>', methods=['DELETE'])
def api_delete_product(product_id):
    try:
        # (Opsional) Validasi keamanan: Pastikan hanya admin yang bisa menghapus
        if 'user' not in session or session['user'].get('role') != 'admin':
            return jsonify({"success": False, "message": "Akses ditolak! Anda bukan Admin."}), 403

        conn = get_db_connection()
        with conn.cursor() as cursor:
            # 1. Pastikan produk memang ada di database
            cursor.execute("SELECT * FROM products WHERE id = %s", (product_id,))
            product = cursor.fetchone()
            
            if not product:
                conn.close()
                return jsonify({"success": False, "message": "Produk tidak ditemukan!"}), 404
            
            # 2. Hapus produk dari database
            cursor.execute("DELETE FROM products WHERE id = %s", (product_id,))
            conn.commit()
            
        conn.close()
        return jsonify({"success": True, "message": f"Produk '{product['name']}' berhasil dihapus!"})

    except Exception as e:
        print("Error saat menghapus produk:", e)
        return jsonify({"success": False, "message": f"Gagal menghapus produk: {str(e)}"}), 500

# Jalankan Server Utama
if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=int(os.environ.get('PORT', 5000)))