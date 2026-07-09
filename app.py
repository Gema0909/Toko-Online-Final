# app.py
from flask import Flask
import os
from router.routes import bp as main_blueprint  # Mengimpor blueprint dari routes.py

app = Flask(__name__)
app.secret_key = 'kunci_rahasia_toko_online_super_aman'

# --- PERBAIKAN 1: OTOMATIS BUAT FOLDER JIKA BELUM ADA DI RAILWAY ---
UPLOAD_FOLDER = os.path.join(app.root_path, 'static', 'images')
os.makedirs(UPLOAD_FOLDER, exist_ok=True) # Mencegah error FileNotFoundError saat upload
app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER

# Daftarkan blueprint ke dalam aplikasi utama
app.register_blueprint(main_blueprint)

if __name__ == '__main__':
    # --- PERBAIKAN 2: BINDING PORT RAILWAY ---
    # Railway mengharuskan host 0.0.0.0 dan port diambil dari environment sistem
    port = int(os.environ.get("PORT", 5000))
    app.run(host="0.0.0.0", port=port, debug=True)