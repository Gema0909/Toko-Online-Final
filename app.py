# app.py
from flask import Flask, render_template, request, redirect, url_for, session, flash
from werkzeug.utils import secure_filename
import os
from src.services import CommerceService

app = Flask(__name__)
app.secret_key = 'kunci_rahasia_toko_online_super_aman'
UPLOAD_FOLDER = os.path.join(app.root_path, 'static', 'images')
app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER

service = CommerceService()

@app.route('/')
def index():
    if 'user' in session:
        if session['user']['role'] == 'admin':
            return redirect(url_for('admin_dashboard'))
        return redirect(url_for('shop'))
    return redirect(url_for('login'))

@app.route('/login', methods=['GET', 'POST'])
def login():
    if request.method == 'POST':
        user = service.login(request.form['username'], request.form['password'])
        if user:
            session['user'] = user
            session['cart'] = []  # Menginisialisasi keranjang belanja kosong di session
            return redirect(url_for('index'))
        flash('Username atau Password salah!', 'error')
    return render_template('login.html')

@app.route('/register', methods=['GET', 'POST'])
def register():
    if request.method == 'POST':
        res = service.register_user(
            request.form['username'], 
            request.form['password'], 
            request.form.get('address', '')
        )
        if res['status'] == 'success':
            flash(res['message'], 'success')
            return redirect(url_for('login'))
        flash(res['message'], 'error')
    return render_template('register.html')

@app.route('/logout')
def logout():
    session.clear()
    return redirect(url_for('login'))

@app.route('/shop')
def shop():
    if 'user' not in session: return redirect(url_for('login'))
    items = service.get_catalog()
    return render_template('shop.html', user=session['user'], items=items, cart_count=len(session.get('cart', [])))

@app.route('/cart/add/<product_id>', methods=['POST'])
def add_to_cart(product_id):
    if 'user' not in session: return redirect(url_for('login'))
    cart = session.get('cart', [])
    
    # Periksa apakah produk sudah ada dalam keranjang, jika ada naikkan quantity
    found = False
    for item in cart:
        if str(item['product_id']) == str(product_id):
            item['quantity'] += 1
            found = True
            break
    if not found:
        cart.append({"product_id": int(product_id), "quantity": 1})
        
    session['cart'] = cart
    flash("Produk berhasil dimasukkan ke keranjang!", "success")
    return redirect(url_for('shop'))

@app.route('/cart', methods=['GET', 'POST'])
def view_cart():
    if 'user' not in session:
        return redirect(url_for('login'))

    from src.repositories import Repository
    repo = Repository()

    cart = session.get('cart', [])
    cart_details = []
    total_price = 0

    for item in cart:
        p = repo.get_product_by_id(item['product_id'])
        if p:
            subtotal = p['price'] * item['quantity']
            total_price += subtotal
            cart_details.append({
                "product_id": p['id'],
                "name": p['name'],
                "price": p['price'],
                "quantity": item['quantity'],
                "subtotal": subtotal
            })

    if request.method == "POST":

        address = request.form.get(
            "address",
            session["user"].get("address", "")
        )

        payment_method = request.form.get("payment_method")

        payment_proof = request.files.get("payment_proof")

        filename = None

        if payment_proof and payment_proof.filename:
            filename = secure_filename(payment_proof.filename)

            payment_folder = os.path.join(app.root_path, "static", "payments")
            os.makedirs(payment_folder, exist_ok=True)

            payment_proof.save(
                os.path.join(payment_folder, filename)
            )

        res = service.checkout_cart(
            session["user"]["id"],
            cart,
            address,
            payment_method,
            filename
        )

        if res["status"] == "success":
            session["cart"] = []
            flash(res["message"], "success")
            return redirect(url_for("view_orders"))

        flash(res["message"], "error")

    return render_template(
        "cart.html",
        user=session["user"],
        cart=cart_details,
        total=total_price
    )

@app.route('/cart/remove/<product_id>')
def remove_from_cart(product_id):
    if 'user' not in session: return redirect(url_for('login'))
    cart = session.get('cart', [])
    cart = [item for item in cart if str(item['product_id']) != str(product_id)]
    session['cart'] = cart
    flash("Produk dihapus dari keranjang belanja.", "success")
    return redirect(url_for('view_cart'))

@app.route('/orders')
def view_orders():
    if 'user' not in session: return redirect(url_for('login'))
    orders = service.get_user_orders(session['user']['id'])
    return render_template('orders.html', user=session['user'], orders=orders)

# --- PANEL ADMIN DASHBOARD ---
@app.route('/admin')
def admin_dashboard():
    if 'user' not in session or session['user']['role'] != 'admin': return redirect(url_for('login'))
    orders = service.get_admin_orders()
    items = service.get_catalog()
    total_sales = sum(o['total_amount'] for o in orders if o['status'] != 'Dibatalkan')
    return render_template('admin.html', user=session['user'], orders=orders, items=items, total_sales=total_sales)

@app.route('/admin/add_product', methods=['POST'])
def add_product_route():
    if session['user']['role'] != 'admin':
        return redirect(url_for('login'))

    image = request.files.get("image")

    filename = "default.jpg"

    if image and image.filename != "":
        filename = secure_filename(image.filename)
        image.save(os.path.join(app.config['UPLOAD_FOLDER'], filename))

    service.add_new_product(
        request.form['name'],
        request.form['price'],
        request.form['stock'],
        request.form['category'],
        request.form.get('description', ''),
        filename
    )

    flash("Produk baru berhasil dipajang!", "success")
    return redirect(url_for('admin_dashboard'))

@app.route('/admin/edit_product/<product_id>', methods=['POST'])
def edit_product_route(product_id):
    if session['user']['role'] != 'admin':
        return redirect(url_for('login'))

    image = request.files.get("image")
    filename = None

    if image and image.filename != "":
        filename = secure_filename(image.filename)
        image.save(os.path.join(app.config['UPLOAD_FOLDER'], filename))

    service.edit_product(
        product_id,
        request.form['name'],
        request.form['price'],
        request.form['stock'],
        request.form['category'],
        request.form.get('description', ''),
        filename
    )

    flash("Informasi produk berhasil diubah!", "success")
    return redirect(url_for('admin_dashboard'))

@app.route('/admin/delete_product/<product_id>', methods=['POST'])
def delete_product_route(product_id):
    if session['user']['role'] != 'admin': return redirect(url_for('login'))
    service.delete_product(product_id)
    flash("Produk telah dihapus dari katalog!", "success")
    return redirect(url_for('admin_dashboard'))

@app.route('/admin/update_order/<order_id>', methods=['POST'])
def update_order_route(order_id):
    if session['user']['role'] != 'admin': return redirect(url_for('login'))
    service.update_status_pesanan(order_id, request.form['status'])
    flash(f"Status Pesanan #{order_id} berhasil diperbarui!", "success")
    return redirect(url_for('admin_dashboard'))

@app.route('/admin/verify_payment/<order_id>', methods=['POST'])
def verify_payment_route(order_id):

    if session['user']['role'] != 'admin':
        return redirect(url_for('login'))

    service.verify_payment(order_id)

    flash("Pembayaran berhasil diverifikasi.", "success")

    return redirect(url_for('admin_dashboard'))


@app.route('/admin/reject_payment/<order_id>', methods=['POST'])
def reject_payment_route(order_id):

    if session['user']['role'] != 'admin':
        return redirect(url_for('login'))

    service.reject_payment(order_id)

    flash("Pembayaran ditolak.", "error")

    return redirect(url_for('admin_dashboard'))

if __name__ == '__main__':
    app.run(debug=True)