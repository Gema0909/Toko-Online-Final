# src/repositories.py
import mysql.connector
import json

class Repository:
    def __init__(self):
        # Konfigurasi database bawaan XAMPP
        self.db_config = {
            "host": "localhost",
            "user": "root",       # Username default XAMPP
            "password": "",       # Password default XAMPP (kosong)
            "database": "toko_online"
        }

    def get_connection(self):
        # Membuka koneksi ke MySQL setiap kali butuh data
        return mysql.connector.connect(**self.db_config)

    # --- KELOLA USER ---
    def get_all_users(self):
        conn = self.get_connection()
        cursor = conn.cursor(dictionary=True)
        cursor.execute("SELECT * FROM users")
        users = cursor.fetchall()
        conn.close()
        return users

    def get_user_by_username(self, username):
        conn = self.get_connection()
        cursor = conn.cursor(dictionary=True)
        cursor.execute("SELECT * FROM users WHERE username = %s", (username,))
        user = cursor.fetchone()
        conn.close()
        return user

    def add_user(self, user_dict):
        conn = self.get_connection()
        cursor = conn.cursor()
        sql = "INSERT INTO users (username, password, role, address) VALUES (%s, %s, %s, %s)"
        val = (user_dict['username'], user_dict['password'], user_dict['role'], user_dict.get('address', ''))
        cursor.execute(sql, val)
        conn.commit()
        conn.close()

    # --- KELOLA PRODUK ---
    def get_all_products(self):
        conn = self.get_connection()
        cursor = conn.cursor(dictionary=True)
        cursor.execute("SELECT * FROM products")
        products = cursor.fetchall()
        conn.close()
        return products

    def get_product_by_id(self, product_id):
        conn = self.get_connection()
        cursor = conn.cursor(dictionary=True)
        cursor.execute("SELECT * FROM products WHERE id = %s", (product_id,))
        product = cursor.fetchone()
        conn.close()
        return product

    def add_product(self, product_dict):
        conn = self.get_connection()
        cursor = conn.cursor()
        sql = "INSERT INTO products (name, price, stock, category, description, image) VALUES (%s, %s, %s, %s, %s, %s)"
        val = (product_dict['name'], product_dict['price'], product_dict['stock'], product_dict['category'], product_dict['description'], product_dict.get('image', 'default.jpg'))
        cursor.execute(sql, val)
        conn.commit()
        conn.close()

    def update_product(self, product_id, updated_data):
        conn = self.get_connection()
        cursor = conn.cursor()
        sql = "UPDATE products SET name=%s, price=%s, stock=%s, category=%s, description=%s, image=%s WHERE id=%s"
        val = (updated_data['name'], updated_data['price'], updated_data['stock'], updated_data['category'], updated_data['description'], updated_data.get('image', 'default.jpg'), product_id)
        cursor.execute(sql, val)
        conn.commit()
        conn.close()
        return True

    def delete_product(self, product_id):
        conn = self.get_connection()
        cursor = conn.cursor()
        cursor.execute("DELETE FROM products WHERE id = %s", (product_id,))
        conn.commit()
        conn.close()

    # --- KELOLA PESANAN (ORDERS) ---
    def get_all_orders(self):
        conn = self.get_connection()
        cursor = conn.cursor(dictionary=True)
        cursor.execute("SELECT * FROM orders")
        orders = cursor.fetchall()
        conn.close()
        # MySQL menyimpan items sebagai string (TEXT), kita ubah kembali jadi List Python pakai json.loads
        for o in orders:
            o['items'] = json.loads(o['items'])
        return orders

    def get_orders_by_user(self, user_id):
        conn = self.get_connection()
        cursor = conn.cursor(dictionary=True)

        cursor.execute(
            "SELECT * FROM orders WHERE user_id = %s",
            (user_id,)
        )

        orders = cursor.fetchall()
        conn.close()

        for o in orders:
            o['items'] = json.loads(o['items'])

        return orders


    def add_order(self, order_dict):
        conn = self.get_connection()
        cursor = conn.cursor()

        sql = """
        INSERT INTO orders
        (user_id, items, total_amount, address, status,
        payment_method, payment_status, payment_proof, date)
        VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
        """

        items_json = json.dumps(order_dict['items'])

        val = (
            order_dict['user_id'],
            items_json,
            order_dict['total_amount'],
            order_dict['address'],
            order_dict['status'],
            order_dict['payment_method'],
            order_dict['payment_status'],
            order_dict['payment_proof'],
            order_dict['date']
        )

        cursor.execute(sql, val)
        conn.commit()
        conn.close()


    def update_order_status(self, order_id, new_status):
        conn = self.get_connection()
        cursor = conn.cursor()

        cursor.execute(
            "UPDATE orders SET status=%s WHERE id=%s",
            (new_status, order_id)
        )

        conn.commit()
        conn.close()
        return True


    def verify_payment(self, order_id):
        conn = self.get_connection()
        cursor = conn.cursor()

        cursor.execute(
            "UPDATE orders SET payment_status='Lunas' WHERE id=%s",
            (order_id,)
        )

        conn.commit()
        conn.close()
        return True


    def reject_payment(self, order_id):
        conn = self.get_connection()
        cursor = conn.cursor()

        cursor.execute(
            "UPDATE orders SET payment_status='Ditolak' WHERE id=%s",
            (order_id,)
        )

        conn.commit()
        conn.close()
        return True