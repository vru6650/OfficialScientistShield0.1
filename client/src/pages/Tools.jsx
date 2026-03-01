import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
    Alert,
    Badge,
    Button,
    Select,
    TextInput,
    Textarea,
} from 'flowbite-react';
import {
    FaArrowRight,
    FaAmazon,
    FaCheckCircle,
    FaCopy,
    FaExternalLinkAlt,
    FaExpand,
    FaCompress,
    FaSyncAlt,
    FaSearch,
    FaLightbulb,
    FaMoon,
    FaSun,
    FaTint,
    FaBookReader,
    FaBookmark,
    FaListUl,
    FaFont,
    FaMinus,
    FaPlus,
    FaChevronLeft,
    FaChevronRight,
    FaTimes,
    FaBolt,
    FaKeyboard,
    FaUnderline,
    FaHighlighter,
    FaRegStickyNote,
    FaPlay,
    FaPause,
    FaStop,
    FaArrowUp,
    FaVolumeUp,
    FaDownload,
    FaUpload,
    FaSlidersH,
    FaTabletAlt,
} from 'react-icons/fa';
import PropTypes from 'prop-types';
import { workspaceTools, resourceTools, toolCategories } from '../data/toolsData';

const defaultJsonSample = `{
  "name": "ScientistShield",
  "stack": ["React", "Node", "Tailwind"],
  "features": {
    "tools": true,
    "tutorials": true
  }
}`;

const EPUB_MIMETYPE = 'application/epub+zip';
const DEFAULT_EPUB_CREATOR = 'ScientistShield Tools';
const DEFAULT_EPUB_PUBLISHER = 'ScientistShield';
const ADVANCED_DEVANAGARI_OCR_LANGUAGE = 'hin+san+mar+nep+eng';
const OCR_LANGUAGE_OPTIONS = [
    { value: 'san+hin+eng', label: 'Sanskrit + Hindi + English' },
    { value: 'hin+eng', label: 'Hindi + English' },
    { value: 'hin', label: 'Hindi only (Devanagari)' },
    {
        value: ADVANCED_DEVANAGARI_OCR_LANGUAGE,
        label: 'Advanced Devanagari OCR (Hindi + Sanskrit + Marathi + Nepali + English)',
    },
];
const OCR_LANGUAGE_LABELS = {
    'san+hin+eng': 'Sanskrit + Hindi + English',
    'hin+eng': 'Hindi + English',
    hin: 'Hindi',
    [ADVANCED_DEVANAGARI_OCR_LANGUAGE]: 'Advanced Devanagari OCR',
};
const DEFAULT_EPUB_FONT_SCALE_PERCENT = 100;
const DEFAULT_EPUB_LINE_HEIGHT = 1.65;
const DEFAULT_EPUB_MARGIN_PERCENT = 5;
const DEFAULT_EPUB_TEXT_ALIGN = 'left';
const DEFAULT_EPUB_PARAGRAPH_INDENT = 0;
const DEFAULT_EPUB_PARAGRAPH_SPACING = 0.9;
const DEFAULT_EPUB_LETTER_SPACING = 0;
const DEFAULT_EPUB_WORD_SPACING = 0;
const DEFAULT_EPUB_HYPHENATION = true;
const EPUB_TEXT_ALIGN_OPTIONS = [
    { value: 'justify', label: 'Justify' },
    { value: 'left', label: 'Left' },
];
const DEFAULT_CONVERTER_PARALLEL_PAGES = 3;
const DEFAULT_OCR_WORKER_COUNT = 1;
const MAX_CONVERTER_PARALLEL_PAGES = 6;
const MAX_OCR_WORKER_COUNT = 3;
const DEFAULT_OCR_PSM_MODE = 'auto';
const DEFAULT_OCR_PREPROCESS_MODE = 'grayscale';
const DEFAULT_OCR_CONFIDENCE_THRESHOLD = 34;
const DEFAULT_OCR_SECOND_PASS_ENABLED = true;
const DEFAULT_OCR_PRESERVE_SPACING = true;
const DEFAULT_OCR_AUTO_HIRES_RETRY = true;
const DEFAULT_LAYOUT_RETENTION_MODE = 'balanced';
const DEFAULT_LAYOUT_DETECT_COLUMNS = true;
const DEFAULT_LAYOUT_KEEP_LINE_BREAKS = false;
const DEFAULT_LAYOUT_PROTECT_SHORT_BLOCKS = true;
const LAYOUT_RETENTION_MODE_OPTIONS = [
    {
        value: 'balanced',
        label: 'Balanced retention',
        description: 'Smart paragraph detection with light merging and auto column ordering.',
    },
    {
        value: 'structure-first',
        label: 'Structure-first',
        description: 'Prioritizes headings, columns, and stanza breaks; keeps deliberate line breaks.',
    },
    {
        value: 'flow-first',
        label: 'Flow-first',
        description: 'Max reflow for continuous prose; loosens breaks but preserves headings/lists.',
    },
];
const LAYOUT_RETENTION_LABELS = Object.fromEntries(
    LAYOUT_RETENTION_MODE_OPTIONS.map((option) => [option.value, option.label]),
);
const LAYOUT_RETENTION_BEHAVIOR = {
    balanced: {
        wrapMergeMinChars: 30,
        paragraphGapMultiplier: 1.55,
        preferLineBreaks: false,
        protectShortLines: true,
        enableColumnDetection: true,
        columnGapMin: 38,
        columnGapFactor: 0.32,
    },
    'structure-first': {
        wrapMergeMinChars: 46,
        paragraphGapMultiplier: 1.25,
        preferLineBreaks: true,
        protectShortLines: true,
        enableColumnDetection: true,
        columnGapMin: 32,
        columnGapFactor: 0.28,
    },
    'flow-first': {
        wrapMergeMinChars: 22,
        paragraphGapMultiplier: 1.85,
        preferLineBreaks: false,
        protectShortLines: false,
        enableColumnDetection: false,
        columnGapMin: 44,
        columnGapFactor: 0.36,
    },
};

function buildLayoutBehavior(layoutMode, overrides = {}) {
    const base = LAYOUT_RETENTION_BEHAVIOR[layoutMode] ?? LAYOUT_RETENTION_BEHAVIOR[DEFAULT_LAYOUT_RETENTION_MODE];
    return {
        ...base,
        enableColumnDetection: overrides.detectColumns ?? base.enableColumnDetection,
        preferLineBreaks: overrides.keepLineBreaks ?? base.preferLineBreaks,
        protectShortLines: overrides.protectShortBlocks ?? base.protectShortLines,
    };
}
const OCR_PAGE_SEGMENTATION_OPTIONS = [
    { value: 'auto', label: 'Auto layout (PSM 3)', psm: 3 },
    { value: 'single-column', label: 'Single column (PSM 4)', psm: 4 },
    { value: 'single-block', label: 'Single text block (PSM 6)', psm: 6 },
    { value: 'sparse', label: 'Sparse text (PSM 11)', psm: 11 },
];
const OCR_PSM_BY_MODE = Object.fromEntries(
    OCR_PAGE_SEGMENTATION_OPTIONS.map((option) => [option.value, option.psm]),
);
const OCR_PREPROCESS_OPTIONS = [
    { value: 'none', label: 'None (raw render)' },
    { value: 'grayscale', label: 'Grayscale contrast' },
    { value: 'binary', label: 'High-contrast binary' },
    { value: 'adaptive', label: 'Adaptive binarization (speckle-safe)' },
];
const HINDI_CONVERTER_FEATURE_LABELS = [
    {
        id: 'hindi-ocr',
        label: 'Hindi OCR (Optical Character Recognition)',
        description: 'Recognizes Hindi text from scanned PDFs and turns it into editable text.',
        status: 'available',
    },
    {
        id: 'advanced-devanagari-ocr',
        label: 'Advanced Devanagari OCR',
        description: 'High-accuracy OCR tuned for Hindi, Sanskrit, Marathi, Nepali, and English mixed pages.',
        status: 'available',
    },
    {
        id: 'unicode-support',
        label: 'Unicode Support for Hindi',
        description: 'Makes sure Hindi characters display correctly after conversion.',
        status: 'available',
    },
    {
        id: 'pdf-to-word',
        label: 'PDF to Word (Hindi Text Preserved)',
        description: 'Converts a PDF into Word while keeping Hindi script intact.',
        status: 'coming-soon',
    },
    {
        id: 'pdf-to-epub',
        label: 'PDF to EPUB (Hindi)',
        description: 'Converts a PDF into an EPUB ebook with Hindi formatting.',
        status: 'available',
    },
    {
        id: 'multi-language-ocr',
        label: 'Multi-Language OCR',
        description: 'OCR that supports Hindi along with other languages.',
        status: 'available',
    },
    {
        id: 'text-extraction',
        label: 'Text Extraction (Hindi)',
        description: 'Extracts editable Hindi text from the PDF.',
        status: 'available',
    },
    {
        id: 'layout-retention',
        label: 'Layout Retention',
        description: 'Keeps formatting (paragraphs, headings, placement) while converting Hindi PDFs.',
        status: 'available',
    },
    {
        id: 'best-hindi-pdf-converter',
        label: 'Best Hindi PDF Converter',
        description: 'One-click Hindi PDF conversion tuned for OCR, layout retention, and Devanagari-safe EPUB output.',
        status: 'available',
    },
    {
        id: 'preserves-fonts-formatting',
        label: 'Preserves Fonts & Formatting',
        description:
            'Keeps paragraphs, headings, page breaks, bold/italics, and line spacing intact so Hindi PDFs that are more than photos stay readable.',
        status: 'available',
    },
];
const EPUB_COMPRESSION_OPTIONS = [
    { value: 'fast', label: 'Fast (larger file)', level: 1 },
    { value: 'balanced', label: 'Balanced', level: 6 },
    { value: 'max', label: 'Maximum compression (slowest)', level: 9 },
];
const EPUB_COMPRESSION_LEVEL_BY_VALUE = Object.fromEntries(
    EPUB_COMPRESSION_OPTIONS.map((option) => [option.value, option.level]),
);
const DEFAULT_READING_WIDTH = 920;
const EPUB_LANGUAGE_OPTIONS = [
    { value: 'mul', label: 'Multilingual (Sanskrit + Hindi + English)' },
    { value: 'hi', label: 'Hindi' },
    { value: 'sa', label: 'Sanskrit' },
    { value: 'en', label: 'English' },
];
const CONVERTER_PRESET_OPTIONS = [
    {
        value: 'recommended',
        label: 'Recommended multilingual',
        settings: {
            epubContentMode: 'hybrid',
            extractionMode: 'auto',
            ocrLanguageMode: 'san+hin+eng',
            ocrQuality: 'balanced',
            ocrPageSegmentationMode: DEFAULT_OCR_PSM_MODE,
            ocrPreprocessMode: DEFAULT_OCR_PREPROCESS_MODE,
            ocrConfidenceThreshold: DEFAULT_OCR_CONFIDENCE_THRESHOLD,
            ocrEnableSecondPass: DEFAULT_OCR_SECOND_PASS_ENABLED,
            ocrPreserveInterwordSpaces: DEFAULT_OCR_PRESERVE_SPACING,
            chapterMode: 'smart',
            preserveTextFormatting: true,
            normalizeTextCleanup: true,
            removeStandalonePageNumbers: true,
            stripHeadersFooters: true,
            includePageImages: true,
            pageImageSourceMode: 'embedded',
            pageImageQuality: 'balanced',
            pageImageFormat: 'jpeg',
            autoCropPageImages: true,
            includePageMarkers: false,
            embeddedFontProfile: 'noto-serif-devanagari',
            usePdfMetadata: true,
            epubLanguage: 'mul',
            epubFontScalePercent: DEFAULT_EPUB_FONT_SCALE_PERCENT,
            epubLineHeight: DEFAULT_EPUB_LINE_HEIGHT,
            epubMarginPercent: DEFAULT_EPUB_MARGIN_PERCENT,
            epubTextAlign: 'justify',
            epubParagraphIndent: 0.9,
            epubParagraphSpacing: 0.8,
            epubLetterSpacing: 0,
            epubWordSpacing: 0.04,
            epubHyphenation: true,
            layoutRetentionMode: 'balanced',
            layoutDetectColumns: true,
            layoutKeepLineBreaks: false,
            layoutProtectShortBlocks: true,
            parallelPages: DEFAULT_CONVERTER_PARALLEL_PAGES,
            ocrWorkerCount: DEFAULT_OCR_WORKER_COUNT,
            epubCompressionMode: 'balanced',
            exportConversionReport: true,
        },
    },
    {
        value: 'scanned-book',
        label: 'Scanned book (OCR heavy)',
        settings: {
            epubContentMode: 'hybrid',
            extractionMode: 'ocr',
            ocrLanguageMode: 'san+hin+eng',
            ocrQuality: 'best',
            ocrPageSegmentationMode: 'sparse',
            ocrPreprocessMode: 'binary',
            ocrConfidenceThreshold: 42,
            ocrEnableSecondPass: true,
            ocrPreserveInterwordSpaces: DEFAULT_OCR_PRESERVE_SPACING,
            chapterMode: 'smart',
            preserveTextFormatting: true,
            normalizeTextCleanup: true,
            removeStandalonePageNumbers: true,
            stripHeadersFooters: true,
            includePageImages: true,
            pageImageSourceMode: 'snapshot',
            pageImageQuality: 'detailed',
            pageImageFormat: 'png',
            autoCropPageImages: false,
            includePageMarkers: false,
            embeddedFontProfile: 'noto-serif-devanagari',
            usePdfMetadata: true,
            epubLanguage: 'mul',
            epubFontScalePercent: 106,
            epubLineHeight: 1.72,
            epubMarginPercent: 5,
            epubTextAlign: 'justify',
            epubParagraphIndent: 1,
            epubParagraphSpacing: 0.7,
            epubLetterSpacing: 0.01,
            epubWordSpacing: 0.04,
            epubHyphenation: true,
            layoutRetentionMode: 'structure-first',
            layoutDetectColumns: true,
            layoutKeepLineBreaks: true,
            layoutProtectShortBlocks: true,
            parallelPages: 2,
            ocrWorkerCount: 2,
            epubCompressionMode: 'balanced',
            exportConversionReport: true,
        },
    },
    {
        value: 'pro-scan',
        label: 'Pro scan (advanced Devanagari OCR)',
        settings: {
            epubContentMode: 'hybrid',
            extractionMode: 'ocr',
            ocrLanguageMode: ADVANCED_DEVANAGARI_OCR_LANGUAGE,
            ocrQuality: 'ultra',
            ocrPageSegmentationMode: 'sparse',
            ocrPreprocessMode: 'adaptive',
            ocrConfidenceThreshold: 36,
            ocrEnableSecondPass: true,
            ocrPreserveInterwordSpaces: true,
            ocrAutoHighResRetry: true,
            chapterMode: 'smart',
            preserveTextFormatting: true,
            normalizeTextCleanup: true,
            removeStandalonePageNumbers: true,
            stripHeadersFooters: true,
            includePageImages: true,
            pageImageSourceMode: 'embedded',
            pageImageQuality: 'detailed',
            pageImageFormat: 'jpeg',
            autoCropPageImages: true,
            includePageMarkers: false,
            embeddedFontProfile: 'noto-serif-devanagari',
            usePdfMetadata: true,
            epubLanguage: 'mul',
            epubFontScalePercent: 104,
            epubLineHeight: 1.72,
            epubMarginPercent: 5.5,
            epubTextAlign: 'justify',
            epubParagraphIndent: 0.95,
            epubParagraphSpacing: 0.78,
            epubLetterSpacing: 0.01,
            epubWordSpacing: 0.05,
            epubHyphenation: true,
            layoutRetentionMode: 'structure-first',
            layoutDetectColumns: true,
            layoutKeepLineBreaks: true,
            layoutProtectShortBlocks: true,
            parallelPages: 3,
            ocrWorkerCount: 2,
            epubCompressionMode: 'balanced',
            exportConversionReport: true,
        },
    },
    {
        value: 'fast-text',
        label: 'Fast text extraction',
        settings: {
            epubContentMode: 'text-only',
            extractionMode: 'text',
            ocrLanguageMode: 'san+hin+eng',
            ocrQuality: 'fast',
            ocrPageSegmentationMode: DEFAULT_OCR_PSM_MODE,
            ocrPreprocessMode: 'none',
            ocrConfidenceThreshold: 20,
            ocrEnableSecondPass: false,
            ocrPreserveInterwordSpaces: DEFAULT_OCR_PRESERVE_SPACING,
            chapterMode: 'smart',
            preserveTextFormatting: true,
            normalizeTextCleanup: true,
            removeStandalonePageNumbers: true,
            stripHeadersFooters: true,
            includePageImages: false,
            pageImageSourceMode: 'embedded',
            pageImageQuality: 'compact',
            pageImageFormat: 'jpeg',
            autoCropPageImages: true,
            includePageMarkers: false,
            embeddedFontProfile: 'noto-serif-devanagari',
            usePdfMetadata: true,
            epubLanguage: 'mul',
            epubFontScalePercent: 100,
            epubLineHeight: 1.6,
            epubMarginPercent: 4,
            epubTextAlign: 'left',
            epubParagraphIndent: 0,
            epubParagraphSpacing: 0.7,
            epubLetterSpacing: 0,
            epubWordSpacing: 0.02,
            epubHyphenation: true,
            layoutRetentionMode: 'flow-first',
            layoutDetectColumns: false,
            layoutKeepLineBreaks: false,
            layoutProtectShortBlocks: false,
            parallelPages: 5,
            ocrWorkerCount: DEFAULT_OCR_WORKER_COUNT,
            epubCompressionMode: 'fast',
            exportConversionReport: true,
        },
    },
    {
        value: 'image-archive',
        label: 'Image archive (visual fidelity)',
        settings: {
            epubContentMode: 'images-only',
            extractionMode: 'auto',
            ocrLanguageMode: 'san+hin+eng',
            ocrQuality: 'balanced',
            ocrPageSegmentationMode: DEFAULT_OCR_PSM_MODE,
            ocrPreprocessMode: DEFAULT_OCR_PREPROCESS_MODE,
            ocrConfidenceThreshold: DEFAULT_OCR_CONFIDENCE_THRESHOLD,
            ocrEnableSecondPass: false,
            ocrPreserveInterwordSpaces: DEFAULT_OCR_PRESERVE_SPACING,
            chapterMode: 'page',
            preserveTextFormatting: true,
            normalizeTextCleanup: true,
            removeStandalonePageNumbers: true,
            stripHeadersFooters: true,
            includePageImages: true,
            pageImageSourceMode: 'snapshot',
            pageImageQuality: 'detailed',
            pageImageFormat: 'jpeg',
            autoCropPageImages: false,
            includePageMarkers: false,
            embeddedFontProfile: 'noto-serif-devanagari',
            usePdfMetadata: true,
            epubLanguage: 'mul',
            epubFontScalePercent: DEFAULT_EPUB_FONT_SCALE_PERCENT,
            epubLineHeight: DEFAULT_EPUB_LINE_HEIGHT,
            epubMarginPercent: DEFAULT_EPUB_MARGIN_PERCENT,
            epubTextAlign: 'justify',
            epubParagraphIndent: 0,
            epubParagraphSpacing: 0.6,
            epubLetterSpacing: 0,
            epubWordSpacing: 0,
            epubHyphenation: false,
            layoutRetentionMode: 'balanced',
            layoutDetectColumns: true,
            layoutKeepLineBreaks: false,
            layoutProtectShortBlocks: true,
            parallelPages: 2,
            ocrWorkerCount: DEFAULT_OCR_WORKER_COUNT,
            epubCompressionMode: 'fast',
            exportConversionReport: true,
        },
    },
];
const EPUB_FONT_OPTIONS = [
    {
        value: 'noto-sans-devanagari',
        label: 'Noto Sans Devanagari (Hindi default)',
        familyName: 'EmbeddedNotoSansDevanagari',
        fileName: 'noto-sans-devanagari-400.woff2',
        importPath: '@fontsource/noto-sans-devanagari/files/noto-sans-devanagari-devanagari-400-normal.woff2?url',
    },
    {
        value: 'noto-serif-devanagari',
        label: 'Noto Serif Devanagari (Sanskrit + Hindi + English)',
        familyName: 'EmbeddedNotoSerifDevanagari',
        fileName: 'noto-serif-devanagari-400.woff2',
        importPath: '@fontsource/noto-serif-devanagari/files/noto-serif-devanagari-devanagari-400-normal.woff2?url',
    },
    {
        value: 'none',
        label: 'No embedded font (system fallback)',
        familyName: '',
        fileName: '',
        importPath: '',
    },
];
const EPUB_FONT_LABELS = Object.fromEntries(EPUB_FONT_OPTIONS.map((option) => [option.value, option.label]));

const READER_THEMES = {
    light: {
        name: 'Paper',
        background: '#fcf8ef',
        text: '#1f2937',
        accent: '#3f3cbb',
        quoteBackground: 'rgba(63, 60, 187, 0.08)',
        chapterDivider: 'rgba(120, 113, 108, 0.35)',
    },
    sepia: {
        name: 'Warm Sepia',
        background: '#f3e7cf',
        text: '#3f2f20',
        accent: '#8b5e34',
        quoteBackground: 'rgba(139, 94, 52, 0.12)',
        chapterDivider: 'rgba(120, 93, 63, 0.4)',
    },
    eink: {
        name: 'E Ink',
        background: '#eff1ea',
        text: '#111827',
        accent: '#4b5563',
        quoteBackground: 'rgba(75, 85, 99, 0.09)',
        chapterDivider: 'rgba(107, 114, 128, 0.45)',
    },
    night: {
        name: 'Night',
        background: '#121722',
        text: '#e5e7eb',
        accent: '#7dd3fc',
        quoteBackground: 'rgba(125, 211, 252, 0.16)',
        chapterDivider: 'rgba(71, 85, 105, 0.65)',
    },
};
const KINDLE_THEME_SHORTCUTS = [
    { id: 'light', label: 'Light', description: 'Bright paper for daylight reading' },
    { id: 'sepia', label: 'Sepia', description: 'Warm, low-glare amber tone' },
    { id: 'night', label: 'Dark', description: 'High-contrast dark mode for low light' },
];
const READER_HIGHLIGHT_PALETTE = [
    { id: 'gold', label: 'Sunbeam', className: 'reader-highlight-gold', swatch: '#facc15' },
    { id: 'mint', label: 'Mint', className: 'reader-highlight-mint', swatch: '#34d399' },
    { id: 'rose', label: 'Blush', className: 'reader-highlight-rose', swatch: '#fb7185' },
    { id: 'violet', label: 'Iris', className: 'reader-highlight-violet', swatch: '#a855f7' },
];
const DEFAULT_HIGHLIGHT_COLOR = READER_HIGHLIGHT_PALETTE[0]?.id ?? 'gold';
const DEFAULT_READING_SPEED = 220;
const DEFAULT_READER_FONT_SIZE = 18;
const DEFAULT_READER_LINE_HEIGHT = 1.7;
const DEFAULT_READER_MARGIN = 8;
const DEFAULT_THEME_BRIGHTNESS = 1;
const DEFAULT_THEME_CONTRAST = 1;
const DEFAULT_THEME_SATURATION = 1;
const DEFAULT_THEME_WARMTH = 0;
const DEFAULT_THEME_TEXTURE = 0.14;
const DEFAULT_THEME_VIGNETTE = 0.08;
const DEFAULT_THEME_CUSTOM_BACKGROUND = '';
const DEFAULT_THEME_CUSTOM_TEXT = '';
const DEFAULT_THEME_CUSTOM_ACCENT = '';
const DEFAULT_READER_FONT_PROFILE = 'moon-serif';
const DEFAULT_READER_TEXT_ALIGN = 'justify';
const DEFAULT_READER_PARAGRAPH_INDENT = 1.05;
const DEFAULT_READER_PARAGRAPH_SPACING = 0.44;
const DEFAULT_READER_LETTER_SPACING = 0.01;
const DEFAULT_READER_WORD_SPACING = 0.04;
const DEFAULT_READER_HYPHENATION = true;
const READER_TEXT_ALIGN_OPTIONS = [
    { id: 'justify', label: 'Justify' },
    { id: 'left', label: 'Left' },
];
const READER_FONT_PROFILES = [
    {
        id: 'moon-serif',
        label: 'Moon Serif',
        family: '"Literata", "Source Serif 4", "Bookerly", "Merriweather", "Noto Serif Devanagari", "Nirmala UI", serif',
    },
    {
        id: 'moon-sans',
        label: 'Moon Sans',
        family: '"Atkinson Hyperlegible", "Inter", "Segoe UI", "Noto Sans Devanagari", "Nirmala UI", sans-serif',
    },
    {
        id: 'moon-classic',
        label: 'Moon Classic',
        family: '"Iowan Old Style", "Palatino Linotype", "Book Antiqua", "Georgia", "Noto Serif Devanagari", serif',
    },
];
const READER_FONT_PROFILE_MAP = new Map(READER_FONT_PROFILES.map((profile) => [profile.id, profile]));
const READER_THEME_SCENES = [
    {
        id: 'kindle-paperwhite',
        label: 'Kindle Paperwhite',
        description: 'Warm white page with crisp contrast and gentle texture.',
        settings: {
            theme: 'light',
            brightness: 1.02,
            contrast: 1.05,
            saturation: 0.96,
            warmth: 0.08,
            texture: 0.11,
            vignette: 0.05,
            customBackground: '#f6f1e4',
            customText: '#1f2329',
            customAccent: '#8b5e34',
        },
    },
    {
        id: 'kindle-dark',
        label: 'Kindle Dark',
        description: 'Low-glare dark palette tuned for night reading.',
        settings: {
            theme: 'night',
            brightness: 0.96,
            contrast: 1.08,
            saturation: 0.92,
            warmth: -0.06,
            texture: 0.08,
            vignette: 0.16,
            customBackground: '#111722',
            customText: '#dde3ec',
            customAccent: '#7dd3fc',
        },
    },
    {
        id: 'moon-sepia-pro',
        label: 'Moon Sepia Pro',
        description: 'Classic Moon+ style sepia with stronger depth and warmth.',
        settings: {
            theme: 'sepia',
            brightness: 1.03,
            contrast: 1.02,
            saturation: 1.04,
            warmth: 0.16,
            texture: 0.2,
            vignette: 0.1,
            customBackground: '#efe4cc',
            customText: '#3d2b18',
            customAccent: '#9a5e2e',
        },
    },
    {
        id: 'moon-amoled',
        label: 'Moon AMOLED',
        description: 'Deep black page with bright text and subdued chroma.',
        settings: {
            theme: 'night',
            brightness: 0.93,
            contrast: 1.15,
            saturation: 0.82,
            warmth: -0.12,
            texture: 0.04,
            vignette: 0.2,
            customBackground: '#090b10',
            customText: '#edf2f7',
            customAccent: '#6ee7f9',
        },
    },
];
const FONT_SIZE_PRESETS = [
    { label: 'Compact', size: 16 },
    { label: 'Standard', size: 18 },
    { label: 'Comfort', size: 20 },
    { label: 'Immersive', size: 22 },
    { label: 'Large', size: 24 },
];
const READING_WIDTH_PRESETS = [
    { label: 'Focused', width: 760 },
    { label: 'Balanced', width: DEFAULT_READING_WIDTH },
    { label: 'Wide', width: 1080 },
];
const READER_EXPERIENCE_PRESETS = [
    {
        id: 'kindle-classic',
        label: 'Kindle Classic',
        description: 'Balanced serif reading with generous breathing room.',
        settings: {
            theme: 'light',
            fontSize: 19,
            lineHeight: 1.75,
            margin: 12,
            readingWidth: 840,
            wpm: 220,
            fontProfile: 'moon-serif',
            textAlign: 'justify',
            paragraphIndent: 1.1,
            paragraphSpacing: 0.42,
            letterSpacing: 0.012,
            wordSpacing: 0.045,
            hyphenation: true,
        },
    },
    {
        id: 'kobo-focused',
        label: 'Kobo Focus',
        description: 'Slightly tighter lines for long sessions and faster scanning.',
        settings: {
            theme: 'sepia',
            fontSize: 18,
            lineHeight: 1.65,
            margin: 10,
            readingWidth: 900,
            wpm: 240,
            fontProfile: 'moon-serif',
            textAlign: 'justify',
            paragraphIndent: 1.0,
            paragraphSpacing: 0.36,
            letterSpacing: 0.008,
            wordSpacing: 0.03,
            hyphenation: true,
        },
    },
    {
        id: 'night-owl',
        label: 'Night Owl',
        description: 'Low-glare dark reading with high contrast text.',
        settings: {
            theme: 'night',
            fontSize: 19,
            lineHeight: 1.75,
            margin: 11,
            readingWidth: 860,
            wpm: 200,
            fontProfile: 'moon-sans',
            textAlign: 'left',
            paragraphIndent: 0.8,
            paragraphSpacing: 0.5,
            letterSpacing: 0.011,
            wordSpacing: 0.03,
            hyphenation: false,
        },
    },
];
const READER_WORKSPACE_FEATURES = [
    { id: 'reading', label: 'Reading', icon: FaBookReader },
    { id: 'rhythm', label: 'Reading rhythm', icon: FaBolt },
    { id: 'toc', label: 'Table of contents', icon: FaListUl },
    { id: 'bookmarks', label: 'Bookmarks', icon: FaBookmark },
    { id: 'highlights', label: 'Highlights', icon: FaHighlighter },
    { id: 'underlines', label: 'Underlines', icon: FaUnderline },
    { id: 'notes', label: 'Notes', icon: FaRegStickyNote },
];
const READER_DEMO_CHAPTERS = [
    {
        id: 'demo-intro',
        label: 'Welcome to Reader Workspace',
        body: [
            'Use this guided demo to preview the reading surface before loading your own EPUB or PDF.',
            'Try selecting text to add highlights, underlines, and notes. Open the control center to tune typography and rhythm.',
        ],
    },
    {
        id: 'demo-rhythm',
        label: 'Reading Rhythm and Flow',
        body: [
            'Set your target pace in words per minute, then combine auto-scroll and focus mode for distraction-free sessions.',
            'Use the progress strip and chapter timeline to keep momentum through long chapters.',
        ],
    },
    {
        id: 'demo-study',
        label: 'Bookmarks, TOC, Highlights, Notes',
        body: [
            'Bookmark key points, jump through the table of contents, and build a revision trail with highlights and underlines.',
            'Add short notes to captured passages so your review context stays attached to the text.',
        ],
    },
];
const READER_DEMO_STORAGE_KEY = 'reader-highlights:workspace-demo';
const READER_DEMO_STATE_KEY = 'ebook-reader-state:workspace-demo';

function getReaderThemeIcon(themeKey) {
    if (themeKey === 'light') return FaSun;
    if (themeKey === 'sepia') return FaTint;
    if (themeKey === 'eink') return FaBookReader;
    return FaMoon;
}

function getReaderPresetAppIcon(presetId) {
    if (presetId === 'kindle-classic') return FaAmazon;
    if (presetId === 'kobo-focused') return FaTabletAlt;
    if (presetId === 'night-owl') return FaMoon;
    return null;
}

function clampNumber(value, min, max) {
    const numeric = Number(value);
    if (!Number.isFinite(numeric)) return min;
    return Math.min(max, Math.max(min, numeric));
}

function numbersApproximatelyMatch(a, b, epsilon = 0.0001) {
    return Math.abs(Number(a) - Number(b)) <= epsilon;
}

function sanitizeHexColor(value) {
    if (typeof value !== 'string') return '';
    const normalized = value.trim().toLowerCase();
    return /^#(?:[0-9a-f]{3}|[0-9a-f]{6})$/i.test(normalized) ? normalized : '';
}

function escapeXml(value) {
    return String(value ?? '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&apos;');
}

function normalizeZipPath(value) {
    const segments = String(value ?? '')
        .replace(/\\/g, '/')
        .split('/')
        .filter(Boolean);
    const stack = [];
    segments.forEach((segment) => {
        if (segment === '.') return;
        if (segment === '..') {
            stack.pop();
            return;
        }
        stack.push(segment);
    });
    return stack.join('/');
}

function resolveZipPath(value, baseDir = '') {
    if (!value) return '';
    const sanitized = value.startsWith('/') ? value.slice(1) : value;
    const combined = baseDir ? `${baseDir}/${sanitized}` : sanitized;
    return normalizeZipPath(combined);
}

const EPUB_MEDIA_TYPE_BY_EXTENSION = {
    avif: 'image/avif',
    bmp: 'image/bmp',
    css: 'text/css',
    gif: 'image/gif',
    heic: 'image/heic',
    heif: 'image/heif',
    jpeg: 'image/jpeg',
    jpg: 'image/jpeg',
    m4a: 'audio/mp4',
    m4v: 'video/mp4',
    mp3: 'audio/mpeg',
    mp4: 'video/mp4',
    oga: 'audio/ogg',
    ogg: 'audio/ogg',
    opus: 'audio/ogg',
    png: 'image/png',
    svg: 'image/svg+xml',
    ttf: 'font/ttf',
    wav: 'audio/wav',
    webm: 'video/webm',
    webp: 'image/webp',
    woff: 'font/woff',
    woff2: 'font/woff2',
};

function inferEpubMediaTypeFromPath(path) {
    const normalized = String(path || '').split('?')[0].split('#')[0];
    const ext = normalized.includes('.') ? normalized.split('.').pop().toLowerCase() : '';
    return EPUB_MEDIA_TYPE_BY_EXTENSION[ext] || 'application/octet-stream';
}

function splitResourceReference(value) {
    const reference = String(value || '').trim();
    if (!reference) return { path: '', suffix: '' };
    const hashIndex = reference.indexOf('#');
    const queryIndex = reference.indexOf('?');
    let splitIndex = -1;
    if (hashIndex >= 0 && queryIndex >= 0) {
        splitIndex = Math.min(hashIndex, queryIndex);
    } else if (hashIndex >= 0) {
        splitIndex = hashIndex;
    } else if (queryIndex >= 0) {
        splitIndex = queryIndex;
    }
    if (splitIndex < 0) {
        return { path: reference, suffix: '' };
    }
    return {
        path: reference.slice(0, splitIndex),
        suffix: reference.slice(splitIndex),
    };
}

function isExternalResourceReference(value) {
    const reference = String(value || '').trim().toLowerCase();
    if (!reference) return true;
    if (
        reference.startsWith('#')
        || reference.startsWith('data:')
        || reference.startsWith('blob:')
        || reference.startsWith('//')
        || reference.startsWith('mailto:')
        || reference.startsWith('tel:')
        || reference.startsWith('javascript:')
    ) {
        return true;
    }
    return /^[a-z][a-z0-9+\-.]*:/i.test(reference);
}

function safeDecodeUriComponent(value) {
    try {
        return decodeURIComponent(value);
    } catch (error) {
        return value;
    }
}

function getZipFileEntry(zip, resolvedPath) {
    if (!zip || !resolvedPath) return null;
    const candidates = [
        resolvedPath,
        safeDecodeUriComponent(resolvedPath),
    ];
    const unique = Array.from(new Set(candidates.filter(Boolean)));
    for (const candidate of unique) {
        const entry = zip.file(candidate);
        if (entry) return entry;
    }
    return null;
}

async function resolveEpubResourceDataUrl({
    zip,
    baseDir,
    reference,
    mediaTypeByPath,
    cache,
}) {
    const rawReference = String(reference || '').trim();
    if (!rawReference || isExternalResourceReference(rawReference)) {
        return null;
    }
    const { path, suffix } = splitResourceReference(rawReference);
    if (!path) return null;
    const resolvedPath = resolveZipPath(path, baseDir);
    if (!resolvedPath) return null;
    if (cache.has(resolvedPath)) {
        const cached = cache.get(resolvedPath);
        return cached ? `${cached}${suffix}` : null;
    }

    const entry = getZipFileEntry(zip, resolvedPath);
    if (!entry) {
        cache.set(resolvedPath, '');
        return null;
    }

    try {
        const mediaType = mediaTypeByPath.get(resolvedPath) || inferEpubMediaTypeFromPath(resolvedPath);
        const base64 = await entry.async('base64');
        const dataUrl = `data:${mediaType};base64,${base64}`;
        cache.set(resolvedPath, dataUrl);
        return `${dataUrl}${suffix}`;
    } catch (error) {
        cache.set(resolvedPath, '');
        return null;
    }
}

async function rewriteCssUrlReferences(cssText, resolveReference) {
    const source = String(cssText || '');
    if (!source || !/url\(/i.test(source)) return source;
    const regex = /url\((['"]?)([^'")]+)\1\)/gi;
    let output = '';
    let lastIndex = 0;

    for (const match of source.matchAll(regex)) {
        const start = match.index ?? 0;
        const end = start + match[0].length;
        output += source.slice(lastIndex, start);
        const quote = match[1] || '\'';
        const reference = match[2]?.trim() || '';
        const rewritten = await resolveReference(reference);
        if (rewritten) {
            output += `url(${quote}${rewritten}${quote})`;
        } else {
            output += match[0];
        }
        lastIndex = end;
    }

    output += source.slice(lastIndex);
    return output;
}

async function rewriteSrcsetValue(srcset, resolveReference) {
    const source = String(srcset || '').trim();
    if (!source) return source;
    const segments = source.split(',').map((segment) => segment.trim()).filter(Boolean);
    if (!segments.length) return source;

    const rewritten = await Promise.all(segments.map(async (segment) => {
        const match = segment.match(/^(\S+)(\s+.+)?$/);
        const resource = match?.[1] || segment;
        const descriptor = match?.[2] || '';
        const updated = await resolveReference(resource);
        return updated ? `${updated}${descriptor}` : segment;
    }));

    return rewritten.join(', ');
}

async function rewriteEpubChapterResources({
    chapterDoc,
    chapterPath,
    zip,
    mediaTypeByPath,
    cache,
}) {
    if (!chapterDoc) return '';
    const baseDir = String(chapterPath || '').split('/').slice(0, -1).join('/');
    const resolveReference = (value) => resolveEpubResourceDataUrl({
        zip,
        baseDir,
        reference: value,
        mediaTypeByPath,
        cache,
    });

    const rewriteAttribute = async (selector, attribute) => {
        const nodes = Array.from(chapterDoc.querySelectorAll(selector));
        for (const node of nodes) {
            const value = node.getAttribute(attribute);
            if (!value) continue;
            const rewritten = await resolveReference(value);
            if (rewritten) {
                node.setAttribute(attribute, rewritten);
            }
        }
    };

    await rewriteAttribute('img[src]', 'src');
    await rewriteAttribute('video[src]', 'src');
    await rewriteAttribute('audio[src]', 'src');
    await rewriteAttribute('source[src]', 'src');
    await rewriteAttribute('video[poster]', 'poster');
    await rewriteAttribute('image[href]', 'href');
    await rewriteAttribute('use[href]', 'href');
    await rewriteAttribute('object[data]', 'data');
    await rewriteAttribute('embed[src]', 'src');

    const allNodes = Array.from(chapterDoc.querySelectorAll('*'));
    for (const node of allNodes) {
        if (!node.hasAttribute('xlink:href')) continue;
        const value = node.getAttribute('xlink:href');
        if (!value) continue;
        const rewritten = await resolveReference(value);
        if (rewritten) {
            node.setAttribute('xlink:href', rewritten);
        }
    }

    const srcsetNodes = Array.from(chapterDoc.querySelectorAll('[srcset]'));
    for (const node of srcsetNodes) {
        const srcset = node.getAttribute('srcset');
        if (!srcset) continue;
        const rewritten = await rewriteSrcsetValue(srcset, resolveReference);
        if (rewritten && rewritten !== srcset) {
            node.setAttribute('srcset', rewritten);
        }
    }

    const styleNodes = Array.from(chapterDoc.querySelectorAll('[style]'));
    for (const node of styleNodes) {
        const styleValue = node.getAttribute('style');
        if (!styleValue || !/url\(/i.test(styleValue)) continue;
        const rewritten = await rewriteCssUrlReferences(styleValue, resolveReference);
        if (rewritten !== styleValue) {
            node.setAttribute('style', rewritten);
        }
    }

    const embeddedStyleNodes = Array.from(chapterDoc.querySelectorAll('style'));
    for (const node of embeddedStyleNodes) {
        const cssText = node.textContent || '';
        if (!cssText || !/url\(/i.test(cssText)) continue;
        const rewritten = await rewriteCssUrlReferences(cssText, resolveReference);
        if (rewritten !== cssText) {
            node.textContent = rewritten;
        }
    }

    return chapterDoc.body?.innerHTML?.trim() || '';
}

function buildReaderStorageKey(file) {
    if (!file) return '';
    const fingerprint = `${file.name || 'book'}|${file.size || 0}|${file.lastModified || 0}`;
    return `ebook-reader-highlights:${encodeURIComponent(fingerprint)}`;
}

function buildReaderStateKey(file) {
    if (!file) return '';
    const fingerprint = `${file.name || 'book'}|${file.size || 0}|${file.lastModified || 0}`;
    return `ebook-reader-state:${encodeURIComponent(fingerprint)}`;
}

function normalizeStoredHighlight(item) {
    if (!item || typeof item !== 'object') return null;
    const id = typeof item.id === 'string' && item.id ? item.id : `highlight-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const color = typeof item.color === 'string' && item.color ? item.color : DEFAULT_HIGHLIGHT_COLOR;
    const kind = item.kind === 'underline' ? 'underline' : 'highlight';
    const startOffset = Number.isFinite(item.startOffset) ? item.startOffset : null;
    const endOffset = Number.isFinite(item.endOffset) ? item.endOffset : null;
    return {
        id,
        text: typeof item.text === 'string' ? item.text : '',
        color,
        note: typeof item.note === 'string' ? item.note : '',
        kind,
        locationId: typeof item.locationId === 'string' ? item.locationId : '',
        startOffset,
        endOffset,
        createdAt: Number.isFinite(item.createdAt) ? item.createdAt : Date.now(),
    };
}

function normalizeStoredReaderState(value) {
    if (!value || typeof value !== 'object') return null;
    const theme = Object.keys(READER_THEMES).includes(value.theme) ? value.theme : 'light';
    const brightness = Number.isFinite(value.brightness)
        ? clampNumber(value.brightness, 0.75, 1.3)
        : DEFAULT_THEME_BRIGHTNESS;
    const contrast = Number.isFinite(value.contrast)
        ? clampNumber(value.contrast, 0.75, 1.35)
        : DEFAULT_THEME_CONTRAST;
    const saturation = Number.isFinite(value.saturation)
        ? clampNumber(value.saturation, 0.7, 1.4)
        : DEFAULT_THEME_SATURATION;
    const warmth = Number.isFinite(value.warmth)
        ? clampNumber(value.warmth, -0.2, 0.3)
        : DEFAULT_THEME_WARMTH;
    const texture = Number.isFinite(value.texture)
        ? clampNumber(value.texture, 0, 0.4)
        : DEFAULT_THEME_TEXTURE;
    const vignette = Number.isFinite(value.vignette)
        ? clampNumber(value.vignette, 0, 0.32)
        : DEFAULT_THEME_VIGNETTE;
    const customBackground = sanitizeHexColor(value.customBackground);
    const customText = sanitizeHexColor(value.customText);
    const customAccent = sanitizeHexColor(value.customAccent);
    const fontSize = Number.isFinite(value.fontSize) ? clampNumber(value.fontSize, 12, 28) : DEFAULT_READER_FONT_SIZE;
    const lineHeight = Number.isFinite(value.lineHeight) ? clampNumber(value.lineHeight, 1.2, 2.2) : DEFAULT_READER_LINE_HEIGHT;
    const margin = Number.isFinite(value.margin) ? clampNumber(value.margin, 4, 24) : DEFAULT_READER_MARGIN;
    const readingWidth = Number.isFinite(value.readingWidth) ? clampNumber(value.readingWidth, 640, 1200) : DEFAULT_READING_WIDTH;
    const wpm = Number.isFinite(value.wpm) ? clampNumber(value.wpm, 120, 520) : DEFAULT_READING_SPEED;
    const fontProfile = READER_FONT_PROFILE_MAP.has(value.fontProfile) ? value.fontProfile : DEFAULT_READER_FONT_PROFILE;
    const textAlign = READER_TEXT_ALIGN_OPTIONS.some((option) => option.id === value.textAlign)
        ? value.textAlign
        : DEFAULT_READER_TEXT_ALIGN;
    const paragraphIndent = Number.isFinite(value.paragraphIndent)
        ? clampNumber(value.paragraphIndent, 0, 2.2)
        : DEFAULT_READER_PARAGRAPH_INDENT;
    const paragraphSpacing = Number.isFinite(value.paragraphSpacing)
        ? clampNumber(value.paragraphSpacing, 0.1, 1.6)
        : DEFAULT_READER_PARAGRAPH_SPACING;
    const letterSpacing = Number.isFinite(value.letterSpacing)
        ? clampNumber(value.letterSpacing, -0.01, 0.08)
        : DEFAULT_READER_LETTER_SPACING;
    const wordSpacing = Number.isFinite(value.wordSpacing)
        ? clampNumber(value.wordSpacing, -0.02, 0.16)
        : DEFAULT_READER_WORD_SPACING;
    const hyphenation = typeof value.hyphenation === 'boolean'
        ? value.hyphenation
        : DEFAULT_READER_HYPHENATION;
    return {
        theme,
        brightness,
        contrast,
        saturation,
        warmth,
        texture,
        vignette,
        customBackground,
        customText,
        customAccent,
        fontSize,
        lineHeight,
        margin,
        readingWidth,
        wpm,
        fontProfile,
        textAlign,
        paragraphIndent,
        paragraphSpacing,
        letterSpacing,
        wordSpacing,
        hyphenation,
        scrollTop: Number.isFinite(value.scrollTop) ? value.scrollTop : null,
        activeLocation: typeof value.activeLocation === 'string' ? value.activeLocation : '',
        focusMode: Boolean(value.focusMode),
    };
}

const getTextNodes = (container) => {
    const walker = document.createTreeWalker(container, NodeFilter.SHOW_TEXT, null);
    const nodes = [];
    while (walker.nextNode()) {
        nodes.push(walker.currentNode);
    }
    return nodes;
};

const createRangeFromOffsets = (container, start, end) => {
    if (!container || start >= end) return null;
    const nodes = getTextNodes(container);
    if (!nodes.length) return null;

    const range = document.createRange();
    let charIndex = 0;
    let startNode = null;
    let startOffset = 0;
    let endNode = null;
    let endOffset = 0;

    for (const node of nodes) {
        const content = node.textContent || '';
        const nodeLength = content.length;
        const nodeStart = charIndex;
        const nodeEnd = nodeStart + nodeLength;

        if (!startNode && start >= nodeStart && start <= nodeEnd) {
            startNode = node;
            startOffset = Math.min(Math.max(start - nodeStart, 0), nodeLength);
        }

        if (!endNode && end >= nodeStart && end <= nodeEnd) {
            endNode = node;
            endOffset = Math.min(Math.max(end - nodeStart, 0), nodeLength);
        }

        if (startNode && endNode) {
            break;
        }

        charIndex = nodeEnd;
    }

    if (!startNode || !endNode) {
        return null;
    }

    try {
        range.setStart(startNode, startOffset);
        range.setEnd(endNode, endOffset);
        return range;
    } catch (error) {
        console.error('Failed to create range from offsets', error);
        return null;
    }
};

const getOffsetsFromRange = (container, range) => {
    if (!container || !range) return null;
    const nodes = getTextNodes(container);
    if (!nodes.length) return null;
    let charIndex = 0;
    let start = null;
    let end = null;

    for (const node of nodes) {
        const content = node.textContent || '';
        const nodeLength = content.length;
        if (start === null && node === range.startContainer) {
            start = charIndex + range.startOffset;
        }
        if (end === null && node === range.endContainer) {
            end = charIndex + range.endOffset;
        }
        charIndex += nodeLength;
        if (start !== null && end !== null) break;
    }

    if (start === null || end === null || start >= end) {
        const fullText = container.textContent || '';
        const snippet = range.toString();
        if (snippet) {
            const index = fullText.indexOf(snippet);
            if (index >= 0) {
                return { start: index, end: index + snippet.length };
            }
        }
        return null;
    }

    return { start, end };
};

function toSafeFilename(value) {
    const cleaned = normalizeHindiUnicodeText(value)
        .replace(/[\\/:*?"<>|]/g, ' ')
        .replace(/[^\u0900-\u097FA-Za-z0-9\s._-]/g, '')
        .trim()
        .replace(/\s+/g, '-')
        .replace(/[-_.]{2,}/g, '-')
        .replace(/^[-_.]+|[-_.]+$/g, '');
    return cleaned || 'hindi-pdf-epub';
}

const BULLET_LIST_PATTERN = /^[\u2022\u2023\u2043\u2219\u25E6\u25AA\u25CF•●▪◦\-*]\s+/;
const ORDERED_LIST_PATTERN = /^(\(?[0-9\u0966-\u096F]{1,3}[.)]|\(?[A-Za-z][.)]|\(?[ivxlcdmIVXLCDM]{1,6}[.)])\s+/;
const HEADING_HINT_PATTERN = /^(?:chapter|section|part)\b|^(?:अध्याय|प्रकरण|भाग|अनुभाग)(?:\s|$)/i;
const DEVANAGARI_DIACRITIC_PATTERN = /^[\u093a-\u094d\u0951-\u0957\u0962\u0963]/;
const LEADING_PUNCTUATION_PATTERN = /^[,.;:?!।)\]}]/;
const TRAILING_PUNCTUATION_PATTERN = /[([{\-–—/]$/;
const DEWANAGARI_OR_LATIN_ALNUM_PATTERN = /[\u0900-\u097FA-Za-z0-9\u0966-\u096F]$/;
const PAGE_NUMBER_TOKEN = '(?:[0-9\\u0966-\\u096F]{1,4}|[ivxlcdm]{1,8})';
const STANDALONE_PAGE_NUMBER_PATTERN = new RegExp(
    `^(?:[[(]\\s*)?(?:page\\s*)?${PAGE_NUMBER_TOKEN}(?:\\s*(?:\\]|\\)))?$|^[–—-]*\\s*${PAGE_NUMBER_TOKEN}\\s*[–—-]*$`,
    'iu',
);
/* eslint-disable no-misleading-character-class */
// Explicit map of legacy Devanagari-like glyphs that need one-to-one replacement.
const LEGACY_GLYPH_CHAR_PATTERN = /[ᭃ᭄ᭅ᭍᭜᭟᭠᭣᭥᭬᭫᭭ᮕᮢᮧ᮰ᱟᱠᱧᱫᱭᱶᱹᲂᲦᲨᲯ᳇᳍᳤᳥᳖᳙᳞ᳩᳯᳰᳱ]/gu;
const HAS_LEGACY_GLYPH_PATTERN = /[ᭃ᭄ᭅ᭍᭜᭟᭠᭣᭥᭬᭫᭭ᮕᮢᮧ᮰ᱟᱠᱧᱫᱭᱶᱹᲂᲦᲨᲯ᳇᳍᳤᳥᳖᳙᳞ᳩᳯᳰᳱ]/u;
/* eslint-enable no-misleading-character-class */
const LEGACY_GLYPH_REPLACEMENTS = {
    'ᭃ': 'क्ष',
    '᭄': 'ज्ञ',
    '᭍': 'क्',
    '᭜': 'त्',
    '᭟': 'ध्',
    '᭠': 'न्',
    '᭣': 'ब्',
    '᭥': 'म्',
    '᭫': 'श्',
    '᭬': 'ष्',
    '᭭': 'स्',
    'ᮕ': 'ग्र',
    'ᮢ': 'त्र',
    'ᮧ': 'प्र',
    '᮰': 'श्र',
    'ᱟ': 'हु',
    'ᱠ': 'हू',
    'ᱧ': 'रु',
    'ᱫ': 'त्त',
    'ᱭ': 'ीं',
    'ᱶ': 'ें',
    'ᱹ': 'ैं',
    'ᲂ': 'ों',
    'Ღ': 'क्त',
    'Შ': 'ग्न',
    'Ჯ': 'ज्ज',
    '᳇': 'द्व',
    '᳍': 'द्ध',
    '᳖': 'न्न',
    '᳙': 'प्त',
    '᳞': 'व्य',
    '᳤': 'श्न',
    '᳥': 'ष्ट',
    'ᳩ': 'स्न',
    'ᳯ': '',
    'ᳱ': 'ी',
};

function repairLegacyGlyphText(value) {
    let repaired = String(value ?? '');
    if (!HAS_LEGACY_GLYPH_PATTERN.test(repaired)) {
        return repaired;
    }

    repaired = repaired
        .replace(/ᳰ([\u0900-\u097F])/g, '$1ि')
        .replace(/᳞\s*िᲦ/g, 'व्यक्ति')
        .replace(/िᲦ/g, 'क्ति')
        .replace(/ि᳥/g, 'ष्टि')
        .replace(/ᱠँ/g, 'हूँ')
        .replace(/([ऀ-ॿ])ᭅ/g, 'र्$1')
        .replace(LEGACY_GLYPH_CHAR_PATTERN, (character) => LEGACY_GLYPH_REPLACEMENTS[character] ?? character)
        .replace(/[‘’]/g, '"')
        .replace(/्\s+([ऀ-ॿ])/g, '्$1');

    return repaired;
}

function normalizeHindiUnicodeText(value) {
    const cleaned = repairLegacyGlyphText(String(value ?? ''))
        .replace(/\r\n?/g, '\n')
        .replace(/[\u00A0\u2007\u202F]/g, ' ')
        .replace(/\p{Cc}/gu, '');
    try {
        return cleaned.normalize('NFC');
    } catch (error) {
        return cleaned;
    }
}

function cleanInlineSpacing(value) {
    return normalizeHindiUnicodeText(value)
        .replace(/[ \t]+/g, ' ')
        .replace(/\s+([,.;:?!।])/g, '$1')
        .replace(/([([{])\s+/g, '$1')
        .replace(/\s+([)\]}])/g, '$1')
        .trim();
}

function medianValue(values) {
    if (!Array.isArray(values) || !values.length) return null;
    const sorted = [...values].filter((value) => Number.isFinite(value)).sort((a, b) => a - b);
    if (!sorted.length) return null;
    const middleIndex = Math.floor(sorted.length / 2);
    if (sorted.length % 2 === 0) {
        return (sorted[middleIndex - 1] + sorted[middleIndex]) / 2;
    }
    return sorted[middleIndex];
}

function looksLikeBoldStyle(rawStyleText) {
    return /bold|black|heavy|semibold|demibold/.test(String(rawStyleText ?? '').toLowerCase());
}

function looksLikeItalicStyle(rawStyleText) {
    return /italic|oblique|kursiv|slant/.test(String(rawStyleText ?? '').toLowerCase());
}

function getLastNonWhitespaceCharacter(value) {
    for (let index = value.length - 1; index >= 0; index -= 1) {
        const character = value[index];
        if (!/\s/.test(character)) {
            return character;
        }
    }
    return '';
}

function getFirstNonWhitespaceCharacter(value) {
    for (let index = 0; index < value.length; index += 1) {
        const character = value[index];
        if (!/\s/.test(character)) {
            return character;
        }
    }
    return '';
}

function shouldAddSpacingBetweenTokens(previousText, nextText, horizontalGap, fontSize) {
    const previousLast = getLastNonWhitespaceCharacter(String(previousText ?? ''));
    const nextFirst = getFirstNonWhitespaceCharacter(String(nextText ?? ''));
    if (!previousLast || !nextFirst) return false;
    if (LEADING_PUNCTUATION_PATTERN.test(nextFirst) || TRAILING_PUNCTUATION_PATTERN.test(previousLast)) {
        return false;
    }
    if (DEVANAGARI_DIACRITIC_PATTERN.test(nextFirst)) {
        return false;
    }
    if (!DEWANAGARI_OR_LATIN_ALNUM_PATTERN.test(previousLast)) {
        return false;
    }

    const effectiveGap = Number.isFinite(horizontalGap) ? horizontalGap : 0;
    const threshold = Math.max(0.4, Math.min(6, (Number.isFinite(fontSize) ? fontSize : 12) * 0.16));
    return effectiveGap > threshold;
}

function normalizeLineRecord(line, index = 0) {
    if (typeof line === 'string') {
        const text = cleanInlineSpacing(line);
        return text ? {
            text,
            y: -index,
            x: 0,
            fontSize: 12,
            isBold: false,
        } : null;
    }

    const text = cleanInlineSpacing(line?.text ?? '');
    if (!text) return null;
    return {
        text,
        y: Number.isFinite(line?.y) ? Number(line.y) : -index,
        x: Number.isFinite(line?.x) ? Number(line.x) : 0,
        fontSize: Number.isFinite(line?.fontSize) ? Number(line.fontSize) : 12,
        isBold: Boolean(line?.isBold),
        isItalic: Boolean(line?.isItalic),
    };
}

function buildLineRecordsFromPlainText(text) {
    return normalizeHindiUnicodeText(text)
        .split('\n')
        .map((line, index) => normalizeLineRecord(line, index))
        .filter(Boolean);
}

function parseListLine(text) {
    const normalized = cleanInlineSpacing(text);
    if (!normalized) return null;

    const bulletMatch = normalized.match(BULLET_LIST_PATTERN);
    if (bulletMatch) {
        const content = cleanInlineSpacing(normalized.slice(bulletMatch[0].length));
        return content ? { ordered: false, content } : null;
    }

    const orderedMatch = normalized.match(ORDERED_LIST_PATTERN);
    if (orderedMatch) {
        const content = cleanInlineSpacing(normalized.slice(orderedMatch[0].length));
        return content ? { ordered: true, content } : null;
    }

    return null;
}

function looksLikeHeadingText(text, meta = {}, medianFontSize = 12) {
    const normalized = cleanInlineSpacing(text);
    if (!normalized) return false;
    if (parseListLine(normalized)) return false;

    const length = normalized.length;
    if (length > 140) return false;

    const fontSize = Number.isFinite(meta?.fontSize) ? meta.fontSize : medianFontSize;
    const isBold = Boolean(meta?.isBold);
    const hasHeadingKeyword = HEADING_HINT_PATTERN.test(normalized);
    const fontLooksLarge = fontSize >= medianFontSize * 1.18;
    const boldShortLine = isBold && length <= 90 && fontSize >= medianFontSize * 1.02;
    const likelySentence = /[।.!?]$/.test(normalized) && length > 60;

    return (hasHeadingKeyword || fontLooksLarge || boldShortLine) && !likelySentence;
}

function mergeParagraphLines(lines) {
    if (!lines.length) return '';
    let merged = String(lines[0] ?? '');
    for (let index = 1; index < lines.length; index += 1) {
        const nextLine = String(lines[index] ?? '');
        if (!nextLine) continue;
        if (/-$/.test(merged) && /^[^\s-]/.test(nextLine)) {
            merged = `${merged.slice(0, -1)}${nextLine}`;
        } else {
            merged = `${merged} ${nextLine}`;
        }
    }
    return cleanInlineSpacing(merged);
}

function reorderLinesByColumns(lines, behavior = {}) {
    if (!Array.isArray(lines) || !lines.length || !behavior.enableColumnDetection) {
        return lines;
    }

    const safeLines = lines.filter((line) => Number.isFinite(line?.x) && Number.isFinite(line?.y));
    if (safeLines.length < 4) {
        return lines;
    }

    const xs = [...new Set(safeLines.map((line) => line.x))].sort((a, b) => a - b);
    if (xs.length < 3) {
        return lines;
    }

    const gaps = xs.slice(1).map((value, index) => value - xs[index]);
    const maxGap = Math.max(...gaps);
    const gapIndex = gaps.indexOf(maxGap);
    const span = xs[xs.length - 1] - xs[0];
    const gapThreshold = Math.max(
        behavior.columnGapMin ?? 36,
        (behavior.columnGapFactor ?? 0.3) * Math.max(40, span),
    );
    if (!(maxGap >= gapThreshold && gapIndex >= 0)) {
        return lines;
    }

    const splitAt = (xs[gapIndex] + xs[gapIndex + 1]) / 2;
    const left = [];
    const right = [];

    safeLines.forEach((line) => {
        if (line.x <= splitAt) {
            left.push(line);
        } else {
            right.push(line);
        }
    });

    const sortLines = (arr) => arr.sort((a, b) => {
        const yDelta = b.y - a.y;
        if (Math.abs(yDelta) > 0.8) return yDelta;
        return a.x - b.x;
    });

    return [...sortLines(left), ...sortLines(right)];
}

function wrapTextWithInlineStyles(text, meta = {}) {
    const escaped = escapeXml(text);
    const bold = Boolean(meta?.isBold);
    const italic = Boolean(meta?.isItalic);
    if (bold && italic) {
        return `<strong><em>${escaped}</em></strong>`;
    }
    if (bold) {
        return `<strong>${escaped}</strong>`;
    }
    if (italic) {
        return `<em>${escaped}</em>`;
    }
    return escaped;
}

function getEpubHeadingTag(level) {
    if (level <= 1) return 'h1';
    if (level === 2) return 'h2';
    return 'h3';
}

function buildHeadingId(text, level, counterMap) {
    const baseId = toSafeNavigationId(text, `${getEpubHeadingTag(level)}-section`);
    if (!counterMap) return baseId;
    const count = counterMap.get(baseId) ?? 0;
    const next = count + 1;
    counterMap.set(baseId, next);
    return next === 1 ? baseId : `${baseId}-${next}`;
}

function buildHeadingMarkup(text, level, meta = {}, counterMap = null) {
    const tagName = getEpubHeadingTag(level);
    const id = buildHeadingId(text, level, counterMap);
    const styled = wrapTextWithInlineStyles(text, meta);
    return id ? `<${tagName} id="${id}">${styled}</${tagName}>` : `<${tagName}>${styled}</${tagName}>`;
}

function removeTrailingHyphenFromMarkup(value) {
    if (!value) return value;
    return value.replace(/-(?=(?:<\/strong>|<\/em>)*$)/, '');
}

function renderParagraphLinesWithStyles(lines = []) {
    if (!Array.isArray(lines) || !lines.length) return '';
    const parts = [];
    let previousRaw = '';

    lines.forEach((line, index) => {
        const raw = cleanInlineSpacing(line?.text ?? '');
        if (!raw) return;
        const styled = wrapTextWithInlineStyles(raw, line?.meta);
        const joinTight = index > 0 && /-$/.test(previousRaw) && /^[^\s-]/.test(raw);

        if (joinTight) {
            if (parts.length) {
                parts[parts.length - 1] = removeTrailingHyphenFromMarkup(parts[parts.length - 1]);
            }
            parts.push(styled);
        } else {
            if (parts.length) {
                parts.push(' ');
            }
            parts.push(styled);
        }

        previousRaw = raw;
    });

    const mergedMarkup = parts.join('');
    return mergedMarkup ? `<p>${mergedMarkup}</p>` : '';
}

function buildStructuredTextMarkup(text, lineMetadata = [], layoutOptions = {}, headingCounter = null) {
    const {
        preferLineBreaks = false,
        wrapMergeMinChars = 30,
        protectShortLines = true,
        paragraphGapMultiplier = 1.55,
        enableColumnDetection = false,
        columnGapMin = 36,
        columnGapFactor = 0.3,
    } = layoutOptions;

    const normalizedText = normalizeExtractedHindiText(text, {
        preferLineBreaks,
        wrapMergeMinChars,
        protectShortBlocks: protectShortLines,
    });
    if (!normalizedText.trim()) return '';

    const normalizedMetadata = Array.isArray(lineMetadata)
        ? lineMetadata.map((line, index) => normalizeLineRecord(line, index)).filter(Boolean)
        : [];
    const columnAwareMetadata = reorderLinesByColumns(normalizedMetadata, {
        enableColumnDetection,
        columnGapMin,
        columnGapFactor,
    });
    const metadataQueues = new Map();
    columnAwareMetadata.forEach((line, index) => {
        const key = line.text;
        if (!metadataQueues.has(key)) {
            metadataQueues.set(key, []);
        }
        metadataQueues.get(key).push({
            ...line,
            order: index,
        });
    });

    const sourceLines = normalizedText
        .split('\n')
        .map((line) => line.trim())
        .map((line) => {
            if (!line) {
                return {
                    text: '',
                    meta: null,
                };
            }
            const queue = metadataQueues.get(line);
            const meta = Array.isArray(queue) && queue.length ? queue.shift() : null;
            return {
                text: line,
                meta,
            };
        });

    const textLines = sourceLines.filter((line) => line.text);
    if (!textLines.length) return '';

    const medianFontSize = medianValue(textLines.map((line) => line.meta?.fontSize).filter(Number.isFinite)) ?? 12;
    const yGaps = [];
    for (let index = 1; index < textLines.length; index += 1) {
        const previous = textLines[index - 1];
        const current = textLines[index];
        if (Number.isFinite(previous.meta?.y) && Number.isFinite(current.meta?.y)) {
            yGaps.push(Math.abs(previous.meta.y - current.meta.y));
        }
    }
    const medianGap = medianValue(yGaps);
    const paragraphGapThreshold = Number.isFinite(medianGap)
        ? Math.max(medianGap * paragraphGapMultiplier, medianFontSize * 0.9)
        : null;

    const blocks = [];
    let paragraphBuffer = [];
    let listBuffer = null;
    let previousLine = null;

    const flushParagraph = () => {
        if (!paragraphBuffer.length) return;
        const paragraph = mergeParagraphLines(paragraphBuffer.map((entry) => entry.text));
        if (paragraph) {
            blocks.push({
                type: 'paragraph',
                text: paragraph,
                lines: paragraphBuffer.slice(),
            });
        }
        paragraphBuffer = [];
    };

    const flushList = () => {
        if (!listBuffer || !Array.isArray(listBuffer.items) || !listBuffer.items.length) {
            listBuffer = null;
            return;
        }
        blocks.push({
            type: 'list',
            ordered: listBuffer.ordered,
            items: listBuffer.items.map((item) => cleanInlineSpacing(item)).filter(Boolean),
        });
        listBuffer = null;
    };

    sourceLines.forEach((line) => {
        if (!line.text) {
            flushParagraph();
            flushList();
            previousLine = null;
            return;
        }

        const listMatch = parseListLine(line.text);
        const isHeading = looksLikeHeadingText(line.text, line.meta, medianFontSize);

        if (isHeading) {
            flushParagraph();
            flushList();
            const headingLevel = Number.isFinite(line.meta?.fontSize) && line.meta.fontSize >= medianFontSize * 1.4 ? 2 : 3;
            blocks.push({
                type: 'heading',
                level: headingLevel,
                text: line.text,
                meta: line.meta,
            });
            previousLine = line;
            return;
        }

        if (listMatch) {
            flushParagraph();
            if (!listBuffer || listBuffer.ordered !== listMatch.ordered) {
                flushList();
                listBuffer = {
                    ordered: listMatch.ordered,
                    items: [],
                };
            }
            listBuffer.items.push(listMatch.content);
            previousLine = line;
            return;
        }

        flushList();
        if (paragraphBuffer.length && previousLine && paragraphGapThreshold !== null) {
            const previousY = previousLine.meta?.y;
            const currentY = line.meta?.y;
            if (Number.isFinite(previousY) && Number.isFinite(currentY)) {
                const gap = Math.abs(previousY - currentY);
                if (gap > paragraphGapThreshold) {
                    flushParagraph();
                }
            }
        }

        paragraphBuffer.push(line);
        previousLine = line;
    });

    flushParagraph();
    flushList();

    if (!blocks.length) {
        return `<p>${escapeXml(normalizedText).replace(/\n/g, '<br />')}</p>`;
    }

    return blocks.map((block) => {
        if (block.type === 'heading') {
            return buildHeadingMarkup(block.text, block.level, block.meta, headingCounter);
        }
        if (block.type === 'list') {
            const tagName = block.ordered ? 'ol' : 'ul';
            const items = block.items.map((item) => `<li>${escapeXml(item)}</li>`).join('');
            return `<${tagName}>${items}</${tagName}>`;
        }
        if (Array.isArray(block.lines) && block.lines.length) {
            const markup = renderParagraphLinesWithStyles(block.lines);
            if (markup) return markup;
        }
        return `<p>${escapeXml(block.text)}</p>`;
    }).join('\n');
}

function buildSimpleParagraphMarkup(pageText, layoutOptions = {}) {
    const normalized = normalizeExtractedHindiText(pageText, {
        preferLineBreaks: layoutOptions.preferLineBreaks,
        wrapMergeMinChars: layoutOptions.wrapMergeMinChars,
        protectShortBlocks: layoutOptions.protectShortLines,
    });
    if (!normalized.trim()) {
        return '';
    }

    return normalized
        .split('\n')
        .map((line) => cleanInlineSpacing(line))
        .filter(Boolean)
        .map((line) => `<p>${escapeXml(line)}</p>`)
        .join('\n');
}

function toParagraphMarkup(pageText, lineMetadata = [], preserveFormatting = true, layoutOptions = {}) {
    const headingCounter = layoutOptions?.headingCounter instanceof Map ? layoutOptions.headingCounter : new Map();
    if (preserveFormatting) {
        const structuredMarkup = buildStructuredTextMarkup(pageText, lineMetadata, layoutOptions, headingCounter);
        if (structuredMarkup) {
            return structuredMarkup;
        }
    } else {
        const simpleMarkup = buildSimpleParagraphMarkup(pageText, layoutOptions);
        if (simpleMarkup) {
            return simpleMarkup;
        }
    }
    return '<p><em>No selectable text found on this page.</em></p>';
}

async function extractPdfPageText(page, layoutBehavior = {}) {
    const textContent = await page.getTextContent({
        disableCombineTextItems: false,
        normalizeWhitespace: false,
    });
    const styles = textContent?.styles ?? {};
    const items = Array.isArray(textContent?.items) ? textContent.items : [];

    const preparedItems = items
        .map((item, index) => {
            if (!item || typeof item.str !== 'string') return null;
            const chunk = normalizeHindiUnicodeText(item.str);
            if (!chunk.trim()) return null;

            const x = Number(item.transform?.[4] ?? 0);
            const y = Number(item.transform?.[5] ?? 0);
            const width = Number(item.width ?? 0);
            const transformSize = Math.max(Math.abs(Number(item.transform?.[3] ?? 0)), Math.abs(Number(item.transform?.[0] ?? 0)));
            const fontSize = Math.max(1, Number(item.height ?? 0), transformSize);
            const styleInfo = styles[item.fontName] ?? {};
            const styleText = `${item.fontName ?? ''} ${styleInfo.fontFamily ?? ''}`;

            return {
                index,
                text: chunk,
                x,
                y,
                width,
                fontSize,
                isBold: looksLikeBoldStyle(styleText),
                isItalic: looksLikeItalicStyle(styleText),
                hasEOL: Boolean(item.hasEOL),
            };
        })
        .filter(Boolean)
        .sort((left, right) => {
            const yDifference = Math.abs(left.y - right.y);
            if (yDifference <= 0.8) {
                return left.x - right.x || left.index - right.index;
            }
            return right.y - left.y;
        });

    const groupedLines = [];
    preparedItems.forEach((item) => {
        const lastLine = groupedLines[groupedLines.length - 1];
        const yTolerance = Math.max(
            2.2,
            Math.min(lastLine?.fontSize ?? item.fontSize, item.fontSize) * 0.5,
        );
        const belongsToLastLine = Boolean(lastLine)
            && !lastLine.breakAfter
            && Math.abs(lastLine.y - item.y) <= yTolerance;

        if (!belongsToLastLine) {
            groupedLines.push({
                y: item.y,
                x: item.x,
                fontSize: item.fontSize,
                isBold: item.isBold,
                isItalic: item.isItalic,
                breakAfter: item.hasEOL,
                tokens: [item],
            });
            return;
        }

        lastLine.tokens.push(item);
        lastLine.x = Math.min(lastLine.x, item.x);
        lastLine.y = (lastLine.y + item.y) / 2;
        lastLine.fontSize = Math.max(lastLine.fontSize, item.fontSize);
        lastLine.isBold = lastLine.isBold || item.isBold;
        lastLine.isItalic = lastLine.isItalic || item.isItalic;
        if (item.hasEOL) {
            lastLine.breakAfter = true;
        }
    });

    let lines = groupedLines
        .map((line) => {
            const sortedTokens = [...line.tokens].sort((left, right) => left.x - right.x || left.index - right.index);
            let text = '';
            let previousToken = null;
            let hasItalic = false;

            sortedTokens.forEach((token) => {
                if (!previousToken) {
                    text = token.text;
                    previousToken = token;
                    return;
                }
                const rightEdge = previousToken.x + Math.max(0, previousToken.width);
                const gap = token.x - rightEdge;
                const needsSpace = shouldAddSpacingBetweenTokens(
                    previousToken.text,
                    token.text,
                    gap,
                    Math.max(previousToken.fontSize, token.fontSize),
                );
                if (needsSpace && !/\s$/.test(text) && !/^\s/.test(token.text)) {
                    text += ' ';
                }
                text += token.text;
                previousToken = token;
                hasItalic = hasItalic || Boolean(token.isItalic);
            });

            const normalizedLine = cleanInlineSpacing(text);
            if (!normalizedLine) return null;
            return {
                text: normalizedLine,
                y: line.y,
                x: line.x,
                fontSize: line.fontSize,
                isBold: line.isBold,
                isItalic: hasItalic,
            };
        })
        .filter(Boolean);

    lines = reorderLinesByColumns(lines, layoutBehavior);

    return {
        text: lines.map((line) => line.text).join('\n'),
        lines,
    };
}

function analyzeHindiTextQuality(text) {
    const rawText = String(text ?? '');
    const normalized = normalizeHindiUnicodeText(rawText).replace(/\s+/g, '');
    if (!normalized) {
        return {
            isEmpty: true,
            isLikelyGarbled: true,
            hasLegacyGlyphNoise: false,
        };
    }

    const legacyGlyphCount = (rawText.match(LEGACY_GLYPH_CHAR_PATTERN) ?? []).length;
    const devanagariCount = (normalized.match(/[\u0900-\u097F]/g) ?? []).length;
    const mojibakeCount = (
        normalized.match(/[\u00C0-\u00FF\u00A6-\u00BF\u0192\u0152\u0153\u0160\u0161\u0178\u017D\u017E\u201A-\u201E\u2020-\u2022\u2026\u2030\u2039\u203A]/g)
        ?? []
    ).length;
    const devanagariRatio = devanagariCount / normalized.length;
    const mojibakeRatio = mojibakeCount / normalized.length;
    const legacyGlyphRatio = legacyGlyphCount / normalized.length;
    const hasLegacyGlyphNoise = legacyGlyphCount >= 2 && legacyGlyphRatio > 0.01;
    const hasMojibakeNoise = devanagariCount < 3 && mojibakeRatio > 0.12 && devanagariRatio < 0.08;

    return {
        isEmpty: false,
        isLikelyGarbled: hasMojibakeNoise || hasLegacyGlyphNoise,
        hasLegacyGlyphNoise,
    };
}

async function renderPdfPageToCanvas(page, scale = 2) {
    const viewport = page.getViewport({ scale });
    const canvas = document.createElement('canvas');
    canvas.width = Math.max(1, Math.ceil(viewport.width));
    canvas.height = Math.max(1, Math.ceil(viewport.height));
    const context = canvas.getContext('2d', { alpha: false, willReadFrequently: true });

    if (!context) {
        throw new Error('Canvas context is unavailable for OCR.');
    }

    await page.render({ canvasContext: context, viewport }).promise;
    return canvas;
}

function cloneCanvasForProcessing(sourceCanvas) {
    const canvas = document.createElement('canvas');
    canvas.width = sourceCanvas.width;
    canvas.height = sourceCanvas.height;
    const context = canvas.getContext('2d', { alpha: false, willReadFrequently: true });
    if (!context) {
        return sourceCanvas;
    }
    context.drawImage(sourceCanvas, 0, 0);
    return canvas;
}

function computeOtsuThreshold(histogram, totalPixels) {
    let sum = 0;
    for (let level = 0; level < 256; level += 1) {
        sum += level * (histogram[level] ?? 0);
    }

    let sumBackground = 0;
    let weightBackground = 0;
    let maxVariance = 0;
    let threshold = 145;

    for (let level = 0; level < 256; level += 1) {
        weightBackground += histogram[level] ?? 0;
        if (!weightBackground) continue;
        const weightForeground = totalPixels - weightBackground;
        if (!weightForeground) break;

        sumBackground += level * (histogram[level] ?? 0);
        const meanBackground = sumBackground / weightBackground;
        const meanForeground = (sum - sumBackground) / weightForeground;
        const varianceBetween = weightBackground * weightForeground * (meanBackground - meanForeground) ** 2;

        if (varianceBetween > maxVariance) {
            maxVariance = varianceBetween;
            threshold = level;
        }
    }

    return threshold;
}

function preprocessCanvasForOcr(canvas, preprocessMode = DEFAULT_OCR_PREPROCESS_MODE) {
    const mode = OCR_PREPROCESS_OPTIONS.some((option) => option.value === preprocessMode)
        ? preprocessMode
        : DEFAULT_OCR_PREPROCESS_MODE;
    if (mode === 'none') {
        return canvas;
    }

    const processedCanvas = cloneCanvasForProcessing(canvas);
    const context = processedCanvas.getContext('2d', { alpha: false, willReadFrequently: true });
    if (!context) {
        return canvas;
    }

    const imageData = context.getImageData(0, 0, processedCanvas.width, processedCanvas.height);
    const pixels = imageData.data;
    const histogram = new Array(256).fill(0);
    const pixelCount = processedCanvas.width * processedCanvas.height;

    for (let offset = 0; offset < pixels.length; offset += 4) {
        const luminance = Math.round((pixels[offset] * 0.299) + (pixels[offset + 1] * 0.587) + (pixels[offset + 2] * 0.114));
        histogram[luminance] += 1;
        pixels[offset] = luminance;
        pixels[offset + 1] = luminance;
        pixels[offset + 2] = luminance;
    }

    if (mode === 'binary') {
        const threshold = computeOtsuThreshold(histogram, pixelCount);
        for (let offset = 0; offset < pixels.length; offset += 4) {
            const value = pixels[offset] >= threshold ? 255 : 0;
            pixels[offset] = value;
            pixels[offset + 1] = value;
            pixels[offset + 2] = value;
        }
    } else if (mode === 'adaptive') {
        const tileSize = 24;
        const width = processedCanvas.width;
        const height = processedCanvas.height;
        const tilesX = Math.ceil(width / tileSize);
        const tilesY = Math.ceil(height / tileSize);
        const thresholds = new Array(tilesX * tilesY).fill(0);

        for (let ty = 0; ty < tilesY; ty += 1) {
            for (let tx = 0; tx < tilesX; tx += 1) {
                let sum = 0;
                let count = 0;
                const startX = tx * tileSize;
                const startY = ty * tileSize;
                const endX = Math.min(width, startX + tileSize);
                const endY = Math.min(height, startY + tileSize);
                for (let y = startY; y < endY; y += 1) {
                    for (let x = startX; x < endX; x += 1) {
                        const idx = (y * width + x) * 4;
                        sum += pixels[idx];
                        count += 1;
                    }
                }
                const mean = count ? sum / count : 128;
                thresholds[ty * tilesX + tx] = mean - 8; // mild bias toward darker ink
            }
        }

        for (let y = 0; y < height; y += 1) {
            const ty = Math.floor(y / tileSize);
            for (let x = 0; x < width; x += 1) {
                const tx = Math.floor(x / tileSize);
                const idx = (y * width + x) * 4;
                const threshold = thresholds[ty * tilesX + tx] ?? 128;
                const value = pixels[idx] >= threshold ? 255 : 0;
                pixels[idx] = value;
                pixels[idx + 1] = value;
                pixels[idx + 2] = value;
            }
        }
    } else if (mode === 'grayscale') {
        for (let offset = 0; offset < pixels.length; offset += 4) {
            const boosted = pixels[offset] < 150
                ? Math.max(0, pixels[offset] - 18)
                : Math.min(255, pixels[offset] + 12);
            pixels[offset] = boosted;
            pixels[offset + 1] = boosted;
            pixels[offset + 2] = boosted;
        }
    }

    context.putImageData(imageData, 0, 0);
    return processedCanvas;
}

async function extractPageTextWithOcr(page, ocrEngine, options = {}) {
    const {
        scale = 2,
        preprocessMode = DEFAULT_OCR_PREPROCESS_MODE,
    } = options;
    const renderedCanvas = await renderPdfPageToCanvas(page, scale);
    const canvas = preprocessCanvasForOcr(renderedCanvas, preprocessMode);
    const result = typeof ocrEngine?.addJob === 'function'
        ? await ocrEngine.addJob('recognize', canvas)
        : await ocrEngine.recognize(canvas);
    const confidenceValue = Number(result?.data?.confidence);
    return {
        text: String(result?.data?.text ?? ''),
        confidence: Number.isFinite(confidenceValue) ? confidenceValue : 0,
        scale,
        preprocessMode,
    };
}

const DEVANAGARI_DIGIT_OFFSET = '०'.charCodeAt(0);

function normalizePageRangeInput(value) {
    return String(value ?? '').replace(/[\u0966-\u096F]/g, (digit) => (
        String(digit.charCodeAt(0) - DEVANAGARI_DIGIT_OFFSET)
    ));
}

function parsePageRangeInput(rangeInput, totalPages) {
    const trimmed = normalizePageRangeInput(rangeInput).trim();
    if (!trimmed) {
        return {
            pages: Array.from({ length: totalPages }, (_, index) => index + 1),
            error: null,
        };
    }

    const pages = new Set();
    const tokens = trimmed.split(',').map((part) => part.trim()).filter(Boolean);

    for (const token of tokens) {
        if (/^\d+$/.test(token)) {
            const page = Number(token);
            if (page < 1 || page > totalPages) {
                return {
                    pages: [],
                    error: `Page ${page} is outside 1-${totalPages}.`,
                };
            }
            pages.add(page);
            continue;
        }

        const rangeMatch = token.match(/^(\d+)\s*-\s*(\d+)$/);
        if (rangeMatch) {
            const start = Number(rangeMatch[1]);
            const end = Number(rangeMatch[2]);
            if (start < 1 || end < 1 || start > totalPages || end > totalPages) {
                return {
                    pages: [],
                    error: `Range "${token}" is outside 1-${totalPages}.`,
                };
            }
            const [from, to] = start <= end ? [start, end] : [end, start];
            for (let page = from; page <= to; page += 1) {
                pages.add(page);
            }
            continue;
        }

        return {
            pages: [],
            error: `Invalid page range token "${token}". Use values like "1-5,8,10".`,
        };
    }

    const selectedPages = [...pages].sort((a, b) => a - b);
    return {
        pages: selectedPages,
        error: selectedPages.length ? null : 'No valid pages selected.',
    };
}

function buildOcrLanguageFallbackChain(selectedLanguageMode) {
    const chain = [];
    const push = (value) => {
        if (value && !chain.includes(value)) {
            chain.push(value);
        }
    };

    if (selectedLanguageMode === ADVANCED_DEVANAGARI_OCR_LANGUAGE) {
        push(ADVANCED_DEVANAGARI_OCR_LANGUAGE);
        push('san+hin+eng');
        push('hin+eng');
    } else if (selectedLanguageMode === 'san+hin+eng') {
        push('san+hin+eng');
        push('hin+eng');
    } else if (selectedLanguageMode === 'hin+eng') {
        push('hin+eng');
    } else {
        push(selectedLanguageMode);
        push('hin+eng');
    }

    return chain;
}

async function mapWithConcurrency(items, concurrency, task) {
    const safeItems = Array.isArray(items) ? items : [];
    if (!safeItems.length) {
        return [];
    }

    const limit = Math.max(1, Math.min(Number(concurrency) || 1, safeItems.length));
    const results = new Array(safeItems.length);
    let nextIndex = 0;

    const runners = Array.from({ length: limit }, async () => {
        while (nextIndex < safeItems.length) {
            const currentIndex = nextIndex;
            nextIndex += 1;
            results[currentIndex] = await task(safeItems[currentIndex], currentIndex);
        }
    });

    await Promise.all(runners);
    return results;
}

function normalizeExtractedHindiText(text, options = {}) {
    const {
        preferLineBreaks = false,
        wrapMergeMinChars = 30,
        protectShortBlocks = true,
    } = options;
    const raw = normalizeHindiUnicodeText(text);
    if (!raw.trim()) return '';

    const dehyphenated = raw.replace(/([^\s-])-\s*\n\s*([^\s-])/g, '$1$2');
    const normalizedLines = [];

    dehyphenated.split('\n').forEach((line) => {
        const cleaned = cleanInlineSpacing(line);
        if (!cleaned) {
            if (normalizedLines.length && normalizedLines[normalizedLines.length - 1] !== '') {
                normalizedLines.push('');
            }
            return;
        }

        if (!normalizedLines.length || normalizedLines[normalizedLines.length - 1] === '') {
            normalizedLines.push(cleaned);
            return;
        }

        const previous = normalizedLines[normalizedLines.length - 1];
        const previousLooksHeading = looksLikeHeadingText(previous);
        const currentLooksHeading = looksLikeHeadingText(cleaned);
        const previousIsList = Boolean(parseListLine(previous));
        const currentIsList = Boolean(parseListLine(cleaned));
        const previousLooksSentence = /[।.!?;:]$/.test(previous);
        const shouldMergeWrappedLine = !preferLineBreaks
            && !previousLooksHeading
            && !currentLooksHeading
            && !previousIsList
            && !currentIsList
            && !previousLooksSentence
            && previous.length >= wrapMergeMinChars
            && (!protectShortBlocks || cleaned.length >= 8);

        if (shouldMergeWrappedLine) {
            normalizedLines[normalizedLines.length - 1] = cleanInlineSpacing(`${previous} ${cleaned}`);
        } else {
            normalizedLines.push(cleaned);
        }
    });

    while (normalizedLines[0] === '') normalizedLines.shift();
    while (normalizedLines[normalizedLines.length - 1] === '') normalizedLines.pop();
    return normalizedLines.join('\n');
}

function getEntryLineRecords(entry) {
    if (Array.isArray(entry?.lines) && entry.lines.length) {
        return entry.lines
            .map((line, index) => normalizeLineRecord(line, index))
            .filter(Boolean);
    }
    return buildLineRecordsFromPlainText(entry?.text ?? '');
}

function isStandalonePageNumberLine(text) {
    const normalized = cleanInlineSpacing(String(text ?? ''));
    if (!normalized) return false;
    return STANDALONE_PAGE_NUMBER_PATTERN.test(normalized);
}

function stripStandalonePageNumberLinesFromEntry(entry) {
    const lines = getEntryLineRecords(entry);
    if (!lines.length) {
        return {
            entry: {
                ...entry,
                text: '',
                lines: [],
            },
            removedCount: 0,
        };
    }

    const filteredLines = lines.filter((line) => !isStandalonePageNumberLine(line.text));
    return {
        entry: {
            ...entry,
            lines: filteredLines,
            text: filteredLines.map((line) => line.text).join('\n'),
        },
        removedCount: Math.max(0, lines.length - filteredLines.length),
    };
}

function extractHeadingCandidateFromEntry(entry) {
    const lines = getEntryLineRecords(entry);
    if (!lines.length) return '';

    const medianFontSize = medianValue(lines.map((line) => line.fontSize).filter(Number.isFinite)) ?? 12;
    const scanLimit = Math.min(lines.length, 12);

    for (let index = 0; index < scanLimit; index += 1) {
        const line = lines[index];
        if (!line) continue;
        const text = cleanInlineSpacing(line.text);
        if (!text || text.length > 110) continue;

        const hasHeadingKeyword = HEADING_HINT_PATTERN.test(text);
        const looksHeading = looksLikeHeadingText(text, line, medianFontSize);
        const isProminent = Boolean(line.isBold) && line.fontSize >= medianFontSize * 1.12 && text.length <= 90;
        if (hasHeadingKeyword || (looksHeading && isProminent)) {
            return text;
        }
    }

    return '';
}

function buildSmartChaptersFromPages(pageEntries, includePageMarkers, contentMode = 'hybrid', layoutOptions = {}, headingCounter = new Map()) {
    if (!Array.isArray(pageEntries) || !pageEntries.length) {
        return [];
    }

    const showHeading = contentMode !== 'images-only';
    const chapterBuckets = [];
    let currentBucket = null;
    let detectedHeadingCount = 0;

    pageEntries.forEach((entry) => {
        const headingCandidate = extractHeadingCandidateFromEntry(entry);
        if (headingCandidate) {
            detectedHeadingCount += 1;
        }
        const shouldStartNewChapter = !currentBucket || (headingCandidate && currentBucket.entries.length > 0);

        if (shouldStartNewChapter) {
            if (currentBucket) {
                chapterBuckets.push(currentBucket);
            }
            currentBucket = {
                entries: [],
                titleHint: headingCandidate,
            };
        }

        currentBucket.entries.push(entry);
    });

    if (currentBucket) {
        chapterBuckets.push(currentBucket);
    }

    if (detectedHeadingCount === 0 && pageEntries.length > 1) {
        return pageEntries.map((entry) => ({
            id: `page-${entry.pageNumber}`,
            href: `chapters/page-${entry.pageNumber}.xhtml`,
            title: `Page ${entry.pageNumber}`,
            bodyMarkup: buildChapterBodyFromEntry(entry, false, contentMode, { ...layoutOptions, headingCounter }),
            showHeading,
            startPage: entry.pageNumber,
            endPage: entry.pageNumber,
        }));
    }

    return chapterBuckets.map((bucket, index) => {
        const startPage = bucket.entries[0]?.pageNumber ?? index + 1;
        const endPage = bucket.entries[bucket.entries.length - 1]?.pageNumber ?? startPage;
        const pageRangeLabel = startPage === endPage ? `Page ${startPage}` : `Pages ${startPage}-${endPage}`;
        const title = cleanInlineSpacing(bucket.titleHint || '') || `Chapter ${index + 1} (${pageRangeLabel})`;
        const bodyMarkup = bucket.entries
            .map((entry) => buildChapterBodyFromEntry(entry, includePageMarkers, contentMode, { ...layoutOptions, headingCounter }))
            .filter(Boolean)
            .join('\n');

        return {
            id: `chapter-${index + 1}`,
            href: `chapters/chapter-${index + 1}.xhtml`,
            title,
            bodyMarkup: bodyMarkup || '<p><em>No readable content was extracted.</em></p>',
            showHeading,
            startPage,
            endPage,
        };
    });
}

function getEdgeLineSets(pages, minOccurrences = 3) {
    const topCounts = new Map();
    const bottomCounts = new Map();

    pages.forEach((entry) => {
        const lines = getEntryLineRecords(entry);
        if (!lines.length) return;

        const top = lines[0].text;
        const bottom = lines[lines.length - 1].text;

        if (top.length >= 3) {
            topCounts.set(top, (topCounts.get(top) ?? 0) + 1);
        }
        if (bottom.length >= 3) {
            bottomCounts.set(bottom, (bottomCounts.get(bottom) ?? 0) + 1);
        }
    });

    const requiredCount = Math.max(minOccurrences, Math.ceil(pages.length * 0.35));
    const repeatedTop = new Set([...topCounts.entries()].filter(([, count]) => count >= requiredCount).map(([line]) => line));
    const repeatedBottom = new Set([...bottomCounts.entries()].filter(([, count]) => count >= requiredCount).map(([line]) => line));

    return { repeatedTop, repeatedBottom };
}

function stripRepeatedEdgeLinesFromEntry(entry, repeatedTop, repeatedBottom) {
    const lines = getEntryLineRecords(entry);
    if (!lines.length) {
        return {
            ...entry,
            text: '',
            lines: [],
        };
    }

    let startIndex = 0;
    let endIndex = lines.length - 1;
    if (repeatedTop.has(lines[startIndex].text)) {
        startIndex += 1;
    }
    if (endIndex >= startIndex && repeatedBottom.has(lines[endIndex].text)) {
        endIndex -= 1;
    }

    const trimmedLines = startIndex > endIndex
        ? []
        : lines.slice(startIndex, endIndex + 1);

    return {
        ...entry,
        lines: trimmedLines,
        text: trimmedLines.map((line) => line.text).join('\n'),
    };
}

function buildPageImageMarkup(images) {
    const validImages = Array.isArray(images) ? images.filter((image) => image?.href) : [];
    if (!validImages.length) return '';

    return validImages
        .map((image, index) => {
            const altText = image.alt || `Page image ${index + 1}`;
            return `<figure class="page-figure"><img src="../${escapeXml(image.href)}" alt="${escapeXml(altText)}" /></figure>`;
        })
        .join('\n');
}

function buildChapterBodyFromEntry(entry, includePageMarkers = false, contentMode = 'hybrid', layoutOptions = {}) {
    const parts = [];
    const showImages = contentMode !== 'text-only';
    const showText = contentMode !== 'images-only';
    const showPageMarker = includePageMarkers && contentMode !== 'images-only';

    if (Number.isFinite(entry?.pageNumber)) {
        parts.push(`<span id="page-${entry.pageNumber}" class="page-anchor"></span>`);
    }

    if (showPageMarker) {
        parts.push(`<h3 class="page-marker">Page ${entry.pageNumber}</h3>`);
    }
    const imageMarkup = showImages ? buildPageImageMarkup(entry.images) : '';
    if (imageMarkup) {
        parts.push(imageMarkup);
    }
    const cleanText = String(entry.text ?? '').trim();
    const textMarkup = typeof entry.textMarkup === 'string' && entry.textMarkup.trim()
        ? entry.textMarkup
        : (cleanText ? toParagraphMarkup(cleanText, entry.lines, true, layoutOptions) : '');
    if (showText && textMarkup) {
        parts.push(textMarkup);
    } else if (!imageMarkup) {
        parts.push(contentMode === 'images-only'
            ? '<p><em>No extractable image found on this page.</em></p>'
            : '<p><em>No selectable text found on this page.</em></p>');
    }
    return parts.join('\n');
}

function buildChaptersFromPages(pageEntries, chapterMode, includePageMarkers, contentMode = 'hybrid', layoutOptions = {}) {
    const showHeading = contentMode !== 'images-only';
    const headingCounter = new Map();
    if (chapterMode === 'smart') {
        return buildSmartChaptersFromPages(pageEntries, includePageMarkers, contentMode, layoutOptions, headingCounter);
    }

    if (chapterMode === 'single') {
        const mergedBody = pageEntries
            .map((entry) => buildChapterBodyFromEntry(entry, includePageMarkers, contentMode, { ...layoutOptions, headingCounter }))
            .filter(Boolean)
            .join('\n');
        const startPage = Number.isFinite(pageEntries?.[0]?.pageNumber) ? pageEntries[0].pageNumber : 1;
        const endPage = Number.isFinite(pageEntries?.[pageEntries.length - 1]?.pageNumber)
            ? pageEntries[pageEntries.length - 1].pageNumber
            : startPage;

        return [{
            id: 'chapter-1',
            href: 'chapters/chapter-1.xhtml',
            title: 'Complete Book',
            bodyMarkup: mergedBody || '<p><em>No readable content was extracted.</em></p>',
            showHeading,
            startPage,
            endPage,
        }];
    }

    return pageEntries.map((entry) => ({
        id: `page-${entry.pageNumber}`,
        href: `chapters/page-${entry.pageNumber}.xhtml`,
        title: `Page ${entry.pageNumber}`,
        bodyMarkup: buildChapterBodyFromEntry(entry, false, contentMode, { ...layoutOptions, headingCounter }),
        showHeading,
        startPage: entry.pageNumber,
        endPage: entry.pageNumber,
    }));
}

const OCR_SCALE_BY_QUALITY = {
    fast: 1.4,
    balanced: 2,
    best: 2.8,
    ultra: 3.6,
};

const OCR_SECOND_PASS_SCALE_BOOST_BY_QUALITY = {
    fast: 0.75,
    balanced: 1,
    best: 1.25,
    ultra: 1.35,
};

const PAGE_IMAGE_SCALE_BY_QUALITY = {
    compact: 1.15,
    balanced: 1.65,
    detailed: 2.1,
};

const PAGE_IMAGE_JPEG_QUALITY_BY_QUALITY = {
    compact: 0.7,
    balanced: 0.82,
    detailed: 0.9,
};

const PAGE_IMAGE_EXTENSION_BY_FORMAT = {
    jpeg: 'jpg',
    png: 'png',
};

const PAGE_IMAGE_MIME_BY_FORMAT = {
    jpeg: 'image/jpeg',
    png: 'image/png',
};

const MIN_EMBEDDED_IMAGE_EDGE = 24;

function cropCanvasWhitespace(canvas, threshold = 245, padding = 8) {
    const sourceContext = canvas.getContext('2d', { willReadFrequently: true });
    if (!sourceContext) {
        return { canvas, cropped: false };
    }

    const width = canvas.width;
    const height = canvas.height;
    if (!width || !height) {
        return { canvas, cropped: false };
    }

    const imageData = sourceContext.getImageData(0, 0, width, height);
    const data = imageData.data;

    let minX = width;
    let minY = height;
    let maxX = -1;
    let maxY = -1;

    for (let y = 0; y < height; y += 1) {
        for (let x = 0; x < width; x += 1) {
            const index = (y * width + x) * 4;
            const r = data[index];
            const g = data[index + 1];
            const b = data[index + 2];
            const a = data[index + 3];
            const hasVisibleInk = a > 8 && (r < threshold || g < threshold || b < threshold);
            if (!hasVisibleInk) continue;

            if (x < minX) minX = x;
            if (y < minY) minY = y;
            if (x > maxX) maxX = x;
            if (y > maxY) maxY = y;
        }
    }

    if (maxX < minX || maxY < minY) {
        return { canvas, cropped: false };
    }

    const safePadding = Math.max(0, Number.isFinite(padding) ? Math.floor(padding) : 0);
    minX = Math.max(0, minX - safePadding);
    minY = Math.max(0, minY - safePadding);
    maxX = Math.min(width - 1, maxX + safePadding);
    maxY = Math.min(height - 1, maxY + safePadding);

    const cropWidth = Math.max(1, maxX - minX + 1);
    const cropHeight = Math.max(1, maxY - minY + 1);
    const isFullSize = cropWidth === width && cropHeight === height;
    if (isFullSize) {
        return { canvas, cropped: false };
    }

    const croppedCanvas = document.createElement('canvas');
    croppedCanvas.width = cropWidth;
    croppedCanvas.height = cropHeight;
    const croppedContext = croppedCanvas.getContext('2d', { alpha: false });
    if (!croppedContext) {
        return { canvas, cropped: false };
    }

    croppedContext.drawImage(
        canvas,
        minX,
        minY,
        cropWidth,
        cropHeight,
        0,
        0,
        cropWidth,
        cropHeight,
    );
    return { canvas: croppedCanvas, cropped: true };
}

async function canvasToImageBlob(canvas, format = 'jpeg', quality = 0.82) {
    const mimeType = PAGE_IMAGE_MIME_BY_FORMAT[format] ?? PAGE_IMAGE_MIME_BY_FORMAT.jpeg;
    const qualityValue = mimeType === 'image/png' ? undefined : quality;
    if (typeof canvas.toBlob === 'function') {
        const blob = await new Promise((resolve) => {
            canvas.toBlob(resolve, mimeType, qualityValue);
        });
        return blob ?? null;
    }

    // Fallback path for older environments without toBlob.
    const dataUrl = canvas.toDataURL(mimeType, qualityValue);
    const response = await fetch(dataUrl);
    return response.ok ? response.blob() : null;
}

async function extractPageImageAsset(page, pageNumber, options = {}) {
    const {
        imageQualityPreset = 'balanced',
        imageFormat = 'jpeg',
        autoCrop = false,
        cropPaddingPx = 8,
    } = options;
    const scale = PAGE_IMAGE_SCALE_BY_QUALITY[imageQualityPreset] ?? PAGE_IMAGE_SCALE_BY_QUALITY.balanced;
    const jpegQuality = PAGE_IMAGE_JPEG_QUALITY_BY_QUALITY[imageQualityPreset] ?? PAGE_IMAGE_JPEG_QUALITY_BY_QUALITY.balanced;
    const normalizedFormat = PAGE_IMAGE_MIME_BY_FORMAT[imageFormat] ? imageFormat : 'jpeg';

    const rawCanvas = await renderPdfPageToCanvas(page, scale);
    const { canvas, cropped } = autoCrop
        ? cropCanvasWhitespace(rawCanvas, 245, cropPaddingPx)
        : { canvas: rawCanvas, cropped: false };
    const imageBlob = await canvasToImageBlob(canvas, normalizedFormat, jpegQuality);
    if (!imageBlob || imageBlob.size === 0) {
        return null;
    }

    const fileExt = PAGE_IMAGE_EXTENSION_BY_FORMAT[normalizedFormat] ?? PAGE_IMAGE_EXTENSION_BY_FORMAT.jpeg;
    const mediaType = PAGE_IMAGE_MIME_BY_FORMAT[normalizedFormat] ?? PAGE_IMAGE_MIME_BY_FORMAT.jpeg;

    return {
        id: `img-page-${pageNumber}-${fileExt}`,
        href: `images/page-${pageNumber}.${fileExt}`,
        mediaType,
        alt: `PDF page ${pageNumber} snapshot`,
        buffer: await imageBlob.arrayBuffer(),
        wasCropped: cropped,
    };
}

async function getPdfObjectFromStore(store, objectId, timeoutMs = 2500) {
    if (!store || objectId === undefined || objectId === null) {
        return null;
    }

    try {
        if (typeof store.has === 'function' && store.has(objectId)) {
            return store.get(objectId);
        }
    } catch (error) {
        // Continue and fall back to async lookup.
    }

    return new Promise((resolve) => {
        let settled = false;
        const finish = (value) => {
            if (settled) return;
            settled = true;
            clearTimeout(timeoutId);
            resolve(value ?? null);
        };

        const timeoutId = setTimeout(() => finish(null), timeoutMs);

        try {
            const maybeResolved = store.get(objectId, (value) => finish(value));
            if (maybeResolved) {
                finish(maybeResolved);
            }
        } catch (error) {
            finish(null);
        }
    });
}

function normalizePdfImageDataToRgba(data, width, height) {
    if (!data || !width || !height) {
        return null;
    }

    const source = data instanceof Uint8ClampedArray ? data : new Uint8ClampedArray(data);
    const pixelCount = width * height;

    if (source.length === pixelCount * 4) {
        return source;
    }

    if (source.length === pixelCount * 3) {
        const rgba = new Uint8ClampedArray(pixelCount * 4);
        for (let i = 0; i < pixelCount; i += 1) {
            const sourceIndex = i * 3;
            const destIndex = i * 4;
            rgba[destIndex] = source[sourceIndex];
            rgba[destIndex + 1] = source[sourceIndex + 1];
            rgba[destIndex + 2] = source[sourceIndex + 2];
            rgba[destIndex + 3] = 255;
        }
        return rgba;
    }

    if (source.length === pixelCount) {
        const rgba = new Uint8ClampedArray(pixelCount * 4);
        for (let i = 0; i < pixelCount; i += 1) {
            const grayscale = source[i];
            const destIndex = i * 4;
            rgba[destIndex] = grayscale;
            rgba[destIndex + 1] = grayscale;
            rgba[destIndex + 2] = grayscale;
            rgba[destIndex + 3] = 255;
        }
        return rgba;
    }

    const bitsPerRow = Math.ceil(width / 8);
    if (source.length === bitsPerRow * height) {
        const rgba = new Uint8ClampedArray(pixelCount * 4);
        for (let y = 0; y < height; y += 1) {
            for (let x = 0; x < width; x += 1) {
                const byteIndex = y * bitsPerRow + Math.floor(x / 8);
                const bitMask = 1 << (7 - (x % 8));
                const isDarkPixel = (source[byteIndex] & bitMask) === 0;
                const grayscale = isDarkPixel ? 0 : 255;
                const destIndex = (y * width + x) * 4;
                rgba[destIndex] = grayscale;
                rgba[destIndex + 1] = grayscale;
                rgba[destIndex + 2] = grayscale;
                rgba[destIndex + 3] = 255;
            }
        }
        return rgba;
    }

    return null;
}

function renderPdfImageObjectToCanvas(imageObject) {
    if (!imageObject) return null;

    if (typeof HTMLCanvasElement !== 'undefined' && imageObject instanceof HTMLCanvasElement) {
        return imageObject;
    }

    if (typeof ImageBitmap !== 'undefined' && imageObject instanceof ImageBitmap) {
        const canvas = document.createElement('canvas');
        canvas.width = imageObject.width;
        canvas.height = imageObject.height;
        const context = canvas.getContext('2d', { alpha: false });
        if (!context) return null;
        context.drawImage(imageObject, 0, 0);
        return canvas;
    }

    if (typeof HTMLImageElement !== 'undefined' && imageObject instanceof HTMLImageElement) {
        const width = imageObject.naturalWidth || imageObject.width;
        const height = imageObject.naturalHeight || imageObject.height;
        if (!width || !height) return null;
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const context = canvas.getContext('2d', { alpha: false });
        if (!context) return null;
        context.drawImage(imageObject, 0, 0, width, height);
        return canvas;
    }

    const source = imageObject?.bitmap ?? imageObject?.imageData ?? imageObject;
    const width = Number(source?.width ?? 0);
    const height = Number(source?.height ?? 0);
    if (!width || !height) return null;

    if (typeof ImageData !== 'undefined' && source instanceof ImageData) {
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const context = canvas.getContext('2d', { alpha: true });
        if (!context) return null;
        context.putImageData(source, 0, 0);
        return canvas;
    }

    const rgbaData = normalizePdfImageDataToRgba(source?.data, width, height);
    if (!rgbaData) return null;

    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const context = canvas.getContext('2d', { alpha: true });
    if (!context) return null;
    if (typeof ImageData !== 'undefined') {
        context.putImageData(new ImageData(rgbaData, width, height), 0, 0);
    } else {
        const imageData = context.createImageData(width, height);
        imageData.data.set(rgbaData);
        context.putImageData(imageData, 0, 0);
    }
    return canvas;
}

async function resolveImageObjectFromPdfPage(page, objectId) {
    const [fromPageObjects, fromSharedObjects] = await Promise.all([
        getPdfObjectFromStore(page?.objs, objectId),
        getPdfObjectFromStore(page?.commonObjs, objectId),
    ]);
    return fromPageObjects ?? fromSharedObjects ?? null;
}

async function extractEmbeddedPdfImageAssets(page, pageNumber, options = {}) {
    const {
        imageQualityPreset = 'balanced',
        imageFormat = 'jpeg',
        autoCrop = false,
        cropPaddingPx = 8,
        pdfOps = null,
    } = options;

    if (!pdfOps) {
        return [];
    }

    const normalizedFormat = PAGE_IMAGE_MIME_BY_FORMAT[imageFormat] ? imageFormat : 'jpeg';
    const jpegQuality = PAGE_IMAGE_JPEG_QUALITY_BY_QUALITY[imageQualityPreset] ?? PAGE_IMAGE_JPEG_QUALITY_BY_QUALITY.balanced;
    const fileExt = PAGE_IMAGE_EXTENSION_BY_FORMAT[normalizedFormat] ?? PAGE_IMAGE_EXTENSION_BY_FORMAT.jpeg;
    const mediaType = PAGE_IMAGE_MIME_BY_FORMAT[normalizedFormat] ?? PAGE_IMAGE_MIME_BY_FORMAT.jpeg;

    const operationList = await page.getOperatorList();
    const operationIds = {
        paintImage: pdfOps.paintImageXObject,
        paintJpeg: pdfOps.paintJpegXObject,
        paintInline: pdfOps.paintInlineImageXObject,
    };

    const seenObjectIds = new Set();
    let imageIndex = 0;
    const assets = [];

    for (let index = 0; index < operationList.fnArray.length; index += 1) {
        const fn = operationList.fnArray[index];
        const args = operationList.argsArray[index] ?? [];

        const isObjectPaint = fn === operationIds.paintImage || fn === operationIds.paintJpeg;
        const isInlinePaint = fn === operationIds.paintInline;
        if (!isObjectPaint && !isInlinePaint) {
            continue;
        }

        let imageObject = null;
        if (isObjectPaint) {
            const objectId = args[0];
            if (objectId === undefined || objectId === null) {
                continue;
            }
            const dedupeKey = String(objectId);
            if (seenObjectIds.has(dedupeKey)) {
                continue;
            }
            seenObjectIds.add(dedupeKey);
            imageObject = await resolveImageObjectFromPdfPage(page, objectId);
        } else {
            imageObject = args[0];
        }

        const imageCanvas = renderPdfImageObjectToCanvas(imageObject);
        if (!imageCanvas) {
            continue;
        }
        if (imageCanvas.width < MIN_EMBEDDED_IMAGE_EDGE || imageCanvas.height < MIN_EMBEDDED_IMAGE_EDGE) {
            continue;
        }

        const { canvas, cropped } = autoCrop
            ? cropCanvasWhitespace(imageCanvas, 245, cropPaddingPx)
            : { canvas: imageCanvas, cropped: false };
        const imageBlob = await canvasToImageBlob(canvas, normalizedFormat, jpegQuality);
        if (!imageBlob || imageBlob.size === 0) {
            continue;
        }

        imageIndex += 1;
        assets.push({
            id: `img-page-${pageNumber}-${imageIndex}-${fileExt}`,
            href: `images/page-${pageNumber}/image-${imageIndex}.${fileExt}`,
            mediaType,
            alt: `Embedded PDF image ${imageIndex} on page ${pageNumber}`,
            buffer: await imageBlob.arrayBuffer(),
            wasCropped: cropped,
        });
    }

    return assets;
}

function toSafeNavigationId(value, fallback = 'section') {
    const normalized = String(value ?? '')
        .toLowerCase()
        .replace(/['"`]/g, '')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');
    return normalized || fallback;
}

async function resolvePdfDestinationPageNumber(pdf, destination, pageIndexCache) {
    if (!destination) return null;
    let resolvedDestination = destination;

    if (typeof resolvedDestination === 'string') {
        try {
            resolvedDestination = await pdf.getDestination(resolvedDestination);
        } catch (error) {
            return null;
        }
    }

    if (!Array.isArray(resolvedDestination) || !resolvedDestination.length) {
        return null;
    }

    const target = resolvedDestination[0];
    if (typeof target === 'number') {
        return target + 1;
    }

    if (target && typeof target === 'object' && Number.isFinite(target.num)) {
        const cacheKey = `${target.num}:${target.gen ?? 0}`;
        if (pageIndexCache.has(cacheKey)) {
            return pageIndexCache.get(cacheKey);
        }
        try {
            const pageIndex = await pdf.getPageIndex(target);
            if (!Number.isFinite(pageIndex)) return null;
            const pageNumber = pageIndex + 1;
            pageIndexCache.set(cacheKey, pageNumber);
            return pageNumber;
        } catch (error) {
            return null;
        }
    }

    return null;
}

async function extractPdfOutlineItems(pdf) {
    const outline = await pdf.getOutline();
    if (!Array.isArray(outline) || !outline.length) {
        return [];
    }

    const pageIndexCache = new Map();
    let sequence = 0;

    const walk = async (items) => {
        const resolvedItems = [];
        for (const item of items) {
            sequence += 1;
            const title = cleanInlineSpacing(item?.title ?? '') || `Section ${sequence}`;
            const pageNumber = await resolvePdfDestinationPageNumber(pdf, item?.dest, pageIndexCache);
            const children = Array.isArray(item?.items) && item.items.length
                ? await walk(item.items)
                : [];

            resolvedItems.push({
                id: `bookmark-${sequence}-${toSafeNavigationId(title, `section-${sequence}`)}`,
                title,
                pageNumber,
                children,
            });
        }
        return resolvedItems;
    };

    return walk(outline);
}

function buildDefaultNavigationItems(chapters) {
    return chapters.map((chapter, index) => ({
        id: chapter.id || `chapter-${index + 1}`,
        title: chapter.title || `Chapter ${index + 1}`,
        href: chapter.href,
        children: [],
    }));
}

function buildNavigationItemsFromOutline({
    outlineItems,
    selectedPages,
    chapterMode,
    chapters,
}) {
    const selectedPageSet = new Set(selectedPages);
    if (!Array.isArray(outlineItems) || !outlineItems.length || !selectedPageSet.size) {
        return [];
    }

    const pageHrefMap = new Map();
    const chapterRanges = [];
    chapters.forEach((chapter) => {
        if (Number.isFinite(chapter?.startPage) && chapter?.href) {
            pageHrefMap.set(chapter.startPage, chapter.href);
            chapterRanges.push({
                href: chapter.href,
                startPage: chapter.startPage,
                endPage: Number.isFinite(chapter?.endPage) ? chapter.endPage : chapter.startPage,
            });
        }
    });

    const resolveHrefForPage = (pageNumber) => {
        if (!Number.isFinite(pageNumber)) return null;
        if (chapterMode === 'single') {
            return `chapters/chapter-1.xhtml#page-${pageNumber}`;
        }
        const exactHref = pageHrefMap.get(pageNumber);
        if (exactHref) {
            return exactHref;
        }

        const chapterRange = chapterRanges.find((range) => (
            pageNumber >= range.startPage && pageNumber <= range.endPage
        ));
        if (!chapterRange) {
            return null;
        }
        if (chapterRange.startPage === chapterRange.endPage) {
            return chapterRange.href;
        }
        return `${chapterRange.href}#page-${pageNumber}`;
    };

    const mapNode = (node) => {
        if (!node) return null;
        const mappedChildren = Array.isArray(node.children)
            ? node.children.map((child) => mapNode(child)).filter(Boolean)
            : [];
        const hasPage = Number.isFinite(node.pageNumber) && selectedPageSet.has(node.pageNumber);
        const childWithPage = mappedChildren.find((child) => Number.isFinite(child.pageNumber));
        const targetPage = hasPage ? node.pageNumber : (childWithPage?.pageNumber ?? null);
        const href = targetPage ? resolveHrefForPage(targetPage) : (mappedChildren[0]?.href ?? null);

        if (!href && !mappedChildren.length) {
            return null;
        }

        return {
            id: node.id || `nav-${toSafeNavigationId(node.title)}`,
            title: cleanInlineSpacing(node.title) || (targetPage ? `Page ${targetPage}` : 'Section'),
            href,
            pageNumber: targetPage,
            children: mappedChildren,
        };
    };

    return outlineItems.map((item) => mapNode(item)).filter(Boolean);
}

function normalizeNavigationItems(chapters, navigationItems = []) {
    const seedItems = Array.isArray(navigationItems) && navigationItems.length
        ? navigationItems
        : buildDefaultNavigationItems(chapters);

    const sanitize = (items, path = 'nav') => items
        .map((item, index) => {
            if (!item) return null;
            const children = Array.isArray(item.children) ? sanitize(item.children, `${path}-${index + 1}`) : [];
            const href = item.href || (children[0]?.href ?? '');
            if (!href) return null;
            const title = cleanInlineSpacing(item.title ?? '');
            return {
                id: cleanInlineSpacing(item.id ?? '') || `${path}-${index + 1}`,
                title: title || `Section ${index + 1}`,
                href,
                children,
            };
        })
        .filter(Boolean);

    return sanitize(seedItems);
}

function countNavigationItems(items) {
    if (!Array.isArray(items) || !items.length) return 0;
    return items.reduce((count, item) => count + 1 + countNavigationItems(item.children), 0);
}

function renderNavigationListXhtml(items, depth = 3) {
    const indent = '    '.repeat(depth);
    return items.map((item) => {
        const childMarkup = Array.isArray(item.children) && item.children.length
            ? `\n${indent}    <ol>\n${renderNavigationListXhtml(item.children, depth + 2)}\n${indent}    </ol>`
            : '';
        return `${indent}<li><a href="${escapeXml(item.href)}">${escapeXml(item.title)}</a>${childMarkup}</li>`;
    }).join('\n');
}

function renderTocNavPoints(items, state, depth = 2) {
    const indent = '  '.repeat(depth);
    return items.map((item) => {
        const playOrder = state.playOrder;
        state.playOrder += 1;
        const childMarkup = Array.isArray(item.children) && item.children.length
            ? `\n${renderTocNavPoints(item.children, state, depth + 1)}\n${indent}`
            : '';
        return `${indent}<navPoint id="${escapeXml(item.id)}-${playOrder}" playOrder="${playOrder}">
${indent}  <navLabel><text>${escapeXml(item.title)}</text></navLabel>
${indent}  <content src="${escapeXml(item.href)}"/>${childMarkup}
${indent}</navPoint>`;
    }).join('\n');
}

function buildChapterXhtml({
    title,
    bodyMarkup,
    showHeading = true,
    language = 'hi',
}) {
    return `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE html>
<html xmlns="http://www.w3.org/1999/xhtml" lang="${escapeXml(language)}" xml:lang="${escapeXml(language)}">
<head>
    <title>${escapeXml(title)}</title>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <link rel="stylesheet" type="text/css" href="../styles.css" />
</head>
<body>
    ${showHeading ? `<h1>${escapeXml(title)}</h1>` : ''}
    ${bodyMarkup}
</body>
</html>`;
}

function buildNavXhtml({ title, chapters, navigationItems = [], language = 'hi' }) {
    const normalizedNavigation = normalizeNavigationItems(chapters, navigationItems);
    const navItems = renderNavigationListXhtml(normalizedNavigation);

    return `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE html>
<html xmlns="http://www.w3.org/1999/xhtml" xmlns:epub="http://www.idpf.org/2007/ops" lang="${escapeXml(language)}" xml:lang="${escapeXml(language)}">
<head>
    <title>${escapeXml(title)} - Navigation</title>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <link rel="stylesheet" type="text/css" href="styles.css" />
</head>
<body>
    <nav epub:type="toc" id="toc">
        <h1>${escapeXml(title)}</h1>
        <ol>
${navItems}
        </ol>
    </nav>
</body>
</html>`;
}

function buildTocNcx({ title, identifier, chapters, navigationItems = [] }) {
    const normalizedNavigation = normalizeNavigationItems(chapters, navigationItems);
    const navPoints = renderTocNavPoints(normalizedNavigation, { playOrder: 1 });

    return `<?xml version="1.0" encoding="UTF-8"?>
<ncx xmlns="http://www.daisy.org/z3986/2005/ncx/" version="2005-1">
  <head>
    <meta name="dtb:uid" content="${escapeXml(identifier)}"/>
  </head>
  <docTitle><text>${escapeXml(title)}</text></docTitle>
  <navMap>
${navPoints}
  </navMap>
</ncx>`;
}

function buildContentOpf({
    title,
    creator,
    publisher,
    sourceFileName,
    language,
    identifier,
    modifiedAt,
    chapters,
    imageAssets = [],
    embeddedFontAsset = null,
}) {
    const chapterManifest = chapters
        .map((chapter) => `    <item id="${escapeXml(chapter.id)}" href="${escapeXml(chapter.href)}" media-type="application/xhtml+xml" />`)
        .join('\n');

    const chapterSpine = chapters
        .map((chapter) => `    <itemref idref="${escapeXml(chapter.id)}" />`)
        .join('\n');

    const embeddedFontManifest = embeddedFontAsset?.href
        ? `\n    <item id="${escapeXml(embeddedFontAsset.id ?? 'font-devanagari-400')}" href="${escapeXml(embeddedFontAsset.href)}" media-type="${escapeXml(embeddedFontAsset.mediaType ?? 'font/woff2')}" />`
        : '';
    const imageManifest = imageAssets
        .map((asset) => `    <item id="${escapeXml(asset.id)}" href="${escapeXml(asset.href)}" media-type="${escapeXml(asset.mediaType)}" />`)
        .join('\n');

    return `<?xml version="1.0" encoding="UTF-8"?>
<package xmlns="http://www.idpf.org/2007/opf" version="3.0" unique-identifier="bookid">
  <metadata xmlns:dc="http://purl.org/dc/elements/1.1/">
    <dc:identifier id="bookid">${escapeXml(identifier)}</dc:identifier>
    <dc:title>${escapeXml(title)}</dc:title>
    <dc:language>${escapeXml(language)}</dc:language>
    <dc:creator>${escapeXml(creator)}</dc:creator>
    <dc:publisher>${escapeXml(publisher)}</dc:publisher>
    <dc:source>${escapeXml(sourceFileName)}</dc:source>
    <meta property="dcterms:modified">${escapeXml(modifiedAt)}</meta>
  </metadata>
  <manifest>
    <item id="toc" href="toc.ncx" media-type="application/x-dtbncx+xml" />
    <item id="nav" href="nav.xhtml" media-type="application/xhtml+xml" properties="nav" />
    <item id="styles" href="styles.css" media-type="text/css" />
${embeddedFontManifest}
${imageManifest}
${chapterManifest}
  </manifest>
  <spine toc="toc">
${chapterSpine}
  </spine>
</package>`;
}

async function buildHindiEpub({
    title,
    chapters,
    JSZipLib,
    embeddedFontAsset = null,
    imageAssets = [],
    navigationItems = [],
    creator = 'ScientistShield Tools',
    publisher = 'ScientistShield',
    sourceFileName = 'source.pdf',
    language = 'hi',
    fontScalePercent = DEFAULT_EPUB_FONT_SCALE_PERCENT,
    lineHeight = DEFAULT_EPUB_LINE_HEIGHT,
    marginPercent = DEFAULT_EPUB_MARGIN_PERCENT,
    textAlign = DEFAULT_EPUB_TEXT_ALIGN,
    paragraphIndent = DEFAULT_EPUB_PARAGRAPH_INDENT,
    paragraphSpacing = DEFAULT_EPUB_PARAGRAPH_SPACING,
    letterSpacing = DEFAULT_EPUB_LETTER_SPACING,
    wordSpacing = DEFAULT_EPUB_WORD_SPACING,
    hyphenate = DEFAULT_EPUB_HYPHENATION,
    compressionLevel = EPUB_COMPRESSION_LEVEL_BY_VALUE.balanced,
}) {
    const zip = new JSZipLib();
    const identifier = typeof crypto !== 'undefined' && crypto.randomUUID
        ? `urn:uuid:${crypto.randomUUID()}`
        : `urn:scientistshield:${Date.now()}`;
    const modifiedAt = new Date().toISOString().replace(/\.\d{3}Z$/, 'Z');
    const hasEmbeddedFont = Boolean(embeddedFontAsset?.buffer && embeddedFontAsset?.href);

    zip.file('mimetype', EPUB_MIMETYPE, { compression: 'STORE' });
    zip.file(
        'META-INF/container.xml',
        `<?xml version="1.0" encoding="UTF-8"?>
<container version="1.0" xmlns="urn:oasis:names:tc:opendocument:xmlns:container">
  <rootfiles>
    <rootfile full-path="OEBPS/content.opf" media-type="application/oebps-package+xml"/>
  </rootfiles>
</container>`,
    );
    if (hasEmbeddedFont) {
        zip.file(`OEBPS/${embeddedFontAsset.href}`, embeddedFontAsset.buffer);
    }
    imageAssets.forEach((asset) => {
        if (asset?.href && asset?.buffer) {
            zip.file(`OEBPS/${asset.href}`, asset.buffer);
        }
    });
    zip.file(
        'OEBPS/styles.css',
        `${hasEmbeddedFont
            ? `@font-face {
  font-family: "${embeddedFontAsset.familyName}";
  src: url("${embeddedFontAsset.href}") format("woff2");
  font-weight: 400;
  font-style: normal;
}
`
            : ''}body { font-family: ${hasEmbeddedFont ? `"${embeddedFontAsset.familyName}", ` : ''}"Noto Sans Devanagari", "Noto Serif Devanagari", "Nirmala UI", "Mangal", "Kohinoor Devanagari", "Lohit Devanagari", "Sanskrit 2003", serif; font-size: ${fontScalePercent}%; line-height: ${lineHeight}; margin: ${marginPercent}%; text-align: ${textAlign}; letter-spacing: ${letterSpacing}em; word-spacing: ${wordSpacing}em; hyphens: ${hyphenate ? 'auto' : 'manual'}; word-break: break-word; }
h1, h2 { line-height: 1.25; margin: 1.2em 0 0.55em; }
h3 { line-height: 1.32; margin: 1em 0 0.5em; }
h3.page-marker { margin: 1.25em 0 0.65em; font-size: 1.05em; color: #475569; }
img { max-width: 100%; height: auto; }
figure.page-figure { margin: 0 0 1em; }
figure.page-figure img { display: block; width: 100%; max-width: 100%; height: auto; border: 1px solid #cbd5e1; border-radius: 8px; }
p { margin: 0 0 ${paragraphSpacing}em; text-indent: ${paragraphIndent}em; }
ul, ol { margin: 0.25em 0 0.95em 1.4em; padding: 0; }
li { margin: 0.2em 0; }
.page-anchor { display: block; position: relative; top: -0.1em; visibility: hidden; }`,
    );

    chapters.forEach((chapter) => {
        zip.file(
            `OEBPS/${chapter.href}`,
            buildChapterXhtml({
                title: chapter.title,
                bodyMarkup: chapter.bodyMarkup,
                showHeading: chapter.showHeading !== false,
                language,
            }),
        );
    });

    zip.file('OEBPS/nav.xhtml', buildNavXhtml({ title, chapters, navigationItems, language }));
    zip.file('OEBPS/toc.ncx', buildTocNcx({ title, identifier, chapters, navigationItems }));
    zip.file('OEBPS/content.opf', buildContentOpf({
        title,
        creator,
        publisher,
        sourceFileName,
        language,
        identifier,
        modifiedAt,
        chapters,
        imageAssets,
        embeddedFontAsset: hasEmbeddedFont ? embeddedFontAsset : null,
    }));

    const safeCompressionLevel = Math.max(1, Math.min(9, Number(compressionLevel) || EPUB_COMPRESSION_LEVEL_BY_VALUE.balanced));
    return zip.generateAsync({
        type: 'blob',
        mimeType: EPUB_MIMETYPE,
        compression: 'DEFLATE',
        compressionOptions: { level: safeCompressionLevel },
    });
}

function downloadBlob(blob, filename) {
    const url = window.URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = filename;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    setTimeout(() => {
        window.URL.revokeObjectURL(url);
    }, 1000);
}

function JsonFormatterTool() {
    const [input, setInput] = useState(defaultJsonSample);
    const [output, setOutput] = useState('');
    const [status, setStatus] = useState(null);

    const handleFormat = () => {
        try {
            const parsed = JSON.parse(input);
            const formatted = JSON.stringify(parsed, null, 2);
            setOutput(formatted);
            setStatus({ type: 'success', message: 'Valid JSON • formatted with indentation' });
        } catch (error) {
            setStatus({ type: 'error', message: error.message });
            setOutput('');
        }
    };

    const handleMinify = () => {
        try {
            const parsed = JSON.parse(input);
            const minified = JSON.stringify(parsed);
            setOutput(minified);
            setStatus({ type: 'success', message: 'Valid JSON • minified output ready' });
        } catch (error) {
            setStatus({ type: 'error', message: error.message });
            setOutput('');
        }
    };

    const handleCopy = async () => {
        if (!output) return;
        try {
            if (navigator.clipboard) {
                await navigator.clipboard.writeText(output);
                setStatus({ type: 'success', message: 'Output copied to clipboard!' });
            }
        } catch (error) {
            setStatus({ type: 'error', message: 'Unable to access clipboard' });
        }
    };

    return (
        <div className="space-y-space-md">
            <Textarea
                rows={7}
                value={input}
                onChange={(event) => setInput(event.target.value)}
                placeholder="Paste JSON you want to validate or format"
            />
            <div className="flex flex-wrap gap-space-sm">
                <Button onClick={handleFormat} gradientDuoTone="purpleToBlue">
                    Beautify JSON
                </Button>
                <Button onClick={handleMinify} color="dark" outline>
                    Minify
                </Button>
                <Button onClick={handleCopy} color="gray" outline disabled={!output}>
                    <FaCopy className="mr-2" /> Copy Output
                </Button>
            </div>
            {status && (
                <Alert color={status.type === 'success' ? 'success' : 'failure'}>
                    {status.type === 'success' ? <FaCheckCircle className="mr-2 inline" /> : null}
                    <span className="font-medium">{status.message}</span>
                </Alert>
            )}
            <Textarea
                rows={7}
                value={output}
                readOnly
                placeholder="Formatted JSON will appear here"
            />
        </div>
    );
}

const READER_UI_MODE_KEY = 'ebook-reader-ui-mode';

function EbookReaderTool() {
    const [workspaceMode, setWorkspaceMode] = useState(() => {
        if (typeof window === 'undefined') return 'immersive';
        const stored = window.localStorage.getItem(READER_UI_MODE_KEY);
        return stored === 'workspace' ? 'workspace' : 'immersive';
    });
    const controlCenterOnly = workspaceMode === 'immersive';
    const MINIMAL_READER_UI = true;
    const [hudAutoHide, setHudAutoHide] = useState(true);
    const [hudVisible, setHudVisible] = useState(true);
    const [file, setFile] = useState(null);
    const [bookTitle, setBookTitle] = useState('Untitled book');
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [isDragOver, setIsDragOver] = useState(false);
    const [theme, setTheme] = useState('light');
    const [themeBrightness, setThemeBrightness] = useState(DEFAULT_THEME_BRIGHTNESS);
    const [themeContrast, setThemeContrast] = useState(DEFAULT_THEME_CONTRAST);
    const [themeSaturation, setThemeSaturation] = useState(DEFAULT_THEME_SATURATION);
    const [themeWarmth, setThemeWarmth] = useState(DEFAULT_THEME_WARMTH);
    const [themeTexture, setThemeTexture] = useState(DEFAULT_THEME_TEXTURE);
    const [themeVignette, setThemeVignette] = useState(DEFAULT_THEME_VIGNETTE);
    const [themeCustomBackground, setThemeCustomBackground] = useState(DEFAULT_THEME_CUSTOM_BACKGROUND);
    const [themeCustomText, setThemeCustomText] = useState(DEFAULT_THEME_CUSTOM_TEXT);
    const [themeCustomAccent, setThemeCustomAccent] = useState(DEFAULT_THEME_CUSTOM_ACCENT);
    const [fontSize, setFontSize] = useState(DEFAULT_READER_FONT_SIZE);
    const [lineHeight, setLineHeight] = useState(DEFAULT_READER_LINE_HEIGHT);
    const [margin, setMargin] = useState(DEFAULT_READER_MARGIN);
    const [readingWidth, setReadingWidth] = useState(DEFAULT_READING_WIDTH);
    const [fontProfile, setFontProfile] = useState(DEFAULT_READER_FONT_PROFILE);
    const [textAlign, setTextAlign] = useState(DEFAULT_READER_TEXT_ALIGN);
    const [paragraphIndent, setParagraphIndent] = useState(DEFAULT_READER_PARAGRAPH_INDENT);
    const [paragraphSpacing, setParagraphSpacing] = useState(DEFAULT_READER_PARAGRAPH_SPACING);
    const [letterSpacing, setLetterSpacing] = useState(DEFAULT_READER_LETTER_SPACING);
    const [wordSpacing, setWordSpacing] = useState(DEFAULT_READER_WORD_SPACING);
    const [hyphenation, setHyphenation] = useState(DEFAULT_READER_HYPHENATION);
    const [readingSpeed, setReadingSpeed] = useState(DEFAULT_READING_SPEED);
    const [content, setContent] = useState('');
    const [bookHtml, setBookHtml] = useState('');
    const [toc, setToc] = useState([]);
    const [activeLocation, setActiveLocation] = useState('');
    const [bookmarks, setBookmarks] = useState([]);
    const [showTocPanel, setShowTocPanel] = useState(false);
    const [bookKey, setBookKey] = useState('');
    const [readerStateKey, setReaderStateKey] = useState('');
    const [highlights, setHighlights] = useState([]);
    const [selectionMenu, setSelectionMenu] = useState({ open: false, x: 0, y: 0, text: '', note: '', noteOpen: false });
    const [searchQuery, setSearchQuery] = useState('');
    const [searchHits, setSearchHits] = useState([]);
    const [currentHit, setCurrentHit] = useState(-1);
    const [searchCaseSensitive, setSearchCaseSensitive] = useState(false);
    const [searchWholeWord, setSearchWholeWord] = useState(false);
    const [status, setStatus] = useState(null);
    const [focusMode, setFocusMode] = useState(false);
    const [controlsHidden, setControlsHidden] = useState(false);
    const [showControlCenter, setShowControlCenter] = useState(false);
    const [controlCenterOffset, setControlCenterOffset] = useState({ x: 0, y: 0 });
    const [isControlCenterDragging, setIsControlCenterDragging] = useState(false);
    const [readingProgress, setReadingProgress] = useState(0);
    const [wordsTotal, setWordsTotal] = useState(0);
    const [scrollTop, setScrollTop] = useState(0);
    const [ttsStatus, setTtsStatus] = useState('idle');
    const [ttsVoices, setTtsVoices] = useState([]);
    const [ttsVoice, setTtsVoice] = useState('');
    const [ttsRate, setTtsRate] = useState(1);
    const [ttsPitch, setTtsPitch] = useState(1);
    const [ttsSupported, setTtsSupported] = useState(false);
    const [autoScrollEnabled, setAutoScrollEnabled] = useState(false);
    const [autoScrollSpeed, setAutoScrollSpeed] = useState(60);
    const readerShellRef = useRef(null);
    const readerContainerRef = useRef(null);
    const controlCenterRef = useRef(null);
    const controlCenterDragRef = useRef({ active: false, startX: 0, startY: 0, originX: 0, originY: 0 });
    const selectionRangeRef = useRef(null);
    const selectionMenuRef = useRef(null);
    const searchInputRef = useRef(null);
    const noteInputRef = useRef(null);
    const ttsUtteranceRef = useRef(null);
    const importHighlightsInputRef = useRef(null);
    const shortcutsSectionRef = useRef(null);
    const tocSidebarRef = useRef(null);
    const resumeScrollRef = useRef(null);
    const resumeLocationRef = useRef('');
    const hasRestoredRef = useRef(false);
    const lastScrollTopRef = useRef(0);
    const scrollIdleRef = useRef(null);
    const autoScrollFrameRef = useRef(null);
    const lastAutoScrollRef = useRef(0);
    const hudTimerRef = useRef(null);
    const touchStartXRef = useRef(null);
    const cloudSyncRef = useRef({ lastProgressSync: 0, lastBookmarkSync: 0 });

    useEffect(() => {
        if (typeof window === 'undefined') return;
        try {
            window.localStorage.setItem(READER_UI_MODE_KEY, workspaceMode);
        } catch (error) {
            // Ignore storage errors silently
        }
    }, [workspaceMode]);

    const themeConfig = READER_THEMES[theme] ?? READER_THEMES.light;
    const themeBackgroundColor = sanitizeHexColor(themeCustomBackground) || themeConfig.background;
    const themeTextColor = sanitizeHexColor(themeCustomText) || themeConfig.text;
    const themeAccentColor = sanitizeHexColor(themeCustomAccent) || themeConfig.accent;
    const themeQuoteBackgroundColor = `color-mix(in srgb, ${themeAccentColor} 14%, ${themeBackgroundColor})`;
    const themeDividerColor = `color-mix(in srgb, ${themeTextColor} 24%, ${themeBackgroundColor})`;
    const bookmarkLabels = useMemo(() => new Map(toc.map((item) => [item.id, item.label])), [toc]);
    const highlightPaletteMap = useMemo(
        () => new Map(READER_HIGHLIGHT_PALETTE.map((entry) => [entry.id, entry])),
        []
    );
    const activeChapterLabel = useMemo(() => {
        if (!activeLocation) return 'Start reading';
        return bookmarkLabels.get(activeLocation) || activeLocation;
    }, [activeLocation, bookmarkLabels]);
    const progressPercent = useMemo(
        () => Math.min(100, Math.max(0, Math.round(readingProgress * 100))),
        [readingProgress]
    );
    const hasBookContent = useMemo(() => Boolean(bookHtml && bookHtml.trim()), [bookHtml]);

    useEffect(() => {
        if (!bookKey || !hasBookContent) return;
        try {
            const payload = {
                version: 1,
                updatedAt: Date.now(),
                progress: readingProgress,
                scrollTop,
                locationId: activeLocation,
            };
            window.localStorage.setItem(`${bookKey}:progress`, JSON.stringify(payload));
        } catch {
            // Ignore storage sync errors to keep reading uninterrupted
        }
    }, [activeLocation, bookKey, hasBookContent, readingProgress, scrollTop]);
    const timeLeftMinutes = useMemo(() => {
        if (!wordsTotal || !Number.isFinite(readingSpeed) || readingSpeed <= 0) return null;
        const remaining = Math.max(0, Math.round(wordsTotal * (1 - readingProgress)));
        return Math.max(0, Math.ceil(remaining / readingSpeed));
    }, [readingProgress, readingSpeed, wordsTotal]);
    const timeLeftLabel = useMemo(() => {
        if (!Number.isFinite(timeLeftMinutes)) return '—';
        const hours = Math.floor(timeLeftMinutes / 60);
        const minutes = timeLeftMinutes % 60;
        if (hours > 0) return `${hours}h ${minutes}m`;
        return `${minutes}m`;
    }, [timeLeftMinutes]);
    const activeChapterIndex = useMemo(() => (
        toc.findIndex((item) => item.id === activeLocation)
    ), [activeLocation, toc]);
    const chapterProgressLabel = useMemo(() => {
        if (!toc.length) return 'Chapter —';
        const position = activeChapterIndex >= 0 ? activeChapterIndex + 1 : 1;
        return `Chapter ${position}/${toc.length}`;
    }, [activeChapterIndex, toc.length]);
    const chapterSliderValue = useMemo(() => {
        if (!toc.length) return 1;
        if (activeChapterIndex < 0) return 1;
        return Math.min(toc.length, Math.max(1, activeChapterIndex + 1));
    }, [activeChapterIndex, toc.length]);
    const progressSliderValue = useMemo(() => clampNumber(progressPercent, 0, 100), [progressPercent]);
    const activeReaderPresetId = useMemo(() => {
        const matched = READER_EXPERIENCE_PRESETS.find((preset) => (
            preset.settings.theme === theme
            && preset.settings.fontSize === fontSize
            && preset.settings.lineHeight === lineHeight
            && preset.settings.margin === margin
            && preset.settings.readingWidth === readingWidth
            && preset.settings.wpm === readingSpeed
            && (preset.settings.fontProfile ?? DEFAULT_READER_FONT_PROFILE) === fontProfile
            && (preset.settings.textAlign ?? DEFAULT_READER_TEXT_ALIGN) === textAlign
            && Math.abs((preset.settings.paragraphIndent ?? DEFAULT_READER_PARAGRAPH_INDENT) - paragraphIndent) < 0.0001
            && Math.abs((preset.settings.paragraphSpacing ?? DEFAULT_READER_PARAGRAPH_SPACING) - paragraphSpacing) < 0.0001
            && Math.abs((preset.settings.letterSpacing ?? DEFAULT_READER_LETTER_SPACING) - letterSpacing) < 0.0001
            && Math.abs((preset.settings.wordSpacing ?? DEFAULT_READER_WORD_SPACING) - wordSpacing) < 0.0001
            && (preset.settings.hyphenation ?? DEFAULT_READER_HYPHENATION) === hyphenation
        ));
        return matched?.id ?? '';
    }, [
        fontProfile,
        fontSize,
        hyphenation,
        letterSpacing,
        lineHeight,
        margin,
        paragraphIndent,
        paragraphSpacing,
        readingSpeed,
        readingWidth,
        textAlign,
        theme,
        wordSpacing,
    ]);
    const activeReaderPresetLabel = useMemo(
        () => READER_EXPERIENCE_PRESETS.find((preset) => preset.id === activeReaderPresetId)?.label ?? 'Custom profile',
        [activeReaderPresetId]
    );
    const activeThemeSceneId = useMemo(() => {
        const matched = READER_THEME_SCENES.find((scene) => {
            const settings = scene.settings;
            return (
                settings.theme === theme
                && numbersApproximatelyMatch(settings.brightness, themeBrightness)
                && numbersApproximatelyMatch(settings.contrast, themeContrast)
                && numbersApproximatelyMatch(settings.saturation, themeSaturation)
                && numbersApproximatelyMatch(settings.warmth, themeWarmth)
                && numbersApproximatelyMatch(settings.texture, themeTexture)
                && numbersApproximatelyMatch(settings.vignette, themeVignette)
                && sanitizeHexColor(settings.customBackground) === sanitizeHexColor(themeCustomBackground)
                && sanitizeHexColor(settings.customText) === sanitizeHexColor(themeCustomText)
                && sanitizeHexColor(settings.customAccent) === sanitizeHexColor(themeCustomAccent)
            );
        });
        return matched?.id ?? 'custom';
    }, [
        theme,
        themeBrightness,
        themeContrast,
        themeCustomAccent,
        themeCustomBackground,
        themeCustomText,
        themeSaturation,
        themeTexture,
        themeVignette,
        themeWarmth,
    ]);

    const applyReaderExperiencePreset = useCallback((presetId) => {
        const preset = READER_EXPERIENCE_PRESETS.find((item) => item.id === presetId);
        if (!preset) return;
        const { settings } = preset;
        setTheme(settings.theme);
        setFontSize(settings.fontSize);
        setLineHeight(settings.lineHeight);
        setMargin(settings.margin);
        setReadingWidth(settings.readingWidth);
        setFontProfile(settings.fontProfile ?? DEFAULT_READER_FONT_PROFILE);
        setTextAlign(settings.textAlign ?? DEFAULT_READER_TEXT_ALIGN);
        setParagraphIndent(settings.paragraphIndent ?? DEFAULT_READER_PARAGRAPH_INDENT);
        setParagraphSpacing(settings.paragraphSpacing ?? DEFAULT_READER_PARAGRAPH_SPACING);
        setLetterSpacing(settings.letterSpacing ?? DEFAULT_READER_LETTER_SPACING);
        setWordSpacing(settings.wordSpacing ?? DEFAULT_READER_WORD_SPACING);
        setHyphenation(settings.hyphenation ?? DEFAULT_READER_HYPHENATION);
        setReadingSpeed(settings.wpm);
        setStatus({ type: 'info', message: `Applied ${preset.label}.` });
    }, []);
    const applyThemeScene = useCallback((sceneId) => {
        const scene = READER_THEME_SCENES.find((item) => item.id === sceneId);
        if (!scene) return;
        const { settings } = scene;
        setTheme(settings.theme);
        setThemeBrightness(clampNumber(settings.brightness, 0.75, 1.3));
        setThemeContrast(clampNumber(settings.contrast, 0.75, 1.35));
        setThemeSaturation(clampNumber(settings.saturation, 0.7, 1.4));
        setThemeWarmth(clampNumber(settings.warmth, -0.2, 0.3));
        setThemeTexture(clampNumber(settings.texture, 0, 0.4));
        setThemeVignette(clampNumber(settings.vignette, 0, 0.32));
        setThemeCustomBackground(sanitizeHexColor(settings.customBackground));
        setThemeCustomText(sanitizeHexColor(settings.customText));
        setThemeCustomAccent(sanitizeHexColor(settings.customAccent));
        setStatus({ type: 'info', message: `Applied ${scene.label} theme scene.` });
    }, []);
    const resetThemeTuning = useCallback(() => {
        setThemeBrightness(DEFAULT_THEME_BRIGHTNESS);
        setThemeContrast(DEFAULT_THEME_CONTRAST);
        setThemeSaturation(DEFAULT_THEME_SATURATION);
        setThemeWarmth(DEFAULT_THEME_WARMTH);
        setThemeTexture(DEFAULT_THEME_TEXTURE);
        setThemeVignette(DEFAULT_THEME_VIGNETTE);
    }, []);
    const resetThemePalette = useCallback(() => {
        setThemeCustomBackground(DEFAULT_THEME_CUSTOM_BACKGROUND);
        setThemeCustomText(DEFAULT_THEME_CUSTOM_TEXT);
        setThemeCustomAccent(DEFAULT_THEME_CUSTOM_ACCENT);
    }, []);
    const openShortcutsInControlCenter = useCallback(() => {
        setShowControlCenter(true);
        if (typeof window === 'undefined') return;
        window.setTimeout(() => {
            shortcutsSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 120);
    }, []);
    const focusReaderSearch = useCallback(() => {
        setShowControlCenter(true);
        if (typeof window === 'undefined') return;
        window.setTimeout(() => searchInputRef.current?.focus(), 0);
    }, []);
    const controlCenterFloatingStyle = useMemo(() => ({
        transform: `translate3d(${controlCenterOffset.x}px, ${controlCenterOffset.y}px, 0)`,
    }), [controlCenterOffset.x, controlCenterOffset.y]);
    const clampControlCenterOffset = useCallback((x, y) => {
        if (typeof window === 'undefined') return { x, y };
        const panelRect = controlCenterRef.current?.getBoundingClientRect();
        if (!panelRect) return { x, y };
        const edgePadding = 10;
        const minX = -(panelRect.left - edgePadding);
        const maxX = window.innerWidth - panelRect.right - edgePadding;
        const minY = -(panelRect.top - edgePadding);
        const maxY = window.innerHeight - panelRect.bottom - edgePadding;
        return {
            x: clampNumber(x, minX, maxX),
            y: clampNumber(y, minY, maxY),
        };
    }, []);
    const startControlCenterDrag = useCallback((event) => {
        if (event.button !== 0) return;
        const target = event.target;
        if (target?.closest?.('button, input, textarea, select, a, label')) return;
        controlCenterDragRef.current = {
            active: true,
            startX: event.clientX,
            startY: event.clientY,
            originX: controlCenterOffset.x,
            originY: controlCenterOffset.y,
        };
        setIsControlCenterDragging(true);
        event.preventDefault();
    }, [controlCenterOffset.x, controlCenterOffset.y]);
    const resetControlCenterPosition = useCallback(() => {
        setControlCenterOffset({ x: 0, y: 0 });
    }, []);

    const enterFullscreenIfAvailable = useCallback(async () => {
        const el = readerShellRef.current;
        if (!el || typeof document === 'undefined') return;
        if (document.fullscreenElement && document.fullscreenElement !== el) return;
        if (document.fullscreenElement === el) return;
        try {
            await el.requestFullscreen?.();
        } catch (error) {
            // Ignore fullscreen errors
        }
    }, []);

    const toggleFullscreen = useCallback(async () => {
        const el = readerShellRef.current;
        if (!el || typeof document === 'undefined') return;
        try {
            if (!document.fullscreenElement) {
                await enterFullscreenIfAvailable();
            } else if (document.fullscreenElement !== el) {
                await document.exitFullscreen?.();
                await enterFullscreenIfAvailable();
            } else {
                await document.exitFullscreen?.();
            }
        } catch (error) {
            // Ignore fullscreen errors
        }
    }, [enterFullscreenIfAvailable]);

    useEffect(() => {
        if (typeof document === 'undefined') return undefined;
        const onChange = () => {
            const active = document.fullscreenElement === readerShellRef.current;
            setIsFullscreen(active);
        };
        onChange();
        document.addEventListener('fullscreenchange', onChange);
        return () => document.removeEventListener('fullscreenchange', onChange);
    }, []);

    useEffect(() => {
        if (typeof document === 'undefined') return undefined;
        let cancelled = false;

        const requestOnInteraction = () => {
            if (cancelled) return;
            enterFullscreenIfAvailable();
        };

        enterFullscreenIfAvailable();
        document.addEventListener('pointerdown', requestOnInteraction, { once: true });
        return () => {
            cancelled = true;
            document.removeEventListener('pointerdown', requestOnInteraction);
        };
    }, [enterFullscreenIfAvailable]);

    useEffect(() => {
        if (typeof window === 'undefined' || !window.speechSynthesis) return undefined;
        setTtsSupported(true);
        const updateVoices = () => {
            const list = window.speechSynthesis.getVoices();
            setTtsVoices(list);
            if (!ttsVoice && list.length) {
                setTtsVoice(list[0].name);
            }
        };
        updateVoices();
        window.speechSynthesis.addEventListener('voiceschanged', updateVoices);
        return () => window.speechSynthesis.removeEventListener('voiceschanged', updateVoices);
    }, [ttsVoice]);

    useEffect(() => {
        if (!bookKey || typeof window === 'undefined') return;
        try {
            if (!highlights.length) {
                window.localStorage.removeItem(bookKey);
                return;
            }
            const payload = { version: 1, updatedAt: Date.now(), highlights };
            window.localStorage.setItem(bookKey, JSON.stringify(payload));
        } catch (error) {
            // Ignore storage errors silently
        }
    }, [bookKey, highlights]);

    useEffect(() => {
        if (!readerStateKey || typeof window === 'undefined') return;
        try {
            const payload = {
                version: 1,
                updatedAt: Date.now(),
                theme,
                brightness: themeBrightness,
                contrast: themeContrast,
                saturation: themeSaturation,
                warmth: themeWarmth,
                texture: themeTexture,
                vignette: themeVignette,
                customBackground: sanitizeHexColor(themeCustomBackground),
                customText: sanitizeHexColor(themeCustomText),
                customAccent: sanitizeHexColor(themeCustomAccent),
                fontSize,
                lineHeight,
                margin,
                readingWidth,
                fontProfile,
                textAlign,
                paragraphIndent,
                paragraphSpacing,
                letterSpacing,
                wordSpacing,
                hyphenation,
                wpm: readingSpeed,
                scrollTop,
                activeLocation,
                focusMode,
            };
            window.localStorage.setItem(readerStateKey, JSON.stringify(payload));
        } catch (error) {
            // Ignore storage errors silently
        }
    }, [
        activeLocation,
        focusMode,
        fontProfile,
        fontSize,
        hyphenation,
        letterSpacing,
        lineHeight,
        margin,
        paragraphIndent,
        paragraphSpacing,
        readerStateKey,
        readingSpeed,
        readingWidth,
        scrollTop,
        themeBrightness,
        themeContrast,
        themeCustomAccent,
        themeCustomBackground,
        themeCustomText,
        themeSaturation,
        themeTexture,
        themeVignette,
        themeWarmth,
        textAlign,
        theme,
        wordSpacing,
    ]);

    useEffect(() => () => {
        if (typeof window !== 'undefined' && window.speechSynthesis) {
            window.speechSynthesis.cancel();
        }
        ttsUtteranceRef.current = null;
        if (hudTimerRef.current) {
            window.clearTimeout(hudTimerRef.current);
        }
    }, []);

    const applyStyles = useCallback((html) => {
        const padding = `${margin}px`;
        const selectedProfile = READER_FONT_PROFILE_MAP.get(fontProfile) ?? READER_FONT_PROFILE_MAP.get(DEFAULT_READER_FONT_PROFILE);
        const fontFamily = selectedProfile?.family || '"Literata", "Source Serif 4", "Georgia", serif';
        const alignMode = textAlign === 'left' ? 'left' : 'justify';
        const hyphenMode = hyphenation ? 'auto' : 'none';
        const brightnessValue = clampNumber(themeBrightness, 0.75, 1.3);
        const contrastValue = clampNumber(themeContrast, 0.75, 1.35);
        const saturationValue = clampNumber(themeSaturation, 0.7, 1.4);
        const warmthValue = clampNumber(themeWarmth, -0.2, 0.3);
        const textureValue = clampNumber(themeTexture, 0, 0.4);
        const vignetteValue = clampNumber(themeVignette, 0, 0.32);
        const paragraphIndentValue = Math.max(0, Number(paragraphIndent) || 0);
        const paragraphSpacingValue = Math.max(0.1, Number(paragraphSpacing) || DEFAULT_READER_PARAGRAPH_SPACING);
        const letterSpacingValue = Number(letterSpacing) || 0;
        const wordSpacingValue = Number(wordSpacing) || 0;
        const warmOverlay = warmthValue >= 0
            ? `rgba(255, 173, 82, ${warmthValue.toFixed(3)})`
            : `rgba(112, 166, 255, ${Math.abs(warmthValue).toFixed(3)})`;
        const articleSurfaceBlend = theme === 'night' ? '#020617' : '#ffffff';
        const vignetteColor = theme === 'night' ? '0, 0, 0' : '15, 23, 42';
        const textureTintPercent = Math.round(4 + textureValue * 32);
        const textureLinePercent = Math.max(1, Number((textureValue * 10).toFixed(2)));
        const readerBackground = MINIMAL_READER_UI
            ? themeBackgroundColor
            : `
                linear-gradient(0deg, ${warmOverlay}, ${warmOverlay}),
                radial-gradient(130% 110% at 12% 0%, color-mix(in srgb, ${themeAccentColor} ${textureTintPercent}%, transparent), transparent 58%),
                radial-gradient(120% 100% at 88% 6%, color-mix(in srgb, ${themeTextColor} ${Math.max(2, textureTintPercent - 3)}%, transparent), transparent 56%),
                repeating-linear-gradient(
                    0deg,
                    color-mix(in srgb, ${themeTextColor} ${textureLinePercent}%, transparent) 0px,
                    color-mix(in srgb, ${themeTextColor} ${textureLinePercent}%, transparent) 1px,
                    transparent 1px,
                    transparent 5px
                ),
                ${themeBackgroundColor}
            `;
        const articleBackground = MINIMAL_READER_UI
            ? themeBackgroundColor
            : `color-mix(in srgb, ${themeBackgroundColor} 92%, ${articleSurfaceBlend})`;
        const articleBorder = MINIMAL_READER_UI
            ? `1px solid ${themeDividerColor}`
            : `1px solid color-mix(in srgb, ${themeTextColor} 18%, transparent)`;
        const articleShadow = MINIMAL_READER_UI
            ? 'none'
            : `0 24px 58px -42px color-mix(in srgb, ${themeTextColor} 60%, transparent)`;
        const vignetteRule = MINIMAL_READER_UI
            ? ''
            : `.reader-body::before {
                    content: '';
                    position: absolute;
                    inset: 0;
                    pointer-events: none;
                    z-index: 0;
                    background: radial-gradient(140% 95% at 50% 50%, transparent 58%, rgba(${vignetteColor}, ${vignetteValue.toFixed(3)}) 100%);
                }`;
        const articleFilter = MINIMAL_READER_UI
            ? ''
            : `filter: brightness(${brightnessValue.toFixed(2)}) contrast(${contrastValue.toFixed(2)}) saturate(${saturationValue.toFixed(2)});`;
        return `
            <style>
                .reader-body {
                    margin: 0;
                    padding: ${padding};
                    position: relative;
                    isolation: isolate;
                    background: ${readerBackground};
                    color: ${themeTextColor};
                    font-size: ${fontSize}px;
                    line-height: ${lineHeight};
                    font-family: ${fontFamily};
                    text-rendering: optimizeLegibility;
                    -webkit-font-smoothing: antialiased;
                    font-kerning: normal;
                    font-variant-ligatures: common-ligatures contextual;
                    font-optical-sizing: auto;
                    text-align: ${alignMode};
                    text-justify: inter-word;
                    -webkit-hyphens: ${hyphenMode};
                    hyphens: ${hyphenMode};
                    text-wrap: pretty;
                }
                ${vignetteRule}
                .reader-body article {
                    max-width: ${readingWidth}px;
                    margin: 0 auto;
                    padding: 0.72rem 0.62rem 2.55rem;
                    letter-spacing: ${letterSpacingValue.toFixed(3)}em;
                    word-spacing: ${wordSpacingValue.toFixed(3)}em;
                    position: relative;
                    z-index: 1;
                    background: ${articleBackground};
                    border: ${articleBorder};
                    border-radius: 0.95rem;
                    box-shadow: ${articleShadow};
                    ${articleFilter}
                }
                .reader-body a { color: ${themeAccentColor}; }
                .reader-body h1, .reader-body h2, .reader-body h3, .reader-body h4, .reader-body h5, .reader-body h6 { margin: 1.1em 0 0.48em; line-height: 1.28; text-wrap: balance; }
                .reader-body p { margin: 0; text-indent: ${paragraphIndentValue.toFixed(2)}em; }
                .reader-body p + p { margin-top: ${paragraphSpacingValue.toFixed(2)}em; }
                .reader-body h1 + p,
                .reader-body h2 + p,
                .reader-body h3 + p,
                .reader-body h4 + p,
                .reader-body h5 + p,
                .reader-body h6 + p,
                .reader-body hr + p,
                .reader-body figure + p,
                .reader-body blockquote + p,
                .reader-body ul + p,
                .reader-body ol + p,
                .reader-body .reader-chapter > p:first-of-type { text-indent: 0; margin-top: 0.25em; }
                .reader-body li p,
                .reader-body blockquote p,
                .reader-body td p,
                .reader-body th p { text-indent: 0; margin-top: 0.2em; }
                .reader-body img { max-width: 100%; height: auto; border-radius: 8px; }
                .reader-body blockquote { margin: 0 0 1em; padding: 0.75em 1em; border-left: 4px solid ${themeAccentColor}; background: ${themeQuoteBackgroundColor}; border-radius: 0.65rem; }
                .reader-body ul, .reader-body ol { padding-left: 1.2em; margin: 0.2em 0 0.95em; }
                .reader-body li + li { margin-top: 0.28em; }
                .reader-body::selection,
                .reader-body *::selection { background: color-mix(in srgb, ${themeAccentColor} 30%, transparent); }
                .reader-body .reader-chapter { scroll-margin-top: 18px; }
                .reader-body .reader-chapter + .reader-chapter { margin-top: 2.5rem; padding-top: 2.5rem; border-top: 1px solid ${themeDividerColor}; }
                .reader-body .page-number { display: inline-block; margin-right: 0.5rem; font-weight: 600; color: ${themeAccentColor}; }
            </style>
            <div class="reader-body"><article>${html}</article></div>
        `;
    }, [
        fontProfile,
        fontSize,
        hyphenation,
        letterSpacing,
        lineHeight,
        margin,
        paragraphIndent,
        paragraphSpacing,
        readingWidth,
        textAlign,
        theme,
        themeAccentColor,
        themeBackgroundColor,
        themeBrightness,
        themeContrast,
        themeDividerColor,
        themeQuoteBackgroundColor,
        themeSaturation,
        themeTextColor,
        themeTexture,
        themeVignette,
        themeWarmth,
        wordSpacing,
        MINIMAL_READER_UI,
    ]);

    const wakeHud = useCallback(() => {
        setHudVisible(true);
        if (hudTimerRef.current) {
            window.clearTimeout(hudTimerRef.current);
        }
        if (hudAutoHide) {
            hudTimerRef.current = window.setTimeout(() => {
                setHudVisible(false);
            }, 2400);
        }
    }, [hudAutoHide]);

    useEffect(() => {
        if (typeof window === 'undefined') return undefined;
        wakeHud();
        const onInteract = () => wakeHud();
        window.addEventListener('pointermove', onInteract, { passive: true });
        window.addEventListener('touchstart', onInteract, { passive: true });
        window.addEventListener('keydown', onInteract);
        return () => {
            window.removeEventListener('pointermove', onInteract);
            window.removeEventListener('touchstart', onInteract);
            window.removeEventListener('keydown', onInteract);
        };
    }, [wakeHud]);

    const removeSearchMarks = useCallback((container) => {
        if (!container) return;
        const marks = container.querySelectorAll('mark[data-reader-search]');
        marks.forEach((mark) => {
            const parent = mark.parentNode;
            if (!parent) return;
            while (mark.firstChild) parent.insertBefore(mark.firstChild, mark);
            parent.removeChild(mark);
        });
    }, []);

    const removeHighlightMarks = useCallback((container) => {
        if (!container) return;
        const marks = container.querySelectorAll('mark[data-reader-highlight]');
        marks.forEach((mark) => {
            const parent = mark.parentNode;
            if (!parent) return;
            while (mark.firstChild) parent.insertBefore(mark.firstChild, mark);
            parent.removeChild(mark);
        });
    }, []);

    const removeHighlightMark = useCallback((highlightId) => {
        const container = readerContainerRef.current?.querySelector('article');
        if (!container) return;
        const mark = container.querySelector(`mark[data-highlight-id="${highlightId}"]`);
        if (!mark || !mark.parentNode) return;
        const parent = mark.parentNode;
        while (mark.firstChild) parent.insertBefore(mark.firstChild, mark);
        parent.removeChild(mark);
    }, []);

    const updateHighlightNote = useCallback((highlightId, note) => {
        setHighlights((prev) => prev.map((item) => (item.id === highlightId ? { ...item, note } : item)));
    }, []);

    const deleteHighlight = useCallback((highlightId) => {
        removeHighlightMark(highlightId);
        setHighlights((prev) => prev.filter((item) => item.id !== highlightId));
    }, [removeHighlightMark]);

    const clearAllHighlights = useCallback(() => {
        if (!highlights.length) return;
        const container = readerContainerRef.current?.querySelector('article');
        if (container) removeHighlightMarks(container);
        setHighlights([]);
    }, [highlights.length, removeHighlightMarks]);

    const stopSpeech = useCallback(() => {
        if (typeof window === 'undefined' || !window.speechSynthesis) return;
        window.speechSynthesis.cancel();
        ttsUtteranceRef.current = null;
        setTtsStatus('idle');
    }, []);

    const getSpeechSourceText = useCallback(() => {
        if (typeof window === 'undefined') return '';
        const container = readerContainerRef.current?.querySelector('article');
        if (!container) return '';
        const selection = window.getSelection?.();
        const selectedText = selection?.toString?.().trim();
        if (selectedText) return selectedText;
        if (selectionMenu.open && selectionMenu.text) return selectionMenu.text;
        if (activeLocation) {
            const section = container.querySelector(`#${activeLocation}`);
            const sectionText = section?.textContent?.trim();
            if (sectionText) return sectionText;
        }
        return (container.textContent || '').trim();
    }, [activeLocation, selectionMenu.open, selectionMenu.text]);

    const startSpeech = useCallback(() => {
        if (typeof window === 'undefined' || !window.speechSynthesis) {
            setStatus({ type: 'error', message: 'Text-to-speech not supported in this browser.' });
            return;
        }
        const text = getSpeechSourceText();
        if (!text) {
            setStatus({ type: 'error', message: 'Nothing to read. Load a book or select text first.' });
            return;
        }
        stopSpeech();
        const utterance = new SpeechSynthesisUtterance(text);
        const voice = ttsVoices.find((item) => item.name === ttsVoice) ?? ttsVoices[0];
        if (voice) utterance.voice = voice;
        utterance.rate = ttsRate;
        utterance.pitch = ttsPitch;
        utterance.onstart = () => setTtsStatus('playing');
        utterance.onend = () => setTtsStatus('idle');
        utterance.onerror = () => setTtsStatus('idle');
        ttsUtteranceRef.current = utterance;
        window.speechSynthesis.speak(utterance);
    }, [getSpeechSourceText, stopSpeech, ttsPitch, ttsRate, ttsVoice, ttsVoices]);

    const toggleSpeechPause = useCallback(() => {
        if (typeof window === 'undefined' || !window.speechSynthesis) return;
        if (!window.speechSynthesis.speaking) return;
        if (window.speechSynthesis.paused) {
            window.speechSynthesis.resume();
            setTtsStatus('playing');
        } else {
            window.speechSynthesis.pause();
            setTtsStatus('paused');
        }
    }, []);

    const exportHighlights = useCallback(() => {
        if (!highlights.length) {
            setStatus({ type: 'info', message: 'No highlights to export yet.' });
            return;
        }
        const payload = {
            version: 1,
            exportedAt: new Date().toISOString(),
            book: bookTitle || file?.name || 'book',
            highlights,
        };
        const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `${toSafeFilename(bookTitle || 'book')}-highlights.json`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    }, [bookTitle, file, highlights]);

    const importHighlights = useCallback((event) => {
        const selected = event?.target?.files?.[0];
        if (!selected) return;
        const reader = new FileReader();
        reader.onload = () => {
            try {
                const raw = JSON.parse(reader.result || '[]');
                const list = Array.isArray(raw) ? raw : (Array.isArray(raw.highlights) ? raw.highlights : []);
                const restored = list.map(normalizeStoredHighlight).filter(Boolean);
                setHighlights(restored);
                setStatus({ type: 'success', message: 'Highlights imported.' });
            } catch (error) {
                setStatus({ type: 'error', message: 'Unable to import highlights file.' });
            } finally {
                if (event.target) event.target.value = '';
            }
        };
        reader.readAsText(selected);
    }, []);

    const applySearchMark = useCallback((container, start, end, active = false) => {
        const range = createRangeFromOffsets(container, start, end);
        if (!range) return;
        const wrap = document.createElement('mark');
        wrap.dataset.readerSearch = 'true';
        wrap.className = `reader-search-hit ${active ? 'reader-search-hit-active' : ''}`;
        wrap.appendChild(range.extractContents());
        range.insertNode(wrap);
        range.detach();
    }, []);

    const addBookmark = useCallback(() => {
        if (!activeLocation) return;
        setBookmarks((prev) => (prev.includes(activeLocation) ? prev : [...prev, activeLocation]));
    }, [activeLocation]);

    const createAnnotation = useCallback((options = {}) => {
        const { colorId = DEFAULT_HIGHLIGHT_COLOR, kind = 'highlight', note = '' } = options;
        const range = selectionRangeRef.current;
        const container = readerContainerRef.current?.querySelector('article');
        if (!range || !container) return;
        if (!container.contains(range.commonAncestorContainer)) return;
        const snippet = selectionMenu.text || range.toString().trim();
        if (!snippet) return;
        const highlightId = `highlight-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
        const rangeNode = range.startContainer.nodeType === 1 ? range.startContainer : range.startContainer.parentElement;
        const section = rangeNode?.closest?.('section[data-location]');
        const locationId = section?.getAttribute('data-location') || activeLocation || '';
        const offsetScope = section || container;
        const offsets = getOffsetsFromRange(offsetScope, range) || { start: null, end: null };

        const palette = READER_HIGHLIGHT_PALETTE.find((entry) => entry.id === colorId) ?? READER_HIGHLIGHT_PALETTE[0];
        const mark = document.createElement('mark');
        mark.dataset.highlightId = highlightId;
        mark.dataset.readerHighlight = 'true';
        mark.dataset.highlightKind = kind;
        mark.className = kind === 'underline' ? 'reader-underline' : `reader-highlight ${palette.className}`;
        mark.appendChild(range.extractContents());
        range.insertNode(mark);
        range.detach();

        setHighlights((prev) => [
            ...prev,
            {
                id: highlightId,
                text: snippet.length > 140 ? `${snippet.slice(0, 140)}…` : snippet,
                color: palette.id,
                note: typeof note === 'string' ? note.trim() : '',
                kind: kind === 'underline' ? 'underline' : 'highlight',
                locationId,
                startOffset: offsets.start,
                endOffset: offsets.end,
                createdAt: Date.now(),
            },
        ]);
        selectionRangeRef.current = null;
        setSelectionMenu({ open: false, x: 0, y: 0, text: '', note: '', noteOpen: false });
        const selection = window.getSelection();
        if (selection) selection.removeAllRanges();
    }, [activeLocation, selectionMenu.text]);

    const handleCopySelection = useCallback(async () => {
        const text = selectionMenu.text?.trim();
        if (!text) return;
        try {
            if (navigator.clipboard?.writeText) {
                await navigator.clipboard.writeText(text);
                return;
            }
        } catch (error) {
            // Fall back to execCommand copy
        }
        const temp = document.createElement('textarea');
        temp.value = text;
        temp.style.position = 'fixed';
        temp.style.opacity = '0';
        document.body.appendChild(temp);
        temp.select();
        try {
            document.execCommand('copy');
        } catch (error) {
            // Ignore copy failure
        }
        document.body.removeChild(temp);
    }, [selectionMenu.text]);

    const handleShareSelection = useCallback(async () => {
        const text = selectionMenu.text?.trim();
        if (!text) return;
        if (navigator.share) {
            try {
                await navigator.share({
                    title: bookTitle || 'Reading excerpt',
                    text,
                });
                return;
            } catch (error) {
                // User cancelled share or share failed
            }
        }
        await handleCopySelection();
    }, [bookTitle, handleCopySelection, selectionMenu.text]);

    const jumpToLocation = useCallback((locationId, options = {}) => {
        if (!locationId) return;
        const { closePanel = false } = options;
        setActiveLocation((prev) => (prev === locationId ? prev : locationId));
        if (closePanel) {
            setShowTocPanel(false);
        }
        const container = readerContainerRef.current;
        if (!container) return;
        const target = container.querySelector(`#${locationId}`);
        if (target?.scrollIntoView) {
            target.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    }, []);

    const jumpToChapter = useCallback((direction) => {
        if (!toc.length) return;
        const currentIndex = activeChapterIndex >= 0 ? activeChapterIndex : 0;
        const nextIndex = direction === 'prev'
            ? Math.max(0, currentIndex - 1)
            : Math.min(toc.length - 1, currentIndex + 1);
        const nextId = toc[nextIndex]?.id;
        if (nextId) jumpToLocation(nextId);
    }, [activeChapterIndex, jumpToLocation, toc]);
    const openReaderToc = useCallback(() => {
        if (controlCenterOnly) {
            setShowControlCenter(true);
            if (typeof window !== 'undefined') {
                window.setTimeout(() => {
                    tocSidebarRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }, 100);
            }
            return;
        }
        setShowTocPanel((value) => !value);
    }, [controlCenterOnly]);
    const jumpToChapterIndex = useCallback((chapterIndex) => {
        if (!toc.length) return;
        const bounded = Math.min(toc.length - 1, Math.max(0, chapterIndex));
        const nextId = toc[bounded]?.id;
        if (nextId) jumpToLocation(nextId, { closePanel: true });
    }, [jumpToLocation, toc]);

    const scrubToProgress = useCallback((percent) => {
        const container = readerContainerRef.current;
        if (!container || !hasBookContent) return;
        const maxScroll = Math.max(1, container.scrollHeight - container.clientHeight);
        const next = clampNumber(percent, 0, 100) / 100 * maxScroll;
        container.scrollTo({ top: next, behavior: 'smooth' });
    }, [hasBookContent]);

    const scrollReaderToTop = useCallback(() => {
        const container = readerContainerRef.current;
        if (!container) return;
        container.scrollTo({ top: 0, behavior: 'smooth' });
    }, []);

    const jumpToHighlight = useCallback((highlightId, locationId) => {
        const container = readerContainerRef.current;
        if (!container) return;
        const mark = container.querySelector(`mark[data-highlight-id="${highlightId}"]`);
        if (mark) {
            mark.scrollIntoView({ behavior: 'smooth', block: 'center' });
            mark.classList.add('reader-highlight-pulse');
            setTimeout(() => mark.classList.remove('reader-highlight-pulse'), 1200);
            return;
        }
        if (locationId) {
            jumpToLocation(locationId);
            setTimeout(() => {
                const retry = container.querySelector(`mark[data-highlight-id="${highlightId}"]`);
                if (!retry) return;
                retry.scrollIntoView({ behavior: 'smooth', block: 'center' });
                retry.classList.add('reader-highlight-pulse');
                setTimeout(() => retry.classList.remove('reader-highlight-pulse'), 1200);
            }, 300);
        }
    }, [jumpToLocation]);
    const onReaderTouchStart = useCallback((event) => {
        if (!hasBookContent || event.touches.length !== 1) return;
        touchStartXRef.current = event.touches[0].clientX;
    }, [hasBookContent]);
    const onReaderTouchEnd = useCallback((event) => {
        if (!hasBookContent) return;
        const startX = touchStartXRef.current;
        touchStartXRef.current = null;
        if (startX == null || event.changedTouches.length === 0) return;
        const deltaX = event.changedTouches[0].clientX - startX;
        const threshold = 60;
        if (Math.abs(deltaX) < threshold) return;
        if (deltaX > 0) {
            jumpToChapter('prev');
        } else {
            jumpToChapter('next');
        }
    }, [hasBookContent, jumpToChapter]);

    const renderTocButtons = (onNavigate) => (
        toc.length ? toc.map((item) => (
            <button
                key={item.id}
                type="button"
                onClick={() => onNavigate(item.id)}
                className={`w-full px-space-sm py-space-xs text-left text-sm transition hover:bg-cyan-50 dark:hover:bg-cyan-900/40 ${item.id === activeLocation ? 'text-cyan-600 dark:text-cyan-300 font-semibold' : 'text-gray-700 dark:text-gray-300'}`}
                aria-current={item.id === activeLocation ? 'true' : undefined}
            >
                {item.label}
            </button>
        )) : <p className="text-xs text-gray-500">No chapters detected.</p>
    );

    useEffect(() => {
        if (typeof window === 'undefined') return undefined;
        const container = readerContainerRef.current;
        if (!container) return undefined;
        const sections = Array.from(container.querySelectorAll('section[data-location]'));
        if (!sections.length || !('IntersectionObserver' in window)) return undefined;

        const observer = new IntersectionObserver(
            (entries) => {
                const visible = entries
                    .filter((entry) => entry.isIntersecting)
                    .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
                if (!visible.length) return;
                const id = visible[0].target.getAttribute('data-location');
                if (id) {
                    setActiveLocation((prev) => (prev === id ? prev : id));
                }
            },
            { root: container, rootMargin: '0px 0px -60% 0px', threshold: [0, 0.35, 0.7, 1] }
        );

        sections.forEach((section) => observer.observe(section));
        return () => observer.disconnect();
    }, [content]);

    const handleSelectionChange = useCallback(() => {
        const container = readerContainerRef.current;
        const article = container?.querySelector('article');
        if (!container || !article || typeof window === 'undefined') return;
        const selection = window.getSelection();
        if (!selection || selection.isCollapsed || selection.rangeCount === 0) {
            selectionRangeRef.current = null;
            setSelectionMenu({ open: false, x: 0, y: 0, text: '', note: '', noteOpen: false });
            return;
        }
        const range = selection.getRangeAt(0);
        if (!article.contains(range.commonAncestorContainer)) {
            selectionRangeRef.current = null;
            setSelectionMenu({ open: false, x: 0, y: 0, text: '', note: '', noteOpen: false });
            return;
        }
        const rect = range.getBoundingClientRect();
        if (!rect || (rect.width === 0 && rect.height === 0)) return;
        const containerRect = container.getBoundingClientRect();
        const x = rect.left - containerRect.left + rect.width / 2 + container.scrollLeft;
        const y = rect.top - containerRect.top + container.scrollTop;
        const snippet = selection.toString().trim().replace(/\s+/g, ' ');
        if (!snippet) {
            selectionRangeRef.current = null;
            setSelectionMenu({ open: false, x: 0, y: 0, text: '', note: '', noteOpen: false });
            return;
        }
        selectionRangeRef.current = range.cloneRange();
        setSelectionMenu({ open: true, x, y, text: snippet, note: '', noteOpen: false });
    }, []);

    const closeSelectionMenu = useCallback(() => {
        selectionRangeRef.current = null;
        setSelectionMenu({ open: false, x: 0, y: 0, text: '', note: '', noteOpen: false });
    }, []);

    useEffect(() => {
        const onKeyDown = (event) => {
            if (event.key === 'Escape') {
                closeSelectionMenu();
            }
        };
        document.addEventListener('keydown', onKeyDown);
        return () => document.removeEventListener('keydown', onKeyDown);
    }, [closeSelectionMenu]);

    useEffect(() => {
        const onMouseDown = (event) => {
            if (!selectionMenu.open) return;
            const menu = selectionMenuRef.current;
            if (menu && menu.contains(event.target)) return;
            closeSelectionMenu();
        };
        document.addEventListener('mousedown', onMouseDown);
        return () => document.removeEventListener('mousedown', onMouseDown);
    }, [closeSelectionMenu, selectionMenu.open]);

    useEffect(() => {
        const onKeyDown = (event) => {
            const target = event.target;
            const isInput = target && (
                target.tagName === 'INPUT' ||
                target.tagName === 'TEXTAREA' ||
                target.isContentEditable
            );
            if (isInput && event.key !== 'Escape') return;

            if (event.key === 'Escape') {
                setShowControlCenter(false);
                setShowTocPanel(false);
                closeSelectionMenu();
                return;
            }

            if (event.key === '/' && !event.shiftKey && !event.ctrlKey && !event.metaKey) {
                event.preventDefault();
                if (controlCenterOnly) {
                    focusReaderSearch();
                } else {
                    searchInputRef.current?.focus();
                }
                return;
            }

            if ((event.key === '?' || (event.shiftKey && event.key === '/')) && !event.ctrlKey && !event.metaKey) {
                event.preventDefault();
                openShortcutsInControlCenter();
                return;
            }

            if ((event.altKey && event.key === 'Enter') || (event.ctrlKey && event.shiftKey && event.key.toLowerCase() === 'f')) {
                event.preventDefault();
                toggleFullscreen();
                return;
            }

            if ((event.ctrlKey || event.metaKey) && event.key === ',') {
                event.preventDefault();
                setShowControlCenter((value) => !value);
                return;
            }

            if (event.key === 't' || event.key === 'T') {
                openReaderToc();
                return;
            }

            if (event.key === 'f' || event.key === 'F') {
                setFocusMode((value) => !value);
                return;
            }

            if (event.key === 'b' || event.key === 'B') {
                addBookmark();
                return;
            }

            if (event.key === 'ArrowLeft' || event.key === 'p' || event.key === 'P') {
                jumpToChapter('prev');
                return;
            }

            if (event.key === 'ArrowRight' || event.key === 'n' || event.key === 'N') {
                jumpToChapter('next');
            }
        };

        window.addEventListener('keydown', onKeyDown);
        return () => window.removeEventListener('keydown', onKeyDown);
    }, [addBookmark, closeSelectionMenu, controlCenterOnly, focusReaderSearch, jumpToChapter, openReaderToc, openShortcutsInControlCenter, toggleFullscreen]);

    useEffect(() => {
        if (!isControlCenterDragging) return undefined;
        const handlePointerMove = (event) => {
            const drag = controlCenterDragRef.current;
            if (!drag.active) return;
            const nextX = drag.originX + (event.clientX - drag.startX);
            const nextY = drag.originY + (event.clientY - drag.startY);
            setControlCenterOffset((prev) => {
                const clamped = clampControlCenterOffset(nextX, nextY);
                if (prev.x === clamped.x && prev.y === clamped.y) return prev;
                return clamped;
            });
        };
        const handlePointerStop = () => {
            controlCenterDragRef.current.active = false;
            setIsControlCenterDragging(false);
        };
        window.addEventListener('pointermove', handlePointerMove);
        window.addEventListener('pointerup', handlePointerStop);
        window.addEventListener('pointercancel', handlePointerStop);
        return () => {
            window.removeEventListener('pointermove', handlePointerMove);
            window.removeEventListener('pointerup', handlePointerStop);
            window.removeEventListener('pointercancel', handlePointerStop);
        };
    }, [clampControlCenterOffset, isControlCenterDragging]);

    useEffect(() => {
        if (typeof window === 'undefined' || !showControlCenter) return undefined;
        const handleResize = () => {
            setControlCenterOffset((prev) => clampControlCenterOffset(prev.x, prev.y));
        };
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, [clampControlCenterOffset, showControlCenter]);

    useEffect(() => {
        if (!showControlCenter) return undefined;
        const panel = controlCenterRef.current;
        if (!panel || typeof ResizeObserver === 'undefined') return undefined;
        const observer = new ResizeObserver(() => {
            setControlCenterOffset((prev) => clampControlCenterOffset(prev.x, prev.y));
        });
        observer.observe(panel);
        return () => observer.disconnect();
    }, [clampControlCenterOffset, showControlCenter]);

    useEffect(() => {
        if (showControlCenter) return;
        controlCenterDragRef.current.active = false;
        setIsControlCenterDragging(false);
    }, [showControlCenter]);

    useEffect(() => {
        if (!focusMode) {
            setControlsHidden(false);
        }
    }, [focusMode]);

    useLayoutEffect(() => {
        const container = readerContainerRef.current?.querySelector('article');
        if (!container) return;
        removeHighlightMarks(container);
        if (!highlights.length) return;
        highlights.forEach((item) => {
            if (!item || item.startOffset == null || item.endOffset == null) return;
            const section = item.locationId
                ? container.querySelector(`section[data-location="${item.locationId}"]`)
                : container;
            if (!section) return;
            const range = createRangeFromOffsets(section, item.startOffset, item.endOffset);
            if (!range) return;
            const palette = highlightPaletteMap.get(item.color) ?? READER_HIGHLIGHT_PALETTE[0];
            const mark = document.createElement('mark');
            mark.dataset.highlightId = item.id;
            mark.dataset.readerHighlight = 'true';
            mark.dataset.highlightKind = item.kind === 'underline' ? 'underline' : 'highlight';
            mark.className = item.kind === 'underline' ? 'reader-underline' : `reader-highlight ${palette.className}`;
            mark.appendChild(range.extractContents());
            range.insertNode(mark);
            range.detach();
        });
    }, [content, highlightPaletteMap, highlights, removeHighlightMarks]);

    useEffect(() => {
        const container = readerContainerRef.current?.querySelector('article');
        if (!container) return;
        const handle = window.requestAnimationFrame(() => {
            const text = container.textContent || '';
            const words = text.trim() ? text.trim().split(/\s+/).length : 0;
            setWordsTotal(words);
        });
        return () => window.cancelAnimationFrame(handle);
    }, [content]);

    useEffect(() => {
        if (!autoScrollEnabled) return undefined;
        const container = readerContainerRef.current;
        if (!container) return undefined;

        const step = (timestamp) => {
            const last = lastAutoScrollRef.current || timestamp;
            const delta = timestamp - last;
            lastAutoScrollRef.current = timestamp;
            const increment = (autoScrollSpeed / 1000) * delta;
            const maxScroll = container.scrollHeight - container.clientHeight;
            container.scrollTop = Math.min(maxScroll, container.scrollTop + increment);
            if (container.scrollTop >= maxScroll - 1) {
                setAutoScrollEnabled(false);
                return;
            }
            autoScrollFrameRef.current = window.requestAnimationFrame(step);
        };

        autoScrollFrameRef.current = window.requestAnimationFrame(step);
        return () => {
            if (autoScrollFrameRef.current) {
                window.cancelAnimationFrame(autoScrollFrameRef.current);
            }
            autoScrollFrameRef.current = null;
            lastAutoScrollRef.current = 0;
        };
    }, [autoScrollEnabled, autoScrollSpeed, content]);

    useEffect(() => {
        const container = readerContainerRef.current;
        if (!container) return;

        const onScroll = () => {
            const maxScroll = Math.max(1, container.scrollHeight - container.clientHeight);
            const progress = Math.min(1, Math.max(0, container.scrollTop / maxScroll));
            setReadingProgress(progress);
            setScrollTop(container.scrollTop);
            if (focusMode) {
                const prev = lastScrollTopRef.current;
                const current = container.scrollTop;
                const delta = current - prev;
                if (Math.abs(delta) > 4) {
                    setControlsHidden(delta > 0);
                }
                lastScrollTopRef.current = current;
                if (scrollIdleRef.current) {
                    window.clearTimeout(scrollIdleRef.current);
                }
                scrollIdleRef.current = window.setTimeout(() => {
                    setControlsHidden(false);
                }, 420);
            }
        };

        onScroll();
        container.addEventListener('scroll', onScroll, { passive: true });
        window.addEventListener('resize', onScroll);
        return () => {
            container.removeEventListener('scroll', onScroll);
            window.removeEventListener('resize', onScroll);
            if (scrollIdleRef.current) {
                window.clearTimeout(scrollIdleRef.current);
            }
        };
    }, [content, focusMode]);

    useEffect(() => {
        if (!content || hasRestoredRef.current) return;
        const container = readerContainerRef.current;
        if (!container) return;
        const handle = window.requestAnimationFrame(() => {
            if (resumeScrollRef.current != null) {
                container.scrollTop = resumeScrollRef.current;
            } else if (resumeLocationRef.current) {
                jumpToLocation(resumeLocationRef.current);
            }
            hasRestoredRef.current = true;
        });
        return () => window.cancelAnimationFrame(handle);
    }, [content, jumpToLocation]);

    useLayoutEffect(() => {
        const container = readerContainerRef.current?.querySelector('article');
        if (!container) return;
        removeSearchMarks(container);
        setSearchHits([]);
        setCurrentHit(-1);
        const q = (searchQuery || '').trim();
        if (!q || q.length < 2) return;
        const fullText = container.textContent || '';
        const hits = [];
        const flags = searchCaseSensitive ? 'g' : 'gi';
        const escaped = q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const pattern = searchWholeWord ? `\\b${escaped}\\b` : escaped;
        let re;
        try { re = new RegExp(pattern, flags); } catch (_) { return; }
        let m;
        while ((m = re.exec(fullText)) !== null) {
            hits.push({ start: m.index, end: m.index + m[0].length });
            if (m.index === re.lastIndex) re.lastIndex += 1;
        }
        if (!hits.length) return;

        hits.forEach((hit, index) => applySearchMark(container, hit.start, hit.end, index === 0));
        setSearchHits(hits);
        setCurrentHit(0);
        const first = container.querySelector('mark.reader-search-hit');
        if (first) first.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, [applySearchMark, content, searchCaseSensitive, searchQuery, searchWholeWord, removeSearchMarks]);

    const jumpToHit = useCallback((direction) => {
        if (searchHits.length === 0) return;
        const container = readerContainerRef.current?.querySelector('article');
        if (!container) return;
        container.querySelectorAll('mark.reader-search-hit-active').forEach((el) => el.classList.remove('reader-search-hit-active'));
        let next = currentHit + (direction === 'prev' ? -1 : 1);
        if (next < 0) next = searchHits.length - 1;
        if (next >= searchHits.length) next = 0;
        setCurrentHit(next);
        const mark = container.querySelectorAll('mark.reader-search-hit')[next];
        if (mark) {
            mark.classList.add('reader-search-hit-active');
            mark.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
    }, [currentHit, searchHits.length]);

    const clearSearch = useCallback(() => {
        const container = readerContainerRef.current?.querySelector('article');
        if (container) removeSearchMarks(container);
        setSearchQuery('');
        setSearchHits([]);
        setCurrentHit(-1);
    }, [removeSearchMarks]);

    const handleFile = useCallback(async (selected) => {
        if (!selected) return;
        const currentFile = selected[0];
        if (!currentFile) return;
        if (typeof window !== 'undefined' && window.speechSynthesis) {
            window.speechSynthesis.cancel();
        }
        setTtsStatus('idle');
        setAutoScrollEnabled(false);
        setFile(currentFile);
        setShowTocPanel(false);
        setBookmarks([]);
        setSelectionMenu({ open: false, x: 0, y: 0, text: '', note: '', noteOpen: false });
        selectionRangeRef.current = null;
        setSearchQuery('');
        setSearchHits([]);
        setCurrentHit(-1);
        setSearchCaseSensitive(false);
        setSearchWholeWord(false);
        setToc([]);
        setActiveLocation('');
        setContent('');
        setBookHtml('');
        setReadingProgress(0);
        setWordsTotal(0);
        setScrollTop(0);
        hasRestoredRef.current = false;
        resumeScrollRef.current = null;
        resumeLocationRef.current = '';
        setStatus({ type: 'info', message: 'Loading book…' });
        setControlsHidden(false);
        await enterFullscreenIfAvailable();
        const storageKey = buildReaderStorageKey(currentFile);
        const stateKey = buildReaderStateKey(currentFile);
        setBookKey(storageKey);
        setReaderStateKey(stateKey);
        if (stateKey && typeof window !== 'undefined') {
            try {
                const rawState = window.localStorage.getItem(stateKey);
                const parsedState = rawState ? JSON.parse(rawState) : null;
                const normalizedState = normalizeStoredReaderState(parsedState);
                if (normalizedState) {
                    setTheme(normalizedState.theme);
                    setThemeBrightness(normalizedState.brightness);
                    setThemeContrast(normalizedState.contrast);
                    setThemeSaturation(normalizedState.saturation);
                    setThemeWarmth(normalizedState.warmth);
                    setThemeTexture(normalizedState.texture);
                    setThemeVignette(normalizedState.vignette);
                    setThemeCustomBackground(normalizedState.customBackground);
                    setThemeCustomText(normalizedState.customText);
                    setThemeCustomAccent(normalizedState.customAccent);
                    setFontSize(normalizedState.fontSize);
                    setLineHeight(normalizedState.lineHeight);
                    setMargin(normalizedState.margin);
                    setReadingWidth(normalizedState.readingWidth);
                    setFontProfile(normalizedState.fontProfile);
                    setTextAlign(normalizedState.textAlign);
                    setParagraphIndent(normalizedState.paragraphIndent);
                    setParagraphSpacing(normalizedState.paragraphSpacing);
                    setLetterSpacing(normalizedState.letterSpacing);
                    setWordSpacing(normalizedState.wordSpacing);
                    setHyphenation(normalizedState.hyphenation);
                    setReadingSpeed(normalizedState.wpm);
                    setFocusMode(normalizedState.focusMode);
                    resumeScrollRef.current = normalizedState.scrollTop;
                    resumeLocationRef.current = normalizedState.activeLocation;
                } else {
                    setFontProfile(DEFAULT_READER_FONT_PROFILE);
                    setTextAlign(DEFAULT_READER_TEXT_ALIGN);
                    setParagraphIndent(DEFAULT_READER_PARAGRAPH_INDENT);
                    setParagraphSpacing(DEFAULT_READER_PARAGRAPH_SPACING);
                    setLetterSpacing(DEFAULT_READER_LETTER_SPACING);
                    setWordSpacing(DEFAULT_READER_WORD_SPACING);
                    setHyphenation(DEFAULT_READER_HYPHENATION);
                    setThemeBrightness(DEFAULT_THEME_BRIGHTNESS);
                    setThemeContrast(DEFAULT_THEME_CONTRAST);
                    setThemeSaturation(DEFAULT_THEME_SATURATION);
                    setThemeWarmth(DEFAULT_THEME_WARMTH);
                    setThemeTexture(DEFAULT_THEME_TEXTURE);
                    setThemeVignette(DEFAULT_THEME_VIGNETTE);
                    setThemeCustomBackground(DEFAULT_THEME_CUSTOM_BACKGROUND);
                    setThemeCustomText(DEFAULT_THEME_CUSTOM_TEXT);
                    setThemeCustomAccent(DEFAULT_THEME_CUSTOM_ACCENT);
                    setReadingWidth(DEFAULT_READING_WIDTH);
                    setReadingSpeed(DEFAULT_READING_SPEED);
                }
            } catch (error) {
                setFontProfile(DEFAULT_READER_FONT_PROFILE);
                setTextAlign(DEFAULT_READER_TEXT_ALIGN);
                setParagraphIndent(DEFAULT_READER_PARAGRAPH_INDENT);
                setParagraphSpacing(DEFAULT_READER_PARAGRAPH_SPACING);
                setLetterSpacing(DEFAULT_READER_LETTER_SPACING);
                setWordSpacing(DEFAULT_READER_WORD_SPACING);
                setHyphenation(DEFAULT_READER_HYPHENATION);
                setThemeBrightness(DEFAULT_THEME_BRIGHTNESS);
                setThemeContrast(DEFAULT_THEME_CONTRAST);
                setThemeSaturation(DEFAULT_THEME_SATURATION);
                setThemeWarmth(DEFAULT_THEME_WARMTH);
                setThemeTexture(DEFAULT_THEME_TEXTURE);
                setThemeVignette(DEFAULT_THEME_VIGNETTE);
                setThemeCustomBackground(DEFAULT_THEME_CUSTOM_BACKGROUND);
                setThemeCustomText(DEFAULT_THEME_CUSTOM_TEXT);
                setThemeCustomAccent(DEFAULT_THEME_CUSTOM_ACCENT);
                setReadingWidth(DEFAULT_READING_WIDTH);
                setReadingSpeed(DEFAULT_READING_SPEED);
            }
        } else {
            setFontProfile(DEFAULT_READER_FONT_PROFILE);
            setTextAlign(DEFAULT_READER_TEXT_ALIGN);
            setParagraphIndent(DEFAULT_READER_PARAGRAPH_INDENT);
            setParagraphSpacing(DEFAULT_READER_PARAGRAPH_SPACING);
            setLetterSpacing(DEFAULT_READER_LETTER_SPACING);
            setWordSpacing(DEFAULT_READER_WORD_SPACING);
            setHyphenation(DEFAULT_READER_HYPHENATION);
            setThemeBrightness(DEFAULT_THEME_BRIGHTNESS);
            setThemeContrast(DEFAULT_THEME_CONTRAST);
            setThemeSaturation(DEFAULT_THEME_SATURATION);
            setThemeWarmth(DEFAULT_THEME_WARMTH);
            setThemeTexture(DEFAULT_THEME_TEXTURE);
            setThemeVignette(DEFAULT_THEME_VIGNETTE);
            setThemeCustomBackground(DEFAULT_THEME_CUSTOM_BACKGROUND);
            setThemeCustomText(DEFAULT_THEME_CUSTOM_TEXT);
            setThemeCustomAccent(DEFAULT_THEME_CUSTOM_ACCENT);
            setReadingWidth(DEFAULT_READING_WIDTH);
            setReadingSpeed(DEFAULT_READING_SPEED);
        }
        if (storageKey && typeof window !== 'undefined') {
            try {
                const raw = window.localStorage.getItem(storageKey);
                const parsed = raw ? JSON.parse(raw) : null;
                const items = Array.isArray(parsed)
                    ? parsed
                    : (Array.isArray(parsed?.highlights) ? parsed.highlights : []);
                const restored = items.map(normalizeStoredHighlight).filter(Boolean);
                setHighlights(restored);
            } catch (error) {
                setHighlights([]);
            }
        } else {
            setHighlights([]);
        }
        try {
            if (currentFile.name.endsWith('.epub')) {
                const { default: JSZipLib } = await import('jszip');
                const zip = await JSZipLib.loadAsync(currentFile);
                const container = await zip.file('META-INF/container.xml')?.async('string');
                const rootfilePath = container?.match(/full-path="([^"]+)"/i)?.[1];
                const opfContent = rootfilePath ? await zip.file(rootfilePath)?.async('string') : null;
                const opfBaseDir = rootfilePath ? rootfilePath.split('/').slice(0, -1).join('/') : '';
                const parser = new DOMParser();
                const opfDoc = opfContent ? parser.parseFromString(opfContent, 'application/xml') : null;
                const manifest = new Map();
                const mediaTypeByPath = new Map();
                opfDoc?.querySelectorAll('manifest > item').forEach((item) => {
                    const id = item.getAttribute('id');
                    if (!id) return;
                    const href = item.getAttribute('href');
                    const mediaType = item.getAttribute('media-type') || '';
                    manifest.set(id, {
                        href,
                        mediaType,
                        properties: item.getAttribute('properties') ?? '',
                    });
                    if (href) {
                        const resolvedPath = resolveZipPath(href, opfBaseDir);
                        if (resolvedPath) {
                            mediaTypeByPath.set(resolvedPath, mediaType || inferEpubMediaTypeFromPath(resolvedPath));
                        }
                    }
                });
                const spineIds = Array.from(opfDoc?.querySelectorAll('spine > itemref') ?? []).map((item) => item.getAttribute('idref'));
                const spineItems = spineIds
                    .map((id) => {
                        const item = manifest.get(id);
                        if (!item?.href) return null;
                        const path = resolveZipPath(item.href, opfBaseDir);
                        return { path, href: item.href };
                    })
                    .filter(Boolean);

                const navItem = Array.from(manifest.values()).find((item) => item.properties.split(/\s+/).includes('nav'));
                const navLabelByPath = new Map();
                if (navItem?.href) {
                    const navPath = resolveZipPath(navItem.href, opfBaseDir);
                    const navDir = navPath.split('/').slice(0, -1).join('/');
                    const navContent = await zip.file(navPath)?.async('string');
                    if (navContent) {
                        const navDoc = parser.parseFromString(navContent, 'text/html');
                        const navRoot = navDoc.querySelector('nav[epub\\:type="toc"], nav[role="doc-toc"], nav');
                        const links = Array.from(navRoot?.querySelectorAll('a[href]') ?? []);
                        links.forEach((link) => {
                            const href = link.getAttribute('href');
                            const label = link.textContent?.trim();
                            if (!href || !label) return;
                            const filePart = href.split('#')[0];
                            const targetPath = filePart ? resolveZipPath(filePart, navDir) : navPath;
                            if (!navLabelByPath.has(targetPath)) {
                                navLabelByPath.set(targetPath, label);
                            }
                        });
                    }
                }

                const chapters = [];
                const tocItems = [];
                const resourceCache = new Map();
                for (const spineItem of spineItems) {
                    const chapter = await zip.file(spineItem.path)?.async('string');
                    if (!chapter) continue;
                    const chapterDoc = parser.parseFromString(chapter, 'text/html');
                    const chapterBody = await rewriteEpubChapterResources({
                        chapterDoc,
                        chapterPath: spineItem.path,
                        zip,
                        mediaTypeByPath,
                        cache: resourceCache,
                    });
                    const headingLabel = chapterDoc.querySelector('h1, h2, h3')?.textContent?.trim();
                    const order = tocItems.length + 1;
                    const chapterId = `chapter-${order}`;
                    const label = navLabelByPath.get(spineItem.path) || headingLabel || `Chapter ${order}`;
                    tocItems.push({ id: chapterId, label });
                    chapters.push(`<section id="${chapterId}" data-location="${chapterId}" class="reader-chapter">${chapterBody}</section>`);
                }
                const merged = chapters.join('\n');
                setBookHtml(merged);
                setBookTitle(opfDoc?.querySelector('metadata > title')?.textContent || currentFile.name);
                setToc(tocItems);
                setStatus({ type: 'success', message: 'EPUB loaded' });
                const restoredLocation = resumeLocationRef.current;
                const defaultLocation = tocItems[0]?.id ?? '';
                const location = restoredLocation && tocItems.some((item) => item.id === restoredLocation)
                    ? restoredLocation
                    : defaultLocation;
                setActiveLocation(location);
            } else if (currentFile.type === 'application/pdf' || currentFile.name.endsWith('.pdf')) {
                const [pdfjs, workerUrl] = await Promise.all([
                    import('pdfjs-dist'),
                    import('pdfjs-dist/build/pdf.worker.min.mjs?url'),
                ]);
                pdfjs.GlobalWorkerOptions.workerSrc = workerUrl.default;
                const data = await currentFile.arrayBuffer();
                const doc = await pdfjs.getDocument({ data }).promise;
                const pages = [];
                const tocItems = [];
                for (let pageIndex = 1; pageIndex <= Math.min(50, doc.numPages); pageIndex += 1) {
                    const page = await doc.getPage(pageIndex);
                    const textContent = await page.getTextContent();
                    const text = textContent.items.map((item) => item.str).join(' ');
                    const pageId = `page-${pageIndex}`;
                    tocItems.push({ id: pageId, label: `Page ${pageIndex}` });
                    pages.push(`<section id="${pageId}" data-location="${pageId}" class="reader-chapter"><p><span class="page-number">Page ${pageIndex}</span> ${escapeXml(text)}</p></section>`);
                }
                const merged = pages.join('\n');
                setBookHtml(merged);
                setBookTitle(currentFile.name);
                setToc(tocItems);
                setStatus({ type: 'success', message: 'PDF loaded (text extract)' });
                const restoredLocation = resumeLocationRef.current;
                const defaultLocation = tocItems[0]?.id ?? '';
                const location = restoredLocation && tocItems.some((item) => item.id === restoredLocation)
                    ? restoredLocation
                    : defaultLocation;
                setActiveLocation(location);
            } else {
                setStatus({ type: 'error', message: 'Unsupported file. Use EPUB or PDF.' });
            }
        } catch (error) {
            setStatus({ type: 'error', message: 'Unable to open book. Try another file.' });
        }
    }, [enterFullscreenIfAvailable]);

    const onReaderDragOver = useCallback((event) => {
        event.preventDefault();
        event.stopPropagation();
        setIsDragOver(true);
    }, []);

    const onReaderDragLeave = useCallback((event) => {
        if (event.relatedTarget && readerShellRef.current?.contains(event.relatedTarget)) return;
        setIsDragOver(false);
    }, []);

    const onReaderDrop = useCallback((event) => {
        event.preventDefault();
        setIsDragOver(false);
        const dropped = event.dataTransfer?.files;
        if (dropped && dropped.length) {
            handleFile(dropped);
        }
    }, [handleFile]);
    const loadReaderDemo = useCallback(() => {
        if (typeof window !== 'undefined' && window.speechSynthesis) {
            window.speechSynthesis.cancel();
        }
        enterFullscreenIfAvailable();
        setTtsStatus('idle');
        setAutoScrollEnabled(false);
        setFile(null);
        setBookTitle('Reader Workspace Demo');
        setShowTocPanel(false);
        setBookmarks([]);
        setSelectionMenu({ open: false, x: 0, y: 0, text: '', note: '', noteOpen: false });
        selectionRangeRef.current = null;
        setSearchQuery('');
        setSearchHits([]);
        setCurrentHit(-1);
        setSearchCaseSensitive(false);
        setSearchWholeWord(false);
        setContent('');
        setReadingProgress(0);
        setWordsTotal(0);
        setScrollTop(0);
        hasRestoredRef.current = false;
        resumeScrollRef.current = null;
        resumeLocationRef.current = '';
        setHighlights([]);
        setBookKey(READER_DEMO_STORAGE_KEY);
        setReaderStateKey(READER_DEMO_STATE_KEY);
        const tocItems = READER_DEMO_CHAPTERS.map((chapter) => ({ id: chapter.id, label: chapter.label }));
        const demoHtml = READER_DEMO_CHAPTERS.map((chapter) => (
            `<section id="${chapter.id}" data-location="${chapter.id}" class="reader-chapter">`
            + `<h2>${escapeXml(chapter.label)}</h2>`
            + chapter.body.map((paragraph) => `<p>${escapeXml(paragraph)}</p>`).join('')
            + '</section>'
        )).join('\n');
        setToc(tocItems);
        setBookHtml(demoHtml);
        setActiveLocation(tocItems[0]?.id ?? '');
        setShowControlCenter(true);
        setStatus({ type: 'success', message: 'Demo workspace loaded. Switch to your own EPUB/PDF anytime.' });
    }, [enterFullscreenIfAvailable]);

    const fileLabel = useMemo(() => {
        if (!file?.name) return 'No book loaded';
        if (file.name.length <= 46) return file.name;
        return `${file.name.slice(0, 43)}...`;
    }, [file]);
    const bookFormatLabel = useMemo(() => {
        const fileName = file?.name?.toLowerCase() ?? '';
        if (fileName.endsWith('.epub')) return 'EPUB';
        if (fileName.endsWith('.pdf')) return 'PDF';
        if (!file && bookHtml && bookTitle === 'Reader Workspace Demo') return 'Demo';
        return file ? 'Document' : 'Ready';
    }, [bookHtml, bookTitle, file]);
    const chapterCountLabel = useMemo(() => {
        if (!toc.length) return 'No chapters';
        return `${toc.length} ${toc.length === 1 ? 'chapter' : 'chapters'}`;
    }, [toc.length]);
    const wordCountLabel = useMemo(
        () => (wordsTotal ? `${wordsTotal.toLocaleString()} words` : 'Word count pending'),
        [wordsTotal]
    );
    const chapterJumpValue = useMemo(
        () => (toc.some((item) => item.id === activeLocation) ? activeLocation : ''),
        [activeLocation, toc]
    );
    const immersiveCurrentPage = useMemo(() => {
        if (!hasBookContent) return 0;
        if (toc.length) return clampNumber(activeChapterIndex + 1, 1, toc.length);
        return Math.max(1, Math.round(progressPercent || 1));
    }, [activeChapterIndex, hasBookContent, progressPercent, toc.length]);
    const immersiveTotalPages = useMemo(() => {
        if (!hasBookContent) return 0;
        if (toc.length) return toc.length;
        return 100;
    }, [hasBookContent, toc.length]);
    const immersivePageMetaLabel = useMemo(() => {
        if (!hasBookContent) return 'Load EPUB or PDF to begin';
        return `Page ${immersiveCurrentPage} of ${immersiveTotalPages}`;
    }, [hasBookContent, immersiveCurrentPage, immersiveTotalPages]);
    const immersiveViewportHeight = useMemo(
        () => (isFullscreen ? 'calc(100vh - 132px)' : 'calc(100vh - 156px)'),
        [isFullscreen]
    );
    const syncProgressToCloud = useCallback((progressValue) => {
        cloudSyncRef.current.lastProgressSync = Date.now();
        if (typeof console !== 'undefined') {
            console.debug('Cloud sync (stub): progress', progressValue);
        }
    }, []);
    const syncBookmarksToCloud = useCallback((marks) => {
        cloudSyncRef.current.lastBookmarkSync = Date.now();
        if (typeof console !== 'undefined') {
            console.debug('Cloud sync (stub): bookmarks', marks.length);
        }
    }, []);

    useEffect(() => {
        if (!bookHtml) return;
        setContent(applyStyles(bookHtml));
    }, [bookHtml, applyStyles]);
    useEffect(() => {
        if (!hasBookContent) return;
        syncProgressToCloud(progressPercent);
    }, [hasBookContent, progressPercent, syncProgressToCloud]);
    useEffect(() => {
        if (!hasBookContent) return;
        syncBookmarksToCloud(bookmarks);
    }, [bookmarks, hasBookContent, syncBookmarksToCloud]);

    if (controlCenterOnly) {
        return (
            <div
                ref={readerShellRef}
                className={`reader-kindlescape ${isFullscreen ? 'reader-kindlescape-fullscreen' : ''} ${focusMode ? 'reader-kindlescape-focus' : ''}`}
                onDragEnter={onReaderDragOver}
                onDragOver={onReaderDragOver}
                onDragLeave={onReaderDragLeave}
                onDrop={onReaderDrop}
            >
                <input
                    id="reader-file-input"
                    type="file"
                    accept=".epub,application/epub+zip,application/pdf,.pdf"
                    className="hidden"
                    onChange={(event) => handleFile(event.target.files)}
                />
                <header className="reader-topbar-kindle">
                    <div className="reader-topbar-left">
                        <label htmlFor="reader-file-input" className="reader-ghost-btn cursor-pointer">
                            <FaBookReader aria-hidden />
                            {hasBookContent ? 'Switch book' : 'Load book'}
                        </label>
                        <button
                            type="button"
                            className="reader-ghost-btn"
                            onClick={() => setWorkspaceMode('workspace')}
                            aria-label="Switch to workspace mode"
                        >
                            <FaSun aria-hidden />
                            Workspace
                        </button>
                        <div className="reader-title-meta">
                            <span className="reader-book-title" title={bookTitle}>{bookTitle}</span>
                            <span className="reader-book-sub">{bookFormatLabel} • {chapterCountLabel}</span>
                        </div>
                    </div>
                    <div className="reader-topbar-center">
                        <div className="reader-progress-line" role="presentation">
                            <div className="reader-progress-fill" style={{ width: `${progressPercent}%` }} />
                        </div>
                        <div className="reader-topbar-progress-meta" aria-live="polite">
                            <span>{immersivePageMetaLabel}</span>
                            <span>{progressPercent}%</span>
                            <span>{timeLeftLabel} left</span>
                        </div>
                    </div>
                    <div className="reader-topbar-right">
                        <button
                            type="button"
                            className="reader-icon-btn nav-fade-btn"
                            onClick={() => jumpToChapter('prev')}
                            disabled={!toc.length}
                            aria-label="Previous chapter"
                        >
                            <FaChevronLeft />
                        </button>
                        <button
                            type="button"
                            className="reader-icon-btn nav-fade-btn"
                            onClick={() => jumpToChapter('next')}
                            disabled={!toc.length}
                            aria-label="Next chapter"
                        >
                            <FaChevronRight />
                        </button>
                        <button
                            type="button"
                            className={`reader-icon-btn ${showTocPanel ? 'active' : ''}`}
                            onClick={() => setShowTocPanel((value) => !value)}
                            aria-label="Toggle table of contents"
                            aria-pressed={showTocPanel}
                        >
                            <FaListUl />
                        </button>
                        <button
                            type="button"
                            className="reader-icon-btn"
                            onClick={focusReaderSearch}
                            aria-label="Focus search"
                            disabled={!hasBookContent}
                        >
                            <FaSearch />
                        </button>
                        <button
                            type="button"
                            className={`reader-icon-btn ${showControlCenter ? 'active' : ''}`}
                            onClick={() => setShowControlCenter((value) => !value)}
                            aria-label="Toggle reader settings"
                            aria-pressed={showControlCenter}
                        >
                            <FaSlidersH />
                        </button>
                        <button
                            type="button"
                            className={`reader-icon-btn ${isFullscreen ? 'active' : ''}`}
                            onClick={toggleFullscreen}
                            aria-label={isFullscreen ? 'Exit full screen' : 'Enter full screen'}
                            aria-pressed={isFullscreen}
                        >
                            {isFullscreen ? <FaCompress /> : <FaExpand />}
                        </button>
                    </div>
                </header>

                {status ? (
                    <div className="px-4 pt-3">
                        <Alert color={status.type === 'success' ? 'success' : status.type === 'error' ? 'failure' : 'info'}>
                            {status.type === 'success' ? <FaCheckCircle className="mr-2 inline" /> : null}
                            <span className="font-medium">{status.message}</span>
                        </Alert>
                    </div>
                ) : null}

                <div className={`reader-layout-grid ${showTocPanel ? 'with-toc' : ''}`}>
                    <aside className={`reader-toc-drawer ${showTocPanel ? 'open' : ''}`} aria-label="Table of contents">
                        <div className="reader-toc-header">
                            <span>Table of contents</span>
                            <button type="button" className="reader-ghost-btn" onClick={() => setShowTocPanel(false)}>
                                Close
                            </button>
                        </div>
                        <div className="reader-toc-list">
                            {renderTocButtons((id) => jumpToLocation(id, { closePanel: true }))}
                        </div>
                    </aside>
                    <div
                        className={`reader-toc-scrim ${showTocPanel ? 'open' : ''}`}
                        onClick={() => setShowTocPanel(false)}
                        aria-hidden={!showTocPanel}
                    />
                    <section className="reader-page-area" aria-live="polite">
                        {hasBookContent ? (
                            <>
                                <button
                                    type="button"
                                    className="reader-nav-fade nav-left"
                                    onClick={() => jumpToChapter('prev')}
                                    disabled={!toc.length}
                                    aria-label="Previous chapter"
                                >
                                    <FaChevronLeft />
                                </button>
                                <button
                                    type="button"
                                    className="reader-nav-fade nav-right"
                                    onClick={() => jumpToChapter('next')}
                                    disabled={!toc.length}
                                    aria-label="Next chapter"
                                >
                                    <FaChevronRight />
                                </button>
                                <div
                                    ref={readerContainerRef}
                                    className="reader-page-scroll"
                                    style={{ color: themeTextColor, background: themeBackgroundColor, maxHeight: immersiveViewportHeight }}
                                    onMouseUp={handleSelectionChange}
                                    onKeyUp={handleSelectionChange}
                                    onTouchStart={onReaderTouchStart}
                                    onTouchEnd={(event) => {
                                        handleSelectionChange();
                                        onReaderTouchEnd(event);
                                    }}
                                    onScroll={() => selectionMenu.open && closeSelectionMenu()}
                                >
                                    <div className="reader-page-surface" style={{ maxWidth: `${readingWidth}px` }}>
                                        <div dangerouslySetInnerHTML={{ __html: content }} />
                                    </div>
                                    {selectionMenu.open ? (
                                        <div
                                            ref={selectionMenuRef}
                                            className="reader-selection-menu"
                                            style={{ left: `${selectionMenu.x}px`, top: `${selectionMenu.y}px` }}
                                            onMouseDown={(event) => event.stopPropagation()}
                                            onMouseUp={(event) => event.stopPropagation()}
                                            onKeyUp={(event) => event.stopPropagation()}
                                        >
                                            <div className="reader-selection-card">
                                                <p className="reader-selection-text">
                                                    {selectionMenu.text.length > 80 ? `${selectionMenu.text.slice(0, 80)}…` : selectionMenu.text}
                                                </p>
                                                <div className="reader-selection-section">
                                                    <span className="reader-selection-section-title">Quick actions</span>
                                                    <div className="reader-selection-quick">
                                                        <button type="button" onClick={() => createAnnotation({ kind: 'highlight' })}>
                                                            Highlight
                                                        </button>
                                                        <button type="button" onClick={() => createAnnotation({ kind: 'underline' })}>
                                                            Underline
                                                        </button>
                                                        <button
                                                            type="button"
                                                            onClick={() => {
                                                                setSelectionMenu((prev) => ({ ...prev, noteOpen: !prev.noteOpen }));
                                                                window.setTimeout(() => noteInputRef.current?.focus(), 0);
                                                            }}
                                                        >
                                                            Note
                                                        </button>
                                                        <button type="button" onClick={handleCopySelection}>
                                                            Copy
                                                        </button>
                                                        <button type="button" onClick={handleShareSelection}>
                                                            Share
                                                        </button>
                                                    </div>
                                                </div>
                                                <div className="reader-selection-section">
                                                    <span className="reader-selection-section-title">Highlight color</span>
                                                    <div className="reader-selection-actions">
                                                        {READER_HIGHLIGHT_PALETTE.map((option) => (
                                                            <button
                                                                key={option.id}
                                                                type="button"
                                                                className="reader-highlight-option"
                                                                style={{ '--highlight-swatch': option.swatch }}
                                                                onClick={() => createAnnotation({ kind: 'highlight', colorId: option.id })}
                                                                aria-label={`Highlight in ${option.label}`}
                                                            />
                                                        ))}
                                                    </div>
                                                </div>
                                                {selectionMenu.noteOpen ? (
                                                    <div className="reader-selection-section">
                                                        <span className="reader-selection-section-title">Note</span>
                                                        <textarea
                                                            ref={noteInputRef}
                                                            rows={3}
                                                            className="reader-selection-note"
                                                            placeholder="Add a quick note..."
                                                            value={selectionMenu.note}
                                                            onChange={(event) => setSelectionMenu((prev) => ({ ...prev, note: event.target.value }))}
                                                        />
                                                        <div className="reader-selection-note-actions">
                                                            <button
                                                                type="button"
                                                                className="reader-selection-note-save"
                                                                onClick={() => createAnnotation({ kind: 'highlight', note: selectionMenu.note })}
                                                                disabled={!selectionMenu.note.trim()}
                                                            >
                                                                Save Note
                                                            </button>
                                                            <button
                                                                type="button"
                                                                className="reader-selection-note-cancel"
                                                                onClick={() => setSelectionMenu((prev) => ({ ...prev, noteOpen: false, note: '' }))}
                                                            >
                                                                Cancel
                                                            </button>
                                                        </div>
                                                    </div>
                                                ) : null}
                                                <p className="reader-selection-feedback">Tap and hold to highlight; notes stay linked to location.</p>
                                            </div>
                                        </div>
                                    ) : null}
                                </div>
                                <div className="reader-inline-hud">
                                    <span>{activeChapterLabel}</span>
                                    <span>{progressPercent}%</span>
                                    <span>{timeLeftLabel} left</span>
                                </div>
                            </>
                        ) : (
                            <div className={`reader-empty reader-drop ${isDragOver ? 'drag-active' : ''}`}>
                                <div className="reader-empty-copy">
                                    <p className="reader-empty-title">Drop an EPUB or PDF</p>
                                    <p className="reader-empty-subtitle">Minimal reading mode with saved position, highlights, and notes.</p>
                                    <div className="reader-empty-actions">
                                        <Button as="label" htmlFor="reader-file-input" color="dark">
                                            <FaBookReader className="mr-2" /> Choose a file
                                        </Button>
                                        <Button color="gray" outline onClick={loadReaderDemo}>
                                            <FaBolt className="mr-2" /> Launch demo
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        )}
                    </section>
                </div>

                <div className={`reader-bottom-scrim ${showControlCenter ? 'open' : ''}`} onClick={() => setShowControlCenter(false)} />
                <section className={`reader-bottom-sheet ${showControlCenter ? 'open' : ''}`} aria-label="Reader preferences">
                    <div className="reader-bottom-grip" aria-hidden="true" />
                    <div className="reader-bottom-grid">
                        <div className="reader-setting reader-setting-search">
                            <p className="reader-setting-label">Search in book</p>
                            <div className="reader-utility-bar" role="toolbar" aria-label="Reader search">
                                <div className="reader-search-field">
                                    <FaSearch className="reader-search-icon" />
                                    <input
                                        ref={searchInputRef}
                                        type="search"
                                        value={searchQuery}
                                        onChange={(event) => setSearchQuery(event.target.value)}
                                        className="reader-search-input"
                                        placeholder={hasBookContent ? 'Search text' : 'Load a book to search'}
                                        disabled={!hasBookContent}
                                        aria-label="Search text in book"
                                    />
                                    {searchQuery ? (
                                        <button
                                            type="button"
                                            className="reader-search-clear"
                                            onClick={clearSearch}
                                            aria-label="Clear search"
                                        >
                                            <FaTimes />
                                        </button>
                                    ) : null}
                                </div>
                                <div className="reader-search-controls">
                                    <span>{searchHits.length > 0 ? `${currentHit + 1}/${searchHits.length}` : '0/0'}</span>
                                    <button
                                        type="button"
                                        className={`reader-nav-btn ${searchHits.length === 0 ? 'opacity-50 cursor-not-allowed' : ''}`}
                                        onClick={() => jumpToHit('prev')}
                                        aria-label="Previous match"
                                        disabled={searchHits.length === 0}
                                    >
                                        <FaChevronLeft />
                                    </button>
                                    <button
                                        type="button"
                                        className={`reader-nav-btn ${searchHits.length === 0 ? 'opacity-50 cursor-not-allowed' : ''}`}
                                        onClick={() => jumpToHit('next')}
                                        aria-label="Next match"
                                        disabled={searchHits.length === 0}
                                    >
                                        <FaChevronRight />
                                    </button>
                                    <button
                                        type="button"
                                        className={`reader-toggle ${searchCaseSensitive ? 'active' : ''}`}
                                        onClick={() => setSearchCaseSensitive((value) => !value)}
                                        aria-pressed={searchCaseSensitive}
                                        title="Case sensitive"
                                    >
                                        Aa
                                    </button>
                                    <button
                                        type="button"
                                        className={`reader-toggle ${searchWholeWord ? 'active' : ''}`}
                                        onClick={() => setSearchWholeWord((value) => !value)}
                                        aria-pressed={searchWholeWord}
                                        title="Whole word"
                                    >
                                        W
                                    </button>
                                </div>
                            </div>
                        </div>
                        <div className="reader-setting">
                            <p className="reader-setting-label">Theme</p>
                            <div className="reader-pill-row">
                                {KINDLE_THEME_SHORTCUTS.map((preset) => (
                                    <button
                                        key={preset.id}
                                        type="button"
                                        className={`reader-pill-btn ${theme === preset.id ? 'active' : ''}`}
                                        onClick={() => setTheme(preset.id)}
                                        aria-pressed={theme === preset.id}
                                    >
                                        {preset.label}
                                    </button>
                                ))}
                            </div>
                        </div>
                        <div className="reader-setting">
                            <p className="reader-setting-label">Font size</p>
                            <div className="reader-slider-row">
                                <button
                                    type="button"
                                    className="reader-icon-btn"
                                    onClick={() => setFontSize((value) => clampNumber(Number(value) - 1, 14, 26))}
                                    aria-label="Decrease font size"
                                >
                                    <FaMinus />
                                </button>
                                <input
                                    type="range"
                                    min="14"
                                    max="26"
                                    step="1"
                                    value={fontSize}
                                    onChange={(event) => setFontSize(Number(event.target.value))}
                                    className="reader-slider"
                                    aria-label="Font size"
                                />
                                <button
                                    type="button"
                                    className="reader-icon-btn"
                                    onClick={() => setFontSize((value) => clampNumber(Number(value) + 1, 14, 26))}
                                    aria-label="Increase font size"
                                >
                                    <FaPlus />
                                </button>
                                <span className="reader-setting-value">{fontSize}px</span>
                            </div>
                        </div>
                        <div className="reader-setting">
                            <p className="reader-setting-label">Line height</p>
                            <input
                                type="range"
                                min="1.4"
                                max="2.1"
                                step="0.05"
                                value={lineHeight}
                                onChange={(event) => setLineHeight(Number(event.target.value))}
                                className="reader-slider"
                                aria-label="Line height"
                            />
                            <span className="reader-setting-value">{lineHeight.toFixed(2)}</span>
                        </div>
                        <div className="reader-setting">
                            <p className="reader-setting-label">Column width</p>
                            <input
                                type="range"
                                min="680"
                                max="1100"
                                step="10"
                                value={readingWidth}
                                onChange={(event) => setReadingWidth(Number(event.target.value))}
                                className="reader-slider"
                                aria-label="Column width"
                            />
                            <span className="reader-setting-value">{readingWidth}px</span>
                        </div>
                        <div className="reader-setting">
                            <p className="reader-setting-label">Tools</p>
                            <div className="reader-pill-row">
                                <button
                                    type="button"
                                    className={`reader-pill-btn ${focusMode ? 'active' : ''}`}
                                    onClick={() => setFocusMode((value) => !value)}
                                    aria-pressed={focusMode}
                                >
                                    Focus
                                </button>
                                <button
                                    type="button"
                                    className={`reader-pill-btn ${autoScrollEnabled ? 'active' : ''}`}
                                    onClick={() => setAutoScrollEnabled((value) => !value)}
                                    aria-pressed={autoScrollEnabled}
                                >
                                    Auto-scroll
                                </button>
                                <button
                                    type="button"
                                    className={`reader-pill-btn ${showTocPanel ? 'active' : ''}`}
                                    onClick={() => setShowTocPanel((value) => !value)}
                                    aria-pressed={showTocPanel}
                                >
                                    Chapters
                                </button>
                            </div>
                        </div>
                    </div>
                    <div className="reader-bottom-actions">
                        <div className="reader-bottom-inline">
                            <span className="reader-status-chip">{chapterProgressLabel}</span>
                            <span className="reader-status-chip">{progressPercent}% complete</span>
                            <span className="reader-status-chip">{timeLeftLabel} left</span>
                        </div>
                        <div className="reader-bottom-buttons">
                            <Button color="gray" outline onClick={() => setShowControlCenter(false)}>
                                Done
                            </Button>
                            <Button color="dark" onClick={() => addBookmark()} disabled={!activeLocation}>
                                <FaBookmark className="mr-2" /> Bookmark
                            </Button>
                        </div>
                    </div>
                </section>
            </div>
        );
    }

    return (
        <div
            ref={readerShellRef}
            className={`ebook-reader-shell space-y-space-xl ${isFullscreen ? 'ebook-reader-fullscreen' : ''} ${isDragOver ? 'ebook-reader-dragging' : ''} ${focusMode ? 'ebook-reader-focus' : ''}`}
            onDragEnter={onReaderDragOver}
            onDragOver={onReaderDragOver}
            onDragLeave={onReaderDragLeave}
            onDrop={onReaderDrop}
        >
            {focusMode ? (
                <div className="reader-focus-hud" role="status" aria-live="polite">
                    <span className="reader-focus-chip">Focus mode</span>
                    <span className="reader-focus-meta">{progressPercent}% • {timeLeftLabel} left</span>
                    <Button size="xs" color="light" onClick={() => setFocusMode(false)} className="reader-focus-exit">
                        Exit (F)
                    </Button>
                </div>
            ) : null}
            <div className="ebook-reader-grid grid gap-space-xl lg:grid-cols-[1fr,320px]">
                <div className="relative space-y-space-md">
                    <input
                        id="reader-file-input"
                        type="file"
                        accept=".epub,application/epub+zip,application/pdf,.pdf"
                        className="hidden"
                        onChange={(event) => handleFile(event.target.files)}
                    />
                    <section
                        className={`ebook-reader-hero transition-opacity duration-300 ${focusMode && controlsHidden ? 'ebook-reader-controls-hidden' : ''}`}
                        aria-label="Reader session summary"
                    >
                        <span className="ebook-reader-orb ebook-reader-orb-left" aria-hidden="true" />
                        <span className="ebook-reader-orb ebook-reader-orb-right" aria-hidden="true" />
                        <div className="ebook-reader-hero-content">
                            <div className="max-w-3xl space-y-space-xs">
                                <span className="ebook-reader-badge">
                                    <FaBookReader /> Reader Workspace
                                </span>
                                <h2 className="ebook-reader-title">{hasBookContent ? bookTitle : 'Reader'}</h2>
                                <p className="ebook-reader-subtitle">
                                    {hasBookContent
                                        ? `${chapterCountLabel} • ${wordCountLabel}. Reader workspace keeps your session in flow.`
                                        : 'Drop a book to start. Theme, notes, and reading position are saved automatically.'}
                                </p>
                                {!MINIMAL_READER_UI ? (
                                    <div className="reader-feature-strip" role="list" aria-label="Reader workspace features">
                                        {READER_WORKSPACE_FEATURES.map((feature) => {
                                            const FeatureIcon = feature.icon;
                                            return (
                                                <span key={feature.id} className="reader-feature-pill" role="listitem">
                                                    <FeatureIcon aria-hidden="true" />
                                                    <span>{feature.label}</span>
                                                </span>
                                            );
                                        })}
                                    </div>
                                ) : null}
                            </div>
                            {!MINIMAL_READER_UI ? (
                                <div className="ebook-reader-hero-stats" aria-live="polite">
                                    <span className="ebook-glass-chip">
                                        <span className="ebook-glass-chip-label">Format</span>
                                        <span className="ebook-glass-chip-value">{bookFormatLabel}</span>
                                    </span>
                                    <span className="ebook-glass-chip">
                                        <span className="ebook-glass-chip-label">Progress</span>
                                        <span className="ebook-glass-chip-value">{progressPercent}%</span>
                                    </span>
                                    <span className="ebook-glass-chip">
                                        <span className="ebook-glass-chip-label">Chapter</span>
                                        <span className="ebook-glass-chip-value">{chapterProgressLabel}</span>
                                    </span>
                                    <span className="ebook-glass-chip">
                                        <span className="ebook-glass-chip-label">Time Left</span>
                                        <span className="ebook-glass-chip-value">{timeLeftLabel}</span>
                                    </span>
                                </div>
                            ) : null}
                        </div>
                        <div className={`ebook-reader-progress ${hudVisible ? '' : 'reader-hud-hidden'}`} aria-hidden={!hasBookContent}>
                            <div className="ebook-reader-progress-track">
                                <input
                                    type="range"
                                    min="0"
                                    max="100"
                                    step="1"
                                    value={progressSliderValue}
                                    onChange={(event) => scrubToProgress(Number(event.target.value))}
                                    className="reader-progress-scrubber"
                                    aria-label="Scrub reading progress"
                                    disabled={!hasBookContent}
                                />
                                <div className="ebook-reader-progress-bar" style={{ width: `${progressPercent}%` }} />
                            </div>
                            <div className="ebook-reader-progress-meta">
                                <span>{chapterCountLabel}</span>
                                <span>{wordCountLabel}</span>
                                <span>{activeReaderPresetLabel}</span>
                                <span>{timeLeftLabel} left</span>
                            </div>
                        </div>
                        <div className="reader-mode-toggle" role="group" aria-label="Reader interface density">
                            <span className="reader-mode-label">Interface</span>
                            <button
                                type="button"
                                className={`reader-mode-btn ${workspaceMode === 'immersive' ? 'active' : ''}`}
                                onClick={() => setWorkspaceMode('immersive')}
                                aria-pressed={workspaceMode === 'immersive'}
                            >
                                <FaMoon className="mr-2" /> Immersive
                            </button>
                            <button
                                type="button"
                                className={`reader-mode-btn ${workspaceMode === 'workspace' ? 'active' : ''}`}
                                onClick={() => setWorkspaceMode('workspace')}
                                aria-pressed={workspaceMode === 'workspace'}
                            >
                                <FaSun className="mr-2" /> Workspace
                            </button>
                            <span className="reader-mode-legend">
                                {workspaceMode === 'workspace'
                                    ? 'Full toolbars, presets, and panels are visible.'
                                    : 'Minimal chrome with floating control center.'}
                            </span>
                        </div>
                        <div className="reader-hero-actions">
                            <Button as="label" htmlFor="reader-file-input" color="dark" className="cursor-pointer">
                                <FaBookReader className="mr-2" /> {hasBookContent ? 'Switch book' : 'Load EPUB/PDF'}
                            </Button>
                            <Button color="gray" outline onClick={openReaderToc} disabled={!toc.length}>
                                <FaListUl className="mr-2" /> Chapters
                            </Button>
                            <Button color="gray" outline onClick={focusReaderSearch} disabled={!hasBookContent}>
                                <FaSearch className="mr-2" /> Search
                            </Button>
                            <Button color="gray" outline onClick={addBookmark} disabled={!activeLocation}>
                                <FaBookmark className="mr-2" /> Bookmark
                            </Button>
                            <Button
                                color={focusMode ? 'dark' : 'gray'}
                                outline={!focusMode}
                                onClick={() => setFocusMode((value) => !value)}
                                disabled={!hasBookContent}
                            >
                                <FaLightbulb className="mr-2" /> Focus
                            </Button>
                            <Button color="gray" outline onClick={toggleFullscreen}>
                                {isFullscreen ? <FaCompress className="mr-2" /> : <FaExpand className="mr-2" />}
                                {isFullscreen ? 'Exit full' : 'Fullscreen'}
                            </Button>
                            <Button color="gray" outline onClick={() => setShowControlCenter(true)}>
                                <FaSlidersH className="mr-2" /> Controls
                            </Button>
                            <Button
                                color="gray"
                                outline={!hudAutoHide}
                                onClick={() => setHudAutoHide((value) => !value)}
                            >
                                {hudAutoHide ? 'Auto-hide on' : 'Auto-hide off'}
                            </Button>
                        </div>
                    </section>
                    <div className={`reader-glass-toolbar reader-topbar flex flex-wrap items-center gap-space-sm transition-opacity duration-300 ${focusMode && controlsHidden ? 'ebook-reader-controls-hidden' : ''} ${hudVisible ? '' : 'reader-hud-hidden'}`}>
                        <div className="reader-topbar-left">
                            <Button as="label" htmlFor="reader-file-input" color="dark" className="cursor-pointer">
                                <FaBookReader className="mr-2" /> Library
                            </Button>
                            <span className="reader-file-pill" title={file?.name || 'No book loaded'}>
                                {fileLabel}
                            </span>
                        </div>
                        {hasBookContent ? (
                            <div className="reader-topbar-middle" role="group" aria-label="Jump navigation">
                                <button type="button" className="reader-nav-chip" onClick={() => jumpToChapter('prev')} disabled={!toc.length}>
                                    <FaChevronLeft /> Prev
                                </button>
                                <select
                                    id="reader-top-chapter-select"
                                    className="reader-chapter-jump-select"
                                    value={chapterJumpValue}
                                    onChange={(event) => jumpToLocation(event.target.value)}
                                    disabled={!toc.length}
                                >
                                    <option value="" disabled>{toc.length ? 'Jump to chapter' : 'No chapters yet'}</option>
                                    {toc.map((item) => (
                                        <option key={item.id} value={item.id}>{item.label}</option>
                                    ))}
                                </select>
                                <button type="button" className="reader-nav-chip" onClick={() => jumpToChapter('next')} disabled={!toc.length}>
                                    Next <FaChevronRight />
                                </button>
                            </div>
                        ) : null}
                        <div className="reader-topbar-right" role="group" aria-label="Quick controls">
                            {KINDLE_THEME_SHORTCUTS.map((preset) => (
                                <button
                                    key={preset.id}
                                    type="button"
                                    className={`reader-theme-chip ${theme === preset.id ? 'active' : ''}`}
                                    onClick={() => setTheme(preset.id)}
                                    title={preset.description}
                                    aria-pressed={theme === preset.id}
                                >
                                    {preset.label}
                                </button>
                            ))}
                            <div className="reader-topbar-font" aria-label="Font size">
                                <button
                                    type="button"
                                    className="reader-topbar-icon"
                                    onClick={() => setFontSize((value) => clampNumber(Number(value) - 1, 14, 26))}
                                    aria-label="Decrease font size"
                                >
                                    <FaMinus />
                                </button>
                                <span className="reader-font-value">{fontSize}px</span>
                                <button
                                    type="button"
                                    className="reader-topbar-icon"
                                    onClick={() => setFontSize((value) => clampNumber(Number(value) + 1, 14, 26))}
                                    aria-label="Increase font size"
                                >
                                    <FaPlus />
                                </button>
                            </div>
                            <button
                                type="button"
                                className={`reader-topbar-icon ${focusMode ? 'active' : ''}`}
                                onClick={() => setFocusMode((value) => !value)}
                                aria-label="Toggle focus mode"
                                aria-pressed={focusMode}
                                disabled={!hasBookContent}
                            >
                                <FaLightbulb />
                            </button>
                            <button
                                type="button"
                                className={`reader-topbar-icon ${showControlCenter ? 'active' : ''}`}
                                onClick={() => setShowControlCenter((value) => !value)}
                                aria-label="Toggle reading control center"
                                aria-pressed={showControlCenter}
                            >
                                <FaSlidersH />
                            </button>
                            <button
                                type="button"
                                className={`reader-topbar-icon ${isFullscreen ? 'active' : ''}`}
                                onClick={toggleFullscreen}
                                aria-label={isFullscreen ? 'Exit full screen' : 'Enter full screen'}
                                aria-pressed={isFullscreen}
                            >
                                {isFullscreen ? <FaCompress /> : <FaExpand />}
                            </button>
                        </div>
                    </div>

                {status && (
                    <Alert color={status.type === 'success' ? 'success' : status.type === 'error' ? 'failure' : 'info'}>
                        {status.type === 'success' ? <FaCheckCircle className="mr-2 inline" /> : null}
                        <span className="font-medium">{status.message}</span>
                    </Alert>
                )}

                {!controlCenterOnly && hasBookContent ? (
                    <section className={`reader-session-strip transition-opacity duration-300 ${focusMode && controlsHidden ? 'ebook-reader-controls-hidden' : ''}`}>
                        <div className="reader-session-strip-header">
                            <div>
                                <p className="reader-session-title">Reading timeline</p>
                                <p className="reader-session-subtitle">{activeChapterLabel}</p>
                            </div>
                            <span className="reader-session-badge">{chapterProgressLabel}</span>
                        </div>
                        <div className="reader-session-strip-controls">
                            <button
                                type="button"
                                className="reader-session-nav-btn"
                                onClick={() => jumpToChapterIndex(chapterSliderValue - 2)}
                                disabled={!toc.length || chapterSliderValue <= 1}
                                aria-label="Previous chapter"
                            >
                                <FaChevronLeft />
                            </button>
                            <input
                                type="range"
                                min="1"
                                max={Math.max(1, toc.length)}
                                step="1"
                                value={chapterSliderValue}
                                onChange={(event) => jumpToChapterIndex(Number(event.target.value) - 1)}
                                className="reader-session-slider"
                                aria-label="Jump chapter"
                                disabled={!toc.length}
                            />
                            <button
                                type="button"
                                className="reader-session-nav-btn"
                                onClick={() => jumpToChapterIndex(chapterSliderValue)}
                                disabled={!toc.length || chapterSliderValue >= toc.length}
                                aria-label="Next chapter"
                            >
                                <FaChevronRight />
                            </button>
                            <button
                                type="button"
                                className="reader-session-action"
                                onClick={focusReaderSearch}
                            >
                                Search
                            </button>
                            <button
                                type="button"
                                className="reader-session-action"
                                onClick={() => setShowControlCenter(true)}
                            >
                                Control center
                            </button>
                        </div>
                        <div className="reader-session-strip-meta">
                            <span>{progressPercent}% complete</span>
                            <span>{timeLeftLabel} left</span>
                            <span>{wordsTotal ? `${wordsTotal.toLocaleString()} words` : 'Word count pending'}</span>
                        </div>
                    </section>
                ) : null}

                {!controlCenterOnly ? (
                <div className={`reader-glass-toolbar reader-preset-toolbar flex flex-wrap gap-space-sm items-center transition-opacity duration-300 ${focusMode && controlsHidden ? 'ebook-reader-controls-hidden' : ''}`}>
                    <span className="reader-toolbar-label">Reading profile</span>
                    <div className="reader-chip-row">
                        {READER_EXPERIENCE_PRESETS.map((preset) => {
                            const PresetIcon = getReaderPresetAppIcon(preset.id);
                            return (
                                <button
                                    key={preset.id}
                                    type="button"
                                    className={`reader-pill ${activeReaderPresetId === preset.id ? 'active' : ''}`}
                                    onClick={() => applyReaderExperiencePreset(preset.id)}
                                    title={preset.description}
                                >
                                    {PresetIcon ? <PresetIcon className="reader-pill-app-icon" aria-hidden="true" /> : null}
                                    <span>{preset.label}</span>
                                </button>
                            );
                        })}
                        <button
                            type="button"
                            className={`reader-pill ${activeReaderPresetId ? '' : 'active'}`}
                            onClick={() => {
                                setTheme('light');
                                setFontSize(DEFAULT_READER_FONT_SIZE);
                                setLineHeight(DEFAULT_READER_LINE_HEIGHT);
                                setMargin(DEFAULT_READER_MARGIN);
                                setReadingWidth(DEFAULT_READING_WIDTH);
                                setFontProfile(DEFAULT_READER_FONT_PROFILE);
                                setTextAlign(DEFAULT_READER_TEXT_ALIGN);
                                setParagraphIndent(DEFAULT_READER_PARAGRAPH_INDENT);
                                setParagraphSpacing(DEFAULT_READER_PARAGRAPH_SPACING);
                                setLetterSpacing(DEFAULT_READER_LETTER_SPACING);
                                setWordSpacing(DEFAULT_READER_WORD_SPACING);
                                setHyphenation(DEFAULT_READER_HYPHENATION);
                                setThemeBrightness(DEFAULT_THEME_BRIGHTNESS);
                                setThemeContrast(DEFAULT_THEME_CONTRAST);
                                setThemeSaturation(DEFAULT_THEME_SATURATION);
                                setThemeWarmth(DEFAULT_THEME_WARMTH);
                                setThemeTexture(DEFAULT_THEME_TEXTURE);
                                setThemeVignette(DEFAULT_THEME_VIGNETTE);
                                setThemeCustomBackground(DEFAULT_THEME_CUSTOM_BACKGROUND);
                                setThemeCustomText(DEFAULT_THEME_CUSTOM_TEXT);
                                setThemeCustomAccent(DEFAULT_THEME_CUSTOM_ACCENT);
                                setReadingSpeed(DEFAULT_READING_SPEED);
                            }}
                        >
                            Default
                        </button>
                    </div>
                </div>
                ) : null}

                {!controlCenterOnly ? (
                <div className={`reader-glass-toolbar flex flex-wrap gap-space-sm items-center transition-opacity duration-300 ${focusMode && controlsHidden ? 'ebook-reader-controls-hidden' : ''}`}>
                    <div className="reader-slider">
                        <div className="reader-slider-meta">
                            <span className="reader-slider-label"><FaFont className="mr-1" /> Font size</span>
                            <span className="reader-slider-value">{fontSize}px</span>
                        </div>
                        <input
                            type="range"
                            min="12"
                            max="28"
                            step="1"
                            value={fontSize}
                            onChange={(event) => setFontSize(clampNumber(event.target.value, 12, 28))}
                            className="reader-slider-input"
                        />
                        <div className="reader-slider-steps">
                            <span>12</span>
                            <span>16</span>
                            <span>20</span>
                            <span>24</span>
                            <span>28</span>
                        </div>
                    </div>
                    <div className="reader-slider">
                        <div className="reader-slider-meta">
                            <span className="reader-slider-label"><FaListUl className="mr-1" /> Margins</span>
                            <span className="reader-slider-value">{margin}px</span>
                        </div>
                        <input
                            type="range"
                            min="4"
                            max="24"
                            step="1"
                            value={margin}
                            onChange={(event) => setMargin(clampNumber(event.target.value, 4, 24))}
                            className="reader-slider-input"
                        />
                        <div className="reader-slider-steps">
                            <span>4</span>
                            <span>8</span>
                            <span>12</span>
                            <span>16</span>
                            <span>24</span>
                        </div>
                    </div>
                    <div className="reader-slider">
                        <div className="reader-slider-meta">
                            <span className="reader-slider-label"><FaExpand className="mr-1" /> Width</span>
                            <span className="reader-slider-value">{readingWidth}px</span>
                        </div>
                        <input
                            type="range"
                            min="640"
                            max="1200"
                            step="20"
                            value={readingWidth}
                            onChange={(event) => setReadingWidth(clampNumber(event.target.value, 640, 1200))}
                            className="reader-slider-input"
                        />
                        <div className="reader-slider-steps">
                            <span>640</span>
                            <span>820</span>
                            <span>980</span>
                            <span>1100</span>
                            <span>1200</span>
                        </div>
                    </div>
                    <div className="reader-slider">
                        <div className="reader-slider-meta">
                            <span className="reader-slider-label"><FaTint className="mr-1" /> Line height</span>
                            <span className="reader-slider-value">{lineHeight.toFixed(2)}</span>
                        </div>
                        <input
                            type="range"
                            min="1.2"
                            max="2.2"
                            step="0.05"
                            value={lineHeight}
                            onChange={(event) => setLineHeight(clampNumber(event.target.value, 1.2, 2.2))}
                            className="reader-slider-input"
                        />
                        <div className="reader-slider-steps">
                            <span>1.2</span>
                            <span>1.4</span>
                            <span>1.7</span>
                            <span>2.0</span>
                            <span>2.2</span>
                        </div>
                    </div>
                    <div className="reader-chip-row">
                        {FONT_SIZE_PRESETS.map((preset) => (
                            <button
                                key={preset.label}
                                type="button"
                                className={`reader-pill ${fontSize === preset.size ? 'active' : ''}`}
                                onClick={() => setFontSize(preset.size)}
                            >
                                {preset.label}
                            </button>
                        ))}
                        {READING_WIDTH_PRESETS.map((preset) => (
                            <button
                                key={preset.label}
                                type="button"
                                className={`reader-pill ${readingWidth === preset.width ? 'active' : ''}`}
                                onClick={() => setReadingWidth(preset.width)}
                            >
                                {preset.label}
                            </button>
                        ))}
                        <button
                            type="button"
                            className="reader-pill"
                            onClick={() => {
                                setFontSize(DEFAULT_READER_FONT_SIZE);
                                setLineHeight(DEFAULT_READER_LINE_HEIGHT);
                                setMargin(DEFAULT_READER_MARGIN);
                                setReadingWidth(DEFAULT_READING_WIDTH);
                                setFontProfile(DEFAULT_READER_FONT_PROFILE);
                                setTextAlign(DEFAULT_READER_TEXT_ALIGN);
                                setParagraphIndent(DEFAULT_READER_PARAGRAPH_INDENT);
                                setParagraphSpacing(DEFAULT_READER_PARAGRAPH_SPACING);
                                setLetterSpacing(DEFAULT_READER_LETTER_SPACING);
                                setWordSpacing(DEFAULT_READER_WORD_SPACING);
                                setHyphenation(DEFAULT_READER_HYPHENATION);
                            }}
                        >
                            Reset type
                        </button>
                    </div>
                    <div className="flex items-center gap-space-xs rounded-radius-full bg-gray-100 dark:bg-slate-800 px-space-sm py-[6px] text-sm">
                        <FaBolt className="text-gray-500" />
                        <Button size="xs" color="gray" onClick={() => setReadingSpeed((value) => Math.max(120, value - 10))}><FaMinus /></Button>
                        <span className="min-w-[58px] text-center">{readingSpeed} wpm</span>
                        <Button size="xs" color="gray" onClick={() => setReadingSpeed((value) => Math.min(520, value + 10))}><FaPlus /></Button>
                    </div>
                </div>
                ) : null}

                {!controlCenterOnly ? (
                <div className={`flex flex-wrap gap-space-sm items-center transition-opacity duration-300 ${focusMode && controlsHidden ? 'ebook-reader-controls-hidden' : ''}`}>
                    <Button
                        color="dark"
                        onClick={startSpeech}
                        disabled={!ttsSupported || !hasBookContent}
                        className="flex items-center gap-space-xs"
                    >
                        <FaPlay /> Read aloud
                    </Button>
                    <Button
                        color="gray"
                        outline
                        onClick={toggleSpeechPause}
                        disabled={!ttsSupported || ttsStatus === 'idle'}
                        className="flex items-center gap-space-xs"
                    >
                        {ttsStatus === 'paused' ? <FaPlay /> : <FaPause />}
                        {ttsStatus === 'paused' ? 'Resume' : 'Pause'}
                    </Button>
                    <Button
                        color="gray"
                        outline
                        onClick={stopSpeech}
                        disabled={!ttsSupported || ttsStatus === 'idle'}
                        className="flex items-center gap-space-xs"
                    >
                        <FaStop /> Stop
                    </Button>
                    <div className="flex items-center gap-space-xs rounded-radius-full bg-gray-100 dark:bg-slate-800 px-space-sm py-[6px] text-sm">
                        <FaVolumeUp className="text-gray-500" />
                        <Select
                            value={ttsVoice}
                            onChange={(event) => setTtsVoice(event.target.value)}
                            className="min-w-[180px]"
                            disabled={!ttsSupported || !ttsVoices.length}
                        >
                            {ttsVoices.length ? ttsVoices.map((voice) => (
                                <option key={voice.name} value={voice.name}>{voice.name}</option>
                            )) : <option value="">System voice</option>}
                        </Select>
                    </div>
                    <div className="flex items-center gap-space-xs rounded-radius-full bg-gray-100 dark:bg-slate-800 px-space-sm py-[6px] text-sm">
                        <span className="text-gray-500 text-xs">Rate</span>
                        <input
                            type="range"
                            min="0.7"
                            max="1.4"
                            step="0.05"
                            value={ttsRate}
                            onChange={(event) => setTtsRate(Number(event.target.value))}
                            className="h-1.5 w-28 accent-cyan-500"
                        />
                        <span className="min-w-[44px] text-center">{ttsRate.toFixed(2)}x</span>
                    </div>
                    <div className="flex items-center gap-space-xs rounded-radius-full bg-gray-100 dark:bg-slate-800 px-space-sm py-[6px] text-sm">
                        <span className="text-gray-500 text-xs">Pitch</span>
                        <input
                            type="range"
                            min="0.8"
                            max="1.4"
                            step="0.05"
                            value={ttsPitch}
                            onChange={(event) => setTtsPitch(Number(event.target.value))}
                            className="h-1.5 w-24 accent-cyan-500"
                        />
                        <span className="min-w-[44px] text-center">{ttsPitch.toFixed(2)}</span>
                    </div>
                    <Badge color="gray" className="text-xs">
                        {ttsSupported ? (ttsStatus === 'playing' ? 'Speaking…' : ttsStatus === 'paused' ? 'Paused' : 'Ready') : 'TTS not supported'}
                    </Badge>
                </div>
                ) : null}

                {!controlCenterOnly ? (
                <div className={`flex flex-wrap gap-space-sm items-center transition-opacity duration-300 ${focusMode && controlsHidden ? 'ebook-reader-controls-hidden' : ''}`}>
                    <Button
                        color={autoScrollEnabled ? 'dark' : 'gray'}
                        outline={!autoScrollEnabled}
                        onClick={() => setAutoScrollEnabled((value) => !value)}
                        className="flex items-center gap-space-xs"
                        disabled={!hasBookContent}
                    >
                        {autoScrollEnabled ? <FaPause /> : <FaPlay />}
                        {autoScrollEnabled ? 'Stop auto-scroll' : 'Auto-scroll'}
                    </Button>
                    <div className="flex items-center gap-space-xs rounded-radius-full bg-gray-100 dark:bg-slate-800 px-space-sm py-[6px] text-sm">
                        <span className="text-gray-500 text-xs">Speed</span>
                        <input
                            type="range"
                            min="20"
                            max="220"
                            step="10"
                            value={autoScrollSpeed}
                            onChange={(event) => setAutoScrollSpeed(Number(event.target.value))}
                            className="h-1.5 w-32 accent-cyan-500"
                            disabled={!hasBookContent}
                        />
                        <span className="min-w-[56px] text-center">{autoScrollSpeed}px/s</span>
                    </div>
                </div>
                ) : null}

                {!controlCenterOnly ? (
                <div className={`reader-glass-toolbar flex flex-wrap gap-space-sm transition-opacity duration-300 ${focusMode && controlsHidden ? 'ebook-reader-controls-hidden' : ''}`}>
                    {Object.entries(READER_THEMES).map(([key, value]) => {
                        const ThemeIcon = getReaderThemeIcon(key);
                        return (
                            <Button
                                key={key}
                                color={theme === key ? 'dark' : 'gray'}
                                onClick={() => setTheme(key)}
                                className={`flex items-center gap-space-xs reader-theme-chip ${theme === key ? 'active' : ''}`}
                                aria-pressed={theme === key}
                                pill
                            >
                                <span className="reader-theme-dot" style={{ background: value.background }} />
                                <ThemeIcon />
                                <span className="reader-theme-label">{value.name}</span>
                            </Button>
                        );
                    })}
                    <Button
                        color="gray"
                        outline
                        onClick={openReaderToc}
                        aria-expanded={showTocPanel}
                        aria-controls="reader-toc-panel"
                    >
                        <FaListUl className="mr-2" /> Chapters
                    </Button>
                    <Button color="gray" outline onClick={() => jumpToChapter('prev')} disabled={!toc.length}>
                        <FaChevronLeft className="mr-2" /> Prev
                    </Button>
                    <Button color="gray" outline onClick={() => jumpToChapter('next')} disabled={!toc.length}>
                        Next <FaChevronRight className="ml-2" />
                    </Button>
                    <Button color="gray" outline onClick={addBookmark} disabled={!activeLocation}>
                        <FaBookmark className="mr-2" /> Bookmark
                    </Button>
                </div>
                ) : null}

                {!controlCenterOnly ? (
                <div className={`reader-utility-bar transition-opacity duration-300 ${focusMode && controlsHidden ? 'ebook-reader-controls-hidden' : ''}`} role="toolbar" aria-label="Reader search">
                    <div className="reader-search-field">
                        <FaSearch className="reader-search-icon" />
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(event) => setSearchQuery(event.target.value)}
                            placeholder="Search in book…"
                            ref={searchInputRef}
                            onKeyDown={(event) => {
                                if (event.key === 'Enter') {
                                    event.preventDefault();
                                    if (event.shiftKey) {
                                        jumpToHit('prev');
                                    } else {
                                        jumpToHit('next');
                                    }
                                }
                            }}
                            className="reader-search-input"
                        />
                        {searchQuery ? (
                            <button
                                type="button"
                                className="reader-search-clear"
                                onClick={clearSearch}
                                aria-label="Clear search"
                            >
                                <FaTimes />
                            </button>
                        ) : null}
                    </div>
                    <div className="reader-search-controls">
                        <span>{searchHits.length > 0 ? `${currentHit + 1}/${searchHits.length}` : '0/0'}</span>
                        <button
                            type="button"
                            className={`reader-nav-btn ${searchHits.length === 0 ? 'opacity-50 cursor-not-allowed' : ''}`}
                            onClick={() => jumpToHit('prev')}
                            aria-label="Previous match"
                            disabled={searchHits.length === 0}
                        >
                            <FaChevronLeft />
                        </button>
                        <button
                            type="button"
                            className={`reader-nav-btn ${searchHits.length === 0 ? 'opacity-50 cursor-not-allowed' : ''}`}
                            onClick={() => jumpToHit('next')}
                            aria-label="Next match"
                            disabled={searchHits.length === 0}
                        >
                            <FaChevronRight />
                        </button>
                        <button
                            type="button"
                            className={`reader-toggle ${searchCaseSensitive ? 'active' : ''}`}
                            onClick={() => setSearchCaseSensitive((value) => !value)}
                            aria-pressed={searchCaseSensitive}
                            title="Case sensitive"
                        >
                            Aa
                        </button>
                        <button
                            type="button"
                            className={`reader-toggle ${searchWholeWord ? 'active' : ''}`}
                            onClick={() => setSearchWholeWord((value) => !value)}
                            aria-pressed={searchWholeWord}
                            title="Whole word"
                        >
                            W
                        </button>
                    </div>
                </div>
                ) : null}

                <div className="ebook-reader-surface overflow-hidden rounded-radius-lg border border-gray-200 dark:border-gray-700 shadow-inner" style={{ background: themeBackgroundColor }}>
                    <div
                        ref={readerContainerRef}
                        className="reader-scroll-root relative overflow-y-auto"
                        style={{
                            padding: 0,
                            maxHeight: isFullscreen ? 'calc(100vh - 260px)' : '70vh',
                            height: isFullscreen ? 'calc(100vh - 260px)' : undefined,
                        }}
                        onMouseUp={handleSelectionChange}
                        onKeyUp={handleSelectionChange}
                        onTouchStart={onReaderTouchStart}
                        onTouchEnd={(event) => {
                            handleSelectionChange();
                            onReaderTouchEnd(event);
                        }}
                        onScroll={() => selectionMenu.open && closeSelectionMenu()}
                    >
                                <div className="reader-inline-progress" aria-hidden="true">
                                    <div className="reader-inline-progress-track">
                                        <div className="reader-inline-progress-bar" style={{ width: `${progressPercent}%` }} />
                                    </div>
                                    <span className="reader-inline-progress-label">{progressPercent}%</span>
                                </div>
                        {!hasBookContent ? (
                            <div className={`reader-empty-state ${isDragOver ? 'drag-active' : ''}`}>
                                <div className="reader-empty-shell">
                                    <div className="reader-empty-copy">
                                        <p className="reader-empty-title">Drop an EPUB or PDF</p>
                                        <p className="reader-empty-subtitle">Drag a file here or pick one to start reading. Your highlights, notes, and position auto-save.</p>
                                        <div className="reader-empty-hints">
                                            <span className="reader-empty-hint">EPUB and PDF support</span>
                                            <span className="reader-empty-hint">Notes and highlights auto-save</span>
                                            <span className="reader-empty-hint">Press `/` to search after loading</span>
                                        </div>
                                        <div className="reader-empty-actions">
                                            <Button as="label" htmlFor="reader-file-input" color="dark">
                                                <FaBookReader className="mr-2" /> Choose a file
                                            </Button>
                                            <Button color="gray" outline onClick={loadReaderDemo}>
                                                <FaBolt className="mr-2" /> Launch demo
                                            </Button>
                                            <Button color="gray" outline onClick={openShortcutsInControlCenter}>
                                                <FaKeyboard className="mr-2" /> View shortcuts
                                            </Button>
                                        </div>
                                    </div>
                                    <div className="reader-empty-steps" aria-label="Reader quick start">
                                        <div className="reader-empty-step">
                                            <span className="reader-empty-step-index">1</span>
                                            <div className="reader-empty-step-copy">
                                                <strong>Load book</strong>
                                                <span>Drop EPUB or PDF, or launch demo mode instantly.</span>
                                            </div>
                                        </div>
                                        <div className="reader-empty-step">
                                            <span className="reader-empty-step-index">2</span>
                                            <div className="reader-empty-step-copy">
                                                <strong>Tune experience</strong>
                                                <span>Adjust theme, typography, and reading rhythm from control center.</span>
                                            </div>
                                        </div>
                                        <div className="reader-empty-step">
                                            <span className="reader-empty-step-index">3</span>
                                            <div className="reader-empty-step-copy">
                                                <strong>Capture insights</strong>
                                                <span>Use TOC, bookmarks, highlights, underlines, and notes while reading.</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ) : null}
                        <div dangerouslySetInnerHTML={{ __html: hasBookContent ? content : '' }} />
                        {hasBookContent ? (
                            <div className={`reader-quick-dock ${hudVisible ? '' : 'reader-hud-hidden'}`} role="toolbar" aria-label="Reader quick actions">
                                <div className="reader-quick-meta">
                                    <span className="reader-quick-meta-label">{chapterProgressLabel}</span>
                                    <span className="reader-quick-meta-value">{progressPercent}%</span>
                                </div>
                                <button
                                    type="button"
                                    className="reader-quick-btn"
                                    onClick={() => jumpToChapter('prev')}
                                    disabled={!toc.length}
                                    aria-label="Previous chapter"
                                >
                                    <FaChevronLeft />
                                </button>
                                <button
                                    type="button"
                                    className="reader-quick-btn"
                                    onClick={() => jumpToChapter('next')}
                                    disabled={!toc.length}
                                    aria-label="Next chapter"
                                >
                                    <FaChevronRight />
                                </button>
                                <button
                                    type="button"
                                    className="reader-quick-btn"
                                    title="Open table of contents"
                                    onClick={openReaderToc}
                                    disabled={!toc.length}
                                    aria-label="Open table of contents"
                                >
                                    <FaListUl />
                                </button>
                                <button
                                    type="button"
                                    className="reader-quick-btn"
                                    title="Add bookmark"
                                    onClick={addBookmark}
                                    disabled={!activeLocation}
                                    aria-label="Add bookmark"
                                >
                                    <FaBookmark />
                                </button>
                                <button
                                    type="button"
                                    className={`reader-quick-btn ${focusMode ? 'active' : ''}`}
                                    title={focusMode ? 'Disable focus mode' : 'Enable focus mode'}
                                    onClick={() => setFocusMode((value) => !value)}
                                    aria-pressed={focusMode}
                                    aria-label="Toggle focus mode"
                                >
                                    <FaLightbulb />
                                </button>
                                <button
                                    type="button"
                                    className="reader-quick-btn"
                                    title="Focus search"
                                    onClick={focusReaderSearch}
                                    aria-label="Focus search"
                                >
                                    <FaSearch />
                                </button>
                                <button
                                    type="button"
                                    className={`reader-quick-btn ${showControlCenter ? 'active' : ''}`}
                                    title="Open reading control center"
                                    onClick={() => setShowControlCenter(true)}
                                    aria-label="Open reading control center"
                                >
                                    <FaSlidersH />
                                </button>
                                <button
                                    type="button"
                                    className={`reader-quick-btn ${autoScrollEnabled ? 'active' : ''}`}
                                    title={autoScrollEnabled ? 'Stop auto-scroll' : 'Start auto-scroll'}
                                    onClick={() => setAutoScrollEnabled((value) => !value)}
                                    aria-pressed={autoScrollEnabled}
                                    aria-label="Toggle auto-scroll"
                                >
                                    {autoScrollEnabled ? <FaPause /> : <FaPlay />}
                                </button>
                                <button
                                    type="button"
                                    className="reader-quick-btn"
                                    title="Back to top"
                                    onClick={scrollReaderToTop}
                                    aria-label="Back to top"
                                >
                                    <FaArrowUp />
                                </button>
                            </div>
                        ) : null}
                        {selectionMenu.open ? (
                            <div
                                ref={selectionMenuRef}
                                className="reader-selection-menu"
                                style={{ left: `${selectionMenu.x}px`, top: `${selectionMenu.y}px` }}
                                onMouseDown={(event) => event.stopPropagation()}
                                onMouseUp={(event) => event.stopPropagation()}
                                onKeyUp={(event) => event.stopPropagation()}
                            >
                                <div className="reader-selection-card">
                                    <p className="reader-selection-text">
                                        {selectionMenu.text.length > 80 ? `${selectionMenu.text.slice(0, 80)}…` : selectionMenu.text}
                                    </p>
                                    <div className="reader-selection-section">
                                        <span className="reader-selection-section-title">Quick actions</span>
                                        <div className="reader-selection-quick">
                                            <button type="button" onClick={() => createAnnotation({ kind: 'highlight' })}>
                                                Highlight
                                            </button>
                                            <button type="button" onClick={() => createAnnotation({ kind: 'underline' })}>
                                                Underline
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setSelectionMenu((prev) => ({ ...prev, noteOpen: !prev.noteOpen }));
                                                    window.setTimeout(() => noteInputRef.current?.focus(), 0);
                                                }}
                                            >
                                                Note
                                            </button>
                                            <button type="button" onClick={handleCopySelection}>
                                                Copy
                                            </button>
                                            <button type="button" onClick={handleShareSelection}>
                                                Share
                                            </button>
                                        </div>
                                    </div>
                                    <div className="reader-selection-section">
                                        <span className="reader-selection-section-title">Highlight color</span>
                                        <div className="reader-selection-actions">
                                            {READER_HIGHLIGHT_PALETTE.map((option) => (
                                                <button
                                                    key={option.id}
                                                    type="button"
                                                    className="reader-highlight-option"
                                                    style={{ '--highlight-swatch': option.swatch }}
                                                    onClick={() => createAnnotation({ kind: 'highlight', colorId: option.id })}
                                                    aria-label={`Highlight in ${option.label}`}
                                                />
                                            ))}
                                        </div>
                                    </div>
                                    {selectionMenu.noteOpen ? (
                                        <div className="reader-selection-section">
                                            <span className="reader-selection-section-title">Note</span>
                                            <textarea
                                                ref={noteInputRef}
                                                rows={3}
                                                className="reader-selection-note"
                                                placeholder="Add a quick note..."
                                                value={selectionMenu.note}
                                                onChange={(event) => setSelectionMenu((prev) => ({ ...prev, note: event.target.value }))}
                                            />
                                            <div className="reader-selection-note-actions">
                                                <button
                                                    type="button"
                                                    className="reader-selection-note-save"
                                                    onClick={() => createAnnotation({ kind: 'highlight', note: selectionMenu.note })}
                                                    disabled={!selectionMenu.note.trim()}
                                                >
                                                    Save Note
                                                </button>
                                                <button
                                                    type="button"
                                                    className="reader-selection-note-cancel"
                                                    onClick={() => setSelectionMenu((prev) => ({ ...prev, noteOpen: false, note: '' }))}
                                                >
                                                    Cancel
                                                </button>
                                            </div>
                                        </div>
                                    ) : null}
                                    <p className="reader-selection-feedback">Tip: underline key lines or attach a note for recall.</p>
                                </div>
                            </div>
                        ) : null}
                    </div>
                </div>

                {!controlCenterOnly && showTocPanel ? (
                    <section
                        id="reader-toc-panel"
                        className="mt-space-md rounded-radius-lg border border-gray-200 dark:border-gray-700 bg-white/95 dark:bg-slate-900/95 p-space-md shadow-sm"
                        aria-label="Table of contents panel"
                    >
                        <div className="flex items-center justify-between text-sm font-semibold">
                            <span>Table of contents</span>
                            <button
                                type="button"
                                onClick={() => setShowTocPanel(false)}
                                className="rounded-radius-sm border border-gray-200 dark:border-gray-700 px-2 py-1 text-xs text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                                aria-label="Close chapters panel"
                            >
                                Close
                            </button>
                        </div>
                        <div className="mt-space-sm max-h-[70vh] overflow-y-auto divide-y divide-gray-100 dark:divide-gray-800">
                            {renderTocButtons((id) => jumpToLocation(id, { closePanel: true }))}
                        </div>
                    </section>
                ) : null}
            </div>

            {(!MINIMAL_READER_UI || showControlCenter) ? (
            <aside className="space-y-space-md">
                <div className="ebook-glass-panel rounded-radius-lg border border-gray-200 dark:border-gray-700 bg-white/80 dark:bg-slate-900/80 p-space-md shadow-sm">
                    <p className="text-xs uppercase font-semibold text-gray-500 dark:text-gray-400">Now reading</p>
                    <p className="text-lg font-semibold text-gray-900 dark:text-white">{bookTitle}</p>
                </div>

                <div className="ebook-glass-panel rounded-radius-lg border border-gray-200 dark:border-gray-700 bg-white/80 dark:bg-slate-900/80 p-space-md shadow-sm space-y-space-sm reader-rhythm-panel">
                    <div className="flex items-center justify-between text-sm font-semibold">
                        <span>Reading rhythm</span>
                        <span className="reader-rhythm-speed">{readingSpeed} wpm</span>
                    </div>
                    <div className="reader-rhythm-track" aria-hidden="true">
                        <div className="reader-rhythm-bar" style={{ width: `${progressPercent}%` }} />
                    </div>
                    <div className="reader-rhythm-grid text-xs">
                        <div>
                            <p className="reader-rhythm-label">Progress</p>
                            <p className="reader-rhythm-value">{progressPercent}%</p>
                        </div>
                        <div>
                            <p className="reader-rhythm-label">Chapter</p>
                            <p className="reader-rhythm-value">{chapterProgressLabel}</p>
                        </div>
                        <div>
                            <p className="reader-rhythm-label">Time left</p>
                            <p className="reader-rhythm-value">{timeLeftLabel}</p>
                        </div>
                    </div>
                </div>

                <div
                    ref={tocSidebarRef}
                    className="ebook-glass-panel rounded-radius-lg border border-gray-200 dark:border-gray-700 bg-white/80 dark:bg-slate-900/80 p-space-md shadow-sm space-y-space-sm"
                >
                    <div className="flex items-center justify-between text-sm font-semibold">
                        <span>Table of contents</span>
                        <FaListUl className="text-gray-500" />
                    </div>
                    <div className="max-h-60 overflow-y-auto divide-y divide-gray-100 dark:divide-gray-800">
                        {renderTocButtons((id) => jumpToLocation(id))}
                    </div>
                </div>

                <div className="ebook-glass-panel rounded-radius-lg border border-gray-200 dark:border-gray-700 bg-white/80 dark:bg-slate-900/80 p-space-md shadow-sm space-y-space-xs">
                    <div className="flex items-center gap-space-xs text-sm font-semibold">
                        <FaBookmark className="text-amber-500" /> Bookmarks
                    </div>
                    {bookmarks.length ? bookmarks.map((mark) => (
                        <button key={mark} type="button" className="w-full text-left" onClick={() => jumpToLocation(mark)}>
                            <Badge color="warning" className="w-full justify-start">
                                {bookmarkLabels.get(mark) || mark}
                            </Badge>
                        </button>
                    )) : <p className="text-xs text-gray-500">No bookmarks yet.</p>}
                </div>

                <div className="ebook-glass-panel rounded-radius-lg border border-gray-200 dark:border-gray-700 bg-white/80 dark:bg-slate-900/80 p-space-md shadow-sm space-y-space-sm">
                    <div className="flex items-center justify-between text-sm font-semibold">
                        <span>Highlights, underlines &amp; notes</span>
                        <div className="flex items-center gap-space-xs">
                            <span className="text-xs text-gray-400">{highlights.length}</span>
                            <Button
                                size="xs"
                                color="gray"
                                outline
                                disabled={!highlights.length}
                                onClick={exportHighlights}
                                className="flex items-center gap-space-xs"
                            >
                                <FaDownload className="text-xs" /> Export
                            </Button>
                            <Button
                                size="xs"
                                color="gray"
                                outline
                                onClick={() => importHighlightsInputRef.current?.click()}
                                className="flex items-center gap-space-xs"
                            >
                                <FaUpload className="text-xs" /> Import
                            </Button>
                            <input
                                ref={importHighlightsInputRef}
                                type="file"
                                accept="application/json"
                                className="hidden"
                                onChange={importHighlights}
                            />
                            <Button
                                size="xs"
                                color="gray"
                                outline
                                disabled={!highlights.length}
                                onClick={() => {
                                    if (!highlights.length) return;
                                    const confirmClear = typeof window !== 'undefined'
                                        ? window.confirm('Clear all highlights, underlines, and notes for this book?')
                                        : false;
                                    if (confirmClear) clearAllHighlights();
                                }}
                            >
                                Clear all
                            </Button>
                        </div>
                    </div>
                    {highlights.length ? (
                        <div className="space-y-space-sm">
                            {highlights.map((item) => {
                                const isUnderline = item.kind === 'underline';
                                const palette = isUnderline ? null : (highlightPaletteMap.get(item.color) ?? READER_HIGHLIGHT_PALETTE[0]);
                                const chipClass = isUnderline ? 'reader-underline-chip' : `${palette.className} reader-highlight`;
                                const chipLabel = isUnderline ? 'Underline' : (palette?.label ?? 'Highlight');
                                const locationLabel = item.locationId ? bookmarkLabels.get(item.locationId) : null;
                                return (
                                    <div key={item.id} className="rounded-radius-md border border-gray-100 dark:border-gray-800 bg-white/70 dark:bg-slate-900/70 p-space-sm space-y-space-xs">
                                        <div className="flex items-start justify-between gap-space-sm">
                                            <div className="space-y-[2px]">
                                                <span className={`inline-flex items-center gap-2 text-xs font-semibold ${chipClass}`}>
                                                    {chipLabel}
                                                </span>
                                                <p className="text-sm text-gray-700 dark:text-gray-200">
                                                    {item.text || 'Highlighted passage'}
                                                </p>
                                                {locationLabel ? (
                                                    <p className="text-xs text-gray-400">From {locationLabel}</p>
                                                ) : null}
                                            </div>
                                            <div className="flex flex-col gap-2">
                                                <Button size="xs" color="gray" onClick={() => jumpToHighlight(item.id, item.locationId)}>
                                                    Jump
                                                </Button>
                                                <Button size="xs" color="gray" outline onClick={() => deleteHighlight(item.id)}>
                                                    Remove
                                                </Button>
                                            </div>
                                        </div>
                                        <Textarea
                                            rows={2}
                                            value={item.note}
                                            onChange={(event) => updateHighlightNote(item.id, event.target.value)}
                                            placeholder="Add a note..."
                                        />
                                    </div>
                                );
                            })}
                        </div>
                    ) : (
                        <p className="text-xs text-gray-500">Select text and add a highlight, underline, or note to start.</p>
                    )}
                </div>
            </aside>
            ) : null}
            </div>
            {showControlCenter ? (
                <section
                    ref={controlCenterRef}
                    className={`reader-floating-control-center ${isControlCenterDragging ? 'dragging' : ''}`}
                    style={controlCenterFloatingStyle}
                    aria-label="Reading control center"
                >
                    <div className="reader-floating-control-header" onPointerDown={startControlCenterDrag}>
                        <div className="reader-floating-control-title">
                            <h3>Reading Control Center</h3>
                            <span>Drag header and resize from corner</span>
                        </div>
                        <div className="reader-floating-control-actions">
                            <Button
                                color="gray"
                                outline
                                size="xs"
                                onClick={resetControlCenterPosition}
                                aria-label="Reset reading control center position"
                            >
                                Reset
                            </Button>
                            <Button
                                color="gray"
                                outline
                                size="xs"
                                onClick={() => setShowControlCenter(false)}
                                aria-label="Close reading control center"
                            >
                                <FaTimes />
                            </Button>
                        </div>
                    </div>
                    <div className="reader-control-center space-y-space-md">
                        <div className="reader-glass-toolbar reader-control-summary">
                            <div className="reader-control-summary-copy">
                                <p className="reader-control-title">Fine-tune your reading session</p>
                                <p className="reader-control-subtitle">Adjust layout, profile, navigation, and assistive tools from one place.</p>
                            </div>
                            <div className="reader-control-metrics">
                                <span className="reader-status-chip">{progressPercent}% complete</span>
                                <span className="reader-status-chip">{chapterProgressLabel}</span>
                                <span className="reader-status-chip">{activeReaderPresetLabel}</span>
                                <span className="reader-status-chip">{timeLeftLabel} left</span>
                            </div>
                        </div>

                        {hasBookContent ? (
                            <section className="reader-glass-toolbar reader-control-card reader-control-card-wide" aria-label="Quick commands">
                                <div className="reader-command-deck-header">
                                    <p className="reader-command-deck-title">Quick commands</p>
                                    <div className="reader-command-deck-meta">
                                        <span>{chapterProgressLabel}</span>
                                        <span>{progressPercent}%</span>
                                        <span>{timeLeftLabel} left</span>
                                    </div>
                                </div>
                                <div className="reader-command-grid">
                                    <button
                                        type="button"
                                        className="reader-command-btn"
                                        onClick={openReaderToc}
                                        disabled={!toc.length}
                                    >
                                        <FaListUl aria-hidden />
                                        <span>Chapters</span>
                                    </button>
                                    <button
                                        type="button"
                                        className="reader-command-btn"
                                        onClick={focusReaderSearch}
                                    >
                                        <FaSearch aria-hidden />
                                        <span>Search</span>
                                    </button>
                                    <button
                                        type="button"
                                        className="reader-command-btn"
                                        onClick={addBookmark}
                                        disabled={!activeLocation}
                                    >
                                        <FaBookmark aria-hidden />
                                        <span>Bookmark</span>
                                    </button>
                                    <button
                                        type="button"
                                        className={`reader-command-btn ${focusMode ? 'active' : ''}`}
                                        onClick={() => setFocusMode((value) => !value)}
                                        aria-pressed={focusMode}
                                    >
                                        <FaLightbulb aria-hidden />
                                        <span>{focusMode ? 'Focus on' : 'Focus mode'}</span>
                                    </button>
                                    <button
                                        type="button"
                                        className={`reader-command-btn ${showControlCenter ? 'active' : ''}`}
                                        onClick={() => setShowControlCenter((value) => !value)}
                                        aria-pressed={showControlCenter}
                                    >
                                        <FaSlidersH aria-hidden />
                                        <span>Controls</span>
                                    </button>
                                    <button
                                        type="button"
                                        className={`reader-command-btn ${isFullscreen ? 'active' : ''}`}
                                        onClick={toggleFullscreen}
                                        aria-pressed={isFullscreen}
                                    >
                                        {isFullscreen ? <FaCompress aria-hidden /> : <FaExpand aria-hidden />}
                                        <span>{isFullscreen ? 'Exit full' : 'Fullscreen'}</span>
                                    </button>
                                </div>
                            </section>
                        ) : null}

                        <div className="reader-control-grid">
                            <section className="reader-glass-toolbar reader-control-card reader-control-card-wide">
                                <div className="reader-control-card-header">
                                    <h3>Library & navigation</h3>
                                    <p>Load books, open chapters, and move through the text quickly.</p>
                                </div>
                                <div className="reader-control-actions">
                                    <Button as="label" htmlFor="reader-file-input" color="dark" className="cursor-pointer">
                                        <FaBookReader className="mr-2" /> Load EPUB/PDF
                                    </Button>
                                    <Badge color="gray" className="text-xs">{file ? file.name : 'No book loaded'}</Badge>
                                    <Button
                                        color="gray"
                                        outline
                                        onClick={openReaderToc}
                                        aria-expanded={showTocPanel}
                                        aria-controls="reader-toc-panel"
                                    >
                                        <FaListUl className="mr-2" /> Chapters
                                    </Button>
                                    <Button color="gray" outline onClick={() => jumpToChapter('prev')} disabled={!toc.length}>
                                        <FaChevronLeft className="mr-2" /> Prev
                                    </Button>
                                    <Button color="gray" outline onClick={() => jumpToChapter('next')} disabled={!toc.length}>
                                        Next <FaChevronRight className="ml-2" />
                                    </Button>
                                    <Button color="gray" outline onClick={addBookmark} disabled={!activeLocation}>
                                        <FaBookmark className="mr-2" /> Bookmark
                                    </Button>
                                    <Button
                                        color={focusMode ? 'dark' : 'gray'}
                                        outline={!focusMode}
                                        onClick={() => setFocusMode((value) => !value)}
                                        className="flex items-center gap-space-xs"
                                    >
                                        {focusMode ? 'Focus mode on' : 'Focus mode'}
                                    </Button>
                                    <Button
                                        color="gray"
                                        outline
                                        onClick={toggleFullscreen}
                                        className="flex items-center gap-space-xs"
                                    >
                                        {isFullscreen ? <FaCompress className="mr-2" /> : <FaExpand className="mr-2" />}
                                        {isFullscreen ? 'Exit full screen' : 'Full screen'}
                                    </Button>
                                    <Button
                                        color="gray"
                                        outline
                                        onClick={openShortcutsInControlCenter}
                                        className="flex items-center gap-space-xs"
                                    >
                                        <FaKeyboard className="mr-2" /> Shortcuts
                                    </Button>
                                </div>
                                <div className="reader-control-inline">
                                    <div className="reader-chapter-jump reader-chapter-jump-wide">
                                        <label htmlFor="reader-control-chapter-select" className="reader-chapter-jump-label">Jump to chapter</label>
                                        <select
                                            id="reader-control-chapter-select"
                                            className="reader-chapter-jump-select"
                                            value={chapterJumpValue}
                                            onChange={(event) => jumpToLocation(event.target.value)}
                                            disabled={!toc.length}
                                        >
                                            <option value="" disabled>{toc.length ? 'Choose chapter' : 'No chapters yet'}</option>
                                            {toc.map((item) => (
                                                <option key={item.id} value={item.id}>{item.label}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <Button
                                        color="gray"
                                        outline
                                        onClick={scrollReaderToTop}
                                        disabled={!hasBookContent}
                                        className="flex items-center gap-space-xs"
                                    >
                                        <FaArrowUp className="mr-2" /> Back to top
                                    </Button>
                                </div>
                            </section>

                            <section className="reader-glass-toolbar reader-control-card reader-control-card-wide">
                                <div className="reader-control-card-header">
                                    <h3>Appearance profile</h3>
                                    <p>Switch complete reading presets or customize theme manually.</p>
                                </div>
                                <div className="reader-preset-toolbar flex flex-wrap gap-space-sm items-center">
                                    <span className="reader-toolbar-label">Reading profile</span>
                                    <div className="reader-chip-row">
                                        {READER_EXPERIENCE_PRESETS.map((preset) => {
                                            const PresetIcon = getReaderPresetAppIcon(preset.id);
                                            return (
                                                <button
                                                    key={preset.id}
                                                    type="button"
                                                    className={`reader-pill ${activeReaderPresetId === preset.id ? 'active' : ''}`}
                                                    onClick={() => applyReaderExperiencePreset(preset.id)}
                                                    title={preset.description}
                                                >
                                                    {PresetIcon ? <PresetIcon className="reader-pill-app-icon" aria-hidden="true" /> : null}
                                                    <span>{preset.label}</span>
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>
                                <div className="reader-control-actions">
                                    {Object.entries(READER_THEMES).map(([key, value]) => {
                                        const ThemeIcon = getReaderThemeIcon(key);
                                        return (
                                            <Button
                                                key={key}
                                                color={theme === key ? 'dark' : 'gray'}
                                                onClick={() => setTheme(key)}
                                                className={`flex items-center gap-space-xs reader-theme-chip ${theme === key ? 'active' : ''}`}
                                                aria-pressed={theme === key}
                                                pill
                                            >
                                                <span className="reader-theme-dot" style={{ background: value.background }} />
                                                <ThemeIcon />
                                                <span className="reader-theme-label">{value.name}</span>
                                            </Button>
                                        );
                                    })}
                                </div>
                                <div className="reader-control-inline">
                                    <div className="flex items-center gap-space-xs rounded-radius-full bg-gray-100 dark:bg-slate-800 px-space-sm py-[6px] text-sm">
                                        <span className="text-gray-500 text-xs">Theme scene</span>
                                        <Select
                                            value={activeThemeSceneId}
                                            onChange={(event) => {
                                                const next = event.target.value;
                                                if (next === 'custom') return;
                                                applyThemeScene(next);
                                            }}
                                            className="min-w-[190px]"
                                        >
                                            {READER_THEME_SCENES.map((scene) => (
                                                <option key={scene.id} value={scene.id}>{scene.label}</option>
                                            ))}
                                            <option value="custom">Custom tune</option>
                                        </Select>
                                    </div>
                                    <Button color="gray" outline onClick={resetThemeTuning}>
                                        Reset tuning
                                    </Button>
                                    <Button color="gray" outline onClick={resetThemePalette}>
                                        Use base palette
                                    </Button>
                                </div>
                                <div className="reader-slider-grid">
                                    <div className="reader-slider">
                                        <div className="reader-slider-meta">
                                            <span className="reader-slider-label">Brightness</span>
                                            <span className="reader-slider-value">{themeBrightness.toFixed(2)}</span>
                                        </div>
                                        <input
                                            type="range"
                                            min="0.75"
                                            max="1.3"
                                            step="0.01"
                                            value={themeBrightness}
                                            onChange={(event) => setThemeBrightness(clampNumber(event.target.value, 0.75, 1.3))}
                                            className="reader-slider-input"
                                        />
                                    </div>
                                    <div className="reader-slider">
                                        <div className="reader-slider-meta">
                                            <span className="reader-slider-label">Contrast</span>
                                            <span className="reader-slider-value">{themeContrast.toFixed(2)}</span>
                                        </div>
                                        <input
                                            type="range"
                                            min="0.75"
                                            max="1.35"
                                            step="0.01"
                                            value={themeContrast}
                                            onChange={(event) => setThemeContrast(clampNumber(event.target.value, 0.75, 1.35))}
                                            className="reader-slider-input"
                                        />
                                    </div>
                                    <div className="reader-slider">
                                        <div className="reader-slider-meta">
                                            <span className="reader-slider-label">Saturation</span>
                                            <span className="reader-slider-value">{themeSaturation.toFixed(2)}</span>
                                        </div>
                                        <input
                                            type="range"
                                            min="0.7"
                                            max="1.4"
                                            step="0.01"
                                            value={themeSaturation}
                                            onChange={(event) => setThemeSaturation(clampNumber(event.target.value, 0.7, 1.4))}
                                            className="reader-slider-input"
                                        />
                                    </div>
                                    <div className="reader-slider">
                                        <div className="reader-slider-meta">
                                            <span className="reader-slider-label">Warmth</span>
                                            <span className="reader-slider-value">{themeWarmth.toFixed(2)}</span>
                                        </div>
                                        <input
                                            type="range"
                                            min="-0.2"
                                            max="0.3"
                                            step="0.01"
                                            value={themeWarmth}
                                            onChange={(event) => setThemeWarmth(clampNumber(event.target.value, -0.2, 0.3))}
                                            className="reader-slider-input"
                                        />
                                    </div>
                                    <div className="reader-slider">
                                        <div className="reader-slider-meta">
                                            <span className="reader-slider-label">Paper texture</span>
                                            <span className="reader-slider-value">{themeTexture.toFixed(2)}</span>
                                        </div>
                                        <input
                                            type="range"
                                            min="0"
                                            max="0.4"
                                            step="0.01"
                                            value={themeTexture}
                                            onChange={(event) => setThemeTexture(clampNumber(event.target.value, 0, 0.4))}
                                            className="reader-slider-input"
                                        />
                                    </div>
                                    <div className="reader-slider">
                                        <div className="reader-slider-meta">
                                            <span className="reader-slider-label">Vignette</span>
                                            <span className="reader-slider-value">{themeVignette.toFixed(2)}</span>
                                        </div>
                                        <input
                                            type="range"
                                            min="0"
                                            max="0.32"
                                            step="0.01"
                                            value={themeVignette}
                                            onChange={(event) => setThemeVignette(clampNumber(event.target.value, 0, 0.32))}
                                            className="reader-slider-input"
                                        />
                                    </div>
                                </div>
                                <div className="reader-control-inline">
                                    <div className="flex flex-wrap items-center gap-space-sm">
                                        <label className="flex items-center gap-space-xs rounded-radius-full bg-gray-100 dark:bg-slate-800 px-space-sm py-[6px] text-xs">
                                            <span className="text-gray-500">Page</span>
                                            <input
                                                type="color"
                                                value={themeBackgroundColor}
                                                onChange={(event) => setThemeCustomBackground(sanitizeHexColor(event.target.value))}
                                                className="h-7 w-10 cursor-pointer border-0 bg-transparent p-0"
                                                aria-label="Choose page color"
                                            />
                                        </label>
                                        <label className="flex items-center gap-space-xs rounded-radius-full bg-gray-100 dark:bg-slate-800 px-space-sm py-[6px] text-xs">
                                            <span className="text-gray-500">Text</span>
                                            <input
                                                type="color"
                                                value={themeTextColor}
                                                onChange={(event) => setThemeCustomText(sanitizeHexColor(event.target.value))}
                                                className="h-7 w-10 cursor-pointer border-0 bg-transparent p-0"
                                                aria-label="Choose text color"
                                            />
                                        </label>
                                        <label className="flex items-center gap-space-xs rounded-radius-full bg-gray-100 dark:bg-slate-800 px-space-sm py-[6px] text-xs">
                                            <span className="text-gray-500">Accent</span>
                                            <input
                                                type="color"
                                                value={themeAccentColor}
                                                onChange={(event) => setThemeCustomAccent(sanitizeHexColor(event.target.value))}
                                                className="h-7 w-10 cursor-pointer border-0 bg-transparent p-0"
                                                aria-label="Choose accent color"
                                            />
                                        </label>
                                    </div>
                                </div>
                            </section>

                            <section className="reader-glass-toolbar reader-control-card reader-control-card-wide">
                                <div className="reader-control-card-header">
                                    <h3>Typography & layout</h3>
                                    <p>Shape text density and page geometry for comfort.</p>
                                </div>
                                <div className="reader-slider-grid">
                                    <div className="reader-slider">
                                        <div className="reader-slider-meta">
                                            <span className="reader-slider-label"><FaFont className="mr-1" /> Font size</span>
                                            <span className="reader-slider-value">{fontSize}px</span>
                                        </div>
                                        <input
                                            type="range"
                                            min="12"
                                            max="28"
                                            step="1"
                                            value={fontSize}
                                            onChange={(event) => setFontSize(clampNumber(event.target.value, 12, 28))}
                                            className="reader-slider-input"
                                        />
                                        <div className="reader-slider-steps">
                                            <span>12</span>
                                            <span>16</span>
                                            <span>20</span>
                                            <span>24</span>
                                            <span>28</span>
                                        </div>
                                    </div>
                                    <div className="reader-slider">
                                        <div className="reader-slider-meta">
                                            <span className="reader-slider-label"><FaListUl className="mr-1" /> Margins</span>
                                            <span className="reader-slider-value">{margin}px</span>
                                        </div>
                                        <input
                                            type="range"
                                            min="4"
                                            max="24"
                                            step="1"
                                            value={margin}
                                            onChange={(event) => setMargin(clampNumber(event.target.value, 4, 24))}
                                            className="reader-slider-input"
                                        />
                                        <div className="reader-slider-steps">
                                            <span>4</span>
                                            <span>8</span>
                                            <span>12</span>
                                            <span>16</span>
                                            <span>24</span>
                                        </div>
                                    </div>
                                    <div className="reader-slider">
                                        <div className="reader-slider-meta">
                                            <span className="reader-slider-label"><FaExpand className="mr-1" /> Width</span>
                                            <span className="reader-slider-value">{readingWidth}px</span>
                                        </div>
                                        <input
                                            type="range"
                                            min="640"
                                            max="1200"
                                            step="20"
                                            value={readingWidth}
                                            onChange={(event) => setReadingWidth(clampNumber(event.target.value, 640, 1200))}
                                            className="reader-slider-input"
                                        />
                                        <div className="reader-slider-steps">
                                            <span>640</span>
                                            <span>820</span>
                                            <span>980</span>
                                            <span>1100</span>
                                            <span>1200</span>
                                        </div>
                                    </div>
                                    <div className="reader-slider">
                                        <div className="reader-slider-meta">
                                            <span className="reader-slider-label"><FaTint className="mr-1" /> Line height</span>
                                            <span className="reader-slider-value">{lineHeight.toFixed(2)}</span>
                                        </div>
                                        <input
                                            type="range"
                                            min="1.2"
                                            max="2.2"
                                            step="0.05"
                                            value={lineHeight}
                                            onChange={(event) => setLineHeight(clampNumber(event.target.value, 1.2, 2.2))}
                                            className="reader-slider-input"
                                        />
                                        <div className="reader-slider-steps">
                                            <span>1.2</span>
                                            <span>1.4</span>
                                            <span>1.7</span>
                                            <span>2.0</span>
                                            <span>2.2</span>
                                        </div>
                                    </div>
                                    <div className="reader-slider">
                                        <div className="reader-slider-meta">
                                            <span className="reader-slider-label">Paragraph indent</span>
                                            <span className="reader-slider-value">{paragraphIndent.toFixed(2)}em</span>
                                        </div>
                                        <input
                                            type="range"
                                            min="0"
                                            max="2.2"
                                            step="0.05"
                                            value={paragraphIndent}
                                            onChange={(event) => setParagraphIndent(clampNumber(event.target.value, 0, 2.2))}
                                            className="reader-slider-input"
                                        />
                                        <div className="reader-slider-steps">
                                            <span>0</span>
                                            <span>0.5</span>
                                            <span>1.0</span>
                                            <span>1.5</span>
                                            <span>2.2</span>
                                        </div>
                                    </div>
                                    <div className="reader-slider">
                                        <div className="reader-slider-meta">
                                            <span className="reader-slider-label">Paragraph spacing</span>
                                            <span className="reader-slider-value">{paragraphSpacing.toFixed(2)}em</span>
                                        </div>
                                        <input
                                            type="range"
                                            min="0.1"
                                            max="1.6"
                                            step="0.05"
                                            value={paragraphSpacing}
                                            onChange={(event) => setParagraphSpacing(clampNumber(event.target.value, 0.1, 1.6))}
                                            className="reader-slider-input"
                                        />
                                        <div className="reader-slider-steps">
                                            <span>0.1</span>
                                            <span>0.4</span>
                                            <span>0.8</span>
                                            <span>1.2</span>
                                            <span>1.6</span>
                                        </div>
                                    </div>
                                    <div className="reader-slider">
                                        <div className="reader-slider-meta">
                                            <span className="reader-slider-label">Letter spacing</span>
                                            <span className="reader-slider-value">{letterSpacing.toFixed(3)}em</span>
                                        </div>
                                        <input
                                            type="range"
                                            min="-0.01"
                                            max="0.08"
                                            step="0.005"
                                            value={letterSpacing}
                                            onChange={(event) => setLetterSpacing(clampNumber(event.target.value, -0.01, 0.08))}
                                            className="reader-slider-input"
                                        />
                                        <div className="reader-slider-steps">
                                            <span>-0.01</span>
                                            <span>0</span>
                                            <span>0.02</span>
                                            <span>0.05</span>
                                            <span>0.08</span>
                                        </div>
                                    </div>
                                    <div className="reader-slider">
                                        <div className="reader-slider-meta">
                                            <span className="reader-slider-label">Word spacing</span>
                                            <span className="reader-slider-value">{wordSpacing.toFixed(3)}em</span>
                                        </div>
                                        <input
                                            type="range"
                                            min="-0.02"
                                            max="0.16"
                                            step="0.01"
                                            value={wordSpacing}
                                            onChange={(event) => setWordSpacing(clampNumber(event.target.value, -0.02, 0.16))}
                                            className="reader-slider-input"
                                        />
                                        <div className="reader-slider-steps">
                                            <span>-0.02</span>
                                            <span>0</span>
                                            <span>0.04</span>
                                            <span>0.1</span>
                                            <span>0.16</span>
                                        </div>
                                    </div>
                                </div>
                                <div className="reader-control-actions">
                                    <div className="reader-control-inline">
                                        <div className="flex items-center gap-space-xs rounded-radius-full bg-gray-100 dark:bg-slate-800 px-space-sm py-[6px] text-sm">
                                            <span className="text-gray-500 text-xs">Font profile</span>
                                            <Select
                                                value={fontProfile}
                                                onChange={(event) => setFontProfile(event.target.value)}
                                                className="min-w-[180px]"
                                            >
                                                {READER_FONT_PROFILES.map((profile) => (
                                                    <option key={profile.id} value={profile.id}>{profile.label}</option>
                                                ))}
                                            </Select>
                                        </div>
                                        <div className="reader-chip-row">
                                            {READER_TEXT_ALIGN_OPTIONS.map((option) => (
                                                <button
                                                    key={option.id}
                                                    type="button"
                                                    className={`reader-pill ${textAlign === option.id ? 'active' : ''}`}
                                                    onClick={() => setTextAlign(option.id)}
                                                >
                                                    {option.label}
                                                </button>
                                            ))}
                                            <button
                                                type="button"
                                                className={`reader-pill ${hyphenation ? 'active' : ''}`}
                                                onClick={() => setHyphenation((value) => !value)}
                                            >
                                                Hyphenation {hyphenation ? 'On' : 'Off'}
                                            </button>
                                        </div>
                                    </div>
                                    <div className="reader-chip-row">
                                        {FONT_SIZE_PRESETS.map((preset) => (
                                            <button
                                                key={preset.label}
                                                type="button"
                                                className={`reader-pill ${fontSize === preset.size ? 'active' : ''}`}
                                                onClick={() => setFontSize(preset.size)}
                                            >
                                                {preset.label}
                                            </button>
                                        ))}
                                        {READING_WIDTH_PRESETS.map((preset) => (
                                            <button
                                                key={preset.label}
                                                type="button"
                                                className={`reader-pill ${readingWidth === preset.width ? 'active' : ''}`}
                                                onClick={() => setReadingWidth(preset.width)}
                                            >
                                                {preset.label}
                                            </button>
                                        ))}
                                        <button
                                            type="button"
                                            className="reader-pill"
                                            onClick={() => {
                                                setFontSize(DEFAULT_READER_FONT_SIZE);
                                                setLineHeight(DEFAULT_READER_LINE_HEIGHT);
                                                setMargin(DEFAULT_READER_MARGIN);
                                                setReadingWidth(DEFAULT_READING_WIDTH);
                                                setFontProfile(DEFAULT_READER_FONT_PROFILE);
                                                setTextAlign(DEFAULT_READER_TEXT_ALIGN);
                                                setParagraphIndent(DEFAULT_READER_PARAGRAPH_INDENT);
                                                setParagraphSpacing(DEFAULT_READER_PARAGRAPH_SPACING);
                                                setLetterSpacing(DEFAULT_READER_LETTER_SPACING);
                                                setWordSpacing(DEFAULT_READER_WORD_SPACING);
                                                setHyphenation(DEFAULT_READER_HYPHENATION);
                                            }}
                                        >
                                            Reset type
                                        </button>
                                    </div>
                                    <div className="reader-speed-pill flex items-center gap-space-xs rounded-radius-full bg-gray-100 dark:bg-slate-800 px-space-sm py-[6px] text-sm">
                                        <FaBolt className="text-gray-500" />
                                        <Button size="xs" color="gray" onClick={() => setReadingSpeed((value) => Math.max(120, value - 10))}><FaMinus /></Button>
                                        <span className="min-w-[58px] text-center">{readingSpeed} wpm</span>
                                        <Button size="xs" color="gray" onClick={() => setReadingSpeed((value) => Math.min(520, value + 10))}><FaPlus /></Button>
                                    </div>
                                </div>
                            </section>

                            <section className="reader-glass-toolbar reader-control-card">
                                <div className="reader-control-card-header">
                                    <h3>Read aloud & auto-scroll</h3>
                                    <p>Assistive playback for hands-free reading sessions.</p>
                                </div>
                                <div className="reader-control-stack">
                                    <div className="reader-control-actions">
                                        <Button
                                            color="dark"
                                            onClick={startSpeech}
                                            disabled={!ttsSupported || !hasBookContent}
                                            className="flex items-center gap-space-xs"
                                        >
                                            <FaPlay /> Read aloud
                                        </Button>
                                        <Button
                                            color="gray"
                                            outline
                                            onClick={toggleSpeechPause}
                                            disabled={!ttsSupported || ttsStatus === 'idle'}
                                            className="flex items-center gap-space-xs"
                                        >
                                            {ttsStatus === 'paused' ? <FaPlay /> : <FaPause />}
                                            {ttsStatus === 'paused' ? 'Resume' : 'Pause'}
                                        </Button>
                                        <Button
                                            color="gray"
                                            outline
                                            onClick={stopSpeech}
                                            disabled={!ttsSupported || ttsStatus === 'idle'}
                                            className="flex items-center gap-space-xs"
                                        >
                                            <FaStop /> Stop
                                        </Button>
                                        <Badge color="gray" className="text-xs">
                                            {ttsSupported ? (ttsStatus === 'playing' ? 'Speaking…' : ttsStatus === 'paused' ? 'Paused' : 'Ready') : 'TTS not supported'}
                                        </Badge>
                                    </div>
                                    <div className="reader-control-inline">
                                        <div className="flex items-center gap-space-xs rounded-radius-full bg-gray-100 dark:bg-slate-800 px-space-sm py-[6px] text-sm">
                                            <FaVolumeUp className="text-gray-500" />
                                            <Select
                                                value={ttsVoice}
                                                onChange={(event) => setTtsVoice(event.target.value)}
                                                className="min-w-[180px]"
                                                disabled={!ttsSupported || !ttsVoices.length}
                                            >
                                                {ttsVoices.length ? ttsVoices.map((voice) => (
                                                    <option key={voice.name} value={voice.name}>{voice.name}</option>
                                                )) : <option value="">System voice</option>}
                                            </Select>
                                        </div>
                                    </div>
                                    <div className="reader-control-inline">
                                        <div className="flex items-center gap-space-xs rounded-radius-full bg-gray-100 dark:bg-slate-800 px-space-sm py-[6px] text-sm">
                                            <span className="text-gray-500 text-xs">Rate</span>
                                            <input
                                                type="range"
                                                min="0.7"
                                                max="1.4"
                                                step="0.05"
                                                value={ttsRate}
                                                onChange={(event) => setTtsRate(Number(event.target.value))}
                                                className="h-1.5 w-28 accent-cyan-500"
                                            />
                                            <span className="min-w-[44px] text-center">{ttsRate.toFixed(2)}x</span>
                                        </div>
                                        <div className="flex items-center gap-space-xs rounded-radius-full bg-gray-100 dark:bg-slate-800 px-space-sm py-[6px] text-sm">
                                            <span className="text-gray-500 text-xs">Pitch</span>
                                            <input
                                                type="range"
                                                min="0.8"
                                                max="1.4"
                                                step="0.05"
                                                value={ttsPitch}
                                                onChange={(event) => setTtsPitch(Number(event.target.value))}
                                                className="h-1.5 w-24 accent-cyan-500"
                                            />
                                            <span className="min-w-[44px] text-center">{ttsPitch.toFixed(2)}</span>
                                        </div>
                                    </div>
                                    <div className="reader-control-inline">
                                        <Button
                                            color={autoScrollEnabled ? 'dark' : 'gray'}
                                            outline={!autoScrollEnabled}
                                            onClick={() => setAutoScrollEnabled((value) => !value)}
                                            className="flex items-center gap-space-xs"
                                            disabled={!hasBookContent}
                                        >
                                            {autoScrollEnabled ? <FaPause /> : <FaPlay />}
                                            {autoScrollEnabled ? 'Stop auto-scroll' : 'Auto-scroll'}
                                        </Button>
                                        <div className="flex items-center gap-space-xs rounded-radius-full bg-gray-100 dark:bg-slate-800 px-space-sm py-[6px] text-sm">
                                            <span className="text-gray-500 text-xs">Speed</span>
                                            <input
                                                type="range"
                                                min="20"
                                                max="220"
                                                step="10"
                                                value={autoScrollSpeed}
                                                onChange={(event) => setAutoScrollSpeed(Number(event.target.value))}
                                                className="h-1.5 w-32 accent-cyan-500"
                                                disabled={!hasBookContent}
                                            />
                                            <span className="min-w-[56px] text-center">{autoScrollSpeed}px/s</span>
                                        </div>
                                    </div>
                                </div>
                            </section>

                            <section className="reader-control-card reader-control-card-search">
                                <div className="reader-control-card-header">
                                    <h3>Search in book</h3>
                                    <p>Jump across matches with case-sensitive and whole-word filters.</p>
                                </div>
                                <div className="reader-utility-bar" role="toolbar" aria-label="Reader search">
                                    <div className="reader-search-field">
                                        <FaSearch className="reader-search-icon" />
                                        <input
                                            type="text"
                                            value={searchQuery}
                                            onChange={(event) => setSearchQuery(event.target.value)}
                                            placeholder="Search in book…"
                                            ref={searchInputRef}
                                            onKeyDown={(event) => {
                                                if (event.key === 'Enter') {
                                                    event.preventDefault();
                                                    if (event.shiftKey) {
                                                        jumpToHit('prev');
                                                    } else {
                                                        jumpToHit('next');
                                                    }
                                                }
                                            }}
                                            className="reader-search-input"
                                        />
                                        {searchQuery ? (
                                            <button
                                                type="button"
                                                className="reader-search-clear"
                                                onClick={clearSearch}
                                                aria-label="Clear search"
                                            >
                                                <FaTimes />
                                            </button>
                                        ) : null}
                                    </div>
                                    <div className="reader-search-controls">
                                        <span>{searchHits.length > 0 ? `${currentHit + 1}/${searchHits.length}` : '0/0'}</span>
                                        <button
                                            type="button"
                                            className={`reader-nav-btn ${searchHits.length === 0 ? 'opacity-50 cursor-not-allowed' : ''}`}
                                            onClick={() => jumpToHit('prev')}
                                            aria-label="Previous match"
                                            disabled={searchHits.length === 0}
                                        >
                                            <FaChevronLeft />
                                        </button>
                                        <button
                                            type="button"
                                            className={`reader-nav-btn ${searchHits.length === 0 ? 'opacity-50 cursor-not-allowed' : ''}`}
                                            onClick={() => jumpToHit('next')}
                                            aria-label="Next match"
                                            disabled={searchHits.length === 0}
                                        >
                                            <FaChevronRight />
                                        </button>
                                        <button
                                            type="button"
                                            className={`reader-toggle ${searchCaseSensitive ? 'active' : ''}`}
                                            onClick={() => setSearchCaseSensitive((value) => !value)}
                                            aria-pressed={searchCaseSensitive}
                                            title="Case sensitive"
                                        >
                                            Aa
                                        </button>
                                        <button
                                            type="button"
                                            className={`reader-toggle ${searchWholeWord ? 'active' : ''}`}
                                            onClick={() => setSearchWholeWord((value) => !value)}
                                            aria-pressed={searchWholeWord}
                                            title="Whole word"
                                        >
                                            W
                                        </button>
                                    </div>
                                </div>
                            </section>

                            <section ref={shortcutsSectionRef} className="reader-glass-toolbar reader-control-card reader-shortcuts-card">
                                <div className="reader-control-card-header">
                                    <h3>Reader shortcuts</h3>
                                    <p>Keyboard navigation for speed reading and quick actions.</p>
                                </div>
                                <div className="reader-shortcuts-list text-sm text-gray-600 dark:text-gray-300">
                                    <div className="reader-shortcut-item"><span>Focus search</span><span className="font-semibold">/</span></div>
                                    <div className="reader-shortcut-item"><span>Toggle chapters</span><span className="font-semibold">T</span></div>
                                    <div className="reader-shortcut-item"><span>Full screen</span><span className="font-semibold">Alt + Enter</span></div>
                                    <div className="reader-shortcut-item"><span>Next chapter</span><span className="font-semibold">N / →</span></div>
                                    <div className="reader-shortcut-item"><span>Previous chapter</span><span className="font-semibold">P / ←</span></div>
                                    <div className="reader-shortcut-item"><span>Add bookmark</span><span className="font-semibold">B</span></div>
                                    <div className="reader-shortcut-item"><span>Toggle focus mode</span><span className="font-semibold">F</span></div>
                                    <div className="reader-shortcut-item"><span>Toggle reading control center</span><span className="font-semibold">Ctrl/Cmd + ,</span></div>
                                    <div className="reader-shortcut-item"><span>Open shortcuts</span><span className="font-semibold">?</span></div>
                                    <div className="reader-shortcut-item"><span>Close panels</span><span className="font-semibold">Esc</span></div>
                                </div>
                            </section>
                        </div>
                    </div>
                </section>
            ) : null}
        </div>
    );
}

function Base64Tool() {
    const [mode, setMode] = useState('encode');
    const [input, setInput] = useState('Hello ScientistShield!');
    const [output, setOutput] = useState('');
    const [error, setError] = useState(null);

    const toBase64 = (value) => window.btoa(unescape(encodeURIComponent(value)));
    const fromBase64 = (value) => decodeURIComponent(escape(window.atob(value)));

    const handleConvert = () => {
        try {
            if (mode === 'encode') {
                setOutput(toBase64(input));
            } else {
                setOutput(fromBase64(input));
            }
            setError(null);
        } catch (err) {
            setError('Conversion failed. Check the input string.');
            setOutput('');
        }
    };

    const swapMode = () => {
        setMode((prev) => (prev === 'encode' ? 'decode' : 'encode'));
        setOutput('');
        setError(null);
    };

    return (
        <div className="space-y-space-md">
            <div className="flex flex-wrap gap-space-sm items-center">
                <Button onClick={handleConvert} gradientDuoTone="greenToBlue">
                    {mode === 'encode' ? 'Encode' : 'Decode'}
                </Button>
                <Button onClick={swapMode} color="dark" outline>
                    <FaSyncAlt className="mr-2" /> Switch to {mode === 'encode' ? 'Decode' : 'Encode'}
                </Button>
            </div>
            <Textarea
                rows={5}
                value={input}
                onChange={(event) => setInput(event.target.value)}
                placeholder={mode === 'encode' ? 'Enter text to encode…' : 'Paste Base64 to decode…'}
            />
            {error && (
                <Alert color="failure">
                    {error}
                </Alert>
            )}
            <Textarea
                rows={5}
                value={output}
                readOnly
                placeholder="Your converted result will appear here"
            />
        </div>
    );
}

function TextTransformerTool() {
    const [input, setInput] = useState('Tutorialspoint inspired developer tools hub');
    const [output, setOutput] = useState('');

    const applyTransform = (type) => {
        const text = input;
        let transformed = text;
        switch (type) {
            case 'upper':
                transformed = text.toUpperCase();
                break;
            case 'lower':
                transformed = text.toLowerCase();
                break;
            case 'title':
                transformed = text.replace(/\w\S*/g, (word) => word.charAt(0).toUpperCase() + word.substring(1).toLowerCase());
                break;
            case 'sentence':
                transformed = text
                    .toLowerCase()
                    .replace(/(^\s*\w|[.!?]\s*\w)/g, (char) => char.toUpperCase());
                break;
            case 'snake':
                transformed = text
                    .replace(/[^a-zA-Z0-9]+/g, ' ')
                    .trim()
                    .toLowerCase()
                    .replace(/\s+/g, '_');
                break;
            default:
                break;
        }
        setOutput(transformed);
    };

    const copyResult = async () => {
        if (!output) return;
        try {
            if (navigator.clipboard) {
                await navigator.clipboard.writeText(output);
            }
        } catch (error) {
            // Ignore clipboard errors silently
        }
    };

    const stats = useMemo(() => {
        const trimmed = input.trim();
        return {
            words: trimmed ? trimmed.split(/\s+/).length : 0,
            characters: input.length,
        };
    }, [input]);

    return (
        <div className="space-y-space-md">
            <Textarea
                rows={5}
                value={input}
                onChange={(event) => setInput(event.target.value)}
                placeholder="Paste or type text to transform"
            />
            <div className="flex flex-wrap gap-space-sm">
                <Button onClick={() => applyTransform('upper')} color="dark" outline>
                    Uppercase
                </Button>
                <Button onClick={() => applyTransform('lower')} color="dark" outline>
                    Lowercase
                </Button>
                <Button onClick={() => applyTransform('title')} color="dark" outline>
                    Title Case
                </Button>
                <Button onClick={() => applyTransform('sentence')} color="dark" outline>
                    Sentence Case
                </Button>
                <Button onClick={() => applyTransform('snake')} color="dark" outline>
                    Snake Case
                </Button>
                <Button onClick={copyResult} color="gray" outline disabled={!output}>
                    <FaCopy className="mr-2" /> Copy Result
                </Button>
            </div>
            <div className="flex flex-wrap gap-space-sm text-sm text-gray-600 dark:text-gray-400">
                <Badge color="gray" size="sm">{stats.words} words</Badge>
                <Badge color="gray" size="sm">{stats.characters} characters</Badge>
            </div>
            <Textarea
                rows={5}
                value={output}
                readOnly
                placeholder="Transformed text will appear here"
            />
        </div>
    );
}

function HindiPdfToEpubTool() {
    const [file, setFile] = useState(null);
    const [conversionPreset, setConversionPreset] = useState('recommended');
    const [bookTitle, setBookTitle] = useState('');
    const [authorName, setAuthorName] = useState(DEFAULT_EPUB_CREATOR);
    const [publisherName, setPublisherName] = useState(DEFAULT_EPUB_PUBLISHER);
    const [pageRangeInput, setPageRangeInput] = useState('');
    const [extractionMode, setExtractionMode] = useState('auto');
    const [ocrLanguageMode, setOcrLanguageMode] = useState('san+hin+eng');
    const [ocrQuality, setOcrQuality] = useState('balanced');
    const [ocrPageSegmentationMode, setOcrPageSegmentationMode] = useState(DEFAULT_OCR_PSM_MODE);
    const [ocrPreprocessMode, setOcrPreprocessMode] = useState(DEFAULT_OCR_PREPROCESS_MODE);
    const [ocrConfidenceThreshold, setOcrConfidenceThreshold] = useState(String(DEFAULT_OCR_CONFIDENCE_THRESHOLD));
    const [ocrEnableSecondPass, setOcrEnableSecondPass] = useState(DEFAULT_OCR_SECOND_PASS_ENABLED);
    const [ocrPreserveInterwordSpaces, setOcrPreserveInterwordSpaces] = useState(DEFAULT_OCR_PRESERVE_SPACING);
    const [ocrAutoHighResRetry, setOcrAutoHighResRetry] = useState(DEFAULT_OCR_AUTO_HIRES_RETRY);
    const [embeddedFontProfile, setEmbeddedFontProfile] = useState('noto-serif-devanagari');
    const [epubContentMode, setEpubContentMode] = useState('hybrid');
    const [chapterMode, setChapterMode] = useState('smart');
    const [epubLanguage, setEpubLanguage] = useState('mul');
    const [epubFontScalePercent, setEpubFontScalePercent] = useState(String(DEFAULT_EPUB_FONT_SCALE_PERCENT));
    const [epubLineHeight, setEpubLineHeight] = useState(String(DEFAULT_EPUB_LINE_HEIGHT));
    const [epubMarginPercent, setEpubMarginPercent] = useState(String(DEFAULT_EPUB_MARGIN_PERCENT));
    const [epubTextAlign, setEpubTextAlign] = useState(DEFAULT_EPUB_TEXT_ALIGN);
    const [epubParagraphIndent, setEpubParagraphIndent] = useState(String(DEFAULT_EPUB_PARAGRAPH_INDENT));
    const [epubParagraphSpacing, setEpubParagraphSpacing] = useState(String(DEFAULT_EPUB_PARAGRAPH_SPACING));
    const [epubLetterSpacing, setEpubLetterSpacing] = useState(String(DEFAULT_EPUB_LETTER_SPACING));
    const [epubWordSpacing, setEpubWordSpacing] = useState(String(DEFAULT_EPUB_WORD_SPACING));
    const [epubHyphenation, setEpubHyphenation] = useState(DEFAULT_EPUB_HYPHENATION);
    const [layoutRetentionMode, setLayoutRetentionMode] = useState(DEFAULT_LAYOUT_RETENTION_MODE);
    const [layoutDetectColumns, setLayoutDetectColumns] = useState(DEFAULT_LAYOUT_DETECT_COLUMNS);
    const [layoutKeepLineBreaks, setLayoutKeepLineBreaks] = useState(DEFAULT_LAYOUT_KEEP_LINE_BREAKS);
    const [layoutProtectShortBlocks, setLayoutProtectShortBlocks] = useState(DEFAULT_LAYOUT_PROTECT_SHORT_BLOCKS);
    const [parallelPages, setParallelPages] = useState(String(DEFAULT_CONVERTER_PARALLEL_PAGES));
    const [ocrWorkerCount, setOcrWorkerCount] = useState(String(DEFAULT_OCR_WORKER_COUNT));
    const [epubCompressionMode, setEpubCompressionMode] = useState('balanced');
    const [exportConversionReport, setExportConversionReport] = useState(true);
    const [includePageMarkers, setIncludePageMarkers] = useState(false);
    const [stripHeadersFooters, setStripHeadersFooters] = useState(true);
    const [normalizeTextCleanup, setNormalizeTextCleanup] = useState(true);
    const [preserveTextFormatting, setPreserveTextFormatting] = useState(true);
    const [removeStandalonePageNumbers, setRemoveStandalonePageNumbers] = useState(true);
    const [usePdfMetadata, setUsePdfMetadata] = useState(true);
    const [includePageImages, setIncludePageImages] = useState(true);
    const [pageImageSourceMode, setPageImageSourceMode] = useState('embedded');
    const [pageImageQuality, setPageImageQuality] = useState('balanced');
    const [pageImageFormat, setPageImageFormat] = useState('jpeg');
    const [autoCropPageImages, setAutoCropPageImages] = useState(true);
    const [imageCropPaddingPx, setImageCropPaddingPx] = useState('8');
    const [isConverting, setIsConverting] = useState(false);
    const [progress, setProgress] = useState({ current: 0, total: 0 });
    const [status, setStatus] = useState(null);

    const progressPercent = useMemo(() => {
        if (!progress.total) return 0;
        return Math.min(100, Math.round((progress.current / progress.total) * 100));
    }, [progress]);
    const selectedPresetLabel = useMemo(
        () => CONVERTER_PRESET_OPTIONS.find((option) => option.value === conversionPreset)?.label ?? 'Custom',
        [conversionPreset],
    );
    const ocrControlsDisabled = epubContentMode === 'images-only' || extractionMode === 'text';
    const imageControlsDisabled = !includePageImages || epubContentMode === 'text-only';
    const fieldSurfaceClassName = 'space-y-space-xs rounded-[18px] border border-white/60 bg-white/60 p-space-sm shadow-[0_14px_36px_-30px_rgba(8,145,178,0.9)] backdrop-blur-xl dark:border-slate-700/70 dark:bg-slate-900/55';

    const applyPresetSettings = (presetValue) => {
        const preset = CONVERTER_PRESET_OPTIONS.find((option) => option.value === presetValue);
        if (!preset) return;
        const settings = preset.settings;

        setEpubContentMode(settings.epubContentMode);
        setExtractionMode(settings.extractionMode);
        setOcrLanguageMode(settings.ocrLanguageMode);
        setOcrQuality(settings.ocrQuality);
        setOcrPageSegmentationMode(settings.ocrPageSegmentationMode ?? DEFAULT_OCR_PSM_MODE);
        setOcrPreprocessMode(settings.ocrPreprocessMode ?? DEFAULT_OCR_PREPROCESS_MODE);
        setOcrConfidenceThreshold(String(settings.ocrConfidenceThreshold ?? DEFAULT_OCR_CONFIDENCE_THRESHOLD));
        setOcrEnableSecondPass(Boolean(settings.ocrEnableSecondPass ?? DEFAULT_OCR_SECOND_PASS_ENABLED));
        setOcrPreserveInterwordSpaces(Boolean(settings.ocrPreserveInterwordSpaces ?? DEFAULT_OCR_PRESERVE_SPACING));
        setOcrAutoHighResRetry(Boolean(settings.ocrAutoHighResRetry ?? DEFAULT_OCR_AUTO_HIRES_RETRY));
        setChapterMode(settings.chapterMode);
        setPreserveTextFormatting(settings.preserveTextFormatting);
        setNormalizeTextCleanup(settings.normalizeTextCleanup);
        setRemoveStandalonePageNumbers(settings.removeStandalonePageNumbers);
        setStripHeadersFooters(settings.stripHeadersFooters);
        setIncludePageImages(settings.includePageImages);
        setPageImageSourceMode(settings.pageImageSourceMode);
        setPageImageQuality(settings.pageImageQuality);
        setPageImageFormat(settings.pageImageFormat);
        setAutoCropPageImages(settings.autoCropPageImages);
        setIncludePageMarkers(settings.includePageMarkers);
        setEmbeddedFontProfile(settings.embeddedFontProfile);
        setUsePdfMetadata(settings.usePdfMetadata);
        setEpubLanguage(settings.epubLanguage);
        setEpubFontScalePercent(String(settings.epubFontScalePercent));
        setEpubLineHeight(String(settings.epubLineHeight));
        setEpubMarginPercent(String(settings.epubMarginPercent));
        setEpubTextAlign(settings.epubTextAlign ?? DEFAULT_EPUB_TEXT_ALIGN);
        setEpubParagraphIndent(String(settings.epubParagraphIndent ?? DEFAULT_EPUB_PARAGRAPH_INDENT));
        setEpubParagraphSpacing(String(settings.epubParagraphSpacing ?? DEFAULT_EPUB_PARAGRAPH_SPACING));
        setEpubLetterSpacing(String(settings.epubLetterSpacing ?? DEFAULT_EPUB_LETTER_SPACING));
        setEpubWordSpacing(String(settings.epubWordSpacing ?? DEFAULT_EPUB_WORD_SPACING));
        setEpubHyphenation(Boolean(settings.epubHyphenation ?? DEFAULT_EPUB_HYPHENATION));
        setLayoutRetentionMode(settings.layoutRetentionMode ?? DEFAULT_LAYOUT_RETENTION_MODE);
        setLayoutDetectColumns(Boolean(settings.layoutDetectColumns ?? DEFAULT_LAYOUT_DETECT_COLUMNS));
        setLayoutKeepLineBreaks(Boolean(settings.layoutKeepLineBreaks ?? DEFAULT_LAYOUT_KEEP_LINE_BREAKS));
        setLayoutProtectShortBlocks(Boolean(settings.layoutProtectShortBlocks ?? DEFAULT_LAYOUT_PROTECT_SHORT_BLOCKS));
        setParallelPages(String(settings.parallelPages ?? DEFAULT_CONVERTER_PARALLEL_PAGES));
        setOcrWorkerCount(String(settings.ocrWorkerCount ?? DEFAULT_OCR_WORKER_COUNT));
        setEpubCompressionMode(settings.epubCompressionMode ?? 'balanced');
        setExportConversionReport(Boolean(settings.exportConversionReport));
    };

    const handleFileChange = (event) => {
        const selected = event.target.files?.[0] ?? null;
        setFile(selected);
        setStatus(null);
        setProgress({ current: 0, total: 0 });
        if (selected) {
            setBookTitle(selected.name.replace(/\.pdf$/i, ''));
        }
    };

    const handlePresetChange = (event) => {
        const presetValue = event.target.value;
        setConversionPreset(presetValue);
        applyPresetSettings(presetValue);
        const presetLabel = CONVERTER_PRESET_OPTIONS.find((option) => option.value === presetValue)?.label ?? 'Custom';
        setStatus({ type: 'info', message: `Preset applied: ${presetLabel}.` });
    };

    const handleConvert = async () => {
        if (!file) {
            setStatus({ type: 'error', message: 'Select a PDF file before converting.' });
            return;
        }

        const isPdf = file.type === 'application/pdf' || /\.pdf$/i.test(file.name);
        if (!isPdf) {
            setStatus({ type: 'error', message: 'Only PDF files are supported for this converter.' });
            return;
        }

        setIsConverting(true);
        setProgress({ current: 0, total: 0 });
        setStatus({ type: 'info', message: 'Reading PDF content and generating EPUB…' });

        const conversionStartedAt = typeof performance !== 'undefined' && typeof performance.now === 'function'
            ? performance.now()
            : Date.now();
        let ocrScheduler = null;
        let ocrWorkers = [];

        try {
            const [
                { getDocument: loadPdfDocument, GlobalWorkerOptions, OPS },
                { default: JSZipLib },
                { default: pdfWorkerUrl },
            ] = await Promise.all([
                import('pdfjs-dist'),
                import('jszip'),
                import('pdfjs-dist/build/pdf.worker.min.mjs?url'),
            ]);

            if (!GlobalWorkerOptions.workerSrc) {
                GlobalWorkerOptions.workerSrc = pdfWorkerUrl;
            }

            const selectedFontOption = EPUB_FONT_OPTIONS.find((option) => option.value === embeddedFontProfile)
                ?? EPUB_FONT_OPTIONS[0];
            let embeddedFontAsset = null;
            if (selectedFontOption.value !== 'none' && selectedFontOption.importPath) {
                try {
                    let fontUrl = null;
                    if (selectedFontOption.value === 'noto-serif-devanagari') {
                        ({ default: fontUrl } = await import('@fontsource/noto-serif-devanagari/files/noto-serif-devanagari-devanagari-400-normal.woff2?url'));
                    } else {
                        ({ default: fontUrl } = await import('@fontsource/noto-sans-devanagari/files/noto-sans-devanagari-devanagari-400-normal.woff2?url'));
                    }
                    const response = await fetch(fontUrl);
                    if (response.ok) {
                        embeddedFontAsset = {
                            id: `font-${selectedFontOption.value}-400`,
                            href: `fonts/${selectedFontOption.fileName}`,
                            mediaType: 'font/woff2',
                            familyName: selectedFontOption.familyName,
                            buffer: await response.arrayBuffer(),
                        };
                    }
                } catch (error) {
                    // Ignore font fetch issues and continue with system font fallbacks.
                }
            }

            const bytes = new Uint8Array(await file.arrayBuffer());
            const loadingTask = loadPdfDocument({
                data: bytes,
                useSystemFonts: true,
            });
            const pdf = await loadingTask.promise;

            if (!pdf.numPages) {
                throw new Error('The selected PDF has no readable pages.');
            }

            let pdfMetadataInfo = null;
            if (usePdfMetadata) {
                try {
                    const metadata = await pdf.getMetadata();
                    pdfMetadataInfo = metadata?.info ?? null;
                } catch (error) {
                    pdfMetadataInfo = null;
                }
            }

            const fileTitleFallback = file.name.replace(/\.pdf$/i, '').trim();
            const pdfTitleCandidate = cleanInlineSpacing(pdfMetadataInfo?.Title ?? '');
            const pdfAuthorCandidate = cleanInlineSpacing(pdfMetadataInfo?.Author ?? '');
            const pdfPublisherCandidate = cleanInlineSpacing(
                pdfMetadataInfo?.Publisher
                ?? pdfMetadataInfo?.Producer
                ?? pdfMetadataInfo?.Creator
                ?? '',
            );
            const titleWasUntouched = !bookTitle.trim() || bookTitle.trim() === fileTitleFallback;
            const shouldUseMetadataTitle = Boolean(usePdfMetadata && pdfTitleCandidate && titleWasUntouched);
            const shouldUseMetadataAuthor = Boolean(
                usePdfMetadata
                && pdfAuthorCandidate
                && (!authorName.trim() || authorName.trim() === DEFAULT_EPUB_CREATOR),
            );
            const shouldUseMetadataPublisher = Boolean(
                usePdfMetadata
                && pdfPublisherCandidate
                && (!publisherName.trim() || publisherName.trim() === DEFAULT_EPUB_PUBLISHER),
            );
            const resolvedTitle = (
                shouldUseMetadataTitle
                    ? pdfTitleCandidate
                    : (bookTitle || fileTitleFallback || 'Hindi PDF Book')
            ).trim();
            const resolvedCreator = (
                shouldUseMetadataAuthor
                    ? pdfAuthorCandidate
                    : (authorName.trim() || DEFAULT_EPUB_CREATOR)
            ).trim();
            const resolvedPublisher = (
                shouldUseMetadataPublisher
                    ? pdfPublisherCandidate
                    : (publisherName.trim() || DEFAULT_EPUB_PUBLISHER)
            ).trim();

            const { pages: selectedPages, error: pageRangeError } = parsePageRangeInput(pageRangeInput, pdf.numPages);
            if (pageRangeError) {
                throw new Error(pageRangeError);
            }
            let pdfOutlineItems = [];
            try {
                pdfOutlineItems = await extractPdfOutlineItems(pdf);
            } catch (error) {
                pdfOutlineItems = [];
            }

            const outputModeIsImagesOnly = epubContentMode === 'images-only';
            const shouldEmbedImages = includePageImages && epubContentMode !== 'text-only';
            const useEmbeddedImageSource = pageImageSourceMode === 'embedded';
            if (outputModeIsImagesOnly && !shouldEmbedImages) {
                throw new Error('Enable "Embed PDF images inside EPUB" when output mode is "Images only".');
            }
            const cropPaddingValue = Math.max(0, Math.min(80, Number.parseInt(imageCropPaddingPx, 10) || 0));
            const fontScalePercentValue = Math.max(
                80,
                Math.min(160, Number.parseInt(epubFontScalePercent, 10) || DEFAULT_EPUB_FONT_SCALE_PERCENT),
            );
            const lineHeightValue = Math.max(
                1.2,
                Math.min(2.4, Number.parseFloat(epubLineHeight) || DEFAULT_EPUB_LINE_HEIGHT),
            );
            const marginPercentValue = Math.max(
                0,
                Math.min(14, Number.parseFloat(epubMarginPercent) || DEFAULT_EPUB_MARGIN_PERCENT),
            );
            const textAlignValue = EPUB_TEXT_ALIGN_OPTIONS.some((option) => option.value === epubTextAlign)
                ? epubTextAlign
                : DEFAULT_EPUB_TEXT_ALIGN;
            const paragraphIndentValue = Math.max(
                0,
                Math.min(2, Number.parseFloat(epubParagraphIndent) || DEFAULT_EPUB_PARAGRAPH_INDENT),
            );
            const paragraphSpacingValue = Math.max(
                0,
                Math.min(3, Number.parseFloat(epubParagraphSpacing) || DEFAULT_EPUB_PARAGRAPH_SPACING),
            );
            const letterSpacingValue = Math.max(
                -0.05,
                Math.min(0.3, Number.parseFloat(epubLetterSpacing) || DEFAULT_EPUB_LETTER_SPACING),
            );
            const wordSpacingValue = Math.max(
                -0.05,
                Math.min(0.5, Number.parseFloat(epubWordSpacing) || DEFAULT_EPUB_WORD_SPACING),
            );
            const parallelPageCount = Math.max(
                1,
                Math.min(MAX_CONVERTER_PARALLEL_PAGES, Number.parseInt(parallelPages, 10) || DEFAULT_CONVERTER_PARALLEL_PAGES),
            );
            const requestedOcrWorkerCount = Math.max(
                1,
                Math.min(MAX_OCR_WORKER_COUNT, Number.parseInt(ocrWorkerCount, 10) || DEFAULT_OCR_WORKER_COUNT),
            );
            const resolvedOcrPsmMode = OCR_PSM_BY_MODE[ocrPageSegmentationMode]
                ? ocrPageSegmentationMode
                : DEFAULT_OCR_PSM_MODE;
            const ocrPsmValue = OCR_PSM_BY_MODE[resolvedOcrPsmMode] ?? OCR_PSM_BY_MODE[DEFAULT_OCR_PSM_MODE];
            const resolvedOcrPreprocessMode = OCR_PREPROCESS_OPTIONS.some((option) => option.value === ocrPreprocessMode)
                ? ocrPreprocessMode
                : DEFAULT_OCR_PREPROCESS_MODE;
            const parsedOcrConfidenceThreshold = Number.parseInt(ocrConfidenceThreshold, 10);
            const ocrConfidenceThresholdValue = Number.isFinite(parsedOcrConfidenceThreshold)
                ? Math.max(0, Math.min(99, parsedOcrConfidenceThreshold))
                : DEFAULT_OCR_CONFIDENCE_THRESHOLD;
            const resolvedCompressionMode = EPUB_COMPRESSION_LEVEL_BY_VALUE[epubCompressionMode]
                ? epubCompressionMode
                : 'balanced';
            const compressionLevel = EPUB_COMPRESSION_LEVEL_BY_VALUE[resolvedCompressionMode] ?? EPUB_COMPRESSION_LEVEL_BY_VALUE.balanced;
            const compressionLabel = EPUB_COMPRESSION_OPTIONS.find((option) => option.value === resolvedCompressionMode)?.label ?? 'Balanced';
            const layoutBehavior = buildLayoutBehavior(layoutRetentionMode, {
                detectColumns: layoutDetectColumns,
                keepLineBreaks: layoutKeepLineBreaks,
                protectShortBlocks: layoutProtectShortBlocks,
            });
            const effectiveOcrWorkerCount = (outputModeIsImagesOnly || extractionMode === 'text')
                ? 0
                : requestedOcrWorkerCount;
            const ocrScale = OCR_SCALE_BY_QUALITY[ocrQuality] ?? OCR_SCALE_BY_QUALITY.balanced;
            const ocrSecondPassEnabled = effectiveOcrWorkerCount > 0 && Boolean(ocrEnableSecondPass);
            const ocrSecondPassScale = Math.min(
                4.5,
                Math.max(
                    ocrScale + (OCR_SECOND_PASS_SCALE_BOOST_BY_QUALITY[ocrQuality] ?? OCR_SECOND_PASS_SCALE_BOOST_BY_QUALITY.balanced),
                    ocrScale * 1.25,
                ),
            );
            const ocrPsmLabel = OCR_PAGE_SEGMENTATION_OPTIONS.find((option) => option.value === resolvedOcrPsmMode)?.label ?? `PSM ${ocrPsmValue}`;
            const ocrPreprocessLabel = OCR_PREPROCESS_OPTIONS.find((option) => option.value === resolvedOcrPreprocessMode)?.label ?? 'Preprocess';
            setStatus({
                type: 'info',
                message: effectiveOcrWorkerCount > 0
                    ? `Preparing conversion (${parallelPageCount} parallel page workers, compression ${compressionLabel}, OCR ${ocrPsmLabel}, ${ocrPreprocessLabel}, min confidence ${ocrConfidenceThresholdValue}%)…`
                    : `Preparing conversion (${parallelPageCount} parallel page workers, compression ${compressionLabel})…`,
            });

            setProgress({ current: 0, total: selectedPages.length });
            let effectiveOcrLanguageMode = ocrLanguageMode;
            let ocrLanguageLabel = OCR_LANGUAGE_LABELS[effectiveOcrLanguageMode] ?? 'Hindi';
            let ocrLanguageFallbackUsed = false;
            let completedPages = 0;
            let ocrSchedulerInitPromise = null;
            let ocrInitializationError = null;

            const initializeOcrScheduler = async (languageMode) => {
        const { createScheduler, createWorker } = await import('tesseract.js');
        const scheduler = createScheduler();
        const workers = [];
                try {
                    for (let workerIndex = 0; workerIndex < effectiveOcrWorkerCount; workerIndex += 1) {
                        setStatus({
                            type: 'info',
                            message: `Initializing OCR engine (${OCR_LANGUAGE_LABELS[languageMode] ?? languageMode}) ${workerIndex + 1}/${effectiveOcrWorkerCount}…`,
                        });
                        const worker = await createWorker(languageMode);
                        await configureOcrWorker(worker);
                        scheduler.addWorker(worker);
                        workers.push(worker);
                    }
                } catch (initError) {
                    await Promise.allSettled(workers.map((worker) => worker.terminate()));
                    if (typeof scheduler.terminate === 'function') {
                        try {
                            await scheduler.terminate();
                        } catch (terminationError) {
                            // Ignore scheduler termination errors during fallback.
                        }
                    }
                    throw initError;
                }

        return {
            scheduler,
            workers,
        };
    };

    const configureOcrWorker = async (worker) => {
        if (!worker || typeof worker.setParameters !== 'function') {
            return;
        }
        try {
            await worker.setParameters({
                tessedit_pageseg_mode: String(ocrPsmValue),
                preserve_interword_spaces: ocrPreserveInterwordSpaces ? '1' : '0',
            });
        } catch (error) {
            // Some runtimes may not support one or more OCR parameters; keep defaults in that case.
        }
    };
            const ensureOcrScheduler = async () => {
                if (ocrScheduler) return ocrScheduler;
                if (effectiveOcrWorkerCount <= 0) {
                    return null;
                }
                if (ocrInitializationError) {
                    throw ocrInitializationError;
                }

                if (!ocrSchedulerInitPromise) {
                    ocrSchedulerInitPromise = (async () => {
                        try {
                            const preferredLanguages = buildOcrLanguageFallbackChain(effectiveOcrLanguageMode);
                            let lastError = null;

                            for (const languageMode of preferredLanguages) {
                                const languageLabel = OCR_LANGUAGE_LABELS[languageMode] ?? languageMode;
                                try {
                                    const pipeline = await initializeOcrScheduler(languageMode);
                                    ocrScheduler = pipeline.scheduler;
                                    ocrWorkers = pipeline.workers;
                                    ocrLanguageLabel = languageLabel;
                                    effectiveOcrLanguageMode = languageMode;
                                    ocrLanguageFallbackUsed = languageMode !== preferredLanguages[0];
                                    return ocrScheduler;
                                } catch (attemptError) {
                                    lastError = attemptError;
                                    setStatus({
                                        type: 'info',
                                        message: `OCR model ${languageLabel} unavailable, trying next Devanagari profile…`,
                                    });
                                }
                            }

                            ocrInitializationError = lastError ?? new Error('No OCR language models could be initialized.');
                            throw ocrInitializationError;
                        } finally {
                            ocrSchedulerInitPromise = null;
                        }
                    })();
                }
                return ocrSchedulerInitPromise;
            };

            const pageResults = await mapWithConcurrency(selectedPages, parallelPageCount, async (pageNumber, index) => {
                const page = await pdf.getPage(pageNumber);
                let pageText = '';
                let pageLines = [];
                let pageOcrUsed = false;
                let pageOcrFailed = false;
                let pageOcrConfidence = null;
                let pageOcrLowConfidence = false;
            let pageOcrSecondPassUsed = false;
            let pageOcrSecondPassImproved = false;
            let pageOcrHighResRetryUsed = false;
            let pageOcrHighResRetryImproved = false;
                const pageImages = [];
                const pageImageAssets = [];
                let pageCroppedImageCount = 0;
                let pageImageBytes = 0;

                if (!outputModeIsImagesOnly) {
                    const extracted = await extractPdfPageText(page, layoutBehavior);
                    const rawExtractedText = String(extracted.text ?? '');
                    pageText = normalizeHindiUnicodeText(rawExtractedText);
                    pageLines = extracted.lines;
                    const quality = analyzeHindiTextQuality(rawExtractedText);

                    const shouldUseOcr = extractionMode === 'ocr'
                        || (extractionMode === 'auto' && (quality.isEmpty || quality.isLikelyGarbled));

                    if (shouldUseOcr) {
                        try {
                            const scheduler = await ensureOcrScheduler();
                            if (!scheduler) {
                                throw new Error('OCR engine is not available for this mode.');
                            }
                            const runOcrPass = async ({ scale, preprocessMode, passLabel }) => {
                                setStatus({
                                    type: 'info',
                                    message: `Running OCR (${ocrLanguageLabel}) on page ${index + 1}/${selectedPages.length} (PDF page ${pageNumber}) • ${passLabel} • ${preprocessMode} • scale ${scale.toFixed(2)}…`,
                                });
                                return extractPageTextWithOcr(page, scheduler, { scale, preprocessMode });
                            };

                            const primaryOcrResult = await runOcrPass({
                                scale: ocrScale,
                                preprocessMode: resolvedOcrPreprocessMode,
                                passLabel: 'pass 1',
                            });
                            let selectedOcrResult = primaryOcrResult;

                            if (ocrSecondPassEnabled && primaryOcrResult.confidence < ocrConfidenceThresholdValue) {
                                pageOcrSecondPassUsed = true;
                                const secondPassPreprocessMode = resolvedOcrPreprocessMode === 'binary'
                                    ? 'grayscale'
                                    : 'binary';
                                const secondPassResult = await runOcrPass({
                                    scale: ocrSecondPassScale,
                                    preprocessMode: secondPassPreprocessMode,
                                    passLabel: 'pass 2',
                                });
                                const secondPassLooksBetter = (
                                    secondPassResult.confidence >= (primaryOcrResult.confidence + 3)
                                    || (!String(primaryOcrResult.text ?? '').trim() && Boolean(String(secondPassResult.text ?? '').trim()))
                                );
                                if (secondPassLooksBetter) {
                                    selectedOcrResult = secondPassResult;
                                    pageOcrSecondPassImproved = true;
                                }
                            }

                            const resolvedOcrText = normalizeHindiUnicodeText(selectedOcrResult.text);
                            const resolvedOcrConfidence = Number.isFinite(selectedOcrResult.confidence)
                                ? selectedOcrResult.confidence
                                : 0;
                            pageOcrConfidence = resolvedOcrConfidence;
                            const confidenceBelowThreshold = Boolean(resolvedOcrText.trim())
                                && resolvedOcrConfidence < ocrConfidenceThresholdValue;
                            pageOcrLowConfidence = confidenceBelowThreshold;
                            const canAcceptLowConfidence = extractionMode === 'ocr' || quality.isEmpty || !rawExtractedText.trim();

                            if (confidenceBelowThreshold && ocrAutoHighResRetry) {
                                pageOcrHighResRetryUsed = true;
                                const hiResScale = Math.min(5.2, ocrSecondPassScale * 1.25);
                                const hiResPreprocess = OCR_PREPROCESS_OPTIONS.some((option) => option.value === 'adaptive')
                                    ? 'adaptive'
                                    : resolvedOcrPreprocessMode;
                                const highResResult = await runOcrPass({
                                    scale: hiResScale,
                                    preprocessMode: hiResPreprocess,
                                    passLabel: 'hi-res retry',
                                });
                                const highResConfidence = Number.isFinite(highResResult.confidence)
                                    ? highResResult.confidence
                                    : 0;
                                const highResText = normalizeHindiUnicodeText(highResResult.text);
                                const improved = highResConfidence >= (resolvedOcrConfidence + 4)
                                    || (highResText.trim() && !resolvedOcrText.trim());
                                if (improved) {
                                    pageOcrHighResRetryImproved = true;
                                    selectedOcrResult = highResResult;
                                    pageOcrConfidence = highResConfidence;
                                    pageOcrLowConfidence = Boolean(highResText.trim())
                                        && highResConfidence < ocrConfidenceThresholdValue;
                                }
                            }

                            const finalOcrText = normalizeHindiUnicodeText(selectedOcrResult.text);
                            const finalOcrConfidence = Number.isFinite(selectedOcrResult.confidence)
                                ? selectedOcrResult.confidence
                                : 0;
                            pageOcrConfidence = finalOcrConfidence;
                            const finalLowConfidence = Boolean(finalOcrText.trim())
                                && finalOcrConfidence < ocrConfidenceThresholdValue;
                            pageOcrLowConfidence = finalLowConfidence;

                            if (finalOcrText.trim() && (!finalLowConfidence || canAcceptLowConfidence)) {
                                pageText = finalOcrText;
                                pageLines = buildLineRecordsFromPlainText(pageText);
                                pageOcrUsed = true;
                            } else if (extractionMode === 'ocr' && !resolvedOcrText.trim()) {
                                throw new Error(`OCR produced no readable text on page ${pageNumber}.`);
                            }
                        } catch (ocrError) {
                            pageOcrFailed = true;
                            if (extractionMode === 'ocr') {
                                throw new Error(`OCR failed on page ${pageNumber}: ${ocrError?.message ?? 'Unknown OCR error'}`);
                            }
                        }
                    }
                }

                if (shouldEmbedImages) {
                    try {
                        if (useEmbeddedImageSource) {
                            const assetsForPage = await extractEmbeddedPdfImageAssets(page, pageNumber, {
                                imageQualityPreset: pageImageQuality,
                                imageFormat: pageImageFormat,
                                autoCrop: autoCropPageImages,
                                cropPaddingPx: cropPaddingValue,
                                pdfOps: OPS,
                            });

                            assetsForPage.forEach((asset) => {
                                pageImageAssets.push(asset);
                                if (asset.wasCropped) {
                                    pageCroppedImageCount += 1;
                                }
                                pageImageBytes += asset.buffer?.byteLength ?? 0;
                                pageImages.push({
                                    id: asset.id,
                                    href: asset.href,
                                    mediaType: asset.mediaType,
                                    alt: asset.alt,
                                });
                            });
                        } else {
                            const imageAsset = await extractPageImageAsset(page, pageNumber, {
                                imageQualityPreset: pageImageQuality,
                                imageFormat: pageImageFormat,
                                autoCrop: autoCropPageImages,
                                cropPaddingPx: cropPaddingValue,
                            });
                            if (imageAsset) {
                                pageImageAssets.push(imageAsset);
                                if (imageAsset.wasCropped) {
                                    pageCroppedImageCount += 1;
                                }
                                pageImageBytes += imageAsset.buffer?.byteLength ?? 0;
                                pageImages.push({
                                    id: imageAsset.id,
                                    href: imageAsset.href,
                                    mediaType: imageAsset.mediaType,
                                    alt: imageAsset.alt,
                                });
                            }
                        }
                    } catch (imageError) {
                        // Continue conversion even if image extraction fails for a page.
                    }
                }
                completedPages += 1;
                setProgress({ current: completedPages, total: selectedPages.length });

                return {
                    pageNumber,
                    text: pageText,
                    lines: pageLines,
                    images: pageImages,
                    imageAssets: pageImageAssets,
                    ocrUsed: pageOcrUsed,
                    ocrFailed: pageOcrFailed,
                    ocrConfidence: pageOcrConfidence,
                    ocrLowConfidence: pageOcrLowConfidence,
                    ocrSecondPassUsed: pageOcrSecondPassUsed,
                    ocrSecondPassImproved: pageOcrSecondPassImproved,
                    ocrHighResRetryUsed: pageOcrHighResRetryUsed,
                    ocrHighResRetryImproved: pageOcrHighResRetryImproved,
                    croppedImageCount: pageCroppedImageCount,
                    imageBytes: pageImageBytes,
                };
            });

            const imageAssets = [];
            let ocrUsedPages = 0;
            let ocrFailedPages = 0;
            let ocrLowConfidencePages = 0;
            let ocrSecondPassPages = 0;
            let ocrSecondPassImprovedPages = 0;
            let ocrHighResRetryPages = 0;
            let ocrHighResRetryImprovedPages = 0;
            let ocrConfidenceSum = 0;
            let ocrConfidenceSampleCount = 0;
            let embeddedImageCount = 0;
            let pagesWithEmbeddedImages = 0;
            let croppedImageCount = 0;
            let totalImageBytes = 0;
            const pageEntries = pageResults.map((result) => {
                const {
                    imageAssets: pageImageAssets,
                    ocrUsed,
                    ocrFailed,
                    ocrConfidence,
                    ocrLowConfidence,
                    ocrSecondPassUsed,
                    ocrSecondPassImproved,
                    ocrHighResRetryUsed,
                    ocrHighResRetryImproved,
                    croppedImageCount: pageCropCount,
                    imageBytes,
                    ...entry
                } = result;
                imageAssets.push(...pageImageAssets);
                if (ocrUsed) {
                    ocrUsedPages += 1;
                }
                if (ocrFailed) {
                    ocrFailedPages += 1;
                }
                if (ocrLowConfidence) {
                    ocrLowConfidencePages += 1;
                }
                if (ocrSecondPassUsed) {
                    ocrSecondPassPages += 1;
                }
                if (ocrSecondPassImproved) {
                    ocrSecondPassImprovedPages += 1;
                }
                if (ocrHighResRetryUsed) {
                    ocrHighResRetryPages += 1;
                }
                if (ocrHighResRetryImproved) {
                    ocrHighResRetryImprovedPages += 1;
                }
                if (ocrUsed && Number.isFinite(ocrConfidence)) {
                    ocrConfidenceSum += ocrConfidence;
                    ocrConfidenceSampleCount += 1;
                }
                embeddedImageCount += pageImageAssets.length;
                if (entry.images.length > 0) {
                    pagesWithEmbeddedImages += 1;
                }
                croppedImageCount += pageCropCount;
                totalImageBytes += imageBytes;
                return entry;
            });
            const averageOcrConfidence = ocrConfidenceSampleCount > 0
                ? (ocrConfidenceSum / ocrConfidenceSampleCount)
                : 0;

            let removedEdgeLineCount = 0;
            let removedPageNumberLineCount = 0;
            let processedEntries = [...pageEntries];

            if (!outputModeIsImagesOnly) {
                if (stripHeadersFooters && processedEntries.length >= 3) {
                    const { repeatedTop, repeatedBottom } = getEdgeLineSets(processedEntries);
                    if (repeatedTop.size || repeatedBottom.size) {
                        processedEntries = processedEntries.map((entry) => {
                            const beforeLines = getEntryLineRecords(entry).length;
                            const cleaned = stripRepeatedEdgeLinesFromEntry(entry, repeatedTop, repeatedBottom);
                            const afterLines = getEntryLineRecords(cleaned).length;
                            removedEdgeLineCount += Math.max(0, beforeLines - afterLines);
                            return cleaned;
                        });
                    }
                }

                processedEntries = processedEntries.map((entry) => {
                    const entryAfterPageNumberCleanup = removeStandalonePageNumbers
                        ? stripStandalonePageNumberLinesFromEntry(entry)
                        : { entry, removedCount: 0 };
                    removedPageNumberLineCount += entryAfterPageNumberCleanup.removedCount;

                    const normalizedLines = reorderLinesByColumns(
                        getEntryLineRecords(entryAfterPageNumberCleanup.entry),
                        layoutBehavior,
                    );
                    const baseText = normalizedLines.map((line) => line.text).join('\n');
                    const normalizedText = normalizeTextCleanup
                        ? normalizeExtractedHindiText(baseText, {
                            preferLineBreaks: layoutBehavior.preferLineBreaks,
                            wrapMergeMinChars: layoutBehavior.wrapMergeMinChars,
                            protectShortBlocks: layoutBehavior.protectShortLines,
                        })
                        : normalizeHindiUnicodeText(baseText).trim();
                    return {
                        ...entryAfterPageNumberCleanup.entry,
                        text: normalizedText,
                        lines: normalizedLines,
                        textMarkup: toParagraphMarkup(
                            normalizedText,
                            normalizedLines,
                            preserveTextFormatting,
                            layoutBehavior,
                        ),
                    };
                });
            } else {
                processedEntries = processedEntries.map((entry) => ({
                    ...entry,
                    text: '',
                    lines: [],
                    textMarkup: '',
                }));
            }

            const pagesWithoutText = outputModeIsImagesOnly
                ? 0
                : processedEntries.filter((entry) => !String(entry.text ?? '').trim()).length;
            const totalWords = outputModeIsImagesOnly
                ? 0
                : processedEntries
                    .map((entry) => String(entry.text ?? '').trim())
                    .filter(Boolean)
                    .reduce((sum, text) => sum + text.split(/\s+/).length, 0);

            const chapters = buildChaptersFromPages(processedEntries, chapterMode, includePageMarkers, epubContentMode, layoutBehavior);
            const outlineNavigationItems = buildNavigationItemsFromOutline({
                outlineItems: pdfOutlineItems,
                selectedPages,
                chapterMode,
                chapters,
            });
            const navigationItems = normalizeNavigationItems(chapters, outlineNavigationItems);
            const navigationItemCount = countNavigationItems(navigationItems);
            const usedPdfBookmarks = outlineNavigationItems.length > 0;
            const chapterCount = chapters.length;
            const usedMetadataAssist = shouldUseMetadataTitle || shouldUseMetadataAuthor || shouldUseMetadataPublisher;
            const conversionFinishedAt = typeof performance !== 'undefined' && typeof performance.now === 'function'
                ? performance.now()
                : Date.now();
            const conversionDurationMs = Math.max(1, conversionFinishedAt - conversionStartedAt);
            const conversionDurationSeconds = conversionDurationMs / 1000;
            const pagesPerSecond = selectedPages.length > 0 ? (selectedPages.length / conversionDurationSeconds) : 0;
            const performanceSummary = `${conversionDurationSeconds.toFixed(1)}s total • ${pagesPerSecond.toFixed(2)} page/s • ${parallelPageCount} parallel worker(s) • compression ${compressionLabel}`;
            const epubBlob = await buildHindiEpub({
                title: resolvedTitle,
                chapters,
                JSZipLib,
                embeddedFontAsset,
                imageAssets,
                navigationItems,
                creator: resolvedCreator,
                publisher: resolvedPublisher,
                sourceFileName: file.name,
                language: epubLanguage,
                fontScalePercent: fontScalePercentValue,
                lineHeight: lineHeightValue,
                marginPercent: marginPercentValue,
                textAlign: textAlignValue,
                paragraphIndent: paragraphIndentValue,
                paragraphSpacing: paragraphSpacingValue,
                letterSpacing: letterSpacingValue,
                wordSpacing: wordSpacingValue,
                hyphenate: epubHyphenation,
                compressionLevel,
            });
            downloadBlob(epubBlob, `${toSafeFilename(resolvedTitle)}.epub`);

            const missingImagePages = shouldEmbedImages
                ? Math.max(0, selectedPages.length - pagesWithEmbeddedImages)
                : selectedPages.length;
            const imageSourceLabel = useEmbeddedImageSource ? 'embedded PDF image' : 'page snapshot';
            const presetLabel = CONVERTER_PRESET_OPTIONS.find((option) => option.value === conversionPreset)?.label ?? 'Custom';
            const languageLabel = EPUB_LANGUAGE_OPTIONS.find((option) => option.value === epubLanguage)?.label ?? 'Hindi';
            const epubFontLabel = embeddedFontAsset
                ? (EPUB_FONT_LABELS[embeddedFontProfile] ?? 'Embedded Devanagari font')
                : 'System fallback font';
            const layoutRetentionLabel = LAYOUT_RETENTION_LABELS[layoutRetentionMode] ?? 'Layout retention';
            const layoutColumnsLabel = layoutBehavior.enableColumnDetection ? 'auto columns' : 'single column';
            const layoutBreakLabel = layoutBehavior.preferLineBreaks ? 'keeps line breaks' : 'wrap merge';
            const withNavigationSummary = (message) => {
                const chapterLabel = chapterCount === 1 ? 'chapter' : 'chapters';
                const baseMessage = `${message} ${chapterCount} ${chapterLabel} generated. Preset: ${presetLabel}. EPUB language: ${languageLabel}. EPUB font: ${epubFontLabel}. Layout: ${fontScalePercentValue}% text, line-height ${lineHeightValue.toFixed(2)}, margin ${marginPercentValue.toFixed(1)}%, align ${textAlignValue}, indent ${paragraphIndentValue.toFixed(2)}em, para spacing ${paragraphSpacingValue.toFixed(2)}em, letter ${letterSpacingValue.toFixed(2)}em, word ${wordSpacingValue.toFixed(2)}em, hyphenation ${epubHyphenation ? 'on' : 'off'}. Retention: ${layoutRetentionLabel} (${layoutColumnsLabel}, ${layoutBreakLabel}). Runtime: ${performanceSummary}.`;
                if (!navigationItemCount) return baseMessage;
                const entryLabel = navigationItemCount === 1 ? 'entry' : 'entries';
                const sourceLabel = usedPdfBookmarks ? 'from PDF bookmarks' : 'for chapter navigation';
                return `${baseMessage} ${navigationItemCount} TOC ${entryLabel} ${sourceLabel}.`;
            };

            if (outputModeIsImagesOnly) {
                if (embeddedImageCount === 0) {
                    setStatus({
                        type: 'warning',
                        message: withNavigationSummary(useEmbeddedImageSource
                            ? 'EPUB downloaded, but no embedded PDF images were found. Try page snapshot mode for full-page visuals.'
                            : 'EPUB downloaded, but no PDF page snapshots could be embedded. Try a different PDF or quality mode.'),
                    });
                } else if (missingImagePages > 0) {
                    setStatus({
                        type: 'warning',
                        message: withNavigationSummary(`Image-only EPUB downloaded with ${embeddedImageCount} ${imageSourceLabel}(s) across ${pagesWithEmbeddedImages}/${selectedPages.length} page(s). ${missingImagePages} page(s) had no ${useEmbeddedImageSource ? 'embedded images' : 'rendered snapshots'}.`),
                    });
                } else {
                    setStatus({
                        type: 'success',
                        message: withNavigationSummary(`Image-only EPUB downloaded successfully with ${embeddedImageCount} ${imageSourceLabel}(s) in ${pageImageFormat.toUpperCase()} format.${autoCropPageImages ? ` Auto-cropped ${croppedImageCount} image(s).` : ''}`),
                    });
                }
            } else if (pagesWithoutText === selectedPages.length && ocrUsedPages === 0) {
                setStatus({
                    type: shouldEmbedImages && embeddedImageCount > 0 ? 'info' : 'warning',
                    message: withNavigationSummary(
                        shouldEmbedImages && embeddedImageCount > 0
                            ? `EPUB downloaded with ${embeddedImageCount} ${imageSourceLabel}(s), but readable text was not extracted. Use OCR mode for text.`
                            : 'EPUB downloaded, but no selectable PDF text was found. Try OCR mode for scanned or legacy-font PDFs.',
                    ),
                });
            } else if (pagesWithoutText > 0 || ocrFailedPages > 0) {
                const messageParts = [];
                messageParts.push(`${selectedPages.length} page(s) exported`);
                messageParts.push(`${chapterCount} chapter(s) built`);
                messageParts.push(`${totalWords.toLocaleString()} words`);
                if (shouldEmbedImages) {
                    messageParts.push(`${embeddedImageCount} ${imageSourceLabel}(s)`);
                    if (embeddedImageCount > 0) {
                        messageParts.push(`images on ${pagesWithEmbeddedImages}/${selectedPages.length} page(s)`);
                        messageParts.push(`${(totalImageBytes / (1024 * 1024)).toFixed(2)} MB images`);
                        messageParts.push(`${pageImageFormat.toUpperCase()} format`);
                        if (autoCropPageImages) {
                            messageParts.push(`${croppedImageCount} auto-cropped`);
                        }
                    }
                }
                if (ocrUsedPages > 0) {
                    messageParts.push(`OCR (${ocrLanguageLabel}) used on ${ocrUsedPages} page(s)`);
                    messageParts.push(`${effectiveOcrWorkerCount} OCR worker(s) active`);
                    messageParts.push(`avg OCR confidence ${averageOcrConfidence.toFixed(1)}%`);
                }
                if (ocrSecondPassPages > 0) {
                    messageParts.push(`OCR second pass ran on ${ocrSecondPassPages} page(s)`);
                    if (ocrSecondPassImprovedPages > 0) {
                        messageParts.push(`second pass improved ${ocrSecondPassImprovedPages} page(s)`);
                    }
                }
                if (ocrLowConfidencePages > 0) {
                    messageParts.push(`${ocrLowConfidencePages} page(s) remained below confidence threshold`);
                }
                if (ocrLanguageFallbackUsed) {
                    messageParts.push('OCR language auto-fallback applied');
                }
                if (ocrFailedPages > 0) {
                    messageParts.push(`OCR failed on ${ocrFailedPages} page(s)`);
                }
                if (removedEdgeLineCount > 0) {
                    messageParts.push(`${removedEdgeLineCount} repeated line(s) removed`);
                }
                if (removedPageNumberLineCount > 0) {
                    messageParts.push(`${removedPageNumberLineCount} page-number line(s) removed`);
                }
                messageParts.push(
                    preserveTextFormatting
                        ? 'formatting preserved (paragraphs/headings/lists)'
                        : 'simple paragraph text mode',
                );
                if (pagesWithoutText > 0) {
                    messageParts.push(`${pagesWithoutText} page(s) still had little text`);
                }
                if (usedMetadataAssist) {
                    messageParts.push('PDF metadata applied');
                }
                setStatus({
                    type: 'warning',
                    message: withNavigationSummary(`EPUB downloaded. ${messageParts.join(' • ')}.`),
                });
            } else {
                const summaryParts = [
                    `${selectedPages.length} page(s) exported`,
                    `${chapterCount} chapter(s) built`,
                    `${totalWords.toLocaleString()} words`,
                ];
                if (shouldEmbedImages) {
                    summaryParts.push(`${embeddedImageCount} ${imageSourceLabel}(s)`);
                    if (embeddedImageCount > 0) {
                        summaryParts.push(`images on ${pagesWithEmbeddedImages}/${selectedPages.length} page(s)`);
                        summaryParts.push(`${(totalImageBytes / (1024 * 1024)).toFixed(2)} MB images`);
                        summaryParts.push(`${pageImageFormat.toUpperCase()} format`);
                        if (autoCropPageImages) {
                            summaryParts.push(`${croppedImageCount} auto-cropped`);
                        }
                    }
                }
                if (ocrUsedPages > 0) {
                    summaryParts.push(`OCR (${ocrLanguageLabel}) used on ${ocrUsedPages} page(s)`);
                    summaryParts.push(`${effectiveOcrWorkerCount} OCR worker(s) active`);
                    summaryParts.push(`avg OCR confidence ${averageOcrConfidence.toFixed(1)}%`);
                }
                if (ocrSecondPassPages > 0) {
                    summaryParts.push(`OCR second pass ran on ${ocrSecondPassPages} page(s)`);
                    if (ocrSecondPassImprovedPages > 0) {
                        summaryParts.push(`second pass improved ${ocrSecondPassImprovedPages} page(s)`);
                    }
                }
                if (ocrLowConfidencePages > 0) {
                    summaryParts.push(`${ocrLowConfidencePages} page(s) remained below confidence threshold`);
                }
                if (ocrLanguageFallbackUsed) {
                    summaryParts.push('OCR language auto-fallback applied');
                }
                if (removedEdgeLineCount > 0) {
                    summaryParts.push(`${removedEdgeLineCount} repeated line(s) removed`);
                }
                if (removedPageNumberLineCount > 0) {
                    summaryParts.push(`${removedPageNumberLineCount} page-number line(s) removed`);
                }
                summaryParts.push(
                    preserveTextFormatting
                        ? 'formatting preserved (paragraphs/headings/lists)'
                        : 'simple paragraph text mode',
                );
                if (usedMetadataAssist) {
                    summaryParts.push('PDF metadata applied');
                }
                setStatus({
                    type: 'success',
                    message: withNavigationSummary(`EPUB downloaded successfully. ${summaryParts.join(' • ')}.`),
                });
            }

            if (exportConversionReport) {
                const report = {
                    generatedAt: new Date().toISOString(),
                    sourceFile: file.name,
                    outputFile: `${toSafeFilename(resolvedTitle)}.epub`,
                    title: resolvedTitle,
                    creator: resolvedCreator,
                    publisher: resolvedPublisher,
                    preset: conversionPreset,
                    settings: {
                        epubLanguage,
                        chapterMode,
                        epubContentMode,
                        extractionMode,
                        ocrLanguage: effectiveOcrLanguageMode,
                        ocrQuality,
                        ocrPageSegmentationMode: resolvedOcrPsmMode,
                        ocrPageSegmentationValue: ocrPsmValue,
                        ocrPreprocessMode: resolvedOcrPreprocessMode,
                        ocrConfidenceThreshold: ocrConfidenceThresholdValue,
                        ocrSecondPassEnabled,
                        ocrSecondPassScale: Number(ocrSecondPassScale.toFixed(2)),
                        ocrPreserveInterwordSpaces,
                        embeddedFontProfile,
                        fontScalePercent: fontScalePercentValue,
                        lineHeight: lineHeightValue,
                        marginPercent: marginPercentValue,
                        textAlign: textAlignValue,
                        paragraphIndent: paragraphIndentValue,
                        paragraphSpacing: paragraphSpacingValue,
                        letterSpacing: letterSpacingValue,
                        wordSpacing: wordSpacingValue,
                        hyphenate: epubHyphenation,
                        layoutRetentionMode,
                        layoutDetectColumns,
                        layoutKeepLineBreaks,
                        layoutProtectShortBlocks,
                        layoutBehavior: {
                            wrapMergeMinChars: layoutBehavior.wrapMergeMinChars,
                            paragraphGapMultiplier: layoutBehavior.paragraphGapMultiplier,
                            preferLineBreaks: layoutBehavior.preferLineBreaks,
                            protectShortLines: layoutBehavior.protectShortLines,
                            enableColumnDetection: layoutBehavior.enableColumnDetection,
                            columnGapMin: layoutBehavior.columnGapMin,
                            columnGapFactor: layoutBehavior.columnGapFactor,
                        },
                        includePageImages: shouldEmbedImages,
                        pageImageSourceMode: shouldEmbedImages ? pageImageSourceMode : 'disabled',
                        pageImageQuality,
                        pageImageFormat,
                        autoCropPageImages,
                        normalizeTextCleanup,
                        preserveTextFormatting,
                        removeStandalonePageNumbers,
                        stripHeadersFooters,
                        includePageMarkers,
                        usePdfMetadata,
                        parallelPages: parallelPageCount,
                        requestedOcrWorkerCount,
                        effectiveOcrWorkerCount,
                        epubCompressionMode: resolvedCompressionMode,
                        epubCompressionLevel: compressionLevel,
                    },
                    pages: {
                        selectedCount: selectedPages.length,
                        selected: selectedPages,
                        withoutText: pagesWithoutText,
                        pagesWithEmbeddedImages,
                    },
                    chapters: {
                        count: chapterCount,
                        usedPdfBookmarks,
                        tocEntryCount: navigationItemCount,
                    },
                    extraction: {
                        totalWords,
                        ocrUsedPages,
                        ocrFailedPages,
                        ocrLowConfidencePages,
                        ocrSecondPassPages,
                        ocrSecondPassImprovedPages,
                        ocrHighResRetryPages,
                        ocrHighResRetryImprovedPages,
                        averageOcrConfidence: Number(averageOcrConfidence.toFixed(2)),
                        ocrLanguageFallbackUsed,
                        ocrAutoHighResRetry,
                        ocrLanguage: effectiveOcrLanguageMode,
                        removedEdgeLineCount,
                        removedPageNumberLineCount,
                    },
                    images: {
                        embeddedImageCount,
                        missingImagePages,
                        totalImageBytes,
                        totalImageMegabytes: Number((totalImageBytes / (1024 * 1024)).toFixed(2)),
                        imageSourceLabel,
                    },
                    performance: {
                        conversionDurationMs: Math.round(conversionDurationMs),
                        conversionDurationSeconds: Number(conversionDurationSeconds.toFixed(3)),
                        pagesPerSecond: Number(pagesPerSecond.toFixed(3)),
                        parallelPages: parallelPageCount,
                        ocrWorkerCount: effectiveOcrWorkerCount,
                        compressionLabel,
                        compressionLevel,
                    },
                };
                const reportBlob = new Blob([JSON.stringify(report, null, 2)], {
                    type: 'application/json;charset=utf-8',
                });
                downloadBlob(reportBlob, `${toSafeFilename(resolvedTitle)}-conversion-report.json`);
            }
        } catch (error) {
            setStatus({
                type: 'error',
                message: error?.message ? `Conversion failed: ${error.message}` : 'Conversion failed unexpectedly.',
            });
        } finally {
            if (ocrScheduler && typeof ocrScheduler.terminate === 'function') {
                try {
                    await ocrScheduler.terminate();
                } catch (error) {
                    // Ignore scheduler termination issues silently.
                }
            } else if (ocrWorkers.length) {
                await Promise.allSettled(ocrWorkers.map((worker) => worker.terminate()));
            }
            setIsConverting(false);
        }
    };

    return (
        <div className="relative overflow-hidden rounded-[30px] border border-cyan-100/70 bg-gradient-to-br from-cyan-100/70 via-white/40 to-blue-100/60 p-space-md shadow-[0_34px_90px_-44px_rgba(14,116,144,0.85)] backdrop-blur-2xl dark:border-cyan-500/20 dark:from-slate-900/80 dark:via-slate-900/45 dark:to-cyan-950/65">
            <div aria-hidden className="pointer-events-none absolute -left-20 -top-24 h-56 w-56 rounded-full bg-cyan-300/45 blur-3xl dark:bg-cyan-500/20" />
            <div aria-hidden className="pointer-events-none absolute -right-16 -bottom-20 h-52 w-52 rounded-full bg-sky-300/40 blur-3xl dark:bg-sky-500/15" />
            <div aria-hidden className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_18%_8%,rgba(255,255,255,0.68),transparent_44%),radial-gradient(circle_at_88%_84%,rgba(56,189,248,0.16),transparent_46%)] dark:bg-[radial-gradient(circle_at_18%_8%,rgba(15,23,42,0.58),transparent_46%),radial-gradient(circle_at_88%_84%,rgba(8,145,178,0.22),transparent_48%)]" />
            <div className="relative z-10 space-y-space-md">
                <div className="rounded-[22px] border border-white/65 bg-white/65 p-space-md shadow-[inset_0_1px_0_rgba(255,255,255,0.9)] backdrop-blur-xl dark:border-slate-700/70 dark:bg-slate-900/60">
                    <div className="flex flex-wrap items-start justify-between gap-space-sm">
                        <div className="space-y-space-xs">
                            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-cyan-700 dark:text-cyan-300">
                                Liquid Glass Workspace
                            </p>
                            <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                                Hindi PDF → EPUB Converter
                            </h3>
                            <p className="max-w-2xl text-sm text-gray-600 dark:text-gray-300">
                                Premium OCR, chapter intelligence, and formatting-preserving EPUB generation inside a fluid glass interface.
                            </p>
                        </div>
                        <div className="flex flex-wrap items-center gap-space-xs">
                            <Badge color="info">{selectedPresetLabel}</Badge>
                            <Badge color="gray">{epubContentMode === 'images-only' ? 'Image mode' : 'Text + image mode'}</Badge>
                            <Badge color="gray">{ocrControlsDisabled ? 'OCR idle' : 'OCR active'}</Badge>
                        </div>
                    </div>
                </div>

                <div className={fieldSurfaceClassName}>
                <label htmlFor="hindi-pdf-upload" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Upload Hindi PDF
                </label>
                <input
                    id="hindi-pdf-upload"
                    type="file"
                    accept=".pdf,application/pdf"
                    onChange={handleFileChange}
                    className="block w-full rounded-radius-md border border-white/70 bg-white/75 p-space-sm text-sm text-gray-700 shadow-[0_10px_30px_-26px_rgba(8,145,178,0.9)] backdrop-blur-md focus:border-cyan-500 focus:outline-none focus:ring-2 focus:ring-cyan-300 dark:border-slate-700 dark:bg-slate-900/80 dark:text-gray-100"
                />
                <p className="text-xs text-gray-500 dark:text-gray-400">
                    Auto mode will switch to OCR when extracted text looks garbled (legacy Hindi fonts or scanned pages).
                </p>
                </div>

                <div className={fieldSurfaceClassName}>
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">EPUB book title</label>
                    <TextInput
                        value={bookTitle}
                        onChange={(event) => setBookTitle(event.target.value)}
                        placeholder="EPUB book title"
                        aria-label="EPUB book title"
                    />
                </div>

                <div className="grid gap-space-sm sm:grid-cols-2">
                    <div className={fieldSurfaceClassName}>
                        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Author name</label>
                        <TextInput
                            value={authorName}
                            onChange={(event) => setAuthorName(event.target.value)}
                            placeholder="Author name"
                            aria-label="Author name"
                        />
                    </div>
                    <div className={fieldSurfaceClassName}>
                        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Publisher name</label>
                        <TextInput
                            value={publisherName}
                            onChange={(event) => setPublisherName(event.target.value)}
                            placeholder="Publisher name"
                            aria-label="Publisher name"
                        />
                    </div>
                </div>

                <div className="grid gap-space-sm sm:grid-cols-2 xl:grid-cols-3">
                <div className={fieldSurfaceClassName}>
                    <label htmlFor="hindi-conversion-preset" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        Conversion preset
                    </label>
                    <Select
                        id="hindi-conversion-preset"
                        value={conversionPreset}
                        onChange={handlePresetChange}
                    >
                        {CONVERTER_PRESET_OPTIONS.map((option) => (
                            <option key={option.value} value={option.value}>
                                {option.label}
                            </option>
                        ))}
                    </Select>
                </div>
                <div className={fieldSurfaceClassName}>
                    <label htmlFor="hindi-page-range" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        Page range
                    </label>
                    <TextInput
                        id="hindi-page-range"
                        value={pageRangeInput}
                        onChange={(event) => setPageRangeInput(event.target.value)}
                        placeholder='All pages (or e.g. "1-20,25,40-42")'
                        aria-label="Page range"
                    />
                </div>
                <div className={fieldSurfaceClassName}>
                    <label htmlFor="hindi-epub-language" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        EPUB metadata language
                    </label>
                    <Select
                        id="hindi-epub-language"
                        value={epubLanguage}
                        onChange={(event) => setEpubLanguage(event.target.value)}
                    >
                        {EPUB_LANGUAGE_OPTIONS.map((option) => (
                            <option key={option.value} value={option.value}>
                                {option.label}
                            </option>
                        ))}
                    </Select>
                </div>
                <div className={fieldSurfaceClassName}>
                    <label htmlFor="hindi-chapter-mode" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        EPUB chapter mode
                    </label>
                    <Select
                        id="hindi-chapter-mode"
                        value={chapterMode}
                        onChange={(event) => setChapterMode(event.target.value)}
                    >
                        <option value="page">One chapter per page</option>
                        <option value="smart">Smart chapter detection</option>
                        <option value="single">Single merged chapter</option>
                    </Select>
                </div>
                <div className={fieldSurfaceClassName}>
                    <label htmlFor="hindi-content-mode" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        EPUB content mode
                    </label>
                    <Select
                        id="hindi-content-mode"
                        value={epubContentMode}
                        onChange={(event) => setEpubContentMode(event.target.value)}
                    >
                        <option value="images-only">Images only (PDF look)</option>
                        <option value="hybrid">Images + extracted text</option>
                        <option value="text-only">Text only</option>
                    </Select>
                </div>
                <div className={fieldSurfaceClassName}>
                    <label htmlFor="hindi-extraction-mode" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        Text extraction mode
                    </label>
                    <Select
                        id="hindi-extraction-mode"
                        value={extractionMode}
                        onChange={(event) => setExtractionMode(event.target.value)}
                        disabled={epubContentMode === 'images-only'}
                    >
                        <option value="auto">Auto (Text + OCR fallback)</option>
                        <option value="ocr">OCR only (best for garbled output)</option>
                        <option value="text">Text extraction only (fastest)</option>
                    </Select>
                </div>
                <div className={fieldSurfaceClassName}>
                    <label htmlFor="hindi-ocr-language" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        OCR language profile
                    </label>
                    <Select
                        id="hindi-ocr-language"
                        value={ocrLanguageMode}
                        onChange={(event) => setOcrLanguageMode(event.target.value)}
                        disabled={ocrControlsDisabled}
                    >
                        {OCR_LANGUAGE_OPTIONS.map((option) => (
                            <option key={option.value} value={option.value}>
                                {option.label}
                            </option>
                        ))}
                    </Select>
                </div>
                <div className={fieldSurfaceClassName}>
                    <label htmlFor="hindi-ocr-quality" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        OCR quality
                    </label>
                <Select
                    id="hindi-ocr-quality"
                    value={ocrQuality}
                    onChange={(event) => setOcrQuality(event.target.value)}
                    disabled={ocrControlsDisabled}
                >
                    <option value="fast">Fast</option>
                    <option value="balanced">Balanced</option>
                    <option value="best">Best quality</option>
                    <option value="ultra">Ultra (hi-res + multi-pass)</option>
                </Select>
            </div>
                <div className={fieldSurfaceClassName}>
                    <label htmlFor="hindi-ocr-psm" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        OCR layout mode
                    </label>
                    <Select
                        id="hindi-ocr-psm"
                        value={ocrPageSegmentationMode}
                        onChange={(event) => setOcrPageSegmentationMode(event.target.value)}
                        disabled={ocrControlsDisabled}
                    >
                        {OCR_PAGE_SEGMENTATION_OPTIONS.map((option) => (
                            <option key={option.value} value={option.value}>
                                {option.label}
                            </option>
                        ))}
                    </Select>
                </div>
                <div className={fieldSurfaceClassName}>
                    <label htmlFor="hindi-ocr-preprocess" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        OCR preprocessing
                    </label>
                    <Select
                        id="hindi-ocr-preprocess"
                        value={ocrPreprocessMode}
                        onChange={(event) => setOcrPreprocessMode(event.target.value)}
                        disabled={ocrControlsDisabled}
                    >
                        {OCR_PREPROCESS_OPTIONS.map((option) => (
                            <option key={option.value} value={option.value}>
                                {option.label}
                            </option>
                        ))}
                    </Select>
                </div>
                <div className={fieldSurfaceClassName}>
                    <label htmlFor="hindi-ocr-confidence-threshold" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        OCR minimum confidence (%)
                    </label>
                    <TextInput
                        id="hindi-ocr-confidence-threshold"
                        type="number"
                        min={0}
                        max={99}
                        value={ocrConfidenceThreshold}
                        onChange={(event) => setOcrConfidenceThreshold(event.target.value)}
                        disabled={ocrControlsDisabled}
                        aria-label="OCR minimum confidence percent"
                    />
                </div>
                <div className={fieldSurfaceClassName}>
                    <label htmlFor="hindi-embedded-font" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        Embedded EPUB font
                    </label>
                    <Select
                        id="hindi-embedded-font"
                        value={embeddedFontProfile}
                        onChange={(event) => setEmbeddedFontProfile(event.target.value)}
                    >
                        {EPUB_FONT_OPTIONS.map((option) => (
                            <option key={option.value} value={option.value}>
                                {option.label}
                            </option>
                        ))}
                    </Select>
                </div>
                <div className={fieldSurfaceClassName}>
                    <label htmlFor="hindi-epub-font-scale" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        EPUB text size (%)
                    </label>
                    <TextInput
                        id="hindi-epub-font-scale"
                        type="number"
                        min={80}
                        max={160}
                        value={epubFontScalePercent}
                        onChange={(event) => setEpubFontScalePercent(event.target.value)}
                        aria-label="EPUB text size percent"
                    />
                </div>
                <div className={fieldSurfaceClassName}>
                    <label htmlFor="hindi-epub-line-height" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        EPUB line height
                    </label>
                    <TextInput
                        id="hindi-epub-line-height"
                        type="number"
                        min={1.2}
                        max={2.4}
                        step={0.05}
                        value={epubLineHeight}
                        onChange={(event) => setEpubLineHeight(event.target.value)}
                        aria-label="EPUB line height"
                    />
                </div>
                <div className={fieldSurfaceClassName}>
                    <label htmlFor="hindi-epub-margin" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        EPUB page margin (%)
                    </label>
                    <TextInput
                        id="hindi-epub-margin"
                        type="number"
                        min={0}
                        max={14}
                        step={0.5}
                        value={epubMarginPercent}
                        onChange={(event) => setEpubMarginPercent(event.target.value)}
                        aria-label="EPUB page margin percent"
                    />
                </div>
                <div className={fieldSurfaceClassName}>
                    <label htmlFor="hindi-epub-text-align" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        Text alignment
                    </label>
                    <Select
                        id="hindi-epub-text-align"
                        value={epubTextAlign}
                        onChange={(event) => setEpubTextAlign(event.target.value)}
                    >
                        {EPUB_TEXT_ALIGN_OPTIONS.map((option) => (
                            <option key={option.value} value={option.value}>
                                {option.label}
                            </option>
                        ))}
                    </Select>
                </div>
                <div className={fieldSurfaceClassName}>
                    <label htmlFor="hindi-epub-paragraph-indent" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        Paragraph indent (em)
                    </label>
                    <TextInput
                        id="hindi-epub-paragraph-indent"
                        type="number"
                        min={0}
                        max={2}
                        step={0.05}
                        value={epubParagraphIndent}
                        onChange={(event) => setEpubParagraphIndent(event.target.value)}
                        aria-label="EPUB paragraph indent em"
                    />
                </div>
                <div className={fieldSurfaceClassName}>
                    <label htmlFor="hindi-epub-paragraph-spacing" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        Paragraph spacing (em)
                    </label>
                    <TextInput
                        id="hindi-epub-paragraph-spacing"
                        type="number"
                        min={0}
                        max={3}
                        step={0.05}
                        value={epubParagraphSpacing}
                        onChange={(event) => setEpubParagraphSpacing(event.target.value)}
                        aria-label="EPUB paragraph spacing em"
                    />
                </div>
                <div className={fieldSurfaceClassName}>
                    <label htmlFor="hindi-epub-letter-spacing" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        Letter spacing (em)
                    </label>
                    <TextInput
                        id="hindi-epub-letter-spacing"
                        type="number"
                        min={-0.05}
                        max={0.3}
                        step={0.01}
                        value={epubLetterSpacing}
                        onChange={(event) => setEpubLetterSpacing(event.target.value)}
                        aria-label="EPUB letter spacing em"
                    />
                </div>
                <div className={fieldSurfaceClassName}>
                    <label htmlFor="hindi-epub-word-spacing" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        Word spacing (em)
                    </label>
                    <TextInput
                        id="hindi-epub-word-spacing"
                        type="number"
                        min={-0.05}
                        max={0.5}
                        step={0.01}
                        value={epubWordSpacing}
                        onChange={(event) => setEpubWordSpacing(event.target.value)}
                        aria-label="EPUB word spacing em"
                    />
                </div>
                <div className={fieldSurfaceClassName}>
                    <div className="flex items-start justify-between gap-space-xs">
                        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                            Layout retention
                        </label>
                        <Badge color="info">Advanced</Badge>
                    </div>
                    <Select
                        value={layoutRetentionMode}
                        onChange={(event) => setLayoutRetentionMode(event.target.value)}
                        aria-label="Layout retention mode"
                    >
                        {LAYOUT_RETENTION_MODE_OPTIONS.map((option) => (
                            <option key={option.value} value={option.value}>
                                {option.label}
                            </option>
                        ))}
                    </Select>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                        {LAYOUT_RETENTION_MODE_OPTIONS.find((option) => option.value === layoutRetentionMode)?.description}
                    </p>
                    <div className="mt-space-xs grid gap-space-xs sm:grid-cols-2">
                        <label className="flex items-center gap-space-xs text-xs text-gray-600 dark:text-gray-300">
                            <input
                                type="checkbox"
                                checked={layoutDetectColumns}
                                onChange={(event) => setLayoutDetectColumns(event.target.checked)}
                                className="h-4 w-4 rounded border-gray-300 text-cyan-600 focus:ring-cyan-500"
                            />
                            Auto-detect multi-column pages
                        </label>
                        <label className="flex items-center gap-space-xs text-xs text-gray-600 dark:text-gray-300">
                            <input
                                type="checkbox"
                                checked={layoutKeepLineBreaks}
                                onChange={(event) => setLayoutKeepLineBreaks(event.target.checked)}
                                className="h-4 w-4 rounded border-gray-300 text-cyan-600 focus:ring-cyan-500"
                            />
                            Keep original line breaks (poems/code)
                        </label>
                        <label className="flex items-center gap-space-xs text-xs text-gray-600 dark:text-gray-300">
                            <input
                                type="checkbox"
                                checked={layoutProtectShortBlocks}
                                onChange={(event) => setLayoutProtectShortBlocks(event.target.checked)}
                                className="h-4 w-4 rounded border-gray-300 text-cyan-600 focus:ring-cyan-500"
                            />
                            Protect short headings/stanzas from merging
                        </label>
                    </div>
                </div>
                <label className={`${fieldSurfaceClassName} flex items-center gap-space-xs`}>
                    <input
                        type="checkbox"
                        checked={epubHyphenation}
                        onChange={(event) => setEpubHyphenation(event.target.checked)}
                        className="h-4 w-4 rounded border-gray-300 text-cyan-600 focus:ring-cyan-500"
                    />
                    Enable automatic hyphenation for Devanagari text
                </label>
                <div className={fieldSurfaceClassName}>
                    <label htmlFor="hindi-parallel-pages" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        Parallel page workers
                    </label>
                    <TextInput
                        id="hindi-parallel-pages"
                        type="number"
                        min={1}
                        max={MAX_CONVERTER_PARALLEL_PAGES}
                        value={parallelPages}
                        onChange={(event) => setParallelPages(event.target.value)}
                        aria-label="Parallel page workers"
                    />
                </div>
                <div className={fieldSurfaceClassName}>
                    <label htmlFor="hindi-ocr-workers" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        OCR workers
                    </label>
                    <Select
                        id="hindi-ocr-workers"
                        value={ocrWorkerCount}
                        onChange={(event) => setOcrWorkerCount(event.target.value)}
                        disabled={ocrControlsDisabled}
                    >
                        <option value="1">1 worker (low memory)</option>
                        <option value="2">2 workers (faster OCR)</option>
                        <option value="3">3 workers (max OCR speed)</option>
                    </Select>
                </div>
                <div className={fieldSurfaceClassName}>
                    <label htmlFor="hindi-epub-compression" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        EPUB compression
                    </label>
                    <Select
                        id="hindi-epub-compression"
                        value={epubCompressionMode}
                        onChange={(event) => setEpubCompressionMode(event.target.value)}
                    >
                        {EPUB_COMPRESSION_OPTIONS.map((option) => (
                            <option key={option.value} value={option.value}>
                                {option.label}
                            </option>
                        ))}
                    </Select>
                </div>
                <div className={fieldSurfaceClassName}>
                    <label htmlFor="hindi-page-image-source" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        Image embedding source
                    </label>
                    <Select
                        id="hindi-page-image-source"
                        value={pageImageSourceMode}
                        onChange={(event) => setPageImageSourceMode(event.target.value)}
                        disabled={imageControlsDisabled}
                    >
                        <option value="embedded">Embedded PDF images only</option>
                        <option value="snapshot">Full-page snapshots</option>
                    </Select>
                </div>
                <div className={fieldSurfaceClassName}>
                    <label htmlFor="hindi-page-image-quality" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        Page image quality
                    </label>
                    <Select
                        id="hindi-page-image-quality"
                        value={pageImageQuality}
                        onChange={(event) => setPageImageQuality(event.target.value)}
                        disabled={imageControlsDisabled}
                    >
                        <option value="compact">Compact</option>
                        <option value="balanced">Balanced</option>
                        <option value="detailed">Detailed</option>
                    </Select>
                </div>
                <div className={fieldSurfaceClassName}>
                    <label htmlFor="hindi-page-image-format" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        Embedded image format
                    </label>
                    <Select
                        id="hindi-page-image-format"
                        value={pageImageFormat}
                        onChange={(event) => setPageImageFormat(event.target.value)}
                        disabled={imageControlsDisabled}
                    >
                        <option value="jpeg">JPEG (smaller)</option>
                        <option value="png">PNG (sharper)</option>
                    </Select>
                </div>
                </div>

                <div className="space-y-space-xs rounded-[22px] border border-white/60 bg-white/60 p-space-md text-sm text-gray-600 shadow-[0_20px_45px_-36px_rgba(8,145,178,0.95)] backdrop-blur-xl dark:border-slate-700/70 dark:bg-slate-900/55 dark:text-gray-300">
                <label className="flex items-center gap-space-xs">
                    <input
                        type="checkbox"
                        checked={includePageImages}
                        onChange={(event) => setIncludePageImages(event.target.checked)}
                        disabled={epubContentMode === 'text-only'}
                        className="h-4 w-4 rounded border-gray-300 text-cyan-600 focus:ring-cyan-500 disabled:opacity-50"
                    />
                    Embed PDF images inside EPUB
                </label>
                <label className="flex items-center gap-space-xs">
                    <input
                        type="checkbox"
                        checked={autoCropPageImages}
                        onChange={(event) => setAutoCropPageImages(event.target.checked)}
                        disabled={imageControlsDisabled}
                        className="h-4 w-4 rounded border-gray-300 text-cyan-600 focus:ring-cyan-500 disabled:opacity-50"
                    />
                    Auto-crop white margins from extracted images
                </label>
                <div className="w-full max-w-xs">
                    <TextInput
                        type="number"
                        min={0}
                        max={80}
                        value={imageCropPaddingPx}
                        onChange={(event) => setImageCropPaddingPx(event.target.value)}
                        disabled={imageControlsDisabled || !autoCropPageImages}
                        placeholder="Crop padding (px)"
                        aria-label="Crop padding in pixels"
                    />
                </div>
                <label className="flex items-center gap-space-xs">
                    <input
                        type="checkbox"
                        checked={usePdfMetadata}
                        onChange={(event) => setUsePdfMetadata(event.target.checked)}
                        className="h-4 w-4 rounded border-gray-300 text-cyan-600 focus:ring-cyan-500"
                    />
                    Auto-fill title/author/publisher from PDF metadata when fields are default
                </label>
                <label className="flex items-center gap-space-xs">
                    <input
                        type="checkbox"
                        checked={exportConversionReport}
                        onChange={(event) => setExportConversionReport(event.target.checked)}
                        className="h-4 w-4 rounded border-gray-300 text-cyan-600 focus:ring-cyan-500"
                    />
                    Export detailed conversion report (.json) with metrics and settings
                </label>
                <label className="flex items-center gap-space-xs">
                    <input
                        type="checkbox"
                        checked={ocrEnableSecondPass}
                        onChange={(event) => setOcrEnableSecondPass(event.target.checked)}
                        disabled={ocrControlsDisabled}
                        className="h-4 w-4 rounded border-gray-300 text-cyan-600 focus:ring-cyan-500 disabled:opacity-50"
                    />
                    Enable OCR second pass on low-confidence pages
                </label>
                <label className="flex items-center gap-space-xs">
                    <input
                        type="checkbox"
                        checked={ocrAutoHighResRetry}
                        onChange={(event) => setOcrAutoHighResRetry(event.target.checked)}
                        disabled={ocrControlsDisabled}
                        className="h-4 w-4 rounded border-gray-300 text-cyan-600 focus:ring-cyan-500 disabled:opacity-50"
                    />
                    Auto-retry low-confidence pages with hi-res + adaptive OCR
                </label>
                <label className="flex items-center gap-space-xs">
                    <input
                        type="checkbox"
                        checked={ocrPreserveInterwordSpaces}
                        onChange={(event) => setOcrPreserveInterwordSpaces(event.target.checked)}
                        disabled={ocrControlsDisabled}
                        className="h-4 w-4 rounded border-gray-300 text-cyan-600 focus:ring-cyan-500 disabled:opacity-50"
                    />
                    Preserve inter-word spacing in OCR output
                </label>
                <label className="flex items-center gap-space-xs">
                    <input
                        type="checkbox"
                        checked={normalizeTextCleanup}
                        onChange={(event) => setNormalizeTextCleanup(event.target.checked)}
                        className="h-4 w-4 rounded border-gray-300 text-cyan-600 focus:ring-cyan-500"
                    />
                    Normalize Unicode text, spacing, and wrapped lines
                </label>
                <label className="flex items-center gap-space-xs">
                    <input
                        type="checkbox"
                        checked={preserveTextFormatting}
                        onChange={(event) => setPreserveTextFormatting(event.target.checked)}
                        disabled={epubContentMode === 'images-only'}
                        className="h-4 w-4 rounded border-gray-300 text-cyan-600 focus:ring-cyan-500 disabled:opacity-50"
                    />
                    Preserve formatting (paragraphs, headings, and lists)
                </label>
                <label className="flex items-center gap-space-xs">
                    <input
                        type="checkbox"
                        checked={removeStandalonePageNumbers}
                        onChange={(event) => setRemoveStandalonePageNumbers(event.target.checked)}
                        className="h-4 w-4 rounded border-gray-300 text-cyan-600 focus:ring-cyan-500"
                    />
                    Remove standalone page-number lines from extracted text
                </label>
                <label className="flex items-center gap-space-xs">
                    <input
                        type="checkbox"
                        checked={stripHeadersFooters}
                        onChange={(event) => setStripHeadersFooters(event.target.checked)}
                        className="h-4 w-4 rounded border-gray-300 text-cyan-600 focus:ring-cyan-500"
                    />
                    Remove repeated page headers/footers
                </label>
                <label className="flex items-center gap-space-xs">
                    <input
                        type="checkbox"
                        checked={includePageMarkers}
                        onChange={(event) => setIncludePageMarkers(event.target.checked)}
                        disabled={chapterMode === 'page' || epubContentMode === 'images-only'}
                        className="h-4 w-4 rounded border-gray-300 text-cyan-600 focus:ring-cyan-500 disabled:opacity-50"
                    />
                    Include page markers in merged/smart chapter modes
                </label>
                <div className="rounded-radius-lg border border-cyan-200/70 bg-cyan-50/60 p-space-sm dark:border-cyan-500/30 dark:bg-cyan-500/10">
                    <p className="text-sm font-semibold text-cyan-800 dark:text-cyan-200">
                        Top Feature Names for Hindi PDF Conversion
                    </p>
                    <div className="mt-space-xs space-y-space-xs">
                        {HINDI_CONVERTER_FEATURE_LABELS.map((feature) => (
                            <div
                        key={feature.id}
                                className="rounded-radius-md border border-cyan-100/80 bg-white/90 p-space-sm shadow-[inset_0_1px_0_rgba(255,255,255,0.85)] backdrop-blur-md dark:border-cyan-500/20 dark:bg-slate-900/70"
                            >
                                <div className="flex flex-wrap items-center justify-between gap-space-xs">
                                    <p className="text-sm font-medium text-gray-800 dark:text-gray-100">
                                        ⭐ {feature.label}
                                    </p>
                                    <Badge color={feature.status === 'available' ? 'success' : 'warning'}>
                                        {feature.status === 'available' ? 'Available' : 'Coming soon'}
                                    </Badge>
                                </div>
                                <p className="mt-[2px] text-xs text-gray-600 dark:text-gray-300">
                                    {feature.description}
                                </p>
                            </div>
                        ))}
                    </div>
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                    Images only mode shows only extracted images in EPUB chapters.
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                    Smart chapter mode groups pages using detected heading patterns and keeps page anchors for deep links.
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                    Presets quickly switch between balanced multilingual, OCR-heavy scans, fast text export, and image archive workflows.
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                    Enable formatting preservation to keep paragraph flow, heading hierarchy, and list structure in EPUB text.
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                    Use text size, line-height, and margin controls to tune readability for Kindle, mobile, or tablet EPUB readers.
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                    Use &quot;Embedded PDF images only&quot; to keep only original images from the PDF, or choose snapshots to preserve whole-page visuals.
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                    Choose an embedded font profile for Sanskrit, Hindi, and English output. The Sanskrit serif option improves rendering of Sanskrit-heavy text.
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                    EPUB metadata language controls reader indexing/search hints and should match your primary script mix.
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                    Conversion report export writes a JSON audit file with OCR usage, chapter stats, image stats, and all selected settings.
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                    PDF bookmarks are imported into EPUB table of contents and chapter navigation when available.
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                    OCR language profile, OCR quality, and page image embedding can significantly increase processing time and output file size.
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                    Advanced OCR controls let you tune layout segmentation, preprocessing, confidence thresholding, and second-pass retries for difficult scans.
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                    Increase parallel page workers for faster conversion on modern CPUs, and use fast compression for quicker EPUB packaging.
                </p>
                </div>

                <div className="rounded-[22px] border border-white/60 bg-white/65 p-space-md shadow-[0_20px_42px_-34px_rgba(8,145,178,0.95)] backdrop-blur-xl dark:border-slate-700/70 dark:bg-slate-900/60">
                    <div className="flex flex-wrap items-center gap-space-sm">
                        <Button
                            onClick={handleConvert}
                            gradientDuoTone="cyanToBlue"
                            disabled={!file || isConverting}
                            className="shadow-[0_16px_36px_-22px_rgba(6,182,212,0.95)]"
                        >
                            {isConverting ? `Converting ${progressPercent}%` : 'Convert PDF to EPUB'}
                        </Button>
                        {file ? <Badge color="gray">{file.name}</Badge> : null}
                    </div>

                    {(isConverting || progress.total > 0) && (
                        <div className="mt-space-sm space-y-space-xs">
                            <div className="h-2 w-full overflow-hidden rounded-radius-full bg-cyan-100/70 dark:bg-slate-800">
                                <div
                                    className="relative h-full rounded-radius-full bg-cyan-500 transition-all duration-300"
                                    style={{ width: `${progressPercent}%` }}
                                >
                                    <span className="absolute inset-0 bg-[linear-gradient(90deg,rgba(255,255,255,0.24),rgba(255,255,255,0))]" />
                                </div>
                            </div>
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                                {progress.total ? `Processed ${progress.current} of ${progress.total} pages` : 'Preparing conversion…'}
                            </p>
                        </div>
                    )}
                </div>

                {status && (
                    <Alert
                        color={
                            status.type === 'success'
                                ? 'success'
                                : status.type === 'error'
                                    ? 'failure'
                                    : status.type === 'warning'
                                        ? 'warning'
                                        : 'info'
                        }
                        className="border border-white/60 bg-white/70 shadow-[0_12px_30px_-24px_rgba(8,145,178,0.9)] backdrop-blur-md dark:border-slate-700 dark:bg-slate-900/70"
                    >
                        {status.type === 'success' ? <FaCheckCircle className="mr-2 inline" /> : null}
                        <span className="font-medium">{status.message}</span>
                    </Alert>
                )}
            </div>
        </div>
    );
}

const workspaceComponents = {
    'json-formatter': JsonFormatterTool,
    'base64-converter': Base64Tool,
    'hindi-pdf-epub-converter': HindiPdfToEpubTool,
    'text-transformer': TextTransformerTool,
    'ebook-reader': EbookReaderTool,
};

const RECENT_WORKSPACE_KEY = 'scientistshield.recentWorkspaceTools';
const workspaceToolIdSet = new Set(workspaceTools.map((tool) => tool.id));

const cardVariants = {
    initial: { opacity: 0, y: 12 },
    animate: { opacity: 1, y: 0 },
};

function ResourceCard({ tool }) {
    const Icon = tool.icon;
    const card = (
        <motion.div
            variants={cardVariants}
            whileHover={{ y: -6, boxShadow: '0 20px 35px -20px rgba(15, 23, 42, 0.6)' }}
            className="relative h-full rounded-radius-lg border border-gray-200 dark:border-gray-700 bg-white/80 dark:bg-slate-900/70 p-space-xl backdrop-blur"
        >
            <div className="flex items-center gap-space-md mb-space-sm">
                <span className="inline-flex h-12 w-12 items-center justify-center rounded-radius-full bg-gradient-to-br from-cyan-500 to-blue-500 text-white">
                    <Icon className="text-xl" />
                </span>
                <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{tool.name}</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">{tool.category}</p>
                </div>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-300 mb-space-md">{tool.description}</p>
            <div className="flex flex-wrap gap-space-xs text-xs text-gray-500 dark:text-gray-400 mb-space-md">
                {tool.tags?.map((tag) => (
                    <span key={tag} className="rounded-radius-full border border-gray-200 dark:border-gray-700 px-space-sm py-[2px]">
                        #{tag}
                    </span>
                ))}
            </div>
            {tool.highlight && (
                <Badge color="info" className="mb-space-md w-fit">
                    {tool.highlight}
                </Badge>
            )}
            {tool.isFeatured && (
                <span className="absolute right-space-md top-space-md rounded-radius-full bg-emerald-500/10 px-space-sm py-[2px] text-xs font-semibold text-emerald-600">
                    Featured
                </span>
            )}
            <div className="mt-auto flex items-center gap-space-xs text-sm font-medium text-cyan-600 dark:text-cyan-400">
                <span>Open tool</span>
                <FaArrowRight />
            </div>
        </motion.div>
    );

    if (tool.external) {
        return (
            <a href={tool.href} target="_blank" rel="noopener noreferrer" className="block h-full">
                {card}
            </a>
        );
    }

    return (
        <Link to={tool.href} className="block h-full">
            {card}
        </Link>
    );
}

ResourceCard.propTypes = {
    tool: PropTypes.shape({
        id: PropTypes.string.isRequired,
        name: PropTypes.string.isRequired,
        description: PropTypes.string.isRequired,
        icon: PropTypes.elementType.isRequired,
        category: PropTypes.string.isRequired,
        tags: PropTypes.arrayOf(PropTypes.string),
        highlight: PropTypes.string,
        isFeatured: PropTypes.bool,
        external: PropTypes.bool,
        href: PropTypes.string.isRequired,
    }).isRequired,
};

function WorkspaceCard({ tool }) {
    const Icon = tool.icon;
    return (
        <Link to={`/tools/${tool.id}`} className="block h-full">
            <motion.div
                variants={cardVariants}
                whileHover={{ y: -6, boxShadow: '0 20px 35px -20px rgba(15, 23, 42, 0.6)' }}
                className="relative flex h-full flex-col rounded-radius-lg border border-gray-200 dark:border-gray-700 bg-white/85 dark:bg-slate-900/75 p-space-xl backdrop-blur"
            >
                <div className="flex items-center gap-space-md mb-space-sm">
                    <span className={`inline-flex h-12 w-12 items-center justify-center rounded-radius-full bg-gradient-to-br ${tool.accent} text-white shadow-inner`}>
                        <Icon className="text-xl" />
                    </span>
                    <div>
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{tool.name}</h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400">{tool.category}</p>
                    </div>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-300 mb-space-md">
                    {tool.description}
                </p>
                {tool.tags?.length ? (
                    <div className="flex flex-wrap gap-space-xs text-xs text-gray-500 dark:text-gray-400 mb-space-md">
                        {tool.tags.map((tag) => (
                            <span key={tag} className="rounded-radius-full border border-gray-200 dark:border-gray-700 px-space-sm py-[2px]">
                                #{tag}
                            </span>
                        ))}
                    </div>
                ) : null}
                <div className="mt-auto flex items-center gap-space-xs text-sm font-medium text-cyan-600 dark:text-cyan-400">
                    <span>Open tool</span>
                    <FaArrowRight />
                </div>
            </motion.div>
        </Link>
    );
}

WorkspaceCard.propTypes = {
    tool: PropTypes.shape({
        id: PropTypes.string.isRequired,
        name: PropTypes.string.isRequired,
        description: PropTypes.string.isRequired,
        icon: PropTypes.elementType.isRequired,
        category: PropTypes.string.isRequired,
        tags: PropTypes.arrayOf(PropTypes.string),
        accent: PropTypes.string.isRequired,
    }).isRequired,
};

export default function Tools() {
    const params = useParams();
    const toolIdParam = params.toolId || params['*'] || '';
    const toolId = toolIdParam ? toolIdParam.split('/')[0] : '';
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const workspaceFromQuery = searchParams.get('workspace');
    const [searchTerm, setSearchTerm] = useState('');
    const [category, setCategory] = useState('all');
    const [recentWorkspaceTools, setRecentWorkspaceTools] = useState([]);

    useEffect(() => {
        if (!workspaceFromQuery || !workspaceToolIdSet.has(workspaceFromQuery)) return;
        if (workspaceFromQuery === toolId) return;
        navigate(`/tools/${workspaceFromQuery}`, { replace: true });
    }, [navigate, toolId, workspaceFromQuery]);

    useEffect(() => {
        if (typeof window === 'undefined') return;
        try {
            const stored = window.localStorage.getItem(RECENT_WORKSPACE_KEY);
            if (!stored) return;
            const parsed = JSON.parse(stored);
            if (!Array.isArray(parsed)) return;
            const valid = parsed.filter((id) => workspaceToolIdSet.has(id));
            if (valid.length) {
                setRecentWorkspaceTools(valid);
            }
        } catch (error) {
            // Ignore storage access issues silently
        }
    }, []);

    useEffect(() => {
        if (!toolId || !workspaceToolIdSet.has(toolId)) return;
        setRecentWorkspaceTools((prev) => {
            const next = [toolId, ...prev.filter((id) => id !== toolId)].slice(0, 4);
            if (next.length === prev.length && next.every((value, index) => value === prev[index])) {
                return prev;
            }
            if (typeof window !== 'undefined') {
                try {
                    window.localStorage.setItem(RECENT_WORKSPACE_KEY, JSON.stringify(next));
                } catch (error) {
                    // Ignore storage access issues silently
                }
            }
            return next;
        });
    }, [toolId]);

    const selectedTool = toolId ? workspaceTools.find((tool) => tool.id === toolId) : null;
    const ActiveComponent = toolId ? workspaceComponents[toolId] : null;
    const SelectedIcon = selectedTool?.icon;

    const filteredTools = useMemo(() => {
        return resourceTools.filter((tool) => {
            const matchesCategory = category === 'all' || tool.category === category;
            const query = searchTerm.trim().toLowerCase();
            if (!query) return matchesCategory;
            const haystack = `${tool.name} ${tool.description} ${tool.tags?.join(' ') ?? ''}`.toLowerCase();
            return matchesCategory && haystack.includes(query);
        });
    }, [category, searchTerm]);

    if (toolId) {
        if (!selectedTool || !ActiveComponent) {
            return (
                <div className="min-h-screen bg-gray-50 dark:bg-slate-950 text-gray-900 dark:text-gray-100 pb-space-5xl">
                    <div className="mx-auto flex w-full max-w-4xl flex-col gap-space-xl px-space-md lg:px-space-2xl py-space-5xl">
                        <div className="rounded-radius-lg border border-dashed border-gray-300 bg-white/80 p-space-xl text-center shadow-sm dark:border-gray-700 dark:bg-slate-900/80">
                            <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">Tool not found</h1>
                            <p className="mt-space-sm text-sm text-gray-600 dark:text-gray-400">
                                The workspace you requested does not exist. Browse the full tools hub to choose another utility.
                            </p>
                            <Button as={Link} to="/tools" color="light" className="mt-space-lg w-fit">
                                <FaChevronLeft className="mr-2" /> Back to tools
                            </Button>
                        </div>
                    </div>
                </div>
            );
        }

        return (
            <div className="min-h-screen bg-gray-50 dark:bg-slate-950 text-gray-900 dark:text-gray-100 pb-space-5xl">
                <div className="mx-auto flex w-full max-w-6xl flex-col gap-space-3xl px-space-md lg:px-space-2xl py-space-5xl">
                    <div className="flex flex-wrap items-center justify-between gap-space-sm">
                        <Button as={Link} to="/tools" color="light" className="text-gray-900">
                            <FaChevronLeft className="mr-2" /> Back to tools
                        </Button>
                        {recentWorkspaceTools.length > 0 && (
                            <div className="flex flex-wrap items-center gap-space-xs">
                                <span className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                                    Recent tools
                                </span>
                                {recentWorkspaceTools.map((id) => {
                                    const recentTool = workspaceTools.find((tool) => tool.id === id);
                                    if (!recentTool) return null;
                                    return (
                                        <Link
                                            key={id}
                                            to={`/tools/${id}`}
                                            className={`rounded-radius-full px-space-sm py-[6px] text-xs font-medium shadow-sm transition ${
                                                id === toolId
                                                    ? 'bg-cyan-600 text-white'
                                                    : 'bg-white text-cyan-700 hover:bg-cyan-50 dark:bg-slate-950 dark:text-cyan-200 dark:hover:bg-cyan-900/40'
                                            }`}
                                        >
                                            {recentTool.name}
                                        </Link>
                                    );
                                })}
                            </div>
                        )}
                    </div>

                    <section className="space-y-space-lg">
                        <div className="space-y-space-md rounded-radius-lg border border-dashed border-cyan-400/40 bg-cyan-500/5 p-space-lg dark:border-cyan-400/30 dark:bg-cyan-500/10">
                            <div className="flex flex-col gap-space-sm sm:flex-row sm:items-start sm:justify-between">
                                <div className="flex items-start gap-space-md">
                                    {SelectedIcon ? (
                                        <span className={`hidden sm:inline-flex h-12 w-12 items-center justify-center rounded-radius-lg bg-gradient-to-br ${selectedTool.accent} text-white shadow-lg`}>
                                            <SelectedIcon aria-hidden="true" />
                                        </span>
                                    ) : null}
                                    <div className="space-y-space-xs">
                                        <div className="inline-flex items-center gap-space-xs text-xs font-semibold uppercase tracking-wide text-cyan-600 dark:text-cyan-300">
                                            {selectedTool.category}
                                        </div>
                                        <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">{selectedTool.name}</h1>
                                        <p className="text-sm text-gray-600 dark:text-gray-300">
                                            {selectedTool.longDescription ?? selectedTool.description}
                                        </p>
                                    </div>
                                </div>
                                {selectedTool.tags?.length ? (
                                    <div className="flex flex-wrap gap-space-xs">
                                        {selectedTool.tags.map((tag) => (
                                            <span
                                                key={tag}
                                                className="rounded-radius-full bg-white/70 px-space-sm py-[2px] text-xs font-medium text-cyan-700 shadow-sm dark:bg-slate-950/60 dark:text-cyan-200"
                                            >
                                                #{tag}
                                            </span>
                                        ))}
                                    </div>
                                ) : null}
                            </div>
                            {selectedTool.tips?.length ? (
                                <ul className="grid gap-space-sm text-sm text-gray-600 dark:text-gray-300 sm:grid-cols-2">
                                    {selectedTool.tips.map((tip) => (
                                        <li key={tip} className="flex items-start gap-space-sm">
                                            <FaLightbulb className="mt-[2px] text-cyan-500 dark:text-cyan-300" aria-hidden="true" />
                                            <span>{tip}</span>
                                        </li>
                                    ))}
                                </ul>
                            ) : null}
                        </div>
                        <div className="rounded-radius-lg border border-gray-100 bg-white/90 p-space-lg shadow-sm dark:border-gray-800 dark:bg-slate-950/90">
                            <ActiveComponent />
                        </div>
                    </section>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-slate-950 text-gray-900 dark:text-gray-100 pb-space-5xl">
            <div className="mx-auto flex w-full max-w-7xl flex-col gap-space-4xl px-space-md lg:px-space-2xl py-space-5xl">
                <section className="relative overflow-hidden rounded-radius-lg border border-white/20 bg-gradient-to-br from-cyan-500 via-blue-600 to-indigo-700 p-space-5xl text-white shadow-2xl">
                    <div className="absolute -top-24 right-10 h-56 w-56 rounded-full bg-white/10 blur-3xl" />
                    <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-blue-900/40" />
                    <div className="relative z-10 flex flex-col gap-space-lg">
                        <div className="flex w-fit flex-wrap items-center gap-space-sm">
                            <div className="inline-flex items-center gap-space-xs rounded-radius-full bg-white/10 px-space-md py-[6px] text-xs font-semibold uppercase tracking-wide">
                                Inspired by tutorialsPoint toolkits
                            </div>
                            <div className="inline-flex items-center gap-space-xs rounded-radius-full bg-white/15 px-space-md py-[6px] text-xs font-semibold uppercase tracking-wide">
                                Upgraded UI &amp; UX workspace
                            </div>
                        </div>
                        <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold leading-tight">
                            Developer tools and utilities in one hub
                        </h1>
                        <p className="max-w-2xl text-base sm:text-lg text-white/80">
                            Explore quick utilities, interactive coding sandboxes, and productivity boosters that mirror the rich toolset found on tutorialsPoint—now deeply integrated into ScientistShield.
                        </p>
                        <div className="flex flex-wrap gap-space-sm">
                            <Button as={Link} to="/tryit" color="light" className="text-gray-900">
                                Launch Playground
                            </Button>
                        </div>
                        <div className="grid gap-space-md sm:grid-cols-3 text-sm">
                            <div className="rounded-radius-md bg-white/10 p-space-md">
                                <p className="text-xs uppercase tracking-wide text-white/70">Interactive utilities</p>
                                <p className="mt-1 text-xl font-semibold">{workspaceTools.length} built-in</p>
                            </div>
                            <div className="rounded-radius-md bg-white/10 p-space-md">
                                <p className="text-xs uppercase tracking-wide text-white/70">Resource directory</p>
                                <p className="mt-1 text-xl font-semibold">{resourceTools.length} curated</p>
                            </div>
                            <div className="rounded-radius-md bg-white/10 p-space-md">
                                <p className="text-xs uppercase tracking-wide text-white/70">Focus workflows</p>
                                <p className="mt-1 text-xl font-semibold">Practice • Learn • Build</p>
                            </div>
                        </div>
                    </div>
                </section>

                <section className="space-y-space-xl">
                    <div className="flex flex-col gap-space-md lg:flex-row lg:items-end lg:justify-between">
                        <div className="space-y-space-sm">
                            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">Interactive workbench</h2>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                                Open each utility in its own workspace for a focused experience.
                            </p>
                        </div>
                        {recentWorkspaceTools.length > 0 && (
                            <div className="flex flex-wrap items-center gap-space-xs">
                                <span className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                                    Recent tools
                                </span>
                                {recentWorkspaceTools.map((id) => {
                                    const recentTool = workspaceTools.find((tool) => tool.id === id);
                                    if (!recentTool) return null;
                                    return (
                                        <Link
                                            key={id}
                                            to={`/tools/${id}`}
                                            className="rounded-radius-full bg-white px-space-sm py-[6px] text-xs font-medium text-cyan-700 shadow-sm hover:bg-cyan-50 dark:bg-slate-950 dark:text-cyan-200 dark:hover:bg-cyan-900/40"
                                        >
                                            {recentTool.name}
                                        </Link>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                    <motion.div
                        className="grid grid-cols-1 gap-space-lg sm:grid-cols-2 xl:grid-cols-3"
                        initial="initial"
                        animate="animate"
                        variants={{ animate: { transition: { staggerChildren: 0.05 } } }}
                    >
                        {workspaceTools.map((tool) => (
                            <WorkspaceCard key={tool.id} tool={tool} />
                        ))}
                    </motion.div>
                </section>

                <section className="space-y-space-xl">
                    <div className="flex flex-col gap-space-md lg:flex-row lg:items-end lg:justify-between">
                        <div>
                            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">Explore more tools</h2>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                                Filter by category or search to jump into a specific workflow.
                            </p>
                        </div>
                        <div className="flex w-full flex-col gap-space-sm sm:flex-row sm:items-center sm:justify-end">
                            <TextInput
                                icon={FaSearch}
                                value={searchTerm}
                                onChange={(event) => setSearchTerm(event.target.value)}
                                placeholder="Search tools"
                                aria-label="Search tools"
                                type="search"
                            />
                        </div>
                    </div>
                    <div className="flex flex-wrap gap-space-sm">
                        {toolCategories.map((cat) => {
                            const isActive = category === cat;
                            return (
                                <button
                                    type="button"
                                    key={cat}
                                    onClick={() => setCategory(cat)}
                                    className={`rounded-radius-full border px-space-md py-[6px] text-sm transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-offset-slate-950 ${
                                        isActive
                                            ? 'border-transparent bg-cyan-600 text-white shadow'
                                            : 'border-gray-200 text-gray-600 hover:border-cyan-400/60 hover:text-cyan-700 dark:border-gray-700 dark:text-gray-300 dark:hover:text-cyan-200'
                                    }`}
                                    aria-pressed={isActive}
                                >
                                    {cat === 'all' ? 'All tools' : cat}
                                </button>
                            );
                        })}
                    </div>
                    <motion.div
                        className="grid grid-cols-1 gap-space-lg sm:grid-cols-2 xl:grid-cols-3"
                        initial="initial"
                        animate="animate"
                        variants={{ animate: { transition: { staggerChildren: 0.05 } } }}
                    >
                        {filteredTools.map((tool) => (
                            <ResourceCard key={tool.id} tool={tool} />
                        ))}
                    </motion.div>
                    {filteredTools.length === 0 && (
                        <div className="flex flex-col items-center gap-space-sm rounded-radius-lg border border-dashed border-gray-300 p-space-2xl text-center dark:border-gray-700">
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                                No tools match that search yet. Try a different keyword or category.
                            </p>
                            <Button
                                color="light"
                                onClick={() => {
                                    setSearchTerm('');
                                    setCategory('all');
                                }}
                                className="w-fit"
                            >
                                Reset filters
                            </Button>
                        </div>
                    )}
                    <div className="flex flex-col gap-space-sm rounded-radius-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-slate-900 p-space-xl shadow-inner">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Need a tool we missed?</h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                            We are continuously growing this hub. Share the utilities you rely on and we will bring them into the ScientistShield experience.
                        </p>
                        <Button as={Link} to="/search?searchTerm=tool%20request" color="light" className="w-fit">
                            Request a tool <FaExternalLinkAlt className="ml-2" />
                        </Button>
                    </div>
                </section>
            </div>
        </div>
    );
}
