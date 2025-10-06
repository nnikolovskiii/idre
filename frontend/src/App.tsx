// Path: accountant-ui/src/App.tsx
import { Routes, Route, Navigate } from "react-router-dom";
import "./App.css";
import Chat from "./pages/Chat";
import { AuthProvider } from "./contexts/AuthContext";
import { ApiKeyProvider } from "./contexts/ApiKeyContext";
import MyDriveView from "./pages/MyDriveView.tsx";
import NotebooksDashboard from "./pages/NotebooksDashboard.tsx";
import CreateNotebookPage from "./pages/CreateNotebookPage.tsx";
import ProtectedRoute from "./components/ui/ProtectedRoute";
import Login from "./pages/Login";
import Register from "./pages/Register";

// Main App component wrapped with AuthProvider and ApiKeyProvider
function App() {
  return (
    <AuthProvider>
      <ApiKeyProvider>
        <Routes>
          {/* Default route: if authenticated, go to notebooks; else go to login */}
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <Navigate to="/notebooks" replace />
              </ProtectedRoute>
            }
          />

          {/* Auth routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          {/* Protected application routes */}
          <Route
            path="/chat/:notebookId"
            element={
              <ProtectedRoute>
                <Chat />
              </ProtectedRoute>
            }
          />
          <Route
            path="/files/:notebookId"
            element={
              <ProtectedRoute>
                <MyDriveView />
              </ProtectedRoute>
            }
          />
          <Route
            path="/notebooks"
            element={
              <ProtectedRoute>
                <NotebooksDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/notebooks/create"
            element={
              <ProtectedRoute>
                <CreateNotebookPage />
              </ProtectedRoute>
            }
          />

          {/* Other routes - redirect to notebooks for now (protected) */}
          <Route
            path="/default-models"
            element={<Navigate to="/notebooks" replace />}
          />
          <Route path="/model-api" element={<Navigate to="/notebooks" replace />} />

          {/* Redirect any unknown routes to notebooks */}
          <Route path="*" element={<Navigate to="/notebooks" replace />} />
        </Routes>
      </ApiKeyProvider>
    </AuthProvider>
  );
}

export default App;
