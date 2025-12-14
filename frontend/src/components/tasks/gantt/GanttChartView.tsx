import React, { useMemo, useState, useRef, useEffect } from 'react';
import {
    format,
    parseISO,
    differenceInDays,
    startOfDay,
    endOfDay,
    eachDayOfInterval,
    isWeekend,
    isSameDay,
    addDays,
    min as minDateFn,
    max as maxDateFn
} from 'date-fns';
import { type Task } from '../kanban/types';
import { TaskStatus } from '../../../services/tasksService';
import { BarChart3, ChevronRight, ZoomIn, ZoomOut, Search } from 'lucide-react';

interface GanttChartViewProps {
    tasks: Task[];
    onTaskClick?: (task: Task) => void;
}

const COLUMN_WIDTH_MIN = 40;
const COLUMN_WIDTH_MAX = 120;

const GanttChartView: React.FC<GanttChartViewProps> = ({ tasks, onTaskClick }) => {
    // UI State
    const [columnWidth, setColumnWidth] = useState(60);
    const [searchQuery, setSearchQuery] = useState("");
    const containerRef = useRef<HTMLDivElement>(null);

    // --- Data Processing ---
    const { processedTasks, dateRange, totalDays, startDate: chartStartDate } = useMemo(() => {
        const tasksWithDueDates = tasks.filter(t => t.dueDate && !t.archived);

        // Filter by search
        const filteredTasks = tasksWithDueDates.filter(t =>
            t.title.toLowerCase().includes(searchQuery.toLowerCase())
        );

        if (filteredTasks.length === 0) {
            return { processedTasks: [], dateRange: [], totalDays: 0, startDate: new Date() };
        }

        // Calculate Global Date Range
        const allDates = filteredTasks.flatMap(task => [
            parseISO(task.created_at || new Date().toISOString()),
            parseISO(task.dueDate!)
        ]);

        // Add today to the range ensuring current context is visible
        allDates.push(new Date());

        const minDateRaw = minDateFn(allDates);
        const maxDateRaw = maxDateFn(allDates);

        // Add padding (3 days before, 7 days after)
        const rangeStart = addDays(startOfDay(minDateRaw), -3);
        const rangeEnd = addDays(endOfDay(maxDateRaw), 7);

        const dateRange = eachDayOfInterval({ start: rangeStart, end: rangeEnd });

        // Sort tasks
        const sorted = [...filteredTasks].sort((a, b) => {
            const statusOrder = [TaskStatus.IN_PROGRESS, TaskStatus.TODO, TaskStatus.REVIEW, TaskStatus.DONE];
            const statDiff = statusOrder.indexOf(a.status) - statusOrder.indexOf(b.status);
            if (statDiff !== 0) return statDiff;
            return new Date(a.dueDate!).getTime() - new Date(b.dueDate!).getTime();
        });

        return {
            processedTasks: sorted,
            dateRange,
            totalDays: dateRange.length,
            startDate: rangeStart
        };
    }, [tasks, searchQuery]);

    // --- Helpers ---
    const getStatusColor = (status: TaskStatus) => {
        const colors = {
            [TaskStatus.TODO]: 'bg-zinc-500',
            [TaskStatus.IN_PROGRESS]: 'bg-blue-600',
            [TaskStatus.REVIEW]: 'bg-purple-600',
            [TaskStatus.DONE]: 'bg-emerald-600'
        };
        return colors[status] || 'bg-zinc-500';
    };


    const getTaskPosition = (task: Task) => {
        const start = startOfDay(parseISO(task.created_at || new Date().toISOString()));
        const end = endOfDay(parseISO(task.dueDate!));

        // Ensure start isn't before chart start
        const effectiveStart = start < chartStartDate ? chartStartDate : start;

        const offsetDays = differenceInDays(effectiveStart, chartStartDate);
        const durationDays = differenceInDays(end, effectiveStart) + 1;

        return {
            left: offsetDays * columnWidth,
            width: Math.max(durationDays * columnWidth, columnWidth / 2) // Minimum width half a column
        };
    };

    // Scroll to Today on mount
    useEffect(() => {
        if (containerRef.current && dateRange.length > 0) {
            const today = new Date();
            const daysToToday = differenceInDays(today, chartStartDate);
            if (daysToToday > 0) {
                // Scroll horizontally to center today (approx)
                const scrollPos = (daysToToday * columnWidth) - (containerRef.current.clientWidth / 2) + 300; // 300 is sidebar width
                containerRef.current.scrollTo({ left: Math.max(0, scrollPos), behavior: 'smooth' });
            }
        }
    }, [dateRange, chartStartDate]); // Don't add columnWidth here to avoid jumps on zoom

    if (processedTasks.length === 0 && !searchQuery) {
        return (
            <div className="h-full flex items-center justify-center bg-background/50">
                <div className="text-center max-w-md p-6">
                    <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                        <BarChart3 size={32} className="text-muted-foreground" />
                    </div>
                    <h3 className="text-lg font-semibold text-foreground mb-2">Timeline View</h3>
                    <p className="text-muted-foreground">
                        Tasks with due dates will appear here. Add a due date to your tasks to visualize your project timeline.
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="h-full flex flex-col bg-background overflow-hidden">
            {/* Toolbar */}
            <div className="flex items-center justify-between px-6 py-3 border-b border-border bg-background shrink-0">
                <div className="flex items-center gap-4">
                    <div className="relative">
                        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <input
                            type="text"
                            placeholder="Filter timeline..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-9 pr-4 py-1.5 bg-secondary/50 border border-border rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-primary w-64"
                        />
                    </div>
                    <div className="text-sm text-muted-foreground">
                        <span className="font-medium text-foreground">{processedTasks.length}</span> tasks
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <button
                        onClick={() => setColumnWidth(prev => Math.max(COLUMN_WIDTH_MIN, prev - 10))}
                        className="p-1.5 hover:bg-secondary rounded-md text-muted-foreground disabled:opacity-50"
                        disabled={columnWidth <= COLUMN_WIDTH_MIN}
                        title="Zoom Out"
                    >
                        <ZoomOut size={18} />
                    </button>
                    <div className="w-24 h-1 bg-secondary rounded-full overflow-hidden">
                        <div
                            className="h-full bg-primary/50"
                            style={{ width: `${((columnWidth - COLUMN_WIDTH_MIN) / (COLUMN_WIDTH_MAX - COLUMN_WIDTH_MIN)) * 100}%` }}
                        />
                    </div>
                    <button
                        onClick={() => setColumnWidth(prev => Math.min(COLUMN_WIDTH_MAX, prev + 10))}
                        className="p-1.5 hover:bg-secondary rounded-md text-muted-foreground disabled:opacity-50"
                        disabled={columnWidth >= COLUMN_WIDTH_MAX}
                        title="Zoom In"
                    >
                        <ZoomIn size={18} />
                    </button>
                </div>
            </div>

            {/* Gantt Container */}
            <div
                className="flex-1 overflow-auto relative custom-scrollbar"
                ref={containerRef}
            >
                <div className="flex min-h-full" style={{ width: `calc(300px + ${totalDays * columnWidth}px)` }}>

                    {/* Left Sidebar (Sticky) */}
                    <div className="sticky left-0 z-20 w-[300px] bg-background border-r border-border shrink-0 shadow-[4px_0_24px_-12px_rgba(0,0,0,0.1)]">
                        {/* Header Cell */}
                        <div className="h-12 border-b border-border flex items-center px-4 bg-muted/30 font-medium text-sm text-muted-foreground">
                            Task Details
                        </div>
                        {/* Task Rows */}
                        <div className="relative">
                            {processedTasks.map((task) => (
                                <div
                                    key={task.id}
                                    className="h-12 border-b border-border/50 flex items-center px-4 hover:bg-secondary/30 cursor-pointer group transition-colors"
                                    onClick={() => onTaskClick?.(task)}
                                >
                                    <div className="min-w-0 flex-1">
                                        <div className="flex items-center gap-2 mb-0.5">
                                            <span className={`w-1.5 h-1.5 rounded-full ${getStatusColor(task.status)}`} />
                                            <div className="text-sm font-medium text-foreground truncate">{task.title}</div>
                                        </div>
                                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                            {task.notebook && (
                                                <span className="flex items-center gap-1 opacity-80">
                                                    {task.notebook.emoji} <span className="truncate max-w-[100px]">{task.notebook.title}</span>
                                                </span>
                                            )}
                                            <span className={`px-1.5 py-0 rounded text-[10px] capitalize font-medium ${
                                                task.priority === 'high' ? 'bg-red-500/10 text-red-600' :
                                                    task.priority === 'medium' ? 'bg-orange-500/10 text-orange-600' :
                                                        'bg-green-500/10 text-green-600'
                                            }`}>
                                                {task.priority}
                                            </span>
                                        </div>
                                    </div>
                                    <ChevronRight size={14} className="opacity-0 group-hover:opacity-50 text-muted-foreground" />
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Timeline Area */}
                    <div className="flex-1 relative bg-background">

                        {/* Timeline Header (Sticky Top) */}
                        <div className="sticky top-0 z-10 h-12 border-b border-border bg-background flex select-none">
                            {dateRange.map((date, i) => {
                                const isToday = isSameDay(date, new Date());
                                const isWeekendDay = isWeekend(date);

                                return (
                                    <div
                                        key={i}
                                        className={`shrink-0 border-r border-border/30 flex flex-col items-center justify-center text-xs ${
                                            isToday ? 'bg-primary/5 text-primary font-bold' :
                                                isWeekendDay ? 'bg-muted/30 text-muted-foreground' : 'text-foreground'
                                        }`}
                                        style={{ width: columnWidth }}
                                    >
                                        <span className="opacity-70 text-[10px] uppercase mb-0.5">{format(date, 'EEE')}</span>
                                        <span className="text-sm">{format(date, 'd')}</span>
                                    </div>
                                );
                            })}
                        </div>

                        {/* Timeline Grid & Bars */}
                        <div className="relative">
                            {/* Vertical Grid Lines (Background) */}
                            <div className="absolute inset-0 flex pointer-events-none">
                                {dateRange.map((date, i) => {
                                    const isToday = isSameDay(date, new Date());
                                    return (
                                        <div
                                            key={i}
                                            className={`shrink-0 border-r border-border/20 h-full ${
                                                isWeekend(date) ? 'bg-secondary/10' : ''
                                            } ${isToday ? 'bg-primary/5' : ''}`}
                                            style={{ width: columnWidth }}
                                        >
                                            {/* Current Day Line Indicator */}
                                            {isToday && (
                                                <div className="w-px h-full bg-primary absolute left-1/2 top-0 opacity-50 shadow-[0_0_4px_rgba(0,0,0,0.2)]" />
                                            )}
                                        </div>
                                    );
                                })}
                            </div>

                            {/* Task Bars */}
                            {processedTasks.map((task) => {
                                const { left, width } = getTaskPosition(task);

                                return (
                                    <div
                                        key={task.id}
                                        className="h-12 border-b border-border/20 relative group hover:bg-secondary/5 transition-colors"
                                    >
                                        <div
                                            className={`absolute top-2.5 h-7 rounded-md shadow-sm border border-white/10 cursor-pointer flex items-center px-2 overflow-hidden transition-all hover:brightness-110 hover:shadow-md ${getStatusColor(task.status)}`}
                                            style={{
                                                left: `${left}px`,
                                                width: `${width}px`
                                            }}
                                            onClick={() => onTaskClick?.(task)}
                                        >
                                            <span className="text-white text-xs font-medium truncate sticky left-2">
                                                {task.title}
                                            </span>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default GanttChartView;