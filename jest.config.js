module.exports = {
  moduleFileExtensions: ['js', 'json', 'ts'],
  rootDir: '.',
  testRegex: '.*\\.spec\\.ts$',
  transform: {
    '^.+\\.(t|j)s$': [
      'ts-jest',
      {
        tsconfig: '<rootDir>/apps/server/tsconfig.json',
      },
    ],
  },
  collectCoverageFrom: [
    'apps/server/**/*.(t|j)s',
    '!apps/server/**/*.module.ts',
    '!apps/server/main.ts',
    '!apps/server/**/*.dto.ts',
    '!apps/server/**/*.interface.ts',
  ],
  coverageDirectory: './coverage',
  testEnvironment: 'node',
  roots: ['<rootDir>/apps/server'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/apps/server/$1',
  },
  testPathIgnorePatterns: ['/node_modules/', '/dist/'],
  maxWorkers: 1,
  reporters: [
    "default",
    ["<rootDir>/jest-reporters/dual-stream-reporter.js", {
      logsPath: "test-artifacts/logs.txt",
      errorsPath: "test-artifacts/errors.txt",
      stdoutPath: "test-artifacts/stdout.txt",
      stderrPath: "test-artifacts/stderr.txt"
    }]
  ],
};
