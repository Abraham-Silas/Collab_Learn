export class Node{
    constructor(key = null, subj = null){
        this.code = key;
        this.name = subj;
        this.next = null;
    }
}

class Subjects{
    constructor(obj){
        this.head = obj;
        this.length = 1;
    }

    addSubjects(key, value)
    {
        if(this.isEmpty())
        {
            let newNode = new Node(key, value);
            this.head = newNode;
            this.length++;
        }
        else
        {
            let newNode = new Node(key, value);
            let nodePtr = this.head;

            while(nodePtr.next != null)
            {
                nodePtr = nodePtr.next;
            }

            newNode.next = null;
            nodePtr.next = newNode;
            this.length++;
        }
    }

    removeSubjects(key, value)
    {
        if(this.isEmpty())
        {
            this.head = null;
        }
        else
        {
            //Checking if the item is first in the list!!
            if(this.head.code == key && this.head.name == value)
            {
                this.length--;
                if(this.length > 1)
                    this.head = this.head.next;
                else
                {
                    this.head = new Node();
                    hideSaveBtn();
                }
            }
            else
            {
                let nodePtr = this.head;
                while(nodePtr.next != null && nodePtr.next.code != key && nodePtr.next.name != value)
                {
                    nodePtr = nodePtr.next;
                }

                //If Prev exists
                if(nodePtr != null)
                {
                    this.length--;
                    nodePtr.next = nodePtr.next.next;
                }
            }
        }
    }

    isEmpty()
    {
        return this.length == 1;
    }

    saveSubjectsList()
    {
        let nodePtr = this.head;
        while(nodePtr != null)
        {
            $(".classList").append(`<div class="btn btn-link" data="${nodePtr.code}">${nodePtr.name}</div>`);
            nodePtr = nodePtr.next;
        }
        $(".addNewSubjects").fadeOut();
    }

    displaySubjects()
    {
        let nodePtr = this.head;
        while(nodePtr != null)
        {
            console.log(JSON.stringify(nodePtr));
            nodePtr = nodePtr.next;
        }
    }
}

let subObj = new Subjects(new Node());

export function setSubjectListHeight(){
	let subHeight = parseInt($(".newSubjectsWindow").height()) - (parseInt($(".newSubHeader").height() + parseInt($(".searchSubject").height()) + 67));
    $(".list, .savedSubjects").css({
        "height" :  `${subHeight}px`
    });
}

export function chooseSubjects(event){
    $(".savedSubjects").append(subjectAddControl(event));
    displaySaveBtn();
    $(event).fadeOut();
    subObj.addSubjects(event.id, $(event).text());
}

function displaySaveBtn() {
    $(".saveSubjects").fadeIn("fast");
}

function hideSaveBtn(){
    $(".saveSubjects").fadeOut("fast");
}

function subjectAddControl(e){
    return `<button class="m-1 btn btn-dark form-control DS">${$(e).text()}<i class="far fa-times-circle" rel="${e.id}"></i></button>
    `;
}

export function removeSubjects(e){
    $(e).parent().fadeOut();
    $(`#${$(e).attr("rel")}`).fadeIn();
    subObj.removeSubjects($(e).attr("rel"), $(e).parent().text());
}

export function save(){
    $(".classList").empty();
    subObj.saveSubjectsList();
}

export var saveSubjects = function(sess, subjects)
{
    $.ajax({
        url: "/saveYourSubjects",
        method: "POST",
        data: {id: sess, dataArray: subjects},
        success: function(data){
            location.reload(true);
        },
        error: function(xhr){
            console.log(xhr.status);
        }
    });
}

let btnColors = ['dark', 'primary', 'success', 'warning', 'info', 'danger'];

export var loadSubjects = function(sess)
{
    $.ajax({
        url: "/loadSubjects",
        method: "POST",
        data: {id: sess},
        beforeSend: function()
        {
            $(".addNewSubjects").fadeIn();
            $(".list").empty();
            $(".newSubHeader i").css("display", "block");
            setSubjectListHeight();
        },
        success: function(data){
            $.each(data, (key, value) => {
                if(value != null)
                {
                    var rand = Math.floor(Math.random() * btnColors.length);
                    $(".list").append(`<button class="m-1 btn btn-${btnColors[rand]}" id="${value.subject_code}">${value.subject_name}</button>`);
                }
            });
        },
        error: function(xhr){
            console.log(xhr.status);
        }
    });
}