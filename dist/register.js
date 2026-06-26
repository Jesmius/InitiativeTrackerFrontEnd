import { API_BASE, getToken, showAlert, setLoading } from './api.js';
if (getToken())
    window.location.href = './dashboard.html';
const form = document.getElementById('register-form');
form.addEventListener('submit', async (e) => {
    e.preventDefault();
    showAlert('alert', '', 'error');
    document.getElementById('alert').style.display = 'none';
    const username = document.getElementById('username').value.trim();
    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value;
    const confirm = document.getElementById('confirm-password').value;
    const role = document.querySelector('input[name="role"]:checked')?.value ?? 'player';
    if (!username || !email || !password) {
        showAlert('alert', 'Preencha todos os campos.', 'error');
        return;
    }
    if (password !== confirm) {
        showAlert('alert', 'As senhas não coincidem.', 'error');
        return;
    }
    if (password.length < 8) {
        showAlert('alert', 'A senha deve ter pelo menos 8 caracteres.', 'error');
        return;
    }
    setLoading('submit-btn', true, 'Criando conta...');
    try {
        const res = await fetch(`${API_BASE}/api/auth/register/`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, email, password, role }),
        });
        if (!res.ok) {
            const err = await res.json();
            const msg = Object.values(err).flat().join(' ');
            showAlert('alert', msg || 'Erro ao criar conta.', 'error');
            return;
        }
        showAlert('alert', 'Conta criada com sucesso! Redirecionando para login...', 'success');
        setTimeout(() => window.location.href = './index.html', 1800);
    }
    catch {
        showAlert('alert', 'Erro de conexão. Tente novamente.', 'error');
    }
    finally {
        setLoading('submit-btn', false);
    }
});
//# sourceMappingURL=register.js.map