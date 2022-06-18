const {
	app,
	port
} = require("./app");
const db = require("./db");
const formidable = require("formidable");
const { ObjectId } = require("mongodb");
const fs = require("fs");
const aws = require("aws-sdk");

const accessKeyId = "AKIAXTH6YXUFLP5XD3FO";
const secretAccessKey = "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";
const bucketName = "car-dealership-bucket";

const s3 = new aws.S3({
	accessKeyId,
	secretAccessKey
});

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

		const imagePath = files.image.filepath;
		const blob = fs.readFileSync(imagePath);

		const uploadedImage = await s3.upload({
			Bucket: bucketName,
			Key: files.image.newFilename + files.image.originalFilename,
			Body: blob
		})
			.promise();

		fields.image = uploadedImage.Location;
		fields.price = parseInt(fields.price.toString());
		fields.year = parseInt(fields.year.toString());

		await db.insert("cars", fields);

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
			const imagePath = files.image.filepath;
			const oldImagePath = decodeURI(fields.oldimage);
			const blob = fs.readFileSync(imagePath);

			await s3.deleteObject({
				Bucket: bucketName,
				Key: oldImagePath.substring(oldImagePath.lastIndexOf("/") + 1)
			})
				.promise();

			const uploadedImage = await s3.upload({
				Bucket: bucketName,
				Key: files.image.newFilename + files.image.originalFilename,
				Body: blob
			})
				.promise();

			fields.image = uploadedImage.Location;
		}

		delete fields.oldimage;
		delete fields._id;

		await db.update("cars", ObjectId(id), fields);

		response.redirect("sell.html");
	});
});

app.delete("/cars", async (request, response) => {
	const query = request.query;

	await s3.deleteObject({
		Bucket: bucketName,
		Key: query.image.substring(query.image.lastIndexOf("/") + 1)
	})
		.promise();

	await db.remove("cars", ObjectId(query.id));

	response.send("Deleted");
});

app.listen(port, () => console.log(`Server is running on port ${port}`));

(async () => await db.close())();