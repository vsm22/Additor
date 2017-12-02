import Widget from "ui/widget";
import Constraint from "util/constraint";
import ConstraintSpec from "util/constraint-def";

/**
 * Class representing an Dropmenu widget
 * @class
 * @implements {Widget}
 */
class Dropmenu extends Widget {

  /**
   * @constructor
   * @param {object} container - DOM container for the widget.
   * @param {object} [o] - Options.
   * @param {string} [o.backgroundColor="#282828"] - The background color.
   * @param {string} [o.fontColor="#aaa"] - The font color.
   * @param {string} [o.fontSize="12px"] - The font size.
   * @param {string} [o.fontFamily="Arial"] - The font family.
   * @param {string} [o.menuItemFontSize="12px"] - The font size for items in the opened drop-down menu.
   * @param {string} [o.menuItemFontFamily="Arial"] - The font family for items in the opened drop-down menu.
   * @param {string} [o.selectedItemBackgroundColor="#f40"] - The background cover for the selected (hovered) item in the opened drop-down menu.
   * @param {string} [o.selectedItemFontColor="#fff"] - The font color for the selected (hovered) item in the opened drop-down menu.
   */
  constructor(container, o) {
    super(container, o);
  }

  /* ===========================================================================
  *  INITIALIZATION METHODS
  */

  /**
   * Initialize the options
   * @override
   * @protected
   */
  _initOptions(o) {
    // set the defaults
    this.o = {
      backgroundColor: "#282828",
      fontColor: "#ddd",
      fontSize: "12px",
      fontFamily: "Arial",
      menuItemFontSize: "12px",
      menuItemFontFamily: "Arial",
      selectedItemBackgroundColor: "#f40",
      selectedItemFontColor: "#fff",
      mouseSensitivity: 1.2
    };

    // override defaults with provided options
    super._initOptions(o);
  }

  /**
   * Initialize state constraints
   * @override
   * @protected
   */
  _initStateConstraints() {
    const _this = this;

    this.stateConstraints = new ConstraintSpec({
      menuItems: [new Constraint()],
      selectedItemIdx: new Constraint(),
      hasFocus: new Constraint()
    });
  }

  /**
   * Initialize state
   * @override
   * @protected
   */
  _initState() {
    this.state = {
      menuItems: [],
      selectedItemIdx: 0,
      hasFocus: false
    };
  }

  /**
   * Initialize the svg elements
   * @override
   * @protected
   */
  _initSvgEls() {
    const _this = this;

    /* The following components are used:
     *  Panels are the background
     *  Text is where the text lives
     *  Overlays are transparent and are used to listen to mouse events
     */
    this.svgEls = {
      menuTogglePanel: document.createElementNS(_this.SVG_NS, "rect"),
      menuToggleText: document.createElementNS(_this.SVG_NS, "text"),
      menuToggleOverlay: document.createElementNS(_this.SVG_NS, "rect"),
      menuBodyCanvasContainer: document.createElement("div"),
      menuBodyCanvas: document.createElementNS(_this.SVG_NS, "svg"),
      menuBodyPanel: document.createElementNS(_this.SVG_NS, "rect"),
      menuItemPanels: [],
      menuItemTextboxes: [],
      menuItemOverlays: []
    };

    this.svg.appendChild(this.svgEls.menuTogglePanel);
    this.svg.appendChild(this.svgEls.menuToggleText);
    this.svg.appendChild(this.svgEls.menuToggleOverlay);

    this.svgEls.menuToggleText.setAttribute("alignment-baseline", "middle");

    // menu body (the part that is hidden unless toggled)

    this.svgEls.menuBodyCanvasContainer.style.position = "relative";
    this.container.appendChild(this.svgEls.menuBodyCanvasContainer);
    this.svgEls.menuBodyCanvas = document.createElementNS(_this.SVG_NS, "svg");
    this.svgEls.menuBodyCanvasContainer.appendChild(this.svgEls.menuBodyCanvas);
    this.svgEls.menuBodyCanvas.style.position = "absolute";
    this.svgEls.menuBodyCanvas.style.transform = "translateY(-5px)";
    this.svgEls.menuBodyCanvas.appendChild(this.svgEls.menuBodyPanel);

    this._update();
  }

  /**
   * Initialize mouse and touch event handlers
   * @override
   * @protected
   */
  _initHandlers() {
    const _this = this;

    this.handlers = {

      touch: function touch(ev) {
        ev.preventDefault();
        _this.handlers.focus(ev);
      },

      focus: function focus(ev) {
        ev.preventDefault();
        
        _this.setInternalState({ hasFocus: true });

        _this.svgEls.menuToggleOverlay.removeEventListener("mousedown", _this.handlers.touch);
        _this.svgEls.menuToggleOverlay.removeEventListener("touchstart", _this.handlers.touch);
        _this.svgEls.menuToggleOverlay.addEventListener("mousedown", _this.handlers.blur);
        _this.svgEls.menuToggleOverlay.addEventListener("touchstart", _this.handlers.blur);
      },

      blur: function blur(ev) {
        ev.preventDefault();

        _this.setInternalState({ hasFocus: false });

        _this.svgEls.menuToggleOverlay.removeEventListener("mousedown", _this.handlers.blur);
        _this.svgEls.menuToggleOverlay.removeEventListener("touchstart", _this.handlers.blur);
        _this.svgEls.menuToggleOverlay.addEventListener("mousedown", _this.handlers.touch);
        _this.svgEls.menuToggleOverlay.addEventListener("touchstart", _this.handlers.touch);
      },

      mouseOverItem: function mouseOverItem(ev) {
        ev.preventDefault();

        let targetdOverlay = ev.target;
        _this._mouseOverItem(targetOverlay);

        targetOverlay.addEventListener("mouseleave", _this.handlers.mouseLeaveItem);
        targetOverlay.addEventListener("mouseup", _this.handlers.select);
        targetOverlay.addEventListener("touchend", _this.handlers.select);      
      },

      mouseLeaveItem: function mouseLeaveItem(ev) {
        ev.preventDefault();
        let targetOverlay = ev.target;   
        _this._mouseLeaveItem(ev.target, false);

        targetOverlay.removeEventListener("mouseleave", _this.handlers.hoverOut);
      },

      select: function select(ev) {
        ev.preventDefault();
        _this._selectItem(ev.target);
      }
    };

    this.svgEls.menuToggleOverlay.addEventListener("mousedown", this.handlers.touch);
    this.svgEls.menuToggleOverlay.addEventListener("touchstart", this.handlers.touch);
  }

  /**
   * Update (redraw) component based on state
   * @override
   * @protected
   */
  _update() {
    const _this = this;

    _this._updateEls();

    for (let i = 0; i < _this.state.menuItems.length; ++i) {
      _this.svgEls.menuItemTextboxes[i].textContent = _this.state.menuItems[i];
    }

    // Set attributes for the toggle area
    this.svgEls.menuTogglePanel.setAttribute("fill", _this.o.backgroundColor);
    this.svgEls.menuTogglePanel.setAttribute("width", _this._getWidth());
    this.svgEls.menuTogglePanel.setAttribute("height", _this._getHeight());

    this.svgEls.menuToggleText.setAttribute("x", 10);
    this.svgEls.menuToggleText.setAttribute("y", 10);
    this.svgEls.menuToggleText.setAttribute("fill", _this.o.fontColor);

    this.svgEls.menuToggleOverlay.setAttribute("fill", "transparent");
    this.svgEls.menuToggleOverlay.setAttribute("width", _this._getWidth());
    this.svgEls.menuToggleOverlay.setAttribute("height", _this._getHeight());

    this.svgEls.menuToggleText.textContent = _this.state.menuItems[_this.state.selectedItemIdx];
    
    // Set attributes for the menu body
    if (this.state.hasFocus) {
      this.svgEls.menuBodyCanvas.style.display = "inline-block";

      let menuItemDims = _this._calcMenuItemDims();
      let menuDims = {
        height: menuItemDims.height * _this.state.menuItems.length, 
        width: menuItemDims.width
      };

      this.svgEls.menuBodyCanvas.setAttribute("width", menuDims.width);
      this.svgEls.menuBodyCanvas.setAttribute("height", menuDims.height);
      this.svgEls.menuBodyCanvas.style.left = 0;

      this.svgEls.menuBodyPanel.setAttribute("width", menuDims.width);
      this.svgEls.menuBodyPanel.setAttribute("height", menuDims.height);
      this.svgEls.menuBodyPanel.setAttribute("x", 0);
      this.svgEls.menuBodyPanel.setAttribute("y", 0);
      this.svgEls.menuBodyPanel.setAttribute("fill", this.o.backgroundColor);

      for (let i = 0; i < this.state.menuItems.length; ++i) {
        let curPanel = this.svgEls.menuItemPanels[i];
        let curTextbox = this.svgEls.menuItemTextboxes[i];
        let curOverlay = this.svgEls.menuItemOverlays[i];

        curPanel.setAttribute("x", 0);
        curPanel.setAttribute("y", i * menuItemDims.height);
        curPanel.setAttribute("width", menuItemDims.width);
        curPanel.setAttribute("height", menuItemDims.height);
        curPanel.setAttribute("fill", "transparent");
        curTextbox.setAttribute("fill", _this.o.fontColor);
        curTextbox.setAttribute("x", 10);
        curTextbox.setAttribute("y", ((i + 1) * menuItemDims.height) - 6);
        curOverlay.setAttribute("x", 0);
        curOverlay.setAttribute("y", i * menuItemDims.height);
        curOverlay.setAttribute("width", menuItemDims.width);
        curOverlay.setAttribute("height", menuItemDims.height);
        curOverlay.setAttribute("fill", "transparent");  
      }
    } else {
      console.log("no focus");
      this.svgEls.menuBodyCanvas.style.display = "none";
    }
  }

  /**
   * Update elements to match SVG representation with the state.
   * @private
   */
  _updateEls() {
    const _this = this;

    for (let i = this.svgEls.menuItemTextboxes.length; i < this.state.menuItems.length; ++i) {
      _this._addSvgMenuItem();
    }

    for (let i = this.state.menuItems.length; i > this.svgEls.menuItemTextboxes.length ; --i) {
      _this._removeSvgMenuItem();
    }
  }
  /* ===========================================================================
  *  PUBLIC API
  */

  /**
   * Get public representation of the state.
   * @abstract
   * @public
   * TODO: IMPLEMENT getVal()
   */
  getVal() {
    return this.getState().selectedItemIdx;
  }

  /**
   * Set the current state in a format specific to each widget.
   * Same as setVal(), but will not cause an observer callback trigger.
   * @abstract @public
   * TODO: IMPLEMENT setInternalVal()
   */
  setInternalVal(newVal) {
    throw new Error("Abstract method setInternalVal() must be implemented by subclass");
  }

  /**
   * Set the current state in a format specific to each widget.
   * Same as setInternalVal(), but will cause an observer callback trigger.
   * @abstract @public
   * TODO: IMPLEMENT setVal()
   */
  setVal(newVal) {
    throw new Error("Abstract method setVal() must be implemented by subclass");
  }

  /**
   * Set the menu items to use.
   * @public
   * @param {array} menuItems - Array of menu items to use. 
   */
  setMenuItems(menuItems) {
    this.setState({ menuItems: menuItems});
  }

  /* ===========================================================================
  *  HELPER METHODS
  */

  /**
   * Handles mouse over event for menu item.
   * @private
   * @param {SvgElement} targetOverlay - The overlay of the item being hovered.
   */
  _mouseOverItem(targetOverlay) {
    const _this = this;

    let idx = _this.svgEls.menuItemOverlays.findIndex(overlay => overlay === targetOverlay);

    if (idx !== -1) {
      let targetPanel = _this.svgEls.menuItemPanels[idx];
      let targetTextbox = _this.svgEls.menuItemTextboxes[idx];

      targetPanel.setAttribute("fill", _this.o.selectedItemBackgroundColor);
      targetTextbox.setAttribute("fill", _this.o.selectedItemFontColor);
    }
  }

  /**
   * Handles mouse leave event for menu item.
   * @private
   * @param {SvgElement} targetOverlay - The overlay of the target item.
   */
  _mouseLeaveItem(targetOverlay) {
    const _this = this;
    
    let idx = _this.svgEls.menuItemOverlays.findIndex(overlay => overlay === targetOverlay);

    if (idx !== -1) {
      let targetPanel = _this.svgEls.menuItemPanels[idx];
      let targetTextbox = _this.svgEls.menuItemTextboxes[idx];

      targetPanel.setAttribute("fill", "transparent");
      targetTextbox.setAttribute("fill", _this.o.fontColor);      
    }
  }

  /**
   * Add svg elements representing a menu item.
   */
  _addSvgMenuItem() {
    const _this = this;

    let newItemText = document.createElementNS(this.SVG_NS, "text");
    let newItemPanel = document.createElementNS(this.SVG_NS, "rect");
    let newItemOverlay = document.createElementNS(this.SVG_NS, "rect");
    
    this.svgEls.menuItemTextboxes.push(newItemText);
    this.svgEls.menuItemPanels.push(newItemPanel);
    this.svgEls.menuItemOverlays.push(newItemOverlay);

    this.svgEls.menuBodyCanvas.appendChild(newItemPanel);
    this.svgEls.menuBodyCanvas.appendChild(newItemText);
    this.svgEls.menuBodyCanvas.appendChild(newItemOverlay);

    newItemOverlay.addEventListener("mouseenter", (ev) => { _this.handlers.mouseOverItem(ev); });
  }

  /**
   * Remove svg elements representing a menu item.
   */
  _removeSvgMenuItem() {
    let targetItemTexbox = this.svgEls.menuItemTextboxes.pop();
    let targetItemPanel = this.svgEls.menuItemPanels.pop();
    let targetItemOverlay = this.svgEls.menuItemPanels.pop();

    this.svgEls.menuBodyCanvas.removeChild(targetItemTexbox);
    this.svgEls.menuBodyCanvas.removeChild(targetItemPanel);
    this.svgEls.menuBodyCanvas.removeChild(targetItemOverlay);

    targetItemTexbox = null;
    targetItemPanel = null;
    targetItemOverlay = null;
  }

  /**
   * Calculate the height of each menu item.
   * @returns {number} - Height in px.
   */
  _calcMenuItemDims() {
    let maxHeight = 0;
    let maxWidth = 0;
    
    this.svgEls.menuItemTextboxes.forEach(item => {
      let bbox = item.getBoundingClientRect();
      maxHeight = maxHeight > bbox.height ? maxHeight : bbox.height;
      maxWidth  = maxWidth > bbox.width ? maxWidth : bbox.width;
    });

    maxWidth = Math.max(maxWidth, this._getWidth());

    maxHeight += 10;
    maxWidth += 5;

    return { width: maxWidth, height: maxHeight };
  }

  /**
   * Marks a menu element as selected.
   * @param {SvgElement} targetOverlay 
   */
  _selectItem(targetOverlay) {
    const _this = this;

    let idx = _this.svgEls.menuItemOverlays.findIndex(overlay => overlay === targetOverlay);

    if (idx !== -1) {
      _this.setState({ selectedItemIdx: idx });
    }
  }

}

export default Dropmenu;
