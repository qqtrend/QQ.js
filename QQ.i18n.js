/**
* Minimal i18n helper
*
* @copyright Darren Cook, 2013
* @licence MIT
*/

/**
* Missing translations are added (as keys) here.
*
* Set this to an empty object, to have them stored.
* Set this to true, instead, to have them logged to console.
* Set to false or null, to have them quietly ignored.
*
* @internal The default is chosen to give minimal load.
*/
var missingTranslation=null;

/** 

* @internal I started with this simple version:
        var s = translations[txt];
        if(!s)s=txt;
        return s;
* I didn't like that:
*    a) we might want translations=null for English (though unlikely to do
*        that any more, as things like icon labels are always there).
*    b) no way to mark a translation as "not done yet".
*
* Regarding the second point, both not there (undefined) and explicitly
* set to null will generate the console.log message.
*
* @todo Block out the lines mentioning "missingTranslation" in production?
*/
function T(txt){
if(!translations)return txt;    //Can be commented out if we are sure translations is always defined.
var s = translations[txt];
if(s !== undefined  && s!==null)return s;
if(!missingTranslation)return txt;
if(missingTranslation===true)console.log("Missing translation for:"+txt);
else missingTranslation[txt]=true;
return txt;
}



/** 
* Returns a duration as something human-readable in hours (and maybe minutes).
*
* Support for English and Japanese so far.
*
* @param durationMins The number of minutes
* @param lang The language. 'ja' and 'en' supported, with 'en' being used for all other values.
* @return string
*
* @internal The per-language is broken up coarsely, so that it could actually be
*    split off, and only required language-handling loaded.
*/
function durationMinsToString(durationMins, lang){
if(lang == 'ja'){
    var duration_hour = Math.floor(durationMins/60);
    var duration_mins = durationMins%60;
    if(duration_hour == 0)s = duration_mins + "分間";
    else{
        s = duration_hour;
        switch(durationMins%60){
            case 15:s+="&frac14;";break;
            case 30:s+="&frac12;";break;
            case 45:s+="&frac34;";break;
            }
        s+="時間"
        }
    }
else{   //Use English output as the default
    if(durationMins<60){
        s=durationMins + "mins";
        }
    else{
        var duration_hour = Math.floor(durationMins/60);
        var s = duration_hour;
        switch(durationMins%60){
            case 0:s+=" hour";if(duration_hour>1)s+="s";break;
            case 15:s+="&frac14; hours";break;
            case 30:s+="&frac12; hours";break;
            case 45:s+="&frac34; hours";break;
            default:s+="hr "+durationMins+"mins";break;
            }
        }
    }
return s;
}



/**
* Returns the postcode tidied up, and checked
*
* @todo Only supports Japanese and UK postcodes so far
*     Note: HK does not use postcodes, so easy to add support for that?
*
* @param address An object that is expected to have a "postcode" field, and a
*       "country" field (containing a 2-letter country code).
*       If country is "ja" it expects 7 digits, and it will put a hyphen after the first 3 digits.
*           (If 3 digits, it accepts that too.)
*           It copes with whitespace anywhere.
*           Anything else shows a blank string.
*       If country is "uk", it makes it uppercase and expects [A-Z][A-Z]?[0-9]{1,2}[A-Z]?\s*[0-9][A-Z]{2}. The whitespace in the middle is always changed to be a single space.
*          @todo: Actually A99A and AA99A are not allowed. I.e. if two digits then it can never be followed by another letter.
*           @todo In fact [A-Z] is too liberal. see the wiki page for details.
*           @todo Are we supposed to support overseas territories as part of "uk"? They allow 4 letters as
*               the first part, with no digits. And Anguilla is A1-2640.
* @return The postcode tidied up. If invalid (or not given) then "" is returned.
*
* @internal Reference for UK postcodes: http://en.wikipedia.org/wiki/Postcodes_in_the_United_Kingdom
*
* @todo MOVE this to the open source library. In fact move the logic to another
*       function (e.g. part of jquery validate?), and then just have this helper use that.
*       The reason is that this logic overlaps with validation.
*       ---> In fact, see jppostcode in html_flexdesk.js and formatAddress(), where
*           we are already duplicating quite a bit of this logic!
*/
function normalizeAndValidatePostcode(address){
if(!address)return "";
var s = address.postcode;
if(!s)return "";
if(address.country=='uk'){
    s = s.toUpperCase();
    s = s.replace(/\s/g,'');    //Remove whitespace anywhere in the string (to make next regex cleaner)
    if(!/^[A-Z][A-Z]?[0-9]{1,2}[A-Z]?[0-9][A-Z]{2}$/.test(s))return "";
    s.replace(/^([A-Z][A-Z]?[0-9]{1,2}[A-Z]?)([0-9][A-Z]{2})$/,"$1 $2");
    }
else if(address.country=='jp'){
    s = s.replace(/\s/g,'');    //Remove whitespace anywhere in the string (to make next regex cleaner)
    if(/^[0-9]{3}$/.test(s))return s;   //Allow special case of just 3 digits
    if(!/^([0-9]{3})-?([0-9]{4})$/.test(s))return "";
    return s.replace(/^([0-9]{3})-?([0-9]{4})$/, "$1-$2");
    }
else return s;  //No checks or formatting when country is unknown
}





/**
* Formats an address allowing for the language, the country, and coping with missing fields.
*
* @param Object address Expected to have country, address1, address2, address3
*       fields, then optionally prefecture/state/county, postcode, and maybe others depending on
*       the country.
* @param Object options These keys:
*       lang: Two-letter language code. E.g. "ja" vs. "en" are supported when country is "jp".
*
* @todo Does Google Maps already have some code we could be using?
*/
function formatAddress(address, options){
var s='';
if(address.country=='jp'){
    var postcode = address.postcode.substr(0,3);
    if(address.postcode.length>3)postcode += "-" + address.postcode.substr(3,4);
    if(options.lang=='ja'){
        if(address.postcode)s+="〒"+postcode;
        if(address.prefecture)s+=FDX.jpPrefectureNames[address.prefecture];
        if(address.address1)s+=address.address1;
        if(address.address2)s+=address.address2;
        if(address.address3)s+=address.address3;
        }
    else{   //English, etc. still go from local to global
        if(address.address3)s+=address.address3+", ";
        if(address.address2)s+=address.address2+", ";
        if(address.address1)s+=address.address1+", ";
        if(address.prefecture)s+=FDX.jpPrefectureNames[address.prefecture]+", ";
        if(address.postcode)s+=postcode;
        }
    }
else{   //For all other countries, just go from local to global, whatever the language
    if(address.address3)s+=address.address3+", ";
    if(address.address2)s+=address.address2+", ";
    if(address.address1)s+=address.address1+", ";
    if(address.postcode)s+=postcode;
    }
return s;
}




//========================================

/**
* This is my minimal i18n helper
*
* Note: does nothing if Handlebars not already been included
*/
if(Handlebars)Handlebars.registerHelper("_", T);


/** Add a "postcode" handlebars helper for validating postcodes */
if(Handlebars)Handlebars.registerHelper("postcode", normalizeAndValidatePostcode);






/**
* Add helper function to jQuery-Validation (if being used)
*
* NOTE: because it immediately evaluates T() here, it requires translations to already
* have been loaded.
*
* @todo That loading order thing is a bit of an awkward dependency.  I don't have a good
*  solution yet. E.g. we could wrap this in a one-second timer (to give translations time to load),
*  but that goes wrong if a form tries to use jppostcode in that second.
*  Using Futures seems a bit of overkill, complicating various other code.
*  So, my current solution of not including QQ.i18n.js until after translations have been loaded/defined
*  is good enough for the moment.
*/
if($.validator)$.validator.addMethod('jppostcode',function(value,element){
    value = value.hankaku('all');    //Part of sugar.js
    value = value.replace('ｰ','-'); //Convert hankaku katakana hyphen to ascii hyphen
    value = value.replace('−','-'); //Convert zenkaku hyphen to ascii hyphen
    $(element).val(value);  //Update field on the form
    return /^\d{3}-?\d{4}$/.test(value);
    },T("Please enter a valid Japanese 7-digit postcode"));


