import { ReactNode } from 'react';
import { useCredits } from '@/contexts/CreditContext';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Coins, AlertTriangle } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

interface CreditGuardProps {
  children: ReactNode;
  requiredCredits: number;
  moduleName: string;
  onUseCredits?: () => Promise<void>;
  blockContent?: boolean;
}

export const CreditGuard = ({ 
  children, 
  requiredCredits, 
  moduleName,
  onUseCredits,
  blockContent = false 
}: CreditGuardProps) => {
  const { balance, loading, deductCredits } = useCredits();

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-20 w-full" />
        <Skeleton className="h-40 w-full" />
      </div>
    );
  }

  const hasEnoughCredits = balance >= requiredCredits;

  if (!hasEnoughCredits && blockContent) {
    return (
      <Alert variant="destructive">
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Insufficient Credits</p>
              <p className="text-sm opacity-90">
                You need {requiredCredits} credit{requiredCredits > 1 ? 's' : ''} to use {moduleName}.
                You currently have {balance} credit{balance !== 1 ? 's' : ''}.
              </p>
            </div>
            <Button variant="outline" size="sm">
              <Coins className="w-4 h-4 mr-2" />
              Get Credits
            </Button>
          </div>
        </AlertDescription>
      </Alert>
    );
  }

  const handleUseCredits = async () => {
    const success = await deductCredits(requiredCredits, moduleName);
    if (success && onUseCredits) {
      await onUseCredits();
    }
  };

  if (!hasEnoughCredits) {
    return (
      <div className="space-y-4">
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            You need {requiredCredits} more credit{requiredCredits > 1 ? 's' : ''} to use this feature.
          </AlertDescription>
        </Alert>
        {children}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {onUseCredits && (
        <Alert>
          <Coins className="h-4 w-4" />
          <AlertDescription>
            <div className="flex items-center justify-between">
              <span>This will use {requiredCredits} credit{requiredCredits > 1 ? 's' : ''}.</span>
              <Button onClick={handleUseCredits} size="sm">
                Use Credits
              </Button>
            </div>
          </AlertDescription>
        </Alert>
      )}
      {children}
    </div>
  );
};