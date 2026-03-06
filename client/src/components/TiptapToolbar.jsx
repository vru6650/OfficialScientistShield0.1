import React, { useCallback } from 'react';
import {
    FaBold, FaItalic, FaStrikethrough, FaListUl, FaListOl, FaQuoteLeft,
    FaCode, FaLink, FaImage, FaYoutube, FaTable, FaSubscript, FaSuperscript,
    FaHighlighter, FaTasks, FaAlignLeft, FaAlignCenter, FaAlignRight, FaAlignJustify,
    FaUndo, FaRedo, FaEraser, FaMinus, FaLaptopCode, FaPalette,
} from 'react-icons/fa';
import {
    LuHeading1, LuHeading2, LuHeading3,
} from 'react-icons/lu';
import { Button, Tooltip } from 'flowbite-react';
import { motion } from 'framer-motion';

const TiptapToolbar = ({ editor, onAddImage, isUploading, onAddYoutubeVideo, onAddCodeSnippet }) => {
    const setLink = useCallback(() => {
        if (!editor) return;
        const previousUrl = editor.getAttributes('link').href;
        const url = window.prompt('URL', previousUrl);
        if (url === null) return;
        if (url === '') {
            editor.chain().focus().extendMarkRange('link').unsetLink().run();
            return;
        }
        editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
    }, [editor]);

    const setTextColor = (color) => {
        if (!editor) return;
        editor.chain().focus().setColor(color).run();
    };

    const isTableActive = editor?.isActive('table');

    if (!editor) {
        return null;
    }

    const MotionButton = motion(Button);

    return (
        <div className="tiptap-toolbar flex flex-wrap items-center gap-2 p-3 border-b-2 border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 rounded-t-lg">
            <Button.Group>
                <Tooltip content="Undo">
                    <MotionButton onClick={() => editor.chain().focus().undo().run()} disabled={!editor.can().undo()} whileTap={{ scale: 0.95 }} size="sm" outline>
                        <FaUndo />
                    </MotionButton>
                </Tooltip>
                <Tooltip content="Redo">
                    <MotionButton onClick={() => editor.chain().focus().redo().run()} disabled={!editor.can().redo()} whileTap={{ scale: 0.95 }} size="sm" outline>
                        <FaRedo />
                    </MotionButton>
                </Tooltip>
            </Button.Group>

            <Button.Group>
                <Tooltip content="Bold">
                    <MotionButton onClick={() => editor.chain().focus().toggleBold().run()} className={editor.isActive('bold') ? 'is-active' : ''} whileTap={{ scale: 0.95 }} size="sm" outline>
                        <FaBold />
                    </MotionButton>
                </Tooltip>
                <Tooltip content="Italic">
                    <MotionButton onClick={() => editor.chain().focus().toggleItalic().run()} className={editor.isActive('italic') ? 'is-active' : ''} whileTap={{ scale: 0.95 }} size="sm" outline>
                        <FaItalic />
                    </MotionButton>
                </Tooltip>
                <Tooltip content="Strikethrough">
                    <MotionButton onClick={() => editor.chain().focus().toggleStrike().run()} className={editor.isActive('strike') ? 'is-active' : ''} whileTap={{ scale: 0.95 }} size="sm" outline>
                        <FaStrikethrough />
                    </MotionButton>
                </Tooltip>
                <Tooltip content="Highlight">
                    <MotionButton onClick={() => editor.chain().focus().toggleHighlight().run()} className={editor.isActive('highlight') ? 'is-active' : ''} whileTap={{ scale: 0.95 }} size="sm" outline>
                        <FaHighlighter />
                    </MotionButton>
                </Tooltip>
            </Button.Group>

            <Button.Group>
                <Tooltip content="Subscript">
                    <MotionButton onClick={() => editor.chain().focus().toggleSubscript().run()} className={editor.isActive('subscript') ? 'is-active' : ''} whileTap={{ scale: 0.95 }} size="sm" outline>
                        <FaSubscript />
                    </MotionButton>
                </Tooltip>
                <Tooltip content="Superscript">
                    <MotionButton onClick={() => editor.chain().focus().toggleSuperscript().run()} className={editor.isActive('superscript') ? 'is-active' : ''} whileTap={{ scale: 0.95 }} size="sm" outline>
                        <FaSuperscript />
                    </MotionButton>
                </Tooltip>
                <Tooltip content="Clear Formatting">
                    <MotionButton onClick={() => editor.chain().focus().unsetAllMarks().run()} whileTap={{ scale: 0.95 }} size="sm" outline>
                        <FaEraser />
                    </MotionButton>
                </Tooltip>
            </Button.Group>

            <div className="relative flex items-center">
                <Tooltip content="Text Color">
                    <MotionButton
                        size="sm"
                        color="gray"
                        className="p-1 h-fit"
                        whileTap={{ scale: 0.95 }}
                        outline
                    >
                        <FaPalette className="h-4 w-4" style={{ color: editor.getAttributes('textStyle').color || 'currentColor' }} />
                    </MotionButton>
                </Tooltip>
                <input
                    type="color"
                    className="absolute top-0 left-0 w-full h-full opacity-0 cursor-pointer"
                    onInput={(event) => setTextColor(event.target.value)}
                    value={editor.getAttributes('textStyle').color || '#000000'}
                />
            </div>

            <Tooltip content="Remove Color">
                <MotionButton
                    size="sm"
                    color="gray"
                    onClick={() => editor.chain().focus().unsetColor().run()}
                    whileTap={{ scale: 0.95 }}
                    outline
                >
                    <FaPalette className="h-4 w-4" />
                </MotionButton>
            </Tooltip>

            <Button.Group>
                <Tooltip content="H1">
                    <MotionButton onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()} className={editor.isActive('heading', { level: 1 }) ? 'is-active' : ''} whileTap={{ scale: 0.95 }} size="sm" outline>
                        <LuHeading1 />
                    </MotionButton>
                </Tooltip>
                <Tooltip content="H2">
                    <MotionButton onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} className={editor.isActive('heading', { level: 2 }) ? 'is-active' : ''} whileTap={{ scale: 0.95 }} size="sm" outline>
                        <LuHeading2 />
                    </MotionButton>
                </Tooltip>
                <Tooltip content="H3">
                    <MotionButton onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()} className={editor.isActive('heading', { level: 3 }) ? 'is-active' : ''} whileTap={{ scale: 0.95 }} size="sm" outline>
                        <LuHeading3 />
                    </MotionButton>
                </Tooltip>
            </Button.Group>

            <Button.Group>
                <Tooltip content="Align Left">
                    <MotionButton onClick={() => editor.chain().focus().setTextAlign('left').run()} className={editor.isActive({ textAlign: 'left' }) ? 'is-active' : ''} whileTap={{ scale: 0.95 }} size="sm" outline>
                        <FaAlignLeft />
                    </MotionButton>
                </Tooltip>
                <Tooltip content="Align Center">
                    <MotionButton onClick={() => editor.chain().focus().setTextAlign('center').run()} className={editor.isActive({ textAlign: 'center' }) ? 'is-active' : ''} whileTap={{ scale: 0.95 }} size="sm" outline>
                        <FaAlignCenter />
                    </MotionButton>
                </Tooltip>
                <Tooltip content="Align Right">
                    <MotionButton onClick={() => editor.chain().focus().setTextAlign('right').run()} className={editor.isActive({ textAlign: 'right' }) ? 'is-active' : ''} whileTap={{ scale: 0.95 }} size="sm" outline>
                        <FaAlignRight />
                    </MotionButton>
                </Tooltip>
                <Tooltip content="Align Justify">
                    <MotionButton onClick={() => editor.chain().focus().setTextAlign('justify').run()} className={editor.isActive({ textAlign: 'justify' }) ? 'is-active' : ''} whileTap={{ scale: 0.95 }} size="sm" outline>
                        <FaAlignJustify />
                    </MotionButton>
                </Tooltip>
            </Button.Group>

            <Button.Group>
                <Tooltip content="Bullet List">
                    <MotionButton onClick={() => editor.chain().focus().toggleBulletList().run()} className={editor.isActive('bulletList') ? 'is-active' : ''} whileTap={{ scale: 0.95 }} size="sm" outline>
                        <FaListUl />
                    </MotionButton>
                </Tooltip>
                <Tooltip content="Numbered List">
                    <MotionButton onClick={() => editor.chain().focus().toggleOrderedList().run()} className={editor.isActive('orderedList') ? 'is-active' : ''} whileTap={{ scale: 0.95 }} size="sm" outline>
                        <FaListOl />
                    </MotionButton>
                </Tooltip>
                <Tooltip content="Task List">
                    <MotionButton onClick={() => editor.chain().focus().toggleTaskList().run()} className={editor.isActive('taskList') ? 'is-active' : ''} whileTap={{ scale: 0.95 }} size="sm" outline>
                        <FaTasks />
                    </MotionButton>
                </Tooltip>
            </Button.Group>

            <Button.Group>
                <Tooltip content="Blockquote">
                    <MotionButton onClick={() => editor.chain().focus().toggleBlockquote().run()} className={editor.isActive('blockquote') ? 'is-active' : ''} whileTap={{ scale: 0.95 }} size="sm" outline>
                        <FaQuoteLeft />
                    </MotionButton>
                </Tooltip>
                <Tooltip content="Code Block">
                    <MotionButton onClick={() => editor.chain().focus().toggleCodeBlock().run()} className={editor.isActive('codeBlock') ? 'is-active' : ''} whileTap={{ scale: 0.95 }} size="sm" outline>
                        <FaCode />
                    </MotionButton>
                </Tooltip>
                <Tooltip content="Horizontal Rule">
                    <MotionButton onClick={() => editor.chain().focus().setHorizontalRule().run()} whileTap={{ scale: 0.95 }} size="sm" outline>
                        <FaMinus />
                    </MotionButton>
                </Tooltip>
            </Button.Group>

            <Button.Group>
                <Tooltip content="Add Link">
                    <MotionButton onClick={setLink} className={editor.isActive('link') ? 'is-active' : ''} whileTap={{ scale: 0.95 }} size="sm" outline>
                        <FaLink />
                    </MotionButton>
                </Tooltip>
                <Tooltip content="Unlink">
                    <MotionButton onClick={() => editor.chain().focus().unsetLink().run()} disabled={!editor.isActive('link')} whileTap={{ scale: 0.95 }} size="sm" outline>
                        <FaLink className='text-gray-400' />
                    </MotionButton>
                </Tooltip>
            </Button.Group>

            <Button.Group>
                <Tooltip content="Add Image">
                    <MotionButton onClick={onAddImage} disabled={isUploading} whileTap={{ scale: 0.95 }} size="sm" outline>
                        <FaImage />
                    </MotionButton>
                </Tooltip>
                <Tooltip content="Add YouTube Video">
                    <MotionButton onClick={onAddYoutubeVideo} whileTap={{ scale: 0.95 }} size="sm" outline>
                        <FaYoutube />
                    </MotionButton>
                </Tooltip>
                <Tooltip content="Add Interactive Code Snippet">
                    <MotionButton onClick={onAddCodeSnippet} whileTap={{ scale: 0.95 }} size="sm" outline>
                        <FaLaptopCode />
                    </MotionButton>
                </Tooltip>
            </Button.Group>

            {editor.isActive('table') && (
                <Button.Group>
                    <Tooltip content="Insert Table">
                        <MotionButton onClick={() => editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()} whileTap={{ scale: 0.95 }} size="sm" outline>
                            <FaTable />
                        </MotionButton>
                    </Tooltip>
                    <Tooltip content="Add Column Before">
                        <MotionButton onClick={() => editor.chain().focus().addColumnBefore().run()} whileTap={{ scale: 0.95 }} size="sm" outline>Col-</MotionButton>
                    </Tooltip>
                    <Tooltip content="Add Column After">
                        <MotionButton onClick={() => editor.chain().focus().addColumnAfter().run()} whileTap={{ scale: 0.95 }} size="sm" outline>Col+</MotionButton>
                    </Tooltip>
                    <Tooltip content="Delete Column">
                        <MotionButton onClick={() => editor.chain().focus().deleteColumn().run()} whileTap={{ scale: 0.95 }} size="sm" outline>Del Col</MotionButton>
                    </Tooltip>
                    <Tooltip content="Add Row Before">
                        <MotionButton onClick={() => editor.chain().focus().addRowBefore().run()} whileTap={{ scale: 0.95 }} size="sm" outline>Row-</MotionButton>
                    </Tooltip>
                    <Tooltip content="Add Row After">
                        <MotionButton onClick={() => editor.chain().focus().addRowAfter().run()} whileTap={{ scale: 0.95 }} size="sm" outline>Row+</MotionButton>
                    </Tooltip>
                    <Tooltip content="Delete Row">
                        <MotionButton onClick={() => editor.chain().focus().deleteRow().run()} whileTap={{ scale: 0.95 }} size="sm" outline>Del Row</MotionButton>
                    </Tooltip>
                    <Tooltip content="Merge/Split Cells">
                        <MotionButton onClick={() => editor.chain().focus().mergeOrSplit().run()} whileTap={{ scale: 0.95 }} size="sm" outline>Merge</MotionButton>
                    </Tooltip>
                    <Tooltip content="Delete Table">
                        <MotionButton onClick={() => editor.chain().focus().deleteTable().run()} whileTap={{ scale: 0.95 }} size="sm" outline>Del Table</MotionButton>
                    </Tooltip>
                </Button.Group>
            )}
            {!editor.isActive('table') && (
                <Tooltip content="Insert Table">
                    <MotionButton onClick={() => editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()} whileTap={{ scale: 0.95 }} size="sm" outline>
                        <FaTable />
                    </MotionButton>
                </Tooltip>
            )}
        </div>
    );
};

export default TiptapToolbar;
