
export class TimestampConverter {
  /**
   * Convert various timestamp formats from GP51 to ISO string
   * Enhanced to handle scientific notation like 1.742044592258e+12
   */
  static convertToISO(timestamp: any): string {
    if (!timestamp) {
      console.warn('Empty timestamp provided, using current time');
      return new Date().toISOString();
    }
    
    console.log('Converting timestamp:', timestamp, 'type:', typeof timestamp);
    
    // If it's already a valid ISO string, return it
    if (typeof timestamp === 'string' && timestamp.includes('T') && timestamp.includes('Z')) {
      return timestamp;
    }
    
    let dateValue: Date;
    
    try {
      if (typeof timestamp === 'number') {
        dateValue = this.convertNumericTimestamp(timestamp);
      } else if (typeof timestamp === 'string') {
        dateValue = this.convertStringTimestamp(timestamp);
      } else {
        console.warn('Unknown timestamp type:', typeof timestamp, timestamp);
        dateValue = new Date();
      }
      
      // Validate the date
      if (isNaN(dateValue.getTime())) {
        console.error('Invalid date created from timestamp:', timestamp);
        dateValue = new Date();
      }
      
      // Additional validation for reasonable date range (not too far in past/future)
      const now = Date.now();
      const timeDiff = Math.abs(dateValue.getTime() - now);
      const oneYearMs = 365 * 24 * 60 * 60 * 1000;
      
      if (timeDiff > oneYearMs * 10) { // More than 10 years difference
        console.warn('Timestamp seems unreasonable, using current time:', timestamp, '->', dateValue);
        dateValue = new Date();
      }
      
      const isoString = dateValue.toISOString();
      console.log('Converted timestamp:', timestamp, '->', isoString);
      return isoString;
      
    } catch (error) {
      console.error('Error converting timestamp:', timestamp, error);
      return new Date().toISOString();
    }
  }

  /**
   * Handle numeric timestamp conversion with enhanced scientific notation support
   */
  private static convertNumericTimestamp(timestamp: number): Date {
    // Handle both seconds and milliseconds timestamps
    if (timestamp > 1000000000000) {
      // Milliseconds timestamp (13+ digits or scientific notation resulting in large number)
      return new Date(timestamp);
    } else if (timestamp > 1000000000) {
      // Seconds timestamp (10 digits)
      return new Date(timestamp * 1000);
    } else {
      // Very small number, might be in different format
      console.warn('Unusual numeric timestamp format:', timestamp);
      return new Date();
    }
  }

  /**
   * Handle string timestamp conversion with scientific notation detection
   */
  private static convertStringTimestamp(timestamp: string): Date {
    // Scientific notation pattern detection
    const scientificNotationPattern = /^[+-]?[0-9]*\.?[0-9]+([eE][+-]?[0-9]+)$/;
    
    if (scientificNotationPattern.test(timestamp.trim())) {
      console.log('Detected scientific notation timestamp:', timestamp);
      const numTimestamp = parseFloat(timestamp);
      
      if (isNaN(numTimestamp)) {
        console.error('Failed to parse scientific notation timestamp:', timestamp);
        return new Date();
      }
      
      // Convert scientific notation number using the same logic as numeric timestamps
      return this.convertNumericTimestamp(numTimestamp);
    }
    
    // Try to parse as regular number first
    const numTimestamp = parseFloat(timestamp);
    if (!isNaN(numTimestamp)) {
      return this.convertNumericTimestamp(numTimestamp);
    }
    
    // Try to parse as date string
    const parsedDate = new Date(timestamp);
    if (!isNaN(parsedDate.getTime())) {
      return parsedDate;
    }
    
    console.error('Unable to parse timestamp string:', timestamp);
    return new Date();
  }

  /**
   * Check if a timestamp is recent (within the last specified minutes)
   * Enhanced with better validation
   */
  static isRecent(timestamp: any, maxAgeMinutes: number = 60): boolean {
    try {
      const isoString = this.convertToISO(timestamp);
      const date = new Date(isoString);
      const now = new Date();
      const diffMinutes = (now.getTime() - date.getTime()) / (1000 * 60);
      
      // Additional validation - negative diff means future timestamp
      if (diffMinutes < 0) {
        console.warn('Timestamp is in the future:', timestamp, 'diff:', diffMinutes);
        return false;
      }
      
      const isRecent = diffMinutes <= maxAgeMinutes;
      console.log(`Timestamp recency check: ${diffMinutes.toFixed(2)} minutes old, recent: ${isRecent}`);
      return isRecent;
    } catch (error) {
      console.error('Error checking timestamp recency:', error);
      return false;
    }
  }

  /**
   * Get human-readable time difference for UI display
   */
  static getTimeAgo(timestamp: any): string {
    try {
      const isoString = this.convertToISO(timestamp);
      const date = new Date(isoString);
      const now = new Date();
      const diffMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
      
      if (diffMinutes < 1) return 'Just now';
      if (diffMinutes < 60) return `${diffMinutes} minute${diffMinutes === 1 ? '' : 's'} ago`;
      
      const diffHours = Math.floor(diffMinutes / 60);
      if (diffHours < 24) return `${diffHours} hour${diffHours === 1 ? '' : 's'} ago`;
      
      const diffDays = Math.floor(diffHours / 24);
      return `${diffDays} day${diffDays === 1 ? '' : 's'} ago`;
    } catch (error) {
      console.error('Error calculating time ago:', error);
      return 'Unknown';
    }
  }
}
