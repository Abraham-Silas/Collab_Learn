const { upload, saveFilesQuery, getActiveUsers } = require("./public/js/uploadFiles");
const { TextOnly } = require("./public/js/newInfoRelease.js");
const { timeSince, getDateTime, getNowDate, getNowTime } = require("./public/js/timeSince.js");
const { createDir } = require("./public/js/createDirectory.js");
const express = require("express");
const app = express();
const server = require("http").createServer(app);
const io = require("socket.io").listen(server);
const path = require("path");
const mysql = require("mysql");
const session = require("express-session");
const mailer = require("nodemailer");
const body = require("body-parser");
const multer  =   require('multer');
const fs = require("fs");
const bcrypt = require("bcryptjs");
const request = require("request");
const unicodes = require('emojis-unicode');
const emojis = require('emojis-list');
const emoji = require('node-emoji');
const { response } = require("express");
require('events').EventEmitter.defaultMaxListeners = 100000000;
let port = process.env.PORT || 7000;
server.listen(port);
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
let ROOMS_SOCKET = null;
var connections = [];
let SOCKET = null;

pool.query("SET NAMES utf8mb4 COLLATE utf8mb4_bin");
pool.query(`UPDATE login SET logStatus = 'Offline' WHERE logStatus = 'Online'`); //RESET ALL USERS TO BEING OFFLINE

///////////////////////////////// Object Arrays ///////////////////////////////////
var activeUsers = [];
var online = [];
///////////////////////////////////////////////////////////////////////////////////

var obj = ()=>{
	return multer();
}

//////////////////////////API REQUESTS/////////////////////////////////////
// request("https://api.deezer.com/chart", {json: true}, (err, res, body) => {
// 	if(err) console.log(err);
// 	console.log(body.albums.data[0].title);
// 	console.log(res.body);
// });
///////////////////////////////////////////////////////////////
// for(let i in emojis)
// console.log(emoji);


///////////////////////////////////////////////////////////////

app.use(express.static(path.join(__dirname, "/public")));
app.use(express.static(path.join(__dirname, "/_USERS")));
app.use(body.urlencoded({extended: true}));
app.use(body.json());
let users = [];
let socketsConnections = [];
var text = multer();
app.post("/profileUpload", (req, res) => { upload({fileDestination: "profile", uploadType: "private"}, {field: "prof", usersArr: users, type: "files"}, req, res); });
app.post("/videoUpload", (req, res) => { upload({fileDestination: "media/videos", uploadType: "private"}, {field: "vids", type: "files"}, req, res); });
app.post("/imageUpload", (req, res) => { upload({fileDestination: "media/images", uploadType: "private"}, {field: "imgs", type: "files"}, req, res); });
app.post("/audioUpload", (req, res) => { upload({fileDestination: "media/audios", uploadType: "private"}, {field: "aud", type: "files"}, req, res); });
app.post("/bookUpload", (req, res) => { upload({fileDestination: "documents/books", uploadType: "private"}, {field: "bks", type: "files"}, req, res); });
app.post("/paperUpload", (req, res) => { upload({fileDestination: "documents/papers", uploadType: "private"}, {field: "pprs", type: "files"}, req, res); });
app.post("/booksFileUpload", (req, res) => { upload({fileDestination: "documents/books", uploadType: "private"}, {field: "subBook", type: "files"}, req, res); });
app.post("/papersFileUpload", (req, res) => { upload({fileDestination: "documents/papers", uploadType: "private"}, {field: "subPaper", type: "files"}, req, res); });
app.post("/videoFileUpload", (req, res) => { upload({fileDestination: "media/videos", uploadType: "private"}, {field: "subVideo", type: "files"}, req, res); });
app.post("/newImagePost", (req, res) => { upload({fileDestination: "images", uploadType: "public"}, {field: "postImage", uusers: users, type: "publicPosts"}, req, res); });
app.post("/createRoom", (req, res) => { upload({fileDestination: "media", uploadType: "public"}, {field: "file", cover: "cover", type: "rooms"}, req, res); });
app.post("/roomChatMsg", (req, res) => { upload({fileDestination: "media", uploadType: "public"}, {field: "file", type: "roomsChat"}, req, res); });
app.post("/newPrivateMessage", (req, res) => { upload({fileDestination: "media", uploadType: "public"}, {field: "msgFile", type: "privateMessage"}, req, res); });
app.post("/advertise", (req, res) => { upload({fileDestination: "items", uploadType: "public"}, {field: "productImg", type: "onlineSelling"}, req, res); });

app.post("/newTextPost", text.none(),(req, res) => {
let textPostObject = {
	post_id: null,
	user_id: req.body.userid,
	topic: req.body.topic,
	post: req.body.post,
	post_date: getDateTime(),
	subject_id: null,
	post_image: null
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
					if(err) throw err;
					connection.query("INSERT INTO posts SET ?", textPostObject, (err, result) => {
						connection.release();
						if(err) throw err;
						if(result.affectedRows == 1)
						{
							var post = new TextOnly(textPostObject.topic, timeSince(new Date(textPostObject.post_date)), `${users[textPostObject.user_id].name} ${users[textPostObject.user_id].surname}`, users[textPostObject.user_id].school, req.body.subject, "12344432", textPostObject.user_id, textPostObject.post);
							res.send({type: "textOnly", object: post.createPost()});
						}
					});
				});
			});
		}
		else{
			console.log(JSON.stringify(result));
		}});
	});
});

app.get("/public", (req, res) => {
	res.sendFile(__dirname + "/public/home.html");
});

app.post("/saveYourSubjects", (req, res) => {
	req.body.dataArray.forEach((value, key) => {
		let data = {
			sub_id: null,
			user_id: req.body.id,
			subject_id: value
		}

		pool.getConnection((err, connection) => {
			if(err) res.status(500).send();
			connection.query("INSERT INTO usersubscription SET ?", data, (err, result) => {
				connection.release();
				if(err) res.status(500).send();

				if(result.affectedRows == 1)
				{
					console.log("Success: " + value);
				}
			})
		});
	});
	res.send("Success");
});

app.post("/loggedUserSubjects", (req, res) => {
	pool.getConnection((error, connection) => {
		if(error) res.status(401).send();
		connection.query(`SELECT subject_name, subject_code FROM subjects, usersubscription WHERE usersubscription.user_id = ? AND subjects.subject_code = usersubscription.subject_id`, [req.body.user_Id], (err, result) => {
			connection.release();
			if(err) res.status(500).send();
			res.send(result);
		});
	});
});

app.post("/checkForNewMessages", (req, res) => {
	pool.getConnection((error, connection) => {
		if(error) res.status(401).send();
		connection.query(`SELECT _id FROM messages WHERE msgStatus = 'Unread' AND msgTo = ?`, [req.body.userId], (err, result) => {
			connection.release();
			if(err) res.status(500).send();
			res.send(result);
		});
	});
});

app.get("/", (req, res) => {
	res.sendFile(__dirname + "/index.html");
});

app.post("/newAccount", (req, res) => {
	var userId = bcrypt.hashSync(req.body.umail, bcrypt.genSaltSync());
	var addNewAccount = {
		user_id: userId, 
		name: req.body.fname, 
		surname: req.body.lname,
		email: req.body.umail, 
		cellphone: req.body.tel, 
		dob: req.body.dob, 
		studyLevel: 1,
		schoolName: req.body.school, 
		gender: req.body.gender 
	};

	var userLoginDetails = {
		log_id: null, 
		username: req.body.umail, 
		password: bcrypt.hashSync(req.body.password, bcrypt.genSaltSync()),
		user_id: userId
	};

	pool.getConnection((errr, connection) => {
		connection.query(`SELECT type_id FROM class_type WHERE class = '${req.body.studyLevel}'`, (er, result) => {
			connection.release();
			if(er) throw er;
			if(result.length == 1)
			{
				result.forEach((value, key) => {
					addNewAccount.studyLevel = value.type_id;
				});
				pool.getConnection((err, connection) => {
					connection.query("INSERT INTO users SET ?", addNewAccount, (er, result) => {
						connection.release();
						if(err) throw err;
						if(result.affectedRows)
						{
							pool.getConnection((er, connection) => {
								connection.query("INSERT INTO login SET ?", userLoginDetails, (er, result) => {
									connection.release();
									if(er) throw er;
									if(result.affectedRows)
									{
										if(!fs.existsSync(`_USERS/${addNewAccount.user_id}`)){
											fs.mkdir(`_USERS/${addNewAccount.user_id}`, ()=>{
												fs.mkdir(`_USERS/${addNewAccount.user_id}/documents`, ()=>{
													fs.mkdir(`_USERS/${addNewAccount.user_id}/media`, ()=>{
														fs.mkdir(`_USERS/${addNewAccount.user_id}/profile`, ()=>{
															fs.mkdir(`_USERS/${addNewAccount.user_id}/documents/books`, ()=>{
																fs.mkdir(`_USERS/${addNewAccount.user_id}/documents/papers`, ()=>{
																	fs.mkdir(`_USERS/${addNewAccount.user_id}/media/videos`, ()=>{
																		fs.mkdir(`_USERS/${addNewAccount.user_id}/media/audios`, ()=>{
																			fs.mkdir(`_USERS/${addNewAccount.user_id}/media/images`, ()=>{
																				res.redirect("/");
																			});
																		});
																	});
																});
															});
														});
													});
												});
											});
										}
									}
								})
							});
						}
					});
				});
			}
		});
	})		
});

app.post("/login", obj().none(), (req, res) => {
	pool.getConnection((err, connection) =>{
		try{
			if(err) throw err;
			connection.query(`SELECT * FROM login WHERE username = '${req.body.username}' AND logStatus = 'Offline'`, (er, result) => {
			connection.release();
				if(er)
					res.send(er);
				else{
					if(result.length == 1)
					{
						result.forEach(function(value, key){
							if(bcrypt.compareSync(req.body.password, value.password))
							{
								pool.getConnection((err, connection) => {
									if(err) res.status(500).send();
									connection.query(`SELECT * FROM users WHERE user_id = '${value.user_id}'`, (er, result) => {
										connection.release();
											if(er) console.log(er);

											if(result.length == 1){
												result.forEach((value, key) => {
													saveFilesQuery(`UPDATE login SET logStatus = 'Online' WHERE user_id = '${value.user_id}'`);
													users.push(value.user_id);
													users[value.user_id] = {name: value.name, surname: value.surname, school: value.schoolName, user_id: value.user_id, soket: null, profile: value.profile, level: value.studyLevel};
													users.splice(users.indexOf(value.user_id), 1);
													online.push(users[value.user_id]);
													res.send({userId: value.user_id, username: value.name});
												});
											}
											else{
												res.status(500).send();
											}
									});
								});
							}
							else{
								res.status(401).send();
							}
						});
					}
					else
						res.status(401).send();
				}
			});
		}
		catch(er)
		{
			console.log(er.message);
		}
	});
});

app.post("/loadSubjects", (req, res) => {
	pool.query(`SELECT * FROM subjects, usersubscription WHERE subjects.subject_code = usersubscription.subject_id AND usersubscription.user_id = ?`, [req.body.id], (err, result) => {
		if(err) console.log(err);
		res.send(result);
	});
});

app.post("/getPosts", (req, res) => {
	pool.getConnection((err, connection) => {
		if(err) throw err;
		connection.query(`SELECT * FROM users, usersubscription, posts, subjects WHERE subjects.class_type = ? AND posts.subject_id = usersubscription.subject_id AND usersubscription.subject_id = subjects.subject_code AND users.user_id = posts.user_id AND usersubscription.user_id = ? ORDER BY post_date DESC LIMIT 10`, [users[req.body._id].level, req.body._id], (er, result) => {
			connection.release();
			if(er) throw er;
			res.send(result);
		});
	})
});

app.post("/UserNotes", (req, res) => {
	let notesObjt = {
		notes_id: null,
		description: req.body.note,
		user_id: req.body.userId,
		date: getDateTime()
	}

	pool.getConnection((err, connection) => {
		if(err) res.status(500).send();
		connection.query("INSERT INTO notes SET ?", notesObjt, (er, result) => {
			connection.release();
			if(er) res.status(404).send();
			if(result.affectedRows == 1){
				res.status(200).send();
			}
		});
	});
});

app.post("/loadNotes", (req, res) => {
	pool.getConnection((err, connection) => {
		if(err) res.status(500).send();
		connection.query(`SELECT * FROM notes WHERE user_id = '${req.body.userId}' ORDER BY date DESC`, (error, result) => {
			connection.release();
			if(error) res.status(400).send();
			res.send(result);
		});
	});
});

app.post("/loadUserMediaFiles", (req, res) => {
	pool.getConnection((err, connect) => {
		if(err) res.status(500).send();
		connect.query(`SELECT * FROM media WHERE user_id = '${req.body.vidsFor}'`, (err, result) => {
			connect.release();
			if(err) res.status(500).send();
			res.send(result);
		});
	});
});

app.post("/loadUserDocumentFiles", (req, res) => {
	pool.getConnection((err, connect) => {
		if(err) res.status(500).send();
		connect.query(`SELECT * FROM documents WHERE user_id = '${req.body.docsFor}'`, (err, result) => {
			connect.release();
			if(err) res.status(500).send();
			res.send(result);
		});
	});
});

app.post("/searchDocs", (req, res) => {
	pool.getConnection((err, connect) => {
		if(err) res.status(500).send();
		connect.query(`SELECT * FROM documents WHERE user_id = '${req.body.docsFor}' AND file_description LIKE '%${req.body.sKey}%'`, (err, result) => {
			connect.release();
			if(err) res.status(500).send();
			res.send(result);
		});
	});
});

app.post("/loadUserBooks", (req, res) => {
	pool.getConnection((err, connect) => {
		if(err) res.status(500).send();
		connect.query(`SELECT * FROM documents WHERE doc_type = 'book' AND user_id = '${req.body.docsFor}'`, (err, result) => {
			connect.release();
			if(err) res.status(500).send("Error");
			res.status(200).send(result);
		});
	});
});

app.post("/loadUserPapers", (req, res) => {
	pool.getConnection((err, connect) => {
		if(err) res.status(500).send();
		connect.query(`SELECT * FROM documents WHERE doc_type = 'paper' AND user_id = '${req.body.docsFor}'`, (err, result) => {
			connect.release();
			if(err) res.status(500).send("Error");
			res.status(200).send(result);
		});
	});
});

app.post("/loadChats", (req, res) => {
	getUsers(req.body.userID, data => {
		pool.getConnection((err, connection) => {
			if(err) res.status(500).send();
			connection.query(`SELECT DISTINCT msgFrom, name, surname, profile FROM messages, users WHERE messages.msgFrom = users.user_id AND messages.msgTo = ? AND users.studyLevel = ? GROUP BY msgFrom, name, surname, profile ORDER BY msgDate DESC`, [req.body.userID, users[req.body.userID].level], (err, results) => {
				connection.release();
				if(err) res.status(500).send();
				for(let i = 0; i < data.length; i++)
				{
					for(let j = 0; j < results.length; j++)
					{
						if(results[j].msgFrom == data[i].sentFrom)
						{
							results[j] = data[i];
							results[j].msgStatus = "Unread";
						}
					}
				}
				res.status(200).send(results);
			});
		});
	});
});

function getUsers(id, callback){
	pool.getConnection((error, connection) => {
		if(error) console.log(error);
		connection.query(`SELECT DISTINCT sentFrom, name, surname, profile FROM newmessages, users WHERE users.user_id = newmessages.sentFrom AND newmessages.sentTo = ?`, [id], (er, results) => {
			connection.release();
			if(er) console.log(er);
			callback(results);
		});
	});
}

app.post("/loadChatMessages", (req, res) => {
	pool.getConnection((err, connection) => {
		if(err) res.status(500).send();
		connection.query(`SELECT * FROM messages WHERE msgFrom = '${req.body.me}' AND msgTo = '${req.body.chat}' OR msgFrom = '${req.body.chat}' AND msgTo = '${req.body.me}' ORDER BY msgDate ASC`, (err, results) => {
			if(err) res.status(500).send("Internal server error occured...");
			connection.query(`UPDATE messages SET msgStatus = 'Read' WHERE msgFrom = '${req.body.chat}' AND msgTo = '${req.body.me}'`, (error, result) => {
				connection.release();
			});
			saveFilesQuery(`DELETE FROM newmessages WHERE sentFrom = '${req.body.chat}' AND sentTo = '${req.body.me}'`);
			res.status(200).send(results);
		});
	});
});

app.post("/saveEvents", (req, res) => {
	pool.getConnection((err, connection) => {
		if(err) res.status(500).send();
		connection.query(`INSERT INTO upcoming_events SET ?`, [req.body], (err, results) => {
			connection.release();
			if(err) res.status(500).send("Error...");
			if(results.affectedRows == 1)
				res.status(200).send("Event Saved");
			
		});
	});
});

app.post("/markRead", (req, res) => {
	pool.getConnection((err, connection) => {
		if(err) res.status(500).send();
		connection.query(`UPDATE messages SET msgStatus = 'Read' WHERE msgFrom = '${req.body.id}' AND msgTo = '${req.body.user}'`, (error, result) => {
			connection.release();
			if(error) res.status(500).send("Error");
			if(result.affectedRows == 1)
				res.status(200).send(req.body.id);
		});
	});
});

app.post("/loadUpcomingEvents", (req, res) => {
	pool.getConnection((err, connection) => {
		if(err) res.status(500).send();
		connection.query(`SELECT * FROM upcoming_events WHERE user_id = ? ORDER BY Date(event_date) >= ?`, [req.body.userId, req.body.nowDate], (err, results) => {
			connection.release();
			if(err) res.status(500).send("Internal server error occured...");
			res.status(200).send(results);
		});
	});
});

app.post("/createRooms", (req, res) => {
	pool.getConnection((err, connection) => {
		if(err) res.status(500).send();
		connection.query(`INSERT INTO rooms SET ?`, [req.body], (err, results) => {
			connection.release();
			if(err) res.status(500).send("Error...");
			//if(results.affectedRows == 1)
			res.status(200).send("Room Created");
			
		});
	});
});

let activeRooms = [];
let userLevel = null;

app.post("/loadRooms", (req, res) => {
	getActiveSessions(data => {
		if(data.length > 0){
			if(users[req.body.find] != undefined)
				userLevel = users[req.body.find].level;
			pool.getConnection((err, connection) => {
				if(err) res.status(500).send();
				for(let i = 0; i < data.length; i++)
				{
					connection.query(`SELECT * FROM rooms, subjects, users WHERE rooms.roomSubject = subjects.subject_code AND subjects.class_type = ? AND users.user_id = rooms.admin AND rooms._id = ?`, [userLevel, data[i].room_id], (err, results) => {
						if(err) console.log(err);
						activeRooms.push(results[0]);

						if(i == data.length-1)
						{
							res.status(200).send(activeRooms);
							activeRooms.splice(0, activeRooms.length);
							connection.release();
						}
					});
				}				
			});
		}
		else
		{
			res.send(activeRooms);
		}
		// res.end("done");
	});
});

function getActiveSessions(callback)
{
	pool.getConnection((err, connection) => {
		if(err) console.log(err);
		connection.query(`SELECT room_id FROM active_rooms WHERE room_status = 'Online'`, (err, results) => {
			connection.release();
			if(err) console.log(err);
			callback(results);
		});
	});
}

app.post("/loadSelectedRoom", (req, res) => {
	pool.getConnection((err, connection) => {
		if(err) res.status(500).send(err);
		connection.query(`SELECT * FROM rooms, users, subjects WHERE _id = ? AND rooms.admin = users.user_id AND rooms.roomSubject = subjects.subject_code`, [req.body.id], (er, results) => {
			connection.release();
			if(er) res.status(500).send(er);
			res.status(200).send(results);
		});
	});
});

app.post("/loadRoomChats", (req, res) => {
	pool.getConnection((err, connection) => {
		if(err) res.status(500).send(err);
		connection.query(`SELECT * FROM roomsmessages, users WHERE roomsmessages.roomRef = ? AND roomsmessages.sentBy = users.user_id ORDER BY roomsmessages.msgDate ASC`, [req.body.room], (er, results) => {
			connection.release();
			if(er) res.status(500).send(er);
			res.status(200).send(results);
		});
	});
});

app.post("/reactToPost", (req, res) => {
	pool.getConnection((error, connection) => {
		if(error) res.status(500).send("Error");
		connection.query(`SELECT * FROM post_reactions WHERE user = ? AND post_id = ?`, [req.body.user, req.body.post_id], (error, response) => {
			if(error) res.status(500).send("Error");
			if(response.length == 1)
			{
				saveFilesQuery(`DELETE FROM post_reactions WHERE user = '${req.body.user}' AND post_id = '${req.body.post_id}'`);
				connection.query(`SELECT * FROM notifications WHERE react_id = ?`, [response[0]["_id"]], (error, response) => {
					connection.release();
					if(error) res.static(500).send("Error");
					if(response.length == 1){
						saveFilesQuery(`DELETE FROM notifications WHERE react_id = '${response[0]["_id"]}'`);
						res.status(200).send("Success");
					}
				});
			}
			else
			{
				connection.query(`INSERT INTO post_reactions SET ?`, [req.body], (err, result) => {
					if(err) res.status(500).send("Error");
					if(result.affectedRows == 1){
						connection.query(`SELECT user_id FROM posts WHERE post_id = ?`, [req.body.post_id], (error, result) => {
							if(error) res.status(500).send("Error");
							result.forEach((value, index) => {
								if(value.user_id == req.body.user)
									res.status(200).send("Success");
								else
								{
									connection.query(`SELECT MAX(_id) FROM post_reactions WHERE user = ?`, [req.body.user], (error, results) => {
										if(error) res.status(500).send("Error...");
										let notificaton = {
											_id: null,
											from: req.body.user,
											to: value.user_id,
											sentDate: getNowDate(new Date()),
											sentTime: getNowTime(),
											notificationType: "reaction",
											notification_status: "Not Viewed",
											react_id: results[0]["MAX(_id)"]
										}
										connection.query(`INSERT INTO notifications SET ?`, [notificaton], (error, result) => {
											connection.release();
											if(error) res.status(500).send("Error...");
											//if(result.affectedRows == 1)
												res.status(200).send("Success");
										});
									});
								}
							});
						});
					}
				});
			}
		});
	});
});

app.post("/newUpdates", (req, res) => {
	pool.getConnection(async (error, connection) => {
		if(error) res.status(500).send("Error");
		await connection.query(`SELECT * FROM notifications WHERE notifications.notification_status = 'Not Viewed' AND notifications.to = ?`, [req.body.userId], (error, result) => {
			connection.release();
			if(error) res.status(500).send("Error...");
			res.status(200).send(result);
		});
	});
});

function getOtherNotifs(user, callback)
{
	pool.getConnection((error, connection) => {
		if(error) res.status(500).send("Error");
		connection.query(`SELECT * FROM notifications, users WHERE notifications.notificationType <> 'reaction' AND notifications.notification_status = 'Not Viewed' AND notifications.from = users.user_id AND notifications.to = ?`, [user], (error, results) => {
			connection.release();
			if(error) res.status(500).send("Error...");
			callback(results);
		});
	});
} 

app.post("/getNotifications", (req, res) => {
	getOtherNotifs(req.body.me, data => {
		pool.getConnection((error, connection) => {
			if(error) res.status(500).send("Error");
			connection.query(`SELECT * FROM notifications, users, post_reactions WHERE notifications.notificationType = 'reaction' AND notifications.from = users.user_id AND notifications.notification_status = 'Not Viewed' AND post_reactions._id = notifications.react_id AND notifications.to = ?`, [req.body.me], (error, result) => {
				connection.release();
				if(error) res.status(500).send("Error...");
				// console.log(result);
				result.forEach((value, index) => {
					data.push(value);
				});
				// console.log(data);
				res.status(200).send(data);
				saveFilesQuery(`UPDATE notifications SET notifications.notification_status = 'Viewed' WHERE notifications.to = '${req.body.me}' AND notifications.notificationType = 'reaction'`);
			});
		});
	});
});

app.post("/roomType", (req, res) => {
	pool.getConnection(async (error, connection) => {
		if(error) res.status(500).send("Error");
		await connection.query(`SELECT * FROM rooms WHERE _id = ?`, [req.body.data], (err, response) => {
			connection.release();
			if(err) res.status(500).send("Error");
			res.status(200).send(response);
		})
	});
});

app.post("/canIJoinYourRoom", (req, res) => {
	if(users[req.body.to] != undefined && users[req.body.to] != null)
	{
		newInvitation("INSERT INTO notifications SET ?", req.body, data => {
			if(data.length != 0)
				res.status(200).send(data);
			else
				res.status(418).send("reload");
		});
	}
	else{
		newInvitation("INSERT INTO notifications SET ?", req.body, data => {
			if(data.length != 0){
				res.status(200).send(data);
				sendEmail();
			}
			else
				res.status(418).send("reload");
		});
	}
	saveFilesQuery(`UPDATE notifications SET notification_status = 'Viewed' WHERE notifications.to = '${req.body.from}' AND notifications.room_id = '${req.body.room_id}' AND notifications.notificationType = 'request'`);
});

app.post("/getSubjectItems", (req, res) => {
	pool.query(`SELECT * FROM documents WHERE user_id = '${req.body.user}' AND subject_id = '${req.body.subject}' AND doc_type = '${req.body.format}'`, (err, response) => {
		if(err) console.log(err);
		res.status(200).send(response);
	});
});

app.post("/getSubjectVideoItems", (req, res) => {
	pool.query(`SELECT * FROM media WHERE user_id = '${req.body.user}' AND subject_id = '${req.body.subject}' AND media_type = '${req.body.format}'`, (err, response) => {
		if(err) console.log(err);
		res.status(200).send(response);
	});
});

let sendEmail = async (mail = "hlamu.maluleka@gmail.com") => {
	let transporter = mailer.createTransport({
		service: 'gmail',
		auth: {
			user: 'u15231748@tuks.co.za',
			pass: '@D32tiny'
		}
	});

	let mailOptions = {
		from: 'u15231748@tuks.co.za',
		to: mail,
		subject: 'NEW SESSION INVITATION',
		html: `<h1>Session Invitation</h1> <br><br> <b>Nhlamulo Maluleka</b> has invited you to join their Artificial Intelligence session titled: <b>The dangers of A.I</b>.
		<br><br><h4>To join the session, <a href="http://localhost:3000/" class="btn btn-danger btn-lg">login</a> to your _Co account. under the Notifications tab, appect the invitation and you are good to go!!</h4>`
	}

	await transporter.sendMail(mailOptions, (error, info) => {
		if(error) console.log(error);
		else console.log(info.response);
	});
}

async function newInvitation(sqlQuery, dataObj, callback)
{
	pool.getConnection(async (error, connection) => {
		if(error) res.status(500).send("Error");
		await connection.query(sqlQuery, [dataObj], async (err, response) => {
			connection.release();
			if(err) console.log(err);
			callback(await response);
		});
	});
}

app.post("/listRooms", (req, res) => {
	pool.getConnection((error, connection) => {
		if(error) console.log(error);
		connection.query(`SELECT * FROM rooms, subjects WHERE rooms.admin = ? AND subjects.subject_code = rooms.roomSubject ORDER BY _id DESC`, [req.body.data], (err, result) => {
			connection.release();
			if(err) console.log(err);
			res.status(200).send(result);
		});
	});
});

app.post("/loadOnlinePeople",  (req, res) => {
	pool.getConnection(async (error, connection) => {
		if(error) console.log(error);
		await connection.query("SELECT * FROM users, login WHERE login.user_id = users.user_id AND studyLevel = ? AND users.user_id <> ? ORDER BY schoolName = ?, login.logStatus = 'Online' DESC", [users[req.body.user].level, req.body.user, users[req.body.user].school], (err, response) => {
			connection.release();
			if(err) console.log(err);
			res.status(200).send(response);
		});
	});
});

app.post("/loadContacts", (req, res) => {
	pool.query("SELECT * FROM users WHERE studyLevel = ? AND user_id <> ? ORDER BY schoolName = ? DESC", [users[req.body.id].level, req.body.id, users[req.body.id].school], (err, response) => {
		if(err) console.log(err);
		res.status(200).send(response);
	});
});

app.post("/findAContact", (req, res) => {
	pool.query(`SELECT * FROM users WHERE name LIKE '%${req.body.key}%' OR surname LIKE '%${req.body.key}%' OR schoolName LIKE '%${req.body.key}%'`, (err, response) => {
		if(err) console.log(err);
		res.status(200).send(response);
	});
});

app.post("/roomDetails", (req, res) => {
	pool.getConnection((error, connection) => {
		if(error) console.log(error);
		connection.query("SELECT * FROM rooms, subjects, users WHERE _id = ? AND rooms.roomSubject = subjects.subject_code AND users.user_id = rooms.admin", [req.body.room], (err, response) => {
			connection.release();
			if(err) console.log(err);
			res.status(200).send(response[0]);
		});
	});
});

app.post("/viewJoined", (req, res) => {
	pool.query(`SELECT * FROM joined_users, users WHERE joined_users.user_id = users.user_id AND joined_users.room = ?`, [req.body.id], (err, response) => {
		if(err) console.log(err);
		res.status(200).send(response);
	});
});

app.post("/loadBookmarkNotes", (req, res) => {
	pool.query(`SELECT * FROM documentnotes WHERE user = ? AND document_id = ?`, [req.body.user, req.body.id], (err, response) => {
		if(err) console.log(err);
		res.status(200).send(response);
	});
});

app.post("/loadMediaNotes", (req, res) => {
	pool.query(`SELECT * FROM media_notes WHERE user = ? AND file_id = ?`, [req.body.user, req.body.id], (err, response) => {
		if(err) console.log(err);
		res.status(200).send(response);
	});
});

app.post("/bookmarkDocsNotes", (req, res) => {
	pool.query(`INSERT INTO documentnotes (user, document_id, description) VALUES ('${req.body.user}', '${req.body.id}', '${req.body.bookmark}')`);
	res.status(200).end("Bookmarked!!");
});

app.post("/bookmarkMediaNotes", (req, res) => {
	pool.query(`INSERT INTO media_notes (user, file_id, description) VALUES ('${req.body.user}', '${req.body.id}', '${req.body.bookmark}')`);
	res.status(200).end("Bookmarked!!");
});

app.post("/loadEventSubjects", (req, res) => {
	pool.query(`SELECT * FROM upcoming_events WHERE user_id = ? AND subject_id = ?`, [req.body.userId, req.body.subject], (err, response) => {
		if(err) console.log(err);
		res.status(200).send(response);
	});
});

app.post("/newProjectCreation", (req, res) => {
	pool.query(`INSERT INTO projects(name, owner, subject_id) VALUES ('${req.body.project}', '${req.body.user}', '${req.body.subject}')`, (err, response) => {
		if(err) console.log(err);
		if(response.affectedRows == 1)
		{
			pool.query(`SELECT MAX(_id) FROM projects WHERE owner = ?`, [req.body.user], (err, results) => {
				if(err) console.log(err);
				res.status(200).send(results[0]);
			});
		}
	});
});

app.post("/completeProjectCreation", (req, res) => {
	pool.query(`UPDATE projects SET description = ?, importance = ? WHERE _id = ?`, [req.body.description, req.body.importance, req.body.project], (err, response) => {
		if(err) console.log(err);
		if(response.affectedRows == 1)
		{
			res.status(200).send("Success");
		}
		else
		{
			res.status(500).send("Oops");
		}
	});
});

app.post("/loadProjects", (req, res) => {
	pool.query(`SELECT * FROM projects WHERE owner = ? AND subject_id = ?`, [req.body.user, req.body.subject], (err, response) => {
		if(err) console.log(err);
		res.status(200).send(response);
	});
});

let dashBoardObject = {
	notComplete: null,
	complete: null
}

app.post("/loadProjectsToBeCompleted", (req, res) => {
	pool.query(`SELECT COUNT(_id) FROM projects WHERE owner = ? AND subject_id = ? AND status <> 'Complete'`, [req.body.user, req.body.subject], (err, response) => {
		if(err) console.log(err);
		res.status(200).send(response[0]);
	});
});

app.post("/loadCompletedProjects", (req, res) => {
	pool.query(`SELECT COUNT(_id) FROM projects WHERE owner = ? AND subject_id = ? AND status = 'Completed'`, [req.body.user, req.body.subject], (err, response) => {
		if(err) console.log(err);
		res.status(200).send(response[0]);
	});
});

app.post("/loadSubjectsUpcomingEvents", (req, res) => {
	pool.query(`SELECT COUNT(_id) FROM upcoming_events WHERE user_id = ? AND subject_id = ? AND event_date >= ?`, [req.body.user, req.body.subject, req.body.today], (err, response) => {
		if(err) console.log(err);
		res.status(200).send(response[0]);
	});
});

app.post("/loadUserNotes", (req, res) => {
	pool.query(`SELECT * FROM notes WHERE user_id = ? ORDER BY last_updated DESC`, [req.body.user], (err, response) => {
		if(err) console.log(err);
		res.status(200).send(response);
	});
});

app.post("/loadSelectedNote", (req, res) => {
	pool.query(`SELECT * FROM notes WHERE notes_id = '${req.body.note}'`, (err, response) => {
		if(err) console.log(err);
		if(response.length > 0)
			res.status(200).send(response[0]);
		else
			res.status(500).send("Server error...");
	});
});

app.post("/createNotes", (req, res) => {
	let q = null;
	console.log(req.body);
	if(req.body.id == undefined)
		q = `INSERT INTO notes (name, user_id) VALUES ('${req.body.note}', '${req.body.user}')`;
	else
		q = `INSERT INTO notes (name, user_id, object_file, type) VALUES ('${req.body.note}', '${req.body.user}', '${req.body.id}', '${req.body.type}')`;

	pool.query(q, (err, response) => {
		if(err) console.log(err);
		if(response.affectedRows == 1)
		{
			pool.query(`SELECT MAX(notes_id) FROM notes WHERE user_id = '${req.body.user}'`, (err, results) => {
				if(err) console.log(err);
				console.log(results);
				if(results.length > 0)
					res.status(200).send(results[0]);
				else
					res.status(500).send("Server Error...");
					//return server error
			});
		}
	});
});

app.post("/saveUserNote", (req, res) => {
	pool.query(`UPDATE notes SET description = '${(req.body.note).replace(/'/g, "\\'").replace(/\n/g, "\\r\\n")}', last_updated = NOW() WHERE notes_id = '${req.body.noteId}'`, (err, response) => {
		if(err) console.log(err);
		if(response.affectedRows == 1)
			res.status(200).send("Note Saved Successfully");
		else
			res.status(500).send("An error occured")
	});
});

app.post("/searchNotes", (req, res) => {
	pool.query(`SELECT * FROM notes WHERE user_id = '${req.body.user}' AND name LIKE '%${req.body.search}%'`, (err, response) => {
		if(err) console.log(err);
		res.status(200).send(response);
	});
});

app.post("/checkNoteFirst", (req, res) => {
	pool.query(`SELECT * FROM notes WHERE user_id = '${req.body.user}' AND type = '${req.body.type}' AND object_file = '${req.body.id}'`, (err, response) => {
		if(err) console.log(err);

		if(response.length > 0)
			res.status(200).send({exist: response[0].notes_id});
		else
			res.status(200).send({exist: 0});
	});
});

app.post("/getFullNotesDetails", (req, res) => {
	let q = null;
	if(req.body.type == "document")
		q = `SELECT * FROM notes, documents WHERE notes.notes_id = '${req.body.note}' AND notes.object_file = documents._id`;
	else
		q = `SELECT * FROM notes, media WHERE notes.notes_id = '${req.body.note}' AND notes.object_file = media._id`;

	pool.query(q, (err, response) => {
		if(err) console.log(err);
		res.status(200).send(response[0]);
	});
});

app.post("/getPostInformation", (req, res) => {
	pool.query(`SELECT * FROM posts WHERE post_id = '${req.body.id}'`, (err, response) => {
		if(err) console.log(err);
		// console.log(response);
		if(response.length == 1)
			res.status(200).send(response[0]);
		else
			res.status(500).send("Server Error");
	});
});

app.post("/checkIfRoomAlreadyExist", (req, res) => {
	pool.query(`SELECT * FROM rooms WHERE admin = '${req.body.user}' AND roomName = '${req.body.room}' AND roomSubject = '${req.body.subject}'`, (err, response) => {
		if(err) console.log(err);
		if(response.length > 0)
			res.send(response[0]);
		else
			res.end("0");
	});
});

app.post("/advertisedProducts", (req, res) => {
	pool.query(`SELECT * FROM advertisement WHERE product_status = 'pending' ORDER BY advert_date DESC`, (err, response) => {
		if(err) console.log(err);
		res.status(200).send(response);
	});
});

app.post("/findAproduct", (req, res) => {
	pool.query(`SELECT * FROM advertisement WHERE product_name LIKE '%${req.body.search}%'`, (err, response) => {
		if(err) console.log(err);
		res.status(200).send(response);
	});
});

io.sockets.on("connection", socket => {
	SOCKET = io.sockets;
	socket.on("loadUserData", (uid, callback) => {
		if(users[uid] != null && users[uid] != undefined){
			connections.push(socket.id);
			users[uid].soket = socket.id;
			connections[socket.id] = uid;
			connections.splice(connections.indexOf(socket.id), 1);
			callback(true, users[uid]);
			onlineUsers();
		}
		else{
			callback(false, null);
		}
	});

	function onlineUsers(){
		io.sockets.emit("onlineUsers", online);
	}

	socket.on("logout", data => {
		if(users[data] !== null && users[data] != undefined){
			console.log(`${users[data].name} ${users[data].surname} logged out`);
			online.forEach((value, index) => {
				if(value.user_id == data){
					online.splice(index, 1);
					return;
				}
			});

			let roomID = users[data].room;
			saveFilesQuery(`UPDATE login SET logStatus = 'Offline' WHERE user_id = '${data}'`);

			if(roomID == undefined)
			{
				socket.emit("user-logged-out");
				delete users[data];
			}
			else
			{
				saveFilesQuery(`DELETE FROM joined_users WHERE room = '${roomID}' AND user_id = '${data}'`);
				if(users[data] != undefined && users[data] != null){
					pool.getConnection((er, connection) => {
						if(er) console.log(er);
						connection.query(`SELECT * FROM joined_users WHERE room = '${roomID}'`, (err, results) => {
							connection.release();
							if(err) console.log(err);
							if(results.length > 0)
							{
								ROOMS_SOCKET.broadcast.to(roomID).emit("left", `<b>${users[data].name} ${users[data].surname}</b> left the room`);
								ROOMS_SOCKET.leave(roomID);
								delete users[data];
								socket.emit("user-logged-out");
							}
							else{
								saveFilesQuery(`UPDATE active_rooms SET room_status = 'Offline' WHERE room_id = '${roomID}'`);
								delete users[data];
								socket.emit("user-logged-out");
							}
						});
					});
				}
			}
			
			onlineUsers();
		}
	});

	socket.on("newUserMessage", (data, callback) => {
		if(users[data.msgTo] != null && users[data.msgTo] != undefined){
			socket.to(users[data.msgTo].soket).emit("communication", {
				message: data.message,
				media_file: data.media_file,
				mimetype: data.mimetype,
				msgFrom: data.msgFrom,
				profile: users[data.msgFrom].profile,
				user: `${users[data.msgFrom].name} ${users[data.msgFrom].surname}`
			});
		}
		callback(data);
	});

	socket.on("accepted", (data, user, id) => {
		socket.to(users[data].soket).emit("allowed", id);
		saveFilesQuery(`UPDATE notifications SET notifications.notification_status = 'Viewed' WHERE notifications.from = '${data}' AND notifications.to = '${user}' AND notifications.notificationType = 'request' AND notifications.room_id = '${id}'`);
	});

	socket.on("rejected", (data, user, id) => {
		socket.to(users[data].soket).emit("denied", "Oops, it looks like your request was not accepted!");
		saveFilesQuery(`UPDATE notifications SET notifications.notification_status = 'Viewed' WHERE notifications.from = '${data}' AND notifications.to = '${user}' AND notifications.notificationType = 'request' AND notifications.room_id = '${id}'`);
	});

	socket.on("disconnect", data =>{
		if(connections[socket.id] != undefined)
		{
			// if(users[connections[socket.id]] != undefined){
			// 	if(users[connections[socket.id]].room != undefined){
			// 		saveFilesQuery(`DELETE FROM active_rooms WHERE user_id = '${users[connections[socket.id]].user_id}' AND room_id = '${users[connections[socket.id]].room}'`);
			// 	}
			// }
			setTimeout(() => {
				delete connections[socket.id];
			}, 5000);
		}
	});
});

io.of("/rooms", socket => {
	ROOMS_SOCKET = socket;
	socket.on("joinRoom", (data, callback) => {
		pool.getConnection((err, connection) => {
			if(err) res.status(500).send(err);
			connection.query(`SELECT * FROM active_rooms WHERE room_id = ?`, [data.roomID], (er, results) => {
				connection.release();
				if(er) res.status(500).send(er);
				if(results.length > 0)
				{
					saveFilesQuery(`INSERT INTO joined_users (user_id, room) VALUES ('${data.user}', '${data.roomID}')`);
					saveFilesQuery(`UPDATE active_rooms SET room_status = 'Online' WHERE room_id = '${data.roomID}'`);
				}
				else
				{
					saveFilesQuery(`INSERT INTO active_rooms (room_id, room_status) VALUES ('${data.roomID}', 'Online')`);
				}
				saveFilesQuery(`UPDATE notifications SET notifications.notification_status = 'Viewed' WHERE notifications.room_id = '${data.roomID}' AND notifications.to = '${data.user}'`);
				socket.join(data.roomID);
				users[data.user].room = data.roomID;
				socket.broadcast.to(data.roomID).emit("welcome", `<b>${users[data.user].name} ${users[data.user].surname}</b> joined the room`);
				callback(true);
				SOCKET.emit("reloadRooms");
			});
		});	
	});

	socket.on("sendRoomChat", (data, callback) => {
		let chatObj = {
			message: data.message,
			sentTime: data.msgDate,
			user: `${users[data.sentBy].name} ${users[data.sentBy].surname}`,
			media_file: data.media_file
		}
		callback(chatObj);
		socket.broadcast.to(data.roomRef).emit("send", chatObj);
	});

	socket.on("exitRoom", data => {
		let user = users[data.user];
		let room_id = data.roomID;

		leaveAroom(user.user_id, room_id, response => {
			if(response)
			{
				pool.getConnection((er, connection) => {
					if(er) console.log(er);
					connection.query(`SELECT * FROM joined_users WHERE room = '${room_id}'`, (err, results) => {
						connection.release();
						if(err) console.log(err);
						if(results.length > 0)
						{
							socket.broadcast.to(room_id).emit("left", `<b>${user.name} ${user.surname}</b> left the room`);
							socket.leave(room_id);
							SOCKET.emit("reloadRooms");
						}
						else
						{
							saveFilesQuery(`UPDATE active_rooms SET room_status = 'Offline' WHERE room_id = '${room_id}'`);
							SOCKET.emit("reloadRooms");
						}
					});
				});
			}
			else
			{
				console.log("User not found in the Joined List...");
			}
		});
	});
});

function leaveAroom(user, room, callback)
{
	pool.getConnection((error, connection) => {
		if(error) console.log(error);
		connection.query(`DELETE FROM joined_users WHERE room = ? AND user_id = ?`, [room, user], (err, results) => {
			connection.release();
			if(err) console.log(err);
			if(results.affectedRows > 0)
			{
				callback(true);
			}
			else
			{
				callback(false);
			}
		});
	});
}

app.get("*", (req, res) => {
	res.sendFile(__dirname + "/public/invalid.html");
});

app.post("*", (req, res) => {
	res.sendFile(__dirname + "/public/serverError.html");
});