import random
import boto3

def lambda_handler(event, context):
    # TODO implement
    
    user_message = str.lower(event['msg'])
    client = boto3.client('lex-runtime')
    userId = event['email']
    userId = userId.replace("@", ":")
    
    response = client.post_text(
        botName='EventCreate',
        botAlias='events',
        userId= userId,
        inputText = user_message
    )
    
    return response['message']