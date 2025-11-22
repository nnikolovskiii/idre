from typing import List, Optional, Dict, Any
from sqlalchemy.ext.asyncio import AsyncSession
import time

from backend.models.whiteboard import Whiteboard
from backend.models.dtos.whiteboard_dtos import (
    WhiteboardCreateRequest,
    WhiteboardUpdateRequest,
    WhiteboardSearchRequest,
    WhiteboardResponse,
    NodeHierarchyUpdate,
    CreateChildNodeRequest,
    NodeHierarchyResponse,
    ValidateHierarchyRequest,
    HierarchyValidationResponse
)
from backend.repositories.whiteboard_repository import WhiteboardRepository


class WhiteboardService:
    """
    Service for handling whiteboard-related business logic, validation,
    and orchestration of whiteboard operations.
    """

    def __init__(self, session: AsyncSession, whiteboard_repository: WhiteboardRepository):
        self.session = session
        self.repo = whiteboard_repository

    @staticmethod
    def sanitize_content(content: Dict[str, Any]) -> Dict[str, Any]:
        """
        Sanitize and validate whiteboard content.
        """
        if content is None:
            return {}

        if not isinstance(content, dict):
            raise ValueError("Content must be a dictionary")

        return content

    async def create_whiteboard(
        self,
        user_id: str,
        notebook_id: str,
        whiteboard_data: WhiteboardCreateRequest
    ) -> Whiteboard:
        """
        Create a new whiteboard with validation and business logic.
        """
        # Validate and sanitize input data
        title = whiteboard_data.title.strip()
        if not title:
            raise ValueError("Whiteboard title cannot be empty")

        content = self.sanitize_content(whiteboard_data.content) if whiteboard_data.content else {}
        thumbnail_url = whiteboard_data.thumbnail_url.strip() if whiteboard_data.thumbnail_url else None

        whiteboard_record = await self.repo.create(
            user_id=user_id,
            notebook_id=notebook_id,
            title=title,
            content=content,
            thumbnail_url=thumbnail_url
        )

        await self.session.commit()
        await self.session.refresh(whiteboard_record)

        return whiteboard_record

    async def get_whiteboards_for_user(
        self,
        user_id: str,
        notebook_id: Optional[str] = None,
        limit: int = 100,
        offset: int = 0
    ) -> List[Whiteboard]:
        """
        Retrieve whiteboards for a user with optional filtering.
        """
        return await self.repo.list_by_user_id(
            user_id=user_id,
            notebook_id=notebook_id,
            limit=limit,
            offset=offset
        )

    async def get_whiteboard_by_id(self, user_id: str, whiteboard_id: str) -> Optional[Whiteboard]:
        """
        Get a single whiteboard by ID for a specific user.
        """
        return await self.repo.get_by_id_and_user(whiteboard_id=whiteboard_id, user_id=user_id)

    async def update_whiteboard(
        self,
        user_id: str,
        whiteboard_id: str,
        whiteboard_data: WhiteboardUpdateRequest
    ) -> Optional[Whiteboard]:
        """
        Update a whiteboard with validation and business logic.
        """
        # First verify ownership
        existing_whiteboard = await self.repo.get_by_id_and_user(whiteboard_id=whiteboard_id, user_id=user_id)
        if not existing_whiteboard:
            return None

        # Prepare updates dictionary with only non-None values
        updates = {}

        if whiteboard_data.title is not None:
            title = whiteboard_data.title.strip()
            if not title:
                raise ValueError("Whiteboard title cannot be empty")
            updates['title'] = title

        if whiteboard_data.content is not None:
            updates['content'] = self.sanitize_content(whiteboard_data.content)

        if whiteboard_data.thumbnail_url is not None:
            updates['thumbnail_url'] = whiteboard_data.thumbnail_url.strip() if whiteboard_data.thumbnail_url else None

        if not updates:
            return existing_whiteboard  # No updates to apply

        updated_whiteboard = await self.repo.update(whiteboard_id=whiteboard_id, updates=updates)

        if updated_whiteboard:
            await self.session.commit()
            await self.session.refresh(updated_whiteboard)

        return updated_whiteboard

    async def update_whiteboard_content(
        self,
        user_id: str,
        whiteboard_id: str,
        content: Dict[str, Any]
    ) -> Optional[Whiteboard]:
        """
        Update just the content of a whiteboard (for auto-save functionality).
        """
        # First verify ownership
        existing_whiteboard = await self.repo.get_by_id_and_user(whiteboard_id=whiteboard_id, user_id=user_id)
        if not existing_whiteboard:
            return None

        # Validate and update content
        sanitized_content = self.sanitize_content(content)
        updates = {'content': sanitized_content}

        updated_whiteboard = await self.repo.update(whiteboard_id=whiteboard_id, updates=updates)

        if updated_whiteboard:
            await self.session.commit()
            await self.session.refresh(updated_whiteboard)

        return updated_whiteboard

    async def delete_whiteboard(self, user_id: str, whiteboard_id: str) -> bool:
        """
        Delete a whiteboard for a specific user.
        """
        # Verify ownership first
        existing_whiteboard = await self.repo.get_by_id_and_user(whiteboard_id=whiteboard_id, user_id=user_id)
        if not existing_whiteboard:
            return False

        # Delete the whiteboard
        success = await self.repo.delete(whiteboard_id=whiteboard_id)
        if success:
            await self.session.commit()

        return success

    async def search_whiteboards(
        self,
        user_id: str,
        search_data: WhiteboardSearchRequest,
        notebook_id: Optional[str] = None
    ) -> List[Whiteboard]:
        """
        Search whiteboards with multiple filter criteria.
        """
        return await self.repo.search_whiteboards(
            user_id=user_id,
            notebook_id=notebook_id,
            query=search_data.query,
            limit=search_data.limit,
            offset=search_data.offset
        )

    async def get_whiteboard_statistics(
        self,
        user_id: str,
        notebook_id: Optional[str] = None
    ) -> Dict[str, int]:
        """
        Get whiteboard statistics for a user/notebook.
        """
        total_count = await self.repo.count_by_user_and_filters(
            user_id=user_id,
            notebook_id=notebook_id
        )

        return {
            'total': total_count
        }

    def whiteboard_to_response(self, whiteboard: Whiteboard) -> WhiteboardResponse:
        """
        Convert a Whiteboard entity to WhiteboardResponse DTO.
        """
        return WhiteboardResponse(
            id=whiteboard.id,
            user_id=whiteboard.user_id,
            notebook_id=whiteboard.notebook_id,
            title=whiteboard.title,
            content=whiteboard.content or {},
            thumbnail_url=whiteboard.thumbnail_url,
            created_at=whiteboard.created_at,
            updated_at=whiteboard.updated_at
        )

    # Hierarchy Management Methods

    def validate_hierarchy(
        self,
        content: Dict[str, Any],
        node_id: str,
        proposed_parent_id: Optional[str]
    ) -> HierarchyValidationResponse:
        """
        Validate hierarchy changes to prevent circular references.
        """
        nodes = content.get('nodes', [])
        node_map = {node['id']: node for node in nodes}

        if node_id not in node_map:
            return HierarchyValidationResponse(
                is_valid=False,
                message=f"Node {node_id} not found",
                circular_reference_path=None
            )

        # If removing parent (setting to root), always valid
        if proposed_parent_id is None:
            return HierarchyValidationResponse(
                is_valid=True,
                message="Valid: Moving node to root level",
                circular_reference_path=None
            )

        # If proposed parent doesn't exist
        if proposed_parent_id not in node_map:
            return HierarchyValidationResponse(
                is_valid=False,
                message=f"Parent node {proposed_parent_id} not found",
                circular_reference_path=None
            )

        # Check for circular reference by traversing up from proposed parent
        current_id = proposed_parent_id
        path = [node_id, proposed_parent_id]

        while current_id in node_map:
            current_node = node_map[current_id]
            current_parent_id = current_node.get('data', {}).get('parentId')

            if current_parent_id is None:
                break

            if current_parent_id == node_id:
                return HierarchyValidationResponse(
                    is_valid=False,
                    message="Circular reference detected",
                    circular_reference_path=path
                )

            path.append(current_parent_id)
            current_id = current_parent_id

        return HierarchyValidationResponse(
            is_valid=True,
            message="Valid hierarchy relationship",
            circular_reference_path=None
        )

    def update_node_hierarchy(
        self,
        content: Dict[str, Any],
        hierarchy_update: NodeHierarchyUpdate
    ) -> NodeHierarchyResponse:
        """
        Update parent-child relationships between nodes.
        """
        # Validate the hierarchy change first
        validation = self.validate_hierarchy(
            content,
            hierarchy_update.node_id,
            hierarchy_update.parent_id
        )

        if not validation.is_valid:
            return NodeHierarchyResponse(
                status="error",
                message=validation.message,
                updated_content=None,
                node_id=None
            )

        nodes = content.get('nodes', [])
        edges = content.get('edges', [])

        # Find the node to update
        node_index = None
        for i, node in enumerate(nodes):
            if node['id'] == hierarchy_update.node_id:
                node_index = i
                break

        if node_index is None:
            return NodeHierarchyResponse(
                status="error",
                message=f"Node {hierarchy_update.node_id} not found",
                updated_content=None,
                node_id=None
            )

        # Update the node's parent
        nodes[node_index]['data']['parentId'] = hierarchy_update.parent_id

        # Update children order if provided
        if hierarchy_update.children_order is not None:
            nodes[node_index]['data']['childrenOrder'] = hierarchy_update.children_order

        # Create or update parent-child edge if parent is set
        if hierarchy_update.parent_id:
            # Remove any existing parent-child edges for this node
            edges = [
                edge for edge in edges
                if not (
                    edge.get('type') == 'parent-child' and
                    edge['target'] == hierarchy_update.node_id
                )
            ]

            # Add new parent-child edge
            new_edge = {
                'id': f"pc-{hierarchy_update.parent_id}-{hierarchy_update.node_id}",
                'source': hierarchy_update.parent_id,
                'target': hierarchy_update.node_id,
                'type': 'parent-child',
                'style': {
                    'stroke': 'hsl(var(--primary))',
                    'strokeWidth': 3,
                    'opacity': 0.8
                },
                'animated': False
            }
            edges.append(new_edge)
        else:
            # Remove parent-child edges if moving to root
            edges = [
                edge for edge in edges
                if not (
                    edge.get('type') == 'parent-child' and
                    edge['target'] == hierarchy_update.node_id
                )
            ]

        updated_content = {
            'nodes': nodes,
            'edges': edges
        }

        return NodeHierarchyResponse(
            status="success",
            message=f"Updated hierarchy for node {hierarchy_update.node_id}",
            updated_content=updated_content,
            node_id=hierarchy_update.node_id
        )

    def create_child_node(
        self,
        content: Dict[str, Any],
        request: CreateChildNodeRequest
    ) -> NodeHierarchyResponse:
        """
        Create a new node as a child of an existing node.
        """
        nodes = content.get('nodes', [])
        edges = content.get('edges', [])

        # Find parent node
        parent_node = None
        for node in nodes:
            if node['id'] == request.parent_id:
                parent_node = node
                break

        if not parent_node:
            return NodeHierarchyResponse(
                status="error",
                message=f"Parent node {request.parent_id} not found",
                updated_content=None,
                node_id=None
            )

        # Generate new node ID
        new_node_id = f"{request.node_type.replace('Node', '')}-{int(time.time() * 1000)}"

        # Prepare node data
        node_data = {
            'parentId': request.parent_id,
            'childrenOrder': []
        }

        # Add type-specific content
        if request.content:
            node_data.update(request.content)
        else:
            if request.node_type == 'ideaNode':
                node_data['idea'] = 'New Child Idea'
            elif request.node_type == 'topicNode':
                node_data['topics'] = []
            elif request.node_type == 'noteNode':
                node_data['text'] = ''

        # Calculate position (below parent if not specified)
        if request.position:
            position = request.position
        else:
            parent_pos = parent_node.get('position', {'x': 0, 'y': 0})
            position = {
                'x': parent_pos['x'] + 50,  # Offset to the right
                'y': parent_pos['y'] + 100  # Offset below
            }

        # Create new node
        new_node = {
            'id': new_node_id,
            'type': request.node_type,
            'position': position,
            'data': node_data
        }

        # Add node to list
        nodes.append(new_node)

        # Create parent-child edge
        new_edge = {
            'id': f"pc-{request.parent_id}-{new_node_id}",
            'source': request.parent_id,
            'target': new_node_id,
            'type': 'parent-child',
            'style': {
                'stroke': 'hsl(var(--primary))',
                'strokeWidth': 3,
                'opacity': 0.8
            },
            'animated': False
        }
        edges.append(new_edge)

        # Update parent's children order
        parent_children_order = parent_node.get('data', {}).get('childrenOrder', [])
        if new_node_id not in parent_children_order:
            parent_children_order.append(new_node_id)
            # Update parent node
            for i, node in enumerate(nodes):
                if node['id'] == request.parent_id:
                    nodes[i]['data']['childrenOrder'] = parent_children_order
                    break

        updated_content = {
            'nodes': nodes,
            'edges': edges
        }

        return NodeHierarchyResponse(
            status="success",
            message=f"Created child node {new_node_id}",
            updated_content=updated_content,
            node_id=new_node_id
        )