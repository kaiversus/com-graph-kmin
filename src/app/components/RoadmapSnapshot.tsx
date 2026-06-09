import { Check, Circle, Lock } from 'lucide-react';

interface RoadmapStep {
  id: string;
  title: string;
  description: string;
  status: 'completed' | 'current' | 'locked';
  progress?: number;
}

interface RoadmapSnapshotProps {
  steps: RoadmapStep[];
  onStepClick: (stepId: string) => void;
}

export function RoadmapSnapshot({ steps, onStepClick }: RoadmapSnapshotProps) {
  return (
    <div className="bg-card rounded-lg border border-border p-6">
      <h3 className="mb-6">Your Learning Roadmap</h3>
      <div className="space-y-4">
        {steps.map((step, index) => {
          const isCompleted = step.status === 'completed';
          const isCurrent = step.status === 'current';
          const isLocked = step.status === 'locked';

          return (
            <div key={step.id}>
              <button
                onClick={() => !isLocked && onStepClick(step.id)}
                disabled={isLocked}
                className={`w-full text-left transition-all ${
                  isLocked ? 'cursor-not-allowed opacity-60' : 'cursor-pointer hover:shadow-md'
                }`}
              >
                <div
                  className={`flex gap-4 p-4 rounded-lg border-2 ${
                    isCurrent
                      ? 'border-primary bg-primary/5'
                      : isCompleted
                      ? 'border-green-500 bg-green-50'
                      : 'border-border bg-background'
                  }`}
                >
                  <div className="flex-shrink-0">
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center ${
                        isCompleted
                          ? 'bg-green-500 text-white'
                          : isCurrent
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-muted text-muted-foreground'
                      }`}
                    >
                      {isCompleted ? (
                        <Check className="w-5 h-5" />
                      ) : isLocked ? (
                        <Lock className="w-5 h-5" />
                      ) : (
                        <Circle className="w-5 h-5" />
                      )}
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <h4 className={isCurrent ? 'text-primary' : ''}>{step.title}</h4>
                      {isCurrent && (
                        <span className="px-2 py-1 bg-primary text-primary-foreground text-xs rounded whitespace-nowrap">
                          In Progress
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">{step.description}</p>
                    {isCurrent && step.progress !== undefined && (
                      <div className="mt-3">
                        <div className="flex items-center justify-between text-xs mb-1">
                          <span className="text-muted-foreground">Progress</span>
                          <span className="text-primary">{step.progress}%</span>
                        </div>
                        <div className="w-full bg-muted rounded-full h-2">
                          <div
                            className="h-2 rounded-full bg-primary"
                            style={{ width: `${step.progress}%` }}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </button>
              {index < steps.length - 1 && (
                <div className="flex justify-start ml-5">
                  <div
                    className={`w-0.5 h-4 ${
                      isCompleted ? 'bg-green-500' : 'bg-border'
                    }`}
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>
      <button className="w-full mt-6 px-4 py-2 text-primary border border-primary rounded-lg hover:bg-primary hover:text-primary-foreground transition-colors">
        View Full Roadmap
      </button>
    </div>
  );
}
