module.exports = {
  mergeStrategy: {
    toSameBranch: ['master', 'release/0.20']
  },
  getStagingBranchName: ({ nextVersion }) => `release-v${nextVersion}`
};
