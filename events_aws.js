var seconds = new Date() / 1000;

AWS.config.region = 'us-east-1';

var cognitoidentityserviceprovider = new AWS.CognitoIdentityServiceProvider();

var apigClient = null;

var params = {
};

var username = localStorage.getItem("potluck_username");
var accesskey = localStorage.getItem("potluck_accesskey");
var secretkey = localStorage.getItem("potluck_secretkey");
var refreshtoken = localStorage.getItem("potluck_refreshkey")
var lastrefresh = localStorage.getItem("potluck_refreshtime");
var name = localStorage.getItem("potluck_name");
var useremail = localStorage.getItem("potluck_useremail");

if (seconds - Number(lastrefresh) >= 3600) {
    if (getCode() == null) {
        window.location.href = 'https://potluck.auth.us-east-1.amazoncognito.com/login?response_type=code&client_id=61p6o2cr8beppbmgpfp018stut&redirect_uri=https%3A%2F%2Fs3.us-east-1.amazonaws.com%2Fpotluckapp%2Fevents.html';
    }
    else{
        getCredentials();
        $('#user_name').append(name);
        $('#user_email').append(useremail);
        getEvents();
        sendUser();
    }
}
else {
    apigClient = apigClientFactory.newClient({
                  region: 'us-east-1',
                  accessKey: accesskey,
                  secretKey: secretkey,
                  sessionToken: refreshtoken
                });

    $('#user_name').append(name);
    $('#user_email').append(useremail);
    getEvents();
    sendUser();
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
                localStorage.setItem("potluck_accesskey", AWS.config.credentials.data.Credentials.AccessKeyId);
                localStorage.setItem("potluck_secretkey", AWS.config.credentials.data.Credentials.SecretKey);
                localStorage.setItem("potluck_refreshkey", AWS.config.credentials.data.Credentials.SessionToken);
                localStorage.setItem("potluck_refreshtime", seconds);
                accesskey = AWS.config.credentials.data.Credentials.AccessKeyId;
                secretkey = AWS.config.credentials.data.Credentials.SecretKey;
                refreshtoken = AWS.config.credentials.data.Credentials.SessionToken;
                lastrefresh = seconds;
            });        
            
            var userParams = {
              AccessToken: data.access_token /* required */
            };
            console.log(userParams)

            cognitoidentityserviceprovider.getUser(userParams, function(err, data) {
              if (err) console.log(err, err.stack); // an error occurred
              else{
                user = data;
                console.log(data)
                localStorage.setItem("potluck_username", data.Username);
                //body["username"] = data.Username;

                for (let i=0; i<4; i++){
                    if (data.UserAttributes[i].Name == "email"){
                        localStorage.setItem("potluck_useremail", data.UserAttributes[i].Value);
                        useremail = data.UserAttributes[i].Value;
                        $('#user_email').append(data.UserAttributes[i].Value);
                    }
                    if (data.UserAttributes[i].Name == "name"){
                        localStorage.setItem("potluck_name", data.UserAttributes[i].Value);
                        name = data.UserAttributes[i].Value;
                        $('#user_name').append(data.UserAttributes[i].Value);
                    }
                }
                
                
                }
            });

        },
        error: function( jqXhr, textStatus, errorThrown ) {
            console.log( jqXhr );
            alert(jqXhr.responseText);
            window.location.href = 'https://potluck.auth.us-east-1.amazoncognito.com/login?response_type=code&client_id=61p6o2cr8beppbmgpfp018stut&redirect_uri=https%3A%2F%2Fs3.us-east-1.amazonaws.com%2Fpotluckapp%2Fevents.html';
            //botMessage('Please visit Sign-In Page again. Invalid Code.');
        }
    });
}

function getCode()
{
    var url = window.location.href;
    var result = url.split("code=");
    if (result.length == 2) {
        return result[1]
    }

}

function sendUser()
{
    var params = {
    };

    var body = {
        "email": useremail,
        "name": name,
        "username": username
    };

    var additionalParams = {
    };

    apigClient.verifyuserPost(params, body, additionalParams)
    .then(function(result){
      // Add success callback code here.
      console.log(result);
      //botMessage(result['data']);
    }).catch( function(result){
      // Add error callback code here.
      console.log(result)
      //botMessage(result['data']);
    });
}

function createNewEvent()
{
    var params = {
    };

    var body = {
        "name": $('#event_name').val(),
        "eventType": $('#event_type').val(),
        "eventTime": $('#event_time').val(),
        "location": $('#event_loc').val(),
        "email": useremail,
        "eventDate": $('event_date').val()
    };

    var additionalParams = {
    };

    if (hasNull(body)) {
        alert('Please fill out all fields')
        return null;
    }

    apigClient.createeventPost(params, body, additionalParams)
    .then(function(result){
      // Add success callback code here.
      console.log(result);
      //botMessage(result['data']);
    }).catch(function(result){
      // Add error callback code here.
      console.log(result)
      //botMessage(result['data']);
    });
}

function getEvents()
{
    var params = {
    };

    var body = {
        "email": useremail
    };

    var additionalParams = {
    };

    apigClient.geteventsPost(params, body, additionalParams)
    .then(function(result){
      // Add success callback code here.
      console.log(result);
      for (let i=0; i<result.data.invitedEvents.length; i++){
        $('#invited_events').append($(
            '\
            <li>\
                ' + result.data.invitedEvents[i].name + '\
            </li>\
            '
        ));
      }
      for (let i=0; i<result.data.myEvents.length; i++){
        //$('#my_events').append(result.data.myEvents[i].name);
        $('#my_events').append($(
            '\
            <li>\
                ' + result.data.myEvents[i].name + '\
            </li>\
            '
        ));
      }
      //botMessage(result['data']);
    }).catch( function(result){
      // Add error callback code here.
      console.log(result)
      //botMessage(result['data']);
    });
}

function hasNull(target) {
    for (var member in target) {
        if (target[member] == "")
            return true;
    }
    return false;
}