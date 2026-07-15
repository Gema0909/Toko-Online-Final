import os
from flask import Flask, jsonify
from flask_cors import CORS
import pymysql

app = Flask(__name__)
CORS(app)  # Mengizinkan file HTML statis mengakses API ini

# Fungsi untuk koneksi ke MySQL Railway secara otomatis
def get_db_connection():
    return pymysql.connect(
        host=os.environ.get('MYSQLHOST', 'localhost'),
        user=os.environ.get('MYSQLUSER', 'root'),
        password=os.environ.get('MYSQLPASSWORD', ''),
        database=os.environ.get('MYSQLDATABASE', 'test'),
        port=int(os.environ.get('MYSQLPORT', 3306)),
        cursorclass=pymysql.cursors.DictCursor  # Hasil query otomatis jadi format JSON (Dictionary)
    )

# API Endpoint untuk Mengambil Data Produk dari MySQL
@app.route('/api/products', methods=['GET'])
def get_products():
    try:
        conn = get_db_connection()
        with conn.cursor() as cursor:
            # Query SQL untuk mengambil semua produk
            cursor.execute("SELECT * FROM products")
            products = cursor.fetchall()
        conn.close()
        
        return jsonify(products)
    except Exception as e:
        print("Error database:", e)
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    # Railway menggunakan port dinamis, pastikan membaca os.environ
    port = int(os.environ.get("PORT", 5000))
    app.run(debug=True, host="0.0.0.0", port=port)