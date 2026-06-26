import { apiFetch, requireRole, renderNav, showAlert, setLoading } from './api.js';
requireRole('player');
renderNav('characters');
let editingId = null;
loadCharacters();
async function loadCharacters() {
    const list = document.getElementById('character-list');
    list.innerHTML = '<p class="text-muted text-center mt-2">Carregando...</p>';
    const res = await apiFetch('/api/characters/');
    if (!res.ok) {
        list.innerHTML = '<p class="text-danger">Erro ao carregar personagens.</p>';
        return;
    }
    const chars = await res.json();
    if (chars.length === 0) {
        list.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon">🧙</div>
        <p>Nenhum personagem cadastrado. Crie o primeiro!</p>
      </div>`;
        return;
    }
    list.innerHTML = '';
    chars.forEach(c => list.appendChild(buildCard(c)));
}
function buildCard(c) {
    const div = document.createElement('div');
    div.className = 'card';
    div.innerHTML = `
    <div class="flex-between mb-1">
      <span class="card-title">${esc(c.name)}</span>
      <span class="badge badge-player">Personagem</span>
    </div>
    <div class="stat-row">
      <span class="stat">Bônus de Iniciativa <span>${c.initiative_bonus >= 0 ? '+' : ''}${c.initiative_bonus}</span></span>
    </div>
    <div class="mt-2 flex gap-1">
      <button class="btn btn-sm btn-outline" data-edit="${c.id}">Editar</button>
      <button class="btn btn-sm btn-danger" data-delete="${c.id}">Excluir</button>
    </div>
  `;
    div.querySelector('[data-edit]')?.addEventListener('click', () => openEdit(c));
    div.querySelector('[data-delete]')?.addEventListener('click', () => deleteChar(c.id));
    return div;
}
// ─── Form ─────────────────────────────────────────────────────────────────────
function openCreate() {
    editingId = null;
    document.getElementById('form-title').textContent = 'Novo Personagem';
    document.getElementById('submit-btn').textContent = 'Criar';
    resetForm();
    showForm();
}
function openEdit(c) {
    editingId = c.id;
    document.getElementById('form-title').textContent = 'Editar Personagem';
    document.getElementById('submit-btn').textContent = 'Salvar';
    document.getElementById('name').value = c.name;
    document.getElementById('initiative_bonus').value = String(c.initiative_bonus);
    showForm();
}
function showForm() {
    document.getElementById('form-section').style.display = 'block';
    document.getElementById('name')?.focus();
    const el = document.getElementById('form-alert');
    if (el)
        el.style.display = 'none';
}
function hideForm() {
    document.getElementById('form-section').style.display = 'none';
    resetForm();
}
function resetForm() {
    document.getElementById('char-form').reset();
}
document.getElementById('new-char-btn')?.addEventListener('click', openCreate);
document.getElementById('cancel-btn')?.addEventListener('click', hideForm);
document.getElementById('char-form')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const el = document.getElementById('form-alert');
    if (el)
        el.style.display = 'none';
    const body = {
        name: document.getElementById('name').value.trim(),
        initiative_bonus: Number(document.getElementById('initiative_bonus').value),
    };
    if (!body.name) {
        showAlert('form-alert', 'O nome é obrigatório.', 'error');
        return;
    }
    setLoading('submit-btn', true, 'Salvando...');
    const url = editingId ? `/api/characters/${editingId}/` : '/api/characters/';
    const method = editingId ? 'PUT' : 'POST';
    const res = await apiFetch(url, { method, body: JSON.stringify(body) });
    setLoading('submit-btn', false);
    if (!res.ok) {
        showAlert('form-alert', 'Erro ao salvar personagem.', 'error');
        return;
    }
    hideForm();
    loadCharacters();
});
async function deleteChar(id) {
    if (!confirm('Excluir este personagem?'))
        return;
    const res = await apiFetch(`/api/characters/${id}/`, { method: 'DELETE' });
    if (res.ok || res.status === 204)
        loadCharacters();
    else
        showAlert('page-alert', 'Erro ao excluir personagem.', 'error');
}
function esc(str) {
    return str.replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c] ?? c));
}
//# sourceMappingURL=characters.js.map