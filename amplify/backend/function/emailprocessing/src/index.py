import json
import urllib.parse
import boto3
import email
import io
from email.message import EmailMessage
import os
DATA_TABLENAME = 'dynamo317d232a-' + os.environ["ENV"]
TRANSACTIONS_TABLENAME = 'pbbnttransactions-' + os.environ["ENV"]

print('Loading function')

s3 = boto3.client('s3')

def handler(event, context):
    print(json.dumps(event))
    # Get the object from the event and show its content type
    bucket = event['Records'][0]['s3']['bucket']['name']
    key = urllib.parse.unquote_plus(event['Records'][0]['s3']['object']['key'], encoding='utf-8')
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
                for line in line_array:
                    counter += 1
                    if(counter == 1):
                        #Is header line, skip
                        continue
                    if not line:
                        #If it's an empty line, skip it
                        continue
                    player_array = line.split(",")
                    print(player_array)
                    if player_array[9] is not None and player_array[9] != '':
                        gamedate = player_array[9]
                        print('Gamedate is: [' + gamedate + ']')
                    print('Player is: ' + player_array[2] + ' ' + player_array[1])

                    # Check if there is just one entry in the DB for this player ID
                    query_kwargs = {
                        'TableName': DATA_TABLENAME,
                        'KeyConditionExpression':'#id = :value1',
                        'ExpressionAttributeValues': {
                            ':value1': {
                                'S': str(player_array[2])
                            }
                        },
                        'ExpressionAttributeNames': {
                            '#id': 'ID'
                        }
                    }
                    data = client.query(**query_kwargs)

                    #Make sure the player names match, if not delete and re-add entry with the new player name
                    if len(data['Items']) > 0:
                        print('DB Table PLayer Name' + str(data['Items'][0]['Player']['S']))
                        if str(player_array[1]) != str(data['Items'][0]['Player']['S']):
                            print('Deleting player: ' + data['Items'][0]['Player']['S'])
                            delete_kwargs = {
                                'TableName': DATA_TABLENAME,
                                'Key': {'ID':{'S':str(player_array[2])},'Player':{'S':str(data['Items'][0]['Player']['S'])}}
                            }
                            client.delete_item(**delete_kwargs)
                            print('Re-adding player: ' + str(player_array[1]))
                            put_kwargs = {
                                'TableName': DATA_TABLENAME,
                                'Item': {
                                    'ID': {'S': str(player_array[2])},
                                    'Rank': {'N': str(data['Items'][0]['Rank']['N'])},
                                    'Player': {'S': str(player_array[1])},
                                    'Hands': {'N': str(data['Items'][0]['Hands']['N'])},
                                    'Profit': {'N': str(data['Items'][0]['Profit']['N'])},
                                    'BuyIn': {'N': str(data['Items'][0]['BuyIn']['N'])},
                                    'Tips': {'N': str(data['Items'][0]['Tips']['N'])},
                                }
                            }
                            client.put_item(**put_kwargs)

                    put_kwargs = {
                        'TableName': TRANSACTIONS_TABLENAME,
                        'Item': {
                            'ID': {'S': str(player_array[2])},
                            'Date': {'S': str(gamedate)},
                            'Type': {'S': "Game"},
                            'Amount': {'N': str(player_array[4])},
                        }
                    }
                    client.put_item(**put_kwargs)
                    print('Number of unique IDs found that match ' + str(player_array[2]) + ': ' + str(len(data['Items'])))
                    if len(data['Items']) == 1:
                        # Do update as the userid already is present/has an bank
                        print('Unique Player ID ' + str(player_array[2]) + ' exists, updating data.')
                        print('Updating Data: add Hands :h, Profit :p, BuyIn :b, Tips :t = ' + ','.join([str(player_array[3]),str(player_array[4]),str(player_array[5]),str(player_array[6])]))
                        update_kwargs = {
                            'TableName': DATA_TABLENAME,
                            'UpdateExpression': "add Hands :h, Profit :p, BuyIn :b, Tips :t",
                            'Key': {'ID':{'S':str(player_array[2])},'Player':{'S':str(player_array[1])}},
                            'ExpressionAttributeValues': {
                                ':h': {"N": str(player_array[3])},
                                ':p': {"N": str(player_array[4])},
                                ':b': {"N": str(player_array[5])},
                                ':t': {"N": str(player_array[6])}
                            }
                        }
                        client.update_item(**update_kwargs)
                        print('Setting Player Rank: set #r=:r = ' + str(player_array[0]))
                        update_kwargs = {
                            'TableName': DATA_TABLENAME,
                            'UpdateExpression': "set #r=:r",
                            'Key': {'ID':{'S':str(player_array[2])},'Player':{'S':str(player_array[1])}},
                            'ExpressionAttributeValues': {
                                ':r': {"N": str(player_array[0])}
                            },
                            'ExpressionAttributeNames': {
                                '#r':"Rank"
                            }
                        }
                        client.update_item(**update_kwargs)
                    elif len(data['Items']) > 1:
                        print('Multiple IDs exist for this player ' + str(player_array[2]) + ' , ERROR.')
                    else:
                        print('Player ID ' + str(player_array[2]) + ' did not previously exist, importing data.')
                        print('Updating Data: ID,Rank,Player,Hands,Profit,BuyIn,Tips = ' + ','.join([str(player_array[2]),str(player_array[0]),str(player_array[1]),str(player_array[3]),str(player_array[4]),str(player_array[5]),str(player_array[6])]))
                        put_kwargs = {
                            'TableName': DATA_TABLENAME,
                            'Item': {
                                'ID': {'S': str(player_array[2])},
                                'Rank': {'N': str(player_array[0])},
                                'Player': {'S': str(player_array[1])},
                                'Hands': {'N': str(player_array[3])},
                                'Profit': {'N': str(player_array[4])},
                                'BuyIn': {'N': str(player_array[5])},
                                'Tips': {'N': str(player_array[6])},
                            }
                        }
                        client.put_item(**put_kwargs)

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
