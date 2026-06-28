import { X } from "lucide-react"
import { cn } from "@/lib/utils"

interface ModalProps {
  open: boolean
  onClose: () => void
  title?: string
  children: React.ReactNode
  size?: "sm"|"md"|"lg"
}

const sizes = { sm:"max-w-sm", md:"max-w-md", lg:"max-w-2xl" }

export function Modal({ open, onClose, title, children, size="md" }: ModalProps) {
  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose}/>
      <div className={cn("relative bg-[#0f1117] border border-[#1e2130] rounded-2xl w-full shadow-2xl", sizes[size])}>
        {title && (
          <div className="flex items-center justify-between p-5 border-b border-[#1e2130]">
            <h3 className="text-sm font-semibold text-white">{title}</h3>
            <button onClick={onClose} className="p-1.5 hover:bg-[#1a1d2e] rounded-lg text-slate-400 hover:text-white transition-colors">
              <X className="w-4 h-4"/>
            </button>
          </div>
        )}
        <div className="p-5">{children}</div>
      </div>
    </div>
  )
}