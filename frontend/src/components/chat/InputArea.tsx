import React, { useState, useRef, useCallback } from "react";
import { Mic, Send, Upload } from "lucide-react";

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

  const iconButtonClasses = "flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg border-none bg-transparent text-gray-500 transition-all duration-200 ease-in-out disabled:cursor-not-allowed disabled:opacity-50 hover:enabled:bg-gray-100 hover:enabled:text-gray-700";

  return (
      <div className="relative w-full flex-shrink-0 border-t border-border bg-[#f8f7f6] p-2 md:p-4 fixed bottom-0 left-0 right-0 md:static pb-[max(0.5rem,env(safe-area-inset-bottom))]">
        <div className="relative mx-auto max-w-3xl">
          {!hasModelsConfigured && (
              <div className="mb-2 flex cursor-pointer select-none items-center gap-2 rounded-md border border-yellow-300 bg-yellow-100 px-4 py-2 transition-colors duration-200 ease-in-out hover:bg-yellow-200" onClick={handleInputClick}>
                <span className="text-base">🤖</span>
                <span className="text-sm font-medium text-yellow-800">
                      Select models to start chatting. Click here to configure models.
                  </span>
              </div>
          )}
          <div className="flex items-end gap-2 rounded-lg border border-border bg-card p-2 transition-all focus-within:border-ring focus-within:shadow-sm">
            <input
                ref={fileInputRef}
                type="file"
                onChange={handleFileUpload}
                style={{ display: "none" }}
                accept="*/*"
            />
            <button
                className={`${iconButtonClasses}`}
                onClick={triggerFileUpload}
                disabled={isDisabled}
                title="Upload File"
            >
              <Upload size={20} />
            </button>
            <textarea
                ref={textareaRef}
                className={`flex-1 resize-none self-center border-none bg-transparent text-base leading-tight text-foreground outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:bg-gray-50 md:text-sm max-h-[120px] p-2`}
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
                className={`${iconButtonClasses} ${isRecording ? 'bg-red-50 text-red-500 hover:enabled:bg-red-100' : ''}`}
                onClick={handleMicClick}
                disabled={isDisabled}
                title={isRecording ? "Stop Recording" : "Start Recording"}
            >
              <Mic size={20} />
            </button>
            <button
                className={`${iconButtonClasses} bg-primary text-primary-foreground disabled:bg-gray-400 hover:enabled:bg-primary/90`}
                onClick={sendTextMessage}
                disabled={isDisabled || !textInput.trim()}
                title="Send Message"
            >
              <Send size={20} />
            </button>
          </div>
        </div>
      </div>
  );
};

export default InputArea;