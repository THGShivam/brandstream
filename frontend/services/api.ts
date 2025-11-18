// API utility functions for backend communication

export type FieldSource = "extracted" | "generated"

export interface FieldValue {
  value: string | string[]
  source: FieldSource
}

export interface BriefAnalysisResponse {
  brand_name: {
    value: string
    source: FieldSource
  }
  campaign_title: {
    value: string
    source: FieldSource
  }
  brief_summary: {
    value: string
    source: FieldSource
  }
  project_objectives: {
    business_objective: {
      value: string
      source: FieldSource
    }
    marketing_objective: {
      value: string
      source: FieldSource
    }
    communication_objective: {
      value: string
      source: FieldSource
    }
    key_metrics: {
      value: string[]
      source: FieldSource
    }
    key_indicators: {
      value: string[]
      source: FieldSource
    }
  }
  target_audience: {
    demographics: {
      value: string
      source: FieldSource
    }
    psychographics: {
      value: string
      source: FieldSource
    }
    needs_problems: {
      value: string
      source: FieldSource
    }
    decision_behaviour: {
      value: string
      source: FieldSource
    }
  }
  key_message: {
    value: string
    source: FieldSource
  }
  visual_style: {
    value: string
    source: FieldSource
  }
  channels: {
    value: string[]
    source: FieldSource
  }
  usp: {
    value: string
    source: FieldSource
  }
}

// Get the backend API URL from environment variable or use default
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

/**
 * Analyzes a creative brief by sending it to the backend API
 * @param file - The uploaded file (PDF or DOCX)
 * @returns Promise with the analyzed brief data
 */
export async function analyzeBrief(file: File): Promise<BriefAnalysisResponse> {
  const formData = new FormData()
  formData.append('file', file)
  formData.append('text', '') // Empty text as per requirement

  const response = await fetch(`${API_BASE_URL}/api/analyze-brief`, {
    method: 'POST',
    body: formData,
  })

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}))
    throw new Error(errorData.detail || `Failed to analyze brief: ${response.statusText}`)
  }

  return response.json()
}

/**
 * Creative generation types
 */
export interface CreativeGenerationRequest {
  brief_data: BriefAnalysisResponse
}

export interface CreativeGenerationResponse {
  image_prompt: string
  copy_prompt: string
  video_prompt: string
}

/**
 * Generates creative prompts from brief data
 * @param briefData - The analyzed brief data
 * @returns Promise with the generated creative prompts
 */
export async function generateCreativePrompts(briefData: BriefAnalysisResponse): Promise<CreativeGenerationResponse> {
  const response = await fetch(`${API_BASE_URL}/api/generate-creative`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      brief_data: briefData
    }),
  })

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}))
    throw new Error(errorData.detail || `Failed to generate creative prompts: ${response.statusText}`)
  }

  return response.json()
}

/**
 * Asset generation types
 */
export interface ImageEvaluationScores {
  conversion_score: number
  retention_score: number
  traffic_score: number
  engagement_score: number
}

export interface GeneratedImage {
  image_base64: string
  variation_number: number
  mime_type: string
  evaluation?: ImageEvaluationScores
}

export interface GeneratedVideo {
  video_base64?: string
  video_url?: string
  mime_type: string
  duration_seconds?: number
}

export interface GeneratedCopy {
  headline: string
  body_text: string
  call_to_action: string
  variation_number: number
}

export interface AssetGenerationResponse {
  images?: GeneratedImage[]
  video?: GeneratedVideo
  copy_variations?: GeneratedCopy[]
}

export interface AssetGenerationParams {
  productSku: File
  // Image parameters
  imagePrompt?: string
  imageVariations?: number
  imageModel?: string  // "Imagen 3" or "Imagen 4"
  // Video parameters
  videoPrompt?: string
  videoModel?: string  // "Veo 3"
  videoDuration?: number  // 3-8 seconds
  // Copy parameters
  copyPrompt?: string
  copyVariations?: number
  copyModel?: string  // "Gemini 2.0 Flash" or "Gemini 1.5 Pro"
  // Common parameters
  creativityLevel?: string
  briefContext?: string
}

/**
 * Generates creative assets (images, copy, video)
 * @param params - Asset generation parameters
 * @returns Promise with the generated assets
 */
export async function generateAssets(params: AssetGenerationParams): Promise<AssetGenerationResponse> {
  const formData = new FormData()
  formData.append('product_sku', params.productSku)

  // Image parameters
  if (params.imagePrompt) formData.append('image_prompt', params.imagePrompt)
  if (params.imageVariations) formData.append('image_variations', params.imageVariations.toString())
  if (params.imageModel) formData.append('image_model', params.imageModel)

  // Video parameters
  if (params.videoPrompt) formData.append('video_prompt', params.videoPrompt)
  if (params.videoModel) formData.append('video_model', params.videoModel)
  if (params.videoDuration) formData.append('video_duration', params.videoDuration.toString())

  // Copy parameters
  if (params.copyPrompt) formData.append('copy_prompt', params.copyPrompt)
  if (params.copyVariations) formData.append('copy_variations', params.copyVariations.toString())
  if (params.copyModel) formData.append('copy_model', params.copyModel)

  // Common parameters
  if (params.creativityLevel) formData.append('creativity_level', params.creativityLevel)
  if (params.briefContext) formData.append('brief_context', params.briefContext)

  const response = await fetch(`${API_BASE_URL}/api/generate-assets`, {
    method: 'POST',
    body: formData,
  })

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}))
    throw new Error(errorData.detail || `Failed to generate assets: ${response.status}`)
  }

  return response.json()
}

/**
 * Evaluates a generated ad creative image
 * @param imageBase64 - Base64 encoded image
 * @param mimeType - MIME type of the image
 * @param imagePrompt - The prompt used to generate the image
 * @returns Promise with the evaluation scores
 */
export async function evaluateAdCreative(
  imageBase64: string,
  mimeType: string,
  imagePrompt: string
): Promise<ImageEvaluationScores> {
  // Convert base64 to blob
  const byteCharacters = atob(imageBase64)
  const byteNumbers = new Array(byteCharacters.length)
  for (let i = 0; i < byteCharacters.length; i++) {
    byteNumbers[i] = byteCharacters.charCodeAt(i)
  }
  const byteArray = new Uint8Array(byteNumbers)
  const blob = new Blob([byteArray], { type: mimeType })

  const formData = new FormData()
  formData.append('image', blob, 'image.png')
  formData.append('image_prompt', imagePrompt)

  const response = await fetch(`${API_BASE_URL}/api/evaluate-ad-creative`, {
    method: 'POST',
    body: formData,
  })

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}))
    throw new Error(errorData.detail || `Failed to evaluate ad creative: ${response.statusText}`)
  }

  return response.json()
}

/**
 * Translation types
 */
export interface TranslationRequest {
  copy_text: {
    headline: string
    body_text: string
    call_to_action: string
  }
  target_language: string
}

export interface TranslationResponse {
  translated_copy: {
    headline: string
    body_text: string
    call_to_action: string
  }
  translated_to: string
}

/**
 * Translates copy text to a target language while maintaining context
 * @param copyText - The structured copy text to translate
 * @param targetLanguage - The target language for translation
 * @returns Promise with the translated copy
 */
export async function translateCopy(
  copyText: { headline: string; body_text: string; call_to_action: string },
  targetLanguage: string
): Promise<TranslationResponse> {
  const response = await fetch(`${API_BASE_URL}/api/translate`, {
 * Applies AI-powered filter to an image
 * @param imageBase64 - Base64 encoded image
 * @param mimeType - MIME type of the image
 * @param filterPrompt - Text prompt describing the desired filter
 * @returns Promise with the filtered image data
 */
export async function applyImageFilter(
  imageBase64: string,
  mimeType: string,
  filterPrompt: string
): Promise<{ filtered_image_base64: string; mime_type: string }> {
  const response = await fetch(`${API_BASE_URL}/api/image/filter`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      image_base64: imageBase64,
      mime_type: mimeType,
      filter_prompt: filterPrompt
    })
  })

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}))
    throw new Error(errorData.detail || `Failed to apply filter: ${response.status}`)
  }

  return response.json()
}

/**
 * Applies AI-powered adjustments to an image
 * @param imageBase64 - Base64 encoded image
 * @param mimeType - MIME type of the image
 * @param adjustmentPrompt - Text prompt describing the desired adjustment
 * @returns Promise with the adjusted image data
 */
export async function applyImageAdjustment(
  imageBase64: string,
  mimeType: string,
  adjustmentPrompt: string
): Promise<{ adjusted_image_base64: string; mime_type: string }> {
  const response = await fetch(`${API_BASE_URL}/api/image/adjust`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      copy_text: copyText,
      target_language: targetLanguage,
    }),
      image_base64: imageBase64,
      mime_type: mimeType,
      adjustment_prompt: adjustmentPrompt
    })
  })

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}))
    throw new Error(errorData.detail || `Failed to apply adjustment: ${response.status}`)
  }

  return response.json()
}
