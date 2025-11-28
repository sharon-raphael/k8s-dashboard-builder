import { useLocation, useNavigate } from 'react-router-dom'
import { useEffect, useState } from 'react'
import * as yaml from 'js-yaml'
import config from '../config.json'
import DarkModeToggle from './DarkModeToggle'
import { HomeIcon, Cog6ToothIcon } from '@heroicons/react/24/outline'

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
    <nav className="sticky top-0 z-50 backdrop-blur-md bg-white/80 dark:bg-gray-900/80 border-b border-gray-200 dark:border-gray-800 transition-colors duration-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo / Brand */}
          <div className="flex-shrink-0 flex items-center gap-2 cursor-pointer" onClick={() => navigate('/')}>
            <img src="/kudabu.svg" alt="Kudabu Logo" className="h-14 w-auto" />
          </div>

          {/* Center: Dashboard Selector */}
          <div className="flex-1 flex justify-center max-w-md mx-4">
            {!isConfigPage && dashboardNames.length > 0 && (
              <div className="relative w-full">
                <select
                  className="w-full appearance-none bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-200 py-2 pl-4 pr-10 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all cursor-pointer font-medium"
                  value={selected}
                  onChange={(e) => setSelected(e.target.value)}
                >
                  {dashboardNames.map((name) => (
                    <option key={name} value={name}>
                      {name}
                    </option>
                  ))}
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-500 dark:text-gray-400">
                  <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                    <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" />
                  </svg>
                </div>
              </div>
            )}
          </div>

          {/* Right: Actions */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate(isConfigPage ? '/' : '/config')}
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200
                text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-blue-600 dark:hover:text-blue-400"
            >
              {isConfigPage ? (
                <>
                  <HomeIcon className="w-5 h-5" />
                  <span>Dashboard</span>
                </>
              ) : (
                <>
                  <Cog6ToothIcon className="w-5 h-5" />
                  <span>Config</span>
                </>
              )}
            </button>

            <div className="w-px h-6 bg-gray-200 dark:bg-gray-700 mx-1"></div>

            <DarkModeToggle />
          </div>
        </div>
      </div>
    </nav>
  )
}

export default Navbar
