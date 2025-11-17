"use client"

import { ArrowRight, CheckCircle, AlertCircle, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { BriefAnalysisResponse, generateCreativePrompts } from "@/services/api"
import { BriefAnalysisDisplay } from "@/components/brief-analysis/brief-analysis-display"
import { useAppSelector, useAppDispatch } from "@/services/store/hooks"
import { updateBriefData } from "@/services/store/slices/briefSlice"
import { setCreativePrompts, setCreativeGenerating, setCreativeError } from "@/services/store/slices/creativeSlice"
import { useState } from "react"

interface TemplateMappingProps {
  onNext: () => void
  onPrev: () => void
}

export function TemplateMapping({ onNext, onPrev }: TemplateMappingProps) {
  const dispatch = useAppDispatch()
  const briefData = useAppSelector((state) => state.brief.briefData)
  const [isGenerating, setIsGenerating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  console.log(briefData)

  const handleDataChange = (updatedData: BriefAnalysisResponse) => {
    // Update Redux store with edited data
    dispatch(updateBriefData(updatedData))
  }

  const handleContinue = async () => {
    if (!briefData) return

    setIsGenerating(true)
    setError(null)
    dispatch(setCreativeGenerating(true))

    try {
      // Call the API to generate creative prompts
      const prompts = await generateCreativePrompts(briefData)

      // Save prompts to Redux store
      dispatch(setCreativePrompts(prompts))

      // Proceed to next step
      onNext()
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to generate creative prompts'
      setError(errorMessage)
      dispatch(setCreativeError(errorMessage))
      console.error('Creative generation error:', err)
    } finally {
      setIsGenerating(false)
      dispatch(setCreativeGenerating(false))
    }
  }

  // If no brief data, show error state
  if (!briefData) {
    return (
      <div className="space-y-8">
        <div className="bg-yellow-500/10 border border-yellow-500/50 rounded-xl p-6 flex items-start gap-4">
          <AlertCircle className="w-6 h-6 text-yellow-400 flex-shrink-0 mt-1" />
          <div>
            <h3 className="font-semibold text-white mb-2">No Brief Data Available</h3>
            <p className="text-slate-300 mb-4">
              It looks like the brief analysis data is missing. Please go back and upload your creative brief.
            </p>
            <Button onClick={onPrev} variant="outline">
              Back to Upload
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Brief Analysis Display */}
      <BriefAnalysisDisplay
        data={briefData}
        onDataChange={handleDataChange}
      />

      {/* Loading State */}
      {isGenerating && (
        <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-8 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-white">Generating Creative Prompts...</h3>
            <Loader2 className="w-5 h-5 text-purple-400 animate-spin" />
          </div>
          <p className="text-sm text-slate-400">
            Analyzing your brief and creating tailored prompts for image, copy, and video generation...
          </p>
          <div className="flex-1 bg-slate-800 rounded-full h-2 overflow-hidden">
            <div className="h-full bg-gradient-to-r from-purple-500 to-pink-500 animate-pulse w-3/4"></div>
          </div>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="bg-red-500/10 border border-red-500/50 rounded-xl p-4 flex items-start gap-4">
          <AlertCircle className="w-6 h-6 text-red-400 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="font-semibold text-red-400 mb-1">Generation Failed</h3>
            <p className="text-red-300 text-sm">{error}</p>
          </div>
        </div>
      )}

      {/* Navigation */}
      <div className="flex justify-between sticky bottom-4 bg-slate-950/80 backdrop-blur-sm border border-slate-800 rounded-xl p-4">
        <Button onClick={onPrev} variant="outline" size="lg" disabled={isGenerating}>
          Back to Upload
        </Button>
        <Button
          onClick={handleContinue}
          size="lg"
          className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
          disabled={isGenerating}
        >
          {isGenerating ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Generating Prompts...
            </>
          ) : (
            <>
              Continue to Generation <ArrowRight className="ml-2 w-4 h-4" />
            </>
          )}
        </Button>
      </div>
    </div>
  )
}
