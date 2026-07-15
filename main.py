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
        
        if user:
            # Deteksi Role Pelanggan atau Admin
            user_role = user.get('role', 'user')
            if username.lower() == 'admin':
                user_role = 'admin'

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

# Jalankan Server Utama
if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=int(os.environ.get('PORT', 5000)))