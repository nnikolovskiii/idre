// /home/nnikolovskii/dev/general-chat/frontend/src/components/chat/SettingsPopover.tsx

import { forwardRef } from 'react';
import { Globe } from 'lucide-react';

// A simple, styled, CONTROLLED toggle switch component
interface ToggleSwitchProps {
    enabled: boolean;
    onToggle: () => void;
    disabled?: boolean;
}

const ToggleSwitch = ({ enabled, onToggle, disabled = false }: ToggleSwitchProps) => {
    return (
        <button
            onClick={onToggle}
            disabled={disabled}
            className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none disabled:cursor-not-allowed disabled:opacity-50 ${
                enabled ? 'bg-blue-500' : 'bg-gray-400'
            }`}
        >
            <span
                className={`inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                    enabled ? 'translate-x-5' : 'translate-x-0'
                }`}
            />
        </button>
    );
};


// Props for the main popover component
interface SettingsPopoverProps {
    isWebSearchEnabled: boolean;
    onToggleWebSearch: () => void;
    isUpdatingWebSearch: boolean;
}

// The main popover component
export const SettingsPopover = forwardRef<HTMLDivElement, SettingsPopoverProps>((
    { isWebSearchEnabled, onToggleWebSearch, isUpdatingWebSearch }, ref
) => {
    return (
        <div
            ref={ref}
            className="absolute bottom-full left-0 mb-2 w-72 origin-bottom-left rounded-lg border border-border bg-card text-card-foreground shadow-xl z-10"
        >
            <div className="p-2">
                <div className="flex cursor-pointer items-center justify-between rounded-md p-2 text-sm hover:bg-muted">
                    <div className="flex items-center gap-3">
                        <Globe size={18} />
                        <span>Web search</span>
                    </div>
                    <ToggleSwitch
                        enabled={isWebSearchEnabled}
                        onToggle={onToggleWebSearch}
                        disabled={isUpdatingWebSearch}
                    />
                </div>
            </div>
        </div>
    );
});

SettingsPopover.displayName = "SettingsPopover";