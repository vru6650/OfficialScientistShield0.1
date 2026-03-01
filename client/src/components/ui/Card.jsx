// client/src/components/ui/Card.jsx
import { forwardRef } from 'react';
import { motion } from 'framer-motion';
import PropTypes from 'prop-types';

const Card = forwardRef(({ children, className }, ref) => (
    <motion.div
        ref={ref}
        className={`glass-effect rounded-lg p-6 shadow-lg ${className}`}
        whileHover={{ scale: 1.05, rotateY: 10, transition: { duration: 0.3 } }}
    >
        {children}
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
