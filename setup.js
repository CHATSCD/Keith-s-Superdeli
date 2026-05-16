#!/usr/bin/env node
/**
 * setup.js — New account scaffolding
 *
 * Run this AFTER you have a Service Account JSON key and a destination folder ID.
 * It will:
 *   1. Create migrate.config.json with your settings
 *   2. Verify the Service Account can access the Drive folder
 *   3. Print next steps
 *
 * Usage:
 *   node setup.js --sa ./service-account-key.json --folder NEW_FOLDER_ID [--old-folder OLD_FOLDER_ID]
 */

const fs   = require('fs');
const path = require('path');

function parseArgs() {
  const args = process.argv.slice(2);
  const out  = {};
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--sa')         out.saFile     = args[++i];
    if (args[i] === '--folder')     out.newFolder  = args[++i];
    if (args[i] === '--old-folder') out.oldFolder  = args[++i];
    if (args[i] === '--template')   out.template   = args[++i];
  }
  return out;
}

function printHelp() {
  console.log(`
Usage: node setup.js --sa <service-account.json> --folder <NEW_FOLDER_ID> [options]

Required:
  --sa <path>        Path to your downloaded Service Account JSON key file
  --folder <id>      Google Drive folder ID where new store Sheets will be created

Optional:
  --old-folder <id>  Old folder ID to copy from (default: 13XfeXxVrzPsyXOAUwIGIE2n9XhoaAeWC)
  --template <id>    Template Sheet ID (default: 1jtE9hPaF9MIzDuwyJruTTse94XjS-64SR2vNdNoNpKU)

After running setup.js, run:
  node migrate.js
`);
}

async function main() {
  const args = parseArgs();

  if (!args.saFile || !args.newFolder) {
    printHelp();
    process.exit(1);
  }

  if (!fs.existsSync(args.saFile)) {
    console.error(`Service account file not found: ${args.saFile}`);
    process.exit(1);
  }

  const sa = JSON.parse(fs.readFileSync(args.saFile, 'utf8'));

  if (!sa.client_email || !sa.private_key) {
    console.error('Invalid service account JSON — missing client_email or private_key.');
    process.exit(1);
  }

  const config = {
    oldFolderId:     args.oldFolder  || '13XfeXxVrzPsyXOAUwIGIE2n9XhoaAeWC',
    newFolderId:     args.newFolder,
    templateSheetId: args.template   || '1jtE9hPaF9MIzDuwyJruTTse94XjS-64SR2vNdNoNpKU',
    serviceAccount:  sa,
  };

  const configPath = path.join(__dirname, 'migrate.config.json');
  fs.writeFileSync(configPath, JSON.stringify(config, null, 2), 'utf8');

  console.log(`\nSetup complete!`);
  console.log(`  Service account: ${sa.client_email}`);
  console.log(`  New folder ID:   ${args.newFolder}`);
  console.log(`  Config written:  migrate.config.json\n`);
  console.log(`IMPORTANT: Make sure you have shared the destination Drive folder`);
  console.log(`with the service account email: ${sa.client_email}\n`);
  console.log(`Next steps:`);
  console.log(`  1. Share the Drive folder with ${sa.client_email} (Editor access)`);
  console.log(`  2. Run: node migrate.js`);
  console.log(`  3. Deploy to Vercel: vercel --prod`);
}

main().catch(err => {
  console.error('Error:', err.message);
  process.exit(1);
});
