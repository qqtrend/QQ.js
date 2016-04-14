/**
*
* @copyright 2013, 2014, QQ Trend Ltd.
* @license MIT
*/


/**
* This is kind of a factory for making date formatters.
*
* Note: generally better to use sugar.js for date formatting.
*
* @param A format string to use
* @return This returns an object, which has a format() function that is passed a datestamp
* @internal Adapted from http://stackoverflow.com/a/12213072/841830
* @internal An alternative is http://arshaw.com/xdate/   7.2K (3.5KB gzipped).
*     But it is slight overkill, as well really only need the .toString() formatting function.
*/
function DateFormatter(format) {
this.formatString = format;

var mthNames = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
var dayNames = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];
var zeroPad = function(number) { return ("0"+number).substr(-2,2); }

var dateMarkers = {
d:['getDate',function(v) { return zeroPad(v)}],
m:['getMonth',function(v) { return zeroPad(v+1)}],
n:['getMonth',function(v) { return mthNames[v]; }],
w:['getDay',function(v) { return dayNames[v]; }],
y:['getFullYear'],
H:['getHours',function(v) { return zeroPad(v)}],
M:['getMinutes',function(v) { return zeroPad(v)}],
S:['getSeconds',function(v) { return zeroPad(v)}],
i:['toISOString']
};

this.format = function(date) {
var dateTxt = this.formatString.replace(/%(.)/g, function(m, p) {
  var rv = date[(dateMarkers[p])[0]]();
  if ( dateMarkers[p][1] != null ) rv = dateMarkers[p][1](rv);
  return rv;
  });

return dateTxt;
}

}

var datestampFormat = new DateFormatter("%y-%m-%d");  //A global.
var YYYYMMDDFormat = new DateFormatter("%y%m%d");  //A global
var timeOfDayFormat = new DateFormatter("%H:%M");  //A global

//---------------------
//This is the JS complement of the back-end route classes.


/**
* You will call this when getting back an AJAX response from a route built
* on QQAPI\RouteWithList (or similar).
*
* NOTE: we assume error was not set; i.e. that it has already been handled.
*
* NOTE: it might throw. If it does, it is usually best to reload the top page of your
* web app (i.e. effectively delete all existing global data, and start over with fresh).
*
* @param list The array of data items sent by server. Each entry will be an array
*    with action, name and data elements. The name/data parameters are passed
*    to the helper functions. name is the global variable, and data is an
*    associative array (i.e. Javascript object, to do key/value pairs, where the value
*    is usually another object).
* @param data This is your top-level object holding all data from the server.
*    If not given then it will default it to window.qqdata, and if that does not exist it will
*    also create it.
*
* @internal We assume list will only ever have a few entries.
*
* @todo It might be useful to return an array of all objects that changed (that could
*    then trigger UI updates)?
*     
* @internal D and name are passed to each helper function, rather than D[name] as
*     a single parameter, because JavaScript is "Call-by-sharing" rather than pass-by-reference.
*     I.e. we sometimes need to assign to D[name].
*
* @todo Only one "." in a name supported currently. At some point it'd be good to make that generic, so any
*     number can be supported.
*     
* @internal We need to restore what `D` is on each pass, in case `name` on the previous iteration
*   had a dot in it and D got changed.
*/
function processNewDataList(list, data){
if(!data){
    if(!window.data)window.qqdata = {};
    data = window.qqdata;
    }
for(var ix=0;ix<list.length;++ix){
    var D = data;
    var name = list[ix].name;
    var nix = name.indexOf(".");
    if(nix>=0){  //handle name having "." in it
        if(!D[name.substr(0,nix)])throw "Name prefix ("+name.substr(0,nix)+") in name ("+name+") should already exist.";
        D=D[name.substr(0,nix)];
        name = name.substr(nix+1);
        }
    if(!D[name])throw "Name("+name+") should already exist.";
    switch(list[ix].action){
        case "DP_replace":processNewDataReplace(D,name,list[ix].data);break;
        case "DP_append":processNewDataAppend(D,name,list[ix].data);break;  //Might throw
        case "DP_update":processNewDataUpdate(D,name,list[ix].data);break;  //Might throw
        case "DP_insert":processNewDataInsert(D,name,list[ix].data);break;
        default:throw "Unexpected action ("+action+")";break;
        }
    }
}

/**
* Simplest version: replace the whole collection.
*/
function processNewDataReplace(D,name,data){
D[name]=data;
}

/**
* Used to add additional entries, that must not already be there.
*/
function processNewDataAppend(D,name,data){
for(var key in data){
    if(key in D[name])throw "key("+key+") already exists in "+name;    //Not expected to exist.
    D[name][key]=data[key];
    }
}

/**
* The complement of processNewDataAppend: the key must already exist.
*/
function processNewDataUpdate(D,name,data){
for(var key in data){
    if(key in D[name])D[name][key]=data[key];
    else throw "key("+key+") should already exist in "+name+" but does not.";    //Expected to exist.
    }
}

/**
* Like append and replace: existing data replaced, new data created.
*/
function processNewDataInsert(D,name,data){
for(var key in data)D[name][key]=data[key];
}


