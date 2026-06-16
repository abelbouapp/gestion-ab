import { useState, useEffect, useCallback } from 'react'
import { quotesApi } from '../utils/api'
import { useAuth } from '../context/AuthContext'

export function useQuotes() {
  const { user } = useAuth()
  const uid = user?.email || 'default'
  const [quotes,  setQuotes]  = useState([])
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const data = await quotesApi.list(uid)
      setQuotes(data)
    } catch (e) { console.error(e) }
    setLoading(false)
  }, [uid])

  useEffect(() => { load() }, [load])

  function getNextSeq() {
    const last = quotes.reduce((m, q) => Math.max(m, Number(q.number_seq) || 0), 0)
    return last + 1
  }

  async function addQuote(fields) {
    const seq = getNextSeq()
    const number = `PRES-${String(seq).padStart(3, '0')}`
    const data = await quotesApi.create(uid, { ...fields, number_seq: seq, number })
    setQuotes(p => [data, ...p])
    return { data }
  }

  async function updateQuote(id, fields) {
    const data = await quotesApi.update(id, fields)
    setQuotes(p => p.map(q => q.id === id ? { ...q, ...data } : q))
    return { data }
  }

  async function deleteQuote(id) {
    await quotesApi.delete(id)
    setQuotes(p => p.filter(q => q.id !== id))
  }

  return { quotes, loading, reload: load, addQuote, updateQuote, deleteQuote }
}
