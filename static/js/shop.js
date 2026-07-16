document.addEventListener("DOMContentLoaded", function() {
    const tempatProduk = document.getElementById('tempat-produk');
    const cartBadge = document.querySelector('.cart-badge');

    // Mengambil data produk dari database via API
    fetch('/api/products')
        .then(response => response.json())
        .then(products => {
            tempatProduk.innerHTML = ''; // Hapus teks loading
            
            if(products.length === 0) {
                tempatProduk.innerHTML = '<p>Belum ada produk di database.</p>';
                return;
            }

            // Merender HTML menggunakan JavaScript murni
            products.forEach(item => {
                
                // 1. Logika Gambar
                let imageSrc = 'https://placehold.co/400x300/e0e0e0/666666?text=No+Image';
                if (item.image) {
                    if (item.image.startsWith('http') || item.image.startsWith('/')) {
                        imageSrc = item.image; 
                    } else {
                        imageSrc = '/static/uploads/' + item.image; 
                    }
                }

                // 2. Logika Deskripsi
                const descText = item.description ? item.description : "Tidak ada deskripsi untuk produk ini.";

                // 3. Template Kartu HTML (Teks Diberi Jarak / Padding)
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
            // Jika ada error jaringan/database, tampilkan pesan ini
            tempatProduk.innerHTML = '<p style="text-align:center; color:#f87171;">Gagal memuat produk. Periksa koneksi ke database.</p>';
            console.error("Error fetching products:", err);
        });
});

// Fungsi untuk menambah ke keranjang via API
function addToCart(productId, productName, productPrice) { // 1. Tambah parameter di sini
    const formData = new FormData();
    formData.append('id', productId);       // 2. Ubah 'product_id' jadi 'id'
    formData.append('name', productName);   // 3. Tambah baris ini
    formData.append('price', productPrice); // 4. Tambah baris ini

    fetch('/api/cart', {                    // 5. Ubah '/api/cart/add' jadi '/api/cart'
        method: 'POST',
        body: formData
    })
    .then(response => response.json())
    .then(data => {
        // --- BAGIAN BAWAH INI SAMA PERSIS, TIDAK ADA YANG DIHAPUS ---
        if(data.status === 'success' || data.success) { // Tambah '|| data.success' untuk jaga-jaga
            alert(data.message);
            
            // Update angka keranjang secara langsung
            const badge = document.querySelector('.cart-badge');
            if (badge) {
                // 👇 PENYESUAIAN AMAN:
                // Jika backend mengirim data jumlah keranjang, kita pakai itu.
                // Jika tidak mengirim (seperti di main.py kamu), kita tambah 1 angka secara manual di layar.
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

document.addEventListener("DOMContentLoaded", function() {
    fetch('/api/user')
    .then(response => response.json())
    .then(data => {
        if(data.logged_in) {
            document.getElementById("nama-user").innerText = "Hi, " + data.username;
        }
    })
    .catch(err => console.error("Error:", err));
});