const {
	app,
	port
} = require("./app");
const dbManager = require("./db");
const formidable = require("formidable");
const { ObjectId } = require("mongodb");
const fs = require("fs");

app.get("/", async (request, response) => {
	await response.render("index.html");
});

app.get("/buy", async (request, response) => {
	const query = request.query.search;

	if (query) {
		response.redirect(`buy.html?search=${query}`);
	} else {
		response.redirect("buy.html");
	}
});

app.get("/sell", async (request, response) => {
	response.redirect("sell.html");
});

app.get("/about", async (request, response) => {
	response.redirect("about.html");
});

app.get("/cars", async (request, response) => {
	const query = request.query;
	let result;

	if (query.sort !== undefined && query.filter !== undefined) {
		result = await dbManager.findSorted("cars", JSON.parse(query.filter), JSON.parse(`{"${query.sort}":${query.order}}`));
	} else if (query.sort !== undefined) {
		result = await dbManager.findSorted("cars", {}, JSON.parse(`{"${query.sort}":${query.order}}`));
	} else if (query.filter !== undefined) {
		result = await dbManager.find("cars", JSON.parse(query.filter));
	} else if (query.search !== undefined) {
		const regExpQuery = new RegExp(query.search, "i");
		const numberQuery = parseInt(query.search);

		result = await dbManager.find("cars", {
			$or: [
				{ "make": regExpQuery },
				{ "model": regExpQuery },
				{ "newused": regExpQuery },
				{ "fuel": regExpQuery },
				{ "year": { $eq: numberQuery } },
				{ "price": { $eq: numberQuery } }
			]
		});
	} else {
		result = await dbManager.find("cars");
	}

	response.send(result);
});

app.get("/cars/makes", async (request, response) => {
	const result = await dbManager.findDistinct("cars", "make");

	response.send(result);
});

app.post("/cars", (request, response) => {
	const form = new formidable.IncomingForm();

	form.parse(request, async (err, fields, files) => {
		fields.image = files.image.newFilename + files.image.originalFilename;
		fields.price = parseInt(fields.price.toString());
		fields.year = parseInt(fields.year.toString());

		await dbManager.insert("cars", fields);

		const oldPath = files.image.filepath;
		const newPath = `./public/img/cars/${fields.image}`;

		fs.copyFile(oldPath, newPath, err => {
			if (err) console.log(err);
		});
	});

	response.redirect("sell.html");
});

app.post("/cars-put", (request, response) => {
	const form = new formidable.IncomingForm();

	form.parse(request, async (err, fields, files) => {
		const id = fields._id;
		fields.price = parseInt(fields.price.toString());
		fields.year = parseInt(fields.year.toString());

		if (files.image.originalFilename) {
			fields.image = files.image.newFilename + files.image.originalFilename;

			const oldPath = files.image.filepath;
			const newPath = `./public/img/cars/${fields.image}`;

			fs.rm(`./public/img/cars/${fields.oldimage}`, err => {
				if (err) console.log(err);
			});
			fs.copyFile(oldPath, newPath, err => {
				if (err) console.log(err);
			});
		}

		delete fields.oldimage;
		delete fields._id;

		await dbManager.edit("cars", ObjectId(id), fields);
	});

	response.redirect("sell.html");
});

app.delete("/cars", async (request, response) => {
	const query = request.query;

	await dbManager.remove("cars", ObjectId(query.id));

	fs.rm(`./public/img/cars/${query.image}`, err => {
		if (err) console.log(err);
	});

	response.send("Deleted");
});

app.listen(port, () => console.log(`Server is running on port ${port}`));

(async () => await dbManager.close())();