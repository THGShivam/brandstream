// Export store configuration
export { store } from './store'
export type { RootState, AppDispatch } from './store'

// Export hooks
export { useAppDispatch, useAppSelector } from './hooks'

// Export provider
export { StoreProvider } from './StoreProvider'

// Export brief slice actions
export {
  setBriefData,
  updateBriefData,
  clearBriefData,
  setBriefLoading,
  setBriefError,
} from './slices/briefSlice'
