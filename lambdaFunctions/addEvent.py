import boto3
import json
import random
from datetime import date


def lambda_handler(event, context):
    db = boto3.resource('dynamodb')
    
    eventsTable = db.Table('potluck_events')
    id = random.randint(1,10000000)
    today = str(date.today())
    
    eventsTable.put_item(
        Item={
            'name': event['name'],
            'eventType': event['eventType'],
            'messages': [],
            'itemList': [],
            'creationDate': today,
            'eventTime': event['eventTime'],
            'eventDate': event['eventDate'],
            'location': event['location'],
            'id': id,
            'guests': [],
            'createdBy': event['email']
        }
    )
    
    usersTable = db.Table('potluck_users')
    userInfo = usersTable.get_item(
        Key={
            "email":event["email"]
        })['Item']
    userEvents = userInfo["myEvents"]
    if id not in userEvents:
        userEvents.append(id)
        print(userEvents)
        usersTable.update_item(
            Key={
                "email": event['email']
            },
            UpdateExpression='SET myEvents = :newItm',
            ExpressionAttributeValues={
                ':newItm': userEvents
            }
        )
    
        
    return id
