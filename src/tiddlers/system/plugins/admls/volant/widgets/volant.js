/*\
created: 20190212164359746
type: application/javascript
title: $:/plugins/admls/volant/widgets/volant.js
tags: 
modified: 20190221190101349
module-type: widget

\*/
(function() {
  /*jslint node: true, browser: true */
  /*global $tw: false */
  "use strict";

  var Widget = require("$:/core/modules/widgets/widget.js").widget;

  var VolantWidget = function(parseTreeNode, options) {
    this.initialise(parseTreeNode, options);
  };

  /* 
	Inherit from the base widget class
	 */
  VolantWidget.prototype = new Widget();

  /* 
	Render this widget into the DOM. 
	*/
  VolantWidget.prototype.render = function(parent, nextSibling) {
    this.parentDomNode = parent;
    this.computeAttributes();
    this.execute();

    const position = this.position;
    let elmnt = this.parentDomNode;
    // Get the tiddler element that this widget runs in
    while (!elmnt.dataset.tiddlerTitle) {
      if (elmnt.tagName === "HTML") {
        return;
      }
      elmnt = elmnt.parentElement;
    }
    let tiddler = elmnt;
    this.tiddler = tiddler;

    // Hooks
    tiddler = $tw.hooks.invokeHook("volant-widget-render", tiddler);
    if (!tiddler) {
      return;
    }

    // Configure the tiddler element
    tiddler.className += " volant";
    tiddler.style.position = position;
    const resizerLeft = document.createElement("div");
    resizerLeft.className = "resizer resizer-left";
    const resizerRight = document.createElement("div");
    resizerRight.className = "resizer resizer-right";

    tiddler.appendChild(resizerLeft);
    tiddler.appendChild(resizerRight);

    this.getConfigTiddler(tiddler.dataset.tiddlerTitle);
    const configTiddlerTitle = this.configTiddlerTitle;

    const startDrag = function(e) {
      // Hooks
      e = $tw.hooks.invokeHook("volant-start-drag", e);
      if (!e) {
        return;
      }
      // Disable dragging if interior elements were target
      const dragModeIsOn =
        $tw.wiki.getTiddler("$:/plugins/admls/volant/config/values").fields
          .dragmode === "on";
      const targetIsChildElement = !(
        e.target.matches(".volant") || e.target.matches(".volant-wrapper")
      ); // This will be problematic if you have nested volant tiddlers
      const targetIsResizer = e.target.matches(".resizer"); // Stops drag if target is a resizer
      if (
        (e.button && e.button !== 0) ||
        targetIsResizer ||
        (!dragModeIsOn && targetIsChildElement)
      ) {
        return;
      }
      e.stopPropagation();
      e.preventDefault();

      const Volant = $tw.Volant;
      Volant.eventTiddler = tiddler;
      Volant.configTiddlerTitle = configTiddlerTitle;

      // get the mouse cursor position at startup:
      Volant.pos3 =
        e.clientX || (e.touches && e.touches[0].clientX) || Volant.pos3;
      Volant.pos4 =
        e.clientY || (e.touches && e.touches[0].clientY) || Volant.pos4;
      // call a function whenever the cursor/pointer moves:
      window.addEventListener("touchmove", Volant.tiddlerDrag);
      window.addEventListener("touchend", Volant.endDrag, false);
      window.addEventListener("mousemove", Volant.tiddlerDrag);
      window.addEventListener("mouseup", Volant.endDrag, false);
    };

    const startResize = function(e) {
      if (!e.target.classList.contains("resizer")) {
        return;
      }
      e.preventDefault();
      e.stopPropagation();

      const Volant = $tw.Volant;
      Volant.eventTiddler = tiddler;
      Volant.configTiddlerTitle = configTiddlerTitle;

      // Hooks
      e = $tw.hooks.invokeHook("volant-start-resize", e);
      if (!e) {
        return;
      }

      if (e.target.classList.contains("resizer-left")) {
        window.addEventListener("touchmove", Volant.resizeLeft);
        window.addEventListener("mousemove", Volant.resizeLeft);
      } else if (e.target.classList.contains("resizer-right")) {
        window.addEventListener("touchmove", Volant.resizeRight);
        window.addEventListener("mousemove", Volant.resizeRight);
      }
      window.addEventListener("touchend", Volant.endResize, false);
      window.addEventListener("mouseup", Volant.endResize, false);
    };

    this.boundPushEventToZStack = this.pushEventToZStack.bind(this);

    tiddler.addEventListener("touchstart", startDrag);
    tiddler.addEventListener("touchstart", this.boundPushEventToZStack);
    tiddler.addEventListener("touchstart", startResize);
    tiddler.addEventListener("mousedown", startDrag);
    tiddler.addEventListener("mousedown", this.boundPushEventToZStack);
    tiddler.addEventListener("mousedown", startResize);

    $tw.Volant.snapToGrid(tiddler);
    $tw.Volant.logNewDimensions(tiddler, configTiddlerTitle);
    $tw.Volant.pushTiddlerToZStack(tiddler);
  };

  VolantWidget.prototype.getConfigTiddler = function(title) {
    let tiddlerTitle = title;
    this.configTiddlerTitle = tiddlerTitle;
    if (!(this.separateConfig === "no")) {
      if ($tw.wiki.getTiddler(tiddlerTitle).hasField("draft.of")) {
        tiddlerTitle = $tw.wiki
          .getTiddler(tiddlerTitle)
          .getFieldString("draft.of");
      }

      const configTiddlerTitle = this.configTiddlerPrefix + tiddlerTitle;
      this.configTiddlerTitle = configTiddlerTitle;

      $tw.wiki.setText(
        configTiddlerTitle,
        "list",
        undefined,
        "[[" + tiddlerTitle + "]]",
        undefined
      );
      $tw.wiki.setText(
        configTiddlerTitle,
        "prefix",
        undefined,
        this.configTiddlerPrefix,
        undefined
      );

      const configTiddler = $tw.wiki.getTiddler(configTiddlerTitle);
      const modification = $tw.wiki.getModificationFields();
      const tag = $tw.Volant.configTiddlerTag;
      if (configTiddler) {
        modification.tags = (configTiddler.fields.tags || []).slice(0);
        $tw.utils.pushTop(modification.tags, tag);
        $tw.wiki.addTiddler(new $tw.Tiddler(configTiddler, modification));
      } else {
        const tags = [];
        tags.push(tag);
        $tw.wiki.addTiddler(
          new $tw.Tiddler(
            { title: configTiddlerTitle, tags: tags },
            modification
          )
        );
      }
    }
  };

  VolantWidget.prototype.pushEventToZStack = function(e) {
    const eventTiddler = $tw.Volant.getEventTiddler(e);

    // Hooks
    e = $tw.hooks.invokeHook("volant-push-event-to-zstack", e);
    if (!e) {
      return;
    }

    // Edge case: clicking on a link to "$:/state/zStack"
    if ((!e.button || e.button === 0) && e.target.matches(".tc-tiddlylink")) {
      const link = e.target.href;
      const titleStart = link.indexOf("#");
      const tiddlerTitle = decodeURIComponent(link.slice(titleStart + 1));

      if (tiddlerTitle === "$:/state/zStack") {
        // Send the click on its way as a navigate event
        const bounds = e.target.getBoundingClientRect();
        this.dispatchEvent({
          type: "tm-navigate",
          navigateTo: tiddlerTitle,
          navigateFromTitle: eventTiddler.dataset.tiddlerTitle,
          navigateFromNode: this,
          navigateFromClientRect: {
            top: bounds.top,
            left: bounds.left,
            width: bounds.width,
            right: bounds.right,
            bottom: bounds.bottom,
            height: bounds.height
          },
          navigateSuppressNavigation:
            e.metaKey || e.ctrlKey || (e.button && e.button !== 0),
          metaKey: e.metaKey,
          ctrlKey: e.ctrlKey,
          altKey: e.altKey,
          shiftKey: e.shiftKey
        });
        if (e.target.hasAttribute("href")) {
          e.preventDefault();
        }
        e.stopPropagation();

        return false;
      }

      $tw.Volant.pushTiddlerToZStack(eventTiddler);
    } else {
      // Push onto zStack
      $tw.Volant.pushTiddlerToZStack(eventTiddler);
    }
  };

  /*
	Compute the internal state of this widget.
	*/
  VolantWidget.prototype.execute = function() {
    this.position = this.getAttribute("position", "fixed");
    this.separateConfig = this.getAttribute("separateConfig", "no");
    this.configTiddlerPrefix = this.getAttribute(
      "configTiddlerPrefix",
      "$:/config/Volant/"
    );
  };

  /*
	Selectively refreshes the widget if needed. Returns true if the widget or any of its children needed re-rendering
	*/
  VolantWidget.prototype.refresh = function(changedTiddlers) {
    var changedAttributes = this.computeAttributes();
    if (
      changedAttributes.position ||
      changedAttributes.separateConfig ||
      changedAttributes.configTiddlerPrefix
    ) {
      this.refreshSelf();
      return true;
    } else {
      return false;
    }
  };

  exports.volant = VolantWidget;
})();
