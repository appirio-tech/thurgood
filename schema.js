/**
 * Schema document for the servers collection
 * @type {Object}
 */
exports.server = {
  name: null,
  status: null,
  instanceUrl: null,
  operatingSystem: null,
  installedServices: null,
  languages: null,
  platform: null,
  repoName: null,
  username: null,
  password: null,
  jobId: null,
  createdAt: new Date().getTime(),
  updatedAt: new Date().getTime()
};

/**
 * Schema document for the jobs collection
 * @type {Object}
 */
exports.job = {
  status: null,
  email: null,
  platform: null,
  language: null,
  papertrailSystem: null,
  jobId: null,
  userId: null,
  codeUrl: null,
  options: null,
  startTime: null,
  endTime: null,
  createdAt: new Date().getTime(),
  updatedAt: new Date().getTime()
};

/**
 * Schema document for the apiKeys collection
 * @type {Object}
 */
exports.apiKey = {
  description: null,
  access_key: null,
  createdAt: new Date().getTime(),
  updatedAt: new Date().getTime()
};

/**
 * Schema document for the loggerAccounts collection
 * @type {Object}
 */
exports.loggerAccount = {
  name: null,
  email: null,
  papertrailId: null,
  papertrailApiToken: null,
  createdAt: new Date().getTime(),
  updatedAt: new Date().getTime()
};

/**
 * Schema document for the loggerSystems collection
 * @type {Object}
 */
exports.loggerSystem = {
  name: null,
  papertrailId: null,
  loggerAccountId: null,
  papertrailAccountId: null,
  syslogHostname: null,
  syslogPort: null,
  createdAt: new Date().getTime(),
  updatedAt: new Date().getTime()
};
