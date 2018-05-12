import boto3
import json

def lambda_handler(event, context):
    db = boto3.resource('dynamodb')
    eventsTable = db.Table('potluck_events')
    
    eventItem = eventsTable.get_item(
        Key={
            "id":event['id']
        })
    if "Item" in eventItem:
        return eventItem['Item']
    else:
        return "Event with this ID does not exist"