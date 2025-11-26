import { formatDistanceToNow, format } from 'date-fns';

export const formatRelativeOrAbsolute = (isoString: string | null | undefined): string => {
    if (!isoString) return "—";

    const date = new Date(isoString);
    const now = new Date();
    const diffInWeeks = (now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24 * 7);

    // Less than 1 week: show relative time
    if (diffInWeeks < 1) {
        return formatDistanceToNow(date, { addSuffix: true });
    }

    // 1 week or older: show absolute date
    return format(date, 'MMM d, yyyy');
};