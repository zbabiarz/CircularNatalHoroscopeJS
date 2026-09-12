import React from 'react'
import { Routes, Route } from 'react-router-dom'
import Home from './pages/Home'
import Result from './pages/Result'
import Share from './pages/Share'
import Admin from './pages/Admin'
import TestPdf from './pages/TestPdf'

function App() {
  return (
    <div className="min-h-screen">
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/result" element={<Result />} />
        <Route path="/share" element={<Share />} />
        <Route path="/admin" element={<Admin />} />
        <Route path="/test-pdf" element={<TestPdf />} />
      </Routes>
    </div>
  )
}

export default App