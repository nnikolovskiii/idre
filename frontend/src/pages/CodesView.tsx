import React, { useState, useEffect } from 'react';
import {
    FaCode,
    FaPlus,
    FaEdit,
    FaTrash,
    FaSearch,
    FaTimes,
    FaExternalLinkAlt
} from 'react-icons/fa';
import { buildApiUrl } from '../lib/api';

// Types
interface CodeData {
    id: string;
    url: string;
    code: number;
    description: string;
}

interface CodeCreate {
    url: string;
    code: number;
    description: string;
}

interface CodeUpdate {
    url?: string;
    code?: number;
    description?: string;
}

// Main component
const CodesView: React.FC = () => {
    const [codes, setCodes] = useState<CodeData[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const [showCreateModal, setShowCreateModal] = useState<boolean>(false);
    const [showEditModal, setShowEditModal] = useState<boolean>(false);
    const [editingCode, setEditingCode] = useState<CodeData | null>(null);
    const [searchFilters, setSearchFilters] = useState({
        description_contains: '',
        min_code: '',
        max_code: '',
        url: ''
    });
    const [formData, setFormData] = useState<CodeCreate>({
        url: '',
        code: 0,
        description: ''
    });
    const [actionStatus, setActionStatus] = useState<{ success: boolean, message: string } | null>(null);

    // Fetch codes from API
    const fetchCodes = async (filters?: any) => {
        setLoading(true);
        setError(null);
        try {
            let url = buildApiUrl('/codes/codes');
            // Add query parameters if filters are provided
            const params = new URLSearchParams();
            if (filters?.description_contains) {
                params.append('description_contains', filters.description_contains);
            }
            if (filters?.min_code) {
                params.append('min_code', filters.min_code);
            }
            if (filters?.max_code) {
                params.append('max_code', filters.max_code);
            }
            if (filters?.url) {
                params.append('url', filters.url);
            }
            if (params.toString()) {
                url += `?${params.toString()}`;
            }
            const response = await fetch(url, {
                credentials: 'include'
            });
            if (!response.ok) {
                throw new Error('Failed to fetch codes');
            }
            const data = await response.json();
            setCodes(data.data || []);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'An error occurred while fetching codes');
        } finally {
            setLoading(false);
        }
    };

    // Initial fetch
    useEffect(() => {
        fetchCodes();
    }, []);

    // Handle search
    const handleSearch = () => {
        const filters = Object.fromEntries(
            Object.entries(searchFilters).filter(([_, value]) => value !== '')
        );
        fetchCodes(filters);
    };

    // Clear search
    const clearSearch = () => {
        setSearchFilters({
            description_contains: '',
            min_code: '',
            max_code: '',
            url: ''
        });
        fetchCodes();
    };

    // Handle create code
    const handleCreateCode = async () => {
        try {
            const response = await fetch(buildApiUrl('/codes/codes'), {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                credentials: 'include',
                body: JSON.stringify(formData)
            });
            if (!response.ok) {
                throw new Error('Failed to create code');
            }
            const data = await response.json();
            setActionStatus({
                success: true,
                message: data.message || 'Code created successfully'
            });
            setShowCreateModal(false);
            setFormData({ url: '', code: 0, description: '' });
            fetchCodes();
        } catch (err) {
            setActionStatus({
                success: false,
                message: err instanceof Error ? err.message : 'An error occurred while creating the code'
            });
        }
    };

    // Handle update code
    const handleUpdateCode = async () => {
        if (!editingCode) return;
        try {
            const updateData: CodeUpdate = {};
            if (formData.url !== editingCode.url) updateData.url = formData.url;
            if (formData.code !== editingCode.code) updateData.code = formData.code;
            if (formData.description !== editingCode.description) updateData.description = formData.description;

            const response = await fetch(buildApiUrl(`/codes/codes/${editingCode.id}`), {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                credentials: 'include',
                body: JSON.stringify(updateData)
            });
            if (!response.ok) {
                throw new Error('Failed to update code');
            }
            const data = await response.json();
            setActionStatus({
                success: true,
                message: data.message || 'Code updated successfully'
            });
            setShowEditModal(false);
            setEditingCode(null);
            setFormData({ url: '', code: 0, description: '' });
            fetchCodes();
        } catch (err) {
            setActionStatus({
                success: false,
                message: err instanceof Error ? err.message : 'An error occurred while updating the code'
            });
        }
    };

    // Handle delete code
    const handleDeleteCode = async (codeId: string) => {
        if (!confirm('Are you sure you want to delete this code?')) return;
        try {
            const response = await fetch(buildApiUrl(`/codes/codes/${codeId}`), {
                method: 'DELETE',
                credentials: 'include'
            });
            if (!response.ok) {
                throw new Error('Failed to delete code');
            }
            const data = await response.json();
            setActionStatus({
                success: true,
                message: data.message || 'Code deleted successfully'
            });
            fetchCodes();
        } catch (err) {
            setActionStatus({
                success: false,
                message: err instanceof Error ? err.message : 'An error occurred while deleting the code'
            });
        }
    };

    // Handle edit click
    const handleEditClick = (code: CodeData) => {
        setEditingCode(code);
        setFormData({
            url: code.url,
            code: code.code,
            description: code.description
        });
        setShowEditModal(true);
    };

    // Clear action status after 5 seconds
    useEffect(() => {
        if (actionStatus) {
            const timer = setTimeout(() => {
                setActionStatus(null);
            }, 5000);
            return () => clearTimeout(timer);
        }
    }, [actionStatus]);

    return (
        <>
            <div className="page-header">
                <h1 className="page-title">Codes</h1>
                <p className="page-subtitle">Manage your code entries and references.</p>
            </div>
            <div className="bg-white rounded-lg shadow-md p-5 mb-5">
                {/* Header with search and create button */}
                <div className="flex justify-between items-start mb-5 pb-5 border-b border-gray-200 gap-5">
                    <div className="flex-grow">
                        <div className="flex flex-wrap gap-2.5 items-center">
                            <input
                                type="text"
                                placeholder="Search description..."
                                value={searchFilters.description_contains}
                                onChange={(e) => setSearchFilters(prev => ({ ...prev, description_contains: e.target.value }))}
                                className="px-3 py-2 border border-gray-300 rounded-md text-sm min-w-[150px]"
                            />
                            <input
                                type="text"
                                placeholder="URL contains..."
                                value={searchFilters.url}
                                onChange={(e) => setSearchFilters(prev => ({ ...prev, url: e.target.value }))}
                                className="px-3 py-2 border border-gray-300 rounded-md text-sm min-w-[150px]"
                            />
                            <input
                                type="number"
                                placeholder="Min code"
                                value={searchFilters.min_code}
                                onChange={(e) => setSearchFilters(prev => ({ ...prev, min_code: e.target.value }))}
                                className="px-3 py-2 border border-gray-300 rounded-md text-sm min-w-[100px]"
                            />
                            <input
                                type="number"
                                placeholder="Max code"
                                value={searchFilters.max_code}
                                onChange={(e) => setSearchFilters(prev => ({ ...prev, max_code: e.target.value }))}
                                className="px-3 py-2 border border-gray-300 rounded-md text-sm min-w-[100px]"
                            />
                            <button onClick={handleSearch} className="flex items-center gap-1.5 bg-blue-500 hover:bg-blue-600 text-white border-none rounded-md px-4 py-2 cursor-pointer text-sm">
                                <FaSearch /> Search
                            </button>
                            <button onClick={clearSearch} className="flex items-center gap-1.5 bg-gray-200 hover:bg-gray-300 text-gray-700 border-none rounded-md px-4 py-2 cursor-pointer text-sm">
                                <FaTimes /> Clear
                            </button>
                        </div>
                    </div>
                    <button
                        onClick={() => setShowCreateModal(true)}
                        className="flex items-center gap-1.5 bg-green-500 hover:bg-green-600 text-white border-none rounded-md px-5 py-2.5 cursor-pointer text-sm font-semibold whitespace-nowrap"
                    >
                        <FaPlus /> Add Code
                    </button>
                </div>

                {/* Action status message */}
                {actionStatus && (
                    <div className={`p-3 mb-5 rounded-md text-sm ${actionStatus.success ? 'bg-teal-100 text-teal-800 border border-teal-300' : 'bg-red-100 text-red-800 border border-red-300'}`}>
                        {actionStatus.message}
                    </div>
                )}

                {/* Loading and error states */}
                {loading && <div className="text-center p-10 text-gray-500">Loading codes...</div>}
                {error && <div className="text-center p-10 text-red-600">{error}</div>}

                {/* Codes table */}
                {!loading && !error && codes.length === 0 && (
                    <div className="text-center p-10 text-gray-500 flex flex-col items-center gap-4">
                        <FaCode size={48} className="text-gray-400" />
                        <p>No codes found. Create your first code entry to get started.</p>
                    </div>
                )}

                {!loading && !error && codes.length > 0 && (
                    <div className="overflow-x-auto">
                        <table className="w-full border-collapse text-sm">
                            <thead>
                            <tr>
                                <th className="bg-slate-50 p-3 text-left font-semibold text-gray-600 border-b-2 border-gray-200">Code</th>
                                <th className="bg-slate-50 p-3 text-left font-semibold text-gray-600 border-b-2 border-gray-200">URL</th>
                                <th className="bg-slate-50 p-3 text-left font-semibold text-gray-600 border-b-2 border-gray-200">Description</th>
                                <th className="bg-slate-50 p-3 text-left font-semibold text-gray-600 border-b-2 border-gray-200">Actions</th>
                            </tr>
                            </thead>
                            <tbody>
                            {codes.map((code) => (
                                <tr key={code.id} className="hover:bg-slate-50">
                                    <td className="p-3 border-b border-gray-200 font-semibold text-blue-500 min-w-[80px]">{code.code}</td>
                                    <td className="p-3 border-b border-gray-200 max-w-[300px]">
                                        <a
                                            href={code.url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-blue-600 no-underline flex items-center gap-1.5 break-all hover:underline"
                                            title={code.url}
                                        >
                                            {code.url.length > 50 ? `${code.url.substring(0, 50)}...` : code.url}
                                            <FaExternalLinkAlt size={12} />
                                        </a>
                                    </td>
                                    <td className="p-3 border-b border-gray-200 max-w-[400px] text-gray-600 leading-normal" title={code.description}>
                                        {code.description.length > 100
                                            ? `${code.description.substring(0, 100)}...`
                                            : code.description
                                        }
                                    </td>
                                    <td className="p-3 border-b border-gray-200 whitespace-nowrap">
                                        <button
                                            onClick={() => handleEditClick(code)}
                                            className="bg-none border-none cursor-pointer p-1.5 rounded-md mr-2 transition-colors hover:bg-blue-50 text-blue-500"
                                            title="Edit code"
                                        >
                                            <FaEdit />
                                        </button>
                                        <button
                                            onClick={() => handleDeleteCode(code.id)}
                                            className="bg-none border-none cursor-pointer p-1.5 rounded-md mr-2 transition-colors hover:bg-red-50 text-red-500"
                                            title="Delete code"
                                        >
                                            <FaTrash />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Create Modal */}
            {showCreateModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[1000]" onClick={() => setShowCreateModal(false)}>
                    <div className="bg-white rounded-lg shadow-lg max-w-[500px] w-[90%] max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
                        <div className="flex justify-between items-center p-5 border-b border-gray-200">
                            <h3 className="m-0 text-gray-800">Create New Code</h3>
                            <button
                                onClick={() => setShowCreateModal(false)}
                                className="bg-none border-none cursor-pointer text-gray-500 text-base p-1 hover:text-gray-700"
                            >
                                <FaTimes />
                            </button>
                        </div>
                        <div className="p-5">
                            <div className="mb-4">
                                <label className="block mb-1.5 font-semibold text-gray-700">Code Number</label>
                                <input
                                    type="number"
                                    value={formData.code}
                                    onChange={(e) => setFormData(prev => ({ ...prev, code: parseInt(e.target.value) || 0 }))}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm box-border focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                                    required
                                />
                            </div>
                            <div className="mb-4">
                                <label className="block mb-1.5 font-semibold text-gray-700">URL</label>
                                <input
                                    type="url"
                                    value={formData.url}
                                    onChange={(e) => setFormData(prev => ({ ...prev, url: e.target.value }))}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm box-border focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                                    required
                                />
                            </div>
                            <div className="mb-4">
                                <label className="block mb-1.5 font-semibold text-gray-700">Description</label>
                                <textarea
                                    value={formData.description}
                                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm box-border min-h-[80px] resize-y focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                                    rows={4}
                                    required
                                />
                            </div>
                        </div>
                        <div className="flex justify-end gap-2.5 p-5 border-t border-gray-200">
                            <button
                                onClick={() => setShowCreateModal(false)}
                                className="bg-gray-200 hover:bg-gray-300 text-gray-700 border-none rounded-md px-4 py-2 cursor-pointer text-sm"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleCreateCode}
                                className="bg-green-500 hover:bg-green-600 text-white border-none rounded-md px-4 py-2 cursor-pointer text-sm font-semibold"
                            >
                                Create Code
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Edit Modal */}
            {showEditModal && editingCode && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[1000]" onClick={() => setShowEditModal(false)}>
                    <div className="bg-white rounded-lg shadow-lg max-w-[500px] w-[90%] max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
                        <div className="flex justify-between items-center p-5 border-b border-gray-200">
                            <h3 className="m-0 text-gray-800">Edit Code</h3>
                            <button
                                onClick={() => setShowEditModal(false)}
                                className="bg-none border-none cursor-pointer text-gray-500 text-base p-1 hover:text-gray-700"
                            >
                                <FaTimes />
                            </button>
                        </div>
                        <div className="p-5">
                            <div className="mb-4">
                                <label className="block mb-1.5 font-semibold text-gray-700">Code Number</label>
                                <input
                                    type="number"
                                    value={formData.code}
                                    onChange={(e) => setFormData(prev => ({ ...prev, code: parseInt(e.target.value) || 0 }))}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm box-border focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                                    required
                                />
                            </div>
                            <div className="mb-4">
                                <label className="block mb-1.5 font-semibold text-gray-700">URL</label>
                                <input
                                    type="url"
                                    value={formData.url}
                                    onChange={(e) => setFormData(prev => ({ ...prev, url: e.target.value }))}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm box-border focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                                    required
                                />
                            </div>
                            <div className="mb-4">
                                <label className="block mb-1.5 font-semibold text-gray-700">Description</label>
                                <textarea
                                    value={formData.description}
                                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm box-border min-h-[80px] resize-y focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                                    rows={4}
                                    required
                                />
                            </div>
                        </div>
                        <div className="flex justify-end gap-2.5 p-5 border-t border-gray-200">
                            <button
                                onClick={() => setShowEditModal(false)}
                                className="bg-gray-200 hover:bg-gray-300 text-gray-700 border-none rounded-md px-4 py-2 cursor-pointer text-sm"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleUpdateCode}
                                className="bg-green-500 hover:bg-green-600 text-white border-none rounded-md px-4 py-2 cursor-pointer text-sm font-semibold"
                            >
                                Update Code
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

export default CodesView;
