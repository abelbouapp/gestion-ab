import { useState, useEffect, useCallback } from 'react'
import { ticketsApi } from '../utils/api'
import { useAuth } from '../context/AuthContext'

export function useTickets() {
  const { user } = useAuth()
  const uid = user?.email || 'default'
  const [tickets,   setTickets]   = useState([])
  const [loading,   setLoading]   = useState(true)
  const [uploading, setUploading] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const data = await ticketsApi.list(uid)
      setTickets(data)
    } catch (e) { console.error(e) }
    setLoading(false)
  }, [uid])

  useEffect(() => { load() }, [load])

  async function uploadTicket(file, fields) {
    setUploading(true)
    try {
      const data = await ticketsApi.create(uid, fields, file)
      setTickets(p => [data, ...p])
      return { data }
    } finally { setUploading(false) }
  }

  async function addTicketNoFile(fields) {
    const data = await ticketsApi.create(uid, fields, null)
    setTickets(p => [data, ...p])
    return { data }
  }

  async function deleteTicket(id) {
    await ticketsApi.delete(id)
    setTickets(p => p.filter(t => t.id !== id))
  }

  const ivaDeductible = tickets.reduce((s, t) => s + Number(t.iva_amount || 0), 0)
  const totalGastos   = tickets.reduce((s, t) => s + Number(t.amount     || 0), 0)

  return {
    tickets, loading, uploading, reload: load,
    uploadTicket, addTicketNoFile, deleteTicket,
    ivaDeductible, totalGastos
  }
}
