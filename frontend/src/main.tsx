import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { Provider } from 'react-redux'

import App from './App.tsx'
import { store } from './store/store'
import './index.css'
import 'bootstrap-icons/font/bootstrap-icons.css'
import { Toaster } from 'react-hot-toast'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Provider store={store}>
      <Toaster position="bottom-center" />
      <App />
    </Provider>
  </StrictMode>,
)
