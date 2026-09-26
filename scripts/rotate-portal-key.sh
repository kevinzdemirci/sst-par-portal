#!/bin/bash
# Creates a new portal key and installs it in both places at once, with no copy-paste:
#   1. Firebase secret APPS_SCRIPT_KEY (used by the portalRelay Cloud Function)
#   2. google-apps-script/deployed/PortalKey.js, pushed to the live Apps Script
# Then republishes the Apps Script (same web app link) and the portalRelay function.
# Needs: firebase-tools login and `npx @google/clasp login` as the script's owner.
set -euo pipefail
cd "$(dirname "$0")/.."

DEPLOYMENT_ID="AKfycbxWeeFyMDYwzMQPtBWYJSviK_cK9aDUiZphJd85b-npKo0kM7rEaGWqyyuLMV6fupppJg"
KEY=$(openssl rand -hex 24)

echo "1/4 Saving the new key in Firebase…"
printf %s "$KEY" | npx --yes firebase-tools functions:secrets:set APPS_SCRIPT_KEY --data-file=-

echo "2/4 Writing the key into the Apps Script…"
printf '// Written by scripts/rotate-portal-key.sh. Do not share or commit.\nvar PORTAL_KEY_VALUE = "%s";\n' "$KEY" > google-apps-script/deployed/PortalKey.js

echo "3/4 Publishing the Apps Script (same link)…"
(cd google-apps-script/deployed && npx --yes @google/clasp push -f && npx --yes @google/clasp deploy -i "$DEPLOYMENT_ID" -d "Rotate portal key")

echo "4/4 Publishing the portal's server check…"
npx --yes firebase-tools deploy --only functions:portalRelay --non-interactive

echo
echo "✅ Done. Portal key is ${#KEY} characters and installed on both sides."
