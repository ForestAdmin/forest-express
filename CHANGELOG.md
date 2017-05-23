# Change Log

## [Unreleased]
### Added
- Smart Collections - Add a new isSearchable property to display the search bar for Smart Collections.

## RELEASE 1.1.3 - 2017-05-24
### Changed
- Resources Updater - Pass the params.recordId to the ResourceUpdater.

### Fixed
- Smart Fields - Serialize Smart Fields values for hasMany associations.

## RELEASE 1.1.2 - 2017-05-16
### Fixed
- Smart Fields - Fix some bad Smart Fields getter calls on records list and detail display.

## RELEASE 1.1.1 - 2017-05-11
### Added
- Customization Errors - Do not send the apimap when users create Forest customization with syntax errors in code.
- Customization Errors - Add errors in the console when users create Forest customization with syntax errors in code.

### Fixed
- Smart Fields - Serialize Smart Fields values for belongsTo association.

## RELEASE 1.1.0 - 2017-04-27
### Added
- Smart Fields - Developers can now define Smart Fields setters.

### Changed
- Smart Fields - Replace the Smart Fields value method by get.

## RELEASE 1.0.7 - 2017-04-21
### Fixed
- Smart Fields - Smart fields are sent in the detail view request

## RELEASE 1.0.6 - 2017-04-14
### Added
- Setup Guide - Add integration field to the collections to distinguish Smart Collections and Collections from integrations.

### Changed
- Performances - Make the password comparison asynchronous on session creation.

### Fixed
- Error Handling - Fix missing error code 500 in case of internal error.

## RELEASE 1.0.5 - 2017-04-06
### Added
- Types Support - Support Dateonly field type.
- Version Warning - Display a warning message if the liana version used is too old.

### Changed
- Technical - Promisify only the necessary method on apimap generation.

### Fixed
- Console logs - Fix a bad error log display if the smart implementation directory does not exist.

## RELEASE 1.0.4 - 2017-03-28
### Added
- Smart Actions - Users don't have to select records to use a smart action through the global option.

## RELEASE 1.0.3 - 2017-03-16
### Changed
- Logs - Log error messages for unexpected errors only.
- Errors - Unexpected liana error now return a 500 status code.
- Errors Handling - Improve the error message if the Forest "sequelize" option is misconfigured.
- Intercom - Remove duplicate routes (the old ones).

### Fixed
- Mixpanel - Fix the "user events" result display if there is no event.

## RELEASE 1.0.2 - 2017-03-10
### Added
- Configuration - Display an error message if the Smart Action "fields" option is not an Array.

## RELEASE 1.0.1 - 2017-02-10
### Changed
- Configuration - Catch the error if the modelsDir configured does not exist.

## RELEASE 1.0.0 - 2016-02-06
### Added
- Smart Actions - Support file download.

## RELEASE 0.2.2 - 2016-01-04
### Added
- Configurations - Users can specify the directory for Forest Smart Implementation.

### Fixed
- Configuration - Fix bad authentication when a custom path is configured.

## RELEASE 0.2.1 - 2016-12-14
### Added
- Close.io - Add the field of the Lead status_label on the mapped tables.

## RELEASE 0.2.0 - 2016-12-12
### Added
- Segments - Smart Segments can be created to define specific records subsets.
- Integrations - Create a light Mixpanel integration to retrieve Mixpanel active users in Forest.

### Changed
- Package - Add contributors, keywords, homepage...
- Package - Remove an unused package (logger).
- Dependencies - Freeze the dependencies versions to reduce packages versions changes between projects/environments.
- Configuration - Rename secret values to envSecret and authSecret.

### Fixed
- Integrations - Remove some unnecessary routes.
- Integrations - Fix a serialization issue.

## RELEASE 0.1.33 - 2016-12-05
### Added
- Configuration - Catch a missing auth_key in the configuration and send an explicit error message on liana authentication.
- Errors - Display the explicit error if a request error is catched.

### Changed
- Packages - Update the node-uuid package to the new version named uuid.

## RELEASE 0.1.32 - 2016-11-24
### Added
- Errors - Catch potential validation error and send a response with the first retrieved error.

### Fixed
- Record Creation - Allow false boolean values on record creation.
- Allowed Users - Remove a space in the allowed users retrieval URL.

## RELEASE 0.1.31 - 2016-11-17
### Added
- Deserializer - Expose Deserializer module to API.
- Errors Tracking - Catch errors on app launch / apimap generation / liana session creation.

### Changed
- Session Token - Replace the old outline notion by the rendering in the generated token.

### Fixed
- Custom Actions - Fix missing actions for Smart Collections.

## RELEASE 0.1.30 - 2016-10-28
### Fixed
- Custom Actions - Fix the bad endpoints if some actions have the same name.
- Resources Index - Fix lists with null smart field values.

## RELEASE 0.1.29 - 2016-10-14
### Fixed
- Deserialization - Fix the deserialization if the payload has no attributes.
- Fields - Serialize the "isVirtual" property in the apimap.

## RELEASE 0.1.28 - 2016-10-11
### Added
- ES5 - Secure the ES5 compatibility with a git hook.

### Fixed
- Record Create - Fix empty relationships on record creation.

## RELEASE 0.1.27 - 2016-09-30
### Fixed
- hasMany - Fix the hasMany fetch when an integration is set.

## RELEASE 0.1.26 - 2016-09-30
### Fixed
- Record Update - Fix the potential relationship dissociations on record update.

## RELEASE 0.1.25 - 2016-09-29
### Fixed
- Pagination - fix the hasMany number of records.

## RELEASE 0.1.24 - 2016-09-27
### Fixed
- Close.io - accept an array for mapping option.

## RELEASE 0.1.23 - 2016-09-28
### Added
- Integration - Add the Close.io integration
- Authentication - Users want to have an option to mount Forest Liana as a subapp.
