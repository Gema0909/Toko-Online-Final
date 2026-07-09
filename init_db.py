import mysql.connector
import config

def init_db():
    db = None 
    try:
        print("Mencoba terhubung ke server database Railway via Service Internal...")
        
        # Menggunakan variabel internal sesuai config.py Anda tanpa mengubah repositories.py
        db = mysql.connector.connect(
            host=config.MYSQLHOST,
            user=config.MYSQLUSER,
            password=config.MYSQLPASSWORD,
            port=int(config.MYSQLPORT)
        )

        cursor = db.cursor()
        db_name = config.MYSQLDATABASE

        cursor.execute(f"CREATE DATABASE IF NOT EXISTS {db_name}")
        cursor.execute(f"USE {db_name}")

        print("--- Inisialisasi Database Toko Online ---")

        # 1. Tabel Users (Sesuai dengan repositori Anda)
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS users (
                id INT AUTO_INCREMENT PRIMARY KEY,
                username VARCHAR(100) UNIQUE NOT NULL,
                password VARCHAR(255) NOT NULL,
                role VARCHAR(50) NOT NULL,
                address TEXT
            )
        """)

        # 2. Tabel Products (Sesuai dengan repositori Anda)
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

        # 3. Tabel Orders (Sesuai dengan repositori Anda)
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
        
        # Membuat akun Admin default jika belum ada
        cursor.execute("SELECT * FROM users WHERE username='admin'")
        if not cursor.fetchone():
            cursor.execute("INSERT INTO users (username, password, role, address) VALUES (%s, %s, %s, %s)", 
                           ('admin', 'admin123', 'admin', 'Alamat Pusat Toko'))

        db.commit()
        print("✅ Semua Tabel Toko Online Berhasil Disinkronkan di Railway!")
        
    except Exception as e:
        print(f"❌ Error saat inisialisasi database: {e}")
    finally:
        if db is not None and db.is_connected():
            cursor.close()
            db.close()

if __name__ == "__main__":
    init_db()