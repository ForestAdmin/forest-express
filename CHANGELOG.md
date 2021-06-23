## [8.7.4](https://github.com/ForestAdmin/forest-express/compare/v8.7.3...v8.7.4) (2021-06-23)


### Bug Fixes

* **authentication:** error during authentication when the environment is secret passed as a liana option and not an environment variable ([#752](https://github.com/ForestAdmin/forest-express/issues/752)) ([af19146](https://github.com/ForestAdmin/forest-express/commit/af19146826a903b279c07345b34860f95a832e84))

## [8.7.3](https://github.com/ForestAdmin/forest-express/compare/v8.7.2...v8.7.3) (2021-06-16)


### Bug Fixes

* stats permissions should be retrieved only one time per team ([#741](https://github.com/ForestAdmin/forest-express/issues/741)) ([8d05d75](https://github.com/ForestAdmin/forest-express/commit/8d05d757992c11c7b7a2ce3b4465a54e2430e755))

## [8.7.2](https://github.com/ForestAdmin/forest-express/compare/v8.7.1...v8.7.2) (2021-06-15)


### Bug Fixes

* **intercom:** fix date conversion from unix timestamp to js date of intercom attributes ([#742](https://github.com/ForestAdmin/forest-express/issues/742)) ([97fa090](https://github.com/ForestAdmin/forest-express/commit/97fa09016f8c99bb75532c2272e7ba202f7054d4))

## [8.7.1](https://github.com/ForestAdmin/forest-express/compare/v8.7.0...v8.7.1) (2021-06-10)


### Bug Fixes

* prevent IP check from failing for the proxies including the port in the headers ([#738](https://github.com/ForestAdmin/forest-express/issues/738)) ([810d0c1](https://github.com/ForestAdmin/forest-express/commit/810d0c1e013d9ec3e2af201f1b53bd125eb6af2f))

# [8.7.0](https://github.com/ForestAdmin/forest-express/compare/v8.6.1...v8.7.0) (2021-06-09)


### Features

* include role in the user data inside the request ([#733](https://github.com/ForestAdmin/forest-express/issues/733)) ([e74ce72](https://github.com/ForestAdmin/forest-express/commit/e74ce724d80102387a2b5dd2d80581126fc66fee))

## [8.6.1](https://github.com/ForestAdmin/forest-express/compare/v8.6.0...v8.6.1) (2021-06-03)


### Bug Fixes

* correctly get the IP address from the request headers ([#731](https://github.com/ForestAdmin/forest-express/issues/731)) ([f2b5905](https://github.com/ForestAdmin/forest-express/commit/f2b59052219e13ece21b81d53f1381777407bd66))

# [8.6.0](https://github.com/ForestAdmin/forest-express/compare/v8.5.2...v8.6.0) (2021-06-02)


### Features

* **schema:** add embedded key stack into meta of the forestadmin schema ([#724](https://github.com/ForestAdmin/forest-express/issues/724)) ([5ff5a12](https://github.com/ForestAdmin/forest-express/commit/5ff5a12a267f97166753ef51142ad98d82788235))

## [8.5.2](https://github.com/ForestAdmin/forest-express/compare/v8.5.1...v8.5.2) (2021-05-25)


### Bug Fixes

* **smart-actions-change-hook:** record is no longer altered and is sent correctly ([#722](https://github.com/ForestAdmin/forest-express/issues/722)) ([f2ecfce](https://github.com/ForestAdmin/forest-express/commit/f2ecfce15c62ef0f9b0344b695010361c9b56aed))

## [8.5.1](https://github.com/ForestAdmin/forest-express/compare/v8.5.0...v8.5.1) (2021-05-17)


### Bug Fixes

* charts using groupby on relationship should not throws 403 forbidden ([#710](https://github.com/ForestAdmin/forest-express/issues/710)) ([480eb94](https://github.com/ForestAdmin/forest-express/commit/480eb9444a952799a37f93f6763445cafcf588e4))

# [8.5.0](https://github.com/ForestAdmin/forest-express/compare/v8.4.0...v8.5.0) (2021-05-05)


### Features

* **schema:** developers can specify manually the path of the .forestadmin-schema.json file ([#698](https://github.com/ForestAdmin/forest-express/issues/698)) ([c27bfb9](https://github.com/ForestAdmin/forest-express/commit/c27bfb9b644c0c8836f926f67a1ebf01b4e0f02d))

# [8.4.0](https://github.com/ForestAdmin/forest-express/compare/v8.3.2...v8.4.0) (2021-04-27)


### Features

* support yarn 2 plug n play install mode ([#697](https://github.com/ForestAdmin/forest-express/issues/697)) ([33c3e58](https://github.com/ForestAdmin/forest-express/commit/33c3e585fd6b921a06994d68633aa4babae25896))

## [8.3.2](https://github.com/ForestAdmin/forest-express/compare/v8.3.1...v8.3.2) (2021-04-21)


### Bug Fixes

* **security:** patch ssri dependency vulnerability ([#691](https://github.com/ForestAdmin/forest-express/issues/691)) ([ba84ea1](https://github.com/ForestAdmin/forest-express/commit/ba84ea19615fcfa669ea484b7c0464239a6d09eb))

## [8.3.1](https://github.com/ForestAdmin/forest-express/compare/v8.3.0...v8.3.1) (2021-04-15)


### Bug Fixes

* **date-filter:** filtering only on hours now returns the expected records ([#686](https://github.com/ForestAdmin/forest-express/issues/686)) ([b361818](https://github.com/ForestAdmin/forest-express/commit/b361818ef8628ff15cb7108c974367ad9d18490d))

# [8.3.0](https://github.com/ForestAdmin/forest-express/compare/v8.2.0...v8.3.0) (2021-04-12)


### Features

* **smart-action:** handle isReadOnly field in smart action forms ([#671](https://github.com/ForestAdmin/forest-express/issues/671)) ([4de9540](https://github.com/ForestAdmin/forest-express/commit/4de95408a34afa47388c3af8a715b19bafe78ed3))

# [8.2.0](https://github.com/ForestAdmin/forest-express/compare/v8.1.4...v8.2.0) (2021-04-08)


### Features

* **smart-action:** support hooks for smart-collection ([#680](https://github.com/ForestAdmin/forest-express/issues/680)) ([0fd96d6](https://github.com/ForestAdmin/forest-express/commit/0fd96d69ccebe889c46cbaa419691490786b3719))

## [8.1.4](https://github.com/ForestAdmin/forest-express/compare/v8.1.3...v8.1.4) (2021-04-07)


### Bug Fixes

* include `/forest` route in CORS and authentication config ([#682](https://github.com/ForestAdmin/forest-express/issues/682)) ([9b7ad28](https://github.com/ForestAdmin/forest-express/commit/9b7ad2878c9c024581f39bc6cd7e326717a0738d))

## [8.1.3](https://github.com/ForestAdmin/forest-express/compare/v8.1.2...v8.1.3) (2021-03-31)


### Bug Fixes

* **security:** patch node-notifier vulnerabilities ([#679](https://github.com/ForestAdmin/forest-express/issues/679)) ([24b59b6](https://github.com/ForestAdmin/forest-express/commit/24b59b6df99a9347503747f244844f1d182e6501))

## [8.1.2](https://github.com/ForestAdmin/forest-express/compare/v8.1.1...v8.1.2) (2021-03-31)


### Bug Fixes

* **security:** patch ini dependency vulnérability ([#678](https://github.com/ForestAdmin/forest-express/issues/678)) ([e8b0101](https://github.com/ForestAdmin/forest-express/commit/e8b010138e3a91bf928290cb5524c7f965fd627b))
* **security:** patch npm-user-validate dependency vulnerabilities ([#677](https://github.com/ForestAdmin/forest-express/issues/677)) ([d630b4f](https://github.com/ForestAdmin/forest-express/commit/d630b4fbf8bbb4c58f1e900e6cfe09f39dce1c26))

## [8.1.1](https://github.com/ForestAdmin/forest-express/compare/v8.1.0...v8.1.1) (2021-03-31)


### Bug Fixes

* **security:** patch y18n dependency vulnerabilities ([#676](https://github.com/ForestAdmin/forest-express/issues/676)) ([03cf696](https://github.com/ForestAdmin/forest-express/commit/03cf69662343fb0f4bd0ee43a848aebec9de348d))

# [8.1.0](https://github.com/ForestAdmin/forest-express/compare/v8.0.5...v8.1.0) (2021-03-15)


### Features

* **security:** authorised only allowed stats queries using permissions ([#666](https://github.com/ForestAdmin/forest-express/issues/666)) ([b92d16e](https://github.com/ForestAdmin/forest-express/commit/b92d16e68013f7b03cfcb030d9333e7246e737d6))

## [8.0.5](https://github.com/ForestAdmin/forest-express/compare/v8.0.4...v8.0.5) (2021-03-10)


### Bug Fixes

* **security:** decrease the time before expiration of forest session token ([#656](https://github.com/ForestAdmin/forest-express/issues/656)) ([037a5af](https://github.com/ForestAdmin/forest-express/commit/037a5af5dba43daab7107418ecb162be233e34cb))

## [8.0.4](https://github.com/ForestAdmin/forest-express/compare/v8.0.3...v8.0.4) (2021-03-10)


### Bug Fixes

* **authentication:** unable to login when the agents respond to an url starting with a prefix ([#667](https://github.com/ForestAdmin/forest-express/issues/667)) ([2c7cef0](https://github.com/ForestAdmin/forest-express/commit/2c7cef082ab9e590916737bc1f7f7c7e8aeed1b3))

## [8.0.3](https://github.com/ForestAdmin/forest-express/compare/v8.0.2...v8.0.3) (2021-03-05)


### Bug Fixes

* **security:** patch lodash vulnerabilities ([#645](https://github.com/ForestAdmin/forest-express/issues/645)) ([f986106](https://github.com/ForestAdmin/forest-express/commit/f986106a7ca04adb060f73f702abe91496f479d4))

## [8.0.2](https://github.com/ForestAdmin/forest-express/compare/v8.0.1...v8.0.2) (2021-03-04)


### Bug Fixes

* **authentication:** safari cannot login on remote lianas because of third party cookies ([#662](https://github.com/ForestAdmin/forest-express/issues/662)) ([9003a64](https://github.com/ForestAdmin/forest-express/commit/9003a64639630bb8e162298e2eaf70685ec2031b))

## [8.0.1](https://github.com/ForestAdmin/forest-express/compare/v8.0.0...v8.0.1) (2021-03-04)


### Bug Fixes

* **authentication:** return better errors when a user is not authorized to access a rendering ([#660](https://github.com/ForestAdmin/forest-express/issues/660)) ([c34dfc0](https://github.com/ForestAdmin/forest-express/commit/c34dfc03ced41b98c10a6ea651a1ebf5ab5c780a))

# [8.0.0](https://github.com/ForestAdmin/forest-express/compare/v7.10.1...v8.0.0) (2021-02-22)


### Bug Fixes

* **authentication:** error when authenticating with an invalid token in cookies ([#611](https://github.com/ForestAdmin/forest-express/issues/611)) ([e6d6737](https://github.com/ForestAdmin/forest-express/commit/e6d6737c896c882ebc774ddee2be90337c787c2b))
* send back response to frontend instead of redirecting ([#609](https://github.com/ForestAdmin/forest-express/issues/609)) ([6f37521](https://github.com/ForestAdmin/forest-express/commit/6f375212c41c5451b14d8761c7b62a3e851c8f60))
* user being disconnected after 33min instead of 14 days ([#610](https://github.com/ForestAdmin/forest-express/issues/610)) ([80580e7](https://github.com/ForestAdmin/forest-express/commit/80580e710a7764d1fe4d7ec912352d74594cd685))
* **auth:** oidc authentication when running multiple instances of the agent ([#608](https://github.com/ForestAdmin/forest-express/issues/608)) ([ef25acb](https://github.com/ForestAdmin/forest-express/commit/ef25acb278142e4aa933b279665245dd7bb18646))


### Features

* merge master into beta ([131cb73](https://github.com/ForestAdmin/forest-express/commit/131cb73ba582b2586720a316853b82fa48fdf348))
* **authentication:** remove old authentication routes ([#624](https://github.com/ForestAdmin/forest-express/issues/624)) ([b0ffc50](https://github.com/ForestAdmin/forest-express/commit/b0ffc504e819c1a16b3935937725325349e71ddb))
* **authentication:** return a specific error during authorization if received an error about 2FA ([#622](https://github.com/ForestAdmin/forest-express/issues/622)) ([3a59a12](https://github.com/ForestAdmin/forest-express/commit/3a59a12daa4e7273879b38512e6b9ef73e199438))
* **permissions:** handle mutliple permissions cache ([7114244](https://github.com/ForestAdmin/forest-express/commit/7114244da267a2e14b502339ed39e1ab2b9248fc))
* authenticate with openid connect ([#555](https://github.com/ForestAdmin/forest-express/issues/555)) ([72b2cc8](https://github.com/ForestAdmin/forest-express/commit/72b2cc86510caeb1e7de6593f9163b59d536bbeb))
* delete cookie when client logout ([#545](https://github.com/ForestAdmin/forest-express/issues/545)) ([#560](https://github.com/ForestAdmin/forest-express/issues/560)) ([5188206](https://github.com/ForestAdmin/forest-express/commit/51882065163f0f295b0c35f3ae0f73db64e4ec6a))


* feat!: ease the multi-database setup by providing a map of connections on liana.init (#525) ([2e9dc94](https://github.com/ForestAdmin/forest-express/commit/2e9dc94dc6ba7366798f045c457d297308c20b33)), closes [#525](https://github.com/ForestAdmin/forest-express/issues/525)


### BREAKING CHANGES

* **authentication:** all previous authentication routes have been removed
* onlyCrudModule, modelsDir, secretKey, authKey options are not supported anymore by Liana.init().
Instead of sequelize/mongoose & Sequelize/Mongoose, connections & objectMapping are now required.

# [8.0.0-beta.16](https://github.com/ForestAdmin/forest-express/compare/v8.0.0-beta.15...v8.0.0-beta.16) (2021-02-22)


### Bug Fixes

* fix record creation with unconventional pk field acting as a fk ([#616](https://github.com/ForestAdmin/forest-express/issues/616)) ([c64909b](https://github.com/ForestAdmin/forest-express/commit/c64909b7835ff86b4b0583ee23fedc519a9701fd))

## [7.10.1](https://github.com/ForestAdmin/forest-express/compare/v7.10.0...v7.10.1) (2021-02-22)


### Bug Fixes

* fix record creation with unconventional pk field acting as a fk ([#616](https://github.com/ForestAdmin/forest-express/issues/616)) ([c64909b](https://github.com/ForestAdmin/forest-express/commit/c64909b7835ff86b4b0583ee23fedc519a9701fd))

# [8.0.0-beta.15](https://github.com/ForestAdmin/forest-express/compare/v8.0.0-beta.14...v8.0.0-beta.15) (2021-02-11)


### Features

* expose SchemaSerializer ([#637](https://github.com/ForestAdmin/forest-express/issues/637)) ([e792584](https://github.com/ForestAdmin/forest-express/commit/e7925847ccaed83bd6c96a708d1c6fa0c90488e9))
* merge master into beta ([131cb73](https://github.com/ForestAdmin/forest-express/commit/131cb73ba582b2586720a316853b82fa48fdf348))

# [8.0.0-beta.14](https://github.com/ForestAdmin/forest-express/compare/v8.0.0-beta.13...v8.0.0-beta.14) (2021-02-11)


### Features

* **permissions:** handle multiple permissions cache ([7114244](https://github.com/ForestAdmin/forest-express/commit/7114244da267a2e14b502339ed39e1ab2b9248fc))

# [7.10.0](https://github.com/ForestAdmin/forest-express/compare/v7.9.6...v7.10.0) (2021-02-10)


### Features

* expose SchemaSerializer ([#637](https://github.com/ForestAdmin/forest-express/issues/637)) ([e792584](https://github.com/ForestAdmin/forest-express/commit/e7925847ccaed83bd6c96a708d1c6fa0c90488e9))

# [8.0.0-beta.13](https://github.com/ForestAdmin/forest-express/compare/v8.0.0-beta.12...v8.0.0-beta.13) (2021-02-08)


### Bug Fixes

* **forestadmin-schema:** regenerate forestadmin schema only when files are valid ([#614](https://github.com/ForestAdmin/forest-express/issues/614)) ([c26c385](https://github.com/ForestAdmin/forest-express/commit/c26c385322dd96d5f1f2b9f84988a968312cd1fb))
* **smart-action-hook:** value injected to an enum field of type `[Enum]` is now correctly handled ([#617](https://github.com/ForestAdmin/forest-express/issues/617)) ([98a6859](https://github.com/ForestAdmin/forest-express/commit/98a685920acf7b3723cfff106bc30fec6c468890))

# [8.0.0-beta.12](https://github.com/ForestAdmin/forest-express/compare/v8.0.0-beta.11...v8.0.0-beta.12) (2021-02-02)


### Features

* **authentication:** remove old authentication routes ([#624](https://github.com/ForestAdmin/forest-express/issues/624)) ([b0ffc50](https://github.com/ForestAdmin/forest-express/commit/b0ffc504e819c1a16b3935937725325349e71ddb))
* **authentication:** return a specific error during authorization if received an error about 2FA ([#622](https://github.com/ForestAdmin/forest-express/issues/622)) ([3a59a12](https://github.com/ForestAdmin/forest-express/commit/3a59a12daa4e7273879b38512e6b9ef73e199438))


### BREAKING CHANGES

* **authentication:** all previous authentication routes have been removed

## [7.9.6](https://github.com/ForestAdmin/forest-express/compare/v7.9.5...v7.9.6) (2021-01-20)


### Bug Fixes

* **smart-action-hook:** value injected to an enum field of type `[Enum]` is now correctly handled ([#617](https://github.com/ForestAdmin/forest-express/issues/617)) ([98a6859](https://github.com/ForestAdmin/forest-express/commit/98a685920acf7b3723cfff106bc30fec6c468890))

## [7.9.5](https://github.com/ForestAdmin/forest-express/compare/v7.9.4...v7.9.5) (2021-01-14)


### Bug Fixes

* **forestadmin-schema:** regenerate forestadmin schema only when files are valid ([#614](https://github.com/ForestAdmin/forest-express/issues/614)) ([c26c385](https://github.com/ForestAdmin/forest-express/commit/c26c385322dd96d5f1f2b9f84988a968312cd1fb))

# [8.0.0-beta.11](https://github.com/ForestAdmin/forest-express/compare/v8.0.0-beta.10...v8.0.0-beta.11) (2021-01-08)


### Bug Fixes

* **authentication:** error when authenticating with an invalid token in cookies ([#611](https://github.com/ForestAdmin/forest-express/issues/611)) ([e6d6737](https://github.com/ForestAdmin/forest-express/commit/e6d6737c896c882ebc774ddee2be90337c787c2b))

# [8.0.0-beta.10](https://github.com/ForestAdmin/forest-express/compare/v8.0.0-beta.9...v8.0.0-beta.10) (2021-01-06)


### Bug Fixes

* user being disconnected after 33min instead of 14 days ([#610](https://github.com/ForestAdmin/forest-express/issues/610)) ([80580e7](https://github.com/ForestAdmin/forest-express/commit/80580e710a7764d1fe4d7ec912352d74594cd685))

# [8.0.0-beta.9](https://github.com/ForestAdmin/forest-express/compare/v8.0.0-beta.8...v8.0.0-beta.9) (2021-01-05)


### Bug Fixes

* send back response to frontend instead of redirecting ([#609](https://github.com/ForestAdmin/forest-express/issues/609)) ([6f37521](https://github.com/ForestAdmin/forest-express/commit/6f375212c41c5451b14d8761c7b62a3e851c8f60))

# [8.0.0-beta.8](https://github.com/ForestAdmin/forest-express/compare/v8.0.0-beta.7...v8.0.0-beta.8) (2020-12-30)


### Bug Fixes

* **auth:** oidc authentication when running multiple instances of the agent ([#608](https://github.com/ForestAdmin/forest-express/issues/608)) ([ef25acb](https://github.com/ForestAdmin/forest-express/commit/ef25acb278142e4aa933b279665245dd7bb18646))

# [8.0.0-beta.7](https://github.com/ForestAdmin/forest-express/compare/v8.0.0-beta.6...v8.0.0-beta.7) (2020-12-23)

# [8.0.0-beta.6](https://github.com/ForestAdmin/forest-express/compare/v8.0.0-beta.5...v8.0.0-beta.6) (2020-12-23)


### Bug Fixes

* display correct reference field when it is a smartfield ([#602](https://github.com/ForestAdmin/forest-express/issues/602)) ([a797a7a](https://github.com/ForestAdmin/forest-express/commit/a797a7a5f815692d75482bdbbd8782e4373b9b00))
* fix conflict between array and smart field computation ([#595](https://github.com/ForestAdmin/forest-express/issues/595)) ([ac6b9c1](https://github.com/ForestAdmin/forest-express/commit/ac6b9c19238fa7c9baebdfeb766b80b31077541c))
* fix related data list display ([#598](https://github.com/ForestAdmin/forest-express/issues/598)) ([f3c7408](https://github.com/ForestAdmin/forest-express/commit/f3c740844526653f00ffb1100175e47451eabfd5))

## [7.9.4](https://github.com/ForestAdmin/forest-express/compare/v7.9.3...v7.9.4) (2020-12-21)


### Bug Fixes

* display correct reference field when it is a smartfield ([#602](https://github.com/ForestAdmin/forest-express/issues/602)) ([a797a7a](https://github.com/ForestAdmin/forest-express/commit/a797a7a5f815692d75482bdbbd8782e4373b9b00))

## [7.9.3](https://github.com/ForestAdmin/forest-express/compare/v7.9.2...v7.9.3) (2020-12-15)


### Bug Fixes

* fix related data list display ([#598](https://github.com/ForestAdmin/forest-express/issues/598)) ([f3c7408](https://github.com/ForestAdmin/forest-express/commit/f3c740844526653f00ffb1100175e47451eabfd5))

## [7.9.2](https://github.com/ForestAdmin/forest-express/compare/v7.9.1...v7.9.2) (2020-12-11)


### Bug Fixes

* fix conflict between array and smart field computation ([#595](https://github.com/ForestAdmin/forest-express/issues/595)) ([ac6b9c1](https://github.com/ForestAdmin/forest-express/commit/ac6b9c19238fa7c9baebdfeb766b80b31077541c))

## [7.9.1](https://github.com/ForestAdmin/forest-express/compare/v7.9.0...v7.9.1) (2020-12-09)

# [8.0.0-beta.5](https://github.com/ForestAdmin/forest-express/compare/v8.0.0-beta.4...v8.0.0-beta.5) (2020-12-08)


### Bug Fixes

* **related-data:** use same reference on record for dataValues and direct attributes ([#574](https://github.com/ForestAdmin/forest-express/issues/574)) ([c65588e](https://github.com/ForestAdmin/forest-express/commit/c65588e11562380daf47af0bfd2e280a234d04d0))
* **smart-action:** do not mutate hooks on schema generation ([#580](https://github.com/ForestAdmin/forest-express/issues/580)) ([dd2aee3](https://github.com/ForestAdmin/forest-express/commit/dd2aee3de957ca558559f44473136c1d72de21c9))
* **smart-action:** widgetEdit should not be erased when change hook is triggered ([#579](https://github.com/ForestAdmin/forest-express/issues/579)) ([1014ade](https://github.com/ForestAdmin/forest-express/commit/1014adeb3979a5ab0d16db8e4533f34b7d021e35))
* **smart-actions:** error message details missing for hooks ([#582](https://github.com/ForestAdmin/forest-express/issues/582)) ([d2edf35](https://github.com/ForestAdmin/forest-express/commit/d2edf35f8e216996ff64c116bea6914c2a7bcaf5))
* **smart-actions:** reset value when not present in enums in hook response ([#584](https://github.com/ForestAdmin/forest-express/issues/584)) ([0f57a46](https://github.com/ForestAdmin/forest-express/commit/0f57a465b5be0571e55f97033db6f0436f1c02fe))
* **smart-actions:** use changedField instead of comparing values to trigger the correct change hook ([#583](https://github.com/ForestAdmin/forest-express/issues/583)) ([54d536b](https://github.com/ForestAdmin/forest-express/commit/54d536b1d3ac4aca0fc1825d76f483fb85353555))
* record not found in hooks (recordsId replaced with recordIds) ([#578](https://github.com/ForestAdmin/forest-express/issues/578)) ([ccf6a8f](https://github.com/ForestAdmin/forest-express/commit/ccf6a8fe8089551b1624ed61120e3f4aa1c9866c))


### Features

* **role-permissions:** support the new role ACL format ([#577](https://github.com/ForestAdmin/forest-express/issues/577)) ([4aed30f](https://github.com/ForestAdmin/forest-express/commit/4aed30fefabf616360a05e54e7b4c6ff71c7a038))

# [7.9.0](https://github.com/ForestAdmin/forest-express/compare/v7.8.9...v7.9.0) (2020-12-08)


### Features

* **role-permissions:** support the new role ACL format ([#577](https://github.com/ForestAdmin/forest-express/issues/577)) ([4aed30f](https://github.com/ForestAdmin/forest-express/commit/4aed30fefabf616360a05e54e7b4c6ff71c7a038))

## [7.8.9](https://github.com/ForestAdmin/forest-express/compare/v7.8.8...v7.8.9) (2020-12-08)


### Bug Fixes

* **related-data:** use same reference on record for dataValues and direct attributes ([#574](https://github.com/ForestAdmin/forest-express/issues/574)) ([c65588e](https://github.com/ForestAdmin/forest-express/commit/c65588e11562380daf47af0bfd2e280a234d04d0))

## [7.8.8](https://github.com/ForestAdmin/forest-express/compare/v7.8.7...v7.8.8) (2020-12-07)


### Bug Fixes

* **smart-actions:** reset value when not present in enums in hook response ([#584](https://github.com/ForestAdmin/forest-express/issues/584)) ([0f57a46](https://github.com/ForestAdmin/forest-express/commit/0f57a465b5be0571e55f97033db6f0436f1c02fe))

## [7.8.7](https://github.com/ForestAdmin/forest-express/compare/v7.8.6...v7.8.7) (2020-12-07)


### Bug Fixes

* **smart-actions:** use changedField instead of comparing values to trigger the correct change hook ([#583](https://github.com/ForestAdmin/forest-express/issues/583)) ([54d536b](https://github.com/ForestAdmin/forest-express/commit/54d536b1d3ac4aca0fc1825d76f483fb85353555))

## [7.8.6](https://github.com/ForestAdmin/forest-express/compare/v7.8.5...v7.8.6) (2020-12-07)


### Bug Fixes

* **smart-actions:** error message details missing for hooks ([#582](https://github.com/ForestAdmin/forest-express/issues/582)) ([d2edf35](https://github.com/ForestAdmin/forest-express/commit/d2edf35f8e216996ff64c116bea6914c2a7bcaf5))

## [7.8.5](https://github.com/ForestAdmin/forest-express/compare/v7.8.4...v7.8.5) (2020-12-04)


### Bug Fixes

* **smart-action:** do not mutate hooks on schema generation ([#580](https://github.com/ForestAdmin/forest-express/issues/580)) ([dd2aee3](https://github.com/ForestAdmin/forest-express/commit/dd2aee3de957ca558559f44473136c1d72de21c9))

## [7.8.4](https://github.com/ForestAdmin/forest-express/compare/v7.8.3...v7.8.4) (2020-12-04)


### Bug Fixes

* **smart-action:** widgetEdit should not be erased when change hook is triggered ([#579](https://github.com/ForestAdmin/forest-express/issues/579)) ([1014ade](https://github.com/ForestAdmin/forest-express/commit/1014adeb3979a5ab0d16db8e4533f34b7d021e35))

## [7.8.3](https://github.com/ForestAdmin/forest-express/compare/v7.8.2...v7.8.3) (2020-12-04)


### Bug Fixes

* record not found in hooks (recordsId replaced with recordIds) ([#578](https://github.com/ForestAdmin/forest-express/issues/578)) ([ccf6a8f](https://github.com/ForestAdmin/forest-express/commit/ccf6a8fe8089551b1624ed61120e3f4aa1c9866c))

# [8.0.0-beta.4](https://github.com/ForestAdmin/forest-express/compare/v8.0.0-beta.3...v8.0.0-beta.4) (2020-12-02)


### Bug Fixes

* **schema:** do not generate `framework`, `framework_version` to ensure equality across environments ([#556](https://github.com/ForestAdmin/forest-express/issues/556)) ([30ee17a](https://github.com/ForestAdmin/forest-express/commit/30ee17aa40da86bf61290c6707914d3eaa5174eb))
* **smart fields:** compute properly smart fields ([#570](https://github.com/ForestAdmin/forest-express/issues/570)) ([923c968](https://github.com/ForestAdmin/forest-express/commit/923c968b5b818c8acd8fa39e80c2717bebec50a3))
* **smart-actions:** transform legacy widgets in hooks ([#571](https://github.com/ForestAdmin/forest-express/issues/571)) ([f58b867](https://github.com/ForestAdmin/forest-express/commit/f58b86767cdf84012ad54dfe2c2542bc79792ee8))
* **technical:** remove useless data property from load hook controller ([#562](https://github.com/ForestAdmin/forest-express/issues/562)) ([7465982](https://github.com/ForestAdmin/forest-express/commit/7465982ed0fe2fcc4050698e8235b2783305c54d))


### Features

* **smart actions:** endpoint that handle forms' load hooks ([#546](https://github.com/ForestAdmin/forest-express/issues/546)) ([3e3c018](https://github.com/ForestAdmin/forest-express/commit/3e3c01821e9c938a35c63fc1d606ad2494f50a0a))
* **smart actions:** endpoint that handle forms' load hooks ([#565](https://github.com/ForestAdmin/forest-express/issues/565)) ([824a670](https://github.com/ForestAdmin/forest-express/commit/824a670ca41e2837473e6a77b79d99f800e5261c))


### Reverts

* **related-data:** use same reference on record for dataValues and direct attributes ([#569](https://github.com/ForestAdmin/forest-express/issues/569)) ([5e7a689](https://github.com/ForestAdmin/forest-express/commit/5e7a68903bfc63d5b90303e10c59873aa0b3d4d9))

## [7.8.2](https://github.com/ForestAdmin/forest-express/compare/v7.8.1...v7.8.2) (2020-12-01)


### Bug Fixes

* **smart-actions:** transform legacy widgets in hooks ([#571](https://github.com/ForestAdmin/forest-express/issues/571)) ([f58b867](https://github.com/ForestAdmin/forest-express/commit/f58b86767cdf84012ad54dfe2c2542bc79792ee8))

## [7.8.1](https://github.com/ForestAdmin/forest-express/compare/v7.8.0...v7.8.1) (2020-12-01)


### Bug Fixes

* **smart fields:** compute properly smart fields ([#570](https://github.com/ForestAdmin/forest-express/issues/570)) ([923c968](https://github.com/ForestAdmin/forest-express/commit/923c968b5b818c8acd8fa39e80c2717bebec50a3))


### Reverts

* **related-data:** use same reference on record for dataValues and direct attributes ([#569](https://github.com/ForestAdmin/forest-express/issues/569)) ([5e7a689](https://github.com/ForestAdmin/forest-express/commit/5e7a68903bfc63d5b90303e10c59873aa0b3d4d9))

# [7.8.0](https://github.com/ForestAdmin/forest-express/compare/v7.7.2...v7.8.0) (2020-11-30)


### Features

* **smart actions:** endpoint that handle forms' load hooks ([#565](https://github.com/ForestAdmin/forest-express/issues/565)) ([824a670](https://github.com/ForestAdmin/forest-express/commit/824a670ca41e2837473e6a77b79d99f800e5261c))

## [7.7.2](https://github.com/ForestAdmin/forest-express/compare/v7.7.1...v7.7.2) (2020-11-27)


### Bug Fixes

* **schema:** do not generate `framework`, `framework_version` to ensure equality across environments ([#556](https://github.com/ForestAdmin/forest-express/issues/556)) ([30ee17a](https://github.com/ForestAdmin/forest-express/commit/30ee17aa40da86bf61290c6707914d3eaa5174eb))

## [7.7.1](https://github.com/ForestAdmin/forest-express/compare/v7.7.0...v7.7.1) (2020-11-27)


### Bug Fixes

* **technical:** remove useless data property from load hook controller ([#562](https://github.com/ForestAdmin/forest-express/issues/562)) ([7465982](https://github.com/ForestAdmin/forest-express/commit/7465982ed0fe2fcc4050698e8235b2783305c54d))

# [8.0.0-beta.3](https://github.com/ForestAdmin/forest-express/compare/v8.0.0-beta.2...v8.0.0-beta.3) (2020-11-26)


### Features

* delete cookie when client logout ([#545](https://github.com/ForestAdmin/forest-express/issues/545)) ([#560](https://github.com/ForestAdmin/forest-express/issues/560)) ([5188206](https://github.com/ForestAdmin/forest-express/commit/51882065163f0f295b0c35f3ae0f73db64e4ec6a))

# [7.7.0](https://github.com/ForestAdmin/forest-express/compare/v7.6.0...v7.7.0) (2020-11-26)


### Features

* **smart actions:** endpoint that handle forms' load hooks ([#546](https://github.com/ForestAdmin/forest-express/issues/546)) ([3e3c018](https://github.com/ForestAdmin/forest-express/commit/3e3c01821e9c938a35c63fc1d606ad2494f50a0a))

# [8.0.0-beta.2](https://github.com/ForestAdmin/forest-express/compare/v8.0.0-beta.1...v8.0.0-beta.2) (2020-11-24)


### Features

* authenticate with openid connect ([#555](https://github.com/ForestAdmin/forest-express/issues/555)) ([72b2cc8](https://github.com/ForestAdmin/forest-express/commit/72b2cc86510caeb1e7de6593f9163b59d536bbeb))

# [8.0.0-beta.1](https://github.com/ForestAdmin/forest-express/compare/v7.6.0...v8.0.0-beta.1) (2020-11-24)


* feat!: ease the multi-database setup by providing a map of connections on liana.init (#525) ([2e9dc94](https://github.com/ForestAdmin/forest-express/commit/2e9dc94dc6ba7366798f045c457d297308c20b33)), closes [#525](https://github.com/ForestAdmin/forest-express/issues/525)


### BREAKING CHANGES

* onlyCrudModule, modelsDir, secretKey, authKey options are not supported anymore by Liana.init().
Instead of sequelize/mongoose & Sequelize/Mongoose, connections & objectMapping are now required.

# [7.6.0](https://github.com/ForestAdmin/forest-express/compare/v7.5.1...v7.6.0) (2020-11-16)


### Features

* **smart actions:** add hooks in schema file ([#535](https://github.com/ForestAdmin/forest-express/issues/535)) ([2b0283f](https://github.com/ForestAdmin/forest-express/commit/2b0283f0432b682dfef624fd06722ffae26348c5))

## [7.5.1](https://github.com/ForestAdmin/forest-express/compare/v7.5.0...v7.5.1) (2020-11-12)


### Bug Fixes

* don't compute smart fields when not requested on associated records ([#519](https://github.com/ForestAdmin/forest-express/issues/519)) ([996515b](https://github.com/ForestAdmin/forest-express/commit/996515ba5bdf340bdf2abb1a2c44d60f4c4db978))

# [7.5.0](https://github.com/ForestAdmin/forest-express/compare/v7.4.6...v7.5.0) (2020-09-09)


### Features

* serialize the new property isPrimaryKey ([#483](https://github.com/ForestAdmin/forest-express/issues/483)) ([e463d70](https://github.com/ForestAdmin/forest-express/commit/e463d70253c90cab755813f3448b92018cf71e3c))

## [7.4.6](https://github.com/ForestAdmin/forest-express/compare/v7.4.5...v7.4.6) (2020-09-07)


### Bug Fixes

* **integration:** prevent 500 errors if Intercom record is not found ([#482](https://github.com/ForestAdmin/forest-express/issues/482)) ([942e097](https://github.com/ForestAdmin/forest-express/commit/942e097f20a7e6dfdbbc18d12c0f1e3db0508210))

## [7.4.5](https://github.com/ForestAdmin/forest-express/compare/v7.4.4...v7.4.5) (2020-08-19)


### Bug Fixes

* **related-data:** use same reference on record for dataValues and direct attributes ([#470](https://github.com/ForestAdmin/forest-express/issues/470)) ([d8a5ca0](https://github.com/ForestAdmin/forest-express/commit/d8a5ca057087b76b2dae3db57d4266e4de62e780))

## [7.4.4](https://github.com/ForestAdmin/forest-express/compare/v7.4.3...v7.4.4) (2020-08-07)


### Bug Fixes

* ensure scope's value is a string ([#471](https://github.com/ForestAdmin/forest-express/issues/471)) ([332acf7](https://github.com/ForestAdmin/forest-express/commit/332acf75d8130ade1298b46223ac8c210c071949))

## [7.4.3](https://github.com/ForestAdmin/forest-express/compare/v7.4.2...v7.4.3) (2020-08-05)


### Bug Fixes

* **related data:** fix related data display regression introduced in v7.3.2 ([#469](https://github.com/ForestAdmin/forest-express/issues/469)) ([0437c5d](https://github.com/ForestAdmin/forest-express/commit/0437c5d2070cc042312cb602bfaacc5829177132))

## [7.4.2](https://github.com/ForestAdmin/forest-express/compare/v7.4.1...v7.4.2) (2020-08-05)


### Bug Fixes

* **2FA:** no warning message related to 2FA salt is displayed if you don't have any ([#468](https://github.com/ForestAdmin/forest-express/issues/468)) ([63be790](https://github.com/ForestAdmin/forest-express/commit/63be790033837b3ac9ea2f8af0544e7436daa2d1))

## [7.4.1](https://github.com/ForestAdmin/forest-express/compare/v7.4.0...v7.4.1) (2020-08-04)


### Bug Fixes

* **vulnerability:** patch a potential vulnerability updating express-jwt dependency to version 6.0.0 ([#439](https://github.com/ForestAdmin/forest-express/issues/439)) ([46cce22](https://github.com/ForestAdmin/forest-express/commit/46cce22bf88c78b5f7703e8bf460c16655cf9ac1))

# [7.4.0](https://github.com/ForestAdmin/forest-express/compare/v7.3.4...v7.4.0) (2020-07-30)


### Features

* **error-handling:** expose error-handler to be used in agents ([#462](https://github.com/ForestAdmin/forest-express/issues/462)) ([a20832f](https://github.com/ForestAdmin/forest-express/commit/a20832f30b8854951587ec7b562e56cddb52e81b))

## [7.3.4](https://github.com/ForestAdmin/forest-express/compare/v7.3.3...v7.3.4) (2020-07-27)


### Bug Fixes

* **2FA:** throw a clear error when the 2FA salt is invalid ([#456](https://github.com/ForestAdmin/forest-express/issues/456)) ([6148ad3](https://github.com/ForestAdmin/forest-express/commit/6148ad35027a31c28c91691d6da807f343e9489e))

## [7.3.3](https://github.com/ForestAdmin/forest-express/compare/v7.3.2...v7.3.3) (2020-07-13)


### Bug Fixes

* **vulnerabilities:** bump 2 dependencies of dependencies ([#450](https://github.com/ForestAdmin/forest-express/issues/450)) ([f10f222](https://github.com/ForestAdmin/forest-express/commit/f10f222ad198b38345eb4e13d9da4e33114957c3))

## [7.3.2](https://github.com/ForestAdmin/forest-express/compare/v7.3.1...v7.3.2) (2020-07-13)


### Bug Fixes

* **smart-field:** fix smart field name ([#438](https://github.com/ForestAdmin/forest-express/issues/438)) ([ba7e7f1](https://github.com/ForestAdmin/forest-express/commit/ba7e7f1b72535b79f50e221dfb2e531a3c182eba))

## [7.3.1](https://github.com/ForestAdmin/forest-express/compare/v7.3.0...v7.3.1) (2020-06-23)


### Bug Fixes

* **services:** create and expose records remover ([#432](https://github.com/ForestAdmin/forest-express/issues/432)) ([4d7d553](https://github.com/ForestAdmin/forest-express/commit/4d7d553936166ad12706ee4534662a66844f8b8d))

# [7.3.0](https://github.com/ForestAdmin/forest-express/compare/v7.2.7...v7.3.0) (2020-06-01)


### Features

* **scope:** validate scope context on list request ([#409](https://github.com/ForestAdmin/forest-express/issues/409)) ([b2ec417](https://github.com/ForestAdmin/forest-express/commit/b2ec4173bcc4fbcf09ea193b5bbebed33d9207e6))

## [7.2.7](https://github.com/ForestAdmin/forest-express/compare/v7.2.6...v7.2.7) (2020-05-29)


### Bug Fixes

* **dependencies:** update babel to fix compilation error introduced by node lts 12.17.0 ([#414](https://github.com/ForestAdmin/forest-express/issues/414)) ([ef8a2a0](https://github.com/ForestAdmin/forest-express/commit/ef8a2a0cb81e68f8bd92f85b27f3006dc3abebaf))
* **record serializer:** harmonize the usage of the RecordSerializer ([#393](https://github.com/ForestAdmin/forest-express/issues/393)) ([c5973b3](https://github.com/ForestAdmin/forest-express/commit/c5973b30dbbc2e67af5027d7078a16e9b133bf16))

## [7.2.6](https://github.com/ForestAdmin/forest-express/compare/v7.2.5...v7.2.6) (2020-05-13)


### Bug Fixes

* **package:** publish on NPM with all the necessary code ([#406](https://github.com/ForestAdmin/forest-express/issues/406)) ([7d4b912](https://github.com/ForestAdmin/forest-express/commit/7d4b9125a15f5eb6703edb76a8f299364d7fdd16))

## [7.2.5](https://github.com/ForestAdmin/forest-express/compare/v7.2.4...v7.2.5) (2020-05-07)


### Bug Fixes

* **build:** fix final issues with the slack message format ([467b460](https://github.com/ForestAdmin/forest-express/commit/467b460e98fa91646a66c43c77a3af699d41b86c))

## [7.2.4](https://github.com/ForestAdmin/forest-express/compare/v7.2.3...v7.2.4) (2020-05-07)


### Bug Fixes

* **readme:** fix the test coverage displayed in the readme ([bfae8d7](https://github.com/ForestAdmin/forest-express/commit/bfae8d7d330d2052e4f29fafa66effe8d8bacbd8))

## [7.2.3](https://github.com/ForestAdmin/forest-express/compare/v7.2.2...v7.2.3) (2020-05-06)


### Bug Fixes

* **build:** update the package version on deploy ([a640ea3](https://github.com/ForestAdmin/forest-express/commit/a640ea33cd386c6351cdf0a02abfdf02b38703e9))

## [7.2.2](https://github.com/ForestAdmin/forest-express/compare/v7.2.1...v7.2.2) (2020-05-05)


### Bug Fixes

* **vulnerability:** patch a vulnerability using the latest sinon dependency version 9.0.2 ([#385](https://github.com/ForestAdmin/forest-express/issues/385)) ([d8077f4](https://github.com/ForestAdmin/forest-express/commit/d8077f4a5edb5f5893bca53a3cf6df61185bed20))

## [7.2.1](https://github.com/ForestAdmin/forest-express/compare/v7.2.0...v7.2.1) (2020-04-29)


### Bug Fixes

* **security:** patch dependencies vulnerabilities (minimist, acorn) ([#380](https://github.com/ForestAdmin/forest-express/issues/380)) ([9a4c9c4](https://github.com/ForestAdmin/forest-express/commit/9a4c9c4ed175a0a2383ad948c4d24d9779f3aa45))

# [7.2.0](https://github.com/ForestAdmin/forest-express/compare/v7.1.0...v7.2.0) (2020-04-16)


### Features

* **smart-action:** allow users to protect their smart-action APIs from unauthorized usage ([#375](https://github.com/ForestAdmin/forest-express/issues/375)) ([4971ea7](https://github.com/ForestAdmin/forest-express/commit/4971ea73f2abc3f86a9206d61a72eae1cf62a273))

# [7.1.0](https://github.com/ForestAdmin/forest-express/compare/v7.0.7...v7.1.0) (2020-04-14)


### Features

* **integration:** allow user to choose custom mapping values for intercom integration ([#373](https://github.com/ForestAdmin/forest-express/issues/373)) ([db87b97](https://github.com/ForestAdmin/forest-express/commit/db87b978664263ef735941f7809c2e7a8c9fe8eb))

## [7.0.7](https://github.com/ForestAdmin/forest-express/compare/v7.0.6...v7.0.7) (2020-04-10)


### Bug Fixes

* **integration:** adapt intercom attributes getter for its v2 API ([#372](https://github.com/ForestAdmin/forest-express/issues/372)) ([e6b1426](https://github.com/ForestAdmin/forest-express/commit/e6b1426fac4c4937436af279c96a14ee888b83b6))

## [7.0.6](https://github.com/ForestAdmin/forest-express/compare/v7.0.5...v7.0.6) (2020-04-07)


### Bug Fixes

* **integration:** fix intercom details display ([#371](https://github.com/ForestAdmin/forest-express/issues/371)) ([c9fa48d](https://github.com/ForestAdmin/forest-express/commit/c9fa48d8f8d766825c5919edfb23adf2d67ae886))

## [7.0.5](https://github.com/ForestAdmin/forest-express/compare/v7.0.4...v7.0.5) (2020-04-07)


### Bug Fixes

* **wording:** fix a typo in the missing .forestadmin-schema.json file error message ([#369](https://github.com/ForestAdmin/forest-express/issues/369)) ([24d4672](https://github.com/ForestAdmin/forest-express/commit/24d4672fc9c83d54e2db7853bfe46d009f336fb0))

## [7.0.4](https://github.com/ForestAdmin/forest-express/compare/v7.0.3...v7.0.4) (2020-04-07)


### Bug Fixes

* **security:** bump acorn from 5.7.3 to 5.7.4 ([#368](https://github.com/ForestAdmin/forest-express/issues/368)) ([51af9b8](https://github.com/ForestAdmin/forest-express/commit/51af9b8fa15c0a6dfc1f75de2f26c76e9014e83e))

## [7.0.3](https://github.com/ForestAdmin/forest-express/compare/v7.0.2...v7.0.3) (2020-04-06)


### Bug Fixes

* **integration:** fix intercom conversations display with API v2 ([#366](https://github.com/ForestAdmin/forest-express/issues/366)) ([9069668](https://github.com/ForestAdmin/forest-express/commit/90696689b6e9c252366f1d8ff544520ab8d798c9))

## [7.0.2](https://github.com/ForestAdmin/forest-express/compare/v7.0.1...v7.0.2) (2020-03-02)


### Bug Fixes

* use export csv batch configuration in IdsFromRequestRetriever ([#365](https://github.com/ForestAdmin/forest-express/issues/365)) ([c5102c7](https://github.com/ForestAdmin/forest-express/commit/c5102c7d6a09f6908720b4ec3c8e30ee0a35214d))

## [7.0.1](https://github.com/ForestAdmin/forest-express/compare/v7.0.0...v7.0.1) (2020-02-18)


### Bug Fixes

* **ci:** build before release ([#361](https://github.com/ForestAdmin/forest-express/issues/361)) ([0a12413](https://github.com/ForestAdmin/forest-express/commit/0a1241372c9b2fae3cdd23c99e3f2051a1db2fbd))

# [7.0.0](https://github.com/ForestAdmin/forest-express/compare/v6.0.0...v7.0.0) (2020-02-17)


### Features

* make Liana.init return a promise resolving when all is up ([#355](https://github.com/ForestAdmin/forest-express/issues/355)) ([c407609](https://github.com/ForestAdmin/forest-express/commit/c407609eaa2500704ce96c4943dfbea6af7c4283))


### BREAKING CHANGES

* The init method now returns a promise.

# [6.0.0](https://github.com/ForestAdmin/forest-express/compare/v5.6.1...v6.0.0) (2020-02-17)


### Features

* **smart actions**: add a method to RecordsGetter to get all models IDs given a query or an ID list ([#346](https://github.com/ForestAdmin/forest-express/issues/346)) ([fb43abe](https://github.com/ForestAdmin/forest-express/commit/fb43abe4550c795556f4dc6bab60d381b43baa5d))


### BREAKING CHANGES

* **smart actions**: smart actions must now use this method (documentation has to be updated)

## RELEASE 5.6.1 - 2020-01-17
### Changed
- Tests - Add tests for json prettyPrint.
- Tests - Add tests for schema file updater.

### Fixed
- Login - Make the login error messages brought up to the end client through toasts more accurate.
- Schema - Schemas having fields with escaped characters are now properly saved as valid JSON.

## RELEASE 5.6.0 - 2020-01-14
### Added
- Sessions - Distinguish "CORS configuration issue" and "Server down" scenarios in case of liana login error.

### Fixed
- Linter - Do not lint uncommitted files.
- Initialization - Filter out test files when requiring models (`__tests__/*`, `*.spec.js`, `*.spec.ts`, `*.test.js` or `*.test.ts`).

## RELEASE 5.5.0 - 2020-01-02
### Added
- Tests - Add params fields deserializer test.
- Tests - Add tests for IP whitelist deserializer.
- Technical - Add SonarJS linter for complexity issues.

### Changed
- Technical - Simplify IP whitelist deserializer code.
- Smart Collections - Do not insert Smart Collections unless they contain at least one declared field.

### Fixed
- Intercom Integration - Better handling of automated messages.

## RELEASE 5.4.1 - 2019-12-11
### Fixed
- Logger - Improve formatting, add stack if present, do not display error messages twice.
- Smart actions - Ignore smart actions that do not have a name (display a warning).
- Export - Fix export on related data.

## RELEASE 5.4.0 - 2019-11-29
### Added
- Smart Relationship - Expose a serializer to simplify the serialization.

### Changed
- Technical - Upgrade `eslint-plugin-jest` devDependency to the latest version.
- Technical - Add a missing repository to lint.

## RELEASE 5.3.0 - 2019-11-26
### Added
- Technical - `.forestadmin-schema` now keeps track of engine and framework names and versions.

### Changed
- Technical - Improve linter rules for script files.
- Technical - Rename `.env.example` file.
- Technical - Upgrade `body-parser` dependency to the latest version.
- Technical - Upgrade `base32-encode` dependency to the latest version.
- Technical - Upgrade `bluebird` dependency to the latest version.
- Technical - Upgrade `cors` dependency to the latest version.
- Technical - Upgrade `http-errors` dependency to the latest version.
- Technical - Upgrade `express` dependency to the latest version.
- Technical - Upgrade `lodash` dependency to the latest version.
- Technical - Upgrade `semver` dependency to the latest version.
- Technical - Upgrade `uuid` dependency to the latest version.
- Technical - Upgrade `sinon` devDependency to the latest version.
- Technical - Upgrade `onchange` devDependency to the latest version.
- Technical - Upgrade `otplib` dependency to the latest version.
- Technical - Upgrade the dependencies of the project dependencies.
- Technical - Upgrade ESLint rules.
- Technical - Ensure that all files follow the ESLint rules.
- Technical - Upgrade `nock` devDependency to the latest version.
- Technical - Upgrade `moment` dependency to the latest version.
- Technical - Upgrade `@babel/preset-env` devDependency to the latest version.
- Technical - Upgrade `@babel/register` devDependency to the latest version.
- Technical - Upgrade `jsonapi-serializer` dependency to the latest version.
- Technical - Upgrade `winston` dependency to the latest version.

### Fixed
- Technical - Remove unused `bcryptjs` dependency.
- Schema - The `.forestadmin-schema.json` file is now written in the project directory, wherever the startup command has been hinted from.
- Smart Relationships - Prevent server crash in case of "cyclic" Smart BelongsTo declaration.

## RELEASE 5.2.0 - 2019-11-18
### Added
- Readme - Add the test coverage badge.
- Routes - Expose the record services and the permissions middleware.

### Changed
- Technical - Apply ESLint rules to all files (Auto fix).
- Technical - Use Jest instead of Mocha for the test base.

### Fixed
- Readme - Fix release instructions.
- Technical - Fix a wrong test about 2FA feature.

## RELEASE 5.1.1 - 2019-11-15
### Fixed
- Smart Relationships - Smart Relationships returns referenced Smart Fields values.

## RELEASE 5.1.0 - 2019-11-14
### Changed
- Technical - Change functions of filter parser to async.

### Fixed
- Error Handling - Fix error message when configDir does not exist.
- Continuous Integration - Change `11.14` version of `node_js` to `lts/*` in `.travis.yml`.
- Error Handling - Prevent server to crash when Forest Admin API does not respond.

## RELEASE 5.0.0 - 2019-10-31
### Changed
- Technical - Remove useless `.jshintrc` file.

### Fixed
- NPM Publish - Do not send local environment variables on package publish.
- NPM Publish - Remove Github templates from the published packages.
- NPM Publish - Remove yarn errors log file from the published packages.
- Routes - Ensure that admin middlewares are configured for admin API routes only and does not interfere with other project routes.

## RELEASE 4.0.1 - 2019-10-10
### Changed
- Technical - Apply ESLint rules to an existing code file.

### Fixed
- Initialization - Fix a bad behaviour that removes all admin API routes if the liana init is called more than once.

## RELEASE 4.0.0 - 2019-10-03
### Added
- Technical - A Release now also automatically publish the release note to Slack.

### Changed
- Readme - Add a community section.

### Fixed
- Technical - Fix a missing dependency.

## RELEASE 4.0.0-beta.5 - 2019-08-12
### Changed
- Technical - Make filters date operator parser generic through forest-express.
- Technical - Add `package-lock.json` to `.gitignore`.

## RELEASE 4.0.0-beta.4 - 2019-08-08
### Fixed
- Technical - Empty associations array on flat condition without belongsTo.

## RELEASE 4.0.0-beta.3 - 2019-08-02
### Fixed
- Error Handling - Fix error handling crash trial 2.

## RELEASE 4.0.0-beta.2 - 2019-08-02
### Fixed
- Error Handling - Fix error handling crash (regression introduced in 4.0.0-beta.1).

## RELEASE 4.0.0-beta.1 - 2019-08-01
### Changed
- Technical - Makes the JWT lighter and consistent across lianas.

### Fixed
- Technical - Set default prerelease tag to beta if nothing specified on deploy.

## RELEASE 4.0.0-beta.0 - 2019-07-31
### Changed
- Technical - Apply ESLint conventions to old files.
- Filters - Add generic filters parser to be used by forest-express-sequelize and forest-mongoose lianas.

### Fixed
- Technical - Fix pre-commit hook to avoid renamed file and add new lina at the end of the file.

## RELEASE 3.2.4 - 2019-07-24
### Fixed
- Schema - Schemas having fields with descriptions containing "\n" are now properly sent in remote environments.

## RELEASE 3.2.3 - 2019-07-23
### Fixed
- Smart Actions - Automatically add the "/" character if missing at the beginning at a Smart Action custom endpoint declaration.

## RELEASE 3.2.2 - 2019-07-16
### Fixed
- Security - Upgrade `lodash` dependency for security patch.
- Security - Upgrade `onchange` dependency for security patch.

## RELEASE 3.2.1 - 2019-06-20
### Fixed
- Schema - Schemas having fields with validations based on complex regex are now properly sent in remote environments.

## RELEASE 3.2.0 - 2019-06-17
### Added
- Configuration - The liana now requires recursively model files in `modelsDir` and customization files in `configDir`.

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
