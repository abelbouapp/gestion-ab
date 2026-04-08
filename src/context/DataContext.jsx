import { createContext, useContext, useState, useEffect } from 'react'
import { useAuth } from './AuthContext'

const DataContext = createContext(null)

const EMPTY = { clients: [], tasks: [], invoices: [] }

export function DataProvider({ children }) {
  const { user } = useAuth()
  const storageKey = user ? `cf_data_${user.email}` : null

  const [data, setData] = useState(EMPTY)

  useEffect(() => {
    if (!storageKey) { setData(EMPTY); return }
    try {
      const saved = localStorage.getItem(storageKey)
      setData(saved ? JSON.parse(saved) : EMPTY)
    } catch { setData(EMPTY) }
  }, [storageKey])

  function save(next) {
    setData(next)
    if (storageKey) localStorage.setItem(storageKey, JSON.stringify(next))
  }

  /* ── CLIENTS ── */
  function addClient(client) {
    const c = { ...client, id: Date.now().toString(), createdAt: new Date().toISOString() }
    save({ ...data, clients: [...data.clients, c] })
    return c
  }
  function updateClient(id, fields) {
    save({ ...data, clients: data.clients.map(c => c.id === id ? { ...c, ...fields } : c) })
  }
  function deleteClient(id) {
    save({
      ...data,
      clients: data.clients.filter(c => c.id !== id),
      tasks:   data.tasks.filter(t => t.clientId !== id),
    })
  }

  /* ── TASKS ── */
  function addTask(task) {
    const t = { ...task, id: Date.now().toString(), createdAt: new Date().toISOString(), hoursWorked: 0, status: 'pending', invoiced: false }
    save({ ...data, tasks: [...data.tasks, t] })
    return t
  }
  function updateTask(id, fields) {
    save({ ...data, tasks: data.tasks.map(t => t.id === id ? { ...t, ...fields } : t) })
  }
  function deleteTask(id) {
    save({ ...data, tasks: data.tasks.filter(t => t.id !== id) })
  }
  function addHoursToTask(id, hours) {
    save({
      ...data,
      tasks: data.tasks.map(t => t.id === id ? { ...t, hoursWorked: (t.hoursWorked || 0) + hours } : t)
    })
  }

  /* ── INVOICES ── */
  function addInvoice(invoice) {
    const number = `FAC-${String(data.invoices.length + 1).padStart(4, '0')}`
    const inv = { ...invoice, id: Date.now().toString(), number, createdAt: new Date().toISOString(), status: 'draft' }
    // Mark tasks as invoiced
    const invoicedTaskIds = (inv.lines || []).map(l => l.taskId).filter(Boolean)
    const tasks = data.tasks.map(t => invoicedTaskIds.includes(t.id) ? { ...t, invoiced: true } : t)
    save({ ...data, invoices: [...data.invoices, inv], tasks })
    return inv
  }
  function updateInvoiceStatus(id, status) {
    save({ ...data, invoices: data.invoices.map(i => i.id === id ? { ...i, status } : i) })
  }
  function deleteInvoice(id) {
    save({ ...data, invoices: data.invoices.filter(i => i.id !== id) })
  }

  return (
    <DataContext.Provider value={{
      clients: data.clients,
      tasks:   data.tasks,
      invoices: data.invoices,
      addClient, updateClient, deleteClient,
      addTask, updateTask, deleteTask, addHoursToTask,
      addInvoice, updateInvoiceStatus, deleteInvoice,
    }}>
      {children}
    </DataContext.Provider>
  )
}

export const useData = () => useContext(DataContext)
