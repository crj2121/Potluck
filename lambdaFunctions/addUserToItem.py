import boto3
import json

def lambda_handler(event, context):
   
    db = boto3.resource('dynamodb')
    
    eventsTable = db.Table('potluck_events')
   
    eventFromDb = eventsTable.get_item(
        Key={
            "id": event['id']
        })['Item']
        
    itemList = eventFromDb['itemList']
    for item in itemList:
        print(item['name'])
        if item['name'] == event["name"]:
            item['user'] = event['email']
            eventsTable.update_item(
                Key={
                    "id": event['id']
                },
                UpdateExpression='SET itemList = :newItm',
                ExpressionAttributeValues={
                    ':newItm': itemList
                }
            )
            return 'successfully added user to item'
    
    return "Could not find item with that name"
    
    