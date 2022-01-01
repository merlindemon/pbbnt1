import json
import base64
import io
import pandas as pd
import boto3


def handler(event, context):
    print('received event:')
    print(event)
    method = event['httpMethod']

    client = boto3.client('dynamodb')

    if(method == 'GET'):
        data = client.scan(
            TableName='dynamo317d232a-dev'
        )
        # data = response['Items']
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Headers': '*',
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'OPTIONS,POST,GET'
            },
            'body': json.dumps(data)
        }
    else:
        body = event['body']
        body = json.loads(body)
        data = base64.b64decode(body["data"])
        toread = io.BytesIO()
        toread.write(data)
        toread.seek(0)
        df = pd.read_csv(toread)
        result = df.to_json(orient="split")
        print(result)
        data = json.loads(result)["data"]

        gamedate = ""
        for player in data:
            if(player[9] != None):
                gamedate = player[9]
            data = client.query(
                TableName='dynamo317d232a-dev',
                KeyConditionExpression='#id = :value',
                ExpressionAttributeValues={
                    ':value': {
                        'S': player[2]
                    }
                },
                ExpressionAttributeNames={
                    '#id': 'ID'
                }
            )
            # Create Transaction data
            response = client.put_item(
                TableName="pbbnttransactions-dev",
                Item={
                    'ID': {'S': str(player[2])},
                    'Date': {'S': str(gamedate)},
                    'Type': {'S': "Game"},
                    'Amount': {'N': str(player[4])},
                }
            )
            if(len(data['Items']) == 1):
                # Do update as the userid already is present/has an bank
                response = client.update_item(
                    TableName="dynamo317d232a-dev",
                    UpdateExpression="add Hands :h, Profit :p, BuyIn :b, Tips :t",
                    Key={'ID': {'S': str(player[2])}, 'Player': {
                        'S': str(player[1])}},
                    ExpressionAttributeValues={
                        ':h': {"N": str(player[3])},
                        ':p': {"N": str(player[4])},
                        ':b': {"N": str(player[5])},
                        ':t': {"N": str(player[6])}
                    }
                )
                response = client.update_item(
                    TableName="dynamo317d232a-dev",
                    UpdateExpression="set #r=:r",
                    Key={'ID': {'S': str(player[2])}, 'Player': {
                        'S': str(player[1])}},
                    ExpressionAttributeValues={
                        ':r': {"N": str(player[0])}
                    },
                    ExpressionAttributeNames={
                        '#r': "Rank"
                    }
                )
            else:
                # Create Game Data
                response = client.put_item(
                    TableName="dynamo317d232a-dev",
                    Item={
                        'ID': {'S': str(player[2])},
                        'Rank': {'N': str(player[0])},
                        'Player': {'S': str(player[1])},
                        'Hands': {'N': str(player[3])},
                        'Profit': {'N': str(player[4])},
                        'BuyIn': {'N': str(player[5])},
                        'Tips': {'N': str(player[6])},
                    }
                )
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Headers': '*',
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'OPTIONS,POST,GET'
            },
            'body': json.dumps('POST Complete')
        }
