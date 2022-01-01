import json
import boto3
from urllib.parse import unquote_plus


def handler(event, context):
    print('received event:')
    print(event)
    queryStringParameters = event['queryStringParameters']
    ids = queryStringParameters['Search']
    ids = unquote_plus(ids)
    ids_array = ids.split(",")
    result_array = []

    client = boto3.client('dynamodb')
    for identifier in ids_array:
        data = client.query(
            TableName='dynamo317d232a-dev',
            # IndexName='playername',
            KeyConditionExpression='#id = :value',
            ExpressionAttributeValues={
                ':value': {
                    'S': identifier
                }
            },
            ExpressionAttributeNames={
                '#id': 'ID'
            }
        )
        if(len(data['Items']) > 0):
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
