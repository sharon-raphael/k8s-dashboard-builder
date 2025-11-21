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
  const [namespaceDropdownEnabled, setNamespaceDropdownEnabled] = useState(false)
  const [availableNamespaces, setAvailableNamespaces] = useState<string[]>([])
  const [selectedNamespace, setSelectedNamespace] = useState('')

  // Fetch namespaces when dropdown is enabled
  useEffect(() => {
    if (!namespaceDropdownEnabled) return

    const fetchNamespaces = async () => {
      try {
        const res = await fetch(`${config.apiHost}/api/namespaces`)
        const result = await res.json()
        setAvailableNamespaces(result.namespaces || [])
      } catch (err) {
        console.error('Failed to fetch namespaces', err)
      }
    }

    fetchNamespaces()
  }, [namespaceDropdownEnabled])

  useEffect(() => {
    if (!selected) return

    const fetchData = async (namespace?: string) => {
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
        const url = namespace
          ? `${config.apiHost}/api/dashboard/${selected}?namespace=${namespace}`
          : `${config.apiHost}/api/dashboard/${selected}`

        const resData = await fetch(url)
        if (!resData.ok) {
          throw new Error('Failed to fetch dashboard data')
        }
        const result = await resData.json()
        setColumns(result.columns || [])
        setData(result.data || [])
        setNamespaceDropdownEnabled(result.namespace_dropdown_enabled || false)

        // Set selected namespace to default if not already set
        if (!namespace && result.default_namespace) {
          setSelectedNamespace(result.default_namespace)
        }

      } catch (err: any) {
        console.error('Failed to fetch dashboard', err)
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [selected])

  const handleNamespaceChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newNamespace = e.target.value
    setSelectedNamespace(newNamespace)

    // Re-fetch data with new namespace
    const fetchData = async () => {
      setLoading(true)
      setError('')
      try {
        const url = `${config.apiHost}/api/dashboard/${selected}?namespace=${newNamespace}`
        const resData = await fetch(url)
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
  }

  return (
    <div>
      <header className="text-3xl font-semibold text-center py-6 text-gray-800 dark:text-white">
        {dashboardHeader}
      </header>

      {namespaceDropdownEnabled && (
        <div className="flex justify-start px-6 mb-4">
          <div className="flex items-center gap-2">
            <label className="text-gray-700 dark:text-gray-300 font-medium">Namespace:</label>
            <select
              value={selectedNamespace}
              onChange={handleNamespaceChange}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100"
            >
              {availableNamespaces.map((ns) => (
                <option key={ns} value={ns}>
                  {ns}
                </option>
              ))}
            </select>
          </div>
        </div>
      )}

      {loading && <div className="text-center py-4 text-gray-600 dark:text-gray-400">Loading...</div>}
      {error && <div className="text-center py-4 text-red-600">{error}</div>}
      {!loading && !error && <Table columns={columns} data={data} />}
    </div>
  )
}

export default Home
