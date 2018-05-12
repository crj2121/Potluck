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
        if item['name'] == event["name"]:
            return 'Item name already exists. Please use another name'
    
    newItem = {
        "description": event['description'],
        "name": event['name'],
        "quantity": event["quantity"],
        "user": None
    }
    
    itemList.append(newItem)
    print('aloha', itemList)
    
    
    eventsTable.update_item(
        Key={
            "id": event['id']
        },
        UpdateExpression='SET itemList = :newItm',
        ExpressionAttributeValues={
            ':newItm': itemList
        }
    )
    return 'successfully added item to DB'
    