import chalk from 'chalk';
import cpy from 'cpy';
import fs from 'fs';
import gradient from 'gradient-string';
import os from 'os';
import path from 'path';

import { PackageManager } from '../src/helpers/get-pkg-manager';
import { install } from '../src/helpers/install';

export type TemplateType = 'default';
export type TemplateMode = 'js' | 'ts';

interface InstallTemplateArgs {
  appName: string;
  root: string;
  template: TemplateType;
  packageManager: PackageManager;
  isOnline: boolean;
  mode: TemplateMode;
}

export const logGradient = gradient('#fe8dc6', '#fed1c7');

export const SRC_DIR_NAMES = ['app', 'pages', 'styles'];

/**
 * Install a Next.js internal template to a given `root` directory.
 */
export const installTemplate = async ({
  appName,
  root,
  packageManager,
  isOnline,
  template,
  mode,
}: InstallTemplateArgs) => {
  console.log(chalk.bold(`Using ${packageManager}.`));

  /**
   * Copy the template files to the target directory.
   */
  console.log(
    chalk.bold(
      logGradient(
        '\n>>> 🎬 Initializing project with React template powered by Vite. \n'
      )
    )
  );
  console.log(`${logGradient('📍 At')} ${root}`);

  const templatePath = path.join(__dirname, template, mode);
  //Starting with dot_
  const regex = /^dot_/;
  await cpy('**', root, {
    parents: true,
    cwd: templatePath,
    rename: (name) => {
      if (regex.test(name)) {
        //Replacing files starting with dot_filename with .filename
        return '.' + name.slice(4);
      } else if (name === 'README-template.md') {
        // README.md is ignored by webpack-asset-relocator-loader used by ncc:
        // https://github.com/vercel/webpack-asset-relocator-loader/blob/e9308683d47ff507253e37c9bcbb99474603192b/src/asset-relocator.js#L227
        return 'README.md';
      }
      return name;
    },
  });

  /**
   * Create a package.json for the new project.
   */
  const packageJson = {
    name: appName,
    version: '1.0.0',
    private: true,
    description:
      'A no build configuration project created using bootstrap-react-app.',
    contributors: [
      { name: 'Abhishek Agrawal', email: 'abhi2703agrawal@gmail.com' },
    ],
    scripts: {
      start: 'vite',
      'start:dev': 'vite --mode dev',
      'start:qa': 'vite --mode qa',
      'start:stage': 'vite --mode staging',
      build: 'tsc && vite build',
      'build:dev': 'tsc && vite build --mode dev',
      'build:qa': 'tsc && vite build --mode qa',
      'build:stage': 'tsc && vite build --mode staging',
      serve: 'vite preview',
      prepare: 'husky install',
      postinstall: 'sh scripts/env-files.sh',
      test: 'vitest',
      'test:coverage': 'vitest run --coverage',
      lint: 'eslint "src/**/*.{js,jsx,ts,tsx,json}"',
      'lint:fix': 'eslint "src/**/*.{js,jsx,ts,tsx,json}" --fix',
      format:
        "prettier --write 'src/**/*.{js,jsx,ts,tsx,css,md,json}' --config ./.prettierrc",
      cleanup: 'rm -rf node_modules dist && yarn install --frozen-lockfile',
      'bumpversion:major': 'yarn version --no-git-tag-version --major',
      'bumpversion:minor': 'yarn version --no-git-tag-version --minor',
      'bumpversion:patch': 'yarn version --no-git-tag-version --patch',
    },
  };
  /**
   * Write it to disk.
   */
  fs.writeFileSync(
    path.join(root, 'package.json'),
    JSON.stringify(packageJson, null, 2) + os.EOL //end-of-line character or marker as specified by the operating system
  );

  // Renaming folder husky to .husky
  fs.renameSync(`${root}/husky`, `${root}/.husky`);

  /**
   * These flags will be passed to `install()`, which calls the package manager
   * install process.
   */
  const installFlags = { packageManager, isOnline };
  /**
   * Default dependencies.
   */
  const dependencies = [
    'react@^18.2.0',
    'react-dom@^18.2.0',
    'react-router-dom@^6.8.1',
    'web-vitals@^3.1.1',
    'axios@^0.27.2',
    '@emotion/react@^11.10.6',
    '@emotion/styled@^11.10.6',
    '@mui/icons-material@^5.11.9',
    '@mui/material@^5.11.10',
    '@tanstack/react-query@^4.24.9',
    '@tanstack/react-query-devtools@^4.24.9',
    '@testing-library/jest-dom@^5.16.5',
    '@testing-library/react@^14.0.0',
    '@testing-library/user-event@^14.4.3',
  ];
  /**
   * TypeScript projects will have type definitions and other Dependencies.
   */
  if (mode === 'ts') {
    dependencies.push(
      'typescript@^4.9.5',
      '@types/jest@^29.4.0',
      '@types/react@^18.0.0',
      '@types/node@^18.0.28',
      '@types/react-dom@^18.0.0'
    );
  }

  /**
   * Default dependencies.
   */
  const devDependencies = [
    '@commitlint/cli@^17.4.4',
    '@commitlint/config-conventional@^17.4.4',
    '@tanstack/eslint-plugin-query@^4.24.8',
    '@vitejs/plugin-react@^3.1.0',
    '@vitest/coverage-c8@^0.28.5',
    'eslint@^8.34.0',
    'eslint-config-prettier@^8.6.0',
    'eslint-import-resolver-typescript@^3.5.3',
    'eslint-plugin-import@^2.27.5',
    'eslint-plugin-jsx-a11y@^6.7.1',
    'eslint-plugin-prettier@^4.2.1',
    'eslint-plugin-react@^7.32.2',
    'eslint-plugin-react-hooks@^4.6.0',
    'eslint-plugin-simple-import-sort@^10.0.0',
    'husky@^8.0.3',
    'jsdom@^21.1.0',
    'prettier@^2.8.4',
    'vite@^4.1.3',
    'vite-plugin-svgr@^2.4.0',
    'vite-tsconfig-paths@^4.0.5',
    'vitest@^0.28.5',
  ];

  /**
   * TypeScript projects will have type definitions and other devDependencies.
   */
  if (mode === 'ts') {
    devDependencies.push(
      '@typescript-eslint/eslint-plugin@^5.53.0',
      '@typescript-eslint/parser@^5.53.0'
    );
  }

  /**
   * Install package.json dependencies if they exist.
   */
  if (dependencies.length) {
    console.log();
    console.log(logGradient('⏳ Installing dependencies:'));
    await install(root, dependencies, installFlags);
  }
  /**
   * Install package.json dev dependencies if they exist.
   */
  if (devDependencies.length) {
    console.log();
    console.log(logGradient('⏳ Installing dev dependencies:'));
    await install(root, devDependencies, {
      ...installFlags,
      devDependencies: true,
    });
  }
};
