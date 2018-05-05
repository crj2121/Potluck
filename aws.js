AWS.config.region = 'us-east-1';

var apigClient = null;

var params = {
};

var body = {
    "msg": "",
    "userID": ""
};

var additionalParams = {
};

function getCredentials() {

    $.ajax({
        url: 'https://potluck.auth.us-east-1.amazoncognito.com/oauth2/token',
        type: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
        },
        data: {
            grant_type: 'authorization_code',
            redirect_uri: 'https://s3.us-east-1.amazonaws.com/potluckapp/output.html',
            code: getCode(),
            client_id: '35j5presqtu0273l89ap9lm5bn'
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

        },
        error: function( jqXhr, textStatus, errorThrown ) {
            console.log( jqXhr );
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

getCredentials()