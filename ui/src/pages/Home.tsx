import { useEffect, useState } from 'react'
import Table from '../components/Table'
import * as yaml from 'js-yaml'
import config from '../config.json'

type Props = {
  selected: string
}

const Home = ({ selected }: Props) => {
  const [dashboardHeader, setDashboardHeader] = useState('Welcome to the Dashboard')
  const [columns, setColumns] = useState<any[]>([])
  const [data, setData] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!selected) return

    const fetchData = async () => {
      setLoading(true)
      setError('')
      try {
        // 1. Fetch Config for Header (Optimally this should be one call, but keeping existing logic + new)
        const resConfig = await fetch(`${config.apiHost}/api/config`)
        const dataConfig = await resConfig.json()
        const parsed: any = yaml.load(dataConfig.config)
        const dashboards = parsed?.config?.dashboards || []
        const match = dashboards.find((d: any) => d.name === selected)
        if (match) {
          setDashboardHeader(match.header || 'Dashboard')
        }

        // 2. Fetch Data
        const resData = await fetch(`${config.apiHost}/api/dashboard/${selected}`)
        if (!resData.ok) {
          throw new Error('Failed to fetch dashboard data')
        }
        const result = await resData.json()
        setColumns(result.columns || [])
        setData(result.data || [])

      } catch (err: any) {
        console.error('Failed to fetch dashboard', err)
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [selected])

  return (
    <div>
      <header className="text-3xl font-semibold text-center py-6 text-gray-800 dark:text-white">
        {dashboardHeader}
      </header>

      {loading && <div className="text-center py-4 text-gray-600 dark:text-gray-400">Loading...</div>}
      {error && <div className="text-center py-4 text-red-600">{error}</div>}
      {!loading && !error && <Table columns={columns} data={data} />}
    </div>
  )
}

export default Home
