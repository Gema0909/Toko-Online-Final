# src/models.py

class User:
    def __init__(self, id, username, password, role='customer', address=''):
        self.id = id
        self.username = username
        self.password = password
        self.role = role
        self.address = address  # Menampung alamat rumah default pembeli

    def to_dict(self):
        return {
            "id": self.id,
            "username": self.username,
            "password": self.password,
            "role": self.role,
            "address": self.address
        }

class Product:
    def __init__(self, id, name, price, stock, category, description="", image="default.jpg"):
        self.id = id
        self.name = name
        self.price = price
        self.stock = stock
        self.category = category
        self.description = description  # Detail deskripsi barang fisik
        self.image = image

    def to_dict(self):
        return {
            "id": self.id,
            "name": self.name,
            "price": self.price,
            "stock": self.stock,
            "category": self.category,
            "description": self.description,
            "image": self.image
        }

class Order:
    def __init__(
        self,
        id,
        user_id,
        items,
        total_amount,
        status='Pending',
        address='',
        date='',
        payment_method='',
        payment_status='Belum Dibayar',
        payment_proof=''
    ):
        self.id = id
        self.user_id = user_id
        self.items = items
        self.total_amount = total_amount
        self.status = status
        self.address = address
        self.date = date

        self.payment_method = payment_method
        self.payment_status = payment_status
        self.payment_proof = payment_proof

    def to_dict(self):
        return {
            "id": self.id,
            "user_id": self.user_id,
            "items": self.items,
            "total_amount": self.total_amount,
            "status": self.status,
            "address": self.address,
            "date": self.date,

            "payment_method": self.payment_method,
            "payment_status": self.payment_status,
            "payment_proof": self.payment_proof
        }