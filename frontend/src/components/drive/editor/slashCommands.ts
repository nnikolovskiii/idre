import React from "react";

export interface SlashCommand {
    id: string;
    label: string;
    icon: React.ReactNode;
    value: string;
    offset?: number;
}

// Note: We cannot render React components directly in a constant file if it's strictly TS
// without the .tsx extension, but usually this is fine in a setup like yours.
// If you get errors, rename this file to slashCommands.tsx
export const SLASH_COMMANDS: any[] = [
    { id: 'h1', label: 'Heading 1', icon: "H1", value: '# ', offset: 0 },
    { id: 'h2', label: 'Heading 2', icon: "H2", value: '## ', offset: 0 },
    { id: 'bold', label: 'Bold', icon: "B", value: '**text**', offset: -2 },
    { id: 'italic', label: 'Italic', icon: "I", value: '*text*', offset: -1 },
    { id: 'code', label: 'Code Block', icon: "Code", value: '```javascript\nconsole.log("Hello");\n```', offset: -4 },
    { id: 'table', label: 'Table', icon: "Table", value: '| Header | Header |\n|---|---|\n| Cell | Cell |', offset: 0 },
    { id: 'list', label: 'Bullet List', icon: "List", value: '- ', offset: 0 },
    { id: 'check', label: 'Checklist', icon: "Check", value: '- [ ] ', offset: 0 },
];