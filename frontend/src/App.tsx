// Path: frontend/src/App.tsx

// React Router and base CSS
// 1. Add 'Outlet' to imports
import { Routes, Route, Navigate, Outlet } from "react-router-dom";
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
import WelcomePage from "./pages/WelcomePage";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Landing from "./pages/Landing";
import WhiteboardView from "./pages/WhiteboardView";
import IdeaCanvas from "./pages/IdeaCanvas";
import IdeaCanvasPage from "./pages/IdeaCanvasPage";
import TasksPage from "./pages/TasksPage";
import TasksKanbanAllView from "./components/tasks/TasksKanbanAllView";
import SetupApiKeyPage from "./pages/SetupApiKeyPage";

// Utility components
import ProtectedRoute from "./components/ui/ProtectedRoute";
import AppGuard from "./components/guards/AppGuard";
import { SseProvider } from "./context/SseContext";
// import ReliablLandingPage from "./pages/ReliablLandingPage.tsx";

function App() {
    return (
        <ThemeProvider>
            <AuthProvider>
                <SseProvider>
                    <ApiKeyProvider>
                        {/* 2. REMOVE AppGuard from wrapping the entire Routes */}
                        <Routes>
                            {/* --- PUBLIC ROUTES (No Auth, No API Key required) --- */}
                            <Route path="/" element={<Landing />} />
                            {/* <Route path="/reliabl" element={<ReliablLandingPage />} /> */}
                            <Route path="/login" element={<Login />} />
                            <Route path="/register" element={<Register />} />

                            {/* --- SETUP ROUTE (Requires Auth, but acts as the fallback for missing API Key) --- */}
                            {/* This must be OUTSIDE the AppGuard to prevent the infinite loop */}
                            <Route
                                path="/setup"
                                element={
                                    <ProtectedRoute>
                                        <SetupApiKeyPage />
                                    </ProtectedRoute>
                                }
                            />

                            {/* --- PURE KANBAN TASKS ROUTE (Requires Auth AND API Key, but no layout whatsoever) --- */}
                            <Route
                                path="/tasks"
                                element={
                                    <ProtectedRoute>
                                        <AppGuard>
                                            <TasksKanbanAllView />
                                        </AppGuard>
                                    </ProtectedRoute>
                                }
                            />

                            {/* --- PROTECTED APP ROUTES (Require Auth AND API Key) --- */}
                            {/* 3. Create a wrapper Route that applies the AppGuard to children */}
                            <Route
                                element={
                                    <ProtectedRoute>
                                        <AppGuard>
                                            <Outlet />
                                        </AppGuard>
                                    </ProtectedRoute>
                                }
                            >
                                {/* All these routes now inherit protection from the wrapper above */}
                                <Route path="/chat/:notebookId" element={<Chat />} />
                                <Route path="/files/:notebookId" element={<MyDriveView />} />
                                <Route path="/whiteboard/:notebookId" element={<WhiteboardView />} />
                                <Route path="/idea/:notebookId" element={<IdeaCanvas />} />
                                <Route path="/idea-canvas/:notebookId" element={<IdeaCanvasPage />} />
                                <Route path="/tasks/:notebookId" element={<TasksPage />} />
                                <Route path="/notebooks" element={<NotebooksDashboard />} />
                                <Route path="/notebooks/create" element={<CreateNotebookPage />} />
                                <Route path="/welcome/:notebookId" element={<WelcomePage />} />

                                {/* Redirects */}
                                <Route
                                    path="/default-models"
                                    element={<Navigate to="/notebooks" replace />}
                                />
                                <Route
                                    path="/model-api"
                                    element={<Navigate to="/notebooks" replace />}
                                />
                            </Route>

                            {/* Catch all */}
                            <Route path="*" element={<Navigate to="/" replace />} />
                        </Routes>
                    </ApiKeyProvider>
                </SseProvider>
            </AuthProvider>
        </ThemeProvider>
    );
}

export default App;