import boto3
import json

def lambda_handler(event, context):
   
    db = boto3.resource('dynamodb')
    usersTable = db.Table('potluck_users')
    eventsTable = db.Table('potluck_events')
   
    usersFrom = usersTable.get_item(
        Key={
            "email": event['email']
        })['Item']
        
    userCreatedEvents = []
    userInvitedEvents = []
    
    for idC in  usersFrom['myEvents']:
        eventInfo = eventsTable.get_item(
            Key={
                "id": idC
            })['Item']
        userCreatedEvents.append(eventInfo)
        
    for idI in  usersFrom['invitedEvents']:
        eventInfo = eventsTable.get_item(
            Key={
                "id": idI
            })['Item']
        userInvitedEvents.append(eventInfo)
    
    userEvents = {
        "myEvents": userCreatedEvents,
        "invitedEvents": userInvitedEvents
    }
    return userEvents