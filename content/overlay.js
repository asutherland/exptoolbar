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

Components.utils.import("resource://gloda/modules/log4moz.js");

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
      aTab.constraints = [[Gloda.getFolderForFolder(gMsgFolderSelected),
                           Gloda.lookupNounDef("folder"), false]];
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

var addressbookTabType = {
  name: "addressbook",
  perTabPanel: "iframe",
  modes: {
    abAll: {
      type: "addressbook",

    },
  },
  openTab: function (aTab, aConstraints) {
    aTab.panel.contentWindow.addEventListener("load",
      function(e) { experimentaltoolbar.showAddressBookContacts(); }, false);
    aTab.constraints = "";
    aTab.panel.setAttribute("src",
      "chrome://experimentaltoolbar/content/addressbook.xhtml");
    aTab.title = "Address Book v2";
  },
  closeTab: function (aTab) {
  },
  saveTabState: function (aTab) {
    aTab.constraints = experimentaltoolbar.serializeConstraints();
  },
  showTab: function (aTab) {
    aTab.constraints = "";
  }
};

var experimentaltoolbar = {
  log: Log4Moz.Service.getLogger("exptoolbar.overlay"),

  SEARCH_INPUT_HELPER_TEXT : "Search messages, events, people...",

  onLoad: function() {
    // initialization code
    this._callbackHandle.init();
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
    this.tabmail.registerTabType(addressbookTabType);
    this.tabmail.tabMonitors.push(searchTabMonitor);
    if (this.tabmail.currentTabInfo) {
      searchTabMonitor.onTabTitleChanged(this.tabmail.currentTabInfo);
    }

    // XXX remove the quick search keyboard shortcut
    var qsk = document.getElementById("key_quickSearchFocus");
    qsk.parentNode.removeChild(qsk);
  },
  focusSearchInput : function(event) {
    this.searchInput.focus();
    this.searchInput.selectAll();
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

  /** this needs to be refactored into a reusable construct.  beware */
  _callbackHandle: {
    wrappedCallback: function() {
      experimentaltoolbar._callbackHandle.callback();
    },

    _data: undefined,
    callback: function() {
      if (arguments.length)
        this._data = arguments;

      try {
        dump("about to enter while: " + this.activeStack.length + "\n");
        while (this.activeStack.length) {
          dump("callback driving!\n");
          switch (this.activeIterator.send(this._data)) {
            case Gloda.kWorkSync:
              this._data = undefined;
              break;
            case Gloda.kWorkAsync:
              this._data = undefined;
              return;
            case Gloda.kWorkDone:
              this.pop();
              this._data = undefined;
              dump("done, popped to lenght of: " + this.activeStack.length + "\n");
              break;
            case Gloda.kWorkDoneWithResult:
              this._data = this.popWithResult();
              dump("done-w-r, popped to lenght of: " + this.activeStack.length + "\n");
              continue;
          }
        }
        dump("out of the while loop!\n");
      }
      catch (ex) {
        dump("Cleaning up due to failure :( :( :( :( :( : " + ex + "\n");
        // clear out our current generators and our related data
        this.cleanup();
        this._data = undefined;
        throw ex;
      }
    },

    init: function gloda_index_callbackhandle_init() {
      this.callbackThis = this;
    },

    activeStack: [],
    activeIterator: null,
    push: function gloda_index_callbackhandle_push(aIterator) {
      this.activeStack.push(aIterator);
      this.activeIterator = aIterator;
    },
    pushAndGo: function gloda_index_callbackhandle_pushAndGo(aIterator) {
      this.push(aIterator);
      return this.activeIterator.next();
    },
    pop: function gloda_index_callbackhandle_pop() {
      this.activeIterator.close();
      this.activeStack.pop();
      if (this.activeStack.length)
        this.activeIterator = this.activeStack[this.activeStack.length - 1];
      else
        this.activeIterator = null;
      dump("popped to length: " + this.activeStack.length + "\n");
    },
    /**
     * Someone propagated an exception and we need to clean-up all the active
     *  logic as best we can.  Which is not really all that well.
     */
    cleanup: function gloda_index_callbackhandle_cleanup() {
      while (this.activeIterator !== null) {
        this.pop();
      }
    },
    popWithResult: function gloda_index_callbackhandle_popWithResult() {
      this.pop();
      let result = this._result;
      this._result = null;
      return result;
    },
    _result: null,
    doneWithResult: function gloda_index_callbackhandle_doneWithResult(aResult){
      this._result = aResult;
      return Gloda.kWorkDoneWithResult;
    },

    /* be able to serve as a collection listener, resuming the active iterator's
       last yield kWorkAsync */
    onItemsAdded: function() {},
    onItemsModified: function() {},
    onItemsRemoved: function() {},
    onQueryCompleted: function(aCollection) {
      dump("query completed notification, calling callback\n");
      this.callback();
    }
  },


  constrainFromEmailPopup: function(aEmailAddressNode) {
    let fullAddress = aEmailAddressNode.getAttribute("fullAddress");

    this._callbackHandle.push(this._constrainEmailWorker(fullAddress));
    // kick off the callback driver...
    this._callbackHandle.callback();
  },

  _constrainEmailWorker: function(aFullMailName) {
    dump("in _constrainEmailWorker: " + aFullMailName + "\n");
    let [identities] = yield this._callbackHandle.pushAndGo(
      Gloda.getOrCreateMailIdentities(this._callbackHandle, aFullMailName));
    dump("got identities: " + identities + "\n");

    let tabmail = document.getElementById("tabmail");

    dump("opening tab\n");
    if (identities.length)
      tabmail.openTab("searchAll", [[identities[0].contact,
                                     Gloda.lookupNounDef("contact"),
                                     false]]);
    dump("opened tab\n");
    yield Gloda.kWorkDone;
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
        this.log.debug("no row retrieved, performing fulltext");
        this.applyConstraints();
        return;
      }

      this.log.debug("retrieved row of type: " + row.nounDef.name + " multi: " +
          row.multi + ": " + row);

      let item = row.item, nounDef = row.nounDef;
      if (row.multi) {
        row.collection.explanation = row.nounDef.name + "s " +
          row.criteriaType + "ged " + row.criteria;
        item = row.collection;
      }
      else {
        // promote from the identity to the contact
        if (row.nounID == Gloda.NOUN_IDENTITY) {
          item = item.contact;
          nounDef = item.NOUN_DEF;
        }
      }

      this.addBubble(item, nounDef, row.multi);
      this.applyConstraints();
    }
  },

  addBubble: function (aItem, aNounDef, aMulti) {
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
    let label;
    if (aNounDef.id == Gloda.NOUN_TAG)
      label = aItem.tag;
    else if (aMulti)
      label = aItem.explanation;
    else if (aItem.NOUN_ID == Gloda.NOUN_FOLDER)
      label = aItem.name;
    else if (aItem.NOUN_ID == Gloda.NOUN_CONTACT)
      label = aItem.name;
    else
      label = aItem.toString();
    bubble.setAttribute("value", label);
    bubble.setAttribute("class", "bubble");
    // the following is a little hacky and uses private knowledge because we
    //  are assuming this framework will have justifiable private usage...
    let typeName;
    if (!aMulti)
      typeName = aNounDef.name;
    else
      typeName = aNounDef.name + "-collection";
    bubble.setAttribute("type", typeName);
    this.searchInput.inputField.parentNode.insertBefore(bubble,
      this.searchInput.inputField);
    this.searchInput.value = "";

    bubble.constraint = aItem;
    bubble.nounDef = aNounDef;
    bubble.multi = aMulti;

    textSpacer.nextBubble = bubble;

    this.searchInput.prevTextSpacer = textSpacer;
    this.searchInput.prevBubble = bubble;

    this._constraintsChanged = true;
  },
  showAddressBookContacts: function() {
    this.createSearchView();

    let doc = this.tabmail.currentTabInfo.panel.contentDocument;
    let win = this.tabmail.currentTabInfo.panel.contentWindow;

    let query = Gloda.newQuery(Gloda.NOUN_CONTACT);

    let results = doc.getElementById("results");

    let collection = query.getCollection({
      onItemsAdded: function (aItems) {
        for each (let contact in aItems) {
          let node = doc.createElementNS("http://www.w3.org/1999/xhtml", "contact");
          results.appendChild(node);
          node.obj = contact;
          node.id = 'contact_' + contact.id.toString();
        }
      },
      onItemsModified: function () {
      },
      onItemsRemoved: function () {
      }
    });
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

    this.log.debug("serializing...");

    let textSpacer = this.searchInput;
    while (textSpacer && textSpacer.prevBubble) {
      let bubble = textSpacer.prevBubble;
      constraintObjects.push([bubble.constraint, bubble.nounDef, bubble.multi]);
      textSpacer = textSpacer.prevTextSpacer;
    }

    constraintObjects.reverse();

    let trimmedValue = this.searchInput.value.trim();
    if (trimmedValue)
      constraintObjects.push(trimmedValue);

    return constraintObjects;
  },
  deserializeConstraints: function (aConstraints) {
    this.log.debug("deserializing...");
    for each (let [,item] in Iterator(aConstraints)) {
      if (typeof(item) == "string")
        this.searchInput.value = item;
      else
        this.addBubble.apply(this, item);
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
    dump("applyQueryToDocument !\n");
    while (conversationsNode.firstChild) {
      conversationsNode.removeChild(conversationsNode.firstChild);
    }
    dump("cleaned up mess!\n");
    let queryNode = doc.getElementById("query");
    queryNode.obj = aQuery;

    // do not allow us to issue an empty query, or we will explode!
    if (!aQuery.constraintCount)
      return;

    let conversationMap = {};

    let collection = aQuery.getCollection({
      onQueryCompleted: function() {
          // send the conversations to the timeline
          let id;
          dump("ON QUERY COMPLETED!\n");
          // clear the set of conversations; they will add themselves as their
          //  messages collections load. XXX Update-every-time is not a great
          //  thing, and should be replaced by a timer thing.
          win.gTimeline_setConversations([]);
      },
      onItemsAdded: function (aItems) {
        // extract conversations
        //dump("onItemsAdded!\n");
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
      if (bubble.multi) {
        // it must be a contact collection
        let identities = [];
        for each (let contact in bubble.constraint.items) {
          identities.push.apply(identities, contact.identities);
        }
        query.involves.apply(query, identities);
      }
      else if (bubble.nounDef.id == Gloda.NOUN_TAG)
        query.tags(bubble.constraint)
      else if (bubble.nounDef.id == Gloda.NOUN_CONTACT)
        query.involves.apply(query, bubble.constraint.identities);
      else if (bubble.nounDef.id == Gloda.NOUN_FOLDER) {
        query.folder(bubble.constraint)
      }
      else if (bubble.nounDef.id == Gloda.NOUN_CONVERSATION) {
        // we want to show all messages in this conversation
        query.conversation(bubble.constraint);
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

  makeSearchTab: function makeSearchTab(constraints) {
    this._suppress = true;
    if (! constraints) {
      constraints = this.serializeConstraints();
    }
    this.clearConstraints();
    this.tabmail.openTab("searchAll", constraints);
    this._suppress = false;
  },

  makeAddressBookTab: function makeAddressBookTab(constraints) {
    this._suppress = true;
    if (! constraints) {
      constraints = this.serializeConstraints();
    }
    this.clearConstraints();
    this.tabmail.openTab("abAll", constraints);
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
    this._constraintsChanged = true;
  },

  destroySpacerAndNextBubble: function destroySpacerAndNextBubble(aTextSpacer) {
    // kill the (next) bubble
    aTextSpacer.nextBubble.parentNode.removeChild(aTextSpacer.nextBubble);
    // kill the (current) spacer
    aTextSpacer.parentNode.removeChild(aTextSpacer);

    aTextSpacer.nextTextSpacer.prevBubble = aTextSpacer.prevBubble;
    aTextSpacer.nextTextSpacer.prevTextSpacer = aTextSpacer.prevTextSpacer;
    this._constraintsChanged = true;
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

