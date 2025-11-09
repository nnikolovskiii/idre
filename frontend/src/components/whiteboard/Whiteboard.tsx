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
    type Node,
    type Edge,
    type NodeChange,
    type EdgeChange,
    type Connection,
} from '@xyflow/react';
import { Undo2, Redo2, Plus, Trash2, Download, Save } from 'lucide-react';
import { useDebouncedCallback } from 'use-debounce';

import '@xyflow/react/dist/style.css';

import IdeaNode from './IdeaNode';
import TopicNode from './TopicNode';
import NoteNode from './NoteNode';

const nodeTypes = {
    ideaNode: IdeaNode,
    topicNode: TopicNode,
    noteNode: NoteNode,
};

// Updated initialNodes to include data for controlled components
const initialNodes: Node[] = [
    {
        id: '1',
        type: 'ideaNode',
        position: { x: 100, y: 300 },
        data: { idea: 'how can I make a successful saas' },
    },
    {
        id: '2',
        type: 'topicNode',
        position: { x: 500, y: 100 },
        data: {
            topics: [
                "Unlocking SaaS Success: 10 Proven Strategies for Rapid Growth",
                "The SaaS Revolution: How to Scale Your Business Like a Pro",
            ],
        },
    },
];

const initialEdges: Edge[] = [
    { id: 'e1-2', source: '1', target: '2', animated: true, style: { stroke: 'var(--border)' } },
];

type FlowState = {
    nodes: Node[];
    edges: Edge[];
};

const Toolbar = ({ onAddIdeaNode, onAddTopicNode, onAddNoteNode, onDeleteSelected, onSave, onExport }: {
    onAddIdeaNode: () => void;
    onAddTopicNode: () => void;
    onAddNoteNode: () => void;
    onDeleteSelected: () => void;
    onSave: () => void;
    onExport: () => void;
}) => (
    <div className="absolute top-6 left-6 bg-card rounded-lg shadow-sm flex items-center gap-2 p-2 border border-border z-10">
        <button onClick={onAddIdeaNode} className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-foreground hover:bg-accent hover:text-accent-foreground rounded-md transition-colors" title="Add Idea Node">
            <Plus size={16} /> <span>Idea</span>
        </button>
        <button onClick={onAddTopicNode} className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-foreground hover:bg-accent hover:text-accent-foreground rounded-md transition-colors" title="Add Topic Node">
            <Plus size={16} /> <span>Topic</span>
        </button>
        <button onClick={onAddNoteNode} className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-foreground hover:bg-accent hover:text-accent-foreground rounded-md transition-colors" title="Add Note Node">
            <Plus size={16} /> <span>Note</span>
        </button>
        <div className="w-px h-6 bg-border mx-1"></div>
        <button onClick={onDeleteSelected} className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-destructive hover:bg-destructive/10 rounded-md transition-colors" title="Delete Selected">
            <Trash2 size={16} /> <span>Delete</span>
        </button>
        <div className="w-px h-6 bg-border mx-1"></div>
        <button onClick={onSave} className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-foreground hover:bg-accent hover:text-accent-foreground rounded-md transition-colors" title="Save Whiteboard">
            <Save size={16} /> <span>Save</span>
        </button>
        <button onClick={onExport} className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-foreground hover:bg-accent hover:text-accent-foreground rounded-md transition-colors" title="Export Whiteboard">
            <Download size={16} /> <span>Export</span>
        </button>
    </div>
);

const ZoomControls = ({ onUndo, onRedo, canUndo, canRedo }: { onUndo: () => void; onRedo: () => void; canUndo: boolean; canRedo: boolean; }) => {
    const { zoomIn, zoomOut } = useReactFlow();
    const { zoom } = useViewport();

    return (
        <div className="absolute bottom-6 left-6 bg-card rounded-lg shadow-sm flex items-center text-sm font-medium border border-border z-10">
            <button onClick={() => zoomOut()} className="p-2.5 text-muted-foreground hover:text-foreground">-</button>
            <span className="p-2.5 text-foreground w-14 text-center">{Math.round(zoom * 100)}%</span>
            <button onClick={() => zoomIn()} className="p-2.5 text-muted-foreground hover:text-foreground">+</button>
            <div className="w-px h-5 bg-border mx-1"></div>
            <button onClick={onUndo} disabled={!canUndo} className="p-2.5 text-muted-foreground hover:text-foreground disabled:opacity-50 disabled:cursor-not-allowed"><Undo2 size={16} /></button>
            <button onClick={onRedo} disabled={!canRedo} className="p-2.5 text-muted-foreground hover:text-foreground disabled:opacity-50 disabled:cursor-not-allowed"><Redo2 size={16} /></button>
        </div>
    );
};

const WhiteboardComponent: React.FC = () => {
    const [nodes, setNodes] = useState<Node[]>(initialNodes);
    const [edges, setEdges] = useState<Edge[]>(initialEdges);
    const [history, setHistory] = useState<FlowState[]>([]);
    const [historyIndex, setHistoryIndex] = useState(-1);

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

    const undo = useCallback(() => {
        if (historyIndex > 0) {
            const prevState = history[historyIndex - 1];
            setNodes(prevState.nodes);
            setEdges(prevState.edges);
            setHistoryIndex(historyIndex - 1);
        }
    }, [history, historyIndex]);

    const redo = useCallback(() => {
        if (historyIndex < history.length - 1) {
            const nextState = history[historyIndex + 1];
            setNodes(nextState.nodes);
            setEdges(nextState.edges);
            setHistoryIndex(historyIndex + 1);
        }
    }, [history, historyIndex]);

    useEffect(() => {
        try {
            const savedData = localStorage.getItem('whiteboard-data');
            if (savedData) {
                const { nodes: savedNodes, edges: savedEdges } = JSON.parse(savedData);
                const initialState = { nodes: savedNodes, edges: savedEdges };
                setNodes(savedNodes);
                setEdges(savedEdges);
                setHistory([initialState]);
                setHistoryIndex(0);
            } else {
                const initialState = { nodes: initialNodes, edges: initialEdges };
                setHistory([initialState]);
                setHistoryIndex(0);
            }
        } catch (error) {
            console.error("Failed to load whiteboard data:", error);
            const initialState = { nodes: initialNodes, edges: initialEdges };
            setHistory([initialState]);
            setHistoryIndex(0);
        }
    }, []);

    const onNodesChange = useCallback((changes: NodeChange[]) => {
        const newNodes = applyNodeChanges(changes, nodes);
        setNodes(newNodes);
        // Only push to history on node removal or creation, not on drag/select
        if (changes.some(c => c.type === 'remove' || c.type === 'add')) {
            pushToHistory({ nodes: newNodes, edges });
        }
    }, [nodes, edges, pushToHistory]);

    const onEdgesChange = useCallback((changes: EdgeChange[]) => {
        const newEdges = applyEdgeChanges(changes, edges);
        setEdges(newEdges);
        pushToHistory({ nodes, edges: newEdges });
    }, [edges, nodes, pushToHistory]);

    const onConnect = useCallback((params: Connection | Edge) => {
        const newEdge = { ...params, animated: true, style: { stroke: 'var(--border)' } };
        const newEdges = addEdge(newEdge, edges);
        updateStateAndHistory({ nodes, edges: newEdges });
    }, [edges, nodes, updateStateAndHistory]);

    const updateNodeData = useDebouncedCallback((nodeId: string, data: object) => {
        const newNodes = nodes.map(node =>
            node.id === nodeId ? { ...node, data: { ...node.data, ...data } } : node
        );
        updateStateAndHistory({ nodes: newNodes, edges });
    }, 300);

    const addNode = (type: 'ideaNode' | 'topicNode' | 'noteNode') => {
        const id = `${type.replace('Node', '')}-${Date.now()}`;
        let data: any = { onDataChange: updateNodeData };
        if (type === 'ideaNode') data.idea = 'New Idea';
        if (type === 'noteNode') data.text = 'New Note...';
        if (type === 'topicNode') data.topics = ['New Topic'];

        const newNode: Node = {
            id, type,
            position: { x: Math.random() * 400 + 100, y: Math.random() * 300 + 100 },
            data,
        };
        // Inject the onDataChange handler into all existing nodes as well
        const updatedNodes = nodes.map(n => ({ ...n, data: { ...n.data, onDataChange: updateNodeData } }));
        updateStateAndHistory({ nodes: [...updatedNodes, newNode], edges });
    };

    const deleteSelectedNodes = useCallback(() => {
        const selectedNodeIds = new Set(nodes.filter(n => n.selected).map(n => n.id));
        if (selectedNodeIds.size > 0) {
            const newNodes = nodes.filter(n => !selectedNodeIds.has(n.id));
            const newEdges = edges.filter(e => !selectedNodeIds.has(e.source) && !selectedNodeIds.has(e.target));
            updateStateAndHistory({ nodes: newNodes, edges: newEdges });
        }
    }, [nodes, edges, updateStateAndHistory]);

    const saveWhiteboard = useCallback(() => {
        const whiteboardData = { nodes, edges };
        localStorage.setItem('whiteboard-data', JSON.stringify(whiteboardData));
        console.log('Whiteboard saved!');
    }, [nodes, edges]);

    const exportWhiteboard = useCallback(() => {
        const data = JSON.stringify({ nodes, edges }, null, 2);
        const blob = new Blob([data], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'whiteboard.json';
        a.click();
        URL.revokeObjectURL(url);
    }, [nodes, edges]);

    // Inject onDataChange handler into nodes on initial load and when handler changes
    useEffect(() => {
        setNodes(nds => nds.map(node => ({
            ...node,
            data: { ...node.data, onDataChange: updateNodeData }
        })));
    }, [updateNodeData]);

    return (
        <div style={{ width: '100%', height: '100%' }}>
            <Toolbar
                onAddIdeaNode={() => addNode('ideaNode')}
                onAddTopicNode={() => addNode('topicNode')}
                onAddNoteNode={() => addNode('noteNode')}
                onDeleteSelected={deleteSelectedNodes}
                onSave={saveWhiteboard}
                onExport={exportWhiteboard}
            />
            <ReactFlow
                nodes={nodes}
                edges={edges}
                onNodesChange={onNodesChange}
                onEdgesChange={onEdgesChange}
                onConnect={onConnect}
                nodeTypes={nodeTypes}
                fitView
                className="bg-background"
            >
                <Background variant={BackgroundVariant.Dots} gap={24} size={1} />
            </ReactFlow>
            <ZoomControls onUndo={undo} onRedo={redo} canUndo={historyIndex > 0} canRedo={historyIndex < history.length - 1} />
        </div>
    );
};

const Whiteboard: React.FC = () => {
    return (
        <ReactFlowProvider>
            <WhiteboardComponent />
        </ReactFlowProvider>
    );
};

export default Whiteboard;