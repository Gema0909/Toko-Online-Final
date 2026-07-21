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
                // 1. PERBAIKAN BACA TOTAL HARGA (Ubah ke total_amount)
                const formatTotal = new Intl.NumberFormat('id-ID').format(order.total_amount || 0);
                const paymentStatusClass = order.payment_status === 'Lunas' ? 'text-green font-bold' : 'text-red font-bold';
                
                const sPending = order.status === 'Pending' ? 'selected' : '';
                const sDiproses = order.status === 'Diproses' ? 'selected' : '';
                const sDikirim = order.status === 'Dikirim' ? 'selected' : '';
                const sSelesai = order.status === 'Selesai' ? 'selected' : '';

                // 2. PERBAIKAN BACA DATA PRODUK DARI JSON
                let parsedItems = [];
                try {
                    parsedItems = typeof order.items === 'string' ? JSON.parse(order.items) : order.items;
                } catch (e) {
                    console.error("Gagal membaca daftar produk:", e);
                }

                // TAMPILAN PRODUK LEBIH RAPI (Pakai Flexbox & Garis Bawah Putus-putus)
                let itemsHtml = '';
                if (parsedItems && parsedItems.length > 0) {
                    parsedItems.forEach(item => {
                        itemsHtml += `
                            <div style="display: flex; justify-content: space-between; padding: 6px 0; border-bottom: 1px dashed rgba(255,255,255,0.1); font-size: 0.95rem;">
                                <span style="color: #e2e8f0;">- ${item.name || 'Produk'}</span> 
                                <span style="color: #94a3b8;">${item.qty || 1}x</span>
                            </div>`;
                    });
                } else {
                    itemsHtml = '<p style="color: #94a3b8; font-style: italic; margin: 0;">Detail barang tidak tersedia</p>';
                }

                // 3. TAMPILAN LINK BUKTI PEMBAYARAN SEPERTI TOMBOL KECIL
                let proofHtml = '';
                if (order.payment_proof) {
                    proofHtml = `
                        <div style="display: flex; align-items: center; margin-top: 8px;">
                            <span style="color: #94a3b8; width: 150px; flex-shrink: 0;">Bukti Pembayaran</span>
                            <a href="${order.payment_proof}" target="_blank" style="color: #3b82f6; text-decoration: none; background: rgba(59, 130, 246, 0.1); padding: 4px 12px; border-radius: 4px; font-size: 0.85rem; border: 1px solid rgba(59, 130, 246, 0.3); transition: 0.3s;">
                                <i class="fas fa-image"></i> Lihat Resi
                            </a>
                        </div>`;
                }

                const orderItem = document.createElement('div');
                orderItem.className = 'order-item';
                
                // 4. STRUKTUR HTML KESELURUHAN (Desain Baru dengan Tombol Hapus)
                orderItem.innerHTML = `
                    <!-- BAGIAN HEADER (Judul & Tombol) -->
                    <div class="order-header" style="display: flex; justify-content: space-between; align-items: flex-start; flex-wrap: wrap; gap: 15px; border-bottom: 1px solid rgba(255,255,255,0.1); padding-bottom: 15px; margin-bottom: 15px;">
                        <div>
                            <h4 style="margin: 0; color: #38bdf8; font-size: 1.15rem;">Pesanan #${order.id} <span style="font-size: 0.85rem; color: #64748b; font-weight: normal;">(User ID: ${order.user_id})</span></h4>
                            <p style="margin: 5px 0 0 0; font-size: 0.85rem; color: #94a3b8;"><i class="far fa-clock"></i> ${order.date || 'Tanggal tidak tersedia'}</p>
                        </div>
                        <div class="status-form" style="display: flex; gap: 8px; align-items: center;">
                            <select class="status-select" id="status-select-${order.id}" style="padding: 6px 10px; border-radius: 4px; border: 1px solid #334155; background: #1e293b; color: #f8fafc; cursor: pointer; outline: none;">
                                <option value="Pending" ${sPending}>Pending</option>
                                <option value="Diproses" ${sDiproses}>Diproses</option>
                                <option value="Dikirim" ${sDikirim}>Dikirim</option>
                                <option value="Selesai" ${sSelesai}>Selesai</option>
                            </select>
                            <button type="button" class="btn-sm" style="background-color: #3b82f6; color: white; border: none; padding: 7px 14px; border-radius: 4px; cursor: pointer; font-weight: 500;" onclick="updateOrderStatus(${order.id})">Update</button>
                            <button type="button" class="btn-sm" style="background-color: #ef4444; color: white; border: none; padding: 7px 14px; border-radius: 4px; cursor: pointer; font-weight: 500;" onclick="deleteOrder(${order.id})">Hapus</button>
                        </div>
                    </div>
                    
                    <!-- BAGIAN DAFTAR PRODUK (Kotak dengan background gelap) -->
                    <div class="order-products" style="background: rgba(15, 23, 42, 0.4); border: 1px solid rgba(255,255,255,0.05); padding: 15px; border-radius: 8px; margin-bottom: 20px;">
                        <p style="color: #10b981; font-weight: 600; margin-top: 0; margin-bottom: 10px; font-size: 0.9rem; text-transform: uppercase; letter-spacing: 0.5px;">
                            <i class="fas fa-box-open" style="margin-right: 5px;"></i> Daftar Barang Dibeli
                        </p>
                        ${itemsHtml}
                    </div>
                    
                    <!-- BAGIAN DETAIL ALAMAT & PEMBAYARAN (Format Grid/Tabel) -->
                    <div class="order-details-grid" style="display: flex; flex-direction: column; gap: 10px; font-size: 0.95rem; margin-bottom: 15px;">
                        <div style="display: flex; align-items: flex-start;">
                            <span style="color: #94a3b8; width: 150px; flex-shrink: 0;">Alamat Kirim</span>
                            <span style="color: #f8fafc; flex-grow: 1; line-height: 1.4;">${order.address || '-'}</span>
                        </div>
                        <div style="display: flex; align-items: center;">
                            <span style="color: #94a3b8; width: 150px; flex-shrink: 0;">Metode Pembayaran</span>
                            <span style="color: #f8fafc;">${order.payment_method || '-'}</span>
                        </div>
                        <div style="display: flex; align-items: center;">
                            <span style="color: #94a3b8; width: 150px; flex-shrink: 0;">Status Pembayaran</span>
                            <span class="${paymentStatusClass}" style="background: rgba(255,255,255,0.1); padding: 3px 8px; border-radius: 4px; font-size: 0.85rem;">${order.payment_status}</span>
                        </div>
                        ${proofHtml}
                    </div>

                    <!-- BAGIAN TOTAL (Garis atas pembatas) -->
                    <div style="margin-top: 15px; padding-top: 15px; border-top: 1px solid rgba(255,255,255,0.1); display: flex; justify-content: flex-end; align-items: center;">
                        <span style="color: #94a3b8; margin-right: 15px;">Total Tagihan:</span>
                        <span style="color: #10b981; font-size: 1.3rem; font-weight: bold;">Rp ${formatTotal}</span>
                    </div>
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

    // -------------------------------------------------------------------------
    // SISIPAN BARU: Logika Reset Input & Preview Foto (Tidak merusak kode asli)
    // -------------------------------------------------------------------------
    const imageInput = document.getElementById('edit_image');
    if (imageInput) imageInput.value = ''; // Reset input file berkas lama

    const previewImg = document.getElementById('edit_image_preview');
    const previewContainer = document.getElementById('edit_image_preview_container');
    
    if (previewImg && previewContainer) {
        if (product.image) {
            // Cek apakah path berupa URL penuh atau file lokal dari folder uploads
            previewImg.src = product.image.startsWith('http') || product.image.startsWith('/') 
                ? product.image 
                : '/static/uploads/' + product.image;
            previewContainer.style.display = 'block';
        } else {
            previewContainer.style.display = 'none';
        }
    }
    // -------------------------------------------------------------------------

    // Tampilkan modal ke layar
    document.getElementById('editModal').classList.remove('hidden');
}

function closeEditModal() {
    document.getElementById('editModal').classList.add('hidden');
}

// -------------------------------------------------------------------------
// SISIPAN BARU: Jalankan Fungsi Live Preview Saat Admin Mengganti File Foto
// -------------------------------------------------------------------------
document.addEventListener('DOMContentLoaded', () => {
    const editImageInput = document.getElementById('edit_image');
    if (editImageInput) {
        editImageInput.addEventListener('change', function() {
            const file = this.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = function(e) {
                    const preview = document.getElementById('edit_image_preview');
                    const container = document.getElementById('edit_image_preview_container');
                    if (preview && container) {
                        preview.src = e.target.result;
                        container.style.display = 'block';
                    }
                }
                reader.readAsDataURL(file);
            }
        });
    }
});

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

    // 1. Bungkus data ke dalam FormData (Mendukung Teks + File)
    let formData = new FormData();
    formData.append('name', name);
    formData.append('category', category);
    formData.append('price', price);
    formData.append('stock', stock);
    formData.append('description', description);

    // 2. Cek dan masukkan file gambar JIKA admin memilih foto baru
    const imageInput = document.getElementById('edit_image');
    if (imageInput.files.length > 0) {
        formData.append('image', imageInput.files[0]);
    }

    // 3. Mengirim data perubahan menggunakan FormData
    fetch(`/api/products/${id}`, {
        method: 'POST', // Ganti menjadi POST agar sejalan dengan update Python kita
        body: formData  // Kirim formData secara langsung (TIDAK PERLU headers JSON)
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
});

// ==========================================
// FUNGSI ADMIN: HAPUS PESANAN
// ==========================================
function deleteOrder(orderId) {
    // Tampilkan popup konfirmasi sebelum menghapus beneran
    if (!confirm('Apakah Anda yakin ingin menghapus pesanan #' + orderId + ' secara permanen? Data tidak bisa dikembalikan.')) {
        return; // Batalkan jika admin klik 'Cancel'
    }

    fetch(`/api/admin/orders/${orderId}`, {
        method: 'DELETE'
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            alert('Pesanan berhasil dihapus!');
            loadAdminOrders(); // Refresh daftar pesanan agar yang dihapus menghilang dari layar
        } else {
            alert('Gagal menghapus pesanan: ' + data.message);
        }
    })
    .catch(err => {
        console.error('Error:', err);
        alert('Terjadi kesalahan pada sistem saat mencoba menghapus.');
    });
}