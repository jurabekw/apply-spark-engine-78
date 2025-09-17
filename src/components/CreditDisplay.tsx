import { Badge } from '@/components/ui/badge';
import { Coins, Loader2 } from 'lucide-react';
import { useCredits } from '@/contexts/CreditContext';
import { useTranslation } from 'react-i18next';

interface CreditDisplayProps {
  className?: string;
}

export const CreditDisplay = ({ className }: CreditDisplayProps) => {
  const { balance, loading } = useCredits();
  const { t } = useTranslation();

  if (loading) {
    return (
      <Badge variant="secondary" className={className}>
        <Loader2 className="w-3 h-3 mr-1 animate-spin" />
        {t('common.loading')}...
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
      {balance} {t('credits.credit', { count: balance })}
    </Badge>
  );
};