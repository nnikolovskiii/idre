import React from 'react';
import type { ChatModel } from '../../services/chatModelService';

interface ModelInfoProps {
  models: Record<string, ChatModel>;
  loading?: boolean;
}

const ModelInfo: React.FC<ModelInfoProps> = ({ models, loading = false }) => {
  if (loading) {
    return (
      <div className="relative w-full flex-shrink-0 bg-background px-2 pb-2">
        <div className="relative mx-auto max-w-3xl">
          <div className="flex items-center justify-center gap-2 rounded-md border border-border/30 bg-muted/30 px-4 py-2">
            <div className="animate-pulse flex space-x-2">
              <div className="h-2 w-2 bg-muted-foreground rounded-full"></div>
              <div className="h-2 w-2 bg-muted-foreground rounded-full"></div>
              <div className="h-2 w-2 bg-muted-foreground rounded-full"></div>
            </div>
            <span className="text-sm text-muted-foreground">Loading models...</span>
          </div>
        </div>
      </div>
    );
  }

  const lightModel = models?.light;
  const heavyModel = models?.heavy;

  if (!lightModel && !heavyModel) {
    return null;
  }

  return (
    <div className="relative w-full flex-shrink-0 bg-background px-2 pb-2">
      <div className="relative mx-auto max-w-3xl">
        <div className="flex flex-wrap gap-2 rounded-md bg-muted/30 px-4">
           {heavyModel && (
            <div className="flex items-center gap-2">
              {/*<span className="text-xs font-medium text-muted-foreground">Heavy:</span>*/}
              <span className="text-xs text-foreground bg-background px-2 py-1">
                {heavyModel.model_name}
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ModelInfo;
