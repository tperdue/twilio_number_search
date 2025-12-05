import { Check, ClipboardList } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { EndUserRequirement } from '@/types/api';

interface RequiredFieldsCardProps {
  requirement: EndUserRequirement;
}

export function RequiredFieldsCard({ requirement }: RequiredFieldsCardProps) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <ClipboardList className="h-4 w-4 text-primary" />
          {requirement.name}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground mb-3">Required Fields</p>
        <ul className="space-y-2">
          {requirement.detailed_fields.map((field) => (
            <li key={field.machine_name} className="flex items-start gap-2">
              <Check className="h-4 w-4 text-green-500 mt-0.5 shrink-0" />
              <div>
                <p className="text-sm font-medium">{field.friendly_name}</p>
                {field.description && (
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {field.description}
                  </p>
                )}
              </div>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}

