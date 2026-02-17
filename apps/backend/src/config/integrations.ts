export interface IntegrationConfig {
  jira: {
    url: string;
    email: string;
    apiToken: string;
    projectKey: string;
  };
  teams: {
    webhookUrl: string;
  };
}

export function loadIntegrationConfig(): IntegrationConfig {
  const config: IntegrationConfig = {
    jira: {
      url: process.env.JIRA_URL || '',
      email: process.env.JIRA_EMAIL || '',
      apiToken: process.env.JIRA_API_TOKEN || '',
      projectKey: process.env.JIRA_PROJECT_KEY || 'INC'
    },
    teams: {
      webhookUrl: process.env.TEAMS_WEBHOOK_URL || ''
    }
  };

  if (!config.jira.url || !config.jira.email || !config.jira.apiToken) {
    throw new Error('Missing required Jira configuration');
  }

  if (!config.teams.webhookUrl) {
    console.warn('⚠️  Teams webhook URL not configured - Teams notifications will be disabled');
  }

  return config;
}
