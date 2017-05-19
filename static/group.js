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
	this.units.push(unit);
	if (this.name == "")
	{
		this.name = unit.dbUnit.name;
	}
	this.needsRedraw = true;
	if (!this.representation)
	{
		this.representation = JSON.parse(JSON.stringify(unit.dbUnit));
	}
	else
	{
		this.representation.price += unit.dbUnit.price;//TODO other values
	}
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
Group.prototype.handleDetection = function(group)
{
	let srcLatLon = new LatLon(this.pos[0], this.pos[1]);
	let dstLatLon = new LatLon(group.pos[0], group.pos[1]);
	let distance = srcLatLon.distanceTo(dstLatLon);
	let camouflage = group.representation.camouflage*(1-this.representation.opticsQuality);
	let optics = this.representation.optics*(1-camouflage);
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