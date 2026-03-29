import { useEffect, useMemo, useState } from 'react';
import Particles, { initParticlesEngine } from '@tsparticles/react';
import { loadSlim } from '@tsparticles/slim';
import { useMediaQuery } from 'react-responsive';

export default function ParticlesBackground() {
    const [init, setInit] = useState(false);
    const isMobile = useMediaQuery({ query: '(max-width: 768px)' });

    useEffect(() => {
        initParticlesEngine(async (engine) => {
            await loadSlim(engine);
        }).then(() => {
            setInit(true);
        });
    }, []);

    const options = useMemo(
        () => ({
            background: {
                color: {
                    value: 'transparent',
                },
            },
            fpsLimit: isMobile ? 60 : 120,
            interactivity: {
                events: {
                    onHover: {
                        enable: !isMobile,
                        mode: 'grab', // Change to grab for a more sci-fi feel
                        parallax: {
                            enable: true,
                            force: 60,
                            smooth: 10,
                        },
                    },
                    onClick: {
                        enable: true,
                        mode: 'push',
                    },
                    resize: true,
                },
                modes: {
                    grab: {
                        distance: 200,
                        links: {
                            opacity: 0.8,
                            color: '#3b82f6',
                        },
                    },
                    push: {
                        quantity: isMobile ? 2 : 4,
                    },
                    repulse: {
                        distance: 120,
                        duration: 0.4,
                    },
                },
            },
            particles: {
                color: {
                    value: ['#d1d1d1', '#a0aec0', '#718096'],
                },
                links: {
                    color: {
                        value: '#d1d1d1',
                    },
                    distance: 180,
                    enable: true,
                    opacity: 0.35,
                    width: 1,
                    triangles: {
                        enable: true,
                        color: {
                            value: '#cbd5e0',
                        },
                        opacity: 0.05,
                    },
                },
                move: {
                    direction: "none",
                    enable: true,
                    outModes: {
                        default: "bounce",
                    },
                    random: true,
                    speed: 0.8,
                    straight: false,
                    attract: {
                        enable: true,
                        rotateX: 600,
                        rotateY: 1200,
                    },
                    gravity: {
                        enable: false,
                    },
                    vibrate: false,
                    warp: false,
                },
                number: {
                    density: {
                        enable: true,
                        area: 1000,
                    },
                    value: isMobile ? 30 : 60,
                },
                opacity: {
                    value: { min: 0.1, max: 0.5 },
                    animation: {
                        enable: true,
                        speed: 0.8,
                        minimumValue: 0.1,
                        sync: false,
                    },
                },
                shape: {
                    type: ["circle", "star", "polygon"],
                    options: {
                        polygon: {
                            sides: 5,
                        },
                    },
                },
                size: {
                    value: { min: 0.5, max: 2 },
                    animation: {
                        enable: true,
                        speed: 1.5,
                        minimumValue: 0.5,
                        sync: false,
                    },
                },
                twinkle: {
                    particles: {
                        enable: true,
                        frequency: 0.05,
                        opacity: 1,
                        color: {
                            value: '#FFFFFF',
                        },
                    },
                },
            },
            detectRetina: true,
        }),
        [isMobile],
    );

    if (init) {
        return (
            <Particles
                id="tsparticles"
                options={options}
                className="absolute left-0 top-0 z-0 h-full w-full pointer-events-none"
            />
        );
    }

    return null;
}
