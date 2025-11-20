"use client"

import { useState, useRef, useEffect, useCallback } from "react"
import { Download, Crop, Sliders, Filter, Undo2, Redo2 } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { applyImageFilter, applyImageAdjustment } from "@/services/api"

type EditorTool = 'crop' | 'adjust' | 'filters'
type AspectRatio = 'free' | '1:1' | '4:3' | '3:2' | '16:9' | '21:9' | '9:16' | '4:5' | '2:3'

interface ImageEditorModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  imageBase64: string
  mimeType: string
  onSave: (editedImageBase64: string) => void
}

interface HistoryState {
  imageData: ImageData
  timestamp: number
}

interface CropArea {
  x: number
  y: number
  width: number
  height: number
}

const TOOL_CONFIG = {
  crop: { label: 'Crop', icon: Crop },
  adjust: { label: 'Adjust', icon: Sliders },
  filters: { label: 'Filters', icon: Filter },
}

export function ImageEditorModal({
  open,
  onOpenChange,
  imageBase64,
  mimeType,
  onSave
}: ImageEditorModalProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [activeTool, setActiveTool] = useState<EditorTool>('crop')
  const [isDrawing, setIsDrawing] = useState(false)
  const [hasChanges, setHasChanges] = useState(false)
  const [history, setHistory] = useState<HistoryState[]>([])
  const [historyIndex, setHistoryIndex] = useState(-1)
  const [cropArea, setCropArea] = useState<CropArea | null>(null)
  const [activeAspect, setActiveAspect] = useState<AspectRatio>('free')
  const [aspectRatioValue, setAspectRatioValue] = useState<number | undefined>(undefined)
  const [imageLoaded, setImageLoaded] = useState(false)
  const [imageError, setImageError] = useState<string | null>(null)
  
  // Adjust and Filter states
  const [selectedAdjustPreset, setSelectedAdjustPreset] = useState<string | null>(null)
  const [customAdjustPrompt, setCustomAdjustPrompt] = useState('')
  const [selectedFilterPreset, setSelectedFilterPreset] = useState<string | null>(null)
  const [customFilterPrompt, setCustomFilterPrompt] = useState('')
  const [isProcessing, setIsProcessing] = useState(false)
  const [processingError, setProcessingError] = useState<string | null>(null)
  
  // Remove saved prompts functionality
  
  const originalImageRef = useRef<ImageData | null>(null)
  const imageRef = useRef<HTMLImageElement>(null)

  // Load preferences from localStorage (without saved prompts)
  useEffect(() => {
    const lastTool = localStorage.getItem('imageEditor_lastTool')
    const lastAspect = localStorage.getItem('imageEditor_lastAspectRatio')
    
    // Set default tool from localStorage if available
    if (lastTool && ['crop', 'adjust', 'filters'].includes(lastTool)) {
      setActiveTool(lastTool as EditorTool)
    }
    
    // Set default aspect ratio from localStorage if available
    if (lastAspect) {
      const aspectData = JSON.parse(lastAspect)
      setActiveAspect(aspectData.name)
      setAspectRatioValue(aspectData.value)
    }
  }, [])

  const saveToHistory = useCallback(() => {
    const canvas = canvasRef.current
    const ctx = canvas?.getContext('2d')
    if (!ctx) return

    const imageData = ctx.getImageData(0, 0, canvas!.width, canvas!.height)
    const newState: HistoryState = {
      imageData: imageData,
      timestamp: Date.now()
    }

    setHistory(prev => {
      const newHistory = prev.slice(0, historyIndex + 1)
      newHistory.push(newState)
      return newHistory.slice(-20)
    })
    setHistoryIndex(prev => Math.min(prev + 1, 19))
  }, [historyIndex])

  useEffect(() => {
    console.log('🔍 useEffect triggered - open:', open, 'hasCanvas:', !!canvasRef.current, 'hasImageData:', !!imageBase64)
    
    if (!open) {
      console.log('⏸️ Modal not open, skipping')
      return
    }
    
    if (!canvasRef.current) {
      console.log('⏸️ Canvas ref not ready, waiting...')
      // Try again after a short delay
      const timer = setTimeout(() => {
        if (canvasRef.current && imageBase64) {
          console.log('🔄 Retrying image load after canvas ready')
          loadImage()
        }
      }, 100)
      return () => clearTimeout(timer)
    }
    
    if (!imageBase64) {
      console.log('❌ No image data provided')
      setImageError('No image data provided')
      return
    }
    
    loadImage()
  }, [open, imageBase64, mimeType])
  
  const loadImage = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas || !imageBase64) {
      console.log('❌ Cannot load - missing canvas or image data')
      return
    }
    
    console.log('🖼️ Starting image load...')
    console.log('📊 imageBase64 length:', imageBase64.length)
    console.log('📊 mimeType:', mimeType)
      
    setImageLoaded(false)
    setImageError(null)
    
    const ctx = canvas.getContext('2d')
      if (!ctx) {
        setImageError('Failed to get canvas context')
        return
      }
      
      const img = new Image()
      let loadTimeout: NodeJS.Timeout
      
      img.onload = () => {
        clearTimeout(loadTimeout)
        try {
          // Set canvas to actual image dimensions
          canvas.width = img.naturalWidth || img.width
          canvas.height = img.naturalHeight || img.height
          
          console.log('✅ Image dimensions:', canvas.width, 'x', canvas.height)
          
          // Clear and draw the image
          ctx.clearRect(0, 0, canvas.width, canvas.height)
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
          
          // Store original image data
          originalImageRef.current = ctx.getImageData(0, 0, canvas.width, canvas.height)
          const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
          setHistory([{ imageData, timestamp: Date.now() }])
          setHistoryIndex(0)
          imageRef.current = img
          
          setImageLoaded(true)
          console.log('✅ Image loaded and drawn successfully!')
        } catch (error) {
          console.error('❌ Error drawing image:', error)
          setImageError(`Failed to draw image: ${error}`)
        }
      }
      
      img.onerror = (e) => {
        clearTimeout(loadTimeout)
        console.error('❌ Image load error:', e)
        setImageError('Failed to load image - invalid image data')
      }
      
      // Set a timeout in case image never loads
      loadTimeout = setTimeout(() => {
        if (!imageLoaded) {
          console.error('⏱️ Image load timeout')
          setImageError('Image loading timed out')
        }
      }, 10000) // 10 second timeout
      
      const dataUrl = `data:${mimeType};base64,${imageBase64}`
    console.log('🖼️ Setting image source...')
    img.src = dataUrl
  }, [imageBase64, mimeType])

  useEffect(() => {
    if (open) {
      setHasChanges(false)
      setCropArea(null)
      // Don't reset activeTool and aspect ratio - let them persist from localStorage
    }
  }, [open])

  const getCanvasCoordinates = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current
    if (!canvas) return { x: 0, y: 0 }
    
    const rect = canvas.getBoundingClientRect()
    const scaleX = canvas.width / rect.width
    const scaleY = canvas.height / rect.height
    
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY
    }
  }

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (activeTool === 'crop') {
      const { x, y } = getCanvasCoordinates(e)
      setCropArea({ x, y, width: 0, height: 0 })
      setIsDrawing(true)
    }
  }

  const onDrawing = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing || activeTool !== 'crop') return
    
    const { x, y } = getCanvasCoordinates(e)
    
    if (cropArea) {
      let width = x - cropArea.x
      let height = y - cropArea.y
      
      // Apply aspect ratio if set
      if (aspectRatioValue && width !== 0) {
        height = width / aspectRatioValue
      }
      
      setCropArea({
        ...cropArea,
        width,
        height
      })
    }
  }

  const stopDrawing = () => {
    setIsDrawing(false)
  }

  const handleAspectChange = (aspect: AspectRatio, value: number | undefined) => {
    setActiveAspect(aspect)
    setAspectRatioValue(value)
    setCropArea(null)
    
    // Save aspect ratio preference to localStorage
    localStorage.setItem('imageEditor_lastAspectRatio', JSON.stringify({
      name: aspect,
      value: value
    }))
  }

  const applyCrop = () => {
    if (!cropArea) return
    
    const canvas = canvasRef.current
    const ctx = canvas?.getContext('2d')
    if (!ctx || !canvas) return

    const x = Math.max(0, Math.min(cropArea.x, cropArea.x + cropArea.width))
    const y = Math.max(0, Math.min(cropArea.y, cropArea.y + cropArea.height))
    const width = Math.abs(cropArea.width)
    const height = Math.abs(cropArea.height)
    
    const currentImageData = ctx.getImageData(x, y, width, height)
    canvas.width = width
    canvas.height = height
    ctx.putImageData(currentImageData, 0, 0)
    
    setCropArea(null)
    saveToHistory()
    setHasChanges(true)
  }

  const resetCrop = () => {
    setCropArea(null)
    setActiveAspect('free')
    setAspectRatioValue(undefined)
  }

  const applyAdjustment = async (prompt: string) => {
    try {
      setIsProcessing(true)
      setProcessingError(null)
      const canvas = canvasRef.current
      if (!canvas) return

      const dataUrl = canvas.toDataURL(mimeType)
      const base64Data = dataUrl.split(',')[1]
      
      const result = await applyImageAdjustment(base64Data, mimeType, prompt)
      
      const img = new Image()
      img.onload = () => {
        const ctx = canvas.getContext('2d')
        if (ctx) {
          ctx.clearRect(0, 0, canvas.width, canvas.height)
          ctx.drawImage(img, 0, 0)
          saveToHistory()
          setHasChanges(true)
        }
      }
      img.src = `data:${result.mime_type};base64,${result.adjusted_image_base64}`
      
      // Clear prompt on successful application
      if (customAdjustPrompt === prompt) {
        setCustomAdjustPrompt('')
      }
    } catch (error) {
      console.error('Adjustment application failed:', error)
      setProcessingError(error instanceof Error ? error.message : 'Failed to apply adjustment')
    } finally {
      setIsProcessing(false)
    }
  }

  const applyFilter = async (prompt: string) => {
    try {
      setIsProcessing(true)
      setProcessingError(null)
      const canvas = canvasRef.current
      if (!canvas) return

      const dataUrl = canvas.toDataURL(mimeType)
      const base64Data = dataUrl.split(',')[1]
      
      const result = await applyImageFilter(base64Data, mimeType, prompt)
      
      const img = new Image()
      img.onload = () => {
        const ctx = canvas.getContext('2d')
        if (ctx) {
          ctx.clearRect(0, 0, canvas.width, canvas.height)
          ctx.drawImage(img, 0, 0)
          saveToHistory()
          setHasChanges(true)
        }
      }
      img.src = `data:${result.mime_type};base64,${result.filtered_image_base64}`
      
      // Clear prompt on successful application
      if (customFilterPrompt === prompt) {
        setCustomFilterPrompt('')
      }
    } catch (error) {
      console.error('Filter application failed:', error)
      setProcessingError(error instanceof Error ? error.message : 'Failed to apply filter')
    } finally {
      setIsProcessing(false)
    }
  }

  const resetToOriginal = () => {
    const canvas = canvasRef.current
    const ctx = canvas?.getContext('2d')
    const originalData = originalImageRef.current
    
    if (!ctx || !canvas || !originalData) {
      console.log('Cannot reset - missing canvas or original data')
      return
    }

    // Restore original canvas dimensions
    canvas.width = originalData.width
    canvas.height = originalData.height
    
    // Put back original image data
    ctx.putImageData(originalData, 0, 0)
    
    // Reset history to original state
    setHistory([{ imageData: originalData, timestamp: Date.now() }])
    setHistoryIndex(0)
    
    // Clear changes and crop area
    setHasChanges(false)
    setCropArea(null)
    setActiveAspect('free')
    setAspectRatioValue(undefined)
    
    console.log('Reset to original - dimensions:', canvas.width, 'x', canvas.height)
  }

  const downloadEditedImage = () => {
    const canvas = canvasRef.current
    if (!canvas) return

    const dataUrl = canvas.toDataURL(mimeType)
    const link = document.createElement('a')
    link.href = dataUrl
    link.download = `edited_image.${mimeType.split('/')[1]}`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const aspects: { name: AspectRatio, value: number | undefined, label: string }[] = [
    { name: 'free', value: undefined, label: 'Free' },
    { name: '1:1', value: 1 / 1, label: '1:1' },
    { name: '4:3', value: 4 / 3, label: '4:3' },
    { name: '3:2', value: 3 / 2, label: '3:2' },
    { name: '16:9', value: 16 / 9, label: '16:9' },
    { name: '21:9', value: 21 / 9, label: '21:9' },
    { name: '9:16', value: 9 / 16, label: '9:16' },
    { name: '4:5', value: 4 / 5, label: '4:5' },
    { name: '2:3', value: 2 / 3, label: '2:3' },
  ]

  const adjustPresets = [
    { name: 'Blur Background', prompt: 'Apply a realistic depth-of-field effect, making the background blurry while keeping the main subject in sharp focus.' },
    { name: 'Enhance Details', prompt: 'Slightly enhance the sharpness and details of the image without making it look unnatural.' },
    { name: 'Warmer Lighting', prompt: 'Adjust the color temperature to give the image warmer, golden-hour style lighting.' },
    { name: 'Studio Light', prompt: 'Add dramatic, professional studio lighting to the main subject.' },
  ]

  const filterPresets = [
    { name: 'Synthwave', prompt: 'Apply a vibrant 80s synthwave aesthetic with neon colors and retro vibes.' },
    { name: 'Anime', prompt: 'Give the image a vibrant Japanese anime style look.' },
    { name: 'Lomo', prompt: 'Apply a vintage lomography film camera effect.' },
    { name: 'Glitch', prompt: 'Add a digital glitch art effect with color distortions.' },
  ]

  const activeAdjustPrompt = selectedAdjustPreset || customAdjustPrompt
  const activeFilterPrompt = selectedFilterPreset || customFilterPrompt

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="!max-w-[98vw] !w-[98vw] !max-h-[98vh] !h-[98vh] !p-0 !bg-white !border-0 shadow-2xl rounded-2xl overflow-hidden !translate-x-[-50%] !translate-y-[-50%] !left-[50%] !top-[50%] !fixed !z-50">
        <DialogTitle className="sr-only">Image Editor</DialogTitle>
        {/* Header - Fixed Height */}
        <div className="h-14 flex items-center justify-center px-4 bg-white border-b border-gray-100 shrink-0">
          <h2 className="text-lg font-semibold text-gray-900">Image Editor</h2>
        </div>

        {/* Toolbar - Fixed Height */}
        <div className="h-12 flex items-center justify-between px-4 bg-gray-50 border-b border-gray-100 shrink-0">
          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                if (historyIndex > 0) {
                  const canvas = canvasRef.current
                  const ctx = canvas?.getContext('2d')
                  if (ctx && history[historyIndex - 1]) {
                    ctx.putImageData(history[historyIndex - 1].imageData, 0, 0)
                    setHistoryIndex(prev => prev - 1)
                    setHasChanges(true)
                  }
                }
              }}
              disabled={historyIndex <= 0}
              className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center text-gray-600 hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors bg-white"
              title="Undo"
            >
              <Undo2 className="w-4 h-4" />
            </button>
            <button
              onClick={() => {
                if (historyIndex < history.length - 1) {
                  const canvas = canvasRef.current
                  const ctx = canvas?.getContext('2d')
                  if (ctx && history[historyIndex + 1]) {
                    ctx.putImageData(history[historyIndex + 1].imageData, 0, 0)
                    setHistoryIndex(prev => prev + 1)
                    setHasChanges(true)
                  }
                }
              }}
              disabled={historyIndex >= history.length - 1}
              className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center text-gray-600 hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors bg-white"
              title="Redo"
            >
              <Redo2 className="w-4 h-4" />
            </button>
            <button
              onClick={resetToOriginal}
              disabled={!hasChanges}
              className="text-gray-600 hover:text-gray-900 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium transition-colors px-2 py-1 rounded"
            >
              Reset
            </button>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-gray-600 text-sm">
              {isProcessing ? 'Processing...' : `${hasChanges ? 'Modified' : 'Original'}`}
            </span>
            <button
              className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded-lg text-sm font-medium flex items-center gap-2 transition-colors"
              onClick={() => {
                downloadEditedImage()
                const canvas = canvasRef.current
                if (canvas && onSave) {
                  const dataUrl = canvas.toDataURL(mimeType)
                  const base64Data = dataUrl.split(',')[1]
                  onSave(base64Data)
                }
              }}
            >
              <Download className="w-4 h-4" />
              Download
            </button>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 flex overflow-hidden min-h-0">
          {/* Canvas Area - Larger Canvas Container */}
          <div className="flex-1 flex items-center justify-center bg-gray-50 p-4 relative min-w-0">
            {/* Loading state */}
            {!imageLoaded && !imageError && (
              <div className="absolute inset-0 flex items-center justify-center bg-gray-50 z-20">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                  <p className="text-gray-600">Loading image...</p>
                </div>
              </div>
            )}
            
            {/* Error state */}
            {imageError && (
              <div className="absolute inset-0 flex items-center justify-center bg-gray-50 z-20">
                <div className="text-center text-red-600">
                  <p className="font-semibold">Error loading image</p>
                  <p className="text-sm mt-2">{imageError}</p>
                </div>
              </div>
            )}
            
            {activeTool === 'crop' && cropArea === null && imageLoaded && (
              <div className="absolute top-4 left-4 bg-gray-800 text-white px-3 py-1.5 rounded text-sm z-10">
                Crop Mode - Select area to crop
              </div>
            )}
            
            {/* Much Larger Canvas Container */}
            <div 
              className="relative bg-white rounded-lg shadow-lg border border-gray-200 flex items-center justify-center"
              style={{
                width: 'calc(100vw - 480px)',
                height: 'calc(100vh - 140px)',
                minWidth: '500px',
                minHeight: '400px'
              }}
            >
              <canvas
                ref={canvasRef}
                onMouseDown={startDrawing}
                onMouseMove={onDrawing}
                onMouseUp={stopDrawing}
                onMouseLeave={stopDrawing}
                style={{
                  cursor: activeTool === 'crop' ? 'crosshair' : 'default',
                  backgroundColor: 'white',
                  maxWidth: '100%',
                  maxHeight: '100%',
                  objectFit: 'contain',
                  display: 'block'
                }}
              />
                
              {/* Crop overlay */}
              {activeTool === 'crop' && cropArea && Math.abs(cropArea.width) > 0 && Math.abs(cropArea.height) > 0 && canvasRef.current && (() => {
                const canvas = canvasRef.current
                const rect = canvas.getBoundingClientRect()
                const scaleX = rect.width / canvas.width
                const scaleY = rect.height / canvas.height
                
                // Calculate canvas offset within the fixed container
                const container = canvas.parentElement
                const containerRect = container?.getBoundingClientRect()
                const canvasOffsetX = container && containerRect ? (rect.left - containerRect.left) : 0
                const canvasOffsetY = container && containerRect ? (rect.top - containerRect.top) : 0
                
                const displayX = canvasOffsetX + Math.min(cropArea.x, cropArea.x + cropArea.width) * scaleX
                const displayY = canvasOffsetY + Math.min(cropArea.y, cropArea.y + cropArea.height) * scaleY
                const displayWidth = Math.abs(cropArea.width) * scaleX
                const displayHeight = Math.abs(cropArea.height) * scaleY
                
                return (
                  <div
                    className="absolute border-2 border-dashed border-white bg-blue-500/10 pointer-events-none shadow-lg"
                    style={{
                      left: `${displayX}px`,
                      top: `${displayY}px`,
                      width: `${displayWidth}px`,
                      height: `${displayHeight}px`
                    }}
                  />
                )
              })()}
            </div>
          </div>

          {/* Tools Panel */}
          <div className="w-[440px] bg-white border-l border-gray-100 flex flex-col overflow-hidden">
            {/* Tool Tabs */}
            <div className="p-4 border-b border-gray-100">
              <div className="flex flex-wrap gap-2">
                {(Object.keys(TOOL_CONFIG) as EditorTool[]).map((tool) => {
                  const config = TOOL_CONFIG[tool]
                  const Icon = config.icon
                  const isActive = activeTool === tool
                  
                  return (
                    <button
                      key={tool}
                      onClick={() => {
                        setActiveTool(tool)
                        localStorage.setItem('imageEditor_lastTool', tool)
                      }}
                      className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all border ${
                        isActive
                          ? 'bg-blue-600 text-white border-blue-600'
                          : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                      <span>{config.label}</span>
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Tool Content */}
            <div className="flex-1 overflow-y-auto p-6">
              {activeTool === 'crop' && (
                <div className="space-y-6">
                  <div>
                    <h3 className="text-base font-semibold text-gray-900 mb-1 flex items-center gap-2">
                      <Crop className="w-5 h-5" />
                      Crop
                    </h3>
                    <p className="text-sm text-gray-600">Crop and resize your image</p>
                  </div>

                  <div className="bg-gray-50 rounded-lg p-6">
                    <h4 className="text-center font-semibold text-gray-900 mb-4">Crop Image</h4>
                    <p className="text-sm text-gray-600 text-center mb-6">Click and drag on the image to select a crop area.</p>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-3">Aspect Ratio:</label>
                      <div className="grid grid-cols-3 gap-2">
                        {aspects.map(({ name, value, label }) => (
                          <button
                            key={name}
                            onClick={() => handleAspectChange(name, value)}
                            className={`px-3 py-2 rounded-md text-sm font-medium transition-all ${
                              activeAspect === name
                                ? 'bg-blue-600 text-white'
                                : 'bg-white text-gray-700 border border-gray-200 hover:bg-gray-50'
                            }`}
                          >
                            {label}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="flex gap-3 mt-6">
                      <button
                        onClick={resetCrop}
                        className="flex-1 bg-white border border-gray-300 text-gray-700 font-medium py-3 px-4 rounded-lg hover:bg-gray-50 transition-colors text-sm"
                      >
                        Reset
                      </button>
                      <button
                        onClick={applyCrop}
                        disabled={!cropArea || Math.abs(cropArea.width) < 10 || Math.abs(cropArea.height) < 10}
                        className="flex-1 bg-green-600 text-white font-medium py-3 px-4 rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                      >
                        Apply Crop
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {activeTool === 'adjust' && (
                <div className="space-y-6">
                  <div>
                    <h3 className="text-base font-semibold text-gray-900 mb-1 flex items-center gap-2">
                      <Sliders className="w-5 h-5" />
                      Adjust
                    </h3>
                    <p className="text-sm text-gray-600">Adjust brightness, contrast, and more</p>
                  </div>

                  <div className="bg-gray-50 rounded-lg p-6">
                    <h4 className="text-center font-semibold text-gray-900 mb-6">Apply a Professional Adjustment</h4>
                    
                    <div className="grid grid-cols-2 gap-2 mb-6">
                      {adjustPresets.map(preset => (
                        <button
                          key={preset.name}
                          onClick={() => {
                            setSelectedAdjustPreset(preset.prompt)
                            setCustomAdjustPrompt('')
                          }}
                          disabled={isProcessing}
                          className={`text-center bg-white border text-gray-700 font-medium py-3 px-4 rounded-lg transition-all hover:bg-gray-50 disabled:opacity-50 text-sm ${
                            selectedAdjustPreset === preset.prompt ? 'ring-2 ring-blue-500 border-blue-500' : 'border-gray-200'
                          }`}
                        >
                          {preset.name}
                        </button>
                      ))}
                    </div>

                    <input
                      type="text"
                      value={customAdjustPrompt}
                      onChange={(e) => {
                        setCustomAdjustPrompt(e.target.value)
                        setSelectedAdjustPreset(null)
                      }}
                      placeholder="Or describe an adjustment (e.g., 'change background to a forest')"
                      className="w-full bg-white border border-gray-300 text-gray-900 rounded-lg p-3 focus:ring-2 focus:ring-blue-500 focus:outline-none text-sm mb-3"
                      disabled={isProcessing}
                    />


                    {processingError && (
                      <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4 text-sm">
                        <p className="font-medium">Error</p>
                        <p>{processingError}</p>
                      </div>
                    )}

                    {activeAdjustPrompt && (
                      <button
                        onClick={() => applyAdjustment(activeAdjustPrompt)}
                        disabled={isProcessing || !activeAdjustPrompt.trim()}
                        className="w-full bg-blue-600 text-white font-medium py-3 px-6 rounded-lg hover:bg-blue-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                      >
                        {isProcessing ? 'Processing...' : 'Apply Adjustment'}
                      </button>
                    )}
                  </div>
                </div>
              )}

              {activeTool === 'filters' && (
                <div className="space-y-6">
                  <div>
                    <h3 className="text-base font-semibold text-gray-900 mb-1 flex items-center gap-2">
                      <Filter className="w-5 h-5" />
                      Filters
                    </h3>
                    <p className="text-sm text-gray-600">Apply creative filters and effects</p>
                  </div>

                  <div className="bg-gray-50 rounded-lg p-6">
                    <h4 className="text-center font-semibold text-gray-900 mb-6">Apply a Filter</h4>
                    
                    <div className="grid grid-cols-2 gap-2 mb-6">
                      {filterPresets.map(preset => (
                        <button
                          key={preset.name}
                          onClick={() => {
                            setSelectedFilterPreset(preset.prompt)
                            setCustomFilterPrompt('')
                          }}
                          disabled={isProcessing}
                          className={`text-center bg-white border text-gray-700 font-medium py-3 px-4 rounded-lg transition-all hover:bg-gray-50 disabled:opacity-50 text-sm ${
                            selectedFilterPreset === preset.prompt ? 'ring-2 ring-blue-500 border-blue-500' : 'border-gray-200'
                          }`}
                        >
                          {preset.name}
                        </button>
                      ))}
                    </div>

                    <input
                      type="text"
                      value={customFilterPrompt}
                      onChange={(e) => {
                        setCustomFilterPrompt(e.target.value)
                        setSelectedFilterPreset(null)
                      }}
                      placeholder="Or describe a custom filter (e.g., '80s synthwave glow')"
                      className="w-full bg-white border border-gray-300 text-gray-900 rounded-lg p-3 focus:ring-2 focus:ring-blue-500 focus:outline-none text-sm mb-3"
                      disabled={isProcessing}
                    />


                    {processingError && (
                      <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4 text-sm">
                        <p className="font-medium">Error</p>
                        <p>{processingError}</p>
                      </div>
                    )}

                    {activeFilterPrompt && (
                      <button
                        onClick={() => applyFilter(activeFilterPrompt)}
                        disabled={isProcessing || !activeFilterPrompt.trim()}
                        className="w-full bg-blue-600 text-white font-medium py-3 px-6 rounded-lg hover:bg-blue-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                      >
                        {isProcessing ? 'Processing...' : 'Apply Filter'}
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}