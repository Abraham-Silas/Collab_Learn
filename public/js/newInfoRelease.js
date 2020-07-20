class Template{
    constructor(subHeader, postTime, usernames, userOccupation, postSubject, postId, userID)
    {
        this.subHeader = subHeader;
        this.postTime = postTime;
        this.userNames = usernames;
        this.userOccupation = userOccupation;
        this.postSubject = postSubject;
        this.postID = postId;
        this.userID = userID;
        this.temp = null;
    }

    teplateStart()
    {
        return `<div class="row mb-2 card">`;
    }

    headerTemplate()
    {
        return `<div class="col-12 mb-1 header">
                    <div class="row m-0 p-1 title">
                        <span class="col-auto">${this.subHeader}</span>
                    </div>
                    <div class="postInfo">
                        <i class="mr-2">${this.postTime}</i>
                        <i class="ml-2" rel="${this.userID}">${this.userNames},</i>
                        <i class="ml-1">${this.userOccupation}</i>
                    </div>
                </div>`;
    }

    subjectTemplate()
    {
        return `<div class="postSubjects"><i>${this.postSubject}</i></div>`;
    }

    footerTemplate()
    {
        return `<div class="p-2 controls">
                    <i class="far fa-handshake" data-toggle="tooltip" rel="${this.postID}" data-placement="bottom" title="Thank You"></i>
                    <i class="far fa-heart" rel="${this.postID}" data-toggle="tooltip" data-placement="bottom" title="I Love This"></i>
                    <i class="far fa-grin-hearts" rel="${this.postID}" data-toggle="tooltip" data-placement="bottom" title="WoW"></i>
                </div>`;
    }

    bodyTemplate(){} //Body Template!!

    templateEnd()
    {
        return `</div>`;
    }

    createPost(){}
}

class TextOnly extends Template{
    constructor(subHeader, postTime, usernames, userOccupation, postSubject, postId, userID, post){
        super(subHeader, postTime, usernames, userOccupation, postSubject, postId, userID);
        this.post = post;
    }

    bodyTemplate()
    {
        return `<div class="col-12 p-2 text">
                    ${this.post}
                </div>`;
    }

    createPost(){
        return `${this.teplateStart()}
                ${this.headerTemplate()}
                ${this.bodyTemplate()}
                ${this.subjectTemplate()}
                ${this.footerTemplate()}
            `;
    }    
}

class MediaText extends Template{
    constructor(subHeader, postTime, usernames, userOccupation, postSubject, postId, userID, post, imageFile){
        super(subHeader, postTime, usernames, userOccupation, postSubject, postId, userID);
        this.post = post;
        this.imageFile = imageFile;
    }

    bodyTemplate()
    {
        return `<div class="col-12 p-2 text">
                    ${this.post}
                </div>
                <div class="row m-0 media">
                    <img src="./images/${this.imageFile}">
                </div>`;
    }

    createPost(){
        return `${this.teplateStart()}
                ${this.headerTemplate()}
                ${this.bodyTemplate()}
                ${this.subjectTemplate()}
                ${this.footerTemplate()}
            `;
    }   
}

class MediaOnly extends Template{
    constructor(subHeader, postTime, usernames, userOccupation, postSubject, postId, userID, imageFile){
        super(subHeader, postTime, usernames, userOccupation, postSubject, postId, userID);
        this.image = imageFile;
    }

    bodyTemplate()
    {
        return `<div class="row m-0 media">
                    <img src="./images/${this.image}">
                </div>`;
    }

    createPost(){
        return `${this.teplateStart()}
                ${this.headerTemplate()}
                ${this.bodyTemplate()}
                ${this.subjectTemplate()}
                ${this.footerTemplate()}
            `;
    }   
}

module.exports.TextOnly = TextOnly;
module.exports.MediaOnly = MediaOnly;
module.exports.MediaText = MediaText;