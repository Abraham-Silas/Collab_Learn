import 
{ 
	winHeight, 
	newPrivateNote, 
	timeSince, 
	getDateTime, 
	newEvent, 
	postType, 
	loadPosts, 
	loadSubNotes, 
	checkForNewChats, 
	getNowDate, 
	getNowTime, 
	loadRoomChats, 
	loadRooms, 
	loadNotes, 
	toggle, 
	notifications,
	accessToken,
	selectRoom,
	sendRequest,
	calendarToggle,
	loadActiveRoomChats,
	message_view,
	received_message_view,
	sent_message_view,
	userSubjects,
	loadUserNotes,
	editNote,
	searchYourNostes,
	createNewNote,
	checkNote,
	saveUserNote,
	autoSaveNote
} from "./posts.js";

import 
{ 
	OnlineUsers 
} from "./onlineUsers.js"

import 
{ 
	ChatMessages, 
	smileys 
} from "./chatMessages.js"

import 
{ 
	menuToggler,
	subjectMenuToggle
} from "./explorerMenu.js"

import 
{ 
	userDocuments, 
	userMedia, 
	loadBooks, 
	loadPapers, 
	searchDocs,
	enterTheDocumentsStudyMode,
	enterTheVideoStudyMode,
	loadSubjectBooks,
	loadSubjectPapers,
	loadSubjectVideos,
	loadSubjectProjects,
	loadDashBoard,
	loadDocNotes,
	loadMediaNotes
} from "./mediaNDocsContent.js"

import 
{ 
	setSubjectListHeight, 
	chooseSubjects, 
	removeSubjects, 
	save, 
	loadSubjects, 
	saveSubjects 
} from "./subjects.js";

const socket = io.connect("http://localhost:3000/");
const room = io.connect("http://localhost:3000/rooms");
let session = new OnlineUsers(sessionStorage.getItem("userID"));
let messages = new ChatMessages(session);
let frmType = "none";
var left = document.getElementById('aleft');
var right = document.getElementById('aright');
var sc = document.getElementById('scroll');
var subjects = [];
let userID = null;
let MINIMIZED = false;
let JOINED_ROOM = false;
let NEW_MESSAGES_COUNT = 0;
let r;
let ROOM_MINIMUM = 1;
let CURRENT_ROOM_ID = null;
let UPLOAD_PERCENTAGE = 0;
let USER_LOG_STATUS = null;
let USER_CONTENT_MINIMIZED = false;
let videoObj = null;
let CURRENTLY_PLAYING = null;
let newMsg = new Audio('alerts/pristine.ogg');
let joined = new Audio('alerts/join.ogg');
let exit = new Audio('alerts/exit.ogg');
let roomObj = {
	room_id: null,
	admin: null
}
let SHORT_MESSAGE_VIEW_ARRAY = [];
let fileObject = null;
let NEW_PROJECT_ID = null;
let USER_LEVEL = null;
let fileID = null;
let noteID = null;
let delayTime = 1000;
let hideControl = null;

$(() => {
	if(session.getSession != null && session.getSession != undefined)
	{
		socket.emit("loadUserData", session.getSession, (data, user) => {
			if(!data){
				//User did not successfully login
				sessionStorage.removeItem("userID");
				window.location.href = "../";
			}
			else{
				$("#userID").text(user.name);
				USER_LEVEL = user.level;
				if(user.profile != null)
					$(".userProfile").attr("src", `${session.getSession}/profile/${user.profile}`);
				$(window).resize(() => { setSubjectListHeight(); });
				if(true) $(".main").css("height", winHeight() + "px");
				loadPosts(session.getSession);
				loadSubNotes(session.getSession);
				$(".roomsMainContent").css("height", (parseInt(winHeight())+5) + "px");
			}
		});
	}
	
	$("#formLogin").submit(e => {
		e.preventDefault();
		$(e.target).ajaxSubmit({
			error: e => {
				switch(e.status)
				{
					case 401:
						alert(e.status + ": Invalid User Login");
						break;
					case 500:
						console.log("Something went wrong with the server...");
						break;
				}
			},
			success: response => {
				sessionStorage.setItem("userID", response.userId);
				sessionStorage.setItem("username", response.username);
				window.location.href = "./public";
			}
		});
	});

	$('[data-toggle="tooltip"]').hover(e => {
		$(this).tooltip();
	});

	// $('[data-toggle="popover"]').popover();

	// function linkify(str) {
	// 	var newStr = str.replace(/((http(s)?(\:\/\/))?(www\.)?([\w\-\.\/])*(\.[a-zA-Z]{2,3}\/?))(?!(.*a>)|(\'|\"))/g, '<a href="$1">$1</a>');
	// 	$('.text').html(''); // clear output area
	// 	$('.text').append(newStr); //fill output area
	// }
	
	// var data = $('.text').html(); //get input (content)
	// linkify(data); //run function on content

	$("#profileView").on("click", e => {
		$(".profileMenu").fadeIn(400);
	});

	$(".profileMenu").on("mouseleave", e => {
		$(".profileMenu").fadeOut(400);
	});

	$(".userLogout").on("click", () => {
		socket.emit("logout", session.getSession);
	});

	socket.on("user-logged-out", () => {
		sessionStorage.removeItem("userID");
		window.location.href = "../";
	});

	$(".createAcc").on("click", () => {
		$("#createAccount").fadeIn(500);
	});

	$(".Acc-Close").on("click", () => {
		$("#createAccount").fadeOut(500);
	});

	$('.tab span').on('click',function(){
		var elem = document.querySelectorAll(".tab span");
		var selected = $(this).closest('.col');

		for(var i = 0; i < elem.length; i++)
		{
			$("#"+elem[i].getAttribute("rel")).css({
				"display" : "none"
			});
		}

		for(var j = 0; j < elem.length; j++)
		{
			elem[j].style.backgroundColor = "white";
			elem[j].style.color = "black";
		}

		$("#"+selected.attr('rel')).css({
			"display" : "block"
		});

		selected.css({
			"background-color" : "blue", 
			"color" : "white"
		});
	});

	socket.on("onlineUsers", data => {
		session.setData = data;
		$(".online-chats-container").html(session.displayActiveUsers);
	});

	$(document).on("click", ".online-chats-container .online-chat", _e => {
		userID = event.target.id;
		$(".chat-username").text($(event.target.querySelector("div span")).text());
		$(".chat-controls i").attr("id", userID);
		session.setIsActive = true;
		session.setActiveUser = userID;
		var imgPath = event.target.querySelector("img");
		openPrivateChatWindow(session.getSession, userID, imgPath);
	});

	let openPrivateChatWindow = (sess, user, imgPath) => {
		$.ajax({
			url: "/loadChatMessages",
			method: "POST",
			data: {me: sess, chat: user},
			beforeSend: () => {
				$(".chat-body").empty();
				$("#from").val(sess);
				$("#to").val(user);
				$(".privateResponseWin").fadeIn();
				$(".chat-header img").attr("src", $(imgPath).attr("src"));
			},
			success: response => {
				$.each(response, (index, value) => {
					if(value.msgTo == session.getSession){
						messages.receivingMessage(value.message, value.media_file, value.mimetype);
					}
					else{
						messages.sendingMessage(value.message, value.media_file, value.mimetype);
					}
				});
				$(".chat-body").scrollTop($(".chat-body")[0].scrollHeight);
			},
			error: (xhr, errMsg) => {
				console.log(xhr.status, errMsg);
			}
		});
	}

	$(".closePrivateWin").on("click", _e => {
		$(".privateResponseWin").fadeOut();
		session.setIsActive = false;
		session.setActiveUser = null;
		userID = null;
	});

	$("i.attach").on("click", e => {
		$("#attachFile").click();
	});

	$("#privateChatMsg").submit(e => {
		e.preventDefault();
		$(event.target).ajaxSubmit({
			success: response => {
				socket.emit("newUserMessage", response, data => {
					messages.sendNewMessage(data);
					$(".chat-body").scrollTop($(".chat-body")[0].scrollHeight);
					$(".pvMediaPrev img, .pvMediaPrev video, .pvMediaPrev").css("display", "none");
					$(".pvMediaPrev img, .pvMediaPrev video").removeAttr("src");
				});
			},
			error: (xhttp, response) => {
				console.log(xhttp.status, response);
			}
		});
	});

	$("#attachFile").bind("change", e => {
		let xhttp = new XMLHttpRequest();
		let file = URL.createObjectURL(event.target.files[0]);
		let mime = event.target.files[0].type;
		xhttp.onprogress = function(e){
			let percentage = parseInt(Math.floor(e.loaded)/Math.floor(e.total)) * 100;
			if(percentage == 100)
			{
				var extensions = ["image/jpg", "image/jpeg", "image/png", "image/gif"];

				if(extensions.indexOf(mime) != -1)
				{
					$(".pvMediaPrev img").css("display", "block");
					$(".pvMediaPrev img").attr("src", file);	
					$(".pvMediaPrev video").css("display", "none");	
				}
				else
				{
					$(".pvMediaPrev video").css("display", "block");	
					$(".pvMediaPrev video").attr("src", file);
					$(".pvMediaPrev img").css("display", "none");
				}
				$(".pvMediaPrev").fadeIn();
			}
		}

		xhttp.open("GET", file, true);
		xhttp.send();
	});

	$("#saveNote").on("click", () => {
		let nt = $(".noteSection textarea").val();
		if(nt.length != 0)
		{
			$.ajax({
				url: "/UserNotes",
				method: "POST",
				data: {note: nt, userId: session.getSession},
				success: function(data, textStatus, xhr){
					if(xhr.status == 200)
					{
						$("#savedUserNotes").prepend(newPrivateNote($(".noteSection textarea").val(), timeSince(new Date(`${getDateTime()}`))));
						//Clear the textarea after saving the note!!!
						$(".noteSection textarea").val("")
						$(".postWindow").fadeOut();
					}
				},
				error: function(xhr, textStatus){
					console.log(`${xhr.status}: ${textStatus}`);
				}
			});
		}
		else{
			alert("Notes cannot be empty!");
		}
	});

	$(".newEvent").on("click", () => {
		userSubjects(session.getSession);
		$(".calendar-section").fadeIn();
	});

	$(".close-event-window").on("click", () => {
		$(".calendar-section").fadeOut();
	});

	$(".save-event").on("click", () => {
		let event = $(".description textarea").val();
		let dt = $(".event-date").val();
		let tm = $(".event-time").val();

		if(dt.length != 0 && tm.length != 0 && event.length != 0)
		{
			$(".events-container").prepend(newEvent(event, dt, tm));
			$(".calendar-section").fadeOut();
		}
		else
		{
			if(dt.length == 0)
				$(".event-date").css("border-color", "red");

			if(tm.length == 0)
				$(".event-time").css("border-color", "red");

			if(event.length == 0)
				$(".description textarea").css("border-color", "red");
		}
	});

	$(".explore h4").on("click", _e => {
		menuToggler(event.target);
	});

	$(".newSubHeader h1 i").on("click", () => {
		$(".addNewSubjects").fadeOut();
	});

	$(".newSubject").on("click", e => {
		loadSubjects(session.getSession);
		setSubjectListHeight();
	});

	$(".newRequest").on("click", () => {
		$(".newSubInfo").fadeIn();
	});

	$(".header i").on("click", () => {
		$(".newSubInfo").fadeOut();
	});

	$(document).on("click", ".savedSubjects button", () => {
		removeSubjects(event.target);
		subjects.splice(subjects.indexOf(event.target.id), 1);
	});

	$(document).on("click", ".list button", () => {
		chooseSubjects(event.target);
		subjects.push(event.target.id);
	});

	$(".saveSubjects").on("click", () => {
		save();
		saveSubjects(session.getSession, subjects);
	});

	$(".extraHeader h2 i").on("click", () => {
		$(".addExtras").fadeOut();
	});

	$(".newExtra").on("click", () => {
		$(".fileInfo").fadeOut();
		$(".uploadFile").fadeOut();
		$(".progress").fadeOut();
		$(".addExtras").fadeIn();
	});

	$('.fileInputs input[type="file"]').bind("change", (e)=>{
		if(event.target.value.length != 0)
		{
			var percentage = 0;
			var progress = 0;
			$(".progress-bar").css("width", progress);
			$(".progress").fadeIn();
			var file = URL.createObjectURL(e.target.files[0]);
			var xhttp = new XMLHttpRequest();
			$(".uploadFile label").attr("for", e.target.getAttribute("rel"));
			frmType = $(event.target).attr("name");
			xhttp.onprogress = function(e){
				percentage = (parseInt(e.loaded)/parseInt(e.total)) * 100;
				progress = `${parseInt(percentage)}%`;
				$(".progress-bar").css("width", progress);
				if(percentage == 100)
				{
					$(".fileInfo").fadeIn();
					$(".uploadFile").fadeIn();
					$(".progress").fadeOut();
				}
			}

			xhttp.open("GET", file, true);
			xhttp.send();
		}
	});

	$('.fileInputs form').submit(e => {
		e.preventDefault();
		if($(".fileInfo input").val() != "")
		{
			$(e.target).ajaxSubmit({
				error: function(xhr) {
					console.log('Error: ' + xhr.status);
				},
				success: function(response) {
					$(".addExtras").fadeOut();
				}
			});
		}
		else
		{
			$(".fileInfo input").css("border-color", "red");
		}
	});

	$(".extraType label").on("click", e => {
		$(".userID").attr("value", session.getSession);
		adjustments(event.target);	
	});

	$(".preview input").keyup(e => {
		$(`#${frmType}`).val($(e.target).val());
	});

	function adjustments(event)
	{
		let controls = document.querySelectorAll(".extraType label");
		for(let i = 0; i < controls.length; i++)
		{
			$(controls[i]).css({
				"background-color" : "whitesmoke",
				"color" : "black"
			});
		}
		
		$(".fileInfo, .uploadFile").fadeOut();
		$(".preview input").val("");

		$(event).css({
			"background-color" : "black",
			"color" : "white"
		});
	}

	// right.addEventListener("click", () => {
	// 	sc = document.getElementById('scroll');
	// 	sc.scrollBy(40, 0);
	// })

	// left.addEventListener("click", () => {
	// 	sc.scrollBy(-40, 0);
	// });

	// right.onmousedown = () => {
	// 	scrollRight();
	// }

	// right.onmouseleave = () => {
	// 	clearInterval(timer);
	// 	timer = null;
	// }

	let timer = 0;

	var scrollRight = ()=>{
		timer = setTimeout(()=>{
			sc.scrollBy(80, 0);
		}, 10);
	}

	var scrollLeft = () => {
		timer = setTimeout(()=>{
			sc.scrollBy(-80, 0);
		}, 10);
	}

	// left.onmousedown = () => {
	// 	scrollLeft();
	// }

	// left.onmouseleave = () => {
	// 	clearTimeout(timer);
	// 	timer = null;
	// }

	$(document).on("click", ".scroll button", e => {
		var topic = $(e.target).text();
		$("#topic").text(topic);
		$("#subject").val(e.target.id);
		$(".postAddOns #subject").attr("value", topic);
	});

	$(".pH7 i").on("click", () => {
		$(".postWindow").fadeOut();
		$(".newPostPoP form").attr("action", "/newTextPost");
	});

	$("#postImage").change(e => {
		if(event.target.value.length != 0){
			$(".newPostPoP form").attr("action", "/newImagePost");
		}else{
			$(".newPostPoP form").attr("action", "/newTextPost");
		}
	});

	$(".newPostPoP form").submit(e => {
		e.preventDefault();
		$(e.target).ajaxSubmit({
			error: (err) => {
				console.log(err);
			},
			success: (response) => {
				location.reload(true);
				$(".postWindow").fadeOut();
				$(".newPostPoP form").attr("action", "/newTextPost");
			}
		});
	});

	$(".mediaTab").on("click", e => {
		if(USER_CONTENT_MINIMIZED == false)
		{
			$(event.target.querySelector("i")).css("transform", "rotate(0deg)");
			userMedia(session.getSession);
		}
		else
		{
			$(".userContent").fadeIn();
		}
	});

	$(".docsTab").on("click", e => {
		$(event.target.querySelector("i")).css("transform", "rotate(0deg)");
		userDocuments(session.getSession);
	});

	$(".docsNav i").on("click", () => {
		$(".documentsWindow").fadeOut();
	});

	$(document).on("click", ".fileContent i", e => {
		if(CURRENTLY_PLAYING != null)
			CURRENTLY_PLAYING.pause();
		
		var audioObj = event.target;
		CURRENTLY_PLAYING = $(`.fileContent .${audioObj.getAttribute("rel")} audio`).get(0);
		
		switch(audioObj.getAttribute("class"))
		{
			case "far fa-play-circle":				
				CURRENTLY_PLAYING.play();

				$(`.fileContent .${audioObj.getAttribute("rel")} audio`).on("play", () => {
					audioObj.setAttribute("class", "far fa-pause-circle");
					$(`.fileContent .${audioObj.getAttribute("rel")}`).css({
						"background-image" : "url(../media/playing.gif)",
						"background-position" : "center",
						"background-size" : "100%",
						"background-repeat" : "no-repeat"
					});
				});

				$(`.fileContent .${audioObj.getAttribute("rel")} audio`).on("canplay", () => {
					audioObj.setAttribute("class", "far fa-pause-circle");
					$(`.fileContent .${audioObj.getAttribute("rel")}`).css({
						"background-image" : "url(../media/playing.gif)",
						"background-position" : "center",
						"background-size" : "100%",
						"background-repeat" : "no-repeat"
					});
				});

				$(`.fileContent .${audioObj.getAttribute("rel")} audio`).on("pause", () => {
					audioObj.setAttribute("class", "far fa-play-circle");
					$(`.fileContent .${audioObj.getAttribute("rel")}`).css({
						"background-image" : "url(../media/musicArt.jpg)",
						"background-position" : "center",
						"background-size" : "100%",
						"background-repeat" : "no-repeat"
					});
				});				
				
				$(`.fileContent .${audioObj.getAttribute("rel")} audio`).on("ended", () => {
					audioObj.setAttribute("class", "far fa-play-circle");
					$(`.fileContent .${audioObj.getAttribute("rel")}`).css({
						"background-image" : "url(../media/musicArt.jpg)",
						"background-position" : "center",
						"background-size" : "100%",
						"background-repeat" : "no-repeat"
					});
				});
				break;
			case "far fa-pause-circle":
				audioObj.setAttribute("class", "far fa-play-circle");
				$(`.fileContent .${audioObj.getAttribute("rel")}`).css({
					"background-image" : "url(../media/musicArt.jpg)",
					"background-position" : "center",
					"background-size" : "100%",
					"background-repeat" : "no-repeat"
				});
				CURRENTLY_PLAYING.pause();
				CURRENTLY_PLAYING = null;
				break;
		}
	});

	let video_i = null;
	$(document).on("click", ".videosCollection i", e => {
		let prev = videoObj;
		videoObj = event.target;
		video_i = document.getElementById('vid_'+e.target.getAttribute("rel"));

		if(CURRENTLY_PLAYING != null && prev != videoObj)
		{
			CURRENTLY_PLAYING.pause();
			prev.setAttribute("class", "far fa-play-circle");
			$(`.videosCollection span.${prev.getAttribute("rel")} span`).css("display", "none");
		}		

		CURRENTLY_PLAYING = $(`.videosCollection span.${videoObj.getAttribute("rel")} video`).get(0);

		switch(videoObj.getAttribute("class"))
		{
			case "far fa-play-circle":			
				video_i.play();
				video_i.addEventListener("play", () => {
					videoObj.setAttribute("class", "far fa-pause-circle");
					$(`.videosCollection span.${videoObj.getAttribute("rel")} i`).fadeIn();
				});

				video_i.addEventListener("ended", () => {
					videoObj.setAttribute("class", "far fa-play-circle");
					$(`.videosCollection span.${videoObj.getAttribute("rel")} span`).css("display", "none");
					$(`.videosCollection span.${videoObj.getAttribute("rel")} i`).fadeOut();
				});

				video_i.addEventListener("waiting", () => {
					$(`.videosCollection span.${videoObj.getAttribute("rel")} i`).fadeIn();
					videoObj.setAttribute("class", "far fa-play-circle");
					$(`.videosCollection span.${videoObj.getAttribute("rel")} span`).css("display", "none");
				});

				video_i.addEventListener("playing", () => {
					$(`.videosCollection span.${videoObj.getAttribute("rel")} i`).fadeOut();
					videoObj.setAttribute("class", "far fa-pause-circle");
					$(`.videosCollection span.${videoObj.getAttribute("rel")} span`).css("display", "block");
				});
				break;
			case "far fa-pause-circle":
				videoCollectionPause(videoObj);
				break;
		}
	});

	$(document).on("click", ".vFullScreen", e => {
		let video = document.getElementById(video_i.getAttribute("id"));
		if(!document.fullscreenElement)
		{
			video.requestFullscreen().catch(err => {
				console.log(`Error attempting to enable full-screen mode: ${err.message} (${err.name})`);
			});
		}else {
			document.exitFullscreen();
		  }
	});

	$(document).on("click", ".vStudy", e => {
		fileID = videoObj.getAttribute("rel");
		let description = videoObj.parentElement.querySelector("i:nth-child(2)").innerHTML;
		checkNote(session.getSession, "media", fileID, response => {
			if(response.exist > 0)
			{
				loadMediaNotes(response.exist)
				noteID = response.exist;
				enterTheVideoStudyMode(video_i.src, video_i.currentTime, description, fileID);
			}
			else
			{
				createNewNote(session.getSession, description, response => {
					noteID = response["MAX(notes_id)"];
					enterTheVideoStudyMode(video_i.src, video_i.currentTime, description, fileID);
				}, fileID, "media");
			}
		});
		videoCollectionPause(videoObj);
		video_i.pause();
	});

	$(".vWinClose").on("click", () => {
		if(videoObj != null)
		{
			let vidID = $(`.videosCollection span.${videoObj.getAttribute("rel")} video`)[0].id;
			let video = document.getElementById(vidID);
			video.currentTime = document.getElementsByClassName('videoView')[0].querySelector("video").currentTime;
			fileID = null;
		}
		document.getElementsByClassName('videoView')[0].querySelector("video").pause();
		document.getElementsByClassName('videoView')[0].innerHTML = "";
		document.getElementsByClassName('vTitle')[0].innerHTML = "";
		$('.userTextNotes').html("");
		$(".vStudyModeWin").fadeOut();
	});

	$(".closeMsgWin").on("click", () => {
		messages.clearMsgView();
		messages.closeMessageWindow();
		userID = null;
	});

	$(".minMsgWin").on("click", () => {
		messages.closeMessageWindow();
	});

	$(".messagesContainer").on("click", () => {
		if(userID == null)
		{
			messages.clearMsgView();
			messages.chats();
			messages.openMessageWindow();
		}
		else
		{
			messages.openMessageWindow();
		}
	});

	$("#privateMsgFrm").submit(e => {
		e.preventDefault();
		var textMessage = $(".userMsgtxt").val();
		console.log(textMessage);
		var file = $("#msgFiles").val();
		$(".emoticons").fadeOut();
		on = false;
		if(textMessage.length != 0 || file.length != 0)
		{
			$(event.target).ajaxSubmit({
				success: response => {
					socket.emit("newUserMessage", response, data => {
						$(".msgsContainer")
						.append(sent_message_view(data.message, data.media_file, data.mimetype));
						$(".userMsgtxt").val("");
						$("#msgFiles").val("");
						$(".msgsContainer").scrollTop($(".msgsContainer")[0].scrollHeight);
						////////////////////////////////////////////////////////////////////////////////////////
						$(".mediaPrev img, .mediaPrev video, .mediaPrev").css("display", "none");
						$(".mediaPrev img, .mediaPrev video").removeAttr("src");
					});
				},
				error: (xhttp, response) => {
					console.log(xhttp.status, response);
				}
			});
		}
		else{
			alert("Cannot sent an empty message...");
		}
	});

	$(document).on("click", ".chatsList li", e => {
		$(".userTitle").text($(event.target.querySelector("strong")).text());
		userID = $(event.target).attr("data");
		$('#msgTo').val(userID);
		$('#msgFrom').val(session.getSession);
		$(event.target.querySelector("i")).fadeOut();
		messages.loadChatMessages(userID);
		checkForNewChats(session.getSession);
	});
	
	socket.on("communication", response => {
		if(userID != null)
		{
			if(session.getIsActive)
			{
				if(response.msgFrom == userID)
				{
					newMsg.play();
					messages.newActiveMessage(response);
				}
				else
				{
					newMsg.play();
					if(document.getElementById(`chat_${response.msgFrom}`) != null)
						document.getElementById(`chat_${response.msgFrom}`).style.display = "none";

					$(".chatsList")
					.prepend(`<li class="list-group-item" id="chat_${response.msgFrom}" data="${response.msgFrom}">
								<img width="40" height="40" src="${response.msgFrom}/profile/${response.profile}">
								<strong>${response.user}</strong>
								<i class="fas fa-circle"></i>
							</li>`);
				}
			}
			else
			{
				if(response.msgFrom == userID)
				{
					newMsg.play();
					$(".msgsContainer")
					.append(received_message_view(response.message, response.media_file, response.mimetype));
				}
				else
				{
					newMsg.play();
					if(document.getElementById(`chat_${response.msgFrom}`) != null)
						document.getElementById(`chat_${response.msgFrom}`).style.display = "none";

					$(".chatsList")
					.prepend(`<li class="list-group-item" id="chat_${response.msgFrom}" data="${response.msgFrom}">
								<img width="40" height="40" src="${response.msgFrom}/profile/${response.profile}">
								<strong>${response.user}</strong>
								<i class="fas fa-circle"></i>
							</li>`);
				}
			}
		}
		else
		{
			newMsg.play();
			if(document.getElementById(`chat_${response.msgFrom}`) != null)
				document.getElementById(`chat_${response.msgFrom}`).style.display = "none";
			$(".chatsList")
			.prepend(`<li class="list-group-item" id="chat_${response.msgFrom}" data="${response.msgFrom}">
						<img width="40" height="40" src="${response.msgFrom}/profile/${response.profile}">
						<strong>${response.user}</strong>
						<i class="fas fa-circle"></i>
					</li>`);

			if(SHORT_MESSAGE_VIEW_ARRAY.length > 0 && SHORT_MESSAGE_VIEW_ARRAY.indexOf(response.msgFrom) > -1)
			{
				let node = document.createElement("p");
				let text = document.createTextNode(response.message);
				node.appendChild(text);
				document.getElementById(`user_${response.msgFrom}`).appendChild(node);
			}
			else
			{
				messages.newInActiveMessage(response);
				SHORT_MESSAGE_VIEW_ARRAY.push(response.msgFrom);
			}
		}
	});

	setTimeout(function checkNewUpdates(){
		checkForNewChats(session.getSession);
		setTimeout(checkNewUpdates, 4000);
	}, 1000);

	$(".changeProfile").on("click", e => {
		$("#profileImg").trigger("click");
	});

	$("#profileImg").bind("change", e => {
		$("#userProfileID").attr("value", session.getSession);
		$("#uploadProfile").trigger("click");
	});

	$(".profileMenu form").submit(e => {
		e.preventDefault();
		$(e.target).ajaxSubmit({
			success: function(response){
				$(".userProfile").attr("src", `${session.getSession}/profile/${response.object}`);
			},
			error: function(xhr, errText){
				console.log(xhr.status, errText);
			}
		});
	});

	$(".newContent").on("click", () => {
		$(".newContent .addNew").css("height", "245px");
	});

	$(".addNew").mouseleave(() => {
		$(".newContent .addNew").css("height", "0px");
	});

	$(".newPost").on("click", () => {
		$(".postWindow").fadeIn();
		$("#postImage").val("")
		$(".newPostPoP form").attr("action", "/newTextPost");
		$(".postAddOns #userid").attr("value", session.getSession);
	});

	$(".saveEvent").on("click", e => {
		if(document.getElementsByClassName('eventSubjectOptions')[0].value != "select")
		{
			let event = {
				_id: 'null',
				event_description: $(".eventName").val(),
				event_date: $(".eventDate").val(),
				event_time: $(".eventTime").val(),
				user_id: session.getSession,
				subject_id: document.getElementsByClassName('eventSubjectOptions')[0].value
			}

			$.ajax({
				url: "/saveEvents",
				method: "POST",
				data: event,
				success: response => {
					$(".calendar-section").fadeOut("fast");
					$(".events-container")
					.append(`<div class="event" id="${event._id}">
								<h5>${event.event_description}</h5>
								<div class="event_dateTime">
									<span class="date">${event.event_date.substring(0, 10)}</span>
									<span class="time">${event.event_time.substring(0, 5)}</span>
								</div>
							</div>`)
				},
				error: (err, msg) => {
					console.log(msg);
				}
			});
		}
	});

	$(".navBAR i").on("click", e => {
		$(".roomsWindow").fadeOut();
		NEW_MESSAGES_COUNT = 0;
		MINIMIZED = true;
	});

	$(".roomsDiscussions").on("click", e => {
		if(JOINED_ROOM == true){
			$(".roomsWindow").fadeIn();
			MINIMIZED = false;
			NEW_MESSAGES_COUNT = 0;
			$(".newRoomMsgs").css("display", "none")
		}
		else{
			$(".want2Join").fadeIn();
		}
	});

	$(".okay").on("click", () => {
		$(".want2Join").fadeOut();
	});

	$("#newRoomFrm").submit(e => {
		e.preventDefault();
		if(document.getElementById('roomName').value.length != 0 && 
		document.getElementById('roomDescription').value.length != 0 &&
		document.getElementById('roomSubject').value != undefined && 
		document.getElementById('roomType').value != undefined &&
		document.getElementById('file').value.length != 0){
			if(document.getElementById('file').value.substr(document.getElementById('file').value.lastIndexOf(".")+1).indexOf("jpg", "png", "jpeg") != -1)
			{
				$(event.target).ajaxSubmit({
					success: response => {
						if(response == "Success")
						{
							selectRoom(session.getSession);
						}
					},
					error: (xhr, errMsg) => {
						console.log(xhr.status, errMsg);
					}
				});
			}
			else
			{
				alert("Please make sure your room cover is an image");
			}
		}
		else{
			alert("Please fill in the fields correctley");
		}
	});

	$(".newRooms").on("click", () => {
		$(".newRoomWindow").fadeIn();
	});

	$(".makeAroom").on('click', () => {
		$(".newRoomWindow").fadeOut();
		$.post("/loadSubjects", {id: session.getSession}, response => {
			$("#roomSubject").empty();
			$("#roomSubject").append("<option>--Select--</option>");
			$.each(response, (index, value) => {
				$("#roomSubject").append(`<option value="${value.subject_code}">${value.subject_name}</option>`);
			});
			$("#roomDescription").val("This room was created to discuss ");
			$(".roomUserID").val(session.getSession);
			$(".newRoomBg").fadeIn();
		})
	});

	$(".newRoomBg i").on("click", () => {
		$(".newRoomBg").fadeOut();
		$(".accessSetting").fadeOut();
		$(".roomWindow").fadeIn();
	});
	
	$(document).on("click", ".previous", () => {
		$(".prevChats").css({
			"display" : "none"
		});
		loadRoomChats(CURRENT_ROOM_ID, session.getSession);
	});

	$(".navBAR button").on("click", () => {
		$(".exit").fadeIn();
	});

	$(".exitRM").on("click", () => {
		room.emit("exitRoom", {roomID: CURRENT_ROOM_ID, user: session.getSession});
		JOINED_ROOM = false;
		$(".exit").fadeOut();
		$(".roomsWindow").fadeOut();
		CURRENT_ROOM_ID = null;
	});

	$(".stayInRM").on("click", () => {
		$(".exit").fadeOut();
	});

	$("#newRoomFrm .roomFile").bind("change", e => {
		let file = URL.createObjectURL(e.target.files[0]);
		$("#newRoomFrm .progress").css("display", "block");
		let xhttp = new XMLHttpRequest();
		$(".fileStatus").fadeOut();
		xhttp.onprogress = function(e){
			UPLOAD_PERCENTAGE = (parseInt(e.loaded)/parseInt(e.total)) * 100;
			$("#newRoomFrm .progress-bar").css("width", `${UPLOAD_PERCENTAGE}%`);
			if(UPLOAD_PERCENTAGE == 100){
				$(".fileStatus").fadeIn();
				$("#newRoomFrm .progress").fadeOut("fast");
				$("#newRoomFrm .progress-bar").css("width", "0%");
				UPLOAD_PERCENTAGE = 0;
			}
		}
		xhttp.open("GET", file, true);
		xhttp.send();
	});

	$(".chatsControls").submit(e => {
		e.preventDefault();
		let msg = $(".roomsMsgTextBox").val();
		let file = $("#rfile").val();
		let roomChat = {
			_id: null,
			message: msg,
			msgDate: getDateTime(),
			roomRef: event.target.querySelector(".roomBtnSend button").getAttribute("rel"),
			sentBy: session.getSession
		}
		if(msg.length != 0 || file.length != 0)
		{
			$(event.target).ajaxSubmit({
				success: response => {
					if(response.file != null)
						roomChat.media_file = response.file;
					else
						roomChat.media_file = null;

					room.emit("sendRoomChat", roomChat, function(data){
						$(".roomChats")
						.append(`<div class="pl-2 s_chat">
										<span class="userMessage">
											${message_view(data.message, data.media_file)}
										</span>
										<span class="user">
											<b>You</b><br>
											<i>${data.sentTime.substr(data.sentTime.indexOf('T')+1, 5)}</i>
										</span>
									</div>`);
						$(".roomsMsgTextBox").val("");
						$(".roomChats").scrollTop($(".roomChats")[0].scrollHeight);
						$("#rfile").val("");
						roomChat.media_file = null;
						$(".roomMediaPreview").fadeOut();
						$(".mcemoticons").fadeOut();
						$(".roomMediaPreview img").css("display", "block");
						$(".roomMediaPreview img").removeAttr();	
						$(".roomMediaPreview video").css("display", "none");
					});
				},
				error: (xhr, errMsg) => {
					console.log(errMsg, xhr.status);
				}
			});
		}
		else{
			alert("Message cannot empty!");
		}
	});

	room.on("send", data => {
		if(MINIMIZED == true){
			NEW_MESSAGES_COUNT++;
			$(".newRoomMsgs").fadeIn("fast");
			$(".newRoomMsgs").text(NEW_MESSAGES_COUNT);
		}
		newMsg.play();
		$(".roomChats")
		.append(`<div class="r_chat">
					<span class="userMessage">
						${message_view(data.message, data.media_file)}
					</span>
					<span class="user">
						<b>${data.user}</b><br>
						<i>${data.sentTime.substr(data.sentTime.indexOf('T')+1, 5)}</i>
					</span>
				</div>`);
	});

	room.on("welcome", data => {
		joined.play();
		$(".roomChats").append(`<p class="text-center">${data}</p>`);
	});

	room.on("left", data => {
		$(".roomChats").append(`<p class="text-center">${data}</p>`);
		exit.play();
	});

	$(document).on("click", ".reply b", e => {
		userID = e.target.getAttribute("rel");
		var dataObject = document.getElementById(`rm_${userID}`).querySelector("div:nth-child(1)");
		$(".chat-username").text($(dataObject.querySelector("span")).text());
		$(".chat-controls i").attr("id", userID);
		session.setIsActive = true;
		session.setActiveUser = userID;
		var imgPath = dataObject.querySelector("img");
		openPrivateChatWindow(session.getSession, userID, imgPath);
		$(document.getElementById(`rm_${userID}`)).css("display", "none");
		SHORT_MESSAGE_VIEW_ARRAY.splice(SHORT_MESSAGE_VIEW_ARRAY.indexOf(userID), 1);
	});

	$(document).on("click", ".markRead b", e => {
		$.post("/markRead", {user: session.getSession, id: event.target.getAttribute("rel")}, response => {
			console.log("MARK AS READ => ", response);
		});
		$(document.getElementById(`rm_${event.target.getAttribute("rel")}`)).fadeOut();
	});

	$(".roomsHeader span").on("click", e => {
		let obj = event.target.getAttribute("rel");
		switch(obj){
			case "activeRooms":
				loadRooms(session.getSession);
				$("#activeRooms").css({
					"height" : "75%"
				});
				toggle("userNotesWin", "obj");
				break;
			case "userNotesWin":
				loadNotes(session.getSession);
				$("#activeRooms").css({
					"height" : "30%"
				});
				toggle("obj", "userNotesWin");
				break;	
		}
	});

	$(".newNotification").on("click", () => {
		let notStatus = null;

		$.ajax({
			url: "/getNotifications",
			method: "POST",
			data: {me: session.getSession},
			beforeSend: () => {
				$(".notifContent").empty();
			},
			success: response => {
				console.log("RESPONSE", response)
				if(response.length > 0)
				{
					$.each(response, (index, value) => {
						switch(value.notificationType)
						{
							case "reaction":
								switch(value.reaction_type)
								{
									case "Inspirational":
										notifications(value.from, value.profile, `${value.name} ${value.surname}`, `none`, `finds your post ${value.reaction_type}`, value.from, value._id);
										break;
									case "Funny":
										notifications(value.from, value.profile, `${value.name} ${value.surname}`, `none`, `finds your post ${value.reaction_type}`, value.from, value._id);
										break;
									case "Thank_You":
										notifications(value.from, value.profile, `${value.name} ${value.surname}`, `none`, `is greatful for your post`, value.from, value._id);
										break;	
								}
								break;	
							case "request":
								notifications(value.from, value.profile, `${value.name} ${value.surname}`, `block`, `is requesting to join your session`, value.room_id, value.notificationType);
								break;
							case "invitation":
								notifications(value.from, value.profile, `${value.name} ${value.surname}`, `block`, `invited you to join the session`, value.room_id, value.notificationType);
								break;
							case "approval":
								notifications(value.from, value.profile, `${value.name} ${value.surname}`, `none`, `has approved your request to join the session.`, value.room_id, value.notificationType, "block");
								break;
						}
					});
				}
				else{
					$(".notifContent").html(`<h1 class="text-center">No New Notifications</h1>`);
				}
				$(".notificationsWin").fadeIn();
			},
			error: (xhttp, errMsg) => {
				console.log(xhttp.status, errMsg);
			}
		});
	});

	$(".notificationsWin h3 i").on("click", () => {
		$(".notificationsWin").fadeOut();
	});

	$(document).on("click", ".controls i", e => {
		let post = {
			_id: null,
			post_id: event.target.getAttribute("rel"),
			reaction_type: event.target.getAttribute("data"),
			user: session.getSession,
			reaction_date: getDateTime()
		}

		$.ajax({
			url: "/reactToPost",
			method: "POST",
			data: post,
			success: response => {
				console.log(response);
			},
			error: (xhttp, errMsg) => {
				console.log(xhttp.status, errMsg);
			}
		});
	});

	$(".eventsSection").on("click", e => {
		calendarToggle(event.target);
	});

	$("#roomType").on("change", e => {
		if(event.target.value == "Private"){
			$(".roomWindow").fadeOut();
			$(".accessSetting").fadeIn();
			$(".accessTok").val(accessToken());
		}
		else
		{
			$("#token").val("");
		}
	});

	$(".accessSetting button").on("click", () => {
		$(".roomWindow").fadeIn();
		$(".accessSetting").fadeOut();
		$("#token").val($(".accessTok").val());
	});

	$(document).on("click", ".responseCtrls button", e => {
		switch(e.target.getAttribute("status"))
		{
			case "invitation":
				$(".notificationsWin").fadeOut();
				CURRENT_ROOM_ID = e.target.getAttribute("room");
				if(event.target.getAttribute("data") == "yes")
					joinAroom(CURRENT_ROOM_ID, session.getSession);
				break;
			default:
				if(e.target.getAttribute("data") == "yes")
				{
					let obj = {
						_id: null,
						to: e.target.getAttribute("rel"),
						from: session.getSession,
						sentDate: getNowDate(new Date()),
						sentTime: getNowTime(),
						notificationType: 'approval',
						room_id: e.target.getAttribute("room")
					};
			
					sendRequest(obj, data => {
						if(data == "done")
						{
							$(document.getElementById(`_${e.target.getAttribute("status")}`)).fadeOut();
						}
					});
				}
				else
				{
					socket.emit("rejected", e.target.getAttribute("rel"), session.getSession, e.target.getAttribute("room"));
				}
		}
	});

	socket.on("denied", data => {
		$(".join").fadeOut();
	});

	socket.on("allowed", data => {
		$(".join").fadeOut();
		joinAroom(CURRENT_ROOM_ID, session.getSession);
	});

	$(".selectAroom").on("click", () => {
		selectRoom(session.getSession);
	});

	$(".myRoomsList h1 i").on("click", () => {
		selectRoom(session.getSession);
	});

	$(document).on("click", ".rmlist button", e => {
		$(".usersList").empty();
		CURRENT_ROOM_ID = e.target.getAttribute("rel");
		loadOnlineUsers(CURRENT_ROOM_ID);
	});

	$(document).on("click", ".userItem button", e => {
		let user = e.target.getAttribute("id");
		let room = e.target.getAttribute("rel");
		let object = event.target;
		$(object).css({
			"background-color" : "transparent",
			"border" : "none !important",
			"outline" : "none !important",
			"box-shadow" : "none !important"
		});

		$(object)
		.html(`<div class="spinner-border text-secondary" role="status">
				<span class="sr-only">Loading...</span>
			</div>`);

		let obj = {
			_id: null,
			to: user,
			from: session.getSession,
			sentDate: getNowDate(new Date()),
			sentTime: getNowTime(),
			notificationType: 'invitation',
			room_id: room
		}

		sendRequest(obj, data => {
			if(data == "done")
			{
				$(object).attr("class", "btn btn-link");
				$(object).text("Sent");
				$(object.querySelector("i")).remove();
				ROOM_MINIMUM--;
				if(ROOM_MINIMUM == 0)
					$(".invContent h2 i").fadeIn();
			}
		});
	});

	$(".invContent h2 i").on("click", () => {
		$(".invitationWindow").fadeOut();
		joinAroom(CURRENT_ROOM_ID, session.getSession);
	});

	$(".invContent h2 span").on("click", e => {
		$(".invitationWindow").fadeOut();
		$(event.target).fadeOut();
	});

	$(".mediaPrev i").on("click", e => {
		$(".mediaPrev").fadeOut();
		$(".mediaPrev video").css("display", "block");	
		$(".mediaPrev video").removeAttr();
		$(".mediaPrev img").css("display", "none");
	});

	$(".roomMediaPreview i").on("click", () => {
		$(".roomMediaPreview").fadeOut();
		$(".roomMediaPreview img").css("display", "block");
		$(".roomMediaPreview img").removeAttr();	
		$(".roomMediaPreview video").css("display", "none");
	});

	$("#msgFiles").bind("change", e => {
		let xhttp = new XMLHttpRequest();
		let file = URL.createObjectURL(event.target.files[0]);
		let mime = event.target.files[0].type;
		xhttp.onprogress = function(e){
			let percentage = parseInt(Math.floor(e.loaded)/Math.floor(e.total)) * 100;
			console.log(percentage);
			if(percentage == 100)
			{
				var extensions = ["image/jpg", "image/jpeg", "image/png", "image/gif"];

				if(extensions.indexOf(mime) != -1)
				{
					$(".mediaPrev img").css("display", "block");
					$(".mediaPrev img").attr("src", file);	
					$(".mediaPrev video").css("display", "none");	
				}
				else
				{
					$(".mediaPrev video").css("display", "block");	
					$(".mediaPrev video").attr("src", file);
					$(".mediaPrev img").css("display", "none");
				}
				$(".mediaPrev").fadeIn();
			}
		}

		xhttp.open("GET", file, true);
		xhttp.send();
	});

	$(document).on("click", ".chatMediaCon span", e => {
		switch(event.target.getAttribute("class"))
		{
			case "far fa-play-circle":
				e.target.parentElement.querySelector("video").play();

				event.target.parentElement.querySelector("video").addEventListener("play", e => {
					e.target.parentElement.querySelector("span").setAttribute("class", "spinner-border text-danger");
				});

				event.target.parentElement.querySelector("video").addEventListener("waiting", e => {
					$(e.target.parentElement.querySelector("span")).fadeIn();
					e.target.parentElement.querySelector("span").setAttribute("class", "spinner-border text-danger");
				});

				event.target.parentElement.querySelector("video").addEventListener("playing", e => {
					e.target.parentElement.querySelector("span").setAttribute("class", "far fa-pause-circle");
				});

				event.target.parentElement.querySelector("video").addEventListener("ended", e => {
					$(e.target.parentElement.querySelector("span")).fadeIn();
					e.target.parentElement.querySelector("span").setAttribute("class", "far fa-play-circle");
				});
				break;
			case "far fa-pause-circle":
				e.target.parentElement.querySelector("video").pause();
				e.target.setAttribute("class", "far fa-play-circle");
				break;
		}
	});

	$(document).on("click", ".roomsVideoFile i", e => {
		switch(event.target.getAttribute("class"))
		{
			case "far fa-play-circle":
				e.target.parentElement.querySelector("video").play();

				event.target.parentElement.querySelector("video").addEventListener("waiting", e => {
					$(e.target.parentElement.querySelector("i")).fadeIn();
					e.target.parentElement.querySelector("i").setAttribute("class", "spinner-border text-danger");
				});

				event.target.parentElement.querySelector("video").addEventListener("playing", e => {
					e.target.parentElement.querySelector("i").setAttribute("class", "far fa-pause-circle");
					// $(e.target.parentElement.querySelector("i")).fadeOut();
				});

				event.target.parentElement.querySelector("video").addEventListener("ended", e => {
					$(e.target.parentElement.querySelector("i")).fadeIn();
					e.target.parentElement.querySelector("i").setAttribute("class", "far fa-play-circle");
					
				});
				break;
			case "far fa-pause-circle":
				e.target.parentElement.querySelector("video").pause();
				e.target.setAttribute("class", "far fa-play-circle");
				break;
		}
	});

	$("#rfile").bind("change", e => {
		let xhttp = new XMLHttpRequest();
		let file = URL.createObjectURL(event.target.files[0]);
		let mime = event.target.files[0].type;
		xhttp.onprogress = function(e){
			let percentage = parseInt(Math.floor(e.loaded)/Math.floor(e.total)) * 100;
			if(percentage == 100)
			{
				var extensions = ["image/jpg", "image/jpeg", "image/png", "image/gif"];

				if(extensions.indexOf(mime) != -1)
				{
					$(".roomMediaPreview img").css("display", "block");
					$(".roomMediaPreview img").attr("src", file);	
					$(".roomMediaPreview video").css("display", "none");	
				}
				else
				{
					$(".roomMediaPreview video").css("display", "block");	
					$(".roomMediaPreview video").attr("src", file);
					$(".roomMediaPreview img").css("display", "none");
				}
				$(".roomMediaPreview").fadeIn();
			}
		}

		xhttp.open("GET", file, true);
		xhttp.send();
	});

	$(document).on("click", ".startConversation, .startConv", () => {
		$.post("/loadContacts", {id: session.getSession}, response => {
			$(".contactsList").empty();
			$.each(response, (index, value) => {
				$(".contactsList")
				.append(`<li class="list-group-item" id="${value.user_id}">
							<img src="${value.user_id}/profile/${value.profile}"/>
							<span>
								<b>${value.name} ${value.surname}</b>
								<b><i class="fas fa-graduation-cap mr-1"></i>${value.schoolName}</b>
							</span>
							<button class="btn btn-danger btn-sm" type="button" rel="${value.user_id}"><i class="fas fa-envelope mr-1"></i>Message</button>
						</li>`);
			});
			$(".messagesContent").fadeOut();
			$(".contactsWin").fadeIn();
		});
	});

	$(document).on("click", ".contactsList li button", e => {
		$(".userTitle").text($(event.target.parentElement.querySelector("span b:nth-child(1)")).text());
		userID = $(event.target).attr("rel");
		$('#msgTo').val(userID);
		$('#msgFrom').val(session.getSession);
		messages.loadChatMessages(userID);
		checkForNewChats(session.getSession);
		$(".messagesContent").fadeIn();
		$(".contactsWin").fadeOut();

		if(document.getElementById(`chat_${userID}`) != null)
			document.getElementById(`chat_${userID}`).style.display = "none";

		if(document.getElementsByClassName('userChatHistory')[0] != null)
			document.getElementsByClassName('userChatHistory')[0].style.display = "none";

		$(".chatsList")
		.prepend(`<li class="list-group-item" id="chat_${userID}" data="${userID}">
					<img width="40" height="40" src="${$(event.target.parentElement.querySelector("img")).attr("src")}">
					<strong>${$(event.target.parentElement.querySelector("span b:nth-child(1)")).text()}</strong>
					<i class="fas fa-circle" style="display: none;"></i>
				</li>`);
	});

	$(".minimizeUserContent").on("click", () => {
		$(".userContent").fadeOut();
		USER_CONTENT_MINIMIZED = true;
	});

	$(".closeUserContent").on("click", () => {
		$(".userContent").fadeOut();
		USER_CONTENT_MINIMIZED = false;
		if(CURRENTLY_PLAYING != null)
		{
			CURRENTLY_PLAYING.pause();
			CURRENTLY_PLAYING = null;
		}
	});

	$(".loadBooks").on("click", () => {
		loadBooks(session.getSession);
	});

	$(".loadPapers").on("click", () => {
		loadPapers(session.getSession);
	});

	$(".loadAllDocs").on("click", () => {
		userDocuments(session.getSession);
	});

	$(document).on("click", "#activeRooms div.roomAv", e => {
		let roomId = event.target.getAttribute("rel");
		$.ajax({
			url: "/roomDetails",
			method: "POST",
			data: {room: roomId},
			success: response => {
				$(".roomheader img").attr("src", `media/${response.room_cover}`);
				$(".roomProfile span img").attr("src", `${response.admin}/profile/${response.profile}`);
				$(".roomheader h1").text(response.roomName);
				$(".roomAdmin").text(`${response.name} ${response.surname}`);
				$(".roomSubject").text(response.subject_name);
				$(".roomDescription").text(response.roomDescription);
				roomObj.room_id = response._id;
				roomObj.admin = response.admin;

				if(response.admin != session.getSession)
				{
					if(response.room_type == "Public")
					{
						$(".roomBody button").attr("class", "btn btn-danger btn-sm");
						$(".roomBody button").html(`<i class="fa fa-user-plus mr-1"></i><a>Request</a>`);
					}
					else
					{
						$(".roomBody button").attr("class", "btn btn-link privateRoom");
						$(".roomBody button").html(`<i class="fa fa-lock"></i>`);
					}
				}
				else
				{
					$(".roomBody button").attr("class", "btn btn-primary btn-sm yourRoom");
					$(".roomBody button").html(`<i class="fa fa-user-plus mr-1"></i><a>Join</a>`);
				}
				$(".join").fadeIn();
			},
			error: (xhttp, response) => {
				
			}
		});
	});

	$(document).on("click", ".yourRoom", e => {
		joinAroom(roomObj.room_id, session.getSession);
	});

	$(".roomheader i").on("click", () => {
		$(".join").fadeOut();
	});

	$(document).on("click", ".roomBody button", e => {
		CURRENT_ROOM_ID = roomObj.room_id;

		let obj = {
			_id: null,
			to: roomObj.admin,
			from: session.getSession,
			sentDate: getNowDate(new Date()),
			sentTime: getNowTime(),
			notificationType: 'request',
			room_id: roomObj.room_id
		}

		sendRequest(obj, data => {
			if(data == "done")
			{
				$(".join").fadeOut();
			}
		});
	});

	$(document).on("click", ".joinNow button", e => {
		let CURRENT_ROOM_ID = event.target.getAttribute("rel");
		$(document.getElementById(`_${e.target.getAttribute("status")}`)).fadeOut();
		joinAroom(CURRENT_ROOM_ID, session.getSession);
		$(".notificationsWin").fadeOut();
	});

	socket.on("reloadRooms", () => {
		$("#activeRooms").empty();
		loadRooms(session.getSession);
	});

	let on = false;

	$(".emoticon").on("click", () => {
		if(!on)
		{
			$(".emoticons").empty();
			for(let i in smileys)
			{
				$(".emoticons").append("<i class='"+smileys[i]+"'>"+smileys[i]+"</i>");
			}
			on = true;
			$(".emoticons").fadeIn();
		}
		else{
			$(".emoticons").fadeOut();
			on = false;
		}
	});

	$(".rmemoticon").on("click", () => {
		if(!on)
		{
			$(".mcemoticons").empty();
			for(let i in smileys)
			{
				$(".mcemoticons").append("<i class='"+smileys[i]+"'>"+smileys[i]+"</i>");
			}
			on = true;
			$(".mcemoticons").fadeIn();
		}
		else{
			$(".mcemoticons").fadeOut();
			on = false;
		}
	});

	$(document).on("click", ".emoticons i", e => {
		let obj = $(".userMsgtxt").val();
		let emoji = event.target.getAttribute("class");
		$(".userMsgtxt").val("");
		$(".userMsgtxt").val(obj+emoji);
	});

	$(document).on("click", ".mcemoticons i", e => {
		let obj = $(".roomsMsgTextBox").val();
		let emoji = event.target.getAttribute("class");
		$(".roomsMsgTextBox").val("");
		$(".roomsMsgTextBox").val(obj+emoji);
	});

	$(".userMsgtxt").keyup(e => {
		$(".emoticons").fadeOut();
		on = false;
	});

	$(".roomsMsgTextBox").keyup(e => {
		$(".mcemoticons").fadeOut();
		on = false;
	});

	$(".search input").keyup(e => {
		searchDocs(session.getSession, event.target.value);
	});

	let viewJoinedUsers = false;

	$(document).on("click", ".r_uList", () => {
		if(viewJoinedUsers)
		{
			$(".roomUsersList").fadeOut();
			viewJoinedUsers = false;
			$(".roomUsersList").empty();
		}
		else
		{
			$.ajax({
				url: "/viewJoined",
				method: "POST",
				data: {id: CURRENT_ROOM_ID},
				beforeSend: () => {
					viewJoinedUsers = true;
				},
				success: response => {
					$.each(response, (index, value) => {
						$(".roomUsersList")
						.append(`<div class="userL">
									<img src="${value.user_id}/profile/${value.profile}">
									<b>${value.name} ${value.surname}</b>
								</div>`);
					});
					$(".roomUsersList").fadeIn();
				},
				errror: (xhttp, response) => {
					console.log(xhttp.status, response);
				}
			});
		}
	});

	$(document).on("click", ".invitePPL", () => {
		loadOnlineUsers(CURRENT_ROOM_ID);
		$(".invContent h2 span").fadeIn();
	});

	$(document).on("click", ".docuContent div", e => {
		e.preventDefault();
		fileID = event.target.id;
		let docPath = `${event.target.getAttribute("rel")}#toolbox=0&scrollbar=0`;
		let docTitle = event.target.querySelector("span a").innerHTML;
		checkNote(session.getSession, "document", fileID, response => {
			if(response.exist > 0)
			{
				loadDocNotes(response.exist);
				noteID = response.exist;
				enterTheDocumentsStudyMode(docTitle, docPath, fileID, session.getSession);
			}
			else
			{
				createNewNote(session.getSession, docTitle, response => {
					noteID = response["MAX(notes_id)"];
					enterTheDocumentsStudyMode(docTitle, docPath, fileID, session.getSession);
				}, fileID, "document");
			}
		});
	});

	$(document).on("click", ".fileItemObj", e => {
		fileID = e.target.id;
		let path = null;
		let description = null;
		switch(e.target.getAttribute("data"))
		{
			case "document":
				path = e.target.getAttribute("rel");
				description = e.target.querySelector("span:nth-child(2)");
				checkNote(session.getSession, "document", fileID, response => {
					if(response.exist > 0)
					{
						loadDocNotes(response.exist);
						noteID = response.exist;
						enterTheDocumentsStudyMode(description.innerHTML, path, fileID, session.getSession);
					}
					else
					{
						createNewNote(session.getSession, description.innerHTML, response => {
							noteID = response["MAX(notes_id)"];
							enterTheDocumentsStudyMode(description.innerHTML, path, fileID, session.getSession);
						}, fileID, "document");
					}
				});
				break;
			case "media":
				path = e.target.querySelector("video");
				description = e.target.querySelector("span:nth-child(2)");
				checkNote(session.getSession, "media", fileID, response => {
					if(response.exist > 0)
					{
						loadMediaNotes(response.exist)
						noteID = response.exist;
						enterTheVideoStudyMode(path.src, 0, description.innerHTML, fileID);
					}
					else
					{
						createNewNote(session.getSession, description.innerHTML, response => {
							noteID = response["MAX(notes_id)"];
							enterTheVideoStudyMode(path.src, 0, description.innerHTML, fileID);
						}, fileID, "media");
					}
				});
				break;
		}
	});

	$(".pdfWinClose").on("click", () => {
		$(".studyModeWin").fadeOut();
		document.getElementsByClassName('pdfView')[0].innerHTML = "";
		document.getElementsByClassName('pdfTitle')[0].innerHTML = "";
	});

	$(".userSubHeader span i:nth-child(1)").on("click", () => {
		$(".userSubWindow").fadeOut();
	});

	let SUBJECT_ID = null;

	$(document).on("click", ".classList div", e => {
		$(".userSubWindow").fadeIn();
		SUBJECT_ID = event.target.getAttribute("data");
		subjectMenuToggle("dashboard", SUBJECT_ID, session.getSession);
		let subject_name = event.target.innerHTML;
		$(".subjectID").attr("value", SUBJECT_ID);
		$(".subjectName").text(subject_name.toUpperCase());
	});

	$(".subjectManagerMenu b").on("click", e => {
		let menuID = event.target.id;
		subjectMenuToggle(menuID, SUBJECT_ID, session.getSession);
	});

	$(".subBooks h2 button, .subPapers h2 button, .subVideos h2 button").on("click", e => {
		fileObject = event.target.getAttribute("rel");
		$(".userObject").attr("value", session.getSession);
		$(`.${fileObject}`).click();
	});

	$(`.windowForms input[type="file"]`).bind("change", e => {
		if(event.target.files.length > 0)
		{
			var percentage = 0;
			var progress = 0;
			var file = URL.createObjectURL(e.target.files[0]);
			var xhttp = new XMLHttpRequest();
			xhttp.onprogress = function(e){
				percentage = (parseInt(e.loaded)/parseInt(e.total)) * 100;
				progress = `${parseInt(percentage)}%`;
				if(percentage == 100)
				{
					$(`#${fileObject}`).click();
				}
			}
			xhttp.open("GET", file, true);
			xhttp.send();
		}
		else{
			alert("Whoa");
		}
	});

	$(`.windowForms form`).submit(e => {
		e.preventDefault();
		$(e.target).ajaxSubmit({
			success: response => {
				switch(response)
				{
					case "book":
						loadSubjectBooks(session.getSession, SUBJECT_ID);
						break;
					case "paper":
						loadSubjectPapers(session.getSession, SUBJECT_ID);
						break;
					case "video":
						loadSubjectVideos(session.getSession, SUBJECT_ID);
						break;
				}
			},
			error: xhr => {
				console.log('Error: ' + xhr.status);
			}
		});
	});

	$(".projectFinish h1 i").on("click", () => {
		$(".projectFinish").fadeOut();
	});

	$(".createProject h1 i").on("click", () => {
		$(".createProjectWindow").fadeOut();
	});

	$(".subTasks button").on("click", () => {
		$(".createProjectWindow").fadeIn();
	});

	$(".newProjectCreate").on("click", () => {
		$.ajax({
			url: "/newProjectCreation",
			method: "POST",
			data: {user: session.getSession, project: $(".newProject").val(), subject: SUBJECT_ID},
			beforeSend: () => {
				$(".newProjectCreate").html(`<span class="spinner-border text-light"></span>`);
			},
			success: response => {
				NEW_PROJECT_ID = response["MAX(_id)"];
				$(".newProjectCreate").text("Create Project");
				$(".createProject").css("display", "none");
				$(".projectFinish h4").text(`Name: ${$(".newProject").val()}`);
				$(".projectFinish").fadeIn();
			}
		});
	});

	$(".completeProject").on("click", () => {
		$.ajax({
			url: "/completeProjectCreation", 
			method: "POST",
			data: {description: $(".projectDescription").val(), importance: document.getElementsByClassName('projectPriority')[0].value, project: NEW_PROJECT_ID},
			beforeSend: () => {
				$(".completeProject").html(`<span class="spinner-border text-light"></span>`);
			},
			success: response => {
				$(".completeProject").html(`Next <i class="fa fa-angle-right ml-3"></i>`);
				$(".projectFinish").fadeOut();
				loadSubjectProjects(session.getSession, SUBJECT_ID);
			},
			error: (xhttp, response) => {
				console.log(xhttp.status, response);
			}
		});
	});

	$(".notesTab").on("click", () => {
		loadUserNotes(session.getSession);
		$(".notesListWin").fadeIn();
	});

	$(".allNotesList h1 i").on("click", () => {
		$(".notesListWin").fadeOut();
	});

	$(document).on("click", ".allNotesList .subjectItems", e => {
		fileID = e.target.getAttribute("data");
		switch(e.target.getAttribute("type"))
		{
			case "document":
				enterTheDocumentsStudyMode(e.target.querySelector("span:nth-child(2)").innerHTML, e.target.getAttribute("rel"), fileID, session.getSession);
				break;
			case "media":
				enterTheDocumentsStudyMode(e.target.querySelector("span:nth-child(2)").innerHTML, e.target.getAttribute("rel"), fileID, session.getSession);
				break;
		}
	});

	$(".searcForContact").on("click", () => {
		$(".findContacts").fadeIn();
		$(".constactsWinClose").attr("class", "fa fa-arrow-right cancelSearchContact");
		$(".searcForContact").fadeOut();
	});

	$(document).on("click", ".cancelSearchContact", () => {
		$(".cancelSearchContact").attr("class", "fa fa-times constactsWinClose");
		$(".searcForContact").fadeIn();
		$(".findContacts").fadeOut();
	});

	$(document).on("click", ".constactsWinClose", () => {
		$(".messagesContent").fadeIn();
		$(".contactsWin").fadeOut();
	});

	$(".findContacts").keydown(() => {
		$.post("/findAContact", {id: session.getSession, key: $(".findContacts").val()}, response => {
			$(".contactsList").empty();
			$.each(response, (index, value) => {
				if(value.studyLevel == USER_LEVEL && value.user_id != session.getSession)
				{
					$(".contactsList")
					.append(`<li class="list-group-item" id="${value.user_id}">
								<img src="${value.user_id}/profile/${value.profile}"/>
								<span>
									<b>${value.name} ${value.surname}</b>
									<b><i class="fas fa-graduation-cap mr-1"></i>${value.schoolName}</b>
								</span>
								<button class="btn btn-danger btn-sm" type="button" rel="${value.user_id}"><i class="fas fa-envelope mr-1"></i>Message</button>
							</li>`);
				}
			});
			$(".messagesContent").fadeOut();
			$(".contactsWin").fadeIn();
		});
	});

	$(".newTextNotes").on("click", e => {
		e.preventDefault();
		$(".newNoteWin").fadeIn();
	});

	$(".newNote h1 i").on("click", () => {
		$(".newNoteWin").fadeOut();
	});

	$(".newNote button").on("click", () => {
		createNewNote(session.getSession, document.getElementsByClassName('noteName')[0].value, data => {
			document.getElementsByClassName('userNoteTitle')[0].innerHTML = document.getElementsByClassName('noteName')[0].value;
			$(".newNoteWin").fadeOut();
			$(".notesWindow").fadeIn();
			$(".noteControls button").attr("id", data["MAX(notes_id)"]);
			$(".userNoteSection").height($(".notesWriting").height()-70);
		});
	});

	$(".closeNotesEditWind").on("click", () => {
		$(".notesWindow").fadeOut();
	});

	$(".noteControls button").on("click", e => {
		saveUserNote(session.getSession, e.target.id, document.getElementsByClassName('userNoteSection')[0].value.replace("\n", "\\r\\n"));
	});

	$(document).on("click", ".userNotesItem", e => {
		editNote(e.target.id, response => {
			$(".userNoteTitle").text(response.name);
			$(".userNoteSection").val(response.description);
			$(".noteControls button").attr("id", response.notes_id);
			$(".notesWindow").fadeIn();
			$(".userNoteSection").height($(".notesWriting").height()-70);
			noteID = response.notes_id;

			if(response.object_file != null)
			{
				$(".goToStudyMode").fadeIn();
				$(".goToStudyMode").attr("type", response.type);
				$(".goToStudyMode").attr("id", response.notes_id);
			}
			else
				$(".goToStudyMode").fadeOut();
		});
	});

	$(".findA_Note").keydown(e => {
		if(e.target.value.length > 0)
			searchYourNostes(session.getSession, e.target.value);
		else
			loadUserNotes(session.getSession);
	});

	$(".goToStudyMode").on("click", e => {
		let path = null;
		let description = null;
		fileID = e.target.id;
		$.post("/getFullNotesDetails", {note: fileID, type: e.target.getAttribute("type")}, res => {
			description = res.name;
			switch(res.type)
			{
				case "media":
					path = `${res.user_id}/media/videos/${res.media_file}`;
					checkNote(session.getSession, "media", res.object_file, response => {
						if(response.exist > 0)
						{
							loadMediaNotes(response.exist)
							noteID = response.exist;
							enterTheVideoStudyMode(path, 0, description, fileID);
						}
						else
						{
							createNewNote(session.getSession, description, response => {
								noteID = response["MAX(notes_id)"];
								enterTheVideoStudyMode(path, 0, description, fileID);
							}, fileID, "media");
						}
					});
					break;
				case "document":
					path = `${res.user_id}/documents/${res.doc_type}s/${res.file}`;
					checkNote(session.getSession, "document", res.object_file, response => {
						if(response.exist > 0)
						{
							loadDocNotes(response.exist);
							noteID = response.exist;
							enterTheDocumentsStudyMode(description, path, fileID, session.getSession);
						}
						else
						{
							createNewNote(session.getSession, description, response => {
								noteID = response["MAX(notes_id)"];
								enterTheDocumentsStudyMode(description, path, fileID, session.getSession);
							}, fileID, "document");
						}
					});
					break;
			}
			$(".notesWindow").fadeOut();
			$(".userNoteSection").val("");
		});
	});

	$(".pdfBody .userTextNotes").keyup(e => {
		autoSaveNote(noteID, event.target.value, delayTime);
	});

	$(".pdfBody .userTextNotes").keyup(e => {
		autoSaveNote(noteID, event.target.value, delayTime);
	});

	$(".vBody .userTextNotes").keyup(e => {
		autoSaveNote(noteID, event.target.value, delayTime);
	});

	$(".vBody .userTextNotes").keyup(e => {
		autoSaveNote(noteID, event.target.value, delayTime);
	});

	$(document).on("mouseover", ".postInfo i:nth-child(2)", e => {
		if(e.target.getAttribute("rel") != session.getSession)
			e.target.querySelector(".viewProfile").style.display = "block";
	});

	$(document).on("mouseleave", ".postInfo i:nth-child(2)", e => {
		e.target.querySelector(".viewProfile").style.display = "none";
	});

	$(document).on("mouseleave", ".viewProfile", e => {
		e.target.style.display = "none";
	});

	$(document).on("mouseleave", ".viewProfile span", e => {
		e.target.querySelector(".viewProfile").style.display = "none";
	});

	$(document).on("click", ".msgUser", _e => {
		userID = event.target.parentElement.getAttribute("rel");
		$(".chat-username").text($(event.target.parentElement.parentElement.querySelector("span b")).text());
		$(".chat-controls i").attr("id", userID);
		session.setIsActive = true;
		session.setActiveUser = userID;
		var imgPath = event.target.parentElement.parentElement.querySelector("img");
		openPrivateChatWindow(session.getSession, userID, imgPath);
		event.target.parentElement.parentElement.style.display = "none";
	});

	$(".newPostRoom h4 i").on("click", () => {
		$(".newPostRoomWindow").fadeOut();
	});

	$(document).on("click", ".beginRoom", e => {
		let post = e.target.parentElement.parentElement.parentElement.parentElement.id;
		$.ajax({
			url: "/getPostInformation",
			method: "POST",
			data: {id: post},
			beforeSend: () => {
				event.target.parentElement.parentElement.style.display = "none";
			},
			success: response => {
				$("#rmName").val(response.topic)
				$("#rmSubject").val(response.subject_id)
				$("#rmMedia").val(response.post_image)
				$("#userId").val(session.getSession)


				$.post("/checkIfRoomAlreadyExist", {
					room: document.getElementById('rmName').value,
					subject: document.getElementById('rmSubject').value,
					user: document.getElementById('userId').value
				}, response => {
					if(response == "0")
					{
						$(".newPostRoomWindow").fadeIn();
					}
					else
					{
						CURRENT_ROOM_ID = parseInt(response._id);
						joinAroom(CURRENT_ROOM_ID, session.getSession);
					};
				});
			},
			error: (xhttp, response) => {
				console.log(xhttp.status, response);
			}
		});
	});

	$(".newPostRoom form").submit(e => {
		e.preventDefault();
		$(e.target).ajaxSubmit({
			success: response => {
				CURRENT_ROOM_ID = response["MAX(_id)"];
				joinAroom(CURRENT_ROOM_ID, session.getSession);
				$(".newPostRoomWindow").fadeOut();
			},
			error: response => {
				console.log(response.status);
			}
		});
	});

	$(".userNoteSection").keyup(e => {
		autoSaveNote(noteID, e.target.value, delayTime);
	});

	$(document).on("mouseover", ".roomsVideoFile video", e => {
		$(e.target.parentElement.querySelector("i")).fadeIn();
	});

	$(document).on("mouseover", ".chatMediaCon video", e => {
		$(e.target.parentElement.querySelector("span")).fadeIn();
	});

	$(document).on("mouseover", ".roomsVideoFile i, .chatMediaCon span", e => {
		if(hideControl != null)
			clearTimeout(hideControl);
		$(e.target).fadeIn();
	});

	$(document).on("mouseleave", ".roomsVideoFile video", e => {
		hideControl = setTimeout(() => {
			if(e.target.paused)
				$(e.target.parentElement.querySelector("i")).fadeIn();
			else
				$(e.target.parentElement.querySelector("i")).fadeOut();
		}, 1000);
	});

	$(document).on("mouseleave", ".chatMediaCon video", e => {
		hideControl = setTimeout(() => {
			if(e.target.paused)
				$(e.target.parentElement.querySelector("span")).fadeIn();
			else
				$(e.target.parentElement.querySelector("span")).fadeOut();
		}, 1000);
	});

	$(".closeStore").on("click", () => {
		$(".onlineStoreWindow").fadeOut();
	});

	$(".onlineStoreTab").on("click", () => {
		$(".onlineStoreWindow").fadeIn();
		loadOnlineProducts();
	});

	$(".advertiseYourProduct").on("click", () => {
		$(".advertiseBackWindow").fadeIn();
		$("#user").val(session.getSession);
	});

	$(".closeAdvertiseWin").on("click", () => {
		$(".advertiseBackWindow").fadeOut();
	});

	$(".advertiseWindow").submit(e => {
		e.preventDefault();
		$(e.target).ajaxSubmit({
			success: response => {
				$(".advertiseBackWindow").fadeOut();
				loadOnlineProducts();
				$(".productImgPreview").empty();
				$(".productUpload label").css("z-index", "99");
				$(".advertiseWindow input, .advertiseWindow textarea").val("");
			},
			error: (xhttp, response) => {
				console.log(xhttp.status, response);
			}
		});
	});

	$(".menuItems h5:nth-child(1)").on("click", () => {
		loadOnlineProducts();
	});

	$("#productImg").bind("change", e => {
		if(e.target.files.length > 0){
			$(".productUpload label").css("z-index", "0");
			let file = URL.createObjectURL(e.target.files[0]);
			let obj = document.getElementsByClassName('productImgPreview')[0];
			let img = document.createElement("img");
			img.setAttribute("class", "productImage");
			img.src = file;
			obj.appendChild(img);
		}
	});

	$(".findAProduct").keyup(e => {
		$.ajax({
			url: "/findAproduct",
			method: "POST",
			data: {search: e.target.value},
			beforeSend: () => {
				$(".itemsList").empty();
			},
			success: response => {
				if(response.length > 0)
				{
					$.each(response, (index, value) => {
						$(".itemsList")
						.append(`<div class="sellingItem" rel="${value._id}">
									<img src="items/${value.product_image}">
								</div>`);
					});
				}
				else
				{
					$(".itemsList").html(`<h2 class="text-center mt-1" style="margin-left: 33%; display: inline-block; white-space: nowrap;">No Product Found...</h2>`);
				}
			},
			error: response => {
				console.log(response.status);
			}
		});
	});
});

let loadOnlineProducts = () => {
	$.ajax({
		url: "/advertisedProducts",
		method: "POST",
		beforeSend: () => {
			$(".itemsList").empty();
		},
		success: response => {
			$.each(response, (index, value) => {
				$(".itemsList")
				.append(`<div class="sellingItem" rel="${value._id}">
							<img src="items/${value.product_image}">
						</div>`);
			});
		},
		error: err => {
			console.log(err.status);
		}
	});
}

let joinAroom = (_ID, sess) => {
	$(".roomBtnSend button").attr("rel", _ID);
	$("#tfile").val(sess);
	$("#refID").val(_ID);
	room.emit("joinRoom", {roomID: _ID, user: sess}, function(data){
		JOINED_ROOM = true;
		if(data == true) //If the room has already been used!
		{
			$(".roomChats").empty();
			$(".roomChats").append(`<div class="prevChats">
				<button class="previous"><i class="fas fa-history mr-1"></i>Chat History</button>
			</div>`);
		}
		loadActiveRoomChats(_ID);
	});
}

let loadOnlineUsers = (ROOM, sess = session.getSession) => {
	$(".usersList").empty();
	$(".invContent h2 i").fadeOut();
	ROOM_MINIMUM = 1;

	$.post("/loadOnlinePeople", {user: sess, room: ROOM}, response => {
		if(response.length != 0 || response != "")
		{
			$.each(response, (index, value) => {
				if(value.logStatus == "Offline") USER_LOG_STATUS = `<i style="color: red;" class="userLogStatus"><i class="fas fa-circle"></i> ${value.logStatus}</i>`;
				else USER_LOG_STATUS = `<i style="color: green;" class="userLogStatus"><i class="fas fa-circle"></i> ${value.logStatus}</i>`;
				
				$(".usersList")
				.append(`<div class="userItem">
							<span>
								<img src="${value.user_id}/profile/${value.profile}">
							</span>
							<span>
								<b>${value.name} ${value.surname}</b><br>
								<i>${value.schoolName}</i><br>
								${USER_LOG_STATUS}
							</span>
							<button class="btn btn-dark btn-sm" type="button" id="${value.user_id}" rel="${ROOM}"><i class="far fa-paper-plane"></i> Invite</button>
						</div>`);
			});

			$(".newRoomWindow").fadeOut();
			$(".myRoomsList").fadeOut();
			$(".invitationWindow").fadeIn();
			$(".newRoomItem").fadeIn();
		}
		else{
			loadOnlineUsers(ROOM);
		}
	});
}

let videoCollectionPause = vObj => {
	vObj.setAttribute("class", "far fa-play-circle");
	$(`.videosCollection span.${vObj.getAttribute("rel")} i`).fadeOut();
	$(`.videosCollection span.${vObj.getAttribute("rel")} span`).css("display", "none");
	CURRENTLY_PLAYING.pause();
	CURRENTLY_PLAYING = null;
}