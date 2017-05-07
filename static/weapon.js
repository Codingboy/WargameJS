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
	let srcLatLon = new LatLon(myGroup.pos[0], myGroup.pos[1]);
	let dstLatLon = new LatLon(group.pos[0], group.pos[1]);
	let distance = srcLatLon.distanceTo(dstLatLon);
	let hits = 0;
	myGroup.lastShot = Date.now();
	mygroup.needsRedraw = true;
	for (let i=0; i<shots; i++)
	{
		let rnd = Math.random()*(this.dbWeapon.inaccuracy*(1+myGroup.suppressed));
		let radius = (distance*Math.sin(rnd))/(Math.sin(90-rnd));
		let area = radius*radius*Math.PI*(0.5+(1-group.suppressed)*0.5);
		console.log(rnd+" "+area+" "+group.representation.dbUnit.size);
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