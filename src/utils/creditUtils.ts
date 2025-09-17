import { generateIdempotencyKey } from './fileUtils';

export interface CreditDeductionOptions {
  amount: number;
  moduleName: string;
  description?: string;
  userId: string;
}

export const generateCreditIdempotencyKey = (userId: string, moduleName: string): string => {
  return generateIdempotencyKey(userId, moduleName);
};

export const CREDIT_COSTS = {
  RESUME_ANALYSIS: 1,
  HH_SEARCH: 1,
  LINKEDIN_SEARCH: 1,
  BATCH_ANALYSIS: 1,
} as const;

export type CreditModule = keyof typeof CREDIT_COSTS;