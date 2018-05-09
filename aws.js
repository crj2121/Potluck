var seconds = new Date() / 1000;

AWS.config.region = 'us-east-1';

var cognitoidentityserviceprovider = new AWS.CognitoIdentityServiceProvider();

var apigClient = null;

var username = localStorage.getItem("potluck_username");
var accesskey = localStorage.getItem("potluck_accesskey");
var secretkey = localStorage.getItem("potluck_secretkey");
var refreshtoken = localStorage.getItem("potluck_refreshkey")
var lastrefresh = localStorage.getItem("potluck_refreshtime");
var name = localStorage.getItem("potluck_name");
var useremail = localStorage.getItem("potluck_useremail");
var eventowner = '';

if (username == null || seconds - Number(lastrefresh) >= 3600) {
    alert('Please sign-in again');
    window.location.href = 'https://potluck.auth.us-east-1.amazoncognito.com/login?response_type=code&client_id=61p6o2cr8beppbmgpfp018stut&redirect_uri=https%3A%2F%2Fs3.us-east-1.amazonaws.com%2Fpotluckapp%2Fevents.html';
}
else {
    apigClient = apigClientFactory.newClient({
                  region: 'us-east-1',
                  accessKey: accesskey,
                  secretKey: secretkey,
                  sessionToken: refreshtoken
                });
    $('#input-message').val('I want to make an event');
    userMessage();
}



function getCredentials() {

    $.ajax({
        url: 'https://potluck.auth.us-east-1.amazoncognito.com/oauth2/token',
        type: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
        },
        data: {
            grant_type: 'authorization_code',
            redirect_uri: 'https://s3.us-east-1.amazonaws.com/potluckapp/events.html',
            code: getCode(),
            client_id: '61p6o2cr8beppbmgpfp018stut'
        },
        success: function (data) {
            console.info(data);
            body['userID'] = data.id_token.substring(1,78);
            AWS.config.credentials = new AWS.CognitoIdentityCredentials({
                IdentityPoolId: "us-east-1:c869e7b3-f1e2-45ec-91b6-7aaee7bfa374",
                Logins: {
                    'cognito-idp.us-east-1.amazonaws.com/us-east-1_RznkMfxz7': data.id_token
                },
            }, {
                region: 'us-east-1',
            });
            AWS.config.credentials.refresh(function(err){
                console.log(err);
                apigClient = apigClientFactory.newClient({
                  region: 'us-east-1',
                  accessKey: AWS.config.credentials.data.Credentials.AccessKeyId,
                  secretKey: AWS.config.credentials.data.Credentials.SecretKey,
                  sessionToken: AWS.config.credentials.data.Credentials.SessionToken
                });
            });
            
            var userParams = {
              AccessToken: data.access_token /* required */
            };
            console.log(userParams)

            cognitoidentityserviceprovider.getUser(userParams, function(err, data) {
              if (err) console.log(err, err.stack); // an error occurred
              else{
                user = data;
                body["username"] = data.Username;
                }
            });

        },
        error: function( jqXhr, textStatus, errorThrown ) {
            console.log( jqXhr );
            //botMessage('Please visit Sign-In Page again. Invalid Code.');
        }
    });
}

function botMessage(bot_message) {
    
    if (bot_message == '') {
        return false;
    }

    $('#feed').append($(
        '\
        <div class = "botMessage">\
            <div class = "bot-text">EventBot</div>\
            <div class="card-content">' + bot_message + '</div>\
        </div>\
        '
    ));

    $('#feed').scrollTop(10000);
}

function userMessage() {

    $('#feed').append($(
        '\
        <div class = "userMessage">\
            <div class = "user-text">You</div>\
            <div class="card-content">' + $('#input-message').val() + '</div>\
        </div>\
        '
    ));
    
    
    $('#feed').scrollTop(10000);
    sendMessage();
}



function getCode()
{
    var url = window.location.href;
    var result = url.split("code=");
    if (result.length == 2) {
        return result[1]
    }

}

function sendMessage() {
    var params = {
    };

    var body = {
          "msg": $('#input-message').val(),
          "email": useremail
      };

    var additionalParams = {
      };
    
    if (apigClient == null) {
        botMessage('Please visit Sign-In Page again. Unable to verify identity.');
    }
    $('#input-message').val('');

    apigClient.chatbotPost(params, body, additionalParams)
    .then(function(result){
      // Add success callback code here.
      console.log(result);
      botMessage(result['data']);
    }).catch( function(result){
      // Add error callback code here.
      console.log(result)
      botMessage(result['data']);
    });
}