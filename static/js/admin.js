// Fungsi untuk mengambil data produk dari database dan menampilkannya di tabel
function loadAdminProducts() {
    const tableBody = document.getElementById('admin-product-list');
    
    fetch('/api/products')
        .then(response => response.json())
        .then(data => {
            // Kosongkan pesan "Sedang memuat..."
            tableBody.innerHTML = '';

            // Jika database kosong
            if (data.length === 0) {
                tableBody.innerHTML = `<tr><td colspan="5" class="text-center">Belum ada produk di database.</td></tr>`;
                return;
            }

            // Looping/Ulangi untuk setiap produk yang ada di database
            data.forEach(product => {
                // Format harga ke Rupiah
                const formatHarga = new Intl.NumberFormat('id-ID').format(product.price);
                
                // Hindari error jika deskripsi kosong (null)
                const desc = product.description ? product.description : '';
                const category = product.category ? product.category : '-';

                // Buat baris tabel baru (tr)
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td class="font-bold">${product.name}</td>
                    <td>${category}</td>
                    <td class="text-right text-green font-bold">${formatHarga}</td>
                    <td class="text-center">${product.stock}</td>
                    <td class="text-center action-btns">
                        <button class="btn-icon text-blue" onclick="openEditModal('${product.name}', '${category}', '${product.price}', '${product.stock}', '${desc}')">
                            <i class="fas fa-edit"></i>
                        </button>
                        
                        <button class="btn-icon text-red" onclick="deleteProduct(${product.id}, '${product.name}')">
                            <i class="fas fa-trash"></i>
                        </button>
                    </td>
                `;
                tableBody.appendChild(row);
            });
        })
        .catch(error => {
            console.error('Error fetching products:', error);
            tableBody.innerHTML = `<tr><td colspan="5" class="text-center text-red">Gagal memuat data produk!</td></tr>`;
        });
}

// Panggil fungsi secara otomatis saat halaman Admin pertama kali dibuka
document.addEventListener('DOMContentLoaded', () => {
    loadAdminProducts();
});