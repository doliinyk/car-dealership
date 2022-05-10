const {
	app,
	port
} = require("./initialize");
const dbManager = require("./dbmanager");
const fs = require("fs");
const formidable = require("formidable");
const { ObjectId } = require("mongodb");

app.get("/", async (request, response) => {
	await response.sendFile("index.html");
});

app.get("/query/cars", async (request, response) => {
	const query = request.query;
	let result;

	if (query.sort !== undefined && query.filter !== undefined) {
		result = await dbManager.findSorted("cars", JSON.parse(query.filter), JSON.parse(`{"${query.sort}":${query.order}}`));
	} else if (query.sort !== undefined) {
		result = await dbManager.findSorted("cars", {}, JSON.parse(`{"${query.sort}":${query.order}}`));
	} else if (query.filter !== undefined) {
		result = await dbManager.find("cars", JSON.parse(query.filter));
	} else {
		result = await dbManager.find("cars");
	}

	response.send(result);
});

app.get("/query/makes", async (request, response) => {
	const result = await dbManager.findDistinct("cars", "make");

	response.send(result);
});

app.post("/place", (request, response) => {
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

app.post("/edit", (request, response) => {
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

app.delete("/delete/cars/", async (request, response) => {
	const query = request.query;

	await dbManager.remove("cars", ObjectId(query.id));

	fs.rm(`./public/img/cars/${query.image}`, err => {
		if (err) console.log(err);
	});
});

app.listen(port, () => console.log(`Server is running on port ${port}`));

(async () => await dbManager.close())();