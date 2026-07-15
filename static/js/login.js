document.addEventListener('DOMContentLoaded', function() {
    const loginForm = document.getElementById('loginForm');
    const passwordInput = document.getElementById('password');
    const btnTogglePassword = document.getElementById('btnTogglePassword');
    const eyeIcon = document.getElementById('eyeIcon');

    // 1. Fitur Buka/Tutup Mata Password
    if (btnTogglePassword && passwordInput && eyeIcon) {
        btnTogglePassword.addEventListener('click', function() {
            if (passwordInput.type === 'password') {
                passwordInput.type = 'text';
                eyeIcon.classList.remove('fa-eye');
                eyeIcon.classList.add('fa-eye-slash');
            } else {
                passwordInput.type = 'password';
                eyeIcon.classList.remove('fa-eye-slash');
                eyeIcon.classList.add('fa-eye');
            }
        });
    }

    // 2. Fitur Proses Kirim Data Login ke Database
    if (loginForm) {
        loginForm.addEventListener('submit', async function(e) {
            e.preventDefault(); 
            
            const usernameInput = document.getElementById('username').value;
            const passwordValue = passwordInput.value;
            
            try {
                const response = await fetch('/api/login', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        username: usernameInput,
                        password: passwordValue
                    })
                });
                
                const data = await response.json();
                
                if (data.success) {
                    alert('Selamat! Login Berhasil.');
                    
                    // Simpan data login di browser
                    localStorage.setItem('isLoggedIn', 'true');
                    localStorage.setItem('username', data.user.username);
                    localStorage.setItem('role', data.user.role); // Simpan status role
                    
                    // PENGALIHAN PINTAR BERDASARKAN ROLE:
                    if (data.user.role === 'admin') {
                        // Jika admin, arahkan ke dashboard kelola barang/admin
                        window.location.href = '/admin'; 
                    } else {
                        // Jika user biasa, arahkan ke halaman katalog toko
                        window.location.href = '/'; 
                    }
                } else {
                    alert(data.message || 'Login Gagal!');
                }
            } catch (error) {
                console.error('Error:', error);
                alert('Gagal terhubung ke server backend!');
            }
        });
    }
});