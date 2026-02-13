import Link from 'next/link';
import { 
  Mail, 
  Bot, 
  BarChart3, 
  Settings, 
  Users, 
  Inbox,
  Clock,
  CheckCircle,
  AlertCircle
} from 'lucide-react';

export default function DashboardPage() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Mail className="h-8 w-8 text-blue-600" />
              <h1 className="text-2xl font-bold">MailRoom Agents</h1>
            </div>
            <nav className="flex gap-6">
              <Link href="/dashboard" className="text-blue-600 font-semibold">
                Dashboard
              </Link>
              <Link href="/dashboard/agents" className="text-gray-600 hover:text-gray-900 dark:text-gray-300">
                Agents
              </Link>
              <Link href="/dashboard/policies" className="text-gray-600 hover:text-gray-900 dark:text-gray-300">
                Policies
              </Link>
              <Link href="/dashboard/analytics" className="text-gray-600 hover:text-gray-900 dark:text-gray-300">
                Analytics
              </Link>
              <Link href="/dashboard/settings" className="text-gray-600 hover:text-gray-900 dark:text-gray-300">
                Settings
              </Link>
            </nav>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatCard
            title="Pending Emails"
            value="42"
            icon={<Inbox className="h-6 w-6" />}
            trend="+12%"
            trendUp={true}
          />
          <StatCard
            title="Active Agents"
            value="8"
            icon={<Bot className="h-6 w-6" />}
            trend="2 idle"
          />
          <StatCard
            title="Avg Response Time"
            value="2.4h"
            icon={<Clock className="h-6 w-6" />}
            trend="-15%"
            trendUp={false}
          />
          <StatCard
            title="SLA Compliance"
            value="94%"
            icon={<CheckCircle className="h-6 w-6" />}
            trend="+3%"
            trendUp={true}
          />
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Email Queue */}
          <div className="lg:col-span-2 bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <Mail className="h-5 w-5" />
              Email Queue
            </h2>
            <div className="space-y-4">
              <EmailQueueItem
                from="customer@example.com"
                subject="Question about pricing"
                urgency="medium"
                time="5 min ago"
              />
              <EmailQueueItem
                from="support@client.com"
                subject="Urgent: System downtime"
                urgency="critical"
                time="12 min ago"
              />
              <EmailQueueItem
                from="info@partner.com"
                subject="Partnership opportunity"
                urgency="low"
                time="1 hour ago"
              />
            </div>
          </div>

          {/* Active Agents */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <Bot className="h-5 w-5" />
              Active Agents
            </h2>
            <div className="space-y-3">
              <AgentStatus name="Customer Support Bot" status="active" processed={15} />
              <AgentStatus name="Sales Assistant" status="active" processed={8} />
              <AgentStatus name="Tech Support Agent" status="idle" processed={0} />
              <AgentStatus name="General Inquiry Bot" status="active" processed={19} />
            </div>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="mt-6 bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Recent Activity
          </h2>
          <div className="space-y-3">
            <ActivityItem
              action="Email classified"
              description="Support inquiry auto-classified as 'Technical Issue'"
              time="2 min ago"
            />
            <ActivityItem
              action="Draft created"
              description="Customer Support Bot generated response draft"
              time="5 min ago"
            />
            <ActivityItem
              action="Ticket created"
              description="Critical issue escalated to JIRA (TICKET-1234)"
              time="18 min ago"
            />
            <ActivityItem
              action="SLA met"
              description="Response sent within 2-hour SLA window"
              time="25 min ago"
            />
          </div>
        </div>
      </main>
    </div>
  );
}

function StatCard({ 
  title, 
  value, 
  icon, 
  trend, 
  trendUp 
}: { 
  title: string; 
  value: string; 
  icon: React.ReactNode; 
  trend?: string;
  trendUp?: boolean;
}) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
      <div className="flex items-center justify-between mb-2">
        <div className="text-gray-600 dark:text-gray-400">{icon}</div>
        {trend && (
          <span className={`text-sm ${trendUp ? 'text-green-600' : 'text-blue-600'}`}>
            {trend}
          </span>
        )}
      </div>
      <div className="text-3xl font-bold mb-1">{value}</div>
      <div className="text-sm text-gray-600 dark:text-gray-400">{title}</div>
    </div>
  );
}

function EmailQueueItem({ 
  from, 
  subject, 
  urgency, 
  time 
}: { 
  from: string; 
  subject: string; 
  urgency: 'low' | 'medium' | 'high' | 'critical';
  time: string;
}) {
  const urgencyColors = {
    low: 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300',
    medium: 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300',
    high: 'bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300',
    critical: 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300',
  };

  return (
    <div className="flex items-start gap-3 p-3 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-750 cursor-pointer">
      <Mail className="h-5 w-5 text-gray-400 mt-1" />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span className="font-medium truncate">{from}</span>
          <span className={`text-xs px-2 py-0.5 rounded-full ${urgencyColors[urgency]}`}>
            {urgency}
          </span>
        </div>
        <p className="text-sm text-gray-600 dark:text-gray-400 truncate">{subject}</p>
        <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">{time}</p>
      </div>
    </div>
  );
}

function AgentStatus({ 
  name, 
  status, 
  processed 
}: { 
  name: string; 
  status: 'active' | 'idle'; 
  processed: number;
}) {
  return (
    <div className="flex items-center justify-between p-3 border border-gray-200 dark:border-gray-700 rounded-lg">
      <div className="flex items-center gap-2">
        <div className={`w-2 h-2 rounded-full ${status === 'active' ? 'bg-green-500' : 'bg-gray-400'}`} />
        <span className="font-medium">{name}</span>
      </div>
      <span className="text-sm text-gray-600 dark:text-gray-400">{processed} today</span>
    </div>
  );
}

function ActivityItem({ 
  action, 
  description, 
  time 
}: { 
  action: string; 
  description: string; 
  time: string;
}) {
  return (
    <div className="flex items-start gap-3 p-3 border-l-2 border-blue-500 bg-gray-50 dark:bg-gray-750 rounded">
      <div className="flex-1">
        <div className="font-medium text-sm">{action}</div>
        <div className="text-sm text-gray-600 dark:text-gray-400">{description}</div>
        <div className="text-xs text-gray-500 dark:text-gray-500 mt-1">{time}</div>
      </div>
    </div>
  );
}
