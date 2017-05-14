function gup(name, url)
{
	if (!url) url = location.href;
	console.log(url);
	url = decodeURI(url);
	console.log(url);
	name = name.replace(/[\[]/,"\\\[").replace(/[\]]/,"\\\]");
	var regexS = "[\\?&]"+name+"=([^&#]*)";
	var regex = new RegExp(regexS);
	var results = regex.exec(url);
	return results == null ? null : results[1];
}
function replaceURL(url)
{
	while (str.indexOf("%22") != -1)
	{
		url = url.replace("/%22/g", '"');
	}
	while (str.indexOf("%27") != -1)
	{
		url = url.replace("/%27/g", "'");
	}
	return url;
}
function DBWeapon()
{
	this.name = "G36";
	this.type = "AssaultRifle";
	this.guideType = "Unguided";
	this.damageType = "FMJ";
	this.rpm = 30;
	this.magazineSize = 30;
	this.magazines = 10;
	this.reloadTime = 5;
	this.range = 600;
	this.damage = 1.0;
	this.damageRadius = 0;
	this.speed = 0;
	this.lockChance = 0;
	this.price = 3000;
	this.inaccuracy = 0.1;
	this.weight = 5.0;
	this.suppressed = 0;
	this.sound = 1000;//hearable within a range in meter
	this.criticalHitChance = 0.01;//critical hit chance
}
function initDB(callback)
{
	window.indexedDB = window.indexedDB || window.mozIndexedDB || window.webkitIndexedDB || window.msIndexedDB;
	window.IDBTransaction = window.IDBTransaction || window.webkitIDBTransaction || window.msIDBTransaction;
	window.IDBKeyRange = window.IDBKeyRange || window.webkitIDBKeyRange || window.msIDBKeyRange;
	let request = window.indexedDB.open("wargame", 6);
	request.onupgradeneeded = function(event)
	{
		coreDB = event.target.result;
		if (!coreDB.objectStoreNames.contains("units"))
		{
			coreDB.createObjectStore("units", {keyPath: "name"});
		}
		if (!coreDB.objectStoreNames.contains("weapons"))
		{
			coreDB.createObjectStore("weapons", {keyPath: "name"});
		}
		if (!coreDB.objectStoreNames.contains("groups"))
		{
			coreDB.createObjectStore("groups", {keyPath: "name"});
		}
		if (!coreDB.objectStoreNames.contains("decks"))
		{
			coreDB.createObjectStore("decks", {keyPath: "name"});
		}
	};
	request.onsuccess = function(event)
	{
		coreDB = event.target.result;
		callback(event);
	};
	request.onerror = function(event)
	{
		alert("DBError");
	};
}
function DBGroup()
{
	this.name = "";
	this.units = [];
	this.price = 0;
}
function DBDeck()
{
	this.name = "";
	this.units = [];
	this.groups = [];
}
function listWeapons(callback)
{
	let ret = [];
	var objectStore = coreDB.transaction("weapons").objectStore("weapons").openCursor().onsuccess = function(event)
	{
		var cursor = event.target.result;
		if (cursor)
		{
			ret.push(cursor.value.name);
			cursor.continue();
		}
		else
		{
			callback(ret);
		}
	};
}
function listUnits(callback)
{
	let ret = [];
	var objectStore = coreDB.transaction("units").objectStore("units").openCursor().onsuccess = function(event)
	{
		var cursor = event.target.result;
		if (cursor)
		{
			ret.push(cursor.value.name);
			cursor.continue();
		}
		else
		{
			callback(ret);
		}
	};
}
function listGroups(callback)
{
	let ret = [];
	var objectStore = coreDB.transaction("groups").objectStore("groups").openCursor().onsuccess = function(event)
	{
		var cursor = event.target.result;
		if (cursor)
		{
			ret.push(cursor.value.name);
			cursor.continue();
		}
		else
		{
			callback(ret);
		}
	};
}
function listDecks(callback)
{
	let ret = [];
	var objectStore = coreDB.transaction("decks").objectStore("decks").openCursor().onsuccess = function(event)
	{
		var cursor = event.target.result;
		if (cursor)
		{
			ret.push(cursor.value.name);
			cursor.continue();
		}
		else
		{
			callback(ret);
		}
	};
}

function DBUnit()
{
	size = 1.0;
	name = "";
	type = "Infantry";
	sound = 10;//hearable within a range in meter
	speed = 15;//speed
	optics = 200;//range the daylight optic is working with in meter
	opticsQuality = 0;//counters enemy camouflage
	opticsIR = 0;//range the IR optic is working with in meter
	opticsIRQuality = 0;//counters enemy camouflageIR
	camouflage = 0.25;//percentage of invisibillity
	camouflageIR = 0.0;//percentage of IR invisibillity
	radarAir = 0;//range of airradar
	radarAirQuality = 0;//counters enemy camouflageRadar
	radarWeapon = 0;//range of weapon tracking radar
	camouflageRadar = 0.0;//percentage of radar invisibillity
	ecm = 0;//range of ecm to suppress radars
	ecmChance = 0;//successrate of ecm
	ircmChance = 0;//successrate of ircm
	flares = 0;//number of carried flares
	flareChance = 0;//successrate of flares
	chaffs = 0;//number of carried chaffs
	chaffChance = 0;//successrate of chaffs
	smoke = 0;//number of carried smoke
	smokeChance = 0;//successrate of smoke
	radio = 2000;//range of radio in meter
	radioJammer = 0;//range of radioJammer
	radioJammerChance = 0;//successrate of radioJammer
	fuel = 0;//size of fueltank in liter
	lads = 0;//range of lads
	ladsChance = 0;//successrate of lads
	mineDetection = 0;//range of the minedetector in meter
	mineDetectionChance = 0;//successrate of mineDetection
	transportWeight = 0;//kg that can be transported
	resupplyFuel = 0;//liters of fuel
	resupplyAmmo = 0;//kg of ammo
	resupplyRepair = 0;//kg of repair
	resupplyMedical = 0;//hp of medical
	plateCarrier = 1;//unit wears platecarrier
	armourFront = 0;//armour in mm
	armourSide = 0;
	armourBack = 0;
	armourTop = 0;
	armourBottom = 0;
	armourType1 = "";//type of primary armour
	armourType2 = "";//type of secondary, outer armour
	weight = 100;//weight of the unit including weapon
	fuelConsumption = 0;//fuelconsumption per hour
	price = 50000;//price of the unit including weapon
	weapons = [];//weaponnames,
	stabilisatorQuality = 0.0;//TODO
	courage = 0.0;//TODO
	health = 1;
}


