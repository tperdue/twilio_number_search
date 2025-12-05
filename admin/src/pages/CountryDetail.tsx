import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Globe, AlertTriangle, FileText, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { NumberTypeBadge } from '@/components/NumberTypeBadge';
import { RegulationCard } from '@/components/RegulationCard';
import { useCountry, useRegulations } from '@/hooks/useApi';
import { format } from 'date-fns';

const NUMBER_TYPES = [
  { key: 'local', label: 'Local' },
  { key: 'toll_free', label: 'Toll-Free' },
  { key: 'mobile', label: 'Mobile' },
  { key: 'national', label: 'National' },
  { key: 'voip', label: 'VoIP' },
  { key: 'shared_cost', label: 'Shared Cost' },
  { key: 'machine_to_machine', label: 'Machine to Machine' },
] as const;

export default function CountryDetail() {
  const { countryCode } = useParams<{ countryCode: string }>();
  const [numberTypeFilter, setNumberTypeFilter] = useState<string>('all');
  
  const { data: country, isLoading, error } = useCountry(countryCode || '');
  const { 
    data: regulations, 
    isLoading: regulationsLoading, 
    error: regulationsError 
  } = useRegulations(
    countryCode || '', 
    numberTypeFilter !== 'all' ? numberTypeFilter : undefined
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Globe className="h-8 w-8 animate-pulse text-muted-foreground" />
      </div>
    );
  }

  if (error || !country) {
    return (
      <div className="space-y-6">
        <Button asChild variant="ghost">
          <Link to="/countries">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Countries
          </Link>
        </Button>
        <div className="rounded-xl border bg-card p-8 text-center">
          <AlertTriangle className="h-12 w-12 mx-auto text-destructive" />
          <h2 className="mt-4 text-lg font-semibold">Country Not Found</h2>
          <p className="mt-2 text-muted-foreground">
            The country "{countryCode}" could not be found.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Button asChild variant="ghost">
        <Link to="/countries">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Countries
        </Link>
      </Button>

      <div className="rounded-xl border bg-card">
        <div className="border-b p-6">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
              <div className="flex h-16 w-16 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <Globe className="h-8 w-8" />
              </div>
              <div>
                <h1 className="text-2xl font-bold">{country.country}</h1>
                <p className="text-lg text-muted-foreground font-mono">
                  {country.country_code}
                </p>
              </div>
            </div>
            {country.beta && (
              <Badge variant="secondary" className="text-sm">
                Beta
              </Badge>
            )}
          </div>
        </div>

        <div className="p-6">
          <h2 className="text-lg font-semibold mb-4">Number Type Availability</h2>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {NUMBER_TYPES.map((type) => (
              <NumberTypeBadge
                key={type.key}
                type={type.key}
                available={country[type.key as keyof typeof country] as boolean}
              />
            ))}
          </div>
        </div>

        <div className="border-t px-6 py-4 bg-muted/30">
          <p className="text-sm text-muted-foreground">
            Last updated: {format(new Date(country.last_updated), 'PPpp')}
          </p>
        </div>
      </div>

      {/* Regulatory Requirements Section */}
      <div className="rounded-xl border bg-card">
        <div className="border-b p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <FileText className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-lg font-semibold">Regulatory Requirements</h2>
                <p className="text-sm text-muted-foreground">
                  Compliance requirements for phone numbers in {country.country}
                </p>
              </div>
            </div>
            <Select value={numberTypeFilter} onValueChange={setNumberTypeFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                {NUMBER_TYPES.map((type) => (
                  <SelectItem key={type.key} value={type.key}>
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="p-6">
          {regulationsLoading ? (
            <div className="flex items-center justify-center py-8">
              <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : regulationsError ? (
            <div className="text-center py-8">
              <AlertTriangle className="h-12 w-12 mx-auto text-muted-foreground/50" />
              <p className="mt-4 text-muted-foreground">
                Failed to load regulations. They may not have been synced yet.
              </p>
            </div>
          ) : regulations && regulations.length > 0 ? (
            <div className="space-y-4">
              {regulations.map((regulation) => (
                <RegulationCard key={regulation.sid} regulation={regulation} />
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <FileText className="h-12 w-12 mx-auto text-muted-foreground/50" />
              <p className="mt-4 text-muted-foreground">
                No regulations found for this country.
                {numberTypeFilter !== 'all' && ' Try changing the filter.'}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

