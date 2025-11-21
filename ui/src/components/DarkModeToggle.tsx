import { useState } from 'react'
import { SunIcon, MoonIcon } from '@heroicons/react/24/solid'
import useDarkMode from '../hooks/useDarkMode'

export default function DarkModeToggle() {
    const [colorTheme, setTheme] = useDarkMode()
    const [darkSide, setDarkSide] = useState(
        colorTheme === 'light' ? true : false
    )

    const toggleDarkMode = (checked: boolean) => {
        setTheme(colorTheme)
        setDarkSide(checked)
    }

    return (
        <button
            onClick={() => toggleDarkMode(!darkSide)}
            className="p-2 rounded-full bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            aria-label="Toggle Dark Mode"
        >
            {darkSide ? (
                <SunIcon className="h-5 w-5" />
            ) : (
                <MoonIcon className="h-5 w-5" />
            )}
        </button>
    )
}
