import PropTypes from 'prop-types';
import { Alert, Spinner } from 'flowbite-react';
import { useQuery } from '@tanstack/react-query';
import PageRenderer from './PageRenderer.jsx';
import { getPageContent } from '../services/pageService.js';

const PageView = ({ slug, fallback }) => {
    const {
        data,
        isLoading,
        isError,
        error,
    } = useQuery({
        queryKey: ['contentPage', slug],
        queryFn: () => getPageContent(slug),
        retry: (failureCount, err) => {
            if (err?.response?.status === 404) {
                return false;
            }

            return failureCount < 2;
        },
    });

    if (isLoading) {
        return (
            <div className='workspace-page'>
                <div className='workspace-page__content workspace-page__content--story flex min-h-[60vh] items-center justify-center px-4 py-12'>
                    <Spinner size='xl' />
                </div>
            </div>
        );
    }

    if (isError) {
        if (error?.response?.status === 404) {
            if (fallback) {
                return <>{fallback}</>;
            }

            return (
                <div className='workspace-page'>
                    <div className='workspace-page__content workspace-page__content--tight px-4 py-16'>
                        <div className='workspace-surface px-8 py-12 text-center'>
                            <h1 className='text-3xl font-semibold text-gray-900 dark:text-white'>Page coming soon</h1>
                            <p className='mt-2 text-sm text-gray-500 dark:text-gray-400'>
                                We&apos;re still crafting this experience. Please check back later.
                            </p>
                        </div>
                    </div>
                </div>
            );
        }

        return (
            <div className='workspace-page'>
                <div className='workspace-page__content workspace-page__content--tight px-4 py-16'>
                    <Alert color='failure'>
                        {error?.response?.data?.message || error?.message || 'Failed to load the requested page.'}
                    </Alert>
                </div>
            </div>
        );
    }

    return <PageRenderer page={data} />;
};

PageView.propTypes = {
    slug: PropTypes.string.isRequired,
    fallback: PropTypes.node,
};

export default PageView;
