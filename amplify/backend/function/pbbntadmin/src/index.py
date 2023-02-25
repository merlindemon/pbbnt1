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

        #1: Get all the emails -> ids and map them to an array
        scan_kwargs = {'TableName': IDS_TABLENAME}
        identifierdata = client.scan(**scan_kwargs)
        result_array = []
        if len(identifierdata['Items']) > 0:
            result_array = identifierdata['Items']
        id_to_email = {}
        email_to_credit_limit = {}
        email_to_tips_percentage = {}
        for result in result_array:
            credit_limit = 0
            email = result['email']['S']
            ids_array = []
            if 'ids' in result:
                ids_array = result['ids']['L']
            if 'creditLimit' in result:
                credit_limit = int(result['creditLimit']['N'])
                email_to_credit_limit[email] = credit_limit
            if 'tipsPercentage' in result:
                tips_percentage = int(result['tipsPercentage']['N'])
                email_to_tips_percentage[email] = tips_percentage
            for identifier in ids_array:
                identifier = identifier['S']
                id_to_email[identifier] = email

        modified_gamedata = {}
        print(id_to_email)
        for item in gamedata['Items']:
            identifier = item['ID']['S']
            email = ''
            if identifier in id_to_email:
                #If we have a user email -> id defined
                email = id_to_email[identifier]
            else:
                letters = string.ascii_uppercase
                email = "NoEmailListed?" + ''.join(random.choice(letters) for i in range(10))
            identifier = [identifier]#Go ahead and turn into array
            player =    [item['Player']['S']]#Go ahead and turn into array
            profit =    float(item['Profit']['N'])
            buyin =     float(item['BuyIn']['N'])
            rank =      int(item['Rank']['N'])
            hands =     int(item['Hands']['N'])
            tips =      float(item['Tips']['N'])
            
            if email in modified_gamedata:
                #This user has multiple accounts, merge the data
                existing_hash = modified_gamedata[email]
                identifier.append(existing_hash['ID'])
                player.append(existing_hash['Player'])
                profit += float(existing_hash['Profit'])
                buyin += float(existing_hash['BuyIn'])
                #We can average the rank, though it may be innaccurate if there are more than two accounts
                rank = round((int(rank) + int(existing_hash['Rank'])) / 2)
                hands += int(existing_hash['Hands'])
                tips += float(existing_hash['Tips'])
                
            credit_limit = int(0)
            tips_percentage = int(0)
            if email in email_to_credit_limit:
                credit_limit = int(email_to_credit_limit[email])
            if email in email_to_tips_percentage:
                tips_percentage = int(email_to_tips_percentage[email])

            modified_gamedata[email] = {
                'ID': identifier,
                'Player': player,
                'Profit': profit,
                'BuyIn': buyin,
                'Rank': rank,
                'Hands': hands,
                'Tips': tips,
                'TipsPercentage': tips_percentage,
                'CreditLimit': credit_limit,
                'Email': email
            }
        
        print(modified_gamedata)
        
        #Logic for when it's an agent, to limit results to only their players
        if event['queryStringParameters'] is not None and 'Search' in event['queryStringParameters']:
            query_string_parameters = event['queryStringParameters']
            agent_email = query_string_parameters['Search']
            agent_email = unquote_plus(agent_email)
            modified_gamedata = agentFilter(modified_gamedata, agent_email)
            

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

def agentFilter(modified_gamedata, agent_email):
    agents_player_email_array = []
    query_kwargs = {
                'TableName': AGENTS_TABLENAME,
                'KeyConditionExpression': '#agent_email = :value',
                'ExpressionAttributeNames': {
                    '#agent_email': 'agent_email'
                },
                'ExpressionAttributeValues': {
                    ':value': {
                        'S': agent_email
                    }
                }
            }
    data = client.query(**query_kwargs)
    print(data)
    if len(data['Items']) > 0:
        for email in data['Items'][0]['ids']['L']:
            agents_player_email_array.append(email['S'])
    print(agents_player_email_array)
    for email in list(modified_gamedata):
        if(email not in agents_player_email_array): #If the email isn't one of the agents players, remove it
            del modified_gamedata[email]
    return modified_gamedata