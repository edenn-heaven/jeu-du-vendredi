document.addEventListener('DOMContentLoaded', () => {
    const form = document.querySelector('form');
    const usernameInput = document.querySelector('#username');
    const passwordInput = document.querySelector('#password');
    const logoutBtn = document.querySelector('#logout-btn');

    const storedUser = localStorage.getItem('currentUser');
    if (storedUser) {
        const user = JSON.parse(storedUser);
        showMessage(`Connecté en tant que ${user.username}. <a href="../community/community.html">Aller à la communauté</a>`, 'success');
    } else if (logoutBtn) {
        logoutBtn.style.display = 'none';
    }

    form.addEventListener('submit', async(event) => {
        event.preventDefault();

        const username = usernameInput.value.trim();
        const password = passwordInput.value;

        if (!username || !password) {
            showMessage('Veuillez renseigner un nom d\'utilisateur et un mot de passe.', 'error');
            return;
        }

        const submitBtn = form.querySelector('button[type="submit"]');
        submitBtn.disabled = true;
        submitBtn.textContent = 'Connexion en cours…';

        try {
            const response = await fetch('/api/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password }),
                credentials: 'include',
            });

            const data = await response.json();

            if (response.ok) {
                localStorage.setItem('currentUser', JSON.stringify(data.user));

                const msg = data.created ?
                    `Compte créé ! Bienvenue, ${data.user.username} !` :
                    `Bon retour, ${data.user.username} !`;

                showMessage(msg, 'success');

                setTimeout(() => {
                    window.location.href = '/Pages/community/login.html';
                }, 1500);

            } else {
                showMessage(data.error || 'Erreur de connexion.', 'error');
            }

        } catch (error) {
            showMessage('Impossible de contacter le serveur. Vérifier que server.py est lancé.', 'error');
            console.error(error);
        } finally {
            submitBtn.disabled = false;
            submitBtn.textContent = 'Se connecter';
        }
    });

    if (logoutBtn) {
        logoutBtn.addEventListener('click', async() => {
            logoutBtn.disabled = true;
            logoutBtn.textContent = 'Déconnexion...';

            try {
                await fetch('/api/logout', {
                    method: 'POST',
                    credentials: 'include',
                });
            } finally {
                localStorage.removeItem('currentUser');
                showMessage('Vous êtes déconnecté.', 'success');
                logoutBtn.style.display = 'none';
                logoutBtn.disabled = false;
                logoutBtn.textContent = 'Se déconnecter';
            }
        });
    }
});

function showMessage(html, type) {
    let msg = document.getElementById('login-message');
    if (!msg) {
        msg = document.createElement('p');
        msg.id = 'login-message';
        document.querySelector('form').insertAdjacentElement('afterend', msg);
    }
    msg.innerHTML = html;
    msg.style.color = type === 'error' ? '#c0392b' : '#27ae60';
    msg.style.marginTop = '0.75rem';
    msg.style.fontWeight = '500';
}
