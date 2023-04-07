#!/usr/bin/env node
import chalk from 'chalk';
import Commander from 'commander';
import fs from 'fs';
import path from 'path';
import prompts from 'prompts';
import checkForUpdate from 'update-check';

import packageJson from '../package.json';
import { createApp } from './create-app';
import { getPkgManager } from './helpers/get-pkg-manager';
import { isFolderEmpty } from './helpers/is-folder-empty';
import { validateNpmName } from './helpers/validate-pkg';

let projectPath: string = '';

const handleSigTerm = () => process.exit(0);

process.on('SIGINT', handleSigTerm);
process.on('SIGTERM', handleSigTerm);

const onPromptState = (state: any) => {
  if (state.aborted) {
    /** If we don't re-enable the terminal cursor
     * before exiting the program, the cursor will remain hidden **/
    process.stdout.write('\x1B[?25h');
    process.stdout.write('\n');
    process.exit(1);
  }
};

const program = new Commander.Command(packageJson.name)
  .version(packageJson.version)
  .arguments('<project-directory>')
  .usage(`${chalk.green('<project-directory>')} [options]`)
  .action((name) => {
    projectPath = name;
  })
  .option(
    '--use-npm',
    `
  Explicitly tell the CLI to bootstrap the app using npm
`
  )
  .option(
    '--use-yarn',
    `
  Explicitly tell the CLI to bootstrap the app using yarn
`
  )
  .allowUnknownOption()
  .parse(process.argv);

const packageManager = !!program.useNpm
  ? 'npm'
  : !!program.useYarn
  ? 'yarn'
  : getPkgManager();

async function run(): Promise<void> {
  if (typeof projectPath === 'string') {
    projectPath = projectPath.trim();
  }

  if (!projectPath) {
    const res = await prompts({
      onState: onPromptState,
      type: 'text',
      name: 'path',
      message: 'What is your project named?',
      initial: 'my-app',
      validate: (name) => {
        const validation = validateNpmName(path.basename(path.resolve(name)));
        if (validation.valid) {
          return true;
        }
        return 'Invalid project name: ' + validation.problems![0];
      },
    });

    if (typeof res.path === 'string') {
      projectPath = res.path.trim();
    }
  }

  if (!projectPath) {
    console.log(
      '\nPlease specify the project directory:\n' +
        `  ${chalk.cyan(program.name())} ${chalk.green(
          '<project-directory>'
        )}\n` +
        'For example:\n' +
        `  ${chalk.cyan(program.name())} ${chalk.green('my-next-app')}\n\n` +
        `Run ${chalk.cyan(`${program.name()} --help`)} to see all options.`
    );
    process.exit(1);
  }

  const resolvedProjectPath = path.resolve(projectPath);
  const projectName = path.basename(resolvedProjectPath);

  const { valid, problems } = validateNpmName(projectName);
  if (!valid) {
    console.error(
      `🚨 Could not create a project called ${chalk.red(
        `"${projectName}"`
      )} because of npm naming restrictions:`
    );

    problems!.forEach((p) => console.error(`    ${chalk.red.bold('*')} ${p}`));
    process.exit(1);
  }

  /**
   * Verify the project dir is empty or doesn't exist
   */
  const root = path.resolve(resolvedProjectPath);
  const appName = path.basename(root);
  const folderExists = fs.existsSync(root);

  if (folderExists && !isFolderEmpty(root, appName)) {
    process.exit(1);
  }

  await createApp({
    appPath: resolvedProjectPath,
    packageManager,
  });
}

const update = checkForUpdate(packageJson).catch(() => null);

async function notifyUpdate(): Promise<void> {
  try {
    const res = await update;
    if (res?.latest) {
      const updateMessage =
        packageManager === 'yarn'
          ? 'yarn global add @abhiagrawal9/bootstrap-react-app'
          : 'npm i -g @abhiagrawal9/bootstrap-react-app';

      console.log(
        chalk.yellow.bold(
          'A new version of `@abhiagrawal9/bootstrap-react-app` is available!'
        ) +
          '\n' +
          'You can update by running: ' +
          chalk.cyan(updateMessage) +
          '\n'
      );
    }
    process.exit();
  } catch {
    // ignore error
  }
}

run()
  .then(notifyUpdate)
  .catch(async (reason) => {
    console.log();
    console.log('Aborting installation.');
    if (reason.command) {
      console.log(`  ${chalk.cyan(reason.command)} has failed.`);
    } else {
      console.log(
        chalk.red('Unexpected error. Please report it as a bug:') + '\n',
        reason
      );
    }
    console.log();

    await notifyUpdate();

    process.exit(1);
  });
