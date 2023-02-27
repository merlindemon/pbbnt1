import json
import boto3
import os

GAMEDATA_TABLE = 'dynamo317d232a-' + os.environ["ENV"]
IDS_TABLE = 'pbbnttids-' + os.environ["ENV"]
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
        player_email_to_agent_email = getAgentsInformation()
        print(f"player_email_to_agent_email: {player_email_to_agent_email}")
        ids_data = getIdsData()
        print(f"ids_data: {ids_data}")
        player_email_to_player_id = getEmailMapping(ids_data)
        print(f"player_email_to_player_id: {player_email_to_player_id}")
        player_id_to_player_email = flipIdsData(ids_data)
        print(f"player_id_to_player_email: {player_id_to_player_email}")
        player_id_to_tip_percentage = getTipsPercentage(ids_data)
        print(f"player_id_to_tip_percentage: {player_id_to_tip_percentage}")

        for player_id in player_id_to_tip_percentage:
            print(f"Player ID: {player_id}")
            tips, playername, profit_balance = getGameDataForSpecificId(
                player_id)
            print(f"tips: { tips}, playername: {playername}, profit_balance: {profit_balance}")
            if tips <= 0:
                #If the tips are zero, nothing to calculate as the result is automatically zero as well
                continue
            tips_percentage = player_id_to_tip_percentage[player_id]
            print(f"tips_percentage: {tips_percentage}")
            if tips_percentage <= 0:
                #If the tips_percentage is zero, nothing to calculate as the result is automatically zero as well
                continue
            rakeback = (tips * tips_percentage)
            print(f"rakeback: {rakeback}")
            player_email = player_id_to_player_email[player_id]
            print(f"player_email: {player_email}")
            if player_email in player_email_to_agent_email:
                print("Player is affiliated with an agent")
                #Player is affiliated with an agent, tip the agent
                agent_email = player_email_to_agent_email[player_email]
                print(f"agent_email: {agent_email}")
                agent_id = player_email_to_player_id[agent_email]
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
    profit = profit_balance + rakeback
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
    profit = profit_balance + rakeback
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
                'S': "Rakeback"
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
    get_item_kwargs = {
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
        'ConsistentRead': str(True)
    }
    data = client.get_item(**get_item_kwargs)
    data = data['Item'][0]
    tips = 0
    if 'Tips' in data:
        tips = data['Tips']['N']
    playername = data['Player']['S']
    profit_balance = data['Profit']['N']
    return tips, playername, profit_balance


def getAgentsInformation():
    scan_kwargs = {'TableName': AGENTS_TABLE}
    response = client.scan(**scan_kwargs)
    agent_data = response['Items']
    player_email_to_agent_email = {}
    for agent_email in agent_data:
        for player_data in agent_email['ids']:
            player_email = player_data['S']
            player_email_to_agent_email[player_email] = agent_email
    return player_email_to_agent_email


def getIdsData():
    scan_kwargs = {'TableName': IDS_TABLE}
    response = client.scan(**scan_kwargs)
    ids_data = response['Items']
    return ids_data


def flipIdsData(ids_data):
    player_id_to_player_email = {}
    for player_email in ids_data:
        for identifier in player_email['ids']:
            identifier = identifier['S']
            player_id_to_player_email[identifier] = player_email
    return player_id_to_player_email


def getEmailMapping(ids_data):
    #This just grabs the first ID and ignores the rest, and is for the purpose of adding profit/transactions
    #Since the app gathers all the player's(email) ids and combines them, adding it to "the wrong one" can't happen
    player_email_to_player_id = {}
    for player_email in ids_data:
        player_email_to_player_id[player_email] = player_email['ids'][0]['S']
    return player_email_to_player_id


def getTipsPercentage(ids_data):
    player_id_to_tip_percentage = {}
    for player_data in ids_data:
        for identifier in player_data['ids']:
            identifier = identifier['S']
            tips_percentage = 0
            if 'tipsPercentage' in player_data:
                tips_percentage = float(player_data['tipsPercentage'] / 100)
            player_id_to_tip_percentage[identifier] = tips_percentage
    return player_id_to_tip_percentage


def getTTL():
    from datetime import datetime, timedelta
    import time
    dt = datetime.now()
    td = timedelta(days=42)
    my_date = dt + td
    ttl = int(time.mktime(my_date.timetuple()))
    return ttl, dt