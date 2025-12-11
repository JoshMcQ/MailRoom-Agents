# MailRoom Agents - System Architecture

## Overview

MailRoom Agents is a multi-tenant SaaS platform that leverages AI to automate email management for organizations. The system uses policy-controlled agents to classify emails, draft responses, enforce compliance rules, and trigger automated actions across integrated systems.

## Core Components

### 1. Multi-Tenant Architecture

Each organization (tenant) operates in an isolated environment with:
- Dedicated mailboxes (shared or personal)
- Custom agents and policies
- Independent analytics and SLA tracking
- Configurable integrations

### 2. AI Agent System

Agents are the core automation units that:
- **Classify**: Analyze emails for category, urgency, sentiment, and intent
- **Draft**: Generate contextual responses following brand guidelines
- **Route**: Direct emails to appropriate teams or agents
- **Execute**: Trigger actions based on email content and rules

### 3. Policy Engine

Policies define how agents should behave:

#### Tone Settings
- **Formal**: Professional, traditional business communication
- **Casual**: Relaxed, approachable language
- **Friendly**: Warm, personable responses
- **Professional**: Balanced professionalism

#### PII Settings
- Automatic detection of sensitive information
- Configurable masking and handling rules
- Support for various PII types (SSN, credit cards, addresses, etc.)

#### Routing Rules
Condition-based email routing:
```typescript
{
  condition: {
    field: "classification.urgency",
    operator: "equals",
    value: "critical"
  },
  action: {
    type: "escalate",
    target: "senior-support-team"
  }
}
```

### 4. Email Processing Pipeline

```
1. Receive → Email arrives in mailbox
2. Classify → AI analyzes content and metadata
3. Route → Apply routing rules to assign agent
4. Draft → Generate response based on policy
5. Review → Human operator reviews (optional)
6. Act → Trigger integrations (tickets, CRM, etc.)
7. Send → Deliver approved response
8. Track → Monitor SLA and performance
```

### 5. Integration Framework

#### Email Providers
- **IMAP**: Generic email server support
- **Gmail**: Google Workspace integration
- **Outlook**: Microsoft 365 integration

#### Action Integrations
- **Ticketing**: Create/update tickets in Jira, Linear, etc.
- **CRM**: Sync contacts and activities in Salesforce, HubSpot
- **Slack**: Send notifications to channels
- **Webhooks**: Custom HTTP endpoints for extensibility

### 6. Analytics & Monitoring

Track key metrics:
- **Email Volume**: Total, classified, drafted, sent
- **Response Time**: Average time to first response
- **SLA Compliance**: Percentage of emails meeting targets
- **Agent Performance**: Processing counts, confidence scores, accuracy

## Database Schema

### Core Tables

**tenants**: Organizations using the platform
- Settings for max agents, mailboxes, features

**mailboxes**: Email accounts managed by the system
- Linked to tenants, supports shared/personal types

**emails**: Incoming and outgoing email records
- Full content, classification, status tracking

**agents**: AI assistants with specific capabilities
- Linked to policies for behavior control

**policies**: Governance rules for agents
- Tone, PII, routing configurations

**drafts**: AI-generated email responses
- Confidence scores and suggestions

**actions**: Triggered integrations
- Payload, status, results tracking

**queues**: Email processing queues
- SLA targets, assigned agents

**slas**: Service level tracking
- Target vs. actual response times

**integrations**: External service connections
- Credentials and configuration

## API Design

### Classification API
```typescript
POST /api/classify
{
  "emailId": "uuid",
  "policyId": "uuid" // optional
}

Response:
{
  "success": true,
  "classification": {
    "category": "Support",
    "urgency": "high",
    "sentiment": "negative",
    "intent": "Report bug",
    "tags": ["technical", "urgent"],
    "confidence": 0.92
  }
}
```

### Draft Generation API
```typescript
POST /api/draft
{
  "emailId": "uuid",
  "agentId": "uuid",
  "policyId": "uuid" // optional
}

Response:
{
  "success": true,
  "draft": {
    "id": "uuid",
    "content": "...",
    "confidence": 0.88,
    "suggestions": [...]
  }
}
```

### Action Execution API
```typescript
POST /api/actions
{
  "emailId": "uuid",
  "actionType": "create_ticket",
  "payload": {
    "title": "Customer issue",
    "description": "...",
    "priority": "high"
  }
}

Response:
{
  "success": true,
  "action": {
    "id": "uuid",
    "status": "completed",
    "result": {
      "ticketId": "TICKET-1234",
      "url": "..."
    }
  }
}
```

### Analytics API
```typescript
GET /api/analytics?tenantId={uuid}&periodStart={iso}&periodEnd={iso}

Response:
{
  "tenant_id": "uuid",
  "period_start": "2024-01-01T00:00:00Z",
  "period_end": "2024-01-31T23:59:59Z",
  "metrics": {
    "total_emails": 1250,
    "classified_emails": 1200,
    "drafted_emails": 950,
    "sent_emails": 900,
    "avg_response_time": 145, // minutes
    "sla_compliance_rate": 94.5,
    "agent_performance": {
      "Support Bot": {
        "emails_processed": 450,
        "drafts_created": 430,
        "avg_confidence": 0.89,
        "accuracy_rate": 0.95
      }
    }
  }
}
```

## Security Considerations

### Data Isolation
- Row-level security in Supabase
- Tenant-scoped queries
- Separate encryption keys per tenant

### PII Protection
- Automatic detection and masking
- Configurable handling policies
- Audit logging for compliance

### API Security
- Authentication required for all endpoints
- Rate limiting to prevent abuse
- Input validation and sanitization

### Integration Security
- Encrypted credential storage
- OAuth 2.0 for supported services
- Webhook signature verification

## Deployment

### Environment Setup
1. Create Supabase project
2. Run database migrations
3. Configure environment variables
4. Deploy to Vercel or similar platform

### Scaling Considerations
- Database connection pooling
- Background job processing for email sync
- Caching for frequently accessed data
- CDN for static assets

### Monitoring
- Application logs for debugging
- Performance metrics tracking
- Error tracking and alerting
- Usage analytics

## Extension Points

### Custom Agents
Extend the agent system with specialized behaviors:
- Domain-specific classification models
- Custom draft templates
- Specialized routing logic

### Custom Actions
Add new integration types:
- Additional CRM systems
- Project management tools
- Custom workflows

### Custom Policies
Create industry-specific policies:
- HIPAA compliance for healthcare
- GDPR compliance for EU
- Financial services regulations

## Best Practices

### Email Classification
- Use representative training data
- Set appropriate confidence thresholds
- Provide feedback loops for improvement

### Draft Generation
- Define clear tone guidelines
- Provide examples in policy settings
- Review and adjust templates regularly

### SLA Management
- Set realistic targets based on capacity
- Monitor trends to identify bottlenecks
- Adjust agent assignments dynamically

### Integration Management
- Test integrations in staging first
- Implement retry logic for failures
- Monitor integration health metrics

## Troubleshooting

### Common Issues

**Emails not being classified**
- Check OPENAI_API_KEY is configured
- Verify agent has "classify" capability
- Review email content for valid data

**Drafts have low confidence**
- Review policy tone settings
- Provide more examples in custom instructions
- Check if email has sufficient context

**Actions failing to execute**
- Verify integration credentials
- Check integration is marked as active
- Review action payload format

**SLA breaches**
- Increase agent capacity
- Adjust SLA targets
- Review routing rules efficiency

## Future Roadmap

- Real-time email synchronization
- Advanced ML model training
- Multi-language support
- Mobile application
- Voice/chat channel support
- Advanced analytics dashboards
- A/B testing for draft variations
