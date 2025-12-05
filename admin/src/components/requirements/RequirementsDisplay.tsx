import { CheckCircle2 } from 'lucide-react';
import { RequiredFieldsCard } from './RequiredFieldsCard';
import { SupportingDocumentCard } from './SupportingDocumentCard';
import type { Requirements } from '@/types/api';

interface RequirementsDisplayProps {
  requirements: Requirements;
}

export function RequirementsDisplay({ requirements }: RequirementsDisplayProps) {
  const hasEndUser = requirements.end_user && requirements.end_user.length > 0;
  const hasSupportingDocs = requirements.supporting_document && requirements.supporting_document.length > 0;

  if (!hasEndUser && !hasSupportingDocs) {
    return (
      <p className="text-sm text-muted-foreground">No specific requirements defined.</p>
    );
  }

  // Flatten the nested supporting_document arrays
  const flattenedDocs = requirements.supporting_document?.flat() ?? [];

  return (
    <div className="space-y-4">
      {/* End User Requirements (Required Fields) */}
      {hasEndUser && (
        <div className="space-y-3">
          <h4 className="text-sm font-medium text-muted-foreground">
            Required Information
          </h4>
          {requirements.end_user!.map((req) => (
            <RequiredFieldsCard key={req.requirement_name} requirement={req} />
          ))}
        </div>
      )}

      {/* Supporting Documents */}
      {hasEndUser && (
        <div className="space-y-3">
          <h4 className="text-sm font-medium text-muted-foreground">
            Supporting Documents
          </h4>
          {flattenedDocs.length > 0 ? (
            flattenedDocs.map((doc, index) => (
              <SupportingDocumentCard key={`${doc.requirement_name}-${index}`} document={doc} />
            ))
          ) : (
            <div className="flex items-center gap-2 rounded-lg border bg-muted/30 p-3 text-sm text-muted-foreground">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <span>No supporting documents required</span>
            </div>
          )}
        </div>
      )}

      {/* Supporting Documents (when no end user requirements) */}
      {!hasEndUser && flattenedDocs.length > 0 && (
        <div className="space-y-3">
          <h4 className="text-sm font-medium text-muted-foreground">
            Required Documents
          </h4>
          {flattenedDocs.map((doc, index) => (
            <SupportingDocumentCard key={`${doc.requirement_name}-${index}`} document={doc} />
          ))}
        </div>
      )}
    </div>
  );
}

