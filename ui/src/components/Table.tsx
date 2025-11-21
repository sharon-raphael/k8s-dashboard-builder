const Table = () => {
  return (
    <div className="overflow-x-auto p-6">
      <table className="min-w-full bg-white dark:bg-gray-800 shadow rounded overflow-hidden">
        <thead>
          <tr className="bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-gray-200">
            <th className="py-3 px-6 text-left">Name</th>
            <th className="py-3 px-6 text-left">Email</th>
            <th className="py-3 px-6 text-left">Role</th>
          </tr>
        </thead>
        <tbody>
          <tr className="border-b dark:border-gray-700">
            <td className="py-3 px-6">Alice</td>
            <td className="py-3 px-6">alice@example.com</td>
            <td className="py-3 px-6">Admin</td>
          </tr>
          <tr>
            <td className="py-3 px-6">Bob</td>
            <td className="py-3 px-6">bob@example.com</td>
            <td className="py-3 px-6">Editor</td>
          </tr>
        </tbody>
      </table>
    </div>
  )
}

export default Table
