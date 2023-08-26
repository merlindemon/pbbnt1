import json
import boto3
import os
from datetime import datetime

GAMEDATA_TABLE = 'dynamo317d232a-' + os.environ["ENV"]
IDS_TABLE = 'pbbntids-' + os.environ["ENV"]
TRANSACTIONS_TABLE = 'pbbnttransactions-' + os.environ["ENV"]
AGENTS_TABLE = 'agents-' + os.environ["ENV"]
client = boto3.client('dynamodb')


def handler(event, context):
    print('received event:')
    print(event)
    method = event['httpMethod']

    if method == 'POST':
        print("Method POST")
        ttl, dt = getTTL()
        player_preferred_username_to_agent_preferred_username = getAgentsInformation()
        print(f"player_preferred_username_to_agent_preferred_username: {player_preferred_username_to_agent_preferred_username}")
        ids_data = getIdsData()
        print(f"ids_data: {ids_data}")
        player_preferred_username_to_player_id = getpreferred_usernameMapping(ids_data)
        print(f"player_preferred_username_to_player_id: {player_preferred_username_to_player_id}")
        player_id_to_player_preferred_username = flipIdsData(ids_data)
        print(f"player_id_to_player_preferred_username: {player_id_to_player_preferred_username}")
        player_id_to_tip_percentage = getTipsPercentage(ids_data)
        print(f"player_id_to_tip_percentage: {player_id_to_tip_percentage}")

        for player_id in player_id_to_tip_percentage:
            print(f"Player ID: {player_id}")
            tips, playername, profit_balance = getGameDataForSpecificId(
                player_id)
            print(f"tips: { tips}, playername: {playername}, profit_balance: {profit_balance}")
            if float(tips) <= 0:
                #If the tips are zero, nothing to calculate as the result is automatically zero as well
                continue
            if player_id not in player_id_to_tip_percentage:
                continue
            tips_percentage = player_id_to_tip_percentage[player_id]
            print(f"tips_percentage: {tips_percentage}")
            if float(tips_percentage) <= 0:
                #If the tips_percentage is zero, nothing to calculate as the result is automatically zero as well
                continue
            print(f"Tips: {tips}")
            print(f"Tips Percentage: {tips_percentage}")
            rakeback = (float(tips) * float(tips_percentage))
            round(rakeback, 2)
            print(f"rakeback: {rakeback}")
            player_preferred_username = player_id_to_player_preferred_username[player_id]
            print(f"player_preferred_username: {player_preferred_username}")
            if player_preferred_username in player_preferred_username_to_agent_preferred_username:
                print("Player is affiliated with an agent")
                #Player is affiliated with an agent, tip the agent
                agent_preferred_username = player_preferred_username_to_agent_preferred_username[player_preferred_username]
                print(f"agent_preferred_username: {agent_preferred_username}")
                agent_id = player_preferred_username_to_player_id[agent_preferred_username]
                print(f"agent_id: {agent_id}")
                tipAffiliatedAgent(rakeback, player_id, playername, agent_id,
                                   ttl, dt)
            else:
                print("Player is independent")
                #Player is independent, tip the player
                tipUnaffiliatedPlayer(rakeback, profit_balance, player_id,
                                      playername, ttl, dt)

    return {
        'statusCode': 200,
        'headers': {
            'Access-Control-Allow-Headers': '*',
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'OPTIONS,POST,GET,DELETE'
        },
        'body': json.dumps('Update Complete')
    }


def tipAffiliatedAgent(rakeback, player_id, playername, agent_id, ttl, dt):
    tips, agentname, profit_balance = getGameDataForSpecificId(agent_id)
    profit = float(profit_balance) + float(rakeback)
    update_kwargs = {
        'TableName': GAMEDATA_TABLE,
        'UpdateExpression': "set Profit=:p",
        'Key': {
            'ID': {
                'S': str(agent_id)
            },
            'Player': {
                'S': str(agentname)
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
            'ID': {
                'S': str(agent_id)
            },
            'Date': {
                'S': str(dt)
            },
            'Type': {
                'S': f"Rakeback: {player_id} - {playername}"
            },
            'Amount': {
                'N': str(rakeback)
            },
            'TTL': {
                'N': str(ttl)
            }
        }
    }
    client.put_item(**put_kwargs)
    return ""


def tipUnaffiliatedPlayer(rakeback, profit_balance, player_id, playername, ttl,
                          dt):
    profit = float(profit_balance) + float(rakeback)
    update_kwargs = {
        'TableName': GAMEDATA_TABLE,
        'UpdateExpression': "set Profit=:p",
        'Key': {
            'ID': {
                'S': str(player_id)
            },
            'Player': {
                'S': str(playername)
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
            'ID': {
                'S': str(player_id)
            },
            'Date': {
                'S': str(dt)
            },
            'Type': {
                'S': f"Rakeback: {player_id} - {playername}"
            },
            'Amount': {
                'N': str(rakeback)
            },
            'TTL': {
                'N': str(ttl)
            }
        }
    }
    client.put_item(**put_kwargs)
    return ""


def getGameDataForSpecificId(identifier):
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
        },
        'ConsistentRead': bool(True)
    }
    data = client.query(**query_kwargs)
    print(data)
    if len(data['Items']) > 0:#Ensure the ID has an entry in the Game Data table
        data = data['Items'][0]
        tips = 0
        if 'Tips' in data:
            tips = data['Tips']['N']
        playername = data['Player']['S']
        profit_balance = data['Profit']['N']
        return tips, playername, profit_balance
    else:
        return 0,0,0


def getAgentsInformation():
    scan_kwargs = {'TableName': AGENTS_TABLE}
    response = client.scan(**scan_kwargs)
    agent_data = response['Items']
    player_preferred_username_to_agent_preferred_username = {}
    for agent_entry in agent_data:
        agent_preferred_username = agent_entry['agent_preferred_username']['S']
        for player_data in agent_entry['ids']['L']:
            player_preferred_username = player_data['S']
            player_preferred_username_to_agent_preferred_username[player_preferred_username] = agent_preferred_username
    return player_preferred_username_to_agent_preferred_username


def getIdsData():
    scan_kwargs = {'TableName': IDS_TABLE}
    response = client.scan(**scan_kwargs)
    ids_data = response['Items']
    return ids_data


def flipIdsData(ids_data):
    player_id_to_player_preferred_username = {}
    for player_entry in ids_data:
        for identifier in player_entry['ids']['L']:
            identifier = identifier['S']
            player_id_to_player_preferred_username[identifier] = player_entry['preferred_username']['S']
    return player_id_to_player_preferred_username


def getpreferred_usernameMapping(ids_data):
    #This just grabs the first ID and ignores the rest, and is for the purpose of adding profit/transactions
    #Since the app gathers all the player's(preferred_username) ids and combines them, adding it to "the wrong one" can't happen
    player_preferred_username_to_player_id = {}
    for player_data in ids_data:
        player_preferred_username = player_data['preferred_username']['S']
        for identifier in player_data['ids']['L']:
            identifier = identifier['S']
            player_preferred_username_to_player_id[player_preferred_username] = identifier
            continue
    return player_preferred_username_to_player_id


def getTipsPercentage(ids_data):
    player_id_to_tip_percentage = {}
    for player_data in ids_data:
        for identifier in player_data['ids']['L']:
            identifier = identifier['S']
            tips_percentage = 0
            if 'tipsPercentage' in player_data:
                tips_percentage = float(float(player_data['tipsPercentage']['N']) / 100)
            player_id_to_tip_percentage[identifier] = tips_percentage
    return player_id_to_tip_percentage


def getTTL():
    from datetime import datetime, timedelta
    import time
    dt = datetime.now()
    td = timedelta(days=42)
    my_date = dt + td
    ttl = int(time.mktime(my_date.timetuple()))
    now = datetime.now()
    date = now.strftime("%Y-%m-%d %H:%M:%S")
    return ttl, date