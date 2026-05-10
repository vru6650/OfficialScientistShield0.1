import { Alert, Button, FileInput, Select, TextInput, Spinner, Modal } from 'flowbite-react';
import { CircularProgressbar } from 'react-circular-progressbar';
import 'react-circular-progressbar/dist/styles.css';
import TiptapEditor from '../components/TiptapEditor'; //
import { useState, useReducer, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { HiOutlineExclamationCircle } from 'react-icons/hi';
import { useCloudinaryUpload } from '../hooks/useCloudinaryUpload'; //
import { createTutorial as createTutorialService } from '../services/tutorialService'; // NEW: Import tutorial service for creation
import ResponsiveContainer from '../components/layout/ResponsiveContainer.jsx';

const DRAFT_KEY_TUTORIAL = 'tutorialDraft'; // Separate draft key for tutorials

const tutorialInitialState = {
    formData: {
        title: '',
        description: '',
        category: 'uncategorized',
        thumbnail: 'https://www.hostinger.com/tutorials/wp-content/uploads/sites/2/2021/09/how-to-write-a-blog-post.png',
        chapters: [],
    },
    publishError: null,
    loading: false,
};

function tutorialReducer(state, action) {
    switch (action.type) {
        case 'FIELD_CHANGE':
            return { ...state, formData: { ...state.formData, ...action.payload } };
        case 'ADD_CHAPTER_FIELD': // Add an empty chapter to the form
            return {
                ...state,
                formData: {
                    ...state.formData,
                    chapters: [...state.formData.chapters, {
                        chapterTitle: '',
                        chapterSlug: '',
                        content: '',
                        order: state.formData.chapters.length + 1 // Auto-increment order
                    }]
                }
            };
        case 'UPDATE_CHAPTER_FIELD': // Update a specific chapter's field
            return {
                ...state,
                formData: {
                    ...state.formData,
                    chapters: state.formData.chapters.map((chapter, index) =>
                        index === action.payload.index
                            ? { ...chapter, [action.payload.field]: action.payload.value }
                            : chapter
                    ),
                },
            };
        case 'REMOVE_CHAPTER': // Remove a chapter
            return {
                ...state,
                formData: {
                    ...state.formData,
                    chapters: state.formData.chapters.filter((_, index) => index !== action.payload.index),
                },
            };
        case 'THUMBNAIL_UPLOAD_SUCCESS':
            return { ...state, formData: { ...state.formData, thumbnail: action.payload } };
        case 'PUBLISH_START':
            return { ...state, loading: true, publishError: null };
        case 'PUBLISH_SUCCESS':
            return { ...tutorialInitialState }; // Reset form after success
        case 'PUBLISH_ERROR':
            return { ...state, loading: false, publishError: action.payload };
        case 'LOAD_DRAFT':
            return { ...state, formData: action.payload };
        default:
            throw new Error(`Unhandled action type: ${action.type}`);
    }
}

const generateSlug = (text) => { // Re-used from existing code
    if (!text) return '';
    return text.toLowerCase().trim().replace(/[\s\W-]+/g, '-').replace(/^-+|-+$/g, '');
};

export default function CreateTutorial() {
    const [state, dispatch] = useReducer(tutorialReducer, tutorialInitialState);
    const [showDraftModal, setShowDraftModal] = useState(false);
    const { upload, progress: uploadProgress, error: uploadError, isUploading } = useCloudinaryUpload();
    const navigate = useNavigate();

    // Draft handling
    useEffect(() => {
        const savedDraft = localStorage.getItem(DRAFT_KEY_TUTORIAL);
        if (savedDraft) {
            const draftData = JSON.parse(savedDraft);
            if (draftData.title || draftData.chapters.some(c => c.content?.replace(/<(.|\n)*?>/g, '').trim().length > 0)) {
                setShowDraftModal(true);
            }
        }
    }, []);

    useEffect(() => {
        const handler = setTimeout(() => {
            if (state.formData.title || state.formData.chapters.some(c => c.content?.replace(/<(.|\n)*?>/g, '').trim().length > 0)) {
                localStorage.setItem(DRAFT_KEY_TUTORIAL, JSON.stringify(state.formData));
            }
        }, 2000);
        return () => clearTimeout(handler);
    }, [state.formData]);

    const handleRestoreDraft = () => {
        const savedDraft = JSON.parse(localStorage.getItem(DRAFT_KEY_TUTORIAL));
        dispatch({ type: 'LOAD_DRAFT', payload: savedDraft });
        setShowDraftModal(false);
    };

    const handleDismissDraft = () => {
        localStorage.removeItem(DRAFT_KEY_TUTORIAL);
        setShowDraftModal(false);
    };


    const handleThumbnailChange = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        try {
            const url = await upload(file, {
                allowedTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
                maxSizeMB: 5,
            });
            dispatch({ type: 'THUMBNAIL_UPLOAD_SUCCESS', payload: url });
        } catch (err) {
            console.error(err.message);
        }
    };

    const handleMainFieldChange = (e) => {
        const { id, value } = e.target;
        const payload = { [id]: value };
        if (id === 'title') {
            payload.slug = generateSlug(value);
        }
        dispatch({ type: 'FIELD_CHANGE', payload });
    };

    const handleChapterContentChange = (index, newContent) => {
        const updatedChapters = state.formData.chapters.map((chapter, i) =>
            i === index ? { ...chapter, content: newContent } : chapter
        );
        dispatch({ type: 'FIELD_CHANGE', payload: { chapters: updatedChapters } });
    };

    const handleChapterFieldChange = (index, field, value) => {
        let payloadValue = value;
        if (field === 'chapterTitle') {
            payloadValue = generateSlug(value);
            dispatch({ type: 'UPDATE_CHAPTER_FIELD', payload: { index, field: 'chapterSlug', value: payloadValue } });
        }
        dispatch({ type: 'UPDATE_CHAPTER_FIELD', payload: { index, field, value } });
    };


    const handleSubmit = async (e) => {
        e.preventDefault();
        dispatch({ type: 'PUBLISH_START' });

        // Basic validation
        if (!state.formData.title.trim() || !state.formData.description.trim() || state.formData.chapters.length === 0) {
            return dispatch({ type: 'PUBLISH_ERROR', payload: 'Please fill all main fields and add at least one chapter.' });
        }
        for (const chapter of state.formData.chapters) {
            if (!chapter.chapterTitle.trim() || !chapter.content.trim()) {
                return dispatch({ type: 'PUBLISH_ERROR', payload: 'All chapters must have a title and content.' });
            }
        }


        try {
            const data = await createTutorialService(state.formData); // Use the new service
            dispatch({ type: 'PUBLISH_SUCCESS' });
            localStorage.removeItem(DRAFT_KEY_TUTORIAL);
            navigate(`/tutorials/${data.slug}`);
        } catch (error) {
            dispatch({ type: 'PUBLISH_ERROR', payload: error.message || 'An unexpected error occurred.' });
        }
    };

    return (
        <ResponsiveContainer width='tight' spacing='page' className='min-h-screen'>
            <h1 className='text-center text-3xl my-7 font-semibold'>Create a New Tutorial</h1>
            <form className='flex flex-col gap-6' onSubmit={handleSubmit}>
                {/* Main Tutorial Details */}
                <div className='flex flex-col gap-4'>
                    <TextInput
                        type='text'
                        placeholder='Tutorial Title'
                        required
                        id='title'
                        className='flex-1'
                        value={state.formData.title}
                        onChange={handleMainFieldChange}
                    />
                    <TextInput
                        type='text'
                        placeholder='Tutorial Description (brief overview)'
                        required
                        id='description'
                        className='flex-1'
                        value={state.formData.description}
                        onChange={handleMainFieldChange}
                    />
                    <TextInput
                        type='text'
                        placeholder='tutorial-slug'
                        id='slug'
                        className='flex-1'
                        value={state.formData.slug}
                        readOnly // Slug is auto-generated
                        disabled
                    />
                    <Select id='category' onChange={handleMainFieldChange} value={state.formData.category}>
                        <option value='uncategorized'>Select a category</option>
                        <option value='javascript'>JavaScript</option>
                        <option value='reactjs'>React.js</option>
                        <option value='nextjs'>Next.js</option>
                        <option value='css'>CSS</option>
                        <option value='html'>HTML</option>
                        <option value='node.js'>Node.js</option>
                    </Select>
                </div>

                {/* Thumbnail Upload */}
                <div className='flex flex-col gap-3 border-4 border-teal-500 border-dotted p-3'>
                    <div className='flex gap-4 items-center justify-between'>
                        <FileInput
                            helperText='Upload a thumbnail image (Max 5MB).'
                            type='file'
                            accept='image/*'
                            onChange={handleThumbnailChange}
                            disabled={isUploading}
                        />
                        {isUploading && (
                            <div className='w-full flex justify-center'>
                                <div className='w-20 h-20'>
                                    <CircularProgressbar value={uploadProgress} text={`${uploadProgress}%`} />
                                </div>
                            </div>
                        )}
                        {uploadError && <Alert color='failure'>{uploadError}</Alert>}
                    </div>
                    {state.formData.thumbnail && !isUploading && (
                        <img src={state.formData.thumbnail} alt='Thumbnail preview' className='w-full h-auto object-contain' />
                    )}
                </div>

                {/* Chapters Management */}
                <h2 className="text-2xl font-semibold mt-8 mb-4">Tutorial Chapters</h2>
                {state.formData.chapters.length === 0 && (
                    <Alert color="info">No chapters added yet. Click "Add New Chapter" to get started!</Alert>
                )}
                {state.formData.chapters
                    .sort((a,b) => a.order - b.order) // Ensure chapters are displayed in order
                    .map((chapter, index) => (
                        <div key={index} className="border p-4 rounded-lg bg-gray-50 dark:bg-gray-800 relative mb-4">
                            <h3 className="text-xl font-bold mb-3">Chapter {chapter.order}</h3>
                            <div className="flex flex-col sm:flex-row gap-4 mb-4">
                                <TextInput
                                    type='text'
                                    placeholder='Chapter Title'
                                    required
                                    className='flex-1'
                                    value={chapter.chapterTitle}
                                    onChange={(e) => handleChapterFieldChange(index, 'chapterTitle', e.target.value)}
                                />
                                <TextInput
                                    type='number'
                                    placeholder='Order'
                                    required
                                    min={1}
                                    className='w-24'
                                    value={chapter.order}
                                    onChange={(e) => handleChapterFieldChange(index, 'order', parseInt(e.target.value))}
                                />
                            </div>
                            <TextInput
                                type='text'
                                placeholder='chapter-slug'
                                className='mb-4'
                                value={chapter.chapterSlug}
                                readOnly
                                disabled
                            />
                            <TiptapEditor
                                content={chapter.content}
                                onChange={(newContent) => handleChapterContentChange(index, newContent)}
                                placeholder={`Write content for Chapter ${chapter.order}...`}
                            />
                            <Button
                                type="button"
                                color="failure"
                                className="absolute top-4 right-4"
                                onClick={() => dispatch({ type: 'REMOVE_CHAPTER', payload: { index } })}
                            >
                                Remove
                            </Button>
                        </div>
                    ))}
                <Button
                    type="button"
                    gradientDuoTone='cyanToBlue'
                    outline
                    onClick={() => dispatch({ type: 'ADD_CHAPTER_FIELD' })}
                >
                    Add New Chapter
                </Button>

                <Button type='submit' gradientDuoTone='purpleToPink' disabled={state.loading || isUploading}>
                    {state.loading ? (<><Spinner size='sm' /><span className='pl-3'>Publishing...</span></>) : 'Publish Tutorial'}
                </Button>
                {state.publishError && <Alert className='mt-5' color='failure'>{state.publishError}</Alert>}
            </form>

            {/* Draft Modal */}
            <Modal show={showDraftModal} size="md" onClose={handleDismissDraft} popup>
                <Modal.Header />
                <Modal.Body>
                    <div className="text-center">
                        <HiOutlineExclamationCircle className="mx-auto mb-4 h-14 w-14 text-gray-400 dark:text-gray-200" />
                        <h3 className="mb-5 text-lg font-normal text-gray-500 dark:text-gray-400">
                            We found an unsaved tutorial draft. Do you want to restore it?
                        </h3>
                        <div className="flex justify-center gap-4">
                            <Button color="success" onClick={handleRestoreDraft}>Yes, restore it</Button>
                            <Button color="gray" onClick={handleDismissDraft}>No, start fresh</Button>
                        </div>
                    </div >
                </Modal.Body >
            </Modal >
        </ResponsiveContainer >
    );
}
