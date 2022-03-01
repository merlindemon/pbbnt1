import json
import boto3
from urllib.parse import unquote_plus
import os
import re

IDS_TABLENAME = 'pbbntids-' + os.environ["ENV"]


def handler(event, context):
    print('received event:')
    print(event)
    method = event['httpMethod']

    client = boto3.client('dynamodb')

    if method == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Headers': '*',
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'OPTIONS,PUT,GET,DELETE'
            }
        }
    elif method == 'GET':
        # key1 = 'queryStringParameters'
        key2 = 'Search'
        print(event['queryStringParameters'])
        if event['queryStringParameters'] is not None and key2 in event[
                'queryStringParameters']:
            query_str_params = event['queryStringParameters']
            email = query_str_params['Search']
            print(email)
            email = unquote_plus(email)
            email = email.lower()
            print(email)
            query_kwargs = {
                'TableName': IDS_TABLENAME,
                'KeyConditionExpression': '#name = :value',
                'ExpressionAttributeNames': {
                    '#name': 'email'
                },
                'ExpressionAttributeValues': {
                    ':value': {
                        'S': email
                    }
                }
            }
            data = client.query(**query_kwargs)
            return {
                'statusCode': 200,
                'headers': {
                    'Access-Control-Allow-Headers': '*',
                    'Access-Control-Allow-Origin': '*',
                    'Access-Control-Allow-Methods': 'OPTIONS,POST,GET'
                },
                'body': json.dumps(data)
            }
    elif method == 'PUT':
        # Get item to see if it exists, gather list of ids
        body = event['body']
        body = json.loads(body)
        email = body["email"]
        email = email.lower()
        if re.match("\w+@", email):
            comment = body["comment"]
            update_kwargs = {
                'TableName': IDS_TABLENAME,
                'UpdateExpression': "set #c=:c",
                'Key': {
                    'email': {
                        'S': str(email)
                    }
                },
                'ExpressionAttributeValues': {
                    ':c': {
                        "S": str(comment)
                    }
                },
                'ExpressionAttributeNames': {
                    '#c':"comment"
                }
            }
            client.update_item(**update_kwargs)

        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Headers': '*',
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'OPTIONS,PUT,GET,DELETE'
            },
            'body': json.dumps('PUT Complete')
        }
    else:
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Headers': '*',
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'OPTIONS,PUT,GET,DELETE'
            },
            'body': json.dumps('Unknown Method')
        }
