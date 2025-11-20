"use client"

import { Play, Upload, X, CheckCircle, Video, Image as ImageIcon, FileText, Eye, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useState, useRef } from "react"
import { useAppSelector, useAppDispatch } from "@/services/store/hooks"
import { updateImagePrompt, updateCopyPrompt, updateVideoPrompt } from "@/services/store/slices/creativeSlice"
import { setGeneratedImages, setGeneratedVideo, setGeneratedCopies, setProductSkuImage, setAssetsGenerating, setAssetsError } from "@/services/store/slices/assetsSlice"
import { PromptEditorModal } from "@/components/prompt-editor-modal"
import { generateAssets } from "@/services/api"

interface GenerateAssetsProps {
  onNext: () => void
  onPrev: () => void
}

type OutputFormat = 'Video' | 'Images' | 'Copy'

interface FormatConfig {
  enabled: boolean
  model: string
  icon: any
  description: string
  models: string[]
  supportsVariations: boolean
}

export function GenerateAssets({ onNext, onPrev }: GenerateAssetsProps) {
  const dispatch = useAppDispatch()
  const [isGenerating, setIsGenerating] = useState(false)
  const [generationProgress, setGenerationProgress] = useState(0)
  const [creativityLevel, setCreativityLevel] = useState(75)
  const [imageVariations, setImageVariations] = useState(3)
  const [copyVariations, setCopyVariations] = useState(3)
  const [uploadedSKU, setUploadedSKU] = useState<File | null>(null)
  const [skuPreview, setSKUPreview] = useState<string | null>(null)
  const [isDragOver, setIsDragOver] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const briefData = useAppSelector((state) => state.brief.briefData)
  const creativePrompts = useAppSelector((state) => state.creative.prompts)

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingPromptType, setEditingPromptType] = useState<'image' | 'copy' | 'video'>('image')
  
  const [formatConfigs, setFormatConfigs] = useState<Record<OutputFormat, FormatConfig>>({
    Video: {
      enabled: true,
      model: "Veo 3",
      icon: Video,
      description: "High-quality video generation (1 variation only)",
      models: ["Veo 3", "Veo 2"],
      supportsVariations: false
    },
    Images: {
      enabled: true,
      model: "Nano banana",
      icon: ImageIcon,
      description: "Creative image generation with variations",
      models: ["Nano banana"],
      supportsVariations: true
    },
    Copy: {
      enabled: true,
      model: "Gemini 2.5 pro",
      icon: FileText,
      description: "AI-powered copywriting with variations",
      models: ["Gemini 2.5 pro", "Gemini 3 Pro Preview"],
      supportsVariations: true
    }
  })

  const getCreativityLabel = (value: number) => {
    if (value <= 25) return "Conservative"
    if (value <= 50) return "Balanced"
    if (value <= 75) return "Creative"
    return "Experimental"
  }

  const handleFormatToggle = (format: OutputFormat) => {
    setFormatConfigs(prev => ({
      ...prev,
      [format]: {
        ...prev[format],
        enabled: !prev[format].enabled
      }
    }))
  }

  const handleModelChange = (format: OutputFormat, model: string) => {
    setFormatConfigs(prev => ({
      ...prev,
      [format]: {
        ...prev[format],
        model: model
      }
    }))
  }

  const getEnabledFormats = () => {
    return Object.entries(formatConfigs)
      .filter(([_, config]) => config.enabled)
      .map(([format, _]) => format)
  }

  const handleSKUFileSelect = (file: File) => {
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
    const maxSize = 10 * 1024 * 1024 // 10MB

    if (!allowedTypes.includes(file.type)) {
      alert('Please upload only JPG, PNG, or WebP images.')
      return
    }

    if (file.size > maxSize) {
      alert('File size must be less than 10MB.')
      return
    }

    setUploadedSKU(file)

    // Create preview and store in Redux
    const reader = new FileReader()
    reader.onloadend = () => {
      const result = reader.result as string
      setSKUPreview(result)
      dispatch(setProductSkuImage(result))
    }
    reader.readAsDataURL(file)
  }

  const handleSKUDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)

    const files = Array.from(e.dataTransfer.files)
    if (files.length > 0) {
      handleSKUFileSelect(files[0])
    }
  }

  const handleSKUDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(true)
  }

  const handleSKUDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
  }

  const handleSKUClick = () => {
    fileInputRef.current?.click()
  }

  const handleSKUInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (files && files.length > 0) {
      handleSKUFileSelect(files[0])
    }
  }

  const removeSKU = () => {
    setUploadedSKU(null)
    setSKUPreview(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const handleGenerate = async () => {
    if (!uploadedSKU) {
      return
    }

    setIsGenerating(true)
    setGenerationProgress(0)
    dispatch(setAssetsGenerating(true))

    // Start progress animation
    let progress = 0
    const progressInterval = setInterval(() => {
      progress += Math.random() * 5
      if (progress >= 90) {
        progress = 90 // Cap at 90% until actual completion
      }
      setGenerationProgress(progress)
    }, 500)

    try {
      // Map creativity level to API format
      const creativityLevelMap: Record<number, string> = {
        25: 'conservative',
        50: 'balanced',
        75: 'creative',
        100: 'experimental'
      }

      // Find the closest creativity level
      const creativityKey = Object.keys(creativityLevelMap)
        .map(Number)
        .reduce((prev, curr) =>
          Math.abs(curr - creativityLevel) < Math.abs(prev - creativityLevel) ? curr : prev
        )

      const creativityLevelStr = creativityLevelMap[creativityKey]

      // Prepare parameters
      const params: any = {
        productSku: uploadedSKU,
        creativityLevel: creativityLevelStr,
        briefContext: briefData ? JSON.stringify(briefData) : undefined
      }

      // Add image generation config if enabled
      if (formatConfigs.Images.enabled && creativePrompts?.image_prompt) {
        params.imagePrompt = creativePrompts.image_prompt
        params.imageVariations = imageVariations
        params.imageModel = formatConfigs.Images.model
      }

      // Add video generation config if enabled
      if (formatConfigs.Video.enabled && creativePrompts?.video_prompt) {
        params.videoPrompt = creativePrompts.video_prompt
        params.videoModel = formatConfigs.Video.model
        params.videoDuration = 5  // Default duration
      }

      // Add copy generation config if enabled
      if (formatConfigs.Copy.enabled && creativePrompts?.copy_prompt) {
        params.copyPrompt = creativePrompts.copy_prompt
        params.copyVariations = copyVariations
        params.copyModel = formatConfigs.Copy.model
      }

      // Call API to generate all assets in parallel
      const result = await generateAssets(params)

      // Save generated assets to Redux
      if (result.images) {
        dispatch(setGeneratedImages(result.images))
      }
      if (result.video) {
        dispatch(setGeneratedVideo(result.video))
      }
      if (result.copy_variations) {
        dispatch(setGeneratedCopies(result.copy_variations))
      }

      // Complete progress
      clearInterval(progressInterval)
      setGenerationProgress(100)

      // Wait a moment then proceed to next step
      setTimeout(() => {
        onNext()
      }, 1000)

    } catch (err) {
      clearInterval(progressInterval)
      const errorMessage = err instanceof Error ? err.message : 'Failed to generate assets'
      dispatch(setAssetsError(errorMessage))
      console.error('Asset generation error:', err)
      setIsGenerating(false)
    } finally {
      dispatch(setAssetsGenerating(false))
    }
  }

  const handleOpenPromptEditor = (type: 'image' | 'copy' | 'video') => {
    setEditingPromptType(type)
    setIsModalOpen(true)
  }

  const handleSavePrompt = (value: string) => {
    switch (editingPromptType) {
      case 'image':
        dispatch(updateImagePrompt(value))
        break
      case 'copy':
        dispatch(updateCopyPrompt(value))
        break
      case 'video':
        dispatch(updateVideoPrompt(value))
        break
    }
  }

  const getCurrentPromptValue = () => {
    if (!creativePrompts) return ''
    switch (editingPromptType) {
      case 'image':
        return creativePrompts.image_prompt
      case 'copy':
        return creativePrompts.copy_prompt
      case 'video':
        return creativePrompts.video_prompt
    }
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="space-y-4">
        <h2 className="text-3xl font-bold text-foreground">Generate Creative Assets</h2>
        <p className="text-lg text-muted-foreground">
          Upload product SKU and configure generation settings for{' '}
          <span className="text-purple-400 font-medium">{briefData?.brand_name.value || 'your brand'}</span>
        </p>
      </div>

      {/* Generated Prompts Preview */}
      {creativePrompts && (
        <div className="bg-gradient-to-br from-purple-500/10 to-pink-500/10 border border-purple-500/20 rounded-xl p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-green-400" />
              <h3 className="font-semibold text-foreground">Creative Prompts Generated</h3>
            </div>
          </div>
          <p className="text-sm text-muted-foreground">
            AI-generated prompts are ready for asset creation. Click on any prompt to view and edit the full content.
          </p>
          <div className="grid md:grid-cols-3 gap-4">
            {/* Image Prompt */}
            <div className="bg-card dark:bg-card/50 border border-border rounded-lg p-4 space-y-3">
              <div className="flex items-center gap-2">
                <ImageIcon className="w-4 h-4 text-cyan-400" />
                <span className="text-foreground font-medium text-sm">Image Prompt</span>
              </div>
              <p className="text-muted-foreground text-xs line-clamp-3">{creativePrompts.image_prompt}</p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleOpenPromptEditor('image')}
                className="w-full bg-transparent border-border hover:border-cyan-500 hover:text-cyan-400 text-xs"
              >
                <Eye className="w-3 h-3 mr-2" />
                View & Edit
              </Button>
            </div>

            {/* Copy Prompt */}
            <div className="bg-card dark:bg-card/50 border border-border rounded-lg p-4 space-y-3">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-pink-400" />
                <span className="text-foreground font-medium text-sm">Copy Prompt</span>
              </div>
              <p className="text-muted-foreground text-xs line-clamp-3">{creativePrompts.copy_prompt}</p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleOpenPromptEditor('copy')}
                className="w-full bg-transparent border-border hover:border-pink-500 hover:text-pink-400 text-xs"
              >
                <Eye className="w-3 h-3 mr-2" />
                View & Edit
              </Button>
            </div>

            {/* Video Prompt */}
            <div className="bg-card dark:bg-card/50 border border-border rounded-lg p-4 space-y-3">
              <div className="flex items-center gap-2">
                <Video className="w-4 h-4 text-green-400" />
                <span className="text-foreground font-medium text-sm">Video Prompt</span>
              </div>
              <p className="text-muted-foreground text-xs line-clamp-3">{creativePrompts.video_prompt}</p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleOpenPromptEditor('video')}
                className="w-full bg-transparent border-border hover:border-green-500 hover:text-green-400 text-xs"
              >
                <Eye className="w-3 h-3 mr-2" />
                View & Edit
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Product SKU Upload */}
      <div className="bg-card dark:bg-card/50 border border-border rounded-xl p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-foreground">Product SKU Image</h3>
          <span className="text-xs text-muted-foreground">Required</span>
        </div>
        <p className="text-sm text-muted-foreground">Upload a high-quality image of your product for asset generation</p>

        <div
          className={`border-2 border-dashed rounded-xl p-8 text-center transition-colors cursor-pointer ${
            isDragOver
              ? 'border-purple-500 bg-purple-500/10'
              : uploadedSKU
                ? 'border-green-500/50 bg-green-500/5'
                : 'border-border hover:border-purple-500/50'
          }`}
          onDrop={handleSKUDrop}
          onDragOver={handleSKUDragOver}
          onDragLeave={handleSKUDragLeave}
          onClick={handleSKUClick}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/jpg,image/png,image/webp"
            onChange={handleSKUInputChange}
            className="hidden"
          />

          {!uploadedSKU ? (
            <div className="flex flex-col items-center gap-3">
              <div className={`w-14 h-14 rounded-lg flex items-center justify-center transition-colors ${
                isDragOver ? 'bg-purple-500/20' : 'bg-muted'
              }`}>
                <Upload className={`w-6 h-6 transition-colors ${
                  isDragOver ? 'text-purple-400' : 'text-muted-foreground'
                }`} />
              </div>
              <div>
                <p className="font-semibold text-foreground mb-1">
                  {isDragOver ? 'Drop your image here' : 'Click to upload or drag and drop'}
                </p>
                <p className="text-sm text-muted-foreground">JPG, PNG, or WebP up to 10MB</p>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-4">
              {skuPreview && (
                <img
                  src={skuPreview}
                  alt="Product SKU"
                  className="w-32 h-32 object-contain rounded-lg bg-muted"
                />
              )}
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-green-400" />
                  <p className="font-semibold text-foreground">{uploadedSKU.name}</p>
                </div>
                <p className="text-sm text-muted-foreground">
                  {(uploadedSKU.size / 1024 / 1024).toFixed(2)} MB
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation()
                  removeSKU()
                }}
                className="bg-transparent border-border hover:border-red-500 hover:text-red-400"
              >
                <X className="w-4 h-4 mr-2" />
                Remove Image
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Output Format Selection */}
      <div className="space-y-6">
        <h3 className="text-xl font-semibold text-foreground">Select Output Formats & Models</h3>
        <div className="grid gap-6">
          {(Object.entries(formatConfigs) as [OutputFormat, FormatConfig][]).map(([format, config]) => {
            const IconComponent = config.icon
            return (
              <div
                key={format}
                className={`bg-card dark:bg-card/50 border rounded-xl p-6 transition-all ${
                  config.enabled
                    ? 'border-purple-500/50 bg-purple-500/5'
                    : 'border-border hover:border-border'
                }`}
              >
                <div className="flex items-start gap-4">
                  {/* Format Toggle */}
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <label className="flex items-center gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={config.enabled}
                        onChange={() => handleFormatToggle(format)}
                        className="w-5 h-5 rounded border-border bg-muted text-purple-500 focus:ring-purple-500/50"
                      />
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                        config.enabled ? 'bg-purple-500/20' : 'bg-muted'
                      }`}>
                        <IconComponent className={`w-5 h-5 ${
                          config.enabled ? 'text-purple-400' : 'text-muted-foreground'
                        }`} />
                      </div>
                      <div>
                        <h4 className="font-semibold text-foreground">{format}</h4>
                        <p className="text-sm text-muted-foreground">{config.description}</p>
                      </div>
                    </label>
                  </div>

                  {/* Model Selection */}
                  {config.enabled && (
                    <div className="min-w-[200px]">
                      <label className="block text-sm text-muted-foreground mb-2">AI Model</label>
                      <select
                        value={config.model}
                        onChange={(e) => handleModelChange(format, e.target.value)}
                        className="w-full bg-muted border border-border rounded-lg px-3 py-2 text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50"
                      >
                        {config.models.map((model) => (
                          <option key={model} value={model}>{model}</option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
        <p className="text-sm text-muted-foreground">
          {getEnabledFormats().length} format{getEnabledFormats().length !== 1 ? 's' : ''} selected
        </p>
      </div>

      {/* Advanced Settings */}
      <div className="bg-card dark:bg-card/50 border border-border rounded-xl p-6 space-y-6">
        <h3 className="font-semibold text-foreground">Advanced Settings</h3>

        {/* Creativity Level */}
        <div>
          <div className="flex justify-between mb-3">
            <label className="text-sm text-foreground">Creativity Level</label>
            <span className="text-xs text-purple-400 font-medium">{getCreativityLabel(creativityLevel)}</span>
          </div>
          <input
            type="range"
            min="0"
            max="100"
            value={creativityLevel}
            onChange={(e) => setCreativityLevel(Number(e.target.value))}
            className="w-full h-2 bg-muted rounded-lg appearance-none cursor-pointer slider"
            style={{
              background: `linear-gradient(to right, #8b5cf6 0%, #8b5cf6 ${creativityLevel}%, #374151 ${creativityLevel}%, #374151 100%)`
            }}
          />
          <div className="flex justify-between text-xs text-muted-foreground mt-1">
            <span>Conservative</span>
            <span>Experimental</span>
          </div>
        </div>

        {/* Variation Controls */}
        <div className="grid md:grid-cols-2 gap-6 pt-4 border-t border-border">
          {/* Image Variations */}
          {formatConfigs.Images.enabled && (
            <div>
              <div className="flex justify-between mb-3">
                <label className="text-sm text-foreground">Image Variations</label>
                <span className="text-xs text-cyan-400 font-medium">{imageVariations}</span>
              </div>
              <input
                type="range"
                min="1"
                max="5"
                value={imageVariations}
                onChange={(e) => setImageVariations(Number(e.target.value))}
                className="w-full h-2 bg-muted rounded-lg appearance-none cursor-pointer slider"
                style={{
                  background: `linear-gradient(to right, #06b6d4 0%, #06b6d4 ${(imageVariations - 1) * 25}%, #374151 ${(imageVariations - 1) * 25}%, #374151 100%)`
                }}
              />
              <div className="flex justify-between text-xs text-muted-foreground mt-1">
                <span>1</span>
                <span>5</span>
              </div>
            </div>
          )}

          {/* Copy Variations */}
          {formatConfigs.Copy.enabled && (
            <div>
              <div className="flex justify-between mb-3">
                <label className="text-sm text-foreground">Copy Variations</label>
                <span className="text-xs text-pink-400 font-medium">{copyVariations}</span>
              </div>
              <input
                type="range"
                min="1"
                max="5"
                value={copyVariations}
                onChange={(e) => setCopyVariations(Number(e.target.value))}
                className="w-full h-2 bg-muted rounded-lg appearance-none cursor-pointer slider"
                style={{
                  background: `linear-gradient(to right, #ec4899 0%, #ec4899 ${(copyVariations - 1) * 25}%, #374151 ${(copyVariations - 1) * 25}%, #374151 100%)`
                }}
              />
              <div className="flex justify-between text-xs text-muted-foreground mt-1">
                <span>1</span>
                <span>5</span>
              </div>
            </div>
          )}

          {/* Video Note */}
          {formatConfigs.Video.enabled && (
            <div className="md:col-span-2 bg-muted/50 border border-border rounded-lg p-4">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Video className="w-4 h-4" />
                <span>Video generation creates 1 variation only</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Generation Summary */}
      <div className="bg-card dark:bg-card/50 border border-border rounded-xl p-6">
        <h3 className="font-semibold text-foreground mb-4">Generation Summary</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div>
            <p className="text-muted-foreground">Creativity</p>
            <p className="text-foreground font-medium">{getCreativityLabel(creativityLevel)}</p>
          </div>
          {formatConfigs.Images.enabled && (
            <div>
              <p className="text-muted-foreground">Image Variations</p>
              <p className="text-cyan-400 font-medium">{imageVariations}</p>
            </div>
          )}
          {formatConfigs.Copy.enabled && (
            <div>
              <p className="text-muted-foreground">Copy Variations</p>
              <p className="text-pink-400 font-medium">{copyVariations}</p>
            </div>
          )}
          {formatConfigs.Video.enabled && (
            <div>
              <p className="text-muted-foreground">Video</p>
              <p className="text-green-400 font-medium">1 video</p>
            </div>
          )}
        </div>

        {/* Model Details */}
        {getEnabledFormats().length > 0 && (
          <div className="mt-4 pt-4 border-t border-border">
            <p className="text-muted-foreground text-sm mb-2">Selected Models:</p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {getEnabledFormats().map((format) => (
                <div key={format} className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground">{format}:</span>
                  <span className="text-xs text-foreground font-medium">
                    {formatConfigs[format as OutputFormat].model}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Generation Area */}
      {!isGenerating ? (
        <div className="bg-gradient-to-br from-purple-500/10 to-pink-500/10 border border-purple-500/20 rounded-xl p-12 text-center">
          <Play className="w-12 h-12 text-purple-400 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-foreground mb-2">Ready to Generate</h3>
          <p className="text-muted-foreground mb-6">
            {formatConfigs.Images.enabled && (
              <span className="block">{imageVariations} image{imageVariations !== 1 ? 's' : ''}</span>
            )}
            {formatConfigs.Copy.enabled && (
              <span className="block">{copyVariations} copy variation{copyVariations !== 1 ? 's' : ''}</span>
            )}
            {formatConfigs.Video.enabled && (
              <span className="block">1 video</span>
            )}
            <span className="block mt-2 text-sm">
              With {getCreativityLabel(creativityLevel).toLowerCase()} creativity
            </span>
            {getEnabledFormats().length > 0 && (
              <span className="block mt-2 text-xs text-muted-foreground">
                Using: {getEnabledFormats().map(format =>
                  formatConfigs[format as OutputFormat].model
                ).join(", ")}
              </span>
            )}
          </p>
          <Button
            onClick={handleGenerate}
            size="lg"
            className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
            disabled={getEnabledFormats().length === 0 || !uploadedSKU}
          >
            Start Generation
          </Button>
          {getEnabledFormats().length === 0 && (
            <p className="text-red-400 text-sm mt-2">Please select at least one output format</p>
          )}
          {!uploadedSKU && getEnabledFormats().length > 0 && (
            <p className="text-red-400 text-sm mt-2">Please upload a product SKU image</p>
          )}
        </div>
      ) : (
        <div className="bg-card dark:bg-card/50 border border-border rounded-xl p-8 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-foreground">Generating Assets...</h3>
            <span className="text-sm text-muted-foreground">
              {getCreativityLabel(creativityLevel)} creativity
            </span>
          </div>
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="flex-1 bg-muted rounded-full h-3 overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-purple-500 to-pink-500 transition-all duration-500"
                  style={{ width: `${generationProgress}%` }}
                ></div>
              </div>
              <span className="text-sm font-medium text-foreground min-w-[3rem]">{Math.round(generationProgress)}%</span>
            </div>
            <p className="text-sm text-muted-foreground">
              {generationProgress < 20
                ? "Analyzing your brief and product SKU..."
                : generationProgress < 40
                  ? `Generating ${getEnabledFormats().join(" and ").toLowerCase()}...`
                  : generationProgress < 70
                    ? "Creating variations..."
                    : generationProgress < 90
                      ? "Applying creativity enhancements..."
                      : "Finalizing outputs..."}
            </p>
          </div>
          {generationProgress >= 100 && (
            <Button
              onClick={onNext}
              className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
            >
              View Generated Assets
            </Button>
          )}
        </div>
      )}

      {/* Navigation */}
      {!isGenerating && (
        <div className="flex justify-between">
          <Button onClick={onPrev} variant="outline">
            Back
          </Button>
        </div>
      )}

      {/* Prompt Editor Modal */}
      {creativePrompts && (
        <PromptEditorModal
          open={isModalOpen}
          onOpenChange={setIsModalOpen}
          promptType={editingPromptType}
          promptValue={getCurrentPromptValue()}
          onSave={handleSavePrompt}
        />
      )}
    </div>
  )
}
