function Group(owner, pos, id)
{
	this.id = id;
	this.lastShot = 0;
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
	this.owner.groups[id] = this;
	this.olObject.set("group", this);
	this.suppressed = 0;
	this.building = null;
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
Group.prototype.updateRepresentation = function()
{
	this.needsRedraw = true;
	/*TODO other values
	opticsIR = 0;//range the IR optic is working with in meter
	opticsIRQuality = 0;//counters enemy camouflageIR
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
	weapons = [];//weaponnames,
	stabilisatorQuality = 0.0;//TODO
	courage = 0.0;//TODO
	health = 1;*/
	this.representation = new DBUnit();
	this.representation.size = 0;
	this.representation.c2 = 0;
	this.representation.sound = 0;
	this.representation.speed = Number.MAX_SAFE_INTEGER;
	this.representation.optics = 0;
	this.representation.opticsQuality = 0;
	this.representation.camouflage = 1;
	this.representation.price = 0;
	for (let unit of this.units)
	{
		let dbUnit = unit.dbUnit;
		if (this.representation.name == "")
		{
			this.representation.name = dbUnit.name;
		}
		if (unit.size > this.representation.size)
		{
			this.representation.size = unit.size;
		}
		this.representation.type = unit.type;
		if (unit.c2 > this.representation.c2)
		{
			this.representation.c2 = unit.c2;
		}
		if (unit.sound > this.representation.sound)
		{
			this.representation.sound = unit.sound;
		}
		
		if (unit.speed < this.representation.speed)
		{
			this.representation.speed = unit.speed;
		}
		if (unit.optics > this.representation.optics)
		{
			this.representation.optics = unit.optics;
		}
		if (unit.opticsQuality > this.representation.opticsQuality)//TODO needs to be same unit as optic
		{
			this.representation.opticsQuality = unit.opticsQuality;
		}
		
		if (unit.camouflage < this.representation.camouflage)
		{
			this.representation.camouflage = unit.camouflage;
		}
		this.representation.price += unit.price;
	}
}
Group.prototype.addUnit = function(unit)
{
	this.units.push(unit);
	if (this.name == "")
	{
		this.name = unit.dbUnit.name;
	}
	this.updateRepresentation();
};
Group.prototype.getSymbol = function()//http://explorer.milsymb.net/#/explore/
{
	if (this.representation.type == "Infantry")
	{
		let version = "10"
		let standardIdentity = "21";
		if (this.owner.isFriend())
		{
			standardIdentity = "23";
		}
		if (this.owner.isEnemy())
		{
			standardIdentity = "26";
		}
		if (this.owner.isIndependent())
		{
			standardIdentity = "24";
		}
		/*if (this.owner.isCivil())
		{
			standardIdentity = "24";
		}*/
		let symbolSet = "10";//TODO missiles, air
		let status = "0";//TODO 3=damaged, 4=destroyed
		let hqtfDummy = "0";
		let amplifier = "11";
		if (this.representation.type == "Infantry")
		{
			let count = this.units.length;
			if (count <= 1)
			{
				amplifier = "11";
			}
			else if (count <= 2)
			{
				amplifier = "12";
			}
			else if (count <= 4)
			{
				amplifier = "13";
			}
			else if (count <= 6)
			{
				amplifier = "14";
			}
			else if (count <= 9)
			{
				amplifier = "15";
			}
			else if (count <= 14)
			{
				amplifier = "16";
			}
			else if (count <= 21)
			{
				amplifier = "17";
			}
			else if (count <= 32)
			{
				amplifier = "18";
			}
			else if (count <= 48)
			{
				amplifier = "21";
			}
			else if (count <= 72)
			{
				amplifier = "22";
			}
			else if (count <= 108)
			{
				amplifier = "23";
			}
			else if (count <= 162)
			{
				amplifier = "24";
			}
			else// if (count <= 243)
			{
				amplifier = "25";
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
		if (this.representation.type == "Infantry")
		{
			entityType = "11";
		}
		let entitySuptype = "00";
		let modifier1 = "00";
		if (this.representation.c2 == 1)
		{
			modifier1 = "10";
		}
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
		let staffComments = "";
		if (Date.now() - this.lastShot <= 1000)
		{
			staffComments = "Fighting";
		}
		let num = version+standardIdentity+symbolSet+status+hqtfDummy+amplifier+entity+entityType+entitySuptype+modifier1+modifier2;
		return new ms.Symbol(num,{size:30,colorMode:"Light",staffComments:staffComments,commonIdentifier:commonIdentifier,altitudeDepth:altitude,direction:direction,speed:""+(Math.round(this.representation.speed*10)/10),combatEffectiveness:""+Math.round(this.representation.price),headquartersElement:this.owner.name,type:type});
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
	let position = ol.proj.transform(this.pos, "EPSG:4326", "EPSG:3857");
	this.olObject.getGeometry().setCoordinates(position);
}
Group.prototype.hasLOS = function(group, distance)
{
	let factor = 100;
	let pos = [Math.round(factor*this.pos[0])/factor, Math.round(factor*this.pos[1])/factor];
	let grids = [];
	let distantPoint = new LatLon(this.pos[0], this.pos[1]).destinationPoint(distance, 0);
	let gridDiff = distantPoint.lat - pos[0];//TODO check correct values
	let n = Math.round(gridDiff*factor);
	for (let x=-n; x<=n; x++)
	{
		let coordX = pos[0]+parseFloat(x)/factor;
		for (let y=-n; y<=n; y++)
		{
			let coordY = pos[1]+parseFloat(y)/factor;
			if (Math.sqrt(Math.pow(pos[0]-coordX,2)+Math.pow(pos[1]-coordY,2)) <= gridDiff)
			{
				grids.push([coordX, coordY]);
			}
		}
	}
	
	let coords = [];
	coords.push(this.pos);
	coords.push(group.pos);
	let line = turf.lineString(coords);
	for (let grid of grids)
	{
		if (grid[0] in buildings)
		{
			let buildingsX = buildings[grid[0]];
			if (grid[1] in buildingsX)
			{
				let buildingsY = buildingsX[grid[1]];
				for (let feature of buildingsY)
				{
					let polygon = feature.get("polygon");
					let intersects = turf.lineIntersect(polygon, line);
					if (intersects.features.length > 0)
					{
						if (!turf.inside(this.pos, polygon) && !turf.inside(group.pos, polygon))
						{
							return false;
						}
					}
				}
			}
		}
	}
	return true;
}
Group.prototype.handleDetection = function(group)
{
	let srcLatLon = new LatLon(this.pos[0], this.pos[1]);
	let dstLatLon = new LatLon(group.pos[0], group.pos[1]);
	let distance = srcLatLon.distanceTo(dstLatLon);
	let camouflage = group.representation.camouflage*(1-this.representation.opticsQuality);
	let optics = this.representation.optics;
	if (group.building)
	{
		optics = optics * 0.5;
	}
	optics = optics*(1-camouflage);
	if (optics >= distance)
	{
		if (this.hasLOS(group, distance))
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
