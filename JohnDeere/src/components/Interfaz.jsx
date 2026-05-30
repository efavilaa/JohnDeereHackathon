import { useState, useEffect, useCallback } from 'react'
import './Interfaz.css'

const POLL_INTERVAL_MS = 3000 // refresh every 3 seconds

export default function Interfaz() {
  const [entries, setEntries] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [lastUpdated, setLastUpdated] = useState(null)

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch('/api/data')
      if (!res.ok) throw new Error('Failed to fetch data')
      const json = await res.json()
      setEntries(json.entries)
      setLastUpdated(new Date())
      setError(null)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchData()
    const interval = setInterval(fetchData, POLL_INTERVAL_MS)
    return () => clearInterval(interval)
  }, [fetchData])

  async function deleteEntry(id) {
    await fetch(`/api/data/${id}`, { method: 'DELETE' })
    setEntries((prev) => prev.filter((e) => e.id !== id))
  }

  async function clearAll() {
    await fetch('/api/data', { method: 'DELETE' })
    setEntries([])
  }

  return (
    <div className="interfaz-window">
      <div className="interfaz-header">
        <div>
          <h2 className="window-title">Interfaz</h2>
          <p className="window-subtitle">
            Displays data received from the backend.{' '}
            <span className="poll-note">Auto-refreshes every {POLL_INTERVAL_MS / 1000}s.</span>
          </p>
        </div>
        <div className="header-actions">
          <button className="refresh-btn" onClick={fetchData} title="Refresh now">
            Refresh
          </button>
          {entries.length > 0 && (
            <button className="clear-btn" onClick={clearAll}>
              Clear All
            </button>
          )}
        </div>
      </div>

      {lastUpdated && (
        <p className="last-updated">
          Last updated: {lastUpdated.toLocaleTimeString()}
        </p>
      )}

      {loading && <p className="loading">Loading...</p>}
      {error && <p className="fetch-error">Error: {error}</p>}

      {!loading && !error && entries.length === 0 && (
        <div className="empty-state">
          <p>No data yet. Go to the <strong>Data</strong> tab and send some!</p>
        </div>
      )}

      {entries.length > 0 && (
        <ul className="entries-list">
          {[...entries].reverse().map((entry) => (
            <li key={entry.id} className="entry-card">
              <div className="entry-main">
                <span className="entry-title">{entry.title}</span>
                <span className="entry-value">{entry.value}</span>
              </div>
              {entry.notes && (
                <p className="entry-notes">{entry.notes}</p>
              )}
              <div className="entry-footer">
                <span className="entry-timestamp">
                  {new Date(entry.timestamp).toLocaleString()}
                </span>
                <button
                  className="delete-btn"
                  onClick={() => deleteEntry(entry.id)}
                  title="Delete entry"
                >
                  Delete
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
