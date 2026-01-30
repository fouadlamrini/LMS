import type { Config } from 'jest';
import { pathsToModuleNameMapper } from 'ts-jest';
import { compilerOptions } from './tsconfig.json';

const config: Config = {
  preset: 'ts-jest',
  testEnvironment: 'jsdom', // pour React

  setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'],

  moduleNameMapper: {
    // pour les fichiers CSS
    '\\.(css|scss|sass)$': 'identity-obj-proxy',

    // pour les alias TypeScript
    ...pathsToModuleNameMapper(compilerOptions.paths || {}, {
      prefix: '<rootDir>/',
    }),
  },

  testPathIgnorePatterns: ['/node_modules/', '/.next/'],
};

export default config;
