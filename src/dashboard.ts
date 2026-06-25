import { apiFetch, getRole, renderNav, showAlert, setLoading, type Combat } from './api.js';

requireAuth();
renderNav('dashboard');

const role = getRole();
const isMaster = role === 'master';

const combatList = document.getElementById('combat-list') as HTMLElement;
const createSection = document.getElementById('create-section') as HTMLElement;
const createForm = document.getElementById('create-form') as HTMLFormElement;

if (isMaster && createSection) createSection.style.display = 'block';

loadCombats();

async function loadCombats(): Promise<void> {
  combatList.innerHTML = '<p class="text-muted text-center mt-2">Carregando...</p>';

  const res = await apiFetch('/api/combats/');
  if (!res.ok) { combatList.innerHTML = '<p class="text-danger">Erro ao carregar combates.</p>'; return; }

  const combats = await res.json() as Combat[];

  if (combats.length === 0) {
    combatList.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon">⚔️</div>
        <p>${isMaster ? 'Nenhum combate criado ainda. Crie o primeiro abaixo!' : 'Você não está em nenhum combate no momento.'}</p>
      </div>`;
    return;
  }

  combatList.innerHTML = '';
  combats.forEach(c => combatList.appendChild(buildCombatCard(c)));
}

function buildCombatCard(c: Combat): HTMLElement {
  const div = document.createElement('div');
  div.className = 'card';

  const participantCount = c.participants?.length ?? 0;
  const statusBadge = c.is_active
    ? '<span class="badge badge-active">Ativo</span>'
    : '<span class="badge badge-inactive">Encerrado</span>';

  div.innerHTML = `
    <div class="flex-between mb-1">
      <span class="card-title">${esc(c.name)}</span>
      ${statusBadge}
    </div>
    <div class="card-subtitle">
      Mestre: ${esc(c.master_username)} · Round ${c.round_number} · ${participantCount} participante(s)
    </div>
    <div class="mt-2 flex gap-1">
      <a href="./combat.html?id=${c.id}" class="btn btn-primary btn-sm">Ver Combate</a>
      ${isMaster ? `<button class="btn btn-danger btn-sm" data-delete="${c.id}">Excluir</button>` : ''}
    </div>
  `;

  div.querySelector<HTMLButtonElement>('[data-delete]')?.addEventListener('click', () => deleteCombat(c.id));
  return div;
}

createForm?.addEventListener('submit', async (e) => {
  e.preventDefault();
  const nameInput = document.getElementById('combat-name') as HTMLInputElement;
  const name = nameInput.value.trim();
  if (!name) return;

  setLoading('create-btn', true, 'Criando...');
  const res = await apiFetch('/api/combats/', { method: 'POST', body: JSON.stringify({ name, is_active: true }) });
  setLoading('create-btn', false);

  if (!res.ok) { showAlert('create-alert', 'Erro ao criar combate.', 'error'); return; }

  const combat = await res.json() as Combat;
  nameInput.value = '';
  window.location.href = `./combat.html?id=${combat.id}`;
});

async function deleteCombat(id: number): Promise<void> {
  if (!confirm('Excluir este combate? Esta ação não pode ser desfeita.')) return;
  const res = await apiFetch(`/api/combats/${id}/`, { method: 'DELETE' });
  if (res.ok || res.status === 204) loadCombats();
  else showAlert('page-alert', 'Erro ao excluir combate.', 'error');
}

function esc(str: string): string {
  return str.replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c] ?? c));
}

function requireAuth(): void {
  if (!localStorage.getItem('access_token')) window.location.href = './index.html';
}
