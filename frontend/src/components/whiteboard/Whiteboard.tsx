import React, { useState, useCallback, useEffect } from 'react';
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
    useInternalNode, // Necessary for floating edge logic
    Position,
    type Node,
    type Edge,
    type NodeChange,
    type EdgeChange,
    type Connection,
    type EdgeProps,
    type InternalNode
} from '@xyflow/react';
import { Undo2, Redo2, Plus, Trash2, Download, Save } from 'lucide-react';
import { useDebouncedCallback } from 'use-debounce';

import '@xyflow/react/dist/style.css';

import IdeaNode from './IdeaNode';
import TopicNode from './TopicNode';
import NoteNode from './NoteNode';
import EditPanel from './EditPanel';
import { whiteboardApi, type CreateChildNodeRequest } from '../../api/whiteboardApi';

// --- FLOATING EDGE MATH HELPERS ---

// Get the center of a node
function getNodeCenter(node: InternalNode) {
    return {
        x: node.position.x + (node.measured?.width || 0) / 2,
        y: node.position.y + (node.measured?.height || 0) / 2,
    };
}

// Calculate where the edge should intersect the node border
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

// Calculate which side of the node is closest
function getPosition(centerA: { x: number; y: number }, centerB: { x: number; y: number }): Position {
    const dx = centerB.x - centerA.x;
    const dy = centerB.y - centerA.y;

    if (Math.abs(dx) > Math.abs(dy)) {
        return dx > 0 ? Position.Right : Position.Left;
    }
    return dy > 0 ? Position.Bottom : Position.Top;
}

// Calculate the exact intersection point on the node border
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
        // Left or Right
        if (dx > 0) {
            x = x2 + w;
            y = y2 + w * tan;
        } else {
            x = x2 - w;
            y = y2 - w * tan;
        }
    } else {
        // Top or Bottom
        if (dy > 0) {
            y = y2 + h;
            x = x2 + h / tan;
        } else {
            y = y2 - h;
            x = x2 - h / tan;
        }
    }

    return { x, y };
}

// --- CUSTOM EDGE COMPONENT ---

const HierarchyEdge = ({ id, source, target, selected }: EdgeProps) => {
    // Get the full node objects to calculate dimensions
    const sourceNode = useInternalNode(source);
    const targetNode = useInternalNode(target);

    if (!sourceNode || !targetNode) {
        return null;
    }

    const { sx, sy, tx, ty, sourcePos, targetPos } = getSmartEdgeParams(sourceNode, targetNode);

    const [edgePath] = getBezierPath({
        sourceX: sx,
        sourceY: sy,
        sourcePosition: sourcePos,
        targetX: tx,
        targetY: ty,
        targetPosition: targetPos,
    });

    const markerId = `arrowhead-${id}`;

    return (
        <>
            <defs>
                <marker
                    id={markerId}
                    markerWidth="5"
                    markerHeight="5"
                    viewBox="0 0 10 10"
                    refX="9"
                    refY="5"
                    markerUnits="strokeWidth"
                    orient="auto"
                >
                    <path
                        d="M 0 0 L 10 5 L 0 10 z"
                        className={`whiteboard-arrow ${selected ? 'selected' : ''}`}
                    />
                </marker>
            </defs>
            <BaseEdge
                id={id}
                path={edgePath}
                markerEnd={`url(#${markerId})`}
            />
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

// ... Rest of the file is standard structure (Toolbar, WhiteboardComponent, etc.) ...
// Keep initialNodes, initialEdges, WhiteboardProps, Toolbar, ZoomControls, WhiteboardComponent exactly as they were in previous responses
// Only change was the imports at the top and the helper functions + HierarchyEdge definition above.

const initialNodes: Node[] = [];
const initialEdges: Edge[] = [];

type FlowState = {
    nodes: Node[];
    edges: Edge[];
};

interface WhiteboardProps {
    initialContent?: {
        nodes?: Node[];
        edges?: Edge[];
    };
    onContentChange?: (content: { nodes: Node[]; edges: Edge[] }) => void;
    whiteboardId?: string;
}

const Toolbar = ({ onAddIdeaNode, onAddTopicNode, onAddNoteNode, onDeleteSelected, onSave, onExport }: any) => (
    <div className="absolute top-6 left-6 bg-card rounded-lg shadow-sm flex items-center gap-2 p-2 border border-border z-10">
        <button onClick={onAddIdeaNode} className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-foreground hover:bg-accent hover:text-accent-foreground rounded-md transition-colors">
            <Plus size={16} /> <span>Idea</span>
        </button>
        <button onClick={onAddTopicNode} className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-foreground hover:bg-accent hover:text-accent-foreground rounded-md transition-colors">
            <Plus size={16} /> <span>Topic</span>
        </button>
        <button onClick={onAddNoteNode} className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-foreground hover:bg-accent hover:text-accent-foreground rounded-md transition-colors">
            <Plus size={16} /> <span>Note</span>
        </button>
        <div className="w-px h-6 bg-border mx-1"></div>
        <button onClick={onDeleteSelected} className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-destructive hover:bg-destructive/10 rounded-md transition-colors">
            <Trash2 size={16} /> <span>Delete</span>
        </button>
        <div className="w-px h-6 bg-border mx-1"></div>
        <button onClick={onSave} className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-foreground hover:bg-accent hover:text-accent-foreground rounded-md transition-colors">
            <Save size={16} /> <span>Save</span>
        </button>
        <button onClick={onExport} className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-foreground hover:bg-accent hover:text-accent-foreground rounded-md transition-colors">
            <Download size={16} /> <span>Export</span>
        </button>
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

const WhiteboardComponent: React.FC<WhiteboardProps> = ({
                                                            initialContent,
                                                            onContentChange,
                                                            whiteboardId
                                                        }) => {
    const getInitialState = (): FlowState => ({
        nodes: initialContent?.nodes || initialNodes,
        edges: initialContent?.edges || initialEdges,
    });

    const [nodes, setNodes] = useState<Node[]>(getInitialState().nodes);
    const [edges, setEdges] = useState<Edge[]>(getInitialState().edges);
    const [history, setHistory] = useState<FlowState[]>([getInitialState()]);
    const [historyIndex, setHistoryIndex] = useState(0);
    const [editingNodeId, setEditingNodeId] = useState<string | null>(null);

    const pushToHistory = useCallback((state: FlowState) => {
        const newHistory = history.slice(0, historyIndex + 1);
        newHistory.push(state);
        setHistory(newHistory);
        setHistoryIndex(newHistory.length - 1);
    }, [history, historyIndex]);

    const updateStateAndHistory = useCallback((newState: FlowState) => {
        setNodes(newState.nodes);
        setEdges(newState.edges);
        pushToHistory(newState);
    }, [pushToHistory]);

    const handleEditNode = useCallback((id: string) => {
        setEditingNodeId(id);
    }, []);

    const updateNodeData = useCallback((nodeId: string, data: object) => {
        setNodes((nds) => {
            const newNodes = nds.map((node) => {
                if (node.id === nodeId) {
                    return { ...node, data: { ...node.data, ...data } };
                }
                return node;
            });
            return newNodes;
        });
    }, []);

    const handlePanelClose = () => {
        setEditingNodeId(null);
        pushToHistory({ nodes, edges });
    };

    const handleCreateChildNode = useCallback(async (parentId: string, nodeType: 'ideaNode' | 'topicNode' | 'noteNode') => {
        if (!whiteboardId) return;

        try {
            const createRequest: CreateChildNodeRequest = {
                node_type: nodeType,
                parent_id: parentId
            };

            const response = await whiteboardApi.createChildNode(whiteboardId, createRequest);

            if (response.status === 'success' && response.updated_content) {
                const newNodes = response.updated_content.nodes || [];
                const newEdges = response.updated_content.edges || [];

                const formattedEdges = newEdges.map((e: Edge) => ({ ...e, type: 'parent-child' }));

                const updatedNodes = newNodes.map((node: Node) => ({
                    ...node,
                    data: {
                        ...node.data,
                        onEdit: handleEditNode,
                        onDataChange: updateNodeData,
                        onCreateChild: handleCreateChildNode
                    }
                }));

                updateStateAndHistory({ nodes: updatedNodes, edges: formattedEdges });

                if (response.node_id) {
                    setEditingNodeId(response.node_id);
                }
            }
        } catch (error) {
            console.error('Failed to create child node:', error);
        }
    }, [whiteboardId, handleEditNode, updateNodeData, updateStateAndHistory]);

    const injectHandlers = useCallback((nds: Node[]) => {
        return nds.map(node => ({
            ...node,
            data: {
                ...node.data,
                onEdit: handleEditNode,
                onDataChange: updateNodeData,
                onCreateChild: handleCreateChildNode
            }
        }));
    }, [handleEditNode, updateNodeData, handleCreateChildNode]);

    useEffect(() => {
        setNodes(nds => injectHandlers(nds));
    }, [handleEditNode, updateNodeData, handleCreateChildNode, injectHandlers]);

    const onNodesChange = useCallback((changes: NodeChange[]) => {
        const newNodes = applyNodeChanges(changes, nodes);
        setNodes(injectHandlers(newNodes));
        if (changes.some(c => c.type === 'remove' || c.type === 'add')) {
            pushToHistory({ nodes: newNodes, edges });
        }
    }, [nodes, edges, pushToHistory, handleEditNode, updateNodeData, injectHandlers]);

    const onEdgesChange = useCallback((changes: EdgeChange[]) => {
        const newEdges = applyEdgeChanges(changes, edges);
        setEdges(newEdges);
        pushToHistory({ nodes, edges: newEdges });
    }, [edges, nodes, pushToHistory]);

    const onConnect = useCallback((params: Connection | Edge) => {
        const newEdge = {
            ...params,
            type: 'parent-child', // Use custom edge type for intersection math
            animated: false,
        };
        const newEdges = addEdge(newEdge, edges);
        updateStateAndHistory({ nodes, edges: newEdges });
    }, [edges, nodes, updateStateAndHistory]);

    const { x: viewX, y: viewY, zoom } = useViewport();

    const addNode = (type: 'ideaNode' | 'topicNode' | 'noteNode') => {
        const id = `${type.replace('Node', '')}-${Date.now()}`;
        let data: any = { onEdit: handleEditNode };

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

        const updatedNodes = [...nodes, newNode];
        updateStateAndHistory({ nodes: updatedNodes, edges });
        setEditingNodeId(id);
    };

    const deleteSelectedNodes = useCallback(() => {
        const selectedNodeIds = new Set(nodes.filter(n => n.selected).map(n => n.id));
        if (selectedNodeIds.size > 0) {
            const newNodes = nodes.filter(n => !selectedNodeIds.has(n.id));
            const newEdges = edges.filter(e => !selectedNodeIds.has(e.source) && !selectedNodeIds.has(e.target));
            updateStateAndHistory({ nodes: newNodes, edges: newEdges });
            setEditingNodeId(null);
        }
    }, [nodes, edges, updateStateAndHistory]);

    const undo = useCallback(() => {
        if (historyIndex > 0) {
            const prevState = history[historyIndex - 1];
            setNodes(injectHandlers(prevState.nodes));
            setEdges(prevState.edges);
            setHistoryIndex(historyIndex - 1);
        }
    }, [history, historyIndex, injectHandlers]);

    const redo = useCallback(() => {
        if (historyIndex < history.length - 1) {
            const nextState = history[historyIndex + 1];
            setNodes(injectHandlers(nextState.nodes));
            setEdges(nextState.edges);
            setHistoryIndex(historyIndex + 1);
        }
    }, [history, historyIndex, injectHandlers]);

    const debouncedSave = useDebouncedCallback((content: { nodes: Node[]; edges: Edge[] }) => {
        if (onContentChange) onContentChange(content);
    }, 3000);

    useEffect(() => {
        debouncedSave({ nodes, edges });
    }, [nodes, edges, debouncedSave]);

    const editingNode = nodes.find(n => n.id === editingNodeId) || null;

    return (
        <div className="whiteboard-wrapper" style={{ width: '100%', height: '100%', position: 'relative' }}>
            <Toolbar
                onAddIdeaNode={() => addNode('ideaNode')}
                onAddTopicNode={() => addNode('topicNode')}
                onAddNoteNode={() => addNode('noteNode')}
                onDeleteSelected={deleteSelectedNodes}
                onSave={() => onContentChange?.({ nodes, edges })}
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
                onPaneClick={() => handlePanelClose()}
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

const Whiteboard: React.FC<WhiteboardProps> = (props) => {
    return (
        <ReactFlowProvider>
            <WhiteboardComponent {...props} />
        </ReactFlowProvider>
    );
};

export default Whiteboard;