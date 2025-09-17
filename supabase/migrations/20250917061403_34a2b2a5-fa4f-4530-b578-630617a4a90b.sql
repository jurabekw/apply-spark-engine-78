-- Fix credit system issues

-- 1. Make user_id NOT NULL and UNIQUE in user_credits
ALTER TABLE user_credits 
  ALTER COLUMN user_id SET NOT NULL,
  ADD CONSTRAINT user_credits_user_id_unique UNIQUE (user_id);

-- 2. Add idempotency support to credit_transactions
ALTER TABLE credit_transactions 
  ADD COLUMN idempotency_key TEXT,
  ADD CONSTRAINT credit_transactions_idempotency_key_unique UNIQUE (idempotency_key);

-- 3. Add updated_at trigger for user_credits
CREATE TRIGGER update_user_credits_updated_at
  BEFORE UPDATE ON user_credits
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- 4. Update credit functions with idempotency support
CREATE OR REPLACE FUNCTION public.deduct_credits(
  p_user_id uuid, 
  p_amount integer, 
  p_module_name text, 
  p_description text DEFAULT NULL::text,
  p_idempotency_key text DEFAULT NULL::text
) RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
DECLARE
  v_current_balance INTEGER;
  v_new_balance INTEGER;
  v_existing_transaction_id UUID;
BEGIN
  -- Check for existing transaction with same idempotency key
  IF p_idempotency_key IS NOT NULL THEN
    SELECT id INTO v_existing_transaction_id
    FROM credit_transactions 
    WHERE idempotency_key = p_idempotency_key 
    AND user_id = p_user_id
    LIMIT 1;
    
    IF FOUND THEN
      -- Return current balance for idempotent response
      SELECT balance INTO v_current_balance
      FROM user_credits
      WHERE user_id = p_user_id;
      
      RETURN json_build_object(
        'success', true, 
        'balance', COALESCE(v_current_balance, 0), 
        'deducted', p_amount,
        'message', 'Operation already processed (idempotent)'
      );
    END IF;
  END IF;

  -- Get current balance with lock
  SELECT balance INTO v_current_balance
  FROM user_credits
  WHERE user_id = p_user_id
  FOR UPDATE;
  
  -- Check if user has enough credits
  IF v_current_balance IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'No credit record found', 'balance', 0);
  END IF;
  
  IF v_current_balance < p_amount THEN
    RETURN json_build_object('success', false, 'error', 'Insufficient credits', 'balance', v_current_balance);
  END IF;
  
  -- Calculate new balance
  v_new_balance := v_current_balance - p_amount;
  
  -- Update balance
  UPDATE user_credits
  SET balance = v_new_balance,
      updated_at = NOW()
  WHERE user_id = p_user_id;
  
  -- Log transaction with idempotency key
  INSERT INTO credit_transactions (user_id, amount, type, module_name, description, balance_after, idempotency_key)
  VALUES (p_user_id, p_amount, 'deduct', p_module_name, COALESCE(p_description, 'Credit deduction'), v_new_balance, p_idempotency_key);
  
  RETURN json_build_object('success', true, 'balance', v_new_balance, 'deducted', p_amount);

EXCEPTION 
  WHEN unique_violation THEN
    -- Handle race condition on idempotency key
    IF p_idempotency_key IS NOT NULL THEN
      SELECT balance INTO v_current_balance
      FROM user_credits
      WHERE user_id = p_user_id;
      
      RETURN json_build_object(
        'success', true, 
        'balance', COALESCE(v_current_balance, 0), 
        'deducted', p_amount,
        'message', 'Operation already processed (race condition)'
      );
    ELSE
      RETURN json_build_object('success', false, 'error', 'Concurrent operation detected');
    END IF;
  WHEN OTHERS THEN
    RETURN json_build_object('success', false, 'error', 'Error deducting credits: ' || SQLERRM);
END;
$function$;

-- 5. Update add_credits function with idempotency support
CREATE OR REPLACE FUNCTION public.add_credits(
  p_user_id uuid, 
  p_amount integer, 
  p_description text DEFAULT 'Credits added'::text,
  p_idempotency_key text DEFAULT NULL::text
) RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
DECLARE
  v_current_balance INTEGER;
  v_new_balance INTEGER;
  v_existing_transaction_id UUID;
BEGIN
  -- Check for existing transaction with same idempotency key
  IF p_idempotency_key IS NOT NULL THEN
    SELECT id INTO v_existing_transaction_id
    FROM credit_transactions 
    WHERE idempotency_key = p_idempotency_key 
    AND user_id = p_user_id
    LIMIT 1;
    
    IF FOUND THEN
      -- Return current balance for idempotent response
      SELECT balance INTO v_current_balance
      FROM user_credits
      WHERE user_id = p_user_id;
      
      RETURN json_build_object(
        'success', true, 
        'balance', COALESCE(v_current_balance, 0), 
        'added', p_amount,
        'message', 'Operation already processed (idempotent)'
      );
    END IF;
  END IF;

  -- Get current balance with lock
  SELECT balance INTO v_current_balance
  FROM user_credits
  WHERE user_id = p_user_id
  FOR UPDATE;
  
  -- Create record if it doesn't exist
  IF v_current_balance IS NULL THEN
    INSERT INTO user_credits (user_id, balance)
    VALUES (p_user_id, p_amount)
    RETURNING balance INTO v_new_balance;
  ELSE
    -- Calculate new balance
    v_new_balance := v_current_balance + p_amount;
    
    -- Update balance
    UPDATE user_credits
    SET balance = v_new_balance,
        updated_at = NOW()
    WHERE user_id = p_user_id;
  END IF;
  
  -- Log transaction with idempotency key
  INSERT INTO credit_transactions (user_id, amount, type, description, balance_after, idempotency_key)
  VALUES (p_user_id, p_amount, 'add', p_description, v_new_balance, p_idempotency_key);
  
  RETURN json_build_object('success', true, 'balance', v_new_balance, 'added', p_amount);

EXCEPTION 
  WHEN unique_violation THEN
    -- Handle race condition on idempotency key
    IF p_idempotency_key IS NOT NULL THEN
      SELECT balance INTO v_current_balance
      FROM user_credits
      WHERE user_id = p_user_id;
      
      RETURN json_build_object(
        'success', true, 
        'balance', COALESCE(v_current_balance, 0), 
        'added', p_amount,
        'message', 'Operation already processed (race condition)'
      );
    ELSE
      RETURN json_build_object('success', false, 'error', 'Concurrent operation detected');
    END IF;
  WHEN OTHERS THEN
    RETURN json_build_object('success', false, 'error', 'Error adding credits: ' || SQLERRM);
END;
$function$;