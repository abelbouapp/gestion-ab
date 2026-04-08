import { useState, useEffect, useRef } from 'react'
import { useData } from '../context/DataContext'

export function useTimers() {
  const { addHoursToTask } = useData()
  // { [taskId]: { running: bool, elapsed: seconds } }
  const [timers, setTimers] = useState({})
  const intervals = useRef({})

  useEffect(() => {
    return () => Object.values(intervals.current).forEach(clearInterval)
  }, [])

  function startTimer(taskId) {
    if (timers[taskId]?.running) return
    setTimers(prev => ({ ...prev, [taskId]: { running: true, elapsed: prev[taskId]?.elapsed || 0 } }))
    intervals.current[taskId] = setInterval(() => {
      setTimers(prev => ({
        ...prev,
        [taskId]: { ...prev[taskId], elapsed: (prev[taskId]?.elapsed || 0) + 1 }
      }))
    }, 1000)
  }

  function stopTimer(taskId) {
    clearInterval(intervals.current[taskId])
    delete intervals.current[taskId]
    const elapsed = timers[taskId]?.elapsed || 0
    setTimers(prev => ({ ...prev, [taskId]: { running: false, elapsed: 0 } }))
    if (elapsed > 0) addHoursToTask(taskId, elapsed / 3600)
  }

  function toggleTimer(taskId) {
    if (timers[taskId]?.running) stopTimer(taskId)
    else startTimer(taskId)
  }

  return { timers, toggleTimer, stopTimer }
}
