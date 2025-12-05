import { useState, useEffect } from 'react';
import { X, Download, Trash2, Globe } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { useSelectedRegulations } from '@/contexts/SelectedRegulationsContext';
import { exportRegulations } from '@/lib/api';
import { getRegulations } from '@/lib/api';
import type { Regulation } from '@/types/api';

export function SelectedRegulationsSidebar() {
  const {
    selectedRegulations,
    removeRegulation,
    clearCountry,
    clearAll,
    getSelectedCount,
    getSelectedByCountry,
    getAllSelectedSids,
  } = useSelectedRegulations();

  const [regulationsData, setRegulationsData] = useState<Map<string, Regulation>>(new Map());
  const [isExporting, setIsExporting] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const selectedCount = getSelectedCount();
  const selectedByCountry = getSelectedByCountry();

  // Fetch regulation details for selected regulations
  useEffect(() => {
    const fetchRegulations = async () => {
      if (selectedCount === 0) {
        setRegulationsData(new Map());
        return;
      }

      setIsLoading(true);
      const allSids = getAllSelectedSids();
      const newRegulationsData = new Map<string, Regulation>();

      // Group by country and fetch regulations
      const countryPromises = Array.from(selectedRegulations.entries()).map(async ([countryCode, sids]) => {
        try {
          const regulations = await getRegulations(countryCode);
          regulations.forEach((reg) => {
            if (sids.has(reg.sid)) {
              newRegulationsData.set(reg.sid, reg);
            }
          });
        } catch (error) {
          console.error(`Failed to fetch regulations for ${countryCode}:`, error);
        }
      });

      await Promise.all(countryPromises);
      setRegulationsData(newRegulationsData);
      setIsLoading(false);
    };

    fetchRegulations();
  }, [selectedRegulations, selectedCount, getAllSelectedSids]);

  const handleExport = async () => {
    if (selectedCount === 0) return;

    setIsExporting(true);
    try {
      await exportRegulations(getAllSelectedSids());
    } catch (error) {
      console.error('Failed to export regulations:', error);
      // TODO: Show toast notification
    } finally {
      setIsExporting(false);
    }
  };

  const handleRemove = (countryCode: string, regulationSid: string) => {
    removeRegulation(countryCode, regulationSid);
  };

  const handleClearCountry = (countryCode: string) => {
    clearCountry(countryCode);
  };

  if (selectedCount === 0) {
    return (
      <div className="w-80 border-l bg-muted/30 p-4">
        <div className="flex items-center gap-2 mb-4">
          <Globe className="h-5 w-5 text-muted-foreground" />
          <h2 className="text-lg font-semibold">Selected Regulations</h2>
        </div>
        <p className="text-sm text-muted-foreground text-center py-8">
          No regulations selected. Select regulations from country pages to add them here.
        </p>
      </div>
    );
  }

  return (
    <div className="w-80 border-l bg-background flex flex-col" style={{ height: 'calc(100vh - 3.5rem)' }}>
      <div className="p-4 border-b">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Globe className="h-5 w-5 text-primary" />
            <h2 className="text-lg font-semibold">Selected Regulations</h2>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={clearAll}
            disabled={isExporting}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
        <div className="flex items-center justify-between mb-4">
          <span className="text-sm text-muted-foreground">
            {selectedCount} regulation{selectedCount !== 1 ? 's' : ''} selected
          </span>
          <Button
            size="sm"
            onClick={handleExport}
            disabled={isExporting || selectedCount === 0}
            className="w-full"
          >
            <Download className="h-4 w-4 mr-2" />
            {isExporting ? 'Exporting...' : 'Export Selected'}
          </Button>
        </div>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-4 space-y-4">
          {isLoading ? (
            <div className="text-center py-8">
              <p className="text-sm text-muted-foreground">Loading regulations...</p>
            </div>
          ) : (
            Array.from(selectedRegulations.entries()).map(([countryCode, sids]) => {
              const countryRegulations = Array.from(sids)
                .map((sid) => regulationsData.get(sid))
                .filter((reg): reg is Regulation => reg !== undefined);

              return (
                <div key={countryCode} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">{countryCode}</Badge>
                      <span className="text-xs text-muted-foreground">
                        {sids.size} regulation{sids.size !== 1 ? 's' : ''}
                      </span>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 px-2"
                      onClick={() => handleClearCountry(countryCode)}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                  <div className="space-y-1 pl-2">
                    {countryRegulations.map((regulation) => (
                      <div
                        key={regulation.sid}
                        className="flex items-start justify-between p-2 rounded border bg-card hover:bg-muted/50 transition-colors"
                      >
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">
                            {regulation.friendly_name || 'Unnamed Regulation'}
                          </p>
                          <div className="flex gap-1 mt-1">
                            {regulation.number_type && (
                              <Badge variant="secondary" className="text-xs">
                                {regulation.number_type}
                              </Badge>
                            )}
                            <Badge variant="outline" className="text-xs">
                              {regulation.end_user_type}
                            </Badge>
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 w-6 p-0 ml-2 shrink-0"
                          onClick={() => handleRemove(countryCode, regulation.sid)}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    ))}
                    {countryRegulations.length === 0 && (
                      <p className="text-xs text-muted-foreground p-2">
                        Loading regulation details...
                      </p>
                    )}
                  </div>
                  <Separator className="my-2" />
                </div>
              );
            })
          )}
        </div>
      </ScrollArea>
    </div>
  );
}

