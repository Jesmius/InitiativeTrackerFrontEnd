import { apiFetch, requireRole, renderNav, showAlert, setLoading, type Character } from './api.js';

requireRole('player');
renderNav('characters');

let editingId: number | null = null;

loadCharacters();

async function loadCharacters(): Promise<void> {
  const list = document.getElementById('character-list') as HTMLElement;
  list.innerHTML = '<p class="text-muted text-center mt-2">Carregando...</p>';

  const res = await apiFetch('/api/characters/');
  if (!res.ok) { list.innerHTML = '<p class="text-danger">Erro ao carregar personagens.</p>'; return; }

  const chars = await res.json() as Character[];
  if (chars.length === 0) {
    list.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon"></div>
        <p>Nenhum personagem cadastrado. Crie o primeiro!</p>
      </div>`;
    return;
  }

  list.innerHTML = '';
  chars.forEach(c => list.appendChild(buildCard(c)));
}

function buildCard(c: Character): HTMLElement {
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
  div.querySelector<HTMLButtonElement>('[data-edit]')?.addEventListener('click', () => openEdit(c));
  div.querySelector<HTMLButtonElement>('[data-delete]')?.addEventListener('click', () => deleteChar(c.id));
  return div;
}

// ─── Form ─────────────────────────────────────────────────────────────────────

function openCreate(): void {
  editingId = null;
  (document.getElementById('form-title') as HTMLElement).textContent = 'Novo Personagem';
  (document.getElementById('submit-btn') as HTMLElement).textContent = 'Criar';
  resetForm();
  showForm();
}

function openEdit(c: Character): void {
  editingId = c.id;
  (document.getElementById('form-title') as HTMLElement).textContent = 'Editar Personagem';
  (document.getElementById('submit-btn') as HTMLElement).textContent = 'Salvar';
  (document.getElementById('name') as HTMLInputElement).value = c.name;
  (document.getElementById('initiative_bonus') as HTMLInputElement).value = String(c.initiative_bonus);
  showForm();
}

function showForm(): void {
  (document.getElementById('form-section') as HTMLElement).style.display = 'block';
  document.getElementById('name')?.focus();
  const el = document.getElementById('form-alert');
  if (el) el.style.display = 'none';
}

function hideForm(): void {
  (document.getElementById('form-section') as HTMLElement).style.display = 'none';
  resetForm();
}

function resetForm(): void {
  (document.getElementById('char-form') as HTMLFormElement).reset();
}

document.getElementById('new-char-btn')?.addEventListener('click', openCreate);
document.getElementById('cancel-btn')?.addEventListener('click', hideForm);

document.getElementById('char-form')?.addEventListener('submit', async (e) => {
  e.preventDefault();
  const el = document.getElementById('form-alert');
  if (el) el.style.display = 'none';

  const body = {
    name: (document.getElementById('name') as HTMLInputElement).value.trim(),
    initiative_bonus: Number((document.getElementById('initiative_bonus') as HTMLInputElement).value),
  };

  if (!body.name) { showAlert('form-alert', 'O nome é obrigatório.', 'error'); return; }

  setLoading('submit-btn', true, 'Salvando...');
  const url = editingId ? `/api/characters/${editingId}/` : '/api/characters/';
  const method = editingId ? 'PUT' : 'POST';
  const res = await apiFetch(url, { method, body: JSON.stringify(body) });
  setLoading('submit-btn', false);

  if (!res.ok) { showAlert('form-alert', 'Erro ao salvar personagem.', 'error'); return; }
  hideForm();
  loadCharacters();
});

async function deleteChar(id: number): Promise<void> {
  if (!confirm('Excluir este personagem?')) return;
  const res = await apiFetch(`/api/characters/${id}/`, { method: 'DELETE' });
  if (res.ok || res.status === 204) loadCharacters();
  else showAlert('page-alert', 'Erro ao excluir personagem.', 'error');
}

function esc(str: string): string {
  return str.replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c] ?? c));
}
