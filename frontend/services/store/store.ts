import { configureStore } from '@reduxjs/toolkit'
import briefReducer from './slices/briefSlice'
import creativeReducer from './slices/creativeSlice'
import assetsReducer from './slices/assetsSlice'

export const store = configureStore({
  reducer: {
    brief: briefReducer,
    creative: creativeReducer,
    assets: assetsReducer,
  },
})

export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch
