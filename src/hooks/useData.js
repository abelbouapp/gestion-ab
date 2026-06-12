import { useState, useEffect, useCallback } from 'react'
import { clientsApi, projectsApi, sessionsApi } from '../utils/api'
import { useAuth } from '../context/AuthContext'

// ─── CLIENTS ────────────────────────────────────────────────
export function useClients() {
  const { user } = useAuth()
  const uid = user?.email || 'default'
  const [clients, setClients] = useState([])
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const data = await clientsApi.list(uid)
      setClients(data)
    } catch (e) { console.error(e) }
    setLoading(false)
  }, [uid])

  useEffect(() => { load() }, [load])

  async function addClient(fields) {
    const data = await clientsApi.create(uid, fields)
    setClients(p => [data, ...p])
    return { data }
  }
  async function updateClient(id, fields) {
    const data = await clientsApi.update(id, fields)
    setClients(p => p.map(c => c.id === id ? data : c))
    return { data }
  }
  async function deleteClient(id) {
    await clientsApi.delete(id)
    setClients(p => p.filter(c => c.id !== id))
  }

  return { clients, loading, reload: load, addClient, updateClient, deleteClient }
}

// ─── PROJECTS ───────────────────────────────────────────────
export function useProjects(clientId = null) {
  const { user } = useAuth()
  const uid = user?.email || 'default'
  const [projects, setProjects] = useState([])
  const [loading,  setLoading]  = useState(true)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const data = await projectsApi.list(uid, clientId)
      setProjects(data)
    } catch (e) { console.error(e) }
    setLoading(false)
  }, [uid, clientId])

  useEffect(() => { load() }, [load])

  async function addProject(fields) {
    const data = await projectsApi.create(uid, fields)
    setProjects(p => [data, ...p])
    return { data }
  }
  async function updateProject(id, fields) {
    const data = await projectsApi.update(id, fields)
    setProjects(p => p.map(x => x.id === id ? data : x))
    return { data }
  }
  async function deleteProject(id) {
    await projectsApi.delete(id)
    setProjects(p => p.filter(x => x.id !== id))
  }

  return { projects, loading, reload: load, addProject, updateProject, deleteProject }
}

// ─── TIMER SESSIONS ─────────────────────────────────────────
export function useTimerSessions(projectId) {
  const [sessions, setSessions] = useState([])

  const load = useCallback(async () => {
    if (!projectId) return
    try {
      const data = await sessionsApi.list(projectId)
      setSessions(data)
    } catch (e) { console.error(e) }
  }, [projectId])

  useEffect(() => { load() }, [load])

  async function startSession(projId) {
    try {
      const data = await sessionsApi.create({
        project_id: projId,
        started_at: new Date().toISOString().slice(0, 19).replace('T', ' ')
      })
      return data
    } catch (e) { console.error(e); return null }
  }

  async function stopSession(sessionId, minutes, notes = '') {
    try {
      const data = await sessionsApi.update(sessionId, {
        ended_at: new Date().toISOString().slice(0, 19).replace('T', ' '),
        minutes,
        notes
      })
      setSessions(p => [data, ...p.filter(s => s.id !== sessionId)])
      return data
    } catch (e) { console.error(e) }
  }

  async function addManualSession(projId, { started_at, ended_at, minutes, notes }) {
    try {
      const data = await sessionsApi.create({
        project_id: projId,
        started_at: new Date(started_at).toISOString().slice(0, 19).replace('T', ' '),
        ended_at:   new Date(ended_at).toISOString().slice(0, 19).replace('T', ' '),
        minutes,
        notes
      })
      setSessions(p => [data, ...p])
      return { data }
    } catch (e) { console.error(e) }
  }

  const totalMinutes = sessions.reduce((s, x) => s + (Number(x.minutes) || 0), 0)

  return { sessions, totalMinutes, startSession, stopSession, addManualSession, reload: load }
}
