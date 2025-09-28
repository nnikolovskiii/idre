import React, { useState, useRef, useCallback } from "react";
import { fileService } from "../../lib/filesService";
import { Mic, Send, Upload } from "lucide-react";
import "./InputArea.css";

const FILE_SERVICE_URL =
  window.ENV?.VITE_FILE_SERVICE_DOCKER_NETWORK ||
  import.meta.env.VITE_FILE_SERVICE_URL ||
  "https://files.nikolanikolovski.com";

interface InputAreaProps {
  onSendMessage: (text?: string, audioPath?: string) => void;
  disabled?: boolean;
  hasModelsConfigured?: boolean;
  onModelsRequired?: () => void;
}

const InputArea: React.FC<InputAreaProps> = ({
  onSendMessage,
  disabled = false,
  hasModelsConfigured = false,
  onModelsRequired,
}) => {
  const [textInput, setTextInput] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isDisabled = disabled || !hasModelsConfigured;

  const autoResize = useCallback(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, []);

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setTextInput(e.target.value);
    autoResize();
  };

  const sendTextMessage = () => {
    if (!hasModelsConfigured) {
      onModelsRequired?.();
      return;
    }

    const message = textInput.trim();
    if (!message) return;

    onSendMessage(message);
    setTextInput("");
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (!isDisabled && textInput.trim()) {
        sendTextMessage();
      }
    }
  };

  const handleInputClick = () => {
    if (!hasModelsConfigured) {
      onModelsRequired?.();
    }
  };

  const uploadAudioBlob = async (
    blob: Blob,
    filename: string
  ): Promise<{ data: { unique_filename: string } }> => {
    try {
      // Generate unique filename by adding timestamp and random string
      const timestamp = Date.now();
      const randomString = Math.random().toString(36).substring(2, 8);
      const fileExtension = filename.split(".").pop() || "webm";
      const baseName = filename.split(".").slice(0, -1).join(".") || "audio";
      const uniqueFilename = `${baseName}_${timestamp}_${randomString}.${fileExtension}`;

      // Convert blob to File object with unique filename
      const file = new File([blob], uniqueFilename, { type: "audio/webm" });

      // Use fileService to upload the file
      const uploadResult = await fileService.uploadFile(file);

      // Return the expected format for compatibility with existing code
      return {
        data: {
          unique_filename: uploadResult.unique_filename,
        },
      };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      throw new Error(`Upload failed: ${errorMessage}`);
    }
  };

  const processAudioRecording = async (audioBlob: Blob) => {
    try {
      const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
      const filename = `recording-${timestamp}.webm`;
      const uploadResult = await uploadAudioBlob(audioBlob, filename);
      const backendFilename = uploadResult.data?.unique_filename;

      if (!backendFilename) {
        throw new Error(
          "Backend did not return a valid filename for the audio."
        );
      }

      const audioPath = `${FILE_SERVICE_URL}/test/download/${backendFilename}`;
      onSendMessage(textInput, audioPath);
      setTextInput("");
      if (textareaRef.current) {
        textareaRef.current.style.height = "auto";
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      onSendMessage(`[Error] Failed to process audio: ${errorMessage}`);
    }
  };

  const startRecording = async () => {
    if (isRecording) return;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream, { mimeType: "audio/webm" });
      mediaRecorderRef.current = recorder;

      const chunks: Blob[] = [];
      recorder.ondataavailable = (event) => chunks.push(event.data);

      recorder.onstop = () => {
        const audioBlob = new Blob(chunks, { type: "audio/webm" });
        processAudioRecording(audioBlob);
        stream.getTracks().forEach((track) => track.stop());
      };

      recorder.start();
      setIsRecording(true);
    } catch (err) {
      console.error("Error starting recording:", err);
      alert("Could not access microphone. Please check browser permissions.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const handleMicClick = () => {
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  };

  const handleFileUpload = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      // Upload the file using fileService
      const uploadResult = await fileService.uploadFile(file);

      console.log("File uploaded successfully:", uploadResult);

      // Create a message with the file information
      const fileMessage = `[File Uploaded: ${file.name}]`;
      onSendMessage(fileMessage);

      // Clear the file input
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    } catch (error) {
      console.error("Failed to upload file:", error);
      const errorMessage = `[Error] Failed to upload file: ${file.name}`;
      onSendMessage(errorMessage);
    }
  };

  const triggerFileUpload = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="input-area-wrapper">
      {!hasModelsConfigured && (
        <div className="api-key-required-notice" onClick={handleInputClick}>
          <span className="notice-icon">🤖</span>
          <span className="notice-text">
            Select models to start chatting. Click here to configure models.
          </span>
        </div>
      )}
      <div className="input-area">
        <div className="input-form">
          {/* Hidden file input */}
          <input
            ref={fileInputRef}
            type="file"
            onChange={handleFileUpload}
            style={{ display: "none" }}
            accept="*/*"
          />

          {/* File upload button */}
          <button
            className="icon-button upload-btn"
            onClick={triggerFileUpload}
            disabled={isDisabled}
            title="Upload File"
          >
            <Upload size={20} />
          </button>

          <textarea
            ref={textareaRef}
            className={`text-input ${
              !hasModelsConfigured ? "api-key-required" : ""
            }`}
            placeholder={
              hasModelsConfigured
                ? "How can I help you?"
                : "Configure models to start chatting..."
            }
            value={textInput}
            onChange={handleTextChange}
            onKeyPress={handleKeyPress}
            onClick={handleInputClick}
            rows={1}
            disabled={isDisabled}
          />
          <button
            className={`icon-button ${isRecording ? "recording" : ""}`}
            onClick={handleMicClick}
            disabled={isDisabled}
            title={isRecording ? "Stop Recording" : "Start Recording"}
          >
            <Mic size={20} />
          </button>
          {textInput.trim() && (
            <button
              className="icon-button send-btn"
              onClick={sendTextMessage}
              disabled={isDisabled}
              title="Send Message"
            >
              <Send size={20} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default InputArea;
