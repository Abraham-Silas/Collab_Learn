function timeSince(date) {

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

  function getNowDate(obj){
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

function getNowTime(){
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

function getDateTime(){
    return `${getNowDate(new Date())}T${getNowTime()}`;
}

module.exports.timeSince = timeSince;
module.exports.getDateTime = getDateTime;
module.exports.getNowDate = getNowDate;
module.exports.getNowTime = getNowTime;