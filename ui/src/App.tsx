import { Routes, Route } from 'react-router-dom'
import Home from './pages/Home'
import Config from './pages/Config'
import Navbar from './components/Navbar'

function App() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/config" element={<Config />} />
      </Routes>
    </div>
  )
}

export default App