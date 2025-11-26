import React, { useState, useEffect, useRef } from "react";
import { Plus, MoreVertical, Trash2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useTheme } from "../context/ThemeContext";
import { useNotebooks } from "../hooks/useNotebooks";
import { Icon, type IconName } from "../components/Icon.tsx";
import CreateNotebookModal from "../components/CreateNotebookModal.tsx";
import DeleteConfirmationModal from "../components/DeleteConfirmationModal.tsx";
import DashboardLayout from "../components/layout/DashboardLayout"; // Import Layout
import blocks from "../assets/create_notebook.png";
import type { NotebookResponse } from "../services/notebooksService";
import { formatRelativeOrAbsolute } from "../components/lib/dateUtils";

// ... Keep NotebookCard and CreateNewCard components exactly as they are ...
const NotebookCard: React.FC<{
    notebook: NotebookResponse;
    theme: 'light' | 'dark';
    onDelete: (notebook: NotebookResponse) => void;
}> = ({
          notebook,
          theme,
          onDelete,
      }) => {
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsDropdownOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    const handleMenuClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        setIsDropdownOpen(!isDropdownOpen);
    };

    const handleDeleteClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        setIsDropdownOpen(false);
        onDelete(notebook);
    };

    return (
        <div
            className="p-4 rounded-xl flex flex-col h-48 border-[2px] hover:shadow-md relative"
            style={{backgroundColor: notebook.bg_color}}
        >
            <div className="flex justify-between items-start">
                <Icon
                    name={notebook.emoji as IconName}
                    className="w-[25px] h-[25px] "
                />
                <div className="relative" ref={dropdownRef}>
                    <button
                        onClick={handleMenuClick}
                        className={
                            theme === 'dark'
                                ? 'text-gray-500 hover:text-gray-300 ml-2'
                                : 'text-gray-400 hover:text-gray-600 ml-2'
                        }
                    >
                        <MoreVertical size={20}/>
                    </button>

                    {isDropdownOpen && (
                        <div className={`absolute right-0 mt-2 w-48 rounded-md shadow-lg border z-50 ${
                            theme === 'dark'
                                ? 'bg-gray-800 border-gray-700'
                                : 'bg-white border-gray-200'
                        }`}>
                            <div className="py-1">
                                <button
                                    onClick={handleDeleteClick}
                                    className={`w-full px-4 py-2 text-left flex items-center gap-3 transition-colors ${
                                        theme === 'dark'
                                            ? 'text-red-400 hover:bg-gray-700'
                                            : 'text-red-600 hover:bg-gray-50'
                                    }`}
                                >
                                    <Trash2 size={16} />
                                    <span className="text-sm font-medium">Delete</span>
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
            <div className="mt-auto">
                <h3 className={`text-lg font-semibold leading-tight`}>
                    {notebook.title}
                </h3>
                <p className={`text-xs mt-2 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                    Updated {formatRelativeOrAbsolute(notebook.updated_at)}
                </p>
            </div>
        </div>
    );
};

const CreateNewCard: React.FC<{ theme: 'light' | 'dark' }> = ({theme}) => {
    return (
        <div
            className={`p-4 rounded-xl flex flex-col items-center justify-center h-48 border-2 border-dashed cursor-pointer transition-colors ${
                theme === 'dark'
                    ? 'bg-gray-800 border-gray-600 text-gray-400 hover:bg-gray-700 hover:border-gray-500'
                    : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50 hover:border-gray-400'
            }`}>
            <div className={`w-12 h-12 rounded-full flex items-center justify-center mb-3 ${
                theme === 'dark' ? 'bg-gray-700' : 'bg-gray-100'
            }`}>
                <Plus size={24} className={theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}/>
            </div>
            <span className="font-medium">Create new notebook</span>
        </div>
    );
};

const NotebooksDashboard: React.FC = () => {
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [notebookToDelete, setNotebookToDelete] = useState<NotebookResponse | null>(null);
    const navigate = useNavigate();
    const {theme} = useTheme();
    const {loading, error, getAllNotebooks, deleteNotebook, notebooks} = useNotebooks();

    useEffect(() => {
        getAllNotebooks();

        // Listen for creation events from sidebar
        const handleRefresh = () => getAllNotebooks();
        window.addEventListener("notebook-created", handleRefresh);
        return () => window.removeEventListener("notebook-created", handleRefresh);
    }, [getAllNotebooks]);

    const handleCreateCardClick = () => {
        setIsCreateModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsCreateModalOpen(false);
    };

    const handleNotebookCreated = () => {
        getAllNotebooks();
    };

    const handleDeleteClick = (notebook: NotebookResponse) => {
        setNotebookToDelete(notebook);
        setIsDeleteModalOpen(true);
    };

    const handleDeleteConfirm = async () => {
        if (notebookToDelete) {
            const success = await deleteNotebook(notebookToDelete.id);
            if (success) {
                setIsDeleteModalOpen(false);
                setNotebookToDelete(null);
            }
        }
    };

    const handleDeleteCancel = () => {
        setIsDeleteModalOpen(false);
        setNotebookToDelete(null);
    };

    if (loading) {
        return (
            <DashboardLayout title="My Notebooks">
                <div className="min-h-full p-8 flex items-center justify-center">
                    <div className={`text-lg ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                        Loading notebooks...
                    </div>
                </div>
            </DashboardLayout>
        );
    }

    if (error) {
        return (
            <DashboardLayout title="My Notebooks">
                <div className="min-h-full p-8 flex items-center justify-center">
                    <div className="text-center">
                        <div className="text-lg text-red-600 mb-4">Error: {error}</div>
                        <button
                            onClick={getAllNotebooks}
                            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md"
                        >
                            Try Again
                        </button>
                    </div>
                </div>
            </DashboardLayout>
        );
    }

    return (
        <DashboardLayout title="My Notebooks">
            <div className="p-8 font-sans">
                <header className="mb-8 hidden md:block">
                    <h1 className="text-2xl font-bold">My notebooks</h1>
                </header>

                <main>
                    {notebooks.length === 0 && !loading ? (
                        <div className="text-center flex flex-col items-center justify-center" style={{height: 'calc(100vh - 200px)'}}>
                            <img src={blocks} alt="No notebooks" className="w-90"/>
                            <h2 className="text-2xl font-semibold mt-8 text-text-primary">No notebooks found yet ...</h2>
                            <p className="text-lg text-text-secondary mt-2">Start your journey by creating one!</p>

                            <button
                                onClick={handleCreateCardClick}
                                className={`mt-8 inline-flex items-center justify-center gap-2 rounded-md px-6 py-2 font-medium transition-colors ${
                                    theme === 'dark'
                                        ? 'bg-gray-700 text-gray-100 hover:bg-gray-600 border border-gray-600'
                                        : 'bg-gray-800 text-white hover:bg-gray-900'
                                }`}
                            >
                                <Plus size={16} />
                                <span>New Notebook</span>
                            </button>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
                            <div onClick={handleCreateCardClick}>
                                <CreateNewCard theme={theme}/>
                            </div>
                            {notebooks.map((notebook) => (
                                <div key={notebook.id} onClick={() => navigate(`/chat/${notebook.id}`)} className="cursor-pointer">
                                    <NotebookCard notebook={notebook} theme={theme} onDelete={handleDeleteClick}/>
                                </div>
                            ))}
                        </div>
                    )}
                </main>

                <CreateNotebookModal
                    isOpen={isCreateModalOpen}
                    onClose={handleCloseModal}
                    onSuccess={handleNotebookCreated}
                />

                <DeleteConfirmationModal
                    isOpen={isDeleteModalOpen}
                    itemName={notebookToDelete?.title || 'notebook'}
                    onConfirm={handleDeleteConfirm}
                    onCancel={handleDeleteCancel}
                    isDeleting={loading}
                />
            </div>
        </DashboardLayout>
    );
};

export default NotebooksDashboard;