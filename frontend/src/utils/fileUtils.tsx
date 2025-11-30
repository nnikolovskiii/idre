import {
    Image as ImageIcon, Music, Video, FileCode, FileText, File as FileIcon
} from "lucide-react";

export const getFileIcon = (filename: string) => {
    const ext = filename.split('.').pop()?.toLowerCase() || '';
    if (['jpg', 'jpeg', 'png', 'gif', 'svg'].includes(ext)) return <ImageIcon size={16} className="text-blue-500" />;
    if (['mp3', 'wav', 'ogg'].includes(ext)) return <Music size={16} className="text-purple-500" />;
    if (['mp4', 'mov', 'webm'].includes(ext)) return <Video size={16} className="text-red-500" />;
    if (['js', 'ts', 'tsx', 'jsx', 'json', 'py', 'html', 'css', 'sql'].includes(ext)) return <FileCode size={16} className="text-yellow-500" />;
    if (['txt', 'md', 'doc', 'docx'].includes(ext)) return <FileText size={16} className="text-gray-500" />;
    return <FileIcon size={16} className="text-gray-400" />;
};