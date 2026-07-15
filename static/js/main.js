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
                const imageSrc = product.image ? product.image : 'https://placehold.co/300x300?text=Tidak+Ada+Gambar';

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
// 2. LOGIKA UTOMATIS SAAT HALAMAN SELESAI DIMUAT (DOM CONTENT LOADED)
// =========================================================================
document.addEventListener("DOMContentLoaded", function() {
    
    // A. Jalankan penarikan produk untuk halaman toko
    loadShopProducts();

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