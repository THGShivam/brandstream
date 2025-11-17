"use client"

import { Download, ArrowLeft, Image as ImageIcon, Video, FileText, Copy, ChevronDown, TrendingUp } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useAppSelector, useAppDispatch } from "@/lib/store/hooks"
import { setImageEvaluation, setEvaluating } from "@/lib/store/slices/assetsSlice"
import { evaluateAdCreative } from "@/lib/api"
import { ScoreBar } from "@/components/ui/score-bar"
import JSZip from "jszip"
import { saveAs } from "file-saver"
import { useEffect } from "react"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"

interface ReviewExportProps {
  onPrev: () => void
}

export function ReviewExport({ onPrev }: ReviewExportProps) {
  const dispatch = useAppDispatch()
  const generatedImages = useAppSelector((state) => state.assets.generatedImages)
  const generatedVideo = useAppSelector((state) => state.assets.generatedVideo)
  const generatedCopies = useAppSelector((state) => state.assets.generatedCopies)
  const briefData = useAppSelector((state) => state.brief.briefData)
  const imagePrompt = useAppSelector((state) => state.creative.prompts?.image_prompt)
  const isEvaluating = useAppSelector((state) => state.assets.isEvaluating)

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

  
  const downloadAllAssets = async () => {
    const zip = new JSZip()
    const brandName = briefData?.brand_name.value || 'campaign'

    // Add images to zip
    if (generatedImages.length > 0) {
      const imagesFolder = zip.folder('images')
      generatedImages.forEach((img) => {
        const byteCharacters = atob(img.image_base64)
        const byteNumbers = new Array(byteCharacters.length)
        for (let i = 0; i < byteCharacters.length; i++) {
          byteNumbers[i] = byteCharacters.charCodeAt(i)
        }
        const byteArray = new Uint8Array(byteNumbers)
        imagesFolder?.file(`${brandName}_image_variation_${img.variation_number}.png`, byteArray)
      })
    }

    // Add video to zip
    if (generatedVideo) {
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
        <h2 className="text-3xl font-bold text-white">Review & Export</h2>
        <p className="text-lg text-slate-400">
          Your AI-generated assets for{' '}
          <span className="text-purple-400 font-medium">{briefData?.brand_name.value || 'your campaign'}</span>
        </p>
      </div>

      {/* Download All Assets Button */}
      {hasAssets && (
        <div className="flex justify-center">
          <Button
            onClick={downloadAllAssets}
            size="lg"
            className="bg-gradient-to-r from-purple-500 via-pink-500 to-purple-500 hover:from-purple-600 hover:via-pink-600 hover:to-purple-600 text-white font-semibold px-8 py-6 text-lg shadow-lg shadow-purple-500/50"
          >
            <Download className="w-5 h-5 mr-3" />
            Download All Assets (ZIP)
          </Button>
        </div>
      )}

      {/* Generated Images */}
      {generatedImages.length > 0 ? (
        <Accordion type="single" collapsible defaultValue="images" className="space-y-4">
          <AccordionItem value="images" className="border border-slate-800 rounded-xl bg-slate-900/50">
            <AccordionTrigger className="px-6 py-4 hover:no-underline">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-purple-500/20 rounded-lg flex items-center justify-center">
                  <ImageIcon className="w-5 h-5 text-purple-400" />
                </div>
                <div className="text-left">
                  <h3 className="font-semibold text-white">Generated Images</h3>
                  <p className="text-sm text-slate-400">{generatedImages.length} variation{generatedImages.length !== 1 ? 's' : ''} generated</p>
                </div>
              </div>
            </AccordionTrigger>
            <AccordionContent className="px-6 pb-6">
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {generatedImages.map((image) => (
                <div
                  key={image.variation_number}
                  className="group border border-slate-800 rounded-xl overflow-hidden hover:border-purple-500/50 transition-all hover:shadow-lg hover:shadow-purple-500/10"
                >
                  {/* Image Preview */}
                  <div className="aspect-square bg-slate-900/50 flex items-center justify-center relative overflow-hidden">
                    <img
                      src={`data:${image.mime_type};base64,${image.image_base64}`}
                      alt={`Generated variation ${image.variation_number}`}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

                    {/* Hover overlay with download button */}
                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button
                        onClick={() => downloadSingleImage(image.image_base64, image.variation_number, image.mime_type)}
                        size="sm"
                        className="bg-white/90 hover:bg-white text-slate-900"
                      >
                        <Download className="w-4 h-4 mr-2" />
                        Download
                      </Button>
                    </div>
                  </div>

                  {/* Image Details */}
                  <div className="p-4 bg-slate-900/50 border-t border-slate-800 space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium text-white text-sm">Variation {image.variation_number}</h4>
                        <p className="text-xs text-slate-500 mt-1">PNG Image</p>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => downloadSingleImage(image.image_base64, image.variation_number, image.mime_type)}
                        className="bg-transparent border-slate-700 hover:border-purple-500 hover:text-purple-400"
                      >
                        <Download className="w-3 h-3" />
                      </Button>
                    </div>

                    {/* Evaluation Scores */}
                    {image.evaluation ? (
                      <div className="space-y-3 bg-slate-800/30 rounded-lg p-3">
                        <div className="flex items-center gap-2">
                          <TrendingUp className="w-3.5 h-3.5 text-purple-400" />
                          <span className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
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
                        <div className="pt-2 mt-2 border-t border-slate-700/50">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-medium text-slate-400">Overall Score</span>
                            <div className="flex items-center gap-2">
                              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center shadow-lg shadow-purple-500/20">
                                <span className="font-bold text-white text-sm">
                                  {((image.evaluation.conversion_score + image.evaluation.retention_score + image.evaluation.traffic_score + image.evaluation.engagement_score) / 4).toFixed(1)}
                                </span>
                              </div>
                              <span className="text-xs text-slate-500">/10</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    ) : isEvaluating ? (
                      <div className="text-center py-3 bg-slate-800/30 rounded-lg">
                        <p className="text-xs text-slate-400 animate-pulse">Generating brandstream jury...</p>
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
          <AccordionItem value="video" className="border border-slate-800 rounded-xl bg-slate-900/50">
            <AccordionTrigger className="px-6 py-4 hover:no-underline">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-green-500/20 rounded-lg flex items-center justify-center">
                  <Video className="w-5 h-5 text-green-400" />
                </div>
                <div className="text-left">
                  <h3 className="font-semibold text-white">Generated Video</h3>
                  <p className="text-sm text-slate-400">{generatedVideo.duration_seconds || 5}s ad creative</p>
                </div>
              </div>
            </AccordionTrigger>
            <AccordionContent className="px-6 pb-6">
              <div className="border border-slate-800 rounded-xl overflow-hidden hover:border-green-500/50 transition-all hover:shadow-lg hover:shadow-green-500/10">
            <div className="aspect-video bg-slate-900/50 flex items-center justify-center">
              <video
                src={generatedVideo.video_url || `data:${generatedVideo.mime_type};base64,${generatedVideo.video_base64}`}
                controls
                className="w-full h-full"
              />
            </div>
            <div className="p-4 bg-slate-900/50 border-t border-slate-800 flex items-center justify-between">
              <div>
                <h4 className="font-medium text-white text-sm">Ad Creative Video</h4>
                <p className="text-xs text-slate-500 mt-1">MP4 Format • {generatedVideo.duration_seconds || 5}s</p>
              </div>
              {generatedVideo.video_base64 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => downloadVideo(generatedVideo.video_base64, generatedVideo.mime_type)}
                  className="bg-transparent border-slate-700 hover:border-green-500 hover:text-green-400"
                >
                  <Download className="w-3 h-3" />
                </Button>
              )}
              {generatedVideo.video_url && !generatedVideo.video_base64 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => window.open(generatedVideo.video_url, '_blank')}
                  className="bg-transparent border-slate-700 hover:border-green-500 hover:text-green-400"
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
          <AccordionItem value="copy" className="border border-slate-800 rounded-xl bg-slate-900/50">
            <AccordionTrigger className="px-6 py-4 hover:no-underline">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-pink-500/20 rounded-lg flex items-center justify-center">
                  <FileText className="w-5 h-5 text-pink-400" />
                </div>
                <div className="text-left">
                  <h3 className="font-semibold text-white">Generated Copy</h3>
                  <p className="text-sm text-slate-400">{generatedCopies.length} variation{generatedCopies.length !== 1 ? 's' : ''} generated</p>
                </div>
              </div>
            </AccordionTrigger>
            <AccordionContent className="px-6 pb-6">
              <div className="grid gap-6">
            {generatedCopies.map((copy) => (
              <div
                key={copy.variation_number}
                className="border border-slate-800 rounded-xl p-6 hover:border-pink-500/50 transition-all hover:shadow-lg hover:shadow-pink-500/10 bg-slate-900/50"
              >
                <div className="flex items-center justify-between mb-4">
                  <h4 className="font-semibold text-white">Variation {copy.variation_number}</h4>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => copyCopyText(`${copy.headline}\n\n${copy.body_text}\n\n${copy.call_to_action}`)}
                    className="bg-transparent border-slate-700 hover:border-pink-500 hover:text-pink-400"
                  >
                    <Copy className="w-3 h-3 mr-2" />
                    Copy All
                  </Button>
                </div>

                {/* Headline */}
                <div className="space-y-2 mb-4">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-medium text-slate-400 uppercase">Headline</label>
                    <button
                      onClick={() => copyCopyText(copy.headline)}
                      className="text-xs text-slate-500 hover:text-pink-400 transition-colors"
                    >
                      Copy
                    </button>
                  </div>
                  <p className="text-white font-semibold text-lg">{copy.headline}</p>
                </div>

                {/* Body Text */}
                <div className="space-y-2 mb-4">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-medium text-slate-400 uppercase">Body Copy</label>
                    <button
                      onClick={() => copyCopyText(copy.body_text)}
                      className="text-xs text-slate-500 hover:text-pink-400 transition-colors"
                    >
                      Copy
                    </button>
                  </div>
                  <p className="text-slate-300 text-sm leading-relaxed">{copy.body_text}</p>
                </div>

                {/* Call to Action */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-medium text-slate-400 uppercase">Call to Action</label>
                    <button
                      onClick={() => copyCopyText(copy.call_to_action)}
                      className="text-xs text-slate-500 hover:text-pink-400 transition-colors"
                    >
                      Copy
                    </button>
                  </div>
                  <p className="text-pink-400 font-medium">{copy.call_to_action}</p>
                </div>
              </div>
            ))}
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      ) : null}

      {/* No Assets State */}
      {generatedImages.length === 0 && !generatedVideo && generatedCopies.length === 0 && (
        <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-12 text-center">
          <ImageIcon className="w-12 h-12 text-slate-600 mx-auto mb-4" />
          <h3 className="font-semibold text-white mb-2">No Assets Generated</h3>
          <p className="text-slate-400 text-sm">
            Go back to the previous step to generate creative assets
          </p>
        </div>
      )}

      {/* Actions */}
      <div className="flex justify-between sticky bottom-4 bg-slate-950/80 backdrop-blur-sm border border-slate-800 rounded-xl p-4">
        <Button onClick={onPrev} variant="outline" size="lg">
          <ArrowLeft className="mr-2 w-4 h-4" />
          Back
        </Button>
      </div>
    </div>
  )
}
