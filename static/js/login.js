document.addEventListener('DOMContentLoaded', function() {
    const loginForm = document.querySelector('form');
    
    if (loginForm) {
        loginForm.addEventListener('submit', function(e) {
            e.preventDefault(); // Mencegah halaman reload otomatis
            
            const usernameInput = document.querySelector('input[type="text"]').value;
            const passwordInput = document.querySelector('input[type="password"]').value;
            
            // Kirim data login ke API Flask di app.py
            fetch('/api/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    username: usernameInput,
                    password: passwordInput
                })
            })
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    alert('Selamat! Login Berhasil.');
                    
                    // Simpan data login di browser
                    localStorage.setItem('isLoggedIn', 'true');
                    localStorage.setItem('username', data.user.username);
                    localStorage.setItem('role', data.user.role);
                    
                    // Alihkan ke rute Flask yang benar (tanpa .html)
                    if (data.user.role === 'admin') {
                        window.location.href = '/admin'; 
                    } else {
                        window.location.href = '/'; // Arahkan ke halaman katalog utama
                    }
                } else {
                    alert(data.message || 'Username atau password salah!');
                }
            })
            .catch(error => {
                console.error('Error:', error);
                alert('Gagal terhubung ke server database!');
            });
        });
    }
});