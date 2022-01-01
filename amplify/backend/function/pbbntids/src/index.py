import json
import base64
import io
import boto3
from urllib.parse import unquote_plus


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
            email = queryStringParameters['Search']
            email = unquote_plus(email)
            data = client.query(
                TableName='pbbntids-dev',
                KeyConditionExpression='#name = :value',
                ExpressionAttributeValues={
                    ':value': {
                        'S': email
                    }
                },
                ExpressionAttributeNames={
                    '#name': 'email'
                }
            )
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
            data = client.scan(
                TableName='pbbntids-dev'
            )
            return {
                'statusCode': 200,
                'headers': {
                    'Access-Control-Allow-Headers': '*',
                    'Access-Control-Allow-Origin': '*',
                    'Access-Control-Allow-Methods': 'OPTIONS,PUT,GET,DELETE'
                },
                'body': json.dumps(data)
            }

    elif(method == 'PUT'):
        # Get item to see if it exists, gather list of ids
        body = event['body']
        body = json.loads(body)
        email = body["email"]
        id = body["id"]
        data = client.query(
            TableName='pbbntids-dev',
            KeyConditionExpression='#name = :value',
            ExpressionAttributeValues={
                ':value': {
                    'S': email
                }
            },
            ExpressionAttributeNames={
                '#name': 'email'
            }
        )
        if(data['Count'] == 0):
            # Doesn't yet exist,create it
            response = client.put_item(
                TableName="pbbntids-dev",
                Item={
                    'email': {
                        'S': email
                    },
                    'ids': {
                        'L': [{
                            'S': id
                        }]
                    }
                }
            )
        elif(data['Count'] > 0):
            # Already has an ID, so append a new id
            previous_ids = data['Items'][0]['ids']['L']
            unique_ids = {id}
            for id in previous_ids:
                unique_ids.add(id['S'])
            print(unique_ids)
            ids_array = []
            for id in unique_ids:
                ids_array.append({'S': id})
            ids = json.loads(json.dumps(ids_array))
            response = client.put_item(
                TableName="pbbntids-dev",
                Item={
                    'email': {
                        'S': email
                    },
                    'ids': {
                        'L': ids
                    }
                }
            )

        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Headers': '*',
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'OPTIONS,PUT,GET,DELETE'
            },
            'body': json.dumps('PUT Complete')
        }
    elif(method == 'DELETE'):
        # Get item to see if it exists, gather list of ids
        body = event['body']
        body = json.loads(body)
        email = body["email"]
        request_id = body["id"]
        print(request_id)
        data = client.query(
            TableName='pbbntids-dev',
            KeyConditionExpression='#name = :value',
            ExpressionAttributeValues={
                ':value': {
                    'S': email
                }
            },
            ExpressionAttributeNames={
                '#name': 'email'
            }
        )
        if(data['Count'] == 0):
            # Doesn't exists, so ignore
            print('nothing to delete')
        else:
            previous_ids = data['Items'][0]['ids']['L']
            unique_ids = {request_id}
            unique_ids.remove(str(request_id))
            for id in previous_ids:
                unique_ids.add(id['S'])
            unique_ids.remove(request_id)
            ids_array = []
            for id in unique_ids:
                ids_array.append({'S': id})
            ids = json.loads(json.dumps(ids_array))
            response = client.put_item(
                TableName="pbbntids-dev",
                Item={
                    'email': {
                        'S': email
                    },
                    'ids': {
                        'L': ids
                    }
                }
            )
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Headers': '*',
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'OPTIONS,PUT,GET,DELETE'
            },
            'body': json.dumps('DELETE Complete')
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
