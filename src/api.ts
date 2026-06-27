export const API_BASE = 'https://initiativetracker.pythonanywhere.com';

// ─── Types ───────────────────────────────────────────────────────────────────

export interface Tokens { access: string; refresh: string; }

export interface UserProfile {
  id: number;
  username: string;
  email: string;
  role: string;
}

export interface Character {
  id: number;
  name: string;
  player: number;
  player_username: string;
  initiative_bonus: number;
  created_at: string;
  updated_at: string;
}

export interface Enemy {
  id: number;
  name: string;
  master: number;
  master_username: string;
  initiative_bonus: number;
  hp: number;
  passive_defense: number;
  created_at: string;
  updated_at: string;
}

export interface CombatParticipant {
  id: number;
  combat: number;
  character: number | null;
  character_name: string | null;
  character_player_id: number | null;
  enemy: number | null;
  enemy_name: string | null;
  display_name: string;
  participant_type: string;
  initiative_value: number;
  order: number;
  is_alive: boolean;
  current_hp: number | null;
  name_override: string;
}

export interface PartyMember {
  id: number;
  player_id: number;
  player_username: string;
}

export interface Combat {
  id: number;
  name: string;
  master: number;
  master_username: string;
  is_active: boolean;
  current_turn_index: number;
  round_number: number;
  current_participant_id: number | null;
  created_at: string;
  updated_at: string;
  participants: CombatParticipant[];
}

// ─── Auth Storage ─────────────────────────────────────────────────────────────

export const getToken = (): string | null => localStorage.getItem('access_token');
export const getRole = (): string | null => localStorage.getItem('user_role');
export const getUsername = (): string | null => localStorage.getItem('username');
export const getUserId = (): number | null => {
  const v = localStorage.getItem('user_id');
  return v ? parseInt(v) : null;
};

export function setAuth(tokens: Tokens, profile: UserProfile): void {
  localStorage.setItem('access_token', tokens.access);
  localStorage.setItem('refresh_token', tokens.refresh);
  localStorage.setItem('user_role', profile.role);
  localStorage.setItem('username', profile.username);
  localStorage.setItem('user_id', String(profile.id));
}

export function clearAuth(): void {
  ['access_token', 'refresh_token', 'user_role', 'username', 'user_id'].forEach(k =>
    localStorage.removeItem(k)
  );
}

export function logout(): void {
  clearAuth();
  window.location.href = './index.html';
}

export function requireAuth(): void {
  if (!getToken()) window.location.href = './index.html';
}

export function requireRole(role: string): void {
  requireAuth();
  if (getRole() !== role) window.location.href = './dashboard.html';
}

// ─── Token Refresh ────────────────────────────────────────────────────────────

async function refreshAccessToken(): Promise<boolean> {
  const refresh = localStorage.getItem('refresh_token');
  if (!refresh) return false;
  try {
    const res = await fetch(`${API_BASE}/api/auth/token/refresh/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refresh }),
    });
    if (res.ok) {
      const data = await res.json() as { access: string };
      localStorage.setItem('access_token', data.access);
      return true;
    }
  } catch { /* network error */ }
  return false;
}

// ─── API Fetch ────────────────────────────────────────────────────────────────

export async function apiFetch(endpoint: string, options: RequestInit = {}): Promise<Response> {
  const makeReq = (token: string | null) => {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string> ?? {}),
    };
    if (token) headers['Authorization'] = `Bearer ${token}`;
    return fetch(`${API_BASE}${endpoint}`, { ...options, headers });
  };

  let res = await makeReq(getToken());

  if (res.status === 401) {
    const refreshed = await refreshAccessToken();
    if (refreshed) {
      res = await makeReq(getToken());
    } else {
      clearAuth();
      window.location.href = './index.html';
    }
  }

  return res;
}

// ─── UI Helpers ───────────────────────────────────────────────────────────────

export function showAlert(id: string, msg: string, type: 'error' | 'success' = 'error'): void {
  const el = document.getElementById(id);
  if (!el) return;
  el.textContent = msg;
  el.className = `alert alert-${type}`;
  el.style.display = 'block';
}

export function hideAlert(id: string): void {
  const el = document.getElementById(id);
  if (el) el.style.display = 'none';
}

export function setLoading(btnId: string, loading: boolean, text = 'Carregando...'): void {
  const btn = document.getElementById(btnId) as HTMLButtonElement | null;
  if (!btn) return;
  if (loading) {
    btn.disabled = true;
    btn.dataset['orig'] = btn.textContent ?? '';
    btn.textContent = text;
  } else {
    btn.disabled = false;
    btn.textContent = btn.dataset['orig'] ?? '';
  }
}

// ─── Nav ──────────────────────────────────────────────────────────────────────

export function renderNav(activePage?: string): void {
  const role = getRole();
  const username = getUsername();
  const isMaster = role === 'master';

  const linkClass = (page: string) => activePage === page ? ' class="active"' : '';

  const nav = document.createElement('nav');
  nav.className = 'navbar';
  nav.innerHTML = `
    <a class="nav-brand" href="./dashboard.html">Initiative Tracker</a>
    <div class="nav-links">
      <a href="./dashboard.html"${linkClass('dashboard')}>Combates</a>
      ${isMaster
        ? `<a href="./enemies.html"${linkClass('enemies')}>Inimigos</a>
           <a href="./party.html"${linkClass('party')}>Jogadores</a>`
        : `<a href="./characters.html"${linkClass('characters')}>Personagens</a>`}
      <a href="./profile.html"${linkClass('profile')}>Perfil</a>
    </div>
    <div class="nav-user">
      <span class="badge ${isMaster ? 'badge-master' : 'badge-player'}">
        ${isMaster ? 'Mestre' : 'Jogador'}
      </span>
      <span class="nav-username">${username ?? ''}</span>
      <button class="btn btn-sm btn-outline" id="logout-btn">Sair</button>
    </div>
  `;
  document.body.insertBefore(nav, document.body.firstChild);
  document.getElementById('logout-btn')?.addEventListener('click', logout);
}
