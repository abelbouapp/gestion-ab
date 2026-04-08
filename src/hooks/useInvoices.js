import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../utils/supabase'
import { useAuth } from '../context/AuthContext'
import { buildInvoiceNumber } from '../utils/helpers'

export function useInvoices(clientId = null) {
  const { user } = useAuth()
  const uid = user?.email || 'default'
  const [invoices, setInvoices] = useState([])
  const [loading,  setLoading]  = useState(true)

  const load = useCallback(async () => {
    setLoading(true)
    let q = supabase.from('invoices').select('*').eq('user_id', uid)
    if (clientId) q = q.eq('client_id', clientId)
    const { data } = await q.order('created_at', { ascending: false })
    setInvoices(data || [])
    setLoading(false)
  }, [uid, clientId])

  useEffect(() => { load() }, [load])

  async function getNextSeq(series) {
    // Get highest seq for this series globally
    const { data } = await supabase
      .from('invoices')
      .select('number_seq')
      .eq('user_id', uid)
      .eq('series', series)
      .order('number_seq', { ascending: false })
      .limit(1)
    const last = data?.[0]?.number_seq || 0
    return last + 1
  }

  async function addInvoice(fields) {
    const seq    = await getNextSeq(fields.series)
    const number = buildInvoiceNumber(fields.series, seq)
    const { data, error } = await supabase
      .from('invoices')
      .insert({ ...fields, user_id: uid, number_seq: seq, number })
      .select().single()
    if (!error) setInvoices(p => [data, ...p])
    return { data, error }
  }

  async function updateInvoice(id, fields) {
    const { data, error } = await supabase
      .from('invoices').update(fields).eq('id', id).select().single()
    if (!error) setInvoices(p => p.map(i => i.id === id ? data : i))
    return { data, error }
  }

  async function deleteInvoice(id) {
    const { error } = await supabase.from('invoices').delete().eq('id', id)
    if (!error) setInvoices(p => p.filter(i => i.id !== id))
    return { error }
  }

  // Fiscal summary for current quarter
  const ivaCollected  = invoices.reduce((s, i) => s + (i.iva_amount || 0), 0)
  const irpfRetained  = invoices.reduce((s, i) => s + (i.irpf_amount || 0), 0)
  const totalBilled   = invoices.reduce((s, i) => s + (i.total || 0), 0)

  return {
    invoices, loading, reload: load,
    addInvoice, updateInvoice, deleteInvoice,
    ivaCollected, irpfRetained, totalBilled
  }
}
