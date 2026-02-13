# MailRoom Agents

Multi-tenant SaaS where policy-controlled AI agents manage shared mailboxes. Agents classify emails, draft replies, follow tone/PII/routing rules, and trigger actions like ticket creation, CRM/Slack updates, and feedback logging.

## Features

- 🤖 **AI-Powered Email Classification** - Automatically categorize emails by urgency, topic, and intent
- ✍️ **Smart Draft Generation** - Generate contextual email responses following your brand voice
- 🔒 **Policy Controls** - Define tone, PII handling, and routing rules for compliance
- 📬 **Shared Mailbox Management** - Manage multiple mailboxes across tenants
- 📊 **Analytics & SLA Monitoring** - Track performance, response times, and SLA compliance
- 🔗 **Integrations** - Connect with ticketing systems, CRM, Slack, and webhooks
- 🏢 **Multi-Tenant Architecture** - Secure, isolated workspaces for each organization

## Tech Stack

- **Frontend**: Next.js 14+ with React 19, TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes, Supabase Edge Functions
- **Database**: Supabase (PostgreSQL)
- **AI/LLM**: OpenAI GPT-4
- **Integrations**: Email providers (IMAP/Gmail/Outlook), CRM, Slack, webhooks

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn
- Supabase account
- OpenAI API key

### Installation

1. Clone the repository:
```bash
git clone https://github.com/JoshMcQ/MailRoom-Agents.git
cd MailRoom-Agents
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env
```

Edit `.env` and add your configuration:
- Supabase URL and keys
- OpenAI API key
- Optional: Email provider, CRM, Slack credentials

4. Set up the database:

Create a new Supabase project and run the migration:
```bash
# In Supabase SQL Editor, run:
supabase/migrations/001_initial_schema.sql
```

5. Run the development server:
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see the application.

## Project Structure

```
mailroom-agents/
├── app/                    # Next.js app directory
│   ├── api/               # API routes
│   │   ├── classify/      # Email classification endpoint
│   │   ├── draft/         # Draft generation endpoint
│   │   ├── actions/       # Action execution endpoint
│   │   └── analytics/     # Analytics endpoint
│   ├── dashboard/         # Dashboard pages
│   └── auth/              # Authentication pages
├── components/            # React components
│   ├── agents/           # Agent-related components
│   ├── mailbox/          # Mailbox components
│   ├── analytics/        # Analytics components
│   └── policies/         # Policy management components
├── lib/                  # Core library code
│   ├── ai/              # AI/LLM integration
│   ├── db/              # Database utilities
│   ├── email/           # Email provider integrations
│   └── integrations/    # External integrations
├── types/               # TypeScript type definitions
├── supabase/            # Supabase configuration
│   ├── migrations/      # Database migrations
│   └── functions/       # Edge functions
└── public/              # Static assets
```

## Core Concepts

### Tenants
Organizations that use the platform. Each tenant has isolated data and settings.

### Mailboxes
Email accounts (shared or personal) managed by the system. Each mailbox belongs to a tenant.

### Agents
AI-powered assistants that process emails. Agents have:
- **Capabilities**: classify, draft, route, trigger_actions
- **Policies**: Rules governing their behavior

### Policies
Define how agents should behave:
- **Tone Settings**: formal, casual, friendly, professional
- **PII Settings**: Detect and handle personally identifiable information
- **Routing Rules**: Conditions for routing emails to specific agents or teams

### Email Flow

1. **Receive** - Emails arrive in mailboxes (via API or email provider)
2. **Classify** - AI agents analyze and categorize emails
3. **Route** - Emails are assigned to appropriate agents based on rules
4. **Draft** - Agents generate response drafts following policy guidelines
5. **Review** - Human operators review and approve drafts
6. **Act** - Trigger actions (create tickets, update CRM, send Slack notifications)
7. **Send** - Approved responses are sent

### Actions

Automated actions that agents can trigger:
- **create_ticket**: Create issues in ticketing systems (Jira, Linear, etc.)
- **update_crm**: Update contact records in CRM systems
- **send_slack**: Send notifications to Slack channels
- **log_feedback**: Record feedback for training and improvement
- **webhook**: Call custom webhooks for extensibility

## API Endpoints

### POST /api/classify
Classify an email using AI.

**Request:**
```json
{
  "emailId": "uuid",
  "policyId": "uuid" (optional)
}
```

**Response:**
```json
{
  "success": true,
  "classification": {
    "category": "Support",
    "urgency": "high",
    "sentiment": "negative",
    "intent": "Request help with issue",
    "tags": ["technical", "bug"],
    "confidence": 0.92
  }
}
```

### POST /api/draft
Generate a draft response for an email.

**Request:**
```json
{
  "emailId": "uuid",
  "agentId": "uuid",
  "policyId": "uuid" (optional)
}
```

### POST /api/actions
Execute an action for an email.

**Request:**
```json
{
  "emailId": "uuid",
  "actionType": "create_ticket",
  "payload": {
    "title": "Customer issue",
    "description": "...",
    "priority": "high"
  }
}
```

### GET /api/analytics
Get analytics for a tenant.

**Query Parameters:**
- `tenantId`: Tenant UUID
- `periodStart`: ISO 8601 timestamp (optional)
- `periodEnd`: ISO 8601 timestamp (optional)

## Supabase Edge Functions

### process-email
Processes incoming emails and creates records in the database.

### process-queue
Processes email queues and assigns emails to agents based on SLA rules.

## Development

### Type Checking
```bash
npm run type-check
```

### Linting
```bash
npm run lint
```

### Building for Production
```bash
npm run build
npm start
```

## Deployment

### Vercel
The easiest way to deploy is using Vercel:

```bash
vercel
```

### Environment Variables
Ensure all environment variables are set in your deployment platform.

## Contributing

Contributions are welcome! Please open an issue or submit a pull request.

## License

ISC

## Support

For questions or support, please open an issue on GitHub.