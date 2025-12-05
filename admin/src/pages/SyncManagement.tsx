import { useState } from 'react';
import { RefreshCw, Play, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { StatusBadge } from '@/components/StatusBadge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  useSyncJobs,
  useTriggerSync,
  useTriggerRegulationsSync,
} from '@/hooks/useApi';
import { useToast } from '@/hooks/use-toast';
import { formatDistanceToNow, format } from 'date-fns';
import type { SyncType } from '@/types/api';

const syncTypeConfig: Record<SyncType, {
  label: string;
  description: string;
}> = {
  'number-types': {
    label: 'Number Types',
    description: 'Sync phone number type availability for all countries.',
  },
  'regulations': {
    label: 'Regulations',
    description: 'Sync regulatory requirements for phone numbers.',
  },
};

export default function SyncManagement() {
  const [syncType, setSyncType] = useState<SyncType>('number-types');
  
  const { data: syncData, isLoading } = useSyncJobs();
  const triggerSync = useTriggerSync();
  const triggerRegulationsSync = useTriggerRegulationsSync();
  const { toast } = useToast();

  const isPending = 
    triggerSync.isPending || 
    triggerRegulationsSync.isPending;

  const currentSyncConfig = syncTypeConfig[syncType];

  const handleTriggerSync = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      let result;

      switch (syncType) {
        case 'number-types':
          result = await triggerSync.mutateAsync();
          break;
        case 'regulations':
          result = await triggerRegulationsSync.mutateAsync();
          break;
      }
      
      toast({
        title: `${currentSyncConfig.label} sync started`,
        description: result?.job_id ? `Job ID: ${result.job_id}` : 'Sync initiated successfully',
      });
    } catch (error) {
      toast({
        title: 'Failed to start sync',
        description: error instanceof Error ? error.message : 'An error occurred',
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Sync Management</h1>
        <p className="text-muted-foreground">
          Trigger and monitor synchronization jobs
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-1">
          <div className="rounded-xl border bg-card">
            <div className="border-b p-4">
              <h2 className="font-semibold">Trigger New Sync</h2>
            </div>
            <div className="p-4 space-y-4">
              <div className="space-y-2">
                <Label htmlFor="sync_type">Sync Type</Label>
                <Select value={syncType} onValueChange={(v) => setSyncType(v as SyncType)}>
                  <SelectTrigger id="sync_type">
                    <SelectValue placeholder="Select sync type" />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(syncTypeConfig).map(([key, config]) => (
                      <SelectItem key={key} value={key}>
                        {config.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-sm text-muted-foreground">
                  {currentSyncConfig.description}
                </p>
              </div>

              <form onSubmit={handleTriggerSync} className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Twilio credentials are configured via environment variables.
                </p>
                <Button
                  type="submit"
                  className="w-full"
                  disabled={isPending}
                >
                  {isPending ? (
                    <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Play className="mr-2 h-4 w-4" />
                  )}
                  Start {currentSyncConfig.label} Sync
                </Button>
              </form>
            </div>
          </div>
        </div>

        <div className="lg:col-span-2">
          <div className="rounded-xl border bg-card">
            <div className="border-b p-4">
              <h2 className="font-semibold">Job History</h2>
            </div>
            <div className="p-4">
              {isLoading ? (
                <div className="flex items-center justify-center py-8">
                  <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : syncData?.jobs?.length ? (
                <div className="space-y-4">
                  {syncData.jobs.map((job) => {
                    const progress = job.countries_total
                      ? (job.countries_processed / job.countries_total) * 100
                      : 0;

                    return (
                      <div
                        key={job.job_id}
                        className="rounded-lg border p-4 space-y-3"
                      >
                        <div className="flex items-start justify-between">
                          <div>
                            <p className="font-mono text-sm font-medium">
                              {job.job_id}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {job.started_at
                                ? `Started ${formatDistanceToNow(new Date(job.started_at), { addSuffix: true })}`
                                : 'Not started'}
                            </p>
                          </div>
                          <StatusBadge status={job.status} />
                        </div>

                        <div className="space-y-1">
                          <div className="flex justify-between text-xs">
                            <span>Progress</span>
                            <span>
                              {job.countries_processed} / {job.countries_total ?? '?'} countries
                            </span>
                          </div>
                          <Progress value={progress} className="h-2" />
                        </div>

                        {job.error && (
                          <div className="flex items-start gap-2 rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
                            <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
                            <p>{job.error}</p>
                          </div>
                        )}

                        <div className="flex gap-4 text-xs text-muted-foreground">
                          {job.started_at && (
                            <span>
                              Started: {format(new Date(job.started_at), 'PPp')}
                            </span>
                          )}
                          {job.completed_at && (
                            <span>
                              Completed: {format(new Date(job.completed_at), 'PPp')}
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-8">
                  <RefreshCw className="h-12 w-12 mx-auto text-muted-foreground/50" />
                  <p className="mt-4 text-muted-foreground">
                    No sync jobs yet. Start your first sync using the form.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

