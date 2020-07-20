import { TextOnly, MediaOnly, MediaText } from "./Templates.js";
import { loadSubjects } from "./subjects.js";
import { ChatMessages } from "./chatMessages.js";
let FILE_OBJECT = null;
let timer = null;

export class Posts {
    constructor(n){
        this.name = n;
    }

    get getName()
    {
        return this.name;
    }
}

export var winHeight = function(){
    return $(window).height()-64;
}

export var postType = function() {
	if ($('#toggle-one').prop('checked'))
		return true;
    else
		return false;
}

export var newPrivateNote = function(text, time){
    return `<div class="p-2 notePiece">
                <h5>${text}</h5>
                <div class="p-0">
                    <b style="visibility: hidden;">lock</b>
                    <i class="time ml-1">${time}</i>
                </div>
            </div>`;
}

export var timeSince = function(date) {

    var seconds = Math.floor((new Date() - date) / 1000);
    
    if(Math.floor(seconds / 31104000) >= 1)
    {
        return Math.floor(seconds / 31104000) + " years ago";
    }
    else if(Math.floor(seconds / 2592000) >= 1)
    {
        return Math.floor(seconds / 2592000) + " months ago";
    }
    else if(Math.floor(seconds / 86400) >= 1)
    {
        return Math.floor(seconds / 86400) + " days ago";
    }
    else if(Math.floor(seconds / 3600) >= 1)
    {
        return Math.floor(seconds / 3600) + " hours ago";
    }
    else if(Math.floor(seconds / 60) >= 1)
    {
        return Math.floor(seconds / 60) + " minutes ago";
    }
    else
    {
        if(seconds == 0)
            return "Just now";
        else
            return `${Math.floor(seconds)} seconds ago`;
    }
  }

export var getNowDate = function(obj){
    let m = null, d = null;
    
    if(obj.getMonth() < 10)
    {
        m = `0${obj.getMonth()}`;
        m++;
        if(m < 10){
            m = `0${m}`;
        }
    }
    else
        m = obj.getMonth();

    if(obj.getDate() < 10)
        d = `0${obj.getDate()}`;
    else
        d = obj.getDate();
    
    return `${obj.getFullYear()}-${m}-${d}`;
}

export var getNowTime = function(){
    let obj = new Date();
    let h = null, m = null, s = null;
    
    if(obj.getHours() < 10)
        h = `0${obj.getHours()}`;
    else
        h = obj.getHours();

    if(obj.getMinutes() < 10)
        m = `0${obj.getMinutes()}`;
    else
        m = obj.getMinutes();

    if(obj.getSeconds() < 10)
        s = `0${obj.getSeconds()}`;
    else
        s = obj.getSeconds();

    return `${h}:${m}:${s}`;
}

export var getDateTime = function(){
    return `${getNowDate(new Date())}T${getNowTime()}`;
}

export var newEvent = function(event, dt, tm){
    return `<div class="mb-1 p-2 item">
                <div class="m-0 p-1">
                    ${event}
                </div>
                <div class="m-0 p-1">
                    <span>
                        <i class="fa fa-clock"></i><b class="ml-1">${tm}</b>
                    </span>
                    <span style="float: right;">
                        <i class="far fa-calendar-times"></i><b class="ml-1">${dt.split("-")[2]} ${month(parseInt(dt.split("-")[1]))} ${dt.split("-")[0]}</b>
                    </span>
                </div>
            </div>`;
}

export let month = m => {
    switch(m)
    {
        case 1:
            return "Jan";
        case 2:
            return "Feb";
        case 3:
            return "Mar";
        case 4:
            return "Apr";
        case 5:
            return "May";
        case 6:
            return "Jun";
        case 7:
            return "Jul";
        case 8:
            return "Aug";
        case 9:
            return "Sep";
        case 10:
            return "Oct";
        case 11:
            return "Nov";
        case 12:
            return "Dec";
    }
}

export var loadPosts = async function(sess)
{
    $.ajax({
        url: "/getPosts",
        method: "POST",
        data: {_id: sess},
        beforeSend: function(){
            $(".posts").empty();
        },
        success: function(data){
            $.each(data, (key, value) => {
                if(value.post_image == null)
                {
                    let textOnly = new TextOnly({topic: value.topic, profile: value.profile}, timeSince(new Date(value.post_date)), `${value.name} ${value.surname}`, value.schoolName, value.subject_name, value.post_id, value.user_id, value.post)
                    $(".posts").append(textOnly.createPost());
                }
                else if(value.post == null)
                {
                    let mediaOnly = new MediaOnly({topic: value.topic, profile: value.profile}, timeSince(new Date(value.post_date)), `${value.name} ${value.surname}`, value.schoolName, value.subject_name, value.post_id, value.user_id, value.post_image);
                    $(".posts").append(mediaOnly.createPost());
                }
                else
                {
                    let mt = new MediaText({topic: value.topic, profile: value.profile}, timeSince(new Date(value.post_date)), `${value.name} ${value.surname}`, value.schoolName, value.subject_name, value.post_id, value.user_id, value.post, value.post_image);
                    $(".posts").append(mt.createPost());
                }
            });
        },
        error: function(xhr, textStatus){
            console.log(`${xhr.status}: ${textStatus}`);
        }
    });
}

export var checkForNewChats = function(sess){
    let msgs = new ChatMessages(sess);
    $.post("/checkForNewMessages", {userId: sess}, response => {
        if(response.length != 0){
            $(".newMsgNotification").text(response.length).fadeIn("fast");
            // msgs.loadUsers();
        }
        else
            $(".newMsgNotification").text(response.length).fadeOut("fast");
    });

    $.post("/newUpdates", {userId: sess}, response => {
        if(response.length == 0)
            $(".notificationCount").text(response.length).fadeOut("fast");
        else
            $(".notificationCount").text(response.length).fadeIn("fast");
    });
}

export var loadSubNotes = async function(sess)
{
    $.ajax({
        url: "/loggedUserSubjects",
        method: "POST",
        data: {user_Id: sess},
        success: function(data){
            if(data.length > 0)
            {
                $.each(data, (key, value) => {
                    $(".classList").append(`<div class="btn btn-link" data="${value.subject_code}">${value.subject_name}</div>`);
                    $(".scroll").append(`<button type="button" class="btn btn-warning mr-2" id="${value.subject_code}">${value.subject_name}</button>`);
                });
            }
            else
            {
                loadSubjects(sess);
                $(".newSubHeader i").css("display", "none");
            }
        },
        error: function(xhr){
            console.log(xhr);
        }
    });

    $.ajax({
        url: "/loadUpcomingEvents",
        method: "POST",
        data: {userId: sess, nowDate: getNowDate(new Date())},
        success: function(res, statusText, code){
            $.each(res, (index, value) => {
                if(new Date(getNowDate(new Date(value.event_date))) >= new Date(getNowDate(new Date())))
                {
                    $(".events-container")
                    .append(`<div class="event" id="${value._id}">
                                <h5>${value.event_description}</h5>
                                <div class="event_dateTime">
                                    <span class="date">${getNowDate(new Date(value.event_date))}</span>
                                    <span class="time">${value.event_time.substring(0, 5)}</span>
                                </div>
                            </div>`);
                }
                else
                {
                    $(".past-events-container")
                    .append(`<div class="event" id="${value._id}">
                                <h5>${value.event_description}</h5>
                                <div class="event_dateTime">
                                    <span class="date">${getNowDate(new Date(value.event_date))}</span>
                                    <span class="time">${value.event_time.substring(0, 5)}</span>
                                </div>
                            </div>`);
                }
            })
        },
        error: function(xhr, statusText){
            console.log(`${xhr.status}: ${textStatus}`);
        }
    });

    checkForNewChats(sess);
    loadRooms(sess);
}

export var loadNotes = (sess) => {
    $.ajax({
        url: "/loadNotes",
        method: "POST",
        data: {userId: sess},
        beforeSend: function(){
            $("#activeRooms").empty();
        },
        success: function(res, statusText, code){
            $.each(res, (index, value) => {
                $("#activeRooms").append(newPrivateNote(value.description, timeSince(new Date(value.date))));
            })
        },
        error: function(xhr, statusText){
            console.log(`${xhr.status}: ${textStatus}`);
        }
    });
}

export var loadRooms = (sess) => {
    $.post("/loadRooms", {find: sess}, response => {
        $("#activeRooms").empty();
        console.log(response)
        if(response.length > 0)
        {
            $("#activeRooms").prepend(`<h5>Active Rooms</h5>`);
            $.each(response, (index, value) => {
                $("#activeRooms")
                .append(`<div class="roomAv" rel="${value._id}">
                            <div class="roomDetails">
                                <span class="p-0">
                                    <img src="media/${value.room_cover}">
                                </span>
                                <span class="p-0">${value.roomName}</span>
                            </div>
                        </div>`);
            });
        }
        else{
            $("#activeRooms").append(`<h3 class="text-center">There aren't any rooms available</h3>`);
        }
    });
}

export var message_view = (msg, file) => {
    let show = null;
    if(file == "null" || file == null)
    {
        return msg;
    }
    else
    {
        var type = file.substr(file.lastIndexOf('.')+1);
        var extensions = ["jpg", "jpeg", "png", "gif"];
        if(msg.length == 0)
            show = "none";
        else
            show = "block";

        if(extensions.indexOf(type) != -1)
        {
            return `<div class="roomsVideoFile">
                        <img width="350" height="200" src="media/${file}">
                        <div style="display: ${show};" class="vdMsg">
                            ${msg}
                        </div>
                    </div>`;
        }
        else
        {
            return `<div class="roomsVideoFile">
                        <video width="350" height="200" src="media/${file}"></video>
                        <i class="far fa-play-circle"></i>
                        <div style="display: ${show};" class="vdMsg">
                           ${msg}
                        </div>
                    </div>`;
        }
    }
}

export var loadRoomChats = (roomID, userID) =>{
    $(".roomChats").empty();
    $.post("/loadRoomChats", {room: roomID}, response => {
        $.each(response, (index, value) => {
            switch(value.sentBy)
            {
                case userID:
                    $(".roomChats")
			        .append(`<div class="pl-2 s_chat">
							<span class="userMessage">
                                ${message_view(value.message, value.mediaFile)}
							</span>
							<span class="user">
								<b>You</b><br>
								<i>${value.msgDate.substr(value.msgDate.indexOf('T')+1, 5)}</i>
							</span>
						</div>`);
                    break;
                default:
                    $(".roomChats")
		            .append(`<div class="r_chat">
                        <span class="userMessage">
                            ${message_view(value.message, value.mediaFile)}
                        </span>
                        <span class="user">
                            <b>${value.name} ${value.surname}</b><br>
                            <i>${value.msgDate.substr(value.msgDate.indexOf('T')+1, 5)}</i>
                        </span>
                    </div>`);
                    break;
            }
        });
        $(".roomChats").scrollTop($(".roomChats")[0].scrollHeight);
    });
}

export var toggle = function(hide, show)
{
	$(`#${hide}`).css({
		"display" : "none"
	});

	$(`#${show}`).css({
		"display" : "block"
	});
}

export var loadActiveRoomChats = function(ROOM_ID){
    $.ajax({
        url: "/loadSelectedRoom",
        method: "POST",
        data: {id: ROOM_ID},
        beforeSend: () => {
            $(".newNotifications").empty();
        },
        success: response => {
            roomContent(response);
        },
        error: (xhr, errMsg) => {
            console.log(errMsg, xhr.status);
        }
    });
}

export var showRoomContent = function(){
    $(".join").fadeOut();
    $(".roomsWindow").fadeIn();
}

export var notifications = (userId, profile, names, displayType, message, room, id, join = "none") =>{
    $(".notifContent")
    .append(`<div class="notificationItem" id="_${id}">
                <div class="notification">
                    <span>
                        <img src="${userId}/profile/${profile}">
                    </span>
                    <span class="ml-2">
                        <b class="${userId}">${names}</b> ${message}
                    </span>
                </div>
                <div class="responseCtrls" style="display: ${displayType}">
                    <i class="fa fa-history" style="visibility: hidden;"></i>
                    <button class="btn btn-success btn-sm ml-1" rel="${userId}" room="${room}" data="yes" status="${id}">Accept</button>
                    <button class="btn btn-danger btn-sm" rel="${userId}" room="${room}" data="no" status="${id}">Reject</button>
                </div>
                <div class="joinNow" style="display: ${join}">
                    <i>a</i>
                    <button class="btn btn-danger btn-sm" rel="${room}" status="${id}">Join Now</button>
                </div>
            </div>`);
}

export var roomContent = (object) => {
    $.each(object, (index, value) => {
        if(value.media_file != "null")
        {
            if(value.media_file.substr(value.media_file.lastIndexOf(".")+1).indexOf('jpg', 'jpeg', 'png') > -1)
                FILE_OBJECT = `<img src="media/${value.media_file}">`;
            else if(value.media_file.substr(value.media_file.lastIndexOf(".")+1).indexOf('mp4', 'mov') > -1)
                FILE_OBJECT = `<video src="media/${value.media_file}"></video>`;
            else
                FILE_OBJECT = `<object type="application/pdf" data="media/${value.media_file}#toolbar=0&navpanes=0&scrollbar=0"></object>`;
        }
        else
            FILE_OBJECT = `<img src="media/${value.room_cover}">`;

        $(".newNotifications")
        .append(`
            <h3>Topic <i class="fas fa-user-plus mr-5 invitePPL"></i><i class="fa fa-users r_uList"></i></h3>
            <div class="roomUsersList"></div>
            <div class="discussionMedia">
                ${FILE_OBJECT}
                <h4>${value.roomName}</h4>
                <p class="roomDescription">${value.roomDescription}</p>
                <h6 class="pl-1"><i class="far fa-user"></i> ${value.name} ${value.surname} | <i class="fas fa-info-circle"></i> ${value.subject_name}</h6>
            </div>`
        );
        showRoomContent();
    });
}

export let selectRoom = (sess) => {
    $.ajax({
        url: "/listRooms",
        method: "POST",
        data: {data: sess},
        beforeSend: () => {
            $(".newRoomItem").fadeOut("fast");
            $(".newRoomBg").fadeOut();
            $(".rmlist").empty();
            $(".myRoomsList").fadeIn();
            $(".newRoomWindow").fadeIn();
        },
        success: response => {
            $.each(response, (index, value) => {
                $(".rmlist")
                .append(`<div class="m-0 mb-1 p-1 roomAv">
                            <div class="row m-0">
                                <span class="col-2 p-0">
                                    <img src="media/${value.room_cover}">
                                </span>
                                <span class="col p-0">${value.roomName}</span>
                                <button type="button" class="btn btn-danger btn-sm" rel="${value._id}"><i class="fas fa-user-plus mr-1" style="color: white;"></i>Start</button>
                            </div>
                        </div>`);
            });
        }
    });
}

export let sendRequest = (dataObj, callback) => {
	$.post("/canIJoinYourRoom", dataObj, response => {
		if(response == "reload")
			sendRequest(dataObj);
		else
			callback("done");
	});
}


export let accessToken = () => {
	let tokenGenerator = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
	let token = "";
	for(let i = 0; i < 20; i++){
		token += tokenGenerator.charAt(Math.floor(Math.random() * tokenGenerator.length));
	}

	return token;
}

export let calendarToggle = (event) => {
	let obj = event.getAttribute("rel");
	let status = event.getAttribute("data");
	switch(obj)
	{
		case "events-container":
			if(status == "true")
			{
				$(`.events-container`).fadeIn();
				$(event).attr("data", "false");
			}
			else
			{
				$(`.events-container`).fadeOut();
				$(event).attr("data", "true");
			}
			break;
		case "past-events-container":
			if(status == "true")
			{
				$(`.past-events-container`).fadeIn();
				$(event).attr("data", "false");
			}
			else
			{
				$(`.past-events-container`).fadeOut();
				$(event).attr("data", "true");
			}
			break;
	}
}

export var received_message_view = (message, file, mime) => {
    let show = null;
    if(file == null)
    {
        return `<div class="chat_Ritem">
                    <div class="itemR">
                        <i class="msgR">${message}</i>
                    </div>
                </div>`;
    }
    else
    {
        var extensions = ["image/jpg", "image/jpeg", "image/png", "image/gif"];
        if(message.length == 0)
            show = "none";
        else
            show = "block";

        if(extensions.indexOf(mime) != -1)
        {
            return `<div class="chat_Ritem" id="xxxx">
                        <div class="itemR">
                            <div class="chatMediaCon">
                                <img width="350" height="180" src="media/${file}"/>
                                <i style="display: ${show};" class="msgR">${message}</i>
                            </div>
                        </div>
                    </div>`;
        }
        else
        {
            return `<div class="chat_Ritem" id="xxxx">
                        <div class="itemR">
                            <div class="chatMediaCon">
                                <video width="350" height="180" src="media/${file}"></video>	
                                <i style="display: ${show};" class="msgR">${message}</i>
                                <span class="far fa-play-circle"></span>
                            </div>
                        </div>
                    </div>`;
        }
    }
}

export var sent_message_view = (message, file, mime) => {
    let show = null;
    if(file == null)
    {
        return `<div class="chat_Sitem">
                    <div class="itemS">
                        <i class="msgS">${message}</i>
                    </div>
                </div>`;
    }
    else
    {
        var extensions = ["image/jpg", "image/jpeg", "image/png", "image/gif"];
        if(message.length == 0)
            show = "none";
        else
            show = "block";

        if(extensions.indexOf(mime) != -1)
        {
            return `<div class="chat_Sitem">
                        <div class="itemS">
                            <div class="chatMediaCon">
                                <img width="350" height="180" src="media/${file}"/>
                                <i style="display: ${show};" class="msgS">${message}</i>
                            </div>
                        </div>
                    </div>`;
        }
        else
        {
            return `<div class="chat_Sitem">
                        <div class="itemS">
                            <div class="chatMediaCon">
                                <video width="350" height="180" src="media/${file}"></video>
                                <i style="display: ${show};" class="msgS">${message}</i>
                                <span class="far fa-play-circle"></span>
                            </div>
                        </div>
                    </div>`;
        }
    }
}

export let userSubjects = (sess) => {
    $.ajax({
        url: "/loggedUserSubjects",
        method: "POST",
        data: {user_Id: sess},
        beforeSend: () => {
            $(".eventSubjectOptions").empty();
        },
        success: response => {
            $(".eventSubjectOptions").append(`<option value="select">--Select--</option>`);
            $.each(response, (index, value) => {
                $(".eventSubjectOptions").append(`<option value="${value.subject_code}">${value.subject_name}</option>`);
            });
        },
        error: (xhttp, statusMsg) => {
            console.log(xhttp.status, statusMsg);
        }
    });
}

export let loadUserNotes = (sess) => {
    $.ajax({
        url: "/loadUserNotes",
        method: "POST",
        data: {user: sess},
        beforeSend: () => {
            $(".notesItems").empty();
        },
        success: response => {
            if(response.length > 0)
            {
                $.each(response, (index, value) => {
                    $(".notesItems")
                    .append(`<div class="m-1 userNotesItem" id="${value.notes_id}" data-placement="bottom" data-toggle="tooltip" title="${value.name}">
                                <span class="p-0 mediaNote">
                                    <i class="fa fa-sticky-note"></i>
                                </span>
                                <span class="noteTitle">
                                    ${value.name}
                                </span>
                            </div>`);
                });
            }
            else
            {
                $(".notesItems").append(`<h3 class="text-center">You don't have any notes yet...</h3>`);
            }
        },
        error: (xhttp, response) => {
            console.log(xhttp.status, response);
        }
    });
}

export let editNote = (id, callback) => {
    $(".userNoteSection").empty();
    $.post("/loadSelectedNote", {note: id}, response => {
        callback(response);
    });
}

export let searchYourNostes = (sess, key) => {
    $.ajax({
        url: "/searchNotes",
        method: "POST",
        data: {user: sess, search: key},
        beforeSend: () => {
            $(".notesItems").empty();
        },
        success: response => {
            if(response.length > 0)
            {
                $.each(response, (index, value) => {
                    $(".notesItems")
                    .append(`<div class="m-1 userNotesItem" id="${value.notes_id}" data-placement="bottom" data-toggle="tooltip" title="${value.name}">
                                <span class="p-0 mediaNote">
                                    <i class="fa fa-sticky-note"></i>
                                </span>
                                <span class="noteTitle">
                                    ${value.name}
                                </span>
                            </div>`);
                });
            }
            else
            {
                $(".notesItems").append(`<h3 class="text-center">No results found for this search...</h3>`);
            }
        },
        error: (xhttp, response) => {
            console.log(xhttp.status, response);
        }
    });
}

export let createNewNote = (sess, name, callback, file = null, t = null) => {
    let dataObj = null;

    if(file == null)
        dataObj = {user: sess, note: name};
    else
        dataObj = {user: sess, note: name, id: file, type: t};

    $.ajax({
        url: "/createNotes",
        method: "POST",
        data: dataObj,
        beforeSend: () => {
            // 
        },
        success: response => {
            callback(response);
            $(".noteName").val("");
        },
        error: (xhttp, response) => {
            console.log(xhttp.status, response);
        }
    });
}

export let checkNote = (u, t, i, callback) => {
    $.ajax({
        url: "/checkNoteFirst",
        method: "POST",
        data: {user: u, type: t, id: i},
        beforeSend: () => {
            // 
        },
        success: response => {
            callback(response);
        },
        error: (xhttp, response) => {
            console.log(xhttp.status, response);
        }
    });
}

export let saveUserNote = (id, nt) => {
    $.ajax({
        url: "/saveUserNote",
        method: "POST",
        data: {noteId: id, note: nt},
        beforeSend: () => {

        },
        success: response => {
            //Saved
            $(".notesWindow").fadeOut();
            //refresh the notes list
            $(".userNoteSection").val("");
            loadUserNotes(session.getSession);
        },
        error: (xhttp, response) => {
            console.log(xhttp.status, response);
        }
    });
}

export let iniAutoSave = (id, nt) => {
    $.ajax({
        url: "/saveUserNote",
        method: "POST",
        data: {noteId: id, note: nt},
        beforeSend: () => {

        },
        success: response => {
            $(".autosave").fadeOut();
        },
        error: (xhttp, response) => {
            console.log(xhttp.status, response);
        }
    });
}

export let autoSaveNote = (id, nt, delay) => {
    if(timer != null)
        clearTimeout(timer);

    $(".autosave").fadeIn();
    timer = setTimeout(() => {
        iniAutoSave(id, nt);
    }, delay);
}