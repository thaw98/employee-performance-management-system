import { useState, useMemo, memo } from 'react'

interface EmployeeProfileCellProps {
  url?: string
  name: string
}

function EmployeeProfileCell({ url, name }: EmployeeProfileCellProps) {
  const [imgError, setImgError] = useState(false)

  const initials = useMemo(
    () =>
      name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .substring(0, 2)
        .toUpperCase(),
    [name]
  )

  return (
    <div className="flex items-center gap-3">
      {url && !imgError ? (
        <img
          src={url}
          alt={name}
          className="h-10 w-10 rounded-full object-cover border border-gray-200"
          onError={() => setImgError(true)}
        />
      ) : (
        <div className="h-10 w-10 rounded-full bg-[#dbeafe] flex items-center justify-center text-[#1d4ed8] font-semibold border border-[#bfdbfe]">
          {initials}
        </div>
      )}
      <span className="font-medium text-gray-900">{name}</span>
    </div>
  )
}

export default memo(EmployeeProfileCell)
