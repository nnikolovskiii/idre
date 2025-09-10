// Path: accountant-ui/src/App.tsx
import { Routes, Route, Navigate } from 'react-router-dom'
import './App.css'
import Chat from './pages/Chat'
import { AuthProvider } from './contexts/AuthContext'
import { ApiKeyProvider } from './contexts/ApiKeyContext'

// Main App component wrapped with AuthProvider and ApiKeyProvider
function App() {
  return (
    <AuthProvider>
      <ApiKeyProvider>
        <Routes>
          <Route path="/" element={<Navigate to="/chat" replace />} />

          {/* Chat route - always accessible, handles auth internally */}
          <Route path="/chat" element={<Chat />} />

          {/* Legacy routes - redirect to chat */}
          <Route path="/login" element={<Navigate to="/chat" replace />} />
          <Route path="/register" element={<Navigate to="/chat" replace />} />

          {/* Other routes - redirect to chat for now */}
          <Route path="/default-models" element={<Navigate to="/chat" replace />} />
          <Route path="/model-api" element={<Navigate to="/chat" replace />} />

          {/* Redirect any unknown routes to chat */}
          <Route path="*" element={<Navigate to="/chat" replace />} />
        </Routes>
      </ApiKeyProvider>
    </AuthProvider>
  )
}

export default App
