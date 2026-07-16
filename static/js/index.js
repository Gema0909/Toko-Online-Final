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