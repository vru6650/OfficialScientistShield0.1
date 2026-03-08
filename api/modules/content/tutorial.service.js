import { errorHandler } from '../../utils/error.js';
import { generateSlug } from '../../utils/slug.js';
import { normalizePagination } from '../../utils/pagination.js';
import { indexSearchDocument, removeSearchDocument } from '../../services/search.service.js';
import {
    countTutorials,
    createTutorialRecord,
    deleteTutorialById,
    findTutorialById,
    findTutorials,
} from './tutorial.repository.js';

export const createTutorial = async ({ userId, isAdmin, body }) => {
    if (!isAdmin) {
        throw errorHandler(403, 'You are not allowed to create a tutorial');
    }

    const { title, description, category, thumbnail, chapters = [] } = body;

    if (!title || !description || !category) {
        throw errorHandler(400, 'Please provide all required fields for the tutorial.');
    }

    const slug = generateSlug(String(title));

    const chaptersToSave = chapters.map((chapter) => {
        if (chapter.contentType !== 'quiz' || chapter.quizId === '') {
            return { ...chapter, quizId: undefined };
        }

        return chapter;
    });

    try {
        const savedTutorial = await createTutorialRecord({
            title,
            description,
            slug,
            thumbnail,
            category,
            authorId: userId,
            chapters: chaptersToSave,
        });

        await indexSearchDocument('tutorial', savedTutorial);

        return savedTutorial;
    } catch (error) {
        if (error?.code === 11000) {
            const field = Object.keys(error?.keyPattern || {})[0] || 'field';
            throw errorHandler(409, `A tutorial with this ${field} already exists.`);
        }

        throw error;
    }
};

export const getTutorials = async ({ query }) => {
    const { startIndex, limit } = normalizePagination(query, {
        defaultLimit: 9,
        maxLimit: 50,
    });
    const sortDirection = query.order === 'asc' ? 1 : -1;

    const queryFilters = {
        ...(query.authorId && { authorId: query.authorId }),
        ...(query.category && { category: query.category }),
        ...(query.tutorialId && { _id: query.tutorialId }),
        ...(query.slug && { slug: query.slug }),
        ...(query.searchTerm && {
            $or: [
                { title: { $regex: query.searchTerm, $options: 'i' } },
                { description: { $regex: query.searchTerm, $options: 'i' } },
                { 'chapters.content': { $regex: query.searchTerm, $options: 'i' } },
            ],
        }),
    };

    const now = new Date();
    const oneMonthAgo = new Date(
        now.getFullYear(),
        now.getMonth() - 1,
        now.getDate()
    );

    const [tutorials, totalTutorials, lastMonthTutorials] = await Promise.all([
        findTutorials({
            filters: queryFilters,
            sortDirection,
            startIndex,
            limit,
        }),
        countTutorials(queryFilters),
        countTutorials({
            ...queryFilters,
            createdAt: { $gte: oneMonthAgo },
        }),
    ]);

    return { tutorials, totalTutorials, lastMonthTutorials };
};

export const updateTutorial = async ({ tutorialId, userId, isAdmin, body }) => {
    const { title, description, category, thumbnail } = body;
    const updateFields = {};

    if (title !== undefined) {
        updateFields.title = title;
        updateFields.slug = generateSlug(String(title));
    }

    if (description !== undefined) {
        updateFields.description = description;
    }

    if (category !== undefined) {
        updateFields.category = category;
    }

    if (thumbnail !== undefined) {
        updateFields.thumbnail = thumbnail;
    }

    try {
        const tutorial = await findTutorialById(tutorialId);

        if (!tutorial) {
            throw errorHandler(404, 'Tutorial not found');
        }

        const requesterId = userId?.toString?.();
        const isOwner = requesterId && tutorial.authorId?.toString?.() === requesterId;

        if (!isAdmin && !isOwner) {
            throw errorHandler(403, 'You are not allowed to update this tutorial');
        }

        Object.assign(tutorial, updateFields);
        const updatedTutorial = await tutorial.save();
        await indexSearchDocument('tutorial', updatedTutorial);

        return updatedTutorial;
    } catch (error) {
        if (error?.code === 11000) {
            const field = Object.keys(error?.keyPattern || {})[0] || 'field';
            throw errorHandler(409, `A tutorial with this ${field} already exists.`);
        }

        throw error;
    }
};

export const deleteTutorial = async ({ tutorialId, userId, isAdmin }) => {
    const tutorial = await findTutorialById(tutorialId);

    if (!tutorial) {
        throw errorHandler(404, 'Tutorial not found');
    }

    const requesterId = userId?.toString?.();
    const isOwner = requesterId && tutorial.authorId?.toString?.() === requesterId;

    if (!isAdmin && !isOwner) {
        throw errorHandler(403, 'You are not allowed to delete this tutorial');
    }

    await deleteTutorialById(tutorial._id);
    await removeSearchDocument('tutorial', tutorial._id.toString());
};

export const addChapter = async ({ tutorialId, userId, isAdmin, body }) => {
    const { chapterTitle, content, order, contentType, initialCode, expectedOutput, quizId } = body;

    if (!chapterTitle || order === undefined) {
        throw errorHandler(400, 'Chapter title and order are required.');
    }
    if (contentType === 'text' && !content) {
        throw errorHandler(400, 'Chapter content is required for text chapters.');
    }
    if (contentType === 'code-interactive' && !initialCode) {
        throw errorHandler(400, 'Initial code is required for interactive code chapters.');
    }
    if (contentType === 'quiz' && !quizId) {
        throw errorHandler(400, 'A quiz ID is required for quiz chapters.');
    }

    const tutorial = await findTutorialById(tutorialId);
    if (!tutorial) {
        throw errorHandler(404, 'Tutorial not found.');
    }
    const requesterId = userId?.toString?.();
    const isOwner = requesterId && tutorial.authorId?.toString?.() === requesterId;
    if (!isAdmin && !isOwner) {
        throw errorHandler(403, 'You are not allowed to add chapters to this tutorial');
    }

    const chapterSlug = generateSlug(String(chapterTitle));
    if (tutorial.chapters.some((c) => c.chapterSlug === chapterSlug)) {
        throw errorHandler(400, 'Chapter with this title already exists in this tutorial.');
    }

    let chapterData = { chapterTitle, chapterSlug, order, contentType, initialCode, expectedOutput, content };
    if (contentType === 'quiz' && quizId) {
        chapterData.quizId = quizId;
    } else {
        chapterData.quizId = undefined;
    }

    tutorial.chapters.push(chapterData);
    tutorial.chapters.sort((a, b) => a.order - b.order);
    await tutorial.save();
    await indexSearchDocument('tutorial', tutorial);
    return tutorial.chapters[tutorial.chapters.length - 1];
};

export const updateChapter = async ({ tutorialId, chapterId, userId, isAdmin, body }) => {
    const { chapterTitle, content, order } = body;
    const updateFields = {};
    if (chapterTitle !== undefined) updateFields.chapterTitle = chapterTitle;
    if (content !== undefined) updateFields.content = content;
    if (order !== undefined) updateFields.order = order;

    const tutorial = await findTutorialById(tutorialId);
    if (!tutorial) {
        throw errorHandler(404, 'Tutorial not found.');
    }
    const requesterId = userId?.toString?.();
    const isOwner = requesterId && tutorial.authorId?.toString?.() === requesterId;
    if (!isAdmin && !isOwner) {
        throw errorHandler(403, 'You are not allowed to update this chapter');
    }

    const chapter = tutorial.chapters.id(chapterId);
    if (!chapter) {
        throw errorHandler(404, 'Chapter not found.');
    }

    Object.assign(chapter, updateFields);

    if (chapterTitle !== undefined) {
        const newChapterSlug = generateSlug(String(chapterTitle));
        if (tutorial.chapters.some((c) => c.chapterSlug === newChapterSlug && c._id.toString() !== chapter._id.toString())) {
            throw errorHandler(400, 'Another chapter with this title already exists.');
        }
        chapter.chapterSlug = newChapterSlug;
    }

    tutorial.chapters.sort((a, b) => a.order - b.order);
    await tutorial.save();
    await indexSearchDocument('tutorial', tutorial);
    return chapter;
};

export const deleteChapter = async ({ tutorialId, chapterId, userId, isAdmin }) => {
    const tutorial = await findTutorialById(tutorialId);
    if (!tutorial) {
        throw errorHandler(404, 'Tutorial not found.');
    }
    const requesterId = userId?.toString?.();
    const isOwner = requesterId && tutorial.authorId?.toString?.() === requesterId;
    if (!isAdmin && !isOwner) {
        throw errorHandler(403, 'You are not allowed to delete this chapter');
    }

    tutorial.chapters.pull({ _id: chapterId });
    await tutorial.save();
    await indexSearchDocument('tutorial', tutorial);
};

export const markChapterAsComplete = async ({ tutorialId, chapterId, userId }) => {
    if (!userId) {
        throw errorHandler(401, 'You must be signed in to mark a chapter as complete.');
    }

    const tutorial = await findTutorialById(tutorialId);
    if (!tutorial) {
        throw errorHandler(404, 'Tutorial not found.');
    }

    const chapter = tutorial.chapters.id(chapterId);
    if (!chapter) {
        throw errorHandler(404, 'Chapter not found.');
    }

    const completedBy = Array.isArray(chapter.completedBy) ? chapter.completedBy : [];
    const alreadyCompleted = completedBy.some((entry) => entry?.toString?.() === userId);

    if (alreadyCompleted) {
        throw errorHandler(400, 'Chapter already marked as complete by this user.');
    }

    chapter.completedBy = [...completedBy, userId];
    await tutorial.save();

    return { message: 'Chapter marked as complete.', completedBy: chapter.completedBy };
};
