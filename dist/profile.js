import { apiFetch, requireAuth, renderNav, showAlert, setLoading } from './api.js';
requireAuth();
renderNav('profile');
loadProfile();
async function loadProfile() {
    const res = await apiFetch('/api/auth/profile/');
    if (!res.ok)
        return;
    const profile = await res.json();
    document.getElementById('username-display').textContent = profile.username;
    document.getElementById('email-display').textContent = profile.email || '—';
    document.getElementById('role-display').innerHTML =
        `<span class="badge ${profile.role === 'master' ? 'badge-master' : 'badge-player'}">
      ${profile.role === 'master' ? 'Mestre de Mesa' : 'Jogador'}
    </span>`;
    document.getElementById('email-input').value = profile.email || '';
}
// ─── Update Email ─────────────────────────────────────────────────────────────
document.getElementById('profile-form')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    document.getElementById('profile-alert').style.display = 'none';
    const email = document.getElementById('email-input').value.trim();
    setLoading('save-profile-btn', true, 'Salvando...');
    const res = await apiFetch('/api/auth/profile/', {
        method: 'PUT',
        body: JSON.stringify({ email }),
    });
    setLoading('save-profile-btn', false);
    if (res.ok) {
        showAlert('profile-alert', 'Perfil atualizado com sucesso.', 'success');
        loadProfile();
    }
    else {
        showAlert('profile-alert', 'Erro ao atualizar perfil.', 'error');
    }
});
// ─── Change Password ──────────────────────────────────────────────────────────
document.getElementById('password-form')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    document.getElementById('password-alert').style.display = 'none';
    const oldPass = document.getElementById('old-password').value;
    const newPass = document.getElementById('new-password').value;
    const confirm = document.getElementById('confirm-password').value;
    if (newPass !== confirm) {
        showAlert('password-alert', 'As novas senhas não coincidem.', 'error');
        return;
    }
    if (newPass.length < 8) {
        showAlert('password-alert', 'A nova senha deve ter pelo menos 8 caracteres.', 'error');
        return;
    }
    setLoading('save-password-btn', true, 'Alterando...');
    const res = await apiFetch('/api/auth/change-password/', {
        method: 'POST',
        body: JSON.stringify({ old_password: oldPass, new_password: newPass }),
    });
    setLoading('save-password-btn', false);
    if (res.ok) {
        showAlert('password-alert', 'Senha alterada com sucesso.', 'success');
        document.getElementById('password-form').reset();
    }
    else {
        const err = await res.json();
        const msg = err['old_password'] || 'Erro ao alterar senha.';
        showAlert('password-alert', msg, 'error');
    }
});
//# sourceMappingURL=profile.js.map