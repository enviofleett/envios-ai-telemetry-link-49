
export class TimestampConverter {
  /**
   * Convert various timestamp formats from GP51 to ISO string
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
        // Handle both seconds and milliseconds timestamps
        if (timestamp > 1000000000000) {
          // Milliseconds timestamp (13+ digits)
          dateValue = new Date(timestamp);
        } else if (timestamp > 1000000000) {
          // Seconds timestamp (10 digits)
          dateValue = new Date(timestamp * 1000);
        } else {
          // Very small number, might be in different format
          console.warn('Unusual timestamp format:', timestamp);
          dateValue = new Date();
        }
      } else if (typeof timestamp === 'string') {
        // Try to parse as number first
        const numTimestamp = parseFloat(timestamp);
        if (!isNaN(numTimestamp)) {
          if (numTimestamp > 1000000000000) {
            dateValue = new Date(numTimestamp);
          } else if (numTimestamp > 1000000000) {
            dateValue = new Date(numTimestamp * 1000);
          } else {
            dateValue = new Date(timestamp);
          }
        } else {
          dateValue = new Date(timestamp);
        }
      } else {
        console.warn('Unknown timestamp type:', typeof timestamp, timestamp);
        dateValue = new Date();
      }
      
      // Validate the date
      if (isNaN(dateValue.getTime())) {
        console.error('Invalid date created from timestamp:', timestamp);
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
   * Check if a timestamp is recent (within the last hour)
   */
  static isRecent(timestamp: any, maxAgeMinutes: number = 60): boolean {
    try {
      const isoString = this.convertToISO(timestamp);
      const date = new Date(isoString);
      const now = new Date();
      const diffMinutes = (now.getTime() - date.getTime()) / (1000 * 60);
      return diffMinutes <= maxAgeMinutes;
    } catch (error) {
      console.error('Error checking timestamp recency:', error);
      return false;
    }
  }
}
