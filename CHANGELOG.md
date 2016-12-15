# Change Log

## [Unreleased]

## RELEASE 0.2.1 - 2016-12-14
### Added
- Close.io - Add the field of the Lead status_label on the mapped tables.

## RELEASE 0.2.0 - 2016-12-12
### Added
- Segments - Smart Segments can be created to define specific records subsets.
- Integrations - Create a light Mixpanel integration to retrieve Mixpanel active users in Forest.

### Changed
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

### Changed
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
