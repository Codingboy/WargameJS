function Weapon(dbWeapon, id)
{
	this.id = id;
	this.dbWeapon = dbWeapon;
	this.magazinesLeft = dbWeapon.magazines;//amount of magazines excluding loaded magazine
	this.bulletsLeft = dbWeapon.magazineSize;//rounds in current magazine
	this.reloadTimeLeft = 0;
	this.unusedTime = 0;
	allObjects[id] = this;
}
Weapon.prototype.dealDamage = function(group, hits)
{
	//TODO minimize traffic for fast firing on large groups
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
		let json = {
			type: "dealDamage",
			data: {
				unitID: unit.id,
				weaponID: this.id,
				damage: damage
			}
		};
		console.log(json);
		messages.push(json);
	}
}
Weapon.prototype.shoot = function(myGroup, group, shots)
{
	//TODO rockets
	let json = {
		type: "shoot",
		data: {
			id: this.id,
			count: shots,
			shooter: myGroup.id
		}
	};
	console.log(json);
	messages.push(json);
	let srcLatLon = new LatLon(myGroup.pos[0], myGroup.pos[1]);
	let dstLatLon = new LatLon(group.pos[0], group.pos[1]);
	let distance = srcLatLon.distanceTo(dstLatLon);
	let hits = 0;
	myGroup.lastShot = Date.now();
	myGroup.needsRedraw = true;
	let suppression = 0;
	for (let i=0; i<shots; i++)
	{
		let movingModificator = 1.0;
		if (group.moved)
		{
			movingModificator = 2.0;//TODO use stabilisator
		}
		let rnd = Math.random()*(this.dbWeapon.inaccuracy*(1+myGroup.suppressed)*movingModificator);
		let radius = (distance*Math.sin(rnd))/(Math.sin(90-rnd));
		let area = radius*radius*Math.PI;
		let buildingModificator = 1.0;
		if (group.building)
		{
			buildingModificator = 0.5;
		}
		let targetSize = group.representation.size*buildingModificator;
		if (area <= targetSize)
		{
			hits += 1;
		}
		if (area <= 5*targetSize)//TODO adjust targetsize for suppression
		{
			console.log("should be suppressed");
			console.log((1-(area/5*targetSize))*this.dbWeapon.damage*0.1);
			console.log((1-(area/5*targetSize)));
			console.log(this.dbWeapon.damage*0.1);
			suppression += (1-(area/5*targetSize))*this.dbWeapon.damage*0.1;//TODO adjust
		}
	};
	if (suppression > 0)
	{
		let json = {
			type: "suppress",
			data: {
				targetGroupID: group.id,
				weaponID: this.id,
				suppression: suppression
			}
		};
		console.log(json);
		messages.push(json);
	}
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
					let json = {
						type: "reload",
						data: {
							id: this.id
						}
					};
					console.log(json);
					messages.push(json);
					this.use(myGroup, group, timeAvailable);
				}
			}
		}
		else
		{
			let timePerShot = 1000*this.dbWeapon.rpm/60;
			let shots = Math.floor(timeAvailable/timePerShot);
			if (shots == 0)
			{
				this.unusedTime = timeAvailable;
			}
			else
			{
				if (shots < this.bulletsLeft)
				{
					timeAvailable -= timePerShot*shots;
					this.shoot(myGroup, group, shots);
					this.bulletsLeft -= shots;
					this.unusedTime = timeAvailable;
				}
				else
				{
					timeAvailable -= timePerShot*this.bulletsLeft;
					this.shoot(myGroup, group, this.bulletsLeft);
					this.bulletsLeft = 0;
					this.reloadTimeLeft = 1000*this.dbWeapon.reloadTime;
					this.use(myGroup, group, timeAvailable);
				}
			}
		}
	}
}