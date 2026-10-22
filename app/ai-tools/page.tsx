import type { Metadata } from 'next';
import { AiToolsDashboard } from './ai-tools-dashboard';

export const metadata: Metadata = {
  title: 'AI Tool Tracker',
  description: 'AI tools in use across NETSOL: who has them, departments and cost',
};

export default function AiToolsPage() {
  return <AiToolsDashboard />;
}
