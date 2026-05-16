// EXAMPLE — copy this to serviceAccount.js and fill in your real values.
// serviceAccount.js is in .gitignore and will never be committed.

const SERVICE_ACCOUNT = {
  type: 'service_account',
  project_id: 'your-project-id',
  private_key_id: 'abc123',
  // Paste private key lines as an array (matches existing Deli Pro pattern)
  private_key_lines: [
    '-----BEGIN RSA PRIVATE KEY-----',
    'MIIEowIBAAKCAQEA...',
    '...',
    '-----END RSA PRIVATE KEY-----',
  ],
  client_email: 'superdeli@your-project.iam.gserviceaccount.com',
  client_id: '123456789',
  auth_uri: 'https://accounts.google.com/o/oauth2/auth',
  token_uri: 'https://oauth2.googleapis.com/token',
};

SERVICE_ACCOUNT.private_key = SERVICE_ACCOUNT.private_key_lines.join('\n');
