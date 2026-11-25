import {
  Activity,
  BarChart3,
  Blocks,
  Building2,
  Code2,
  CreditCard,
  FolderGit2,
  Home,
  KeyRound,
  Plug,
  ScrollText,
  Users,
  Workflow,
  type LucideIcon,
} from 'lucide-react';

export type WorkspaceType = 'developer' | 'business';

export const WORKSPACE_TYPES: WorkspaceType[] = ['developer', 'business'];

export const isWorkspaceType = (value: unknown): value is WorkspaceType =>
  value === 'developer' || value === 'business';

export interface NavItem {
  label: string;
  icon: LucideIcon;
  to?: string;
  /** Rendered as disabled with a "Soon" tag until the route exists. */
  soon?: boolean;
}

export interface QuickAction {
  title: string;
  description: string;
  icon: LucideIcon;
  to?: string;
}

export interface WorkspaceConfig {
  id: WorkspaceType;
  label: string;
  icon: LucideIcon;
  /** Short line under the label on the selector card. */
  summary: string;
  /** Subtitle shown on the auth form per workspace. */
  authSubtitle: string;
  homeSubtitle: string;
  primaryAction: string;
  nav: NavItem[];
  quickActions: QuickAction[];
  stats: { label: string; value: string }[];
}

export const WORKSPACES: Record<WorkspaceType, WorkspaceConfig> = {
  developer: {
    id: 'developer',
    label: 'Developer',
    icon: Code2,
    summary: 'Build & ship backends visually',
    authSubtitle: 'Wire nodes, generate real code, deploy APIs.',
    homeSubtitle: 'Your backend graphs, generated code and deployments live here.',
    primaryAction: 'New flow',
    nav: [
      { label: 'Home', icon: Home, to: '/home' },
      { label: 'Flow editor', icon: Workflow, to: '/editor' },
      { label: 'Projects', icon: FolderGit2, soon: true },
      { label: 'API keys', icon: KeyRound, soon: true },
      { label: 'Logs', icon: ScrollText, soon: true },
    ],
    quickActions: [
      { title: 'Create a flow', description: 'Start from a blank canvas and generate Go or JS.', icon: Workflow, to: '/editor' },
      { title: 'Import a project', description: 'Bring an existing graph or repository.', icon: FolderGit2 },
      { title: 'Generate an API key', description: 'Call your flows from anywhere.', icon: KeyRound },
    ],
    stats: [
      { label: 'Flows', value: '0' },
      { label: 'Executions', value: '0' },
      { label: 'Deployments', value: '0' },
      { label: 'Uptime', value: '—' },
    ],
  },
  business: {
    id: 'business',
    label: 'Business',
    icon: Building2,
    summary: 'Automate operations for teams',
    authSubtitle: 'Connect your tools and automate team workflows.',
    homeSubtitle: 'Automations, integrations and your team — all in one place.',
    primaryAction: 'New workflow',
    nav: [
      { label: 'Home', icon: Home, to: '/home' },
      { label: 'Workflows', icon: Blocks, to: '/editor' },
      { label: 'Integrations', icon: Plug, soon: true },
      { label: 'Team', icon: Users, soon: true },
      { label: 'Analytics', icon: BarChart3, soon: true },
      { label: 'Billing', icon: CreditCard, soon: true },
    ],
    quickActions: [
      { title: 'Build a workflow', description: 'Automate a process across your tools.', icon: Blocks, to: '/editor' },
      { title: 'Connect an app', description: 'Slack, Sheets, CRM, email and more.', icon: Plug },
      { title: 'Invite your team', description: 'Collaborate with roles and permissions.', icon: Users },
    ],
    stats: [
      { label: 'Active workflows', value: '0' },
      { label: 'Tasks automated', value: '0' },
      { label: 'Hours saved', value: '0' },
      { label: 'Members', value: '1' },
    ],
  },
};

export const ACTIVITY_ICON = Activity;
