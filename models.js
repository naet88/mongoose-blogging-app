const mongoose = require('mongoose');

//Mongoose models need to have a Scheme defined 

const blogPostsSchema = mongoose.Schema({
	title: {type: String, required: true},
	author: {
		firstName: {type: String, required: true},
		lastName: {type: String, required: true}		
	},
	content: {type: String, required: true}
});

//Virtuals
//The virtuals get method is a function returning a the virtual value. 
blogPostsSchema.virtual('authorFullName').get(function() {
	return this.author.firstName + ' ' + this.author.lastName;
});

blogPostsSchema.methods.apiRepr = function() {
	return {
		id: this._id,
		title: this.title,
		author: this.authorFullName,
		content: this.content
	};
}

//creates a new mongoose model, Blogpost that uses the blogpostsschema
//Mongoose will use first argument we pass to .model() ('Restaurant') 
//to determine the collection in our database that corresponds to this model. 
//QQQ: Wait, how do we define the collection in our database

//QQ: this works as well... why?
//const Blogpost = mongoose.model('blogpost', blogPostsSchema);
const Blogpost = mongoose.model('Blogpost', blogPostsSchema);

module.exports = {Blogpost};

