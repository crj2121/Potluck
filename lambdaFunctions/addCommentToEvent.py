import boto3
import json
import time

def lambda_handler(event, context):
   
    db = boto3.resource('dynamodb')
    
    eventsTable = db.Table('potluck_events')
   
    eventFromDb = eventsTable.get_item(
        Key={
            "id": event['id']
        })['Item']
        
    messages = eventFromDb['messages']
    newMsg = {
        "text": event['text'],
        "timestamp": int(time.time()),
        "userEmail": event['userEmail']
    }
    messages.append(newMsg)
    print('aloha', messages)
    
    eventsTable.update_item(
        Key={
            "id": event['id']
        },
        UpdateExpression='SET messages = :newMsg',
        ExpressionAttributeValues={
            ':newMsg': messages
        }
    )
    return 'success'