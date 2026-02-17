export interface JiraIssueResponse {
  id: string;
  key: string;
  self: string;
}

export interface JiraCreateIssueRequest {
  fields: {
    project: {
      key: string;
    };
    summary: string;
    description: any;
    issuetype: {
      name: string;
    };
    priority?: {
      name: string;
    };
    labels?: string[];
  };
}

export interface TeamsMessageCard {
  '@type': 'MessageCard';
  '@context': 'https://schema.org/extensions';
  title: string;
  text: string;
  themeColor?: string;
  sections?: Array<{
    activityTitle?: string;
    activitySubtitle?: string;
    facts?: Array<{
      name: string;
      value: string;
    }>;
  }>;
  potentialAction?: Array<{
    '@type': string;
    name: string;
    targets?: Array<{
      os: string;
      uri: string;
    }>;
  }>;
}
