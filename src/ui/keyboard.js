import Widget from "ui/widget";
import Constraint from "util/constraint";
import ConstraintSpec from "util/constraint-def";

/**
 * Class representing an piano keyboard widget
 *
 * @class
 * @implements {Widget}
 */
class Keyboard extends Widget {

  /**
   * @constructor
   * @param {object} container - DOM container for the widget.
   * @param {object} [o] - Options.
   * @param {number} [o.bottomNote=48] - The bottom note (MIDI pitch) of the keyboard.
   * @param {number} [o.topNote=71] - The top note (MIDI pitch) of the keyboard.
   * @param {string} [o.keyBorderColor="#484848"] - The color of the border separating the keys.
   * @param {string} [o.blackKeyColor="#484848"] - The color used for the black keys.
   * @param {string} [o.whiteKeyColor="#fff"] - The color used for the white keys.
   * @param {string} [o.blackKeyActiveColor="#888"] - The color used to represent an active black key.
   * @param {string} [o.whiteKeyActiveColor="#333"] - The color used to represent an active white key.
   * @param {string} [o.orientation="horizontal"] - The keyboard orientation. Possible values are
   *                                              "horizontal", "vertical", "horizontal-mirrored",
   *                                              and "vertical-mirrored".
   * @param {string} [o.mode="polyphonic"] - The polyphony mode. Possible values are 'monophonic'
   *                                       (only one active note at a time), or 'polyphonic'
   *                                       (can have several active notes at a time).
   * @param {boolean} [o.isEditable=true] - Boolean specifying whether the keyboard
   *                                      is editable by the mouse or touch interactions.
   *                                      A non-editable keyboard may be used as a visual
   *                                      diagram, for example.
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
   * @private
   */
  _initOptions(o) {
    // set the defaults
    this.o = {
      bottomNote: 48,
      topNote: 71,
      keyBorderColor: "#484848",
      blackKeyColor: "#484848",
      whiteKeyColor: "#fff",
      blackKeyActiveColor: "#888",
      whiteKeyActiveColor: "#333",
      mode: "polyphonic",
      orientation: "horizontal",
      isEditable: true,
      mouseSensitivity: 1.2
    };

    // override defaults with provided options
    this.setOptions(o);
  }

  /**
   * Initialize state constraints
   * @override
   * @private
   */
  _initStateConstraints() {
    const _this = this;

    this.stateConstraits = new ConstraintSpec({
      activeNotes: [{
        pitch: new Constraint({ min: 0, max: 127 }),
        vel: new Constraint({ min: 0, max: 127})
      }]
    });
  }

  /**
   * Initializes the state.
   * State is represented as an array of active notes, each of which is an object
   * { pitch, vel }, where pitch is MIDI pitch (0 - 127) and vel is MIDI velocity
   * (0 - 127). A vel of 0 is reported once for each note-off event, and not
   * reported on subsequent callback notifications.
   *
   * @override
   * @private
   */
  _initState() {
    this.state = {
      activeNotes: []
    };
  }

  /**
   * Initialize the svg elements
   * @override
   * @private
   */
  _initSvgEls() {
    const _this = this;

    this.svgEls = {
      keys: []
    };

    //TODO: IMPLEMENT SVG_ELS ATTRIBUTES

    this._appendSvgEls();
    this._update();
  }

  /**
   * Updates the SVG elements. 
   */
  _updateSvgEls() {
    
    // add SVG elements representing keys to match current number of keys
    for (let i = this.svgEls.keys.length; i < this._getNumKeys(); ++i) {
      this._addSvgKey();
    }

    // remove SVG elements representing keys to match current number of keys
    for (let i = this.svgEls.keys.length; i > this._getNumKeys(); ++i) {
      this._removeSvgKey();
    }
  }

  /**
   * Initializes mouse and touch event handlers.
   * @override
   * @private
   */
  _initHandlers() {
    const _this = this;

    //TODO: IMPLEMENT HANDLER FUNCTIONS
    this.handlers = {
      touch: function(ev) {
      },
      move: function(ev) {
      },
      release: function() {
      }
    };

    //TODO: ASSIGN INIT HANDLERS
  }

  /**
   * Updates (redraws) component based on state.
   *
   * @override
   * @private
   */
  _update() {
    
    this._updateSvgEls();

    for (let keyIdx = 0, whiteKeyIdx = 0; keyIdx < this.svgEls.keys; ++keyIdx) {
      let curNote = this._getNoteNumberForKeyIndex(keyIdx);

      if (this._isWhiteKey(curNote)) {
        ++whiteKeyNum;

        xPos = this._getWhiteKeyWidth() * whiteKeyNum;
        yPos = 0;
        width = this._getWhiteKeyWidth();
        height = this._getKeyboardHeight();
        
      } else {

        // black keys are offset by 2/3 of white key width, and are 2/3 width and height of black keys
        xPos = (this._getWhiteKeyWidth() * whiteKeyNum) + ( (2/3) * this._getWhiteKeyWidth() );
        yPos = 0;
        width = (2/3) * this._getWhiteKeyWidth();
        height = (2/3) * this._getKeyboardHeight();
      }

      if ()
    }
    //TODO: IMPLEMENT UPDATE
    //TODO: IMPLEMENT UPDATE EDGE CASES
  }

  /* ===========================================================================
  *  PUBLIC API
  */

  /**
   * Sets the options.
   * @public
   * @override
   * @param {object} [o] - Options to set. See {@link Keyboard#constructor} for list of options. 
   */
  setOptions(o) {
    o = o || {};

    // ensure that the bottom note is a white key (a black key cannot be at the edge when drawing the keyboard)
    if (o.bottomNote !== undefined && !this._isWhiteKey(o.bottomNote)) {
      --o.bottomNote;
    }

    // ensure that the bottom note is a white key (a black key cannot be at the edge when drawing the keyboard)
    if (o.topNote !== undefined && !this._isWhiteKey(o.topNote)) {
      ++o.topNote;
    }

    super.setOptions(o);
  }

  /**
   * Returns the current keyboard value as an array of pitch and velocity ( { pitch, vel } ) objects.
   * Notes that were just turned off (noteoff) will be represented with a 0 vel value.
   * @public
   * @returns {array} - An array of active notes.
   */
  getVal() {
    return this.getState().activeNotes;
  }

  /**
   * Sets the current keyboard state using an array of {pitch, val} objects.
   * Same as setVal(), but will not cause an observer callback trigger.
   * @public
   * @param {array} newVal - New value (array representing active notes with each entry in the form {pitch, val}).
   */
  setInternalVal(newVal) {
    this.setInternalState({ activeNotes: newVal });
  }

  /**
   * Sets the current keyboard state using an array of {pitch, val} objects.
   * Same as setInternalVal(), but will cause an observer callback trigger.
   * @public
   * @param {array} newVal - New value (array representing active notes with each entry in the form {pitch, val}).
   */
  setVal(newVal) {
    this.setState({ activeNotes: newVal });
  }

  /* ===========================================================================
  *  INTERNAL FUNCTIONALITY
  */

  /**
   * Adds an SVG element representing a key.
   */
  _addSvgKey() {
    let newKey = document.createElementNS(this.SVG_NS, "rect");
    this.svg.appendChild(newKey);
    this.svgEls.keys.push(newKey);
  }

  /**
   * Removes an SVG element representing a key.
   */
  _removeSvgKey() {
    let key = this.svgEls.keys[this.svgEls.keys.length - 1];

    this.svg.removeChild(key);
    key = null;
    this.svgEls.keys.pop();
  }

  /* ===========================================================================
  *  HELPER METHODS
  */

  /**
   * Returns the width of the keyboard, taking orientation into account.
   * If orientation is horizontal, width of the keyboard would equal
   * width of the canvas. If orientation is vertical, width of the
   * keyboard would equal the height of the canvas.
   * @private
   * @throws {Error} if o.orientation is not one of the allowed values.
   */
  _getKeyboardWidth() {
    let orientation = this.o.orientation;

    try {
      if (orientation === "horizontal" || orientation === "horizontal-mirrored") {
        return this._getWidth();
      } else if (orientation === "vertical" || orientation === "vertical-mirrored") {
        return this._getHeight();
      } else {
        throw(new Error("'orientation' option ", orientation,
          " is not one of the allowed values: 'horizontal', 'horizontal-mirrored'",
          " 'vertical', 'vertical-mirrored'"));
      }
    } catch (err) {
      console.log(err);
    }
  }

  /**
   * Returns the height of the keyboard, taking orientation into account.
   * If orientation is horizontal, height of the keyboard would equal
   * height of the canvas. If orientation is vertical, height of the
   * keyboard would equal the width of the canvas.
   * @private
   * @throws {Error} if o.orientation is not one of the allowed values.
   */
  _getKeyboardHeight() {
    let orientation = this.o.orientation;

    try {
      if (orientation === "horizontal" || orientation === "horizontal-mirrored") {
        return this._getWidth();
      } else if (orientation === "vertical" || orientation === "vertical-mirrored") {
        return this._getHeight();
      } else {
        throw(new Error("'orientation' option ", orientation,
          " is not one of the allowed values: 'horizontal', 'horizontal-mirrored'",
          " 'vertical', 'vertical-mirrored'"));
      }
    } catch (err) {
      console.log(err);
    }
  }

  /**
   * Returns the MIDI note number for the given key number.
   * @private
   * @param {number} keyIdx - The index of the key to be queried.
   * @returns {number} - MIDI note number for the given key number
   */
  _getNoteNumberForKeyIndex(keyIdx) {
    return this.getOptions().bottomNote + keyIdx;
  }

  /** 
   * Returns the total number of keys on the keyboard. 
   * @private
   * @returns {number} - Total number of keys.
   */
  _getNumKeys() {
    return (this.o.topNote - this.o.bottomNote) + 1;
  }

  /**  
   * Returns the number of white keys on the keyboard.
   * @private
   * @returns {number} - Number of white keys. 
   */
  _getNumWhiteKeys() {
    let whiteKeyCount = 0;

    for (let curNote = this.getOptions().bottomNote; curNote <= this.getOptions().topNote; ++curNote) {
      if (this._isWhiteKey(curNote)) {
        ++whiteKeyCount;
      }
    }
  }

  /** 
   * Returns the width of each white key in px.
   * @private
   * @returns {number} - Width of each white key in px.
   */
  _getWhiteKeyWidth() {
    return this._getKeyboardWidth() / this._getNumWhiteKeys();
  }

  /**
   * Returns true if the given MIDI note number is a white key on the piano.
   * @private
   * @param {number} note - The MIDI note number for the given note. 
   * @returns {boolean} - True if the note is a white key, false if not.
   */
  _isWhiteKey(note) {
    if (note % 12 === 0  
      || note % 12 === 2 
      || note % 12 === 4 
      || note % 12 === 5 
      || note % 12 === 7 
      || note % 12 === 9 
      || note % 12 === 11) {
        return true;
    } else {
      return false;
    }
  }



  //TODO: IMPLEMENT HELPER METHODS


}

export default Keyboard
