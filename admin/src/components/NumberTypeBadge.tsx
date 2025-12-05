import { cn } from '@/lib/utils';
import { Check, X } from 'lucide-react';

interface NumberTypeBadgeProps {
  type: string;
  available: boolean;
  compact?: boolean;
  className?: string;
}

const typeLabels: Record<string, string> = {
  local: 'Local',
  toll_free: 'Toll-Free',
  mobile: 'Mobile',
  national: 'National',
  voip: 'VoIP',
  shared_cost: 'Shared Cost',
  machine_to_machine: 'M2M',
};

export function NumberTypeBadge({ type, available, compact = false, className }: NumberTypeBadgeProps) {
  const label = typeLabels[type] || type;
  
  if (compact) {
    return (
      <span
        className={cn(
          'inline-flex items-center justify-center rounded px-1.5 py-0.5 text-xs font-medium',
          available
            ? 'bg-success/10 text-success'
            : 'bg-muted text-muted-foreground',
          className
        )}
        title={`${label}: ${available ? 'Available' : 'Not Available'}`}
      >
        {label}
      </span>
    );
  }
  
  return (
    <div
      className={cn(
        'flex items-center gap-2 rounded-lg border p-3',
        available
          ? 'border-success/20 bg-success/5'
          : 'border-border bg-muted/50',
        className
      )}
    >
      <div
        className={cn(
          'flex h-8 w-8 items-center justify-center rounded-full',
          available ? 'bg-success/20 text-success' : 'bg-muted text-muted-foreground'
        )}
      >
        {available ? <Check className="h-4 w-4" /> : <X className="h-4 w-4" />}
      </div>
      <div>
        <p className="text-sm font-medium">{label}</p>
        <p className={cn('text-xs', available ? 'text-success' : 'text-muted-foreground')}>
          {available ? 'Available' : 'Not Available'}
        </p>
      </div>
    </div>
  );
}

