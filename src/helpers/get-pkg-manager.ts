export type PackageManager = 'npm' | 'yarn';

export function getPkgManager(): PackageManager {
  const userAgent = process.env.npm_config_user_agent;

  if (userAgent) {
    return userAgent.startsWith('yarn') ? 'yarn' : 'npm';
  } else {
    return 'npm';
  }
}
