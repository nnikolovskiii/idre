from typing import List, Optional, Dict, Any
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import asc
from backend.models.generative_model import GenerativeModel
from backend.models.dtos.generative_model_dto import GenerativeModelDTO, ModelListResponse
from backend.repositories.generative_model_repository import GenerativeModelRepository


class GenerativeModelService:
    """
    Orchestrates business logic for GenerativeModel entities.
    """

    def __init__(self, session: AsyncSession, generative_model_repository: GenerativeModelRepository):
        self.session = session
        self.repo = generative_model_repository

    # REMOVED: delete_all_models (It is unsafe for Foreign Keys)

    async def create_model(self, name: str, model_type: str) -> GenerativeModel:
        """Creates a generative model and commits the transaction."""
        generative_model = await self.repo.create(
            name=name,
            type=model_type
        )
        await self.session.commit()
        await self.session.refresh(generative_model)
        return generative_model

    async def update_model(self, model_id: str, update_data: Dict[str, Any]) -> Optional[GenerativeModel]:
        """Updates a generative model and commits the transaction."""
        model = await self.repo.update(model_id, update_data)
        if model:
            await self.session.commit()
            await self.session.refresh(model)
        return model

    async def update_model_active_status(self, model_id: str, is_active: bool) -> Optional[GenerativeModel]:
        """Updates a generative model's active status and commits the transaction."""
        model = await self.repo.update_active_status(model_id, is_active)
        if model:
            await self.session.commit()
            await self.session.refresh(model)
        return model

    async def delete_model(self, model_id: str) -> bool:
        """Deletes a generative model and commits the transaction."""
        was_deleted = await self.repo.delete_by_id(model_id)
        if was_deleted:
            await self.session.commit()
        return was_deleted

    async def get_model_by_id(self, model_id: str) -> Optional[GenerativeModel]:
        """Gets a generative model by ID."""
        return await self.repo.get_by_id(model_id)

    async def get_model_by_name(self, name: str) -> Optional[GenerativeModel]:
        """Gets a generative model by name."""
        return await self.repo.get_by_name(name)

    async def get_model(self, name: str, model_type: str) -> GenerativeModel:
        """Gets a generative model by name and type. This is used by notebook_model_service."""
        model = await self.repo.get_by_name_and_type(name, model_type)
        if not model:
            raise ValueError(f"Model '{name}' of type '{model_type}' not found")
        return model

    async def get_models_by_type(self, model_type: str) -> List[GenerativeModel]:
        """Gets all generative models of a specific type."""
        return await self.repo.get_by_type(model_type)

    async def get_all_models(self) -> List[GenerativeModel]:
        """Gets all generative models."""
        return await self.repo.list_all()

    async def model_exists(self, model_id: str) -> bool:
        """Checks if a generative model exists."""
        return await self.repo.exists(model_id)

    async def activate_model(self, model_id: str) -> Optional[GenerativeModel]:
        """Activates a generative model."""
        return await self.update_model_active_status(model_id, True)

    async def deactivate_model(self, model_id: str) -> Optional[GenerativeModel]:
        """Deactivates a generative model."""
        return await self.update_model_active_status(model_id, False)

    async def get_unique_model_names(self) -> List[str]:
        """
        Returns a list of unique model names.
        All models now require API keys.
        """
        all_models = await self.repo.list_all()
        return list(set(model.name for model in all_models))

    async def get_models_with_recommendations(self) -> ModelListResponse:
        """
        Returns all models with recommendation metadata, sorted by:
        1. Recommended models first (by recommendation_order)
        2. Other models alphabetically by name
        """
        all_models = await self.repo.list_all()

        # Sort models: recommended first, then by order, then alphabetically
        sorted_models = sorted(
            all_models,
            key=lambda model: (
                not model.is_recommended,  # False (recommended) comes before True (not recommended)
                model.recommendation_order if model.recommendation_order is not None else float('inf'),
                model.name.lower()
            )
        )

        # Convert to DTOs
        model_dtos = [GenerativeModelDTO.model_validate(model) for model in sorted_models]

        return ModelListResponse(models=model_dtos)

    async def get_models_with_recommendations_by_type(self, model_type: str) -> ModelListResponse:
        """
        Returns models of a specific type with recommendation metadata, sorted by:
        1. Recommended models first (by recommendation_order)
        2. Other models alphabetically by name
        """
        models_by_type = await self.repo.get_by_type(model_type)

        # Sort models: recommended first, then by order, then alphabetically
        sorted_models = sorted(
            models_by_type,
            key=lambda model: (
                not model.is_recommended,  # False (recommended) comes before True (not recommended)
                model.recommendation_order if model.recommendation_order is not None else float('inf'),
                model.name.lower()
            )
        )

        # Convert to DTOs
        model_dtos = [GenerativeModelDTO.model_validate(model) for model in sorted_models]

        return ModelListResponse(models=model_dtos)

    async def set_recommendation(self, model_name: str, model_type: str, is_recommended: bool,
                               recommendation_order: Optional[int] = None,
                               recommendation_reason: Optional[str] = None) -> Optional[GenerativeModel]:
        """
        Sets or updates recommendation status for a model.
        """
        model = await self.repo.get_by_name_and_type(model_name, model_type)
        if not model:
            return None

        update_data = {
            'is_recommended': is_recommended,
            'recommendation_order': recommendation_order if is_recommended else None,
            'recommendation_reason': recommendation_reason if is_recommended else None
        }

        return await self.update_model(str(model.id), update_data)