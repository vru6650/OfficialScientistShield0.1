import PropTypes from 'prop-types';
import { Badge } from 'flowbite-react';

const badgeMap = {
    community: { color: 'info', label: 'Community' },
    'show-and-tell': { color: 'purple', label: 'Show & Tell' },
    help: { color: 'warning', label: 'Help' },
    tips: { color: 'success', label: 'Tips' },
};

export default function CommunityPostBadge({ category, kind }) {
    if (kind !== 'community') return null;
    const meta = badgeMap[category] || { color: 'info', label: 'Community' };
    return (
        <Badge color={meta.color} className='text-xs font-semibold'>
            {meta.label}
        </Badge>
    );
}

CommunityPostBadge.propTypes = {
    category: PropTypes.string,
    kind: PropTypes.string,
};
