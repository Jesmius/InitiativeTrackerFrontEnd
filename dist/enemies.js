import { apiFetch, requireRole, renderNav, showAlert, setLoading } from './api.js';
requireRole('master');
renderNav('enemies');
let editingId = null;
loadEnemies();
async function loadEnemies() {
    const list = document.getElementById('enemy-list');
    list.innerHTML = '<p class="text-muted text-center mt-2">Carregando...</p>';
    const res = await apiFetch('/api/enemies/');
    if (!res.ok) {
        list.innerHTML = '<p class="text-danger">Erro ao carregar inimigos.</p>';
        return;
    }
    const enemies = await res.json();
    if (enemies.length === 0) {
        list.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon">👹</div>
        <p>Nenhum inimigo cadastrado. Crie o primeiro!</p>
      </div>`;
        return;
    }
    list.innerHTML = '';
    enemies.forEach(e => list.appendChild(buildCard(e)));
}
function buildCard(e) {
    const div = document.createElement('div');
    div.className = 'card';
    div.innerHTML = `
    <div class="flex-between mb-1">
      <span class="card-title">${esc(e.name)}</span>
      <span class="badge badge-enemy">Inimigo</span>
    </div>
    <div class="stat-row">
      <span class="stat">Iniciativa <span>${e.initiative_bonus >= 0 ? '+' : ''}${e.initiative_bonus}</span></span>
      <span class="stat">HP <span>${e.hp}</span></span>
      <span class="stat">Def. Passiva <span>${e.passive_defense}</span></span>
    </div>
    <div class="mt-2 flex gap-1">
      <button class="btn btn-sm btn-outline" data-edit="${e.id}">Editar</button>
      <button class="btn btn-sm btn-danger" data-delete="${e.id}">Excluir</button>
    </div>
  `;
    div.querySelector('[data-edit]')?.addEventListener('click', () => openEdit(e));
    div.querySelector('[data-delete]')?.addEventListener('click', () => deleteEnemy(e.id));
    return div;
}
// ─── Form ─────────────────────────────────────────────────────────────────────
function openCreate() {
    editingId = null;
    document.getElementById('form-title').textContent = 'Novo Inimigo';
    document.getElementById('submit-btn').textContent = 'Criar';
    resetForm();
    showForm();
}
function openEdit(e) {
    editingId = e.id;
    document.getElementById('form-title').textContent = 'Editar Inimigo';
    document.getElementById('submit-btn').textContent = 'Salvar';
    document.getElementById('name').value = e.name;
    document.getElementById('initiative_bonus').value = String(e.initiative_bonus);
    document.getElementById('hp').value = String(e.hp);
    document.getElementById('passive_defense').value = String(e.passive_defense);
    showForm();
}
function showForm() {
    document.getElementById('form-section').style.display = 'block';
    document.getElementById('name')?.focus();
    hideAlert('form-alert');
}
function hideForm() {
    document.getElementById('form-section').style.display = 'none';
    resetForm();
}
function resetForm() {
    document.getElementById('enemy-form').reset();
}
function hideAlert(id) {
    const el = document.getElementById(id);
    if (el)
        el.style.display = 'none';
}
document.getElementById('new-enemy-btn')?.addEventListener('click', openCreate);
document.getElementById('cancel-btn')?.addEventListener('click', hideForm);
document.getElementById('enemy-form')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    hideAlert('form-alert');
    const body = {
        name: document.getElementById('name').value.trim(),
        initiative_bonus: Number(document.getElementById('initiative_bonus').value),
        hp: Number(document.getElementById('hp').value),
        passive_defense: Number(document.getElementById('passive_defense').value),
    };
    if (!body.name) {
        showAlert('form-alert', 'O nome é obrigatório.', 'error');
        return;
    }
    setLoading('submit-btn', true, 'Salvando...');
    const url = editingId ? `/api/enemies/${editingId}/` : '/api/enemies/';
    const method = editingId ? 'PUT' : 'POST';
    const res = await apiFetch(url, { method, body: JSON.stringify(body) });
    setLoading('submit-btn', false);
    if (!res.ok) {
        showAlert('form-alert', 'Erro ao salvar inimigo.', 'error');
        return;
    }
    hideForm();
    loadEnemies();
});
async function deleteEnemy(id) {
    if (!confirm('Excluir este inimigo?'))
        return;
    const res = await apiFetch(`/api/enemies/${id}/`, { method: 'DELETE' });
    if (res.ok || res.status === 204)
        loadEnemies();
    else
        showAlert('page-alert', 'Erro ao excluir inimigo.', 'error');
}
function esc(str) {
    return str.replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c] ?? c));
}
//# sourceMappingURL=enemies.js.map