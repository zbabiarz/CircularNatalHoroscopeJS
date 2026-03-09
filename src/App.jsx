import React from 'react'
import { Routes, Route } from 'react-router-dom'
import Home from './pages/Home'
import Result from './pages/Result'
import Share from './pages/Share'
import Admin from './pages/Admin'

function App() {
  return (
    <div className="min-h-screen">
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/result" element={<Result />} />
        <Route path="/share" element={<Share />} />
        <Route path="/admin" element={<Admin />} />
      </Routes>
    </div>
  )
}

export default App