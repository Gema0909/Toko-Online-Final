document.addEventListener("DOMContentLoaded", function() {
    const tempatProduk = document.getElementById("tempat-produk");

    // 1. Telepon URL Backend (Flask) kita
    fetch('https://toko-online-final-production.up.railway.app/api/products')
        .then(response => response.json())
        .then(dataProduk => {
            
            // Hapus tulisan "Sedang memuat..."
            tempatProduk.innerHTML = '';

            // Jika database kosong
            if(dataProduk.length === 0) {
                tempatProduk.innerHTML = `
                    <div class="empty-state">
                        <i class="fas fa-folder-open icon-empty"></i>
                        <p>Belum ada produk di database MongoDB.</p>
                    </div>
                `;
                return;
            }

            // 2. Jika ada data, buatkan kotak HTML untuk setiap produk
            dataProduk.forEach(item => {
                
                // Cek status stok
                const stokAman = item.stock > 0;
                const warnaStok = item.stock > 5 ? 'text-green' : 'text-red';
                const formatHarga = new Intl.NumberFormat('id-ID').format(item.price);
                
                // Gambar fallback jika tidak ada gambar
                const gambarProduk = item.image ? `static/images/${item.image}` : 'https://via.placeholder.com/400x300?text=No+Image';

                // Buat kotak produknya
                const kartuProduk = `
                    <div class="product-card group">
                        <span class="category-badge">${item.category}</span>
                        <div class="product-img-wrapper">
                            <img src="${gambarProduk}" alt="${item.name}" class="product-img ${stokAman ? '' : 'grayscale'}">
                        </div>
                        <div class="product-body">
                            <div>
                                <h3 class="product-title">${item.name}</h3>
                                <p class="product-desc">${item.description || 'Tidak ada deskripsi produk.'}</p>
                            </div>
                            <div>
                                <div class="product-meta">
                                    <span class="stock-info">Stok: <span class="${warnaStok}">${item.stock}</span></span>
                                    <div class="price">Rp ${formatHarga}</div>
                                </div>
                                ${
                                    stokAman 
                                    ? `<button onclick="tambahKeKeranjang('${item.name}')" class="btn-buy"><i class="fas fa-cart-plus"></i> Beli</button>` 
                                    : `<button disabled class="btn-disabled">Stok Habis</button>`
                                }
                            </div>
                        </div>
                    </div>
                `;

                // Masukkan ke dalam HTML
                tempatProduk.innerHTML += kartuProduk;
            });
        })
        .catch(error => {
            console.error("Error:", error);
            tempatProduk.innerHTML = '<p class="error-text">Gagal terhubung ke database. Pastikan app.py (Flask) sedang berjalan.</p>';
        });
});

// Fungsi tombol beli (Simulasi sementara)
function tambahKeKeranjang(namaBarang) {
    alert(`"${namaBarang}" berhasil ditambahkan ke keranjang!`);
}