"use client"

import { Upload, File, FileText, Edit3, X, CheckCircle, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useState, useRef } from "react"
import { analyzeBrief } from "@/services/api"
import { useAppDispatch } from "@/services/store/hooks"
import { setBriefData, setBriefLoading, setBriefError } from "@/services/store/slices/briefSlice"

interface BriefUploadProps {
  onNext: () => void
}

export function BriefUpload({ onNext }: BriefUploadProps) {
  const dispatch = useAppDispatch()
  const [briefText, setBriefText] = useState("")
  const [uploadedFile, setUploadedFile] = useState<File | null>(null)
  const [isDragOver, setIsDragOver] = useState(false)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = (file: File) => {
    const allowedTypes = ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
    const maxSize = 25 * 1024 * 1024 // 25MB

    if (!allowedTypes.includes(file.type)) {
      alert('Please upload only PDF or DOCX files.')
      return
    }

    if (file.size > maxSize) {
      alert('File size must be less than 25MB.')
      return
    }

    setUploadedFile(file)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
    
    const files = Array.from(e.dataTransfer.files)
    if (files.length > 0) {
      handleFileSelect(files[0])
    }
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
  }

  const handleClick = () => {
    fileInputRef.current?.click()
  }

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (files && files.length > 0) {
      handleFileSelect(files[0])
    }
  }

  const removeFile = () => {
    setUploadedFile(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const handleContinue = async () => {
    if (!uploadedFile) return

    setIsAnalyzing(true)
    setError(null)
    dispatch(setBriefLoading(true))

    try {
      const analysisData = await analyzeBrief(uploadedFile)
      // Dispatch to Redux store
      dispatch(setBriefData(analysisData))
      onNext()
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to analyze brief'
      setError(errorMessage)
      dispatch(setBriefError(errorMessage))
      console.error('Brief analysis error:', err)
    } finally {
      setIsAnalyzing(false)
      dispatch(setBriefLoading(false))
    }
  }

  return (
    <div className="space-y-8">
      {/* Hero Section */}
      <div className="text-center space-y-4">
        <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center mx-auto">
          <Upload className="w-8 h-8 text-white" />
        </div>
        <h2 className="text-4xl font-bold text-white">Upload Your Creative Brief</h2>
        <p className="text-lg text-slate-400 max-w-2xl mx-auto">
          Start by uploading your creative brief or paste it directly. Our AI will analyze it and prepare it for the next steps.
        </p>
      </div>

      {/* Upload Area */}
      <div
        className={`bg-slate-900/50 border-2 border-dashed rounded-xl p-12 text-center transition-colors cursor-pointer group relative ${
          isDragOver
            ? 'border-purple-500 bg-purple-500/10'
            : uploadedFile
              ? 'border-green-500/50 bg-green-500/5'
              : 'border-slate-700 hover:border-purple-500/50'
        }`}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={handleClick}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,.docx"
          onChange={handleFileInputChange}
          className="hidden"
        />
        
        {uploadedFile ? (
          <div className="flex flex-col items-center gap-4">
            <div className="w-14 h-14 bg-green-500/10 rounded-lg flex items-center justify-center">
              <CheckCircle className="w-6 h-6 text-green-400" />
            </div>
            <div className="space-y-2">
              <p className="font-semibold text-white">{uploadedFile.name}</p>
              <p className="text-sm text-slate-400">{formatFileSize(uploadedFile.size)}</p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={(e) => {
                e.stopPropagation()
                removeFile()
              }}
              className="bg-transparent border-slate-600 hover:border-red-500 hover:text-red-400"
            >
              <X className="w-4 h-4 mr-2" />
              Remove File
            </Button>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-4">
            <div className={`w-14 h-14 rounded-lg flex items-center justify-center transition-colors ${
              isDragOver
                ? 'bg-purple-500/20'
                : 'bg-slate-800 group-hover:bg-purple-500/10'
            }`}>
              <Upload className={`w-6 h-6 transition-colors ${
                isDragOver
                  ? 'text-purple-400'
                  : 'text-slate-400 group-hover:text-purple-400'
              }`} />
            </div>
            <div>
              <p className="font-semibold text-white mb-1">
                {isDragOver ? 'Drop your file here' : 'Click to upload or drag and drop'}
              </p>
              <p className="text-sm text-slate-500">PDF, DOCX up to 25MB</p>
            </div>
          </div>
        )}
      </div>

      {/* Divider */}
      <div className="flex items-center gap-4">
        <div className="flex-1 h-px bg-slate-700"></div>
        <span className="text-sm text-slate-500 font-medium">OR</span>
        <div className="flex-1 h-px bg-slate-700"></div>
      </div>

      {/* Text Input Area */}
      <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-6 space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-slate-800 rounded-lg flex items-center justify-center">
            <Edit3 className="w-5 h-5 text-slate-400" />
          </div>
          <div>
            <h3 className="font-semibold text-white">Paste Your Creative Brief</h3>
            <p className="text-sm text-slate-400">Copy and paste your brief text directly</p>
          </div>
        </div>
        <textarea
          value={briefText}
          onChange={(e) => setBriefText(e.target.value)}
          placeholder="Paste your creative brief here... Include details about your brand, target audience, campaign objectives, key messages, and any specific requirements."
          className="w-full h-40 bg-slate-800/50 border border-slate-700 rounded-lg p-4 text-white placeholder-slate-500 resize-none focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 transition-colors"
        />
        <div className="flex justify-between items-center text-xs text-slate-500">
          <span>{briefText.length} characters</span>
          <span>Minimum 100 characters recommended</span>
        </div>
      </div>

      {/* Supported Formats */}
      {/* <div className="grid grid-cols-3 gap-4">
        {[
          { icon: FileText, name: "PDF", desc: "Documents" },
          { icon: File, name: "DOCX", desc: "Word Docs" },
          { icon: File, name: "PPTX", desc: "Presentations" },
        ].map((format) => (
          <div
            key={format.name}
            className="bg-slate-900/50 border border-slate-800 rounded-lg p-4 text-center hover:border-slate-700 transition-colors"
          >
            <format.icon className="w-6 h-6 text-slate-400 mx-auto mb-2" />
            <p className="font-medium text-white text-sm">{format.name}</p>
            <p className="text-xs text-slate-500">{format.desc}</p>
          </div>
        ))}
      </div> */}

       {/* Divider */}
      <div className="flex items-center gap-4">
        <div className="flex-1 h-px bg-slate-700"></div>
        <span className="text-sm text-slate-500 font-medium">OR</span>
        <div className="flex-1 h-px bg-slate-700"></div>
      </div>

      {/* Quick Start Option */}
      <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-6 space-y-4">
        <h3 className="font-semibold text-white">Or use sample brief</h3>
        <p className="text-sm text-slate-400">Try with a pre-made brief to explore the platform</p>
        <Button
          variant="outline"
          className="w-full bg-transparent"
          onClick={() => {
            const sampleBrief = `Brand: MyProtein

Campaign theme: Halloween

Product: Limited edition chocolate–orange protein bar

Visual mood: Dark, playful, haunted gym spooky

Goal: Awareness + trial

Target: Gym goers age 18–34

Platforms: IG Reels / YT Shorts

Messaging: “Get Fit, Get Spooky”

Competitors: ON, MuscleBlaze

Season: Oct end`
            
            setBriefText(sampleBrief)
            // Clear any uploaded file when loading sample
            setUploadedFile(null)
            if (fileInputRef.current) {
              fileInputRef.current.value = ''
            }
          }}
        >
          Load Sample Brief
        </Button>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-500/10 border border-red-500/50 rounded-lg p-4">
          <p className="text-red-400 text-sm">{error}</p>
        </div>
      )}

      {/* Navigation */}
      <div className="flex justify-end">
        <Button
          onClick={handleContinue}
          size="lg"
          className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
          disabled={!uploadedFile || isAnalyzing}
        >
          {isAnalyzing ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Analyzing Brief...
            </>
          ) : (
            'Continue to Template Mapping'
          )}
        </Button>
      </div>
    </div>
  )
}
