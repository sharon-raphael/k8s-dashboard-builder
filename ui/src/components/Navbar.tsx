import { useNavigate, useLocation } from 'react-router-dom'

const Navbar = () => {
  const navigate = useNavigate()
  const location = useLocation()

  const isConfigPage = location.pathname === '/config'
  const buttonLabel = isConfigPage ? 'Home' : 'Config'
  const targetRoute = isConfigPage ? '/' : '/config'

  return (
    <nav className="flex items-center justify-between px-6 py-4 bg-white shadow-md">
      <h1 className="text-2xl font-bold text-gray-800">My Dashboard</h1>
      <button
        onClick={() => navigate(targetRoute)}
        className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
      >
        {buttonLabel}
      </button>
    </nav>
  )
}

export default Navbar
