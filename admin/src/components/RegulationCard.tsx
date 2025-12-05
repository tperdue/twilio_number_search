import { useState } from 'react';
import { ChevronDown, ChevronRight, ExternalLink, FileText, Download } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { RequirementsDisplay } from '@/components/requirements/RequirementsDisplay';
import { exportRegulation } from '@/lib/api';
import { useSelectedRegulations } from '@/contexts/SelectedRegulationsContext';
import type { Regulation } from '@/types/api';
import { format } from 'date-fns';

interface RegulationCardProps {
  regulation: Regulation;
  countryCode: string;
}

export function RegulationCard({ 
  regulation, 
  countryCode
}: RegulationCardProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const { isSelected, addRegulation, removeRegulation } = useSelectedRegulations();

  const hasRequirements = regulation.requirements && Object.keys(regulation.requirements).length > 0;
  const isInCart = isSelected(countryCode, regulation.sid);

  const handleExport = async () => {
    setIsExporting(true);
    try {
      await exportRegulation(regulation.sid);
    } catch (error) {
      console.error('Failed to export regulation:', error);
      // TODO: Show toast notification
    } finally {
      setIsExporting(false);
    }
  };

  const handleCartToggle = () => {
    if (isInCart) {
      removeRegulation(countryCode, regulation.sid);
    } else {
      addRegulation(countryCode, regulation.sid);
    }
  };

  return (
    <div className="rounded-lg border bg-card">
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CollapsibleTrigger asChild>
          <button className="flex w-full items-start justify-between p-4 text-left hover:bg-muted/50 transition-colors">
            <div className="flex items-start gap-3 flex-1">
              <div className="pt-1" onClick={(e) => e.stopPropagation()}>
                <Checkbox
                  checked={isInCart}
                  onCheckedChange={handleCartToggle}
                  className="mt-0.5"
                />
              </div>
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary shrink-0">
                <FileText className="h-5 w-5" />
              </div>
              <div className="space-y-1 flex-1">
                <p className="font-medium leading-none">
                  {regulation.friendly_name || 'Unnamed Regulation'}
                </p>
                <div className="flex flex-wrap gap-2 pt-1">
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
            </div>
            <div className="flex items-center gap-2">
              {hasRequirements && (
                isOpen ? (
                  <ChevronDown className="h-4 w-4 text-muted-foreground" />
                ) : (
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                )
              )}
            </div>
          </button>
        </CollapsibleTrigger>

        {hasRequirements && (
          <CollapsibleContent>
            <div className="border-t px-4 py-4">
              <RequirementsDisplay requirements={regulation.requirements!} />
            </div>
          </CollapsibleContent>
        )}
      </Collapsible>

      <div className="flex items-center justify-between border-t px-4 py-2 text-xs text-muted-foreground">
        <span>Updated: {format(new Date(regulation.last_updated), 'PPp')}</span>
        <div className="flex items-center gap-2">
          <Button 
            variant="ghost" 
            size="sm" 
            className="h-7 text-xs" 
            onClick={handleExport}
            disabled={isExporting}
          >
            <Download className="h-3 w-3 mr-1" />
            {isExporting ? 'Exporting...' : 'Export'}
          </Button>
          {regulation.iso_country && (
            <Button variant="ghost" size="sm" className="h-7 text-xs" asChild>
              <a href={`https://www.twilio.com/en-us/guidelines/${regulation.iso_country.toLowerCase()}/regulatory`} target="_blank" rel="noopener noreferrer">
                View on Twilio
                <ExternalLink className="ml-1 h-3 w-3" />
              </a>
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

