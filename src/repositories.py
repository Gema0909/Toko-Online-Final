import mysql.connector
from urllib.parse import urlparse
import config

def init_db():
    db = None 
    try:
        print("Mencoba terhubung ke server database Railway via Jalur Publik...")
        
        # 1. KITA GUNAKAN JALUR PUBLIK AGAR BISA DIAKSES DARI LAPTOP
        url = urlparse(config.MYSQL_PUBLIC_URL)
        
        db = mysql.connector.connect(
            host=url.hostname,
            user=url.username,
            password=url.password,
            port=url.port
        )

        cursor = db.cursor()
        
        # 2. Ambil nama database dari config
        db_name = config.MYSQLDATABASE

        cursor.execute(f"CREATE DATABASE IF NOT EXISTS {db_name}")
        cursor.execute(f"USE {db_name}")

        print("--- Inisialisasi Database Toko Online ---")

        # 1. Tabel Users
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS users (
                id INT AUTO_INCREMENT PRIMARY KEY,
                username VARCHAR(100) UNIQUE NOT NULL,
                password VARCHAR(255) NOT NULL,
                role VARCHAR(50) NOT NULL,
                address TEXT
            )
        """)

        # 2. Tabel Products
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS products (
                id INT AUTO_INCREMENT PRIMARY KEY,
                name VARCHAR(255) NOT NULL,
                price INT NOT NULL,
                stock INT NOT NULL,
                category VARCHAR(100),
                description TEXT,
                image VARCHAR(255) DEFAULT 'default.jpg'
            )
        """)

        # 3. Tabel Orders
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS orders (
                id INT AUTO_INCREMENT PRIMARY KEY,
                user_id INT NOT NULL,
                items TEXT NOT NULL,
                total_amount INT NOT NULL,
                address TEXT,
                status VARCHAR(50),
                payment_method VARCHAR(50),
                payment_status VARCHAR(50),
                payment_proof VARCHAR(255),
                date DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
            )
        """)
        
        # Pastikan akun Admin default ada
        cursor.execute("SELECT * FROM users WHERE username='admin'")
        if not cursor.fetchone():
            cursor.execute("INSERT INTO users (username, password, role, address) VALUES (%s, %s, %s, %s)", 
                           ('admin', 'admin123', 'admin', 'Alamat Pusat Toko'))

        db.commit()
        print("✅ Database Toko Online Berhasil Disinkronkan di Server Railway!")
        
    except Exception as e:
        print(f"❌ Error: {e}")
    finally:
        if db is not None and db.is_connected():
            cursor.close()
            db.close()

if __name__ == "__main__":
    init_db()