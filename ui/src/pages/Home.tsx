import { useEffect, useState } from 'react'
import Table from '../components/Table'
import * as yaml from 'js-yaml'
import config from '../config.json'
import { ServerStackIcon, FunnelIcon } from '@heroicons/react/24/outline'

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
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header Section */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg text-indigo-600 dark:text-indigo-400">
            <ServerStackIcon className="w-6 h-6" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            {dashboardHeader}
          </h1>
        </div>
        <p className="text-gray-500 dark:text-gray-400 ml-11">
          Monitor and manage your Kubernetes resources
        </p>
      </div>

      {/* Controls Section */}
      {namespaceDropdownEnabled && (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4 mb-6 flex items-center gap-4">
          <div className="flex items-center gap-2 text-gray-600 dark:text-gray-300">
            <FunnelIcon className="w-5 h-5" />
            <span className="font-medium">Filters:</span>
          </div>

          <div className="flex items-center gap-2">
            <label className="text-sm text-gray-500 dark:text-gray-400">Namespace</label>
            <select
              value={selectedNamespace}
              onChange={handleNamespaceChange}
              className="pl-3 pr-8 py-1.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-shadow"
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

      {/* Content Section */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden min-h-[400px]">
        {loading && (
          <div className="flex flex-col items-center justify-center h-64 gap-3">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <p className="text-gray-500 dark:text-gray-400">Loading dashboard data...</p>
          </div>
        )}

        {error && (
          <div className="flex flex-col items-center justify-center h-64 gap-3 text-red-500">
            <div className="p-3 bg-red-100 dark:bg-red-900/20 rounded-full">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <p className="font-medium">{error}</p>
          </div>
        )}

        {!loading && !error && <Table columns={columns} data={data} />}
      </div>
    </div>
  )
}

export default Home
