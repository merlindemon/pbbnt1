import json
import boto3
from urllib.parse import unquote_plus
from datetime import datetime
import os
TRANSACTIONS_TABLENAME = 'pbbnttransactions-' + os.environ["ENV"]
DATA_TABLENAME = 'dynamo317d232a-' + os.environ["ENV"]

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
            },
            'body': json.dumps("")
        }
    elif method == 'GET':
        query_string_parameters = event['queryStringParameters']
        key = 'Search'
        if key in query_string_parameters:
            player_id = query_string_parameters['Search']
            player_id = unquote_plus(player_id)
            ids_array = player_id.split(",")
            result_array = []
            for identifier in ids_array:
                query_kwargs = {
                    'TableName': TRANSACTIONS_TABLENAME,
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
                if len(data['Items']) > 0:
                    for item in data['Items']:
                        result_array.append(item)

            return {
                'statusCode': 200,
                'headers': {
                    'Access-Control-Allow-Headers': '*',
                    'Access-Control-Allow-Origin': '*',
                    'Access-Control-Allow-Methods': 'OPTIONS,POST,GET'
                },
                'body': json.dumps(result_array)
            }
    elif method == 'POST':
        # Get item to see if it exists, gather list of ids
        body = event['body']
        body = json.loads(body)
        amount = float(body["amount"])
        identifiers = body["ids"].split(",")
        now = datetime.now()
        depositdate = now.strftime("%Y-%m-%d %H:%M:%S")

        profits = {}
        playernames = {}
        for identifier in identifiers:
            query_kwargs = {
                'TableName': DATA_TABLENAME,
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
            playernames[identifier] = data['Items'][0]['Player']['S']
            profits[identifier] = float(data['Items'][0]['Profit']['N'])
        final_identifier = ""
        if amount > 0:
            transactiontype = "Deposit"
            for identifier in profits:
                if not final_identifier:
                    final_identifier = identifier
                else:
                    if profits[identifier] < profits[final_identifier]:
                        final_identifier = identifier
        else:
            transactiontype = "Withdrawal"
            for identifier in profits:
                if not final_identifier:
                    final_identifier = identifier
                else:
                    if profits[identifier] > profits[final_identifier]:
                        final_identifier = identifier

        print(final_identifier)
        put_kwargs = {
            'TableName': TRANSACTIONS_TABLENAME,
            'Item': {
                'ID': {'S': final_identifier},
                'Date': {'S': str(depositdate)},
                'Type': {'S': str(transactiontype)},
                'Amount': {'N': str(amount)},
            }
        }
        client.put_item(**put_kwargs)
        update_kwargs = {
            'TableName': DATA_TABLENAME,
            'UpdateExpression': "add Profit :p",
            'Key': {'ID': {'S': str(final_identifier)}, 'Player': {
                'S': str(playernames[final_identifier])}},
            'ExpressionAttributeValues': {
                ':p': {"N": str(amount)},
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
            'body': json.dumps('POST Complete')
        }
    else:
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Headers': '*',
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'OPTIONS,PUT,GET,DELETE'
            },
            'body': json.dumps('Success')
        }
