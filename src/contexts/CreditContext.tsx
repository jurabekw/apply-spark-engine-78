import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

interface CreditContextType {
  balance: number;
  loading: boolean;
  error: string | null;
  refreshBalance: () => Promise<void>;
  deductCredits: (amount: number, moduleName: string, description?: string) => Promise<boolean>;
  addCredits: (amount: number, description?: string) => Promise<boolean>;
}

const CreditContext = createContext<CreditContextType | undefined>(undefined);

export const useCredits = () => {
  const context = useContext(CreditContext);
  if (context === undefined) {
    throw new Error('useCredits must be used within a CreditProvider');
  }
  return context;
};

export const CreditProvider = ({ children }: { children: ReactNode }) => {
  const [balance, setBalance] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  const refreshBalance = async () => {
    if (!user) {
      setBalance(0);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const { data, error } = await supabase.rpc('get_user_credits', {
        p_user_id: user.id
      });

      if (error) throw error;

      const result = data as any;
      if (result?.success) {
        setBalance(result.balance);
      } else {
        // Initialize credits if no record found
        const { data: initData, error: initError } = await supabase.rpc('add_credits', {
          p_user_id: user.id,
          p_amount: 20,
          p_description: 'Initial credits'
        });

        if (initError) throw initError;
        const initResult = initData as any;
        if (initResult?.success) {
          setBalance(initResult.balance);
        }
      }
    } catch (err) {
      console.error('Error fetching credits:', err);
      setError('Failed to fetch credits');
      toast.error('Failed to fetch credits');
    } finally {
      setLoading(false);
    }
  };

  const deductCredits = async (amount: number, moduleName: string, description?: string): Promise<boolean> => {
    if (!user) {
      toast.error('User not authenticated');
      return false;
    }

    try {
      console.log('Deducting credits:', { amount, moduleName, description, userId: user.id });
      
      const { data, error } = await supabase.rpc('deduct_credits', {
        p_user_id: user.id,
        p_amount: amount,
        p_module_name: moduleName,
        p_description: description
      });

      if (error) throw error;

      const result = data as any;
      console.log('Credit deduction result:', result);
      
      if (result?.success) {
        console.log('Setting balance to:', result.balance);
        setBalance(result.balance);
        
        // Force refresh balance to ensure sync
        setTimeout(() => {
          console.log('Force refreshing balance after deduction');
          refreshBalance();
        }, 500);
        
        toast.success(`${amount} credit${amount > 1 ? 's' : ''} deducted successfully`);
        return true;
      } else {
        toast.error(result?.error || 'Failed to deduct credits');
        return false;
      }
    } catch (err) {
      console.error('Error deducting credits:', err);
      toast.error('Failed to deduct credits');
      return false;
    }
  };

  const addCredits = async (amount: number, description?: string): Promise<boolean> => {
    if (!user) {
      toast.error('User not authenticated');
      return false;
    }

    try {
      const { data, error } = await supabase.rpc('add_credits', {
        p_user_id: user.id,
        p_amount: amount,
        p_description: description
      });

      if (error) throw error;

      const result = data as any;
      if (result?.success) {
        setBalance(result.balance);
        toast.success(`${amount} credit${amount > 1 ? 's' : ''} added successfully`);
        return true;
      } else {
        toast.error('Failed to add credits');
        return false;
      }
    } catch (err) {
      console.error('Error adding credits:', err);
      toast.error('Failed to add credits');
      return false;
    }
  };

  useEffect(() => {
    if (user) {
      refreshBalance();
    } else {
      setBalance(0);
      setLoading(false);
    }
  }, [user]);

  const value = {
    balance,
    loading,
    error,
    refreshBalance,
    deductCredits,
    addCredits,
  };

  return <CreditContext.Provider value={value}>{children}</CreditContext.Provider>;
};