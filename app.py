import os
from flask import Flask, jsonify, render_template  # <-- Tambahkan render_template di sini
from flask_cors import CORS
import pymysql

app = Flask(__name__)
CORS(app)

def get_db_connection():
    return pymysql.connect(
        host=os.environ.get('MYSQLHOST', 'localhost'),
        user=os.environ.get('MYSQLUSER', 'root'),
        password=os.environ.get('MYSQLPASSWORD', ''),
        database=os.environ.get('MYSQLDATABASE', 'test'),
        port=int(os.environ.get('MYSQLPORT', 3306)),
        cursorclass=pymysql.cursors.DictCursor
    )

# 1. ROUTE BARU: Menampilkan halaman utama website (shop.html)
@app.route('/')
def home():
    return render_template('shop.html')  # Flask otomatis mencari file ini di dalam folder 'templates'

# 2. API Endpoint untuk mengambil data produk
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

if __name__ == '__main__':
    port = int(os.environ.get("PORT", 5000))
    app.run(debug=True, host="0.0.0.0", port=port)