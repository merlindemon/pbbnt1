import json
import boto3
from urllib.parse import unquote_plus
import os
IDS_TABLENAME = 'pbbntids-' + os.environ["ENV"]
USERPOOLID = os.environ["AUTH_PBBNT5CF00A19_USERPOOLID"]
cognito_client = boto3.client('cognito-idp')
ddb_client = boto3.client('dynamodb')

def get(event):
    print(event['queryStringParameters'])
    data = ''
    if event['queryStringParameters'] is not None and 'Search' in event['queryStringParameters']:
        #Return the list of IDs for the queried username
        query_str_params = event['queryStringParameters']
        preferred_username = query_str_params['Search']
        print(preferred_username)
        preferred_username = unquote_plus(preferred_username)
        preferred_username = preferred_username.lower()
        print(preferred_username)
        query_kwargs = {
            'TableName': IDS_TABLENAME,
            'KeyConditionExpression': '#name = :value',
            'ExpressionAttributeNames': {
                '#name': 'preferred_username'
            },
            'ExpressionAttributeValues': {
                ':value': {
                    'S': preferred_username
                }
            }
        }
        data = ddb_client.query(**query_kwargs)
    else:
        #Return all usernames and their user ids
        scan_kwargs = {'TableName': IDS_TABLENAME}
        data = ddb_client.scan(**scan_kwargs)
        response = cognito_client.list_users_in_group(
            UserPoolId=USERPOOLID,
            GroupName="manager"
        )
        listUsers = response['Users']
        manager_array = []
        for user in listUsers:
            attributes = user["Attributes"]
            for attribute in attributes:
                if attribute["Name"] == "preferred_username":
                    preferred_username = attribute["Value"]
                    manager_array.append(preferred_username)
                    
        response = cognito_client.list_users_in_group(
            UserPoolId=USERPOOLID,
            GroupName="agent"
        )
        listUsers = response['Users']
        print(listUsers)
        agent_array = []
        #Get the list of usrsin cognito, and store their preferred_username
        for user in listUsers:
            attributes = user["Attributes"]
            for attribute in attributes:
                if attribute["Name"] == "preferred_username":
                    preferred_username = attribute["Value"]
                    agent_array.append(preferred_username)
        #Check if their username in a member of each group
        for user in data['Items']:
            if user["preferred_username"]["S"] in manager_array:
                user["manager"] = True
            else:
                user["manager"] = False
            if user["preferred_username"]["S"] in agent_array:
                user["agent"] = True
            else:
                user["agent"] = False
                
    return {
        'statusCode': 200,
        'headers': {
            'Access-Control-Allow-Headers': '*',
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'OPTIONS,PUT,GET,DELETE'
        },
        'body': json.dumps(data)
    }

def patch(event):
    # Get item to see if it exists, gather list of ids
    body = event['body']
    body = json.loads(body)
    preferred_username = body["preferred_username"]
    preferred_username = preferred_username.lower()
    group = body["group"]
    group = group.lower()
    addToGroup = body["boolean"]
    cognito_client = boto3.client('cognito-idp')
    response = cognito_client.list_users(
            UserPoolId=USERPOOLID,
            Filter=f"preferred_username = \"{preferred_username}\"",
        )
    username = response["Users"][0]["Username"]
    if addToGroup: 
        #Get user id from preferred_username and add that user to the requested group
        response = cognito_client.admin_add_user_to_group(
            UserPoolId=USERPOOLID,
            Username=username,
            GroupName=group
        )
    else: #Remove from group
        #Get user id from preferred_username and remove that user from the requested group
        response = cognito_client.admin_remove_user_from_group(
            UserPoolId=USERPOOLID,
            Username=username,
            GroupName=group
        )
    return {
        'statusCode': 200,
        'headers': {
            'Access-Control-Allow-Headers': '*',
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'OPTIONS,PUT,GET,DELETE'
        },
        'body': json.dumps('PATCH Complete')
    }

def put(event):
    body = event['body']
    body = json.loads(body)
    preferred_username = body["preferred_username"]
    preferred_username = preferred_username.lower()
    identifiers = body["id"]
    # Get username to see if it exists, gather list of that user's ids
    query_kwargs = {
        'TableName': IDS_TABLENAME,
        'KeyConditionExpression': '#name = :value',
        'ExpressionAttributeNames': {
            '#name': 'preferred_username'
        },
        'ExpressionAttributeValues': {
            ':value': {
                'S': preferred_username
            }
        }
    }
    data = ddb_client.query(**query_kwargs)
    if data['Count'] == 0:
        # Doesn't yet exist, prepare to add the entry to DynamoDB and Create the user in Cognito if needed
        identifiers = [{'S':identifiers}]
        cognito_client = boto3.client('cognito-idp')
        response = cognito_client.list_users(
                UserPoolId=USERPOOLID,
                Filter=f"preferred_username = \"{preferred_username}\"",
            )
        if len(response['Users']) == 0:
            #Need to create a new user in cognito as well
            response = cognito_client.admin_create_user(
                UserPoolId=USERPOOLID,
                Username=preferred_username,
                TemporaryPassword='password',
                MessageAction='SUPPRESS'
            )
    elif data['Count'] > 0:
        # Already has an ID, so prepare to append a new id
        previous_ids = data['Items'][0]['ids']['L']
        unique_ids = {identifiers}
        for identifiers in previous_ids:
            unique_ids.add(identifiers['S'])
        print(unique_ids)
        ids_array = []
        for identifiers in unique_ids:
            ids_array.append({'S': identifiers})
        identifiers = json.loads(json.dumps(ids_array))

    put_kwargs = {
        'TableName': IDS_TABLENAME,
        'Item': {
            'preferred_username': {
                'S': preferred_username
            },
            'ids': {
                'L': identifiers
            }
        }
    }
    ddb_client.put_item(**put_kwargs)

    return {
        'statusCode': 200,
        'headers': {
            'Access-Control-Allow-Headers': '*',
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'OPTIONS,PUT,GET,DELETE'
        },
        'body': json.dumps('PUT Complete')
    }

def delete(event):
    body = event['body']
    body = json.loads(body)
    preferred_username = body["preferred_username"]
    preferred_username = preferred_username.lower()
    request_id = body["id"]
    print(request_id)
    # Get item to see if it exists, gather it's list of user ids
    query_kwargs = {
        'TableName': IDS_TABLENAME,
        'KeyConditionExpression': '#name = :value',
        'ExpressionAttributeValues': {
            ':value': {
                'S': preferred_username
            }
        },
        'ExpressionAttributeNames': {
            '#name': 'preferred_username'
        }
    }
    data = ddb_client.query(**query_kwargs)
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
                'preferred_username': {
                    'S': preferred_username
                },
                'ids': {
                    'L': ids
                }
            }
        }
        ddb_client.put_item(**put_kwargs)
    return {
        'statusCode': 200,
        'headers': {
            'Access-Control-Allow-Headers': '*',
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'OPTIONS,PUT,GET,DELETE'
        },
        'body': json.dumps('DELETE Complete')
    }

def handler(event, context):
    print('received event:')
    print(event)
    method = event['httpMethod']

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
        #Retrieve user or list of users
        return get(event)
    elif method == 'PATCH':
        #Update existing user
        return patch(event)
    elif method == 'PUT':
        #Create a new user, or update an existing user
        return put(event)
    elif method == 'DELETE':
        #Delete an id entry from the user's ids list
        return delete(event)
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
