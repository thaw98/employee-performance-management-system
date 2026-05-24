import type { EmployeeImportValidationResponse } from '../employeeImportApi'

interface Props {
  result: EmployeeImportValidationResponse
  onDownloadErrorFile: () => void
  errorFileLoading: boolean
}

export function EmployeeImportValidationSummary({ result, onDownloadErrorFile, errorFileLoading }: Props) {
  const hasFailed = result.invalidRows > 0
  const hasValid = result.validRows > 0

  return (
    <div className="space-y-5">
      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-gray-50 rounded-xl p-4 text-center border border-gray-100">
          <p className="text-2xl font-bold text-gray-800">{result.totalRows}</p>
          <p className="text-xs text-gray-500 mt-1">Total Rows</p>
        </div>
        <div className="bg-emerald-50 rounded-xl p-4 text-center border border-emerald-100">
          <p className="text-2xl font-bold text-emerald-600">{result.validRows}</p>
          <p className="text-xs text-emerald-600 mt-1">Valid</p>
        </div>
        <div className={`rounded-xl p-4 text-center border ${hasFailed ? 'bg-red-50 border-red-100' : 'bg-gray-50 border-gray-100'}`}>
          <p className={`text-2xl font-bold ${hasFailed ? 'text-red-600' : 'text-gray-400'}`}>{result.invalidRows}</p>
          <p className={`text-xs mt-1 ${hasFailed ? 'text-red-500' : 'text-gray-400'}`}>Failed</p>
        </div>
      </div>

      {/* File name */}
      <div className="flex items-center gap-2 text-sm text-gray-500">
        <i className="bi bi-file-earmark-spreadsheet text-emerald-500"></i>
        <span>{result.fileName}</span>
      </div>

      {/* Action messages */}
      {!hasValid && !hasFailed && (
        <div className="p-4 bg-amber-50 border border-amber-100 rounded-xl text-sm text-amber-800">
          <i className="bi bi-exclamation-triangle mr-2"></i>
          No data rows were found in the file.
        </div>
      )}

      {hasValid && !hasFailed && (
        <div className="p-4 bg-emerald-50 border border-emerald-100 rounded-xl text-sm text-emerald-800">
          <i className="bi bi-check-circle mr-2"></i>
          All {result.validRows} rows are valid and ready to import.
        </div>
      )}

      {hasValid && hasFailed && (
        <div className="p-4 bg-[#eff6ff] border border-[#bfdbfe] rounded-xl text-sm text-[#1e40af]">
          <i className="bi bi-info-circle mr-2"></i>
          {result.validRows} valid rows can be imported. {result.invalidRows} rows will be skipped due to errors.
        </div>
      )}

      {!hasValid && hasFailed && (
        <div className="p-4 bg-red-50 border border-red-100 rounded-xl text-sm text-red-800">
          <i className="bi bi-x-circle mr-2"></i>
          All rows have errors. Please fix them and re-upload.
        </div>
      )}

      {/* Error table */}
      {hasFailed && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
              <i className="bi bi-exclamation-circle text-red-500"></i>
              Failed Rows ({result.invalidRows})
            </h4>
            {result.errorFileAvailable && (
              <button
                onClick={onDownloadErrorFile}
                disabled={errorFileLoading}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-white border border-red-200 text-red-600 rounded-lg hover:bg-red-50 disabled:opacity-60 transition"
              >
                {errorFileLoading ? (
                  <span className="inline-block w-3 h-3 border-2 border-red-400 border-t-transparent rounded-full animate-spin" />
                ) : (
                  <i className="bi bi-download"></i>
                )}
                Download Error File
              </button>
            )}
          </div>

          <div className="overflow-x-auto rounded-xl border border-gray-200">
            <table className="min-w-full text-xs">
              <thead>
                <tr className="bg-red-50 border-b border-red-100">
                  <th className="px-3 py-2 text-left text-red-700 font-semibold w-12">Row</th>
                  <th className="px-3 py-2 text-left text-red-700 font-semibold">Staff No</th>
                  <th className="px-3 py-2 text-left text-red-700 font-semibold">Full Name</th>
                  <th className="px-3 py-2 text-left text-red-700 font-semibold">Email</th>
                  <th className="px-3 py-2 text-left text-red-700 font-semibold">Errors</th>
                </tr>
              </thead>
              <tbody>
                {result.invalidItems.map((item) => (
                  <tr key={item.rowNumber} className="border-b border-gray-100 hover:bg-red-50/40 transition">
                    <td className="px-3 py-2 font-mono text-gray-500">{item.rowNumber}</td>
                    <td className="px-3 py-2 text-gray-700">{item.rowData['staffNo'] || '—'}</td>
                    <td className="px-3 py-2 text-gray-700">{item.rowData['fullName'] || '—'}</td>
                    <td className="px-3 py-2 text-gray-700">{item.rowData['email'] || '—'}</td>
                    <td className="px-3 py-2">
                      <ul className="list-disc list-inside space-y-0.5">
                        {item.errors.map((err, i) => (
                          <li key={i} className="text-red-600">{err}</li>
                        ))}
                      </ul>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
