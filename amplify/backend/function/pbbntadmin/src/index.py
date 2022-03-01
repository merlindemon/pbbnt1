import json
import boto3
import os
import random
import string
DATA_TABLENAME = 'dynamo317d232a-' + os.environ["ENV"]
IDS_TABLENAME = 'pbbntids-' + os.environ["ENV"]

def handler(event, context):
    print('received event:')
    print(event)
    method = event['httpMethod']

    client = boto3.client('dynamodb')

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
        for result in result_array:
            email = result['email']['S']
            ids_array = []
            if 'ids' in result:
                ids_array = result['ids']['L']
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
            modified_gamedata[email] = {
                'ID': identifier,
                'Player': player,
                'Profit': profit,
                'BuyIn': buyin,
                'Rank': rank,
                'Hands': hands,
                'Tips': tips,
                'Email': email
            }
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
