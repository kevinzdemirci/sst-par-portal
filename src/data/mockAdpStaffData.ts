import { AdpConnectionConfig } from '../types/adp';

export const DEFAULT_ADP_CONFIG: AdpConnectionConfig = {
  isEnabled: true,
  connectionMode: 'sandbox',
  clientId: 'sst-adp-oauth-client-2026',
  clientSecret: '••••••••••••••••••••••••',
  organizationId: 'SST-TX-CHARTER-WFN',
  apiEndpoint: 'https://api.adp.com/hr/v2/workers',
  lastSyncTimestamp: '2026-09-24T18:00:00Z',
  autoSyncOnParComplete: true,
  webhookUrl: 'https://script.google.com/macros/s/AKfycbwYOUR_APP_SCRIPT_URL/exec',
  environment: 'production'
};

