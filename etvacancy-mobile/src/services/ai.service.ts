import { GEMINI_API_KEY, ETHIOPIAN_CITIES, ETHIOPIAN_REGIONS, MAJOR_INDUSTRIES } from '@constants/index';
import type { Job, JobType, EmploymentType, ExperienceLevel, UserProfile, JobSeekerProfile, Skill, WorkExperience, Education } from '@/types/index';
import {
  searchVacanciesTool,
  getSalaryInsightsTool,
  interviewCoachTool,
  resumeEnhancerTool,
  laborLawGuideTool,
  careerPathAdvisorTool,
  remoteWorkGuideTool,
  amharicCareerTool,
  generalCareerQATool,
  normalizeCareerQuery,
  AIToolResult,
} from './ai-tools.service';

export {
  searchVacanciesTool,
  getSalaryInsightsTool,
  interviewCoachTool,
  resumeEnhancerTool,
  laborLawGuideTool,
  careerPathAdvisorTool,
  remoteWorkGuideTool,
  amharicCareerTool,
  generalCareerQATool,
  normalizeCareerQuery,
  AIToolResult,
};

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  createdAt: Date;
  jobRecommendations?: Job[];
  jobMatchScores?: Record<string, { score: number; reasons: string[] }>;
  isError?: boolean;
  toolUsed?: string;
  suggestedFollowUps?: string[];
}

export interface ExtractedAIFilters {
  query?: string;
  city?: string;
  type?: JobType;
  employmentType?: EmploymentType;
  experienceLevel?: ExperienceLevel;
  remoteOnly?: boolean;
  urgentOnly?: boolean;
  salaryMin?: number;
  salaryMax?: number;
  categoryId?: string;
  keywords?: string[];
  summary: string;
}

export interface AIScoredJob {
  job: Job;
  matchScore: number; // 0 to 100
  matchReasons: string[];
  highlights?: string;
}

// Candidate Gemini models to attempt in order
const GEMINI_MODELS = [
  'gemini-1.5-flash',
  'gemini-2.0-flash',
  'gemini-1.5-pro',
  'gemini-2.5-flash',
  'gemini-1.5-flash-8b',
  'gemini-pro',
];

const MAX_CONTEXT_MESSAGES = 12;
const MAX_SINGLE_MESSAGE_CHARS = 3000;

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function sanitizeAIResponse(text: string): string {
  if (!text) return '';
  let cleaned = text.trim();
  cleaned = cleaned.replace(/^\s*```(?:markdown|md)?\s*/i, '').replace(/\s*```\s*$/i, '');
  cleaned = cleaned.replace(/\n{4,}/g, '\n\n\n');
  cleaned = cleaned.replace(/\[\s*JOB_REC\s*:\s*/gi, '[JOB_REC: ');
  return cleaned;
}

function extractUserProfileContext(userProfile?: UserProfile | null): string {
  if (!userProfile) return '';
  const seeker = userProfile.jobSeekerProfile;
  if (!seeker) return '';

  const parts: string[] = [];
  const userName = userProfile.fullName || userProfile.firstName || 'Job Seeker';
  parts.push(`Seeker Name: ${userName}`);

  if (seeker.headline) parts.push(`Professional Headline: ${seeker.headline}`);
  if (seeker.experienceLevel) parts.push(`Experience Level: ${seeker.experienceLevel}`);
  if (seeker.currentCity || seeker.currentCountry)
    parts.push(`Location: ${seeker.currentCity || ''} ${seeker.currentCountry || 'Ethiopia'}`);

  const skills = Array.isArray(seeker.skills)
    ? seeker.skills.map((s: any) => (typeof s === 'string' ? s : s?.name)).filter(Boolean)
    : [];
  if (skills.length > 0) parts.push(`Core Skills: ${skills.slice(0, 15).join(', ')}`);

  const desiredTitles = Array.isArray(seeker.desiredJobTitles) ? seeker.desiredJobTitles.filter(Boolean) : [];
  if (desiredTitles.length > 0) parts.push(`Desired Job Titles: ${desiredTitles.join(', ')}`);

  if (seeker.salaryMin || seeker.salaryMax)
    parts.push(
      `Salary Expectation: ${seeker.salaryMin || 0} - ${seeker.salaryMax || 'Open'} ${seeker.salaryCurrency || 'ETB'}`,
    );

  if (Array.isArray(seeker.experiences) && seeker.experiences.length > 0) {
    const recentExps = seeker.experiences.slice(0, 3).map((e: WorkExperience) => {
      const end = e.isCurrent ? 'Present' : e.endDate?.substring(0, 7) || '';
      return `${e.title} @ ${e.company} (${e.startDate?.substring(0, 7) || '?'} to ${end})`;
    });
    parts.push(`Recent Experience: ${recentExps.join('; ')}`);
  }

  if (Array.isArray(seeker.education) && seeker.education.length > 0) {
    const edu = seeker.education[0];
    parts.push(`Highest Education: ${edu.degree || edu.level} ${edu.fieldOfStudy ? 'in ' + edu.fieldOfStudy : ''} @ ${edu.institution}`);
  }

  if (seeker.isOpenToWork) parts.push('Status: Actively open to work');

  return parts.join('\n');
}

function trimConversationContext(
  messages: Array<{ role: 'user' | 'assistant' | 'system'; content: string }>,
  maxMessages: number = MAX_CONTEXT_MESSAGES,
): Array<{ role: 'user' | 'assistant' | 'system'; content: string }> {
  if (messages.length <= maxMessages) return messages;
  const systemMsgs = messages.filter((m) => m.role === 'system');
  const nonSystem = messages.filter((m) => m.role !== 'system');
  const trimmed = nonSystem.slice(-maxMessages);
  const result = [...systemMsgs, ...trimmed];
  return result.map((m) => ({
    ...m,
    content:
      m.content.length > MAX_SINGLE_MESSAGE_CHARS
        ? m.content.substring(0, MAX_SINGLE_MESSAGE_CHARS) + '... [truncated]'
        : m.content,
  }));
}

function validateAndRepairJson<T = any>(raw: string, fallback: T): T {
  if (!raw) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    try {
      const cleaned = raw
        .replace(/^[\s\S]*?\{/, '{')
        .replace(/\}[\s\S]*$/, '}')
        .replace(/,\s*([}\]])/g, '$1')
        .replace(/\bnan\b/gi, 'null')
        .replace(/\bundefined\b/gi, 'null');
      return JSON.parse(cleaned) as T;
    } catch {
      return fallback;
    }
  }
}

/**
 * Universal Generative AI caller:
 * 1. Attempts Google Gemini API if a valid key is provided
 * 2. Seamlessly falls back to resilient AI endpoints (Pollinations OpenAI & text endpoints)
 * 3. Gracefully throws to trigger local offline intelligent engine if network is unreachable
 * 4. Implements exponential backoff retry logic for transient failures
 */
async function callGenerativeAI(
  messages: Array<{ role: 'user' | 'assistant' | 'system'; content: string }>,
  systemInstruction?: string,
  maxRetries: number = 0,
): Promise<string> {
  const trimmedMessages = trimConversationContext(messages, 8);
  const apiKey = GEMINI_API_KEY;

  let lastError: unknown = null;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    if (attempt > 0) {
      const backoffMs = Math.min(1500, 400 * Math.pow(1.8, attempt - 1));
      await delay(backoffMs);
    }

    try {
      // ── Provider 1: Google Gemini API (if key is valid Google format) ──
      if (apiKey && apiKey.trim().startsWith('AIzaSy')) {
        const geminiContents: Array<{ role: string; parts: Array<{ text: string }> }> = [];
        for (const m of trimmedMessages) {
          if (m.role === 'system') continue;
          const role = m.role === 'user' ? 'user' : 'model';
          geminiContents.push({ role, parts: [{ text: m.content }] });
        }

        const body: any = {
          contents: geminiContents,
          generationConfig: {
            temperature: 0.6,
            topK: 24,
            topP: 0.9,
            maxOutputTokens: 800,
          },
        };

        if (systemInstruction) {
          body.systemInstruction = {
            parts: [{ text: systemInstruction }],
          };
        }

        const fastGeminiModels = ['gemini-1.5-flash', 'gemini-2.0-flash'];
        for (const model of fastGeminiModels) {
          try {
            const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 4000);

            const res = await fetch(endpoint, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'x-goog-api-key': apiKey,
              },
              body: JSON.stringify(body),
              signal: controller.signal,
            });

            clearTimeout(timeoutId);

            if (res.ok) {
              const data = await res.json();
              const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
              if (text && text.trim().length > 0) {
                return sanitizeAIResponse(text);
              }
            } else if (res.status === 400 || res.status === 401 || res.status === 403) {
              // Invalid API key — don't retry other Google models
              break;
            }
          } catch {
            // try next model
          }
        }
      }

      // ── Provider 2: Free High-Speed OpenAI GPT endpoint ──
      try {
        const openAiMessages: Array<{ role: string; content: string }> = [];
        if (systemInstruction) {
          openAiMessages.push({ role: 'system', content: systemInstruction });
        }
        for (const m of trimmedMessages) {
          openAiMessages.push({
            role: m.role === 'assistant' ? 'assistant' : m.role === 'system' ? 'system' : 'user',
            content: m.content,
          });
        }

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 4000);

        const openAiRes = await fetch('https://text.pollinations.ai/openai/chat/completions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            model: 'openai',
            messages: openAiMessages,
            temperature: 0.6,
            max_tokens: 800,
            seed: attempt * 17 + 1,
          }),
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        if (openAiRes.ok) {
          const data = await openAiRes.json();
          const text = data?.choices?.[0]?.message?.content;
          if (text && text.trim().length > 10) {
            return sanitizeAIResponse(text);
          }
        }
      } catch {
        // try fallback provider 3
      }

      // ── Provider 3: Direct Prompt Endpoint ──
      try {
        const lastUserMsg = [...trimmedMessages].reverse().find((m) => m.role === 'user')?.content || 'Career advice';
        const promptWithContext = systemInstruction
          ? `${systemInstruction}\n\nUser Question: ${lastUserMsg}`
          : lastUserMsg;

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 3500);

        const res = await fetch('https://text.pollinations.ai/', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            messages: [{ role: 'user', content: promptWithContext }],
            model: 'openai',
            code: 'be-smart',
            seed: attempt * 23 + 7,
          }),
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        if (res.ok) {
          const text = await res.text();
          if (text && text.trim().length > 15) {
            return sanitizeAIResponse(text);
          }
        }
      } catch {
        // fall through to retry or local engine
      }
    } catch (err) {
      lastError = err;
    }
  }

  if (lastError) {
    console.warn('All cloud AI providers exhausted after retries.', lastError);
  }
  throw new Error('All cloud AI providers failed or offline.');
}

/**
 * AI Career Assistant Chat — Multi-turn conversation using Gemini's native format
 * with dynamic AI Tool integration, contextual question-specific fallback,
 * and personalized responses based on seeker profile and live market data.
 */
export async function chatWithAIAssistant({
  messages,
  availableJobs = [],
  userProfile,
}: {
  messages: Array<{ role: 'user' | 'assistant'; content: string }>;
  availableJobs?: Job[];
  userProfile?: UserProfile | null;
}): Promise<{
  reply: string;
  recommendedJobs: Job[];
  toolUsed?: string;
  suggestedFollowUps?: string[];
  matchScores?: Record<string, { score: number; reasons: string[] }>;
}> {
  const lastUserMessage = [...messages].reverse().find((m) => m.role === 'user')?.content || '';

  const profileContext = extractUserProfileContext(userProfile);
  const seekerSkills: string[] = profileContext
    ? Array.from(
        new Set(
          (userProfile?.jobSeekerProfile?.skills || [])
            .map((s: any) => (typeof s === 'string' ? s : s?.name))
            .filter(Boolean)
            .map((s: string) => s.toLowerCase()),
        ),
      )
    : [];

  const scoredJobs: AIScoredJob[] = await scoreAndFilterJobsWithAI(
    availableJobs,
    lastUserMessage + ' ' + seekerSkills.join(' '),
  );
  const topJobs = scoredJobs.slice(0, 4);
  const recentJobsSummary = topJobs.map((sj) => ({
    id: sj.job.id,
    title: sj.job.title,
    company: sj.job.company?.name || 'Company',
    city: sj.job.city || 'Addis Ababa',
    type: sj.job.type,
    salary: sj.job.salaryMin
      ? `${sj.job.salaryMin} - ${sj.job.salaryMax || ''} ${sj.job.salaryCurrency || 'ETB'}`
      : 'Negotiable',
    aiMatchScore: sj.matchScore,
  }));

  const matchScoreMap: Record<string, { score: number; reasons: string[] }> = {};
  for (const sj of scoredJobs) {
    matchScoreMap[sj.job.id] = { score: sj.matchScore, reasons: sj.matchReasons };
  }

  const systemInstruction = `You are EtVacancy AI Career Assistant — a smart, precise, empowering, and highly personalized Career & Job Advisor for Ethiopian professionals and global remote job seekers based in Ethiopia.

CORE PERSONALITY & TONE:
- Direct, specific, and evidence-based. Avoid generic platitudes.
- Speak like a senior career coach who knows the Ethiopian job market (Addis Ababa, Hawassa, etc.) intimately.
- Use natural, encouraging language. Sprinkle in emoji sparingly for visual structure.
- Be ambitious for the user — encourage them to apply for slightly senior roles too.

USER'S EXACT INQUIRY TO ADDRESS:
"${lastUserMessage}"

${profileContext ? 'PERSONALIZED SEEKER PROFILE (tailor ALL recommendations to this):\n' + profileContext + '\n' : ''}

CURRENT LIVE VACANCIES ON EtVacancy (ranked by AI match score):
${JSON.stringify(recentJobsSummary, null, 2)}

RULES & INSTRUCTIONS:
1. ADDRESS THE EXACT QUESTION FIRST. Answer the user's specific inquiry within the first 2 sentences. Do NOT open with generic "Great question!" filler.
2. WHEN RECOMMENDING JOBS: ALWAYS prefer jobs with HIGHER aiMatchScore. Cite 1–3 specific vacancies using the EXACT tag format: [JOB_REC: <job_id>] right after the job title.
   Example: "A great fit for your skills is **Senior Frontend Engineer at Chapa** [JOB_REC: job-abc123] — it matches your React and TypeScript expertise."
3. FORMAT with clean markdown:
   - Use ### for section headings
   - Use **bold** for key job titles, skills, and salary figures
   - Use bullet points (- or •) for lists
   - Use tables only for salary benchmarks
4. INCLUDE MARKET REALITIES:
   - Mention specific Ethiopian employers (fintechs: Chapa, Telebirr, SantimPay, banks: CBE, Awash, Dashen, NGOs, industrial parks)
   - Quote realistic salary ranges in ETB for local roles and USD for remote
   - Reference Ethiopian Labor Law when relevant (probation, leave, severance)
5. IF THE USER ASKS ABOUT A ROLE YOU DON'T HAVE EXACT DATA FOR:
   - Give the closest available category from the vacancy list
   - Provide salary benchmarks and career roadmap for that role in Ethiopia
6. END WITH 2–3 CLEAR, ACTIONABLE NEXT STEPS or SUGGESTED FOLLOW-UP QUESTIONS.
7. NEVER invent fake job IDs. Only use [JOB_REC: <id>] for IDs that exist in the vacancy list above.
8. LENGTH: Aim for 180–350 words for most answers. For complex role deep-dives, up to 500 words max.
9. PERSONALIZATION LEVER: If you know the seeker's skills from their profile, explicitly map their skills to each recommended job.
10. URGENCY SIGNAL: Highlight urgentHiring=YES jobs with a ⚡ or "Urgent" label.`;

  const trimmedMessages = trimConversationContext(
    messages.map((m) => ({ role: m.role as 'user' | 'assistant', content: m.content })),
  );

  try {
    const rawReply = await callGenerativeAI(trimmedMessages, systemInstruction);

    const jobRecRegex = /\[JOB_REC:\s*([a-zA-Z0-9_-]+)\]/g;
    const recommendedJobIds: string[] = [];
    let match: RegExpExecArray | null;
    while ((match = jobRecRegex.exec(rawReply)) !== null) {
      if (!recommendedJobIds.includes(match[1])) {
        recommendedJobIds.push(match[1]);
      }
    }

    const cleanReply = rawReply.replace(/\[JOB_REC:\s*([a-zA-Z0-9_-]+)\]/g, '').trim();

    const recommendedJobs =
      recommendedJobIds.length > 0
        ? availableJobs.filter((j) => recommendedJobIds.includes(j.id))
        : scoredJobs.slice(0, Math.min(3, scoredJobs.length)).map((sj) => sj.job);

    const validRecIds = recommendedJobs.map((j) => j.id);
    const recMatchScores: Record<string, { score: number; reasons: string[] }> = {};
    for (const id of validRecIds) {
      if (matchScoreMap[id]) recMatchScores[id] = matchScoreMap[id];
    }

    const suggestedFollowUps = generateSmartFollowUps(lastUserMessage, recommendedJobs[0]);

    return {
      reply: cleanReply || rawReply,
      recommendedJobs,
      toolUsed: 'gemini_generative_ai',
      suggestedFollowUps,
      matchScores: recMatchScores,
    };
  } catch (error) {
    const fallback = dispatchAIToolForQuestion(lastUserMessage, availableJobs, userProfile);
    const recWithScores: Record<string, { score: number; reasons: string[] }> = {};
    for (const j of fallback.recommendedJobs || []) {
      if (matchScoreMap[j.id]) recWithScores[j.id] = matchScoreMap[j.id];
    }
    return {
      reply: fallback.reply,
      recommendedJobs: fallback.recommendedJobs || [],
      toolUsed: fallback.toolUsed,
      suggestedFollowUps: fallback.suggestedFollowUps,
      matchScores: recWithScores,
    };
  }
}

function generateSmartFollowUps(userMessage: string, topJob?: Job): string[] {
  const lower = userMessage.toLowerCase();
  const followUps: string[] = [];

  if (topJob) {
    followUps.push(`Interview prep for ${topJob.title}`);
    followUps.push(`Salary benchmark for ${topJob.title} in Ethiopia`);
  }

  if (lower.includes('salary') || lower.includes('pay') || lower.includes('earn')) {
    followUps.push('Show me the highest-paying open vacancies this week');
    followUps.push('How to negotiate salary during a job offer?');
  } else if (lower.includes('interview')) {
    followUps.push('What should I wear to an interview in Addis Ababa?');
    followUps.push('Practice behavioral question: "Tell me about yourself"');
  } else if (lower.includes('resume') || lower.includes('cv') || lower.includes('profile')) {
    followUps.push('Rewrite my professional summary from my profile');
    followUps.push('Write a sample cover letter for my dream job');
  } else if (lower.includes('remote') || lower.includes('upwork') || lower.includes('usd')) {
    followUps.push('How do I receive USD payments in Ethiopia via Payoneer?');
    followUps.push('Show me all remote vacancies on EtVacancy');
  } else if (lower.includes('labor') || lower.includes('law') || lower.includes('probation') || lower.includes('leave')) {
    followUps.push('What are the personal income tax brackets in Ethiopia?');
    followUps.push('How is severance pay calculated step by step?');
  } else {
    followUps.push('What skills are employers hiring for this month?');
    followUps.push('Review my profile and suggest perfect jobs');
  }

  if (lower.includes('job') || lower.includes('vacancy') || lower.includes('find') || lower.includes('look')) {
    followUps.push('Show me urgent hiring vacancies only');
  }

  return followUps.slice(0, 3);
}

/**
 * AI Natural Language Filter Method
 * Converts natural queries like "Show me remote react developer jobs in Addis with high pay"
 * into structured filter properties + semantic keywords.
 */
export async function parseNaturalLanguageJobFilter(
  promptText: string,
  categories: Array<{ id: string; name: string }> = [],
): Promise<ExtractedAIFilters> {
  const categoryNames = categories.map((c) => `${c.name} (id: ${c.id})`).join(', ');
  const cityList = ETHIOPIAN_CITIES.join(', ');
  const regionList = ETHIOPIAN_REGIONS.join(', ');
  const industryList = MAJOR_INDUSTRIES.join(', ');

  const systemInstruction = `You are a specialized Job Search AI Query Parser for EtVacancy, the Ethiopian job marketplace. Extract structured filter criteria from a user's natural language search prompt.

Context:
- Valid Ethiopian cities: ${cityList}
- Valid Ethiopian regions: ${regionList}
- Major industries: ${industryList}
- Valid categories: ${categoryNames || 'None loaded yet'}

Return ONLY valid JSON. NO markdown fences, NO surrounding text, NO explanations.
Valid Schema (fill only what you can detect confidently, use null otherwise):
{
  "query": "string or null — clean keyword for title/skills search (e.g. react, accounting, nurse)",
  "city": "string or null — exact Ethiopian city name or 'Remote' if applicable",
  "type": "FULL_TIME" | "PART_TIME" | "CONTRACT" | "TEMPORARY" | "INTERNSHIP" | "FREELANCE" | null,
  "employmentType": "REMOTE" | "HYBRID" | "ONSITE" | null,
  "experienceLevel": "ENTRY" | "JUNIOR" | "MID" | "SENIOR" | "LEAD" | "EXECUTIVE" | null,
  "remoteOnly": true | false,
  "urgentOnly": true | false,
  "salaryMin": number or null (in ETB, monthly equivalent),
  "salaryMax": number or null (in ETB, monthly equivalent),
  "categoryId": "string or null matching category id above",
  "keywords": ["array", "of", "specific", "skills", "or", "roles"],
  "summary": "Short 1-sentence natural-language user-friendly summary of what was filtered"
}`;

  try {
    const rawResult = await callGenerativeAI(
      [{ role: 'user', content: `Extract job search filters from this prompt. Prompt: "${promptText}"` }],
      systemInstruction,
    );

    const cleaned = rawResult.replace(/```json/gi, '').replace(/```/g, '').trim();
    const fallback: ExtractedAIFilters = {
      summary: `Filtered for: "${promptText}"`,
      keywords: [],
    };
    const parsed = validateAndRepairJson<ExtractedAIFilters>(cleaned, fallback);

    return {
      query: parsed.query || undefined,
      city: parsed.city || undefined,
      type: parsed.type || undefined,
      employmentType: parsed.employmentType || undefined,
      experienceLevel: parsed.experienceLevel || undefined,
      remoteOnly: Boolean(parsed.remoteOnly),
      urgentOnly: Boolean(parsed.urgentOnly),
      salaryMin: parsed.salaryMin || undefined,
      salaryMax: parsed.salaryMax || undefined,
      categoryId: parsed.categoryId || undefined,
      keywords: Array.isArray(parsed.keywords) ? parsed.keywords : [],
      summary: parsed.summary || fallback.summary,
    };
  } catch (error) {
    console.warn('AI filter parse failed, using smart heuristic parser:', error);
    return parseFiltersHeuristically(promptText, categories);
  }
}

/**
 * AI Semantic Job Scoring and Matcher
 * Ranks all available jobs against a natural language prompt or seeker profile.
 */
export async function scoreAndFilterJobsWithAI(
  jobs: Job[],
  userRequirementOrProfile: string,
): Promise<AIScoredJob[]> {
  if (!jobs || jobs.length === 0) return [];
  if (!userRequirementOrProfile || userRequirementOrProfile.trim() === '') {
    return jobs.map((j) => ({
      job: j,
      matchScore: 100,
      matchReasons: ['Recent vacancy'],
    }));
  }

  // Pre-filter / Heuristic scoring for instant speed & responsiveness
  const scoredList: AIScoredJob[] = jobs.map((job) => {
    let score = 50; // base score
    const reasons: string[] = [];
    const queryLower = userRequirementOrProfile.toLowerCase();
    const titleLower = (job.title || '').toLowerCase();
    const descLower = (job.description || '').toLowerCase();
    const companyLower = (job.company?.name || '').toLowerCase();
    const cityLower = (job.city || '').toLowerCase();
    const reqs = Array.isArray(job.requirements) ? job.requirements.join(' ').toLowerCase() : '';

    // Title match
    if (queryLower.includes(titleLower) || titleLower.split(' ').some((w) => w.length > 3 && queryLower.includes(w))) {
      score += 25;
      reasons.push(`Job title matches "${job.title}"`);
    }

    // City / Location
    if (cityLower && queryLower.includes(cityLower)) {
      score += 15;
      reasons.push(`Location matches ${job.city}`);
    }

    // Remote
    if (queryLower.includes('remote') && (job.employmentType === 'REMOTE' || cityLower.includes('remote') || descLower.includes('remote'))) {
      score += 20;
      reasons.push('Remote work available');
    }

    // Urgent
    if (queryLower.includes('urgent') && job.urgentHiring) {
      score += 15;
      reasons.push('Urgent hiring priority');
    }

    // Experience Level
    if (
      (queryLower.includes('junior') && job.experienceLevel === 'JUNIOR') ||
      (queryLower.includes('entry') && job.experienceLevel === 'ENTRY') ||
      (queryLower.includes('senior') && job.experienceLevel === 'SENIOR') ||
      (queryLower.includes('mid') && job.experienceLevel === 'MID')
    ) {
      score += 15;
      reasons.push(`${job.experienceLevel} experience level match`);
    }

    // Skills & Requirements match
    const keywords = queryLower.split(/\s+/).filter((w) => w.length > 2);
    let matchedKeywords = 0;
    for (const kw of keywords) {
      if (titleLower.includes(kw) || descLower.includes(kw) || reqs.includes(kw) || companyLower.includes(kw)) {
        matchedKeywords++;
      }
    }

    if (matchedKeywords > 0) {
      const kwBoost = Math.min(25, matchedKeywords * 6);
      score += kwBoost;
      reasons.push(`Matches ${matchedKeywords} criteria keywords`);
    }

    // Salary boost if requested
    if ((queryLower.includes('high salary') || queryLower.includes('well paid') || queryLower.includes('birr')) && (job.salaryMin ?? 0) > 30000) {
      score += 10;
      reasons.push('Competitive compensation');
    }

    // Normalize score to 1-99%
    const finalScore = Math.min(99, Math.max(20, Math.round(score)));

    return {
      job,
      matchScore: finalScore,
      matchReasons: reasons.length > 0 ? reasons : ['General relevance match'],
      highlights: reasons[0] || 'Matches your search criteria',
    };
  });

  // Sort descending by match score
  return scoredList.sort((a, b) => b.matchScore - a.matchScore);
}

/**
 * AI Interview Prep Generator
 */
export async function generateInterviewPrep(
  jobTitle: string,
  companyName: string = 'the company',
  requirements: string[] = [],
): Promise<string> {
  const normalized = normalizeCareerQuery(jobTitle);
  const prompt = `Generate a customized, Ethiopian-market-aware interview prep guide for a "${jobTitle}" position at "${companyName}".

Key requirements listed in the job description: ${requirements.join(', ') || 'Standard professional skills for this role in Ethiopia'}.

Produce a structured guide with THESE EXACT SECTIONS:

### 🎯 Interview Prep Guide — ${jobTitle} @ ${companyName}

#### 1. 3 Role-Specific Technical / Situational Questions with STAR Sample Answers
Include actual technical scenarios relevant to ${jobTitle} work in Addis Ababa / Ethiopian companies.

#### 2. 2 Behavioral Questions (with Ethiopian workplace context)
Include at least one question about handling community/team dynamics and one about pressure/deadlines.

#### 3. 2 Smart Questions the Candidate Can Ask the Interviewer
Tailor these to show genuine interest in the company and role progression.

#### 4. 4 Key Tips for Success
Include:
- What to wear & how to greet (Ethiopian cultural etiquette)
- Documents to bring (original & copies of COC, degree, ID, CV)
- How to negotiate salary in ETB if offered
- Follow-up email / Telegram etiquette after the interview

Format cleanly with markdown headings, bold keywords, and bullet points. Keep it practical, not generic.`;

  const systemInstruction =
    'You are an executive career coach with 15+ years experience hiring in Addis Ababa, Ethiopia. You know the exact interview styles of local fintechs (Chapa, Telebirr), NGOs, banks, and international companies operating in Ethiopia. Be specific, actionable, and culturally-aware. NEVER give generic textbook answers. Reference Addis Ababa workplace realities.';

  try {
    return await callGenerativeAI([{ role: 'user', content: prompt }], systemInstruction);
  } catch (err) {
    const companyText = companyName && companyName !== 'Target Company' ? ` @ **${companyName}**` : '';
    return (
      `### 🎯 Interview Preparation Guide for **${jobTitle}**${companyText}\n\n` +
      `---\n\n` +
      `**1. 💼 Technical & Role Competency (STAR Method)**\n` +
      `- *Tell me about your most challenging ${jobTitle} project and the exact results you delivered.*\n` +
      `  - **STAR Tip**: Set the Situation → Task → Action → measurable Result with numbers (%, ETB, users).\n` +
      `- *Which ${jobTitle}-specific tools or frameworks are you strongest in, and where are you actively upskilling?*\n\n` +
      `**2. 🇪🇹 Ethiopian Workplace Cultural Fit & Behaviorals**\n` +
      `- *Describe a time you disagreed with a senior team member. How did you handle it respectfully while driving outcomes?*\n` +
      `  - **Cultural Tip**: Ethiopian interviewers value humility + diligence. Balance confidence with respect for seniority.\n` +
      `- *This role requires 8am start in Addis Ababa. How do you handle traffic delays from neighborhoods like Merkato, Bole, or Kolfe?*\n` +
      `  - **Plan**: Name 2 alternate routes, a backup bajaj/ride-hail budget, and a 30-minute buffer.\n\n` +
      `**3. 🧾 Salary Negotiation & Documentation Prep (ETB / Remote USD)**\n` +
      `- **Must-bring originals + 2 copies each**: COC / Level Certificate, Degree/Diploma, Kebele ID, 4 passport photos, updated CV.\n` +
      `- **Negotiation anchor**: Research on [EthioJobs](https://ethiojobs.net) + **Say number first** — ask 10–15% above your target with a specific range, e.g. *"Based on my 3 years of X experience delivering +28% project on-time rates, I'm targeting **ETB 45,000–52,000/month**."*\n` +
      `- **Remote roles** (Cintra, Capital One, Betclic Group, etc.): Confirm currency (USD/ETB), remittance method (Telebirr / CBE Birr / Wise), and tax treaty status.\n\n` +
      `**4. 🧥 Ethiopian Attire, Timing, and Post-Interview Etiquette**\n` +
      `- **Attire default**: Conservative suit or shiffon-dress with closed-toe shoes. Avoid open shoulders for banking/government roles.\n` +
      `- **Arrival**: Arrive **20–25 min early** to handle compound security + reception signing-in. Addis rush-hour (7–9am) can double commute time.\n` +
      `- **Greeting**: Stand, slight bow, firm handshake. Use *"Selam, good morning/afternoon"* — avoid slang.\n` +
      `- **Follow-up (most candidates skip this!)**: Send a **short personalized thank-you SMS/email within 3 hours** mentioning 1 specific topic from the interview. Re-follow-up on **Day 5** if you hear nothing.\n\n` +
      `**5. ❓ Questions to Ask the Panel (ask at least 2)**\n` +
      `• *"What are the top 3 measurable KPIs for this role in the first 90 days?"*\n` +
      `• *"How is onboarding structured, and who would be my direct mentor/supervisor?"*\n` +
      `• *"What is the team's current biggest challenge, and how would this role help solve it by Q3?"*\n` +
      `• *"For salary discussion: Does the compensation package include transport allowance, lunch, health insurance, or year-end bonus?"*`
    );
  }
}

/**
 * Local Fallback Natural Language Filter Parser
 */
function parseFiltersHeuristically(
  promptText: string,
  categories: Array<{ id: string; name: string }> = [],
): ExtractedAIFilters {
  const lower = promptText.toLowerCase();
  const filters: ExtractedAIFilters = {
    summary: `Filtered for: "${promptText}"`,
    keywords: [],
  };

  // Remote check
  if (lower.includes('remote') || lower.includes('work from home') || lower.includes('wfh')) {
    filters.remoteOnly = true;
    filters.employmentType = 'REMOTE';
  } else if (lower.includes('hybrid')) {
    filters.employmentType = 'HYBRID';
  } else if (lower.includes('on-site') || lower.includes('onsite')) {
    filters.employmentType = 'ONSITE';
  }

  // Urgent check
  if (lower.includes('urgent') || lower.includes('immediate') || lower.includes('asap')) {
    filters.urgentOnly = true;
  }

  // Experience level
  if (lower.includes('intern') || lower.includes('internship')) {
    filters.type = 'INTERNSHIP';
    filters.experienceLevel = 'ENTRY';
  } else if (lower.includes('junior') || lower.includes('entry level') || lower.includes('fresh graduate')) {
    filters.experienceLevel = 'JUNIOR';
  } else if (lower.includes('senior') || lower.includes('sr.') || lower.includes('lead')) {
    filters.experienceLevel = 'SENIOR';
  } else if (lower.includes('mid level') || lower.includes('intermediate')) {
    filters.experienceLevel = 'MID';
  }

  // Job type
  if (lower.includes('part time') || lower.includes('part-time')) {
    filters.type = 'PART_TIME';
  } else if (lower.includes('contract') || lower.includes('freelance')) {
    filters.type = 'CONTRACT';
  } else if (lower.includes('full time') || lower.includes('full-time')) {
    filters.type = 'FULL_TIME';
  }

  // City match
  for (const city of ETHIOPIAN_CITIES) {
    if (lower.includes(city.toLowerCase())) {
      filters.city = city;
      break;
    }
  }

  // Category match
  for (const cat of categories) {
    if (lower.includes(cat.name.toLowerCase())) {
      filters.categoryId = cat.id;
      break;
    }
  }

  // Clean query extraction
  const cleanQuery = promptText
    .replace(/\b(remote|urgent|junior|senior|entry|full-time|part-time|job|jobs|vacancy|vacancies|wanted|needed|in|at|addis ababa|for)\b/gi, '')
    .trim();

  if (cleanQuery.length > 2) {
    filters.query = cleanQuery;
  }

  return filters;
}

/**
 * Dynamic AI Tool Dispatcher
 * Intelligently analyzes user's specific prompt, executes the corresponding AI Tool,
 * and formats a rich, customized answer.
 */
export function dispatchAIToolForQuestion(
  userMessage: string,
  availableJobs: Job[] = [],
  userProfile?: UserProfile | null,
): { reply: string; recommendedJobs: Job[]; toolUsed?: string; suggestedFollowUps?: string[] } {
  const text = (userMessage || '').trim();
  const normalized = normalizeCareerQuery(text);
  const lower = normalized.toLowerCase();

  // 1. Amharic Queries Handling
  if (/[\u1200-\u137F]/.test(text) || lower.includes('ሰላም') || lower.includes('ደሞዝ') || lower.includes('ስራ') || lower.includes('ኢንተርቪው') || lower.includes('ሲቪ')) {
    const res = amharicCareerTool(text, availableJobs);
    return {
      reply: res.responseMarkdown,
      recommendedJobs: res.recommendedJobs || [],
      toolUsed: res.toolName,
    };
  }

  // 2. Greetings & Introductions
  if (/^(hi|hello|hey|selam|greetings|good morning|good afternoon|good evening|who are you|what can you do)(\s|\!|\?|\.|$)/i.test(lower)) {
    const userName = userProfile?.user?.name || (userProfile as any)?.fullName || 'there';
    const reply = `Hello ${userName}! 👋 I am your **EtVacancy AI Career Advisor**.\n\nI can help you with:\n• 🔍 **Job Search:** Find matching vacancies by title, skills, location & salary\n• 📊 **Salary Benchmarks:** Check real market pay in ETB & remote USD\n• 🎯 **Interview Coaching:** Role-specific questions & STAR answers\n• 📝 **CV Polish:** Tailor your resume for Ethiopian & global recruiters\n• ⚖️ **Ethiopian Labor Law:** Probation rules, overtime, leaves & taxes\n• 🌐 **Remote Work Guide:** How to earn in USD via Upwork/contracts\n\nWhat would you like to explore today?`;
    return {
      reply,
      recommendedJobs: availableJobs.slice(0, 2),
      toolUsed: 'greeting_assistant',
    };
  }

  // 3. Remote Work & International Earning Guide Tool
  if (
    lower.includes('remote work') ||
    lower.includes('earn usd') ||
    lower.includes('work from home') ||
    lower.includes('upwork') ||
    lower.includes('fiverr') ||
    lower.includes('payoneer') ||
    lower.includes('foreign currency') ||
    lower.includes('dollar')
  ) {
    const res = remoteWorkGuideTool();
    return {
      reply: res.responseMarkdown,
      recommendedJobs: availableJobs.filter((j) => j.employmentType === 'REMOTE').slice(0, 3),
      toolUsed: res.toolName,
    };
  }

  // 4. Ethiopian Labor Law & Legal Work Regulations Tool
  if (
    lower.includes('labor law') ||
    lower.includes('labour law') ||
    lower.includes('probation') ||
    lower.includes('severance') ||
    lower.includes('overtime') ||
    lower.includes('notice period') ||
    lower.includes('annual leave') ||
    lower.includes('proclamation') ||
    lower.includes('termination') ||
    lower.includes('working hours') ||
    lower.includes('income tax') ||
    lower.includes('pension')
  ) {
    const res = laborLawGuideTool(text);
    return {
      reply: res.responseMarkdown,
      recommendedJobs: [],
      toolUsed: res.toolName,
    };
  }

  // 5. Interview Coaching Tool
  if (
    lower.includes('interview') ||
    lower.includes('star method') ||
    lower.includes('mock interview') ||
    lower.includes('behavioral question') ||
    lower.includes('interview questions') ||
    lower.includes('tell me about yourself') ||
    lower.includes('why should we hire you')
  ) {
    const res = interviewCoachTool(text);
    return {
      reply: res.responseMarkdown,
      recommendedJobs: availableJobs.slice(0, 2),
      toolUsed: res.toolName,
    };
  }

  // 6. Resume & CV Optimizer Tool
  if (
    lower.includes('resume') ||
    lower.includes('cv') ||
    lower.includes('cover letter') ||
    lower.includes('portfolio') ||
    lower.includes('ats') ||
    lower.includes('bullet point') ||
    lower.includes('optimize profile')
  ) {
    const res = resumeEnhancerTool(userProfile);
    return {
      reply: res.responseMarkdown,
      recommendedJobs: [],
      toolUsed: res.toolName,
    };
  }

  // 7. Career Path / Transition / Learning Roadmap Tool
  if (
    lower.includes('how to become') ||
    lower.includes('transition') ||
    lower.includes('roadmap') ||
    lower.includes('learn') ||
    lower.includes('career path') ||
    lower.includes('switch career') ||
    lower.includes('course') ||
    lower.includes('certificate') ||
    lower.includes('study')
  ) {
    const res = careerPathAdvisorTool(text);
    return {
      reply: res.responseMarkdown,
      recommendedJobs: availableJobs.slice(0, 3),
      toolUsed: res.toolName,
    };
  }

  // 8. Salary & Compensation Insights Tool
  if (
    lower.includes('salary') ||
    lower.includes('earn') ||
    lower.includes('pay') ||
    lower.includes('compensation') ||
    lower.includes('rate') ||
    lower.includes('etb') ||
    lower.includes('how much')
  ) {
    const res = getSalaryInsightsTool(text);
    return {
      reply: res.responseMarkdown,
      recommendedJobs: availableJobs.slice(0, 3),
      toolUsed: res.toolName,
    };
  }

  // 9. Role & Vacancy Search (triggers for any role inquiry or vacancy search)
  const isJobOrRoleInquiry =
    lower.includes('job') ||
    lower.includes('jobs') ||
    lower.includes('vacancy') ||
    lower.includes('vacancies') ||
    lower.includes('opening') ||
    lower.includes('hiring') ||
    lower.includes('frontend') ||
    lower.includes('backend') ||
    lower.includes('fullstack') ||
    lower.includes('developer') ||
    lower.includes('engineer') ||
    lower.includes('react') ||
    lower.includes('flutter') ||
    lower.includes('mobile') ||
    lower.includes('designer') ||
    lower.includes('ui/ux') ||
    lower.includes('accountant') ||
    lower.includes('finance') ||
    lower.includes('marketing') ||
    lower.includes('sales') ||
    lower.includes('driver') ||
    lower.includes('nurse') ||
    lower.includes('internship') ||
    lower.includes('remote');

  if (isJobOrRoleInquiry) {
    const isRemote = lower.includes('remote');
    const isUrgent = lower.includes('urgent');
    const city = lower.includes('addis') ? 'Addis Ababa' : lower.includes('hawassa') ? 'Hawassa' : undefined;

    const cleanSearch = normalized
      .replace(/\b(find|show|give|me|the|best|top|vacancies|vacancy|jobs|job|looking|for|in|remote|urgent|at|wanted|needed)\b/gi, '')
      .trim();

    // For specific role queries (e.g. "fronted job", "frontend", "flutter", etc.), give the rich in-depth role breakdown
    if (
      lower.includes('frontend') ||
      lower.includes('backend') ||
      lower.includes('mobile') ||
      lower.includes('flutter') ||
      lower.includes('data') ||
      lower.includes('account') ||
      lower.includes('market') ||
      lower.includes('design')
    ) {
      const res = generalCareerQATool(normalized, availableJobs, userProfile);
      return {
        reply: res.responseMarkdown,
        recommendedJobs: res.recommendedJobs || [],
        toolUsed: res.toolName,
      };
    }

    const res = searchVacanciesTool(cleanSearch || normalized, availableJobs, {
      remoteOnly: isRemote,
      urgentOnly: isUrgent,
      city,
    });

    return {
      reply: res.responseMarkdown,
      recommendedJobs: res.recommendedJobs || [],
      toolUsed: res.toolName,
    };
  }

  // 10. Universal Dynamic Q&A Engine (handles any other specific user questions)
  const res = generalCareerQATool(text, availableJobs, userProfile);
  return {
    reply: res.responseMarkdown,
    recommendedJobs: res.recommendedJobs || [],
    toolUsed: res.toolName,
  };
}
