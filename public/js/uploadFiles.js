const multer = require('multer');
const path = require('path');
const fs = require('fs');
const body = require("body-parser");
const { MediaOnly, MediaText } = require("./newInfoRelease.js");
const { timeSince, getDateTime, getNowDate } = require("./timeSince.js");
const mysql = require("mysql");
const { response } = require('express');
let name = null;
const pool = mysql.createPool({
	connectionLimit: 0,
	host: "localhost",
	user: "root",
	port: "3306",
	password: "",	
	database: "collab_learn",
	charset : 'utf8mb4',
	collation: 'utf8mb4_bin'
});

function uploadFiles(st, field) {
	if(field.type == "rooms") return multer({ storage: st }).fields([{name: field.field, maxCount: 1}, {name: field.cover, maxCount: 1}]);
	else return multer({ storage: st }).fields([{name: field.field}]);
}

function storage(obj){
	return multer.diskStorage({
		destination: (req, files, callback) => {
			switch(obj.fileDestination)
			{
				case "profile":
					try{
						fs.readdir(`./_USERS/${req.body.userID}/${obj.fileDestination}`, (err, files) => {
							if(err) throw err;
							files.forEach((value, index) => {
								fs.unlinkSync(`./_USERS/${req.body.userID}/${obj.fileDestination}/${value}`);
							});
						});
					}
					catch(exception){
						console.log(exception.message);
					}
					break;
				case "items":
					callback(null, `./public/${obj.fileDestination}`);
					break;
				default:
					if(obj.uploadType == "private")
						callback(null, `./_USERS/${req.body.userID}/${obj.fileDestination}`);
					else
						callback(null, `./public/${obj.fileDestination}`);
			}
		},
		filename: (req, files, callback) => {
			if(files != undefined && files != null)
				callback(null, `${files.fieldname}-${Date.now()}${path.extname(files.originalname)}`);
			else{
				callback(null, null);
			}
		}
	});
}

function upload(dest, field, req, res)
{
    uploadFiles(storage(dest), field)(req, res, err => {
		if(err)
			res.end(err);
        else{
			switch(field.type)
			{
				case "publicPosts":
					if(req.body.post.length == 0)
					{
						let textPostObject = {
							post_id: null,
							user_id: req.body.userid,
							topic: req.body.topic,
							post: null,
							post_date: getDateTime(),
							subject_id: null,
							post_image: req.files[field.field][0].filename
						}
					
						pool.getConnection((err, connection) => {
							if(err) throw err;
							connection.query(`SELECT subject_code FROM class_type, users, subjects WHERE users.user_id = '${textPostObject.user_id}' AND subjects.subject_name = '${req.body.subject}' AND subjects.class_type = class_type.type_id`, (mysqliError, result) => {
								connection.release();
								if(mysqliError) throw mysqliError;
								if(result.length == 1)
								{
									result.forEach((value, key) => {
										textPostObject.subject_id = value.subject_code;
										pool.getConnection((err, connection) => {
											connection.release();
											if(err) throw err;
											connection.query("INSERT INTO posts SET ?", textPostObject, (err, result) => {
												if(err) throw err;
												if(result.affectedRows == 1)
												{
													var mOnly = new MediaOnly(textPostObject.topic, timeSince(new Date(textPostObject.post_date)), `${field.uusers[textPostObject.user_id].name} ${field.uusers[textPostObject.user_id].surname}`, field.uusers[textPostObject.user_id].school, textPostObject.subject_id, "12344432", textPostObject.user_id, req.files[field.field][0].filename);
													res.send({type: "mOnly", object: mOnly.createPost()});
												}
											});
										});
									});
								}
								else{
									console.log(JSON.stringify(result));
								}
							});
						});
					}
					else
					{
						let textPostObject = {
							post_id: null,
							user_id: req.body.userid,
							topic: req.body.topic,
							post: req.body.post,
							post_date: getDateTime(),
							subject_id: null,
							post_image: req.files[field.field][0].filename
						}

						pool.getConnection((err, connection) => {
							if(err) throw err;
							connection.query(`SELECT subject_code FROM class_type, users, subjects WHERE users.user_id = '${textPostObject.user_id}' AND subjects.subject_name = '${req.body.subject}' AND subjects.class_type = class_type.type_id`, (mysqliError, result) => {
								connection.release();
								if(mysqliError) throw mysqliError;
								if(result.length == 1)
								{
									result.forEach((value, key) => {
										textPostObject.subject_id = value.subject_code;
										pool.getConnection((err, connection) => {
											connection.release();
											if(err) throw err;
											connection.query("INSERT INTO posts SET ?", textPostObject, (err, result) => {
												connection.release();
												if(err) throw err;
												if(result.affectedRows == 1)
												{
													var mText = new MediaText(textPostObject.topic, timeSince(new Date(textPostObject.post_date)), `${field.uusers[textPostObject.user_id].name} ${field.uusers[textPostObject.user_id].surname}`, field.uusers[textPostObject.user_id].school, textPostObject.subject_id, "12344432", textPostObject.user_id, textPostObject.post_image);
													res.send({type: "mText", object: mText.createPost()});
												}
											});
										});
									});
								}
								else{
									console.log(JSON.stringify(result));
								}
							});
						});
					}
					break;
				case "files":
					switch(field.field)
					{
						case "vids":
							var addUserVideo = `INSERT INTO media (_id, media_file, user_id, file_description, media_type) VALUES (${null}, '${req.files[field.field][0].filename}', '${req.body.userID}', '${req.body.fileName}', 'Video');`;
							saveFilesQuery(addUserVideo);
							res.send({type: "files", object: "File successfully uploaded!"});
							break;
						case "imgs":
							var addUserVideo = `INSERT INTO media (_id, media_file, user_id, file_description, media_type) VALUES (${null}, '${req.files[field.field][0].filename}', '${req.body.userID}', '${req.body.fileName}', 'Images');`;
							saveFilesQuery(addUserVideo);
							res.send({type: "files", object: "File successfully uploaded!"});
							break;
						case "aud":
							var addUserVideo = `INSERT INTO media (_id, media_file, user_id, file_description, media_type) VALUES (${null}, '${req.files[field.field][0].filename}', '${req.body.userID}', '${req.body.fileName}', 'Audio');`;
							saveFilesQuery(addUserVideo);
							res.send({type: "files", object: "File successfully uploaded!"});
							break;
						case "bks":
							var addUserVideo = `INSERT INTO documents (_id, file, user_id, file_description, doc_type) VALUES (${null}, '${req.files[field.field][0].filename}', '${req.body.userID}', '${req.body.fileName}', 'book');`;
							saveFilesQuery(addUserVideo);
							res.send({type: "files", object: "File successfully uploaded!"});
							break;
						case "pprs":
							var addUserVideo = `INSERT INTO documents (_id, file, user_id, file_description, doc_type) VALUES (${null}, '${req.files[field.field][0].filename}', '${req.body.userID}', '${req.body.fileName}', 'paper');`;
							saveFilesQuery(addUserVideo);
							res.send({type: "files", object: "File successfully uploaded!"});
							break;
						case "prof":
							saveFilesQuery(`UPDATE users SET profile = '${req.files[field.field][0].filename}' WHERE user_id = '${req.body.userID}'`);
							field.usersArr[req.body.userID].profile = req.files[field.field][0].filename;
							res.send({type: "files", object: req.files[field.field][0].filename});
							break;
						case "subBook":
							name = req.files[field.field][0].originalname;
							var addUserVideo = `INSERT INTO documents (file, user_id, doc_type, subject_id, file_description) VALUES ('${req.files[field.field][0].filename}', '${req.body.userID}', 'book', '${req.body.subject}', '${name.replace(name.substr(name.lastIndexOf('.')), "").replace("'", "\\'")}');`;
							saveFilesQuery(addUserVideo);
							res.end("book");
							break;
						case "subPaper":
							name = req.files[field.field][0].originalname;
							var addUserVideo = `INSERT INTO documents (file, user_id, doc_type, subject_id, file_description) VALUES ('${req.files[field.field][0].filename}', '${req.body.userID}', 'paper', '${req.body.subject}', '${name.replace(name.substr(name.lastIndexOf('.')), "").replace("'", "\\'")}');`;
							saveFilesQuery(addUserVideo);
							res.end("paper");
							break;
						case "subVideo":
							name = req.files[field.field][0].originalname;
							var addUserVideo = `INSERT INTO media (media_file, user_id, file_description, media_type, subject_id) VALUES ('${req.files[field.field][0].filename}', '${req.body.userID}', '${name.replace(name.substr(name.lastIndexOf('.')), "").replace("'", "\\'")}', 'Video', '${req.body.subject}');`;
							saveFilesQuery(addUserVideo);
							res.end("video");
							break;
					}
					break;
				case "rooms":
					var fileObj = null;
					if(req.files[field.field] != undefined && req.files[field.field] != null)
						fileObj = req.files[field.field][0].filename;
					else
						fileObj = null;

					if(req.body.file != undefined)
					{
						fileObj = req.body.file;
						fs.copyFile(`public/images/${req.body.file}`, `public/media/${req.body.file}`, err => {
							if(err)
								console.log(err);
							else
								console.log("File Copied Successfully!");
						})
					}

					let newRooms = `INSERT INTO rooms (_id, roomName, admin, dateCreated, roomDescription, roomSubject, media_file, room_cover, accessToken, room_type) VALUES (null, '${req.body.roomName}', '${req.body.userId}', '${getNowDate(new Date())}', '${req.body.roomDescription}', '${req.body.subject}', '${fileObj}', '${req.files[field.cover][0].filename}', '${req.body.token}', '${req.body.roomType}')`;
					pool.query(newRooms, (err, response) => {
						if(err) console.log(err);
						if(response.affectedRows == 1)
						{
							pool.query(`SELECT MAX(_id) FROM rooms WHERE admin = '${req.body.userId}'`, (err, response) => {
								if(err) console.log(err);
								res.status(200).send(response[0]);
							});
						}
						else{
							res.status(404).send("Something went wrong while creating your new room, Please try again!");
						}
					});
					break;
				case "roomsChat":
					var files = null;
					if(req.files[field.field] != undefined && req.files[field.field] != null)
						files = req.files[field.field][0].filename;

					let rc = `INSERT INTO roomsmessages (_id, message, msgDate, roomRef, mediaFile, sentBy) VALUES (null, '${req.body.roomsMsgTextBox}', '${getDateTime()}', '${req.body.ref}', '${files}', '${req.body.userID}')`;
					saveFilesQuery(rc);
					res.status(200).send({file: files});
					break;
				case "privateMessage":
					var files = null;
					var type = null;

					if(req.files[field.field] != undefined && req.files[field.field] != null)
					{
						files = req.files[field.field][0].filename;
						type = req.files[field.field][0].mimetype;
					}

					let obj = {
						_id: null,
						msgFrom: req.body.msgFrom, 
						msgTo: req.body.msgTo,
						msgDate: getDateTime(), 
						msgStatus: 'Unread',
						message: req.body.message,
						media_file: files,
						mimetype: type
					}

					saveMessages(obj, data => {
						if(data == true)
						{
							pool.getConnection((err, connection) => {
								if(err) console.log(err);
								connection.query(`SELECT _id FROM messages WHERE msgDate = '${obj.msgDate}' AND msgFrom = '${obj.msgFrom}' AND msgTo = '${obj.msgTo}'`, (er, response) => {
									connection.release();
									if(er) console.log(er);
									saveFilesQuery(`INSERT INTO newmessages (sentFrom, sentTo, msg_id) VALUES('${obj.msgFrom}', '${obj.msgTo}', '${response[0]["_id"]}')`);
								});
							});
						}
						res.status(200).send(obj);
					});
					break;
				case "onlineSelling":
					pool.query(`INSERT INTO advertisement (product_name, product_price, product_description, product_image, owner_id) VALUES('${req.body.name}', '${req.body.price}', '${req.body.description}', '${req.files[field.field][0].filename}', '${req.body.user}')`, (err, response) => {
						if(err) console.log(err);
						if(response.affectedRows == 1)
							res.status(200).end("Product Advertised");
						else
							res.status(500).end("Server Error...");
					});
					break;
			}
		}
    });
}

function saveMessages(q, callback)
{
	pool.getConnection((err, connection) => {
		if(err) throw err;
		connection.query("INSERT INTO messages SET ?", q, (err, results) => {
			connection.release();
			if(err) throw err;
			if(results.affectedRows == 1)
				callback(true);
			else
				callback(false);
		});
	});
}

async function saveFilesQuery(query)
{
	pool.getConnection((error, connection) => {
		if(error) console.log(error);
		connection.query(query, (er, result) => {
			connection.release();
			if(er) console.log(er);
		});
	});
}

async function getActiveUsers(arr)
{
	arr.splice(0, arr.length);
	pool.getConnection((err, connection) => {
		if(err) console.log(err);
		connection.query("SELECT user_id FROM login WHERE logStatus = 'Online'", (err, result) => {
			connection.release();
			if(err) console.log(err)
			result.forEach((value, index) => {
				arr.push({_id: value.user_id})
			});
		});
	});
}

module.exports.storage = storage;
module.exports.uploadFiles = uploadFiles;
module.exports.upload = upload;
module.exports.saveFilesQuery = saveFilesQuery;
module.exports.getActiveUsers = getActiveUsers;