# Thurgood API v2 (Node & Angular)

Thurgood is the codename for our proprietary toolset that provides automated build and testing of CloudSpokes challenge submissions. This service automates the process of testing and reviewing submitted code for quality, coverage, and other various coding standards. After queuing submissions based on platform, Thurgood taps into various services to deliver code review, including Cloudbees, Checkmarx, JSLint, PhantomJS, Checkstyle, and more. The status of submissions is available from individual Papertrail accounts.

## Local Development

Please contact support@cloudspokes.com with the subject "Thurgood v2 Connection Parameters" to receive connection parameters to Mongodb, etc.

```
# clone this repo locally
npm install
touch .env
# copy the contents from .env-example to .env
# add in any settings emailed from support@cloudspokes.com
foreman start
```

You should now be able to go to http:://localhost:3001 and see the welcome message. The API routes are all at /api/1. So going to http://localhost:3001/api/1/jobs will display all of the current jobs.

The Angular frontend should be available from http://localhost:3001.

**Please see the [wiki](https://github.com/cloudspokes/thurgood/wiki) for complete documentation.**

