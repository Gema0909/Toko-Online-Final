document.addEventListener('DOMContentLoaded', function() {
    const loginForm = document.getElementById('loginForm'); // Pastikan <form id="loginForm"> di login.html kamu

    if (loginForm) {
        loginForm.addEventListener('submit', async function(e) {
            e.preventDefault(); // Mencegah halaman refresh otomatis
            
            // Mengambil input dari form login.html
            // (Pastikan ID input username & password di HTML kamu adalah 'username' dan 'password')
            const usernameInput = document.getElementById('username').value;
            const passwordInput = document.getElementById('password').value;
            
            try {
                const response = await fetch('/api/login', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        username: usernameInput,
                        password: passwordInput
                    })
                });
                
                const data = await response.json();
                
                if (data.success) {
                    alert('Selamat! Login Berhasil.');
                    // Simpan data login sementara di browser
                    localStorage.setItem('isLoggedIn', 'true');
                    localStorage.setItem('username', data.user.username);
                    
                    // Alihkan halaman ke dashboard Admin atau Shop setelah sukses login
                    window.location.href = '/admin'; 
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