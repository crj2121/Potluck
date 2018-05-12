import boto3
import json
from boto3.dynamodb.conditions import Key, Attr

def lambda_handler(event, context):
    db = boto3.resource('dynamodb')
    usersTable = db.Table('potluck_users')
    eventsTable = db.Table('potluck_events')


    user = usersTable.get_item(Key={'email': event['email']})
    if 'Item' not in user:
        print('this is a new user', user)
    
        #get events this user has already been invited to and add to invitedEvents
        potentialInvitedEvents = []
        listofEvents = eventsTable.scan(
        FilterExpression = Attr('guests').contains(event['email'])
        )["Items"]
            
        for anEvent in listofEvents:
            potentialInvitedEvents.append(anEvent['id'])
        
        
        #add User to DB 
        usersTable.put_item(
            Item={
                'email': event["email"],
                'myEvents': [],
                'invitedEvents': potentialInvitedEvents,
                'name': event["name"],
                'username': event['username']
            }
        )
        
        
        return "created new user"
    else:
        return "user already exists"
