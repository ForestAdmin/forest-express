const path = require('path');

class ProjectDirectoryUtils {
  constructor() {
    this.dirname = __dirname;
  }

  // NOTICE: Order does matter as packages install via yarn 2 Plug n Play mode also
  //         include node_modules in path.
  static PATHS_ROOT_PACKAGES = [
    // yarn 2 Plug n Play mode
    path.join('.yarn', 'cache'),
    path.join('.yarn', 'unplugged'),
    // usual yarn / npm
    'node_modules',
  ];

  static ensureAbsolutePath(subPathsToProject) {
    // NOTICE: on POSIX system, empty path created by previous split is skipped by path.join.
    if (!path.isAbsolute(path.join(...subPathsToProject))) {
      return path.join(path.sep, ...subPathsToProject);
    }
    return path.join(...subPathsToProject);
  }

  getAbsolutePath() {
    for (let index = 0; index <= ProjectDirectoryUtils.PATHS_ROOT_PACKAGES.length; index += 1) {
      const rootPackagesPath = ProjectDirectoryUtils.PATHS_ROOT_PACKAGES[index];
      // NOTICE: forest-express has not been sym linked.
      if (this.dirname.includes(rootPackagesPath)) {
        const indexRootPath = this.dirname.indexOf(rootPackagesPath);
        const pathProjectRoot = this.dirname.substr(0, indexRootPath);
        const subPathsToProject = pathProjectRoot.split(path.sep);
        return ProjectDirectoryUtils.ensureAbsolutePath(subPathsToProject);
      }
    }

    // NOTICE: forest-express is sym linked, assuming the process is running on project directory.
    return process.cwd();
  }
}

module.exports = ProjectDirectoryUtils;
