import chalk from 'chalk';
import path from 'path';

import {
  installTemplate,
  logGradient,
  TemplateMode,
  TemplateType,
} from '../templates';
import { tryGitInit } from './helpers/git';
import { install } from './helpers/install';
import { isFolderEmpty } from './helpers/is-folder-empty';
import { getOnline } from './helpers/is-online';
import { isWriteable } from './helpers/is-writeable';
import { makeDir } from './helpers/make-dir';

import type { PackageManager } from './helpers/get-pkg-manager';

export async function createApp({
  appPath,
  packageManager,
}: {
  appPath: string;
  packageManager: PackageManager;
}): Promise<void> {
  const mode: TemplateMode = 'ts';
  const template: TemplateType = 'default';
  const root = path.resolve(appPath);

  if (!(await isWriteable(path.dirname(root)))) {
    console.error(
      '🚨 The application path is not writable, please check folder permissions and try again.'
    );
    console.error(
      '🚨 It is likely you do not have write permissions for this folder.'
    );
    process.exit(1);
  }

  const appName = path.basename(root);

  await makeDir(root);
  if (!isFolderEmpty(root, appName)) {
    process.exit(1);
  }

  const useYarn = packageManager === 'yarn';
  const isOnline = !useYarn || (await getOnline());
  console.log();

  process.chdir(root);

  await installTemplate({
    appName,
    root,
    template,
    packageManager,
    isOnline,
    mode,
  });

  if (tryGitInit(root)) {
    console.log();
    console.log(logGradient('✅ Initialized a git repository.'));
    console.log();
  }

  // For serving prepare and post-install scripts
  console.log(logGradient('🧪 Running prepare and post-install scripts'));
  await install(root, [], { packageManager, isOnline });

  console.log();
  console.log(`${chalk.bold(logGradient('🎉 Success!'))}`);
  console.log();
  console.log(`✨ Created ${chalk.bold(logGradient(appName))} at ${appPath}`);
}
