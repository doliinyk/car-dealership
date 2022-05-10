"use strict";

const modalImages = $("input.modal-image");
const modalImagesImg = $("img.modal-image-img");
const carsContainer = $("div#carsContainer");

function updateCars() {
	const req = new XMLHttpRequest();
	req.open("GET", "/query/cars", true);
	req.send();

	req.onload = () => {
		carsContainer.empty();

		const cars = JSON.parse(req.responseText);

		for (let car of cars) {
			const carName = `${car.make} ${car.model}`;

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
			 			 <button class="btn btn-warning" data-mdb-toggle="modal"
							     data-mdb-target="#editModal">Edit</button>
			 			 <button class="btn btn-danger" data-mdb-toggle="modal"
			 			         data-mdb-target="#confirmModal">Remove</button>
			 		 </div>
			 	</div>
			</div>`)
				.on("click", `[data-id=${car._id}] button.btn.btn-danger`, e => {
					const confirmModalButton = $("#confirmModal button.btn.btn-danger");
					confirmModalButton.unbind("click")
						.bind("click", () => removeCar(car._id, car.image));
				})
				.on("click", `[data-id=${car._id}] button.btn.btn-warning`, e => {
					$("input#editModalMake")
						.val(car.make);
					$("input#editModalModel")
						.val(car.model);
					$("input#editModalColor")
						.val(car.color);
					$("select#editModalNewUsed")
						.val(car.newused);
					$("select#editModalFuel")
						.val(car.fuel);
					$("input#editModalPrice")
						.val(car.price);
					$("input#editModalYear")
						.val(car.year);
					$("img#editModalImageImg")
						.attr("src", `img/cars/${car.image}`);
					$("input#editModalId")
						.val(car._id);
					$("input#editModalOldImage")
						.val(car.image);
				});
		}
	}
}

function capitalizeFirstLetter(string) {
	return string.charAt(0)
		.toUpperCase() + string.slice(1);
}

function separateNumberSpaces(number) {
	return number.toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ");
}

function removeCar(id, image) {
	const req = new XMLHttpRequest();
	req.open("DELETE", `/delete/cars?id=${id}&image=${image}`, true);
	req.send();
	updateCars();
}

for (let i = 0; i < modalImages.length; i++) {
	const modalImage = $(modalImages[i]);
	const modalImageImg = $(modalImagesImg[i]);

	modalImage.change(() => modalImageImg.attr("src", URL.createObjectURL(modalImage[0].files[0])));
}

updateCars();