document.addEventListener('DOMContentLoaded', function () {
    fetchAndRenderCart(); // Ganti fungsi pemanggilan awal
    setupPaymentMethodListener();
    setupCheckoutListener();
});

// 1. FUNGSI UNTUK MERENDER PRODUK DARI BACKEND PYTHON (BUKAN LOCALSTORAGE)
function fetchAndRenderCart() {
    // Kita ambil data dari session Python (lewat API endpoint khusus keranjang)
    fetch('/api/get_cart')
        .then(response => response.json())
        .then(data => {
            renderCartItems(data.cart || []);
        })
        .catch(err => {
            console.error("Gagal mengambil data keranjang:", err);
            renderCartItems([]); // Tampilkan kosong jika gagal
        });
}

// Fungsi pembantu untuk menggambar tabel
function renderCartItems(cart) {
    const container = document.getElementById('cart-items-container');
    const totalElement = document.getElementById('cart-total-price');
    const badgeElement = document.querySelector('.cart-badge');

    if (!container) return;

    if (cart.length === 0) {
        container.innerHTML = `
            <tr>
                <td colspan="4" class="cart-empty-cell" style="text-align: center; padding: 20px;">
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
    
    // Asumsikan jumlah selalu 1 kecuali ada atribut qty
    cart.forEach((item, index) => {
        const itemPrice = parseInt(item.price) || 0;
        const itemQty = parseInt(item.qty) || 1; 
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
                    <button onclick="deleteCartItemBackend(${index})" class="cart-delete-btn">
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
        badgeElement.textContent = cart.reduce((sum, item) => sum + (parseInt(item.qty) || 1), 0);
    }
}

// 2. FUNGSI UNTUK MENGHAPUS BARANG DARI KERANJANG (VIA BACKEND)
function deleteCartItemBackend(index) {
    if (!confirm('Hapus barang ini dari keranjang?')) return;
    
    fetch(`/api/cart/remove/${index}`, {
        method: 'POST'
    })
    .then(response => response.json())
    .then(data => {
        if(data.success) {
            fetchAndRenderCart(); // Refresh otomatis tampilannya
        } else {
            alert(data.message);
        }
    })
    .catch(err => console.error("Error menghapus item:", err));
}

// 3. FUNGSI UNTUK REVEL/HIDE DETAIL TRANSFER BANK DAN QRIS SECARA OTOMATIS
function setupPaymentMethodListener() {
    const paymentMethodSelect = document.getElementById('payment_method');
    const paymentInfoDiv = document.getElementById('payment_info');
    const proofDiv = document.getElementById('proof_div');
    const proofInput = document.getElementById('payment_proof');
    const paymentText = document.getElementById('payment_text');
    const qrisImage = document.getElementById('qris_image'); // Tambahkan penangkap elemen gambar QRIS

    if (!paymentMethodSelect || !paymentInfoDiv) return;

    paymentMethodSelect.addEventListener('change', function() {
        const method = this.value;
        
        // 1. Sembunyikan semua info jika belum ada metode yang dipilih
        if (!method) {
            paymentInfoDiv.classList.add('hidden');
            proofInput.removeAttribute('required');
            if (qrisImage) qrisImage.classList.add('hidden');
            return;
        }

        // 2. Munculkan kotak info pembayaran
        paymentInfoDiv.classList.remove('hidden');
        
        // Sembunyikan gambar QRIS secara default setiap kali ganti pilihan (biar tidak bocor ke menu bank lain)
        if (qrisImage) qrisImage.classList.add('hidden'); 

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
                paymentText.textContent = "Silakan scan kode QRIS Gema Store di bawah ini menggunakan aplikasi M-Banking atau e-Wallet Anda:";
                // Munculkan gambarnya khusus di pilihan QRIS ini!
                if (qrisImage) qrisImage.classList.remove('hidden'); 
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

        // Kita tidak mengirim cart_items dari localStorage lagi, 
        // karena backend sudah punya datanya di session
        const formData = new FormData(this);

        fetch('/checkout', {
            method: 'POST',
            body: formData
        })
        .then(response => response.json())
        .then(res => {
            if (res.success) {
                alert('Pesanan berhasil dibuat! Terima kasih banyak.');
                window.location.href = '/orders'; 
            } else {
                alert('Gagal membuat pesanan: ' + (res.message || 'Terjadi kesalahan.'));
            }
        })
        .catch(err => {
            console.error('Error saat checkout:', err);
            alert('Terjadi kendala koneksi ke server saat memproses pesanan.');
        });
    });
}