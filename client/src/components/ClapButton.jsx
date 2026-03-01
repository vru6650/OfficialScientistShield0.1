// src/components/ClapButton.jsx
import { memo } from 'react';
import { Button } from 'flowbite-react';
import { HiOutlineHandThumbUp } from 'react-icons/hi2';
import PropTypes from 'prop-types';
import { useLike } from '../hooks/useLike';

const normalizeIds = (values) => {
    if (!Array.isArray(values)) {
        return [];
    }
    return values.map((value) => value?.toString()).filter(Boolean);
};

const arraysShallowEqual = (a, b) => {
    if (a === b) return true;
    if (a.length !== b.length) return false;
    for (let i = 0; i < a.length; i += 1) {
        if (a[i] !== b[i]) return false;
    }
    return true;
};

function ClapButton({ postId, initialClaps = 0, initialClappedBy = [] }) {
    const { likeCount, isLiked, isLoading, handleLike } = useLike({
        postId,
        initialClaps,
        initialClappedBy,
    });

    const clapLabel = likeCount === 1 ? '1 clap' : `${likeCount} claps`;

    if (!postId) {
        return null;
    }

    return (
        <div className="flex items-center gap-2">
            <Button
                type="button"
                outline
                gradientDuoTone="purpleToBlue"
                onClick={handleLike}
                disabled={isLoading}
                aria-pressed={isLiked}
                aria-label={isLiked ? 'Remove clap' : 'Clap this post'}
                className={`transition-all duration-200 ${isLiked ? 'ring-2 ring-cyan-500' : ''}`}
            >
                <HiOutlineHandThumbUp
                    className={`h-6 w-6 ${isLiked ? 'text-cyan-500' : ''}`}
                    aria-hidden="true"
                />
            </Button>
            <span className="text-gray-500 dark:text-gray-400" aria-live="polite">
                {clapLabel}
            </span>
        </div>
    );
}

ClapButton.propTypes = {
    postId: PropTypes.string,
    initialClaps: PropTypes.number,
    initialClappedBy: PropTypes.arrayOf(
        PropTypes.oneOfType([PropTypes.string, PropTypes.shape({})]),
    ),
};

ClapButton.defaultProps = {
    postId: null,
    initialClaps: 0,
    initialClappedBy: [],
};

const areEqual = (prevProps, nextProps) => {
    if (prevProps.postId !== nextProps.postId) return false;
    if (prevProps.initialClaps !== nextProps.initialClaps) return false;
    const prevIds = normalizeIds(prevProps.initialClappedBy);
    const nextIds = normalizeIds(nextProps.initialClappedBy);
    return arraysShallowEqual(prevIds, nextIds);
};

export default memo(ClapButton, areEqual);
