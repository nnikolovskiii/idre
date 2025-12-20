import React, { useState, useEffect, useRef } from "react";
import { Plus, MoreVertical, Trash2, Edit, ChevronLeft, ChevronRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useTheme } from "../context/ThemeContext";
import { useNotebooks } from "../hooks/useNotebooks";
import { Icon, type IconName } from "../components/Icon.tsx";
import CreateNotebookModal from "../components/CreateNotebookModal.tsx";
import EditNotebookModal from "../components/EditNotebookModal.tsx";
import DeleteConfirmationModal from "../components/DeleteConfirmationModal.tsx";
import DashboardLayout from "../components/layout/DashboardLayout";
import blocks from "../assets/create_notebook.png";
import type { NotebookResponse } from "../services/notebooksService";
import { formatRelativeOrAbsolute } from "../components/lib/dateUtils";

const NotebookCard: React.FC<{
    notebook: NotebookResponse;
    theme: 'light' | 'dark';
    onDelete: (notebook: NotebookResponse) => void;
    onEdit: (notebook: NotebookResponse) => void;
}> = ({ notebook, theme, onDelete, onEdit }) => {
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

    const handleEdit = (e: React.MouseEvent) => {
        e.stopPropagation();
        setDropdownOpen(false);
        onEdit(notebook);
    };

    const color = notebook.bg_color || '#4d4dff';

    return (
        <div
            className={`
                rounded-xl flex flex-col h-44 transition-all duration-300
                relative cursor-pointer select-none overflow-visible group
                ${theme === 'dark'
                ? 'bg-[#18181b] border border-gray-800 hover:border-gray-600 shadow-sm hover:shadow-md'
                : 'bg-white border border-gray-200 hover:border-gray-300 shadow-sm hover:shadow-md'
            }
            `}
        >
            {/*
               REMOVED: The top color accent line div.
               Result: A clean card that relies on the icon for color identity.
            */}

            <div className="p-5 flex flex-col flex-grow relative">

                {/* Header Row: Icon and Menu */}
                <div className="flex justify-between items-start mb-4">

                    {/* Icon Container - Kept the colored tint here */}
                    <div
                        className={`
                            p-2.5 rounded-xl transition-transform group-hover:scale-105 flex items-center justify-center
                        `}
                        style={{
                            backgroundColor: `${color}15`, // very subtle opacity
                            color: color
                        }}
                    >
                        <Icon name={notebook.emoji as IconName} className="w-6 h-6" />
                    </div>

                    {/* Menu Button */}
                    <div className="relative" ref={dropdownRef}>
                        <button
                            onClick={toggleMenu}
                            className={`
                                p-1.5 rounded-md transition-all duration-200 opacity-0 group-hover:opacity-100
                                ${theme === 'dark'
                                ? 'hover:bg-gray-700 text-gray-500 hover:text-gray-300'
                                : 'hover:bg-gray-100 text-gray-400 hover:text-gray-600'
                            }
                                ${isDropdownOpen ? 'opacity-100 bg-gray-100 dark:bg-gray-700' : ''}
                            `}
                        >
                            <MoreVertical size={16} />
                        </button>

                        {isDropdownOpen && (
                            <div className={`absolute right-0 mt-2 w-40 rounded-lg shadow-xl border z-50 overflow-hidden ${
                                theme === 'dark' ? 'bg-[#1f1f23] border-gray-700' : 'bg-white border-gray-200'
                            }`}>
                                <button
                                    onClick={handleEdit}
                                    className={`w-full px-4 py-2.5 text-left flex items-center gap-3 text-sm transition-colors ${
                                        theme === 'dark'
                                            ? 'text-gray-200 hover:bg-gray-700'
                                            : 'text-gray-700 hover:bg-gray-50'
                                    }`}
                                >
                                    <Edit size={16} className="text-blue-500" />
                                    Edit
                                </button>
                                <button
                                    onClick={handleDelete}
                                    className={`w-full px-4 py-2.5 text-left flex items-center gap-3 text-sm transition-colors ${
                                        theme === 'dark'
                                            ? 'text-gray-200 hover:bg-gray-700'
                                            : 'text-gray-700 hover:bg-gray-50'
                                    }`}
                                >
                                    <Trash2 size={16} className="text-red-500" />
                                    Delete
                                </button>
                            </div>
                        )}
                    </div>
                </div>

                {/* Content */}
                <div className="flex-grow flex flex-col justify-end items-start">
                    <h3 className={`text-lg font-bold leading-tight line-clamp-2 mb-1 text-left ${
                        theme === 'dark' ? 'text-gray-100' : 'text-gray-900'
                    }`}>
                        {notebook.title}
                    </h3>
                    <p className={`text-xs text-left font-medium ${
                        theme === 'dark' ? 'text-gray-500' : 'text-gray-400'
                    }`}>
                        {formatRelativeOrAbsolute(notebook.updated_at)}
                    </p>
                </div>
            </div>
        </div>
    );
};
const CreateNewCard: React.FC<{ theme: 'light' | 'dark' }> = ({ theme }) => {
    return (
        <div
            className={`
                rounded-xl flex flex-col items-center justify-center h-44   
                border-2 border-dashed cursor-pointer transition-all duration-300
                hover:shadow-md hover:border-opacity-100 select-none group
                ${theme === 'dark'
                ? 'bg-gray-800/30 border-gray-700 text-gray-500 hover:bg-gray-800/50 hover:border-gray-500 hover:text-gray-300'
                : 'bg-gray-50/50 border-gray-300 text-gray-400 hover:bg-gray-50 hover:border-gray-400 hover:text-gray-600'
            }
            `}
        >
            <div className={`
                w-12 h-12 rounded-full flex items-center justify-center mb-3 transition-colors
                ${theme === 'dark'
                ? 'bg-gray-800 group-hover:bg-gray-700'
                : 'bg-gray-100 group-hover:bg-white border border-gray-200'
            }
            `}>
                <Plus size={24} />
            </div>
            <span className="text-sm font-semibold">Create New Notebook</span>
        </div>
    );
};

const NotebooksDashboard: React.FC = () => {
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [notebookToEdit, setNotebookToEdit] = useState<NotebookResponse | null>(null);
    const [notebookToDelete, setNotebookToDelete] = useState<NotebookResponse | null>(null);
    const [page, setPage] = useState(1);
    const PAGE_SIZE = 19;

    const navigate = useNavigate();
    const {theme} = useTheme();
    const {loading, error, getAllNotebooks, deleteNotebook, notebooks, pagination} = useNotebooks();

    useEffect(() => {
        getAllNotebooks(page, PAGE_SIZE);

        const handleRefresh = () => getAllNotebooks(page, PAGE_SIZE);
        // Listen to both events for better reactivity
        window.addEventListener("notebook-created", handleRefresh);
        window.addEventListener("notebook-updated", handleRefresh);

        return () => {
            window.removeEventListener("notebook-created", handleRefresh);
            window.removeEventListener("notebook-updated", handleRefresh);
        }
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

    const handleEditClick = (notebook: NotebookResponse) => {
        setNotebookToEdit(notebook);
        setIsEditModalOpen(true);
    };

    const handleEditClose = () => {
        setIsEditModalOpen(false);
        setNotebookToEdit(null);
    };

    const handleNotebookUpdated = () => {
        setIsEditModalOpen(false);
        setNotebookToEdit(null);
        getAllNotebooks(page, PAGE_SIZE);
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

                <main className="flex-grow flex flex-col mb-10">
                    {notebooks.length === 0 && !loading && page === 1 ? (
                        <div className="text-center flex flex-col items-center justify-center flex-grow">
                            <img src={blocks} alt="No notebooks" className="w-[350px]"/>
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
                                        <NotebookCard notebook={notebook} theme={theme} onDelete={handleDeleteClick} onEdit={handleEditClick}/>
                                    </div>
                                ))}
                            </div>

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
                <EditNotebookModal
                    isOpen={isEditModalOpen}
                    onClose={handleEditClose}
                    onSuccess={handleNotebookUpdated}
                    notebook={notebookToEdit}
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