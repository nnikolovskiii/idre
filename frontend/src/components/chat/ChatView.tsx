// Updated src/views/ChatView.tsx
import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";

import "./ChatView.css";
import {useChats} from "../../hooks/useChats.ts";
import InputArea from "./InputArea.tsx";
import ChatHeader from "./ChatHeader.tsx";
import MessagesContainer from "./MessagesContainer.tsx";
import Layout from "../layout/Layout.tsx";
import {fileService} from "../../lib/filesService.ts";

const FILE_SERVICE_URL =
    window.ENV?.VITE_FILE_SERVICE_DOCKER_NETWORK ||
    import.meta.env.VITE_FILE_SERVICE_URL ||
    "https://files.nikolanikovski.com";

type ChatViewProps = {
    notebookId?: string;
};

const ChatView: React.FC<ChatViewProps> = ({ notebookId: propNotebookId }) => {
    const { notebookId: paramNotebookId } = useParams<{ notebookId: string }>();
    const currentNotebookId = propNotebookId || paramNotebookId;

    const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

    useEffect(() => {
        const handleResize = () => {
            setIsMobile(window.innerWidth <= 768);
        };
        window.addEventListener("resize", handleResize);
        return () => window.removeEventListener("resize", handleResize);
    }, []);

    const {
        currentChat,
        currentChatId,
        creatingChat,
        isTyping,
        hasModelsConfigured,
        handleSendMessage,
        handleDeleteMessage,
    } = useChats(currentNotebookId); // Assuming useChats returns these; adjust if needed

    const handleModelsRequired = () => {
        // This would be handled in Layout via onSettingsClick, but if needed here, adjust
    };

    const handleTextSubmit = async (text: string) => {
        await handleSendMessage(text);
    };

    const handleAudioSubmit = async (text: string, blob: Blob) => {
        try {
            // Generate unique filename by adding timestamp and random string
            const timestamp = Date.now();
            const randomString = Math.random().toString(36).substring(2, 8);
            const fileExtension = "webm";
            const baseName = "recording";
            const uniqueFilename = `${baseName}_${timestamp}_${randomString}.${fileExtension}`;

            // Convert blob to File object with unique filename
            const audioFile = new File([blob], uniqueFilename, { type: "audio/webm" });

            // Use fileService to upload the file
            const uploadResult = await fileService.uploadFile(audioFile);

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
            // Upload the file using fileService
            await fileService.uploadFile(file);

            console.log("File uploaded successfully:", file.name);

            // Create a message with the file information
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
            hasModelsConfigured={hasModelsConfigured}
            onModelsRequired={handleModelsRequired}
        />
    );

    const children = (
        <>
            {isMobile && (
                <ChatHeader
                    title={currentChat?.title || "AI Assistant"}
                    isMobile={isMobile}
                    onMenuClick={() => {
                        // Toggle sidebar - but since Layout handles it, perhaps pass a ref or prop
                        // For simplicity, assuming Layout handles toggle; if needed, expose via context or prop
                    }}
                    onSettingsClick={() => {
                        // Handled in Layout
                    }}
                />
            )}
            <MessagesContainer
                messages={currentChat?.messages || []}
                isTyping={isTyping}
                onDeleteMessage={handleDeleteMessage}
            />
        </>
    );

    return (
        <Layout
            notebookId={currentNotebookId}
            children={children}
            inputArea={inputArea}
            wrapperClassName="chat-view-wrapper"
            mainClassName="main-chat-area"
        />
    );
};

export default ChatView;