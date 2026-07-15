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
    // 2. LOGIKA KIRIM DATA LOGIN KE API BACKEND PYTHON (RIIL)
    // =========================================================================
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', function(e) {
            e.preventDefault(); // Menahan agar halaman tidak reload saat tombol ditekan
            
            // Mengambil input username dan password langsung dari form HTML
            const formData = new FormData(loginForm);

            // Mengirim data form ke API backend /api/login
            fetch('/api/login', {
                method: 'POST',
                body: formData
            })
            .then(response => {
                if (!response.ok) {
                    throw new Error("Koneksi ke server gagal.");
                }
                return response.json();
            })
            .then(data => {
                // Jika respon backend sukses (berhasil memverifikasi akun di database)
                if (data.success) {
                    alert(data.message || "Login berhasil!");
                    
                    // Ambil peran (role) dari user yang dikembalikan oleh database
                    const userRole = (data.user && data.user.role) ? data.user.role : 'user';

                    // Pengalihan halaman dinamis berdasarkan role
                    if (userRole === 'admin') {
                        window.location.href = '/admin'; // Diarahkan ke Dashboard Admin
                    } else {
                        window.location.href = '/'; // Diarahkan ke Katalog Belanja User
                    }
                    
                } else {
                    // Jika login gagal karena username/password salah
                    alert(data.message || "Username atau password salah!");
                }
            })
            .catch(err => {
                console.error("Gagal melakukan login:", err);
                alert("Terjadi kesalahan sistem atau server backend Anda offline.");
            });
        });
    }

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