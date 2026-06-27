import { apiFetch, requireRole, renderNav, showAlert, setLoading, type Enemy } from './api.js';

requireRole('master');
renderNav('enemies');

let editingId: number | null = null;

loadEnemies();

async function loadEnemies(): Promise<void> {
  const list = document.getElementById('enemy-list') as HTMLElement;
  list.innerHTML = '<p class="text-muted text-center mt-2">Carregando...</p>';

  const res = await apiFetch('/api/enemies/');
  if (!res.ok) { list.innerHTML = '<p class="text-danger">Erro ao carregar inimigos.</p>'; return; }

  const enemies = await res.json() as Enemy[];
  if (enemies.length === 0) {
    list.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon"></div>
        <p>Nenhum inimigo cadastrado. Crie o primeiro!</p>
      </div>`;
    return;
  }

  list.innerHTML = '';
  enemies.forEach(e => list.appendChild(buildCard(e)));
}

function buildCard(e: Enemy): HTMLElement {
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
  div.querySelector<HTMLButtonElement>('[data-edit]')?.addEventListener('click', () => openEdit(e));
  div.querySelector<HTMLButtonElement>('[data-delete]')?.addEventListener('click', () => deleteEnemy(e.id));
  return div;
}

// ─── Form ─────────────────────────────────────────────────────────────────────

function openCreate(): void {
  editingId = null;
  (document.getElementById('form-title') as HTMLElement).textContent = 'Novo Inimigo';
  (document.getElementById('submit-btn') as HTMLElement).textContent = 'Criar';
  resetForm();
  showForm();
}

function openEdit(e: Enemy): void {
  editingId = e.id;
  (document.getElementById('form-title') as HTMLElement).textContent = 'Editar Inimigo';
  (document.getElementById('submit-btn') as HTMLElement).textContent = 'Salvar';
  (document.getElementById('name') as HTMLInputElement).value = e.name;
  (document.getElementById('initiative_bonus') as HTMLInputElement).value = String(e.initiative_bonus);
  (document.getElementById('hp') as HTMLInputElement).value = String(e.hp);
  (document.getElementById('passive_defense') as HTMLInputElement).value = String(e.passive_defense);
  showForm();
}

function showForm(): void {
  (document.getElementById('form-section') as HTMLElement).style.display = 'block';
  document.getElementById('name')?.focus();
  hideAlert('form-alert');
}

function hideForm(): void {
  (document.getElementById('form-section') as HTMLElement).style.display = 'none';
  resetForm();
}

function resetForm(): void {
  (document.getElementById('enemy-form') as HTMLFormElement).reset();
}

function hideAlert(id: string): void {
  const el = document.getElementById(id);
  if (el) el.style.display = 'none';
}

document.getElementById('new-enemy-btn')?.addEventListener('click', openCreate);
document.getElementById('cancel-btn')?.addEventListener('click', hideForm);

document.getElementById('enemy-form')?.addEventListener('submit', async (e) => {
  e.preventDefault();
  hideAlert('form-alert');

  const body = {
    name: (document.getElementById('name') as HTMLInputElement).value.trim(),
    initiative_bonus: Number((document.getElementById('initiative_bonus') as HTMLInputElement).value),
    hp: Number((document.getElementById('hp') as HTMLInputElement).value),
    passive_defense: Number((document.getElementById('passive_defense') as HTMLInputElement).value),
  };

  if (!body.name) { showAlert('form-alert', 'O nome é obrigatório.', 'error'); return; }

  setLoading('submit-btn', true, 'Salvando...');
  const url = editingId ? `/api/enemies/${editingId}/` : '/api/enemies/';
  const method = editingId ? 'PUT' : 'POST';
  const res = await apiFetch(url, { method, body: JSON.stringify(body) });
  setLoading('submit-btn', false);

  if (!res.ok) { showAlert('form-alert', 'Erro ao salvar inimigo.', 'error'); return; }
  hideForm();
  loadEnemies();
});

async function deleteEnemy(id: number): Promise<void> {
  if (!confirm('Excluir este inimigo?')) return;
  const res = await apiFetch(`/api/enemies/${id}/`, { method: 'DELETE' });
  if (res.ok || res.status === 204) loadEnemies();
  else showAlert('page-alert', 'Erro ao excluir inimigo.', 'error');
}

function esc(str: string): string {
  return str.replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c] ?? c));
}
