import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Alert, Spinner } from 'flowbite-react';
import PageForm from '../components/PageForm.jsx';
import ResponsiveContainer from '../components/layout/ResponsiveContainer.jsx';
import { getPageById, updatePage } from '../services/pageService.js';

const UpdatePage = () => {
    const { pageId } = useParams();
    const queryClient = useQueryClient();
    const [successMessage, setSuccessMessage] = useState('');

    const {
        data,
        isLoading,
        isError,
        error,
    } = useQuery({
        queryKey: ['adminPage', pageId],
        queryFn: () => getPageById(pageId),
        enabled: Boolean(pageId),
    });

    const mutation = useMutation({
        mutationFn: (payload) => updatePage({ pageId, payload }),
        onSuccess: (updatedPage) => {
            queryClient.setQueryData(['adminPage', pageId], updatedPage);
            queryClient.invalidateQueries({ queryKey: ['adminPages'] });

            if (data?.slug) {
                queryClient.invalidateQueries({ queryKey: ['contentPage', data.slug] });
            }

            queryClient.invalidateQueries({ queryKey: ['contentPage', updatedPage.slug] });
            setSuccessMessage('Page updated successfully.');
        },
    });

    const handleUpdate = async (payload) => {
        await mutation.mutateAsync(payload);
    };

    if (isLoading) {
        return (
            <div className='flex min-h-[60vh] items-center justify-center'>
                <Spinner size='xl' />
            </div>
        );
    }

    if (isError) {
        return (
            <ResponsiveContainer width='tight' spacing='page'>
                <Alert color='failure'>
                    {error?.response?.data?.message || error?.message || 'Unable to load this page.'}
                </Alert>
            </ResponsiveContainer>
        );
    }

    return (
        <ResponsiveContainer width='wide' spacing='page'>
            <div className='mb-6 flex flex-col gap-2'>
                <h1 className='text-3xl font-semibold text-gray-900 dark:text-white'>Edit page</h1>
                <p className='text-sm text-gray-500 dark:text-gray-400'>
                    Iterate on copy, visuals, and layout to keep your content fresh.
                </p>
            </div>

            {successMessage && (
                <Alert color='success' className='mb-6' onDismiss={() => setSuccessMessage('')}>
                    {successMessage}
                </Alert>
            )}

            {mutation.isError && (
                <Alert color='failure' className='mb-6'>
                    {mutation.error?.response?.data?.message || mutation.error?.message || 'Failed to update the page.'}
                </Alert>
            )}

            <PageForm
                initialValues={data}
                onSubmit={handleUpdate}
                isSubmitting={mutation.isPending}
                submitLabel='Save changes'
            />
        </ResponsiveContainer>
    );
};

export default UpdatePage;
