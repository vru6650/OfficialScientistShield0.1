import {
    createCommunitySubmission,
    getCommunitySubmissions,
    updateCommunitySubmissionStatus,
} from './community.service.js';
import { asyncHandler } from '../../utils/asyncHandler.js';

export const submitCommunityForm = asyncHandler(async (req, res) => {
    const submission = await createCommunitySubmission({
        body: req.body,
        userId: req.user?.id,
    });
    res.status(201).json({
        message: 'Thanks for reaching out. We will get back to you soon.',
        submission,
    });
});

export const listCommunitySubmissions = asyncHandler(async (req, res) => {
    const data = await getCommunitySubmissions({ query: req.query });
    res.status(200).json(data);
});

export const changeCommunitySubmissionStatus = asyncHandler(async (req, res) => {
    const submission = await updateCommunitySubmissionStatus({
        submissionId: req.params.submissionId,
        status: req.body.status,
    });
    res.status(200).json(submission);
});
