# Thurgood

Thurgood is an automated build, testing and security tool for Appirio and topcoder utilizing Jenkins and Checkmarx.

You can run the API from the API Explorer [https://thurgood-production.herokuapp.com/explorer](https://thurgood-production.herokuapp.com/explorer) or [http://localhost:3000/explorer](http://localhost:3000/explorer) if you are running it locally. See below for more info.

You can see the job queue at [http://thurgood-queue.herokuapp.com](http://thurgood-queue.herokuapp.com)

## Overview

Thurgood is a multi-part application. Here is a high level overview of the application.

![](https://raw.githubusercontent.com/appirio-tech/thurgood/master/thurgood-process.png)

* User creates a new job one of two ways:
    * User logs into Thurgood, creates a job, uploads zipped code and submits it for processing
    * User logs into Thurgood, creates a job and a project (pointing to a github project repo), and configures commits to this repo to fire a webhook to thurgood that submits the job for processing using the code from the project repo.
* Thurgood downloads the job's zip file, unpacks it, adds in any necessary build or authentication files and pushes it to a github repo.
* Github post-commit webhook notifies Jenkins of new code. Each specific job listens for a webhook from a specific github repo. Therefore, there is a one-to-one relationship between repos and jenkins jobs.
* Jenkins pulls code, run Checkmarx scan and deploys to Salesforce if necessary.
* During the Jenkins process, it send status updates back to the API and writes to the job's log file.


## Jenkins & Checkmark

You can log into the Jenkins server at: [http://ec2-54-158-149-254.compute-1.amazonaws.com/jenkins/login](http://ec2-54-158-149-254.compute-1.amazonaws.com/jenkins/login).

## Models

### Job Model

The job is the heart of Thurgood and has the following properties:

* name - the display name of the jobs
* codeUrl - The complete URL to the zip file with the code to be processed. Either by typing in the URL or upload code to S3.
* type - The type for the job which determines some internal processing. Typically only applicable when set to 'salesforce'. Possible picklist values: `salesforce`, `other`.
* status - The current status of the job. Possible picklist values: `created`, `in progress` or `complete`.
* startTime - The datetime the job started. Set by Thurgood at runtime.
* endTime - The datetime the job finished. Set by Thurgood at runtime.
* notification - If set to 'email' it will notify the job owner when the job completes. Possible picklist values: `email', blank (null).
* steps - default is 'scan' but if set to 'all' for 'Salesforce' type jobs, will additionally deploy to a Salesforce DE org and run all tests. Possible picklist values: `scan`, `all`. 'All' should only be visible/selectable if the type is currently set to 'salesforce'.
* userId - The id job owner. Set only when the record is created.
* projectId - The id of the project that the job corresponds to. When a webhook is received that matches a project, the corresponding job will be submitted for processing. User will need to manually enter the projectId when setting up the job.
* environmentId - The testing environment (github, Jenkins job, etc) for the job. The environment is selected at runtime by Thurgood and matches the environment based upon an `available` environment with the same `type` value as the job's `type` value. After the job completes, this value should be null as the job will no longer have an environment assigned.
* createdAt - The datetime the job was created
* updatedAt - The datetime the job was last updated.

### Environment Model

The testing environment used for a job. This is a combination of a github repo, possible testing login credentials and it's associated Jenkins job.

* name - the display environment's name  
* repo - the github repo that the job's code is pushed to, e.g., `git@github.com:thurgoodpush/mocha-test`
* status - the status of the environment. Possible picklist values: `available`, `reserved`.
* type - The type of environment which is used for reserving an environment for a job. Possible picklist values: `salesforce`, `other`. Default is 'other'. At runtime, Thurgood matches the job's type with the environment's type to reserve an environment for processing.
* instanceUrl - the url for any testing environment, i.e., salesforce login url `https://login.salesforce.com`
* username - the username for any testing environment
* password - the password for any testing environment
* jobId - the job that the environment is currently assigned to. Done at runtime by Thurgood.
* createdAt - The datetime the job was created  
* updatedAt - The datetime the job was last updated.  

### Project Model

The project is used to automatically submit a job when Thurgood receives a webhook from another project github repo. See the instructions below.

* name - the display name of the project.
* repo - the :user/:repo that Thurgood will receive the webhook from when new code is pushed, e.g., `jeffdonthemic/github-push-test`
* description - some description of the project.
* userId - The id job owner. Set only when the record is created.
* jobId - the job that is submitted when a webhook is received.
* createdAt - The datetime the job was created  
* updatedAt - The datetime the job was last updated.  

**See /test/setup.js for sample data.**

## Salesforce Jobs

This is important.... for Saleforce jobs the files need be all be contained in an `src` root folder as the build process specifically looks for that directory.

Either add files to a `src` directory or create it from your Eclipse project with the manifest structure. Just right click on the 'src' directory from Eclipse and zip up everything you want submitted. Your zip file should unzip in the following structure:

![](https://raw.githubusercontent.com/appirio-tech/thurgood/master/submission-structure.png)

**See the sample-salesforce.zip file in the project root for an example.**

### Setting up a project

Thurgood can automatically pull code from your project's github and submit a corresponding job each time you make a commit to your project's repo. First, create a new job record with the repo as :user/:repo (e.g., `jeffdonthemic/github-push-test` and then create a job using the id of this newly create project.

In your project's github repo, make the `squirrelforce` github user a collaborator on your repo and create a webhook for `push` events with the payload URL of `https://thurgood-production.herokuapp.com/webhook`. You will also need the `secret` which you can find once you log into Thurgood and click the create new project button.


## API Explorer

The documentation for the API is available at the API Explorer. The API is locked down so you'll need to authenticate first and then set the returned id as the access token in the upper right.

### Authentication

You can use the default admin user to authenticate and return an access_token. Username is `thurgood` and the password is set via an environment variable `THURGOOD_ADMIN_PASSWORD`. Use the StrongLoop API Explorer (https://thurgood-production.herokuapp.com:3000/explorer) with the User/login request section or POST to https://thurgood-production.herokuapp.com/Users/login with the following JSON.

```
{
  "username": "thurgood",
  "password": THURGOOD_ADMIN_PASSWORD
}
```
The resulting id is the access token when can be appended to all endpoints:

https://thurgood-production.herokuapp.com/api/jobs?access_token=ACCESS_TOKEN


## Testing

Mocha tests uses a `test` MongoDB connection (`mongodb://localhost/thurgood-test`). Check the file in /server/datasources.test.json for more details. The /test/setup.js script runs before each set of test and populates the test database. You can modify test data there but you shouldn't need to.

You will need to add some settings to your local .env files. First copy `.env-sample` and rename it `.env`. If you want to actually push code to a github repo, you'll need to add your `GITHUB_USERNAME` and `GITHUB_PASSWORD`. You'll also need change the `repo` setting for each each of the environments in the /test/setup.js file so that your user can push to these repos.

To run the mocha tests, run the application in one terminal tab:

```
source .env
NODE_ENV=test nodemon .
```

Run the test in another terminal tab:

```
source .env
npm test
```
