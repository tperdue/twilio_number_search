import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface CredentialsFormProps {
  accountSid: string;
  authToken: string;
  onAccountSidChange: (value: string) => void;
  onAuthTokenChange: (value: string) => void;
  disabled?: boolean;
}

export function CredentialsForm({
  accountSid,
  authToken,
  onAccountSidChange,
  onAuthTokenChange,
  disabled = false,
}: CredentialsFormProps) {
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="account_sid">Account SID</Label>
        <Input
          id="account_sid"
          value={accountSid}
          onChange={(e) => onAccountSidChange(e.target.value)}
          placeholder="AC..."
          disabled={disabled}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="auth_token">Auth Token</Label>
        <Input
          id="auth_token"
          type="password"
          value={authToken}
          onChange={(e) => onAuthTokenChange(e.target.value)}
          placeholder="Enter auth token"
          disabled={disabled}
        />
      </div>
    </div>
  );
}

