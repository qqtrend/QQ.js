/**
* Some helper functions for time ranges
*
* The basic data object is a simple array, where the elements are in pairs, for
* start time and end time. These are offsets from some epoch.
*
* The functions are generally neutral about the units, so can be in minutes since midnight,
* or seconds since 1970, etc., etc.
*
* Note: functions with HHMM in the function name assume minutes since midnight, and ranges
* formatted as HH:MM-HH:MM.
*
* @copyright 2014, QQ Trend Ltd.
* @license MIT
*/




/**
* @param d Array Start/end pairs
* @param start, end  The time range. Note: "0,0" is used to mean "none of the period". (e.g.
*       if start/end are minutes since midnight, and there is one list per day, then 0,0 are used
*       to add an entry for that day with no time range at all; 0,0 always replaces all existing time ranges.)
* @return Array (in same format as d, possibly modified, possibly unchanged)
*
* @todo A rare bit of logic that can be unit-tested
* @todo I'm not completely sure about all the "<" vs. "<=" logic here.
*/
function insertIntoTimeRangeList(d,start,end){
if(start == 0 && end == 0){
    return [0,0];
    }
if(!d)d=[];
for(var ix=0;ix<d.length;ix+=2){
    if(start < d[ix]){
        if(end < d[ix]){
            //It is completely before ix, so insert a new range here
            d.splice(ix,0,start,end);
            return d;
            }
        //Merge, i.e. keep same end, but extend the start earlier
        d[ix] = start;
        return d;
        }
    //TODO: start==d[ix] needs special handling??
    if(start < d[ix+1]){
        //If we reach here start comes after start of [ix], i.e. start is within current block
        if(end <= d[ix + 1]){
            //Completely inside an existing block. Nothing to do
            return d;
            }
        //Overlapping... the one issue is if it overlaps into the next region, in which case we have to join them.
        if(ix+2 == d.length){
            //This is the last pair in the list, so just extend the end time
            d[ix+1] = end;
            return d;
            }
        if(end <= d[ix+2]){
            //Fits before next range (touching is allowed)
            d[ix+1] = end;
            return d;
            }
        d[ix+1] = d[ix+2];  //Clip it to start of the next block. (NB. could merge them)
        return d;
        }
    //else must come later, so move on to next pair
    }
//If we reach here, append at end
d.push(start);
d.push(end);
return d;
}


/**
*
* @todo In future, not this version, this function could also be adapted to do cut-outs of existing ranges.
*       This would be at the "Not Found" line below.
*/
function removeFromTimeRangeList(d,start,end){
if(!d)return [];
var ix = d.indexOf(start);
if(ix < 0)return d; //Not found
if( (ix%2) != 0)return d;   //Found an end time, not a start time. Ignore.
//TODO: ought to validate that d[ix+1] == end
d.splice(ix,2);
return d;
}


/** */
function timeRangeListToHHMMString(d){
var s = '';
for(var ix=0;ix<d.length;ix+=2){
    if(ix>0)s+=',';
    s += timeRangeToHHMMString(d[ix], d[ix+1]);
    }
return s;
}


/** */
function timeRangeListSum(d){
var mins = 0;
for(var ix=0;ix<d.length;ix+=2){
    mins += d[ix+1] - d[ix];
    }
return mins;
}

/** Find the longest block in given list and return its length in minutes */
function timeRangeListLongest(d){
var v=0;
for(var ix=0;ix<d.length;ix+=2){
    var v2 = d[ix+1] - d[ix];
    if(v2 > v)v=v2;
    }
return v;
}



/** 
* Assumes mins-since midnight, and HH:MM-HH:MM format.
*/
function timeRangeToHHMMString(start,end,tsep){
tsep = tsep || '';  //Default to blank
var s = '';
var h = Math.floor(start/60);var m = start%60;
var s = ((h<10)?"0"+h:h) + tsep + ((m<10)?"0"+m:m);
s+="-";
var h = Math.floor(end/60);var m = end%60;
s += ((h<10)?"0"+h:h) + tsep + ((m<10)?"0"+m:m);
return s;
}
