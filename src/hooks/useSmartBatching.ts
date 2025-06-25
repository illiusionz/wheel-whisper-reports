
import { useCallback, useRef, useState } from 'react';

interface BatchConfig {
  maxBatchSize: number;
  maxWaitTime: number;
  minWaitTime: number;
}

interface BatchItem<T> {
  key: string;
  data: T;
  timestamp: number;
  resolve: (result: any) => void;
  reject: (error: Error) => void;
}

export const useSmartBatching = <T, R>(
  batchProcessor: (items: T[]) => Promise<R[]>,
  config: BatchConfig = {
    maxBatchSize: 10,
    maxWaitTime: 1000,
    minWaitTime: 100
  }
) => {
  const [currentBatch, setCurrentBatch] = useState<BatchItem<T>[]>([]);
  const batchTimeoutRef = useRef<NodeJS.Timeout>();
  const processingRef = useRef(false);

  const processBatch = useCallback(async () => {
    if (processingRef.current || currentBatch.length === 0) return;

    processingRef.current = true;
    const itemsToProcess = [...currentBatch];
    setCurrentBatch([]);

    try {
      const results = await batchProcessor(itemsToProcess.map(item => item.data));
      
      itemsToProcess.forEach((item, index) => {
        item.resolve(results[index]);
      });
    } catch (error) {
      itemsToProcess.forEach(item => {
        item.reject(error as Error);
      });
    } finally {
      processingRef.current = false;
    }
  }, [currentBatch, batchProcessor]);

  const addToBatch = useCallback((key: string, data: T): Promise<R> => {
    return new Promise((resolve, reject) => {
      const item: BatchItem<T> = {
        key,
        data,
        timestamp: Date.now(),
        resolve,
        reject
      };

      setCurrentBatch(prev => {
        const newBatch = [...prev, item];
        
        // Clear existing timeout
        if (batchTimeoutRef.current) {
          clearTimeout(batchTimeoutRef.current);
        }

        // Process immediately if batch is full
        if (newBatch.length >= config.maxBatchSize) {
          setTimeout(processBatch, 0);
          return newBatch;
        }

        // Set timeout for processing
        const waitTime = Math.max(
          config.minWaitTime,
          Math.min(config.maxWaitTime, config.maxWaitTime - (Date.now() - item.timestamp))
        );

        batchTimeoutRef.current = setTimeout(processBatch, waitTime);
        
        return newBatch;
      });
    });
  }, [config, processBatch]);

  return {
    addToBatch,
    currentBatchSize: currentBatch.length,
    isProcessing: processingRef.current
  };
};
