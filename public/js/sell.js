"use strict";

const carsContainer = $("div#carsContainer");
const modalImages = $("input.modal-image");
const modalImagesImg = $("img.modal-image-img");

const editModalMake = $("input#editModalMake");
const editModalModel = $("input#editModalModel");
const editModalColor = $("input#editModalColor");
const editModalNewUsed = $("select#editModalNewUsed");
const editModalFuel = $("select#editModalFuel");
const editModalPrice = $("input#editModalPrice");
const editModalYear = $("input#editModalYear");
const editModalImageImg = $("img#editModalImageImg");
const editModalId = $("input#editModalId");
const editModalOldImage = $("input#editModalOldImage");

let carsPromise;

function fetchCars() {
	carsPromise = fetch("/cars")
		.then(response => response.json());
}

function updateCars() {
	carsPromise.then(cars => {
		carsContainer.empty();

		cars.forEach(car => {
			const carName = `${car.make} ${car.model}`;

			carsContainer.append(`
			<div class="col-xl-3 col-lg-4 col-md-6 col-12 pb-3" data-id="${car._id}">
				<div class="card">
					<img src="${car.image}" class="card-img-top"
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
			 			 <button class="btn btn-warning" data-mdb-toggle="modal"
							     data-mdb-target="#editModal">Edit</button>
			 			 <button class="btn btn-danger" data-mdb-toggle="modal"
			 			         data-mdb-target="#confirmModal">Remove</button>
			 		 </div>
			 	</div>
			</div>`)
				.on("click", `[data-id=${car._id}] button.btn.btn-danger`, () => {
					const confirmModalButton = $("#confirmModal button.btn.btn-danger");
					confirmModalButton.unbind("click")
						.bind("click", () => removeCar(car._id, car.image));
				})
				.on("click", `[data-id=${car._id}] button.btn.btn-warning`, () => {
					editModalMake.val(car.make);
					editModalModel.val(car.model);
					editModalColor.val(car.color);
					editModalNewUsed.val(car.newused);
					editModalFuel.val(car.fuel);
					editModalPrice.val(car.price);
					editModalYear.val(car.year);
					editModalImageImg.attr("src", `img/cars/${car.image}`)
						.val(car.image);
					editModalId.val(car._id);
					editModalOldImage.val(car.image);
				});
		});
	});
}

function removeCar(id, image) {
	fetch(`/cars?id=${id}&image=${image}`, {
		method: "DELETE"
	})
		.then(() => {
			fetchCars();
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

for (let i = 0; i < modalImages.length; i++) {
	const modalImage = $(modalImages[i]);
	const modalImageImg = $(modalImagesImg[i]);

	modalImage.change(() => modalImageImg.attr("src", modalImage.val() !== ""
	                                                  ? URL.createObjectURL(modalImage[0].files[0])
	                                                  : ""));
}

fetchCars();
updateCars();