import { useLocation, useNavigate } from 'react-router-dom'
import { useEffect, useState } from 'react'
import * as yaml from 'js-yaml'
import config from '../config.json'

type Props = {
  selected: string
  setSelected: (value: string) => void
}

const Navbar = ({ selected, setSelected }: Props) => {
  const location = useLocation()
  const navigate = useNavigate()
  const isConfigPage = location.pathname === '/config'

  const [dashboardNames, setDashboardNames] = useState<string[]>([])

  useEffect(() => {
    const fetchDashboards = async () => {
      try {
        const res = await fetch(`${config.apiHost}/api/config`)
        const data = await res.json()
        const parsed: any = yaml.load(data.config)
        const dashboards = parsed?.config?.dashboards || []
        const names = dashboards.map((d: any) => d.name)
        setDashboardNames(names)
        if (!selected && names.length > 0) {
          setSelected(names[0])
        }
      } catch (err) {
        console.error('Failed to load dashboard names', err)
      }
    }

    fetchDashboards()
  }, [])

  return (
    <nav className="flex items-center justify-between px-6 py-4 bg-white shadow-md">
      <h1 className="text-2xl font-bold text-gray-800">K8s Dashboard</h1>

      {!isConfigPage && (
        <select
          className="border px-4 py-2 rounded text-gray-800 mx-auto"
          value={selected}
          onChange={(e) => setSelected(e.target.value)}
        >
          {dashboardNames.map((name) => (
            <option key={name} value={name}>
              {name}
            </option>
          ))}
        </select>
      )}

      <button
        onClick={() => navigate(isConfigPage ? '/' : '/config')}
        className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
      >
        {isConfigPage ? 'Home' : 'Config'}
      </button>
    </nav>
  )
}

export default Navbar
