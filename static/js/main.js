// =========================================================================
// 1. FUNGSI PRODUK (UNTUK HALAMAN UTAMA / SHOP)
// =========================================================================
function loadShopProducts() {
    const productGrid = document.getElementById('tempat-produk');
    if (!productGrid) return; // Keluar dari fungsi jika bukan di halaman shop

    fetch('/api/products')
        .then(response => response.json())
        .then(data => {
            productGrid.innerHTML = ''; // Kosongkan tulisan loading

            if (data.length === 0) {
                productGrid.innerHTML = `<p class="loading-text">Belum ada produk yang dipajang di toko.</p>`;
                return;
            }

            data.forEach(product => {
                const formatHarga = new Intl.NumberFormat('id-ID').format(product.price);
                // Memastikan alamat gambar mengarah ke folder static/uploads jika berupa nama file biasa
                let imageSrc = 'https://placehold.co/300x300?text=Tidak+Ada+Gambar';
                if (product.image) {
                    if (product.image.startsWith('http') || product.image.startsWith('/')) {
                        imageSrc = product.image; // Jika sudah berupa link utuh atau path absolut
                    } else {
                        imageSrc = '/static/uploads/' + product.image; // Jika hanya nama file (misal: gambar.jpg)
                    }
                }
                const productCard = document.createElement('div');
                productCard.className = 'product-card';
                productCard.innerHTML = `
                    <div class="product-image-wrapper">
                        <img src="${imageSrc}" alt="${product.name}" class="product-image" onerror="this.src='https://placehold.co/300x300?text=Gambar+Rusak'">
                    </div>
                    <div class="product-info">
                        <span class="product-tag">${product.category || 'Umum'}</span>
                        <h3 class="product-name">${product.name}</h3>
                        <p class="product-price">Rp ${formatHarga}</p>
                        <button class="btn-cart" onclick="addToCart(${product.id}, '${product.name}', ${product.price})">
                            <i class="fas fa-shopping-cart"></i> Keranjang
                        </button>
                    </div>
                `;
                productGrid.appendChild(productCard);
            });
        })
        .catch(error => {
            console.error('Error loading shop products:', error);
            productGrid.innerHTML = `<p class="loading-text" style="color: red;">Gagal mengambil data produk.</p>`;
        });
}

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

                // Render list item produk di dalam pesanan tersebut
                let itemsHtml = '';
                if (order.items && Array.isArray(order.items)) {
                    order.items.forEach(item => {
                        itemsHtml += `
                            <div class="item-row">
                                <span>${item.product_name} <span class="item-qty">(${item.quantity}x)</span></span>
                                <span>Rp ${formatHarga(item.price)}</span>
                            </div>`;
                    });
                } else {
                    // Fallback jika backend mengirim struktur data datar/single-item
                    itemsHtml = `
                        <div class="item-row">
                            <span>${order.product_name || 'Produk'} <span class="item-qty">(${order.quantity || 1}x)</span></span>
                            <span>Rp ${formatHarga(order.price || order.total_price)}</span>
                        </div>`;
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

                    <div class="order-items">
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

                            ${order.payment_proof ? `
                            <div class="proof-section">
                                <span class="meta-label">Bukti Pembayaran</span>
                                <a href="/static/uploads/${order.payment_proof}" target="_blank" class="proof-link">
                                    <i class="fas fa-image"></i> Lihat Bukti Pembayaran
                                </a>
                            </div>` : ''}
                        </div>
                        
                        <div class="order-total-section">
                            <span class="meta-label">Total Bayar:</span>
                            <p class="total-price">Rp ${formatHarga(order.total_price || order.total)}</p>
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
        e.preventDefault(); 
        alert("Tombol login ditekan! (Versi HTML Statis)");
    });

    // E. Simulasi submit form Register
    document.getElementById('registerForm')?.addEventListener('submit', function(e) {
        e.preventDefault(); 
        alert("Proses pendaftaran akun baru berhasil! (Simulasi HTML Statis)");
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
            
            <a href="/admin/dashboard" class="nav-link">
                <i class="fas fa-chart-line"></i> Dashboard
            </a>
            
            <a href="/admin/products" class="nav-link text-blue">
                <i class="fas fa-boxes"></i> Kelola Produk
            </a>
            
            <a href="/admin/orders" class="nav-link text-purple">
                <i class="fas fa-history"></i> Pesanan Masuk
            </a>
            
            <a href="/logout" class="nav-link text-red logout-btn">
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