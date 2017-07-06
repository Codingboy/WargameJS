#!/usr/bin/env python3.4

#pip install flask
#pip install flask-socketio
#pip install eventlet

from flask import Flask, render_template, request, session, redirect
from flask_socketio import SocketIO, join_room, leave_room, emit
import sqlite3
from enum import Enum
import logging
import signal
import sys

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
HOST = "coding42.diphda.uberspace.de"

def signalHandler(signal, frame):
	conn = sqlite3.connect(DBNAME)
	cursor = conn.cursor()
	conn.execute("DELETE FROM matches")
	conn.execute("DELETE FROM participates")
	conn.commit()
	conn.close()
	sys.exit(0)
signal.signal(signal.SIGINT, signalHandler)

@app.route('/base')
def base():
	return render_template('base.html', loggedin=(getUserID()!=-1))

@app.route('/child')
def child():
	return render_template('child.html')

@app.route('/impressum')
def impressum():
	return render_template('impressum.html', loggedin=(getUserID()!=-1))

@app.route('/')
def index():
	return render_template('index.html', loggedin=(getUserID()!=-1))

@app.route('/weapon')
def weapon():
	return render_template('weapon.html', loggedin=(getUserID()!=-1))

@app.route('/unit')
def unit():
	return render_template('unit.html', loggedin=(getUserID()!=-1))

@app.route('/group')
def group():
	return render_template('group.html', loggedin=(getUserID()!=-1))

@app.route('/deck')
def deck():
	return render_template('deck.html', loggedin=(getUserID()!=-1))

@app.route('/match')
def match():
	return render_template('match.html', loggedin=(getUserID()!=-1))

@app.route('/list')
def list():
	return render_template('list.html', loggedin=(getUserID()!=-1))

@app.route("/favicon.ico")
def favicon():
	return redirect("/static/favicon.ico", code=302)

@app.route('/matches')
def matches():
	matches = listMatches()
	matchDict = {}
	for match in matches:
		matchDict["name"] = match
		matchDict["url"] = "/match?deck=deck&team=0&match="+str(match)#TODO
	return render_template('matches.html', loggedin=(getUserID()!=-1), matches=matchDict)

def listMatches():
	res = []
	conn = sqlite3.connect(DBNAME, isolation_level="EXCLUSIVE")
	reults = conn.execute("SELECT matchID FROM matches").fetchall()
	for result in results:
		res.append(result[0])
	conn.close()
	return res

def joinMatch(userID, matchID):
	conn = sqlite3.connect(DBNAME)
	joinedMatch = True
	if (conn.execute("SELECT Count(*) FROM matches WHERE matchID=?", (matchID,)).fetchone()[0] == 0):
		joinedMatch = False
		conn.execute("INSERT OR REPLACE INTO matches (matchID, objectID) VALUES (?, 0)", (matchID,))
	conn.execute("INSERT OR REPLACE INTO participates (matchID, userID) VALUES (?, ?)", (matchID,userID,))
	conn.commit()
	conn.close()
	return joinedMatch

def leaveMatch(userID, matchID):
	conn = sqlite3.connect(DBNAME)
	conn.execute("DELETE FROM participates WHERE userID=? AND matchID=?", (userID,matchID,))
	if (conn.execute("SELECT Count(*) FROM participates WHERE matchID=?", (matchID,)).fetchone() == 0):
		conn.execute("DELETE FROM matches WHERE matchID=?", (matchID,))
	conn.commit()
	conn.close()

def replaceIDs(json, matchID):
	jsonType = type(json)
	if (jsonType is list):
		for entry in json:
			replaceIDs(entry, matchID)
	elif (jsonType is dict):
		ids = 1
		if ("ids" in json):
			ids = json["ids"]
		for key in json:
			if (key == "id"):
				if (json[key] == -1):
					conn = sqlite3.connect(DBNAME, isolation_level="EXCLUSIVE")
					objectID = conn.execute("SELECT objectID FROM matches WHERE matchID=?", (matchID,)).fetchone()[0]
					json[key] = objectID
					objectID += ids
					conn.execute("UPDATE OR REPLACE matches SET objectID=? WHERE matchID=?", (objectID,matchID,))
					conn.commit()
					conn.close()
			else:
				replaceIDs(json[key], matchID)

@socketio.on("communicate")
def handleCommunicate(json):
	logger.info("communicate")
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
	emit("communicate", json, room=matchID)
	
@socketio.on("join")
def handleJoin(json):
	logger.info("join")
	logger.info(json)
	team = json["team"]
	matchID = json["matchID"]
	userID = getUserID()
	json["id"] = userID
	json["name"] = getUser()
	join_room(matchID)
	requestUpdate = joinMatch(userID, matchID)
	if (requestUpdate):
		json["requestUpdate"] = True
	else:
		json["requestUpdate"] = False
	emit("join", json, room=None)#None IS CORRECT, DONT TOUCH IT!!!
	
@socketio.on("joined")
def handleJoined(json):
	logger.info("joined")
	logger.info(json)
	matchID = json["matchID"]
	emit("joined", json, room=matchID)
	
@socketio.on("requestUpdate")
def handleRequestUpdate(json):
	logger.info("requestUpdate")
	logger.info(json)
	matchID = json["matchID"]
	emit("requestUpdate", json, room=matchID)
	
@socketio.on("update")
def handleUpdate(json):
	logger.info("update")
	logger.info(json)
	matchID = json["matchID"]
	emit("update", json, room=matchID)#TODO only send to target
	
@socketio.on("ready")
def handleReady(json):
	logger.info("ready")
	logger.info(json)
	matchID = json["matchID"]
	emit("ready", json, room=matchID)
	
@socketio.on("connect")
def handleConnect():
	logger.info("connect")

@socketio.on("disconnect")
def handleDisconnect():
	logger.info("disconnect")

def getUser():
	user = "Guest"
	if ("user" in session):
		user = session["user"]
	return user

def getUserID():
	userID = -1
	if ("userID" in session):
		userID = session["userID"]
	return userID

@app.route("/login", methods=["POST"])
def login():
	if request.method == "POST":
		if ("user" in request.form and "password" in request.form):
			user = request.form["user"]
			password = request.form["password"]
			""""h = hashlib.new("sha256")
			h.update(request.form["password"].encode("utf-8"))
			password = h.hexdigest()"""
			connection = sqlite3.connect(DBNAME)
			cursor = connection.cursor()
			if (cursor.execute("SELECT Count(*) FROM users WHERE name=?", (user,)).fetchone()[0] > 0):
				dbEntry = cursor.execute("SELECT password,userID FROM users WHERE name=?", (user,))
				row = dbEntry.fetchone()
				pw = row[0]
				userID = row[1]
				connection.close()
				if (pw == password):
					session["user"] = user
					session["userID"] = userID
					logging.getLogger(PROJECTNAME).info(user+" logged in")
					return redirect(redirect_url(), code=302)
				else:
					logging.getLogger(PROJECTNAME).warning(user+" tried to log in")
					return redirect(redirect_url(), code=302)
			else:
				return redirect(redirect_url(), code=302)

def redirect_url(default='index'):
	return request.args.get('next') or \
		   request.referrer or \
		   url_for(default)

@app.route("/logout", methods=["GET", "POST"])
def logout():
	logging.getLogger(PROJECTNAME).info(session["user"]+" logged out")
	session.pop("user", None)
	session.pop("userID", None)
	return redirect(redirect_url(), code=302)

@app.route("/register", methods=["GET", "POST"])
def register():
	if request.method == "POST":
		if ("user" in request.form and "password" in request.form and "password2" in request.form):
			user = request.form["user"]
			password = request.form["password"]
			password2 = request.form["password2"]
			connection = sqlite3.connect(DBNAME)
			cursor = connection.cursor()
			userCount = cursor.execute("SELECT Count(*) FROM users WHERE user=?", (user,)).fetchone()[0]
			connection.close()
			if (userCount == 0 and password == password2 and re.match("^[a-zA-Z0-9]+$", user) is not None):
				""""h = hashlib.new("sha256")
				h.update(request.form["password"].encode("utf-8"))
				password = h.hexdigest()"""
				connection = sqlite3.connect(DBNAME)
				cursor = connection.cursor()
				cursor.execute("INSERT OR REPLACE INTO users (name, password) VALUES(?, ?)", (user, password,))
				connection.commit()
				connection.close()
				logging.getLogger(PROJECTNAME).info(user+" registered")
				session["user"] = user
				session["userID"] = cursor.execute("SELECT userID FROM users WHERE name=?", (user,)).fetchone()[0]
				return redirect(request.url_root, code=302)
			else:
				logging.getLogger(PROJECTNAME).info(user+" tried to register")
				return redirect(request.url_root+"register", code=302)
	return render_template('register.html', loggedin=(getUserID()!=-1))

if __name__ == "__main__":
	conn = sqlite3.connect(DBNAME)
	conn.execute("CREATE TABLE IF NOT EXISTS participates (userID NUMBER, matchID NUMBER, PRIMARY KEY(userID, matchID))")
	conn.execute("CREATE TABLE IF NOT EXISTS users (userID NUMBER, name TEXT, password TEXT, PRIMARY KEY(userID))")
	conn.execute("CREATE TABLE IF NOT EXISTS matches (matchID NUMBER, objectID NUMBER, PRIMARY KEY(matchID))")
	conn.execute("INSERT OR REPLACE INTO users (userID, name, password) VALUES (?, ?, ?)", (1,"Coding","BlaBlub42",))
	conn.execute("INSERT OR REPLACE INTO users (userID, name, password) VALUES (?, ?, ?)", (2,"duli","duli",))
	conn.commit()
	conn.close()
	logger.info("http://explorer.milsymb.net/#/explore/")
	logger.info("http://gpso.de/maps/")
	logger.info('http://coding42.diphda.uberspace.de:62155/match?deck=deck&team=0&match=1&map={"bb":[50.04142,8.18841,50.04459,8.20990],"interest":0.0099,"moneyTick":1,"moneyPerTick":10000,"minMoney":-1000000,"spawns":[{"team":0,"points":[[8.18877,50.04166],[8.19135,50.04195],[8.19088,50.04360],[8.18828,50.04338],[8.18877,50.04166]]},{"team":1,"points":[[8.20626,50.04192],[8.20942,50.04148],[8.20989,50.04280],[8.20678,50.04351],[8.20626,50.04192]]},{"team":1,"points":[[8.19136,50.04193],[8.19396,50.04216],[8.19350,50.04399],[8.19091,50.04359],[8.19136,50.04193]]}],"sectors":[{"points":[[8.19826,50.04210],[8.20085,50.04210],[8.20055,50.04461],[8.19794,50.04454],[8.19826,50.04210]]}]}')
	socketio.run(app, host=HOST, port=PORT, debug=False)
