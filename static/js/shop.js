document.addEventListener("DOMContentLoaded", function() {
    // Menangkap semua form penambahan ke keranjang
    const addCartForms = document.querySelectorAll('.add-to-cart-form');

    addCartForms.forEach(form => {
        form.addEventListener('submit', function(e) {
            e.preventDefault(); // Mencegah reload halaman
            
            // Mengambil nama produk untuk ditampilkan di alert (opsional/pemanis)
            const productCard = this.closest('.product-card');
            const productName = productCard.querySelector('.product-title').innerText;
            
            alert(`"${productName}" berhasil ditambahkan ke keranjang belanja Anda! (Simulasi HTML Statis)`);
        });
    });
});