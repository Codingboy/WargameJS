#!/usr/bin/env python3.4

#pip install flask-socketio
#pip install eventlet

from flask import Flask, render_template, request
from flask_socketio import SocketIO, join_room, leave_room, emit
import sqlite3
from enum import Enum
import logging

PROJECTNAME = "WargameJS"
DBNAME = PROJECTNAME+".sqlite"

logger = logging.getLogger(PROJECTNAME)
logger.setLevel(logging.INFO)
fh = logging.FileHandler(PROJECTNAME+".log")
fh.setLevel(logging.INFO)
ch = logging.StreamHandler()
ch.setLevel(logging.INFO)
formatter = logging.Formatter("%(asctime)s - %(name)s - %(levelname)s - %(message)s")
fh.setFormatter(formatter)
ch.setFormatter(formatter)
logger.addHandler(fh)
logger.addHandler(ch)

app = Flask(__name__)
app.config["SECRET_KEY"] = "BlaBlub42"
socketio = SocketIO(app)
PORT = 62155
HOST = "185.26.156.31"

def replaceIDs(json, matchID):
	jsonType = type(json)
	logger.info(jsonType)
	if (jsonType is list):
		for entry in json:
			replaceIDs(entry, matchID)
	elif (jsonType is dict):
		for key in json:
			if (key == "id"):
				if (json[key] == -1):
					conn = sqlite3.connect(DBNAME, isolation_level="EXCLUSIVE")
					objectID = conn.execute("SELECT objectID FROM matches WHERE matchID=?", (matchID,)).fetchone()[0]
					json[key] = objectID
					objectID += 1
					conn.execute("UPDATE OR REPLACE matches SET objectID=? WHERE matchID=?", (objectID,matchID,))
					conn.commit()
					conn.close()
			else:
				replaceIDs(json[key], matchID)

@socketio.on("communicate")
def handleJSON(json):
	logger.info(json)
	matchID = json["matchID"]
	senderID = json["senderID"]
	messages = json["messages"]
	for message in messages:
		messageType = message["type"]
		messageData = message["data"]
		if (messageType == "create"):
			replaceIDs(messageData, matchID)
		if (messageType == "update"):
			pass
	logger.info(json)
	emit("communicate", json, room=None)#//TODO room
	
@socketio.on("connect")
def handleConnect():
    logger.info("connected")

@socketio.on("disconnect")
def handleDisconnect():
    logger.info("disconnected")


@app.route('/')
def index():
    return render_template('testio.html')

if __name__ == "__main__":
	conn = sqlite3.connect(DBNAME)
	conn.execute("CREATE TABLE IF NOT EXISTS participates (userID NUMBER, matchID NUMBER, PRIMARY KEY(userID, matchID))")
	conn.execute("CREATE TABLE IF NOT EXISTS users (userID NUMBER, name TEXT, password TEXT, PRIMARY KEY(userID))")
	conn.execute("CREATE TABLE IF NOT EXISTS matches (matchID NUMBER, objectID NUMBER, name TEXT, password TEXT, PRIMARY KEY(matchID))")
	conn.execute("INSERT OR REPLACE INTO users (userID, name, password) VALUES (?, ?, ?)", (1,"Coding","BlaBlub42",))
	conn.execute("INSERT OR REPLACE INTO matches (matchID, name, password, objectID) VALUES (?, ?, ?, 0)", (1,"Coding's match","",))
	conn.execute("INSERT OR REPLACE INTO participates (matchID, userID) VALUES (?, ?)", (1,1,))
	conn.commit()
	conn.close()
	logger.info("started")
	socketio.run(app, host=HOST, port=PORT, debug=False)

