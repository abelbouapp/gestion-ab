import { useState } from 'react'
import { Play, Square, Check, Pencil, Trash2, Clock } from 'lucide-react'
import { useData } from '../context/DataContext'
import { formatTime, formatHours, formatDate } from '../utils/helpers'
import { StatusBadge, Badge } from './UI'
import TaskModal from './TaskModal'
import styles from './TaskRow.module.css'

export default function TaskRow({ task, client, timers, onToggleTimer, onStopTimer, showClient }) {
  const { updateTask, deleteTask } = useData()
  const [editing, setEditing] = useState(false)
  const timer = timers[task.id]
  const isRunning = timer?.running

  function handleDelete() {
    if (!window.confirm('¿Eliminar esta tarea?')) return
    if (isRunning) onStopTimer(task.id)
    deleteTask(task.id)
  }

  return (
    <>
      <div className={`${styles.row} ${task.status === 'done' ? styles.done : ''}`}>
        {/* Done toggle */}
        <button
          className={`${styles.checkBtn} ${task.status === 'done' ? styles.checked : ''}`}
          onClick={() => {
            if (isRunning) onStopTimer(task.id)
            updateTask(task.id, { status: task.status === 'done' ? 'pending' : 'done' })
          }}
          title={task.status === 'done' ? 'Marcar pendiente' : 'Marcar completada'}
        >
          {task.status === 'done' && <Check size={12} />}
        </button>

        {/* Info */}
        <div className={styles.info}>
          <div className={styles.titleRow}>
            <span className={styles.taskTitle}>{task.title}</span>
            {task.invoiced && <span className={styles.invoicedTag}>Facturada</span>}
            {task.type === 'hourly' && <span className={styles.typeTag}>Por hora</span>}
            {task.type === 'fixed' && <span className={styles.typeTag}>Precio fijo</span>}
          </div>
          <div className={styles.meta}>
            {showClient && client && <span className={styles.clientName}>{client.name} · </span>}
            {task.description && <span>{task.description.slice(0, 60)}{task.description.length > 60 ? '…' : ''} · </span>}
            {task.type === 'hourly'
              ? <span><Clock size={11} style={{ display:'inline', verticalAlign:'middle' }} /> {formatHours(task.hoursWorked || 0)} trabajadas</span>
              : task.price ? <span>{task.price}€</span> : null
            }
            {task.dueDate && <span> · Entrega: {formatDate(task.dueDate)}</span>}
          </div>
        </div>

        {/* Timer display */}
        {isRunning && (
          <div className={styles.timerDisplay}>
            {formatTime(timer.elapsed)}
          </div>
        )}

        {/* Actions */}
        <div className={styles.actions}>
          {task.type === 'hourly' && task.status !== 'done' && (
            <button
              className={`${styles.timerBtn} ${isRunning ? styles.timerRunning : ''}`}
              onClick={() => onToggleTimer(task.id)}
              title={isRunning ? 'Parar timer' : 'Iniciar timer'}
            >
              {isRunning ? <Square size={13} /> : <Play size={13} />}
              {isRunning ? 'Parar' : 'Timer'}
            </button>
          )}
          <button className={styles.iconBtn} onClick={() => setEditing(true)} title="Editar">
            <Pencil size={14} />
          </button>
          <button className={`${styles.iconBtn} ${styles.danger}`} onClick={handleDelete} title="Eliminar">
            <Trash2 size={14} />
          </button>
        </div>
      </div>

      {editing && (
        <TaskModal
          initial={task}
          clients={[client].filter(Boolean)}
          onSave={data => { updateTask(task.id, data); setEditing(false) }}
          onClose={() => setEditing(false)}
        />
      )}
    </>
  )
}
