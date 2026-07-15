// Fungsi untuk memunculkan / menyembunyikan password
function togglePassword() {
    const passwordInput = document.getElementById('passwordInput');
    const eyeIcon = document.getElementById('eyeIcon');
    
    if (passwordInput.type === 'password') {
        passwordInput.type = 'text';
        eyeIcon.classList.remove('fa-eye');
        eyeIcon.classList.add('fa-eye-slash');
    } else {
        passwordInput.type = 'password';
        eyeIcon.classList.remove('fa-eye-slash');
        eyeIcon.classList.add('fa-eye');
    }
}

// Simulasi form submit (agar halaman tidak ter-refresh saat tombol diklik sebelum ada API)
document.getElementById('loginForm')?.addEventListener('submit', function(e) {
    e.preventDefault(); 
    alert("Tombol login ditekan! (Versi HTML Statis)");
});

// Menghilangkan Notifikasi/Alert otomatis setelah 5 detik
document.addEventListener("DOMContentLoaded", function() {
    const alerts = document.querySelectorAll('.alert, [role="alert"]');
    
    alerts.forEach(function(alert) {
        setTimeout(function() {
            // Memberikan efek fade out
            alert.style.transition = "opacity 0.5s ease-out";
            alert.style.opacity = "0";
            
            // Menghapus elemen dari HTML setelah animasi selesai
            setTimeout(function() {
                alert.style.display = "none";
                alert.remove();
            }, 500);
        }, 5000); // 5000 ms = 5 detik
    });
});

// Simulasi submit form Register
document.getElementById('registerForm')?.addEventListener('submit', function(e) {
    e.preventDefault(); 
    alert("Proses pendaftaran akun baru berhasil! (Simulasi HTML Statis)");
    // window.location.href = "login.html"; // Opsional: redirect otomatis ke login
});