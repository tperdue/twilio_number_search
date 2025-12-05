import { Globe, RefreshCw, Search } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { StatsCard } from '@/components/StatsCard';
import { StatusBadge } from '@/components/StatusBadge';
import { useSyncJobs, useCountries } from '@/hooks/useApi';
import { formatDistanceToNow } from 'date-fns';

export default function Dashboard() {
  const { data: syncData, isLoading: syncLoading } = useSyncJobs();
  const { data: countriesData, isLoading: countriesLoading } = useCountries({ limit: 1000 });

  const latestJob = syncData?.jobs?.[0];
  const hasActiveJob = latestJob?.status === 'pending' || latestJob?.status === 'in_progress';

  // Count countries with regulations (simplified - we don't have a direct count)
  const countriesWithData = countriesData?.length || 0;

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">
            Monitor Twilio number type availability and regulatory compliance
          </p>
        </div>
        <div className="flex gap-2">
          <Button asChild>
            <Link to="/sync">
              <RefreshCw className="mr-2 h-4 w-4" />
              New Sync
            </Link>
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-2">
        <StatsCard
          title="Total Countries"
          value={countriesLoading ? '...' : countriesWithData}
          description="Countries with data"
          icon={Globe}
        />
        <StatsCard
          title="Sync Status"
          value={hasActiveJob ? 'Active' : 'Idle'}
          description={latestJob ? `Latest: ${latestJob.status}` : 'No recent syncs'}
          icon={RefreshCw}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-xl border bg-card">
          <div className="border-b p-4 flex items-center justify-between">
            <h2 className="font-semibold">Recent Sync Jobs</h2>
            <Button variant="ghost" size="sm" asChild>
              <Link to="/sync">View All</Link>
            </Button>
          </div>
          <div className="p-4">
            {syncLoading ? (
              <p className="text-sm text-muted-foreground">Loading...</p>
            ) : syncData?.jobs?.length ? (
              <div className="space-y-3">
                {syncData.jobs.slice(0, 5).map((job) => (
                  <div
                    key={job.job_id}
                    className="flex items-center justify-between rounded-lg border p-3"
                  >
                    <div>
                      <p className="text-sm font-medium font-mono">
                        {job.job_id.slice(0, 8)}...
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {job.started_at
                          ? formatDistanceToNow(new Date(job.started_at), { addSuffix: true })
                          : 'Not started'}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-sm text-muted-foreground">
                        {job.countries_processed}/{job.countries_total ?? '?'}
                      </span>
                      <StatusBadge status={job.status} />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                No sync jobs yet. Start your first sync to populate data.
              </p>
            )}
          </div>
        </div>

        <div className="rounded-xl border bg-card">
          <div className="border-b p-4">
            <h2 className="font-semibold">Quick Actions</h2>
          </div>
          <div className="grid gap-3 p-4 sm:grid-cols-2">
            <Button asChild variant="outline" className="justify-start h-auto py-4">
              <Link to="/countries">
                <Globe className="mr-3 h-5 w-5 text-primary" />
                <div className="text-left">
                  <p className="font-medium">Browse Countries</p>
                  <p className="text-xs text-muted-foreground">
                    View number types
                  </p>
                </div>
              </Link>
            </Button>
            <Button asChild variant="outline" className="justify-start h-auto py-4">
              <Link to="/numbers">
                <Search className="mr-3 h-5 w-5 text-primary" />
                <div className="text-left">
                  <p className="font-medium">Search Numbers</p>
                  <p className="text-xs text-muted-foreground">
                    Find available numbers
                  </p>
                </div>
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

