import { useState } from 'react'
import Data from './components/Data'
import Interfaz from './components/Interfaz'
import './App.css'

const TABS = ['Data', 'Interfaz']

function App() {
  const [activeTab, setActiveTab] = useState('Data')

  return (
    <div className="app">
      <header className="app-header">
        <span className="app-brand">John Deere</span>
        <nav className="tab-nav">
          {TABS.map((tab) => (
            <button
              key={tab}
              className={`tab-btn${activeTab === tab ? ' active' : ''}`}
              onClick={() => setActiveTab(tab)}
            >
              {tab}
            </button>
          ))}
        </nav>
      </header>

      <main className="app-main">
        {activeTab === 'Data' && <Data />}
        {activeTab === 'Interfaz' && <Interfaz />}
      </main>
    </div>
  )
}

export default App
