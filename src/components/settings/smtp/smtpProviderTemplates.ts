
export const providerTemplates = {
  gmail: {
    name: 'Gmail',
    host: 'smtp.gmail.com',
    port: 587,
    use_ssl: false,
    use_tls: true
  },
  outlook: {
    name: 'Outlook/Hotmail',
    host: 'smtp-mail.outlook.com',
    port: 587,
    use_ssl: false,
    use_tls: true
  },
  sendgrid: {
    name: 'SendGrid',
    host: 'smtp.sendgrid.net',
    port: 587,
    use_ssl: false,
    use_tls: true
  },
  mailgun: {
    name: 'Mailgun',
    host: 'smtp.mailgun.org',
    port: 587,
    use_ssl: false,
    use_tls: true
  }
};
