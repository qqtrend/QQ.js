/**
* Warning: they were designed for 1.3.0. For a more reason handlebars version they may not work; there
* may also be some new functionality that means they are redundant or could be designed more efficiently.
*
* NOTE: some JS functions in this file rely on Sugar.Js extensions. E.g. escapeHTML().
*
* @copyright 2014, QQ Trend Ltd.
* @license MIT
*/


/** 
* This is to print a variable, but to print a default if it is not defined.
*
* It is the equivalent of writing:
* {{#if myVar}}{{myVar}}{{else}}{{myDefaultVar}}{{/if}}
*
* Note: you can specify multiple levels of defaults (see 3rd example below), and
* it just uses the first one that does not evaluate to false. If an argument is an object
* it is quietly ignored. If no arguments evaluate then "" is returned.
*
* Use like:  {{P myvar "default"}}
*     or:   {{P myvar myothervar}}
*     or:  {{P user.nickname user.fullName "guest"}}
*
* E.g. this:
*     {{#if caption.en}}{{caption.en}}{{else}}{{caption}}{{/if}}
* becomes:
*     {{P caption.en caption}}
*
* @internal The -1 on arguments.length is because Handlebars gives every callback
*   an additional argument, which is an object with hash and data sub-objects.
*/
Handlebars.registerHelper("P", function(){
for(var i=0;i<arguments.length-1;++i)if(arguments[i]){
    if(typeof(arguments[i])=="object"){
        //console.log("We have an object passed to P helper.:"+JSON.stringify(arguments[i]));
        continue;
        }
    return arguments[i];
    }
return "";
});


/**
 * Like truncate, but specialized for emails.
 *
 * Note that when long it will first try to split it across two lines, before using ellipsis.
 *
 * @todo The 24 length is a magic number here. I suppose we ought to offer a way
 *   to customize that.
 */
Handlebars.registerHelper("truncateEmail", function(){
var em = arguments[0];
if(em.length > 24){
    var parts = em.split("@");
    return parts[0].truncate(24) + "\n@" + parts[1].truncate(23);
    }
return em;
});



/**
* Makes a <select>
*
* @param name The form name
* @param list An object, where key will be the <option>'s value, and the value is the text.
* @param sel The entry to make selected initially. (Should match a key in list.)
* @param extra If given, this is inserted as-is in side the <select>. E.g. it can be used for onChange,
*       or specifying an id, class, etc.
*
* @todo Add "editable" parameter?
*
* @internal Complicated syntax is because if extra was not given then it is the
*   handlebars context, which is object containin hash and data sub-objects.
*/
Handlebars.registerHelper('select', function( name, list, sel, extra){
if(!extra || !Object.isString(extra))extra='';    //Default to nothing
var s='';
s+='<select name="'+name+'" '+extra+'>';
for(var key in list){
    s+='<option value="'+key+'"'+ ((key==sel)?' selected':'') +'>'+list[key]+'</option>';
    }
s+='</select>';
return s;
});



/**
* @internal I've removed this as: a) nowhere using it; b) the interface is complicated. Needs a rethink?
*
* Shows a dropdown box, with current value automatically selected.
* 
* If your list contains a key of "other", then a hidden text box is also created,
* and it is shown when the value is chosen. (NOTE: this dynamic behaviour uses jQuery.)
* Note: if the "other" box is shown, it is a required field. User has to choose something
* else in the dropdown if they do not want to input anything.
*
* Note: it appears to be fine to add another onChange event handler dynamically,
* using javascript, @see http://stackoverflow.com/q/22317454/841830
*
* @todo currently user is expected to use this with {{{ ... }}}. I wonder if
*    we should instead use Handlebars.SafeString() on the return string?
*
* @param name The form name to give the dropdown box. The "other" box will be given
*       the same name, but with "other" suffixed. (The DOM id of the "other" box is
*       also name but with "__other" suffixed - the two underlines should avoid name clashes.)
* @param list An object where the keys should be <option> values, and
*       values are the text that is shown.
*       IMPORTANT: A valid key of "other" will clash, and is not allowed.
*       @todo If I made the special key be called "_other" I think it is better?
* @param current The value to show as selected. If not given then no option
*       will get selected. If it is not one of the keys in list then "other" will be
*       selected in the dropdown, and it will be put in the text box (and the text
*       box will be made visible initially).
* @param editable If true it show select + input box. If false it shows
*       static text.
*
* @todo Use an options array to make it more generic? I.e. so the "other" is
*   not always needed. Or to control including a blank first entry automatically. Etc.
*       ---> Actually the other can be controlled by simply including list.other (but code
*       currently kind of assumes it is always there, e.g. the onChange handler is always present)
*
* @todo name is not escaped in the HTML. Also key and list[key]
*  
* @internal I need to use name.replace() in the onChange() handler, because
*    jQuery is more fussy than HTML5, and doesn't like period or colon in a DOM id.
*
* @todo This ends up sending two values to the back-end: xxx and xxxother (if name="xxx")
*   The back-end then has to assemble them, and choose which to use.
*   A more sophisticated way would be:
*       If an "other" value is input then actually insert it into the <select> as
*       a new option.  (And hide the "other" text box on an onBlur).
*       As part of that, then make sure that the xxxother is not submitted with the form
*       data at all.
*       ---> I'm holding off on this as it ties into jquery validate usage, so may become N/A.
*/
/*
* @internal

Handlebars.registerHelper('selectOrOther', function( name, list, current, editable){
if(!list)return;    //TODO: list is a required field, so could be dropped if going for minimal code?
if(!editable){
    if(!list[current])return current;   //Free text
    return list[current];   //List entry
    }
var s='';
var id = name.replace(/(:|\.|\[|\])/g,'_')+"__other";   //Id of the <div> that hides/shows
s+='<select name="'+name+'" onChange="$(\'#'+id+'\').css(\'display\',(this.value==\'other\')?\'block\':\'none\').find(\'input\')[0].required=(this.value==\'other\');">';
var sel = current;  //Which dropdown option to show
if(!list[current])sel = "other";
for(var key in list){
    s+='<option value="'+key+'"'+ ((key==sel)?' selected':'') +'>'+list[key]+'</option>';
    }
s+='</select>';
if(list['other']){
    s+='<div id="'+id+'"'+(sel=="other"?'':' style="display:none"')+'>'+list['other']+': <input type="text" name="'+name+'other"'+(sel=="other"?(' value="'+current+'"'):'')+'></div>';
    }
return s;
});

*/



/**
* As we cannot do {{#if something=="something"}} we have to do this:
*   {{#ifEqual something "something"}}
* @see http://stackoverflow.com/a/16315366/841830 if we need a ifCond helper function
*/
Handlebars.registerHelper('ifEqual', function(v1, v2, options) {
  if(v1 === v2) {
    return options.fn(this);
  }
  return options.inverse(this);
});



/**
* To show a string in desired language
*
* This is a bit like i18nEdit, but just for static output
*
* @param v This is either a string (in which case it is output, as-is)
*    or an object, where the keys are the languages, and values are the strings.
*    By default it will choose one of the languages to show (this behaviour can
*   be changed using 'options')
* @param options It expects to find 'lang' in options; if not it will use a global variable called `lang`.
*
* @todo Consider treating as a timestamp, if 'v' is of type Date?
*
* @todo Is this function needed? Maybe just use i18nEdit but with a edit=false option??
*/
Handlebars.registerHelper('i18n', function(v,options) {
if(Object.isObject(v)){
    var key = options.hash.lang || lang;
    if(v[key])v = v[key];
    else if(v.en)v = v.en;  //Default to English if available
    else for(key in v){v=v[key];break;} //As fallback, choose the first entry.
    }
//else use 'v' as it is.
return v;
});


/**
* Used for edit forms where text is entered, and the app user has the choice
* to give it in multiple languages.
*
* @todo currently user is expected to use this with {{{ ... }}}. I wonder if
*    we should instead use Handlebars.SafeString() on the return string?
*
* @param name The name in the form, and the name in data.
*             If name is "xxx", then we will have one form entry of "xxx", or
*             multiple entries of "xxx.en", "xxx.ja", etc.
* @param data The data object. data[name] is the data being edited here.
*        If data[name] is an array, we show one text box per key (each key should
*           be the language code). If all languages have the same value, then
*           options is used to decide if one box or multiple boxes shown.
*        If data[name] does not exist, we show blank field(s)
*        If data[name] is a string we use that for field(s)
* @param options An object with settings:
*       languages: Key is the language, value is the prompt.
*           NOTE: if there is an entry in data[name] for a langage not included here
*               it is shown on the form, using the two-letter language code as the prompt.
*               (But, generally, we assume that never happens.)
*       mode:
*           "compact" means wherever possible show just a single field (i.e. when
*              it does not exist or is only a string or is an array but all values are identical).
*           "expand" means always show all fields, based on entries in options.languages.
*           "auto" means follow the data. This is like "compact", but when data[name]
*               is an array it shows all elements in the array. New values created as a string.
*       input: "input" vs. "textarea". Defaults to "input".
* @param extra Added in to the <input> tag as-is. E.g. "required" to make it a required
*       field. Note: goes in each <input> tag, same for each language.
*
* @todo When not mode==expand, there needs to be a button to expand out a field
*       so all languages are visible. (In fact it might be nice if mode could be changed
*       on the fly, by the user.)
*
* @todo No line-break between multiple <input> boxes. Need format control?
*
* @internal As a usage example I had these two lines before:
*  <input type="text" id="caption_ja" value="{{P media.caption.ja media.caption}}">
*  <input type="text" id="caption_en" value="{{P media.caption.en media.caption}}">
*
* And they were replaced by this:
*   {{{i18nEdit "caption" media S.options}}}
* And S.options={mode:'expand',languages:{'en':'EN',ja:'JA'} }
* However one key difference is that the id="..." is not set, and instead name="..."
* is set, but it is "caption.ja" and "caption.en" (i.e. dot, not underline)
*/
Handlebars.registerHelper('i18nEdit', function( name, data, options, extra ){
if(typeof extra == "object")extra=null; //I.e. this means "extra" is actually the extra
    //parameter than Handlebars gives us, that has hash{} and data{} members.

var s='';

//This next block replaced v=data[name], and it copes when name has dots in it to represent sub-objects.
var nameParts = name.split('.');
var v = data;
for(var ix in nameParts){
    if(!v)break;
    v = v[ nameParts[ix] ];
    }

if(!v){ //It does not exist, so create it.
    if(options.mode=='expand'){
        v={};
        for(var key in options.languages)v[key]='';
        }
    else v="";
    }
else if(Object.isObject(v)){
    if(options.mode == 'compact'){  //Check to see if all entries in v[] are the same. If
            //they are then reduce v to be a string.
        var v2=null;
        for(var lang in v){
            if(v2===null)v2=v[lang];  //First pass of loop
            else if(v2!=v[lang]){v2=false;break;} //If different, stop
            }
        if(v2!==false)v=v2; //If not set to false, they must all be the same string, so use that.
        }
    }
else{
    if(options.mode == 'expand'){ //Turn v from a string into an object
        v2={};
        for(var key in options.languages)v2[key]=v;
        v = v2;
        }
    }


name = name.escapeHTML();   //Make it ready to put in HTML
    //We assume lang never needs escaping, and 'extra' is always used exactly as-is.

if(Object.isObject(v)){
    for(var lang in v){ //TODO: if(options.mode=='expand'), then actually do for(lang in option.languages). For the moment we assume these are always the same, however.
        var langStr = options.languages[lang] || (lang+":");
        if(options.input == "textarea"){
            s+='<textarea name="'+name+'.'+lang+'"';
            if(extra)s+=' '+extra;
            s+='>'+v[lang].escapeHTML()+'</textarea>';
            }
        else{
            s+=langStr+'<input type="text" name="'+name+'.'+lang+'" value="'+v[lang].escapeHTML()+'"';  //TODO: escaping on name and v[lang]
            if(extra)s+=' '+extra;
            s+='>';
            }
        }
    }
else{
    if(options.input == "textarea"){
        s+='<textarea name="'+name+'"';
        if(extra)s+=' '+extra;
        s+='>'+v.escapeHTML()+'</textarea>';
        }
    else{
        s+='<input type="text" name="'+name+'" value="'+v.escapeHTML()+'"';
        if(extra)s+=' '+extra;
        s+='>';
        }
    }

return s;
});


/**
* Hack to allow bringing in other variables into the "this" context.
*
* Very useful for making variables (such as "../") available inside partials.
* 
* @see http://stackoverflow.com/a/18026063/841830
*
* @todo If using Sugar.js the whole function can be replaced with:
*       return options.fn(Object.merge(this,options.hash));
*   HOWEVER, that is slightly different as "this" gets modified. To have exactly
*   the same behaviour shown here, do:
*       return options.fn(Object.merge( Object.clone(this) ,options.hash));
*   (that is a shallow clone, but that is also the behaviour of the current code.)
*/
Handlebars.registerHelper('include', function(options) {
var context = {},
    mergeContext = function(obj) {
        for(var k in obj)context[k]=obj[k];
    };
mergeContext(this);
mergeContext(options.hash);
return options.fn(context);
});


/**
* @see http://darrendev.blogspot.co.uk/2016/03/timestamp-helper-in-handlebars.html
*/
Handlebars.registerHelper('timestampTZ', function(t, options){
var offset = options.hash.tzOffset;
if(!offset)offset = tzOffset;   //Use global as default
if(!Object.isDate(t)){
    if(!t)return "";
    if(Object.isString(t))t = Date.create(t + "+0000").utc().addSeconds(offset);
    else t = Date.create(t*1000).utc().addSeconds(offset);
    }
else t = t.clone().addSeconds(offset);
if(!t.isValid())return "";

var code = options.hash.lang;
if(!code)code = lang;   //Use global as default

var format = options.hash.format ? options.hash.format : '';
var s = t.format(format, lang);
if(options.hash.appendTZ)s+=tzString;
if(options.hash.append)s+=options.hash.append;
return s;
});

