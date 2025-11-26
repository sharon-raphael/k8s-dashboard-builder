import { useEffect, useState, useRef } from 'react'
import Table from '../components/Table'
import * as yaml from 'js-yaml'
import config from '../config.json'
import { FunnelIcon, CameraIcon, DocumentArrowDownIcon } from '@heroicons/react/24/outline'
import html2canvas from 'html2canvas'
import jsPDF from 'jspdf'

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
  const [timezone, setTimezone] = useState('UTC')
  const [currentTime, setCurrentTime] = useState('')

  useEffect(() => {
    const updateTime = () => {
      const now = new Date()
      const options: Intl.DateTimeFormatOptions = {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
        timeZone: timezone,
        timeZoneName: 'short'
      }
      // Format: DD-MM-YYYY HH:MM AM/PM <timezone>
      // Intl.DateTimeFormat with 'short' gives something like "11/25/2025, 10:30 PM GMT+5:30" or "IST" depending on browser/locale
      // We need to manually construct "DD-MM-YYYY" because standard locales are usually MM/DD or YYYY-MM-DD

      try {
        const formatter = new Intl.DateTimeFormat('en-GB', options)
        const parts = formatter.formatToParts(now)

        const day = parts.find(p => p.type === 'day')?.value
        const month = parts.find(p => p.type === 'month')?.value
        const year = parts.find(p => p.type === 'year')?.value
        const hour = parts.find(p => p.type === 'hour')?.value
        const minute = parts.find(p => p.type === 'minute')?.value
        const dayPeriod = parts.find(p => p.type === 'dayPeriod')?.value?.toUpperCase()
        const timeZoneName = parts.find(p => p.type === 'timeZoneName')?.value

        setCurrentTime(`${day}-${month}-${year} ${hour}:${minute} ${dayPeriod} ${timeZoneName}`)
      } catch (e) {
        // Fallback if timezone is invalid
        setCurrentTime(now.toLocaleString())
      }
    }

    updateTime()
    const interval = setInterval(updateTime, 1000) // Update every second to be accurate, though minute is requested
    return () => clearInterval(interval)
  }, [timezone])

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
        const resConfig = await fetch(`${config.apiHost}/api/config`, { cache: 'no-store' })
        const dataConfig = await resConfig.json()
        const parsed: any = yaml.load(dataConfig.config)
        const dashboards = parsed?.config?.dashboards || []
        const match = dashboards.find((d: any) => d.name === selected)
        if (match) {
          setDashboardHeader(match.header || 'Dashboard')
        }

        // Helper to find timezone in object (case-insensitive)
        const findTimezone = (obj: any): string | undefined => {
          if (!obj) return undefined
          const keys = Object.keys(obj)
          const key = keys.find(k => k.toLowerCase() === 'timezone')
          return key ? obj[key] : undefined
        }

        // Set timezone from config or default
        const configTimezone = parsed?.config ? findTimezone(parsed.config) : undefined
        const rootTimezone = findTimezone(parsed)

        setTimezone(configTimezone || rootTimezone || 'UTC')

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

  const captureRef = useRef<HTMLDivElement>(null)

  const handleScreenshot = async () => {
    if (!captureRef.current) return
    try {
      const isDarkMode = document.documentElement.classList.contains('dark')
      const backgroundColor = isDarkMode ? '#111827' : '#ffffff' // gray-900 or white

      const canvas = await html2canvas(captureRef.current, {
        backgroundColor: backgroundColor
      })
      const image = canvas.toDataURL('image/png')
      const link = document.createElement('a')
      link.href = image
      link.download = `dashboard-${selected}-${new Date().toISOString()}.png`
      link.click()
    } catch (err) {
      console.error('Failed to capture screenshot', err)
    }
  }

  const handleExportPDF = async () => {
    if (!captureRef.current) return
    try {
      const isDarkMode = document.documentElement.classList.contains('dark')
      const backgroundColor = isDarkMode ? '#111827' : '#ffffff'

      const canvas = await html2canvas(captureRef.current, {
        backgroundColor: backgroundColor
      })
      const imgData = canvas.toDataURL('image/png')
      const pdf = new jsPDF({
        orientation: 'landscape',
        unit: 'px',
        format: [canvas.width, canvas.height]
      })
      pdf.addImage(imgData, 'PNG', 0, 0, canvas.width, canvas.height)
      pdf.save(`dashboard-${selected}-${new Date().toISOString()}.pdf`)
    } catch (err) {
      console.error('Failed to export PDF', err)
    }
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8" ref={captureRef}>
      {/* Header Section */}
      <div className="mb-8 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 mb-2">

            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              {dashboardHeader}
            </h1>
          </div>

        </div>

        <div className="flex gap-2 ml-11 sm:ml-0" data-html2canvas-ignore>
          <button
            onClick={handleScreenshot}
            className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors shadow-sm text-sm font-medium"
          >
            <CameraIcon className="w-4 h-4" />
            Screenshot
          </button>
          <button
            onClick={handleExportPDF}
            className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors shadow-sm text-sm font-medium"
          >
            <DocumentArrowDownIcon className="w-4 h-4" />
            Export PDF
          </button>
        </div>
      </div>

      {/* Controls Section */}
      {namespaceDropdownEnabled && (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4 mb-6 flex items-center gap-4" data-html2canvas-ignore>
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

      {!loading && !error && (
        <div className="mt-4 px-2">
          <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">
            {currentTime}
          </p>
        </div>
      )}
    </div>
  )
}

export default Home
