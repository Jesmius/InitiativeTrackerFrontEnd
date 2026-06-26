import { API_BASE, getToken, showAlert, setLoading } from './api.js';
if (getToken())
    window.location.href = './dashboard.html';
const form = document.getElementById('forgot-form');
form.addEventListener('submit', async (e) => {
    e.preventDefault();
    document.getElementById('alert').style.display = 'none';
    const username = document.getElementById('username').value.trim();
    const email = document.getElementById('email').value.trim();
    const newPassword = document.getElementById('new-password').value;
    const confirm = document.getElementById('confirm-password').value;
    if (!username || !email || !newPassword || !confirm) {
        showAlert('alert', 'Preencha todos os campos.', 'error');
        return;
    }
    if (newPassword !== confirm) {
        showAlert('alert', 'As senhas não coincidem.', 'error');
        return;
    }
    if (newPassword.length < 8) {
        showAlert('alert', 'A nova senha deve ter pelo menos 8 caracteres.', 'error');
        return;
    }
    setLoading('submit-btn', true, 'Redefinindo...');
    try {
        const res = await fetch(`${API_BASE}/api/auth/forgot-password/`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, email, new_password: newPassword, confirm_password: confirm }),
        });
        if (!res.ok) {
            const err = await res.json();
            const msg = err['detail'] || Object.values(err).flat().join(' ');
            showAlert('alert', msg || 'Não foi possível redefinir a senha.', 'error');
            return;
        }
        showAlert('alert', 'Senha redefinida com sucesso! Redirecionando para login...', 'success');
        setTimeout(() => window.location.href = './index.html', 2000);
    }
    catch {
        showAlert('alert', 'Erro de conexão. Tente novamente.', 'error');
    }
    finally {
        setLoading('submit-btn', false);
    }
});
//# sourceMappingURL=forgot-password.js.map