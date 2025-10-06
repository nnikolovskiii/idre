import React, { useState, useRef, useCallback } from "react";
import { Mic, Send, Upload } from "lucide-react";
import "./InputArea.css";

interface InputAreaProps {
  onTextSubmit: (text: string) => Promise<void>;
  onAudioSubmit: (text: string, blob: Blob) => Promise<void>;
  onFileSubmit: (file: File) => Promise<void>;
  disabled?: boolean;
  hasModelsConfigured?: boolean;
  onModelsRequired?: () => void;
}

const InputArea: React.FC<InputAreaProps> = ({
                                               onTextSubmit,
                                               onAudioSubmit,
                                               onFileSubmit,
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

  const sendTextMessage = async () => {
    const message = textInput.trim();
    if (!message) return;

    try {
      await onTextSubmit(message);
    } catch (error) {
      console.error("Failed to submit text:", error);
    }
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
        onAudioSubmit(textInput, audioBlob).catch((err) => {
          console.error("Error submitting audio:", err);
        });
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
      await onFileSubmit(file);
    } catch (error) {
      console.error("Failed to submit file:", error);
    } finally {
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
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