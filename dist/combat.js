import { apiFetch, getRole, getUserId, renderNav, showAlert, } from './api.js';
if (!localStorage.getItem('access_token'))
    window.location.href = './index.html';
renderNav('dashboard');
const params = new URLSearchParams(location.search);
const combatId = params.get('id');
if (!combatId) {
    window.location.href = './dashboard.html';
    throw new Error();
}
const role = getRole();
const isMaster = role === 'master';
const myUserId = getUserId();
let currentCombat = null;
const pollInterval = 5000;
// ─── Load & Render ────────────────────────────────────────────────────────────
async function loadCombat() {
    const res = await apiFetch(`/api/combats/${combatId}/`);
    if (!res.ok) {
        showAlert('page-alert', 'Combate não encontrado.', 'error');
        return;
    }
    currentCombat = await res.json();
    render();
}
function render() {
    if (!currentCombat)
        return;
    const c = currentCombat;
    document.getElementById('combat-title').textContent = c.name;
    document.getElementById('round-num').textContent = `Round ${c.round_number}`;
    document.getElementById('status-badge').innerHTML = c.is_active
        ? '<span class="badge badge-active">Ativo</span>'
        : '<span class="badge badge-inactive">Encerrado</span>';
    const sorted = [...c.participants].sort((a, b) => a.order - b.order);
    const currentParticipant = sorted.find(p => p.id === c.current_participant_id) ?? null;
    const turnBanner = document.getElementById('turn-banner');
    if (currentParticipant) {
        const isMyTurn = !isMaster
            && currentParticipant.participant_type === 'character'
            && currentParticipant.character_player_id === myUserId;
        let turnText = `Turno de: <strong>${esc(currentParticipant.display_name)}</strong>`;
        if (isMyTurn)
            turnText += ' — <span class="text-accent">E a sua vez!</span>';
        turnBanner.innerHTML = turnText;
        turnBanner.style.display = 'block';
    }
    else {
        turnBanner.style.display = 'none';
    }
    renderTable(sorted, c.current_participant_id);
    renderMasterControls(c);
    renderPlayerControls(sorted, c.current_participant_id);
}
function renderTable(participants, currentId) {
    const tbody = document.getElementById('participants-tbody');
    if (participants.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" class="text-center text-muted" style="padding:24px">Nenhum participante adicionado ainda.</td></tr>';
        return;
    }
    tbody.innerHTML = '';
    participants.forEach((p, idx) => {
        const isCurrent = p.id === currentId;
        const isDead = !p.is_alive;
        const tr = document.createElement('tr');
        tr.className = `participant-row${isCurrent ? ' current-turn' : ''}${isDead ? ' dead' : ''}`;
        const typeBadge = p.participant_type === 'character'
            ? '<span class="badge badge-character">Personagem</span>'
            : '<span class="badge badge-enemy">Inimigo</span>';
        const isMyCharacter = !isMaster
            && p.participant_type === 'character'
            && p.character_player_id === myUserId;
        const canEditHP = isMaster || isMyCharacter;
        const hpCell = canEditHP
            ? `<input class="input-edit" type="number" value="${p.current_hp ?? ''}" placeholder="—" data-hp="${p.id}" data-ptype="${p.participant_type}" style="width:64px">`
            : `<span>${p.current_hp !== null ? p.current_hp : '—'}</span>`;
        const initCell = isMaster
            ? `<input class="input-edit" type="number" value="${p.initiative_value}" data-pid="${p.id}" style="width:60px">`
            : `${p.initiative_value}`;
        const deadBadge = isDead && p.participant_type === 'character'
            ? ' <span class="badge badge-inactive">Morto</span>'
            : '';
        let actionsHTML = '';
        if (isMaster) {
            actionsHTML = `
        <button class="btn btn-sm btn-outline" data-toggle="${p.id}">${p.is_alive ? 'Matar' : 'Reviver'}</button>
        <button class="btn btn-sm btn-danger" data-remove="${p.id}">Remover</button>
      `;
        }
        tr.innerHTML = `
      <td class="turn-pos">${isCurrent ? '→' : idx + 1}</td>
      <td class="participant-name">${esc(p.display_name)}${deadBadge}</td>
      <td>${typeBadge}</td>
      <td style="text-align:center">${initCell}</td>
      <td style="text-align:center">${hpCell}</td>
      <td class="actions-col">${actionsHTML}</td>
    `;
        tbody.appendChild(tr);
    });
    tbody.querySelectorAll('[data-pid]').forEach(input => {
        input.addEventListener('change', () => updateInitiative(Number(input.dataset['pid']), Number(input.value)));
    });
    tbody.querySelectorAll('[data-hp]').forEach(input => {
        input.addEventListener('change', () => {
            const id = Number(input.dataset['hp']);
            const ptype = input.dataset['ptype'];
            const hp = Number(input.value);
            updateHP(id, hp, ptype);
        });
    });
    if (isMaster) {
        tbody.querySelectorAll('[data-toggle]').forEach(btn => {
            btn.addEventListener('click', () => toggleAlive(Number(btn.dataset['toggle'])));
        });
        tbody.querySelectorAll('[data-remove]').forEach(btn => {
            btn.addEventListener('click', () => removeParticipant(Number(btn.dataset['remove'])));
        });
    }
}
function renderMasterControls(c) {
    const section = document.getElementById('master-controls');
    if (!isMaster) {
        section.style.display = 'none';
        return;
    }
    section.style.display = 'flex';
    document.getElementById('end-combat-btn').textContent =
        c.is_active ? 'Encerrar Combate' : 'Reabrir Combate';
}
function renderPlayerControls(participants, currentId) {
    const section = document.getElementById('player-controls');
    if (isMaster) {
        section.style.display = 'none';
        return;
    }
    section.style.display = 'block';
    const passBtn = document.getElementById('pass-turn-btn');
    const current = participants.find(p => p.id === currentId);
    const isMyTurn = current?.participant_type === 'character'
        && current?.character_player_id === myUserId;
    passBtn.disabled = !isMyTurn;
    passBtn.title = isMyTurn ? 'Passar seu turno' : 'Nao e sua vez';
}
// ─── Actions ──────────────────────────────────────────────────────────────────
document.getElementById('next-turn-btn')?.addEventListener('click', async () => {
    const res = await apiFetch(`/api/combats/${combatId}/next-turn/`, { method: 'POST' });
    if (res.ok) {
        currentCombat = await res.json();
        render();
    }
    else
        showAlert('page-alert', 'Erro ao avancar turno.', 'error');
});
document.getElementById('sort-btn')?.addEventListener('click', async () => {
    const res = await apiFetch(`/api/combats/${combatId}/sort-initiative/`, { method: 'POST' });
    if (res.ok) {
        currentCombat = await res.json();
        render();
    }
    else
        showAlert('page-alert', 'Erro ao ordenar.', 'error');
});
document.getElementById('pass-turn-btn')?.addEventListener('click', async () => {
    const res = await apiFetch(`/api/combats/${combatId}/next-turn/`, { method: 'POST' });
    if (res.ok) {
        currentCombat = await res.json();
        render();
    }
    else
        showAlert('page-alert', 'Nao e sua vez.', 'error');
});
document.getElementById('end-combat-btn')?.addEventListener('click', async () => {
    if (!currentCombat)
        return;
    const newStatus = !currentCombat.is_active;
    const res = await apiFetch(`/api/combats/${combatId}/`, {
        method: 'PATCH',
        body: JSON.stringify({ is_active: newStatus }),
    });
    if (res.ok) {
        currentCombat = await res.json();
        render();
    }
});
document.getElementById('refresh-btn')?.addEventListener('click', loadCombat);
// ─── Add Participant Modal ─────────────────────────────────────────────────────
document.getElementById('add-participant-btn')?.addEventListener('click', openAddModal);
document.getElementById('modal-close')?.addEventListener('click', closeModal);
document.getElementById('modal-cancel')?.addEventListener('click', closeModal);
async function openAddModal() {
    const modal = document.getElementById('add-modal');
    modal.style.display = 'flex';
    const typeSelect = document.getElementById('participant-type');
    const charGroup = document.getElementById('char-group');
    const enemyGroup = document.getElementById('enemy-group');
    await populateSelects();
    typeSelect.addEventListener('change', () => {
        const isChar = typeSelect.value === 'character';
        charGroup.style.display = isChar ? 'block' : 'none';
        enemyGroup.style.display = isChar ? 'none' : 'block';
    });
    typeSelect.dispatchEvent(new Event('change'));
}
async function populateSelects() {
    const [charsRes, enemiesRes] = await Promise.all([
        apiFetch('/api/characters/'),
        apiFetch('/api/enemies/'),
    ]);
    const chars = charsRes.ok ? await charsRes.json() : [];
    const enemies = enemiesRes.ok ? await enemiesRes.json() : [];
    const charSelect = document.getElementById('char-select');
    charSelect.innerHTML = chars.map(c => `<option value="${c.id}">${esc(c.name)} (${esc(c.player_username)}) [Bonus: ${c.initiative_bonus >= 0 ? '+' : ''}${c.initiative_bonus}]</option>`).join('');
    if (chars.length === 0)
        charSelect.innerHTML = '<option disabled>Nenhum jogador na sua lista. Adicione jogadores em "Jogadores".</option>';
    const enemySelect = document.getElementById('enemy-select');
    enemySelect.innerHTML = enemies.map(e => `<option value="${e.id}">${esc(e.name)} [HP: ${e.hp} | Bonus: ${e.initiative_bonus >= 0 ? '+' : ''}${e.initiative_bonus}]</option>`).join('');
    if (enemies.length === 0)
        enemySelect.innerHTML = '<option disabled>Nenhum inimigo cadastrado</option>';
}
document.getElementById('add-participant-form')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const type = document.getElementById('participant-type').value;
    const initiative = Number(document.getElementById('initiative-input').value);
    const body = { initiative_value: initiative, character: null, enemy: null };
    if (type === 'character') {
        body['character'] = Number(document.getElementById('char-select').value);
    }
    else {
        body['enemy'] = Number(document.getElementById('enemy-select').value);
    }
    const res = await apiFetch(`/api/combats/${combatId}/participants/`, { method: 'POST', body: JSON.stringify(body) });
    if (res.ok) {
        closeModal();
        loadCombat();
    }
    else
        showAlert('modal-alert', 'Erro ao adicionar participante.', 'error');
});
function closeModal() {
    const modal = document.getElementById('add-modal');
    modal.style.display = 'none';
}
// ─── Participant Actions ───────────────────────────────────────────────────────
async function updateInitiative(id, value) {
    await apiFetch(`/api/participants/${id}/`, {
        method: 'PATCH',
        body: JSON.stringify({ initiative_value: value }),
    });
    loadCombat();
}
async function updateHP(id, newHP, participantType) {
    if (newHP <= 0 && participantType === 'enemy') {
        await apiFetch(`/api/participants/${id}/`, { method: 'DELETE' });
        loadCombat();
        return;
    }
    const hp = Math.max(0, newHP);
    const body = { current_hp: hp };
    if (isMaster)
        body['is_alive'] = hp > 0;
    await apiFetch(`/api/participants/${id}/`, {
        method: 'PATCH',
        body: JSON.stringify(body),
    });
    loadCombat();
}
async function toggleAlive(id) {
    const participant = currentCombat?.participants.find(p => p.id === id);
    if (!participant)
        return;
    await apiFetch(`/api/participants/${id}/`, {
        method: 'PATCH',
        body: JSON.stringify({ is_alive: !participant.is_alive }),
    });
    loadCombat();
}
async function removeParticipant(id) {
    if (!confirm('Remover este participante do combate?'))
        return;
    await apiFetch(`/api/participants/${id}/`, { method: 'DELETE' });
    loadCombat();
}
function esc(str) {
    return str.replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c] ?? c));
}
// ─── Init ─────────────────────────────────────────────────────────────────────
loadCombat();
setInterval(loadCombat, pollInterval);
//# sourceMappingURL=combat.js.map