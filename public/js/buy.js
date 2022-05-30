"use strict";

const carsContainer = $("div#carsContainer");
const makesContainer = $("div#collapseMake");
const searchInput = $("#navbarToggler>form>input[type=search]");

const selectOptionSorting = $("select#selectOptionSorting");
const selectDirectSorting = $("select#selectDirectSorting");

const checkboxNew = $("#checkboxNew");
const checkboxUsed = $("#checkboxUsed");
const checkboxGasoline = $("#checkboxGasoline");
const checkboxDiesel = $("#checkboxDiesel");
const checkboxElectric = $("#checkboxElectric");
let checkboxMakes;

const numberPriceFrom = $("#numberPriceFrom");
const numberPriceTo = $("#numberPriceTo");
const numberYearFrom = $("#numberYearFrom");
const numberYearTo = $("#numberYearTo");

const calculateCostButton = $("button#calculateCostButton");
const resetButton = $("button#resetButton");

let sortObject = {};
let rangeObject = {};
let filterObject = {};
let calculatedCost = 0;
let searchQuery = location.href.includes("?search=")
                  ? location.href.substring(location.href.indexOf("?search=") + 8)
                  : "";

let carsPromise;

function fetchCars() {
	carsPromise = fetch("/cars")
		.then(response => response.json());
}

function updateCars() {
	carsPromise.then(cars => {
		carsContainer.empty();
		calculatedCost = 0;

		cars = searchCars(cars);
		cars = sortCars(cars);
		cars = rangeCars(cars);
		cars = filterCars(cars);

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
						 <p class="card-text">New/Used: ${capitalizeFirstLetter(car.newused)}</p>
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
	carsPromise
		.then(cars => {
			makesContainer.empty();

			let carsSet = new Set(cars.map(car => car.make));
			carsSet.forEach(make => makesContainer.append(`
			<div class="form-check my-2 checkbox-makes">
				<input class="form-check-input" type="checkbox" id="checkboxMake${make}" name="${make}">
				<label class="form-check-label" for="checkboxMake${make}">${make}</label>
			</div>`));

			updateFilters();
		});
}

function removeCar(id, image) {
	fetch(`/cars?id=${id}&image=${image}`, {
		method: "DELETE"
	})
		.then(() => {
			fetchCars();
			updateMakes();
			updateCars();
		});
}

function searchCars(cars) {
	const makesContainers = $("div.checkbox-makes");
	makesContainers.show();

	if (searchQuery) {
		cars = cars.filter(car => {
			for (const carKey in car) {
				if (car[carKey].toString()
					.toLowerCase()
					.includes(searchQuery.toLowerCase())) {
					return true;
				}
			}
			return false;
		});

		const makes = cars.map(car => car.make);
		makesContainers.each((index, container) => {
			const checkbox = $(container)
				.find("input.form-check-input");
			if (!makes.includes(checkbox.attr("name"))) {
				$(container)
					.hide();
			}
		});
	}

	return cars;
}

function sortCars(cars) {
	setSortingOptions();

	if (sortObject.sort !== undefined) {
		cars = cars.sort((a, b) => {
			if (a[sortObject.sort] > b[sortObject.sort]) {
				return 1;
			} else if (a[sortObject.sort] < b[sortObject.sort]) {
				return -1;
			}
			return 0;
		});
		if (sortObject.order < 0) {
			cars.reverse();
		}
	}

	return cars;
}

function rangeCars(cars) {
	if (Object.keys(rangeObject).length) {
		cars = cars.filter(car => {
			for (const rangeKey in rangeObject) {
				if (rangeObject[rangeKey].from !== undefined &&
					rangeObject[rangeKey].to !== undefined) {
					if (car[rangeKey] <= rangeObject[rangeKey].from ||
						car[rangeKey] >= rangeObject[rangeKey].to) {
						return false;
					}
				} else if (rangeObject[rangeKey].from !== undefined) {
					if (car[rangeKey] <= rangeObject[rangeKey].from) {
						return false;
					}
				} else if (rangeObject[rangeKey].to !== undefined) {
					if (car[rangeKey] >= rangeObject[rangeKey].to) {
						return false;
					}
				}
			}
			return true;
		});
	}

	return cars;
}

function filterCars(cars) {
	if (Object.keys(filterObject).length) {
		cars = cars.filter(car => {
			for (const filterKey in filterObject) {
				if (filterObject[filterKey] !== undefined && filterObject[filterKey].length) {
					if (!filterObject[filterKey].includes(car[filterKey])) {
						return false;
					}
				}
			}
			return true;
		});
	}

	return cars;
}

function setSortingOptionsAndUpdateCars() {
	setSortingOptions();

	updateCars();
}

function setSortingOptions() {
	const optionSorting = selectOptionSorting.val();
	const directSorting = parseInt(selectDirectSorting.val());

	sortObject.sort = optionSorting !== "Sort option..."
	                  ? optionSorting
	                  : undefined;
	sortObject.order = directSorting;
}

function updateFilters() {
	checkboxMakes = $("[id^=checkboxMake]");

	setCheckboxes(checkboxNew, "newused", "new");
	setCheckboxes(checkboxUsed, "newused", "used");
	setCheckboxes(checkboxGasoline, "fuel", "gasoline");
	setCheckboxes(checkboxDiesel, "fuel", "diesel");
	setCheckboxes(checkboxElectric, "fuel", "electric");
	checkboxMakes.each((index, checkbox) => setCheckboxes($(checkbox), "make", $(checkbox)
		.attr("name")));

	setRanges(numberPriceFrom, numberPriceTo, "price");
	setRanges(numberYearFrom, numberYearTo, "year");
}

function setCheckboxes(checkbox, filter, value) {
	checkbox.change(() => {
		if (checkbox.is(":checked")) {
			if (filterObject[filter] === undefined) {
				filterObject[filter] = [value];
			} else {
				filterObject[filter].push(value);
			}
		} else {
			if (filterObject[filter].length === 1) {
				delete filterObject[filter];
			} else {
				filterObject[filter].splice(filterObject[filter].indexOf(value), 1);
			}
		}

		updateCars();
	});
}

function setRanges(rangeFrom, rangeTo, filter) {
	rangeFrom.change(() => {
		const value = parseInt(rangeFrom.val());

		if (rangeObject[filter] === undefined) {
			rangeObject[filter] = { from: value };
		} else {
			rangeObject[filter].from = value;
			if (rangeObject[filter].to < value) {
				delete rangeObject[filter].to;
				rangeTo.val("");
			}
		}
		if (rangeFrom.val() === "") {
			if (rangeObject[filter].to !== undefined) {
				delete rangeObject[filter].from;
			} else {
				delete rangeObject[filter];
			}
			rangeFrom.val(rangeFrom.attr("min"));
		}

		updateCars();
	});
	rangeTo.change(() => {
		const value = parseInt(rangeTo.val());

		if (rangeObject[filter] === undefined) {
			rangeObject[filter] = { to: value };
		} else {
			rangeObject[filter].to = value;
			if (rangeObject[filter].from > value) {
				delete rangeObject[filter].from;
				rangeFrom.val(rangeFrom.attr("min"));
			}
		}
		if (rangeTo.val() === "") {
			if (rangeObject[filter].from !== undefined) {
				delete rangeObject[filter].to;
			} else {
				delete rangeObject[filter];
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

if (searchQuery) {
	searchInput.val(searchQuery);
}

searchInput.on("input", () => {
	searchQuery = searchInput.val();

	updateCars();
});

selectOptionSorting.change(setSortingOptionsAndUpdateCars);
selectDirectSorting.change(setSortingOptionsAndUpdateCars);

calculateCostButton.click(() => $("#calculateModalBody")
	.text(`Total cost is: $${separateNumberSpaces(calculatedCost)}`));

resetButton.click(() => {
	searchInput.val("");

	selectOptionSorting.val("nosort");
	selectDirectSorting.val(1);

	checkboxNew.prop("checked", false);
	checkboxUsed.prop("checked", false);
	checkboxGasoline.prop("checked", false);
	checkboxDiesel.prop("checked", false);
	checkboxElectric.prop("checked", false);
	checkboxMakes.each((index, checkbox) => $(checkbox)
		.prop("checked", false));

	numberPriceFrom.val(numberPriceFrom.attr("min"));
	numberPriceTo.val("");
	numberYearFrom.val(numberYearFrom.attr("min"));
	numberYearTo.val("");

	sortObject = {};
	rangeObject = {};
	filterObject = {};
	searchQuery = "";

	updateMakes();
	updateCars();
});

fetchCars();
updateMakes();
updateCars();