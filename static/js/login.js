document.addEventListener("DOMContentLoaded", function() {
    
    // =========================================================================
    // 1. FITUR TAMPILKAN / SEMBUNYIKAN PASSWORD (DENGAN PENGAMAN)
    // =========================================================================
    const btnToggle = document.getElementById('btnTogglePassword');
    const passwordInput = document.getElementById('password');
    const eyeIcon = document.getElementById('eyeIcon');

    // Hanya berjalan jika ketiga elemen pendukung password terdeteksi di HTML
    if (btnToggle && passwordInput && eyeIcon) {
        btnToggle.addEventListener('click', function() {
            if (passwordInput.type === "password") {
                passwordInput.type = "text";
                eyeIcon.classList.replace('fa-eye', 'fa-eye-slash');
            } else {
                passwordInput.type = "password";
                eyeIcon.classList.replace('fa-eye-slash', 'fa-eye');
            }
        });
    }

    // =========================================================================
    // 2. LOGIKA KIRIM DATA LOGIN (SUDAH DIBERSIHKAN)
    // =========================================================================
    // Kode e.preventDefault() dan Fetch API sudah dihapus dari sini.
    // Sekarang form akan langsung mengirim data POST ke backend Python secara natural!

    // =========================================================================
    // 3. PENGHAPUS NOTIFIKASI / ALERT OTOMATIS (5 DETIK)
    // =========================================================================
    const alerts = document.querySelectorAll('.alert, [role="alert"]');
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