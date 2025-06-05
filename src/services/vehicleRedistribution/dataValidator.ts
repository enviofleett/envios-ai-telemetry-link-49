
export class DataValidator {
  static isValidGp51Username(username?: string): boolean {
    return !!(username && 
      username.trim() !== '' && 
      username !== 'User');
  }

  static validateGp51Username(username?: string, context: string = ''): boolean {
    if (!this.isValidGp51Username(username)) {
      console.log(`Invalid GP51 username provided${context ? ` for ${context}` : ''}: "${username}". Skipping operation.`);
      return false;
    }
    return true;
  }

  static categorizeGp51Username(username?: string): 'valid' | 'empty' | 'generic' {
    if (!username || username.trim() === '') {
      return 'empty';
    }
    if (username === 'User') {
      return 'generic';
    }
    return 'valid';
  }
}
