document.addEventListener("DOMContentLoaded", function() {
    const payment = document.getElementById("payment_method");
    const info = document.getElementById("payment_info");
    const text = document.getElementById("payment_text");
    const proof = document.getElementById("proof_div");

    if (payment) {
        payment.addEventListener("change", function() {
            // Tampilkan kotak informasi
            info.classList.remove("hidden");
            proof.style.display = "block";

            // Cek opsi yang dipilih
            if (this.value === "BCA") {
                text.innerHTML = "Transfer ke BCA<br><b>1234567890</b><br>TOKO ONLINE";
            } 
            else if (this.value === "BRI") {
                text.innerHTML = "Transfer ke BRI<br><b>9876543210</b><br>TOKO ONLINE";
            } 
            else if (this.value === "Mandiri") {
                text.innerHTML = "Transfer ke Mandiri<br><b>555777999</b><br>TOKO ONLINE";
            } 
            else if (this.value === "QRIS") {
                // Pastikan gambar qris.jpg ada di static/images/
                text.innerHTML = "<img src='static/images/qris.jpg' style='border-radius: 0.5rem; margin-top: 0.5rem; width: 12rem;' alt='QRIS'>";
            } 
            else if (this.value === "COD") {
                text.innerHTML = "Pembayaran dilakukan saat barang diterima.";
                proof.style.display = "none";
            } 
            else {
                // Sembunyikan info jika tidak ada yang dipilih ("-- Pilih Metode --")
                info.classList.add("hidden");
            }
        });
    }

    // Simulasi checkout button agar tidak reload halaman
    const checkoutForm = document.getElementById("checkoutForm");
    if (checkoutForm) {
        checkoutForm.addEventListener("submit", function(e) {
            e.preventDefault();
            alert("Pesanan berhasil dibuat (Simulasi HTML Statis)!");
        });
    }
});