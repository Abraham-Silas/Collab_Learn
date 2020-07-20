import 
{ 
    month,
    getNowDate
 } 
 from "./posts.js";

export var userMedia = function(sess)
{
    $.ajax({
        url: "/loadUserMediaFiles",
        method: "POST",
        data: {vidsFor: sess},
        beforeSend: function(){
            $(".mainPlayer video").attr("src", "");
            $(".videosCollection, .imagesCollection, .audioColections").empty();
        },
        success: function(respose){
            if(respose.length > 0)
            {
                $.each(respose, (key, value) => {
                    switch(value.media_type)
                    {
                        case "Video":
                            $(".videosCollection")
                            .prepend(`<div class="p-0 mb-1" data-placement="bottom" data-toggle="tooltip" title="${value.file_description}">
                                        <span class="mt-1 ${value._id}">
                                            <video style="object-fit: cover;" oncontextmenu="return false;" id="vid_${value._id}" src="${value.user_id}/media/videos/${value.media_file}"></video>
                                            <i class="spinner-border"></i>
                                            <span>
                                                <b class="fas fa-expand vFullScreen"></b>
                                                <b class="fas fa-glasses vStudy"></b>
                                            </span>
                                        </span>
                                        <span>
                                            <i class="far fa-play-circle" rel="${value._id}"></i>
                                            <i data-placement="bottom" data-toggle="tooltip" title="${value.file_description}">${value.file_description}</i>
                                        </span>
                                    </div>`);
                            break;
                        case "Images":
                            $(".imagesCollection")
                            .append(`<div data-placement="bottom" data-toggle="tooltip" title="${value.file_description}">
                                        <img oncontextmenu="return false;" id="${value._id}" src="${value.user_id}/media/images/${value.media_file}">
                                        <i data-placement="bottom" data-toggle="tooltip" title="${value.file_description}">${value.file_description}</i>
                                    </div>`);
                            break;
                        case "Audio":
                            $(".audioColections")
                            .append(`<div class="p-0 mb-1 fileContent" oncontextmenu="return false;" data="${value.media_file}" data-placement="bottom" data-toggle="tooltip" title="${value.file_description}">
                                        <div class="m-0 ${value._id}">
                                            <audio  src="${value.user_id}/media/audios/${value.media_file}"></audio>
                                        </div>
                                        <div>
                                            <i class="far fa-play-circle" rel="${value._id}"></i>
                                            <i data-placement="bottom" data-toggle="tooltip" title="${value.file_description}">${value.file_description}</i>
                                        </div>
                                    </div>`);
                            break;
                    }
                });
                $(".userContent").fadeIn();
            }
            else{
                alert("You don't have any saved media yet...");
            }
        },
        error:function(textstatus, code){
            console.log(code, textstatus);
        }
    });
}

export var userDocuments = function(sess)
{
    $.ajax({
        url: "/loadUserDocumentFiles",
        method: "POST",
        data: {docsFor: sess},
        beforeSend: function(){
            $(".docuContent").empty();
        },
        success: function(respose){
            if(respose.length > 0)
            {
                $.each(respose, (key, value) => {
                    switch(value.doc_type)
                    {
                        case "book":
                            $(".docuContent")
                            .append(`<div class="p-0 mb-1" id="${value._id}" rel="${value.user_id}/documents/books/${value.file}" data-placement="bottom" data-toggle="tooltip" title="${value.file_description}">
                                        <span class="mt-1">
                                            <i class="far fa-file-pdf"></i>
                                        </span>
                                        <span>
                                            <a id="${value._id}" href="${value.user_id}/documents/books/${value.file}">${value.file_description}</a>
                                        </span>
                                    </div>`);
                            break;
                        case "paper":
                            $(".docuContent")
                            .append(`<div class="p-0 mb-1" id="${value._id}" rel="${value.user_id}/documents/papers/${value.file}" data-placement="bottom" data-toggle="tooltip" title="${value.file_description}">
                                        <span class="mt-1">
                                            <i class="far fa-file-pdf"></i>
                                        </span>
                                        <span>
                                            <a id="${value._id}" href="${value.user_id}/documents/papers/${value.file}">${value.file_description}</a>
                                        </span>
                                    </div>`);
                            break;
                    }
                });
                $(".documentsWindow").fadeIn();
            }
            else
            {
                alert("You don't yet have any docs saved yet...");
            }
        },
        error: function(errorText, errorStatus){
            console.log(errorStatus.status, errorText);
        }
    });
}

export var searchDocs = function(sess, key)
{
    $.ajax({
        url: "/searchDocs",
        method: "POST",
        data: {docsFor: sess, sKey: key},
        beforeSend: function(){
            $(".docuContent").empty();
        },
        success: function(respose){
            if(respose.length > 0)
            {
                $.each(respose, (key, value) => {
                    switch(value.doc_type)
                    {
                        case "book":
                            $(".docuContent")
                            .append(`<div class="p-0 mb-1" id="${value._id}" rel="${value.user_id}/documents/books/${value.file}" data-placement="bottom" data-toggle="tooltip" title="${value.file_description}">
                                        <span class="mt-1">
                                            <i class="far fa-file-pdf"></i>
                                        </span>
                                        <span>
                                            <a id="${value._id}" href="${value.user_id}/documents/books/${value.file}">${value.file_description}</a>
                                        </span>
                                    </div>`);
                            break;
                        case "paper":
                            $(".docuContent")
                            .append(`<div class="p-0 mb-1" id="${value._id}" rel="${value.user_id}/documents/papers/${value.file}" data-placement="bottom" data-toggle="tooltip" title="${value.file_description}">
                                        <span class="mt-1">
                                            <i class="far fa-file-pdf"></i>
                                        </span>
                                        <span>
                                            <a id="${value._id}" href="${value.user_id}/documents/papers/${value.file}">${value.file_description}</a>
                                        </span>
                                    </div>`);
                            break;
                    }
                });
                $(".documentsWindow").fadeIn();
            }
            else
            {
                $(".docuContent").html(`<h2 class="text-center">Search results not found!</h2>`);
            }
        },
        error: function(errorText, errorStatus){
            console.log(errorStatus.status, errorText);
        }
    });
}

export var loadBooks = (sess) => {
    $.ajax({
        url: "/loadUserBooks",
        method: "POST",
        data: {docsFor: sess},
        beforeSend: function(){
            $(".docuContent").empty();
        },
        success: function(respose){
            $.each(respose, (key, value) => {
                $(".docuContent")
                .append(`<div class="p-0 mb-1" id="${value._id}" rel="${value.user_id}/documents/books/${value.file}" data-placement="bottom" data-toggle="tooltip" title="${value.file_description}">
                            <span class="mt-1">
                                <i class="far fa-file-pdf"></i>
                            </span>
                            <span>
                                <a id="${value._id}" href="${value.user_id}/documents/books/${value.file}">${value.file_description}</a>
                            </span>
                        </div>`);
            });
        }
    });
}

export var loadPapers = (sess) => {
    $.ajax({
        url: "/loadUserPapers",
        method: "POST",
        data: {docsFor: sess},
        beforeSend: function(){
            $(".docuContent").empty();
        },
        success: function(respose){
            $.each(respose, (key, value) => {
                $(".docuContent")
                .append(`<div class="p-0 mb-1" id="${value._id}" rel="${value.user_id}/documents/papers/${value.file}" data-placement="bottom" data-toggle="tooltip" title="${value.file_description}">
                            <span class="mt-1">
                                <i class="far fa-file-pdf"></i>
                            </span>
                            <span>
                                <a id="${value._id}" href="${value.user_id}/documents/papers/${value.file}">${value.file_description}</a>
                            </span>
                        </div>`);
            });
        }
    });
}

export let loadDocNotes = id => {
    $('.pdfBody .userTextNotes').val("");
    $.post("/loadSelectedNote", {note: id}, response => {
        document.getElementsByClassName('userTextNotes')[0].value = response.description;
    });
}

export let loadMediaNotes = id => {
    $('.vBody .userTextNotes').val("");
    $.post("/loadSelectedNote", {note: id}, response => {
        document.getElementsByClassName('userTextNotes')[1].value = response.description;
    });
}

export let enterTheDocumentsStudyMode = (title, path, file_id, sess) => {
    let node = document.createElement("embed");
    let text = document.createTextNode(title, path);
    node.src = path;
    node.width = "100%";
    node.height = "100%";
    document.getElementsByClassName('pdfView')[0].appendChild(node);
    document.getElementsByClassName('pdfTitle')[0].appendChild(text);
    $(".studyModeWin").fadeIn();
}

export let enterTheVideoStudyMode = (path, cTime, vDescription, file_id) => {
    let newVideo = document.createElement('video');
    newVideo.src = path;
    newVideo.currentTime = cTime;
    newVideo.play();
    document.getElementsByClassName('videoView')[0].appendChild(newVideo);
    document.getElementsByClassName('vTitle')[0].innerHTML = vDescription;
    $(".vStudyModeWin").fadeIn();
}

export let loadSubjectBooks = (sess, code) => {
	$("#bookItems").empty();
	$.post("/getSubjectItems", {user: sess, subject: code, format: "book"}, response => {
		if(response.length > 0)
		{
			$.each(response, (index, value) => {
				$("#bookItems")
				.append(`<span class="fileItemObj" data="document" id="${value._id}" rel="${value.user_id}/documents/books/${value.file}">
							<span>
								<img src="extra/img/bookCover.jpg"/>
							</span>
							<span style="word-break: break-all;">
								${value.file_description}
							</span>
						</span>`);
			});
		}
		else
		{
			$("#bookItems")
				.append(`<h3 class="text-center">You have no saved books yet...</h3>`);
		}
	});
}

export let loadSubjectPapers = (sess, code) => {
	$("#paperItems").empty();
	$.post("/getSubjectItems", {user: sess, subject: code, format: "paper"}, response => {
		if(response.length > 0)
		{
			$.each(response, (index, value) => {
				$("#paperItems")
				.append(`<span class="fileItemObj" data="document" id="${value._id}" rel="${value.user_id}/documents/papers/${value.file}">
							<span>
								<img src="extra/img/bookCover.jpg"/>
							</span>
							<span style="word-break: break-all;">
								${value.file_description}
							</span>
						</span>`);
			});
		}
		else
		{
			$("#paperItems")
			.append(`<h3 class="text-center">You have no saved papers yet...</h3>`);
		}
	});
}

export let loadSubjectVideos = (sess, code) => {
	$("#videoItems").empty();
	$.post("/getSubjectVideoItems", {user: sess, subject: code, format: "Video"}, response => {
		if(response.length > 0)
		{
			$.each(response, (index, value) => {
				$("#videoItems")
				.append(`<span class="fileItemObj" data="media" id="${value._id}" rel="${value.user_id}/media/videos/${value.media_file}">
							<span>
								<video id="subV_${value._id}" oncontextmenu="return false;" src="${value.user_id}/media/videos/${value.media_file}"></video>
							</span>
							<span style="word-break: break-all;">
								${value.file_description}
							</span>
						</span>`);
			});
		}
		else
		{
			$("#videoItems")
			.append(`<h3 class="text-center">You have no saved videos yet...</h3>`);
		}
	});
}

export let loadSubjectEvents = (sess, code) => {
    $.ajax({
        url: "/loadEventSubjects",
        method: "POST",
        data: {userId: sess, subject: code},
        beforeSend: () => {
            $("#eventItems").empty();
        },
        success: response => {
            if(response.length > 0)
            {
                $.each(response, (index, value) => {
                    let currDate = (value.event_date).substr((value.event_date).lastIndexOf('T')+1);
                    var dt = new Date(`${value.event_date.replace(currDate, value.event_time)}`);
                    $("#eventItems")
                    .append(`<span class="fileItemObj">
                                <span>
                                    <b>${dt.getDate()+1}</b>
                                    <i>${month(dt.getMonth()+1)}</i>
                                </span>
                                <span style="word-break: break-all;">
                                    ${value.event_description}
                                </span>
                            </span>`);
                });
            }
            else
            {
                $("#eventItems")
                .append(`<h3 class="text-center">You have no upcoming events for this subject...</h3>`);
            }
        },
        error: (xhttp, statusMsg) => {
            console.log(xhttp.status, statusMsg);
        }
    });
}

export let loadSubjectProjects = (sess, code) => {
    let mon = null;
    let date = null;
    $("#projectItems").empty();
    $.post("/loadProjects", {user: sess, subject: code}, response => {
        if(response.length > 0)
        {
            $.each(response, (index, value) => {
                if(value.status != "Pending")
                {
                    let dt = new Date(`${value.date_created}`);
                    date = dt.getDate()+1;
                    mon = month(dt.getMonth()+1);
                }
                else{
                    date = "00";
                    mon = "---";
                }

                $("#projectItems")
                .append(`<span class="fileItemObj">
                            <span>
                                <b>${date}</b>
                                <i>${mon}</i>
                            </span>
                            <span style="word-break: break-all;">
                                ${value.name}
                            </span>
                        </span>`);
            });
        }
        else
        {
            $("#projectItems")
            .append(`<h3 class="text-center">You have no saved projects yet...</h3>`);
        }
    });
}

// Without TRUTH, no one can ever live in their full capacity!
export let loadDashBoard = (sess, code) => {
    $.post("/loadProjectsToBeCompleted", {user: sess, subject: code}, response => {
        $(".prj").text(response["COUNT(_id)"]);
    });

    $.post("/loadCompletedProjects", {user: sess, subject: code}, response => {
        $(".cmplt").text(response["COUNT(_id)"]);
    });

    $.post("/loadSubjectsUpcomingEvents", {user: sess, subject: code, today: getNowDate(new Date())}, response => {
        $(".evnt").text(response["COUNT(_id)"]);
    });
}