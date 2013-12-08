exports.routes = {
  get: [
    { path: "/:apiVersion/servers/:id", action: "serversFetch" },
    { path: "/:apiVersion/servers", action: "serversFetch" },
    { path: "/:apiVersion/accounts/:id", action: "accountsFetch" },
    { path: "/:apiVersion/accounts", action: "accountsFetch" },
    { path: "/:apiVersion/loggers/:id", action: "loggersFetch" },
    { path: "/:apiVersion/loggers", action: "loggersFetch" },
    { path: "/:apiVersion/jobs/:id/complete", action: "jobsComplete" },
    { path: "/:apiVersion/jobs/:id", action: "jobsFetch" },
    { path: "/:apiVersion/jobs", action: "jobsFetch" },
    { path: "/:apiVersion/pt/token/:key", action: "ptFetchToken" },
    { path: "/auth/google/return", action: "googleAuthReturn" },
    { path: "/auth/google", action: "googleAuthStart" }
  ],

  post: [
    { path: "/:apiVersion/servers", action: "serversCreate" },
    { path: "/:apiVersion/accounts", action: "accountsCreate" },
    { path: "/:apiVersion/loggers", action: "loggersCreate" },
    { path: "/:apiVersion/jobs/:id/message", action: "jobsMessage" },
    { path: "/:apiVersion/jobs/:id/publish", action: "jobsPublish" }, 
    { path: "/:apiVersion/jobs", action: "jobsCreate" }
  ],

  put: [
    { path: "/:apiVersion/servers/:id", action: "serversUpdate" },
    { path: "/:apiVersion/loggers/:id", action: "loggersUpdate" },
    { path: "/:apiVersion/jobs/:id/submit", action: "jobsSubmit" },
    { path: "/:apiVersion/jobs/:id", action: "jobsUpdate" }
  ],

  delete: [
    { path: "/:apiVersion/accounts/:id", action: "accountsDelete" },
    { path: "/:apiVersion/loggers/:id", action: "loggersDelete" }
  ]
};
