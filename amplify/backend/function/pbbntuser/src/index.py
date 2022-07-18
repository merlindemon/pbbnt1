import json
import boto3
from urllib.parse import unquote_plus
import os
TABLENAME = 'dynamo317d232a-' + os.environ["ENV"]

def handler(event, context):
    print('received event:')
    print(event)
    query_string_parameters = event['queryStringParameters']
    ids = query_string_parameters['Search']
    ids = unquote_plus(ids)
    ids_array = ids.split(",")
    result_array = []

    dynamodb_client = boto3.client('dynamodb')
    for identifier in ids_array:
        query_kwargs = {
            'TableName': TABLENAME,
            'KeyConditionExpression': '#id = :value',
            'ExpressionAttributeNames': {
                '#id': 'ID'
            },
            'ExpressionAttributeValues': {
                ':value': {
                    'S': identifier
                }
            }
        }
        data = dynamodb_client.query(**query_kwargs)
        if len(data['Items']) > 0:
            result_array.append(data['Items'][0])

    return {
        'statusCode': 200,
        'headers': {
            'Access-Control-Allow-Headers': '*',
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'OPTIONS,POST,GET'
        },
        'body': json.dumps(result_array)
    }
