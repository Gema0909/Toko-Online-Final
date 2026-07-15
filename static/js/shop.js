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

            // Merender HTML menggunakan JavaScript murni (Tanpa Jinja)
            products.forEach(item => {
                
                // 1. LOGIKA GAMBAR (DIAMBIL DARI main.js AGAR GAMBAR MUNCUL)
                let imageSrc = 'https://placehold.co/400x300/e0e0e0/666666?text=No+Image';
                if (item.image) {
                    if (item.image.startsWith('http') || item.image.startsWith('/')) {
                        imageSrc = item.image; 
                    } else {
                        imageSrc = '/static/uploads/' + item.image; 
                    }
                }

                // 2. LOGIKA DESKRIPSI
                const descText = item.description ? item.description : "Tidak ada deskripsi untuk produk ini.";

                // 3. HTML DIKEMBALIKAN KE STRUKTUR ASLI (Tanpa div product-info)
                const productCard = `
                    <div class="product-card">
                        <img 
                            src="${imageSrc}" 
                            onerror="this.onerror=null; this.src='https://placehold.co/400x300/e0e0e0/666666?text=No+Image';" 
                            alt="${item.name}" 
                            style="width:100%; border-radius:8px; object-fit: cover; aspect-ratio: 4/3; margin-bottom: 10px;"
                        >
                        <h3>${item.name}</h3>
                        <p class="category-tag"><i class="fas fa-tag"></i> ${item.category}</p>
                        
                        <p class="product-desc">${descText}</p>
                        
                        <p class="price">Rp ${item.price.toLocaleString('id-ID')}</p>
                        <p class="stock">Stok: ${item.stock}</p>
                        
                        <button class="btn-add-cart" onclick="addToCart(${item.id})">
                            <i class="fas fa-cart-plus"></i> Tambah
                        </button>
                    </div>
                `;
                tempatProduk.innerHTML += productCard;
            });
        })

// Fungsi untuk menambah ke keranjang via API
function addToCart(productId) {
    const formData = new FormData();
    formData.append('product_id', productId);

    fetch('/api/cart/add', {
        method: 'POST',
        body: formData
    })
    .then(response => response.json())
    .then(data => {
        if(data.status === 'success') {
            alert(data.message);
            // Update angka keranjang secara langsung
            document.querySelector('.cart-badge').innerText = data.cart_count;
        } else {
            alert("Terjadi kesalahan. Silakan login kembali.");
            window.location.href = '/login';
        }
    });
}