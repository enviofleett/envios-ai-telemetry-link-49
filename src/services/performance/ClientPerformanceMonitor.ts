
export interface PerformanceMetrics {
  pageLoadTime: number;
  domContentLoaded: number;
  firstContentfulPaint: number;
  largestContentfulPaint: number;
  timeToInteractive: number;
  memoryUsage?: number;
  navigationTiming: PerformanceTiming;
}

export interface ComponentPerformance {
  componentName: string;
  renderTime: number;
  reRenderCount: number;
  lastRender: Date;
}

class ClientPerformanceMonitor {
  private metrics: PerformanceMetrics | null = null;
  private componentMetrics = new Map<string, ComponentPerformance>();
  private observers: PerformanceObserver[] = [];

  public initialize(): void {
    this.collectWebVitals();
    this.setupPerformanceObservers();
    this.collectNavigationTiming();
  }

  private collectWebVitals(): void {
    // Collect Core Web Vitals
    if ('web-vital' in window || 'PerformanceObserver' in window) {
      try {
        // First Contentful Paint
        new PerformanceObserver((list) => {
          const entries = list.getEntries();
          entries.forEach((entry) => {
            if (entry.name === 'first-contentful-paint') {
              console.log('FCP:', entry.startTime);
            }
          });
        }).observe({ entryTypes: ['paint'] });

        // Largest Contentful Paint
        new PerformanceObserver((list) => {
          const entries = list.getEntries();
          const lastEntry = entries[entries.length - 1];
          console.log('LCP:', lastEntry.startTime);
        }).observe({ entryTypes: ['largest-contentful-paint'] });

      } catch (error) {
        console.warn('Performance observers not fully supported');
      }
    }
  }

  private setupPerformanceObservers(): void {
    if ('PerformanceObserver' in window) {
      // Navigation timing
      const navObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach((entry) => {
          console.log('Navigation timing:', entry);
        });
      });
      
      try {
        navObserver.observe({ entryTypes: ['navigation'] });
        this.observers.push(navObserver);
      } catch (error) {
        console.warn('Navigation observer not supported');
      }
    }
  }

  private collectNavigationTiming(): void {
    if (window.performance && window.performance.timing) {
      const timing = window.performance.timing;
      const pageLoadTime = timing.loadEventEnd - timing.navigationStart;
      const domContentLoaded = timing.domContentLoadedEventEnd - timing.navigationStart;
      
      this.metrics = {
        pageLoadTime,
        domContentLoaded,
        firstContentfulPaint: 0,
        largestContentfulPaint: 0,
        timeToInteractive: 0,
        memoryUsage: this.getMemoryUsage(),
        navigationTiming: timing
      };
    }
  }

  private getMemoryUsage(): number | undefined {
    if ('memory' in performance) {
      const memory = (performance as any).memory;
      return memory.usedJSHeapSize / 1024 / 1024; // Convert to MB
    }
    return undefined;
  }

  public trackComponentRender(componentName: string, renderTime: number): void {
    const existing = this.componentMetrics.get(componentName);
    
    if (existing) {
      this.componentMetrics.set(componentName, {
        ...existing,
        renderTime: Math.max(existing.renderTime, renderTime),
        reRenderCount: existing.reRenderCount + 1,
        lastRender: new Date()
      });
    } else {
      this.componentMetrics.set(componentName, {
        componentName,
        renderTime,
        reRenderCount: 1,
        lastRender: new Date()
      });
    }
  }

  public getMetrics(): PerformanceMetrics | null {
    return this.metrics;
  }

  public getComponentMetrics(): ComponentPerformance[] {
    return Array.from(this.componentMetrics.values());
  }

  public getPerformanceSummary() {
    const metrics = this.getMetrics();
    const components = this.getComponentMetrics();
    const slowComponents = components.filter(c => c.renderTime > 100);
    
    return {
      pagePerformance: {
        loadTime: metrics?.pageLoadTime || 0,
        domReady: metrics?.domContentLoaded || 0,
        memoryUsage: metrics?.memoryUsage || 0
      },
      componentPerformance: {
        total: components.length,
        slowComponents: slowComponents.length,
        averageRenderTime: components.length > 0 
          ? components.reduce((sum, c) => sum + c.renderTime, 0) / components.length 
          : 0
      },
      recommendations: this.getRecommendations(slowComponents)
    };
  }

  private getRecommendations(slowComponents: ComponentPerformance[]): string[] {
    const recommendations: string[] = [];
    
    if (slowComponents.length > 0) {
      recommendations.push(`Optimize ${slowComponents.length} slow-rendering components`);
    }
    
    if (this.metrics && this.metrics.pageLoadTime > 3000) {
      recommendations.push('Page load time exceeds 3 seconds - consider code splitting');
    }
    
    if (this.metrics && this.metrics.memoryUsage && this.metrics.memoryUsage > 50) {
      recommendations.push('High memory usage detected - review for memory leaks');
    }
    
    return recommendations;
  }

  public cleanup(): void {
    this.observers.forEach(observer => observer.disconnect());
    this.observers = [];
  }
}

export const clientPerformanceMonitor = new ClientPerformanceMonitor();
