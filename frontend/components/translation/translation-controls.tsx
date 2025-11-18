"use client"

import { useState } from "react"
import { Languages, Loader2, RotateCcw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { LanguageSelect } from "./language-select"
import { translateCopy } from "@/services/api"

interface TranslationControlsProps {
  copyText: {
    headline: string
    body_text: string
    call_to_action: string
  }
  variationNumber: number
  onTranslationComplete: (translatedCopy: {
    headline: string
    body_text: string
    call_to_action: string
  }) => void
  onRestoreOriginal: () => void
  isTranslated: boolean
  className?: string
}

export function TranslationControls({
  copyText,
  variationNumber,
  onTranslationComplete,
  onRestoreOriginal,
  isTranslated,
  className = ""
}: TranslationControlsProps) {
  const [selectedLanguage, setSelectedLanguage] = useState("")
  const [isTranslating, setIsTranslating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleTranslate = async () => {
    if (!selectedLanguage) {
      setError("Please select a language")
      return
    }

    setIsTranslating(true)
    setError(null)

    try {
      const response = await translateCopy(copyText, selectedLanguage)
      onTranslationComplete(response.translated_copy)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to translate copy"
      setError(errorMessage)
      console.error("Translation error:", err)
    } finally {
      setIsTranslating(false)
    }
  }

  return (
    <div className={`space-y-3 ${className}`}>
      {/* Translation Header */}
      <div className="flex items-center gap-2 pb-2 border-b border-border/50">
        <Languages className="w-4 h-4 text-purple-400" />
        <span className="text-sm font-semibold text-foreground uppercase tracking-wider">
          Translate Copy
        </span>
      </div>

      {/* Language Selection and Buttons in Row */}
      <div className="flex items-center gap-2">
        <div className="flex-1">
          <LanguageSelect
            value={selectedLanguage}
            onChange={setSelectedLanguage}
            disabled={isTranslating}
          />
        </div>
        <Button
          onClick={handleTranslate}
          disabled={!selectedLanguage || isTranslating}
          size="sm"
          className="bg-purple-500 hover:bg-purple-600 text-foreground disabled:opacity-50 shrink-0 "
        >
          {isTranslating ? (
            <>
              <Loader2 className="w-3 h-3 mr-2 animate-spin" />
              Translating...
            </>
          ) : (
            <>
              <Languages className="w-3 h-3 mr-2 cursor-pointer" />
              Translate
            </>
          )}
        </Button>
        {isTranslated && (
          <Button
            onClick={onRestoreOriginal}
            disabled={isTranslating}
            size="sm"
            variant="outline"
            className="bg-transparent border-border hover:border-border text-foreground hover:text-foreground disabled:opacity-50 shrink-0 cursor-pointer"
          >
            <RotateCcw className="w-3 h-3 mr-2" />
            Restore
          </Button>
        )}
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3">
          <p className="text-xs text-red-400">{error}</p>
        </div>
      )}
    </div>
  )
}
