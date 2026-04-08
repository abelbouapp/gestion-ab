import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../utils/supabase'
import { useAuth } from '../context/AuthContext'

// ─── CLIENTS ────────────────────────────────────────────────
export function useClients() {
  const { user } = useAuth()
  const uid = user?.email || 'default'
  const [clients, setClients] = useState([])
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    setLoading(true)
    const { data } = await supabase
      .from('clients')
      .select('*')
      .eq('user_id', uid)
      .order('created_at', { ascending: false })
    setClients(data || [])
    setLoading(false)
  }, [uid])

  useEffect(() => { load() }, [load])

  async function addClient(fields) {
    const { data, error } = await supabase
      .from('clients')
      .insert({ ...fields, user_id: uid })
      .select().single()
    if (!error) setClients(p => [data, ...p])
    return { data, error }
  }

  async function updateClient(id, fields) {
    const { data, error } = await supabase
      .from('clients').update(fields).eq('id', id).select().single()
    if (!error) setClients(p => p.map(c => c.id === id ? data : c))
    return { data, error }
  }

  async function deleteClient(id) {
    const { error } = await supabase.from('clients').delete().eq('id', id)
    if (!error) setClients(p => p.filter(c => c.id !== id))
    return { error }
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
    let q = supabase.from('projects').select('*').eq('user_id', uid)
    if (clientId) q = q.eq('client_id', clientId)
    const { data } = await q.order('created_at', { ascending: false })
    setProjects(data || [])
    setLoading(false)
  }, [uid, clientId])

  useEffect(() => { load() }, [load])

  async function addProject(fields) {
    const { data, error } = await supabase
      .from('projects')
      .insert({ ...fields, user_id: uid })
      .select().single()
    if (!error) setProjects(p => [data, ...p])
    return { data, error }
  }

  async function updateProject(id, fields) {
    const { data, error } = await supabase
      .from('projects').update(fields).eq('id', id).select().single()
    if (!error) setProjects(p => p.map(x => x.id === id ? data : x))
    return { data, error }
  }

  async function deleteProject(id) {
    const { error } = await supabase.from('projects').delete().eq('id', id)
    if (!error) setProjects(p => p.filter(x => x.id !== id))
    return { error }
  }

  return { projects, loading, reload: load, addProject, updateProject, deleteProject }
}

// ─── TIMER SESSIONS ─────────────────────────────────────────
export function useTimerSessions(projectId) {
  const [sessions, setSessions] = useState([])

  useEffect(() => {
    if (!projectId) return
    supabase
      .from('timer_sessions')
      .select('*')
      .eq('project_id', projectId)
      .order('started_at', { ascending: false })
      .then(({ data }) => setSessions(data || []))
  }, [projectId])

  async function startSession(projId) {
    const { data } = await supabase
      .from('timer_sessions')
      .insert({ project_id: projId, started_at: new Date().toISOString() })
      .select().single()
    return data
  }

  async function stopSession(sessionId, minutes) {
    const { data } = await supabase
      .from('timer_sessions')
      .update({ ended_at: new Date().toISOString(), minutes })
      .eq('id', sessionId)
      .select().single()
    setSessions(p => [data, ...p.filter(s => s.id !== sessionId)])
    return data
  }

  const totalMinutes = sessions.reduce((s, x) => s + (x.minutes || 0), 0)

  return { sessions, totalMinutes, startSession, stopSession, reload: () => {} }
}
