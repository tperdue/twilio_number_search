import { FileCheck, ExternalLink, MapPin } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { SupportingDocument, AcceptedDocument } from '@/types/api';

interface SupportingDocumentCardProps {
  document: SupportingDocument;
}

/**
 * Check if an accepted document is address-only (doesn't require document upload).
 * Address-only documents like "business_address" only require address information,
 * not an actual document file upload.
 */
function isAddressOnlyDocument(acceptedDoc: AcceptedDocument): boolean {
  return acceptedDoc.type === 'business_address';
}

export function SupportingDocumentCard({ document }: SupportingDocumentCardProps) {
  const hasMultipleOptions = document.accepted_documents.length > 1;
  
  // Check if all accepted documents are address-only
  const allAddressOnly = document.accepted_documents.every(isAddressOnlyDocument);
  const hasAddressOnly = document.accepted_documents.some(isAddressOnlyDocument);
  const hasDocumentUploads = document.accepted_documents.some(doc => !isAddressOnlyDocument(doc));

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          {allAddressOnly ? (
            <MapPin className="h-4 w-4 text-blue-600" />
          ) : (
            <FileCheck className="h-4 w-4 text-primary" />
          )}
          {document.name}
        </CardTitle>
        {document.description && (
          <CardDescription>{document.description}</CardDescription>
        )}
      </CardHeader>
      <CardContent>
        {allAddressOnly ? (
          <div className="mb-3">
            <p className="text-sm text-muted-foreground mb-2">
              Address Information Required
            </p>
            <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700 border-blue-200">
              No document upload needed - address only
            </Badge>
          </div>
        ) : hasAddressOnly && hasDocumentUploads ? (
          <p className="text-sm text-muted-foreground mb-3">
            {hasMultipleOptions ? 'Accepted Documents (choose one)' : 'Accepted Document'}
            <span className="ml-2 text-xs text-blue-600">
              (Some options require address only, others require document upload)
            </span>
          </p>
        ) : (
          <p className="text-sm text-muted-foreground mb-3">
            {hasMultipleOptions ? 'Accepted Documents (choose one)' : 'Accepted Document'}
          </p>
        )}
        <ul className="space-y-3">
          {document.accepted_documents.map((acceptedDoc, index) => {
            const isAddressOnly = isAddressOnlyDocument(acceptedDoc);
            
            return (
              <li
                key={`${acceptedDoc.type}-${index}`}
                className={`rounded-lg border p-3 ${
                  isAddressOnly 
                    ? 'bg-blue-50/50 border-blue-200' 
                    : 'bg-muted/30'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="space-y-1 flex-1">
                    <div className="flex items-center gap-2">
                      {isAddressOnly ? (
                        <MapPin className="h-4 w-4 text-blue-600 shrink-0" />
                      ) : (
                        <FileCheck className="h-4 w-4 text-primary shrink-0" />
                      )}
                      <p className="text-sm font-medium">{acceptedDoc.name}</p>
                    </div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge 
                        variant={isAddressOnly ? "outline" : "secondary"} 
                        className={`text-xs ${
                          isAddressOnly 
                            ? 'bg-blue-100 text-blue-700 border-blue-300' 
                            : ''
                        }`}
                      >
                        {acceptedDoc.type.replace(/_/g, ' ')}
                      </Badge>
                      {isAddressOnly && (
                        <Badge variant="outline" className="text-xs bg-blue-50 text-blue-600 border-blue-200">
                          Address Only
                        </Badge>
                      )}
                    </div>
                  </div>
                  {acceptedDoc.url && (
                    <a
                      href={acceptedDoc.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-muted-foreground hover:text-primary transition-colors shrink-0"
                    >
                      <ExternalLink className="h-4 w-4" />
                    </a>
                  )}
                </div>
                {acceptedDoc.detailed_fields.length > 0 && (
                  <div className="mt-2 pt-2 border-t">
                    <p className="text-xs text-muted-foreground mb-1">
                      Must verify:
                    </p>
                    <div className="flex flex-wrap gap-1">
                      {acceptedDoc.detailed_fields.map((field) => (
                        <Badge key={field.machine_name} variant="outline" className="text-xs">
                          {field.friendly_name}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      </CardContent>
    </Card>
  );
}

