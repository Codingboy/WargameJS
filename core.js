function gup(name, url)
{
	if (!url) url = location.href;
	name = name.replace(/[\[]/,"\\\[").replace(/[\]]/,"\\\]");
	var regexS = "[\\?&]"+name+"=([^&#]*)";
	var regex = new RegExp(regexS);
	var results = regex.exec(url);
	return results == null ? null : results[1];
}
function newDBWeapon()
{
	return {
		name: "G36",
		type: "AssaultRifle",
		guideType: "Unguided",
		damageType: "FMJ",
		rpm: 30,
		magazineSize: 30,
		magazines: 10,
		reloadTime: 5,
		range: 600,
		damage: 1.0,
		damageRadius: 0,
		speed: 0,
		lockChance: 0,
		price: 3000,
		inaccuracy: 0.1,
		weight: 5.0,
		suppressed: 0,
		sound: 1000,//hearable within a range in meter
		criticalHitChance: 0.01//critical hit chance
	};
}
function initDB(callback)
{
	console.log("openDB");
	window.indexedDB = window.indexedDB || window.mozIndexedDB || window.webkitIndexedDB || window.msIndexedDB;
	window.IDBTransaction = window.IDBTransaction || window.webkitIDBTransaction || window.msIDBTransaction;
	window.IDBKeyRange = window.IDBKeyRange || window.webkitIDBKeyRange || window.msIDBKeyRange;
	let request = window.indexedDB.open("wargame", 5);
	request.onupgradeneeded = function(event)
	{
		coreDB = event.target.result;
		console.log("coreDB");
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
		console.log("coreDB");
		callback(event);
	};
	request.onerror = function(event)
	{
		alert("DBError");
	};
}
function newDBGroup()
{
	return {
		name: "",
		units: [],
		price: 0
	};
}
function newDBDeck()
{
	return {
		name: "",
		units: [],
		groups: []
	};
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
function Player()
{
	this.name = "";
	this.team = 1;
	this.groups = [];
}
Player.prototype.isEnemy = function()
{
	return this.team != player.team;
};
Player.prototype.isFriend = function()
{
	return this.team == player.team;
};
function newDBUnit()
{
	return {
		name: "",
		type: "Infantry",
		sound: 10,//hearable within a range in meter
		speed: 15,//speed
		optics: 200,//range the daylight optic is working with in meter
		opticsQuality: 0,//counters enemy camouflage
		opticsIR: 0,//range the IR optic is working with in meter
		opticsIRQuality: 0,//counters enemy camouflageIR
		camouflage: 0.25,//percentage of invisibillity
		camouflageIR: 0.0,//percentage of IR invisibillity
		radarAir: 0,//range of airradar
		radarAirQuality: 0,//counters enemy camouflageRadar
		radarWeapon: 0,//range of weapon tracking radar
		camouflageRadar: 0.0,//percentage of radar invisibillity
		ecm: 0,//range of ecm to suppress radars
		ecmChance: 0,//successrate of ecm
		ircmChance: 0,//successrate of ircm
		flares: 0,//number of carried flares
		flareChance: 0,//successrate of flares
		chaffs: 0,//number of carried chaffs
		chaffChance: 0,//successrate of chaffs
		smoke: 0,//number of carried smoke
		smokeChance: 0,//successrate of smoke
		radio: 2000,//range of radio in meter
		radioJammer: 0,//range of radioJammer
		radioJammerChance: 0,//successrate of radioJammer
		fuel: 0,//size of fueltank in liter
		lads: 0,//range of lads
		ladsChance: 0,//successrate of lads
		mineDetection: 0,//range of the minedetector in meter
		mineDetectionChance: 0,//successrate of mineDetection
		transportWeight: 0,//kg that can be transported
		resupplyFuel: 0,//liters of fuel
		resupplyAmmo: 0,//kg of ammo
		resupplyRepair: 0,//kg of repair
		resupplyMedical: 0,//hp of medical
		plateCarrier: 1,//unit wears platecarrier
		armourFront: 0,//armour in mm
		armourSide: 0,
		armourBack: 0,
		armourTop: 0,
		armourBottom: 0,
		armourType1: "",//type of primary armour
		armourType2: "",//type of secondary, outer armour
		weight: 100,//weight of the unit including weapon
		fuelConsumption: 0,//fuelconsumption per hour
		price: 50000,//price of the unit including weapon
		weapons: [],//weaponnames,
		stabilisatorQuality: 0.0,//TODO
		courage: 0.0//TODO
	};
}
function newUnit(dbUnit)
{
	let ret = {
		dbUnit: dbUnit,
		flaresLeft: dbUnit.flares,
		chaffsLeft: dbUnit.chaffs,
		smokeLeft: dbUnit.smoke,
		fuelLeft: dbUnit.fuel,
		transportUnits: [],
		transportWeightLeft: dbUnit.transportWeight,
		resupplyFuelLeft: dbUnit.resupplyFuel,
		resupplyAmmoLeft: dbUnit.resupplyAmmo,
		resupplyRepairLeft: dbUnit.resupplyRepair,
		resupplyMedicalLeft: dbUnit.resupplyMedical,
		suppression: 0,
		weapons: [],
		radarAirJammed: [],
		radarAirJammedBy: [],
		radarWeaponJammed: [],
		radarWeaponJammedBy: [],
		radioJammed: [],
		radioJammedBy: [],
		spots: [],
		spotsIR: [],
		spotsRadarAir: [],
		spotsRadarWeapon: [],
		hears: [],
		spottedBy: [],
		spottedIRBy: [],
		spottedRadarAirBy: [],
		spottedRadarWeaponBy: [],
		hearedBy: [],
		group: null
	};
	for (let weapon of dbUnit.weapons)
	{
		ret.weapons.push(newWeapon(weapon));
	}
	return ret;
}
function Group(owner, pos)
{
	this.olObject = new ol.Feature({
				geometry: new ol.geom.Point(ol.proj.transform([0, 0], "EPSG:4326", "EPSG:3857"))
			});
	this.owner = owner;
	this.units = [];
	this.representation = null;
	this.pos = pos;
	this.altitude = 0;
	this.dir = -1;
	this.moved = false;
	this.waypoints = [];
	this.needsRedraw = false;
	this.name = "";
	this.opacity = 1;
	this.owner.groups.push(this);
	this.olObject.set("group", this);
	symbolSource.addFeature(this.olObject);
	if (this.owner.isFriend())
	{
		this.opacity = unselectedOpacity;
	}
	else
	{
		this.opacity = 0;
	}
}
Group.prototype.addUnit = function(unit)
{
	let req = db.transaction(["units"]).objectStore("units").get(unit);
	req.onsuccess = function(event)
	{
		if (req.result)
		{
			this.units.push(req.result);
			if (this.name == "")
			{
				this.name = req.result.name;
			}
			needsRedraw = true;
			if (this.representation == null)
			{
				this.representation = newUnit();
			}
		}
	};
};
Group.prototype.addGroup = function(group)
{
	console.log(JSON.stringify(this));
	let req = db.transaction(["groups"]).objectStore("groups").get(group);
	req.onsuccess = function(event)
	{
		if (req.result)
		{
			console.log(JSON.stringify(this));
			if (this.name == "")
			{
				this.name = req.result.name;
			}
			for (unit of req.result.units)
			{
				this.addUnit(unit);
			}
			needsRedraw = true;
		}
	};
};
Group.prototype.getSymbol = function()//http://explorer.milsymb.net/#/explore/
{
	if (representation.dbUnit.type == "Infantry")
	{
		let version = "10"
		let standardIdentity = "01";
		if (this.owner.isFriend())
		{
			standardIdentity = "03";
		}
		if (this.owner.isEnemy())
		{
			standardIdentity = "06";
		}
		if (this.owner.isNeutral())
		{
			standardIdentity = "04";
		}
		if (this.isEnemy())
		{
			standardIdentity = "06";
		}
		let symbolSet = "10";//TODO missiles, air
		let status = "0";//TODO 3=damaged, 4=destroyed
		let hqtfDummy = "0";
		let amplifier = "11";
		if (representation.dbUnit.type == "Infantry")
		{
			let count = this.units.length;
			if (count <= 2)
			{
				amplifier = "11";
			}
			else if (count <= 4)
			{
				amplifier = "12";
			}
			else if (count <= 8)
			{
				amplifier = "13";
			}
			else if (count <= 16)
			{
				amplifier = "14";
			}
			else if (count <= 32)
			{
				amplifier = "15";
			}
			else if (count <= 64)
			{
				amplifier = "16";
			}
			else if (count <= 128)
			{
				amplifier = "17";
			}
			else if (count <= 256)
			{
				amplifier = "18";
			}
		}
		else
		{
			let count = this.units.length;
			if (count == 1)
			{
				amplifier = "11";
			}
			else if (count == 2)
			{
				amplifier = "12";
			}
			else if (count == 3)
			{
				amplifier = "13";
			}
			else if (count == 4)
			{
				amplifier = "14";
			}
			else if (count == 5)
			{
				amplifier = "15";
			}
			else if (count == 6)
			{
				amplifier = "16";
			}
			else if (count == 7)
			{
				amplifier = "17";
			}
			else if (count == 8)
			{
				amplifier = "18";
			}
		}
		let entity = "12";
		let entityType = "11";
		if (representation.dbUnit.type == "Infantry")
		{
			entityType = "11";
		}
		let entitySuptype = "00";
		let modifier1 = "00";
		let modifier2 = "00";
		let altitude = "";
		if (this.altitude != 0)
		{
			altitude = ""+this.altitude;
		}
		let type = "";//TODO set to transported units name
		let direction = undefined;
		if (this.dir != -1)
		{
			direction = this.dir;
		}
		let commonIdentifier = this.name;
		return new ms.Symbol(version+standardIdentity+symbolSet+status+hqtfDummy+amplifier+entity+entityType+entitySuptype+modifier1+modifier2,{size:30,colorMode:"Light",commonIdentifier:commonIdentifier,altitudeDepth:altitude,direction:direction,speed:""+this.representation.speed,combatEffectiveness:""+this.representation.prize,headquartersElement:this.player.name,type:type});
	}
};
Group.prototype.redraw = function()
{
	let ratio = window.devicePixelRatio || 1;
	let symbol = this.getSymbol();
	let olStyle = new ol.style.Style({
		image: new ol.style.Icon({
			anchor: [0.5, 0.5],
			anchorXUnits: "fraction",
			anchorYUnits: "fraction",
			opacity: this.opacity,
			imgSize: [Math.floor(symbol.getSize().width), Math.floor(symbol.getSize().height)],
			img: symbol.asCanvas(),
			scale: 1/ratio
		})
	});
	this.olObject.setStyle(olStyle);
};
function newWeapon(dbWeapon)
{
	return {
		dbWeapon: dbWeapon,
		magazinesLeft: dbWeapon.magazines,//amount of magazines excluding loaded magazine
		bulletsLeft: dbWeapon.magazineSize//rounds in current magazine
	};
}
function setValues(element, min, value, max, step)
{
	e = document.getElementById(element);
	e.min = min;
	e.max = max;
	e.value = value;
	e.step = step;
}
function hide(elements)
{
	for (let element of elements)
	{
		document.getElementById(element).style.display = "none";
	}
}
function show(elements)
{
	for (let element of elements)
	{
		document.getElementById(element).style.display = "block";
	}
}
function Unit()
{
	this.group = null;
	this.id = 1;
	this.radarAirJammed = false;
	this.radarWeaponJammed = false;
	this.radioJammed = false;
	this.flaresLeft = 0;
	this.chaffsLeft = 0;
	this.smokeLeft = 0;
	this.fuelLeft = 0;
	this.suppression = 0.0;//percentage of suppression
	this.type = "infantry";
	this.prize = 0;
}
Group.prototype.canSee = function(group)//TODO
{
	let camouflage = group.camouflage*(1-this.opticsQuality);
	let optics = this.optics*(1-camouflage);
	let distance = this.latlon.distanceTo(group.latlon);
	if (optics >= distance)
	{
		return true;
	}
	//TODO
}
