// =========================================================================
// 1B. FUNGSI RIWAYAT PESANAN (LANGKAH KE-2: UNTUK HALAMAN PESANAN SAYA)
// =========================================================================
function loadMyOrders() {
    const ordersGrid = document.getElementById('tempat-pesanan');
    if (!ordersGrid) return; // Keluar jika bukan di halaman orders.html

    // Mengambil data pesanan riil dari API backend Python Anda
    fetch('/api/my-orders') 
        .then(response => {
            if (!response.ok) throw new Error("Gagal memuat data dari server.");
            return response.json();
        })
        .then(data => {
            ordersGrid.innerHTML = ''; // Bersihkan loader dummy

            if (data.length === 0) {
                ordersGrid.innerHTML = `
                    <div class="no-orders" style="text-align: center; padding: 40px; color: #888;">
                        <i class="fas fa-receipt" style="font-size: 48px; margin-bottom: 15px; color: #ccc;"></i>
                        <p>Anda belum pernah melakukan pemesanan.</p>
                    </div>`;
                return;
            }

            data.forEach(order => {
                const formatHarga = (angka) => new Intl.NumberFormat('id-ID').format(angka);
                
                // Urus status badge (Diproses, Selesai, Pending)
                let statusClass = 'badge-pending';
                const statusStr = (order.status || 'Pending').toLowerCase();
                if (statusStr === 'diproses' || statusStr === 'processing') statusClass = 'badge-processing';
                if (statusStr === 'selesai' || statusStr === 'completed') statusClass = 'badge-completed';

                // Urus status pembayaran badge
                let payStatusClass = 'badge-pending';
                const payStatusStr = (order.payment_status || 'Pending').toLowerCase();
                if (payStatusStr === 'lunas' || payStatusStr === 'paid') payStatusClass = 'badge-completed';

                // 1. PERBAIKAN BACA DATA PRODUK (Ubah teks JSON kembali jadi Array/Daftar)
                let parsedItems = [];
                try {
                    parsedItems = typeof order.items === 'string' ? JSON.parse(order.items) : order.items;
                } catch (e) {
                    console.error("Gagal membaca daftar produk:", e);
                }

                // Render list item produk di dalam pesanan tersebut
                let itemsHtml = '';
                if (parsedItems && parsedItems.length > 0) {
                    parsedItems.forEach(item => {
                        // Sesuai dengan nama kunci di sesi keranjang Python ('name' dan 'qty')
                        itemsHtml += `
                            <div class="item-row" style="display: flex; justify-content: space-between; margin-bottom: 5px;">
                                <span>${item.name || item.product_name} <span class="item-qty" style="color: #888;">(${item.qty || item.quantity || 1}x)</span></span>
                                <span>Rp ${formatHarga(item.price)}</span>
                            </div>`;
                    });
                } else {
                    itemsHtml = `<div class="item-row"><span>Tidak ada detail produk</span></div>`;
                }

                const orderCard = document.createElement('div');
                orderCard.className = 'order-card';
                orderCard.innerHTML = `
                    <div class="order-card-header">
                        <div>
                            <span class="order-id">ID PESANAN: #${order.id}</span>
                            <p class="order-date">${order.created_at || order.date || 'Tanggal N/A'}</p>
                        </div>
                        <div>
                            <span class="badge ${statusClass}">${order.status}</span>
                        </div>
                    </div>

                    <div class="order-items" style="border-bottom: 1px solid #334155; padding-bottom: 15px; margin-bottom: 15px;">
                        ${itemsHtml}
                    </div>

                    <div class="order-meta-grid">
                        <div class="meta-details">
                            <span class="meta-label">Alamat Kirim</span>
                            <p class="meta-value">${order.shipping_address || order.address || 'Alamat belum diisi'}</p>
                            
                            <span class="meta-label">Metode Pembayaran</span>
                            <p class="meta-value">${order.payment_method || 'Transfer'}</p>
                            
                            <span class="meta-label">Status Pembayaran</span>
                            <p class="mb-2"><span class="badge ${payStatusClass}">${order.payment_status}</span></p>

                            <!-- 2. PERBAIKAN LINK GAMBAR BUKTI -->
                            ${order.payment_proof ? `
                            <div class="proof-section">
                                <span class="meta-label">Bukti Pembayaran</span>
                                <a href="${order.payment_proof}" target="_blank" class="proof-link">
                                    <i class="fas fa-image"></i> Lihat Bukti Pembayaran
                                </a>
                            </div>` : ''}
                        </div>
                        
                        <div class="order-total-section">
                            <span class="meta-label">Total Bayar:</span>
                            <!-- 3. PERBAIKAN TOTAL BAYAR (order.total_amount) -->
                            <p class="total-price" style="font-size: 1.2rem; font-weight: bold; color: #10b981;">
                                Rp ${formatHarga(order.total_amount || order.total_price || 0)}
                            </p>
                        </div>
                    </div>
                `;
                ordersGrid.appendChild(orderCard);
            });
        })
        .catch(error => {
            console.error('Error loading my orders:', error);
            ordersGrid.innerHTML = `<p class="loading-text" style="color: red;">Gagal mengambil data riwayat pesanan Anda.</p>`;
        });
}

// =========================================================================
// 2. LOGIKA OTOMATIS SAAT HALAMAN SELESAI DIMUAT (DOM CONTENT LOADED)
// =========================================================================
document.addEventListener("DOMContentLoaded", function() {
    
    // 1. PINDAHKAN KE URUTAN PERTAMA
    aturNavigasiOtomatis();

    // 2. BUNGKUS DENGAN TRY-CATCH AGAR KALAU BUKAN HALAMANNYA, SCRIPT TIDAK MACET
    try { 
        loadShopProducts(); 
    } catch (e) { 
        console.log("Bukan halaman toko, skip."); 
    }

    try { 
        loadMyOrders(); 
    } catch (e) { 
        console.log("Bukan halaman pesanan, skip."); 
    }

    try { 
        updateCartBadge(); 
    } catch (e) { 
        console.log("Badge keranjang skip."); 
    }

    // B. Menghilangkan Notifikasi/Alert otomatis setelah 5 detik
    const alerts = document.querySelectorAll('.alert, [role="alert"]');
    alerts.forEach(function(alert) {
        setTimeout(function() {
            alert.style.transition = "opacity 0.5s ease-out";
            alert.style.opacity = "0";
            setTimeout(function() {
                alert.style.display = "none";
                alert.remove();
            }, 500);
        }, 5000);
    });

    // C. Logika Toggle Password (Sesuai dengan id="btnTogglePassword" di login.html Anda)
    const btnToggle = document.getElementById('btnTogglePassword');
    if (btnToggle) {
        btnToggle.addEventListener('click', function() {
            // Dibuat fleksibel mencari id="password" (login) atau id="passwordInput" (register)
            const passwordInput = document.getElementById('password') || document.getElementById('passwordInput');
            const eyeIcon = document.getElementById('eyeIcon');
            
            if (passwordInput && eyeIcon) {
                if (passwordInput.type === 'password') {
                    passwordInput.type = 'text';
                    eyeIcon.classList.remove('fa-eye');
                    eyeIcon.classList.add('fa-eye-slash');
                } else {
                    passwordInput.type = 'password';
                    eyeIcon.classList.remove('fa-eye-slash');
                    eyeIcon.classList.add('fa-eye');
                }
            }
        });
    }

    // D. Simulasi form submit Login (Sesuai id="loginForm" di login.html Anda)
    document.getElementById('loginForm')?.addEventListener('submit', function(e) {
        // e.preventDefault();  // <--- Dinonaktifkan agar form bisa submit beneran
        // alert("Tombol login ditekan! (Versi HTML Statis)"); // <--- Dinonaktifkan
    });

    // E. Simulasi submit form Register
    document.getElementById('registerForm')?.addEventListener('submit', function(e) {
        // e.preventDefault();  // <--- Dinonaktifkan agar form bisa submit beneran
        // alert("Proses pendaftaran akun baru berhasil! (Simulasi HTML Statis)"); // <--- Dinonaktifkan
    });
});

// Fungsi untuk menghitung dan menampilkan jumlah barang di keranjang belanja
function updateCartBadge() {
    const badge = document.getElementById('cart-badge');
    if (!badge) return;

    // Mengambil data keranjang dari localStorage (tempat penyimpanan keranjang di browser)
    const cart = JSON.parse(localStorage.getItem('cart')) || [];
    
    // Menghitung total kuantitas barang
    const totalItems = cart.reduce((total, item) => total + (item.quantity || 1), 0);

    if (totalItems > 0) {
        badge.textContent = totalItems;
        badge.style.display = 'inline-block'; // Tampilkan badge merah jika ada barang
    } else {
        badge.style.display = 'none'; // Sembunyikan jika keranjang kosong
    }
}

function aturNavigasiOtomatis() {
    const navLinksContainer = document.querySelector('.nav-links');
    if (!navLinksContainer) return;

    // Cek apakah URL diawali dengan /admin
    if (window.location.pathname.toLowerCase().startsWith('/admin')) {
        
        // =========================================================================
        // TAMPILKAN MENU KHUSUS ADMIN (Menggunakan rute backend asli Anda)
        // =========================================================================
        navLinksContainer.innerHTML = `
            <span class="nav-greeting">Hi, Admin</span>
            
            <a href="/admin" class="nav-link">
                <i class="fas fa-chart-line"></i> Dashboard
            </a>
            
            <a href="/admin" class="nav-link text-blue">
                <i class="fas fa-boxes"></i> Kelola Produk
            </a>
            
            <a href="/admin" class="nav-link text-purple">
                <i class="fas fa-history"></i> Pesanan Masuk
            </a>
            
            <a href="/login" class="nav-link text-red logout-btn">
                <i class="fas fa-sign-out-alt"></i>
            </a>
        `;
        
    } else {
        // =========================================================================
        // UNTUK HALAMAN USER BIASA (Misal: /, /shop, /cart, dll)
        // =========================================================================
        const badge = navLinksContainer.querySelector('.cart-badge');
        if (badge) {
            badge.setAttribute('id', 'cart-badge');
            
            if (typeof updateCartBadge === 'function') {
                updateCartBadge();
            }
        }
    }
}

document.addEventListener("DOMContentLoaded", function() {
    const greetingEl = document.getElementById("user-greeting");
    
    // Jika elemen ditemukan di halaman tersebut
    if (greetingEl) {
        fetch('/api/current_user')
            .then(response => response.json())
            .then(data => {
                // Ubah teksnya menjadi Hi, (Nama User)
                greetingEl.innerHTML = `<i class="fas fa-user"></i> Hi, ${data.username}`;
            })
            .catch(error => console.error("Gagal mengambil data user:", error));
    }
});