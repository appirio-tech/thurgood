# Thurgood

## Overview

Thurgood is a multi-part application. Here is a high level overview of the application.

* User log into Thurgood, creates a job and submits it for processing.
* Thurgood downloads the job's zip file, uppacks it, adds in any necessary build or authentication files and pushes it to a github repo.
* Github post-commit webhook notifies Jenkins of new code.
* Jenkins pulls code, run Checkmarx scan and deploys to Salesforce if necessary. 

## Job

A job has the following parameters:

* codeUrl - The complete URL to the zip file with the code to be processed.
* language - The primary language of the code, e.g., Java, Apex.
* platform - The platform for the code. Typically only applicable when set to 'Salesforce'. 
* project - The associated project. Not being used at this time.
* status - The current status of the job, i.e., created, in progress or complete.
* startTime - The datetime the job started
* endTime - The datetime the job finished
* notification - If set to 'email' it will notify the job owner when the job completes.
* steps - default is 'scan' but if set to 'all' for 'Salesforce' platform jobs, will additionally deploy to a Salesforce DE org and run all tests.
* user - The job owner
* createdAt - The datetime the job was created
* updatedAt - The datetime the job was last updated.

See /test/setup.js for sample data.

## Authentication

You can use the default admin user to authenticate and return an access_token. Username is `thurgood` and the password is set via an environment variable `THURGOOD_ADMIN_PASSWORD`. Use the StrongLoop API Explorer (http://localhost:3000/explorer) with the User/login request section or POST to http://localhost:3000/Users/login with the following JSON.

```
{ 
  "username": "thurgood", 
  "password": THURGOOD_ADMIN_PASSWORD
}
```
The resulting id is the access token when can be appended to all endpoints:

http://localhost:3000/api/jobs?access_token=ACCESS_TOKEN


## Testing

Mocha tests uses a `test` MongoDB connection (`mongodb://localhost/thurgood-test`). Check the file in /server/datasources.test.json for more details. The /test/setup.js script runs before each set of test and populates the test database. You can modify test data there.

Run the application in one terminal tab:

```
source .env
NODE_ENV=test nodemon .
```

Run the test in another terminal tab:

```
source .env
npm test
```

## Todos

Set status (created) and any other other properties when created
bake in salesforce ant files
