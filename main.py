import os
import json
import uuid
import pymysql
from flask import Flask, render_template, request, jsonify, redirect, session
from werkzeug.utils import secure_filename
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

# Ini rute untuk halaman utama
@app.route('/')
def home_page():
    return render_template('index.html')

# Ini rute untuk halaman shop.html kamu yang lama
@app.route('/produk')
def produk_page():
    return render_template('shop.html')

# Halaman Login
@app.route('/login')
def login_page():
    return render_template('login.html')

# Halaman Register
@app.route('/register')
def register_page():
    return render_template('register.html')

@app.route('/logout')
def logout():
    # Menghapus semua data di dalam memori sesi saat ini
    session.clear()
    
    # Setelah sesi dihapus, kembalikan pengunjung ke halaman utama
    return redirect('/')

# Halaman Keranjang Belanja
@app.route('/cart')
def cart_page():
    # Ambil data keranjang dari sesi. Jika belum ada, berikan list kosong []
    isi_keranjang = session.get('cart', [])
    
    # Bawa data isi_keranjang ke dalam cart.html
    return render_template('cart.html', cart=isi_keranjang)

# Halaman Pesanan Saya
@app.route('/orders')
def orders_page():
    return render_template('orders.html')

# Halaman Dashboard Admin Kelola Barang
@app.route('/admin')
def admin_page():
    # Cek apakah user sudah login dan perannya adalah admin
    if 'user' not in session or session['user'].get('role') != 'admin':
        return redirect('/login') # Jika belum, lempar ke halaman login
        
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
        # (Pastikan kata kunci 'user' ini sama persis dengan yang kamu buat di rute /login)
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
    
# ==========================================
#          ROUTE CEK USER (API)
# ==========================================
@app.route('/api/user')
def get_current_user():
    # Jika ada session 'user', kirim nama user-nya
    if 'user' in session:
        return jsonify({"logged_in": True, "username": session['user']})
    
    # Jika belum login, kasih tahu false
    return jsonify({"logged_in": False})
    
# API Tambahan untuk mengambil data keranjang
@app.route('/api/get_cart', methods=['GET'])
def get_cart_api():
    return jsonify({"cart": session.get('cart', [])})

# API Tambahan untuk menghapus satu barang dari keranjang
@app.route('/api/cart/remove/<int:index>', methods=['POST'])
def remove_from_cart(index):
    cart = session.get('cart', [])
    if 0 <= index < len(cart):
        cart.pop(index)
        session['cart'] = cart
        session.modified = True
        return jsonify({"success": True, "message": "Barang dihapus"})
    return jsonify({"success": False, "message": "Gagal menghapus"})
    
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
    
# ==========================================
#          API DASHBOARD UTAMA ADMIN
# ==========================================

# 1. API untuk Mengambil Statistik Uang & Transaksi
@app.route('/api/admin/stats', methods=['GET'])
def api_admin_stats():
    if 'user' not in session or session['user'].get('role') != 'admin':
        return jsonify({"success": False, "message": "Akses ditolak!"}), 403
    try:
        conn = get_db_connection()
        with conn.cursor() as cursor:
            # Hitung total pendapatan dari pesanan yang status pembayarannya 'Lunas'
            cursor.execute("SELECT SUM(total_price) as total_revenue FROM orders WHERE payment_status = 'Lunas'")
            res_rev = cursor.fetchone()
            total_revenue = res_rev['total_revenue'] if res_rev['total_revenue'] else 0
            
            # Hitung total seluruh pesanan masuk
            cursor.execute("SELECT COUNT(*) as total_orders FROM orders")
            res_ord = cursor.fetchone()
            total_orders = res_ord['total_orders'] if res_ord['total_orders'] else 0
            
        conn.close()
        return jsonify({"success": True, "total_revenue": total_revenue, "total_orders": total_orders})
    except Exception as e:
        return jsonify({"success": False, "message": str(e)}), 500

# 2. API untuk Mengambil Semua Antrean Pesanan
@app.route('/api/admin/orders', methods=['GET'])
def api_admin_orders():
    if 'user' not in session or session['user'].get('role') != 'admin':
        return jsonify({"success": False, "message": "Akses ditolak!"}), 403
    try:
        conn = get_db_connection()
        with conn.cursor() as cursor:
            # Mengambil data antrean pesanan terbaru
            cursor.execute("SELECT * FROM orders ORDER BY id DESC")
            orders = cursor.fetchall()
            
            # Konversi format tanggal agar aman saat dikirim ke JavaScript
            for order in orders:
                if 'created_at' in order and order['created_at']:
                    order['created_at'] = order['created_at'].strftime('%d %b %Y %H:%M')
        conn.close()
        return jsonify(orders)
    except Exception as e:
        print("Error fetch orders:", e)
        return jsonify([]), 500

# 3. API untuk Mengubah Status Pengiriman Pesanan (Pending -> Diproses -> dll)
@app.route('/api/admin/orders/<int:order_id>/status', methods=['POST'])
def api_update_order_status(order_id):
    if 'user' not in session or session['user'].get('role') != 'admin':
        return jsonify({"success": False, "message": "Akses ditolak!"}), 403
    try:
        data = request.json
        new_status = data.get('status')
        
        conn = get_db_connection()
        with conn.cursor() as cursor:
            cursor.execute("UPDATE orders SET status = %s WHERE id = %s", (new_status, order_id))
            conn.commit()
        conn.close()
        return jsonify({"success": True, "message": "Status pesanan berhasil diperbarui!"})
    except Exception as e:
        return jsonify({"success": False, "message": str(e)}), 500
    
# ==========================================
#       API UNTUK MENAMBAH PRODUK BARU
# ==========================================
@app.route('/api/products', methods=['POST'])
def api_add_product():
    # Pastikan hanya admin yang bisa menambah barang
    if 'user' not in session or session['user'].get('role') != 'admin':
        return jsonify({"success": False, "message": "Akses ditolak!"}), 403
        
    try:
        # 1. Ambil data teks dari form
        name = request.form.get('name')
        category = request.form.get('category')
        price = request.form.get('price')
        stock = request.form.get('stock')
        description = request.form.get('description')
        
        # ==========================================
        # 2. PROSES UPLOAD FILE GAMBAR (VERSI AMAN)
        # ==========================================
        image_file = request.files.get('image')
        image_url = "" # default jika tidak ada gambar
        
        if image_file and image_file.filename != '':
            # Menentukan lokasi folder secara absolut di dalam static/uploads
            upload_folder = os.path.join(app.root_path, 'static', 'uploads')
            if not os.path.exists(upload_folder):
                os.makedirs(upload_folder)
                
            # Mengubah spasi/karakter aneh menjadi aman (contoh: "baju koko.jpg" -> "baju_koko.jpg")
            filename = secure_filename(image_file.filename)
            
            # Simpan file asli ke dalam folder proyek
            image_file.save(os.path.join(upload_folder, filename))
            
            # Jalur URL yang akan dimasukkan ke kolom database
            image_url = f"/static/uploads/{filename}"

        # 3. Masukkan data ke Database MySQL
        conn = get_db_connection()
        with conn.cursor() as cursor:
            sql = """INSERT INTO products (name, category, price, stock, description, image) 
                     VALUES (%s, %s, %s, %s, %s, %s)"""
            cursor.execute(sql, (name, category, price, stock, description, image_url))
            conn.commit()
        conn.close()
        
        return jsonify({"success": True, "message": f"Produk '{name}' berhasil dipajang ke toko!"})
        
    except Exception as e:
        print("Error tambah produk:", e)
        return jsonify({"success": False, "message": str(e)}), 500
    
# ==========================================
#       API UNTUK MENGEDIT/UPDATE PRODUK
# ==========================================
@app.route('/api/products/<int:product_id>', methods=['POST', 'PUT']) # Tambah POST agar bisa baca FormData
def api_update_product(product_id):
    import uuid # Di-import di sini untuk membuat nama gambar unik

    # Validasi hak akses Admin
    if 'user' not in session or session['user'].get('role') != 'admin':
        return jsonify({"success": False, "message": "Akses ditolak!"}), 403
        
    try:
        # 1. GANTI KE request.form KARENA SEKARANG MENGIRIM GAMBAR (FormData)
        # Kita pakai ".get" agar tidak error jika fieldnya kosong
        name = request.form.get('name') or (request.json and request.json.get('name'))
        category = request.form.get('category') or (request.json and request.json.get('category'))
        price = request.form.get('price') or (request.json and request.json.get('price'))
        stock = request.form.get('stock') or (request.json and request.json.get('stock'))
        description = request.form.get('description') or (request.json and request.json.get('description'))
        
        # 2. CEK APAKAH ADMIN MENGUPLOAD GAMBAR BARU
        image_file = request.files.get('image')
        image_url = None
        
        if image_file and image_file.filename != '':
            # Tentukan lokasi folder
            upload_folder = os.path.join(app.root_path, 'static', 'uploads')
            if not os.path.exists(upload_folder):
                os.makedirs(upload_folder)
                
            # Buat nama acak (UUID) agar gambar baru tidak bentrok dengan cache browser
            ext = image_file.filename.rsplit('.', 1)[1].lower() if '.' in image_file.filename else 'jpg'
            unique_filename = f"{uuid.uuid4().hex}.{ext}"
            
            # Simpan fisik gambar ke folder
            image_file.save(os.path.join(upload_folder, unique_filename))
            # Siapkan path untuk di database
            image_url = f"/static/uploads/{unique_filename}"

        # 3. UPDATE DATA KE DATABASE
        conn = get_db_connection()
        with conn.cursor() as cursor:
            if image_url:
                # Jika ada gambar baru, update SEMUANYA (termasuk kolom image)
                sql = """UPDATE products 
                         SET name = %s, category = %s, price = %s, stock = %s, description = %s, image = %s 
                         WHERE id = %s"""
                cursor.execute(sql, (name, category, price, stock, description, image_url, product_id))
            else:
                # Jika HANYA ganti teks (gambar tidak diubah), JANGAN sentuh kolom image
                sql = """UPDATE products 
                         SET name = %s, category = %s, price = %s, stock = %s, description = %s 
                         WHERE id = %s"""
                cursor.execute(sql, (name, category, price, stock, description, product_id))
            
            conn.commit()
        conn.close()
        
        return jsonify({"success": True, "message": f"Data produk '{name}' berhasil diperbarui!"})
    except Exception as e:
        print("Error update produk:", e)
        return jsonify({"success": False, "message": str(e)}), 500
    
# Pastikan 'jsonify' sudah di-import di bagian paling atas file Python Anda, contoh:
# from flask import Flask, jsonify, render_template ...
@app.route('/api/my-orders')
def get_my_orders():
    # Ini adalah jalur aman agar web Anda TIDAK crash/error meskipun database belum dibuat
    try:
        # 1. Jika Anda sudah punya koneksi database, silakan aktifkan bagian ini:
        # conn = get_db_connection()
        # cursor = conn.cursor(dictionary=True)
        # cursor.execute("SELECT * FROM orders ORDER BY id DESC")
        # orders = cursor.fetchall()
        # conn.close()
        # return jsonify(orders)
        
        # 2. SEMENTARA: Kita berikan list kosong [] agar JavaScript membaca "belum ada pesanan"
        # dan tidak memunculkan pesan error merah lagi di layar Anda.
        return jsonify([])
        
    except Exception as e:
        print("Ada error di database orders:", e)
        return jsonify([]) # Tetap kembalikan array kosong sebagai penyelamat
    
# ==========================================
#    ROUTE UNTUK MENAMBAH PRODUK (HTML FORM)
# ==========================================
@app.route('/admin/add_product', methods=['POST'])
def admin_add_product_form():
    # Pastikan hanya admin yang bisa menambah barang
    if 'user' not in session or session['user'].get('role') != 'admin':
        return redirect('/login')
        
    try:
        # 1. Ambil data teks dari form
        name = request.form.get('name')
        category = request.form.get('category')
        price = request.form.get('price')
        stock = request.form.get('stock')
        description = request.form.get('description')
        
        # 2. PROSES UPLOAD FILE GAMBAR
        image_file = request.files.get('image')
        image_url = "" # default jika tidak ada gambar
        
        if image_file and image_file.filename != '':
            upload_folder = os.path.join(app.root_path, 'static', 'uploads')
            if not os.path.exists(upload_folder):
                os.makedirs(upload_folder)
                
            filename = secure_filename(image_file.filename)
            image_file.save(os.path.join(upload_folder, filename))
            image_url = f"/static/uploads/{filename}"

        # 3. Masukkan data ke Database MySQL
        conn = get_db_connection()
        with conn.cursor() as cursor:
            sql = """INSERT INTO products (name, category, price, stock, description, image) 
                     VALUES (%s, %s, %s, %s, %s, %s)"""
            cursor.execute(sql, (name, category, price, stock, description, image_url))
            conn.commit()
        conn.close()
        
        # Setelah sukses, arahkan kembali ke halaman dashboard admin
        return redirect('/admin')
        
    except Exception as e:
        print("Error tambah produk:", e)
        return f"Terjadi kesalahan saat menambah produk: {str(e)}", 500
    
# ==========================================
#          ROUTE CHECKOUT / BUAT PESANAN
# ==========================================
@app.route('/checkout', methods=['POST'])
def process_checkout():
    # 1. Pastikan user sudah login
    if 'user' not in session:
        return jsonify({"success": False, "message": "Silakan login terlebih dahulu!"}), 401
        
    try:
        # 2. Pastikan keranjang tidak kosong
        cart = session.get('cart', [])
        if not cart:
            return jsonify({"success": False, "message": "Keranjang belanja kosong!"}), 400

        # 3. Ambil data teks dari form 
        address = request.form.get('address', 'Alamat tidak diisi')
        payment_method = request.form.get('payment_method', 'Transfer')

        # 4. PROSES UPLOAD BUKTI PEMBAYARAN
        bukti_file = request.files.get('payment_proof')
        bukti_url = ""

        if bukti_file and bukti_file.filename != '':
            upload_folder = os.path.join(app.root_path, 'static', 'uploads')
            if not os.path.exists(upload_folder):
                os.makedirs(upload_folder)
                
            # Simpan file gambar dengan nama unik
            ext = bukti_file.filename.rsplit('.', 1)[1].lower() if '.' in bukti_file.filename else 'jpg'
            unique_filename = f"qris_{uuid.uuid4().hex}.{ext}"
            
            bukti_file.save(os.path.join(upload_folder, unique_filename))
            bukti_url = f"/static/uploads/{unique_filename}"

        # 5. SIAPKAN DATA UNTUK DATABASE
        total_amount = sum(int(item['price']) * int(item.get('qty', 1)) for item in cart)
        user_id = session['user']['username'] # Menyimpan username sebagai identitas pembeli
        items_json = json.dumps(cart) # Mengubah isi keranjang (list) menjadi teks JSON
        status_pesanan = 'Menunggu Konfirmasi'
        status_pembayaran = 'Pending'

        # 6. SIMPAN KE DATABASE (Tabel orders sesuai struktur kamu)
        conn = get_db_connection()
        with conn.cursor() as cursor:
            sql = """INSERT INTO orders 
                     (user_id, items, total_amount, address, status, payment_method, payment_status, payment_proof) 
                     VALUES (%s, %s, %s, %s, %s, %s, %s, %s)"""
                     
            cursor.execute(sql, (
                user_id, 
                items_json, 
                total_amount, 
                address, 
                status_pesanan, 
                payment_method, 
                status_pembayaran, 
                bukti_url
            ))
            conn.commit()
        conn.close()

        # 7. KOSONGKAN KERANJANG SETELAH SUKSES
        session['cart'] = []
        session.modified = True

        return jsonify({"success": True, "message": "Pesanan berhasil dibuat!"})

    except Exception as e:
        print("Error saat checkout:", e)
        return jsonify({"success": False, "message": str(e)}), 500

# Jalankan Server Utama
if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=int(os.environ.get('PORT', 5000)))