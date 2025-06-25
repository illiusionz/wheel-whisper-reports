
interface CircuitBreakerConfig {
  failureThreshold: number;
  resetTimeout: number;
  monitoringPeriod: number;
  name: string;
}

interface CircuitBreakerState {
  failures: number;
  lastFailureTime: number;
  state: 'CLOSED' | 'OPEN' | 'HALF_OPEN';
  nextAttempt: number;
}

interface CircuitBreakerStats {
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  circuitOpenCount: number;
  lastStateChange: number;
}

export class CircuitBreaker {
  private config: CircuitBreakerConfig;
  private state: CircuitBreakerState;
  private stats: CircuitBreakerStats;
  private listeners: Array<(state: string, error?: Error) => void> = [];

  constructor(config: Partial<CircuitBreakerConfig> = {}) {
    this.config = {
      failureThreshold: config.failureThreshold || 5,
      resetTimeout: config.resetTimeout || 60000, // 1 minute
      monitoringPeriod: config.monitoringPeriod || 300000, // 5 minutes
      name: config.name || 'unnamed-circuit'
    };

    this.state = {
      failures: 0,
      lastFailureTime: 0,
      state: 'CLOSED',
      nextAttempt: 0
    };

    this.stats = {
      totalRequests: 0,
      successfulRequests: 0,
      failedRequests: 0,
      circuitOpenCount: 0,
      lastStateChange: Date.now()
    };
  }

  async execute<T>(operation: () => Promise<T>): Promise<T> {
    const now = Date.now();
    this.stats.totalRequests++;

    // Check if circuit should be closed after reset timeout
    if (this.state.state === 'OPEN' && now >= this.state.nextAttempt) {
      this.state.state = 'HALF_OPEN';
      this.notifyListeners('HALF_OPEN');
      console.log(`Circuit breaker ${this.config.name} transitioning to HALF_OPEN`);
    }

    // Reject immediately if circuit is open
    if (this.state.state === 'OPEN') {
      const error = new Error(`Circuit breaker ${this.config.name} is OPEN. Service temporarily unavailable.`);
      this.stats.failedRequests++;
      throw error;
    }

    try {
      const result = await operation();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure(error instanceof Error ? error : new Error('Unknown error'));
      throw error;
    }
  }

  private onSuccess(): void {
    this.stats.successfulRequests++;
    
    if (this.state.state === 'HALF_OPEN') {
      this.reset();
      console.log(`Circuit breaker ${this.config.name} reset to CLOSED after successful request`);
    }
  }

  private onFailure(error: Error): void {
    this.stats.failedRequests++;
    this.state.failures++;
    this.state.lastFailureTime = Date.now();

    console.error(`Circuit breaker ${this.config.name} recorded failure:`, error.message);

    if (this.state.failures >= this.config.failureThreshold) {
      this.trip();
    }
  }

  private trip(): void {
    this.state.state = 'OPEN';
    this.state.nextAttempt = Date.now() + this.config.resetTimeout;
    this.stats.circuitOpenCount++;
    this.stats.lastStateChange = Date.now();
    
    console.warn(`Circuit breaker ${this.config.name} tripped to OPEN state. Next attempt in ${this.config.resetTimeout}ms`);
    this.notifyListeners('OPEN');
  }

  private reset(): void {
    this.state.failures = 0;
    this.state.state = 'CLOSED';
    this.state.lastFailureTime = 0;
    this.state.nextAttempt = 0;
    this.stats.lastStateChange = Date.now();
    
    this.notifyListeners('CLOSED');
  }

  public getState(): string {
    return this.state.state;
  }

  public getStats(): CircuitBreakerStats & { config: CircuitBreakerConfig; currentFailures: number } {
    return {
      ...this.stats,
      config: { ...this.config },
      currentFailures: this.state.failures
    };
  }

  public isAvailable(): boolean {
    return this.state.state !== 'OPEN';
  }

  public onStateChange(listener: (state: string, error?: Error) => void): void {
    this.listeners.push(listener);
  }

  private notifyListeners(state: string, error?: Error): void {
    this.listeners.forEach(listener => {
      try {
        listener(state, error);
      } catch (err) {
        console.error('Circuit breaker listener error:', err);
      }
    });
  }

  public forceOpen(): void {
    this.trip();
  }

  public forceReset(): void {
    this.reset();
  }
}

// Circuit breaker manager for managing multiple circuit breakers
export class CircuitBreakerManager {
  private static instance: CircuitBreakerManager;
  private breakers: Map<string, CircuitBreaker> = new Map();

  static getInstance(): CircuitBreakerManager {
    if (!CircuitBreakerManager.instance) {
      CircuitBreakerManager.instance = new CircuitBreakerManager();
    }
    return CircuitBreakerManager.instance;
  }

  getOrCreate(name: string, config?: Partial<CircuitBreakerConfig>): CircuitBreaker {
    if (!this.breakers.has(name)) {
      this.breakers.set(name, new CircuitBreaker({ ...config, name }));
    }
    return this.breakers.get(name)!;
  }

  getAllStats(): Array<{ name: string; stats: ReturnType<CircuitBreaker['getStats']> }> {
    return Array.from(this.breakers.entries()).map(([name, breaker]) => ({
      name,
      stats: breaker.getStats()
    }));
  }

  reset(name: string): boolean {
    const breaker = this.breakers.get(name);
    if (breaker) {
      breaker.forceReset();
      return true;
    }
    return false;
  }

  resetAll(): void {
    this.breakers.forEach(breaker => breaker.forceReset());
  }
}
