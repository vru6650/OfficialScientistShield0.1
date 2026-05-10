import { useNavigate } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { Alert } from 'flowbite-react';
import PageForm from '../components/PageForm.jsx';
import ResponsiveContainer from '../components/layout/ResponsiveContainer.jsx';
import { createPage } from '../services/pageService.js';

const CreatePage = () => {
    const navigate = useNavigate();

    const mutation = useMutation({
        mutationFn: createPage,
    });

    const handleCreate = async (payload) => {
        const createdPage = await mutation.mutateAsync(payload);
        navigate(`/update-page/${createdPage._id}`);
    };

    return (
        <ResponsiveContainer width='wide' spacing='page'>
            <div className='mb-6 flex flex-col gap-2'>
                <h1 className='text-3xl font-semibold text-gray-900 dark:text-white'>Create a custom page</h1>
                <p className='text-sm text-gray-500 dark:text-gray-400'>
                    Compose tutorials, marketing pages, and curated resources with flexible drag-and-drop sections.
                </p>
            </div>

            {mutation.isError && (
                <Alert color='failure' className='mb-6'>
                    {mutation.error?.response?.data?.message || mutation.error?.message || 'Failed to create the page.'}
                </Alert>
            )}

            <PageForm
                onSubmit={handleCreate}
                isSubmitting={mutation.isPending}
                submitLabel='Create page'
            />
        </ResponsiveContainer>
    );
};

export default CreatePage;
