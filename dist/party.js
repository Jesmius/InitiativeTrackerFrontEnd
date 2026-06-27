import { apiFetch, requireRole, renderNav, showAlert, setLoading } from './api.js';
requireRole('master');
renderNav('party');
loadMembers();
async function loadMembers() {
    const list = document.getElementById('member-list');
    list.innerHTML = '<p class="text-muted text-center mt-2">Carregando...</p>';
    const res = await apiFetch('/api/party/');
    if (!res.ok) {
        list.innerHTML = '<p class="text-danger">Erro ao carregar jogadores.</p>';
        return;
    }
    const members = await res.json();
    if (members.length === 0) {
        list.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon"></div>
        <p>Nenhum jogador adicionado ainda. Adicione jogadores pelo username acima.</p>
      </div>`;
        return;
    }
    list.innerHTML = '';
    members.forEach(m => list.appendChild(buildCard(m)));
}
function buildCard(m) {
    const div = document.createElement('div');
    div.className = 'card';
    div.innerHTML = `
    <div class="flex-between">
      <div>
        <span class="card-title">${esc(m.player_username)}</span>
        <span class="badge badge-player" style="margin-left:8px">Jogador</span>
      </div>
      <button class="btn btn-sm btn-danger" data-remove="${m.id}">Remover</button>
    </div>
  `;
    div.querySelector('[data-remove]')?.addEventListener('click', () => removeMember(m.id, m.player_username));
    return div;
}
document.getElementById('add-form')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const input = document.getElementById('username-input');
    const username = input.value.trim();
    if (!username)
        return;
    const alertEl = document.getElementById('add-alert');
    if (alertEl)
        alertEl.style.display = 'none';
    setLoading('add-btn', true, 'Adicionando...');
    const res = await apiFetch('/api/party/', {
        method: 'POST',
        body: JSON.stringify({ username }),
    });
    setLoading('add-btn', false);
    if (res.ok) {
        input.value = '';
        loadMembers();
    }
    else {
        const data = await res.json();
        showAlert('add-alert', data.detail ?? 'Erro ao adicionar jogador.', 'error');
    }
});
async function removeMember(id, username) {
    if (!confirm(`Remover ${username} da sua lista de jogadores?`))
        return;
    const res = await apiFetch(`/api/party/${id}/`, { method: 'DELETE' });
    if (res.ok || res.status === 204)
        loadMembers();
    else
        showAlert('page-alert', 'Erro ao remover jogador.', 'error');
}
function esc(str) {
    return str.replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c] ?? c));
}
//# sourceMappingURL=party.js.map