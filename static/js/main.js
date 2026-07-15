// =========================================================================
// 1. FUNGSI PRODUK (UNTUK HALAMAN UTAMA / SHOP)
// =========================================================================
function loadShopProducts() {
    const productGrid = document.getElementById('tempat-produk');
    if (!productGrid) return; // Keluar dari fungsi jika bukan di halaman toko

    fetch('/api/products')
        .then(response => response.json())
        .then(data => {
            productGrid.innerHTML = ''; // Bersihkan text loading

            if (data.length === 0) {
                productGrid.innerHTML = `<p class="loading-text">Belum ada produk yang dipajang di toko.</p>`;
                return;
            }

            data.forEach(product => {
                const formatHarga = new Intl.NumberFormat('id-ID').format(product.price);
                
                // INTELLIGENT IMAGE PATH: Mencegah gambar rusak/pecah akibat perbedaan format DB
                let imageSrc = 'https://placehold.co/300x300?text=Tidak+Ada+Gambar';
                if (product.image) {
                    imageSrc = product.image.startsWith('http') || product.image.startsWith('/static') 
                        ? product.image 
                        : `/static/uploads/${product.image}`;
                }

                const productCard = document.createElement('div');
                productCard.className = 'product-card';
                productCard.innerHTML = `
                    <div class="product-image-wrapper">
                        <img src="${imageSrc}" alt="${product.name}" class="product-image" onerror="this.src='https://placehold.co/300x300?text=Gambar+Tidak+Ditemukan'">
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
// 2. LOGIKA OTOMATIS SAAT HALAMAN SELESAI DIMUAT (DOM CONTENT LOADED)
// =========================================================================
document.addEventListener("DOMContentLoaded", function() {
    
    // A. Jalankan penarikan produk untuk halaman toko pembeli
    loadShopProducts();

    // B. Menghilangkan Notifikasi/Alert bawaan sistem setelah 5 detik
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

    // C. Logika Toggle Password (Ikon Mata Intip di Halaman Login)
    const btnToggle = document.getElementById('btnTogglePassword');
    if (btnToggle) {
        btnToggle.addEventListener('click', function() {
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

    // D. KODE LOGIN REAL: Menghubungkan langsung Form Input ke Python & Database
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', function(e) {
            e.preventDefault(); // Kunci halaman agar tidak berkedip/refresh saat submit
            
            const formData = new FormData(this);
            
            // Tembak data langsung ke API Login milik Python backend Anda
            fetch('/api/login', {
                method: 'POST',
                body: formData
            })
            .then(response => response.json())
            .then(data => {
                // Mendukung pembacaan objek sukses bawaan backend
                if (data.success || data.id || (data.role)) {
                    alert("Login Berhasil! Mengalihkan ke halaman utama...");
                    
                    // Arahkan otomatis sesuai dengan tingkatan peran (role) dari database
                    if (data.role === 'admin') {
                        window.location.href = '/admin';
                    } else {
                        window.location.href = '/'; // Ke halaman berbelanja user biasa
                    }
                } else {
                    alert("Gagal Masuk: " + (data.message || "Username atau password Anda salah."));
                }
            })
            .catch(error => {
                console.error("Error Sistem Login:", error);
                alert("Terjadi kegagalan komunikasi dengan server database.");
            });
        });
    }

    // E. Simulasi submit form Register
    document.getElementById('registerForm')?.addEventListener('submit', function(e) {
        e.preventDefault(); 
        alert("Proses pendaftaran akun baru berhasil! (Simulasi HTML Statis)");
    });
});