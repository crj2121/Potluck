function getId()
{
    var url = window.location.href;
    var result = url.split("id=");
    if (result.length == 2) {
        return result[1]
    }

}

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

    getEventInfo();
}

function hasNull(target) {
    for (var member in target) {
        if (target[member] == "")
            return true;
    }
    return false;
}

function getEventInfo()
{
    var params = {
    };

    var body = {
        "id": Number(getId()),
    };

    var additionalParams = {
    };

    if (hasNull(body)) {
        alert('Not a valid event...')
        window.location.href = 'https://s3.us-east-1.amazonaws.com/potluckapp/events.html';
    }

    apigClient.geteventPost(params, body, additionalParams)
    .then(function(result){
      // Add success callback code here.
      console.log(result);
      //botMessage(result['data']);
    }).catch(function(result){
      // Add error callback code here.
      console.log(result);
      alert('Not a valid event...')
      window.location.href = 'https://s3.us-east-1.amazonaws.com/potluckapp/events.html';
      //botMessage(result['data']);
    });
}