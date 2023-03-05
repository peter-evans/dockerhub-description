module.exports = {
  clearMocks: true,
  moduleFileExtensions: ['js', 'ts'],
  testEnvironment: 'node',
  testMatch: ['**/*.test.ts'],
  testRunner: 'jest-circus/runner',
  transform: {
    '^.+\\.ts$': 'ts-jest'
  },
  verbose: true
}
process.env = Object.assign(process.env, {
  GITHUB_SERVER_URL: 'https://github.com',
  GITHUB_REPOSITORY: 'peter-evans/dockerhub-description',
  GITHUB_REF_NAME: 'main'
})