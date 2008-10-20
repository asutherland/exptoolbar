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
Components.utils.import("resource://gloda/modules/mimemsg.js")

var searchTabType = {
  name: "search",
  perTabPanel: "iframe",
  modes: {
    searchAll: {
      type: "search",
      
    },
  },
  openTab: function (aTab, aConstraints) {
    aTab.panel.contentWindow.addEventListener("load",
      function(e) { experimentaltoolbar.applyConstraints(); }, false);
    aTab.constraints = aConstraints;
    aTab.panel.setAttribute("src",
      "chrome://experimentaltoolbar/content/searchResults.xhtml");
    aTab.title = "Search";
  },
  closeTab: function (aTab) {
  },
  saveTabState: function (aTab) {
    aTab.constraints = experimentaltoolbar.serializeConstraints();
  },
  showTab: function (aTab) {
  }
};

var searchTabMonitor = {
  onTabTitleChanged: function(aTab) {
    if (aTab.mode.name == "folder") {
      aTab.constraints = [Gloda.getFolderForFolder(gMsgFolderSelected)];
      experimentaltoolbar.clearConstraints();
      experimentaltoolbar.deserializeConstraints(aTab.constraints);
    }
  },
  onTabSwitched: function(aTab, aOldTab) {
    experimentaltoolbar.clearConstraints();

    if (aTab.constraints) {
      experimentaltoolbar.deserializeConstraints(aTab.constraints);
    }
  },
};

var experimentaltoolbar = {
  SEARCH_INPUT_HELPER_TEXT : "Search messages, events, people...",
  
  onLoad: function() {
    // initialization code
    this.initialized = true;
    this.strings = document.getElementById("experimentaltoolbar-strings");
    
    var mailToolbar = experimentaltoolbar.getMailBar();

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

    this.tabmail = document.getElementById("tabmail");
    this.tabmail.registerTabType(searchTabType);
    this.tabmail.tabMonitors.push(searchTabMonitor);
    if (this.tabmail.currentTabInfo) {
      searchTabMonitor.onTabTitleChanged(this.tabmail.currentTabInfo);
    }
    
    // XXX remove the quick search keyboard shortcut
    var qsk = document.getElementById("key_quickSearchFocus");
    qsk.parentNode.removeChild(qsk);
  },
  focusSearchInput : function(event) {
    this.searchInput.select();
    this.searchInput.focus();
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
  _activeSearchText: '',
  _constraintsChanged: false,
  
  // (bubble logic)
  observe: function(aSubject, aTopic, aData) {
    if (aTopic == "autocomplete-will-enter-text") {
    }
    else if (aTopic == "autocomplete-did-enter-text") {
      let row = this.glodaCompleter.curResult.getObjectAt(
        this.searchInput.popup.selectedIndex);
      
      if (row == null) {
        this.applyConstraints();
        return;
      }
      
      let item;
      if (row.multi) {
        row.collection.explanation = row.nounMeta.name + "s " + 
          row.criteriaType + "ged " + row.criteria;
        item = row.collection;
      }
      else {
        let obj = row.item;
        if (obj.NOUN_ID == Gloda.NOUN_CONTACT)
          item = obj;
        else if (obj.NOUN_ID == Gloda.NOUN_IDENTITY)
          item = obj.contact;
      }
      
      this.addBubble(item);
      this.applyConstraints();
    }
  },
  
  addBubble: function (aItem) {
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
    bubble.setAttribute("value", aItem.explanation || aItem.toString());
    bubble.setAttribute("class", "bubble");
    // the following is a little hacky and uses private knowledge because we
    //  are assuming this framework will have justifiable private usage...
    let typeName;
    if (aItem.NOUN_ID)
      typeName = Gloda._nounIDToMeta[aItem.NOUN_ID].name;
    else
      typeName = aItem._nounMeta.name + "-collection";
    bubble.setAttribute("type", typeName);
    this.searchInput.inputField.parentNode.insertBefore(bubble,
      this.searchInput.inputField);
    this.searchInput.value = "";
    
    bubble.constraint = aItem;
    
    textSpacer.nextBubble = bubble;
    
    this.searchInput.prevTextSpacer = textSpacer;
    this.searchInput.prevBubble = bubble;
    
    this._constraintsChanged = true;
  },
  
  /* stolen from searchBar.js, changing to use search view from quicksearch */
  createSearchView: function()
  {
    let viewType = gDBView.viewType;
    //if not already in quick search view 
    if (viewType != nsMsgViewType.eShowSearch)  
    {
      var treeView = gDBView.QueryInterface(Components.interfaces.nsITreeView);  //clear selection
      if (treeView && treeView.selection)
        treeView.selection.clearSelection();
      gPreQuickSearchView = gDBView;
      if (viewType == nsMsgViewType.eShowVirtualFolderResults)
      {
        // remove the view as a listener on the search results
        var saveViewSearchListener = gDBView.QueryInterface(Components.interfaces.nsIMsgSearchNotify);
        gSearchSession.unregisterListener(saveViewSearchListener);
      }
      // if grouped by sort, turn that off, as well as threaded, since we don't
      // group quick search results yet.
      var viewFlags = gDBView.viewFlags;
      if (viewFlags & (nsMsgViewFlagsType.kGroupBySort | nsMsgViewFlagsType.kThreadedDisplay))
        viewFlags &= ~(nsMsgViewFlagsType.kGroupBySort | nsMsgViewFlagsType.kThreadedDisplay);
      CreateDBView(null, nsMsgViewType.eShowSearch, viewFlags, gDBView.sortType, gDBView.sortOrder);
    }
  },
  serializeConstraints: function () {
    let constraintObjects = [];
    
    let textSpacer = this.searchInput;
    while (textSpacer && textSpacer.prevBubble) {
      let bubble = textSpacer.prevBubble;
      constraintObjects.push(bubble.constraint);
      textSpacer = textSpacer.prevTextSpacer;
    }
    
    constraintObjects.reverse();
    
    let trimmedValue = this.searchInput.value.trim();
    if (trimmedValue)
      constraintObjects.push(trimmedValue);

    return constraintObjects;
  },
  deserializeConstraints: function (aConstraints) {
    for each (let item in aConstraints) {
      if (typeof(item) == "string")
        this.searchInput.value = item;
      else
        this.addBubble(item);
    }
  },
  applyQueryToView: function (aQuery) {
    this.createSearchView();

    ClearThreadPaneSelection();
    ClearMessagePane();

    let searchView = gDBView.QueryInterface(
                       Components.interfaces.nsIMsgSearchNotify);
    searchView.onNewSearch();

    let collection = aQuery.getCollection({
      onItemsAdded: function (aItems) {
        dump("collection is seeing results!\n");
        for each (let message in aItems) {
          let folderMessage = message.folderMessage;
          if (folderMessage !== null)
            searchView.onSearchHit(folderMessage, folderMessage.folder);
        }
      },
      onItemsModified: function () {
      },
      onItemsRemoved: function () {
      }
    });
   
    RerootThreadPane();
  },
  applyQueryToDocument: function applyQueryToDocument (aQuery) {
    let doc = this.tabmail.currentTabInfo.panel.contentDocument;
    let win = this.tabmail.currentTabInfo.panel.contentWindow;
    let conversationsNode = doc.getElementById("conversations");
    while (conversationsNode.firstChild) {
      conversationsNode.removeChild(conversationsNode.firstChild);
    }
    let queryNode = doc.getElementById("query");
    queryNode.obj = aQuery;
    
    // do not allow us to issue an empty query, or we will explode!
    if (!aQuery.constraintCount)
      return;
  
    let conversationMap = {};

    let collection = aQuery.getCollection({
      onQueryCompleted: function() {
          // send the conversations to the timeline
          let convs = [];
          let id;
          win.gTimeline_addConversations([conversationMap[id] for (id in conversationMap)]);
      },
      onItemsAdded: function (aItems) {
        // extract conversations
        for each (let message in aItems) {
          let conv = message.conversation;
          if (!(conv.id in conversationMap)) {
            conversationMap[conv.id] = conv;
          }
          let convid = 'conv'+conv.id.toString();
          let node = doc.getElementById(convid);
          if (node == undefined) {
            node = doc.createElementNS("http://www.w3.org/1999/xhtml", "conversation");
            conversationsNode.appendChild(node);
            node.id = 'conv' + conv.id.toString()
            node.obj = conv;
          }
        }
      },
      onItemsModified: function () {
      },
      onItemsRemoved: function () {
      }
    });
  },
  clearViewQuery: function () {
    restorePreSearchView();
  },
  applyConstraints: function applyConstraints() {
    if (!this._constraintsChanged &&
        this.searchInput.value == this._activeSearchText)
      return;
    if (this._suppress)
      return;
  
dump("APPLY CONSTRAINTS\n");
    let query = Gloda.newQuery(Gloda.NOUN_MESSAGE);
    
    let textSpacer = this.searchInput;
    
    if ((textSpacer.prevBubble === null) && !this.searchInput.value.length) {
      this.clearViewQuery();
      dump("restoring previous search\n");
      return;
    }
    
    while (textSpacer.prevBubble) {
      let bubble = textSpacer.prevBubble;
      
      // XXX this should all be generalized, of course...
      if (bubble.constraint.NOUN_ID == Gloda.NOUN_CONTACT)
        query.involves.apply(query, bubble.constraint.identities);
      else if (bubble.constraint.NOUN_ID == Gloda.NOUN_FOLDER) {
        // don't do anything with this for now...
      }
      else { // it must be a contact collection
        let identities = [];
        for each (let contact in bubble.constraint.items) {
          identities.push.apply(identities, contact.identities);
        }
        query.involves.apply(query, identities);
      }
    
      textSpacer = textSpacer.prevTextSpacer;
    }
   
    if (this.searchInput.value) {
      dump("adding fulltext search on: " + this.searchInput.value + "\n");
      query.bodyMatches(this.searchInput.value);
    }

    if (this.tabmail.currentTabInfo.mode.tabType.name == "search")
      this.applyQueryToDocument(query);
    
    this._activeSearchText = this.searchInput.value;
    this._constraintsChanged = false;   
  },
  makeSearchTab: function makeSearchTab() {
    this._suppress = true;
    let constraints = this.serializeConstraints();
    this.clearConstraints();
    this.tabmail.openTab("searchAll", constraints);
    this._suppress = false;
  },

  clearConstraints: function clearConstraints() {
    while (this.searchInput.prevBubble) {
      this.destroyPreviousBubble(this.searchInput);
    }
    this.searchInput.value = '';
    this._constraintsChanged = true;
  },
  
  destroyPreviousBubble: function destroyPreviousBubble(aTextSpacer) {
    let prevBubble = aTextSpacer.prevBubble;
    let prevTextSpacer = aTextSpacer.prevTextSpacer;
    
    if (!prevBubble)
      return;
    
    // remove the previous bubble
    prevBubble.parentNode.removeChild(prevBubble);

    // remove the spacer to the bubble's left (must exist)
    prevTextSpacer.parentNode.removeChild(prevTextSpacer);
    aTextSpacer.prevBubble = prevTextSpacer.prevBubble;
    aTextSpacer.prevTextSpacer = prevTextSpacer.prevTextSpacer;
    if (aTextSpacer.prevTextSpacer)
      aTextSpacer.prevTextSpacer.nextTextSpacer = aTextSpacer;
  },
  
  destroySpacerAndNextBubble: function destroySpacerAndNextBubble(aTextSpacer) {
    // kill the (next) bubble
    aTextSpacer.nextBubble.parentNode.removeChild(aTextSpacer.nextBubble);
    // kill the (current) spacer
    aTextSpacer.parentNode.removeChild(aTextSpacer);

    aTextSpacer.nextTextSpacer.prevBubble = aTextSpacer.prevBubble;
    aTextSpacer.nextTextSpacer.prevTextSpacer = aTextSpacer.prevTextSpacer;
    
    if (aTextSpacer.prevTextSpacer)
      aTextSpacer.prevTextSpacer.nextTextSpacer = aTextSpacer.nextTextSpacer;
  },
  
  spacerOnKeyPress: function spaceOnKeyPress(aEvent) {
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
        experimentaltoolbar.destroyPreviousBubble(target);
        // we don't need to do anything about focus; we still exist
      }
      experimentaltoolbar.applyConstraints();
      aEvent.stopPropagation();
    }
    else if (aEvent.keyCode == aEvent.DOM_VK_RIGHT) {
      target.nextTextSpacer.focus();
      aEvent.stopPropagation();
    }
    else if (aEvent.keyCode == aEvent.DOM_VK_DELETE) {
      experimentaltoolbar.destroySpacerAndNextBubble(target);
      // we do need to re-focus to the right
      target.nextTextSpacer.focus();
      
      experimentaltoolbar.applyConstraints();
      aEvent.stopPropagation();
    }
    else if (aEvent.keyCode == DOM_VK_HOME) {

    }
    else if (aEvent.keyCode == DOM_VK_END) {

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
        if (this.searchInput.prevBubble) {
          this.destroyPreviousBubble(this.searchInput);
          this.applyConstraints();
        }
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

    if (this.tabmail.currentTabInfo.mode.tabType.name != "search") {
      this.makeSearchTab();
    }
    else {
      this.applyConstraints();
    }
    
    dump("Text value: " + this.searchInput.textValue + "\n");
  },
  onTextReverted: function() {
    dump("Text reverted!\n");
  },
};
window.addEventListener("load", function(e) { experimentaltoolbar.onLoad(e); }, false);



// TODO, remove after debugging
function ddump(text)
{
    dump(text + "\n");
}
function ddumpObject(obj, name, maxDepth, curDepth)
{
  if (curDepth == undefined)
    curDepth = 0;
  if (maxDepth != undefined && curDepth > maxDepth)
    return;

  var i = 0;
  for (prop in obj)
  {
    i++;
    try {
      if (typeof(obj[prop]) == "object")
      {
        if (obj[prop] && obj[prop].length != undefined)
          ddump(name + "." + prop + "=[probably array, length "
                + obj[prop].length + "]");
        else
          ddump(name + "." + prop + "=[" + typeof(obj[prop]) + "]");
        ddumpObject(obj[prop], name + "." + prop, maxDepth, curDepth+1);
      }
      else if (typeof(obj[prop]) == "function")
        ddump(name + "." + prop + "=[function]");
      else
        ddump(name + "." + prop + "=" + obj[prop]);
    } catch (e) {
      ddump(name + "." + prop + "-> Exception(" + e + ")");
    }
  }
  if (!i)
    ddump(name + " is empty");
}

