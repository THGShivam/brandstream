"use client"

import * as React from "react"
import { Check, ChevronsUpDown, Search } from "lucide-react"
import { cn } from "@/services/utils"
import { Button } from "@/components/ui/button"

// Most used European languages for translation
export const EUROPEAN_LANGUAGES = [
  { value: "Spanish", label: "Spanish (Español)" },
  { value: "French", label: "French (Français)" },
  { value: "German", label: "German (Deutsch)" },
  { value: "Italian", label: "Italian (Italiano)" },
  { value: "Portuguese", label: "Portuguese (Português)" },
  { value: "Dutch", label: "Dutch (Nederlands)" },
  { value: "Polish", label: "Polish (Polski)" },
  { value: "Romanian", label: "Romanian (Română)" },
  { value: "Czech", label: "Czech (Čeština)" },
  { value: "Greek", label: "Greek (Ελληνικά)" },
  { value: "Hungarian", label: "Hungarian (Magyar)" },
  { value: "Swedish", label: "Swedish (Svenska)" },
  { value: "Danish", label: "Danish (Dansk)" },
  { value: "Finnish", label: "Finnish (Suomi)" },
  { value: "Norwegian", label: "Norwegian (Norsk)" },
  { value: "Croatian", label: "Croatian (Hrvatski)" },
  { value: "Bulgarian", label: "Bulgarian (Български)" },
  { value: "Slovak", label: "Slovak (Slovenčina)" },
  { value: "Lithuanian", label: "Lithuanian (Lietuvių)" },
  { value: "Slovenian", label: "Slovenian (Slovenščina)" },
]

interface LanguageSelectProps {
  value: string
  onChange: (value: string) => void
  disabled?: boolean
}

export function LanguageSelect({ value, onChange, disabled }: LanguageSelectProps) {
  const [open, setOpen] = React.useState(false)
  const [searchQuery, setSearchQuery] = React.useState("")
  const [openUpward, setOpenUpward] = React.useState(false)
  const buttonRef = React.useRef<HTMLDivElement>(null)

  const filteredLanguages = EUROPEAN_LANGUAGES.filter((lang) =>
    lang.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
    lang.value.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const selectedLanguage = EUROPEAN_LANGUAGES.find((lang) => lang.value === value)

  const handleToggle = () => {
    if (!open && buttonRef.current) {
      // Check if there's enough space below
      const rect = buttonRef.current.getBoundingClientRect()
      const spaceBelow = window.innerHeight - rect.bottom
      const dropdownHeight = 400 // max-h-[400px]

      // Open upward if not enough space below
      setOpenUpward(spaceBelow < dropdownHeight && rect.top > dropdownHeight)
    }
    setOpen(!open)
  }

  return (
    <div className="relative" ref={buttonRef}>
      <Button
        type="button"
        variant="outline"
        role="combobox"
        aria-expanded={open}
        disabled={disabled}
        onClick={handleToggle}
        className="w-full justify-between bg-card dark:bg-card/50 border-border hover:border-purple-500/50 text-foreground"
      >
        <span className="truncate">
          {selectedLanguage ? selectedLanguage.label : "Select language..."}
        </span>
        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
      </Button>

      {/* Dropdown Menu */}
      {open && (
        <>
          {/* Overlay to close dropdown */}
          <div
            className="fixed inset-0 z-40"
            onClick={() => {
              setOpen(false)
              setSearchQuery("")
            }}
          />

          {/* Dropdown */}
          <div className={`absolute z-50 w-full bg-card border border-border rounded-lg shadow-2xl max-h-[400px] flex flex-col ${
            openUpward ? 'bottom-full mb-2' : 'top-full mt-2'
          }`}>
            {/* Search Input */}
            <div className="p-2 border-b border-border">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Search languages..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-muted border border-border rounded-md pl-10 pr-4 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-purple-500"
                  autoFocus
                />
              </div>
            </div>

            {/* Languages List */}
            <div className="overflow-y-auto flex-1">
              {filteredLanguages.length === 0 ? (
                <div className="p-4 text-center text-sm text-muted-foreground">
                  No languages found
                </div>
              ) : (
                <div className="p-1">
                  {filteredLanguages.map((language) => (
                    <button
                      key={language.value}
                      type="button"
                      onClick={() => {
                        onChange(language.value)
                        setOpen(false)
                        setSearchQuery("")
                      }}
                      className={cn(
                        "w-full flex items-center justify-between px-3 py-2 text-sm rounded-md hover:bg-muted transition-colors text-start",
                        value === language.value
                          ? "bg-purple-500/20 text-purple-400"
                          : "text-foreground"
                      )}
                    >
                      <span>{language.label}</span>
                      {value === language.value && (
                        <Check className="h-4 w-4" />
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  )
}
