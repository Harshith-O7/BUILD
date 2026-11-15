export type SurfaceView = 'landing' | 'login' | 'workspace';

export interface ShowcaseSite {
  id: string;
  projectId: string;
  title: string;
  caption: string;
  location: string;
  scope: string;
  imageUrl: string;
  featured?: boolean;
}

export interface TeamEngineer {
  id: string;
  name: string;
  role: string;
  imageUrl: string;
}

export const LANDING_HERO_COPY = {
  headlineLine1: 'Sites planned, tracked',
  headlineLine2: 'and built to endure',
  intro:
    'We help civil engineering teams schedule works, monitor daily resources, and deliver landmark projects on time.',
  primaryCta: 'Open workspace',
  secondaryCta: 'Explore active sites',
  trustCaption: 'Trusted across 14 active civil sites',
};

export const LANDING_SHOWCASE_COPY = {
  heading: 'Selected sites',
  introLine1:
    'Active residential towers, commercial IT campuses, highway corridors, and logistics hubs managed on BuildGrid.',
  introLine2:
    'Every pour, equipment shift, and cost ledger stays reconciled from groundbreaking to handover.',
};

export const LANDING_SHOWCASE_SITES: ShowcaseSite[] = [
  {
    id: 'site-1',
    projectId: 'prj-101',
    title: 'Whitefield Twin Towers',
    caption: 'Residential · 2026',
    location: 'Whitefield, Bengaluru',
    scope: '14-storey twin residential complex · 65% structural completion',
    imageUrl: '/src/assets/images/site_apartment_bengaluru_1794727821104.jpg',
    featured: true,
  },
  {
    id: 'site-2',
    projectId: 'prj-102',
    title: 'Cauvery Tech Hub',
    caption: 'Commercial · 2026',
    location: 'Hebbal Industrial Area, Mysuru',
    scope: 'Grade-A commercial IT building with composite steel framing',
    imageUrl: '/src/assets/images/site_office_mysuru_1794727821288.jpg',
  },
  {
    id: 'site-3',
    projectId: 'prj-103',
    title: 'NH-48 Corridor',
    caption: 'Infrastructure · 2026',
    location: 'Tumakuru–Chitradurga',
    scope: '18.4 km 6-lane highway expansion and elevated flyovers',
    imageUrl: '/src/assets/images/site_highway_karnataka_1794727822293.jpg',
  },
  {
    id: 'site-4',
    projectId: 'prj-104',
    title: 'Dobbaspet Logistics Park',
    caption: 'Industrial · 2026',
    location: 'Dobbaspet, Bengaluru',
    scope: '1,20,000 sq.ft PEB steel warehouse and 14 loading docks',
    imageUrl: '/src/assets/images/site_warehouse_industrial_1794727822519.jpg',
  },
];

export const LANDING_TESTIMONIAL = {
  quote:
    'BuildGrid brought every pour log, equipment check, and contractor ledger onto one screen—turning daily site coordination into quiet certainty.',
  author: 'Rajesh Sharma',
  role: 'Director, Prestige Horizon Infra',
  avatarUrl: '/src/assets/images/avatar_site_manager_1794727821076.jpg',
};

export const LANDING_TEAM_COPY = {
  heading: 'The engineers behind the work',
  intro:
    'Senior structural leads, field managers, and project controllers running live operations across Karnataka.',
};

export const LANDING_TEAM_MEMBERS: TeamEngineer[] = [
  {
    id: 'eng-1',
    name: 'Arjun Rajagopal',
    role: 'Principal Site Director',
    imageUrl: '/src/assets/images/team_arjun_director_1794729954572.jpg',
  },
  {
    id: 'eng-2',
    name: 'Meenakshi Rao',
    role: 'Lead Structural Engineer',
    imageUrl: '/src/assets/images/team_meenakshi_structural_1794729955746.jpg',
  },
  {
    id: 'eng-3',
    name: 'Suresh Kulkarni',
    role: 'Senior Site Engineer',
    imageUrl: '/src/assets/images/team_suresh_site_1794729956842.jpg',
  },
  {
    id: 'eng-4',
    name: 'Kavitha Krishnan',
    role: 'Project Finance Lead',
    imageUrl: '/src/assets/images/team_kavitha_finance_1794729956380.jpg',
  },
];

export const LANDING_CLOSING_COPY = {
  headingLine1: 'Have a site ready',
  headingLine2: 'to break ground?',
  intro:
    'Enter the live role workspace to review schedules, daily equipment availability, and INR project budgets.',
  ctaLabel: 'Start a site brief',
  imageUrl: '/src/assets/images/closing_site_studio_1794729957895.jpg',
  imageAlt: 'BuildGrid engineering studio desk with architectural drawings and concrete scale models',
};

export function resolveSurfaceView(opts: {
  hash: string;
  search: string;
  hasRoleSession: boolean;
}): SurfaceView {
  if (opts.hasRoleSession || opts.search.includes('autostart=1')) {
    return 'workspace';
  }
  return 'login';
}
