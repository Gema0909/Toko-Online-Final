import os
from flask import Flask, jsonify, render_template
from flask_cors import CORS
import pymysql

app = Flask(__name__)
CORS(app)

# Fungsi koneksi database MySQL Railway
def get_db_connection():
    return pymysql.connect(
        host=os.environ.get('MYSQLHOST', 'localhost'),
        user=os.environ.get('MYSQLUSER', 'root'),
        password=os.environ.get('MYSQLPASSWORD', ''),
        database=os.environ.get('MYSQLDATABASE', 'test'),
        port=int(os.environ.get('MYSQLPORT', 3306)),
        cursorclass=pymysql.cursors.DictCursor
    )

# =========================================================
# 1. API ENDPOINT (DATABASE)
# *Wajib ditaruh di atas agar tidak bertabrakan dengan halaman web*
# =========================================================

# Mengambil data produk dari MySQL
@app.route('/api/products', methods=['GET'])
def get_products():
    try:
        conn = get_db_connection()
        with conn.cursor() as cursor:
            cursor.execute("SELECT * FROM products")
            products = cursor.fetchall()
        conn.close()
        return jsonify(products)
    except Exception as e:
        print("Error database:", e)
        return jsonify({"error": str(e)}), 500


# =========================================================
# 2. RUTE UNTUK MENAMPILKAN HALAMAN WEB (HTML)
# =========================================================

# Halaman Utama / Beranda (shop.html)
@app.route('/')
def home():
    return render_template('shop.html')

# 🔥 RUTE OTOMATIS SAKTI 🔥
# Kode ini akan otomatis membaca semua file HTML di folder 'templates' kamu!
@app.route('/<path:page_name>')
def render_any_page(page_name):
    # Jika di browser diketik pakai akhiran '.html' (misal: login.html), kita bersihkan dulu
    if page_name.endswith('.html'):
        page_name = page_name[:-5]
        
    try:
        # Flask akan otomatis mencari '[nama_halaman].html' di folder templates
        return render_template(f'{page_name}.html')
    except Exception:
        # Jika file HTML-nya memang tidak ada di folder templates
        return f"Error 404: File '{page_name}.html' tidak ditemukan di dalam folder 'templates' kamu. Periksa kembali ejaan namanya!", 404

from flask import request, session # Pastikan 'request' sudah di-import di bagian paling atas app.py

# =========================================================
# API ENDPOINT UNTUK PROSES LOGIN NYATA
# =========================================================
@app.route('/api/login', methods=['POST'])
def api_login():
    try:
        data = request.json
        username = data.get('username')
        password = data.get('password')
        
        if not username or not password:
            return jsonify({"success": False, "message": "Username & Password wajib diisi!"}), 400
            
        conn = get_db_connection()
        with conn.cursor() as cursor:
            # PENTING: Kode ini mencari username & password di tabel 'users' milikmu.
            # (Jika nama tabelmu 'admin' atau 'members', ganti kata 'users' di bawah ini)
            cursor.execute("SELECT * FROM users WHERE username = %s AND password = %s", (username, password))
            user = cursor.fetchone()
        conn.close()
        
        if user:
            # Login Berhasil!
            return jsonify({
                "success": True, 
                "message": "Login sukses!",
                "user": {
                    "username": user['username']
                }
            })
        else:
            # Login Gagal
            return jsonify({"success": False, "message": "Username atau Password salah!"}), 401
            
    except Exception as e:
        print("Error sistem login:", e)
        return jsonify({"success": False, "message": f"Terjadi kesalahan sistem: {str(e)}"}), 500
    
if __name__ == '__main__':
    port = int(os.environ.get("PORT", 5000))
    app.run(debug=True, host="0.0.0.0", port=port)