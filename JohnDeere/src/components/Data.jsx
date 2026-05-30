import { useState } from 'react'
import './Data.css'

export default function Data() {
  const [title, setTitle] = useState('')
  const [value, setValue] = useState('')
  const [notes, setNotes] = useState('')
  const [status, setStatus] = useState(null) // 'success' | 'error' | null

  async function handleSubmit(e) {
    e.preventDefault()
    setStatus(null)

    try {
      const res = await fetch('/api/data', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, value, notes }),
      })

      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || 'Request failed')
      }

      setStatus({ type: 'success', message: 'Data sent successfully!' })
      setTitle('')
      setValue('')
      setNotes('')
    } catch (err) {
      setStatus({ type: 'error', message: err.message })
    }
  }

  return (
    <div className="data-window">
      <h2 className="window-title">Data</h2>
      <p className="window-subtitle">Fill in the form and send data to the backend.</p>

      <form className="data-form" onSubmit={handleSubmit}>
        <label>
          Title
          <input
            type="text"
            placeholder="e.g. Engine RPM"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
          />
        </label>

        <label>
          Value
          <input
            type="text"
            placeholder="e.g. 3200"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            required
          />
        </label>

        <label>
          Notes <span className="optional">(optional)</span>
          <textarea
            placeholder="Additional context..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={3}
          />
        </label>

        <button type="submit" className="submit-btn">Send Data</button>
      </form>

      {status && (
        <p className={`status-msg ${status.type}`}>{status.message}</p>
      )}
    </div>
  )
}
