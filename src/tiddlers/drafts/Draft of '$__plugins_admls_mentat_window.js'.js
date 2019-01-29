/*\
created: 20190128235608769
title: Draft of '$:/plugins/admls/mentat/window.js'
tags: 
modified: 20190128235914062
type: application/javascript
draft.title: $:/plugins/admls/mentat/window.js
draft.of: $:/plugins/admls/mentat/window.js
\*/
const zstack = []; // For assigning z-indices.

document.querySelectorAll(".tc-tagged-Window").forEach(elmnt => {
  // log the dimension info to the .content div
  function logDimensions() {
    const content = elmnt.querySelector(".content");
    content.querySelector(".top").innerHTML = elmnt.style.top.slice(0, -2) || elmnt.offsetTop;
    content.querySelector(".left").innerHTML = elmnt.style.left.slice(0, -2)|| elmnt.offsetLeft;
    content.querySelector(".height").innerHTML = elmnt.style.height.slice(0, -2) || elmnt.offsetHeight;
    content.querySelector(".width").innerHTML = elmnt.style.width.slice(0, -2) || elmnt.offsetWidth;
  }
  
  function queryLog(elmnt, styleAttribute) {
    const content = elmnt.querySelector(".content");
    return content.querySelector(`.${styleAttribute}`).innerHTML;
  }
  
  function getSize() {
    elmnt.style.width = queryLog(elmnt, "width") + 'px';
    elmnt.style.height = queryLog(elmnt, "height") + 'px';
  }
  
  function getPosition() {
    elmnt.style.top = queryLog(elmnt, "top") + 'px';
    elmnt.style.left = queryLog(elmnt, "left") + 'px';
  }
  
  logDimensions();
  getSize();
  getPosition();
  elmnt.addEventListener("mousedown", dragMouseDown, false);
  elmnt.addEventListener("mousedown", zPosition, false);
  let pos1 = 0, pos2 = 0, pos3 = 0, pos4 = 0;
  
  function remove(array, element) {
    const index = array.indexOf(element);
    if (index !== -1) {
      array.splice(index, 1);
    }
  }
  
  function zPosition(e) {
    // Removes element from stack and then adds it to the end.
    remove(zstack, elmnt);
    zstack.push(elmnt);
    // Assigns z-index to the elements in zstack based on position.
    for (let i = 0; i < zstack.length; i++) {
      zstack[i].style.zIndex = i * 10;
    }
  }
  
  function dragMouseDown(e) {
    // The dragging won't occur if the click is on some other element within mydiv.
    if (!e.target.className.includes("mydiv")) {
      return;
    }
    // get the mouse cursor position at startup:
    pos3 = e.clientX;
    pos4 = e.clientY;
    // call a function whenever the cursor moves:
    window.addEventListener('mousemove', elementDrag, false);
    window.addEventListener('mouseup', closeDragElement, false);
  }
    
  function elementDrag(e) {
    e = e || window.event;
    e.preventDefault();
    // calculate the new cursor position:
    pos1 = pos3 - e.clientX;
    pos2 = pos4 - e.clientY;
    pos3 = e.clientX;
    pos4 = e.clientY;
    // set the element's new position: prevent them from
    // running of the window (assumes fixed)
    if (elmnt.style.position = "fixed") {
    if (elmnt.offsetTop - pos2 >= 0 && window.innerHeight >= elmnt.offsetTop - pos2 + elmnt.offsetHeight) {
      const top = queryLog(elmnt, "top");
      elmnt.style.top = (top - pos2) + "px";
    };
    if (elmnt.offsetLeft - pos1 >= 0 && window.innerWidth >= elmnt.offsetLeft - pos1 + elmnt.offsetWidth) {
      const left = queryLog(elmnt, "left");
      elmnt.style.left = (left - pos1) + "px";
    };
    } else {
      const top = queryLog(elmnt, "top");
      const left = queryLog(elmnt, "left");
      elmnt.style.top = (top - pos2) + "px";
      elmnt.style.left = (left - pos1) + "px";
    }
    logDimensions();
  }

  function closeDragElement() {
    // stop moving when mouse button is released:
    window.removeEventListener('mousemove', elementDrag, false);
    window.removeEventListener('mouseup', closeDragElement, false);
  }
  
  const resizer = elmnt.querySelector(".resizer");
  resizer.addEventListener('mousedown', initResize, false);

  function initResize(e) {
     window.addEventListener('mousemove', Resize, false);
     window.addEventListener('mouseup', stopResize, false);
  }
  function Resize(e) {
    getSize();
     elmnt.style.width = (e.clientX - elmnt.offsetLeft) + 'px';
     elmnt.style.height = (e.clientY - elmnt.offsetTop) + 'px';
     logDimensions();
  }
  function stopResize(e) {
    window.removeEventListener('mousemove', Resize, false);
    window.removeEventListener('mouseup', stopResize, false);
  }

  });