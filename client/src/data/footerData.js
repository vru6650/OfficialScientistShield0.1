import { BsFacebook, BsInstagram, BsTwitter, BsGithub, BsDribbble } from 'react-icons/bs';

export const footerLinks = [
    {
        title: 'Platform',
        links: [
            { name: 'Home', href: '/' },
            { name: 'Tutorials', href: '/tutorials' },
            { name: 'Problem Solving Hub', href: '/problems' },
        ],
    },
    {
        title: 'Explore',
        links: [
            { name: 'Projects', href: '/projects' },
            { name: 'Quizzes', href: '/quizzes' },
            { name: 'About ScientistShield', href: '/about' },
        ],
    },
    {
        title: 'Community',
        links: [
            { name: 'Github', href: 'https://github.com/sahandghavidel' },
            { name: 'Search articles', href: '/search' },
        ],
    },
    {
        title: 'Legal',
        links: [
            { name: 'Privacy', href: '/content/privacy-policy' },
            { name: 'Terms', href: '/content/terms-and-conditions' },
        ],
    },
];

export const socialMediaLinks = [
    { name: 'Facebook', href: 'https://www.facebook.com', icon: BsFacebook },
    { name: 'Instagram', href: 'https://www.instagram.com', icon: BsInstagram },
    { name: 'Twitter', href: 'https://www.twitter.com', icon: BsTwitter },
    { name: 'Github', href: 'https://github.com/sahandghavidel', icon: BsGithub },
    { name: 'Dribbble', href: 'https://dribbble.com', icon: BsDribbble },
];
