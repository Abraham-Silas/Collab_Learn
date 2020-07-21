class Template {
    constructor(subHeader, postTime, usernames, userOccupation, postSubject, postId, userID) {
        this.subHeader = subHeader;
        this.postTime = postTime;
        this.userNames = usernames;
        this.userOccupation = userOccupation;
        this.postSubject = postSubject;
        this.postID = postId;
        this.userID = userID;
        this.temp = null;
    }
    teplateStart() {
        return `<div class="row mb-2 card">`;
    }

    setProfile(id, img)
    {
        if(img == null)
            return "video/images.png";
        else
            return `${id}/profile/${img}`;
    }

    userProfile(names, user, profile)
    {
        return `<div class="viewProfile">
                    <span>
                        <img width="30" height="30" src="${this.setProfile(user, profile)}">
                        <b>${names}</b>
                    </span>
                    <span rel="${this.userID}"  class="userProfileControls">
                        <a class="far fa-envelope msgUser"> Message</a>
                        <a class="far fa-star likeUser"> Like</a>
                        <a class="fas fa-network-wired beginRoom"> Start Room</a>
                    <span>
                </div>`;
    }

    headerTemplate() {
        return `<div class="col-12 mb-1 header">
                    <div class="row m-0 p-1 title">
                        <span class="col-auto">${this.subHeader.topic}</span>
                        <i class="fa fa-ellipsis-v"></i>
                    </div>
                    <div class="postInfo" id="${this.postID}">
                        <i class="mr-2">${this.postTime}</i>
                        <i class="ml-2" rel="${this.userID}">${this.userNames}, ${this.userProfile(this.userNames, this.userID, this.subHeader.profile)}</i>
                        <i class="ml-1">${this.userOccupation}</i>
                    </div>
                </div>`;
    }
    subjectTemplate() {
        return `<div class="postSubjects"><i>${this.postSubject}</i></div>`;
    }
    footerTemplate() {
        return `<div class="p-2 controls">
                    <i class="far fa-grin-hearts" data-toggle="tooltip" rel="${this.postID}" data-placement="bottom" title="Thank You" data="Thank_You"></i>
                    <i class="far fa-grin-tears" rel="${this.postID}" data-toggle="tooltip" data-placement="bottom" title="Funny" data="Funny"></i>
                    <i class="far fa-grin-alt" rel="${this.postID}" data-toggle="tooltip" data-placement="bottom" title="Inspirational" data="Inspirational"></i>
                </div>`;
    }
    bodyTemplate() { } //Body Template!!
    templateEnd() {
        return `</div>`;
    }
    createPost() { }
}

export class TextOnly extends Template {
    constructor(subHeader, postTime, usernames, userOccupation, postSubject, postId, userID, post) {
        super(subHeader, postTime, usernames, userOccupation, postSubject, postId, userID);
        this.post = post;
    }
    bodyTemplate() {
        return `<div class="col-12 p-2 text">
                    ${this.post}
                </div>`;
    }
    createPost() {
        return `${this.teplateStart()}
                ${this.headerTemplate()}
                ${this.bodyTemplate()}
                ${this.subjectTemplate()}
                ${this.footerTemplate()}
            `;
    }
}

export class MediaText extends Template {
    constructor(subHeader, postTime, usernames, userOccupation, postSubject, postId, userID, post, imageFile) {
        super(subHeader, postTime, usernames, userOccupation, postSubject, postId, userID);
        this.post = post;
        this.imageFile = imageFile;
    }
    bodyTemplate() {
        return `<div class="col-12 p-2 text">
                    ${this.post}
                </div>
                <div class="row m-0 media">
                    <img src="/images/${this.imageFile}">
                </div>`;
    }
    createPost() {
        return `${this.teplateStart()}
                ${this.headerTemplate()}
                ${this.bodyTemplate()}
                ${this.subjectTemplate()}
                ${this.footerTemplate()}
            `;
    }
}

export class MediaOnly extends Template {
    constructor(subHeader, postTime, usernames, userOccupation, postSubject, postId, userID, imageFile) {
        super(subHeader, postTime, usernames, userOccupation, postSubject, postId, userID);
        this.image = imageFile;
    }
    bodyTemplate() {
        return `<div class="row m-0 media">
                    <img src="/images/${this.image}">
                </div>`;
    }
    createPost() {
        return `${this.teplateStart()}
                ${this.headerTemplate()}
                ${this.bodyTemplate()}
                ${this.subjectTemplate()}
                ${this.footerTemplate()}
            `;
    }
}