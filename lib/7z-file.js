
var File = function (name,created_time,modified_time,access_time,buffer_data){
    
    this._name = name;
    this._created_time = (created_time) ? created_time : null;
    this._modified_time = (modified_time) ? modified_time : null;
    this._access_time = (access_time) ? access_time : new Date();
    this._buffer = (buffer_data) ? buffer_data : new Buffer();
    
    
    this.getName = function(){
        return this._name;
    }
    
    this.getTime = function(){
        
        var date = {
            access_time: this._access_time,
        }
        
        if(this._modified_time){
            date.modified_time = this._modified_time;
        }
        
        if(this._created_time){
            date.created_time = this._created_time;
        }
        
        return date;
    }
    
    this.getSize = function(){
        return this._buffer.length;
    }
    
    this.getData = function(){
        return this._buffer;
    }
}

module.exports = File;