import React, { useState, useCallback, useEffect, useRef } from 'react';
import {
    ReactFlow,
    Background,
    applyNodeChanges,
    applyEdgeChanges,
    addEdge,
    BackgroundVariant,
    ReactFlowProvider,
    useReactFlow,
    useViewport,
    getBezierPath,
    BaseEdge,
    useInternalNode,
    Position,
    type Node,
    type Edge,
    type NodeChange,
    type EdgeChange,
    type Connection,
    type EdgeProps,
    type InternalNode
} from '@xyflow/react';
import { Undo2, Redo2, Plus, Download } from 'lucide-react';
import { useDebouncedCallback } from 'use-debounce';

import '@xyflow/react/dist/style.css';

import IdeaNode from './IdeaNode';
import TopicNode from './TopicNode';
import NoteNode from './NoteNode';
import EditPanel from './EditPanel';
import { whiteboardApi } from '../../api/whiteboardApi';
import { generationApi } from '../../api/generationApi';
import { whiteboardSSEService, type WhiteboardSSEEvent } from '../../services/whiteboardSSEService';

// --- FLOATING EDGE MATH HELPERS ---
function getNodeCenter(node: InternalNode) {
    return {
        x: node.position.x + (node.measured?.width || 0) / 2,
        y: node.position.y + (node.measured?.height || 0) / 2,
    };
}

function getEdgeParams(source: InternalNode, target: InternalNode) {
    const sourceCenter = getNodeCenter(source);
    const targetCenter = getNodeCenter(target);

    return {
        sx: sourceCenter.x,
        sy: sourceCenter.y,
        tx: targetCenter.x,
        ty: targetCenter.y,
        sourcePos: getPosition(sourceCenter, targetCenter),
        targetPos: getPosition(targetCenter, sourceCenter),
    };
}

function getPosition(centerA: { x: number; y: number }, centerB: { x: number; y: number }): Position {
    const dx = centerB.x - centerA.x;
    const dy = centerB.y - centerA.y;

    if (Math.abs(dx) > Math.abs(dy)) {
        return dx > 0 ? Position.Right : Position.Left;
    }
    return dy > 0 ? Position.Bottom : Position.Top;
}

function getSmartEdgeParams(source: InternalNode, target: InternalNode) {
    const { sx, sy, tx, ty, sourcePos, targetPos } = getEdgeParams(source, target);
    const sourceIntersection = getNodeIntersection(source, tx, ty);
    const targetIntersection = getNodeIntersection(target, sx, sy);
    return {
        sx: sourceIntersection.x,
        sy: sourceIntersection.y,
        tx: targetIntersection.x,
        ty: targetIntersection.y,
        sourcePos,
        targetPos,
    };
}

function getNodeIntersection(node: InternalNode, targetX: number, targetY: number) {
    const w = (node.measured?.width || 0) / 2;
    const h = (node.measured?.height || 0) / 2;
    const x2 = node.position.x + w;
    const y2 = node.position.y + h;
    const dx = targetX - x2;
    const dy = targetY - y2;
    const tan = dy / dx;

    let x, y;
    if (Math.abs(dx) * h > Math.abs(dy) * w) {
        if (dx > 0) { x = x2 + w; y = y2 + w * tan; }
        else { x = x2 - w; y = y2 - w * tan; }
    } else {
        if (dy > 0) { y = y2 + h; x = x2 + h / tan; }
        else { y = y2 - h; x = x2 - h / tan; }
    }
    return { x, y };
}

// --- CUSTOM EDGE COMPONENT ---
const HierarchyEdge = ({ id, source, target, selected }: EdgeProps) => {
    const sourceNode = useInternalNode(source);
    const targetNode = useInternalNode(target);

    if (!sourceNode || !targetNode) return null;

    const { sx, sy, tx, ty, sourcePos, targetPos } = getSmartEdgeParams(sourceNode, targetNode);
    const [edgePath] = getBezierPath({
        sourceX: sx, sourceY: sy, sourcePosition: sourcePos,
        targetX: tx, targetY: ty, targetPosition: targetPos,
    });
    const markerId = `arrowhead-${id}`;

    return (
        <>
            <defs>
                <marker id={markerId} markerWidth="5" markerHeight="5" viewBox="0 0 10 10" refX="9" refY="5" markerUnits="strokeWidth" orient="auto">
                    <path d="M 0 0 L 10 5 L 0 10 z" className={`whiteboard-arrow ${selected ? 'selected' : ''}`} />
                </marker>
            </defs>
            <BaseEdge id={id} path={edgePath} markerEnd={`url(#${markerId})`} />
        </>
    );
};

const edgeTypes = {
    'parent-child': HierarchyEdge,
    'default': HierarchyEdge,
    'regular': HierarchyEdge,
};

const nodeTypes = {
    ideaNode: IdeaNode,
    topicNode: TopicNode,
    noteNode: NoteNode,
};

type FlowState = { nodes: Node[]; edges: Edge[]; };
interface WhiteboardProps {
    initialContent?: { nodes?: Node[]; edges?: Edge[]; };
    onContentChange?: (content: { nodes: Node[]; edges: Edge[] }) => void;
    whiteboardId?: string;
}

interface WhiteboardUpdateDetail {
    whiteboardId: string;
    nodeId: string;
    generatedContent: string;
}

interface IdeaNodeData {
    idea?: string;
    isGenerating?: boolean;
    onEdit?: (id: string) => void;
    onDataChange?: (id: string, data: any) => void;
    onCreateChild?: (parentId: string, nodeType: 'ideaNode' | 'topicNode' | 'noteNode') => void;
    onGenerate?: (parentId: string) => void;
}

interface TopicNodeData {
    topics?: string[];
    isGenerating?: boolean;
    onEdit?: (id: string) => void;
    onDataChange?: (id: string, data: any) => void;
    onCreateChild?: (parentId: string, nodeType: 'ideaNode' | 'topicNode' | 'noteNode') => void;
    onGenerate?: (parentId: string) => void;
}

interface NoteNodeData {
    text?: string;
    isGenerating?: boolean;
    onEdit?: (id: string) => void;
    onDataChange?: (id: string, data: any) => void;
    onCreateChild?: (parentId: string, nodeType: 'ideaNode' | 'topicNode' | 'noteNode') => void;
    onGenerate?: (parentId: string) => void;
}

// --- TOOLBAR & CONTROLS ---
const Toolbar = ({ onAddIdeaNode, onAddTopicNode, onAddNoteNode, onExport }: any) => (
    <div className="absolute top-6 left-6 bg-card rounded-lg shadow-sm flex items-center gap-2 p-2 border border-border z-10">
        <button onClick={onAddIdeaNode} className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-foreground hover:bg-accent hover:text-accent-foreground rounded-md transition-colors"><Plus size={16} /> <span>Idea</span></button>
        <button onClick={onAddTopicNode} className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-foreground hover:bg-accent hover:text-accent-foreground rounded-md transition-colors"><Plus size={16} /> <span>Topic</span></button>
        <button onClick={onAddNoteNode} className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-foreground hover:bg-accent hover:text-accent-foreground rounded-md transition-colors"><Plus size={16} /> <span>Note</span></button>
        <div className="w-px h-6 bg-border mx-1"></div>
        <button onClick={onExport} className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-foreground hover:bg-accent hover:text-accent-foreground rounded-md transition-colors"><Download size={16} /> <span>Export</span></button>
        <span className="text-xs text-muted-foreground ml-2 select-none">Auto-saving</span>
    </div>
);

const ZoomControls = ({ onUndo, onRedo, canUndo, canRedo }: any) => {
    const { zoomIn, zoomOut } = useReactFlow();
    const { zoom } = useViewport();
    return (
        <div className="absolute bottom-6 left-6 bg-card rounded-lg shadow-sm flex items-center text-sm font-medium border border-border z-10">
            <button onClick={() => zoomOut()} className="p-2.5 text-muted-foreground hover:text-foreground">-</button>
            <span className="p-2.5 text-foreground w-14 text-center">{Math.round(zoom * 100)}%</span>
            <button onClick={() => zoomIn()} className="p-2.5 text-muted-foreground hover:text-foreground">+</button>
            <div className="w-px h-5 bg-border mx-1"></div>
            <button onClick={onUndo} disabled={!canUndo} className="p-2.5 text-muted-foreground hover:text-foreground disabled:opacity-50"><Undo2 size={16} /></button>
            <button onClick={onRedo} disabled={!canRedo} className="p-2.5 text-muted-foreground hover:text-foreground disabled:opacity-50"><Redo2 size={16} /></button>
        </div>
    );
};

// --- MAIN COMPONENT ---
const WhiteboardComponent: React.FC<WhiteboardProps> = ({ initialContent, onContentChange, whiteboardId }) => {

    // --- 1. STATE DEFINITIONS ---
    const [nodes, setNodes] = useState<Node[]>([]);
    const [edges, setEdges] = useState<Edge[]>(initialContent?.edges || []);
    const [history, setHistory] = useState<FlowState[]>([{ nodes: [], edges: [] }]);
    const [historyIndex, setHistoryIndex] = useState(0);
    const [editingNodeId, setEditingNodeId] = useState<string | null>(null);

    // --- FIX: Use Ref to track nodes synchronously for callbacks ---
    const nodesRef = useRef<Node[]>(nodes);
    // Keep the ref synced with state
    useEffect(() => {
        nodesRef.current = nodes;
    }, [nodes]);

    // --- 2. CALLBACKS DEFINITIONS ---

    // Manual Update (Typing in EditPanel)
    const updateNodeData = useCallback((nodeId: string, data: object) => {
        setNodes((nds) => nds.map((node) => {
            if (node.id === nodeId) {
                return { ...node, data: { ...node.data, ...data } };
            }
            return node;
        }));
    }, []);

    const handleEditNode = useCallback((id: string) => {
        setEditingNodeId(id);
    }, []);

    // Helper to attach callbacks to a node (used when creating new nodes or loading)
    const enrichNode = useCallback((node: Node) => {
        return {
            ...node,
            data: {
                ...node.data,
                onEdit: handleEditNode,
                onDataChange: updateNodeData,
                onCreateChild: (pid: string, type: any) => handleCreateChildNode(pid, type),
                onGenerate: (pid: string) => handleGenerateNode(pid)
            }
        };
    }, [handleEditNode, updateNodeData]); // Dependencies will be added below

    // Handle History
    const pushToHistory = useCallback((state: FlowState) => {
        setHistory(prev => {
            const newHistory = prev.slice(0, historyIndex + 1);
            newHistory.push(state);
            return newHistory;
        });
        setHistoryIndex(prev => prev + 1);
    }, [historyIndex]);

    const updateStateAndHistory = useCallback((newState: FlowState) => {
        setNodes(newState.nodes);
        setEdges(newState.edges);
        pushToHistory(newState);
    }, [pushToHistory]);

    // Create Child (API)
    const handleCreateChildNode = useCallback(async (parentId: string, nodeType: 'ideaNode' | 'topicNode' | 'noteNode') => {
        if (!whiteboardId) return;
        try {
            const response = await whiteboardApi.createChildNode(whiteboardId, { node_type: nodeType, parent_id: parentId });
            if (response.status === 'success' && response.updated_content) {
                // Enrich incoming nodes with handlers
                const newNodes = (response.updated_content.nodes || []).map(enrichNode);
                const newEdges = (response.updated_content.edges || []).map((e: Edge) => ({ ...e, type: 'parent-child' }));

                updateStateAndHistory({ nodes: newNodes, edges: newEdges });
                if (response.node_id) setEditingNodeId(response.node_id);
            }
        } catch (error) {
            console.error('Failed to create child node:', error);
        }
    }, [whiteboardId, enrichNode, updateStateAndHistory]);

    // Generate Node (API)
    const handleGenerateNode = useCallback(async (parentId: string) => {
        if (!whiteboardId) return;
        try {
            // 1. Create loading node
            const response = await whiteboardApi.createChildNode(whiteboardId, {
                node_type: 'ideaNode',
                parent_id: parentId,
                position: { x: 0, y: 0 },
                content: { idea: '', isGenerating: true }
            });

            if (response.status === 'success' && response.updated_content && response.node_id) {
                const newNodes = (response.updated_content.nodes || []).map(enrichNode);
                const newEdges = (response.updated_content.edges || []).map((e: Edge) => ({ ...e, type: 'parent-child' }));

                updateStateAndHistory({ nodes: newNodes, edges: newEdges });

                // --- FIX: Use nodesRef to get fresh parent content ---
                const parentNode = nodesRef.current.find(n => n.id === parentId);
                const d = parentNode?.data as any;

                let content = '';
                if (d) {
                    if (d.idea) content = `Idea: ${d.idea}`;
                    else if (d.topics && Array.isArray(d.topics)) content = `Topics: ${d.topics.join(', ')}`;
                    else if (d.text) content = `Note: ${d.text}`;
                }

                // Debug log to confirm content is caught
                console.log("Sending Generation Request to AI. Parent Content:", content || "(Empty)");

                // Trigger AI
                await generationApi.sendStatelessGenerationRequest({
                    whiteboard_id: whiteboardId,
                    node_id: response.node_id,
                    parent_id: parentId,
                    node_type: 'ideaNode',
                    parent_content: content
                });
            }
        } catch (error) {
            console.error('Failed to generate:', error);
        }
    }, [whiteboardId, enrichNode, updateStateAndHistory]); // No 'nodes' dependency

    // --- 3. EFFECTS ---

    // Initialize Content ONCE
    useEffect(() => {
        if (initialContent?.nodes) {
            const enriched = initialContent.nodes.map(enrichNode);
            setNodes(enriched);
            setEdges(initialContent.edges || []);
            setHistory([{ nodes: enriched, edges: initialContent.edges || [] }]);
        }
    }, [initialContent, enrichNode]);

    // Auto-Save
    const debouncedSave = useDebouncedCallback((content: { nodes: Node[]; edges: Edge[] }) => {
        if (onContentChange) onContentChange(content);
    }, 1000);

    useEffect(() => {
        if (nodes.length > 0) {
            debouncedSave({ nodes, edges });
        }
    }, [nodes, edges, debouncedSave]);

    // SSE Handling
    useEffect(() => {
        if (!whiteboardId) return;

        const handleWhiteboardEvent = (event: WhiteboardSSEEvent) => {
            if (event.event === 'whiteboard_generation_complete') {
                window.dispatchEvent(new CustomEvent('whiteboardContentUpdated', {
                    detail: {
                        whiteboardId: event.data.whiteboard_id,
                        nodeId: event.data.node_id,
                        generatedContent: event.data.generated_content
                    }
                }));
            } else if (event.event === 'whiteboard_generation_error') {
                window.dispatchEvent(new CustomEvent('whiteboardGenerationError', {
                    detail: { nodeId: event.data.node_id, error: event.data.error }
                }));
            }
        };

        const unsubscribe = whiteboardSSEService.subscribe(whiteboardId, handleWhiteboardEvent);

        const handleContentUpdate = (e: Event) => {
            try {
                const detail = (e as CustomEvent<WhiteboardUpdateDetail>).detail;

                setNodes((currentNodes) => {
                    const updatedNodes = currentNodes.map((node) => {
                        if (node.id === detail.nodeId) {
                            const newData = { ...node.data, isGenerating: false };
                            if (node.type === 'ideaNode') {
                                (newData as IdeaNodeData).idea = detail.generatedContent;
                            }
                            else if (node.type === 'noteNode') {
                                (newData as NoteNodeData).text = detail.generatedContent;
                            }
                            else if (node.type === 'topicNode') {
                                (newData as TopicNodeData).topics = detail.generatedContent.split('\n').map(t => t.trim()).filter(t => t).slice(0, 5);
                            }
                            return { ...node, data: newData };
                        }
                        return node;
                    });
                    return updatedNodes;
                });
            } catch (error) {
                console.error('Error handling content update:', error);
            }
        };

        const handleError = (e: Event) => {
            const detail = (e as CustomEvent).detail;
            setNodes(nds => nds.map(n => n.id === detail.nodeId ? { ...n, data: { ...n.data, isGenerating: false, error: true } } : n));
        };

        window.addEventListener('whiteboardContentUpdated', handleContentUpdate as EventListener);
        window.addEventListener('whiteboardGenerationError', handleError as EventListener);

        return () => {
            unsubscribe();
            window.removeEventListener('whiteboardContentUpdated', handleContentUpdate as EventListener);
            window.removeEventListener('whiteboardGenerationError', handleError as EventListener);
        };
    }, [whiteboardId]);


    // --- 4. EVENT HANDLERS (React Flow) ---

    const onNodesChange = useCallback((changes: NodeChange[]) => {
        setNodes((nds) => {
            const nextNodes = applyNodeChanges(changes, nds);
            if (changes.some(c => c.type === 'remove' || c.type === 'add')) {
                setTimeout(() => pushToHistory({ nodes: nextNodes, edges }), 0);
            }
            return nextNodes;
        });
    }, [edges, pushToHistory]);

    const onEdgesChange = useCallback((changes: EdgeChange[]) => {
        setEdges((eds) => {
            const nextEdges = applyEdgeChanges(changes, eds);
            setTimeout(() => pushToHistory({ nodes, edges: nextEdges }), 0);
            return nextEdges;
        });
    }, [nodes, pushToHistory]);

    const onConnect = useCallback((params: Connection | Edge) => {
        const newEdge = { ...params, type: 'parent-child', animated: false };
        setEdges((eds) => {
            const next = addEdge(newEdge, eds);
            updateStateAndHistory({ nodes, edges: next });
            return next;
        });
    }, [nodes, updateStateAndHistory]);

    const { x: viewX, y: viewY, zoom } = useViewport();

    const addNode = (type: 'ideaNode' | 'topicNode' | 'noteNode') => {
        const id = `${type.replace('Node', '')}-${Date.now()}`;
        let data: any = {};
        if (type === 'ideaNode') data.idea = 'New Idea';
        if (type === 'noteNode') data.text = '';
        if (type === 'topicNode') data.topics = [];

        const centerX = (-viewX + 400) / zoom;
        const centerY = (-viewY + 300) / zoom;
        const randomOffset = Math.random() * 50;

        const newNode: Node = {
            id, type,
            position: { x: centerX + randomOffset, y: centerY + randomOffset },
            data,
        };

        const enriched = enrichNode(newNode);
        const updatedNodes = [...nodes, enriched];
        updateStateAndHistory({ nodes: updatedNodes, edges });
        setEditingNodeId(id);
    };

    const handlePanelClose = () => {
        setEditingNodeId(null);
        pushToHistory({ nodes, edges });
    };

    const undo = useCallback(() => {
        if (historyIndex > 0) {
            const prevState = history[historyIndex - 1];
            setNodes(prevState.nodes.map(enrichNode));
            setEdges(prevState.edges);
            setHistoryIndex(historyIndex - 1);
        }
    }, [history, historyIndex, enrichNode]);

    const redo = useCallback(() => {
        if (historyIndex < history.length - 1) {
            const nextState = history[historyIndex + 1];
            setNodes(nextState.nodes.map(enrichNode));
            setEdges(nextState.edges);
            setHistoryIndex(historyIndex + 1);
        }
    }, [history, historyIndex, enrichNode]);

    const editingNode = nodes.find(n => n.id === editingNodeId) || null;

    return (
        <div className="whiteboard-wrapper" style={{ width: '100%', height: '100%', position: 'relative' }}>
            <Toolbar
                onAddIdeaNode={() => addNode('ideaNode')}
                onAddTopicNode={() => addNode('topicNode')}
                onAddNoteNode={() => addNode('noteNode')}
                onExport={() => {}}
            />

            <ReactFlow
                nodes={nodes}
                edges={edges}
                onNodesChange={onNodesChange}
                onEdgesChange={onEdgesChange}
                onConnect={onConnect}
                nodeTypes={nodeTypes}
                edgeTypes={edgeTypes}
                defaultViewport={{ x: 0, y: 0, zoom: 1 }}
                minZoom={0.1}
                maxZoom={2}
                className="bg-background"
                onPaneClick={handlePanelClose}
                deleteKeyCode={['Backspace', 'Delete']}
            >
                <Background variant={BackgroundVariant.Dots} gap={24} size={1} />
            </ReactFlow>

            <ZoomControls onUndo={undo} onRedo={redo} canUndo={historyIndex > 0} canRedo={historyIndex < history.length - 1} />

            <EditPanel
                node={editingNode}
                isOpen={!!editingNode}
                onClose={handlePanelClose}
                onUpdate={updateNodeData}
            />
        </div>
    );
};

const Whiteboard: React.FC<WhiteboardProps> = (props) => (
    <ReactFlowProvider>
        <WhiteboardComponent {...props} />
    </ReactFlowProvider>
);

export default Whiteboard;