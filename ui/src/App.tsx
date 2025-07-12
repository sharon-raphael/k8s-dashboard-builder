import { useState } from 'react'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import Navbar from './components/Navbar'
import Home from './pages/Home'
import Config from './pages/Config'

const App = () => {
  const [selectedDashboard, setSelectedDashboard] = useState<string>('')

  return (
    <Router>
      <Navbar
        selected={selectedDashboard}
        setSelected={setSelectedDashboard}
      />
      <Routes>
        <Route
          path="/"
          element={
            <Home
              selected={selectedDashboard}
            />
          }
        />
        <Route path="/config" element={<Config />} />
      </Routes>
    </Router>
  )
}

export default App
