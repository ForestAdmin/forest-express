const path = require('path');

class ProjectDirectoryUtils {
  constructor() {
    this.dirname = __dirname;
  }

  getAbsolutePath() {
    // NOTICE : forest-express has not been sym linked
    if (this.dirname.includes('node_modules')) {
      const splitPaths = this.dirname.split(path.sep);
      const nodeModuleIndex = splitPaths.indexOf('node_modules');
      const subPathsToProject = splitPaths.slice(0, nodeModuleIndex);

      // NOTICE : on POSIX system, empty path created by previous split is skipped by path.join
      if (!path.isAbsolute(path.join(...subPathsToProject))) {
        return path.join(path.sep, ...subPathsToProject);
      }

      return path.join(...subPathsToProject);
    }

    // NOTICE : forest-express is sym linked, assuming the process is running on project directory
    return process.cwd();
  }
}

module.exports = ProjectDirectoryUtils;
