import { Link } from 'react-router-dom';
import { Button } from 'flowbite-react';
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion';
import { useState, useRef } from 'react';
import { HiArrowRight } from 'react-icons/hi2';
import {
    SiHtml5,
    SiCss3,
    SiJavascript,
    SiPython,
    SiCplusplus,
    SiOpenjdk,
    SiC,
    SiCsharp,
    SiGo,
    SiSqlite,
    SiDelphi,
    SiVisualstudio,
    SiReact,
    SiNodedotjs,
} from 'react-icons/si';

const itemVariants = {
    hidden: { y: 50, opacity: 0 },
    visible: {
        y: 0,
        opacity: 1,
        transition: {
            type: "spring",
            stiffness: 100,
        },
    },
};

// Map technology titles to react-icons/si icon names (strings).
// Using string indirection avoids Rollup warnings for non-existent exports.
const iconMap = {
    HTML: SiHtml5,
    CSS: SiCss3,
    'JavaScript': SiJavascript,
    Python: SiPython,
    'C++': SiCplusplus,
    Java: SiOpenjdk,
    C: SiC,
    'C#': SiCsharp,
    Go: SiGo,
    SQL: SiSqlite,
    'Delphi/Object Pascal': SiDelphi,
    'Visual Basic': SiVisualstudio,
    'React.js': SiReact,
    'Node.js': SiNodedotjs,
};

const CategoryCard = ({ title, description, linkTo, gradient }) => {
    const cardRef = useRef(null);
    const mouseX = useMotionValue(0.5);
    const mouseY = useMotionValue(0.5);
    const [isHovering, setIsHovering] = useState(false);

    const Icon = iconMap[title];

    const handleMouseMove = (e) => {
        if (!cardRef.current) return;
        const { clientX, clientY } = e;
        const { top, left, width, height } = cardRef.current.getBoundingClientRect();
        mouseX.set((clientX - left) / width);
        mouseY.set((clientY - top) / height);
    };

    const rotateX = useSpring(useTransform(mouseY, [0, 1], [-8, 8]), { stiffness: 250, damping: 15 });
    const rotateY = useSpring(useTransform(mouseX, [0, 1], [8, -8]), { stiffness: 250, damping: 15 });
    const scale = useSpring(isHovering ? 1.05 : 1, { stiffness: 300, damping: 10 });
    const shadowOpacity = useSpring(isHovering ? 0.4 : 0.1, { stiffness: 300, damping: 10 });

    return (
        <Link to={linkTo} className="block w-full h-full">
            <motion.div
                ref={cardRef}
                className="macos-sequoia-card macos-liquid-card h-full text-left"
                variants={itemVariants}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, amount: 0.3 }}
                onMouseEnter={() => setIsHovering(true)}
                onMouseLeave={() => setIsHovering(false)}
                onMouseMove={handleMouseMove}
                style={{
                    rotateX,
                    rotateY,
                    scale,
                    '--card-tilt-shadow': useTransform(shadowOpacity, (o) => `0 32px 90px -64px rgba(15,23,42,${o})`),
                    perspective: 1000
                }}
            >
                <div className={`macos-sequoia-card__halo macos-liquid-card__halo ${gradient}`} aria-hidden />
                <span className="macos-sequoia-card__shine macos-liquid-card__shine" aria-hidden />

                <div className="macos-sequoia-card__header">
                    <span className="macos-sequoia-card__badge">
                        <span className="macos-sequoia-card__dot" aria-hidden />
                        Liquid glass ready
                    </span>
                    <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-300">
                        {title}
                    </span>
                </div>

                <div className="flex flex-col gap-6">
                    <div className="flex items-center gap-4">
                        {Icon && (
                            <motion.div
                                className="macos-sequoia-card__icon macos-liquid-card__icon"
                                initial={{ opacity: 0, y: -12 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.35, delay: 0.15 }}
                                whileHover={{ rotate: 4, scale: 1.04 }}
                            >
                                <Icon size={32} aria-hidden />
                            </motion.div>
                        )}
                        <div className="space-y-2">
                            <h2 className="text-2xl font-bold text-slate-900 dark:text-white">{title}</h2>
                            <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">{description}</p>
                        </div>
                    </div>

                    <div className="macos-sequoia-card__footer">
                        <span className="macos-sequoia-card__footnote">Liquid glass surface</span>
                        <Button pill className="btn-aqua macos-sequoia-card__button">
                            Open space
                            <HiArrowRight className="ml-2" />
                        </Button>
                    </div>
                </div>
            </motion.div>
        </Link>
    );
};

export default CategoryCard;
