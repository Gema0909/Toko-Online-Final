document.addEventListener("DOMContentLoaded", function() {
    
    // 1. Logika untuk menampilkan/menyembunyikan password (DENGAN PENGAMAN)
    const btnToggle = document.getElementById('btnTogglePassword');
    const passwordInput = document.getElementById('password');
    const eyeIcon = document.getElementById('eyeIcon');

    // Pengaman: Event listener hanya dipasang jika KETIGA elemen ini benar-benar ada di halaman
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

    // 2. Logika Login menggunakan API Fetch (Tanpa Jinja - DENGAN PENGAMAN REDIRECT)
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', function(e) {
            e.preventDefault(); 
            const formData = new FormData(loginForm);

            fetch('/api/login', {
                method: 'POST',
                body: formData
            })
            .then(response => {
                if (!response.ok) {
                    throw new Error("Gagal menghubungi server");
                }
                return response.json();
            })
            .then(data => {
                if (data.success) {
                    alert(data.message || "Login sukses!");
                    
                    // Pengaman: Memastikan objek 'data.user' tidak null sebelum membaca role
                    const userRole = (data.user && data.user.role) ? data.user.role : 'user';

                    // Pengalihan halaman (Redirect) berdasarkan peran/role
                    if (userRole === 'admin') {
                        window.location.href = '/admin'; // Dashboard Admin
                    } else {
                        window.location.href = '/'; // Halaman Utama Shop Pelanggan
                    }
                    
                } else {
                    // Menampilkan pesan error dari backend jika validasi gagal
                    alert(data.message || "Username atau password salah!");
                }
            })
            .catch(err => {
                console.error("Error saat login:", err);
                alert("Terjadi kesalahan sistem. Silakan coba beberapa saat lagi.");
            });
        });
    }
});