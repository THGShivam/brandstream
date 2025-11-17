import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import { BriefAnalysisResponse } from '@/services/api'

interface BriefState {
  briefData: BriefAnalysisResponse | null
  isLoading: boolean
  error: string | null
}

const initialState: BriefState = {
  briefData: null,
  isLoading: false,
  error: null,
}

const briefSlice = createSlice({
  name: 'brief',
  initialState,
  reducers: {
    setBriefData: (state, action: PayloadAction<BriefAnalysisResponse>) => {
      state.briefData = action.payload
      state.error = null
    },
    updateBriefData: (state, action: PayloadAction<BriefAnalysisResponse>) => {
      state.briefData = action.payload
    },
    clearBriefData: (state) => {
      state.briefData = null
      state.error = null
    },
    setBriefLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload
    },
    setBriefError: (state, action: PayloadAction<string>) => {
      state.error = action.payload
      state.isLoading = false
    },
  },
})

export const {
  setBriefData,
  updateBriefData,
  clearBriefData,
  setBriefLoading,
  setBriefError,
} = briefSlice.actions

export default briefSlice.reducer
