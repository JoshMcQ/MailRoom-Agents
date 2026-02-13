# Quick Start Guide

## Prerequisites

- Node.js 18 or later
- npm or yarn package manager
- Supabase account (free tier works)
- OpenAI API key

## Step 1: Clone and Install

```bash
git clone https://github.com/JoshMcQ/MailRoom-Agents.git
cd MailRoom-Agents
npm install
```

## Step 2: Set Up Supabase

1. Go to [supabase.com](https://supabase.com) and create a new project
2. Wait for the project to initialize (2-3 minutes)
3. Go to **Project Settings** > **API**
4. Copy your project URL and keys

## Step 3: Configure Environment

Create a `.env` file in the root directory:

```bash
cp .env.example .env
```

Edit `.env` and add your credentials:

```env
# Supabase (from Step 2)
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# OpenAI
OPENAI_API_KEY=sk-your-openai-api-key
```

## Step 4: Set Up Database

1. In your Supabase project, go to **SQL Editor**
2. Create a new query
3. Copy the contents of `supabase/migrations/001_initial_schema.sql`
4. Paste and run the query

This creates all necessary tables, indexes, and triggers.

## Step 5: Run the Application

Start the development server:

```bash
npm run dev
```

Open your browser to [http://localhost:3000](http://localhost:3000)

## Step 6: Explore the Application

### Landing Page
Visit the homepage to see the feature overview and key capabilities.

### Dashboard
Navigate to `/dashboard` to see:
- Email queue with sample data
- Agent status indicators
- Analytics metrics
- Recent activity feed

## Step 7: Test the API (Optional)

### Create a Test Tenant

```bash
curl -X POST 'YOUR_SUPABASE_URL/rest/v1/tenants' \
  -H "apikey: YOUR_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Company",
    "domain": "test.com"
  }'
```

### Create a Test Mailbox

```bash
curl -X POST 'YOUR_SUPABASE_URL/rest/v1/mailboxes' \
  -H "apikey: YOUR_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "tenant_id": "TENANT_ID_FROM_ABOVE",
    "email": "support@test.com",
    "name": "Support Mailbox",
    "type": "shared"
  }'
```

### Create a Test Email

```bash
curl -X POST 'YOUR_SUPABASE_URL/rest/v1/emails' \
  -H "apikey: YOUR_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "mailbox_id": "MAILBOX_ID_FROM_ABOVE",
    "from_address": "customer@example.com",
    "to_addresses": ["support@test.com"],
    "subject": "Help with my order",
    "body": "I need assistance tracking my recent order #12345"
  }'
```

### Classify the Email

```bash
curl -X POST 'http://localhost:3000/api/classify' \
  -H "Content-Type: application/json" \
  -d '{
    "emailId": "EMAIL_ID_FROM_ABOVE"
  }'
```

You should receive a classification response with category, urgency, sentiment, and more!

## Next Steps

### Create Agents

1. Go to Supabase SQL Editor
2. Create an agent:

```sql
INSERT INTO agents (tenant_id, name, description, capabilities, active)
VALUES (
  'YOUR_TENANT_ID',
  'Support Bot',
  'Handles customer support inquiries',
  ARRAY['classify', 'draft', 'route'],
  true
);
```

### Create Policies

```sql
INSERT INTO policies (tenant_id, name, description, tone_settings, pii_settings)
VALUES (
  'YOUR_TENANT_ID',
  'Default Support Policy',
  'Standard customer support guidelines',
  '{"style": "friendly", "custom_instructions": "Always be helpful and empathetic"}',
  '{"detect": true, "mask": true, "allowed_types": []}'
);
```

### Link Agent to Policy

```sql
UPDATE agents
SET policy_id = (SELECT id FROM policies WHERE name = 'Default Support Policy' LIMIT 1)
WHERE name = 'Support Bot';
```

### Generate a Draft

```bash
curl -X POST 'http://localhost:3000/api/draft' \
  -H "Content-Type: application/json" \
  -d '{
    "emailId": "YOUR_EMAIL_ID",
    "agentId": "YOUR_AGENT_ID"
  }'
```

## Common Issues

### "supabaseUrl is required" error
- Make sure `.env` file exists in the root directory
- Verify `NEXT_PUBLIC_SUPABASE_URL` is set
- Restart the dev server after changing `.env`

### "OpenAI API key is not configured" error
- Set `OPENAI_API_KEY` in your `.env` file
- Ensure you have a valid OpenAI API key
- Check your OpenAI account has available credits

### Build errors
- Clear the `.next` folder: `rm -rf .next`
- Reinstall dependencies: `rm -rf node_modules && npm install`
- Check Node.js version: `node --version` (should be 18+)

### Database connection errors
- Verify Supabase URL and keys are correct
- Check Supabase project is active (not paused)
- Ensure migration has been run successfully

## Development Workflow

### Making Changes

1. Make your code changes
2. The dev server will auto-reload
3. Check for TypeScript errors: `npm run type-check`
4. Build to verify: `npm run build`

### Adding Features

1. Create components in `components/`
2. Add API routes in `app/api/`
3. Update types in `types/index.ts`
4. Add database changes in new migration files

### Testing

While there are no automated tests yet, manually test:
- Email classification with various content types
- Draft generation with different policies
- Action execution with mock integrations
- Dashboard displays data correctly

## Production Deployment

### Deploy to Vercel

1. Push your code to GitHub
2. Go to [vercel.com](https://vercel.com)
3. Import your repository
4. Add environment variables in Vercel dashboard
5. Deploy!

### Environment Variables for Production

Add all variables from `.env` to your Vercel project settings:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `OPENAI_API_KEY`

### Post-Deployment

1. Verify the deployment URL works
2. Test API endpoints
3. Monitor logs for errors
4. Set up custom domain (optional)

## Getting Help

- Check `ARCHITECTURE.md` for system design details
- Review `README.md` for comprehensive documentation
- Examine code comments for implementation notes
- Review Supabase logs for database issues
- Check Next.js console for frontend errors

## What's Next?

- **Add Authentication**: Implement user login with Supabase Auth
- **Email Sync**: Set up periodic email fetching from providers
- **Custom UI**: Build agent and policy management interfaces
- **Real Data**: Connect real mailboxes and start processing
- **Monitor**: Set up logging and monitoring
- **Scale**: Optimize queries and add caching

Happy building! 🚀
