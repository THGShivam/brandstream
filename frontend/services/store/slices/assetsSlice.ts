import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import { GeneratedImage, GeneratedVideo, GeneratedCopy, ImageEvaluationScores } from '@/services/api'

interface AssetsState {
  generatedImages: GeneratedImage[]
  generatedVideo: GeneratedVideo | null
  generatedCopies: GeneratedCopy[]
  productSkuImage: string | null
  isGenerating: boolean
  isEvaluating: boolean
  error: string | null
}

const initialState: AssetsState = {
  generatedImages: [],
  generatedVideo: null,
  generatedCopies: [],
  productSkuImage: null,
  isGenerating: false,
  isEvaluating: false,
  error: null,
}

const assetsSlice = createSlice({
  name: 'assets',
  initialState,
  reducers: {
    setGeneratedImages: (state, action: PayloadAction<GeneratedImage[]>) => {
      state.generatedImages = action.payload
      state.error = null
    },
    setGeneratedVideo: (state, action: PayloadAction<GeneratedVideo>) => {
      state.generatedVideo = action.payload
      state.error = null
    },
    setGeneratedCopies: (state, action: PayloadAction<GeneratedCopy[]>) => {
      state.generatedCopies = action.payload
      state.error = null
    },
    setProductSkuImage: (state, action: PayloadAction<string>) => {
      state.productSkuImage = action.payload
    },
    clearGeneratedAssets: (state) => {
      state.generatedImages = []
      state.generatedVideo = null
      state.generatedCopies = []
      state.productSkuImage = null
      state.error = null
    },
    setAssetsGenerating: (state, action: PayloadAction<boolean>) => {
      state.isGenerating = action.payload
    },
    setAssetsError: (state, action: PayloadAction<string>) => {
      state.error = action.payload
      state.isGenerating = false
    },
    setImageEvaluation: (state, action: PayloadAction<{ variationNumber: number; evaluation: ImageEvaluationScores }>) => {
      const image = state.generatedImages.find(img => img.variation_number === action.payload.variationNumber)
      if (image) {
        image.evaluation = action.payload.evaluation
      }
    },
    setEvaluating: (state, action: PayloadAction<boolean>) => {
      state.isEvaluating = action.payload
    },
  },
})

export const {
  setGeneratedImages,
  setGeneratedVideo,
  setGeneratedCopies,
  setProductSkuImage,
  clearGeneratedAssets,
  setAssetsGenerating,
  setAssetsError,
  setImageEvaluation,
  setEvaluating,
} = assetsSlice.actions

export default assetsSlice.reducer
