import { useState } from 'react'
import { Plus } from 'lucide-react'
import { useData } from '../context/DataContext'
import { useTimers } from '../utils/useTimers'
import { Btn, Empty } from '../components/UI'
import TaskModal from '../components/TaskModal'
import TaskRow from '../components/TaskRow'
import styles from './Tasks.module.css'

export default function Tasks() {
  const { clients, tasks, addTask } = useData()
  const { timers, toggleTimer, stopTimer } = useTimers()
  const [showModal, setShowModal] = useState(false)
  const [filter, setFilter] = useState('all')      // all | pending | done
  const [filterClient, setFilterClient] = useState('all')

  const filtered = tasks.filter(t => {
    if (filter !== 'all' && t.status !== filter) return false
    if (filterClient !== 'all' && t.clientId !== filterClient) return false
    return true
  })

  const activeTimers = Object.values(timers).filter(t => t.running).length

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Tareas</h1>
          <p className={styles.sub}>
            {tasks.length} tareas
            {activeTimers > 0 && <span className={styles.timerBadge}>⏱ {activeTimers} timer{activeTimers>1?'s':''} activo{activeTimers>1?'s':''}</span>}
          </p>
        </div>
        <Btn onClick={() => setShowModal(true)} disabled={clients.length === 0} icon={<Plus size={15} />}>
          Nueva tarea
        </Btn>
      </div>

      <div className={styles.filters}>
        <div className={styles.filterGroup}>
          {['all','pending','done'].map(f => (
            <button key={f}
              className={`${styles.filterBtn} ${filter===f?styles.filterActive:''}`}
              onClick={() => setFilter(f)}
            >
              {{ all: 'Todas', pending: 'Pendientes', done: 'Completadas' }[f]}
            </button>
          ))}
        </div>
        <select className={styles.clientFilter}
          value={filterClient} onChange={e => setFilterClient(e.target.value)}>
          <option value="all">Todos los clientes</option>
          {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
      </div>

      {clients.length === 0 && <p className={styles.hint}>Crea un cliente primero para poder añadir tareas.</p>}

      {filtered.length === 0 && tasks.length > 0 && <Empty message="Sin resultados con estos filtros." />}
      {filtered.length === 0 && tasks.length === 0 && <Empty message="No hay tareas aún." />}

      <div className={styles.list}>
        {filtered.map(t => {
          const client = clients.find(c => c.id === t.clientId)
          return (
            <TaskRow key={t.id} task={t} client={client} timers={timers}
              onToggleTimer={toggleTimer} onStopTimer={stopTimer} showClient />
          )
        })}
      </div>

      {showModal && (
        <TaskModal
          initial={{}}
          clients={clients}
          onSave={data => { addTask(data); setShowModal(false) }}
          onClose={() => setShowModal(false)}
        />
      )}
    </div>
  )
}
