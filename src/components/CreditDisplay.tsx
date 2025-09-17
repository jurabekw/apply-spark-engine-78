import { Badge } from '@/components/ui/badge';
import { Coins, Loader2 } from 'lucide-react';
import { useCredits } from '@/contexts/CreditContext';

interface CreditDisplayProps {
  className?: string;
}

export const CreditDisplay = ({ className }: CreditDisplayProps) => {
  const { balance, loading } = useCredits();

  if (loading) {
    return (
      <Badge variant="secondary" className={className}>
        <Loader2 className="w-3 h-3 mr-1 animate-spin" />
        Loading...
      </Badge>
    );
  }

  const getVariant = () => {
    if (balance === 0) return "destructive";
    if (balance <= 5) return "outline";
    return "secondary";
  };

  return (
    <Badge variant={getVariant()} className={className}>
      <Coins className="w-3 h-3 mr-1" />
      {balance} Credit{balance !== 1 ? 's' : ''}
    </Badge>
  );
};