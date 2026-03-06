// client/src/components/ui/Card.jsx
import { forwardRef } from 'react';
import { motion } from 'framer-motion';
import PropTypes from 'prop-types';

const Card = forwardRef(({ children, className }, ref) => (
    <motion.div
        ref={ref}
        className={`liquid-hybrid-tile lg-glass relative overflow-hidden rounded-[22px] p-6 shadow-lg ${className}`}
        whileHover={{ scale: 1.015, y: -6, transition: { duration: 0.24 } }}
        whileTap={{ scale: 0.995 }}
    >
        <span
            aria-hidden
            className="pointer-events-none absolute inset-0 bg-[radial-gradient(120%_85%_at_12%_0%,rgba(255,255,255,0.35),transparent_56%)]"
        />
        <div className="relative z-10">{children}</div>
    </motion.div>
));

Card.propTypes = {
    children: PropTypes.node,
    className: PropTypes.string,
};

Card.defaultProps = {
    children: null,
    className: '',
};

export default Card;
