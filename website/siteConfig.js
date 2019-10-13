const users = [
  {
    caption: 'Magicline',
    image: '/img/magicline.svg',
    infoLink: 'https://www.magicline.com',
    pinned: true
  }
];

const repoUrl = 'https://github.com/KnisterPeter/tsdi';

const siteConfig = {
  title: 'TSDI',
  tagline: 'Easy dependency injection for TypeScript.',
  url: 'https://tsdi.js.org',
  baseUrl: '/',
  repoUrl,
  cname: 'tsdi.js.org',
  noIndex: false,

  projectName: 'tsdi',
  organizationName: 'KnisterPeter',

  headerLinks: [
    { doc: 'getting-started', label: 'Docs' },
    { doc: 'api-tsdi', label: 'API' },
    // {page: 'help', label: 'Help'},
    // {blog: true, label: 'Blog'},
    { href: repoUrl, label: 'GitHub' }
  ],

  users,

  // logo from http://sweetclipart.com/four-puzzle-pieces-coloring-1019
  headerIcon: 'img/puzzle.png',
  footerIcon: 'img/puzzle.png',
  favicon: 'img/puzzle.png',

  colors: {
    primaryColor: '#4b60b8',
    secondaryColor: '#7883b4'
  },

  copyright: `Copyright © ${new Date().getFullYear()} Markus Wolf`,

  highlight: {
    theme: 'default'
  },

  scripts: ['https://buttons.github.io/buttons.js'],

  onPageNav: 'separate',

  ogImage: 'img/puzzle.png',
  twitterImage: 'img/puzzle.png'
};

module.exports = siteConfig;
