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
      $('#eventName').text(result.data.name);
      $('#host').append(result.data.createdBy);
      $('#time').append(result.data.eventTime);
      $('#location').append(result.data.location);
      $('#type').append(result.data.eventType);
      $('#date').append(result.data.eventDate);
      handleItems(result.data.items);
      handleComments(result.data.messages);
      handleGuests(result.data.guests);
      //botMessage(result['data']);
    }).catch(function(result){
      // Add error callback code here.
      console.log(result);
      alert('Not a valid event...')
      window.location.href = 'https://s3.us-east-1.amazonaws.com/potluckapp/events.html';
      //botMessage(result['data']);
    });
}

function handleItems(items)
{
  var listContainer = $('#itemlist');

  for (i in items) {
    // add new list item
    item = items[i]
    listContainer.prepend('<li> '+item+ '</li>');
    console.log(i);
  }
}
function handleComments(comments)
{
  var listContainer = $('#Eventlist');

  for (i in comments) {
    // add new list item
    comment = comments[i]
    listContainer.prepend('<li> ' +comment.userEmail+ ': ' +comment.text+ '</li>');
    console.log(i);
  }
}
function handleGuests(guests)
{
  var listContainer = $('#guestlist');

  for (i in guests) {
    // add new list item
    guest = guests[i]
    listContainer.prepend('<li> '+guest+ '</li>');
    console.log(i);
  }
}
function addComment()
{
    var params = {
    };

    var body = {
        "id": Number(getId()),
        "text": $('#eventC').val(),
        "userEmail": useremail
    };

    var additionalParams = {
    };

    if (hasNull(body)) {
        return;
    }

    apigClient.addmessagetoeventPost(params, body, additionalParams)
    .then(function(result){
      // Add success callback code here.
      console.log(result);
      
      var listContainer = $('#Eventlist');
      inputValue = $('#eventC').val();

      // add new list item
      listContainer.prepend('<li> ' +useremail+ ': ' +inputValue+ '</li>');
      // clear value input
      $('#eventC').val('');
      //botMessage(result['data']);
    }).catch(function(result){
      // Add error callback code here.
      console.log(result);
      alert('Not a valid event...')
      window.location.href = 'https://s3.us-east-1.amazonaws.com/potluckapp/events.html';
      //botMessage(result['data']);
    });
}