// EXAMPLE — copy this file to serviceAccount.js and fill in your real values.
// serviceAccount.js is gitignored and will never be committed.
//
// How to get these values:
//   1. Google Cloud Console → IAM & Admin → Service Accounts
//   2. Create or select your service account → Keys → Add Key → JSON
//   3. Open the downloaded JSON file
//   4. Copy client_email into SERVICE_ACCOUNT_EMAIL
//   5. Copy the private_key value (everything between the quotes) into PRIVATE_KEY_PARTS
//      Split on \n boundaries — each element becomes one string in the array.

const PRIVATE_KEY_PARTS = [
  "-----BEGIN PRIVATE KEY-----\n",
  "MIIEvgIBADANBgkqhkiG9w0BAQEFAASCBKgwggSkAgEAAoIBAQC...\n",
  "...(paste remaining key body here, split across array elements as needed)...\n",
  "-----END PRIVATE KEY-----\n",
];

const PRIVATE_KEY = PRIVATE_KEY_PARTS.join('');

// From the client_email field of your downloaded service account JSON
const SERVICE_ACCOUNT_EMAIL = 'superdeli-sa@your-project.iam.gserviceaccount.com';

// Google Drive folder ID for "Deli Pro — All Stores"
// Get from the folder's URL: drive.google.com/drive/folders/FOLDER_ID_HERE
const FOLDER_ID = '13XfeXxVrzPsyXOAUwIGIE2n9XhoaAeWC';
