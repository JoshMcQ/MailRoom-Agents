import Link from "next/link";
import { Mail, Bot, Shield, BarChart3, Users, Settings } from "lucide-react";

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      {/* Header */}
      <header className="border-b bg-white dark:bg-gray-900 shadow-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Mail className="h-8 w-8 text-blue-600" />
              <h1 className="text-2xl font-bold">MailRoom Agents</h1>
            </div>
            <nav className="hidden md:flex gap-6">
              <Link href="/dashboard" className="text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white">
                Dashboard
              </Link>
              <Link href="/auth" className="text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white">
                Sign In
              </Link>
            </nav>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="container mx-auto px-4 py-16">
        <div className="text-center mb-16">
          <h2 className="text-5xl font-bold mb-4 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            AI-Powered Mailbox Management
          </h2>
          <p className="text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
            Policy-controlled AI agents that classify emails, draft replies, and automate your workflow
          </p>
          <div className="mt-8 flex gap-4 justify-center">
            <Link 
              href="/auth" 
              className="px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold"
            >
              Get Started
            </Link>
            <Link 
              href="/dashboard" 
              className="px-8 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 dark:border-gray-600 dark:hover:bg-gray-800 font-semibold"
            >
              View Demo
            </Link>
          </div>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
          <FeatureCard 
            icon={<Bot className="h-8 w-8" />}
            title="AI Agents"
            description="Intelligent agents that classify and manage emails automatically using advanced LLM pipelines"
          />
          <FeatureCard 
            icon={<Shield className="h-8 w-8" />}
            title="Policy Control"
            description="Define tone, PII handling, and routing rules to ensure compliance and security"
          />
          <FeatureCard 
            icon={<Mail className="h-8 w-8" />}
            title="Smart Drafting"
            description="AI-powered email drafting that follows your brand voice and guidelines"
          />
          <FeatureCard 
            icon={<Users className="h-8 w-8" />}
            title="Multi-Tenant"
            description="Secure, isolated workspaces for each organization with shared mailbox support"
          />
          <FeatureCard 
            icon={<BarChart3 className="h-8 w-8" />}
            title="Analytics & SLA"
            description="Monitor queues, track SLAs, and get insights into agent performance"
          />
          <FeatureCard 
            icon={<Settings className="h-8 w-8" />}
            title="Integrations"
            description="Connect with ticketing systems, CRM, Slack, and more with automated actions"
          />
        </div>

        {/* Use Cases */}
        <div className="mt-24 max-w-4xl mx-auto">
          <h3 className="text-3xl font-bold text-center mb-12">Key Capabilities</h3>
          <div className="space-y-6">
            <UseCaseCard 
              title="Email Classification"
              description="Automatically categorize incoming emails by urgency, topic, and required action"
            />
            <UseCaseCard 
              title="Automated Responses"
              description="Draft contextual replies following your tone guidelines and brand voice"
            />
            <UseCaseCard 
              title="Smart Routing"
              description="Route emails to the right team or agent based on content and rules"
            />
            <UseCaseCard 
              title="Action Triggers"
              description="Create tickets, update CRM, send Slack notifications, and log feedback automatically"
            />
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t bg-white dark:bg-gray-900 mt-24">
        <div className="container mx-auto px-4 py-8">
          <div className="text-center text-gray-600 dark:text-gray-400">
            <p>&copy; 2024 MailRoom Agents. AI-Powered Mailbox Management.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}

function FeatureCard({ icon, title, description }: { icon: React.ReactNode; title: string; description: string }) {
  return (
    <div className="p-6 bg-white dark:bg-gray-800 rounded-lg shadow-md hover:shadow-lg transition-shadow">
      <div className="text-blue-600 dark:text-blue-400 mb-4">{icon}</div>
      <h4 className="text-xl font-semibold mb-2">{title}</h4>
      <p className="text-gray-600 dark:text-gray-300">{description}</p>
    </div>
  );
}

function UseCaseCard({ title, description }: { title: string; description: string }) {
  return (
    <div className="p-6 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
      <h5 className="text-lg font-semibold mb-2">{title}</h5>
      <p className="text-gray-600 dark:text-gray-300">{description}</p>
    </div>
  );
}
