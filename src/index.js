const {
	app,
	port
} = require("./app");
const db = require("./db");
const formidable = require("formidable");
const { ObjectId } = require("mongodb");
const fs = require("fs");

app.get("/", async (request, response) => {
	await response.render("index.html");
});

app.get("/buy", async (request, response) => {
	const query = request.query.search;

	response.redirect(query
	                  ? `buy.html?search=${query}`
	                  : "buy.html");
});

app.get("/sell", async (request, response) => {
	response.redirect("sell.html");
});

app.get("/about", async (request, response) => {
	response.redirect("about.html");
});

app.get("/cars", async (request, response) => {
	const result = await db.find("cars");

	response.send(result);
});

app.post("/cars", (request, response) => {
	const form = new formidable.IncomingForm();

	form.parse(request, async (err, fields, files) => {
		for (const fieldKey in fields) {
			fields[fieldKey] = fields[fieldKey].replace(/</g, "&lt;")
				.replace(/>/g, "&gt;");
		}

		fields.image = files.image.newFilename + files.image.originalFilename;
		fields.price = parseInt(fields.price.toString());
		fields.year = parseInt(fields.year.toString());

		await db.insert("cars", fields);

		const oldPath = files.image.filepath;
		const newPath = `./public/img/cars/${fields.image}`;

		fs.copyFile(oldPath, newPath, err => {
			if (err) console.log(err);
		});

		response.redirect("sell.html");
	});
});

app.post("/cars-put", (request, response) => {
	const form = new formidable.IncomingForm();

	form.parse(request, async (err, fields, files) => {
		for (const fieldKey in fields) {
			fields[fieldKey] = fields[fieldKey].replace(/</g, "&lt;")
				.replace(/>/g, "&gt;");
		}

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

		await db.update("cars", ObjectId(id), fields);

		response.redirect("sell.html");
	});
});

app.delete("/cars", async (request, response) => {
	const query = request.query;

	await db.remove("cars", ObjectId(query.id));

	fs.rm(`./public/img/cars/${query.image}`, err => {
		if (err) console.log(err);
	});

	response.send("Deleted");
});

app.listen(port, () => console.log(`Server is running on port ${port}`));

(async () => await db.close())();