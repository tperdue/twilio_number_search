import { Phone, MapPin, MessageSquare, PhoneCall, Mail, Printer } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { AvailableNumber } from '@/types/api';

interface NumberCardProps {
  number: AvailableNumber;
}

export function NumberCard({ number }: NumberCardProps) {
  const capabilities = number.capabilities;
  const location = [number.locality, number.region].filter(Boolean).join(', ');

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <Phone className="h-4 w-4 text-primary shrink-0" />
            <span className="font-mono font-medium text-sm truncate">
              {number.friendly_name || number.phone_number}
            </span>
          </div>
          {number.beta && (
            <Badge variant="secondary" className="shrink-0 text-xs">
              Beta
            </Badge>
          )}
        </div>

        {location && (
          <div className="flex items-center gap-1.5 mt-2 text-muted-foreground">
            <MapPin className="h-3.5 w-3.5" />
            <span className="text-xs">{location}</span>
          </div>
        )}

        <div className="flex flex-wrap gap-1.5 mt-3">
          {capabilities?.voice && (
            <Badge variant="outline" className="text-xs gap-1">
              <PhoneCall className="h-3 w-3" />
              Voice
            </Badge>
          )}
          {capabilities?.sms && (
            <Badge variant="outline" className="text-xs gap-1">
              <MessageSquare className="h-3 w-3" />
              SMS
            </Badge>
          )}
          {capabilities?.mms && (
            <Badge variant="outline" className="text-xs gap-1">
              <Mail className="h-3 w-3" />
              MMS
            </Badge>
          )}
          {capabilities?.fax && (
            <Badge variant="outline" className="text-xs gap-1">
              <Printer className="h-3 w-3" />
              Fax
            </Badge>
          )}
        </div>

        {number.address_requirements && number.address_requirements !== 'none' && (
          <div className="mt-3 pt-3 border-t">
            <span className="text-xs text-muted-foreground">
              Address: <span className="capitalize">{number.address_requirements}</span>
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

