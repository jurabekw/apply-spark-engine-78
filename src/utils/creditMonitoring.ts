/**
 * Credit system monitoring and logging utilities
 * Provides centralized tracking of credit operations for debugging and analytics
 */

export interface CreditOperationLog {
  userId: string;
  moduleType: string;
  action: 'attempt' | 'success' | 'failure' | 'warning';
  timestamp: number;
  details?: any;
  error?: string;
  idempotencyKey?: string;
}

class CreditMonitor {
  private logs: CreditOperationLog[] = [];
  private maxLogs = 100; // Keep last 100 operations in memory

  /**
   * Log a credit operation for debugging and monitoring
   */
  log(operation: CreditOperationLog) {
    this.logs.push(operation);
    
    // Keep only the most recent logs
    if (this.logs.length > this.maxLogs) {
      this.logs = this.logs.slice(-this.maxLogs);
    }

    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.log(`[Credit Monitor] ${operation.action.toUpperCase()}: ${operation.moduleType}`, operation);
    }

    // Dispatch event for real-time monitoring components
    try {
      window.dispatchEvent(new CustomEvent('credit-operation', { detail: operation }));
    } catch (e) {
      // Silent fail if window doesn't exist (SSR)
    }
  }

  /**
   * Get recent logs for debugging
   */
  getRecentLogs(count = 20): CreditOperationLog[] {
    return this.logs.slice(-count);
  }

  /**
   * Get logs for specific user
   */
  getUserLogs(userId: string, count = 10): CreditOperationLog[] {
    return this.logs
      .filter(log => log.userId === userId)
      .slice(-count);
  }

  /**
   * Get error logs for troubleshooting
   */
  getErrorLogs(count = 10): CreditOperationLog[] {
    return this.logs
      .filter(log => log.action === 'failure')
      .slice(-count);
  }

  /**
   * Clear logs (useful for testing)
   */
  clearLogs() {
    this.logs = [];
  }

  /**
   * Export logs for support/debugging
   */
  exportLogs(): string {
    return JSON.stringify(this.logs, null, 2);
  }
}

// Singleton instance
export const creditMonitor = new CreditMonitor();

/**
 * Helper function to log credit operations
 */
export const logCreditOperation = (operation: Omit<CreditOperationLog, 'timestamp'>) => {
  creditMonitor.log({
    ...operation,
    timestamp: Date.now()
  });
};

/**
 * Helper to measure and log operation duration
 */
export const withCreditMonitoring = async <T>(
  operation: () => Promise<T>,
  context: Omit<CreditOperationLog, 'timestamp' | 'action'>
): Promise<T> => {
  const startTime = Date.now();
  
  logCreditOperation({
    ...context,
    action: 'attempt'
  });

  try {
    const result = await operation();
    
    logCreditOperation({
      ...context,
      action: 'success',
      details: { duration: Date.now() - startTime }
    });
    
    return result;
  } catch (error) {
    logCreditOperation({
      ...context,
      action: 'failure',
      error: error instanceof Error ? error.message : String(error),
      details: { duration: Date.now() - startTime }
    });
    
    throw error;
  }
};
