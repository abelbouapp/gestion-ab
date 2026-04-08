import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../utils/supabase'
import { useAuth } from '../context/AuthContext'

export function useTickets() {
  const { user } = useAuth()
  const uid = user?.email || 'default'
  const [tickets,  setTickets]  = useState([])
  const [loading,  setLoading]  = useState(true)
  const [uploading, setUploading] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    const { data } = await supabase
      .from('tickets')
      .select('*')
      .eq('user_id', uid)
      .order('date', { ascending: false })
    setTickets(data || [])
    setLoading(false)
  }, [uid])

  useEffect(() => { load() }, [load])

  async function uploadTicket(file, fields) {
    setUploading(true)
    try {
      // Upload file to storage
      const ext      = file.name.split('.').pop()
      const fileName = `${uid}/${Date.now()}.${ext}`
      const { error: uploadError } = await supabase.storage
        .from('tickets')
        .upload(fileName, file)

      if (uploadError) throw uploadError

      // Get public URL (signed)
      const { data: urlData } = await supabase.storage
        .from('tickets')
        .createSignedUrl(fileName, 60 * 60 * 24 * 365) // 1 year

      const { data, error } = await supabase
        .from('tickets')
        .insert({
          ...fields,
          user_id:   uid,
          file_url:  urlData?.signedUrl || '',
          file_name: file.name,
          file_path: fileName,
        })
        .select().single()

      if (!error) setTickets(p => [data, ...p])
      return { data, error }
    } finally {
      setUploading(false)
    }
  }

  async function addTicketNoFile(fields) {
    const { data, error } = await supabase
      .from('tickets')
      .insert({ ...fields, user_id: uid })
      .select().single()
    if (!error) setTickets(p => [data, ...p])
    return { data, error }
  }

  async function deleteTicket(id, filePath) {
    if (filePath) {
      await supabase.storage.from('tickets').remove([filePath])
    }
    const { error } = await supabase.from('tickets').delete().eq('id', id)
    if (!error) setTickets(p => p.filter(t => t.id !== id))
    return { error }
  }

  const ivaDeductible = tickets.reduce((s, t) => s + (t.iva_amount || 0), 0)
  const totalGastos   = tickets.reduce((s, t) => s + (t.amount || 0), 0)

  return {
    tickets, loading, uploading, reload: load,
    uploadTicket, addTicketNoFile, deleteTicket,
    ivaDeductible, totalGastos
  }
}
