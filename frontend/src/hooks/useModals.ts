import { useState, useEffect, useCallback } from "react";
import { useAuth } from "../contexts/AuthContext";
import { useApiKey } from "../contexts/ApiKeyContext";

export interface ModalState {
    isAIModelsSettingsOpen: boolean;
    isDefaultModelsModalOpen: boolean;
    isModelApiModalOpen: boolean;
    isLoginModalOpen: boolean;
    isRegisterModalOpen: boolean;
}

export const useModals = () => {
    const { isAuthenticated, isLoading: authLoading } = useAuth();
    const { refreshApiKeyStatus } = useApiKey();

    const [modals, setModals] = useState<ModalState>({
        isAIModelsSettingsOpen: false,
        isDefaultModelsModalOpen: false,
        isModelApiModalOpen: false,
        isLoginModalOpen: false,
        isRegisterModalOpen: false,
    });

    // Auto-show login modal when user is not authenticated
    useEffect(() => {
        if (
            !authLoading &&
            !isAuthenticated &&
            !modals.isLoginModalOpen &&
            !modals.isRegisterModalOpen
        ) {
            setModals((prev) => ({ ...prev, isLoginModalOpen: true }));
        }
    }, [
        authLoading,
        isAuthenticated,
        modals.isLoginModalOpen,
        modals.isRegisterModalOpen,
    ]);

    const openModal = useCallback((modalKey: keyof ModalState) => {
        setModals((prev) => ({ ...prev, [modalKey]: true }));
    }, []);

    const closeModal = useCallback((modalKey: keyof ModalState) => {
        setModals((prev) => ({ ...prev, [modalKey]: false }));
    }, []);

    const toggleModal = useCallback((modalKey: keyof ModalState) => {
        setModals((prev) => ({ ...prev, [modalKey]: !prev[modalKey] }));
    }, []);

    const switchToRegister = useCallback(() => {
        setModals((prev) => ({
            ...prev,
            isLoginModalOpen: false,
            isRegisterModalOpen: true,
        }));
    }, []);

    const switchToLogin = useCallback(() => {
        setModals((prev) => ({
            ...prev,
            isRegisterModalOpen: false,
            isLoginModalOpen: true,
        }));
    }, []);

    // Specific handlers for compatibility
    const handleOpenAIModelsSettings = useCallback(
        () => openModal("isAIModelsSettingsOpen"),
        [openModal]
    );
    const handleCloseAIModelsSettings = useCallback(
        () => closeModal("isAIModelsSettingsOpen"),
        [closeModal]
    );
    const handleDefaultModelsClick = useCallback(
        () => openModal("isDefaultModelsModalOpen"),
        [openModal]
    );
    const handleModelApiClick = useCallback(
        () => openModal("isModelApiModalOpen"),
        [openModal]
    );
    const handleCloseDefaultModelsModal = useCallback(
        () => closeModal("isDefaultModelsModalOpen"),
        [closeModal]
    );
    const handleCloseModelApiModal = useCallback(() => {
        closeModal("isModelApiModalOpen");
        refreshApiKeyStatus();
    }, [closeModal, refreshApiKeyStatus]);
    const handleOpenLoginModal = useCallback(
        () => openModal("isLoginModalOpen"),
        [openModal]
    );
    const handleCloseLoginModal = useCallback(
        () => closeModal("isLoginModalOpen"),
        [closeModal]
    );
    const handleOpenRegisterModal = useCallback(
        () => openModal("isRegisterModalOpen"),
        [openModal]
    );
    const handleCloseRegisterModal = useCallback(
        () => closeModal("isRegisterModalOpen"),
        [closeModal]
    );

    return {
        modals,
        actions: {
            openModal,
            closeModal,
            toggleModal,
            switchToRegister,
            switchToLogin,
            handleOpenAIModelsSettings,
            handleCloseAIModelsSettings,
            handleDefaultModelsClick,
            handleModelApiClick,
            handleCloseDefaultModelsModal,
            handleCloseModelApiModal,
            handleOpenLoginModal,
            handleCloseLoginModal,
            handleOpenRegisterModal,
            handleCloseRegisterModal,
        },
    };
};
