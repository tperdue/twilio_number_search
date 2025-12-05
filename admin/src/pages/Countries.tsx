import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Search, Globe, ChevronLeft, ChevronRight, Filter, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { NumberTypeBadge } from '@/components/NumberTypeBadge';
import { useCountries } from '@/hooks/useApi';
import { formatDistanceToNow } from 'date-fns';

const NUMBER_TYPES = [
  { key: 'local', label: 'Local' },
  { key: 'toll_free', label: 'Toll-Free' },
  { key: 'mobile', label: 'Mobile' },
  { key: 'national', label: 'National' },
  { key: 'voip', label: 'VoIP' },
  { key: 'shared_cost', label: 'Shared Cost' },
  { key: 'machine_to_machine', label: 'M2M' },
];

export default function Countries() {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [selectedType, setSelectedType] = useState<string | undefined>();
  const pageSize = 20;
  const skip = (page - 1) * pageSize;

  const { data: allData, isLoading } = useCountries({
    skip: 0,
    limit: 1000, // Fetch all countries (API max is 1000)
    number_type: selectedType,
  });

  // Client-side filtering by search term
  const filteredData = allData?.filter((country) => {
    if (!search) return true;
    const searchLower = search.toLowerCase();
    return (
      country.country.toLowerCase().includes(searchLower) ||
      country.country_code.toLowerCase().includes(searchLower)
    );
  }) || [];

  // Client-side pagination
  const paginatedData = filteredData.slice(skip, skip + pageSize);
  const totalItems = filteredData.length;
  const totalPages = Math.ceil(totalItems / pageSize);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Countries</h1>
        <p className="text-muted-foreground">
          Browse phone number availability by country
        </p>
      </div>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search countries..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="pl-9"
          />
        </div>
        <div className="flex flex-wrap gap-2">
          {selectedType && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setSelectedType(undefined);
                setPage(1);
              }}
            >
              <X className="mr-1 h-3 w-3" />
              Clear filter
            </Button>
          )}
          {NUMBER_TYPES.map((type) => (
            <Button
              key={type.key}
              variant={selectedType === type.key ? 'default' : 'outline'}
              size="sm"
              onClick={() => {
                setSelectedType(selectedType === type.key ? undefined : type.key);
                setPage(1);
              }}
            >
              {type.label}
            </Button>
          ))}
        </div>
      </div>

      <div className="rounded-xl border bg-card">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Globe className="h-8 w-8 animate-pulse text-muted-foreground" />
          </div>
        ) : paginatedData?.length ? (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="px-4 py-3 text-left text-sm font-medium">Country</th>
                    <th className="px-4 py-3 text-left text-sm font-medium">Number Types</th>
                    <th className="px-4 py-3 text-left text-sm font-medium">Status</th>
                    <th className="px-4 py-3 text-left text-sm font-medium">Updated</th>
                    <th className="px-4 py-3 text-right text-sm font-medium"></th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedData.map((country) => (
                    <tr
                      key={country.country_code}
                      className="border-b last:border-0 hover:bg-muted/30 transition-colors"
                    >
                      <td className="px-4 py-3">
                        <div>
                          <p className="font-medium">{country.country}</p>
                          <p className="text-sm text-muted-foreground font-mono">
                            {country.country_code}
                          </p>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap gap-1">
                          {country.local && <NumberTypeBadge type="local" available compact />}
                          {country.toll_free && <NumberTypeBadge type="toll_free" available compact />}
                          {country.mobile && <NumberTypeBadge type="mobile" available compact />}
                          {country.national && <NumberTypeBadge type="national" available compact />}
                          {country.voip && <NumberTypeBadge type="voip" available compact />}
                          {country.shared_cost && <NumberTypeBadge type="shared_cost" available compact />}
                          {country.machine_to_machine && <NumberTypeBadge type="machine_to_machine" available compact />}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        {country.beta && (
                          <Badge variant="secondary">Beta</Badge>
                        )}
                      </td>
                      <td className="px-4 py-3 text-sm text-muted-foreground">
                        {formatDistanceToNow(new Date(country.last_updated), { addSuffix: true })}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <Button asChild variant="ghost" size="sm">
                          <Link to={`/countries/${country.country_code}`}>
                            View
                          </Link>
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex items-center justify-between border-t px-4 py-3">
              <p className="text-sm text-muted-foreground">
                Showing {(page - 1) * pageSize + 1} to{' '}
                {Math.min(page * pageSize, totalItems)} of {totalItems} countries
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(page - 1)}
                  disabled={page === 1}
                >
                  <ChevronLeft className="h-4 w-4" />
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(page + 1)}
                  disabled={page >= totalPages}
                >
                  Next
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </>
        ) : (
          <div className="text-center py-12">
            <Globe className="h-12 w-12 mx-auto text-muted-foreground/50" />
            <p className="mt-4 text-muted-foreground">
              {search || selectedType
                ? 'No countries found matching your criteria'
                : 'No country data available. Run a sync to populate data.'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

