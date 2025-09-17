import React, { useState, useEffect } from 'react';
import { creditMonitor, CreditOperationLog } from '@/utils/creditMonitoring';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';

/**
 * Debug panel for monitoring credit operations in development
 * Shows recent operations, errors, and system health
 */
export const CreditDebugPanel: React.FC = () => {
  const [logs, setLogs] = useState<CreditOperationLog[]>([]);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Only show in development
    if (process.env.NODE_ENV !== 'development') return;

    const handleCreditOperation = (event: CustomEvent<CreditOperationLog>) => {
      setLogs(prev => [...prev.slice(-19), event.detail]); // Keep last 20
    };

    window.addEventListener('credit-operation', handleCreditOperation as EventListener);
    
    // Initialize with existing logs
    setLogs(creditMonitor.getRecentLogs(20));

    return () => {
      window.removeEventListener('credit-operation', handleCreditOperation as EventListener);
    };
  }, []);

  // Don't render in production
  if (process.env.NODE_ENV !== 'development') {
    return null;
  }

  const getActionColor = (action: string) => {
    switch (action) {
      case 'success': return 'bg-green-500';
      case 'failure': return 'bg-red-500';
      case 'warning': return 'bg-yellow-500';
      case 'attempt': return 'bg-blue-500';
      default: return 'bg-gray-500';
    }
  };

  const errorLogs = logs.filter(log => log.action === 'failure');
  const successRate = logs.length > 0 ? ((logs.filter(log => log.action === 'success').length / logs.length) * 100).toFixed(1) : '0';

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <Button
        onClick={() => setIsVisible(!isVisible)}
        variant="outline"
        size="sm"
        className="mb-2"
      >
        Credit Debug {errorLogs.length > 0 && <Badge variant="destructive" className="ml-1">{errorLogs.length}</Badge>}
      </Button>
      
      {isVisible && (
        <Card className="w-96 max-h-96">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex justify-between items-center">
              Credit Operations
              <div className="flex gap-2 text-xs">
                <span>Success: {successRate}%</span>
                <Button
                  onClick={() => {
                    creditMonitor.clearLogs();
                    setLogs([]);
                  }}
                  variant="ghost"
                  size="sm"
                >
                  Clear
                </Button>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-2">
            <ScrollArea className="h-80">
              {logs.length === 0 ? (
                <p className="text-muted-foreground text-sm">No operations logged yet</p>
              ) : (
                <div className="space-y-2">
                  {logs.slice().reverse().map((log, index) => (
                    <div key={index} className="p-2 border rounded text-xs">
                      <div className="flex justify-between items-center mb-1">
                        <span className="font-medium">{log.moduleType}</span>
                        <div className="flex items-center gap-1">
                          <Badge className={`${getActionColor(log.action)} text-white`} variant="secondary">
                            {log.action}
                          </Badge>
                          <span className="text-muted-foreground">
                            {new Date(log.timestamp).toLocaleTimeString()}
                          </span>
                        </div>
                      </div>
                      {log.error && (
                        <div className="text-red-600 bg-red-50 p-1 rounded mt-1">
                          {log.error}
                        </div>
                      )}
                      {log.details && (
                        <div className="text-muted-foreground mt-1">
                          {JSON.stringify(log.details, null, 1)}
                        </div>
                      )}
                      {log.idempotencyKey && (
                        <div className="text-blue-600 text-xs mt-1">
                          Key: {log.idempotencyKey.slice(-8)}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </CardContent>
        </Card>
      )}
    </div>
  );
};