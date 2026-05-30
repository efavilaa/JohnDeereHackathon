import express from 'express'
import cors from 'cors'

const app = express()
const PORT = 3001

app.use(cors())
app.use(express.json())

// In-memory store for submitted data entries
let dataEntries = []

// POST /api/data — receive data from the "Data" window
app.post('/api/data', (req, res) => {
  const { title, value, notes } = req.body

  if (!title || value === undefined) {
    return res.status(400).json({ error: 'title and value are required' })
  }

  const entry = {
    id: Date.now(),
    title,
    value,
    notes: notes || '',
    timestamp: new Date().toISOString(),
  }

  dataEntries.push(entry)
  console.log(`[Data received] ${entry.title}: ${entry.value}`)
  res.status(201).json({ message: 'Data stored', entry })
})

// GET /api/data — serve all stored data to the "Interfaz" window
app.get('/api/data', (_req, res) => {
  res.json({ entries: dataEntries })
})

// DELETE /api/data/:id — remove a single entry
app.delete('/api/data/:id', (req, res) => {
  const id = Number(req.params.id)
  const before = dataEntries.length
  dataEntries = dataEntries.filter((e) => e.id !== id)

  if (dataEntries.length === before) {
    return res.status(404).json({ error: 'Entry not found' })
  }

  res.json({ message: 'Entry deleted' })
})

// DELETE /api/data — clear all entries
app.delete('/api/data', (_req, res) => {
  dataEntries = []
  res.json({ message: 'All entries cleared' })
})

app.listen(PORT, () => {
  console.log(`Backend running at http://localhost:${PORT}`)
})
