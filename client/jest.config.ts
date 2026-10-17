import type { Config } from "jest";

const config: Config = {
  testEnvironment: "jsdom",
  setupFilesAfterFramework: ["<rootDir>/src/test/setup.ts"],
  transform: {
    "^.+\\.(ts|tsx)$": [
      "ts-jest",
      {
        tsconfig: {
          jsx: "react-jsx",
        },
      },
    ],
  },
  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/src/$1",
    // Mock static assets
    "\\.(jpg|jpeg|png|gif|svg|ico|webp)$": "<rootDir>/src/test/__mocks__/fileMock.js",
    "\\.json$": "<rootDir>/src/test/__mocks__/jsonMock.js",
  },
  testMatch: ["<rootDir>/src/**/*.{test,spec}.{ts,tsx}"],
  passWithNoTests: true,
};

export default config;
