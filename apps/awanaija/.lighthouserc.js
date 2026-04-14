module.exports = {
  ci: {
    collect: {
      startServerCommand: 'pnpm start -p 3003',
      url: ['http://localhost:3003'],
      numberOfRuns: 3,
    },
    upload: {
      target: 'temporary-public-storage',
    },
  },
};
