import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import { CreativeGenerationResponse } from '@/services/api'

interface CreativeState {
  prompts: CreativeGenerationResponse | null
  isGenerating: boolean
  error: string | null
}

const initialState: CreativeState = {
  prompts: null,
  isGenerating: false,
  error: null,
}

const creativeSlice = createSlice({
  name: 'creative',
  initialState,
  reducers: {
    setCreativePrompts: (state, action: PayloadAction<CreativeGenerationResponse>) => {
      state.prompts = action.payload
      state.error = null
    },
    updateImagePrompt: (state, action: PayloadAction<string>) => {
      if (state.prompts) {
        state.prompts.image_prompt = action.payload
      }
    },
    updateCopyPrompt: (state, action: PayloadAction<string>) => {
      if (state.prompts) {
        state.prompts.copy_prompt = action.payload
      }
    },
    updateVideoPrompt: (state, action: PayloadAction<string>) => {
      if (state.prompts) {
        state.prompts.video_prompt = action.payload
      }
    },
    clearCreativePrompts: (state) => {
      state.prompts = null
      state.error = null
    },
    setCreativeGenerating: (state, action: PayloadAction<boolean>) => {
      state.isGenerating = action.payload
    },
    setCreativeError: (state, action: PayloadAction<string>) => {
      state.error = action.payload
      state.isGenerating = false
    },
  },
})

export const {
  setCreativePrompts,
  updateImagePrompt,
  updateCopyPrompt,
  updateVideoPrompt,
  clearCreativePrompts,
  setCreativeGenerating,
  setCreativeError,
} = creativeSlice.actions

export default creativeSlice.reducer
