import { useState, useEffect, useRef } from 'react'
import * as yaml from 'js-yaml'
import config from '../config.json'
import {
  ArrowDownTrayIcon,
  ArrowUpTrayIcon,
  PencilSquareIcon,
  CheckIcon,
  TrashIcon,
  DocumentTextIcon,
  ExclamationTriangleIcon,
  ClipboardDocumentIcon,
  ClipboardDocumentCheckIcon
} from '@heroicons/react/24/outline'

const fallbackYaml = `# Kubernetes Dashboard Builder Configuration
config:
  timezone: UTC`

const Config = () => {
  const [editable, setEditable] = useState(false)
  const [yamlText, setYamlText] = useState(fallbackYaml)
  const [isValidYaml, setIsValidYaml] = useState(true)
  const [errorMessage, setErrorMessage] = useState('')
  const [copied, setCopied] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const loadConfig = async () => {
      try {
        const res = await fetch(`${config.apiHost}/api/config`)
        const data = await res.json()
        setYamlText(data.config)
      } catch (err) {
        console.error('Error loading config from API. Using fallback.')
        setYamlText(fallbackYaml)
      }
    }

    loadConfig()
  }, [])

  useEffect(() => {
    try {
      yaml.load(yamlText)
      setIsValidYaml(true)
      setErrorMessage('')
    } catch (err: any) {
      setIsValidYaml(false)
      setErrorMessage(err.message)
    }
  }, [yamlText])

  const handleClear = () => setYamlText('')
  const handleImportClick = () => fileInputRef.current?.click()

  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = () => {
      const content = reader.result as string
      setYamlText(content)
      setEditable(true)
    }
    reader.readAsText(file)
  }

  const handleExport = () => {
    const blob = new Blob([yamlText], { type: 'text/yaml' })
    const date = new Date()
    const filename = `k8s-dashboard-builder-config-${date
      .toLocaleDateString('en-GB')
      .split('/')
      .join('')}.yaml`

    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = filename
    link.click()
    URL.revokeObjectURL(link.href)
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Tab') {
      e.preventDefault()
      const target = e.target as HTMLTextAreaElement
      const start = target.selectionStart
      const end = target.selectionEnd
      const newText =
        yamlText.substring(0, start) + '  ' + yamlText.substring(end)
      setYamlText(newText)
      setTimeout(() => {
        target.selectionStart = target.selectionEnd = start + 2
      }, 0)
    }
  }

  const handleSave = async () => {
    try {
      const res = await fetch(`${config.apiHost}/api/config`, {
        method: 'POST',
        body: yamlText,
      })
      if (!res.ok) {
        throw new Error('Failed to save config')
      }
      setEditable(false)
    } catch (err: any) {
      console.error('Failed to save config', err)
      setErrorMessage(err.message)
      setIsValidYaml(false) // Force error display
    }
  }

  const handleCopy = () => {
    navigator.clipboard.writeText(yamlText)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
        {/* Header with buttons */}
        <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg text-blue-600 dark:text-blue-400">
              <DocumentTextIcon className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">Configuration</h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">Manage your dashboard YAML configuration</p>
            </div>
          </div>

          <div className="flex gap-2 w-full sm:w-auto">
            <button
              onClick={handleImportClick}
              className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors text-sm font-medium"
            >
              <ArrowDownTrayIcon className="w-4 h-4" />
              Import
            </button>
            <button
              onClick={handleExport}
              className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors text-sm font-medium"
            >
              <ArrowUpTrayIcon className="w-4 h-4" />
              Export
            </button>
            <button
              onClick={handleCopy}
              className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors text-sm font-medium"
            >
              {copied ? (
                <>
                  <ClipboardDocumentCheckIcon className="w-4 h-4 text-green-500" />
                  <span className="text-green-600 dark:text-green-400">Copied!</span>
                </>
              ) : (
                <>
                  <ClipboardDocumentIcon className="w-4 h-4" />
                  Copy
                </>
              )}
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept=".yaml,.yml"
              className="hidden"
              onChange={handleImportFile}
            />
          </div>
        </div>

        {/* YAML Editor */}
        <div className="relative">
          <textarea
            className={`w-full min-h-[600px] p-6 font-mono text-sm bg-gray-50 dark:bg-gray-900 text-gray-800 dark:text-gray-200 focus:outline-none resize-y ${!isValidYaml ? 'border-b-4 border-red-500' : ''
              }`}
            value={yamlText}
            onChange={(e) => setYamlText(e.target.value)}
            onKeyDown={handleKeyDown}
            readOnly={!editable}
            spellCheck={false}
          />
        </div>

        {/* Footer / Actions */}
        <div className="p-6 bg-gray-50 dark:bg-gray-900/50 border-t border-gray-200 dark:border-gray-700 flex flex-col sm:flex-row justify-between items-center gap-4">
          <div className="flex-1">
            {!isValidYaml && (
              <div className="flex items-center gap-2 text-red-600 bg-red-50 dark:bg-red-900/20 px-4 py-2 rounded-lg border border-red-200 dark:border-red-800/50">
                <ExclamationTriangleIcon className="w-5 h-5 flex-shrink-0" />
                <span className="text-sm font-medium truncate">{errorMessage}</span>
              </div>
            )}
          </div>

          <div className="flex gap-3 w-full sm:w-auto">
            {!editable ? (
              <button
                className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium shadow-sm hover:shadow"
                onClick={() => setEditable(true)}
              >
                <PencilSquareIcon className="w-5 h-5" />
                Edit Configuration
              </button>
            ) : (
              <button
                className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-6 py-2.5 rounded-lg text-white font-medium shadow-sm transition-all ${isValidYaml
                  ? 'bg-green-600 hover:bg-green-700 hover:shadow'
                  : 'bg-gray-400 cursor-not-allowed'
                  }`}
                onClick={handleSave}
                disabled={!isValidYaml}
              >
                <CheckIcon className="w-5 h-5" />
                Save Changes
              </button>
            )}

            <button
              className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2.5 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors font-medium"
              onClick={handleClear}
            >
              <TrashIcon className="w-5 h-5" />
              Clear
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Config
