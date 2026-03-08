/**
 * WorkflowStepper — Visual stepper for content lifecycle stages
 */
import { LifecycleStage, workflowStages } from '../services/mockData';

interface WorkflowStepperProps {
  currentStage: LifecycleStage;
  onStageClick?: (stage: LifecycleStage) => void;
  compact?: boolean;
}

export default function WorkflowStepper({ currentStage, onStageClick, compact }: WorkflowStepperProps) {
  const currentIdx = workflowStages.findIndex(s => s.key === currentStage);

  return (
    <div className={`flex items-center ${compact ? 'gap-1' : 'gap-2'} overflow-x-auto pb-1`}>
      {workflowStages.map((stage, idx) => {
        const isCompleted = idx < currentIdx;
        const isCurrent = idx === currentIdx;
        const isFuture = idx > currentIdx;

        return (
          <div key={stage.key} className="flex items-center">
            {/* Stage node */}
            <button
              onClick={() => onStageClick?.(stage.key)}
              className={`
                flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-300 whitespace-nowrap
                ${isCompleted ? 'bg-green-500/20 text-green-400 border border-green-500/30' : ''}
                ${isCurrent ? 'bg-brand-500/20 text-brand-300 border border-brand-400/40 shadow-lg shadow-brand-500/10' : ''}
                ${isFuture ? 'bg-white/5 text-surface-500 border border-white/5' : ''}
                ${onStageClick ? 'cursor-pointer hover:bg-white/10' : 'cursor-default'}
              `}
              title={stage.description}
            >
              <span>{isCompleted ? '✓' : stage.icon}</span>
              {!compact && <span>{stage.label}</span>}
            </button>

            {/* Connector line */}
            {idx < workflowStages.length - 1 && (
              <div className={`w-6 h-px mx-1 ${isCompleted ? 'bg-green-500/50' : 'bg-white/10'}`} />
            )}
          </div>
        );
      })}
    </div>
  );
}
