function gup(name, url)
{
	if (!url) url = location.href;
	name = name.replace(/[\[]/,"\\\[").replace(/[\]]/,"\\\]");
	var regexS = "[\\?&]"+name+"=([^&#]*)";
	var regex = new RegExp(regexS);
	var results = regex.exec(url);
	return results == null ? null : results[1];
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
	return this.team != player.team && !this.isNeutral();
};
Player.prototype.isNeutral = function()
{
	return this.team == -1;
};
Player.prototype.isFriend = function()
{
	return this.team == player.team;
};
function newDBUnit()
{
	return {
		size: 1.0,
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
		courage: 0.0,//TODO
		health: 1
	};
}
function Unit(dbUnit, group)
{
	this.dbUnit = dbUnit;
	this.flaresLeft = dbUnit.flares;
	this.chaffsLeft = dbUnit.chaffs;
	this.smokeLeft = dbUnit.smoke;
	this.fuelLeft = dbUnit.fuel;
	this.transportUnits = [];
	this.transportWeightLeft = dbUnit.transportWeight;
	this.resupplyFuelLeft = dbUnit.resupplyFuel;
	this.resupplyAmmoLeft = dbUnit.resupplyAmmo;
	this.resupplyRepairLeft = dbUnit.resupplyRepair;
	this.resupplyMedicalLeft = dbUnit.resupplyMedical;
	this.suppression = 0;
	this.weapons = [];
	this.radarAirJammed = [];
	this.radarAirJammedBy = [];
	this.radarWeaponJammed = [];
	this.radarWeaponJammedBy = [];
	this.radioJammed = [];
	this.radioJammedBy = [];
	this.group = group;
	this.healthLeft = dbUnit.health;
	for (let weapon of this.dbUnit.weapons)
	{
		this.weapons.push(new Weapon(weapon));
	}
}
function Group(owner, pos)
{
	this.latlon = new LatLon(pos[0], pos[1]);
	this.olObject = new ol.Feature({
				geometry: new ol.geom.Point(ol.proj.transform([0, 0], "EPSG:4326", "EPSG:3857"))
			});
	let position = ol.proj.transform(pos, "EPSG:4326", "EPSG:3857");
	this.olObject.getGeometry().setCoordinates(position);
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
	this.spots = [];
	this.spotsIR = [];
	this.spotsRadarAir = [];
	this.spotsRadarWeapon = [];
	this.hears = [];
	this.spottedBy = [];
	this.spottedIRBy = [];
	this.spottedRadarAirBy = [];
	this.spottedRadarWeaponBy = [];
	this.hearedBy = [];
	this.owner.groups.push(this);
	this.olObject.set("group", this);
	symbolSource.addFeature(this.olObject);
	if (this.owner.isFriend())
	{
		this.opacity = unselectedOpacity;
	}
	else
	{
		this.opacity = invisibleEnemyOpacity;
	}
}
Group.prototype.addUnit = function(unit)
{
	let req = coreDB.transaction(["units"]).objectStore("units").get(unit);
	req.onsuccess = function(event)
	{
		let dbUnit = event.target.result;
		if (dbUnit)
		{
			this.units.push(new Unit(dbUnit, this));
			if (this.name == "")
			{
				this.name = dbUnit.name;
			}
			this.needsRedraw = true;
			if (!this.representation)
			{
				this.representation = new Unit(dbUnit, this);
			}
			else
			{
				this.representation.dbUnit.price += dbUnit.price;//TODO other values
			}
		}
	}.bind(this);
};
Group.prototype.addGroup = function(group)
{
	let req = coreDB.transaction(["groups"]).objectStore("groups").get(group);
	req.onsuccess = function(event)
	{
		let dbGroup = event.target.result;
		if (dbGroup)
		{
			if (this.name == "")
			{
				this.name = dbGroup.name;
			}
			for (unit of dbGroup.units)
			{
				this.addUnit(unit);
			}
			this.needsRedraw = true;
		}
	}.bind(this);
};
Group.prototype.getSymbol = function()//http://explorer.milsymb.net/#/explore/
{
	if (this.representation.dbUnit.type == "Infantry")
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
		let symbolSet = "10";//TODO missiles, air
		let status = "0";//TODO 3=damaged, 4=destroyed
		let hqtfDummy = "0";
		let amplifier = "11";
		if (this.representation.dbUnit.type == "Infantry")
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
		if (this.representation.dbUnit.type == "Infantry")
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
		return new ms.Symbol(version+standardIdentity+symbolSet+status+hqtfDummy+amplifier+entity+entityType+entitySuptype+modifier1+modifier2,{size:30,colorMode:"Light",commonIdentifier:commonIdentifier,altitudeDepth:altitude,direction:direction,speed:""+(Math.round(this.representation.dbUnit.speed*10)/10),combatEffectiveness:""+Math.round(this.representation.dbUnit.price),headquartersElement:this.owner.name,type:type});
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
Group.prototype.setPos = function(pos)
{
	this.pos = pos;
	this.latlon = new LatLon(pos[0], pos[1]);
	let position = ol.proj.transform(this.pos, "EPSG:4326", "EPSG:3857");
	this.olObject.getGeometry().setCoordinates(position);
}
function Weapon(dbWeapon)
{
	this.dbWeapon = dbWeapon;
	this.magazinesLeft = dbWeapon.magazines;//amount of magazines excluding loaded magazine
	this.bulletsLeft = dbWeapon.magazineSize;//rounds in current magazine
	this.reloadTimeLeft = 0;
	this.unusedTime = 0;
}
Weapon.prototype.dealDamage = function(group, hits)
{
	for (let i=0; i<hits; i++)
	{
		let index = Math.floor(Math.random() * group.units.length);
		let unit = group.units[index];
		let damage = this.dbWeapon.damage;//TODO distance
		let damageFactor = 1;
		if (unit.dbUnit.plateCarrier == 1)
		{
			if (this.dbWeapon.damageType == "FMJ")
			{
				damageFactor = 0.25;
			}
			if (this.dbWeapon.damageType == "AP")
			{
				damageFactor = 0.5;
			}
		}
		else
		{
			if (this.dbWeapon.damageType == "FMJ")
			{
				damageFactor = 1.0;
			}
			if (this.dbWeapon.damageType == "AP")
			{
				damageFactor = 0.5;
			}
		}
		damage *= damageFactor;
		unit.healthLeft -= damage;
	}
}
Weapon.prototype.shoot = function(myGroup, group, shots)
{
	//TODO rockets
	let distance = myGroup.latlon.distanceTo(group.latlon);
	let hits = 0;
	for (let i=0; i<shots; i++)
	{
		let rnd = Math.random()*(this.dbWeapon.inaccuracy*(1+myGroup.suppressed));
		let radius = (distance*Math.sin(rnd))/(Math.sin(90-rnd));
		let area = radius*radius*Math.PI*(0.5+(1-group.suppressed)*0.5);
		if (area <= group.representation.dbUnit.size)//TODO use cover, not moving
		{
			hits += 1;
		}
	};
	if (hits > 0)
	{
		this.dealDamage(group, hits);
	}
}
Weapon.prototype.use = function(myGroup, group, timeAvailable)
{//TODO block on guided weapons
	if (this.unusedTime > 0)
	{
		timeAvailable += this.unusedTime;
		this.unusedTime = 0;
	}
	if (timeAvailable > 0)
	{
		if (this.bulletsLeft == 0)
		{
			if (this.magazinesLeft > 0)
			{
				if (this.reloadTimeLeft > timeAvailable)
				{
					this.reloadTimeLeft -= timeAvailable;
					timeAvailable = 0;
				}
				else
				{
					timeAvailable -= this.reloadTimeLeft;
					this.reloadTimeLeft = 0;
					this.bulletsLeft = this.dbWeapon.magazineSize;
					this.magazinesLeft -= 1;
					this.use(myGroup, group, timeAvailable);
				}
			}
		}
		else
		{
			let timePerShoot = 1000*this.dbWeapon.rpm/60;
			let shots = Math.floor(timeAvailable/timePerShoot);
			if (shots < this.bulletsLeft)
			{
				timeAvailable -= timePerShoot*shots;
				this.shoot(group, shots);
				this.bulletsLeft -= shots;
				this.unusedTime = timeAvailable;
			}
			else
			{
				timeAvailable -= timePerShoot*this.bulletsLeft;
				this.shoot(group, this.bulletsLeft);
				this.bulletsLeft = 0;
				this.reloadTimeLeft = 1000*this.dbWeapon.reloadTime;
				this.use(myGroup, group, timeAvailable);
			}
		}
	}
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
Group.prototype.handleDetection = function(group)
{
	let distance = this.latlon.distanceTo(group.latlon);
	let camouflage = group.representation.dbUnit.camouflage*(1-this.representation.dbUnit.opticsQuality);
	let optics = this.representation.dbUnit.optics*(1-camouflage);
	if (optics >= distance)
	{
		this.spots.push(group);
		group.spottedBy.push(this);
		if (group.spottedBy.length == 1)
		{
			group.opacity = visibleEnemyOpacity;
			group.needsRedraw = true;
		}
	}
	else
	{
		let index = group.spottedBy.indexOf(this);
		if (index > -1)
		{
			group.spottedBy.splice(index, 1);
			if (group.spottedBy.length == 0)
			{
				group.opacity = invisibleEnemyOpacity;
				group.needsRedraw = true;
			}
		}
		index = this.spots.indexOf(group);
		if (index > -1)
		{
			this.spots.splice(index, 1);
		}
	}
	//TODO other detection methods
};