"use client"

import { Download, ArrowLeft, Image as ImageIcon, Video, FileText, Copy, ChevronDown, TrendingUp, Languages, Loader2, RotateCcw } from "lucide-react"
import { Download, ArrowLeft, Image as ImageIcon, Video, FileText, Copy, ChevronDown, TrendingUp, Edit3 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useAppSelector, useAppDispatch } from "@/services/store/hooks"
import { setImageEvaluation, setEvaluating } from "@/services/store/slices/assetsSlice"
import { evaluateAdCreative, translateCopy } from "@/services/api"
import { ScoreBar } from "@/components/ui/score-bar"
import JSZip from "jszip"
import { saveAs } from "file-saver"
import { useEffect, useState } from "react"
import { ImageEditorModal } from "@/components/image-editor-modal"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import { LanguageSelect } from "@/components/translation/language-select"

interface ReviewExportProps {
  onPrev: () => void
}

export function ReviewExport({ onPrev }: ReviewExportProps) {
  const dispatch = useAppDispatch()
  const generatedImages = useAppSelector((state) => state.assets.generatedImages)
  const generatedVideo = useAppSelector((state) => state.assets.generatedVideo)
  const generatedCopies = useAppSelector((state) => state.assets.generatedCopies)
  const productSkuImage = useAppSelector((state) => state.assets.productSkuImage)
  const briefData = useAppSelector((state) => state.brief.briefData)
  const imagePrompt = useAppSelector((state) => state.creative.prompts?.image_prompt)
  const isEvaluating = useAppSelector((state) => state.assets.isEvaluating)

  // State to track translated copies for each variation
  const [translatedCopies, setTranslatedCopies] = useState<Record<number, {
    headline: string
    body_text: string
    call_to_action: string
  }>>({})

  // State for translation controls for each variation
  const [translationStates, setTranslationStates] = useState<Record<number, {
    selectedLanguage: string
    isTranslating: boolean
  }>>({})

  // Get the current copy (original or translated) for a variation
  const getCurrentCopy = (variationNumber: number) => {
    const originalCopy = generatedCopies.find(c => c.variation_number === variationNumber)
    return translatedCopies[variationNumber] || originalCopy
  }

  // Handle translation
  const handleTranslate = async (variationNumber: number) => {
    const state = translationStates[variationNumber]
    if (!state?.selectedLanguage) return

    const originalCopy = generatedCopies.find(c => c.variation_number === variationNumber)
    if (!originalCopy) return

    // Set translating state
    setTranslationStates(prev => ({
      ...prev,
      [variationNumber]: { ...prev[variationNumber], isTranslating: true }
    }))

    try {
      const response = await translateCopy(
        {
          headline: originalCopy.headline,
          body_text: originalCopy.body_text,
          call_to_action: originalCopy.call_to_action
        },
        state.selectedLanguage
      )

      setTranslatedCopies(prev => ({
        ...prev,
        [variationNumber]: response.translated_copy
      }))
    } catch (error) {
      console.error('Translation error:', error)
    } finally {
      setTranslationStates(prev => ({
        ...prev,
        [variationNumber]: { ...prev[variationNumber], isTranslating: false }
      }))
    }
  }

  // Handle language selection
  const handleLanguageChange = (variationNumber: number, language: string) => {
    setTranslationStates(prev => ({
      ...prev,
      [variationNumber]: {
        selectedLanguage: language,
        isTranslating: prev[variationNumber]?.isTranslating || false
      }
    }))
  }

  // Handle restore to original
  const handleRestoreOriginal = (variationNumber: number) => {
    setTranslatedCopies(prev => {
      const updated = { ...prev }
      delete updated[variationNumber]
      return updated
    })
  }
  // Image editor state
  const [editingImage, setEditingImage] = useState<{
    variationNumber: number
    imageBase64: string
    mimeType: string
  } | null>(null)
  const [editedImages, setEditedImages] = useState<Map<number, string>>(new Map())

  // Evaluate images when component mounts (runs in background, doesn't block UI)
  useEffect(() => {
    const evaluateImages = async () => {
      // Only evaluate if we have images and a prompt, and images don't already have evaluations
      if (!imagePrompt || generatedImages.length === 0) return

      const hasEvaluations = generatedImages.every(img => img.evaluation)
      if (hasEvaluations) return

      dispatch(setEvaluating(true))

      try {
        // Evaluate all images in parallel (non-blocking)
        await Promise.allSettled(
          generatedImages.map(async (image) => {
            try {
              const evaluation = await evaluateAdCreative(
                image.image_base64,
                image.mime_type,
                imagePrompt
              )
              dispatch(setImageEvaluation({
                variationNumber: image.variation_number,
                evaluation
              }))
            } catch (error) {
              console.error(`Failed to evaluate image ${image.variation_number}:`, error)
            }
          })
        )
      } finally {
        dispatch(setEvaluating(false))
      }
    }

    // Run evaluation after a small delay to ensure UI renders first
    const timeoutId = setTimeout(evaluateImages, 100)
    return () => clearTimeout(timeoutId)
  }, [generatedImages.length, imagePrompt, dispatch])

  const downloadSingleImage = (imageBase64: string, variationNumber: number, mimeType: string) => {
    // Convert base64 to blob
    const byteCharacters = atob(imageBase64)
    const byteNumbers = new Array(byteCharacters.length)
    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i)
    }
    const byteArray = new Uint8Array(byteNumbers)
    const blob = new Blob([byteArray], { type: mimeType })

    // Create download link
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `${briefData?.brand_name.value || 'image'}_variation_${variationNumber}.png`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  const downloadVideo = (videoBase64: string, mimeType: string) => {
    const byteCharacters = atob(videoBase64)
    const byteNumbers = new Array(byteCharacters.length)
    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i)
    }
    const byteArray = new Uint8Array(byteNumbers)
    const blob = new Blob([byteArray], { type: mimeType })

    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `${briefData?.brand_name.value || 'video'}_ad_creative.mp4`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  const copyCopyText = (text: string) => {
    navigator.clipboard.writeText(text)
    // Optional: Show a toast notification
  }

  const openImageEditor = (variationNumber: number, imageBase64: string, mimeType: string) => {
    setEditingImage({
      variationNumber,
      imageBase64: editedImages.get(variationNumber) || imageBase64,
      mimeType
    })
  }

  const handleImageEditSave = (editedImageBase64: string) => {
    if (editingImage) {
      setEditedImages(prev => new Map(prev.set(editingImage.variationNumber, editedImageBase64)))
      setEditingImage(null)
    }
  }

  const getImageBase64 = (variationNumber: number, originalBase64: string) => {
    return editedImages.get(variationNumber) || originalBase64
  }

  
  const downloadAllAssets = async () => {
    const zip = new JSZip()
    const brandName = briefData?.brand_name.value || 'campaign'

    // Add images to zip (use edited versions if available)
    if (generatedImages.length > 0) {
      const imagesFolder = zip.folder('images')
      generatedImages.forEach((img) => {
        const imageBase64 = getImageBase64(img.variation_number, img.image_base64)
        const byteCharacters = atob(imageBase64)
        const byteNumbers = new Array(byteCharacters.length)
        for (let i = 0; i < byteCharacters.length; i++) {
          byteNumbers[i] = byteCharacters.charCodeAt(i)
        }
        const byteArray = new Uint8Array(byteNumbers)
        const suffix = editedImages.has(img.variation_number) ? '_edited' : ''
        imagesFolder?.file(`${brandName}_image_variation_${img.variation_number}${suffix}.png`, byteArray)
      })
    }

    // Add video to zip
    if (generatedVideo && generatedVideo.video_base64) {
      const videoFolder = zip.folder('video')
      const byteCharacters = atob(generatedVideo.video_base64)
      const byteNumbers = new Array(byteCharacters.length)
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i)
      }
      const byteArray = new Uint8Array(byteNumbers)
      videoFolder?.file(`${brandName}_video.mp4`, byteArray)
    }

    // Add copy to zip
    if (generatedCopies.length > 0) {
      const copyFolder = zip.folder('copy')
      const copyText = generatedCopies.map((copy) => {
        return `=== VARIATION ${copy.variation_number} ===\n\nHeadline: ${copy.headline}\n\nBody:\n${copy.body_text}\n\nCall to Action: ${copy.call_to_action}\n\n`
      }).join('\n---\n\n')
      copyFolder?.file(`${brandName}_ad_copy.txt`, copyText)
    }

    // Generate and download zip
    const content = await zip.generateAsync({ type: 'blob' })
    saveAs(content, `${brandName}_all_assets.zip`)
  }

  const hasAssets = generatedImages.length > 0 || generatedVideo || generatedCopies.length > 0

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="space-y-4">
        <h2 className="text-3xl font-bold text-foreground">Review & Export</h2>
        <p className="text-lg text-muted-foreground">
          Your AI-generated assets for{' '}
          <span className="text-purple-400 font-medium">{briefData?.brand_name.value || 'your campaign'}</span>
        </p>
      </div>

      {/* Original Product SKU */}
      {productSkuImage && (
        <div className="bg-card dark:bg-card/50 border border-border rounded-xl p-6">
          <div className="flex items-start gap-6">
            <div className="w-48 h-48 bg-muted rounded-lg overflow-hidden flex items-center justify-center shrink-0">
              <img
                src={productSkuImage}
                alt="Original Product SKU"
                className="w-full h-full object-contain"
              />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <ImageIcon className="w-5 h-5 text-cyan-400" />
                <h3 className="font-semibold text-foreground">Original Product SKU</h3>
              </div>
              <p className="text-sm text-muted-foreground mb-4">
                This is the original product image you uploaded. All AI-generated variations are based on this source image.
              </p>
              <div className="flex flex-wrap gap-2">
                <span className="px-3 py-1 bg-muted text-foreground text-xs rounded-md border border-border">
                  Source Image
                </span>
                <span className="px-3 py-1 bg-cyan-500/10 text-cyan-400 text-xs rounded-md border border-cyan-500/30">
                  Reference
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Download All Assets Button */}
      {hasAssets && (
        <div className="flex justify-center">
          <Button
            onClick={downloadAllAssets}
            size="lg"
            className="bg-linear-to-r from-purple-500 via-pink-500 to-purple-500 hover:from-purple-600 hover:via-pink-600 hover:to-purple-600 text-foreground font-semibold px-8 py-6 text-lg shadow-lg shadow-purple-500/50"
          >
            <Download className="w-5 h-5 mr-3" />
            Download All Assets (ZIP)
          </Button>
        </div>
      )}

      {/* Generated Images */}
      {generatedImages.length > 0 ? (
        <Accordion type="single" collapsible defaultValue="images" className="space-y-4">
          <AccordionItem value="images" className="border border-border rounded-xl bg-card dark:bg-card/50">
            <AccordionTrigger className="px-6 py-4 hover:no-underline">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-purple-500/20 rounded-lg flex items-center justify-center">
                  <ImageIcon className="w-5 h-5 text-purple-400" />
                </div>
                <div className="text-left">
                  <h3 className="font-semibold text-foreground">Generated Images</h3>
                  <p className="text-sm text-muted-foreground">{generatedImages.length} variation{generatedImages.length !== 1 ? 's' : ''} generated</p>
                </div>
              </div>
            </AccordionTrigger>
            <AccordionContent className="px-6 pb-6">
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {generatedImages.map((image) => (
                <div
                  key={image.variation_number}
                  className="group border border-border rounded-xl overflow-hidden hover:border-purple-500/50 transition-all hover:shadow-lg hover:shadow-purple-500/10"
                >
                  {/* Image Preview */}
                  <div className="aspect-square bg-card dark:bg-card/50 flex items-center justify-center relative overflow-hidden">
                    <img
                      src={`data:${image.mime_type};base64,${getImageBase64(image.variation_number, image.image_base64)}`}
                      alt={`Generated variation ${image.variation_number}`}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-linear-to-t from-slate-950/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

                    {/* Hover overlay with edit and download buttons */}
                    <div className="absolute inset-0 flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button
                        onClick={() => openImageEditor(image.variation_number, getImageBase64(image.variation_number, image.image_base64), image.mime_type)}
                        size="sm"
                        className="bg-purple-500/90 hover:bg-purple-600 text-white"
                      >
                        <Edit3 className="w-4 h-4 mr-2" />
                        Edit
                      </Button>
                      <Button
                        onClick={() => downloadSingleImage(getImageBase64(image.variation_number, image.image_base64), image.variation_number, image.mime_type)}
                        size="sm"
                        className="bg-white/90 hover:bg-white text-foreground"
                      >
                        <Download className="w-4 h-4 mr-2" />
                        Download
                      </Button>
                    </div>
                  </div>

                  {/* Image Details */}
                  <div className="p-4 bg-card dark:bg-card/50 border-t border-border space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium text-foreground text-sm">Variation {image.variation_number}</h4>
                        <p className="text-xs text-muted-foreground mt-1">PNG Image</p>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => downloadSingleImage(image.image_base64, image.variation_number, image.mime_type)}
                        className="bg-transparent border-border hover:border-purple-500 hover:text-purple-400"
                      >
                        <Download className="w-3 h-3" />
                      </Button>
                        <h4 className="font-medium text-white text-sm">Variation {image.variation_number}</h4>
                        <p className="text-xs text-slate-500 mt-1">PNG Image{editedImages.has(image.variation_number) ? ' • Edited' : ''}</p>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openImageEditor(image.variation_number, getImageBase64(image.variation_number, image.image_base64), image.mime_type)}
                          className="bg-transparent border-slate-700 hover:border-purple-500 hover:text-purple-400"
                        >
                          <Edit3 className="w-3 h-3" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => downloadSingleImage(getImageBase64(image.variation_number, image.image_base64), image.variation_number, image.mime_type)}
                          className="bg-transparent border-slate-700 hover:border-purple-500 hover:text-purple-400"
                        >
                          <Download className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>

                    {/* Evaluation Scores */}
                    {image.evaluation ? (
                      <div className="space-y-3 bg-muted/30 rounded-lg p-3">
                        <div className="flex items-center gap-2">
                          <TrendingUp className="w-3.5 h-3.5 text-purple-400" />
                          <span className="text-xs font-semibold text-foreground uppercase tracking-wider">
                            Brandstream jury
                          </span>
                        </div>

                        <div className="space-y-2.5">
                          <ScoreBar
                            value={image.evaluation.conversion_score}
                            label="Conversion"
                            color="bg-gradient-to-r from-green-500 to-emerald-600"
                          />
                          <ScoreBar
                            value={image.evaluation.retention_score}
                            label="Retention"
                            color="bg-gradient-to-r from-blue-500 to-cyan-600"
                          />
                          <ScoreBar
                            value={image.evaluation.traffic_score}
                            label="Traffic"
                            color="bg-gradient-to-r from-amber-500 to-orange-600"
                          />
                          <ScoreBar
                            value={image.evaluation.engagement_score}
                            label="Engagement"
                            color="bg-gradient-to-r from-pink-500 to-rose-600"
                          />
                        </div>

                        {/* Overall Score */}
                        <div className="pt-2 mt-2 border-t border-border/50">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-medium text-muted-foreground">Overall Score</span>
                            <div className="flex items-center gap-2">
                              <div className="w-10 h-10 rounded-lg bg-linear-to-br from-purple-500 to-pink-500 flex items-center justify-center shadow-lg shadow-purple-500/20">
                                <span className="font-bold text-foreground text-sm">
                                  {((image.evaluation.conversion_score + image.evaluation.retention_score + image.evaluation.traffic_score + image.evaluation.engagement_score) / 4).toFixed(1)}
                                </span>
                              </div>
                              <span className="text-xs text-muted-foreground">/10</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    ) : isEvaluating ? (
                      <div className="text-center py-3 bg-muted/30 rounded-lg">
                        <p className="text-xs text-muted-foreground animate-pulse">Generating brandstream jury...</p>
                      </div>
                    ) : null}
                  </div>
                </div>
              ))}
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      ) : null}

      {/* Generated Video */}
      {generatedVideo ? (
        <Accordion type="single" collapsible defaultValue="video" className="space-y-4">
          <AccordionItem value="video" className="border border-border rounded-xl bg-card dark:bg-card/50">
            <AccordionTrigger className="px-6 py-4 hover:no-underline">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-green-500/20 rounded-lg flex items-center justify-center">
                  <Video className="w-5 h-5 text-green-400" />
                </div>
                <div className="text-left">
                  <h3 className="font-semibold text-foreground">Generated Video</h3>
                  <p className="text-sm text-muted-foreground">{generatedVideo.duration_seconds || 5}s ad creative</p>
                </div>
              </div>
            </AccordionTrigger>
            <AccordionContent className="px-6 pb-6">
              <div className="border border-border rounded-xl overflow-hidden hover:border-green-500/50 transition-all hover:shadow-lg hover:shadow-green-500/10">
            <div className="aspect-video bg-card dark:bg-card/50 flex items-center justify-center">
              <video
                src={`data:${generatedVideo.mime_type};base64,${generatedVideo.video_base64}`}
                controls
                className="w-full h-full"
              />
            </div>
            <div className="p-4 bg-card dark:bg-card/50 border-t border-border flex items-center justify-between">
              <div>
                <h4 className="font-medium text-foreground text-sm">Ad Creative Video</h4>
                <p className="text-xs text-muted-foreground mt-1">MP4 Format • {generatedVideo.duration_seconds || 5}s</p>
              </div>
              {generatedVideo.video_base64 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => downloadVideo(generatedVideo.video_base64!, generatedVideo.mime_type)}
                  className="bg-transparent border-border hover:border-green-500 hover:text-green-400"
                >
                  <Download className="w-3 h-3" />
                </Button>
              )}
              {generatedVideo.video_url && !generatedVideo.video_base64 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => window.open(generatedVideo.video_url, '_blank')}
                  className="bg-transparent border-border hover:border-green-500 hover:text-green-400"
                >
                  <Download className="w-3 h-3" />
                </Button>
              )}
            </div>
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      ) : null}

      {/* Generated Copy/Script */}
      {generatedCopies.length > 0 ? (
        <Accordion type="single" collapsible defaultValue="copy" className="space-y-4">
          <AccordionItem value="copy" className="border border-border rounded-xl bg-card dark:bg-card/50">
            <AccordionTrigger className="px-6 py-4 hover:no-underline">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-pink-500/20 rounded-lg flex items-center justify-center">
                  <FileText className="w-5 h-5 text-pink-400" />
                </div>
                <div className="text-left">
                  <h3 className="font-semibold text-foreground">Generated Copy</h3>
                  <p className="text-sm text-muted-foreground">{generatedCopies.length} variation{generatedCopies.length !== 1 ? 's' : ''} generated</p>
                </div>
              </div>
            </AccordionTrigger>
            <AccordionContent className="px-6 pb-6">
              <div className="grid gap-6">
            {generatedCopies.map((copy) => {
              const currentCopy = getCurrentCopy(copy.variation_number)
              const isTranslated = !!translatedCopies[copy.variation_number]

              return (
              <div
                key={copy.variation_number}
                className="border border-border rounded-xl overflow-visible hover:border-pink-500/50 transition-all hover:shadow-lg hover:shadow-pink-500/10 bg-card dark:bg-card/50"
              >
                <div className="p-6">
                  {/* Header with Title and All Controls in Single Row */}
                  <div className="flex items-center justify-between gap-4 mb-4">
                    {/* Left: Title and Badge */}
                    <div className="flex items-center gap-2">
                      <h4 className="font-semibold text-foreground whitespace-nowrap">Variation {copy.variation_number}</h4>
                      {isTranslated && (
                        <span className="px-2 py-1 text-xs font-medium bg-purple-500/20 text-purple-400 rounded-md border border-purple-500/30 whitespace-nowrap">
                          Translated
                        </span>
                      )}
                    </div>

                    {/* Right: Translation Controls and Copy All */}
                    <div className="flex items-center gap-2">
                      <div className="w-[200px]">
                        <LanguageSelect
                          value={translationStates[copy.variation_number]?.selectedLanguage || ""}
                          onChange={(lang) => handleLanguageChange(copy.variation_number, lang)}
                          disabled={translationStates[copy.variation_number]?.isTranslating || false}
                        />
                      </div>

                      <Button
                        onClick={() => handleTranslate(copy.variation_number)}
                        disabled={!translationStates[copy.variation_number]?.selectedLanguage || translationStates[copy.variation_number]?.isTranslating}
                        size="sm"
                        className="bg-purple-500 hover:bg-purple-600 text-foreground disabled:opacity-50 shrink-0"
                      >
                        {translationStates[copy.variation_number]?.isTranslating ? (
                          <>
                            <Loader2 className="w-3 h-3 mr-2 animate-spin" />
                            Translating...
                          </>
                        ) : (
                          <>
                            <Languages className="w-3 h-3 mr-2" />
                            Translate
                          </>
                        )}
                      </Button>

                      {isTranslated && (
                        <Button
                          onClick={() => handleRestoreOriginal(copy.variation_number)}
                          disabled={translationStates[copy.variation_number]?.isTranslating || false}
                          size="sm"
                          variant="outline"
                          className="bg-transparent border-border hover:border-border text-foreground hover:text-foreground disabled:opacity-50 shrink-0"
                        >
                          <RotateCcw className="w-3 h-3 mr-2" />
                          Restore
                        </Button>
                      )}

                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => copyCopyText(`${currentCopy?.headline}\n\n${currentCopy?.body_text}\n\n${currentCopy?.call_to_action}`)}
                        className="bg-transparent border-border hover:border-pink-500 hover:text-pink-400 shrink-0"
                      >
                        <Copy className="w-3 h-3 mr-2" />
                        Copy All
                      </Button>
                    </div>
                  </div>

                  {/* Headline */}
                  <div className="space-y-2 mb-4">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-medium text-muted-foreground uppercase">Headline</label>
                      <button
                        onClick={() => copyCopyText(currentCopy?.headline || "")}
                        className="text-xs text-muted-foreground hover:text-pink-400 transition-colors"
                      >
                        Copy
                      </button>
                    </div>
                    <p className="text-foreground font-semibold text-lg">{currentCopy?.headline}</p>
                  </div>

                  {/* Body Text */}
                  <div className="space-y-2 mb-4">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-medium text-muted-foreground uppercase">Body Copy</label>
                      <button
                        onClick={() => copyCopyText(currentCopy?.body_text || "")}
                        className="text-xs text-muted-foreground hover:text-pink-400 transition-colors"
                      >
                        Copy
                      </button>
                    </div>
                    <p className="text-foreground text-sm leading-relaxed">{currentCopy?.body_text}</p>
                  </div>

                  {/* Call to Action */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-medium text-muted-foreground uppercase">Call to Action</label>
                      <button
                        onClick={() => copyCopyText(currentCopy?.call_to_action || "")}
                        className="text-xs text-muted-foreground hover:text-pink-400 transition-colors"
                      >
                        Copy
                      </button>
                    </div>
                    <p className="text-pink-400 font-medium">{currentCopy?.call_to_action}</p>
                  </div>
                </div>

               
              </div>
              )
            })}
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      ) : null}

      {/* No Assets State */}
      {generatedImages.length === 0 && !generatedVideo && generatedCopies.length === 0 && (
        <div className="bg-card dark:bg-card/50 border border-border rounded-xl p-12 text-center">
          <ImageIcon className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="font-semibold text-foreground mb-2">No Assets Generated</h3>
          <p className="text-muted-foreground text-sm">
            Go back to the previous step to generate creative assets
          </p>
        </div>
      )}

      {/* Actions */}
      <div className="flex justify-between sticky bottom-4 bg-background/80 backdrop-blur-sm border border-border rounded-xl p-4">
        <Button onClick={onPrev} variant="outline" size="lg">
          <ArrowLeft className="mr-2 w-4 h-4" />
          Back
        </Button>
      </div>

      {/* Image Editor Modal */}
      {editingImage && (
        <ImageEditorModal
          open={true}
          onOpenChange={(open) => !open && setEditingImage(null)}
          imageBase64={editingImage.imageBase64}
          mimeType={editingImage.mimeType}
          onSave={handleImageEditSave}
        />
      )}
    </div>
  )
}
