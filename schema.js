/**
 * Use the schema to set a field's type. This will be used for parameter parsing
 *  - [] or {}          = json
 *  - new ObjectID()    = MongoDB object id
 *  - null              = any primitive type
 *  - any other value   = this is the default value that the field will have for newly created
 *                        documents unless it is overwritten by a parameter (will be sent as-is)
 *                        
 * Exceptions: _id, createdAt and updatedAt will be overwritten
 * when the document is created so their values here don't matter
 */

var ObjectID = require('mongodb').ObjectID;

/**
 * Schema document for the servers collection
 * @type {Object}
 */
exports.server = {
  _id: null,
  createdAt: null,
  installedServices: [],
  instanceUrl: null,
  jobId: null,
  languages: [],
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
  options: [],
  loggerId: null,
  platform: null,
  startTime: null,
  updatedAt: null,
  userId: null,
  status: 'created'
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
  papertrailId: null,
  syslogHostname: null,
  syslogPort: null,
  updatedAt: null
};
