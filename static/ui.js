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
		console.log(element);
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

