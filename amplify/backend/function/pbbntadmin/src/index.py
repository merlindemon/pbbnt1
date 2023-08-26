import json
import boto3
import os
import random
import string
from urllib.parse import unquote_plus
DATA_TABLENAME = 'dynamo317d232a-' + os.environ["ENV"]
IDS_TABLENAME = 'pbbntids-' + os.environ["ENV"]
AGENTS_TABLENAME = 'agents-' + os.environ["ENV"]
client = boto3.client('dynamodb')

def handler(event, context):
    print('received event:')
    print(event)
    method = event['httpMethod']

    if method == 'GET':
        scan_kwargs = {'TableName': DATA_TABLENAME}
        gamedata = client.scan(**scan_kwargs)

        #1: Get all the preferred_usernames -> ids and map them to an array
        scan_kwargs = {'TableName': IDS_TABLENAME}
        identifierdata = client.scan(**scan_kwargs)
        result_array = []
        if len(identifierdata['Items']) > 0:
            result_array = identifierdata['Items']
        id_to_preferred_username = {}
        preferred_username_to_credit_limit = {}
        preferred_username_to_tips_percentage = {}
        for result in result_array:
            credit_limit = 0
            preferred_username = result['preferred_username']['S']
            ids_array = []
            if 'ids' in result:
                ids_array = result['ids']['L']
            if 'creditLimit' in result:
                credit_limit = int(result['creditLimit']['N'])
                preferred_username_to_credit_limit[preferred_username] = credit_limit
            if 'tipsPercentage' in result:
                tips_percentage = int(result['tipsPercentage']['N'])
                preferred_username_to_tips_percentage[preferred_username] = tips_percentage
            for identifier in ids_array:
                identifier = identifier['S']
                id_to_preferred_username[identifier] = preferred_username

        modified_gamedata = {}
        print(id_to_preferred_username)
        for item in gamedata['Items']:
            identifier = item['ID']['S']
            player =    item['Player']['S']
            preferred_username = ''
            if identifier in id_to_preferred_username:
                #If we have a user preferred_username -> id defined
                preferred_username = id_to_preferred_username[identifier]
            else:
                letters = string.ascii_uppercase
                preferred_username = "Nopreferred_usernameListed?" + ''.join(random.choice(letters) for i in range(10))
            #Go ahead and turn into array
            profit =    float(item['Profit']['N'])
            buyin =     float(item['BuyIn']['N'])
            rank =      int(item['Rank']['N'])
            hands =     int(item['Hands']['N'])
            tips =      float(item['Tips']['N'])
            
            if preferred_username in modified_gamedata:
                #This user has multiple accounts, merge the data
                existing_hash = modified_gamedata[preferred_username]
                existing_hash['ID'].append(identifier)
                identifier = existing_hash['ID']
                existing_hash['Player'].append(player)
                player = existing_hash['Player']
                profit += float(existing_hash['Profit'])
                buyin += float(existing_hash['BuyIn'])
                #We can average the rank, though it may be innaccurate if there are more than two accounts
                rank = round((int(rank) + int(existing_hash['Rank'])) / 2)
                hands += int(existing_hash['Hands'])
                tips += float(existing_hash['Tips'])
            else:
                identifier = [identifier]
                player = [player]

            credit_limit = int(0)
            tips_percentage = int(0)
            if preferred_username in preferred_username_to_credit_limit:
                credit_limit = int(preferred_username_to_credit_limit[preferred_username])
            if preferred_username in preferred_username_to_tips_percentage:
                tips_percentage = int(preferred_username_to_tips_percentage[preferred_username])

            modified_gamedata[preferred_username] = {
                'ID': identifier,
                'Player': player,
                'Profit': profit,
                'BuyIn': buyin,
                'Rank': rank,
                'Hands': hands,
                'Tips': tips,
                'TipsPercentage': tips_percentage,
                'CreditLimit': credit_limit,
                'preferred_username': preferred_username
            }
        
        print(modified_gamedata)
        
        #Logic for when it's an agent, to limit results to only their players
        if event['queryStringParameters'] is not None and 'Search' in event['queryStringParameters']:
            query_string_parameters = event['queryStringParameters']
            agent_preferred_username = query_string_parameters['Search']
            agent_preferred_username = unquote_plus(agent_preferred_username)
            modified_gamedata = agentFilter(modified_gamedata, agent_preferred_username)
            

        #Final output
        modified_gamedata = list(modified_gamedata.values())
        print(modified_gamedata)
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Headers': '*',
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'OPTIONS,POST,GET'
            },
            'body': json.dumps(modified_gamedata)
        }

def agentFilter(modified_gamedata, agent_preferred_username):
    agents_player_preferred_username_array = []
    query_kwargs = {
                'TableName': AGENTS_TABLENAME,
                'KeyConditionExpression': '#agent_preferred_username = :value',
                'ExpressionAttributeNames': {
                    '#agent_preferred_username': 'agent_preferred_username'
                },
                'ExpressionAttributeValues': {
                    ':value': {
                        'S': agent_preferred_username
                    }
                }
            }
    data = client.query(**query_kwargs)
    print(data)
    if len(data['Items']) > 0:
        for preferred_username in data['Items'][0]['ids']['L']:
            agents_player_preferred_username_array.append(preferred_username['S'])
    print(agents_player_preferred_username_array)
    for preferred_username in list(modified_gamedata):
        if(preferred_username not in agents_player_preferred_username_array): #If the preferred_username isn't one of the agents players, remove it
            del modified_gamedata[preferred_username]
    return modified_gamedata