// Variabel global untuk menyimpan data produk yang sedang aktif
let allProducts = [];

// ==========================================
// 1. MEMUAT DATA STATISTIK (REVENUE & TOTAL)
// ==========================================
function loadAdminStats() {
    fetch('/api/admin/stats')
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                const formatRevenue = new Intl.NumberFormat('id-ID').format(data.total_revenue);
                document.getElementById('stat-revenue').innerText = `Rp ${formatRevenue}`;
                document.getElementById('stat-orders').innerText = `${data.total_orders} Transaksi`;
            }
        })
        .catch(err => console.error("Gagal memuat statistik admin:", err));
}

// ==========================================
// 2. MEMUAT DAFTAR ANTREAN PESANAN
// ==========================================
function loadAdminOrders() {
    const orderListContainer = document.getElementById('admin-order-list');
    
    fetch('/api/admin/orders')
        .then(response => response.json())
        .then(orders => {
            orderListContainer.innerHTML = '';

            if (orders.length === 0) {
                orderListContainer.innerHTML = `<p class="text-center text-gray" style="padding: 15px;">Belum ada antrean pesanan masuk dari pembeli.</p>`;
                return;
            }

            orders.forEach(order => {
                const formatTotal = new Intl.NumberFormat('id-ID').format(order.total_price);
                const paymentStatusClass = order.payment_status === 'Lunas' ? 'text-green font-bold' : 'text-red font-bold';
                
                const sPending = order.status === 'Pending' ? 'selected' : '';
                const sDiproses = order.status === 'Diproses' ? 'selected' : '';
                const sDikirim = order.status === 'Dikirim' ? 'selected' : '';
                const sSelesai = order.status === 'Selesai' ? 'selected' : '';

                const orderItem = document.createElement('div');
                orderItem.className = 'order-item';
                orderItem.innerHTML = `
                    <div class="order-header">
                        <div>
                            <p class="order-id">Pesanan #${order.id} (User ID: ${order.user_id})</p>
                            <p class="order-date">${order.created_at}</p>
                        </div>
                        <div class="status-form">
                            <select class="status-select" id="status-select-${order.id}">
                                <option value="Pending" ${sPending}>Pending</option>
                                <option value="Diproses" ${sDiproses}>Diproses</option>
                                <option value="Dikirim" ${sDikirim}>Dikirim</option>
                                <option value="Selesai" ${sSelesai}>Selesai</option>
                            </select>
                            <button type="button" class="btn-sm btn-blue" onclick="updateOrderStatus(${order.id})">Update</button>
                        </div>
                    </div>
                    
                    <div class="order-products">
                        ${order.products_summary || 'Detail barang tidak tersedia'}
                    </div>
                    
                    <div class="order-details">
                        <p><b>Alamat:</b> ${order.address}</p>
                        <p><b>Metode Pembayaran:</b> ${order.payment_method}</p>
                        <p><b>Status Pembayaran:</b> <span class="${paymentStatusClass}">${order.payment_status}</span></p>
                    </div>
                    <p class="order-total">Total: Rp ${formatTotal}</p>
                `;
                orderListContainer.appendChild(orderItem);
            });
        })
        .catch(err => {
            console.error("Gagal memuat antrean pesanan:", err);
            orderListContainer.innerHTML = `<p class="text-center text-red">Gagal memuat daftar pesanan.</p>`;
        });
}

// ==========================================
// 3. MENGUBAH STATUS PENGIRIMAN PESANAN
// ==========================================
function updateOrderStatus(orderId) {
    const selectElement = document.getElementById(`status-select-${orderId}`);
    const updatedStatus = selectElement.value;

    fetch(`/api/admin/orders/${orderId}/status`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: updatedStatus })
    })
    .then(response => response.json())
    .then(data => {
        alert(data.message);
        loadAdminOrders();
    })
    .catch(err => {
        console.error("Gagal merubah status pesanan:", err);
        alert("Gagal memperbarui status transaksi.");
    });
}

// ==========================================
// 4. MEMUAT DATA UTAMA KATALOG PRODUK
// ==========================================
function loadAdminProducts() {
    const tableBody = document.getElementById('admin-product-list');
    
    fetch('/api/products')
        .then(response => response.json())
        .then(data => {
            allProducts = data; // Simpan ke variabel global
            tableBody.innerHTML = '';

            if (data.length === 0) {
                tableBody.innerHTML = `<tr><td colspan="5" class="text-center">Belum ada produk di database.</td></tr>`;
                return;
            }

            data.forEach(product => {
                const formatHarga = new Intl.NumberFormat('id-ID').format(product.price);
                const category = product.category ? product.category : '-';

                const row = document.createElement('tr');
                row.innerHTML = `
                    <td class="font-bold">${product.name}</td>
                    <td>${category}</td>
                    <td class="text-right text-green font-bold">${formatHarga}</td>
                    <td class="text-center">${product.stock}</td>
                    <td class="text-center action-btns">
                        <button class="btn-icon text-blue" onclick="openEditModal(${product.id})">
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

// ==========================================
// 5. MEMBUKA MODAL EDIT & COCOKKAN DATA
// ==========================================
function openEditModal(productId) {
    // Cari data produk di dalam array allProducts berdasarkan ID-nya
    const product = allProducts.find(p => p.id === productId);
    if (!product) return;

    // Isi formulir modal dengan data asli dari database
    document.getElementById('edit_id').value = product.id;
    document.getElementById('edit_name').value = product.name;
    document.getElementById('edit_category').value = product.category || '';
    document.getElementById('edit_price').value = product.price;
    document.getElementById('edit_stock').value = product.stock;
    document.getElementById('edit_description').value = product.description || '';

    // Tampilkan modal ke layar
    document.getElementById('editModal').classList.remove('hidden');
}

function closeEditModal() {
    document.getElementById('editModal').classList.add('hidden');
}

// ==========================================
// 6. MENYIMPAN PERUBAHAN EDIT KE DATABASE (API CALL)
// ==========================================
function saveProductEdit() {
    const id = document.getElementById('edit_id').value;
    const name = document.getElementById('edit_name').value;
    const category = document.getElementById('edit_category').value;
    const price = document.getElementById('edit_price').value;
    const stock = document.getElementById('edit_stock').value;
    const description = document.getElementById('edit_description').value;

    if (!name || !price || !stock) {
        alert("Nama, Harga, dan Stok wajib diisi!");
        return;
    }

    // Mengirim data perubahan menggunakan metode PUT
    fetch(`/api/products/${id}`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            name: name,
            category: category,
            price: price,
            stock: stock,
            description: description
        })
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            alert(data.message);
            closeEditModal();      // Tutup modal edit
            loadAdminProducts();   // Segarkan isi tabel katalog admin
        } else {
            alert("Gagal memperbarui produk: " + data.message);
        }
    })
    .catch(error => {
        console.error("Error:", error);
        alert("Terjadi kesalahan sistem saat memperbarui produk.");
    });
}

// ==========================================
// 7. MENGHAPUS PRODUK DARI DATABASE
// ==========================================
function deleteProduct(productId, productName) {
    if (confirm(`Apakah Anda yakin ingin menghapus produk "${productName}"?`)) {
        fetch(`/api/products/${productId}`, { method: 'DELETE' })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                alert(data.message);
                loadAdminProducts();
            } else {
                alert("Gagal menghapus produk: " + data.message);
            }
        })
        .catch(error => {
            console.error("Error:", error);
            alert("Terjadi kesalahan sistem saat menghapus produk.");
        });
    }
}

// ==========================================
// 8. LOGIKA PENANGANAN FORM TAMBAH PRODUK & INIT
// ==========================================
document.addEventListener('DOMContentLoaded', () => {
    loadAdminStats();
    loadAdminOrders();
    loadAdminProducts();

    const addProductForm = document.getElementById('add-product-form');
    if (addProductForm) {
        addProductForm.addEventListener('submit', function(e) {
            e.preventDefault();
            const formData = new FormData(this);
            
            fetch('/api/products', {
                method: 'POST',
                body: formData
            })
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    alert(data.message);
                    this.reset();
                    loadAdminProducts();
                } else {
                    alert("Gagal memajang produk: " + data.message);
                }
            })
            .catch(error => {
                console.error("Error:", error);
                alert("Terjadi kesalahan sistem saat menambah produk.");
            });
        });
    }
});