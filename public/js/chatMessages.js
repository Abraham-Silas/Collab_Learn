import { checkForNewChats, received_message_view, sent_message_view } from "./posts.js";

export class ChatMessages{
    constructor(users){
        this.users = users; //An instance of the OnlineUsers class inheriting from Sessions
        this.textMsg = "";
        this.receiver = "";
        this.newMessage = "";
        this.sentMessage = "";
    }

    /**
     * @param {string} t
     */
    set setText(t)
    {
        this.textMsg = t;
    }

    /**
     * @param {string} r
     * @param {any} _r
     */
    set setReceiver(_r)
    {
        this.receiver = _r;
    }

    /**
     * @param {any} _msg
     */
    set setSentMessage(_msg)
    {
        this.sentMessage = _msg;
    }

    get getText()
    {
        return this.textMsg;
    }

    get getReceiver()
    {
        return this.receiver;
    }

    get getSentMessage()
    {
        return this.sentMessage;
    }

    sendNewMessage(data)
    {
        this.setText = data.message;
        this.setReceiver = data.msgTo;

        if(this.getReceiver.length != 0)
        {
            this.setSentMessage = `<div class="m-1 chat-message-container">
                        <span class="chat-message">
                            ${message_view(data.message, data.media_file, data.mimetype)}
                        </span>
                    </div>`;
            $(".chat-controls textarea, #attachFile").val("");
            $(".chat-body").append(this.getSentMessage);
        }
        else
        {
            return false;
        }
    }    

    errors()
    {
        if(this.getText.length == 0){
            alert("Message cannot be empty!");
        }
        else if(this.getReceiver.length == 0){
            alert("Please select a user before sending any message!");
        }
    }
    
    //Receiving this Message
    newActiveMessage(data)
    {
        $(".chat-body")
        .append(`<div class="p-1 m-1 chat-message-container">
                <span class="sent-message">
                    ${message_view(data.message, data.media_file, data.mimetype)} 
                </span>
            </div>`);
    }

    //Seding Message ////////////////////////////////////////////////////////////////
    sendingMessage(data, file, mime)
    {
        $(".chat-body")
        .append(`<div class="m-1 chat-message-container">
                    <span class="chat-message">
                        ${message_view(data, file, mime)}
                    </span>
                </div>`);
    }

    receivingMessage(data, file, mime)
    {
        $(".chat-body")
        .append(`<div class="p-1 m-1 chat-message-container">
                <span class="sent-message">
                    ${message_view(data, file, mime)} 
                </span>
            </div>`);
    }

    newInActiveMessage(data)
    {
        $(".recent-chats-container")
        .append(`<div class="chatItem" id="rm_${data.msgFrom}">
                    <div class="m-0 p-1">
                        <img class="rounded-circle" src="${data.msgFrom}/profile/${data.profile}" width="35" height="35">
                        <span class="ml-1">${data.user}</span>
                    </div>
                    <div class="m-0 p-1" id="user_${data.msgFrom}">
                        <p>${data.message}</p>
                    </div>
                    <div class="m-0 p-1">
                        <span class="reply">
                            <b class="mr-1" rel="${data.msgFrom}">Reply<i class="ml-1 fa fa-reply"></i></b>
                        </span>
                        <span class="markRead" style="float: right;">
                            <b class="mr-1" rel="${data.msgFrom}">Read<i class="ml-1 fa fa-box-open"></i></b>
                        </span>
                    </div>
                </div>`);
    }

    loadChatMessages(friend)
    {
        $.ajax({
			url: "/loadChatMessages",
			method: "POST",
			data: {me: this.users.getSession, chat: friend},
			beforeSend: () => {
                $(".msgsContainer").empty();
			},
			success: response => {
				$.each(response, (index, value) => {
					if(value.msgTo == this.users.getSession)
					{
						$(".msgsContainer")
						.append(received_message_view(value.message, value.media_file, value.mimetype));
					}
					else
					{
						$(".msgsContainer")
						.append(sent_message_view(value.message, value.media_file, value.mimetype));
					}
				});
                $(".msgsContainer").scrollTop($(".msgsContainer")[0].scrollHeight);
			},
			error: (xhr, errMsg) => {
				console.log(xhr.status, errMsg);
			}
		});
		$(".messageTextField").fadeIn(200);
    }

    chats(){
        let msgStats = null;
        let id = null;
        $.ajax({
			url: "/loadChats",
			method: "POST",
			data: {userID: this.users.getSession},
			beforeSend: function(){
				$(".chatsList").empty();
			},
			success: response => {
                if(response.length > 0)
                {
                    $.each(response, (index, value) => {
                        if(value.msgFrom != undefined)
                            id = value.msgFrom;
                        else
                            id = value.sentFrom;

                        if(value.msgStatus != undefined)
                        {
                            $(".chatsList").prepend(`<li class="list-group-item" id="chat_${id}" data="${id}">
                                <img width="40" height="40" src="${id}/profile/${value.profile}">
                                <strong>${value.name} ${value.surname}</strong>
                                <i class="fas fa-circle"></i>
                            </li>`);
                        }
                        else
                        {
                            $(".chatsList").append(`<li class="list-group-item" id="chat_${id}" data="${id}">
                                <img width="40" height="40" src="${id}/profile/${value.profile}">
                                <strong>${value.name} ${value.surname}</strong>
                                <i class="fas fa-circle" style="display: none;"></i>
                            </li>`);
                        }
                    });
                }
                else{
                    $(".chatsList").html(`
                            <div class="text-center userChatHistory">
                                <p class="text-center">No chats yet...</p>
                                <button class="btn btn-default startConv">Start Chat</button>
                            </div>
                        `);
                }
			},
			error: (xhr, errMsg) => {
				alert(xhr.code +", "+ errMsg);
			}
		});
    }

    loadUsers()
    {
        $.ajax({
			url: "/loadRecentChats",
			method: "POST",
			data: {userID: this.users.getSession},
			beforeSend: function(){
				$(".chatsList").empty();
			},
			success: response => {
				$.each(response, (index, value) => {
                    $(".chatsList").append(`<li class="list-group-item" id="${value.msgFrom}" data="${value.name} ${value.surname}">
                            <img width="40" height="40" src="${value.msgFrom}/profile/${value.profile}">
                            <strong>${value.name} ${value.surname}</strong>
                            <i class="fas fa-circle" style="display: ${msgStats};"></i>
                        </li>`);
				});
			},
			error: (xhr, errMsg) => {
				alert(xhr.code +", "+ errMsg);
			}
		});
    }

    clearMsgView(){
		$(".messageTextField").fadeOut();
		$(".msgsContainer").empty();
    }
    
    openMessageWindow(){
        $(".messagesWin").fadeIn();
    }

    closeMessageWindow(){
        $(".messagesWin").fadeOut();
    }
}

export let smileys = ['&#9748;', '&#9749;', '&#9752;', '&#9200;', '&#9800;', '&#9801;', '&#9802;', '&#9803;', '&#9804;', 
'&#9805;', '&#9806;', '&#9807;', '&#9808;', '&#9809;', '&#9810;', '&#9811;', '&#9855;', '&#9889;', '&#9918;', '&#9917;', '&#9924;', '&#9925;', '&#9934;', '&#9940;', 
'&#9962;', '&#9970;', '&#9971;', '&#9973;', '&#9977;', '&#9978;', '&#9981;', '&#9989;', '&#9994', '&#9995;', '&#9996;', '&#9997;', '&#10024;', '&#10060;', '&#10062;', '&#10067;', '&#10068;', '&#10069;', '&#10071;', 
'&#10160;', '&#10175;', '&#9193;', '&#9194;', '&#9195;', '&#9196;', '&#9197;', '&#9199;', '&#9201;', '&#9202;', '&#9203;', '&#9209;','&#8986;', '&#9757;'];

let message_view = (message, file, mime) => {
    if(file == null)
    {
        return message;
    }
    else
    {
        var extensions = ["image/jpg", "image/jpeg", "image/png", "image/gif"];

        if(extensions.indexOf(mime) != -1)
        {
            return `<div class="pt-1 prvMsgMedia">
                        <img width="290" height="150" src="media/${file}">
                        <div class="m-0 vdMsg">
                            ${message}
                        </div>
                    </div>`;
        }
        else
        {
            return `<div class="pt-1 prvMsgMedia">
                        <video width="290" height="150" src="media/${file}"></video>
                        <div class="m-0 vdMsg">
                            ${message}
                        </div>
                    </div>`;
        }
    }
}
