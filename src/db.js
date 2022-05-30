const { MongoClient } = require("mongodb");
const uri = "mongodb+srv://user:user@car-dealership-db.tg8gf.mongodb.net/myFirstDatabase?retryWrites=true&w=majority";
const client = new MongoClient(uri);

(async () => {
	try {
		await client.connect();
	} catch (e) {
		console.log(e);
	}
})();

const db = client.db("db");

async function insert(collection, data) {
	const _collection = db.collection(collection);

	await _collection.insertOne(data, err => {
		if (err) console.log(err);
	});
}

async function find(collection) {
	const _collection = await db.collection(collection);

	return await _collection.find()
		.toArray();
}

async function update(collection, _id, data) {
	const _collection = await db.collection(collection);

	await _collection.updateOne({ _id }, { $set: data }, err => {
		if (err) console.log(err);
	});
}

async function remove(collection, _id) {
	const _collection = await db.collection(collection);

	await _collection.deleteOne({ _id }, err => {
		if (err) console.log(err);
	});
}

async function close() {
	await client.close();
}

module.exports = {
	insert,
	find,
	update,
	remove,
	close
};