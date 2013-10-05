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
  createdAt: null,
  updatedAt: null,
  _id: null
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
  userId: null,
  codeUrl: null,
  options: null,
  startTime: null,
  endTime: null,
  createdAt: null,
  updatedAt: null,
  _id: null
};

/**
 * Schema document for the apiKeys collection
 * @type {Object}
 */
exports.apiKey = {
  description: null,
  access_key: null,
  createdAt: null,
  updatedAt: null,
  _id: null
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
  createdAt: null,
  updatedAt: null,
  _id: null
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
  createdAt: null,
  updatedAt: null,
  _id: null
};
