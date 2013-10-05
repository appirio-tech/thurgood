/**
 * Schema document for the servers collection
 * @type {Object}
 */
exports.server = {
  _id: null,
  createdAt: null,
  installedServices: null,
  instanceUrl: null,
  jobId: null,
  languages: null,
  name: null,
  operatingSystem: null,
  password: null,
  platform: null,
  repoName: null,
  status: null,
  updatedAt: null,
  username: null
};

/**
 * Schema document for the jobs collection
 * @type {Object}
 */
exports.job = {
  _id: null,
  codeUrl: null,
  createdAt: null,
  email: null,
  endTime: null,
  language: null,
  options: null,
  papertrailSystem: null,
  platform: null,
  startTime: null,
  updatedAt: null,
  userId: null,
  status: null
};

/**
 * Schema document for the apiKeys collection
 * @type {Object}
 */
exports.apiKey = {
  _id: null,
  access_key: null,
  createdAt: null,
  description: null,
  updatedAt: null
};

/**
 * Schema document for the loggerAccounts collection
 * @type {Object}
 */
exports.loggerAccount = {
  _id: null,
  createdAt: null,
  email: null,
  name: null,
  papertrailApiToken: null,
  papertrailId: null,
  updatedAt: null
};

/**
 * Schema document for the loggerSystems collection
 * @type {Object}
 */
exports.loggerSystem = {
  _id: null,
  createdAt: null,
  loggerAccountId: null,
  name: null,
  papertrailAccountId: null,
  papertrailId: null,
  syslogHostname: null,
  syslogPort: null,
  updatedAt: null
};
