import Widget from "./widget";
import WidgetStateMixin from "./widget-state-mixin";

class WidgetDial extends Widget {
  /**
   * @constructor
   */
  constructor(container, o) {
    super(container, o);
  }

  /*========================
   * Init and Update Methods
   *========================*/

  /**
   * Initialize the options
   * @override
   * @protected
   */
  _initOptions(o) {
    this.o = {
      minVal: 0,
      maxVal: 127,
      needleColor: "#000",
      activeColor: "#f40",
      mouseSensitivity: 1.2
    };

    this.setOptions(o);
  }

  /**
   * Initialize state
   * @override
   * @protected
   */
  _initState() {
    const _this = this;

    this.state = {
      val: 0
    };

    this.stateConstraits = {
      val: {
        min: _this.o.minVal,
        max: _this.o.maxVal
      }
    }
  }

  /**
   * Initialize the svg elements
   * @override
   * @protected
   */
  _initSvgEls() {
    const _this = this;

    this.svgEls = {
      bgArc: document.createElementNS(this.SVG_NS, "path"),
      activeArc: document.createElementNS(this.SVG_NS, "path"),
      needle: document.createElementNS(this.SVG_NS, "line")
    };

    Object.keys(_this.svgEls).forEach(key => {
      _this.svg.appendChild(_this.svgEls[key]);
      _this.svgEls[key].setAttribute("shape-rendering", "geometricPrecision");
    });

    // draw the background arc
    this.svgEls.bgArc.setAttribute("d",
      _this._calcSvgArcPath(
        _this._calcNeedleCenter().x,
        _this._calcNeedleCenter().y,
        _this._calcDialRadius(),
        0.67 * Math.PI,
        2.35 * Math.PI
    ));
    this.svgEls.bgArc.setAttribute("stroke-width", _this._calcArcStrokeWidth());
    this.svgEls.bgArc.setAttribute("stroke", _this.o.needleColor);
    this.svgEls.bgArc.setAttribute("fill", "transparent");
    this.svgEls.bgArc.setAttribute("stroke-linecap", "round");

    // draw the active arc
    this.svgEls.activeArc.setAttribute("stroke-width", _this._calcArcStrokeWidth());
    this.svgEls.activeArc.setAttribute("stroke", _this.o.activeColor);
    this.svgEls.activeArc.setAttribute("fill", "transparent");
    this.svgEls.activeArc.setAttribute("stroke-linecap", "round");

    // draw the needle
    this.svgEls.needle.setAttribute("x1", _this._calcNeedleCenter().x);
    this.svgEls.needle.setAttribute("y1", _this._calcNeedleCenter().y);
    this.svgEls.needle.setAttribute("x2", _this._calcNeedleEnd().x);
    this.svgEls.needle.setAttribute("y2", _this._calcNeedleEnd().y);
    this.svgEls.needle.setAttribute("stroke-width", _this._calcNeedleWidth());
    this.svgEls.needle.setAttribute("stroke", _this.o.needleColor);
    this.svgEls.needle.setAttribute("z-index", "1000");
    this.svgEls.needle.setAttribute("stroke-linecap", "round");

    this._update();
  }

  /**
   * Initialize mouse and touch event handlers
   * @override
   * @protected
   */
   _initHandlers() {
      const _this = this;

      let y0 = 0;
      let yD = 0;
      let newVal = _this.getState().val;

      this.handlers = {
       touch: function(ev) {
         y0 = ev.clientY;

         document.addEventListener("mousemove", _this.handlers.move);
         document.addEventListener("touchmove", _this.handlers.move);
         document.addEventListener("mouseup", _this.handlers.release);
         document.addEventListener("touchend", _this.handlers.release);
       },
       move: function(ev) {
         yD = y0 - ev.clientY;
         y0 = ev.clientY;

         newVal = _this.state.val + (yD * _this.o.mouseSensitivity);
         newVal = Math.max(newVal, _this.o.minVal);
         newVal = Math.min(newVal, _this.o.maxVal);

         _this._setState({
           val: newVal
         })
       },
       release: function() {
         document.removeEventListener("mousemove", _this.handlers.move);
         document.removeEventListener("touchmove", _this.handlers.move);
       }
      };

      this.svg.addEventListener("mousedown", _this.handlers.touch);
      this.svg.addEventListener("touchstart", _this.handlers.touch);
   }

  /**
   * Update (redraw) component based on state
   * @override
   * @protected
   */
   _update() {
     // change the needle angle
     this.svgEls.needle.setAttribute("x1", this._calcNeedleCenter().x);
     this.svgEls.needle.setAttribute("y1", this._calcNeedleCenter().y);
     this.svgEls.needle.setAttribute("x2", this._calcNeedleEnd().x);
     this.svgEls.needle.setAttribute("y2", this._calcNeedleEnd().y);

     // change the active arc length
     this.svgEls.activeArc.setAttribute("d",
       this._calcSvgArcPath(
         this._calcNeedleCenter().x,
         this._calcNeedleCenter().y,
         this._calcDialRadius(),
         0.65 * Math.PI,
         this._calcNeedleAngle() - 0.5 * Math.PI
     ));

     // if the value is at min, change the color to match needle color
     // - otherwise the active part will be visible beneath the needle
     if (this.state.val === this.o.minVal) {
       this.svgEls.activeArc.setAttribute("stroke", this.o.needleColor);
     } else {
       this.svgEls.activeArc.setAttribute("stroke", this.o.activeColor);
     }
   }

  /* ==============
   * Helper Methods
   * ==============
   */

   /** Calculte the stroke width for the background and active arcs */
   _calcArcStrokeWidth() {
     return this._calcDialRadius() / 5;
   }

   /** Calculate the dial radius */
   _calcDialRadius() {
     let radius = (Math.min(this._getWidth(), this._getHeight()) / 2) * 0.89;
     radius = Math.trunc(radius);
     return radius;
   }

   /** Calculate the needle angle for a given state val */
   _calcNeedleAngle() {
     const _this = this;

     return (
              // protect against divide by 0:
              (this.o.maxVal - _this.o.minVal) !== 0
                ?
                    (_this.state.val - _this.o.minVal) / (_this.o.maxVal - _this.o.minVal)
                  * (1.7 * Math.PI)
                  + (1.15 * Math.PI)
                :
                  0.5 * (1.7 * Math.PI) + (1.15 * Math.PI)
            );
   }

   /** Calculate the center of the needle, return {x, y} */
   _calcNeedleCenter() {
     const _this = this;
     return {
       x: Math.trunc(_this._getWidth() / 2),
       y: Math.trunc(_this._getHeight() / 2)
     };
   }

   /** Calculate position of end of the needle, return {x, y} */
   _calcNeedleEnd() {
     const _this = this;
     return {
       x: _this._calcNeedleCenter().x + (Math.sin(_this._calcNeedleAngle()) * _this._calcDialRadius()),
       y: _this._calcNeedleCenter().y - (Math.cos(_this._calcNeedleAngle()) * _this._calcDialRadius())
     }
   }

   /** Calculate the needle width */
   _calcNeedleWidth() {
     return this._calcDialRadius() / 5;
   }

   /** Calculate the path for an svg arc based on cx, cy, r, startAngle, endAngle */
   _calcSvgArcPath(cx, cy, r, startAngle, endAngle) {
     let x1 = cx + (r * Math.cos(startAngle));
     let y1 = cy + (r * Math.sin(startAngle));
     let x2 = cx + (r * Math.cos(endAngle));
     let y2 = cy + (r * Math.sin(endAngle));
     let largeArc = (endAngle - startAngle) < Math.PI ? 0 : 1;
     let sweep = (endAngle - startAngle) < Math.PI ? 1 : 1;

     return ["M", x1, y1, "A", r, r, 0, largeArc, sweep, x2, y2].join(" ");
   }
}

export default WidgetDial
