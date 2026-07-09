# routes.py
from flask import Blueprint, render_template, request, redirect, url_for, session, flash, current_app
from werkzeug.utils import secure_filename
import os
from src.services import CommerceService

# Membuat Blueprint untuk router
bp = Blueprint('main', __name__)

service = CommerceService()

@bp.route('/')
def index():
    if 'user' in session:
        if session['user']['role'] == 'admin':
            return redirect(url_for('main.admin_dashboard'))
        return redirect(url_for('main.shop'))
    return redirect(url_for('main.login'))

@bp.route('/login', methods=['GET', 'POST'])
def login():
    if request.method == 'POST':
        user = service.login(request.form['username'], request.form['password'])
        if user:
            session['user'] = user
            session['cart'] = []  # Menginisialisasi keranjang belanjaan kosong di session
            return redirect(url_for('main.index'))
        flash('Username atau Password salah!', 'error')
    return render_template('login.html')

@bp.route('/register', methods=['GET', 'POST'])
def register():
    if request.method == 'POST':
        res = service.register_user(
            request.form['username'], 
            request.form['password'], 
            request.form.get('address', '')
        )
        if res['status'] == 'success':
            flash(res['message'], 'success')
            return redirect(url_for('main.login'))
        flash(res['message'], 'error')
    return render_template('register.html')

@bp.route('/logout')
def logout():
    session.clear()
    return redirect(url_for('main.login'))

@bp.route('/shop')
def shop():
    if 'user' not in session: return redirect(url_for('main.login'))
    items = service.get_catalog()
    return render_template('shop.html', user=session['user'], items=items, cart_count=len(session.get('cart', [])))

@bp.route('/cart/add/<product_id>', methods=['POST'])
def add_to_cart(product_id):
    if 'user' not in session: return redirect(url_for('main.login'))
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
    return redirect(url_for('main.shop'))

@bp.route('/cart', methods=['GET', 'POST'])
def view_cart():
    if 'user' not in session:
        return redirect(url_for('main.login'))

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
            # Menggunakan current_app karena kita berada di dalam blueprint
            payment_folder = os.path.join(current_app.root_path, "static", "payments")
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
            return redirect(url_for("main.view_orders"))

        flash(res["message"], "error")

    return render_template(
        "cart.html",
        user=session["user"],
        cart=cart_details,
        total=total_price
    )

@bp.route('/cart/remove/<product_id>')
def remove_from_cart(product_id):
    if 'user' not in session: return redirect(url_for('main.login'))
    cart = session.get('cart', [])
    cart = [item for item in cart if str(item['product_id']) != str(product_id)]
    session['cart'] = cart
    flash("Produk dihapus dari keranjang belanja.", "success")
    return redirect(url_for('main.view_cart'))

@bp.route('/orders')
def view_orders():
    if 'user' not in session: return redirect(url_for('main.login'))
    orders = service.get_user_orders(session['user']['id'])
    return render_template('orders.html', user=session['user'], orders=orders)

# --- PANEL ADMIN DASHBOARD ---
@bp.route('/admin')
def admin_dashboard():
    if 'user' not in session or session['user']['role'] != 'admin': return redirect(url_for('main.login'))
    orders = service.get_admin_orders()
    items = service.get_catalog()
    total_sales = sum(o['total_amount'] for o in orders if o['status'] != 'Dibatalkan')
    return render_template('admin.html', user=session['user'], orders=orders, items=items, total_sales=total_sales)

@bp.route('/admin/add_product', methods=['POST'])
def add_product_route():
    if session['user']['role'] != 'admin':
        return redirect(url_for('main.login'))

    image = request.files.get("image")
    filename = "default.jpg"

    if image and image.filename != "":
        filename = secure_filename(image.filename)
        # Menggunakan current_app.config untuk akses variabel aplikasi
        image.save(os.path.join(current_app.config['UPLOAD_FOLDER'], filename))

    service.add_new_product(
        request.form['name'],
        request.form['price'],
        request.form['stock'],
        request.form['category'],
        request.form.get('description', ''),
        filename
    )

    flash("Produk baru berhasil dipajang!", "success")
    return redirect(url_for('main.admin_dashboard'))

@bp.route('/admin/edit_product/<product_id>', methods=['POST'])
def edit_product_route(product_id):
    if session['user']['role'] != 'admin':
        return redirect(url_for('main.login'))

    image = request.files.get("image")
    filename = None

    if image and image.filename != "":
        filename = secure_filename(image.filename)
        image.save(os.path.join(current_app.config['UPLOAD_FOLDER'], filename))

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
    return redirect(url_for('main.admin_dashboard'))

@bp.route('/admin/delete_product/<product_id>', methods=['POST'])
def delete_product_route(product_id):
    if session['user']['role'] != 'admin': return redirect(url_for('main.login'))
    service.delete_product(product_id)
    flash("Produk telah dihapus dari katalog!", "success")
    return redirect(url_for('main.admin_dashboard'))

@bp.route('/admin/update_order/<order_id>', methods=['POST'])
def update_order_route(order_id):
    if session['user']['role'] != 'admin': return redirect(url_for('main.login'))
    service.update_status_pesanan(order_id, request.form['status'])
    flash(f"Status Pesanan #{order_id} berhasil diperbarui!", "success")
    return redirect(url_for('main.admin_dashboard'))

@bp.route('/admin/verify_payment/<order_id>', methods=['POST'])
def verify_payment_route(order_id):
    if session['user']['role'] != 'admin':
        return redirect(url_for('main.login'))
    service.verify_payment(order_id)
    flash("Pembayaran berhasil diverifikasi.", "success")
    return redirect(url_for('main.admin_dashboard'))

@bp.route('/admin/reject_payment/<order_id>', methods=['POST'])
def reject_payment_route(order_id):
    if session['user']['role'] != 'admin':
        return redirect(url_for('main.login'))
    service.reject_payment(order_id)
    flash("Pembayaran ditolak.", "error")
    return redirect(url_for('main.admin_dashboard'))