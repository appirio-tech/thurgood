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
# start redis
foreman start
```

You should now be able to go to [http://localhost:5000](http://localhost:5000) and see the welcome page. The API routes are all at /api/1. So going to [http://localhost:5000/api/1/jobs](http://localhost:5000/api/1/jobs) will display all of the current jobs.

The Angular frontend should be available from [http://localhost:5000](http://localhost:5000).

## API Keys
An API key is required for each call to the API. See the [API Keys page](https://github.com/cloudspokes/thurgood/wiki/API-Keys) for more info.

**Please see the [wiki](https://github.com/cloudspokes/thurgood/wiki) for complete documentation.** The documentation provides sample cURL statements for API calls with a Token that is passed in the header. At this time, the token is not being used so it can be safely be submitted.

