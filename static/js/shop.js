document.addEventListener("DOMContentLoaded", function() {
    const tempatProduk = document.getElementById('tempat-produk');
    const searchInput = document.getElementById('searchInput');

    // 1. Tangkap kata kunci pencarian dari URL (misal: ?cari=asus)
    const urlParams = new URLSearchParams(window.location.search);
    const cariQuery = urlParams.get('cari');

    // 2. Pertahankan teks di kotak input jika ada pencarian
    if (cariQuery && searchInput) {
        searchInput.value = cariQuery;
    }

    // 3. Susun URL API (kirim parameter ?cari=... ke backend jika user mencari)
    let apiUrl = '/api/products';
    if (cariQuery) {
        apiUrl += `?cari=${encodeURIComponent(cariQuery)}`;
    }

    // 4. Mengambil data produk dari database via API
    fetch(apiUrl)
        .then(response => response.json())
        .then(products => {
            tempatProduk.innerHTML = ''; // Hapus teks loading

            // Jika produk kosong / tidak ditemukan
            if (!products || products.length === 0) {
                if (cariQuery) {
                    tempatProduk.innerHTML = `<p style="text-align:center; color:#9ca3af; grid-column: 1 / -1;">Tidak ditemukan produk dengan kata kunci "<strong>${cariQuery}</strong>".</p>`;
                } else {
                    tempatProduk.innerHTML = '<p style="text-align:center; color:#9ca3af; grid-column: 1 / -1;">Belum ada produk di database.</p>';
                }
                return;
            }

            // Merender HTML menggunakan JavaScript murni
            products.forEach(item => {
                
                // Logika Gambar
                let imageSrc = 'https://placehold.co/400x300/e0e0e0/666666?text=No+Image';
                if (item.image) {
                    if (item.image.startsWith('http') || item.image.startsWith('/')) {
                        imageSrc = item.image; 
                    } else {
                        imageSrc = '/static/uploads/' + item.image; 
                    }
                }

                // Logika Deskripsi
                const descText = item.description ? item.description : "Tidak ada deskripsi untuk produk ini.";

                // Template Kartu HTML
                const productCard = `
                    <div class="product-card" style="display: flex; flex-direction: column; height: 100%; justify-content: space-between;">
                        
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
        })
        .catch(err => {
            tempatProduk.innerHTML = '<p style="text-align:center; color:#f87171; grid-column: 1 / -1;">Gagal memuat produk. Periksa koneksi ke database.</p>';
            console.error("Error fetching products:", err);
        });

    // 5. Mengambil Data User untuk Greeting Navbar
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