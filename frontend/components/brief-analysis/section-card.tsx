"use client"

import { LucideIcon } from "lucide-react"
import { ReactNode } from "react"

interface SectionCardProps {
  title: string
  icon: LucideIcon
  children: ReactNode
  iconColor?: string
}

export function SectionCard({ title, icon: Icon, children, iconColor = "text-purple-400" }: SectionCardProps) {
  return (
    <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-6 space-y-4">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-slate-800 rounded-lg flex items-center justify-center">
          <Icon className={`w-5 h-5 ${iconColor}`} />
        </div>
        <h3 className="font-semibold text-white text-lg">{title}</h3>
      </div>
      <div className="space-y-4">
        {children}
      </div>
    </div>
  )
}
