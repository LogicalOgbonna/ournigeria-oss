module.exports = {
  ci: {
    collect: {
      startServerCommand: 'pnpm start -p 3001',
      url: ['http://localhost:3001'],
      numberOfRuns: 3,
      isSinglePageApplication: true
    },
    upload: {
      target: 'temporary-public-storage',
    },
  },
};
