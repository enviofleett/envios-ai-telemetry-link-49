
export class CSVProcessor {
  async importRecipientsFromCSV(csvData: string): Promise<Array<{email: string, name?: string}>> {
    const lines = csvData.trim().split('\n');
    const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
    
    const emailIndex = headers.findIndex(h => h.includes('email'));
    const nameIndex = headers.findIndex(h => h.includes('name'));
    
    if (emailIndex === -1) {
      throw new Error('CSV must contain an email column');
    }

    const recipients: Array<{email: string, name?: string}> = [];
    
    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',').map(v => v.trim());
      const email = values[emailIndex];
      
      if (email && this.isValidEmail(email)) {
        recipients.push({
          email,
          name: nameIndex !== -1 ? values[nameIndex] : undefined
        });
      }
    }

    return recipients;
  }

  private isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }
}
