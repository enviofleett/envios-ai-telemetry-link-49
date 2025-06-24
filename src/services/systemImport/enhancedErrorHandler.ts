
export class EnhancedErrorHandler {
  private errors: string[] = [];

  formatErrorsForUser(): string {
    if (this.errors.length === 0) {
      return 'No errors to report';
    }
    return this.errors.join(', ');
  }

  hasCriticalErrors(): boolean {
    return this.errors.some(error => 
      error.toLowerCase().includes('critical') || 
      error.toLowerCase().includes('fatal')
    );
  }

  addError(error: string): void {
    this.errors.push(error);
  }

  clearErrors(): void {
    this.errors = [];
  }
}
