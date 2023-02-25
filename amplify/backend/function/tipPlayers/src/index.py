import json
import boto3
import os

GAMEDATA_TABLE = 'dynamo317d232a-' + os.environ["ENV"]
IDS_TABLE = 'pbbnttids-' + os.environ["ENV"]
TRANSACTIONS_TABLE = 'pbbnttransactions-' + os.environ["ENV"]

def handler(event, context):
    print('received event:')
    print(event)
    method = event['httpMethod']

    if method == 'POST':
        client = boto3.client('dynamodb')
        scan_kwargs = {'TableName': IDS_TABLE}
        response = client.scan(**scan_kwargs)
        items = response['Items']

        from datetime import datetime, timedelta
        import time
        dt = datetime.now()
        td = timedelta(days=42)
        my_date = dt + td
        ttl = int(time.mktime(my_date.timetuple()))

        for player in items:
            for identifier in player['ids']:
                identifier = identifier['S']
                query_kwargs = {
                    'TableName': GAMEDATA_TABLE,
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
                data = client.query(**query_kwargs)
                
                id_items = data['Items'][0]
                playername = id_items['Player']
                profit = id_items['Profit']
                tips =  id_items['Tips']
                tips_percentage = (player['tipsPercentage'] / 100)
                rakeback = (tips * tips_percentage)
                profit = profit + rakeback

                update_kwargs = {
                    'TableName': GAMEDATA_TABLE,
                    'UpdateExpression': "set Profit=:p",
                    'Key': {
                        'ID': {
                            'S': identifier
                        },
                        'Player': {
                            'S': player['Player']['S']
                        }
                    },
                    'ExpressionAttributeValues': {
                        ':p': {
                            "N": str(profit)
                        }
                    }
                }
                client.update_item(**update_kwargs)

                put_kwargs = {
                    'TableName': TRANSACTIONS_TABLE,
                    'Item': {
                        'ID': {'S': str(identifier)},
                        'Date': {'S': str(dt)},
                        'Type': {'S': "Rakeback"},
                        'Amount': {'N': str(rakeback)},
                        'TTL': {'N':str(ttl)}
                    }
                }
                client.put_item(**put_kwargs)

    return {
        'statusCode': 200,
        'headers': {
            'Access-Control-Allow-Headers': '*',
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'OPTIONS,POST,GET,DELETE'
        },
        'body': json.dumps('Update Complete')
    }
