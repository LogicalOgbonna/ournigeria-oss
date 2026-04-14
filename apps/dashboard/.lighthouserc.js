module.exports = {
  ci: {
    collect: {
      startServerCommand: 'pnpm start -p 3004',
      url: ['http://localhost:3004/login'],
      numberOfRuns: 1,
    },
    upload: {
      target: 'temporary-public-storage',
    },
  },
};
