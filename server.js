const bodyParser = require('body-parser');
const express = require('express');
const mongoose = require('mongoose');

mongoose.Promise = global.Promise;

const {PORT, DATABASE_URL} = require('./config');
const {Blogpost} = require('./models');

const app = express();
app.use(bodyParser.json());

//Begin CRUD Operations

app.get('/posts', (req, res) => {
	Blogpost
		.find()
		//exec() returns a promise
		.exec()
		//success callback
		//QQ:can we talk about how this is working...why need map()?
		.then(blogposts => {
			res.json({
				blogposts: blogposts.map(
					(blogpost) => blogpost.apiRepr())
			});
		})
		//note: this gives all the outputs
		// .then(blogposts => 
		// 	res.json({
		// 		blogposts: blogposts
		// }));

		//QQ: where did err come from? Is this a callback so it fetches the error?
		.catch(
			err => {
				console.error(err);
				return res.status(500).json({message: 'Internal server error'});
			});

});

app.get('/posts/:id', (req, res) => {
	Blogpost
		.findById(req.params.id)
		.exec()
		.then(blogposts => {
			res.json({
				blogpost: blogposts.apiRepr()
			});
		})
		.catch(
			err => {
				console.error(err);
				return res.status(500).json({message: 'Internal server error'});
			});
});

app.post('/posts', (req, res) => {
	//checking required fields
	const requiredFields = ['title', 'content', 'author'];
	for (let i = 0; i < requiredFields.length; i++) {
		const field = requiredFields[i];
		if (!(field in req.body)) {
			const errorMessage = `Missing \`${field}\`in request body`
			console.error(merrorMessage);
			return res.status(400).send(message);
		}
	}


	//if required fields are all there, this executes

	Blogpost
		.create({
			title: req.body.title,
			content: req.body.content,
			author: {
				firstName: req.body.author.firstName,
				lastName: req.body.author.lastName
			}
		})
		.then(newPost => {
			res.json({
				blogpost: newPost.apiRepr()
			})
		})
		.catch(
			err => {
				console.error(err);
				return res.status(500).json({message: 'Internal server error'});
			});
})


app.put('/posts/:id', (req, res) => {
	//first make sure that the id in the req body and req in the path match. 
	if(!(req.params.id === req.body.id)) {
		const message = (
			`request path id (${req.params.id}) and request body id ` +
			`(${req.body.id}) must match`);
		console.error(message);
		res.status(400).json({message: message});
		}
		
		//create updateable object

		const toUpdate = {};
		const updateableFields = ['title', 'author', 'content'];

		updateableFields.forEach(field => {
			if (field in req.body) {
				toUpdate[field] = req.body[field];
			}
		});
		
		Blogpost
			.findByIdAndUpdate(req.params.id, {$set: toUpdate})
			.exec()
			.then(blogpost => res.status(204).end())
			.catch(err => res.status(500).json({message: 'internal server error'}));
});

app.delete('/posts/:id', (req, res) => {
	Blogpost
		.findByIdAndRemove(req.params.id)
		.exec()
		.then(blogpost => res.status(204).end())
		.catch(err => res.status(500).json({message: 'internal server error'}));
});

let server;

//connects to database, then starts server
function runServer (databaseUrl = DATABASE_URL, port = PORT) {

	return new Promise((resolve, reject) => {
		mongoose.connect(databaseUrl, err => {
			if (err) {
				return reject(err);
			}
			server = app.listen(port, () => {
				console.log(`your app is listening on port ${port}`);
				resolve();
			})
			//QQ: wait, why don't we need ; above
			//QQ: why do we need this below, seems redundant w/ lines 37-39
			.on('error', err => {
				mongoose.disconnect();
				reject(err);
			});
		});
	});
}

function closeServer() {
	return mongoose.disconnect().then(() => {
		return new Promise((resolve, reject) => {
			console.log('closing server');
			server.close(err => {
				if (err) {
					return reject(err);
				}
				resolve();
			});
		});
	});
}

if (require.main === module) {
  runServer().catch(err => console.error(err));
};

//need this so that other files can have access to this. 
module.exports = {runServer, closeServer};