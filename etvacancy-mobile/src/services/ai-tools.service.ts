import type { Job, UserProfile } from '@/types/index';
import { formatSalaryRange } from '@utils/index';

export interface AIToolResult {
  toolName: string;
  summary: string;
  responseMarkdown: string;
  recommendedJobs?: Job[];
  suggestedFollowUps?: string[];
}

/**
 * Common typo corrections and synonym dictionary for career searches
 */
export const TYPO_CORRECTIONS: Record<string, string> = {
  fronted: 'frontend',
  'front-end': 'frontend',
  'front end': 'frontend',
  backend: 'backend',
  'back-end': 'backend',
  'back end': 'backend',
  fullstack: 'fullstack',
  'full stack': 'fullstack',
  'full-stack': 'fullstack',
  softwar: 'software',
  softwere: 'software',
  fluter: 'flutter',
  develper: 'developer',
  devlopr: 'developer',
  develoepr: 'developer',
  programer: 'programmer',
  enginer: 'engineer',
  engeneer: 'engineer',
  desiner: 'designer',
  desginer: 'designer',
  acountant: 'accountant',
  acounting: 'accounting',
  accoutant: 'accountant',
  markting: 'marketing',
  markeitng: 'marketing',
  intership: 'internship',
  intern: 'internship',
  remot: 'remote',
  salry: 'salary',
  salari: 'salary',
  intervew: 'interview',
  intreview: 'interview',
  experiance: 'experience',
  exprience: 'experience',
  managr: 'manager',
  manger: 'manager',
  docotr: 'doctor',
  docter: 'doctor',
  nurs: 'nurse',
  drivr: 'driver',
  techer: 'teacher',
  teatcher: 'teacher',
  lawer: 'lawyer',
  lawyr: 'lawyer',
  logstic: 'logistics',
  storekeper: 'storekeeper',
  secretry: 'secretary',
  receptonist: 'receptionist',
  pharmasist: 'pharmacist',
  phamacist: 'pharmacist',
  cleark: 'clerk',
  casheir: 'cashier',
  securty: 'security',
  cleaing: 'cleaning',
  waitor: 'waiter',
  barista: 'barista',
  chief: 'chef',
  mecanic: 'mechanic',
  electrican: 'electrician',
  plummer: 'plumber',
  carpanter: 'carpenter',
  mason: 'mason',
  warden: 'guard',
};

/**
 * Role synonym map to find matching jobs across related titles & skills
 */
export const ROLE_SYNONYMS: Record<string, string[]> = {
  frontend: ['frontend', 'front-end', 'react', 'next.js', 'vue', 'angular', 'javascript', 'typescript', 'html', 'css', 'tailwind', 'web developer', 'ui developer', 'software engineer', 'full stack'],
  backend: ['backend', 'back-end', 'node', 'express', 'nestjs', 'python', 'django', 'fastapi', 'golang', 'go', 'java', 'spring', 'c#', '.net', 'php', 'laravel', 'sql', 'postgres', 'software engineer', 'full stack'],
  fullstack: ['fullstack', 'full-stack', 'full stack', 'react', 'node', 'javascript', 'typescript', 'software engineer', 'web developer', 'django', 'python'],
  flutter: ['flutter', 'dart', 'mobile', 'react native', 'android', 'ios', 'app developer'],
  mobile: ['mobile', 'flutter', 'react native', 'android', 'ios', 'kotlin', 'swift', 'app developer'],
  uiux: ['ui', 'ux', 'ui/ux', 'design', 'designer', 'figma', 'product designer', 'graphic designer'],
  design: ['designer', 'graphic', 'ui', 'ux', 'figma', 'photoshop', 'illustrator', 'creative', 'branding'],
  data: ['data', 'data analyst', 'data scientist', 'bi', 'power bi', 'tableau', 'sql', 'python', 'analytics', 'excel'],
  devops: ['devops', 'cloud', 'aws', 'docker', 'kubernetes', 'linux', 'ci/cd', 'sysadmin', 'infrastructure'],
  accounting: ['accountant', 'accounting', 'finance', 'auditor', 'ifrs', 'peachtree', 'quickbooks', 'cashier', 'tax'],
  marketing: ['marketing', 'digital marketing', 'social media', 'seo', 'content', 'growth', 'sales', 'telegram marketing', 'advertising'],
  sales: ['sales', 'business development', 'account manager', 'sales representative', 'marketing', 'client relationship'],
  hr: ['hr', 'human resources', 'talent acquisition', 'recruiter', 'people operations', 'admin', 'administrative'],
  engineering: ['civil', 'mechanical', 'electrical', 'structural', 'site engineer', 'autocad', 'architect', 'engineering'],
  driver: ['driver', 'logistics', 'transport', 'delivery', 'chauffeur', 'fleet'],
  health: ['nurse', 'doctor', 'pharmacist', 'lab technician', 'health', 'medical', 'hospital', 'clinical'],
  nurse: ['nurse', 'registered nurse', 'rn', 'clinical nurse', 'staff nurse', 'hospital nurse', 'icu nurse', 'pediatric'],
  doctor: ['doctor', 'physician', 'medical officer', 'general practitioner', 'gp', 'surgeon', 'specialist', 'medical doctor'],
  teacher: ['teacher', 'lecturer', 'instructor', 'tutor', 'educator', 'professor', 'academician', 'school teacher', 'kindergarten', 'primary school', 'high school'],
  civil: ['civil engineer', 'civil', 'structural', 'construction', 'building', 'road construction', 'site engineer', 'autocad', 'quantity surveyor'],
  mechanical: ['mechanical', 'mechanic', 'automotive', 'machinery', 'maintenance', 'hvac', 'refrigeration'],
  electrical: ['electrical', 'electrician', 'electronics', 'power', 'wiring', 'solar', 'instrumentation'],
  logistics: ['logistics', 'supply chain', 'warehouse', 'procurement', 'inventory', 'fleet', 'transport officer', 'shipping'],
  legal: ['lawyer', 'attorney', 'legal', 'counsel', 'advocate', 'legal officer', 'compliance', 'contract', 'law'],
  admin: ['admin', 'administrative', 'secretary', 'receptionist', 'office assistant', 'clerk', 'data entry', 'front desk', 'office coordinator'],
  hospitality: ['hotel', 'hospitality', 'waiter', 'barista', 'chef', 'cook', 'restaurant', 'catering', 'guest service', 'front office'],
  retail: ['retail', 'shop', 'store', 'sales associate', 'cashier', 'storekeeper', 'merchandiser', 'supermarket', 'boutique'],
  security: ['security', 'guard', 'security officer', 'safety', 'bouncer', 'watchman', 'cctv', 'safety officer'],
  pharmacist: ['pharmacist', 'pharmacy', 'druggist', 'chemist', 'pharmaceutical'],
  lab: ['lab technician', 'laboratory', 'lab technologist', 'medical lab', 'clinical lab', 'microbiology'],
  architect: ['architect', 'architecture', 'building design', 'interior design', 'town planner', 'urban planner'],
  agriculture: ['agriculture', 'agronomist', 'farming', 'livestock', 'veterinary', 'horticulture', 'forestry', 'irrigation'],
  media: ['journalist', 'media', 'broadcast', 'radio', 'tv', 'reporter', 'editor', 'content writer', 'copywriter', 'blogger'],
  creative: ['content writer', 'copywriter', 'blogger', 'article writer', 'seo writer', 'editor', 'translator', 'amharic writer'],
  cleaning: ['cleaner', 'cleaning', 'housekeeping', 'maid', 'janitor', 'sanitation', 'steward'],
  maintenance: ['maintenance', 'repair', 'technician', 'facility', 'handyman', 'service technician'],
  storekeeper: ['storekeeper', 'store keeper', 'stock', 'inventory', 'warehouse keeper', 'store manager', 'stock controller'],
};

/**
 * Normalizes user text and applies typo correction
 */
export function normalizeCareerQuery(text: string): string {
  let cleaned = (text || '').trim().toLowerCase();
  for (const [typo, correct] of Object.entries(TYPO_CORRECTIONS)) {
    const regex = new RegExp(`\\b${typo}\\b`, 'gi');
    cleaned = cleaned.replace(regex, correct);
  }
  return cleaned;
}

/**
 * 1. Search Vacancies AI Tool
 * Filters jobs based on dynamic criteria (keyword, city, remote, urgency, salary, experience)
 * with typo tolerance, synonym expansion, and contextual advice.
 */
export function searchVacanciesTool(
  query: string,
  availableJobs: Job[] = [],
  params?: {
    city?: string;
    remoteOnly?: boolean;
    urgentOnly?: boolean;
    salaryMin?: number;
    experienceLevel?: string;
    jobType?: string;
  },
): AIToolResult {
  const normalizedQuery = normalizeCareerQuery(query);
  const qTerms = normalizedQuery.split(/\s+/).filter((w) => w.length > 1);

  // Expand search terms with role synonyms
  const expandedTerms = new Set<string>(qTerms);
  for (const term of qTerms) {
    for (const [key, synonyms] of Object.entries(ROLE_SYNONYMS)) {
      if (key === term || synonyms.includes(term)) {
        synonyms.forEach((s) => expandedTerms.add(s));
      }
    }
  }

  const termsArray = Array.from(expandedTerms);

  const matchedJobs = availableJobs.filter((job) => {
    const title = (job.title || '').toLowerCase();
    const company = (job.company?.name || '').toLowerCase();
    const city = (job.city || '').toLowerCase();
    const desc = (job.description || '').toLowerCase();
    const reqs = Array.isArray(job.requirements)
      ? job.requirements.join(' ').toLowerCase()
      : '';
    const combined = `${title} ${company} ${city} ${desc} ${reqs}`;

    // Keyword matching with synonym expansion
    const matchesKeyword =
      termsArray.length === 0 ||
      termsArray.some((term) => combined.includes(term.toLowerCase()));

    // City matching
    const matchesCity = !params?.city || city.includes(params.city.toLowerCase());

    // Remote matching
    const matchesRemote =
      !params?.remoteOnly ||
      job.employmentType === 'REMOTE' ||
      desc.includes('remote') ||
      title.includes('remote');

    // Urgent matching
    const matchesUrgent = !params?.urgentOnly || Boolean(job.urgentHiring);

    // Salary matching
    const matchesSalary =
      !params?.salaryMin ||
      (job.salaryMin && job.salaryMin >= params.salaryMin) ||
      (job.salaryMax && job.salaryMax >= params.salaryMin);

    return matchesKeyword && matchesCity && matchesRemote && matchesUrgent && matchesSalary;
  });

  const selected = matchedJobs.length > 0 ? matchedJobs.slice(0, 6) : availableJobs.slice(0, 3);
  const displayTitle = normalizedQuery ? `"${normalizedQuery.toUpperCase()}"` : 'All Available Jobs';

  let responseMarkdown = '';
  if (matchedJobs.length > 0) {
    responseMarkdown = `### 🔍 Job Recommendations for: ${displayTitle}\n\n`;
    responseMarkdown += `I found **${matchedJobs.length} matching opportunit${matchedJobs.length === 1 ? 'y' : 'ies'}** on EtVacancy:\n\n`;
    for (const job of selected) {
      const salaryText = formatSalaryRange(
        job.salaryMin,
        job.salaryMax,
        job.salaryPeriod,
        job.salaryCurrency,
      );
      responseMarkdown += `• **${job.title}** at **${job.company?.name || 'Company'}**\n`;
      responseMarkdown += `  📍 *${job.city || 'Addis Ababa'}* • ${job.employmentType || job.type || 'Full Time'}\n`;
      responseMarkdown += `  💰 ${salaryText}\n`;
      responseMarkdown += `  [JOB_REC: ${job.id}]\n\n`;
    }
    responseMarkdown += `💡 **Quick Tip:** Tap any job card below to view full requirements and apply directly.`;
  } else {
    responseMarkdown = `### 🔍 Vacancy Search: ${displayTitle}\n\n`;
    responseMarkdown += `We currently don't have an exact vacancy titled **"${query}"** in the database right now, but here are the top related opportunities:\n\n`;
    for (const job of selected) {
      responseMarkdown += `• **${job.title}** — ${job.company?.name || 'Company'} [JOB_REC: ${job.id}]\n`;
    }
    responseMarkdown += `\n**Recommended Next Steps:**\n`;
    responseMarkdown += `1. Set up a job alert for "${normalizedQuery}" to be notified as soon as employers post new vacancies.\n`;
    responseMarkdown += `2. Explore remote contracts on Upwork or LinkedIn for international opportunities.\n`;
    responseMarkdown += `3. Check back daily as new listings are added from top Ethiopian employers.`;
  }

  return {
    toolName: 'search_vacancies',
    summary: `Found ${matchedJobs.length} vacancies matching "${query}"`,
    responseMarkdown,
    recommendedJobs: selected,
    suggestedFollowUps: [
      `What is the salary benchmark for ${normalizedQuery || 'this role'}?`,
      `Interview questions for ${normalizedQuery || 'this position'}`,
      'Show remote vacancies only',
    ],
  };
}

/**
 * 2. Salary Benchmark AI Tool
 * Provides realistic Ethiopian (ETB) and remote (USD) market salary data
 */
export function getSalaryInsightsTool(roleOrField: string): AIToolResult {
  const lower = normalizeCareerQuery(roleOrField);

  const salaryDatabase: Record<
    string,
    {
      title: string;
      junior: string;
      mid: string;
      senior: string;
      remoteUsd?: string;
      notes: string[];
    }
  > = {
    frontend: {
      title: 'Frontend Developer (React, Next.js, Vue, TypeScript)',
      junior: '22,000 – 38,000 ETB/month',
      mid: '45,000 – 90,000 ETB/month',
      senior: '95,000 – 180,000+ ETB/month',
      remoteUsd: '$1,500 – $4,500/month for international remote contracts',
      notes: [
        'High demand across Ethiopian fintechs (Telebirr, Chapa, SantimPay), banks, and software agencies in Addis Ababa.',
        'Expertise in React, TypeScript, Tailwind CSS, and Next.js commands the highest salary packages.',
        'Strong freelance and remote USD potential via Upwork and direct foreign contracts.',
      ],
    },
    backend: {
      title: 'Backend Engineer (Node.js, Python, Golang, Java, C#/.NET)',
      junior: '24,000 – 40,000 ETB/month',
      mid: '50,000 – 95,000 ETB/month',
      senior: '100,000 – 200,000+ ETB/month',
      remoteUsd: '$1,800 – $5,500/month',
      notes: [
        'Commercial banks (CBE, Awash, Dashen, Co-op Bank) and telecom operators pay top-tier local packages.',
        'Microservices, PostgreSQL/MySQL optimization, Docker, and REST/gRPC API security skills yield 25%+ salary bumps.',
      ],
    },
    software: {
      title: 'Software Engineer / Fullstack Developer',
      junior: '22,000 – 38,000 ETB/month',
      mid: '45,000 – 90,000 ETB/month',
      senior: '95,000 – 190,000+ ETB/month',
      remoteUsd: '$1,800 – $5,000/month',
      notes: [
        'Fullstack developers with both React and Node.js/Django skills are the most versatile hires in Addis Ababa.',
        'International NGOs (UN, GIZ, USAID contractors) offer USD-pegged or tax-free salary allowances.',
      ],
    },
    mobile: {
      title: 'Mobile App Developer (Flutter / React Native / Android)',
      junior: '22,000 – 38,000 ETB/month',
      mid: '45,000 – 85,000 ETB/month',
      senior: '90,000 – 170,000+ ETB/month',
      remoteUsd: '$1,800 – $4,500/month',
      notes: [
        'Flutter has massive local adoption in Ethiopian fintech apps, e-commerce, and logistics.',
        'Cross-platform experience with backend integration (REST/GraphQL) is in high demand.',
      ],
    },
    data: {
      title: 'Data Analyst / Data Scientist / BI Specialist',
      junior: '18,000 – 35,000 ETB/month',
      mid: '40,000 – 75,000 ETB/month',
      senior: '85,000 – 150,000 ETB/month',
      remoteUsd: '$1,500 – $4,200/month',
      notes: [
        'SQL, Power BI, Python/Pandas, and Tableau are the most requested skills in Addis Ababa.',
        'Telecom operators, commercial banks, and humanitarian NGOs are the largest employers.',
      ],
    },
    accounting: {
      title: 'Accountant / Financial Analyst / Auditor',
      junior: '12,000 – 22,000 ETB/month',
      mid: '28,000 – 55,000 ETB/month',
      senior: '65,000 – 130,000+ ETB/month',
      remoteUsd: '$800 – $2,500/month',
      notes: [
        'IFRS certification, Peachtree, QuickBooks, and ERP experience significantly increase salary offers.',
        'Senior finance managers in share companies and NGOs frequently receive fuel and housing allowances.',
      ],
    },
    marketing: {
      title: 'Digital Marketing, Social Media & Content Manager',
      junior: '14,000 – 25,000 ETB/month',
      mid: '28,000 – 55,000 ETB/month',
      senior: '60,000 – 105,000 ETB/month',
      remoteUsd: '$900 – $3,000/month',
      notes: [
        'Expertise in Telegram marketing, TikTok/Meta ad campaigns, and SEO is in very high demand in Ethiopia.',
        'Bilingual copywriting (Amharic & English) with video creation offers a distinct market advantage.',
      ],
    },
    design: {
      title: 'UI/UX & Graphic Designer',
      junior: '15,000 – 28,000 ETB/month',
      mid: '32,000 – 65,000 ETB/month',
      senior: '75,000 – 140,000+ ETB/month',
      remoteUsd: '$1,200 – $3,800/month',
      notes: [
        'Figma proficiency, strong mobile UI portfolio, and design systems experience command top rates.',
        'High freelance potential with foreign clients on Upwork and Dribbble.',
      ],
    },
    hr: {
      title: 'Human Resources (HR) Officer / Manager',
      junior: '12,000 – 22,000 ETB/month',
      mid: '28,000 – 55,000 ETB/month',
      senior: '60,000 – 115,000 ETB/month',
      notes: [
        'Familiarity with Ethiopian Labor Proclamation No. 1156/2019 is required for senior HR roles.',
        'NGOs and multinational manufacturers in industrial parks offer the highest compensation tiers.',
      ],
    },
    engineering: {
      title: 'Civil / Electrical / Mechanical Engineer',
      junior: '14,000 – 25,000 ETB/month',
      mid: '30,000 – 65,000 ETB/month',
      senior: '70,000 – 140,000+ ETB/month',
      notes: [
        'AutoCAD, Revit, ETABS, and project management certifications increase compensation.',
        'Construction projects and international contractors offer project-based bonus structures.',
      ],
    },
    nurse: {
      title: 'Registered Nurse (RN) & Clinical Nurse',
      junior: '10,000 – 18,000 ETB/month',
      mid: '20,000 – 38,000 ETB/month',
      senior: '42,000 – 75,000+ ETB/month',
      notes: [
        'Referral hospitals (Tikur Anbessa, St. Paul, Hawassa) and private hospitals (Kadisco, Medhanie Alem) are major employers.',
        'ICU, Emergency, and Pediatric specialized nurses receive 15–25% premium pay.',
        'International NGOs (MSF, ICRC, UN agencies) offer significantly higher USD-denominated packages.',
      ],
    },
    doctor: {
      title: 'Medical Doctor / Physician / General Practitioner',
      junior: '28,000 – 50,000 ETB/month (Intern/GP)',
      mid: '55,000 – 95,000 ETB/month (Specialist)',
      senior: '110,000 – 250,000+ ETB/month (Consultant/Surgeon)',
      notes: [
        'Public hospitals pay government scale; private hospitals and international NGOs offer 2–3x higher compensation.',
        'Specialists (Surgeons, Radiologists, Anesthetists, Obstetricians) command the highest local salaries.',
        'Many doctors supplement income with private clinic consultations and medical tourism facilitation.',
      ],
    },
    teacher: {
      title: 'Teacher / Lecturer / Educator',
      junior: '8,000 – 14,000 ETB/month (Primary/High School)',
      mid: '16,000 – 32,000 ETB/month (Senior Teacher / Diploma Lecturer)',
      senior: '35,000 – 70,000+ ETB/month (University Lecturer / Professor)',
      notes: [
        'Public schools follow Ministry of Education salary scales; private international schools (ICS, Sandford, Lycée) pay 2–4x more.',
        'University positions (AAU, Addis Ababa Science & Tech, Mekelle, Jimma) include research grants and housing.',
        'IELTS/TOEFL, Cambridge, and STEM subject teachers are in high demand in private institutions.',
      ],
    },
    civil: {
      title: 'Civil Engineer / Structural / Construction',
      junior: '14,000 – 26,000 ETB/month',
      mid: '32,000 – 68,000 ETB/month',
      senior: '75,000 – 150,000+ ETB/month',
      notes: [
        'Road construction (Oromia Road Works, Ethiopian Roads Authority), real estate developers, and dam projects hire heavily.',
        'AutoCAD, Revit, ETABS, SAP2000, Primavera P6, and site supervision experience boost pay by 20–30%.',
        'International contractors (CGGC, CCCC, POWERCHINA) offer project-based allowances and per diems.',
      ],
    },
    mechanical: {
      title: 'Mechanical Engineer / Automotive Mechanic / Maintenance',
      junior: '10,000 – 20,000 ETB/month',
      mid: '22,000 – 45,000 ETB/month',
      senior: '50,000 – 95,000+ ETB/month',
      notes: [
        'Manufacturing plants (flour, beverage, textile), industrial parks, and transport fleets are major employers.',
        'HVAC, refrigeration, CNC operation, and industrial maintenance specialists earn premium salaries.',
        'Automotive technicians with European/Asian brand diagnostic tools earn well in Addis Ababa garages.',
      ],
    },
    electrical: {
      title: 'Electrical Engineer / Electrician / Power / Solar',
      junior: '11,000 – 22,000 ETB/month',
      mid: '25,000 – 52,000 ETB/month',
      senior: '58,000 – 110,000+ ETB/month',
      notes: [
        'EEPCo (Ethiopian Electric Power), industrial plants, solar installation companies, and construction firms hire.',
        'Solar PV design & installation, PLC programming, and high-voltage substation skills are in high demand.',
        'Solar companies (SolarTax, dLight, Ignite Power) offer performance bonuses for installation targets.',
      ],
    },
    logistics: {
      title: 'Logistics / Supply Chain / Warehouse / Procurement',
      junior: '10,000 – 20,000 ETB/month',
      mid: '22,000 – 42,000 ETB/month',
      senior: '48,000 – 90,000+ ETB/month',
      notes: [
        'Freight forwarding, import/export, FMCG distribution, and UN/WFP humanitarian logistics are key sectors.',
        'Customs clearance knowledge, ERP/WMS experience, and fleet management skills increase offers.',
        'Ethiopian Shipping & Logistics Enterprise and private transporters offer per-delivery bonuses.',
      ],
    },
    legal: {
      title: 'Lawyer / Legal Officer / Compliance / Counsel',
      junior: '12,000 – 22,000 ETB/month',
      mid: '28,000 – 58,000 ETB/month',
      senior: '65,000 – 130,000+ ETB/month',
      notes: [
        'Corporate counsel for banks, insurance, and share companies; private law firms; and NGOs require lawyers.',
        'Contract drafting, labor law, tax law, and commercial dispute resolution experience are most valued.',
        'Partners at established Addis Ababa law firms and notaries can earn significantly more per case.',
      ],
    },
    admin: {
      title: 'Admin / Secretary / Receptionist / Office Assistant / Clerk',
      junior: '7,000 – 12,000 ETB/month',
      mid: '13,000 – 22,000 ETB/month',
      senior: '25,000 – 45,000+ ETB/month (PA / Office Manager)',
      notes: [
        'Almost every organization requires admin staff; salary varies by company size and sector.',
        'Bilingual English/Amharic, proficiency in MS Office (Excel/Word), and CRM familiarity are required.',
        'Personal Assistants (PA) to CEOs and diplomatic missions in Addis Ababa receive the highest packages.',
      ],
    },
    hospitality: {
      title: 'Hospitality / Hotel / Restaurant / Waiter / Chef / Barista',
      junior: '6,000 – 10,000 ETB/month',
      mid: '12,000 – 22,000 ETB/month (Supervisor / Senior Chef)',
      senior: '28,000 – 55,000+ ETB/month (Hotel Manager / Executive Chef)',
      notes: [
        'International hotels (Hilton, Sheraton, Radisson Blu, Hyatt, Marriott) pay best and include service charge.',
        'Waiters/waitresses typically earn base salary + tips + service charge (can double income).',
        'Sous Chefs, Baristas, and Pastry Chefs with training certificates earn 30% more than untrained staff.',
      ],
    },
    retail: {
      title: 'Retail / Sales Associate / Cashier / Storekeeper / Merchandiser',
      junior: '6,500 – 12,000 ETB/month',
      mid: '13,000 – 22,000 ETB/month (Supervisor)',
      senior: '25,000 – 48,000+ ETB/month (Store / Retail Manager)',
      notes: [
        'Supermarkets (Shoa, Anbesa, Safeway, Friendship), malls, and boutiques are the main employers.',
        'Commission on sales can add 20–50% to base salary in retail and boutique settings.',
        'Storekeepers with inventory management and ERP system skills are paid 15–25% more than cashiers.',
      ],
    },
    driver: {
      title: 'Driver / Logistics / Delivery / Chauffeur',
      junior: '7,500 – 13,000 ETB/month (Light Vehicle)',
      mid: '14,000 – 25,000 ETB/month (Truck/Heavy / Personal Driver)',
      senior: '28,000 – 50,000+ ETB/month (Fleet Manager / VIP Chauffeur)',
      notes: [
        'Organizations, government agencies, NGOs, and ride-hailing platforms (RIDE, Feres, Indrive) hire drivers.',
        'Heavy truck/lorry drivers earn more than taxi/light vehicle drivers; long-haul routes get per diems.',
        'Personal/VIP drivers for CEOs, embassies, and expats often receive housing and mobile allowances.',
      ],
    },
    security: {
      title: 'Security Guard / Security Officer / Safety Officer',
      junior: '5,500 – 9,500 ETB/month',
      mid: '10,500 – 18,000 ETB/month (Supervisor / CCTV / Patrol)',
      senior: '20,000 – 38,000+ ETB/month (Security Manager / Close Protection)',
      notes: [
        'Private security companies (G4S, KK Security, Shield, Federal Security) are main employers.',
        'Close protection (VIP bodyguard) and embassy/mission security pay double standard guard rates.',
        'Night shifts, armed posts, and CCTV control room positions receive shift and risk allowances.',
      ],
    },
    pharmacist: {
      title: 'Pharmacist / Pharmacy / Pharmaceutical',
      junior: '14,000 – 25,000 ETB/month',
      mid: '28,000 – 50,000 ETB/month',
      senior: '55,000 – 100,000+ ETB/month (Clinical / Pharmaceutical Manager)',
      notes: [
        'Retail pharmacies (Hana, CAHA, Ermyas), pharmaceutical importers, and hospitals hire pharmacists.',
        'Clinical pharmacists and drug regulatory affairs specialists earn premium salaries.',
        'Ownership of a retail pharmacy in a good Addis Ababa neighborhood can yield high income.',
      ],
    },
    sales: {
      title: 'Sales / Business Development / Account Manager',
      junior: '9,000 – 16,000 ETB/month base + commission',
      mid: '18,000 – 35,000 ETB/month base + commission',
      senior: '40,000 – 85,000+ ETB/month (Sales Manager / BD Director)',
      notes: [
        'Commission structure (typically 2–10% of sales) can significantly exceed base salary for top performers.',
        'FMCG, financial services (insurance, banking), tech, and pharmaceuticals are highest-paying sales sectors.',
        'B2B enterprise sales and international export roles offer the highest earning potential in Ethiopia.',
      ],
    },
    devops: {
      title: 'DevOps / Cloud / Infrastructure Engineer',
      junior: '26,000 – 42,000 ETB/month',
      mid: '50,000 – 95,000 ETB/month',
      senior: '105,000 – 200,000+ ETB/month',
      remoteUsd: '$2,000 – $6,500/month',
      notes: [
        'AWS/Azure/GCP certifications, Kubernetes, Docker, Terraform, and CI/CD expertise are in high demand.',
        'Fintechs, telecoms, and companies migrating workloads to cloud pay top rates for DevOps specialists.',
        'Strong freelance USD potential for cloud migration and DevOps consulting projects.',
      ],
    },
    uiux: {
      title: 'UI/UX Designer (Figma, Product Design)',
      junior: '16,000 – 30,000 ETB/month',
      mid: '34,000 – 68,000 ETB/month',
      senior: '75,000 – 140,000+ ETB/month',
      remoteUsd: '$1,500 – $4,200/month',
      notes: [
        'Figma expertise, prototyping, user research, and design system building are core required skills.',
        'Ethiopian fintechs, e-commerce, and software product companies actively hire UI/UX designers.',
        'Strong international freelance opportunities on Dribbble, Behance, and Upwork.',
      ],
    },
    architect: {
      title: 'Architect / Architecture / Building Designer',
      junior: '14,000 – 28,000 ETB/month',
      mid: '32,000 – 70,000 ETB/month',
      senior: '78,000 – 160,000+ ETB/month / per-project fee',
      notes: [
        'Architectural firms, real estate developers, and government construction offices hire architects.',
        'AutoCAD, Revit, SketchUp, Rhino, Lumion, and 3D rendering skills directly impact earning potential.',
        'Many private architects take independent residential/commercial projects for percentage-based fees (2–5% of build cost).',
      ],
    },
    agriculture: {
      title: 'Agriculture / Agronomist / Veterinary / Horticulture',
      junior: '9,000 – 18,000 ETB/month',
      mid: '20,000 – 40,000 ETB/month',
      senior: '45,000 – 85,000+ ETB/month',
      notes: [
        'Ministry of Agriculture, international NGOs (FAO, IFAD, Mercy Corps), and large commercial farms hire.',
        'Coffee, horticulture (flower farms), livestock, and irrigation specialists are in consistent demand.',
        'Field-based roles typically include per diems, transport allowance, and housing/station support.',
      ],
    },
    lab: {
      title: 'Lab Technician / Laboratory Technologist / Medical Lab',
      junior: '9,000 – 16,000 ETB/month',
      mid: '18,000 – 32,000 ETB/month',
      senior: '36,000 – 65,000+ ETB/month (Lab Manager / Senior Technologist)',
      notes: [
        'Public and private hospitals, private diagnostic labs (Integral, Alem, Kadisco), and research institutes employ lab staff.',
        'BSC/MSC in Medical Laboratory Science, COC certification, and specialized equipment experience increase pay.',
        'International research labs (ILRI, AHRI, Armauer Hansen) offer competitive packages with benefits.',
      ],
    },
    creative: {
      title: 'Content Writer / Copywriter / Translator / Editor',
      junior: '8,000 – 15,000 ETB/month',
      mid: '17,000 – 30,000 ETB/month',
      senior: '35,000 – 65,000+ ETB/month',
      remoteUsd: '$600 – $2,200/month',
      notes: [
        'Marketing agencies, media organizations, NGOs, and companies with content needs hire writers.',
        'Bilingual (Amharic + English) professional translators and technical writers are in high demand.',
        'Freelance writers on Upwork, Fiverr, and LinkedIn can earn USD rates per article/project.',
      ],
    },
    media: {
      title: 'Journalist / Media / Reporter / Editor / Producer',
      junior: '8,500 – 16,000 ETB/month',
      mid: '18,000 – 32,000 ETB/month',
      senior: '36,000 – 70,000+ ETB/month (Editor-in-Chief / Senior Producer)',
      notes: [
        'EBC (Ethiopian Broadcasting Corporation), private TV/FM stations, newspapers, and digital media hire.',
        'Investigative reporting, video production, and political/business journalism are highest-paying subfields.',
        'Many media professionals supplement income with PR consulting and corporate content contracts.',
      ],
    },
    cleaning: {
      title: 'Cleaner / Housekeeping / Janitor / Steward',
      junior: '5,000 – 8,000 ETB/month',
      mid: '9,000 – 14,000 ETB/month (Supervisor)',
      senior: '16,000 – 28,000+ ETB/month (Housekeeping Manager)',
      notes: [
        'Hotels, hospitals, office buildings, schools, and residential compounds require cleaning staff.',
        'Hotel housekeeping positions at international brands include service charge and tips.',
        'Cleaning services for embassies, UN agencies, and corporate HQs pay above-market rates.',
      ],
    },
    maintenance: {
      title: 'Maintenance Technician / Handyman / Facility / Service',
      junior: '7,000 – 13,000 ETB/month',
      mid: '14,000 – 25,000 ETB/month',
      senior: '28,000 – 50,000+ ETB/month (Facility Manager)',
      notes: [
        'Hotels, hospitals, malls, industrial parks, and corporate offices require maintenance staff.',
        'Multi-skilled technicians (electrical + plumbing + general repair) are the most employable.',
        'Facility management companies (Jani-King, Servewell, etc.) offer structured career progression.',
      ],
    },
    storekeeper: {
      title: 'Storekeeper / Stock / Inventory / Warehouse Keeper',
      junior: '7,500 – 13,000 ETB/month',
      mid: '14,000 – 24,000 ETB/month',
      senior: '28,000 – 48,000+ ETB/month (Warehouse / Inventory Manager)',
      notes: [
        'Manufacturing, FMCG, retail, import/export, and pharmaceutical warehouses hire storekeepers.',
        'Experience with WMS (Warehouse Management Systems), barcode/RFID, and ERP (SAP, Odoo) skills boost salary.',
        'Medical/pharmaceutical warehouse staff with GMP/GDP training receive a pay premium.',
      ],
    },
  };

  let matchedCategory = 'software';
  if (lower.includes('frontend') || lower.includes('react') || lower.includes('vue') || lower.includes('html') || lower.includes('css')) {
    matchedCategory = 'frontend';
  } else if (lower.includes('backend') || lower.includes('node') || lower.includes('python') || lower.includes('django') || lower.includes('golang') || lower.includes('java')) {
    matchedCategory = 'backend';
  } else if (lower.includes('flutter') || lower.includes('mobile') || lower.includes('android') || lower.includes('ios')) {
    matchedCategory = 'mobile';
  } else if (lower.includes('data') || lower.includes('analyst') || lower.includes('bi') || lower.includes('science')) {
    matchedCategory = 'data';
  } else if (lower.includes('account') || lower.includes('finance') || lower.includes('audit') || lower.includes('bank')) {
    matchedCategory = 'accounting';
  } else if (lower.includes('market') || lower.includes('sales') || lower.includes('social') || lower.includes('content')) {
    matchedCategory = 'marketing';
  } else if (lower.includes('design') || lower.includes('ui') || lower.includes('ux') || lower.includes('graphic') || lower.includes('figma')) {
    matchedCategory = 'design';
  } else if (lower.includes('hr') || lower.includes('human resource') || lower.includes('talent') || lower.includes('recruit')) {
    matchedCategory = 'hr';
  } else if (lower.includes('nurse') || lower.includes('clinical') || lower.includes('hospital') && lower.includes('nurse')) {
    matchedCategory = 'nurse';
  } else if (lower.includes('doctor') || lower.includes('physician') || lower.includes('medical officer') || lower.includes('gp') || lower.includes('surgeon')) {
    matchedCategory = 'doctor';
  } else if (lower.includes('teacher') || lower.includes('lecturer') || lower.includes('instructor') || lower.includes('tutor') || lower.includes('professor') || lower.includes('educator')) {
    matchedCategory = 'teacher';
  } else if (lower.includes('civil') || lower.includes('structural') || lower.includes('construction') || lower.includes('road') || lower.includes('quantity survey')) {
    matchedCategory = 'civil';
  } else if (lower.includes('mechanical') || lower.includes('mechanic') || lower.includes('automotive') || lower.includes('hvac') || lower.includes('machinery')) {
    matchedCategory = 'mechanical';
  } else if (lower.includes('electrical') || lower.includes('electrician') || lower.includes('solar') || lower.includes('electronics') || lower.includes('power')) {
    matchedCategory = 'electrical';
  } else if (lower.includes('logistics') || lower.includes('supply chain') || lower.includes('warehouse') || lower.includes('procurement') || lower.includes('shipping') || lower.includes('fleet')) {
    matchedCategory = 'logistics';
  } else if (lower.includes('legal') || lower.includes('lawyer') || lower.includes('attorney') || lower.includes('counsel') || lower.includes('advocate') || lower.includes('compliance')) {
    matchedCategory = 'legal';
  } else if (lower.includes('admin') || lower.includes('secretary') || lower.includes('receptionist') || lower.includes('office assistant') || lower.includes('clerk') || lower.includes('front desk') || lower.includes('data entry')) {
    matchedCategory = 'admin';
  } else if (lower.includes('hospitality') || lower.includes('hotel') || lower.includes('waiter') || lower.includes('chef') || lower.includes('cook') || lower.includes('barista') || lower.includes('restaurant') || lower.includes('catering')) {
    matchedCategory = 'hospitality';
  } else if (lower.includes('retail') || lower.includes('shop') || lower.includes('supermarket') || lower.includes('store') || lower.includes('cashier') || lower.includes('merchandiser') || lower.includes('sales associate')) {
    matchedCategory = 'retail';
  } else if (lower.includes('driver') || lower.includes('chauffeur') || lower.includes('taxi') || lower.includes('delivery') || lower.includes('lorry') || lower.includes('truck')) {
    matchedCategory = 'driver';
  } else if (lower.includes('security') || lower.includes('guard') || lower.includes('watchman') || lower.includes('safety officer') || lower.includes('close protection') || lower.includes('bouncer')) {
    matchedCategory = 'security';
  } else if (lower.includes('pharmacist') || lower.includes('pharmacy') || lower.includes('druggist') || lower.includes('chemist')) {
    matchedCategory = 'pharmacist';
  } else if (lower.includes('devops') || lower.includes('cloud') || lower.includes('aws') || lower.includes('docker') || lower.includes('kubernetes')) {
    matchedCategory = 'devops';
  } else if (lower.includes('architect') || lower.includes('architecture') || lower.includes('building design') || lower.includes('interior design')) {
    matchedCategory = 'architect';
  } else if (lower.includes('agriculture') || lower.includes('agronomist') || lower.includes('veterinary') || lower.includes('farming') || lower.includes('horticulture') || lower.includes('livestock')) {
    matchedCategory = 'agriculture';
  } else if (lower.includes('lab') || lower.includes('laboratory') || lower.includes('lab tech') || lower.includes('medical lab')) {
    matchedCategory = 'lab';
  } else if (lower.includes('writer') || lower.includes('copywriter') || lower.includes('content writer') || lower.includes('translator') || lower.includes('blogger') || lower.includes('editor')) {
    matchedCategory = 'creative';
  } else if (lower.includes('journalist') || lower.includes('reporter') || lower.includes('media') || lower.includes('broadcast') || lower.includes('producer')) {
    matchedCategory = 'media';
  } else if (lower.includes('cleaner') || lower.includes('cleaning') || lower.includes('housekeeping') || lower.includes('janitor') || lower.includes('maid') || lower.includes('steward')) {
    matchedCategory = 'cleaning';
  } else if (lower.includes('maintenance') || lower.includes('technician') || lower.includes('handyman') || lower.includes('facility') || lower.includes('repair')) {
    matchedCategory = 'maintenance';
  } else if (lower.includes('storekeeper') || lower.includes('store keeper') || lower.includes('inventory') || lower.includes('stock') || lower.includes('warehouse keeper')) {
    matchedCategory = 'storekeeper';
  } else if (lower.includes('engineering') || lower.includes('engineer')) {
    matchedCategory = 'engineering';
  }

  const data = salaryDatabase[matchedCategory];

  let md = `### 📊 Salary Benchmark for **${data.title}** in Ethiopia\n\n`;
  md += `| Experience Level | Estimated Local Salary (ETB) |\n`;
  md += `| :--- | :--- |\n`;
  md += `| 🟢 **Entry / Junior** (0–2 yrs) | **${data.junior}** |\n`;
  md += `| 🟡 **Mid-Level** (2–5 yrs) | **${data.mid}** |\n`;
  md += `| 🟣 **Senior / Lead** (5+ yrs) | **${data.senior}** |\n\n`;

  if (data.remoteUsd) {
    md += `🌐 **Remote International Market:** ~**${data.remoteUsd}**\n\n`;
  }

  md += `**Key Market Insights:**\n`;
  for (const note of data.notes) {
    md += `• ${note}\n`;
  }

  md += `\n*Note: Total compensation in Ethiopia often includes transport allowances, mobile voice/data stipends, medical insurance, and annual bonuses.*`;

  return {
    toolName: 'get_salary_insights',
    summary: `Provided salary benchmark for ${data.title}`,
    responseMarkdown: md,
    suggestedFollowUps: [
      `Show me open ${data.title} jobs`,
      'How to negotiate my salary during an offer?',
      'What certifications boost salary the most?',
    ],
  };
}

/**
 * 3. Interview Coach AI Tool
 * Produces structured interview questions, STAR method frameworks, and Ethiopian job interview tips
 */
export function interviewCoachTool(topicOrRole: string): AIToolResult {
  const normalized = normalizeCareerQuery(topicOrRole);
  const roleName = normalized
    .replace(/\b(interview|prep|preparation|questions|for|how|to|coach|tips)\b/gi, '')
    .trim() || 'Software Engineer / Professional';

  let roleSpecificQuestions = `1. **"Tell me about your technical workflow and key projects."**\n   - *Strategy:* Use the **Present-Past-Future** framework. Summarize your current stack, highlight a major achievement, and show why this role fits you.\n2. **"Describe a time you solved a difficult bug or production issue under pressure."**\n   - *Strategy:* Use the **STAR method** (Situation, Task, Action, Result).\n3. **"How do you ensure code quality, performance, and cross-browser responsiveness?"**\n   - *Strategy:* Mention unit testing, clean component architecture, and responsive CSS strategies.`;

  if (normalized.includes('frontend') || normalized.includes('react')) {
    roleSpecificQuestions = `1. **"Explain how the React Virtual DOM works and how state updates trigger re-renders."**\n   - *Strategy:* Discuss diffing algorithm, keys, memoization (useMemo/useCallback), and preventing unnecessary renders.\n2. **"How do you handle responsive design and cross-device optimization?"**\n   - *Strategy:* Explain mobile-first CSS, Tailwind breakpoints, flexbox/grid, and optimizing asset loading.\n3. **"How do you manage complex application state?"**\n   - *Strategy:* Compare Zustand, Redux Toolkit, React Context, and server-state libraries like React Query/TanStack Query.`;
  } else if (normalized.includes('backend') || normalized.includes('node') || normalized.includes('python')) {
    roleSpecificQuestions = `1. **"How do you design and secure a RESTful or GraphQL API?"**\n   - *Strategy:* Mention JWT authentication, rate limiting, input validation, role-based access control (RBAC), and HTTPS.\n2. **"How do you optimize slow database queries in PostgreSQL/MySQL?"**\n   - *Strategy:* Discuss EXPLAIN ANALYZE, indexing strategies, eliminating N+1 query problems, and Redis caching.\n3. **"Describe how you handle asynchronous tasks and background workers."**\n   - *Strategy:* Mention message queues (RabbitMQ, Kafka, BullMQ, Celery).`;
  }

  const md = `### 🎯 Interview Preparation Guide for **${roleName.toUpperCase()}**

#### 1. Role-Specific Technical Questions
${roleSpecificQuestions}

---

#### 2. The STAR Method Framework for Behavioral Questions
• **S (Situation):** Set the context in 1-2 sentences (*"At my previous job, the app experienced high latency during peak traffic..."*)\n• **T (Task):** Define your specific goal (*"I was tasked with identifying bottlenecks and reducing load time under 2s."*)\n• **A (Action):** Detail your actions (*"I profiled network payloads, implemented caching, and code-split heavy bundles."*)\n• **R (Result):** Share measurable outcome (*"Page load speed improved by 45%, and bounce rates dropped by 20%."*)

---

#### 3. Smart Questions to Ask the Interviewer
• *"What does the technical roadmap look like for this team over the next 6 months?"*\n• *"How does the engineering team handle code reviews, CI/CD, and deployments?"*\n• *"What are the key performance indicators (KPIs) for this position?"*

Would you like to practice answering any specific technical or behavioral question?`;

  return {
    toolName: 'interview_coach',
    summary: `Generated interview coaching plan for ${roleName}`,
    responseMarkdown: md,
    suggestedFollowUps: [
      'Practice question: "Tell me about a time you had a technical disagreement"',
      'What should I wear to an interview in Addis Ababa?',
      'How to negotiate salary during the final interview round?',
    ],
  };
}

/**
 * 4. Resume & CV Optimizer AI Tool
 */
export function resumeEnhancerTool(userProfile?: UserProfile | null): AIToolResult {
  const md = `### 📝 Professional Resume & CV Optimization Guide

To stand out to recruiters in Ethiopia and global remote hiring managers, structure your CV with this winning formula:

#### 1. Essential CV Layout (1–2 Pages PDF)
• **Header:** Full Name, Professional Title, Phone (+251...), Professional Email, Location (Addis Ababa, Ethiopia), LinkedIn / GitHub / Portfolio link.
• **Professional Summary (3–4 lines):**
  - *Example:* *"Results-driven Full Stack Developer with 3+ years experience building scalable web and mobile applications using React, Node.js, and Flutter. Proven record delivering high-impact fintech solutions."*
• **Core Skills Section:**
  - Group by category: *Languages & Frameworks, Databases & Tools, Core Competencies*.
• **Work Experience (Reverse Chronological):**
  - Use the **Google XYZ Formula**: *"Accomplished [X] as measured by [Y] by doing [Z]"*.
  - *Example:* *"Redesigned customer onboarding workflow, increasing user activation by 28% within 2 months."*
• **Education & Certifications:** Degree, University, Year, and relevant certificates (Google, AWS, ALX, Cisco).

---

#### 2. Key Tips for the Ethiopian Market
• Keep your CV in **clean PDF format** (never send editable .docx unless explicitly requested).
• Highlight English proficiency and any Amharic/multilingual skills.
• Avoid including unnecessary personal details (marital status, religion, photo unless requested).

Would you like me to rewrite specific bullet points for your role?`;

  return {
    toolName: 'resume_cv_enhancer',
    summary: 'Generated resume optimization guidance',
    responseMarkdown: md,
    suggestedFollowUps: [
      'Rewrite my work experience bullet points',
      'What is an ATS friendly resume format?',
      'Write a short cover letter for a job application',
    ],
  };
}

/**
 * 5. Ethiopian Labor Law & Employment Regulations Tool
 */
export function laborLawGuideTool(query: string): AIToolResult {
  const md = `### ⚖️ Ethiopian Labor Law Guide (Proclamation No. 1156/2019)

Key employment regulations every employee and job seeker in Ethiopia should know:

1. **Probationary Period:**
   - The maximum allowable probation period is **60 consecutive working days**.
   - During probation, either party may terminate the employment contract without notice or severance pay.

2. **Standard Working Hours & Overtime:**
   - Normal working hours cannot exceed **8 hours per day** or **48 hours per week**.
   - **Overtime Pay Rates:**
     - 6:00 AM – 10:00 PM: **1.5×** standard hourly rate
     - 10:00 PM – 6:00 AM: **1.75×** standard hourly rate
     - Weekly rest day: **2.0×** standard hourly rate
     - Public holiday: **2.5×** standard hourly rate

3. **Annual & Sick Leave:**
   - Minimum statutory annual leave is **16 working days** for the 1st year, plus **1 additional day for every 2 additional years** of service.
   - Sick leave up to **6 months** (1st month with 100% pay, next 2 months with 50% pay, remaining 3 months without pay).

4. **Severance Pay & Notice Period:**
   - Notice period for lawful termination ranges from **1 to 3 months** based on tenure.
   - Severance pay applies after 1+ years of service: 30 days' wages for 1st year + 1/3 of wages for each additional year.

5. **Personal Income Tax & Pension Deductions:**
   - First 600 ETB: 0% tax
   - Brackets range from 10% to 35% on taxable income.
   - Private organization pension: **7%** deducted from employee salary, **11%** contributed by employer.

*Disclaimer: This is for educational guidance. For formal legal disputes, consult the Ministry of Labor and Skills (MoLS).*`;

  return {
    toolName: 'labor_law_work_guide',
    summary: 'Provided Ethiopian labor law summary',
    responseMarkdown: md,
    suggestedFollowUps: [
      'What are the personal income tax brackets in Ethiopia?',
      'How is severance pay calculated step by step?',
      'Can an employer terminate a contract without notice?',
    ],
  };
}

/**
 * 6. Career Path & Transition Advisor Tool
 */
export function careerPathAdvisorTool(targetField: string): AIToolResult {
  const normalized = normalizeCareerQuery(targetField);
  const cleanField = normalized.replace(/\b(how|to|become|transition|into|career|path|roadmap|learn)\b/gi, '').trim() || 'Software & Tech Careers';

  const md = `### 🚀 Career Roadmap & Transition Plan for **${cleanField.toUpperCase()}**

Here is a step-by-step roadmap to learn, build a portfolio, and land jobs:

#### Phase 1: Core Fundamentals (Months 1–2)
• Master foundational theory and tools through structured courses (freeCodeCamp, Coursera, Udemy, YouTube).
• Focus on technologies in high demand in Ethiopia (e.g., Python, React, SQL, Flutter, Figma, Excel/IFRS).

#### Phase 2: Practical Projects & Portfolio (Months 3–4)
• Build 2–3 real-world projects solving genuine problems (e.g., Telebirr integration clone, local directory, financial dashboard, e-commerce app).
• Publish your source code on **GitHub** and write a case study on **LinkedIn**.

#### Phase 3: Networking & Applications (Months 5+)
• Join local tech and professional communities in Addis Ababa (Google Developer Groups, ALX Hubs, Gebeya, tech meetups).
• Apply for entry-level vacancies on **EtVacancy**.
• Set up freelance profiles on **Upwork** and **Fiverr** to earn foreign currency (USD).

Which specific skill would you like to start learning today?`;

  return {
    toolName: 'career_path_advisor',
    summary: `Generated career roadmap for ${cleanField}`,
    responseMarkdown: md,
    suggestedFollowUps: [
      'What are the best free online courses with certificates?',
      'How do I get my first client on Upwork from Ethiopia?',
      'Find entry-level vacancies on EtVacancy',
    ],
  };
}

/**
 * 7. Remote Work & International Earning Guide Tool
 */
export function remoteWorkGuideTool(): AIToolResult {
  const md = `### 🌐 Comprehensive Guide to Remote Work & Earning USD from Ethiopia

Working for international companies from Ethiopia is one of the highest-yield career paths. Here is how to succeed:

#### 1. Top Platforms for Remote Jobs & Freelance
• **Upwork & Fiverr:** Best for starting freelance contracts (web dev, design, writing, translation, virtual assistant).
• **Toptal & Turing:** High-paying senior tech vetting networks ($30–$70/hour).
• **RemoteOK, We Work Remotely, Wellfound:** Full-time remote startup opportunities.
• **LinkedIn Jobs:** Filter by "Worldwide / Remote" location.

#### 2. Getting Paid in Ethiopia
• **Payoneer:** Widely used in Ethiopia to receive USD payments and transfer directly to local banks (Commercial Bank of Ethiopia, Awash, Dashen).
• **Wise / Direct Bank Wire (Swift):** For long-term contract payroll into Ethiopian foreign currency accounts.
• **Local Inward Remittance:** Supported by major Ethiopian banks with favorable exchange rates.

#### 3. Power & Internet Backup Strategy
• **Power:** Get a 30,000mAh+ power bank or mini-UPS (12V) for your Wi-Fi router.
• **Dual ISP:** Primary fiber Wi-Fi + Safaricom / Ethio Telecom 4G/5G mobile hotspot backup.

Would you like tips on optimizing your Upwork profile or writing client proposals?`;

  return {
    toolName: 'remote_work_guide',
    summary: 'Provided remote work and international earnings guide for Ethiopia',
    responseMarkdown: md,
    suggestedFollowUps: [
      'How to write a winning proposal on Upwork?',
      'What remote skills are in the highest demand?',
      'Find remote vacancies on EtVacancy',
    ],
  };
}

/**
 * 8. Amharic Career Assistant Tool (የአማርኛ ስራ እና የስራ እድል አጋዥ)
 */
export function amharicCareerTool(question: string, availableJobs: Job[] = []): AIToolResult {
  let md = `### ሰላም! 👋 የእርስዎ የEtVacancy AI የስራ እና የስራ እድል አማካሪ ነኝ።\n\n`;

  const lower = question.toLowerCase();
  if (lower.includes('ደሞዝ') || lower.includes('ክፍያ')) {
    md += `**በኢትዮጵያ ውስጥ የተለመዱ የደሞዝ መጠኖች:**\n`;
    md += `• 🟢 **ለጀማሪዎች (Junior):** ከ 15,000 እስከ 35,000 ብር በወር\n`;
    md += `• 🟡 **መካከለኛ ልምድ (Mid-level):** ከ 40,000 እስከ 80,000 ብር በወር\n`;
    md += `• 🟣 **ከፍተኛ ልምድ (Senior):** ከ 85,000 እስከ 180,000+ ብር በወር\n`;
    md += `• 🌐 **የሪሞት (Remote) ስራ በውጭ ምንዛሪ:** በወር ከ $1,000 እስከ $4,000 ዶላር ድረስ ይከፈላል።\n\n`;
  } else if (lower.includes('ሲቪ') || lower.includes('cv') || lower.includes('ማመልከቻ')) {
    md += `**ጥሩ የሲቪ (CV) አዘገጃጀት ምክሮች:**\n`;
    md += `1. **ርዝመት:** ከ1 እስከ 2 ገጽ ያልበለጠ እና በ PDF ፎርማት ይሁን።\n`;
    md += `2. **ውጤት ላይ ያተኮረ መግለጫ:** ያከናወኗቸውን ስራዎች በቁጥር እና በውጤት ይግለጹ።\n`;
    md += `3. **የመገኛ አድራሻ:** ትክክለኛ ስልክ (+251...)፣ ኢሜይል እና አድራሻ ማካተትዎን ያረጋግጡ።\n\n`;
  } else if (lower.includes('ኢንተርቪው') || lower.includes('ቃለ መጠይቅ')) {
    md += `**ለስራ ቃለ መጠይቅ (Interview) እንዴት መዘጋጀት ይቻላል?**\n`;
    md += `1. **ስለ ድርጅቱ ማወቅ:** ድርጅቱ የሚሰራቸውን ስራዎች አስቀድመው ይወቁ።\n`;
    md += `2. **የSTAR ቴክኒክ ይጠቀሙ:** ላጋጠመዎት ችግር (Situation)፣ የተሰጠዎት ተልዕኮ (Task)፣ የወሰዱት እርምጃ (Action) እና ያመጡት ውጤት (Result)።\n`;
    md += `3. **ጥያቄዎችን ይጠይቁ:** ስለ ድርጅቱ እና ስለሚሰጠው ስራ 2 ጥሩ ጥያቄዎችን አዘጋጁ።\n\n`;
  } else {
    md += `ስለ **"${question}"** የሚከተሉትን ዋና ዋና ምክሮች ማቅረብ እችላለሁ:\n\n`;
    md += `• **የስራ እድሎችን መፈለግ:** በEtVacancy መተግበሪያ ላይ ያሉ የቅርብ ጊዜ ክፍት የስራ ቦታዎችን ይመልከቱ።\n`;
    md += `• **ሙያዎን ማሳደግ:** በአለም አቀፍ እና በሀገር ውስጥ ተፈላጊ የሆኑትን ቴክኖሎጂዎች እና ክህሎቶች ይማሩ።\n`;
    md += `• **ኔትወርኪንግ:** በ LinkedIn እና በ Telegram የስራ ግሩፖች ላይ ንቁ ተሳትፎ ያድርጉ።\n\n`;
  }

  if (availableJobs.length > 0) {
    md += `**በEtVacancy ላይ ያሉ ክፍት የስራ ቦታዎች:**\n`;
    for (const j of availableJobs.slice(0, 3)) {
      md += `• **${j.title}** — ${j.company?.name || 'ድርጅት'} [JOB_REC: ${j.id}]\n`;
    }
  }

  return {
    toolName: 'amharic_career_tool',
    summary: `Answered question in Amharic: ${question}`,
    responseMarkdown: md,
    recommendedJobs: availableJobs.slice(0, 3),
    suggestedFollowUps: [
      'ክፍት የስራ ቦታዎችን አሳየኝ',
      'የደሞዝ መጠን በኢትዮጵያ ስንት ነው?',
      'ለቃለ መጠይቅ እንዴት መዘጋጀት እችላለሁ?',
    ],
  };
}

/**
 * Detailed Career Knowledge Base for Specific Roles
 */
interface RoleKnowledge {
  title: string;
  category: string;
  overview: string;
  skills: string[];
  salaryETB: { junior: string; mid: string; senior: string; remoteUSD?: string };
  employers: string[];
  interviewTips: string[];
}

const ROLE_KNOWLEDGE_BASE: Record<string, RoleKnowledge> = {
  frontend: {
    title: 'Frontend Developer (Web & UI Engineering)',
    category: 'Software & Technology',
    overview: 'Frontend developers build the visual, interactive user interfaces for web and mobile web applications. In Ethiopia, companies are heavily digitizing consumer banking, e-commerce, and logistics, creating massive demand for modern web engineers.',
    skills: ['HTML5, CSS3, Modern JavaScript (ES6+), TypeScript', 'React.js, Next.js, or Vue.js', 'Tailwind CSS, Responsive Design, CSS Flexbox/Grid', 'State Management (Zustand, Redux Toolkit, Context API)', 'REST APIs & GraphQL integration', 'Git, Webpack/Vite, Web Performance Optimization'],
    salaryETB: {
      junior: '20,000 – 38,000 ETB/month',
      mid: '45,000 – 90,000 ETB/month',
      senior: '95,000 – 180,000+ ETB/month',
      remoteUSD: '$1,500 – $4,500/month',
    },
    employers: ['Fintechs (Telebirr, Chapa, SantimPay, ArifPay)', 'Commercial Banks (CBE, Awash, Dashen, Bank of Abyssinia)', 'Software Consulting Agencies & Startups in Addis Ababa', 'Global Remote Companies via Upwork & international contracts'],
    interviewTips: [
      'Be prepared to explain React Virtual DOM, state re-renders, and memoization hooks.',
      'Show live links to 2-3 responsive projects with clean GitHub repositories.',
      'Explain how you handle API errors, loading states, and cross-browser quirks.',
    ],
  },
  backend: {
    title: 'Backend Developer (API & Database Engineering)',
    category: 'Software & Technology',
    overview: 'Backend engineers architect and maintain the server-side logic, databases, payment gateways, and security protocols powering modern digital applications.',
    skills: ['Node.js/Express/NestJS, Python/Django/FastAPI, Golang, or Java/Spring', 'PostgreSQL, MySQL, MongoDB, Redis', 'RESTful APIs, gRPC, WebSocket architecture', 'Authentication (JWT, OAuth2, RBAC)', 'Docker, Linux server administration, CI/CD', 'Database indexing, query optimization & caching'],
    salaryETB: {
      junior: '24,000 – 40,000 ETB/month',
      mid: '50,000 – 95,000 ETB/month',
      senior: '100,000 – 200,000+ ETB/month',
      remoteUSD: '$1,800 – $5,500/month',
    },
    employers: ['Financial institutions and Payment Service Providers', 'Telecoms (Ethio Telecom, Safaricom Ethiopia)', 'Tech startups and enterprise ERP developers'],
    interviewTips: [
      'Explain database indexing and how to resolve N+1 query bottlenecks.',
      'Demonstrate how you design secure authentication with token refresh cycles.',
      'Discuss rate-limiting and protecting endpoints against DDoS/abuse.',
    ],
  },
  mobile: {
    title: 'Mobile App Developer (Flutter & React Native)',
    category: 'Software & Technology',
    overview: 'Mobile developers craft native-feel iOS and Android applications. Flutter is currently the most widely adopted cross-platform framework across Ethiopian tech startups and banks.',
    skills: ['Flutter & Dart, React Native / TypeScript', 'State management (Bloc, Provider, Riverpod)', 'REST API integration & offline SQLite/Hive caching', 'Push notifications (Firebase FCM), App Store & Play Store publishing', 'Native bridge integrations (Camera, GPS, Bluetooth)'],
    salaryETB: {
      junior: '22,000 – 38,000 ETB/month',
      mid: '45,000 – 85,000 ETB/month',
      senior: '90,000 – 170,000+ ETB/month',
      remoteUSD: '$1,800 – $4,500/month',
    },
    employers: ['Fintech apps (Telebirr mini-apps, digital wallets)', 'Ride-hailing & delivery services (Feres, RIDE, Deliver Addis)', 'Commercial banks and NGO field data collection platforms'],
    interviewTips: [
      'Be ready to explain Flutter Widget lifecycle and state management patterns.',
      'Have APK demos or Play Store links ready to showcase.',
    ],
  },
  data: {
    title: 'Data Analyst & BI Specialist',
    category: 'Data & Analytics',
    overview: 'Data analysts turn raw business data into actionable dashboards and strategic insights, helping leadership make data-driven decisions.',
    skills: ['SQL (Complex joins, window functions, aggregation)', 'Power BI, Tableau, Advanced Microsoft Excel', 'Python (Pandas, NumPy, Matplotlib, Seaborn)', 'Data cleaning, ETL pipelines, and statistical modeling'],
    salaryETB: {
      junior: '18,000 – 35,000 ETB/month',
      mid: '40,000 – 75,000 ETB/month',
      senior: '85,000 – 150,000 ETB/month',
      remoteUSD: '$1,500 – $4,200/month',
    },
    employers: ['Commercial banking intelligence units', 'International NGOs (UN agencies, Save the Children, GIZ)', 'Telecoms and FMCG distributors'],
    interviewTips: [
      'Walk through how you analyzed a real dataset and what business insight you unlocked.',
      'Demonstrate proficiency with SQL subqueries and dashboard design principles.',
    ],
  },
  accounting: {
    title: 'Accountant & Financial Officer',
    category: 'Finance & Accounting',
    overview: 'Accountants handle financial recording, payroll processing, tax compliance (ERCA/MoR), annual reporting under IFRS, and internal auditing.',
    skills: ['IFRS (International Financial Reporting Standards)', 'Peachtree / Sage 50, QuickBooks, ERP systems', 'Ethiopian Tax Law (VAT, Withholding, Income Tax, Pension)', 'Financial statements, bank reconciliations, and budgeting'],
    salaryETB: {
      junior: '12,000 – 22,000 ETB/month',
      mid: '28,000 – 55,000 ETB/month',
      senior: '65,000 – 130,000+ ETB/month',
      remoteUSD: '$800 – $2,500/month',
    },
    employers: ['Private share companies, import/export firms, manufacturing plants', 'Commercial banks, microfinance institutions', 'NGOs and international development organizations'],
    interviewTips: [
      'Highlight your practical experience with Ethiopian monthly tax declarations and IFRS compliance.',
      'Explain how you reconcile discrepancies in general ledger accounts.',
    ],
  },
  marketing: {
    title: 'Digital Marketing & Growth Specialist',
    category: 'Marketing & Sales',
    overview: 'Digital marketers drive brand awareness, user acquisition, and sales through Telegram channels, TikTok/Meta campaigns, SEO, and content strategy.',
    skills: ['Telegram marketing & bot automation', 'Meta Ads (Facebook/Instagram), TikTok Ads Manager, Google Ads', 'Content creation, video editing (CapCut, Premiere), Amharic/English copywriting', 'SEO, email marketing, analytics & conversion rate optimization'],
    salaryETB: {
      junior: '14,000 – 25,000 ETB/month',
      mid: '28,000 – 55,000 ETB/month',
      senior: '60,000 – 105,000 ETB/month',
      remoteUSD: '$900 – $3,000/month',
    },
    employers: ['E-commerce platforms, tech startups, travel agencies', 'Corporate marketing divisions & creative agencies in Addis'],
    interviewTips: [
      'Show metrics from past campaigns (ROAS, cost per lead, organic reach).',
      'Explain your strategy for growing and converting Telegram and social media audiences.',
    ],
  },
  nurse: {
    title: 'Registered Nurse & Clinical Nurse',
    category: 'Healthcare & Medical',
    overview: 'Nurses form the backbone of Ethiopia\'s healthcare system, delivering direct patient care in hospitals, clinics, and community health programs. Demand is high in both public and private sectors, especially with the expansion of referral hospitals and private facilities.',
    skills: ['Patient assessment, vital signs monitoring, and medication administration', 'IV insertion, wound dressing, infection control protocols', 'Electronic Medical Record (EMR) documentation', 'Emergency triage and basic life support (BLS)', 'Specializations: ICU, Pediatrics, ER, Operating Room, Maternity'],
    salaryETB: {
      junior: '10,000 – 18,000 ETB/month',
      mid: '20,000 – 38,000 ETB/month',
      senior: '42,000 – 75,000+ ETB/month',
    },
    employers: ['Public Referral Hospitals (Tikur Anbessa, St. Paul, Hawassa, Jimma)', 'Private Hospitals (Kadisco, Medhanie Alem, Hallelujah, Balcha)', 'International NGOs (MSF, ICRC, UNFPA, Save the Children)', 'Pharmaceutical clinical trial organizations'],
    interviewTips: [
      'Be ready to discuss handling a high-pressure emergency case using the nursing process.',
      'Demonstrate knowledge of Ethiopian Ministry of Health clinical guidelines.',
      'Mention any specializations (ICU, ER, Pediatrics) or additional certifications (BLS, ACLS).',
    ],
  },
  doctor: {
    title: 'Medical Doctor / Physician / Specialist',
    category: 'Healthcare & Medical',
    overview: 'Doctors diagnose and treat illnesses, prescribe medications, and perform procedures. Ethiopia faces a persistent shortage of medical professionals, especially specialists outside Addis Ababa, creating strong job security and career growth.',
    skills: ['Patient history taking, physical examination, and clinical diagnosis', 'Interpretation of lab results, X-rays, CT scans, and ultrasound', 'Prescription management and follow-up care', 'Specialty training: Internal Medicine, Surgery, Pediatrics, OBGYN, Radiology, Anesthesiology, Psychiatry', 'Medical documentation and patient counseling'],
    salaryETB: {
      junior: '28,000 – 50,000 ETB/month (Intern / GP)',
      mid: '55,000 – 95,000 ETB/month (Specialist)',
      senior: '110,000 – 250,000+ ETB/month (Consultant / Surgeon)',
    },
    employers: ['Public University Hospitals & Regional Referral Hospitals', 'Private Premium Hospitals & Polyclinics in Addis Ababa', 'International NGOs (UN, WHO, MSF, ICRC) and Global Fund programs', 'Medical tourism and health insurance companies'],
    interviewTips: [
      'Be ready to walk through a complex clinical case you managed.',
      'Demonstrate up-to-date knowledge of treatment guidelines.',
      'Research the hospital\'s specialty focus and align your experience to their needs.',
    ],
  },
  teacher: {
    title: 'Teacher / Lecturer / Educator',
    category: 'Education & Academia',
    overview: 'Teachers and educators work across primary, secondary, preparatory, technical colleges, and universities. Ethiopia\'s expanding education sector continually needs qualified teachers, especially in STEM subjects, English medium instruction, and higher education.',
    skills: ['Lesson planning, curriculum design, and student assessment', 'Classroom management and differentiated instruction', 'STEM teaching (Math, Physics, Chemistry, Biology)', 'English language instruction and IELTS/TOEFL preparation', 'Research, academic advising, and university lecturing'],
    salaryETB: {
      junior: '8,000 – 14,000 ETB/month (Primary / High School)',
      mid: '16,000 – 32,000 ETB/month (Senior Teacher / Diploma Lecturer)',
      senior: '35,000 – 70,000+ ETB/month (University Lecturer / Professor)',
    },
    employers: ['Ministry of Education — Public Primary & Secondary Schools', 'Private International Schools (ICS, Sandford, Lycée Guebre-Mariam, Hillside)', 'Public Universities (AAU, ASTU, Mekelle, Jimma, Bahir Dar, Hawassa)', 'Private Colleges, TVET Institutions, and Language Centers'],
    interviewTips: [
      'Prepare a sample 15-minute lesson plan on your subject area.',
      'Discuss how you differentiate instruction for diverse learning abilities.',
      'For international schools: highlight familiarity with Cambridge, IB, or Common Core curricula.',
    ],
  },
  civil: {
    title: 'Civil / Structural / Construction Engineer',
    category: 'Engineering & Construction',
    overview: 'Civil engineers design and oversee construction of roads, bridges, dams, buildings, water supply, and sanitation infrastructure. Ethiopia\'s massive infrastructure push (GERD, road expansion, housing, industrial parks) creates enormous demand.',
    skills: ['Structural analysis and design using AutoCAD, Revit, ETABS, SAP2000', 'Quantity surveying, cost estimation, and tender preparation', 'Construction site supervision, quality control, and safety', 'Material testing (concrete, soil, aggregate) and geotechnical surveys', 'Road design (using Civil 3D), drainage, and transportation engineering'],
    salaryETB: {
      junior: '14,000 – 26,000 ETB/month',
      mid: '32,000 – 68,000 ETB/month',
      senior: '75,000 – 150,000+ ETB/month',
    },
    employers: ['Ethiopian Roads Authority, Oromia/SNNPR/Tigray/Afar Road Works Enterprises', 'Real Estate Developers (Sunshine, Ayat, Elmi Olindo, Noor)', 'International Contractors (CGGC, CCCC, POWERCHINA, Keangnam)', 'Consultancy firms and Ministry of Urban & Infrastructure projects'],
    interviewTips: [
      'Bring a portfolio of structural drawings, site reports, or project case studies.',
      'Be ready to solve a simple structural load calculation or quantity take-off problem.',
      'Discuss your site supervision experience and how you enforce quality and safety.',
    ],
  },
  driver: {
    title: 'Driver / Logistics / Delivery / Chauffeur',
    category: 'Transport & Logistics',
    overview: 'Drivers operate light passenger vehicles, trucks, and delivery vans for organizations, ride-hailing platforms, and logistics companies. Skilled professional drivers with clean records are consistently in demand across all sectors in Ethiopia.',
    skills: ['Valid Ethiopian driving license (Grade 1, 2, or 3 as appropriate)', 'Safe, defensive driving with accident-free record', 'Knowledge of Addis Ababa and inter-city road networks', 'Vehicle basic maintenance and pre-trip inspection', 'Heavy truck, trailer, or bus driving for logistics roles; VIP protocol driving for chauffeur positions'],
    salaryETB: {
      junior: '7,500 – 13,000 ETB/month (Light Vehicle)',
      mid: '14,000 – 25,000 ETB/month (Truck/Heavy / Personal Driver)',
      senior: '28,000 – 50,000+ ETB/month (Fleet Manager / VIP Chauffeur)',
    },
    employers: ['Ride-hailing platforms (RIDE, Feres, Indrive, ZayRide)', 'NGOs, UN agencies, and embassies in Addis Ababa', 'Private sector corporates, banks, and CEOs (personal drivers)', 'Transport, logistics, and long-haul freight companies'],
    interviewTips: [
      'Bring your original driving license and any training/COC certificates.',
      'Be prepared for a practical driving assessment during the interview.',
      'For VIP or NGO roles: highlight confidentiality, defensive driving, and protocol awareness.',
    ],
  },
  logistics: {
    title: 'Logistics / Supply Chain / Warehouse / Procurement',
    category: 'Supply Chain & Operations',
    overview: 'Logistics and supply chain professionals manage purchasing, warehousing, inventory, transportation, customs clearance, and distribution. Ethiopia\'s growing import/export, manufacturing, and humanitarian sectors have high demand.',
    skills: ['Procurement process: tendering, vendor evaluation, negotiation, purchase orders', 'Warehouse Management Systems (WMS), ERP inventory modules, barcode/RFID', 'Customs clearance knowledge (ERCA, shipping documentation, LC process)', 'Transport route optimization and fleet management', 'FIFO, FEFO, stock counting, and GMP/GDP for pharma/food'],
    salaryETB: {
      junior: '10,000 – 20,000 ETB/month',
      mid: '22,000 – 42,000 ETB/month',
      senior: '48,000 – 90,000+ ETB/month',
    },
    employers: ['Freight Forwarders (MACC, MGH, Express, World Link)', 'Ethiopian Shipping & Logistics Services Enterprise', 'UN WFP, USAID, and humanitarian NGO logistics teams', 'FMCG companies, pharmaceutical distributors, and e-commerce'],
    interviewTips: [
      'Demonstrate knowledge of Ethiopian import customs process and required documents.',
      'Mention specific ERPs or WMS systems you have used (SAP, Odoo, QuickBooks, Fishbowl).',
      'Give examples of how you reduced costs or improved delivery timelines.',
    ],
  },
  pharmacist: {
    title: 'Pharmacist / Pharmaceutical',
    category: 'Healthcare & Medical',
    overview: 'Pharmacists dispense medications, counsel patients, manage pharmacy operations, and work in drug regulatory affairs or pharmaceutical sales & marketing. Ethiopia\'s expanding private pharmacy chains and pharma import industry need licensed professionals.',
    skills: ['Accurate dispensing of prescription and OTC medications', 'Patient counseling on dosage, side effects, and drug interactions', 'Pharmacy inventory management and cold chain for vaccines/biologics', 'Regulatory affairs: FMHACA registration, GMP compliance, import licensing', 'Pharmacovigilance and clinical trial dispensing'],
    salaryETB: {
      junior: '14,000 – 25,000 ETB/month',
      mid: '28,000 – 50,000 ETB/month',
      senior: '55,000 – 100,000+ ETB/month (Clinical / Pharma Manager)',
    },
    employers: ['Retail Pharmacy Chains (Hana, CAHA, Ermyas, Desta, Africa) & Independent Pharmacies', 'Pharmaceutical Importers & Distributors', 'Private & Public Hospital Pharmacies', 'FMHACA (Food, Medicine & Health Care Administration & Control Authority)'],
    interviewTips: [
      'Be ready to answer dispensing-based clinical questions (e.g., drug interactions, antibiotics, pediatric dosing).',
      'Show familiarity with FMHACA regulations and pharmacy licensing requirements.',
      'For retail roles: highlight customer service and patient counseling approach.',
    ],
  },
  mechanical: {
    title: 'Mechanical Engineer / Mechanic / Maintenance',
    category: 'Engineering & Technical',
    overview: 'Mechanical engineers and technicians design, install, maintain, and repair machinery, HVAC systems, automotive fleets, manufacturing equipment, and industrial plants. Ethiopia\'s growing manufacturing and construction sectors have high demand.',
    skills: ['Preventive and corrective maintenance of industrial machinery and equipment', 'HVAC system design, installation, and repair (chillers, A/C, ventilation)', 'Automotive repair: engine, transmission, electrical diagnosis (light & heavy vehicles)', 'CNC machining, metal fabrication, welding, and hydraulic/pneumatic systems', 'Plant layout, process optimization, and technical documentation'],
    salaryETB: {
      junior: '10,000 – 20,000 ETB/month',
      mid: '22,000 – 45,000 ETB/month',
      senior: '50,000 – 95,000+ ETB/month',
    },
    employers: ['Beverage & Food Factories (BGI, Diageo, Heineken, Habesha, East Africa Bottling)', 'Textile & Garment Factories (Hawassa, Bole Lemi, Kombolcha Industrial Parks)', 'Automotive dealerships & repair garages in Addis Ababa', 'Large commercial HVAC contractors and facility management companies'],
    interviewTips: [
      'Be prepared for a practical test: fault diagnosis on equipment, or technical calculations.',
      'Mention specific tools, CNC machines, welding processes, or HVAC brands you have hands-on experience with.',
      'Highlight safety training (lockout/tagout, PPE, fire safety).',
    ],
  },
  electrical: {
    title: 'Electrical Engineer / Electrician / Power & Solar',
    category: 'Engineering & Technical',
    overview: 'Electrical engineers and electricians design, install, commission, and maintain electrical power systems, wiring, solar PV installations, industrial automation, and substations. Ethiopia\'s energy sector expansion and solar boom create exceptional demand.',
    skills: ['Electrical panel building, wiring, installation, commissioning, and fault finding', 'Solar PV system design, sizing, installation, inverters (SMA, Fronius, Huawei)', 'PLC programming, industrial automation, SCADA, and motor control circuits', 'High-voltage substation maintenance, protection relays, and EEPCo grid standards', 'Electrical design in AutoCAD Electrical, load calculations, and cable sizing'],
    salaryETB: {
      junior: '11,000 – 22,000 ETB/month',
      mid: '25,000 – 52,000 ETB/month',
      senior: '58,000 – 110,000+ ETB/month',
    },
    employers: ['Ethiopian Electric Power (EEP) / Ethiopian Electric Utility (EEU)', 'Solar EPC & Installation Companies (dLight, Ignite Power, SolarTax, Phanes Solar, ReneSola)', 'Real estate developers, electrical contractors, and industrial factories', 'Telecom towers and infrastructure maintenance companies'],
    interviewTips: [
      'Discuss a solar PV or industrial project you sized, installed, or commissioned.',
      'Know Ethiopian electrical codes and EEPCo/EEU connection standards.',
      'Be ready to read an electrical single-line diagram or PLC ladder logic during interview.',
    ],
  },
  architect: {
    title: 'Architect / Building Designer / Urban Planning',
    category: 'Architecture & Design',
    overview: 'Architects design residential, commercial, and public buildings, prepare construction drawings, and supervise site work. Ethiopia\'s real estate, infrastructure, and urban development boom (especially in Addis Ababa) drives strong demand.',
    skills: ['Architectural design in AutoCAD, Revit, SketchUp, Rhino, Lumion, Enscape, and 3ds Max', 'Preparation of full construction drawing sets: architectural, structural, MEP coordination', 'Building permit documentation and compliance with Addis Ababa building codes', 'Site supervision, client meetings, and construction quality monitoring', 'Interior architecture, fit-out design, and space planning'],
    salaryETB: {
      junior: '14,000 – 28,000 ETB/month',
      mid: '32,000 – 70,000 ETB/month',
      senior: '78,000 – 160,000+ ETB/month / per-project fee',
    },
    employers: ['Private Architectural & Engineering Consultancy Firms in Addis Ababa', 'Real Estate Developers (Sunshine, Ayat, Elmi Olindo, Noor, RAYA, Ambassador)', 'Government Agencies (Ministry of Urban, Addis Ababa City Admin, AU, UN)', 'Interior design and fit-out companies'],
    interviewTips: [
      'Bring a professional design portfolio with drawings, renders, and completed project photos.',
      'Demonstrate speed and proficiency in Revit/AutoCAD during a practical test.',
      'Know Addis Ababa building regulations and permit application process.',
    ],
  },
  lab: {
    title: 'Lab Technician / Laboratory Technologist / Medical Lab',
    category: 'Healthcare & Scientific',
    overview: 'Medical and industrial lab technicians perform diagnostic tests, quality control, and laboratory analyses in hospitals, private labs, food/beverage factories, pharmaceutical plants, and research institutes.',
    skills: ['Hematology, clinical chemistry, microbiology, immunology, and parasitology testing', 'Operation of automated analyzers (Mindray, Roche, Abbott, Siemens)', 'QC/QA, standard operating procedures (SOP), and ISO 15189 compliance', 'Sample collection (phlebotomy), processing, storage, and documentation', 'Industrial quality control: food, water, pharmaceutical, and materials testing'],
    salaryETB: {
      junior: '9,000 – 16,000 ETB/month',
      mid: '18,000 – 32,000 ETB/month',
      senior: '36,000 – 65,000+ ETB/month (Lab Manager / Senior Technologist)',
    },
    employers: ['Private Diagnostic Labs (Integral, Kadisco, Alem, Alameda, Betsegah)', 'Public & Private Hospitals', 'Food, Beverage & Pharmaceutical QC Laboratories (BGI, Diageo, Unilever)', 'Research Institutes (ILRI, AHRI, EIAR, Armauer Hansen Research Institute)'],
    interviewTips: [
      'Demonstrate familiarity with SOPs, internal QC, and EQA schemes.',
      'Mention specific analyzers or test panels you run day-to-day.',
      'Be ready to perform a practical test (pipetting, slide preparation, or Gram stain) if asked.',
    ],
  },
  creative: {
    title: 'Content Writer / Copywriter / Translator / Editor',
    category: 'Creative & Communications',
    overview: 'Writers, translators, and editors produce marketing content, technical documentation, translation, and media copy. Bilingual (Amharic/English) content professionals are especially in high demand in Ethiopia\'s growing digital economy.',
    skills: ['SEO-optimized blog writing, social media copy, and marketing content creation', 'Professional English-Amharic translation & localization (website, app, legal, marketing)', 'Copywriting for ads, Telegram, email campaigns, product descriptions, taglines', 'Technical writing: user manuals, SOPs, proposals, and grant documents', 'Proofreading, editing, style guide compliance, and brand voice consistency'],
    salaryETB: {
      junior: '8,000 – 15,000 ETB/month',
      mid: '17,000 – 30,000 ETB/month',
      senior: '35,000 – 65,000+ ETB/month',
      remoteUSD: '$600 – $2,200/month',
    },
    employers: ['Digital Marketing & Creative Agencies in Addis Ababa', 'Media Houses, Publishers, and Content Platforms', 'NGOs and UN agencies requiring translation & documentation', 'Fintech, e-commerce, and SaaS companies with digital products'],
    interviewTips: [
      'Bring a portfolio with 5–10 samples of published articles, ads, translations, or client work.',
      'Be ready for a short 30-minute writing test during or after the interview.',
      'Mention tools you use (Google Docs, Grammarly, WordPress, Trados, MemoQ, ChatGPT workflows).',
    ],
  },
  hospitality: {
    title: 'Hospitality / Hotel / Restaurant / Waiter / Chef / Barista',
    category: 'Hospitality & Tourism',
    overview: 'Ethiopia\'s tourism industry, growing international hotel brands, and expanding F&B scene create steady demand for hotel, restaurant, and service professionals. Experienced chefs and hotel management staff are in especially short supply.',
    skills: ['Fine dining & casual restaurant service: order taking, tray service, wine & beverage knowledge', 'Professional cooking: hot kitchen, cold kitchen, pastry, bakery, sauce preparation', 'Barista & bartending: espresso-based drinks, cocktail mixing, coffee culture expertise', 'Front office operations: PMS (Opera, Cloudbeds), check-in/out, concierge, guest relations', 'Housekeeping: room cleaning, turndown service, laundry operations, linen management'],
    salaryETB: {
      junior: '6,000 – 10,000 ETB/month',
      mid: '12,000 – 22,000 ETB/month (Supervisor / Senior Chef)',
      senior: '28,000 – 55,000+ ETB/month (Hotel Manager / Executive Chef)',
    },
    employers: ['International 5-Star Hotels (Hilton, Sheraton Addis, Radisson Blu, Hyatt, Marriott, Skylight, Elilly)', 'Independent Restaurants, Cafés & Bars in Addis Ababa', 'Catering & Event Companies (Saffron, Vanilla, Balcha, Ambassel)', 'Tour operators, lodges, and resort destinations (Lalibela, Bahir Dar, Hawassa)'],
    interviewTips: [
      'For service roles: be ready for a practical shift or trial day at the establishment.',
      'For chefs: come prepared to cook a signature dish or do a knife skills test.',
      'Highlight specific cuisines, hotel brands, or PMS systems you know well.',
    ],
  },
  retail: {
    title: 'Retail / Sales Associate / Cashier / Merchandiser',
    category: 'Retail & Consumer',
    overview: 'Retail and customer-facing staff are the front line of stores, supermarkets, malls, and boutique shops. Ethiopia\'s expanding modern retail sector (supermarkets, malls, brand stores) creates constant openings at all levels.',
    skills: ['Cash handling, POS system operation (QuickBooks, Vend, Xpress, custom POS)', 'Customer service, product knowledge, upselling & cross-selling', 'Merchandising: shelf arrangement, FIFO rotation, planogram compliance, displays', 'Stock counting, receiving goods, and report writing', 'Loss prevention, security awareness, and incident reporting'],
    salaryETB: {
      junior: '6,500 – 12,000 ETB/month',
      mid: '13,000 – 22,000 ETB/month (Supervisor)',
      senior: '25,000 – 48,000+ ETB/month (Store / Retail Manager)',
    },
    employers: ['Supermarkets & Hypermarkets (Shoa, Anbesa, Safeway, Friendship, 21 Supermarket, Alle)', 'Shopping Malls & Brand Stores (Dembel, Edna Mall, Century, Medhaniyelam Mall, Friendship Mall)', 'Boutique fashion stores & beauty & cosmetics retailers', 'Pharmacy chains and FMCG distributors (field merchandisers)'],
    interviewTips: [
      'Be prepared to solve a sample customer complaint scenario during the interview.',
      'Know basic arithmetic for cashier role practical test.',
      'Demonstrate familiarity with supermarket POS or ERP systems if applying for cashier roles.',
    ],
  },
  agriculture: {
    title: 'Agriculture / Agronomist / Veterinary / Horticulture',
    category: 'Agriculture & Natural Resources',
    overview: 'Agriculture is the backbone of Ethiopia\'s economy. Agronomists, veterinarians, irrigation experts, and horticulture specialists work in government, NGOs, large commercial farms, flower farms, and coffee exporters.',
    skills: ['Crop production: agronomy, soil fertility, pest & disease management, crop protection', 'Animal health & livestock: veterinary clinical practice, herd health, AI breeding, feed formulation', 'Irrigation design & management (drip, sprinkler, center-pivot), water use efficiency', 'Horticulture: cut flowers, vegetables, fruits (horticulture export farms: Sher, Ethiopia Flowers, Karuturi, etc.)', 'Coffee, tea, sesame, and other cash crop value chain & quality (ECX standards)'],
    salaryETB: {
      junior: '9,000 – 18,000 ETB/month',
      mid: '20,000 – 40,000 ETB/month',
      senior: '45,000 – 85,000+ ETB/month',
    },
    employers: ['Ministry of Agriculture & Regional Bureaus of Agriculture', 'International NGOs & Donors (FAO, IFAD, WFP, USAID, Mercy Corps, Save the Children, TechnoServe)', 'Horticulture & Flower Farms (Ziway, Debre Zeit, Koka, Sululta areas)', 'Large commercial farms & agribusinesses (coffee, sesame, livestock, poultry)'],
    interviewTips: [
      'Mention specific crops, livestock species, or agro-ecologies you have worked on.',
      'For field roles: have a valid driver license and be ready to deploy to rural areas.',
      'Know Ethiopian commodity exchange (ECX) quality standards for coffee, sesame, pulses.',
    ],
  },
  media: {
    title: 'Journalist / Media / Reporter / Editor / Producer',
    category: 'Media & Entertainment',
    overview: 'Journalists, reporters, producers, and editors work in broadcast (TV & FM radio), print, and digital media. Ethiopia\'s rapidly expanding private media landscape and content-driven digital platforms offer growing career opportunities.',
    skills: ['News reporting: investigative, politics, business, health, feature writing', 'TV/FM production: camera operation, script writing, segment producing, video editing (Premiere Pro, CapCut, DaVinci)', 'Amharic and English bilingual journalism, editorial review, headline writing', 'Content strategy, social media management, and digital analytics', 'Press law, media ethics, and source protection'],
    salaryETB: {
      junior: '8,500 – 16,000 ETB/month',
      mid: '18,000 – 32,000 ETB/month',
      senior: '36,000 – 70,000+ ETB/month (Editor-in-Chief / Senior Producer)',
    },
    employers: ['Ethiopian Broadcasting Corporation (EBC) & Regional State Medias', 'Private TV & FM Stations (Sheger, Fana, ESAT, Walta, EBS, DW, Ahadu, Tsedey)', 'Newspapers & Online Magazines (The Reporter, Capital, Addis Fortune, Addis Standard)', 'Content and production companies (advertising film, documentary, feature film)'],
    interviewTips: [
      'Bring a portfolio or showreel: 5+ published articles, video segments, or edited showreel clips.',
      'Be ready for a reporting test: write a sample 400-word news piece from a press release.',
      'Know current media legislation and press freedom context in Ethiopia.',
    ],
  },
  cleaning: {
    title: 'Cleaner / Housekeeping / Janitor / Steward',
    category: 'Facilities & Support',
    overview: 'Cleaning and housekeeping staff keep hotels, hospitals, offices, schools, and residential compounds sanitary and well-maintained. It is a consistent entry-level career path with demand in every city in Ethiopia.',
    skills: ['General office, commercial, and residential cleaning procedures', 'Hotel housekeeping: guest room cleaning, turndown service, linen management, mini-bar', 'Use of professional cleaning chemicals, equipment (floor buffers, carpet extractors, steam cleaners)', 'Cleaning schedules, task checklists, and reporting issues to supervisors', 'Hospital/hygiene-sensitive cleaning: sanitization, infection control, waste segregation'],
    salaryETB: {
      junior: '5,000 – 8,000 ETB/month',
      mid: '9,000 – 14,000 ETB/month (Supervisor)',
      senior: '16,000 – 28,000+ ETB/month (Housekeeping Manager)',
    },
    employers: ['4 & 5-Star Hotels in Addis Ababa (Hilton, Sheraton, Radisson, etc.)', 'Private & Public Hospitals and Medical Clinics', 'Office Buildings, Banks, Embassies & UN agency premises', 'Professional cleaning service companies (Jani-King, Servewell, etc.)'],
    interviewTips: [
      'Demonstrate understanding of cleaning chemicals and which surfaces they should (or shouldn\'t) be used on.',
      'For hotel roles: explain your bed-making and room cleaning sequence for a 30-minute guest room turnaround.',
      'Highlight reliability, attention to detail, and prior long-term employment history.',
    ],
  },
  maintenance: {
    title: 'Maintenance Technician / Handyman / Facility / Service',
    category: 'Facilities & Support',
    overview: 'Multi-skilled maintenance technicians handle general repairs, carpentry, plumbing, electrical, painting, and upkeep of buildings, hotels, hospitals, and industrial facilities. Jack-of-all-trades technicians are extremely employable.',
    skills: ['General building repairs: carpentry, painting, tiling, plastering, minor masonry', 'Plumbing: pipe repair, tap replacement, unclogging, water heater maintenance', 'Basic electrical: wiring, lights & switches, ballast/LED replacement, breaker panel checks', 'HVAC & generator routine maintenance: filter changes, A/C cleaning, fuel & oil checks', 'Preventive maintenance scheduling and work-order management in CMMS systems'],
    salaryETB: {
      junior: '7,000 – 13,000 ETB/month',
      mid: '14,000 – 25,000 ETB/month',
      senior: '28,000 – 50,000+ ETB/month (Facility Manager)',
    },
    employers: ['Facility Management Companies serving corporate HQs and embassies', 'Large hotels, hospitals, malls, and mixed-use developments', 'Industrial parks, factories, and manufacturing plants', 'Real estate management companies & residential compounds'],
    interviewTips: [
      'Be ready for a practical test: replace a tap washer, re-wire a light socket, or do a paint patch.',
      'Know the difference between preventive and corrective maintenance.',
      'Mention all your practical skills. Being multi-skilled is the #1 hiring criteria.',
    ],
  },
  storekeeper: {
    title: 'Storekeeper / Stock / Inventory / Warehouse Keeper',
    category: 'Supply Chain & Operations',
    overview: 'Storekeepers and inventory staff manage inbound/outbound goods, stock counts, and records in warehouses, retail stockrooms, factories, and distribution centers. Inventory accuracy directly impacts profitability, making this role critical.',
    skills: ['Receiving, inspecting, put-away, picking, packing, and dispatching stock', 'FIFO/FEFO stock rotation, expiry date tracking, batch & lot management', 'Physical stock counting (daily, weekly, monthly, year-end) and reconciliation', 'ERP/WMS systems: SAP, Odoo, QuickBooks, Fishbowl, Zoho Inventory, custom WMS', 'Warehouse housekeeping, pest control coordination, and 5S/Lean principles'],
    salaryETB: {
      junior: '7,500 – 13,000 ETB/month',
      mid: '14,000 – 24,000 ETB/month',
      senior: '28,000 – 48,000+ ETB/month (Warehouse / Inventory Manager)',
    },
    employers: ['FMCG importers & distributors (beverage, food, household goods)', 'Pharmaceutical importers & distributors (cold chain + GDP)', 'Manufacturing plants: raw material + finished goods stores', 'E-commerce fulfillment centers and 3PL logistics providers'],
    interviewTips: [
      'Be ready to do a practical GRN (Goods Received Note) or stock count exercise.',
      'Know FIFO vs FEFO and when each is applied (food vs pharma vs non-perishable).',
      'Mention specific ERPs/WMS you have used and how you tracked inventory accuracy.',
    ],
  },
  legal: {
    title: 'Lawyer / Legal Officer / Compliance / Counsel',
    category: 'Legal & Compliance',
    overview: 'Lawyers advise on corporate law, contracts, labor law, tax, regulatory compliance, and represent clients in court. Commercial banks, insurance firms, share companies, and NGOs are the largest non-government employers of lawyers in Ethiopia.',
    skills: ['Commercial contract drafting, review, and negotiation (sale, lease, MOU, employment)', 'Ethiopian Commercial Code, Labor Proclamation, Tax Law, Company Law', 'Court litigation, evidence preparation, and case management', 'Regulatory compliance (NBE, NCC, MoJ sector-specific regulations)', 'Corporate governance, board minutes, and shareholder agreements'],
    salaryETB: {
      junior: '12,000 – 22,000 ETB/month',
      mid: '28,000 – 58,000 ETB/month',
      senior: '65,000 – 130,000+ ETB/month',
    },
    employers: ['Commercial Banks & Insurance Companies (CBE, Awash, Dashen, Nile, Zemen)', 'Private Law Firms in Addis Ababa (full-service and boutique firms)', 'NGOs, UN agencies, and international development organizations', 'Corporate in-house legal for share companies and factories'],
    interviewTips: [
      'Be ready to analyze a sample fact pattern under Ethiopian Commercial or Labor Law.',
      'Bring writing samples: a contract you drafted or a legal brief/memo.',
      'For corporate roles: know recent relevant regulatory changes (NBE directives, etc.).',
    ],
  },
  admin: {
    title: 'Admin / Secretary / Receptionist / Office Assistant',
    category: 'Office & Business Support',
    overview: 'Admin and office support staff are the backbone of every organization, handling correspondence, scheduling, record keeping, front desk, and coordination. Reliable, detail-oriented administrative staff are consistently in high demand.',
    skills: ['Microsoft Office Suite (Word, Excel, PowerPoint, Outlook) at intermediate level', 'Phone handling, meeting scheduling, and calendar management', 'Professional front-desk greeting and visitor management', 'Filing systems, document control, and basic HR administration', 'Drafting letters, reports, and minutes in English and Amharic'],
    salaryETB: {
      junior: '7,000 – 12,000 ETB/month',
      mid: '13,000 – 22,000 ETB/month',
      senior: '25,000 – 45,000+ ETB/month (PA / Office Manager)',
    },
    employers: ['All private and public sector organizations across every industry', 'Embassies, UN agencies, and international NGOs in Addis', 'Hotels, hospitals, and corporate HQ office buildings', 'Co-working spaces, serviced offices, and business centers'],
    interviewTips: [
      'Demonstrate strong MS Excel skills (VLOOKUP, Pivot Tables, basic formulas) during the practical test.',
      'Highlight organizational skills, attention to detail, and reliability.',
      'For PA/executive assistant roles: emphasize confidentiality and proactive work style.',
    ],
  },
  sales: {
    title: 'Sales / Business Development / Account Manager',
    category: 'Sales & Business Development',
    overview: 'Sales professionals drive revenue through new client acquisition, account management, and business-to-business (B2B) or business-to-consumer (B2C) relationships. Top performers in high-growth sectors can earn very high incomes through commission.',
    skills: ['Lead generation, prospecting, cold calling, and pipeline management', 'Sales negotiation, closing techniques, and objection handling', 'Customer relationship management (CRM) tools and sales reporting', 'B2B relationship building and enterprise account development', 'Product demonstrations, proposal writing, and tender responses'],
    salaryETB: {
      junior: '9,000 – 16,000 ETB/month base + commission',
      mid: '18,000 – 35,000 ETB/month base + commission',
      senior: '40,000 – 85,000+ ETB/month (Sales Manager / BD Director)',
    },
    employers: ['FMCG Distribution & Import Companies', 'Financial Services: Banks, Insurance, Microfinance', 'Technology, SaaS, and Digital Product Startups', 'Pharmaceutical, medical equipment, and industrial supply companies'],
    interviewTips: [
      'Come with concrete sales numbers from past roles (revenue generated, clients acquired, target % achieved).',
      'Role-play a cold call or sales pitch for the company\'s product during the interview.',
      'Ask about the commission structure and sales target expectations upfront.',
    ],
  },
  security: {
    title: 'Security Guard / Security Officer / Safety',
    category: 'Facilities & Support',
    overview: 'Security personnel protect people, property, and assets for residential, commercial, industrial, and diplomatic sites. Ethiopia\'s growing commercial real estate and diplomatic presence create steady demand for professional security services.',
    skills: ['Access control, visitor management, and perimeter patrol', 'CCTV monitoring, alarm response, and incident reporting', 'Basic first aid and emergency response training', 'VIP/close protection skills and bodyguard protocol', 'Fire safety, emergency evacuation, and health & safety awareness'],
    salaryETB: {
      junior: '5,500 – 9,500 ETB/month',
      mid: '10,500 – 18,000 ETB/month (Supervisor / CCTV / Patrol)',
      senior: '20,000 – 38,000+ ETB/month (Security Manager / Close Protection)',
    },
    employers: ['Private Security Companies (G4S, KK Security, Shield, Federal, Saba)', 'Embassies, UN compounds, and international organization missions', 'Banks, shopping malls, hotels, and corporate HQs', 'Industrial parks, manufacturing plants, and residential compounds'],
    interviewTips: [
      'Bring any COC, military/police discharge, or security training certificates.',
      'Demonstrate alertness, good communication, and professionalism during interview.',
      'For supervisor/manager roles: know post orders, incident report writing, and fire procedures.',
    ],
  },
};

/**
 * 9. Universal Dynamic Q&A Engine
 * Handles any specific technical, career, or situational question intelligently like ChatGPT.
 */
export function generalCareerQATool(
  userQuestion: string,
  availableJobs: Job[] = [],
  userProfile?: UserProfile | null,
): AIToolResult {
  const normalized = normalizeCareerQuery(userQuestion);
  const text = (userQuestion || '').trim();
  const lower = normalized.toLowerCase();

  // 1. Role-specific synonym matcher for knowledge base
  const ROLE_KEY_TRIGGERS: Record<string, string[]> = {
    frontend: ['frontend', 'front end', 'front-end', 'react', 'next.js', 'vue', 'angular', 'javascript', 'typescript', 'html', 'css', 'tailwind', 'web developer', 'web dev', 'ui developer'],
    backend: ['backend', 'back end', 'back-end', 'node', 'express', 'nestjs', 'python', 'django', 'fastapi', 'golang', 'go', 'java', 'spring', 'php', 'laravel', 'sql', 'postgres', 'api developer'],
    mobile: ['mobile', 'flutter', 'dart', 'react native', 'android', 'ios', 'kotlin', 'swift', 'app developer'],
    data: ['data analyst', 'data scientist', 'bi', 'power bi', 'tableau', 'analytics', 'python pandas', 'data engineer'],
    accounting: ['accountant', 'accounting', 'finance', 'auditor', 'ifrs', 'peachtree', 'quickbooks', 'cashier', 'tax officer', 'account receivable', 'accounts payable'],
    marketing: ['marketing', 'digital marketing', 'social media', 'seo', 'content marketing', 'telegram marketing', 'growth hacker', 'advertising', 'brand'],
    nurse: ['nurse', 'registered nurse', 'rn', 'clinical nurse', 'staff nurse', 'icu nurse', 'pediatric', 'er nurse', 'hospital nurse', 'scrub nurse'],
    doctor: ['doctor', 'physician', 'medical officer', 'gp', 'surgeon', 'specialist', 'medical doctor', 'intern doctor', 'consultant', 'obstetrician', 'pediatrician'],
    teacher: ['teacher', 'lecturer', 'instructor', 'tutor', 'educator', 'professor', 'academician', 'kindergarten', 'primary school', 'high school', 'english teacher', 'math teacher'],
    civil: ['civil engineer', 'civil', 'structural', 'construction', 'road construction', 'site engineer', 'autocad', 'architectural', 'quantity surveyor', 'building engineer'],
    mechanical: ['mechanical engineer', 'mechanic', 'automotive', 'hvac', 'machinery', 'maintenance engineer', 'cnc', 'welder', 'refrigeration'],
    electrical: ['electrical engineer', 'electrician', 'solar', 'electronics', 'power', 'wiring', 'plc', 'substation', 'instrumentation', 'electrical technician'],
    logistics: ['logistics', 'supply chain', 'warehouse', 'procurement', 'inventory', 'fleet', 'shipping', 'transport officer', 'freight forwarder', 'customs'],
    legal: ['lawyer', 'attorney', 'legal', 'counsel', 'advocate', 'legal officer', 'compliance officer', 'contract', 'prosecutor', 'judge'],
    admin: ['admin', 'administrative', 'secretary', 'receptionist', 'office assistant', 'clerk', 'data entry', 'front desk', 'office coordinator', 'pa', 'personal assistant', 'office manager'],
    driver: ['driver', 'chauffeur', 'taxi', 'delivery', 'lorry', 'truck driver', 'bus driver', 'heavy vehicle', 'ride hailing'],
    pharmacist: ['pharmacist', 'pharmacy', 'druggist', 'chemist', 'pharmaceutical', 'dispensary'],
    sales: ['sales', 'business development', 'account manager', 'sales representative', 'client relationship', 'bd', 'sales executive', 'field sales'],
    security: ['security', 'guard', 'security officer', 'safety officer', 'bouncer', 'watchman', 'cctv', 'close protection', 'bodyguard'],
    devops: ['devops', 'cloud', 'aws', 'docker', 'kubernetes', 'linux', 'ci/cd', 'sysadmin', 'infrastructure engineer'],
    architect: ['architect', 'architecture', 'building design', 'interior design', 'town planner', 'urban planner', 'architectural designer'],
    lab: ['lab technician', 'laboratory', 'lab technologist', 'medical lab', 'clinical lab', 'microbiology', 'phlebotomist', 'qc lab'],
    creative: ['content writer', 'copywriter', 'blogger', 'article writer', 'translator', 'editor', 'seo writer', 'amharic writer'],
    hospitality: ['hotel', 'hospitality', 'waiter', 'barista', 'chef', 'cook', 'restaurant', 'catering', 'guest service', 'front office', 'housekeeping'],
    retail: ['retail', 'shop', 'store', 'sales associate', 'merchandiser', 'supermarket', 'boutique'],
    agriculture: ['agriculture', 'agronomist', 'veterinary', 'farming', 'livestock', 'horticulture', 'forestry', 'irrigation', 'animal science'],
    media: ['journalist', 'media', 'broadcast', 'radio', 'tv', 'reporter', 'editor', 'producer', 'news anchor'],
    cleaning: ['cleaner', 'cleaning', 'housekeeping', 'maid', 'janitor', 'sanitation', 'steward'],
    maintenance: ['maintenance', 'repair', 'technician', 'facility', 'handyman', 'service technician', 'building maintenance'],
    storekeeper: ['storekeeper', 'store keeper', 'stock', 'inventory', 'warehouse keeper', 'store manager', 'stock controller'],
  };

  for (const [key, info] of Object.entries(ROLE_KNOWLEDGE_BASE)) {
    const triggers = ROLE_KEY_TRIGGERS[key] || [key];
    const matches = triggers.some((t) => lower.includes(t));
    if (matches) {
      const matched = availableJobs.filter((j) => {
        const combined = `${j.title} ${j.description || ''} ${(j.requirements || []).join(' ')}`.toLowerCase();
        return triggers.some((t) => combined.includes(t));
      });

      const jobsToShow = matched.length > 0 ? matched.slice(0, 4) : availableJobs.slice(0, 3);

      let md = `### 💼 Career Guide: **${info.title}**\n\n`;
      md += `${info.overview}\n\n`;

      md += `#### 🛠️ Core Skills & In-Demand Competencies:\n`;
      for (const s of info.skills) {
        md += `• ${s}\n`;
      }
      md += `\n`;

      md += `#### 💰 Ethiopian & Remote Salary Benchmark:\n`;
      md += `• 🟢 **Entry / Junior:** ${info.salaryETB.junior}\n`;
      md += `• 🟡 **Mid-Level:** ${info.salaryETB.mid}\n`;
      md += `• 🟣 **Senior / Lead:** ${info.salaryETB.senior}\n`;
      if (info.salaryETB.remoteUSD) {
        md += `• 🌐 **Remote (USD):** ~${info.salaryETB.remoteUSD}\n`;
      }
      md += `\n`;

      md += `#### 🏢 Top Employers in Ethiopia:\n`;
      for (const e of info.employers) {
        md += `• ${e}\n`;
      }
      md += `\n`;

      md += `#### 🎯 Top Interview Focus Areas:\n`;
      for (const tip of info.interviewTips) {
        md += `• ${tip}\n`;
      }
      md += `\n`;

      if (jobsToShow.length > 0) {
        md += `#### 📌 Relevant Vacancies on EtVacancy:\n`;
        for (const j of jobsToShow) {
          const sal = formatSalaryRange(j.salaryMin, j.salaryMax, j.salaryPeriod, j.salaryCurrency);
          md += `• **${j.title}** at **${j.company?.name || 'Company'}** (📍 ${j.city || 'Addis Ababa'})\n`;
          md += `  💰 ${sal} • ${j.employmentType || j.type || 'Full Time'}\n`;
          md += `  [JOB_REC: ${j.id}]\n\n`;
        }
        md += `Tap on any job card below to view full requirements and apply directly!`;
      }

      return {
        toolName: 'role_career_guide',
        summary: `Career guide for ${info.title}`,
        responseMarkdown: md,
        recommendedJobs: jobsToShow,
        suggestedFollowUps: [
          `Show me all open ${info.title.split('/')[0]} vacancies`,
          `Interview questions for ${info.title.split('/')[0]}`,
          `Salary benchmark for ${info.title.split('/')[0]} in Addis Ababa`,
        ],
      };
    }
  }

  // 2. User says "You didn't show me the job listed" or asks where the jobs are
  if (
    lower.includes("didn't show") ||
    lower.includes('did not show') ||
    lower.includes('where are the jobs') ||
    lower.includes('show me the job') ||
    lower.includes('job listed') ||
    lower.includes('list the jobs') ||
    lower.includes('show list') ||
    lower.includes('all jobs')
  ) {
    const jobsToShow = availableJobs.slice(0, 5);
    let md = `Here are the top job vacancies currently open on **EtVacancy**:\n\n`;
    for (const j of jobsToShow) {
      const sal = formatSalaryRange(j.salaryMin, j.salaryMax, j.salaryPeriod, j.salaryCurrency);
      md += `• **${j.title}** at **${j.company?.name || 'Company'}**\n`;
      md += `  📍 *${j.city || 'Addis Ababa'}* (${j.employmentType || j.type || 'Full Time'})\n`;
      md += `  💰 ${sal}\n`;
      md += `  [JOB_REC: ${j.id}]\n\n`;
    }
    md += `Tap any card below to view requirements, benefits, and submit your application directly!`;

    return {
      toolName: 'search_vacancies',
      summary: 'Listed available jobs on EtVacancy',
      responseMarkdown: md,
      recommendedJobs: jobsToShow,
      suggestedFollowUps: [
        'Filter for remote jobs only',
        'Show software developer jobs in Addis',
        'What are the salary expectations for these?',
      ],
    };
  }

  // 3. Permanent / Full-time / Contract job inquiry
  if (lower.includes('permanent') || lower.includes('full time') || lower.includes('full-time') || lower.includes('contract')) {
    const isPermanent = lower.includes('permanent') || lower.includes('full time') || lower.includes('full-time');
    const matched = availableJobs.filter((j) => (isPermanent ? j.type === 'FULL_TIME' || !j.type : j.type === 'CONTRACT'));
    const jobsToShow = matched.length > 0 ? matched.slice(0, 5) : availableJobs.slice(0, 3);

    let md = `Here are the **${isPermanent ? 'Permanent & Full-Time' : 'Contract'} Vacancies** currently open on EtVacancy:\n\n`;
    for (const j of jobsToShow) {
      const sal = formatSalaryRange(j.salaryMin, j.salaryMax, j.salaryPeriod, j.salaryCurrency);
      md += `• **${j.title}** — **${j.company?.name || 'Company'}** (📍 ${j.city || 'Addis Ababa'})\n`;
      md += `  💰 ${sal} • ${j.employmentType || j.type || 'Full Time'}\n`;
      md += `  [JOB_REC: ${j.id}]\n\n`;
    }

    if (isPermanent) {
      md += `💡 **About Permanent Employment in Ethiopia:**\n`;
      md += `Under Ethiopian Labor Proclamation No. 1156/2019, permanent employees are entitled to statutory job security after completing the 60-day probation period, including mandatory 16+ days annual leave, private organization pension contributions (7% employee / 11% employer), and severance protections.\n\n`;
      md += `Tap on any job card below to apply!`;
    }

    return {
      toolName: 'search_vacancies',
      summary: `Found ${jobsToShow.length} permanent/contract jobs`,
      responseMarkdown: md,
      recommendedJobs: jobsToShow,
      suggestedFollowUps: [
        'What are the probation rules for permanent jobs in Ethiopia?',
        'How to prepare for an interview for these roles?',
        'Show remote vacancies',
      ],
    };
  }

  // 4. Default Smart Dynamic Answer for any other specific inquiry
  const keywords = normalized
    .replace(/[^\w\s]/gi, ' ')
    .split(/\s+/)
    .filter((w) => w.length > 2 && !['what', 'when', 'where', 'which', 'about', 'please', 'could', 'would', 'should', 'have', 'with', 'tell', 'show', 'give'].includes(w));

  const matchedJobs = availableJobs.filter((j) => {
    const jobText = `${j.title} ${j.company?.name || ''} ${j.city || ''} ${j.description || ''} ${(j.requirements || []).join(' ')}`.toLowerCase();
    return keywords.some((kw) => jobText.includes(kw));
  }).slice(0, 4);

  const jobsToShow = matchedJobs.length > 0 ? matchedJobs : availableJobs.slice(0, 3);

  let md = `### 💡 Career Guidance: "${text}"\n\n`;
  md += `Here is specific, actionable guidance for your inquiry:\n\n`;
  md += `1. **Market Opportunity:** Sectors currently recruiting aggressively in Ethiopia include **Fintech, Commercial Banking, Telecom, NGOs, Manufacturing, and International Remote Contracts**.\n`;
  md += `2. **Skill Alignment:** Highlight measurable achievements on your CV (*e.g., "Led feature delivery resulting in 25% user growth"*).\n`;
  md += `3. **Networking & Visibility:** Engage directly with hiring managers on LinkedIn and follow verified Ethiopian career channels on Telegram.\n\n`;

  if (jobsToShow.length > 0) {
    md += `**Matching Vacancies on EtVacancy:**\n`;
    for (const j of jobsToShow) {
      const sal = formatSalaryRange(j.salaryMin, j.salaryMax, j.salaryPeriod, j.salaryCurrency);
      md += `• **${j.title}** at **${j.company?.name || 'Company'}** (📍 ${j.city || 'Addis Ababa'})\n`;
      md += `  💰 ${sal}\n`;
      md += `  [JOB_REC: ${j.id}]\n\n`;
    }
    md += `Tap any card below to view details and apply!`;
  }

  return {
    toolName: 'general_career_qa',
    summary: `Answered question: ${text}`,
    responseMarkdown: md,
    recommendedJobs: jobsToShow,
    suggestedFollowUps: [
      'Show me relevant vacancies on EtVacancy',
      'What are the typical interview questions for this?',
      'What is the salary benchmark in Addis Ababa?',
    ],
  };
}

