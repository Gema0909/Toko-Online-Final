document.addEventListener("DOMContentLoaded", function() {
    const tempatProduk = document.getElementById('tempat-produk');
    const searchForm = document.getElementById('searchForm');
    const searchInput = document.getElementById('searchInput');

    // 1. Tangkap kata kunci dari URL saat pertama kali buka halaman
    const urlParams = new URLSearchParams(window.location.search);
    const initialQuery = urlParams.get('cari') || '';

    if (initialQuery && searchInput) {
        searchInput.value = initialQuery;
    }

    // Load produk pertama kali
    fetchProductsWithAnimation(initialQuery);

    // 2. INTERCEPT FORM SUBMIT (Biar gak reload halaman kaku)
    if (searchForm) {
        searchForm.addEventListener('submit', function(e) {
            e.preventDefault(); // Hentikan reload bawaan browser!
            const query = searchInput.value.trim();

            // Ubah URL di address bar browser secara halus tanpa reload
            const newUrl = query ? `/produk?cari=${encodeURIComponent(query)}` : '/produk';
            window.history.pushState({ path: newUrl }, '', newUrl);

            // Jalankan pencarian animasi
            fetchProductsWithAnimation(query);
        });
    }

    // 3. FUNGSI UTAMA FETCH PRODUK + ANIMASI MULUS
    async function fetchProductsWithAnimation(query = '') {
        if (!tempatProduk) return;

        // TAHAP 1: Animasi Fade-Out data lama
        tempatProduk.classList.add('fade-out');

        // Tunggu transisi fade-out selesai (250ms)
        await new Promise(resolve => setTimeout(resolve, 250));

        // TAHAP 2: Tampilkan Spinner Muter saat panggil API
        tempatProduk.classList.remove('fade-out');
        tempatProduk.innerHTML = `
            <div class="search-loading-state">
                <i class="fas fa-circle-notch fa-spin"></i>
                <p style="font-size: 1.05rem;">Mencari barang impianmu...</p>
            </div>
        `;

        let apiUrl = '/api/products';
        if (query) {
            apiUrl += `?cari=${encodeURIComponent(query)}`;
        }

        try {
            const response = await fetch(apiUrl);
            const products = await response.json();

            tempatProduk.innerHTML = ''; // Clear spinner

            // Jika hasil pencarian kosong
            if (!products || products.length === 0) {
                tempatProduk.innerHTML = `
                    <div class="search-empty-state">
                        <i class="fas fa-box-open"></i>
                        <h3 style="color:#ffffff; margin-bottom: 5px;">Produk Tidak Ditemukan</h3>
                        <p>Tidak ada barang dengan kata kunci "<strong>${query}</strong>". Coba kata kunci lain!</p>
                    </div>
                `;
                return;
            }

            // TAHAP 3: Render produk dengan animasi Pop-In Berurutan (Staggered)
            products.forEach((item, index) => {
                let imageSrc = 'https://placehold.co/400x300/e0e0e0/666666?text=No+Image';
                if (item.image) {
                    if (item.image.startsWith('http') || item.image.startsWith('/')) {
                        imageSrc = item.image;
                    } else {
                        imageSrc = '/static/uploads/' + item.image;
                    }
                }

                const descText = item.description ? item.description : "Tidak ada deskripsi untuk produk ini.";

                // Efek delay berurutan biar kartu muncul satu per satu (0.08s, 0.16s, dst)
                const animationDelay = (index * 0.08).toFixed(2);

                const productCard = `
                    <div class="product-card" style="animation-delay: ${animationDelay}s; display: flex; flex-direction: column; height: 100%; justify-content: space-between;">
                        
                        <img 
                            src="${imageSrc}" 
                            onerror="this.onerror=null; this.src='https://placehold.co/400x300/e0e0e0/666666?text=No+Image';" 
                            alt="${item.name}" 
                            style="width:100%; border-radius:8px 8px 0 0; object-fit: cover; aspect-ratio: 4/3; margin-bottom: 15px;"
                        >
                        
                        <div style="padding: 0 15px 15px 15px; display: flex; flex-direction: column; flex-grow: 1;">
                            <div>
                                <h3 style="margin: 0 0 5px 0; font-size: 1.15rem; color: #ffffff;">${item.name}</h3>
                                <p class="category-tag" style="margin: 0 0 10px 0; font-size: 0.85rem; color: #60a5fa;">
                                    <i class="fas fa-tag"></i> ${item.category}
                                </p>
                                
                                <p class="product-desc" style="margin: 0 0 15px 0;">
                                    <strong style="color: #d1d5db;">Deskripsi:</strong> <br>
                                    ${descText}
                                </p>
                            </div>
                            
                            <div style="margin-top: auto;">
                                <p class="price" style="margin: 0 0 5px 0; font-size: 1.2rem; font-weight: bold; color: #34d399;">
                                    Rp ${item.price.toLocaleString('id-ID')}
                                </p>
                                <p class="stock" style="margin: 0 0 15px 0; font-size: 0.85rem; color: #9ca3af;">
                                    Stok: ${item.stock}
                                </p>
                                <button class="btn-add-cart" onclick="addToCart(${item.id}, '${item.name}', ${item.price})">
                                    <i class="fas fa-cart-plus"></i> Tambah ke Keranjang
                                </button>
                            </div>
                        </div>
                    </div>
                `;
                tempatProduk.innerHTML += productCard;
            });

        } catch (err) {
            tempatProduk.innerHTML = '<p style="text-align:center; color:#f87171; grid-column: 1 / -1;">Gagal memuat produk. Periksa koneksi ke database.</p>';
            console.error("Error fetching products:", err);
        }
    }

    // 4. Mengambil Data User untuk Greeting Navbar
    fetch('/api/user')
        .then(response => response.json())
        .then(data => {
            if(data.logged_in) {
                let namaTampil = data.username;
                if (typeof data.username === 'object' && data.username !== null) {
                    namaTampil = data.username.username || data.username.name || "User";
                }
                const elemGreeting = document.getElementById("user-greeting") || document.getElementById("nama-user");
                if (elemGreeting) {
                    elemGreeting.innerHTML = `<i class="fas fa-user-circle"></i> Hi, ${namaTampil}`;
                }
            }
        })
        .catch(err => console.error("Error fetching user data:", err));
});

// Fungsi Tambah ke Keranjang via API
function addToCart(productId, productName, productPrice) {
    const formData = new FormData();
    formData.append('id', productId);
    formData.append('name', productName);
    formData.append('price', productPrice);

    fetch('/api/cart', {
        method: 'POST',
        body: formData
    })
    .then(response => response.json())
    .then(data => {
        if(data.status === 'success' || data.success) {
            alert(data.message);
            
            const badge = document.querySelector('.cart-badge');
            if (badge) {
                if (data.cart_count !== undefined) {
                    badge.innerText = data.cart_count;
                } else {
                    let angkaSekarang = parseInt(badge.innerText) || 0;
                    badge.innerText = angkaSekarang + 1;
                }
            }
        } else {
            alert(data.message || "Terjadi kesalahan. Silakan login kembali.");
            window.location.href = '/login';
        }
    })
    .catch(err => {
        console.error("Error adding to cart:", err);
        alert("Gagal menambahkan ke keranjang.");
    });
}