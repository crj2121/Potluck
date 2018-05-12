import boto3
import json

def lambda_handler(event, context):
   
    db = boto3.resource('dynamodb')
    usersTable = db.Table('potluck_users')
    eventsTable = db.Table('potluck_events')
    
    currentEvent = eventsTable.get_item(
            Key={
                "id": event["id"]
            })['Item']
    
    currentEventGuests = currentEvent['guests']
            
    for email in event['emails']:
    
        potentialUser = usersTable.get_item(
            Key={
                "email": email
            })
        if "Item" in potentialUser:
            potentialUserInvited = potentialUser['Item']['invitedEvents']
            potentialUserInvited.append(event['id'])
            
            #add the appended invitedEvents list into the db
            usersTable.update_item(
                Key={
                    "email": email
                },
                UpdateExpression='SET invitedEvents = :newItm',
                ExpressionAttributeValues={
                    ':newItm': potentialUserInvited
                }
            )
            
        #add the email to the guest list of an event
        currentEventGuests.append(email)
        
        #send an invite email
        message = "Greetings from Potluck! <br> You've been invited to the event, {}! Go to the link below to sign in to Potluck and accept the invitation!<br><br> <a href='{}'>Potluck!</a>".format(currentEvent['name'], 'https://s3.us-east-1.amazonaws.com/potluckapp/index.html')
        print(message)
        # This address must be verified with Amazon SES.
        SENDER = "jcb2254@columbia.edu"
        
        # Replace recipient@example.com with a "To" address. If your account 
        # is still in the sandbox, this address must be verified.
        RECIPIENT = email
        
        # Specify a configuration set. If you do not want to use a configuration
        # set, comment the following variable, and the 
        # ConfigurationSetName=CONFIGURATION_SET argument below.
        #CONFIGURATION_SET = "ConfigSet"
        
        # If necessary, replace us-west-2 with the AWS Region you're using for Amazon SES.
        AWS_REGION = "us-east-1"
        
        # The subject line for the email.
        SUBJECT = "You've Been Invited!"
        
        # The email body for recipients with non-HTML email clients.
        BODY_TEXT = message
                    
        # The HTML body of the email.
        BODY_HTML = """<html>
        <head></head>
        <body>
          <h1>Potluck Event Invitation</h1>
          <p>{}</p>
        </body>
        </html>
                    """.format(message)          
        
        # The character encoding for the email.
        CHARSET = "UTF-8"
        
        # Create a new SES resource and specify a region.
        emailClient = boto3.client('ses',region_name=AWS_REGION)
        
        # Try to send the email.
        try:
            #Provide the contents of the email.
            response = emailClient.send_email(
                Destination={
                    'ToAddresses': [
                        RECIPIENT,
                    ],
                },
                Message={
                    'Body': {
                        'Html': {
                            'Charset': CHARSET,
                            'Data': BODY_HTML,
                        },
                        'Text': {
                            'Charset': CHARSET,
                            'Data': BODY_TEXT,
                        },
                    },
                    'Subject': {
                        'Charset': CHARSET,
                        'Data': SUBJECT,
                    },
                },
                Source=SENDER,
                # If you are not using a configuration set, comment or delete the
                # following line
                #ConfigurationSetName=CONFIGURATION_SET,
            )
        # Display an error if something goes wrong. 
        except ClientError as e:
            print(e.response['Error']['Message'])
        else:
            print("Email sent! Message ID:"),
            print(response['ResponseMetadata']['RequestId'])

    eventsTable.update_item(
        Key={
            "id": event['id']
        },
        UpdateExpression='SET guests = :newItm',
        ExpressionAttributeValues={
            ':newItm': currentEventGuests
        }
    )
    
    
    
        