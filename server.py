#!/usr/bin/env python3.4

#pip install flask-socketio
#pip install eventlet

from flask import Flask, render_template
from flask_socketio import SocketIO, join_room, leave_room
import sqlite3
from enum import Enum

app = Flask(__name__)
app.config["SECRET_KEY"] = "BlaBlub42"
socketio = SocketIO(app)
PORT = 62155

if __name__ == "__main__":
	conn = sqlite3.connect("wargame.db")
	conn.execute("CREATE TABLE IF NOT EXISTS participates (userID NUMBER, matchID NUMBER, PRIMARY KEY(userID, matchID))")
	conn.execute("CREATE TABLE IF NOT EXISTS users (userID NUMBER, name TEXT, password TEXT, PRIMARY KEY(userID))")
	conn.execute("CREATE TABLE IF NOT EXISTS matches (matchID NUMBER, objectID NUMBER, name TEXT, password TEXT, PRIMARY KEY(matchID))")
	conn.execute("INSERT OR REPLACE INTO users (userID, name, password) VALUES (?, ?, ?)", (1,"Coding","BlaBlub42",))
	conn.execute("INSERT OR REPLACE INTO matches (matchID, name, password, objectID) VALUES (?, ?, ?, 0)", (1,"Coding's match","",))
	conn.execute("INSERT OR REPLACE INTO participates (matchID, userID) VALUES (?, ?)", (1,1,))
	conn.commit()
	conn.close()
	socketio.run(app, port=PORT)

def replaceIDs(json, matchID):
	pass
	"""jsonType = type(json)
	if (jsonType is list):
		for (entry in json):
			replaceIDs(entry)
	elif (jsonType is dict):
		for (key in json):
			if (key == "id")
				if (json[key] == -1):
					conn = sqlite3.connect("wargame.db", isolation_level="EXCLUSIVE")
					objectID = conn.execute("SELECT objectID FROM matches WHERE matchID=?", (matchID,)).fetchone()
					jsin[key] = objectID
					objectID += 1
					conn.execute("UPDATE OR REPLACE matches SET objectID=? WHERE matchID=?", (objectID,matchID,))
					conn.commit()
					conn.close()
			else:
				replaceIDs(json[key], matchID)"""
class MessageType(Enum):
	Create = 0
	Update = 1
"""
{
	"matchID": 1,
	"senderID": 1,
	"messages":
	[
		{
			"type": 0,
			"data":
			{
				"name": "a unit",
				"id": -1,
				"weapons":
				[
					{
						"name": "a weapon",
						"id": -1
					},
					{
						"name": "anotgher weapon",
						"id": -1
					}
				]
			}
		},
		{
			"type": 0,
			"data":
			{
				"name": "another unit",
				"id": -1
			}
		}
	]
}
"""
@socketio.on("json")
def handleJSON(json):
	matchID = json["matchID"]
	senderID = json["senderID"]
	messages = json["messages"]
	for message in messages:
		messageType = message["type"]
		messageData = message["data"]
		if (messageType == MessageType.Create):
			replaceIDs(messageData, matchID)
		if (messageType == MessageType.Update):
			pass
    send(json, json=True, room=matchID)
	
@socketio.on("connect")
def handleConnect():
    pass#TODO participate

@socketio.on("disconnect")
def handleDisconnect():
    pass#TODO dont participate
