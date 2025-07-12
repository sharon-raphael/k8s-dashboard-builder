import { useEffect, useState } from 'react'
import Table from '../components/Table'
import * as yaml from 'js-yaml'
import config from '../config.json'

type Props = {
  selected: string
}

const Home = ({ selected }: Props) => {
  const [dashboardHeader, setDashboardHeader] = useState('Welcome to the Dashboard')

  useEffect(() => {
    if (!selected) return

    const fetchHeader = async () => {
      try {
        const res = await fetch(`${config.apiHost}/api/config`)
        const data = await res.json()
        const parsed: any = yaml.load(data.config)
        const dashboards = parsed?.config?.dashboards || []
        const match = dashboards.find((d: any) => d.name === selected)
        if (match) {
          setDashboardHeader(match.header || 'Dashboard')
        }
      } catch (err) {
        console.error('Failed to fetch config', err)
      }
    }

    fetchHeader()
  }, [selected])

  return (
    <div>
      <header className="text-3xl font-semibold text-center py-6 text-gray-800">
        {dashboardHeader}
      </header>

      <Table />
    </div>
  )
}

export default Home
