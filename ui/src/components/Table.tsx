type Column = {
  header: string
  field: string
}

type Props = {
  columns?: Column[]
  data?: any[]
}

const Table = ({ columns = [], data = [] }: Props) => {
  if (columns.length === 0) {
    return <div className="p-6 text-gray-500 dark:text-gray-400">No data to display</div>
  }

  return (
    <div className="overflow-x-auto p-6">
      <table className="min-w-full bg-white dark:bg-gray-800 shadow rounded overflow-hidden">
        <thead>
          <tr className="bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-gray-200">
            {columns.map((col, idx) => (
              <th key={idx} className="py-3 px-6 text-left">
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row, rowIdx) => (
            <tr key={rowIdx} className="border-b dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
              {columns.map((col, colIdx) => (
                <td key={colIdx} className="py-3 px-6 text-gray-800 dark:text-gray-200">
                  {row[col.field]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export default Table
