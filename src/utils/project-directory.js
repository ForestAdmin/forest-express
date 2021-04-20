const path = require('path');

// NOTICE: order does matter as packages install via yarn 2 pnp mode also
// include node_modules in path
const ROOT_PACKAGES_PATHS = [
  // yarn 2 pnp mode
  path.join('.yarn', 'cache'),
  path.join('.yarn', 'unplugged'),
  // usual yarn / npm
  'node_modules',
];

function ensureAbsolutePath(subPathsToProject) {
  // NOTICE: on POSIX system, empty path created by previous split is skipped by path.join.
  if (!path.isAbsolute(path.join(...subPathsToProject))) {
    return path.join(path.sep, ...subPathsToProject);
  }
  return path.join(...subPathsToProject);
}

class ProjectDirectoryUtils {
  constructor() {
    this.dirname = __dirname;
  }

  getAbsolutePath() {
    for (let index = 0; index <= ROOT_PACKAGES_PATHS.length; index += 1) {
      const rootPackagesPath = ROOT_PACKAGES_PATHS[index];
      // NOTICE: forest-express has not been sym linked.
      if (this.dirname.includes(rootPackagesPath)) {
        const rootPathIndex = this.dirname.indexOf(rootPackagesPath);
        const projectRootPath = this.dirname.substr(0, rootPathIndex);
        const subPathsToProject = projectRootPath.split(path.sep);
        return ensureAbsolutePath(subPathsToProject);
      }
    }

    // NOTICE: forest-express is sym linked, assuming the process is running on project directory.
    return process.cwd();
  }
}

module.exports = ProjectDirectoryUtils;
