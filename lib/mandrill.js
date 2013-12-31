var mandrill = require('mandrill-api/mandrill');
var mandrill_client = new mandrill.Mandrill(process.env.MANDRILL_API_KEY);

exports.sendMail = function(api, job) {

  var message = {
      "html": "<p>Your Thurgood job has been completed. You can view the job logs <a href='" + api.configData.general.appUrl + "/#/jobs/"+job._id+"/events'>here</a>.</p>",
      "text": "Your Thurgood job has been completed. You can view the job logs at " + api.configData.general.appUrl + "/#/jobs/"+job._id+"/events.</p>",
      "subject": "Job " + job._id + " Complete",
      "from_email": process.env.SUPPORT_EMAIL,
      "from_name": "Thurgood",
      "to": [{
              "email": job.email,
              "type": "to"
          }],
      "headers": {
          "Reply-To": process.env.SUPPORT_EMAIL
      }
  };

  mandrill_client.messages.send({"message": message}, function(result) {
      console.log(result);
      /*
      [{
              "email": "recipient.email@example.com",
              "status": "sent",
              "reject_reason": "hard-bounce",
              "_id": "abc123abc123abc123abc123abc123"
          }]
      */
  }, function(e) {
      // Mandrill returns the error as an object with name and message keys
      console.log('A mandrill error occurred: ' + e.name + ' - ' + e.message);
      // A mandrill error occurred: Unknown_Subaccount - No subaccount exists with the id 'customer-123'
  });

}