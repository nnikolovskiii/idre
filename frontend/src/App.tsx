// Path: /home/nnikolovskii/dev/general-chat/frontend/src/App.tsx

// React Router and base CSS
import { Routes, Route, Navigate } from "react-router-dom";
import "./App.css";

// Context providers
import { ThemeProvider } from "./context/ThemeContext";
import { AuthProvider } from "./contexts/AuthContext";
import { ApiKeyProvider } from "./contexts/ApiKeyContext";

// Page components
import Chat from "./pages/Chat";
import MyDriveView from "./pages/MyDriveView";
import NotebooksDashboard from "./pages/NotebooksDashboard";
import CreateNotebookPage from "./pages/CreateNotebookPage";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Landing from "./pages/Landing";
import WhiteboardView from "./pages/WhiteboardView";

// Utility components
import ProtectedRoute from "./components/ui/ProtectedRoute";
import { SseProvider } from "./context/SseContext";

function App() {
    return (
        <ThemeProvider>
            <AuthProvider>
                <SseProvider> {/* <-- 2. Wrap the core app with the SseProvider */}
                    <ApiKeyProvider>
                        <Routes>
                            <Route path="/" element={<Landing />} />
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
                                path="/whiteboard/:notebookId"
                                element={
                                    <ProtectedRoute>
                                        <WhiteboardView />
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
                            <Route path="*" element={<Navigate to="/" replace />} />
                        </Routes>
                    </ApiKeyProvider>
                </SseProvider>
            </AuthProvider>
        </ThemeProvider>
    );
}

export default App;
