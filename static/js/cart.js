document.addEventListener('DOMContentLoaded', function () {
    renderCart();
    setupPaymentMethodListener();
    setupCheckoutListener();
});

// 1. FUNGSI UNTUK MERENDER PRODUK DARI LOCALSTORAGE KE TABEL HTML
function renderCart() {
    let cart = JSON.parse(localStorage.getItem('cart')) || [];
    const container = document.getElementById('cart-items-container');
    const totalElement = document.getElementById('cart-total-price');
    const badgeElement = document.querySelector('.cart-badge');

    if (!container) return;

    // Jika keranjang kosong
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

    // Masukkan data barang ke baris tabel
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
                <td class="cart-qty-cell text-center">
                    ${itemQty}x
                </td>
                <td class="cart-subtotal-cell text-right">
                    Rp ${subtotal.toLocaleString('id-ID')}
                </td>
                <td class="cart-action-cell text-center">
                    <button onclick="deleteCartItem(${index})" class="cart-delete-btn">
                        <i class="fas fa-trash"></i>
                    </button>
                </td>
            </tr>
        `;
    });

    container.innerHTML = html;
    
    // Update nominal total harga belanja
    if (totalElement) {
        totalElement.textContent = `Rp ${totalHarga.toLocaleString('id-ID')}`;
    }

    // Update angka badge di navbar
    if (badgeElement) {
        badgeElement.textContent = cart.reduce((sum, item) => sum + (parseInt(item.quantity) || 1), 0);
    }
}

// 2. FUNGSI UNTUK MENGHAPUS BARANG DARI KERANJANG
function deleteCartItem(index) {
    let cart = JSON.parse(localStorage.getItem('cart')) || [];
    cart.splice(index, 1); // Hapus 1 data sesuai urutan index
    localStorage.setItem('cart', JSON.stringify(cart));
    renderCart(); // Tampilkan ulang tabel terbaru
}

// 3. FUNGSI UNTUK REVEL/HIDE DETAIL TRANSFER BANK DAN QRIS SECARA OTOMATIS
function setupPaymentMethodListener() {
    const paymentMethodSelect = document.getElementById('payment_method');
    const paymentInfoDiv = document.getElementById('payment_info');
    const proofDiv = document.getElementById('proof_div');
    const proofInput = document.getElementById('payment_proof');
    const paymentText = document.getElementById('payment_text');

    if (!paymentMethodSelect || !paymentInfoDiv) return;

    paymentMethodSelect.addEventListener('change', function() {
        const method = this.value;
        if (!method) {
            paymentInfoDiv.classList.add('hidden');
            proofInput.removeAttribute('required');
            return;
        }

        paymentInfoDiv.classList.remove('hidden');

        if (method === 'COD') {
            proofDiv.classList.add('hidden');
            proofInput.removeAttribute('required');
            paymentText.textContent = "Silakan siapkan uang tunai yang pas saat kurir mengantarkan paket ke rumah Anda.";
        } else {
            proofDiv.classList.remove('hidden');
            proofInput.setAttribute('required', 'required'); // Wajib upload bukti jika bukan COD
            
            if (method === 'BCA') {
                paymentText.textContent = "Silakan transfer ke Rekening BCA: 123-456-7890 a/n Gema Store.";
            } else if (method === 'BRI') {
                paymentText.textContent = "Silakan transfer ke Rekening BRI: 9876-01-0001-53-1 a/n Gema Store.";
            } else if (method === 'Mandiri') {
                paymentText.textContent = "Silakan transfer ke Rekening Mandiri: 157-00-012345-7 a/n Gema Store.";
            } else if (method === 'QRIS') {
                paymentText.textContent = "Scan kode QRIS resmi Gema Store yang tercetak di meja kasir Anda.";
            }
        }
    });
}

// 4. FUNGSI UNTUK PROSES CHECKOUT DAN KIRIM DATA KE BACKEND (FLASK)
function setupCheckoutListener() {
    const checkoutForm = document.getElementById('checkoutForm');
    if (!checkoutForm) return;

    checkoutForm.addEventListener('submit', function(e) {
        e.preventDefault();

        let cart = JSON.parse(localStorage.getItem('cart')) || [];
        if (cart.length === 0) {
            alert('Keranjang belanja Anda masih kosong!');
            return;
        }

        // Siapkan data form dan file untuk dikirim via AJAX ke Flask
        const formData = new FormData(this);
        formData.append('cart_items', JSON.stringify(cart));

        // Melakukan request POST ke backend Flask
        fetch('/checkout', {
            method: 'POST',
            body: formData
        })
        .then(response => response.json().then(data => ({ status: response.status, body: data })))
        .then(res => {
            if (res.status === 200 || res.body.success) {
                alert('Pesanan berhasil dibuat! Terima kasih banyak.');
                localStorage.removeItem('cart'); // Kosongkan localStorage setelah sukses
                window.location.href = '/orders'; // Redirect ke daftar pesanan
            } else {
                alert('Gagal membuat pesanan: ' + (res.body.message || 'Terjadi kesalahan.'));
            }
        })
        .catch(err => {
            console.error('Error saat checkout:', err);
            alert('Terjadi kendala koneksi ke server saat memproses pesanan.');
        });
    });
}