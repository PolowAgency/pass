'use client'

import { useEffect } from 'react'

// Called once per session to update streak via API
export default function StreakUpdater() {
  useEffect(() => {
    const key = `streak_${new Date().toDateString()}`
    if (sessionStorage.getItem(key)) return
    fetch('/api/streak', { method: 'POST' }).then(() => {
      sessionStorage.setItem(key, '1')
    }).catch(() => {})
  }, [])
  return null
}
