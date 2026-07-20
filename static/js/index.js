document.addEventListener("DOMContentLoaded", function() {
    // Memilih semua elemen yang memiliki class 'hidden-anim'
    const hiddenElements = document.querySelectorAll('.hidden-anim');

    // Membuat pemantau (observer) kapan elemen terlihat di layar
    const observer = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
            if (entry.isIntersecting) {
                // Tambahkan class 'show-anim' agar elemen muncul
                entry.target.classList.add('show-anim');
            }
        });
    }, {
        threshold: 0.1 // Animasi mulai saat 10% elemen terlihat
    });

    // Jalankan pemantau ke semua elemen tadi
    hiddenElements.forEach((el) => observer.observe(el));
});

// =========================================
// CEK STATUS LOGIN UNTUK NAVBAR BERANDA
// =========================================
document.addEventListener("DOMContentLoaded", function() {
    fetch('/api/user')
    .then(response => response.json())
    .then(data => {
        if(data.logged_in) {
            // Bongkar objek jika data berbentuk dictionary
            let namaTampil = data.username;
            if (typeof data.username === 'object' && data.username !== null) {
                namaTampil = data.username.username || data.username.name || "User";
            }
            
            // Tampilkan menu khusus untuk user yang sudah login
            document.getElementById("nama-user").innerText = "Hi, " + namaTampil;
            document.getElementById("nama-user").style.display = "inline";
            document.getElementById("btn-keranjang").style.display = "inline";
            document.getElementById("btn-logout").style.display = "inline";
            
            // Sembunyikan tombol login dan daftar
            document.getElementById("btn-login").style.display = "none";
            document.getElementById("btn-daftar").style.display = "none";
        }
    })
    .catch(err => console.error("Error fetching user data:", err));
});