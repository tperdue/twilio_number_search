import { useState } from 'react';
import { Search, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { NumberCard } from '@/components/NumberCard';
import { useCountries, useSearchNumbers } from '@/hooks/useApi';
import { useToast } from '@/hooks/use-toast';
import type { NumberSearchRequest } from '@/types/api';

const NUMBER_TYPES = [
  { value: 'local', label: 'Local' },
  { value: 'mobile', label: 'Mobile' },
  { value: 'toll-free', label: 'Toll-Free' },
] as const;

export default function NumberSearch() {
  const { toast } = useToast();
  const { data: countries, isLoading: countriesLoading } = useCountries({ limit: 1000 });
  const searchMutation = useSearchNumbers();

  const [formData, setFormData] = useState({
    country_code: '',
    number_type: '' as NumberSearchRequest['number_type'] | '',
    sms_enabled: false,
    voice_enabled: false,
  });

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.country_code || !formData.number_type) {
      toast({
        title: 'Missing Fields',
        description: 'Please select a country and number type.',
        variant: 'destructive',
      });
      return;
    }

    try {
      await searchMutation.mutateAsync({
        country_code: formData.country_code,
        number_type: formData.number_type as NumberSearchRequest['number_type'],
        ...(formData.sms_enabled && { sms_enabled: true }),
        ...(formData.voice_enabled && { voice_enabled: true }),
      });
    } catch (error) {
      toast({
        title: 'Search Failed',
        description: error instanceof Error ? error.message : 'Failed to search numbers',
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Number Search</h1>
        <p className="text-muted-foreground">
          Find available phone numbers from Twilio
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle>Search Parameters</CardTitle>
            <CardDescription>
              Enter your search criteria. Twilio credentials are configured via environment variables.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSearch} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="country">Country</Label>
                <Select
                  value={formData.country_code}
                  onValueChange={(value) => setFormData({ ...formData, country_code: value })}
                >
                  <SelectTrigger id="country">
                    <SelectValue placeholder="Select country" />
                  </SelectTrigger>
                  <SelectContent>
                    {countriesLoading ? (
                      <SelectItem value="_loading" disabled>Loading...</SelectItem>
                    ) : (
                      countries?.map((country) => (
                        <SelectItem key={country.country_code} value={country.country_code}>
                          {country.country} ({country.country_code})
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="number_type">Number Type</Label>
                <Select
                  value={formData.number_type}
                  onValueChange={(value) => setFormData({ ...formData, number_type: value as NumberSearchRequest['number_type'] })}
                >
                  <SelectTrigger id="number_type">
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    {NUMBER_TYPES.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-3 pt-2">
                <Label className="text-muted-foreground text-xs uppercase tracking-wide">
                  Optional Filters
                </Label>
                <div className="flex items-center justify-between">
                  <Label htmlFor="sms_enabled" className="font-normal">SMS Enabled</Label>
                  <Switch
                    id="sms_enabled"
                    checked={formData.sms_enabled}
                    onCheckedChange={(checked) => setFormData({ ...formData, sms_enabled: checked })}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="voice_enabled" className="font-normal">Voice Enabled</Label>
                  <Switch
                    id="voice_enabled"
                    checked={formData.voice_enabled}
                    onCheckedChange={(checked) => setFormData({ ...formData, voice_enabled: checked })}
                  />
                </div>
              </div>

              <Button type="submit" className="w-full" disabled={searchMutation.isPending}>
                {searchMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Searching...
                  </>
                ) : (
                  <>
                    <Search className="mr-2 h-4 w-4" />
                    Search Numbers
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>
              Results
              {searchMutation.data && (
                <span className="ml-2 text-sm font-normal text-muted-foreground">
                  ({searchMutation.data.length} numbers found)
                </span>
              )}
            </CardTitle>
            <CardDescription>
              Available phone numbers matching your criteria
            </CardDescription>
          </CardHeader>
          <CardContent>
            {searchMutation.isPending ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : searchMutation.data?.length ? (
              <div className="grid gap-3 sm:grid-cols-2">
                {searchMutation.data.map((number, index) => (
                  <NumberCard key={number.phone_number || index} number={number} />
                ))}
              </div>
            ) : searchMutation.data ? (
              <div className="text-center py-12 text-muted-foreground">
                <Search className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No numbers found matching your criteria.</p>
                <p className="text-sm mt-1">Try adjusting your search parameters.</p>
              </div>
            ) : (
              <div className="text-center py-12 text-muted-foreground">
                <Search className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Enter search criteria and click "Search Numbers"</p>
                <p className="text-sm mt-1">to find available phone numbers.</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

