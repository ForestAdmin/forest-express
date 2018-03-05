# Change Log

## [Unreleased]
### Fixed
- Live Query - Fix charts generation for values equal to 0 or null.

## RELEASE 2.5.0 - 2018-03-01
### Added
- Smart Actions - Users can define Smart Actions only available in a record detail.

## RELEASE 2.4.1 - 2018-02-28
### Changed
- Apimap - Catch potential failure during the apimap sorting.

### Fixed
- Smart Actions - Display the Smart Actions form fields in the declaration order. [Regression introduced in 2.4.0]

## RELEASE 2.4.0 - 2018-02-07
### Changed
- Apimap - Prevent random sorting collections and useless updates.

### Fixed
- Search - Prevent the records search to crash if no fields parameter is sent by the client.
- Tests - Fix Google session creation test.

## RELEASE 2.3.0 - 2018-02-02
### Changed
- Smart Fields - Compute only the necessary Smart Fields values for list views and CSV exports.

## RELEASE 2.2.2 - 2018-02-01
### Fixed
- Smart Fields - Fix concurrency between Smart Fields setters and enable multiple setters to work properly on a record update.

## RELEASE 2.2.1 - 2018-02-01
### Fixed
- CORS - Re-authorize forestadmin.com in the CORS configuration. [regression introduced in 2.0.6]

## RELEASE 2.2.0 - 2018-01-26
### Added
- Charts - Users can create charts using raw database queries with the Live Query option.

## RELEASE 2.1.0 - 2018-01-11
### Added
- Authentication - Users can connect to their project using Google Single Sign-On.

## RELEASE 2.0.6 - 2017-12-27
### Changed
- Performance - Reduce drastically the number of CORS preflight requests send by the API clients.

### Fixed
- Authentication - Developers whom want to extend the Admin API can now use the authentication for the overridden routes.

## RELEASE 2.0.5 - 2017-12-22
### Added
- Smart BelongsTo - Developers can now implement Smart BelongsTo values updates.
- Smart Fields - Add a "isFilterable" option to let them appear in the filters selection.

### Fixed
- Security - Remove a vulnerability by upgrading Moment.js library.

## RELEASE 2.0.4 - 2017-12-12
### Fixed
- Smart Fields - Prevent Smart Fields promise values injection errors on related data retrieval.

## RELEASE 2.0.3 - 2017-12-12
### Added
- TypeScript Support - Forest can now load TypeScript modules.

### Fixed
- Smart Fields - Prevent Smart Fields values injection errors on related data retrieval.

## RELEASE 2.0.2 - 2017-12-06
### Fixed
- Summary View - Fix potential Summary View freeze on records having "Point" type fields (if some related data are displayed).

## RELEASE 2.0.1 - 2017-11-30
### Changed
- Collection Names - Improve the lianas versions transition from V1 to V2.

## RELEASE 2.0.0 - 2017-11-29
- Collections Names - Collection names are now based on the model name whatever the ORM is.

## RELEASE 1.5.3 - 2017-11-27
### Added
- Stripe Integration - Allow users to display Stripe records in the Details view.

## RELEASE 1.5.2 - 2017-11-08
### Fixed
- Custom Domains - Make the feature usable natively with the CORS_ORIGINS variable.

## RELEASE 1.5.1 - 2017-11-06
### Changed
- Security - Remove all detected vulnerabilities upgrading some dependencies (nsp check --output summary).

## RELEASE 1.5.0 - 2017-10-30
### Changed
- Smart Fields - Do the Smart Fields values injection in the Serializer to simplify Smart Relationships implementation.

## RELEASE 1.4.0 - 2017-10-26
### Added
- Types Support - Support Point field type.

### Changed
- Smart Relationships - Add a warning if a Smart Collection does not define the "idField" attribute necessary for Smart Relationships.
- Smart Fields - Prevent the Smart Fields computation errors to generate a crash and handle it letting the value empty.

## RELEASE 1.3.6 - 2017-10-11
### Changed
- Sessions - Display a clean error message if the renderingId and envSecret are missing or inconsistent.

### Fixed
- Initialisation - Prevent bad "import" syntax error detections on initialisation.

## RELEASE 1.3.5 - 2017-10-06
### Fixed
- Stripe - Fix the 'mapping' collection name on Express/Mongoose.
- Integrations - Ensure all the models are loading before integrations setup.

## RELEASE 1.3.4 - 2017-10-04
### Fixed
- Initialisation - Do not try to require file that don't have the js extension.

## RELEASE 1.3.3 - 2017-10-03
### Fixed
- Intercom - Make the conversation details accessible.

## RELEASE 1.3.2 - 2017-10-02
### Fixed
- Initialisation - Prevent bad ES2017 syntax error detections on initialisation.

## RELEASE 1.3.1 - 2017-10-02
### Changed
- Intercom Integration - Prefer Intercom accessToken configuration to old fashioned appId/apiKey.
- Intercom Integration - Remove support for old configuration parameter use "userCollection" (use mapping instead).

## RELEASE 1.3.0 - 2017-09-20
### Added
- Smart Fields - Add a parameter to specify if the sorting is allowed on this field.

### Fixed
- Initialisation - Ignore directories while loading models.

## RELEASE 1.2.7 - 2017-09-10
### Changed
- Initialisation - Display an explicit error log if a model cannot be loaded properly.

## RELEASE 1.2.6 - 2017-09-07
### Fixed
- Export - Fix datetime formatting regression introduced by liana version 1.2.3.

## RELEASE 1.2.5 - 2017-08-30
### Fixed
- Integrations - Catch an error if the user is not found by the Layer API.
- Integrations - Catch an error if Mixpanel API does not responds data.

## RELEASE 1.2.4 - 2017-08-30
### Added
- Resources Route - Allow users to call a ResourcesRoute from their app.

## RELEASE 1.2.3 - 2017-08-29
### Added
- Onboarding - Display an error message if the envSecret option is missing.

### Fixed
- Exports - Escape special characters for the string fields.
- Integrations - Display models "mapping" errors if any.

## RELEASE 1.2.2 - 2017-08-24
### Changed
- Integrations - Change the Layer integration to be based on the Server API.

### Fixed
- Code Inspection - Fix Forest customization code inspection to be recursive through directories.

## RELEASE 1.2.1 - 2017-08-23
### Fixed
- Installation - Fix installation errors due to express-cors package using Yarn.
- Exports - Fix bad initial implementation for exports authentication.

## RELEASE 1.2.0 - 2017-08-21
### Added
- Exports - Forest can now handle large data exports.

## RELEASE 1.1.15 - 2017-08-09
### Added
- Integrations - Add a first version of Layer integration.

## RELEASE 1.1.14 - 2017-08-08
### Added
- Validations - Start the support of forms validations (with 9 first validations).

## RELEASE 1.1.13 - 2017-07-12
### Fixed
- Records Update - Prevent a crash on record updates for records that have no attributes.

## RELEASE 1.1.12 - 2017-07-05
### Added
- Search - Developers can configure in which fields the search will be executed.

## RELEASE 1.1.11 - 2017-07-05
### Fixed
- Warnings - Remove a potential console deprecation warning.

## RELEASE 1.1.10 - 2017-06-28
### Fixed
- Serializer - Log an error in the console if the association doesn't exist.

## RELEASE 1.1.9 - 2017-06-23
### Fixed
- Collections - Correctly serialize collections that begin with an underscore.

## RELEASE 1.1.8 - 2017-06-23
### Added
- Apimap - Send database type and orm version in apimap.

## RELEASE 1.1.7 - 2017-06-13
### Changed
- Error Messages - Display the stack trace on unexpected errors.

### Fixed
- Error Messages - Display an explicit warning if Forest servers are in maintenance.

## RELEASE 1.1.6 - 2017-06-05
### Fixed
- Records Serialization - Fix the object types case (kebab case) to prevent potential JSON api adapter errors on client side.

## RELEASE 1.1.5 - 2017-06-01
### Fixed
- HasMany Smart Fields - Fix routes conflicts between hasMany Smart Fields and other associations.

## RELEASE 1.1.4 - 2017-05-29
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
