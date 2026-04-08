import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../utils/supabase'
import { useAuth } from '../context/AuthContext'

export function useQuotes(clientId = null) {
  const { user } = useAuth()
  const uid = user?.email || 'default'
  const [quotes,  setQuotes]  = useState([])
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    setLoading(true)
    let q = supabase.from('quotes').select('*').eq('user_id', uid)
    if (clientId) q = q.eq('client_id', clientId)
    const { data } = await q.order('created_at', { ascending: false })
    setQuotes(data || [])
    setLoading(false)
  }, [uid, clientId])

  useEffect(() => { load() }, [load])

  async function getNextSeq() {
    const { data } = await supabase
      .from('quotes')
      .select('number_seq')
      .eq('user_id', uid)
      .order('number_seq', { ascending: false })
      .limit(1)
    return (data?.[0]?.number_seq || 0) + 1
  }

  async function addQuote(fields) {
    const seq    = await getNextSeq()
    const number = `PRES-${String(seq).padStart(3, '0')}`
    const { data, error } = await supabase
      .from('quotes')
      .insert({ ...fields, user_id: uid, number_seq: seq, number })
      .select().single()
    if (!error) setQuotes(p => [data, ...p])
    return { data, error }
  }

  async function updateQuote(id, fields) {
    const { data, error } = await supabase
      .from('quotes').update(fields).eq('id', id).select().single()
    if (!error) setQuotes(p => p.map(q => q.id === id ? data : q))
    return { data, error }
  }

  async function deleteQuote(id) {
    const { error } = await supabase.from('quotes').delete().eq('id', id)
    if (!error) setQuotes(p => p.filter(q => q.id !== id))
    return { error }
  }

  return { quotes, loading, reload: load, addQuote, updateQuote, deleteQuote }
}
