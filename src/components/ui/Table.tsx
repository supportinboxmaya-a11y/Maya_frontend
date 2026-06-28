import { cn } from "@/lib/utils"

interface Column<T> {
  key: keyof T | string
  header: string
  render?: (row: T) => React.ReactNode
  className?: string
}

interface TableProps<T> {
  columns: Column<T>[]
  data: T[]
  onRowClick?: (row: T) => void
  className?: string
}

export function Table<T extends Record<string, unknown>>({ columns, data, onRowClick, className }: TableProps<T>) {
  return (
    <div className={cn("overflow-x-auto rounded-xl border border-[#1e2130]", className)}>
      <table className="w-full">
        <thead>
          <tr className="border-b border-[#1e2130] bg-[#14161e]">
            {columns.map(col=>(
              <th key={String(col.key)} className={cn("px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider", col.className)}>
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row, i)=>(
            <tr key={i}
              className={cn("border-b border-[#1e2130]/50 transition-colors", onRowClick && "cursor-pointer hover:bg-[#1a1d2e]")}
              onClick={()=>onRowClick?.(row)}>
              {columns.map(col=>(
                <td key={String(col.key)} className={cn("px-4 py-3 text-sm text-slate-400", col.className)}>
                  {col.render ? col.render(row) : String(row[col.key as keyof T] ?? "")}
                </td>
              ))}
            </tr>
          ))}
          {data.length===0 && (
            <tr><td colSpan={columns.length} className="px-4 py-8 text-center text-sm text-slate-500">No data found</td></tr>
          )}
        </tbody>
      </table>
    </div>
  )
}