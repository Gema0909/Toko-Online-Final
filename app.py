from flask import Flask, jsonify
from flask_cors import CORS # Wajib di-install: pip install flask-cors
from pymongo import MongoClient
import os

app = Flask(__name__)
CORS(app) # Mengizinkan file HTML statis menelepon API ini

# --- GANTI DENGAN URL MONGODB ATLAS KAMU ---
MONGO_URI = "mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority"

try:
    client = MongoClient(MONGO_URI)
    db = client['toko_online']
    products_collection = db['products']
    print("Berhasil terhubung ke MongoDB!")
except Exception as e:
    print("Gagal terhubung ke MongoDB:", e)

# API Endpoint untuk Mengambil Data Produk
@app.route('/api/products', methods=['GET'])
def get_products():
    # Mengambil semua data produk dari MongoDB
    # (Kita menyembunyikan '_id' bawaan mongo agar mudah dibaca oleh JavaScript)
    products = list(products_collection.find({}, {'_id': 0}))
    
    # Mengirimkan data dalam format JSON
    return jsonify(products)

if __name__ == '__main__':
    app.run(debug=True, port=5000)