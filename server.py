#!/usr/bin/env python3.4

#pip install flask-socketio
#pip install eventlet

from flask import Flask, render_template, request, session, redirect
from flask_socketio import SocketIO, join_room, leave_room, emit
import sqlite3
from enum import Enum
import logging
#http://coding42.diphda.uberspace.de:62155/match?deck=deck&team=0&match=1
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

def listMatches():
	res = []
	conn = sqlite3.connect(DBNAME, isolation_level="EXCLUSIVE")
	reults = conn.execute("SELECT matchID FROM matches").fetchall()
	for result in results:
		res.append(result[0])
	conn.close()
	return res

def joinMatch(userId, matchID):
	conn = sqlite3.connect(DBNAME)
	joinedMatch = True
	logger.info("11")
	logger.info(conn.execute("SELECT Count(*) FROM matches WHERE matchID=?", (matchID,)).fetchone()[0])
	"""if (conn.execute("SELECT Count(*) FROM matches WHERE matchID=?", (matchID,)).fetchone()[0] == 0):
		logger.info("12")
		joinedMatch = False
		conn.execute("INSERT OR REPLACE INTO matches (matchID, objectID) VALUES (?, 0)", (matchID,))
		logger.info("13")
	conn.execute("INSERT OR REPLACE INTO participates (matchID, userID) VALUES (?, ?)", (matchID,userID,))"""
	logger.info("12")
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
	emit("communicate", json, room=1)#//TODO room
	
@socketio.on("join")
def handleJoin(json):
	logger.info("join")
	logger.info(json)
	team = json["team"]
	matchID = json["matchID"]
	userId = getUserID()
	json["id"] = userId
	json["name"] = getUser()
	join_room(matchID)
	requestUpdate = joinMatch(userId, matchID)
	if (requestUpdate):
		json["requestUpdate"] = True
	else:
		json["requestUpdate"] = False
	emit("join", json, room=None)
	
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
	playerID = json["playerID"]
	matchID = json["matchID"]
	emit("requestUpdate", json, room=matchID)
	
@socketio.on("update")
def handleUpdate(json):
	logger.info("update")
	logger.info(json)
	playerID = json["playerID"]
	matchID = json["matchID"]
	emit("update", json, room=matchID)#TODO only send to target
	
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
	html = beginHTML(request)
	html += "\
		<div class='container'>\n\
			<div class='row'>\n\
				<div class='col-xs-4'></div>\n\
				<div class='col-xs-4'>\n\
					<form action='' method='post'>\n\
						<div class='form-group'>\n\
							<label for='user'>Benutzer</label>\n\
							<input type='text' class='form-control' id='user' name='user' placeholder='Benutzer (a-zA-Z0-9)'>\n\
						</div>\n\
						<div class='form-group'>\n\
							<label for='password'>Passwort</label>\n\
							<input type='password' class='form-control' id='password' name='password' placeholder='Passwort'>\n\
						</div>\n\
						<div class='form-group'>\n\
							<label for='passwordRepeat'>Passwort wiederholen</label>\n\
							<input type='password' class='form-control' id='passwordRepeat' name='password2' placeholder='Passwort'>\n\
						</div>\n\
						<button type='submit' class='btn btn-default'>Registrieren</button>\n\
					</form>\n\
				</div>\n\
				<div class='col-xs-4'></div>\n\
			</div>\n\
		</div>\n"
	html += endHTML(request)
	return html

def beginHTML(request):
	html = "\
<html>\n\
	<head>\n\
		<meta charset='utf-8'>\n\
		<meta http-equiv='X-UA-Compatible' content='IE=edge'>\n\
		<meta name='viewport' content='width=device-width, initial-scale=1'>\n\
		<link href='"+request.url_root+"static/css/bootstrap.min.css' rel='stylesheet'>\n\
		<link href='https://cdn.datatables.net/1.10.13/css/dataTables.bootstrap4.min.css' rel='stylesheet'>\n\
		<style>\n\
			html\n\
			{\n\
				position: relative;\n\
				min-height: 100%;\n\
			}\n\
			body\n\
			{\n\
				padding-top: 7.5%;\n\
				padding-bottom: 5%;\n\
				margin-bottom: 60px\n\
			}\n\
			.footer {\n\
				position: absolute;\n\
				bottom: 0;\n\
				width: 100%;\n\
				background-color: #f5f5f5;\n\
			}\n\
		</style>\n\
		<title>Tournament</title>\n\
	</head>\n\
	<body>\n\
		<script src='https://ajax.googleapis.com/ajax/libs/jquery/1.12.4/jquery.min.js'></script>\n\
		<script src='"+request.url_root+"static/js/bootstrap.min.js'></script>\n\
		<script src='https://cdn.datatables.net/1.10.13/js/jquery.dataTables.min.js'></script>\n\
		<script src='https://cdn.datatables.net/1.10.13/js/dataTables.bootstrap4.min.js'></script>\n"
	html += navBar(request)
	return html

def endHTML(request):
	html = "\
		<footer class='footer'>\n\
			<div class='container'>\n\
				<span class='text-muted'><a href='"+request.url_root+"impressum'>Impressum</a></span>\n\
			</div>\n\
		</footer>\n\
	</body>\n\
</html>\n"
	return html

if __name__ == "__main__":
	conn = sqlite3.connect(DBNAME)
	conn.execute("CREATE TABLE IF NOT EXISTS participates (userID NUMBER, matchID NUMBER, PRIMARY KEY(userID, matchID))")
	conn.execute("CREATE TABLE IF NOT EXISTS users (userID NUMBER, name TEXT, password TEXT, PRIMARY KEY(userID))")
	conn.execute("CREATE TABLE IF NOT EXISTS matches (matchID NUMBER, objectID NUMBER, PRIMARY KEY(matchID))")
	conn.execute("INSERT OR REPLACE INTO users (userID, name, password) VALUES (?, ?, ?)", (1,"Coding","BlaBlub42",))
	conn.execute("INSERT OR REPLACE INTO users (userID, name, password) VALUES (?, ?, ?)", (2,"duli","duli",))
	conn.commit()
	conn.close()
	logger.info("started on "+HOST+":"+str(PORT))
	socketio.run(app, host=HOST, port=PORT, debug=False)