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
function openDB(callback)
{
	let request = window.indexedDB.open("wargame", 2);
	request.onupgradeneeded = function(event)
	{
		db = event.target.result;
		if (!db.objectStoreNames.contains("units"))
		{
			db.createObjectStore("units", {keyPath: "name"});
		}
		if (!db.objectStoreNames.contains("weapons"))
		{
			db.createObjectStore("weapons", {keyPath: "name"});
		}
		if (!db.objectStoreNames.contains("groups"))
		{
			db.createObjectStore("groups", {keyPath: "name"});
		}
	};
	request.onsuccess = callback;
}
function newDBGroup()
{
	return {
		name: "",
		units: [],
		price: 0
	};
}
function listWeapons(callback)
{
	let ret = [];
	var objectStore = db.transaction("weapons").objectStore("weapons").openCursor().onsuccess = function(event)
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
	var objectStore = db.transaction("units").objectStore("units").openCursor().onsuccess = function(event)
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
function Group()
{
	this.min = new Unit();
	this.units = [];
	this.groups = [];
	this.group = null;
	this.olObject = null;
	this.target = null;
	this.player = null;
	this.pos = [0,0];
	this.moved = true;
	this.visible = false;
	this.spots = [];
	this.altitude = 0;
	this.dir = -1;
	this.opacity = 0.0;
}
Group.prototype.canSee = function(group)
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
Group.prototype.addUnit = function(unit)
{
	this.units.push(unit);
	unit.group = this;
	if (unit.speed < this.min.speed)
	{
		this.min.speed = unit.speed;
	}
	if (unit.optics > this.min.optics)
	{
		this.min.optics = unit.optics;
	}
	if (unit.opticsIR > this.min.opticsIR)
	{
		this.min.opticsIR = unit.opticsIR;
	}
	if (unit.ir*unit.camouflageIR > this.min.ir*this.min.camouflageIR)
	{
		this.min.ir = unit.ir;
		this.min.camouflageIR = unit.camouflageIR;
	}
	if (unit.camouflage < this.min.camouflage)
	{
		this.min.camouflage = unit.camouflage;
	}
	if (unit.sound > this.min.sound)
	{
		this.min.sound = unit.sound;
	}
	if (unit.radarAir > this.min.radarAir)
	{
		this.min.radarAir = unit.radarAir;
	}
	if (unit.radarWeapon > this.min.radarWeapon)
	{
		this.min.radarWeapon = unit.radarWeapon;
	}
	if (unit.camouflageRadar < this.min.camouflageRadar)
	{
		this.min.camouflageRadar = unit.camouflageRadar;
	}
};
Group.prototype.addGroup = function(group)
{
	this.groups.push(group);
	group.group = this;
};
Group.prototype.setPos = function(pos)
{
	document.getElementById("lat").innerHTML = pos[0];
	document.getElementById("lon").innerHTML = pos[1];
	position = ol.proj.transform(pos, "EPSG:4326", "EPSG:3857");
	this.olObject.getGeometry().setCoordinates(position);
	this.pos3857 = position;
	this.pos4326 = pos;
	this.latlon = new LatLon(pos[0], pos[1]);
};
Group.prototype.getSymbol = function()
{
	let version = "10"
	let standardIdentity = "03";
	if (this.isEnemy())
	{
		standardIdentity = "06";
	}
	let symbolSet = "10";
	let status = "0";
	let hqtfDummy = "0";
	let amplifier = "11";
	let entity = "12";
	let entityType = "11";
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
	return new ms.Symbol(version+standardIdentity+symbolSet+status+hqtfDummy+amplifier+entity+entityType+entitySuptype+modifier1+modifier2,{size:30,colorMode:"Light",commonIdentifier:"Rifleman '90",altitudeDepth:altitude,direction:direction,speed:""+this.min.speed,combatEffectiveness:""+this.min.prize,headquartersElement:this.player.name,type:type});
};
Group.prototype.setOpacity = function(opacity)
{
	this.opacity = opacity;
	let ratio = window.devicePixelRatio || 1;
	let symbol = this.getSymbol();
	let olStyle = new ol.style.Style({
		image: new ol.style.Icon({
			anchor: [0.5, 0.5],
			anchorXUnits: "fraction",
			anchorYUnits: "fraction",
			opacity: opacity,
			imgSize: [Math.floor(symbol.getSize().width), Math.floor(symbol.getSize().height)],
			img: symbol.asCanvas(),
			scale: 1/ratio
		})
	});
	this.olObject.setStyle(olStyle);//TODO remove
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
Group.prototype.isEnemy = function()
{
	return this.player.team != player.team;
};
Group.prototype.isFriend = function()
{
	return this.player.team == player.team;
};
