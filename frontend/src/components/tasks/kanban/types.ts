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
    notebook?: {
        id: string;
        title: string;
        emoji: string;
    };
}

export interface Column {
    id: TaskStatus;
    title: string;
    tasks: Task[];
    color: string;
}

export type NewTaskState = {
    title: string;
    description: string;
    priority: Task["priority"];
    tags: string;
    dueDate: string;
};

export const COLUMN_CONFIG: { id: TaskStatus; title: string; color: string }[] = [
    {
        id: TaskStatus.TODO,
        title: "To Do",
        color: "bg-gray-100 dark:bg-gray-800 border-gray-200 dark:border-gray-700"
    },
    {
        id: TaskStatus.IN_PROGRESS,
        title: "In Progress",
        color: "bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800"
    },
    {
        id: TaskStatus.REVIEW,
        title: "Review",
        color: "bg-purple-50 dark:bg-purple-900/20 border-purple-200 dark:border-purple-800"
    },
    {
        id: TaskStatus.DONE,
        title: "Done",
        color: "bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800"
    }
];