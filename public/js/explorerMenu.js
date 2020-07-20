import 
{ 
    loadSubjectBooks, 
    loadSubjectPapers, 
    loadSubjectVideos, 
	loadSubjectEvents,
	loadSubjectProjects,
	loadDashBoard
} from "./mediaNDocsContent.js";

let activeMenu = [];

export var menuToggler = function(eventObj){
    if(activeMenu.indexOf($(eventObj).attr("for")) > -1)
    {
        activeMenu.splice(activeMenu.indexOf($(eventObj).attr("for")), 1);
        closeSubMenu(eventObj);
        //Close sub-menu
    }
    else
    {
        activeMenu.push($(eventObj).attr("for"));
        openSubMenu(eventObj);
        //Open sub-menu
    }
}

function closeSubMenu(eventObj) {
    $(`.${$(eventObj).attr("for")}`).fadeOut("fast");
}

function openSubMenu(eventObj) {
    $(`.${$(eventObj).attr("for")}`).fadeIn("fast");
}

export let subjectMenuToggle = (show = "dashboard", code = "", sess) => {
	let options = `.dashboard,
				   .subBooks, 
				   .subPapers,
				   .subVideos,
				   .subTasks, 
				   .subEvents`;

	$(options).css("display", "none");
	$(`.${show}`).css("display", "block");

	switch(show)
	{
		case "dashboard":
			loadDashBoard(sess, code);
			break;
		case "subBooks":
			loadSubjectBooks(sess, code);
			break;
		case "subPapers":
			loadSubjectPapers(sess, code);
			break;
		case "subVideos":
			loadSubjectVideos(sess, code);
			break;
		case "subEvents":
			loadSubjectEvents(sess, code);
			break;
		case "subTasks":
			loadSubjectProjects(sess, code);
			break;
	}
}