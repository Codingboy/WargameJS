function Unit(dbUnit, weapons, group, id)
{
	this.id = id;
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
	this.weapons = weapons;
	this.radarAirJammed = [];
	this.radarAirJammedBy = [];
	this.radarWeaponJammed = [];
	this.radarWeaponJammedBy = [];
	this.radioJammed = [];
	this.radioJammedBy = [];
	this.group = group;
	this.healthLeft = dbUnit.health;
	allObjects[id] = this;
}