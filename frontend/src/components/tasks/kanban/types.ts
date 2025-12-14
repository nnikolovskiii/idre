import { TaskStatus } from "../../../services/tasksService";

export interface Task {
    id: string;
    title: string;
    description?: string;
    priority: "low" | "medium" | "high";
    tags?: string[];
    dueDate?: string;
    position?: number;
    status: TaskStatus;
    archived?: boolean;
    created_at?: string; // Added created_at for Gantt chart
    notebook?: {
        id: string;
        title: string;
        emoji: string;
        bg_color?: string; // Added this field
    };
}

export interface Column {
    id: TaskStatus;
    title: string;
    tasks: Task[];
    accentColor: string;
}

export type NewTaskState = {
    title: string;
    description: string;
    priority: Task["priority"];
    tags: string;
    dueDate: string;
};

// ... keep COLUMN_CONFIG as is
export const COLUMN_CONFIG: { id: TaskStatus; title: string; accentColor: string }[] = [
    {
        id: TaskStatus.TODO,
        title: "To Do",
        accentColor: "bg-zinc-500" // Neutral/Grey
    },
    {
        id: TaskStatus.IN_PROGRESS,
        title: "In Progress",
        accentColor: "bg-blue-500" // Blue
    },
    {
        id: TaskStatus.REVIEW,
        title: "Review",
        accentColor: "bg-purple-500" // Purple
    },
    {
        id: TaskStatus.DONE,
        title: "Done",
        accentColor: "bg-emerald-500" // Green
    }
];