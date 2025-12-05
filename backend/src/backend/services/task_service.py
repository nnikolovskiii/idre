from typing import List, Optional, Dict, Any
from datetime import datetime, date
from sqlalchemy.ext.asyncio import AsyncSession

from backend.models.task import Task, TaskStatus, TaskPriority
from backend.models.dtos.task_dtos import (
    TaskCreateRequest,
    TaskUpdateRequest,
    TaskMoveRequest,
    TaskReorderRequest,
    TaskSearchRequest,
    TaskResponse
)
from backend.repositories.task_repository import TaskRepository


class TaskService:
    """
    Service for handling task-related business logic, validation,
    and orchestration of task operations.
    """

    def __init__(self, session: AsyncSession, task_repository: TaskRepository):
        self.session = session
        self.repo = task_repository

    @staticmethod
    def validate_task_status(status: str) -> TaskStatus:
        """
        Validate and convert status string to TaskStatus enum.
        """
        try:
            return TaskStatus(status)
        except ValueError:
            raise ValueError(f"Invalid status '{status}'. Must be one of: {list(TaskStatus)}")

    @staticmethod
    def validate_task_priority(priority: str) -> TaskPriority:
        """
        Validate and convert priority string to TaskPriority enum.
        """
        try:
            return TaskPriority(priority)
        except ValueError:
            raise ValueError(f"Invalid priority '{priority}'. Must be one of: {list(TaskPriority)}")

    @staticmethod
    def sanitize_tags(tags: List[str]) -> List[str]:
        """
        Sanitize tag list by trimming whitespace and removing empty tags.
        """
        if not tags:
            return []
        return [tag.strip() for tag in tags if tag.strip()]

    @staticmethod
    def validate_due_date(due_date: date) -> date:
        """
        Validate due date is not in the past (optional business rule).
        """
        if due_date and due_date < date.today():
            # This is optional - you might want to allow past due dates
            pass
        return due_date

    async def create_task(
        self,
        user_id: str,
        notebook_id: str,
        task_data: TaskCreateRequest
    ) -> Task:
        """
        Create a new task with validation and business logic.
        """
        # Validate and sanitize input data
        title = task_data.title.strip()
        if not title:
            raise ValueError("Task title cannot be empty")

        description = task_data.description.strip() if task_data.description else None
        status = self.validate_task_status(task_data.status.value) if task_data.status else TaskStatus.TODO
        priority = self.validate_task_priority(task_data.priority.value) if task_data.priority else TaskPriority.MEDIUM
        tags = self.sanitize_tags(task_data.tags) if task_data.tags else []
        due_date = self.validate_due_date(task_data.due_date) if task_data.due_date else None

        # Get the next position for this status in the notebook
        existing_tasks = await self.repo.get_tasks_by_status_and_user(
            user_id=user_id,
            notebook_id=notebook_id,
            status=status
        )
        position = len(existing_tasks)

        task_record = await self.repo.create(
            user_id=user_id,
            notebook_id=notebook_id,
            title=title,
            description=description,
            status=status,
            priority=priority,
            tags=tags,
            due_date=due_date,
            position=position
        )

        await self.session.commit()
        await self.session.refresh(task_record)

        return task_record

    async def get_tasks_for_user(
        self,
        user_id: str,
        notebook_id: Optional[str] = None,
        status: Optional[TaskStatus] = None,
        priority: Optional[TaskPriority] = None,
        tags: Optional[List[str]] = None,
        limit: int = 100,
        offset: int = 0,
        include_archived: bool = False
    ) -> List[Task]:
        """
        Retrieve tasks for a user with optional filtering.
        """
        return await self.repo.list_by_user_id(
            user_id=user_id,
            notebook_id=notebook_id,
            status=status,
            priority=priority,
            tags=tags,
            limit=limit,
            offset=offset,
            include_archived=include_archived
        )

    async def get_task_by_id(self, user_id: str, task_id: str) -> Optional[Task]:
        """
        Get a single task by ID for a specific user.
        """
        return await self.repo.get_by_id_and_user(task_id=task_id, user_id=user_id)

    async def update_task(
        self,
        user_id: str,
        task_id: str,
        task_data: TaskUpdateRequest
    ) -> Optional[Task]:
        """
        Update a task with validation and business logic.
        """
        # First verify ownership
        existing_task = await self.repo.get_by_id_and_user(task_id=task_id, user_id=user_id)
        if not existing_task:
            return None

        # Prepare updates dictionary with only non-None values
        updates = {}

        if task_data.title is not None:
            title = task_data.title.strip()
            if not title:
                raise ValueError("Task title cannot be empty")
            updates['title'] = title

        if task_data.description is not None:
            updates['description'] = task_data.description.strip() if task_data.description else None

        if task_data.status is not None:
            updates['status'] = self.validate_task_status(task_data.status.value)

        if task_data.priority is not None:
            updates['priority'] = self.validate_task_priority(task_data.priority.value)

        if task_data.tags is not None:
            updates['tags'] = self.sanitize_tags(task_data.tags)

        if task_data.due_date is not None:
            updates['due_date'] = self.validate_due_date(task_data.due_date)

        if task_data.position is not None:
            if task_data.position < 0:
                raise ValueError("Position must be non-negative")
            updates['position'] = task_data.position

        if not updates:
            return existing_task  # No updates to apply

        updated_task = await self.repo.update(task_id=task_id, updates=updates)

        if updated_task:
            await self.session.commit()
            await self.session.refresh(updated_task)

        return updated_task

    async def move_task(
        self,
        user_id: str,
        task_id: str,
        move_data: TaskMoveRequest
    ) -> Optional[Task]:
        """
        Move a task to a different column/status with position management.
        """
        # Verify ownership first
        existing_task = await self.repo.get_by_id_and_user(task_id=task_id, user_id=user_id)
        if not existing_task:
            return None

        new_status = self.validate_task_status(move_data.status.value)

        # Get all tasks in the target column to determine position
        target_tasks = await self.repo.get_tasks_by_status_and_user(
            user_id=user_id,
            notebook_id=str(existing_task.notebook_id),
            status=new_status
        )

        # If no position specified, put at the end
        new_position = move_data.position if move_data.position is not None else len(target_tasks)

        updated_task = await self.repo.move_task(
            task_id=task_id,
            new_status=new_status,
            new_position=new_position
        )

        if updated_task:
            await self.session.commit()
            await self.session.refresh(updated_task)

        return updated_task

    async def reorder_task(
        self,
        user_id: str,
        task_id: str,
        reorder_data: TaskReorderRequest
    ) -> Optional[Task]:
        """
        Reorder a task within its current column.
        """
        # Verify ownership first
        existing_task = await self.repo.get_by_id_and_user(task_id=task_id, user_id=user_id)
        if not existing_task:
            return None

        if reorder_data.position < 0:
            raise ValueError("Position must be non-negative")

        # Move task within the same status
        updated_task = await self.repo.move_task(
            task_id=task_id,
            new_status=existing_task.status,
            new_position=reorder_data.position
        )

        if updated_task:
            await self.session.commit()
            await self.session.refresh(updated_task)

        return updated_task

    async def delete_task(self, user_id: str, task_id: str) -> bool:
        """
        Delete a task for a specific user.
        """
        # Verify ownership first
        existing_task = await self.repo.get_by_id_and_user(task_id=task_id, user_id=user_id)
        if not existing_task:
            return False

        # Delete the task
        success = await self.repo.delete(task_id=task_id)
        if success:
            await self.session.commit()

        return success

    async def archive_task(self, user_id: str, task_id: str) -> Optional[Task]:
        """
        Archive a task for a specific user.
        """
        # Verify ownership first
        existing_task = await self.repo.get_by_id_and_user(task_id=task_id, user_id=user_id)
        if not existing_task:
            return None

        if existing_task.archived:
            return existing_task  # Already archived

        # Archive the task
        updated_task = await self.repo.update(task_id=task_id, updates={'archived': True})
        if updated_task:
            await self.session.commit()
            await self.session.refresh(updated_task)

        return updated_task

    async def unarchive_task(self, user_id: str, task_id: str) -> Optional[Task]:
        """
        Unarchive a task for a specific user.
        """
        # Verify ownership first
        existing_task = await self.repo.get_by_id_and_user(task_id=task_id, user_id=user_id)
        if not existing_task:
            return None

        if not existing_task.archived:
            return existing_task  # Already active

        # Unarchive the task
        updated_task = await self.repo.update(task_id=task_id, updates={'archived': False})
        if updated_task:
            await self.session.commit()
            await self.session.refresh(updated_task)

        return updated_task

    async def search_tasks(
        self,
        user_id: str,
        search_data: TaskSearchRequest,
        notebook_id: Optional[str] = None
    ) -> List[Task]:
        """
        Search tasks with multiple filter criteria.
        """
        # Convert enum values if provided
        status = self.validate_task_status(search_data.status.value) if search_data.status else None
        priority = self.validate_task_priority(search_data.priority.value) if search_data.priority else None

        return await self.repo.search_tasks(
            user_id=user_id,
            notebook_id=notebook_id,
            query=search_data.query,
            status=status,
            priority=priority,
            tags=search_data.tags,
            has_due_date=search_data.has_due_date,
            is_overdue=search_data.is_overdue,
            limit=search_data.limit,
            offset=search_data.offset
        )

    async def get_tasks_for_user_across_notebooks(
        self,
        user_id: str,
        status: Optional[TaskStatus] = None,
        priority: Optional[TaskPriority] = None,
        tags: Optional[List[str]] = None,
        notebook_id: Optional[str] = None,
        limit: int = 1000,
        offset: int = 0,
        include_archived: bool = False
    ) -> List[Task]:
        """
        Retrieve tasks for a user across all notebooks with optional filtering.
        """
        return await self.repo.list_by_user_id_without_notebook_filter(
            user_id=user_id,
            notebook_id=notebook_id,
            status=status,
            priority=priority,
            tags=tags,
            limit=limit,
            offset=offset,
            include_archived=include_archived
        )

    async def get_task_statistics(
        self,
        user_id: str,
        notebook_id: Optional[str] = None
    ) -> Dict[str, int]:
        """
        Get task statistics for a user/notebook.
        """
        stats = {}
        total = 0

        for status in TaskStatus:
            count = await self.repo.count_by_user_and_filters(
                user_id=user_id,
                notebook_id=notebook_id,
                status=status
            )
            stats[status.value] = count
            total += count

        stats['total'] = total
        return stats

    def task_to_response(self, task: Task) -> TaskResponse:
        """
        Convert a Task entity to TaskResponse DTO.
        """
        return TaskResponse(
            id=task.id,
            user_id=task.user_id,
            notebook_id=task.notebook_id,
            title=task.title,
            description=task.description,
            status=task.status,
            priority=task.priority,
            tags=task.tags or [],
            due_date=task.due_date.date() if task.due_date else None,
            position=task.position,
            archived=task.archived,
            created_at=task.created_at,
            updated_at=task.updated_at,
            status_display=task.status_display,
            priority_display=task.priority_display,
            is_overdue=task.is_overdue
        )

    async def task_to_response_with_notebook(self, task: Task) -> dict:
        """
        Convert a Task entity to response dict including notebook information.
        """
        from backend.repositories.notebook_repository import NotebookRepository
        notebook_repo = NotebookRepository(self.session)

        # Get notebook information
        notebook = await notebook_repo.get_by_id(task.notebook_id)

        return {
            "id": task.id,
            "user_id": task.user_id,
            "notebook_id": task.notebook_id,
            "title": task.title,
            "description": task.description,
            "status": task.status,
            "priority": task.priority,
            "tags": task.tags or [],
            "due_date": task.due_date.date() if task.due_date else None,
            "position": task.position,
            "archived": task.archived,
            "created_at": task.created_at,
            "updated_at": task.updated_at,
            "status_display": task.status_display,
            "priority_display": task.priority_display,
            "is_overdue": task.is_overdue,
            "notebook": {
                "id": notebook.id if notebook else task.notebook_id,
                "title": notebook.title if notebook else "Unknown Notebook",
                "emoji": notebook.emoji if notebook else "📓",
                "bg_color": notebook.bg_color if notebook else "#4d4dff",
                "text_color": notebook.text_color if notebook else "#ffffff"
            }
        }