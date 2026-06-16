import { useState, useEffect, useCallback } from 'react'
import { invoicesApi } from '../utils/api'
import { useAuth } from '../context/AuthContext'
import { buildInvoiceNumber } from '../utils/helpers'

export function useInvoices(clientId = null) {
  const { user } = useAuth()
  const uid = user?.email || 'default'
  const [invoices, setInvoices] = useState([])
  const [loading,  setLoading]  = useState(true)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const data = await invoicesApi.list(uid, clientId)
      setInvoices(data)
    } catch (e) { console.error(e) }
    setLoading(false)
  }, [uid, clientId])

  useEffect(() => { load() }, [load])

  function getNextSeq(series) {
    const last = invoices
      .filter(i => i.series === series)
      .reduce((m, i) => Math.max(m, Number(i.number_seq) || 0), 0)
    return last + 1
  }

  async function addInvoice(fields) {
    let seq, number
    if (fields.status === 'draft') {
      seq = 0
      number = 'BORRADOR'
    } else {
      seq = getNextSeq(fields.series)
      number = buildInvoiceNumber(fields.series, seq)
    }
    const data = await invoicesApi.create(uid, { ...fields, number_seq: seq, number })
    setInvoices(p => [data, ...p])
    return { data }
  }

  async function finalizeInvoice(id, series) {
    const seq = getNextSeq(series)
    const number = buildInvoiceNumber(series, seq)
    const data = await invoicesApi.update(id, { number_seq: seq, number })
    setInvoices(p => p.map(i => i.id === id ? data : i))
    return { data }
  }

  async function updateInvoice(id, fields) {
    const data = await invoicesApi.update(id, fields)
    setInvoices(p => p.map(i => i.id === id ? { ...i, ...data } : i))
    return { data }
  }

  async function deleteInvoice(id) {
    await invoicesApi.delete(id)
    setInvoices(p => p.filter(i => i.id !== id))
  }

  const ivaCollected  = invoices.reduce((s, i) => s + Number(i.iva_amount  || 0), 0)
  const irpfRetained  = invoices.reduce((s, i) => s + Number(i.irpf_amount || 0), 0)
  const totalBilled   = invoices.reduce((s, i) => s + Number(i.total       || 0), 0)

  return {
    invoices, loading, reload: load,
    addInvoice, updateInvoice, deleteInvoice, finalizeInvoice,
    ivaCollected, irpfRetained, totalBilled
  }
}
