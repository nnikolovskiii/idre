// Path: accountant-ui/src/App.tsx

// React Router and base CSS
import { Routes, Route, Navigate } from "react-router-dom";
import "./App.css";

// 1. Import the ThemeProvider from your context file
import { ThemeProvider } from "./context/ThemeContext"; // Adjust path if necessary

// Your existing context providers
import { AuthProvider } from "./contexts/AuthContext";
import { ApiKeyProvider } from "./contexts/ApiKeyContext";

// Your page components
import Chat from "./pages/Chat";
import MyDriveView from "./pages/MyDriveView";
import NotebooksDashboard from "./pages/NotebooksDashboard";
import CreateNotebookPage from "./pages/CreateNotebookPage";
import Login from "./pages/Login";
import Register from "./pages/Register";

// Your utility components
import ProtectedRoute from "./components/ui/ProtectedRoute";


function App() {
    return (
        // 2. Wrap everything with ThemeProvider
        <ThemeProvider>
            <AuthProvider>
                <ApiKeyProvider>
                    <Routes>
                        {/* ... all your routes remain exactly the same ... */}
                        <Route
                            path="/"
                            element={
                                <ProtectedRoute>
                                    <Navigate to="/notebooks" replace />
                                </ProtectedRoute>
                            }
                        />
                        <Route path="/login" element={<Login />} />
                        <Route path="/register" element={<Register />} />
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
                        <Route
                            path="/default-models"
                            element={<Navigate to="/notebooks" replace />}
                        />
                        <Route path="/model-api" element={<Navigate to="/notebooks" replace />} />
                        <Route path="*" element={<Navigate to="/notebooks" replace />} />
                    </Routes>
                </ApiKeyProvider>
            </AuthProvider>
        </ThemeProvider>
    );
}

export default App;