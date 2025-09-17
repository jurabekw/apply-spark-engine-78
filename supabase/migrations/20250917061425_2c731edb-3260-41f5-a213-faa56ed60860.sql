-- Fix credit system issues (fixed version)

-- 1. Make user_id NOT NULL and UNIQUE in user_credits
ALTER TABLE user_credits 
  ALTER COLUMN user_id SET NOT NULL;

-- Add unique constraint only if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'user_credits_user_id_unique'
    ) THEN
        ALTER TABLE user_credits 
        ADD CONSTRAINT user_credits_user_id_unique UNIQUE (user_id);
    END IF;
END $$;

-- 2. Add idempotency support to credit_transactions
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'credit_transactions' 
        AND column_name = 'idempotency_key'
    ) THEN
        ALTER TABLE credit_transactions 
        ADD COLUMN idempotency_key TEXT;
    END IF;
END $$;

DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'credit_transactions_idempotency_key_unique'
    ) THEN
        ALTER TABLE credit_transactions 
        ADD CONSTRAINT credit_transactions_idempotency_key_unique UNIQUE (idempotency_key);
    END IF;
END $$;