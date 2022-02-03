import json
import boto3
from urllib.parse import unquote_plus
import os
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
        if event['queryStringParameters'] is not None and key2 in event['queryStringParameters']:
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
        else:
            scan_kwargs = {'TableName': IDS_TABLENAME}
            data = client.scan(**scan_kwargs)
            return {
                'statusCode': 200,
                'headers': {
                    'Access-Control-Allow-Headers': '*',
                    'Access-Control-Allow-Origin': '*',
                    'Access-Control-Allow-Methods': 'OPTIONS,PUT,GET,DELETE'
                },
                'body': json.dumps(data)
            }

    elif method == 'PUT':
        # Get item to see if it exists, gather list of ids
        body = event['body']
        body = json.loads(body)
        email = body["email"]
        email = email.lower()
        identifier = body["id"]
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
        if data['Count'] == 0:
            # Doesn't yet exist,create it
            put_kwargs = {
                'TableName': IDS_TABLENAME,
                'Item': {
                    'email': {
                        'S': email
                    },
                    'ids': {
                        'L': [{
                            'S': identifier
                        }]
                    }
                }
            }
            client.put_item(**put_kwargs)
        elif data['Count'] > 0:
            # Already has an ID, so append a new id
            previous_ids = data['Items'][0]['ids']['L']
            unique_ids = {identifier}
            for identifier in previous_ids:
                unique_ids.add(identifier['S'])
            print(unique_ids)
            ids_array = []
            for identifier in unique_ids:
                ids_array.append({'S': identifier})
            ids = json.loads(json.dumps(ids_array))
            put_kwargs = {
                'TableName': IDS_TABLENAME,
                'Item': {
                    'email': {
                        'S': email
                    },
                    'ids': {
                        'L': ids
                    }
                }
            }
            client.put_item(**put_kwargs)

        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Headers': '*',
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'OPTIONS,PUT,GET,DELETE'
            },
            'body': json.dumps('PUT Complete')
        }
    elif method == 'DELETE':
        # Get item to see if it exists, gather list of ids
        body = event['body']
        body = json.loads(body)
        email = body["email"]
        email = email.lower()
        request_id = body["id"]
        print(request_id)
        query_kwargs = {
            'TableName': IDS_TABLENAME,
            'KeyConditionExpression': '#name = :value',
            'ExpressionAttributeValues': {
                ':value': {
                    'S': email
                }
            },
            'ExpressionAttributeNames': {
                '#name': 'email'
            }
        }
        data = client.query(**query_kwargs)
        if data['Count'] == 0:
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
            put_kwargs = {
                'TableName': IDS_TABLENAME,
                'Item': {
                    'email': {
                        'S': email
                    },
                    'ids': {
                        'L': ids
                    }
                }
            }
            client.put_item(**put_kwargs)
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
