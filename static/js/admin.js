// Membuka Modal Edit dan mengisi data (Dummy Demo)
function openEditModal(name, category, price, stock, description) {
    document.getElementById('edit_name').value = name;
    document.getElementById('edit_category').value = category;
    document.getElementById('edit_price').value = price;
    document.getElementById('edit_stock').value = stock;
    document.getElementById('edit_description').value = description || '';

    // Tampilkan modal dengan menghapus class 'hidden'
    document.getElementById('editModal').classList.remove('hidden');
}

// Menutup Modal Edit
function closeEditModal() {
    document.getElementById('editModal').classList.add('hidden');
}

// Menghilangkan pesan notifikasi (alert) otomatis dalam 5 detik
document.addEventListener("DOMContentLoaded", function() {
    const alerts = document.querySelectorAll('.alert, .flash, [role="alert"]');
    
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
});

// Fungsi untuk memanggil API Hapus Produk (Tambahkan di admin.js)
function deleteProduct(productId, productName) {
    // Tampilkan konfirmasi popup sebelum benar-benar menghapus
    if (confirm(`Apakah Anda yakin ingin menghapus produk "${productName}"?`)) {
        fetch(`/api/products/${productId}`, {
            method: 'DELETE'
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                alert(data.message);
                location.reload(); // Refresh halaman untuk memperbarui daftar produk
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