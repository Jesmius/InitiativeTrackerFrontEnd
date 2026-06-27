export const API_BASE = 'https://initiativetracker.pythonanywhere.com';
// ─── Auth Storage ─────────────────────────────────────────────────────────────
export const getToken = () => localStorage.getItem('access_token');
export const getRole = () => localStorage.getItem('user_role');
export const getUsername = () => localStorage.getItem('username');
export const getUserId = () => {
    const v = localStorage.getItem('user_id');
    return v ? parseInt(v) : null;
};
export function setAuth(tokens, profile) {
    localStorage.setItem('access_token', tokens.access);
    localStorage.setItem('refresh_token', tokens.refresh);
    localStorage.setItem('user_role', profile.role);
    localStorage.setItem('username', profile.username);
    localStorage.setItem('user_id', String(profile.id));
}
export function clearAuth() {
    ['access_token', 'refresh_token', 'user_role', 'username', 'user_id'].forEach(k => localStorage.removeItem(k));
}
export function logout() {
    clearAuth();
    window.location.href = './index.html';
}
export function requireAuth() {
    if (!getToken())
        window.location.href = './index.html';
}
export function requireRole(role) {
    requireAuth();
    if (getRole() !== role)
        window.location.href = './dashboard.html';
}
// ─── Token Refresh ────────────────────────────────────────────────────────────
async function refreshAccessToken() {
    const refresh = localStorage.getItem('refresh_token');
    if (!refresh)
        return false;
    try {
        const res = await fetch(`${API_BASE}/api/auth/token/refresh/`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ refresh }),
        });
        if (res.ok) {
            const data = await res.json();
            localStorage.setItem('access_token', data.access);
            return true;
        }
    }
    catch { /* network error */ }
    return false;
}
// ─── API Fetch ────────────────────────────────────────────────────────────────
export async function apiFetch(endpoint, options = {}) {
    const makeReq = (token) => {
        const headers = {
            'Content-Type': 'application/json',
            ...(options.headers ?? {}),
        };
        if (token)
            headers['Authorization'] = `Bearer ${token}`;
        return fetch(`${API_BASE}${endpoint}`, { ...options, headers });
    };
    let res = await makeReq(getToken());
    if (res.status === 401) {
        const refreshed = await refreshAccessToken();
        if (refreshed) {
            res = await makeReq(getToken());
        }
        else {
            clearAuth();
            window.location.href = './index.html';
        }
    }
    return res;
}
// ─── UI Helpers ───────────────────────────────────────────────────────────────
export function showAlert(id, msg, type = 'error') {
    const el = document.getElementById(id);
    if (!el)
        return;
    el.textContent = msg;
    el.className = `alert alert-${type}`;
    el.style.display = 'block';
}
export function hideAlert(id) {
    const el = document.getElementById(id);
    if (el)
        el.style.display = 'none';
}
export function setLoading(btnId, loading, text = 'Carregando...') {
    const btn = document.getElementById(btnId);
    if (!btn)
        return;
    if (loading) {
        btn.disabled = true;
        btn.dataset['orig'] = btn.textContent ?? '';
        btn.textContent = text;
    }
    else {
        btn.disabled = false;
        btn.textContent = btn.dataset['orig'] ?? '';
    }
}
// ─── Nav ──────────────────────────────────────────────────────────────────────
export function renderNav(activePage) {
    const role = getRole();
    const username = getUsername();
    const isMaster = role === 'master';
    const linkClass = (page) => activePage === page ? ' class="active"' : '';
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
//# sourceMappingURL=api.js.map