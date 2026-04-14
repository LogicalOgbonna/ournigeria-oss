module.exports = {
  ci: {
    collect: {
      // startServerCommand: 'pnpm start -p 3004',
      url: ['http://localhost:3004/dashboard'],
      numberOfRuns: 1,
      puppeteerScript: './puppeteer-script.js',
    },
    upload: {
      target: 'temporary-public-storage',
    },
  },
};