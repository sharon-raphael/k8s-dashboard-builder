import { useState, useEffect, useRef } from 'react'
import * as yaml from 'js-yaml'
import config from '../config.json'

const fallbackYaml = `# Kubernetes Dashboard Builder Configuration`

const Config = () => {
  const [editable, setEditable] = useState(false)
  const [yamlText, setYamlText] = useState(fallbackYaml)
  const [isValidYaml, setIsValidYaml] = useState(true)
  const [errorMessage, setErrorMessage] = useState('')
  const [apiHost, setApiHost] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const loadConfig = async () => {
      try {
        setApiHost(config.apiHost)

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

  return (
    <div className="p-6">
      {/* Header with buttons */}
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-semibold">YAML Configuration</h2>
        <div className="flex gap-2">
          <button
            onClick={handleImportClick}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Import
          </button>
          <button
            onClick={handleExport}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Export
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
      <textarea
        className={`w-full min-h-[300px] p-4 border rounded font-mono text-sm bg-white text-gray-800 ${
          editable
            ? isValidYaml
              ? 'border-blue-500'
              : 'border-red-500'
            : 'border-gray-300'
        }`}
        value={yamlText}
        onChange={(e) => setYamlText(e.target.value)}
        onKeyDown={handleKeyDown}
        readOnly={!editable}
        spellCheck={false}
      />

      {/* YAML error */}
      {!isValidYaml && (
        <div className="text-red-600 mt-2 text-sm font-medium">
          Invalid YAML: {errorMessage}
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex gap-4 mt-4">
        {!editable ? (
          <button
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            onClick={() => setEditable(true)}
          >
            Edit
          </button>
        ) : (
          <button
            className={`px-4 py-2 rounded text-white ${
              isValidYaml
                ? 'bg-green-600 hover:bg-green-700'
                : 'bg-gray-400 cursor-not-allowed'
            }`}
            onClick={() => setEditable(false)}
            disabled={!isValidYaml}
          >
            Save
          </button>
        )}

        <button
          className="px-4 py-2 bg-gray-400 text-white rounded hover:bg-gray-500"
          onClick={handleClear}
        >
          Clear
        </button>
      </div>
    </div>
  )
}

export default Config
