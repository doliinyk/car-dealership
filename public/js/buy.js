"use strict";

const carsContainer = $("div#carsContainer");
const makesContainer = $("div#collapseMake");
const selectOptionSorting = $("select#selectOptionSorting");
const selectDirectSorting = $("select#selectDirectSorting");
const calculateCostButton = $("button#calculateCostButton");
const resetButton = $("button#resetButton");

let optionSorting;
let directSorting = parseInt(selectDirectSorting.val());
let sortObject = {};
let filterObject = {};
let calculatedCost = 0;
let searchQuery = location.href.includes("?search=")
                  ? location.href.substring(location.href.indexOf("?search=") + 8)
                  : "";

function updateCars() {
	let url = "/cars";

	if (sortObject.sort !== undefined && Object.keys(filterObject).length) {
		url += `?sort=${sortObject.sort}&order=${sortObject.order}&filter=${JSON.stringify(filterObject)}`;
	} else if (sortObject.sort !== undefined) {
		url += `?sort=${sortObject.sort}&order=${sortObject.order}`;
	} else if (Object.keys(filterObject).length) {
		url += `?filter=${JSON.stringify(filterObject)}`;
	} else if (searchQuery) {
		url += `?search=${searchQuery}`;
	}

	fetch(url)
		.then(response => response.json())
		.then(cars => {
			carsContainer.empty();
			calculatedCost = 0;

			cars.forEach(car => {
				const carName = `${car.make} ${car.model}`;
				calculatedCost += car.price;

				carsContainer.append(`
			<div class="col-xl-3 col-lg-4 col-md-6 col-12 pb-3" data-id="${car._id}">
				<div class="card">
					<img src="img/cars/${car.image}" class="card-img-top"
				     alt="${carName}">
				     <div class="card-body">
					     <h5 class="card-title">${carName}</h5>
						 <p class="card-text">Color: <i
								 class="fa-solid fa-circle rounded-circle border border-dark"
								 style="color: ${car.color}"></i></p>
						 <p class="card-text">Used/New: ${capitalizeFirstLetter(car.newused)}</p>
						 <p class="card-text">Fuel: ${capitalizeFirstLetter(car.fuel)}</p>
						 <p class="card-text">Price: $${separateNumberSpaces(car.price)}</p>
						 <p class="card-text">Year: ${car.year}</p>
			 			 <button class="btn btn-success" data-mdb-toggle="modal"
							     data-mdb-target="#buyModal">Buy</button>
			 		 </div>
			 	</div>
			</div>`)
					.on("click", `[data-id=${car._id}] button.btn.btn-success`, () => {
						const buyModalButton = $("#buyModal button.btn.btn-success");
						buyModalButton.unbind("click")
							.bind("click", () => removeCar(car._id, car.image));
					});
			});
		});
}

function updateMakes() {
	fetch("/cars/makes")
		.then(response => response.json())
		.then(makes => {
			makesContainer.empty();

			makes.forEach(make => {
				makesContainer.append(`
			<div class="form-check my-2">
				<input class="form-check-input" type="checkbox" id="checkboxMake${make}" name="${make}">
				<label class="form-check-label" for="checkboxMake${make}">${make}</label>
			</div>`);
			});

			updateFilters();
		});
}

function updateFilters() {
	const checkboxNew = $("#checkboxNew");
	const checkboxUsed = $("#checkboxUsed");
	const checkboxGasoline = $("#checkboxGasoline");
	const checkboxDiesel = $("#checkboxDiesel");
	const checkboxElectric = $("#checkboxElectric");
	const checkboxMakes = $("[id^=checkboxMake]");

	setCheckboxFilter(checkboxNew, "newused", "new");
	setCheckboxFilter(checkboxUsed, "newused", "used");
	setCheckboxFilter(checkboxGasoline, "fuel", "gasoline");
	setCheckboxFilter(checkboxDiesel, "fuel", "diesel");
	setCheckboxFilter(checkboxElectric, "fuel", "electric");
	checkboxMakes.each((index, checkbox) => {
		setCheckboxFilter($(checkbox), "make", $(checkbox)
			.attr("name"));
	});

	const numberPriceFrom = $("#numberPriceFrom");
	const numberPriceTo = $("#numberPriceTo");
	const numberYearFrom = $("#numberYearFrom");
	const numberYearTo = $("#numberYearTo");

	setNumberFilters(numberPriceFrom, numberPriceTo, "price");
	setNumberFilters(numberYearFrom, numberYearTo, "year");
}

function setCheckboxFilter(checkbox, filter, value) {
	checkbox.change(() => {
		if (checkbox.is(":checked")) {
			if (filterObject[filter] === undefined) {
				filterObject[filter] = { $in: [value] };
			} else {
				filterObject[filter].$in.push(value);
			}
		} else {
			if (filterObject[filter].$in.length === 1) {
				delete filterObject[filter];
			} else {
				filterObject[filter].$in.splice(filterObject[filter].$in.indexOf(value), 1);
			}
		}

		updateCars();
	});
}

function setNumberFilters(numberFrom, numberTo, filter) {
	numberFrom.change(() => {
		const value = parseInt(numberFrom.val());

		if (filterObject[filter] === undefined) {
			filterObject[filter] = { $gte: value };
		} else {
			filterObject[filter].$gte = value;
			if (filterObject[filter].$lte < value) {
				delete filterObject[filter].$lte;
				numberTo.val("");
			}
		}
		if (numberFrom.val() === "") {
			if (filterObject[filter].$lte !== undefined) {
				delete filterObject[filter].$gte;
			} else {
				delete filterObject[filter];
			}
			numberFrom.val(numberFrom.attr("min"));
		}

		updateCars();
	});
	numberTo.change(() => {
		const value = parseInt(numberTo.val());

		if (filterObject[filter] === undefined) {
			filterObject[filter] = { $lte: value };
		} else {
			filterObject[filter].$lte = value;
			if (filterObject[filter].$gte > value) {
				delete filterObject[filter].$gte;
				numberFrom.val(numberFrom.attr("min"));
			}
		}
		if (numberTo.val() === "") {
			if (filterObject[filter].$gte !== undefined) {
				delete filterObject[filter].$lte;
			} else {
				delete filterObject[filter];
			}
		}

		updateCars();
	});
}

function capitalizeFirstLetter(string) {
	return string.charAt(0)
		.toUpperCase() + string.slice(1);
}

function separateNumberSpaces(number) {
	return number.toString()
		.replace(/\B(?=(\d{3})+(?!\d))/g, " ");
}

function removeCar(id, image) {
	fetch(`/cars?id=${id}&image=${image}`, {
		method: "DELETE"
	})
		.then(() => {
			updateCars();
			updateMakes();
		});
}

selectOptionSorting.change(() => {
	optionSorting = selectOptionSorting.val();

	if (optionSorting === "Sort option...") {
		optionSorting = undefined;
	}
	sortObject.sort = optionSorting;
	sortObject.order = directSorting;

	updateCars();
});

selectDirectSorting.change(() => {
	directSorting = parseInt(selectDirectSorting.val());

	sortObject.sort = optionSorting;
	sortObject.order = directSorting;

	updateCars();
});

calculateCostButton.click(() => $("#calculateModalBody")
	.text(`Total cost is: $${separateNumberSpaces(calculatedCost)}`));

resetButton.click(() => window.location = window.location.href.split("?")[0]);

updateCars();
updateMakes();