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

};
window.addEventListener("load", function(e) { experimentaltoolbar.onLoad(e); }, false);
