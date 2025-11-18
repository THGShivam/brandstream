"use client"

import { Sparkles, Moon, Sun } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useTheme } from "@/components/theme-provider"

export function Header() {
  const { theme, toggleTheme } = useTheme()

  return (
    <header className="border-b border-border bg-background/80 backdrop-blur-md sticky top-0 z-50 transition-colors duration-300">
      <div className="container mx-auto px-4 py-4 max-w-7xl flex items-center justify-between">
        {/* Logo Section */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 dark:from-violet-500 dark:via-purple-500 dark:to-cyan-500 rounded-xl flex items-center justify-center shadow-lg">
            <Sparkles className="w-6 h-6 text-foreground" />
          </div>
          <div>
            <h1 className="font-bold text-lg text-foreground">Brandstream</h1>
            <p className="text-xs text-muted-foreground">AI Creative Engine</p>
          </div>
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-3">
          {/* Theme Toggle */}
          <Button
            onClick={toggleTheme}
            variant="outline"
            size="icon"
            className="rounded-full border-border bg-background hover:bg-accent transition-colors"
            aria-label="Toggle theme"
          >
            {theme === "dark" ? (
              <Sun className="h-5 w-5 text-foreground" />
            ) : (
              <Moon className="h-5 w-5 text-foreground" />
            )}
          </Button>

          <div className="pl-3 border-l border-border flex items-center gap-3">
            <div className="text-right text-sm">
              <p className="font-medium text-foreground">Sarah Mitchell</p>
              <p className="text-xs text-muted-foreground">Creative Director</p>
            </div>
            <div className="w-8 h-8 bg-gradient-to-br from-purple-400 to-pink-400 rounded-full"></div>
          </div>
        </div>
      </div>
    </header>
  )
}
