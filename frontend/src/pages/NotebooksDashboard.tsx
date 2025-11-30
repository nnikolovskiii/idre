import React, { useState, useEffect, useRef } from "react";
import { Plus, MoreVertical, Trash2, ChevronLeft, ChevronRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useTheme } from "../context/ThemeContext";
import { useNotebooks } from "../hooks/useNotebooks";
import { Icon, type IconName } from "../components/Icon.tsx";
import CreateNotebookModal from "../components/CreateNotebookModal.tsx";
import DeleteConfirmationModal from "../components/DeleteConfirmationModal.tsx";
import DashboardLayout from "../components/layout/DashboardLayout";
import blocks from "../assets/create_notebook.png";
import type { NotebookResponse } from "../services/notebooksService";
import { formatRelativeOrAbsolute } from "../components/lib/dateUtils";

const NotebookCard: React.FC<{
    notebook: NotebookResponse;
    theme: 'light' | 'dark';
    onDelete: (notebook: NotebookResponse) => void;
}> = ({ notebook, theme, onDelete }) => {
    const [isDropdownOpen, setDropdownOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
                setDropdownOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const toggleMenu = (e: React.MouseEvent) => {
        e.stopPropagation();
        setDropdownOpen(prev => !prev);
    };

    const handleDelete = (e: React.MouseEvent) => {
        e.stopPropagation();
        setDropdownOpen(false);
        onDelete(notebook);
    };

    return (
        <div
            className="p-4 rounded-xl flex flex-col h-40 border-[2px] hover:shadow-md transition-shadow relative cursor-pointer select-none"
            style={{ backgroundColor: notebook.bg_color }}
        >
            <div className="flex justify-between items-center mb-3">
                <Icon name={notebook.emoji as IconName} className="w-5 h-5" />
                <div className="relative" ref={dropdownRef}>
                    <button
                        onClick={toggleMenu}
                        className={theme === 'dark' ? 'text-gray-500 hover:text-gray-300' : 'text-gray-400 hover:text-gray-600'}
                    >
                        <MoreVertical size={18} />
                    </button>
                    {isDropdownOpen && (
                        <div className={`absolute right-0 mt-2 w-40 rounded-lg shadow-lg border z-50 ${
                            theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
                        }`}>
                            <button
                                onClick={handleDelete}
                                className={`w-full px-4 py-2 text-left flex items-center gap-2 text-sm ${
                                    theme === 'dark'
                                        ? 'text-red-400 hover:bg-gray-700'
                                        : 'text-red-600 hover:bg-gray-50'
                                }`}
                            >
                                <Trash2 size={15} />
                                Delete
                            </button>
                        </div>
                    )}
                </div>
            </div>
            <div className="mt-auto text-right">
                <h3 className="text-base font-semibold leading-snug text-gray-900 dark:text-gray-100 line-clamp-2">
                    {notebook.title}
                </h3>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    {formatRelativeOrAbsolute(notebook.updated_at)}
                </p>
            </div>
        </div>
    );
};

const CreateNewCard: React.FC<{ theme: 'light' | 'dark' }> = ({ theme }) => {
    return (
        <div
            className={`p-4 rounded-xl flex flex-col items-center justify-center h-40 border-2 border-dashed cursor-pointer transition-all hover:shadow-md hover:border-opacity-100 select-none ${
                theme === 'dark'
                    ? 'bg-gray-800/50 border-gray-600 text-gray-400 hover:bg-gray-750 hover:border-gray-500'
                    : 'bg-gray-50 border-gray-300 text-gray-600 hover:bg-gray-100 hover:border-gray-400'
            }`}
        >
            <div className="w-10 h-10 rounded-full flex items-center justify-center mb-3 bg-gray-200 dark:bg-gray-700">
                <Plus size={20} className="text-gray-600 dark:text-gray-300" />
            </div>
            <span className="text-sm font-medium">Create new</span>
        </div>
    );
};

const NotebooksDashboard: React.FC = () => {
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [notebookToDelete, setNotebookToDelete] = useState<NotebookResponse | null>(null);
    const [page, setPage] = useState(1);
    const PAGE_SIZE = 19;

    const navigate = useNavigate();
    const {theme} = useTheme();
    const {loading, error, getAllNotebooks, deleteNotebook, notebooks, pagination} = useNotebooks();

    useEffect(() => {
        getAllNotebooks(page, PAGE_SIZE);

        const handleRefresh = () => getAllNotebooks(page, PAGE_SIZE);
        window.addEventListener("notebook-created", handleRefresh);
        return () => window.removeEventListener("notebook-created", handleRefresh);
    }, [getAllNotebooks, page]);

    const handleCreateCardClick = () => {
        setIsCreateModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsCreateModalOpen(false);
    };

    const handleNotebookCreated = () => {
        setPage(1);
        getAllNotebooks(1, PAGE_SIZE);
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
                getAllNotebooks(page, PAGE_SIZE);
            }
        }
    };

    const handleDeleteCancel = () => {
        setIsDeleteModalOpen(false);
        setNotebookToDelete(null);
    };

    const handleNextPage = () => {
        if (pagination && page < pagination.total_pages) {
            setPage(p => p + 1);
        }
    };

    const handlePrevPage = () => {
        if (page > 1) {
            setPage(p => p - 1);
        }
    };

    const handleNotebookClick = (notebookId: string) => {
        const lastTab = localStorage.getItem(`notebook-last-tab-${notebookId}`) || 'chat';
        let path = `/${lastTab}/${notebookId}`;
        // Special case for 'idea' tab which has a different path structure
        if (lastTab === 'idea') {
            path = `/idea-canvas/${notebookId}`;
        }
        navigate(path);
    };

    if (loading && notebooks.length === 0) {
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
                            onClick={() => getAllNotebooks(page, PAGE_SIZE)}
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
            <div className="p-8 font-sans flex flex-col h-full">
                <header className="mb-8">
                    <h1 className="text-2xl font-bold text-left">My notebooks</h1>
                </header>

                {/* Added 'flex flex-col' here to organize grid and pagination vertically */}
                <main className="flex-grow flex flex-col">
                    {notebooks.length === 0 && !loading && page === 1 ? (
                        <div className="text-center flex flex-col items-center justify-center flex-grow">
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
                        <>
                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
                                {page === 1 && (
                                    <div onClick={handleCreateCardClick}>
                                        <CreateNewCard theme={theme}/>
                                    </div>
                                )}

                                {notebooks.map((notebook) => (
                                    <div key={notebook.id} onClick={() => handleNotebookClick(notebook.id)} className="cursor-pointer">
                                        <NotebookCard notebook={notebook} theme={theme} onDelete={handleDeleteClick}/>
                                    </div>
                                ))}
                            </div>

                            {/* 'mt-auto' pushes this div to the bottom of the flex container */}
                            {pagination && pagination.total_pages > 1 && (
                                <div className="mt-auto pt-8 flex items-center justify-center gap-4 pb-0">
                                    <button
                                        onClick={handlePrevPage}
                                        disabled={page === 1}
                                        className={`p-2 rounded-full transition-colors ${
                                            page === 1
                                                ? 'text-gray-400 cursor-not-allowed'
                                                : theme === 'dark'
                                                    ? 'text-gray-200 hover:bg-gray-700'
                                                    : 'text-gray-700 hover:bg-gray-100'
                                        }`}
                                    >
                                        <ChevronLeft size={24} />
                                    </button>

                                    <span className={`text-sm font-medium ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>
                                        Page {page} of {pagination.total_pages}
                                    </span>

                                    <button
                                        onClick={handleNextPage}
                                        disabled={page === pagination.total_pages}
                                        className={`p-2 rounded-full transition-colors ${
                                            page === pagination.total_pages
                                                ? 'text-gray-400 cursor-not-allowed'
                                                : theme === 'dark'
                                                    ? 'text-gray-200 hover:bg-gray-700'
                                                    : 'text-gray-700 hover:bg-gray-100'
                                        }`}
                                    >
                                        <ChevronRight size={24} />
                                    </button>
                                </div>
                            )}
                        </>
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