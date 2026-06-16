// ============================================================
//  API client — conecta con los endpoints PHP de Hostinger
//  Reemplaza completamente a Supabase
// ============================================================

const BASE = import.meta.env.VITE_API_URL || '/api'

async function req(method, endpoint, body = null, isFormData = false) {
  const opts = {
    method,
    headers: isFormData ? {} : { 'Content-Type': 'application/json' },
  }
  if (body) opts.body = isFormData ? body : JSON.stringify(body)

  const res = await fetch(`${BASE}/${endpoint}`, opts)
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }))
    throw new Error(err.error || `HTTP ${res.status}`)
  }
  return res.json()
}

const get  = (ep)         => req('GET',    ep)
const post = (ep, body)   => req('POST',   ep, body)
const put  = (ep, body)   => req('PUT',    ep, body)
const del  = (ep)         => req('DELETE', ep)

// ── CLIENTS ─────────────────────────────────────────────────
export const clientsApi = {
  list:   (uid)         => get(`clients.php?user_id=${uid}`),
  create: (uid, data)   => post('clients.php', { ...data, user_id: uid }),
  update: (id, data)    => put(`clients.php?id=${id}`, data),
  delete: (id)          => del(`clients.php?id=${id}`),
}

// ── PROJECTS ────────────────────────────────────────────────
export const projectsApi = {
  list:      (uid, cid) => get(`projects.php?user_id=${uid}${cid ? `&client_id=${cid}` : ''}`),
  create:    (uid, data)=> post('projects.php', { ...data, user_id: uid }),
  update:    (id, data) => put(`projects.php?id=${id}`, data),
  delete:    (id)       => del(`projects.php?id=${id}`),
}

// ── TIMER SESSIONS ───────────────────────────────────────────
export const sessionsApi = {
  list:   (pid)         => get(`timer_sessions.php?project_id=${pid}`),
  create: (data)        => post('timer_sessions.php', data),
  update: (id, data)    => put(`timer_sessions.php?id=${id}`, data),
  delete: (id)          => del(`timer_sessions.php?id=${id}`),
}

// ── INVOICES ─────────────────────────────────────────────────
export const invoicesApi = {
  list:   (uid, cid)    => get(`invoices.php?user_id=${uid}${cid ? `&client_id=${cid}` : ''}`),
  create: (uid, data)   => post('invoices.php', { ...data, user_id: uid }),
  update: (id, data)    => put(`invoices.php?id=${id}`, data),
  delete: (id)          => del(`invoices.php?id=${id}`),
}

// ── QUOTES ───────────────────────────────────────────────────
export const quotesApi = {
  list:   (uid)         => get(`quotes.php?user_id=${uid}`),
  create: (uid, data)   => post('quotes.php', { ...data, user_id: uid }),
  update: (id, data)    => put(`quotes.php?id=${id}`, data),
  delete: (id)          => del(`quotes.php?id=${id}`),
}

// ── TICKETS ──────────────────────────────────────────────────
export const ticketsApi = {
  list:   (uid)         => get(`tickets.php?user_id=${uid}`),
  create: async (uid, data, file) => {
    if (file) {
      const fd = new FormData()
      fd.append('file', file)
      Object.entries({ ...data, user_id: uid }).forEach(([k, v]) => fd.append(k, v))
      return req('POST', 'tickets.php', fd, true)
    }
    return post('tickets.php', { ...data, user_id: uid })
  },
  delete: (id)          => del(`tickets.php?id=${id}`),
}

// ── AUTH ─────────────────────────────────────────────────────
export const authApi = {
  login:          (email, password)      => post('auth.php', { action: 'login', email, password }),
  changePassword: (email, current, next) => post('auth.php', { action: 'change_password', email, current, next }),
}

// ── SETTINGS ─────────────────────────────────────────────────
export const settingsApi = {
  get:  (uid)       => get(`settings.php?user_id=${uid}`),
  save: (uid, data) => post('settings.php', { ...data, user_id: uid }),
}
