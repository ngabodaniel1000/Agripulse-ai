import type { Config } from "jest";

const config: Config = {
  testEnvironment: "jsdom",
  setupFilesAfterEnv: ["<rootDir>/src/test/setup.ts"],
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
    // Mock static assets (must precede the @/ alias mapper)
    "\\.(jpg|jpeg|png|gif|svg|ico|webp)$": "<rootDir>/src/test/__mocks__/fileMock.js",
    "\\.json$": "<rootDir>/src/test/__mocks__/jsonMock.js",
    "^jspdf$": "<rootDir>/src/test/__mocks__/jspdfMock.js",
    "^recharts$": "<rootDir>/src/test/__mocks__/rechartsMock.js",
    "^@/app/(.*)$": "<rootDir>/app/$1",
    "^@/(.*)$": "<rootDir>/src/$1",
  },
  testMatch: ["<rootDir>/src/**/*.{test,spec}.{ts,tsx}"],
  passWithNoTests: true,
};

export default config;
