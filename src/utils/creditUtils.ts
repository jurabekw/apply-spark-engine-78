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
  HH_SEARCH: 3,
  LINKEDIN_SEARCH: 2,
  BATCH_ANALYSIS: 5,
} as const;

export type CreditModule = keyof typeof CREDIT_COSTS;