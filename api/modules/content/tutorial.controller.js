import {
    addChapter as addChapterService,
    createTutorial as createTutorialService,
    deleteChapter as deleteChapterService,
    deleteTutorial as deleteTutorialService,
    getTutorials as getTutorialsService,
    markChapterAsComplete as markChapterAsCompleteService,
    updateChapter as updateChapterService,
    updateTutorial as updateTutorialService,
} from './tutorial.service.js';
import { asyncHandler } from '../../utils/asyncHandler.js';

export const createTutorial = asyncHandler(async (req, res) => {
    const savedTutorial = await createTutorialService({
        userId: req.user?.id,
        isAdmin: Boolean(req.user?.isAdmin),
        body: req.body,
    });
    res.status(201).json(savedTutorial);
});

export const getTutorials = asyncHandler(async (req, res) => {
    const data = await getTutorialsService({ query: req.query });
    res.status(200).json(data);
});

export const updateTutorial = asyncHandler(async (req, res) => {
    const updatedTutorial = await updateTutorialService({
        tutorialId: req.params.tutorialId,
        userId: req.user?.id,
        isAdmin: Boolean(req.user?.isAdmin),
        body: req.body,
    });
    res.status(200).json(updatedTutorial);
});

export const deleteTutorial = asyncHandler(async (req, res) => {
    await deleteTutorialService({
        tutorialId: req.params.tutorialId,
        userId: req.user?.id,
        isAdmin: Boolean(req.user?.isAdmin),
    });
    res.status(200).json('The tutorial has been deleted');
});

export const addChapter = asyncHandler(async (req, res) => {
    const chapter = await addChapterService({
        tutorialId: req.params.tutorialId,
        userId: req.user?.id,
        isAdmin: Boolean(req.user?.isAdmin),
        body: req.body,
    });
    res.status(201).json(chapter);
});

export const updateChapter = asyncHandler(async (req, res) => {
    const chapter = await updateChapterService({
        tutorialId: req.params.tutorialId,
        chapterId: req.params.chapterId,
        userId: req.user?.id,
        isAdmin: Boolean(req.user?.isAdmin),
        body: req.body,
    });
    res.status(200).json(chapter);
});

export const deleteChapter = asyncHandler(async (req, res) => {
    await deleteChapterService({
        tutorialId: req.params.tutorialId,
        chapterId: req.params.chapterId,
        userId: req.user?.id,
        isAdmin: Boolean(req.user?.isAdmin),
    });
    res.status(200).json('Chapter deleted successfully');
});

export const markChapterAsComplete = asyncHandler(async (req, res) => {
    const data = await markChapterAsCompleteService({
        tutorialId: req.params.tutorialId,
        chapterId: req.params.chapterId,
        userId: req.user?.id?.toString?.(),
    });
    res.status(200).json(data);
});
