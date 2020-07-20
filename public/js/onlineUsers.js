import { Sessions } from "./sessions.js"

export class OnlineUsers extends Sessions
{
    constructor(sess)
    {
        super(sess);
        this.users = "";
        this.data = null;
        this.chatActive = false;
        this.activeUser = null;
    }

    /**
     * @param {any} data
     */
    set setData(data)
    {
        this.data = data;
    }

    /**
     * @param {any} yn
     */
    set setIsActive(yn)
    {
        this.chatActive = yn;
    }

    /**
     * @param {any} user
     */
    set setActiveUser(user)
    {
        this.activeUser = user;
    }

    get getIsActive()
    {
        return this.chatActive;
    }

    get displayActiveUsers()
    {
        return this.storeUsers(this.data);
    }

    get getActiveUser()
    {
        return this.activeUser;
    }

    resetStoredUsers()
    {
        //Reset users so that a new list can be generated!!
        this.users = "";
    }

    storeUsers(data)
    {
        this.resetStoredUsers();
        console.log(data);
        for(var i = 0; i < data.length; i++)
        {
            if(data[i].user_id != this.getSession){
                this.users += `<div class="m-0 row online-chat" id="${data[i].user_id}">
                        <div class="m-0 p-1">
                            <img class="rounded-circle" src="${data[i].user_id}/profile/${data[i].profile}" width="35" height="35">
                            <span class="ml-1">${data[i].name} ${data[i].surname}</span>
                        </div>
                    </div>`;
            }
        }

        if(this.users == "")
            return `<div class="text-center ml-2" style="position: relative; width: 100%; margin-top: 50%; font-size: 18pt; text-align: center; font-weight: lighter;">No Active Chats Yet...</div>`;
        else
            return this.users;
    }
}