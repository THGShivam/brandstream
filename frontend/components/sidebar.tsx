"use client"

interface SidebarProps {
  currentView: string
  setCurrentView: (view: "brief" | "workflow" | "project") => void
}

export function Sidebar({ currentView, setCurrentView }: SidebarProps) {
  return (
    <div className="w-40 bg-gradient-to-b from-slate-900 to-slate-950 border-r border-purple-500/20 p-4 flex flex-col">
      {/* Logo */}
      <div className="mb-8 flex items-center gap-2">
        <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
          <span className="text-white font-bold text-sm">B</span>
        </div>
        <div>
          <p className="text-sm font-bold text-white">Brandstream</p>
          <p className="text-xs text-purple-300">Intelligent Creative</p>
        </div>
      </div>

      {/* Menu Items */}
      <nav className="space-y-1 flex-1">
        {[
          { id: "brief", label: "New Brief", icon: "📝" },
          { id: "workflow", label: "Workflow", icon: "⚙️" },
          { id: "project", label: "Projects", icon: "📊" },
          { id: "assets", label: "Assets", icon: "🎨" },
          { id: "analytics", label: "Analytics", icon: "📈" },
          { id: "team", label: "Team", icon: "👥" },
        ].map((item) => (
          <button
            key={item.id}
            onClick={() =>
              item.id !== "assets" && item.id !== "analytics" && item.id !== "team" && setCurrentView(item.id as any)
            }
            className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-all ${
              currentView === item.id
                ? "bg-purple-500/30 text-purple-200 border border-purple-400/50"
                : "text-slate-300 hover:text-white hover:bg-slate-800"
            }`}
          >
            <span className="mr-2">{item.icon}</span>
            {item.label}
          </button>
        ))}
      </nav>

      {/* User Profile */}
      <div className="border-t border-purple-500/20 pt-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-gradient-to-br from-purple-400 to-pink-400 rounded-full"></div>
          <div className="text-xs flex-1">
            <p className="font-semibold text-white">Sarah M.</p>
            <p className="text-slate-400">Creative Director</p>
          </div>
        </div>
      </div>
    </div>
  )
}
