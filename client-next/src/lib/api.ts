const API_BASE = process.env.NEXT_PUBLIC_API_URL || process.env.API_URL || 'http://localhost:3000';

export type TutorialChapter = {
    _id?: string;
    chapterTitle: string;
    chapterSlug: string;
    content?: string;
    contentType?: 'text' | 'code-interactive' | 'quiz';
    initialCode?: string;
    expectedOutput?: string;
    order: number;
    quizId?: string;
};

export type Tutorial = {
    _id: string;
    title: string;
    slug: string;
    description: string;
    thumbnail?: string;
    category: string;
    authorId: string;
    chapters: TutorialChapter[];
    createdAt: string;
    updatedAt: string;
};

export type TutorialsResponse = {
    tutorials: Tutorial[];
    totalTutorials: number;
    lastMonthTutorials: number;
};

export type ProblemSummary = {
    _id: string;
    title: string;
    slug: string;
    description: string;
    difficulty: string;
    topics?: string[];
    tags?: string[];
    companies?: string[];
    estimatedTime?: number;
    stats?: {
        submissions?: number;
        accepted?: number;
        likes?: number;
    };
    successRate?: number | null;
    updatedAt: string;
    createdAt: string;
    isPublished?: boolean;
};

export type ProblemListResponse = {
    problems: ProblemSummary[];
    totalProblems: number;
    lastMonthProblems: number;
    meta: {
        topicCounts: { _id: string; count: number }[];
        difficultyCounts: { _id: string; count: number }[];
    };
};

export type ProblemDetail = ProblemSummary & {
    statement: string;
    inputFormat?: string;
    outputFormat?: string;
    constraints?: string[];
    samples?: { input: string; output: string; explanation?: string }[];
    hints?: string[];
    solutionApproach?: string;
    editorial?: string;
    solutionSnippets?: { language: string; code: string }[];
    starterCodes?: { language: string; code: string }[];
    resources?: { title: string; link: string }[];
};

async function fetchJson<T>(path: string, init?: RequestInit & { revalidate?: number }): Promise<T> {
    const { revalidate, ...rest } = init || {};
    const url = path.startsWith('http') ? path : `${API_BASE}${path}`;
    const response = await fetch(url, {
        ...rest,
        next: { revalidate: revalidate ?? 300 },
    });

    if (!response.ok) {
        const text = await response.text();
        throw new Error(`Request failed (${response.status}): ${text.slice(0, 200) || response.statusText}`);
    }

    return response.json() as Promise<T>;
}

export const getTutorials = (query = 'limit=12&order=desc') =>
    fetchJson<TutorialsResponse>(`/api/tutorial/gettutorials?${query}`);

export const getTutorialBySlug = (slug: string) =>
    fetchJson<TutorialsResponse>(`/api/tutorial/getsingletutorial/${slug}`).then((res) => {
        const tutorial = res.tutorials?.[0];
        if (!tutorial) throw new Error('Tutorial not found');
        return tutorial as Tutorial;
    });

export const getProblems = (query = 'limit=12&sort=newest') =>
    fetchJson<ProblemListResponse>(`/api/problems?${query}`);

export const getProblemBySlug = (slug: string, accessToken?: string) =>
    fetchJson<ProblemDetail>(`/api/problems/slug/${slug}`, {
        headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : undefined,
    });

export { API_BASE };
