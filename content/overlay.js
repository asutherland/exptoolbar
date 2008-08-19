/* ***** BEGIN LICENSE BLOCK *****
 *   Version: MPL 1.1/GPL 2.0/LGPL 2.1
 *
 * The contents of this file are subject to the Mozilla Public License Version
 * 1.1 (the "License"); you may not use this file except in compliance with
 * the License. You may obtain a copy of the License at
 * http://www.mozilla.org/MPL/
 * 
 * Software distributed under the License is distributed on an "AS IS" basis,
 * WITHOUT WARRANTY OF ANY KIND, either express or implied. See the License
 * for the specific language governing rights and limitations under the
 * License.
 *
 * The Original Code is Experimental Toolbar.
 *
 * The Initial Developer of the Original Code is
 * Bryan Clark.
 * Portions created by the Initial Developer are Copyright (C) 2008
 * the Initial Developer. All Rights Reserved.
 *
 * Contributor(s):
 *
 * Alternatively, the contents of this file may be used under the terms of
 * either the GNU General Public License Version 2 or later (the "GPL"), or
 * the GNU Lesser General Public License Version 2.1 or later (the "LGPL"),
 * in which case the provisions of the GPL or the LGPL are applicable instead
 * of those above. If you wish to allow use of your version of this file only
 * under the terms of either the GPL or the LGPL, and not to allow others to
 * use your version of this file under the terms of the MPL, indicate your
 * decision by deleting the provisions above and replace them with the notice
 * and other provisions required by the GPL or the LGPL. If you do not delete
 * the provisions above, a recipient may use your version of this file under
 * the terms of any one of the MPL, the GPL or the LGPL.
 * 
 * ***** END LICENSE BLOCK ***** */

Components.utils.import("resource://gloda/modules/gloda.js")

var experimentaltoolbar = {
  SEARCH_INPUT_HELPER_TEXT : "Search messages, events, people...",
  

  onLoad: function() {
    // initialization code
    this.initialized = true;
    this.strings = document.getElementById("experimentaltoolbar-strings");

    var mailToolbar = experimentaltoolbar.getMailBar();
//    mailToolbar.setAttribute("collapsed", "true");

//    var expMailToolbar = document.getElementById("exp-mail-toolbar");
//    expMailToolbar.setAttribute("collapsed", "false");

    // ====== hacky bubble logic, destined for being hidden ugliness in XBL.
    this.searchInput = document.getElementById("searchInput2");
    this.searchInput.prevBubble = null;
    this.searchInput.prevTextSpacer = null;
    this.glodaCompleter =
      Components.classes["@mozilla.org/autocomplete/search;1?name=gloda"].
                getService(). //Components.interfaces.nsIAutoCompleteSearch)
                wrappedJSObject;
    var observerSvc = Components.classes["@mozilla.org/observer-service;1"]
                      .getService(Components.interfaces.nsIObserverService);
    observerSvc.addObserver(this,
                            "autocomplete-will-enter-text", false);
    observerSvc.addObserver(this,
                            "autocomplete-did-enter-text", false);
    // end bubble logic until more of it below...
  },
  onBlurSearchInput : function(event) {
    var searchInput = document.getElementById("searchInput2");
    if (searchInput.value == "") {
      searchInput.value = this.SEARCH_INPUT_HELPER_TEXT;
    }
  },
  onFocusSearchInput : function(event) {
    var searchInput = document.getElementById("searchInput2");
    if (searchInput.value == this.SEARCH_INPUT_HELPER_TEXT) {
      searchInput.value = "";
    }
  },
  getMailBar: function() {
    return document.getElementById("mail-bar2") ||
           document.getElementById("msgToolbar");
  },
  
  
  // ======= the stuff below here should all end up in XBL bindings, likely.
  // (bubble logic)
  observe: function(aSubject, aTopic, aData) {
    if (aTopic == "autocomplete-will-enter-text") {
    }
    else if (aTopic == "autocomplete-did-enter-text") {
      let [obj, startsFrom] = this.glodaCompleter.getObjectForController(
                   this.searchInput.controller,
                   this.searchInput.popup.selectedIndex);
      
      let contact = null;
      if (obj.NOUN_ID == Gloda.NOUN_CONTACT)
        contact = obj;
      else if (obj.NOUN_ID == Gloda.NOUN_IDENTITY)
        contact = obj.contact;
      
      if (contact) {
        // always create a magic text spacer...
        let textSpacer = null;
        
        textSpacer = document.createElementNS(
          "http://www.w3.org/1999/xhtml", "html:input");
        textSpacer.setAttribute("value", "");
        textSpacer.setAttribute("class", "bubble-spacer");
        textSpacer.onkeypress = this.spacerOnKeyPress;
        
        // (prevBubble may be null)
        textSpacer.prevBubble = this.searchInput.prevBubble;
        textSpacer.prevTextSpacer = this.searchInput.prevTextSpacer;
        if (textSpacer.prevTextSpacer)
          textSpacer.prevTextSpacer.nextTextSpacer = textSpacer;
        textSpacer.nextTextSpacer = this.searchInput;
        
        this.searchInput.inputField.parentNode.insertBefore(textSpacer,
          this.searchInput.inputField);
        
        // create the bubble
        let bubble = document.createElementNS(
          "http://www.mozilla.org/keymaster/gatekeeper/there.is.only.xul",
          "label");
        bubble.setAttribute("value", contact.name);
        bubble.setAttribute("class", "contact-bubble");
        this.searchInput.inputField.parentNode.insertBefore(bubble,
          this.searchInput.inputField);
        this.searchInput.value = "";
        
        bubble.constraint = contact;
        
        if (textSpacer)
          textSpacer.nextBubble = bubble;
        
        this.searchInput.prevTextSpacer = textSpacer;
        this.searchInput.prevBubble = bubble;
        
        this.applyConstraints();
      }
    }
  },
  applyConstraints: function () {
    let query = Gloda.newQuery(Gloda.NOUN_MESSAGE);
    
    let textSpacer = this.searchInput;
    while (textSpacer.prevBubble) {
      let bubble = textSpacer.prevBubble;
      if (bubble.constraint.NOUN_ID == Gloda.NOUN_CONTACT)
        query.involves.apply(query, bubble.constraint.identities);
    
      textSpacer = textSpacer.prevTextSpacer;
    }
   
   if (this.searchInput.value) {
     query.bodyMatches(this.searchInput.value);
   }
   
   // this requires Andrew's patented glmsgdbview-for-everything hackjob.
   let glView = gDBView.wrappedJSObject;
   
   let collection = query.getAllSync();
   glView.absorbNewCollection(collection);
  },
  spacerOnKeyPress: function (aEvent) {
    let target = aEvent.target;
    if (aEvent.keyCode == aEvent.DOM_VK_LEFT) {
      if (target.prevTextSpacer) {
        target.prevTextSpacer.focus();
      }
      aEvent.stopPropagation();
    }
    else if (aEvent.keyCode == aEvent.DOM_VK_BACK_SPACE) {
      // there's only something to do if there's a previous bubble
      if (target.prevBubble) {
        // remove the bubble to our left, and ourselves because there may not
        //  actually be another text spacer to the left
        target.prevBubble.parentNode.removeChild(target.prevBubble);
        target.parentNode.removeChild(target);

        target.nextTextSpacer.prevTextSpacer = target.prevTextSpacer;
        
        if (target.prevTextSpacer) {
          target.prevTextSpacer.nextBubble = target.nextBubble;
          target.prevTextSpacer.nextTextSpacer = target.nextTextSpacer;
          target.prevTextSpacer.focus();
        }
        else
          target.nextTextSpacer.focus();
      }
      experimentaltoolbar.applyConstraints();
      aEvent.stopPropagation();
    }
    else if (aEvent.keyCode == aEvent.DOM_VK_RIGHT) {
      target.nextTextSpacer.focus();
      aEvent.stopPropagation();
    }
    else if (aEvent.keyCode == aEvent.DOM_VK_DELETE) {
      // delete the bubble to our right, and ourselves, because the spacer to
      //  our right may be the auto-complete.
      target.nextBubble.parentNode.removeChild(target.nextBubble);
      target.parentNode.removeChild(target);

      target.nextTextSpacer.prevBubble = target.prevBubble;
      target.nextTextSpacer.prevTextSpacer = target.prevTextSpacer;
      
      if (target.prevTextSpacer)
        target.prevTextSpacer.nextTextSpacer = target.nextTextSpacer;
      
      target.nextTextSpacer.focus();
      
      experimentaltoolbar.applyConstraints();
      aEvent.stopPropagation();
    }
    else if (aEvent.charCode) {
      // force the focus to the auto-complete guy.
      experimentaltoolbar.searchInput.focus();
      experimentaltoolbar.searchInput.value +=
        String.fromCharCode(aEvent.charCode);
      target.value = "";
      aEvent.stopPropagation();
    }
  },
  onKeyPress: function(aEvent) {
    // only do things if we are at the leftmost of the autocomplete box
    if (this.searchInput.selectionStart == 0 &&
        this.searchInput.selectionEnd == 0) {
      if (aEvent.keyCode == aEvent.DOM_VK_BACK_SPACE) {
        // delete the previous bubble...
        if (this.searchInput.prevBubble)
          this.searchInput.prevBubble.parentNode.removeChild(
            this.searchInput.prevBubble); 

        // and if there was a previous text spacer, delete him too.
        if (this.searchInput.prevTextSpacer) {
          // delete
          this.searchInput.prevTextSpacer.parentNode.removeChild(
            this.searchInput.prevTextSpacer);
          // update our links to the previous things
          this.searchInput.prevBubble =
            this.searchInput.prevTextSpacer.prevBubble;
          this.searchInput.prevTextSpacer =
            this.searchInput.prevTextSpacer.prevTextSpacer;
          // update the link of the new previous text spacer to point to us
          if (this.searchInput.prevTextSpacer)
            this.searchInput.prevTextSpacer.nextTextSpacer = this.searchInput;
          this.applyConstraints();
        }
        else
          this.searchInput.prevBubble = null;
        aEvent.stopPropagation();
      }
      // jump to the previous text spacer, if one exists...
      else if (aEvent.keyCode == aEvent.DOM_VK_LEFT) {
        if (this.searchInput.prevTextSpacer)
          this.searchInput.prevTextSpacer.focus();
        aEvent.stopPropagation();
      }
    }
  },
  onInput: function() {
    dump("on input\n");
  },
  onTextEntered : function() {
    dump("Text entered!\n");
    
    dump("Text value: " + this.searchInput.textValue + "\n");
  },
  onTextReverted: function() {
    dump("Text reverted!\n");
  },
};
window.addEventListener("load", function(e) { experimentaltoolbar.onLoad(e); }, false);
