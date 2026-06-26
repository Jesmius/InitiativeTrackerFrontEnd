import { API_BASE, setAuth, getToken, showAlert, setLoading } from './api.js';
if (getToken())
    window.location.href = './dashboard.html';
const form = document.getElementById('login-form');
form.addEventListener('submit', async (e) => {
    e.preventDefault();
    hideErrors();
    const username = document.getElementById('username').value.trim();
    const password = document.getElementById('password').value;
    if (!username || !password) {
        showAlert('alert', 'Preencha todos os campos.', 'error');
        return;
    }
    setLoading('submit-btn', true, 'Entrando...');
    try {
        const tokenRes = await fetch(`${API_BASE}/api/auth/token/`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password }),
        });
        if (!tokenRes.ok) {
            showAlert('alert', 'Username ou senha incorretos.', 'error');
            return;
        }
        const tokens = await tokenRes.json();
        const profileRes = await fetch(`${API_BASE}/api/auth/profile/`, {
            headers: { Authorization: `Bearer ${tokens.access}` },
        });
        const profile = await profileRes.json();
        setAuth(tokens, profile);
        window.location.href = './dashboard.html';
    }
    catch {
        showAlert('alert', 'Erro de conexão. Verifique sua internet.', 'error');
    }
    finally {
        setLoading('submit-btn', false);
    }
});
function hideErrors() {
    const el = document.getElementById('alert');
    if (el)
        el.style.display = 'none';
}
//# sourceMappingURL=auth.js.map