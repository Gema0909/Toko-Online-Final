document.addEventListener("DOMContentLoaded", function() {
    // Logika untuk menampilkan/menyembunyikan password
    const btnToggle = document.getElementById('btnTogglePassword');
    const passwordInput = document.getElementById('password');
    const eyeIcon = document.getElementById('eyeIcon');

    if(btnToggle) {
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

    // Logika Login menggunakan API Fetch (Tanpa Jinja)
    const loginForm = document.getElementById('loginForm');
    if(loginForm) {
        loginForm.addEventListener('submit', function(e) {
            e.preventDefault(); 
            const formData = new FormData(loginForm);

            fetch('/api/login', {
                method: 'POST',
                body: formData
            })
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    alert(data.message); // Menampilkan "Login sukses!"
                    
                    // --- TAMBAHKAN PERINTAH REDIRECT INI ---
                    if (data.user.role === 'admin') {
                        window.location.href = '/admin'; // Jika admin, arahkan ke dashboard admin
                    } else {
                        window.location.href = '/'; // Jika pelanggan biasa, arahkan ke halaman utama (shop)
                    }
                    // ---------------------------------------
                    
                } else {
                    alert(data.message); // Menampilkan pesan error jika gagal
                }
            })
            .catch(err => console.error("Error:", err));
        });
    }
});