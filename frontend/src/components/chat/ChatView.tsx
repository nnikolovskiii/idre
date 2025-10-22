import React from "react";
import {useParams} from "react-router-dom";

import {useChats} from "../../hooks/useChats.ts";
import InputArea from "./InputArea.tsx";
import MessagesContainer from "./MessagesContainer.tsx";
import Layout from "../layout/Layout.tsx";
import {fileService} from "../../lib/filesService.ts";

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
        createTemporaryChat,
        switchToChat,
        handleDeleteChat,
        handleSendMessage,
        handleDeleteMessage,
    } = useChats(currentNotebookId);

    const handleModelsRequired = () => {
        // This would be handled in Layout via onSettingsClick, but if needed here, adjust
    };

    const handleTextSubmit = async (text: string) => {
        await handleSendMessage(text);
    };

    const handleAudioSubmit = async (text: string, blob: Blob) => {
        try {
            const timestamp = Date.now();
            const randomString = Math.random().toString(36).substring(2, 8);
            const fileExtension = "webm";
            const baseName = "recording";
            const uniqueFilename = `${baseName}_${timestamp}_${randomString}.${fileExtension}`;

            const audioFile = new File([blob], uniqueFilename, {type: "audio/webm"});

            const uploadResult = await fileService.uploadFile(audioFile, undefined, false);

            const backendFilename = uploadResult.filename;

            if (!backendFilename) {
                throw new Error(
                    "Backend did not return a valid filename for the audio."
                );
            }

            await handleSendMessage(text || undefined, uploadResult.url);
        } catch (error) {
            const errorMessage =
                error instanceof Error ? error.message : "Unknown error";
            await handleSendMessage(`[Error] Failed to process audio: ${errorMessage}`);
        }
    };

    const handleFileSubmit = async (file: File) => {
        try {
            await fileService.uploadFile(file, undefined,false);
            console.log("File uploaded successfully:", file.name);
            const fileMessage = `[File Uploaded: ${file.name}]`;
            await handleSendMessage(fileMessage);
        } catch (error) {
            console.error("Failed to upload file:", error);
            const errorMessage = `[Error] Failed to upload file: ${file.name}`;
            await handleSendMessage(errorMessage);
        }
    };

    const inputArea = (
        <InputArea
            onTextSubmit={handleTextSubmit}
            onAudioSubmit={handleAudioSubmit}
            onFileSubmit={handleFileSubmit}
            disabled={!currentChatId || creatingChat || isTyping}
            hasModelsConfigured={true}
            loadingMessages={loadingMessages}
            loadingModels={loadingModels}
            onModelsRequired={handleModelsRequired}
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
            createNewChat={createTemporaryChat}
            switchToChat={switchToChat}
            handleDeleteChat={handleDeleteChat}
        />
    );
};

export default ChatView;
