import { useEffect, useMemo, useState } from 'react';
import PropTypes from 'prop-types';
import { Alert, Badge, Button, Card, Label, Select, Textarea, TextInput } from 'flowbite-react';
import { HiArrowDown, HiArrowUp, HiPlus, HiTrash } from 'react-icons/hi';
import PageRenderer from './PageRenderer.jsx';
import slugify from '../utils/slugify.js';

const uniqueId = () => (typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).slice(2, 10));

const createSection = (type = 'rich-text') => {
    const base = {
        id: uniqueId(),
        type,
        title: '',
        subtitle: '',
        body: '',
        alignment: 'left',
        background: 'default',
        mediaUrl: '',
        mediaAlt: '',
        ctaLabel: '',
        ctaUrl: '',
        items: [],
    };

    if (type === 'hero') {
        base.alignment = 'left';
        base.background = 'panel';
    }

    if (type === 'cta') {
        base.alignment = 'center';
        base.background = 'accent';
    }

    return base;
};

const transformInitialValues = (values) => {
    if (!values) {
        return {
            title: '',
            slug: '',
            description: '',
            status: 'draft',
            seo: { metaTitle: '', metaDescription: '' },
            sections: [createSection('hero')],
        };
    }

    const sections = Array.isArray(values.sections) && values.sections.length > 0
        ? values.sections
        : [createSection('rich-text')];

    return {
        title: values.title ?? '',
        slug: values.slug ?? '',
        description: values.description ?? '',
        status: values.status ?? 'draft',
        seo: {
            metaTitle: values.seo?.metaTitle ?? '',
            metaDescription: values.seo?.metaDescription ?? '',
        },
        sections: sections.map((section) => ({
            id: uniqueId(),
            type: section.type ?? 'rich-text',
            title: section.title ?? '',
            subtitle: section.subtitle ?? '',
            body: section.body ?? '',
            alignment: section.alignment ?? (section.type === 'cta' ? 'center' : 'left'),
            background: section.background ?? 'default',
            mediaUrl: section.media?.url ?? '',
            mediaAlt: section.media?.alt ?? '',
            ctaLabel: section.cta?.label ?? '',
            ctaUrl: section.cta?.url ?? '',
            items: Array.isArray(section.items)
                ? section.items.map((item) => ({
                      id: uniqueId(),
                      title: item.title ?? '',
                      body: item.body ?? '',
                      icon: item.icon ?? '',
                  }))
                : [],
        })),
    };
};

const sanitizeForm = (formState, keywordsInput) => {
    const safeString = (value = '') => value.toString().trim();

    const title = safeString(formState.title);
    const slug = safeString(formState.slug) || slugify(title);
    const description = safeString(formState.description);

    const keywords = keywordsInput
        .split(',')
        .map((keyword) => keyword.trim())
        .filter(Boolean);

    const sections = formState.sections
        .map((section, index) => {
            const titleValue = safeString(section.title);
            const subtitleValue = safeString(section.subtitle);
            const bodyValue = safeString(section.body);
            const mediaUrl = safeString(section.mediaUrl);
            const mediaAlt = safeString(section.mediaAlt);
            const ctaLabel = safeString(section.ctaLabel);
            const ctaUrl = safeString(section.ctaUrl);

            const items = Array.isArray(section.items)
                ? section.items
                      .map((item) => ({
                          title: safeString(item.title),
                          body: safeString(item.body),
                          icon: safeString(item.icon),
                      }))
                      .filter((item) => item.title || item.body || item.icon)
                : [];

            const hasContent =
                titleValue || subtitleValue || bodyValue || items.length > 0 || mediaUrl || ctaLabel || ctaUrl;

            if (!hasContent) {
                return null;
            }

            const sanitizedSection = {
                type: section.type,
                title: titleValue,
                subtitle: subtitleValue,
                body: bodyValue,
                alignment: section.alignment,
                background: section.background,
                order: index,
            };

            if (items.length > 0) {
                sanitizedSection.items = items;
            }

            if (mediaUrl || mediaAlt) {
                sanitizedSection.media = {
                    url: mediaUrl,
                    alt: mediaAlt,
                };
            }

            if (ctaLabel || ctaUrl) {
                sanitizedSection.cta = {
                    label: ctaLabel,
                    url: ctaUrl,
                };
            }

            return sanitizedSection;
        })
        .filter(Boolean);

    return {
        title,
        slug,
        description,
        status: formState.status === 'published' ? 'published' : 'draft',
        seo: {
            metaTitle: safeString(formState.seo?.metaTitle) || title,
            metaDescription: safeString(formState.seo?.metaDescription) || description,
            keywords,
        },
        sections,
    };
};

const PageForm = ({ initialValues, onSubmit, isSubmitting = false, submitLabel = 'Save page', errorMessage }) => {
    const [formState, setFormState] = useState(() => transformInitialValues(initialValues));
    const [keywordsInput, setKeywordsInput] = useState(() => (initialValues?.seo?.keywords ?? []).join(', '));
    const [slugEdited, setSlugEdited] = useState(Boolean(initialValues?.slug));
    const [localError, setLocalError] = useState(null);

    useEffect(() => {
        if (initialValues) {
            setFormState(transformInitialValues(initialValues));
            setKeywordsInput((initialValues.seo?.keywords ?? []).join(', '));
            setSlugEdited(Boolean(initialValues.slug));
        }
    }, [initialValues]);

    const previewPayload = useMemo(() => sanitizeForm(formState, keywordsInput), [formState, keywordsInput]);

    const handleTitleChange = (value) => {
        setFormState((prev) => {
            const next = {
                ...prev,
                title: value,
                seo: {
                    ...prev.seo,
                    metaTitle: prev.seo?.metaTitle || value,
                },
            };

            if (!slugEdited) {
                next.slug = slugify(value);
            }

            return next;
        });
    };

    const handleSlugChange = (value) => {
        setSlugEdited(true);
        setFormState((prev) => ({ ...prev, slug: value }));
    };

    const handleSeoChange = (field, value) => {
        setFormState((prev) => ({
            ...prev,
            seo: {
                ...prev.seo,
                [field]: value,
            },
        }));
    };

    const handleSectionChange = (sectionId, field, value) => {
        setFormState((prev) => ({
            ...prev,
            sections: prev.sections.map((section) => {
                if (section.id !== sectionId) {
                    return section;
                }

                const updated = { ...section, [field]: value };

                if (field === 'type') {
                    updated.type = value;

                    if (value === 'hero') {
                        updated.alignment = 'left';
                        updated.background = 'panel';
                    } else if (value === 'cta') {
                        updated.alignment = 'center';
                        updated.background = 'accent';
                    }

                    if (value !== 'feature-grid') {
                        updated.items = [];
                    }
                }

                return updated;
            }),
        }));
    };

    const handleMoveSection = (sectionId, direction) => {
        setFormState((prev) => {
            const index = prev.sections.findIndex((section) => section.id === sectionId);
            if (index === -1) {
                return prev;
            }

            const targetIndex = direction === 'up' ? index - 1 : index + 1;

            if (targetIndex < 0 || targetIndex >= prev.sections.length) {
                return prev;
            }

            const updatedSections = [...prev.sections];
            const [section] = updatedSections.splice(index, 1);
            updatedSections.splice(targetIndex, 0, section);

            return { ...prev, sections: updatedSections };
        });
    };

    const handleRemoveSection = (sectionId) => {
        setFormState((prev) => ({
            ...prev,
            sections: prev.sections.filter((section) => section.id !== sectionId),
        }));
    };

    const handleAddSection = (type = 'rich-text') => {
        setFormState((prev) => ({
            ...prev,
            sections: [...prev.sections, createSection(type)],
        }));
    };

    const handleItemChange = (sectionId, itemId, field, value) => {
        setFormState((prev) => ({
            ...prev,
            sections: prev.sections.map((section) => {
                if (section.id !== sectionId) {
                    return section;
                }

                const items = section.items.map((item) =>
                    item.id === itemId ? { ...item, [field]: value } : item
                );

                return { ...section, items };
            }),
        }));
    };

    const handleAddItem = (sectionId) => {
        setFormState((prev) => ({
            ...prev,
            sections: prev.sections.map((section) => {
                if (section.id !== sectionId) {
                    return section;
                }

                return {
                    ...section,
                    items: [
                        ...section.items,
                        {
                            id: uniqueId(),
                            title: '',
                            body: '',
                            icon: '',
                        },
                    ],
                };
            }),
        }));
    };

    const handleRemoveItem = (sectionId, itemId) => {
        setFormState((prev) => ({
            ...prev,
            sections: prev.sections.map((section) => {
                if (section.id !== sectionId) {
                    return section;
                }

                return {
                    ...section,
                    items: section.items.filter((item) => item.id !== itemId),
                };
            }),
        }));
    };

    const handleSubmit = async (event) => {
        event.preventDefault();
        setLocalError(null);

        const sanitizedTitle = formState.title?.toString().trim();

        if (!sanitizedTitle) {
            setLocalError('A title is required before publishing a page.');
            return;
        }

        const payload = sanitizeForm(formState, keywordsInput);

        if (payload.sections.length === 0) {
            setLocalError('Add at least one section with content to build the page.');
            return;
        }

        try {
            await onSubmit(payload);
        } catch (error) {
            const message = error?.response?.data?.message || error?.message || 'Failed to save the page.';
            setLocalError(message);
        }
    };

    const statusBadgeColor = formState.status === 'published' ? 'success' : 'warning';

    return (
        <form onSubmit={handleSubmit} className='space-y-6'>
            {(localError || errorMessage) && (
                <Alert color='failure'>
                    {localError || errorMessage}
                </Alert>
            )}

            <div className='grid gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]'>
                <div className='space-y-6'>
                    <Card className='space-y-5'>
                        <div className='flex flex-col gap-4'>
                            <div className='grid gap-4 md:grid-cols-2'>
                                <div className='flex flex-col gap-2'>
                                    <Label htmlFor='title'>Title</Label>
                                    <TextInput
                                        id='title'
                                        placeholder='Page title'
                                        value={formState.title}
                                        onChange={(event) => handleTitleChange(event.target.value)}
                                        required
                                    />
                                </div>
                                <div className='flex flex-col gap-2'>
                                    <Label htmlFor='slug'>Slug</Label>
                                    <TextInput
                                        id='slug'
                                        placeholder='my-custom-page'
                                        value={formState.slug}
                                        onChange={(event) => handleSlugChange(slugify(event.target.value))}
                                        helperText='This determines the public URL of the page.'
                                    />
                                </div>
                            </div>

                            <div className='flex flex-col gap-2'>
                                <Label htmlFor='description'>Summary</Label>
                                <Textarea
                                    id='description'
                                    rows={3}
                                    placeholder='Short description used in previews and SEO metadata.'
                                    value={formState.description}
                                    onChange={(event) => setFormState((prev) => ({ ...prev, description: event.target.value }))}
                                />
                            </div>

                            <div className='grid gap-4 md:grid-cols-2'>
                                <div className='flex flex-col gap-2'>
                                    <Label htmlFor='status'>Status</Label>
                                    <Select
                                        id='status'
                                        value={formState.status}
                                        onChange={(event) => setFormState((prev) => ({ ...prev, status: event.target.value }))}
                                    >
                                        <option value='draft'>Draft</option>
                                        <option value='published'>Published</option>
                                    </Select>
                                </div>
                                <div className='flex flex-col gap-2'>
                                    <Label htmlFor='keywords'>Keywords</Label>
                                    <TextInput
                                        id='keywords'
                                        placeholder='science, engineering, tutorials'
                                        value={keywordsInput}
                                        onChange={(event) => setKeywordsInput(event.target.value)}
                                        helperText='Separate keywords with commas for SEO.'
                                    />
                                </div>
                            </div>
                        </div>
                    </Card>

                    <Card className='space-y-4'>
                        <div className='grid gap-4 md:grid-cols-2'>
                            <div className='flex flex-col gap-2'>
                                <Label htmlFor='metaTitle'>SEO title</Label>
                                <TextInput
                                    id='metaTitle'
                                    placeholder='Custom meta title (optional)'
                                    value={formState.seo?.metaTitle ?? ''}
                                    onChange={(event) => handleSeoChange('metaTitle', event.target.value)}
                                />
                            </div>
                            <div className='flex flex-col gap-2'>
                                <Label htmlFor='metaDescription'>SEO description</Label>
                                <Textarea
                                    id='metaDescription'
                                    rows={2}
                                    placeholder='Custom meta description (optional)'
                                    value={formState.seo?.metaDescription ?? ''}
                                    onChange={(event) => handleSeoChange('metaDescription', event.target.value)}
                                />
                            </div>
                        </div>
                    </Card>

                    <div className='flex items-center justify-between'>
                        <h2 className='text-xl font-semibold text-gray-900 dark:text-white'>Page sections</h2>
                        <div className='flex gap-2'>
                            <Button color='light' size='sm' onClick={() => handleAddSection('hero')} type='button'>
                                <HiPlus className='mr-1 h-4 w-4' /> Hero
                            </Button>
                            <Button color='light' size='sm' onClick={() => handleAddSection('feature-grid')} type='button'>
                                <HiPlus className='mr-1 h-4 w-4' /> Feature grid
                            </Button>
                            <Button color='light' size='sm' onClick={() => handleAddSection('cta')} type='button'>
                                <HiPlus className='mr-1 h-4 w-4' /> CTA
                            </Button>
                            <Button color='light' size='sm' onClick={() => handleAddSection('rich-text')} type='button'>
                                <HiPlus className='mr-1 h-4 w-4' /> Text
                            </Button>
                        </div>
                    </div>

                    <div className='space-y-5'>
                        {formState.sections.map((section, index) => (
                            <Card key={section.id} className='space-y-5 border border-gray-200/80 dark:border-gray-700/70'>
                                <div className='flex flex-wrap items-center justify-between gap-3'>
                                    <div className='flex items-center gap-3'>
                                        <Badge color='indigo'>Section {index + 1}</Badge>
                                        <span className='text-sm uppercase tracking-wide text-gray-500 dark:text-gray-400'>
                                            {section.type}
                                        </span>
                                    </div>
                                    <div className='flex items-center gap-2'>
                                        <Button
                                            color='light'
                                            pill
                                            size='xs'
                                            type='button'
                                            onClick={() => handleMoveSection(section.id, 'up')}
                                            disabled={index === 0}
                                        >
                                            <HiArrowUp className='h-4 w-4' />
                                        </Button>
                                        <Button
                                            color='light'
                                            pill
                                            size='xs'
                                            type='button'
                                            onClick={() => handleMoveSection(section.id, 'down')}
                                            disabled={index === formState.sections.length - 1}
                                        >
                                            <HiArrowDown className='h-4 w-4' />
                                        </Button>
                                        <Button
                                            color='failure'
                                            pill
                                            size='xs'
                                            type='button'
                                            onClick={() => handleRemoveSection(section.id)}
                                        >
                                            <HiTrash className='h-4 w-4' />
                                        </Button>
                                    </div>
                                </div>

                                <div className='grid gap-4 md:grid-cols-2'>
                                    <div className='flex flex-col gap-2'>
                                        <Label>Section type</Label>
                                        <Select
                                            value={section.type}
                                            onChange={(event) => handleSectionChange(section.id, 'type', event.target.value)}
                                        >
                                            <option value='hero'>Hero</option>
                                            <option value='rich-text'>Rich text</option>
                                            <option value='feature-grid'>Feature grid</option>
                                            <option value='cta'>Call to action</option>
                                            <option value='custom'>Custom</option>
                                        </Select>
                                    </div>
                                    <div className='flex flex-col gap-2'>
                                        <Label>Alignment</Label>
                                        <Select
                                            value={section.alignment}
                                            onChange={(event) => handleSectionChange(section.id, 'alignment', event.target.value)}
                                        >
                                            <option value='left'>Left</option>
                                            <option value='center'>Center</option>
                                            <option value='right'>Right</option>
                                        </Select>
                                    </div>
                                </div>

                                <div className='grid gap-4 md:grid-cols-2'>
                                    <div className='flex flex-col gap-2'>
                                        <Label>Background style</Label>
                                        <Select
                                            value={section.background}
                                            onChange={(event) => handleSectionChange(section.id, 'background', event.target.value)}
                                        >
                                            <option value='default'>Default</option>
                                            <option value='muted'>Muted</option>
                                            <option value='accent'>Accent</option>
                                            <option value='panel'>Panel</option>
                                        </Select>
                                    </div>
                                    <div className='flex flex-col gap-2'>
                                        <Label>Section title</Label>
                                        <TextInput
                                            value={section.title}
                                            placeholder='Introduce the section'
                                            onChange={(event) => handleSectionChange(section.id, 'title', event.target.value)}
                                        />
                                    </div>
                                </div>

                                <div className='grid gap-4 md:grid-cols-2'>
                                    <div className='flex flex-col gap-2'>
                                        <Label>Section subtitle</Label>
                                        <TextInput
                                            value={section.subtitle}
                                            placeholder='Optional subtitle'
                                            onChange={(event) => handleSectionChange(section.id, 'subtitle', event.target.value)}
                                        />
                                    </div>
                                    <div className='flex flex-col gap-2'>
                                        <Label>Body content</Label>
                                        <Textarea
                                            rows={section.type === 'hero' ? 4 : 3}
                                            value={section.body}
                                            placeholder='Write the content for this section'
                                            onChange={(event) => handleSectionChange(section.id, 'body', event.target.value)}
                                        />
                                    </div>
                                </div>

                                <div className='grid gap-4 md:grid-cols-2'>
                                    <div className='flex flex-col gap-2'>
                                        <Label>Media URL</Label>
                                        <TextInput
                                            value={section.mediaUrl}
                                            placeholder='https://example.com/image.png'
                                            onChange={(event) => handleSectionChange(section.id, 'mediaUrl', event.target.value)}
                                        />
                                    </div>
                                    <div className='flex flex-col gap-2'>
                                        <Label>Media alt text</Label>
                                        <TextInput
                                            value={section.mediaAlt}
                                            placeholder='Describe the media for accessibility'
                                            onChange={(event) => handleSectionChange(section.id, 'mediaAlt', event.target.value)}
                                        />
                                    </div>
                                </div>

                                <div className='grid gap-4 md:grid-cols-2'>
                                    <div className='flex flex-col gap-2'>
                                        <Label>CTA label</Label>
                                        <TextInput
                                            value={section.ctaLabel}
                                            placeholder='Call to action label'
                                            onChange={(event) => handleSectionChange(section.id, 'ctaLabel', event.target.value)}
                                        />
                                    </div>
                                    <div className='flex flex-col gap-2'>
                                        <Label>CTA URL</Label>
                                        <TextInput
                                            value={section.ctaUrl}
                                            placeholder='https://example.com/signup'
                                            onChange={(event) => handleSectionChange(section.id, 'ctaUrl', event.target.value)}
                                        />
                                    </div>
                                </div>

                                {section.type === 'feature-grid' && (
                                    <div className='space-y-4'>
                                        <div className='flex items-center justify-between'>
                                            <h3 className='text-lg font-semibold text-gray-900 dark:text-white'>Feature items</h3>
                                            <Button size='xs' color='light' type='button' onClick={() => handleAddItem(section.id)}>
                                                <HiPlus className='mr-1 h-4 w-4' /> Add item
                                            </Button>
                                        </div>
                                        <div className='space-y-4'>
                                            {section.items.map((item) => (
                                                <Card key={item.id} className='border border-gray-200/80 p-4 dark:border-gray-700/70'>
                                                    <div className='grid gap-4 md:grid-cols-2'>
                                                        <div className='flex flex-col gap-2'>
                                                            <Label>Item title</Label>
                                                            <TextInput
                                                                value={item.title}
                                                                placeholder='Feature title'
                                                                onChange={(event) =>
                                                                    handleItemChange(section.id, item.id, 'title', event.target.value)
                                                                }
                                                            />
                                                        </div>
                                                        <div className='flex flex-col gap-2'>
                                                            <Label>Icon (emoji or short text)</Label>
                                                            <TextInput
                                                                value={item.icon}
                                                                placeholder='🚀'
                                                                onChange={(event) =>
                                                                    handleItemChange(section.id, item.id, 'icon', event.target.value)
                                                                }
                                                            />
                                                        </div>
                                                    </div>
                                                    <div className='mt-3 flex flex-col gap-2'>
                                                        <Label>Item description</Label>
                                                        <Textarea
                                                            rows={3}
                                                            value={item.body}
                                                            placeholder='Explain what makes this feature special.'
                                                            onChange={(event) =>
                                                                handleItemChange(section.id, item.id, 'body', event.target.value)
                                                            }
                                                        />
                                                    </div>
                                                    <div className='mt-3 flex justify-end'>
                                                        <Button
                                                            color='failure'
                                                            size='xs'
                                                            type='button'
                                                            onClick={() => handleRemoveItem(section.id, item.id)}
                                                        >
                                                            <HiTrash className='mr-1 h-4 w-4' /> Remove item
                                                        </Button>
                                                    </div>
                                                </Card>
                                            ))}
                                            {section.items.length === 0 && (
                                                <p className='text-sm text-gray-500 dark:text-gray-400'>
                                                    Add cards to highlight individual features or resources.
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </Card>
                        ))}

                        {formState.sections.length === 0 && (
                            <Card className='border border-dashed border-gray-300 p-6 text-center dark:border-gray-700'>
                                <p className='text-sm text-gray-500 dark:text-gray-400'>
                                    You have no sections yet. Use the buttons above to add content blocks.
                                </p>
                            </Card>
                        )}
                    </div>
                </div>

                <div className='space-y-4 lg:sticky lg:top-24'>
                    <Card className='space-y-4'>
                        <div className='flex items-center justify-between'>
                            <h3 className='text-lg font-semibold text-gray-900 dark:text-white'>Summary</h3>
                            <Badge color={statusBadgeColor}>{formState.status}</Badge>
                        </div>
                        <div className='text-sm text-gray-500 dark:text-gray-400'>/{previewPayload.slug}</div>
                        <div className='text-sm text-gray-500 dark:text-gray-400'>
                            {previewPayload.seo.keywords.length > 0 ? (
                                <span>Keywords: {previewPayload.seo.keywords.join(', ')}</span>
                            ) : (
                                <span>No keywords added yet.</span>
                            )}
                        </div>
                        <Button type='submit' gradientDuoTone='purpleToPink' isProcessing={isSubmitting} disabled={isSubmitting}>
                            {submitLabel}
                        </Button>
                    </Card>

                    <Card className='max-h-[75vh] overflow-y-auto pr-2'>
                        <h3 className='mb-4 text-lg font-semibold text-gray-900 dark:text-white'>Live preview</h3>
                        <PageRenderer page={previewPayload} compact />
                    </Card>
                </div>
            </div>
        </form>
    );
};

PageForm.propTypes = {
    initialValues: PropTypes.shape({
        title: PropTypes.string,
        slug: PropTypes.string,
        description: PropTypes.string,
        status: PropTypes.string,
        seo: PropTypes.shape({
            metaTitle: PropTypes.string,
            metaDescription: PropTypes.string,
            keywords: PropTypes.arrayOf(PropTypes.string),
        }),
        sections: PropTypes.arrayOf(PropTypes.object),
    }),
    onSubmit: PropTypes.func.isRequired,
    isSubmitting: PropTypes.bool,
    submitLabel: PropTypes.string,
    errorMessage: PropTypes.string,
};

export default PageForm;
