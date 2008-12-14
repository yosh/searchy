var searchy = new function() {
  var $ = function(x) { return document.getElementById(x); };

  var req;

  this.go = function() {
    var panel = $('searchy');
    var width = Math.min(document.width - 40, 800);
    panel.setAttribute('width', width);
    panel.openPopup(document.getElementById('content'), 'overlap', (document.width-width)/2, 20);
    panel.focus();
  };

  this.input = function(aEvent) {
    query($('searchy-input').value);
  };

  function inputlistener(aEvent) {
    switch (aEvent.keyCode) {

    case aEvent.DOM_VK_RETURN:
      var url = current.getAttribute('href');
      $('searchy').hidePopup();
      var where = whereToOpenLink(aEvent);
      openUILinkIn(url, where);
      break;
    case aEvent.DOM_VK_UP:
      if (current && current.previousSibling) {
        current.removeAttribute('current');
        current = current.previousSibling;
        current.setAttribute('current', true);
      }
      break;
    case aEvent.DOM_VK_DOWN:
      if (current && current.nextSibling) {
        current.removeAttribute('current');
        current = current.nextSibling;
        current.setAttribute('current', true);
      }
      break;
    default:
      return;
    }

    aEvent.stopPropagation();
    aEvent.preventDefault();
  };

  this.focused = function() {
    $('searchy-input').focus();
    $('searchy-input').setSelectionRange(0, $('searchy-input').value.length);
    window.addEventListener('keypress', inputlistener, true);
  };

  this.hidden = function() {
    if (req) { req.abort(); }
    window.removeEventListener('keypress', inputlistener, true);
  };

  function currentHost() {
    return gBrowser.selectedBrowser.webNavigation.currentURI.host;
  }

  function urlFor(search) {
    var base = "http://boss.yahooapis.com/ysearch/web/v1/%QUERY%?start=0&count=10&filter=-hate-porn&appid=" +
      "QyNODEPV34HR033oKtxhT739.BxdON8LsJp7ZavlLzMA2MwaozRCruycKu8FAVjA";

    if (search[0] == '.') {
      search = search.slice(1) + " site:" + currentHost();
    }

    return base.replace('%QUERY%', encodeURIComponent(search));
  }

  function query(input) {
    if (req) {
      req.abort();
    }

    req = Cc["@mozilla.org/xmlextras/xmlhttprequest;1"]
      .createInstance(Ci.nsIXMLHttpRequest);
    req.mozBackgroundRequest = true;
    req.open("GET", urlFor(input));
    req.onreadystatechange = process;
    req.send(null);
  }

  var current;

  function process() {
    if ((req.readyState == 4) && (req.status == 200)) {
      var nsJSON = Cc["@mozilla.org/dom/json;1"]
        .createInstance(Ci.nsIJSON);

      var json = nsJSON.decode(req.responseText);

      var box = $('searchy-results');
      while (box.firstChild) {
        box.removeChild(box.firstChild);
      }

      current = null;

      json.ysearchresponse.resultset_web.forEach(
        function(result) {
          var vbox = document.createElement('vbox');
          vbox.setAttribute('class', 'result');
          vbox.setAttribute('href', result.clickurl);
          var title = document.createElementNS("http://www.w3.org/1999/xhtml", "html:div");
          title.setAttribute('class', 'title');
          appendHTMLtoXUL(result.title, title);
          vbox.appendChild(title);
          var description = document.createElementNS("http://www.w3.org/1999/xhtml", "html:div");
          description.setAttribute('class', 'description');
          appendHTMLtoXUL(result.abstract, description);
          vbox.appendChild(description);
          box.appendChild(vbox);

          if (!current) {
            vbox.setAttribute('current', true);
            current = vbox;
          }
        });

    }
  }

  function appendHTMLtoXUL(html, node) {
    html.split(/<b>(.*?<\/b>)|([^<]*)/).forEach(
      function(text) {
        var span = document.createElementNS("http://www.w3.org/1999/xhtml", "html:span");
        if (text.match(/<\/b>$/)) {
          span.setAttribute('class', 'bold');
          text = text.slice(0, text.length - 4);
        }

        /* FIXME: instead of deleting <wbr>, instead create multiple spans
         *        so the layout engine can wrap the layout - JA
         */

        text = text.replace(/<wbr>/g, "");

        /* convert XML UTF-16 entities to string characters */
        text = text.replace(/&#(\d+);/g, function() { return String.fromCharCode(RegExp.$1); });

        /* convert some of the more popular XML entities in text */
        text = text.replace(/&quote;/g, '"');
        text = text.replace(/&gt;/g, '>');
        text = text.replace(/&lt;/g, '<');
        text = text.replace(/&amp;/g, '&');

        span.appendChild(document.createTextNode(text));
        node.appendChild(span);
      });
  }
};
