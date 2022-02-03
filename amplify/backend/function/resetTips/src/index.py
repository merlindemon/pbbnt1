import json
import boto3
import os

TABLENAME = 'dynamo317d232a-' + os.environ["ENV"]


def handler(event, context):
    print('received event:')
    print(event)
    method = event['httpMethod']

    if method == 'DELETE':
        client = boto3.client('dynamodb')
        scan_kwargs = {'TableName': TABLENAME}
        response = client.scan(**scan_kwargs)
        items = response['Items']

        for player in items:
            update_kwargs = {
                'TableName': TABLENAME,
                'UpdateExpression': "set Tips=:t",
                'Key': {
                    'ID': {
                        'S': player['ID']['S']
                    },
                    'Player': {
                        'S': player['Player']['S']
                    }
                },
                'ExpressionAttributeValues': {
                    ':t': {
                        "N": "0"
                    }
                }
            }
            client.update_item(**update_kwargs)

    return {
        'statusCode': 200,
        'headers': {
            'Access-Control-Allow-Headers': '*',
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'OPTIONS,POST,GET,DELETE'
        },
        'body': json.dumps('Update Complete')
    }
