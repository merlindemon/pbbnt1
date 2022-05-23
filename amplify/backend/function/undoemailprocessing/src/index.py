import json
import boto3
import email
import io
from email.message import EmailMessage
import os
DATA_TABLENAME = 'dynamo317d232a-' + os.environ["ENV"]
TRANSACTIONS_TABLENAME = 'pbbnttransactions-' + os.environ["ENV"]
HEADER1 = "Rank,Player,ID,Hands,Profit,BuyIn,Tips,ClubID,GameCode,DateStarted,DateEnded,GameType,BigBlind,TotalTips"
HEADER2 = "Rank,Player,ID,Hands,Profit,Rebuy,Prize,Addon,Tips,ClubCode,GameCode,DateStarted,DateEnded,GameName,GameType,BuyinTicket,AddonTicket,TotalTips"
HEADER3 = "Rank,Player,ID,Hands,Profit,BuyIn,Tips,ClubCode,GameCode,DateStarted,DateEnded,GameType,BigBlind,TotalTips"
print('Loading function')

s3 = boto3.client('s3')

def handler(event, context):

    FIELD_RANK = 0
    FIELD_PLAYERNAME = 1
    FIELD_PLAYERID = 2
    FIELD_HANDS = 3
    FIELD_PROFIT = 4
    FIELD_BUYIN = 5
    field_tips = 6
    field_gamedate = 9

    print(json.dumps(event))
    # Get the object from the event and show its content type
    bucket = event['bucket']
    key = event['key']
    try:
        response = s3.get_object(Bucket=bucket, Key=key)
        email_message: EmailMessage = email.message_from_bytes(response['Body'].read(), _class=EmailMessage)
        for email_message_attachment in email_message.iter_attachments():
            ct = email_message_attachment.get_content_type()
            print(ct)
            if ct == 'text/csv':
                data = email_message_attachment.get_payload(decode=True)
                toread = io.BytesIO()
                toread.write(data)
                toread.seek(0)
                attachment_to_stringcsv = data.decode("utf-8")
                line_array = attachment_to_stringcsv.split("\n")
                client = boto3.client('dynamodb')
                gamedate = ""
                counter = 0
                print(line_array)
                for line in line_array:
                    counter += 1
                    if counter == 1:
                        #Is header line, skip
                        if line == HEADER1:
                            print('Header Format 1')
                        elif line == HEADER2:
                            print("Header Format 2")
                            field_gamedate = 11
                            field_tips = 8
                        elif line == HEADER3:
                            print("Header Format 3")
                        else:
                            print("Header format unrecognized")
                            print(line)
                        continue
                    if not line:
                        #If it's an empty line, skip it
                        continue
                    player_array = line.split(",")
                    print(player_array)
                    if player_array[field_gamedate] is not None and player_array[field_gamedate] != '':
                        gamedate = player_array[field_gamedate]
                        print('Gamedate is: [' + gamedate + ']')
                    print('Player is: ' + player_array[FIELD_PLAYERID] + ' ' + player_array[FIELD_PLAYERNAME])

                    # Check if there is just one entry in the DB for this player ID
                    query_kwargs = {
                        'TableName': DATA_TABLENAME,
                        'KeyConditionExpression':'#id = :value1',
                        'ExpressionAttributeValues': {
                            ':value1': {
                                'S': str(player_array[FIELD_PLAYERID])
                            }
                        },
                        'ExpressionAttributeNames': {
                            '#id': 'ID'
                        }
                    }
                    data = client.query(**query_kwargs)
                    rank = str(player_array[FIELD_RANK])
                    if not rank:
                        rank = str(0)
                    hands = str(player_array[FIELD_HANDS])
                    if not hands:
                        hands = str(0)
                    profit = str(player_array[FIELD_PROFIT])
                    if not profit:
                        profit = str(0)
                    buyin = str(player_array[FIELD_BUYIN])
                    if not buyin:
                        buyin = str(0)
                    tips = str(player_array[field_tips])
                    if not tips:
                        tips = str(0)

                    hands = str(int(hands) * (-1))
                    profit = str(float(profit) * (-1))
                    buyin = str(float(buyin) * (-1))
                    tips = str(float(tips) * (-1))

                    #Make sure the player names match, if not delete and re-add entry with the new player name
                    if len(data['Items']) > 0:
                        print('DB Table PLayer Name' + str(data['Items'][0]['Player']['S']))
                        if str(player_array[FIELD_PLAYERNAME]) != str(data['Items'][0]['Player']['S']):
                            print('Deleting player: ' + data['Items'][0]['Player']['S'])
                            delete_kwargs = {
                                'TableName': DATA_TABLENAME,
                                'Key': {'ID':{'S':str(player_array[FIELD_PLAYERID])},'Player':{'S':str(data['Items'][0]['Player']['S'])}}
                            }
                            client.delete_item(**delete_kwargs)
                            print('Re-adding player: ' + str(player_array[FIELD_PLAYERNAME]))
                            put_kwargs = {
                                'TableName': DATA_TABLENAME,
                                'Item': {
                                    'ID': {'S': str(player_array[FIELD_PLAYERID])},
                                    'Rank': {'N': str(data['Items'][0]['Rank']['N'])},
                                    'Player': {'S': str(player_array[FIELD_PLAYERNAME])},
                                    'Hands': {'N': str(data['Items'][0]['Hands']['N'])},
                                    'Profit': {'N': str(data['Items'][0]['Profit']['N'])},
                                    'BuyIn': {'N': str(data['Items'][0]['BuyIn']['N'])},
                                    'Tips': {'N': str(data['Items'][0]['Tips']['N'])},
                                }
                            }
                            client.put_item(**put_kwargs)

                    #Remove the Game transaction from the transaction table
                    delete_kwargs = {
                        'TableName': TRANSACTIONS_TABLENAME,
                        'Key': {'ID':{'S':str(player_array[FIELD_PLAYERID])},'Date':{'S':str(gamedate)}}
                    }
                    client.delete_item(**delete_kwargs)

                    #Undo the data changes to the Game Data table
                    print('Number of unique IDs found that match ' + str(player_array[FIELD_PLAYERID]) + ': ' + str(len(data['Items'])))
                    if len(data['Items']) == 1:
                        # Do update as the userid already is present/has an bank
                        print('Unique Player ID ' + str(player_array[FIELD_PLAYERID]) + ' exists, updating data.')
                        print('Updating Data: subtract Hands :h, Profit :p, BuyIn :b, Tips :t = ' + ','.join([hands,profit,buyin,tips]))
                        update_kwargs = {
                            'TableName': DATA_TABLENAME,
                            'UpdateExpression': "add Hands :h, Profit :p, BuyIn :b, Tips :t",
                            'Key': {'ID':{'S':str(player_array[FIELD_PLAYERID])},'Player':{'S':str(player_array[FIELD_PLAYERNAME])}},
                            'ExpressionAttributeValues': {
                                ':h': {"N": hands},
                                ':p': {"N": profit},
                                ':b': {"N": buyin},
                                ':t': {"N": tips}
                            }
                        }
                        client.update_item(**update_kwargs)
                    elif len(data['Items']) > 1:
                        print('Multiple IDs exist for this player ' + str(player_array[FIELD_PLAYERID]) + ' , ERROR.')
                    else:
                        print('Player ID ' + str(player_array[FIELD_PLAYERNAME]) + ' did not previously exist, importing data.')
                        print('Not planning to update Data: ID,Rank,Player,Hands,Profit,BuyIn,Tips = ' + ','.join([str(player_array[FIELD_PLAYERID]),rank,str(player_array[FIELD_PLAYERID]),hands,profit,buyin,tips]))

                return {
                    'statusCode': 200,
                    'headers': {
                        'Access-Control-Allow-Headers': '*',
                        'Access-Control-Allow-Origin': '*',
                        'Access-Control-Allow-Methods': 'OPTIONS,POST,GET'
                    },
                    'body': json.dumps('POST Complete')
                }
    except Exception as e:
        # print(e)
        raise e
