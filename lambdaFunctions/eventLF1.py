"""
This sample demonstrates an implementation of the Lex Code Hook Interface
in order to serve a sample bot which manages reservations for hotel rooms and car rentals.
Bot, Intent, and Slot models which are compatible with this sample can be found in the Lex Console
as part of the 'BookTrip' template.

For instructions on how to set up and test this bot, as well as additional samples,
visit the Lex Getting Started documentation http://docs.aws.amazon.com/lex/latest/dg/getting-started.html.
"""

import json
import datetime
import time
import os
import dateutil.parser
import logging
import boto3
import random
from datetime import date


# --- Helpers that build all of the responses ---


def elicit_slot(session_attributes, intent_name, slots, slot_to_elicit, message):
    return {
        'sessionAttributes': session_attributes,
        'dialogAction': {
            'type': 'ElicitSlot',
            'intentName': intent_name,
            'slots': slots,
            'slotToElicit': slot_to_elicit,
            'message': message
        }
    }


def confirm_intent(session_attributes, intent_name, slots, message):
    return {
        'sessionAttributes': session_attributes,
        'dialogAction': {
            'type': 'ConfirmIntent',
            'intentName': intent_name,
            'slots': slots,
            'message': message
        }
    }


def close(session_attributes, fulfillment_state, message, event):
    if fulfillment_state == 'Fulfilled':
        print(event)
        name = event['currentIntent']['slots']['EventName']
        eventType = event['currentIntent']['slots']['EventType']
        eventLocation = event['currentIntent']['slots']['EventLocation']
        eventDate = event['currentIntent']['slots']['EventDate']
        eventTime =  event['currentIntent']['slots']['EventTime']
        eventId = random.randint(1,5000000)
        new_message = '<a href="https://s3.us-east-1.amazonaws.com/potluckapp/event.html?id='+str(eventId)+'">Your Event</a>'

        response = {
            'sessionAttributes': session_attributes,
            'dialogAction': {
                'type': 'Close',
                'fulfillmentState': fulfillment_state,
                'message': new_message
            }
        }
        
        db = boto3.resource('dynamodb')
        eventsTable = db.Table('potluck_events')
        eventsTable.put_item(
            Item={
                'name': name,
                'eventType': eventType,
                'messages': [],
                'itemList': [],
                'creationDate': str(date.today()),
                'eventTime': eventTime,
                'eventDate': eventDate,
                'location': eventLocation,
                'id': eventId,
                'guests': [],
                'createdBy': event['userId'].replace(":", "@") if True else 'fredrick'
            }
        )
        
        usersTable = db.Table('potluck_users')
        userInfo = usersTable.get_item(
            Key={
                "email":event['userId'].replace(":", "@")
            })['Item']
        userEvents = userInfo["myEvents"]
        if eventId not in userEvents:
            userEvents.append(eventId)
            print(userEvents)
            usersTable.update_item(
                Key={
                    "email": event['userId'].replace(":", "@")
                },
                UpdateExpression='SET myEvents = :newItm',
                ExpressionAttributeValues={
                    ':newItm': userEvents
                }
            )
        return response
    
    response = {
        'sessionAttributes': session_attributes,
        'dialogAction': {
            'type': 'Close',
            'fulfillmentState': fulfillment_state,
            'message': message
        }
    }

    return response


def delegate(session_attributes, slots):
    return {
        'sessionAttributes': session_attributes,
        'dialogAction': {
            'type': 'Delegate',
            'slots': slots
        }
    }


# --- Helper Functions ---


def safe_int(n):
    """
    Safely convert n value to int.
    """
    if n is not None:
        return int(n)
    return n


def try_ex(func):
    """
    Call passed in function in try block. If KeyError is encountered return None.
    This function is intended to be used to safely access dictionary.

    Note that this function would have negative impact on performance.
    """

    try:
        return func()
    except KeyError:
        return None



def isvalid_date(date):
    try:
        dateutil.parser.parse(date)
        return True
    except ValueError:
        return False


def build_validation_result(isvalid, violated_slot, message_content):
    return {
        'isValid': isvalid,
        'violatedSlot': violated_slot,
        'message': {'contentType': 'PlainText', 'content': message_content}
    }

    
def validate_time(time):
    print time
    return True


def validate_reservation(slots):
    eventName = try_ex(lambda: slots['EventName'])
    eventType = try_ex(lambda: slots['eventType'])
    eventLocation = try_ex(lambda: slots['eventLocation'])
    eventDate = try_ex(lambda: slots['eventDate'])
    eventTime = try_ex(lambda: slots['eventTime'])
    
    if eventTime and not validate_time(eventTime):
         return build_validation_result(
            False,
            'EventTime',
            'Invalid Event Time. Can you try a different time'.format(dining_time))
    if eventType and not isinstance(eventType, str):
        return build_validation_result(
            False,
            'EventType',
            'Invalid Event Type. Can you try a different type')
    if eventLocation and not isinstance(eventLocation, str):
        return build_validation_result(
            False,
            'EventLocation',
            'Invalid Event Location. Can you try a different location')
    if eventDate and not isvalid_date(eventDate):
        return build_validation_result(
            False,
            'EventDate',
            'Invalid Event Date. Can you try a different date')
    return {'isValid': True}
    
        
        
    
""" --- Functions that control the bot's behavior --- """

def greeting_response(intent_request):
    confirmation_status = intent_request['currentIntent']['confirmationStatus']
    session_attributes = intent_request['sessionAttributes'] if intent_request['sessionAttributes'] is not None else {}
     
    return close(
        session_attributes,
        'Fulfilled',
        {
            'contentType': 'PlainText',
            'content': 'Hello there, how may I help you?'
        },
        event
    )
    
def thanks_response(intent_request):
    confirmation_status = intent_request['currentIntent']['confirmationStatus']
    session_attributes = intent_request['sessionAttributes'] if intent_request['sessionAttributes'] is not None else {}
     
    return close(
        session_attributes,
        'Fulfilled',
        {
            'contentType': 'PlainText',
            'content': 'You are welcome!'
        },
        event
    )
    
def makeEvent(intent_request):
    eventName = try_ex(lambda: intent_request['currentIntent']['slots']['eventName'])
    eventType = try_ex(lambda: intent_request['currentIntent']['slots']['eventType'])
    eventLocation = try_ex(lambda: intent_request['currentIntent']['slots']['eventLocation'])
    eventDate = try_ex(lambda: intent_request['currentIntent']['slots']['eventDate'])
    eventTime =  try_ex(lambda: intent_request['currentIntent']['slots']['eventTime'])
    
    
    confirmation_status = intent_request['currentIntent']['confirmationStatus']

    session_attributes = intent_request['sessionAttributes'] if intent_request['sessionAttributes'] is not None else {}
    #print(sess)
    # Load confirmation history and track the current reservation.
    event = json.dumps({
        'eventName': eventName,
        'eventType': eventType,
        'eventLocation': eventLocation,
        'eventDate': eventDate,
        'eventTime': eventTime
    })

    session_attributes['currentReservation'] = event

    if intent_request['invocationSource'] == 'DialogCodeHook':
        # Validate any slots which have been specified.  If any are invalid, re-elicit for their value
        validation_result = validate_reservation(intent_request['currentIntent']['slots'])
        if not validation_result['isValid']:
            slots = intent_request['currentIntent']['slots']
            slots[validation_result['violatedSlot']] = None

            return elicit_slot(
                session_attributes,
                intent_request['currentIntent']['name'],
                slots,
                validation_result['violatedSlot'],
                validation_result['message']
            )

        session_attributes['currentReservation'] = event
        return delegate(session_attributes, intent_request['currentIntent']['slots'])

    # Booking the hotel.  In a real application, this would likely involve a call to a backend service.
    #logger.debug('book meal under={}'.format(reservation))

    session_attributes['lastConfirmedReservation'] = event

    return close(
        session_attributes,
        'Fulfilled',
        {
            'contentType': 'PlainText',
            'content': 'You are all set.'
        },
        intent_request
    )

# --- Intents ---


def dispatch(intent_request):
    """
    Called when the user specifies an intent for this bot.
    """

    #logger.debug('dispatch userId={}, intentName={}'.format(intent_request['userId'], intent_request['currentIntent']['name']))

    intent_name = intent_request['currentIntent']['name']
    # Dispatch to your bot's intent handlers
    if intent_name == 'BookCar':
        return makeEvent(intent_request)
    elif intent_name == 'GreetingIntent':
        return greeting_response(intent_request)
    elif intent_name == 'ThankYouIntent':
        return thanks_response(intent_request)

    raise Exception('Intent with name ' + intent_name + ' not supported')


# --- Main handler ---


def lambda_handler(event, context):
    """
    Route the incoming request based on intent.
    The JSON body of the request is provided in the event slot.
    """
    # By default, treat the user request as coming from the America/New_York time zone.
    os.environ['TZ'] = 'America/New_York'
    time.tzset()
    #logger.debug('event.bot.name={}'.format(event['bot']['name']))
    return dispatch(event)
