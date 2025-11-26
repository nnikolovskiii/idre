import React, {useState, useCallback, useEffect, useRef} from 'react';
import {
    ReactFlow,
    Background,
    applyNodeChanges,
    applyEdgeChanges,
    addEdge,
    BackgroundVariant,
    ReactFlowProvider,
    useReactFlow,
    getBezierPath,
    BaseEdge,
    useInternalNode,
    Position,
    Controls,
    MiniMap,
    Panel,
    type Node,
    type Edge,
    type NodeChange,
    type EdgeChange,
    type Connection,
    type EdgeProps,
    type InternalNode
} from '@xyflow/react';
import {Undo2, Redo2, Download, GripVertical, BrainCircuit, Lightbulb, FileText, MousePointer2} from 'lucide-react';
import {useDebouncedCallback} from 'use-debounce';

import '@xyflow/react/dist/style.css';

import IdeaNode from './IdeaNode';
import TopicNode from './TopicNode';
import NoteNode from './NoteNode';
import EditPanel from './EditPanel';
import {whiteboardApi} from '../../api/whiteboardApi';
import {generationApi} from '../../api/generationApi';
import {whiteboardSSEService, type WhiteboardSSEEvent} from '../../services/whiteboardSSEService';

// --- MATH HELPERS ---
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
    const {sx, sy, tx, ty, sourcePos, targetPos} = getEdgeParams(source, target);
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
        if (dx > 0) {
            x = x2 + w;
            y = y2 + w * tan;
        } else {
            x = x2 - w;
            y = y2 - w * tan;
        }
    } else {
        if (dy > 0) {
            y = y2 + h;
            x = x2 + h / tan;
        } else {
            y = y2 - h;
            x = x2 - h / tan;
        }
    }
    return {x, y};
}

// --- CUSTOM EDGE ---
const HierarchyEdge = ({id, source, target, selected}: EdgeProps) => {
    const sourceNode = useInternalNode(source);
    const targetNode = useInternalNode(target);

    if (!sourceNode || !targetNode) return null;

    const {sx, sy, tx, ty, sourcePos, targetPos} = getSmartEdgeParams(sourceNode, targetNode);
    const [edgePath] = getBezierPath({
        sourceX: sx, sourceY: sy, sourcePosition: sourcePos,
        targetX: tx, targetY: ty, targetPosition: targetPos,
    });
    const markerId = `arrowhead-${id}`;

    return (
        <>
            <defs>
                <marker id={markerId} markerWidth="5" markerHeight="5" viewBox="0 0 10 10" refX="9" refY="5"
                        markerUnits="strokeWidth" orient="auto">
                    <path d="M 0 0 L 10 5 L 0 10 z" className={`whiteboard-arrow ${selected ? 'selected' : ''}`}/>
                </marker>
            </defs>
            <BaseEdge id={id} path={edgePath} markerEnd={`url(#${markerId})`}/>
        </>
    );
};

const edgeTypes = {'parent-child': HierarchyEdge, 'default': HierarchyEdge};
const nodeTypes = {ideaNode: IdeaNode, topicNode: TopicNode, noteNode: NoteNode};

// --- SIDEBAR COMPONENT ---
const Sidebar = () => {
    const onDragStart = (event: React.DragEvent, nodeType: string) => {
        event.dataTransfer.setData('application/reactflow', nodeType);
        event.dataTransfer.effectAllowed = 'move';
    };

    return (
        <Panel position="top-left"
               className="m-4 bg-card p-2 rounded-xl shadow-md border border-border flex flex-col gap-2">
            <div className="text-xs font-semibold text-muted-foreground px-2 py-1 uppercase tracking-wider">Toolbox
            </div>
            <div
                className="flex items-center gap-3 p-2 rounded-lg cursor-grab hover:bg-accent text-sm font-medium border border-transparent hover:border-border transition-all active:cursor-grabbing"
                onDragStart={(event) => onDragStart(event, 'ideaNode')}
                draggable
            >
                <div className="bg-pink-100 dark:bg-pink-900/30 p-1.5 rounded text-pink-500"><BrainCircuit size={18}/>
                </div>
                <span>Idea Node</span>
                <GripVertical size={14} className="ml-auto text-muted-foreground/50"/>
            </div>
            <div
                className="flex items-center gap-3 p-2 rounded-lg cursor-grab hover:bg-accent text-sm font-medium border border-transparent hover:border-border transition-all active:cursor-grabbing"
                onDragStart={(event) => onDragStart(event, 'topicNode')}
                draggable
            >
                <div className="bg-blue-100 dark:bg-blue-900/30 p-1.5 rounded text-blue-500"><Lightbulb size={18}/>
                </div>
                <span>Topic Group</span>
                <GripVertical size={14} className="ml-auto text-muted-foreground/50"/>
            </div>
            <div
                className="flex items-center gap-3 p-2 rounded-lg cursor-grab hover:bg-accent text-sm font-medium border border-transparent hover:border-border transition-all active:cursor-grabbing"
                onDragStart={(event) => onDragStart(event, 'noteNode')}
                draggable
            >
                <div className="bg-yellow-100 dark:bg-yellow-900/30 p-1.5 rounded text-yellow-500"><FileText size={18}/>
                </div>
                <span>Sticky Note</span>
                <GripVertical size={14} className="ml-auto text-muted-foreground/50"/>
            </div>
            <div className="h-px bg-border my-1"></div>
            <div className="px-2 text-xs text-muted-foreground flex items-center gap-2">
                <MousePointer2 size={12}/> Drag to canvas
            </div>
        </Panel>
    );
};

// --- TYPES ---
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

// --- MAIN COMPONENT ---
const WhiteboardComponent: React.FC<WhiteboardProps> = ({initialContent, onContentChange, whiteboardId}) => {
    const reactFlowWrapper = useRef<HTMLDivElement>(null);
    const {screenToFlowPosition} = useReactFlow();

    const [nodes, setNodes] = useState<Node[]>([]);
    const [edges, setEdges] = useState<Edge[]>(initialContent?.edges || []);
    const [history, setHistory] = useState<FlowState[]>([{nodes: [], edges: []}]);
    const [historyIndex, setHistoryIndex] = useState(0);
    const [editingNodeId, setEditingNodeId] = useState<string | null>(null);

    const nodesRef = useRef<Node[]>(nodes);
    useEffect(() => {
        nodesRef.current = nodes;
    }, [nodes]);

    // --- HELPER TO CALCULATE NEW POSITION ---
    const getChildPosition = (parentId: string) => {
        const parent = nodesRef.current.find(n => n.id === parentId);
        if (!parent) return {x: 0, y: 0};

        // Default to right side, slightly random Y to avoid perfect stacking
        // Use measured width if available, otherwise assume ~300px
        const parentWidth = parent.measured?.width || 300;
        const gap = 50;
        const randomYOffset = Math.random() * 100 - 50; // Random +/- 50px

        return {
            x: parent.position.x + parentWidth + gap,
            y: parent.position.y + randomYOffset
        };
    };

    // --- CALLBACKS ---

    const updateNodeData = useCallback((nodeId: string, data: object) => {
        setNodes((nds) => nds.map((node) => {
            if (node.id === nodeId) {
                return {...node, data: {...node.data, ...data}};
            }
            return node;
        }));
    }, []);

    const handleEditNode = useCallback((id: string) => setEditingNodeId(id), []);

    // 1. UPDATED: Create Child (Manually)
    const handleCreateChildNode = useCallback(async (parentId: string, nodeType: 'ideaNode' | 'topicNode' | 'noteNode') => {
        if (!whiteboardId) return;
        try {
            const position = getChildPosition(parentId); // Calculate pos

            const response = await whiteboardApi.createChildNode(whiteboardId, {
                node_type: nodeType,
                parent_id: parentId,
                position: position // Send position
            });

            if (response.status === 'success' && response.updated_content) {
                const newNodes = (response.updated_content.nodes || []).map(enrichNode);
                const newEdges = (response.updated_content.edges || []).map((e: Edge) => ({
                    ...e,
                    type: 'parent-child'
                }));
                updateStateAndHistory({nodes: newNodes, edges: newEdges});
                if (response.node_id) setEditingNodeId(response.node_id);
            }
        } catch (error) {
            console.error('Failed to create child node:', error);
        }
    }, [whiteboardId]);

    // 2. UPDATED: Generate Child (AI)
    const handleGenerateNode = useCallback(async (parentId: string) => {
        if (!whiteboardId) return;
        try {
            const position = getChildPosition(parentId); // Calculate pos

            // 1. Create loading node at the calculated position
            const response = await whiteboardApi.createChildNode(whiteboardId, {
                node_type: 'ideaNode',
                parent_id: parentId,
                position: position, // Send position
                content: {idea: '', isGenerating: true}
            });

            if (response.status === 'success' && response.updated_content && response.node_id) {
                const newNodes = (response.updated_content.nodes || []).map(enrichNode);
                const newEdges = (response.updated_content.edges || []).map((e: Edge) => ({
                    ...e,
                    type: 'parent-child'
                }));
                updateStateAndHistory({nodes: newNodes, edges: newEdges});

                // Get content for AI context
                const parentNode = nodesRef.current.find(n => n.id === parentId);
                const d = parentNode?.data as any;
                let content = '';
                if (d) {
                    if (d.idea) content = `Idea: ${d.idea}`;
                    else if (d.topics && Array.isArray(d.topics)) content = `Topics: ${d.topics.join(', ')}`;
                    else if (d.text) content = `Note: ${d.text}`;
                }

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
    }, [whiteboardId]);

    const enrichNode = useCallback((node: Node) => ({
        ...node,
        data: {
            ...node.data,
            onEdit: handleEditNode,
            onDataChange: updateNodeData,
            onCreateChild: handleCreateChildNode,
            onGenerate: handleGenerateNode
        }
    }), [handleEditNode, updateNodeData, handleCreateChildNode, handleGenerateNode]);

    // --- HISTORY MGMT ---
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

    // --- DRAG AND DROP ---
    const onDragOver = useCallback((event: React.DragEvent) => {
        event.preventDefault();
        event.dataTransfer.dropEffect = 'move';
    }, []);

    const onDrop = useCallback((event: React.DragEvent) => {
        event.preventDefault();

        const type = event.dataTransfer.getData('application/reactflow');
        if (typeof type === 'undefined' || !type) return;

        const position = screenToFlowPosition({x: event.clientX, y: event.clientY});

        const id = `${type.replace('Node', '')}-${Date.now()}`;
        let data: any = {};
        if (type === 'ideaNode') data.idea = 'New Idea';
        if (type === 'noteNode') data.text = '';
        if (type === 'topicNode') data.topics = [];

        const newNode: Node = {
            id, type, position, data
        };

        const enriched = enrichNode(newNode);
        const newNodes = nodes.concat(enriched);
        updateStateAndHistory({nodes: newNodes, edges});
        setEditingNodeId(id);
    }, [screenToFlowPosition, nodes, edges, enrichNode, updateStateAndHistory]);

    // --- EFFECTS ---
    useEffect(() => {
        if (initialContent?.nodes) {
            const enriched = initialContent.nodes.map(enrichNode);
            setNodes(enriched);
            setEdges(initialContent.edges || []);
            setHistory([{nodes: enriched, edges: initialContent.edges || []}]);
        }
    }, [initialContent, enrichNode]);

    const debouncedSave = useDebouncedCallback((content: { nodes: Node[]; edges: Edge[] }) => {
        if (onContentChange) onContentChange(content);
    }, 1000);

    useEffect(() => {
        if (nodes.length > 0) debouncedSave({nodes, edges});
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
            }
        };
        const unsubscribe = whiteboardSSEService.subscribe(whiteboardId, handleWhiteboardEvent);

        const handleContentUpdate = (e: Event) => {
            const detail = (e as CustomEvent<WhiteboardUpdateDetail>).detail;
            setNodes((currentNodes) => currentNodes.map((node) => {
                if (node.id === detail.nodeId) {
                    const newData: any = {...node.data, isGenerating: false};
                    if (node.type === 'ideaNode') newData.idea = detail.generatedContent;
                    else if (node.type === 'noteNode') newData.text = detail.generatedContent;
                    else if (node.type === 'topicNode') newData.topics = detail.generatedContent.split('\n').map(t => t.trim()).filter(t => t).slice(0, 5);
                    return {...node, data: newData};
                }
                return node;
            }));
        };

        window.addEventListener('whiteboardContentUpdated', handleContentUpdate as EventListener);
        return () => {
            unsubscribe();
            window.removeEventListener('whiteboardContentUpdated', handleContentUpdate as EventListener);
        };
    }, [whiteboardId]);

    // --- RF HANDLERS ---
    const onNodesChange = useCallback((changes: NodeChange[]) => {
        setNodes((nds) => {
            const nextNodes = applyNodeChanges(changes, nds);
            if (changes.some(c => c.type === 'remove' || c.type === 'add')) {
                setTimeout(() => pushToHistory({nodes: nextNodes, edges}), 0);
            }
            return nextNodes;
        });
    }, [edges, pushToHistory]);

    const onEdgesChange = useCallback((changes: EdgeChange[]) => {
        setEdges((eds) => {
            const nextEdges = applyEdgeChanges(changes, eds);
            setTimeout(() => pushToHistory({nodes, edges: nextEdges}), 0);
            return nextEdges;
        });
    }, [nodes, pushToHistory]);

    const onConnect = useCallback((params: Connection | Edge) => {
        setEdges((eds) => {
            const next = addEdge({...params, type: 'parent-child', animated: false}, eds);
            updateStateAndHistory({nodes, edges: next});
            return next;
        });
    }, [nodes, updateStateAndHistory]);

    const undo = () => {
        if (historyIndex > 0) {
            const prevState = history[historyIndex - 1];
            setNodes(prevState.nodes.map(enrichNode));
            setEdges(prevState.edges);
            setHistoryIndex(historyIndex - 1);
        }
    };

    const redo = () => {
        if (historyIndex < history.length - 1) {
            const nextState = history[historyIndex + 1];
            setNodes(nextState.nodes.map(enrichNode));
            setEdges(nextState.edges);
            setHistoryIndex(historyIndex + 1);
        }
    };

    const editingNode = nodes.find(n => n.id === editingNodeId) || null;

    return (
        <div className="whiteboard-wrapper w-full h-full relative" ref={reactFlowWrapper}>
            <ReactFlow
                nodes={nodes}
                edges={edges}
                onNodesChange={onNodesChange}
                onEdgesChange={onEdgesChange}
                onConnect={onConnect}
                onDrop={onDrop}
                onDragOver={onDragOver}
                nodeTypes={nodeTypes}
                edgeTypes={edgeTypes}
                defaultViewport={{x: 0, y: 0, zoom: 1}}
                minZoom={0.1}
                maxZoom={2}
                className="bg-background"
                onPaneClick={() => {
                    setEditingNodeId(null);
                    pushToHistory({nodes, edges});
                }}
                deleteKeyCode={['Backspace', 'Delete']}
                proOptions={{hideAttribution: true}}
            >
                <Background variant={BackgroundVariant.Dots} gap={24} size={1}/>
                <Sidebar/>
                <MiniMap
                    zoomable pannable
                    className="!bg-card !border-border rounded-lg overflow-hidden shadow-md"
                    maskColor="rgba(0,0,0,0.1)"
                    nodeColor={(n) => {
                        // 1. Check for custom user color first
                        if (n.data?.color) {
                            return n.data.color as string;
                        }

                        // 2. Fallback to default colors
                        if (n.type === 'ideaNode') return '#ec4899'; // Pink
                        if (n.type === 'topicNode') return '#3b82f6'; // Blue
                        return '#eab308'; // Yellow (Note)
                    }}
                />
                <Controls className="bg-card border-border shadow-md rounded-lg overflow-hidden"/>
                <Panel position="top-right" className="m-4 flex gap-2">
                    <button onClick={() => {
                    }} className="bg-card p-2 rounded-lg border border-border shadow-sm hover:bg-accent" title="Export">
                        <Download size={20}/></button>
                    <div className="flex bg-card rounded-lg border border-border shadow-sm overflow-hidden">
                        <button onClick={undo} disabled={historyIndex === 0}
                                className="p-2 hover:bg-accent disabled:opacity-50"><Undo2 size={20}/></button>
                        <div className="w-px bg-border"></div>
                        <button onClick={redo} disabled={historyIndex === history.length - 1}
                                className="p-2 hover:bg-accent disabled:opacity-50"><Redo2 size={20}/></button>
                    </div>
                </Panel>
            </ReactFlow>

            <EditPanel
                node={editingNode}
                isOpen={!!editingNode}
                onClose={() => setEditingNodeId(null)}
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