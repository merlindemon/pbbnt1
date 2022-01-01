import json
import boto3


def handler(event, context):
    print('received event:')
    print(event)
    method = event['httpMethod']

    if(method == 'DELETE'):
        client = boto3.client('dynamodb')
        response = client.scan(
            TableName='dynamo317d232a-dev'
        )
        items = response['Items']

        for player in items:
            response = client.update_item(
                TableName="dynamo317d232a-dev",
                UpdateExpression="set Hands=:h",
                Key={'ID': {'S': player['ID']['S']},
                     'Player': {'S': player['Player']['S']}},
                ExpressionAttributeValues={
                    ':h': {"N": "0"}
                }
            )

    return {
        'statusCode': 200,
        'headers': {
            'Access-Control-Allow-Headers': '*',
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'OPTIONS,POST,GET,DELETE'
        },
        'body': json.dumps('Update Complete')
    }
