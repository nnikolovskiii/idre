from typing import List, Optional, Dict, Any
from datetime import datetime
from sqlalchemy import select, delete, and_, func, or_
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload
from backend.models.task import Task, TaskStatus, TaskPriority


class TaskRepository:
    """
    Handles data access logic for the Task entity.
    """

    def __init__(self, session: AsyncSession):
        self.session = session

    async def create(
        self,
        user_id: str,
        notebook_id: str,
        title: str,
        description: Optional[str] = None,
        status: TaskStatus = TaskStatus.TODO,
        priority: TaskPriority = TaskPriority.MEDIUM,
        tags: Optional[List[str]] = None,
        due_date: Optional[datetime] = None,
        position: int = 0
    ) -> Task:
        """
        Creates a new Task object and adds it to the session.
        Does not commit the transaction.
        """
        task_record = Task(
            user_id=user_id,
            notebook_id=notebook_id,
            title=title,
            description=description,
            status=status,
            priority=priority,
            tags=tags or [],
            due_date=due_date,
            position=position
        )
        self.session.add(task_record)
        await self.session.flush()  # Send data to DB to get defaults/IDs
        return task_record

    async def list_by_user_id(
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
        Retrieve tasks for a specific user with optional filters,
        ordered by position within status groups.
        """
        query = select(Task).where(Task.user_id == user_id)

        if notebook_id:
            query = query.where(Task.notebook_id == notebook_id)

        if status:
            query = query.where(Task.status == status)

        if priority:
            query = query.where(Task.priority == priority)

        if tags:
            # Filter tasks that contain ANY of the specified tags
            query = query.where(Task.tags.overlap(tags))

        if not include_archived:
            query = query.where(Task.archived == False)

        query = query.order_by(Task.status, Task.position, Task.created_at.desc())
        query = query.limit(limit).offset(offset)

        result = await self.session.execute(query)
        return result.scalars().all()

    async def get_by_id_and_user(self, task_id: str, user_id: str) -> Optional[Task]:
        """
        Retrieve a task by ID and user ID to verify ownership.
        """
        query = select(Task).where(and_(Task.id == task_id, Task.user_id == user_id))
        result = await self.session.execute(query)
        return result.scalars().first()

    async def get_tasks_by_status_and_user(
        self,
        user_id: str,
        notebook_id: str,
        status: TaskStatus,
        include_archived: bool = False
    ) -> List[Task]:
        """
        Get all tasks for a user in a specific notebook and status,
        ordered by position.
        """
        conditions = [
            Task.user_id == user_id,
            Task.notebook_id == notebook_id,
            Task.status == status
        ]

        if not include_archived:
            conditions.append(Task.archived == False)

        query = select(Task).where(and_(*conditions)).order_by(Task.position)

        result = await self.session.execute(query)
        return result.scalars().all()

    async def update(
        self,
        task_id: str,
        updates: Dict[str, Any]
    ) -> Optional[Task]:
        """
        Update a task record with the provided updates dictionary.
        Returns the updated Task instance or None if not found.
        Does not commit the transaction.
        """
        # First, fetch the existing record
        existing_query = select(Task).where(Task.id == task_id)
        result = await self.session.execute(existing_query)
        existing_task = result.scalars().first()

        if not existing_task:
            return None

        # Apply updates
        for key, value in updates.items():
            if hasattr(existing_task, key):
                setattr(existing_task, key, value)

        await self.session.flush()  # Flush to update the object
        return existing_task

    async def move_task(
        self,
        task_id: str,
        new_status: TaskStatus,
        new_position: int = 0
    ) -> Optional[Task]:
        """
        Move a task to a new status and position.
        Also updates positions of other tasks in the affected columns.
        Returns the updated Task instance or None if not found.
        """
        # First, get the current task
        current_task_query = select(Task).where(Task.id == task_id)
        result = await self.session.execute(current_task_query)
        current_task = result.scalars().first()

        if not current_task:
            return None

        old_status = current_task.status
        old_position = current_task.position

        # If moving to a different column, decrement positions in old column
        if old_status != new_status:
            await self._decrement_positions_after(
                current_task.user_id,
                current_task.notebook_id,
                old_status,
                old_position
            )

            # Increment positions in new column at or after the target position
            await self._increment_positions_at_or_after(
                current_task.user_id,
                current_task.notebook_id,
                new_status,
                new_position
            )

            # Update the task's status and position
            current_task.status = new_status
            current_task.position = new_position
        else:
            # Moving within the same column
            if new_position < old_position:
                # Moving up - increment positions between new and old
                await self._increment_positions_between(
                    current_task.user_id,
                    current_task.notebook_id,
                    new_status,
                    new_position,
                    old_position - 1
                )
            elif new_position > old_position:
                # Moving down - decrement positions between old and new
                await self._decrement_positions_between(
                    current_task.user_id,
                    current_task.notebook_id,
                    new_status,
                    old_position + 1,
                    new_position
                )

            # Update the task's position
            current_task.position = new_position

        await self.session.flush()
        return current_task

    async def _increment_positions_between(
        self,
        user_id: str,
        notebook_id: str,
        status: TaskStatus,
        start_position: int,
        end_position: int
    ):
        """Increment positions of tasks in a range."""
        from sqlalchemy import update

        stmt = update(Task).where(
            and_(
                Task.user_id == user_id,
                Task.notebook_id == notebook_id,
                Task.status == status,
                Task.position >= start_position,
                Task.position <= end_position
            )
        ).values(position=Task.position + 1)

        await self.session.execute(stmt)

    async def _decrement_positions_between(
        self,
        user_id: str,
        notebook_id: str,
        status: TaskStatus,
        start_position: int,
        end_position: int
    ):
        """Decrement positions of tasks in a range."""
        from sqlalchemy import update

        stmt = update(Task).where(
            and_(
                Task.user_id == user_id,
                Task.notebook_id == notebook_id,
                Task.status == status,
                Task.position >= start_position,
                Task.position <= end_position
            )
        ).values(position=Task.position - 1)

        await self.session.execute(stmt)

    async def _increment_positions_at_or_after(
        self,
        user_id: str,
        notebook_id: str,
        status: TaskStatus,
        position: int
    ):
        """Increment positions of tasks at or after a given position."""
        from sqlalchemy import update

        stmt = update(Task).where(
            and_(
                Task.user_id == user_id,
                Task.notebook_id == notebook_id,
                Task.status == status,
                Task.position >= position
            )
        ).values(position=Task.position + 1)

        await self.session.execute(stmt)

    async def _decrement_positions_after(
        self,
        user_id: str,
        notebook_id: str,
        status: TaskStatus,
        position: int
    ):
        """Decrement positions of tasks after a given position."""
        from sqlalchemy import update

        stmt = update(Task).where(
            and_(
                Task.user_id == user_id,
                Task.notebook_id == notebook_id,
                Task.status == status,
                Task.position > position
            )
        ).values(position=Task.position - 1)

        await self.session.execute(stmt)

    async def delete(self, task_id: str) -> bool:
        """
        Delete a task record by ID.
        Returns True if deleted, False otherwise.
        Does not commit the transaction.
        """
        stmt = delete(Task).where(Task.id == task_id)
        result = await self.session.execute(stmt)
        return result.rowcount > 0

    async def search_tasks(
        self,
        user_id: str,
        notebook_id: Optional[str] = None,
        query: Optional[str] = None,
        status: Optional[TaskStatus] = None,
        priority: Optional[TaskPriority] = None,
        tags: Optional[List[str]] = None,
        has_due_date: Optional[bool] = None,
        is_overdue: Optional[bool] = None,
        limit: int = 100,
        offset: int = 0,
        include_archived: bool = False
    ) -> List[Task]:
        """
        Search tasks with multiple filter criteria.
        """
        base_query = select(Task).where(Task.user_id == user_id)

        if notebook_id:
            base_query = base_query.where(Task.notebook_id == notebook_id)

        if status:
            base_query = base_query.where(Task.status == status)

        if priority:
            base_query = base_query.where(Task.priority == priority)

        if tags:
            base_query = base_query.where(Task.tags.overlap(tags))

        if has_due_date is not None:
            if has_due_date:
                base_query = base_query.where(Task.due_date.isnot(None))
            else:
                base_query = base_query.where(Task.due_date.is_(None))

        if is_overdue is not None:
            from datetime import datetime
            if is_overdue:
                base_query = base_query.where(
                    and_(
                        Task.due_date.isnot(None),
                        Task.due_date < func.now()
                    )
                )
            else:
                base_query = base_query.where(
                    or_(
                        Task.due_date.is_(None),
                        Task.due_date >= func.now()
                    )
                )

        if query:
            # Text search in title and description
            search_term = f"%{query}%"
            base_query = base_query.where(
                or_(
                    Task.title.ilike(search_term),
                    Task.description.ilike(search_term)
                )
            )

        if not include_archived:
            base_query = base_query.where(Task.archived == False)

        base_query = base_query.order_by(Task.status, Task.position, Task.created_at.desc())
        base_query = base_query.limit(limit).offset(offset)

        result = await self.session.execute(base_query)
        return result.scalars().all()

    async def count_by_user_and_filters(
        self,
        user_id: str,
        notebook_id: Optional[str] = None,
        status: Optional[TaskStatus] = None,
        include_archived: bool = False
    ) -> int:
        """
        Count tasks for a user with optional filters.
        """
        query = select(func.count(Task.id)).where(Task.user_id == user_id)

        if notebook_id:
            query = query.where(Task.notebook_id == notebook_id)

        if status:
            query = query.where(Task.status == status)

        if not include_archived:
            query = query.where(Task.archived == False)

        result = await self.session.execute(query)
        return result.scalar() or 0