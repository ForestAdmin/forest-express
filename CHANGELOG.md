# Change Log

## [Unreleased]
### Changed
- Technical - Makes the JWT lighter and consistent across lianas.

## RELEASE 3.1.1 - 2019-05-15
### Fixed
- Exports - Fix broken exports if users restart a new browser session (ie quit/restart browser).

## RELEASE 3.1.0 - 2019-04-23
### Added
- Initialisation - Add an option onlyCrudModule to expose only the services without the Forest Admin's init.

## RELEASE 3.0.8 - 2019-04-22
### Changes
- CI - Update NodeJS version to v11.14.0 for make the test pass on the CI.

## RELEASE 3.0.7 - 2019-04-18
### Fixed
- Schema Synchronisation - `FOREST_DISABLE_AUTO_SCHEMA_APPLY=true` now deactivates properly the automatic schema synchronisation on server start.

## RELEASE 3.0.6 - 2019-04-17
### Changed
- Tests - Upgrade `nock` dependency to the latest version.

### Fixed
- Security - Patch a vulnerability removing the unused `nsp` dependency.
- Security - Patch vulnerabilities removing the unused `gulp` dependency.
- Security - Patch vulnerabilities using the latest `eslint` dependency.
- Security - Patch vulnerabilities using the latest `babel` dependencies.
- Security - Patch a vulnerability using the latest `sinon` dependency.
- Security - Patch a vulnerabilities using the latest `jsonapi-serializer` dependency.
- Security - Patch a vulnerabilities using the latest `jsonwebtoken` dependency.
- Security - Patch a vulnerabilities using the latest `lodash` dependency.

## RELEASE 3.0.5 - 2019-04-05
### Changed
- Technical - Update ip-utils to the published version.

## RELEASE 3.0.4 - 2019-04-04
### Changed
- Technical - Do not use the authentication middleware for session creation routes.
- Error Handling - Display an explicit error message if the envSecret is detected as missing or unknown during data a API request.

## RELEASE 3.0.3 - 2019-03-29
### Fixed
- Authentication - Fix the 2FA authentication with the new implementation of exports authentication.

## RELEASE 3.0.2 - 2019-03-28
### Fixed
- Technical - Fix the latest built version.

## RELEASE 3.0.1 - 2019-03-28
### Fixed
- Security - Fix implementation of session token passed in headers while downloading collections records.

## RELEASE 3.0.0 - 2019-03-27
### Changed
- Security - Do not pass session token in query params while downloading collections records.

## RELEASE 3.0.0-beta.3 - 2019-02-18
### Fixed
- Actions - Fix default action route generation if the action name contains camelcase words.

## RELEASE 3.0.0-beta.2 - 2019-02-08
### Changed
- Technical - In development environment, ensure that the schema send has the exact same data and format like with the toolbelt.
- Technical - Move apimap sorter to the serializer.

## RELEASE 3.0.0-beta.1 - 2019-01-28
### Fixed
- Schema - Fix JSON formatting for action names containing `"` characters.
- Schema - The liana can now read properly the schema file in production mode.

## RELEASE 3.0.0-beta.0 - 2019-01-28
### Added
- Developer Experience - On start, create a `.forestadmin-schema.json` file that contains the schema definition.
- Developer Experience - On production, load `.forestadmin-schema.json` for schema update.
- Developer Experience - Developers can deactivate the automatic schema synchronisation on server start using the `FOREST_DISABLE_AUTO_SCHEMA_APPLY` environment variable.
- Build - Tag versions on git for each release.
- Build - Developers can now create beta versions.

## RELEASE 2.16.2 - 2019-02-18
### Fixed
- Build - Republish the regular version on the latest tag.

## RELEASE 2.16.1 - 2019-01-21
### Fixed
- Integrations - Fix Stripe integration on an embedded document field.

## RELEASE 2.16.0 - 2019-01-17
### Added
- Integrations - Developers can configure the Stripe integration to retrieve the customerId in an embedded document field.

## RELEASE 2.15.4 - 2018-11-08
### Added
- Technical - Setup the continuous integrations configuration for Travis CI.

### Changed
- Smart Fields - Display a warning to show Smart Fields declared without a field attribute.

### Fixed
- Smart Fields - Smart Fields declared without a field attribute are not sent in the Apimap anymore.

## RELEASE 2.15.3 - 2018-10-30
### Fixed
- API - Prevent Apimaps from having duplicate fields, segments and actions, if the developer call the init function multiple times.

## RELEASE 2.15.2 - 2018-10-12
### Fixed
- Server start - Fix a crash if developers add a Smart Action to a generated integration collection that does not have existing one by default.

## RELEASE 2.15.1 - 2018-09-24
### Changed
- Authentication - Improve the log message when 2FA secret key is not set.
- Technical - Use stubs instead of object dependencies for test purposes.
- Technical - Change ESLint ruleset for Airbnb.
- Technical - Add incremental linting check.

### Fixed
- Technical - Make the tests run on the non-transpiled sources.
- Authentication - Fix an empty user id attribute in the JWT tokens.

## RELEASE 2.15.0 - 2018-09-08
### Added
- Integrations - Developers can add Smart Actions to Integration Collections.

## RELEASE 2.14.1 - 2018-08-29
### Fixed
- Technical - Add the missing "babel-runtime" dependency.

## RELEASE 2.14.0 - 2018-08-24
### Added
- Authentication - Add two factor authentication using time-based one-time password.

## RELEASE 2.13.1 - 2018-08-06
### Fixed
- Smart Actions - Fix Smart Actions Forms fields positions on Smart Collections.

## RELEASE 2.13.0 - 2018-07-18
### Changed
- Performance - Improve the speed of listing the records by executing their count into another request.

## RELEASE 2.12.1 - 2018-07-11
### Fixed
- Mixpanel Integration - Only retrieve events that are less than 60 days old to be compliant with the Mixpanel's API.

## RELEASE 2.12.0 - 2018-07-10
### Changed
- Mixpanel Integration - Change the integration to display the last 100 Mixpanel events of a "user" record.
- Mixpanel Integration - Remove the Mixpanel integration pre-defined segments.

## RELEASE 2.11.3 - 2018-06-27
### Changed
- Intercom Integration - Display the Intercom error in the server logs if the conversations list retrieval fails.

### Fixed
- Intercom Integration - Users can now access to the Intercom Details page.
- Intercom Integration - Fix the integration routes for projects using the "expressParentApp" configuration.

## RELEASE 2.11.2 - 2018-06-21
### Fixed
- Permissions - Fix automated permission for projects having multiple teams.

## RELEASE 2.11.1 - 2018-06-17
### Fixed
- DateOnly Fields - Fix potential bad values for projects using Sequelize 4+.

## RELEASE 2.11.0 - 2018-06-07
### Added
- Charts - Users can create "Leaderboard" charts.
- Charts - Users can create "Objective" charts.
- Technical - Add a new apimap property "relationship".

## RELEASE 2.10.3 - 2018-06-07
### Fixed
- IP Whitelist - Fix broken ip range of form 'x.x.x.x - x.x.x.x'.

## RELEASE 2.10.2 - 2018-05-31
### Added
- Permissions - Allow search on belongs_to when relation collection is hidden.

## RELEASE 2.10.1 - 2018-05-31
### Fixed
- Smart Actions - Fix form values prefill on Smart Actions having a custom endpoint.

## RELEASE 2.10.0 - 2018-05-25
### Added
- Permissions - Add a permission mechanism to protect the data accordingly to the UI configuration.

## RELEASE 2.9.1 - 2018-05-24
### Changed
- Search - Display highlighted match on smart fields.

## RELEASE 2.9.0 - 2018-05-22
### Added
- Technical - Add babel.
- Search - Display highlighted matches on table view when searching.

## RELEASE 2.8.5 - 2018-05-18
### Fixed
- Search - Fix potential broken search on collections that have been customized before the liana.init call.

## RELEASE 2.8.4 - 2018-05-11
### Fixed
- Stripe Integration - Improve global error handling if the stripe id is missing or incorrect in the database.

## RELEASE 2.8.3 - 2018-04-30
### Fixed
- Collections - Allow search fields customization before liana initialization.

## RELEASE 2.8.2 - 2018-04-25
### Fixed
- IP Whitelist - Request IP whitelist refresh if an IP looks invalid with the current IP whitelist.

## RELEASE 2.8.1 - 2018-04-25
### Fixed
- IP Whitelist - Request IP whitelist refresh if an IP looks invalid with the current IP whitelist.

## RELEASE 2.8.0 - 2018-04-17
### Added
- Premium Security - Add IP Whitelist feature.

## RELEASE 2.7.2 - 2018-04-12
### Fixed
- Smart Relationships - Make the Smart BelongsTo work when it references a Smart Collection record.

## RELEASE 2.7.1 - 2018-03-30
### Fixed
- Integration - Prevent client console error on Close.io leads failed retrieval.

## RELEASE 2.7.0 - 2018-03-29
### Added
- Smart Actions - "Single" type Smart Action forms can now be prefilled with contextual values.

## RELEASE 2.6.4 - 2018-03-27
### Fixed
- Authentication - Fix the missing email/name/teams information set in the token for user using Google SSO.

## RELEASE 2.6.3 - 2018-03-26
### Changed
- Collections - Allow collection customization before liana initialization.

## RELEASE 2.6.2 - 2018-03-21
### Fixed
- Smart Fields - Boolean Smart Fields that return a "false" value are now properly sent though the API.

## RELEASE 2.6.1 - 2018-03-13
### Fixed
- Smart Elements - Fix error swallowing on load and clean some useless code.

## RELEASE 2.6.0 - 2018-03-13
### Added
- MongoDB HasMany - Allow documents embedded to an array to be editable.

### Changed
- Security - Fix low impact vulnerabilities.

### Fixed
- Technical - Use local packages for npm scripts.

## RELEASE 2.5.4 - 2018-03-12
### Added
- Smart Actions - Developers can define Smart Actions that can send their request to a different endpoint than the current environment endpoint.

## RELEASE 2.5.3 - 2018-03-08
### Fixed
- Close.io Integration - Send a "No Content" (204) status code if not customer lead has been found instead of an "Internal Server Error" (500).

## RELEASE 2.5.2 - 2018-03-07
### Changed
- Smart Fields - Display a warning if an error occurs during Smart Field value computations.

## RELEASE 2.5.1 - 2018-03-05
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
