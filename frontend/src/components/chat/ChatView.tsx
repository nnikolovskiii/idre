// /home/nnikolovskii/dev/general-chat/frontend/src/components/chat/ChatView.tsx:

import React from "react";
import {useParams} from "react-router-dom";

import {useChats} from "../../hooks/useChats.ts";
import MessagesContainer from "./MessagesContainer.tsx";
import Layout from "../layout/Layout.tsx";
import {fileService} from "../../services/filesService.ts";
import ChatInputArea from "./ChatInputArea.tsx";
import {useSse} from "../../context/SseContext.tsx";

type ChatViewProps = {
    notebookId?: string;
};

const ChatView: React.FC<ChatViewProps> = ({notebookId: propNotebookId}) => {
    const {notebookId: paramNotebookId} = useParams<{ notebookId: string }>();
    const currentNotebookId = propNotebookId || paramNotebookId;

    const {
        chatSessions,
        currentChat,
        currentChatId,
        loadingChats,
        loadingMessages,
        loadingModels,
        creatingChat,
        isTyping,
        isAuthenticated,
        user,
        isTemporaryChat,
        currentChatModels,
        createTemporaryChat,
        switchToChat,
        handleDeleteChat,
        handleSendMessage,
        handleDeleteMessage,
    } = useChats(currentNotebookId);

    const { isThreadTyping } = useSse();

    const handleModelsRequired = () => {
        // This would be handled in Layout via onSettingsClick, but if needed here, adjust
    };

    const handleTextSubmit = async (text: string, options: { webSearch: boolean, mode: string }) => {
        await handleSendMessage(text, undefined, options);
    };

    const handleFileSubmit = async (file: File, options: { webSearch: boolean, mode: string }) => {
        try {
            // Re-using file upload logic from MyDriveView for consistency
            const uploadResult = await fileService.uploadFile(file, undefined, false);
            console.log("File uploaded successfully:", file.name, uploadResult.url);
            const fileMessage = `[File Uploaded: ${file.name}]`;
            // Pass the URL to handleSendMessage if you want the model to see it
            await handleSendMessage(fileMessage, uploadResult.url, options);
        } catch (error) {
            console.error("Failed to upload file:", error);
            const errorMessage = `[Error] Failed to upload file: ${file.name}`;
            await handleSendMessage(errorMessage, undefined, options);
        }
    };

    const inputArea = (
        <ChatInputArea
            onTextSubmit={handleTextSubmit}
            onFileSubmit={handleFileSubmit}
            disabled={!currentChatId || creatingChat || isTyping}
            hasModelsConfigured={true}
            loadingMessages={loadingMessages}
            loadingModels={loadingModels}
            onModelsRequired={handleModelsRequired}
            models={currentChatModels}
            initialWebSearchEnabled={currentChat?.web_search}
            chatId={currentChatId}
        />
    );

    const children = (
        <MessagesContainer
            messages={currentChat?.messages || []}
            isTyping={isTyping}
            loadingMessages={loadingMessages}
            onDeleteMessage={handleDeleteMessage}
        />
    );

    return (
        <Layout
            notebookId={currentNotebookId}
            children={children}
            inputArea={inputArea}
            title={currentChat?.title || "AI Assistant"}
            chatSessions={chatSessions}
            currentChatId={currentChatId}
            loadingChats={loadingChats}
            creatingChat={creatingChat}
            isTyping={isTyping}
            isAuthenticated={isAuthenticated}
            user={user}
            isTemporaryChat={isTemporaryChat}
            createNewChat={createTemporaryChat}
            switchToChat={switchToChat}
            handleDeleteChat={handleDeleteChat}
            isThreadTyping={isThreadTyping}
        />
    );
};

export default ChatView;
