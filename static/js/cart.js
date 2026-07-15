document.addEventListener('DOMContentLoaded', function () {
    renderCart();

    const checkoutBtn = document.querySelector('.ringkasan-belanja button') || document.querySelector('button');
    if (checkoutBtn) {
        checkoutBtn.addEventListener('click', function(e) {
            e.preventDefault();
            checkout();
        });
    }
});

function renderCart() {
    let cart = JSON.parse(localStorage.getItem('cart')) || [];
    const container = document.getElementById('cart-items-container');
    const totalElement = document.getElementById('cart-total-price');
    const badgeElement = document.querySelector('.cart-badge');

    if (!container) return;

    // JIKA KERANJANG KOSONG
    if (cart.length === 0) {
        container.innerHTML = `
            <tr>
                <td colspan="4" class="cart-empty-cell">
                    Keranjang belanja kamu masih kosong. <a href="/" class="cart-empty-link">Ayo mulai belanja!</a>
                </td>
            </tr>
        `;
        if (totalElement) totalElement.textContent = 'Rp 0';
        if (badgeElement) badgeElement.textContent = '0';
        return;
    }

    let html = '';
    let totalHarga = 0;

    // LOOPING PRODUK DENGAN CLASS CSS (TANPA INLINE STYLE)
    cart.forEach((item, index) => {
        const itemPrice = parseInt(item.price) || 0;
        const itemQty = parseInt(item.quantity) || 1;
        const subtotal = itemPrice * itemQty;
        totalHarga += subtotal;

        html += `
            <tr class="cart-row">
                <td class="cart-product-cell">
                    <div class="cart-product-name">${item.name}</div>
                    <div class="cart-product-price">Rp ${itemPrice.toLocaleString('id-ID')}</div>
                </td>
                <td class="cart-qty-cell">
                    ${itemQty}x
                </td>
                <td class="cart-subtotal-cell">
                    Rp ${subtotal.toLocaleString('id-ID')}
                </td>
                <td class="cart-action-cell">
                    <button onclick="deleteCartItem(${index})" class="cart-delete-btn">
                        <i class="fas fa-trash"></i>
                    </button>
                </td>
            </tr>
        `;
    });

    container.innerHTML = html;
    
    if (totalElement) {
        totalElement.textContent = `Rp ${totalHarga.toLocaleString('id-ID')}`;
    }

    if (badgeElement) {
        badgeElement.textContent = cart.reduce((sum, item) => sum + (parseInt(item.quantity) || 1), 0);
    }
}

function deleteCartItem(index) {
    let cart = JSON.parse(localStorage.getItem('cart')) || [];
    cart.splice(index, 1);
    localStorage.setItem('cart', JSON.stringify(cart));
    renderCart();
}

function checkout() {
    let cart = JSON.parse(localStorage.getItem('cart')) || [];
    if (cart.length === 0) {
        alert('Keranjang belanja kamu masih kosong!');
        return;
    }

    const alamat = document.querySelector('textarea')?.value;
    const metode = document.querySelector('select')?.value;

    if (!alamat || metode === '-- Pilih Metode --') {
        alert('Harap isi alamat pengiriman dan pilih metode pembayaran terlebih dahulu!');
        return;
    }

    alert('Pesanan berhasil dibuat! Terima kasih banyak.');
    localStorage.removeItem('cart');
    window.location.href = '/orders';
}