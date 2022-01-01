import json
import base64
import io
import boto3
from urllib.parse import unquote_plus
from datetime import datetime


def handler(event, context):
    print('received event:')
    print(event)
    method = event['httpMethod']

    client = boto3.client('dynamodb')

    if(method == 'OPTIONS'):
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Headers': '*',
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'OPTIONS,PUT,GET,DELETE'
            },
            'body': json.dumps("")
        }
    elif(method == 'GET'):
        queryStringParameters = event['queryStringParameters']
        key = 'Search'
        if(key in queryStringParameters):
            player_id = queryStringParameters['Search']
            player_id = unquote_plus(player_id)
            ids_array = player_id.split(",")
            result_array = []
            for identifier in ids_array:
                data = client.query(
                    TableName='pbbnttransactions-dev',
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
    elif(method == 'POST'):
        # Get item to see if it exists, gather list of ids
        body = event['body']
        body = json.loads(body)
        amount = body["amount"]
        id = body["id"]
        playername = body["playername"]
        now = datetime.now()
        depositdate = now.strftime("%Y-%m-%d %H:%M:%S")
        if(float(amount) > 0):
            transactiontype = "Deposit"
        else:
            transactiontype = "Withdrawal"
        # Doesn't yet exist,create it
        response = client.put_item(
            TableName="pbbnttransactions-dev",
            Item={
                'ID': {'S': id},
                'Date': {'S': str(depositdate)},
                'Type': {'S': str(transactiontype)},
                'Amount': {'N': str(amount)},
            }
        )
        response = client.update_item(
            TableName="dynamo317d232a-dev",
            UpdateExpression="add Profit :p",
            Key={'ID': {'S': str(id)}, 'Player': {
                'S': str(playername)}},
            ExpressionAttributeValues={
                ':p': {"N": str(amount)},
            }
        )
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
