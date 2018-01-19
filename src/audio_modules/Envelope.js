'use strict';

class Envelope {

  /**
   * Envelope
   * <p>
   * Envelope values are specified as 2D arrays in the form
   * <b>[ [t(0), a(0)], [t(1), a(1)], ... [t(i), a(i)] ]</b>,
   * where <b>t(i)</b> specifies the time, in seconds,
   * and <b>a(i)</b> specifies the amplitude of the envelope at the vertex <b>i</b>.
   * </p>
   * @param {object} o - Options
   * @param {AudioContext} o.audioCtx - The audio context to be used.
   * @param {array} o.attackEnvelope - 2D array specifying the attack envelope
   * @param {array} o.releaseEnvelope - 2D array specifying the release envelope
   */
  constructor (audioCtx, o) {
    o = o || {};

    this._audioCtx = audioCtx;

    this._envGain = this._audioCtx.createGain();
    this._envGain.gain.value = 0;

    this.input = this._envGain;
    this.output = this._envGain;
    this._audioModuleInput = this.input;
    this._audioModuleOutput = this.output;

    this._aEnv = o.aEnv || o.attackEnv || o.attackEnvelope || o.aEnvelope || [[0, 0], [0.05, 1], [1, 1]];
    this._rEnv = o.rEnv || o.releaseEnv || o.releaseEnvelope || o.rEnvelope || [[0, 1], [0.5, 1], [1, 0]];
  }

  /* =================== */
  /* --- Audio setup --- */
  /* =================== */

  /**
   * Connect to another AudioNode or AudioModule
   */
  connect (destination) {
    // if destination has an input property, connect to it (destination is an AudioModule)
    if (typeof destination.input === "object") {
      this.output.connect(destination.input);
    }
    // else destination is an AudioNode and can be connected to directly
    else {
      this.output.connect(destination);
    }
  }

  /**
   * Disconnect from an AudioNode or AudioModule
   */
  disconnect (destination) {
    // if destination has an input property, disconnect from it (destination is an AudioModule)
    if (typeof destination.input === "object") {
      this.output.disconnect(destination.input);
    // else destination is an AudioNode and can be disconnected from directly
    } else {
      this.output.disconnect(destination);
    }
  }

  /* ============================= */
  /* --- Get/set the envelopes --- */
  /* ============================= */

  /** The attack envelope */
  get attackEnvelope () {
    return this._aEnv;
  }
  set attackEnvelope (newEnv) {
    this._aEnv = newEnv;
    return this;
  }

  /** The release envelope */
  get releaseEnvelope () {
    return this._rEnv;
  }
  set releaseEnvelope (newEnv) {
    this._rEnv = newEnv;
    return this;
  }

  /* ========================== */
  /* --- Envelope execution --- */
  /* ========================== */

  /** Execute the attack envelope */
  attack () {
    var startTime = this._audioCtx.currentTime;
    var env = this._aEnv;
    var envLength = env.length;

    // ramp from 0 to the first value in the envelope
    this._envGain.gain.setValueAtTime(0, startTime);
    this._envGain.gain.linearRampToValueAtTime(env[0][1], startTime + env[0][0]);

    // ramp to each subsequent value
    for (var i = 0; i < (envLength - 1); i++) {
      this._envGain.gain.setValueAtTime(env[i][1], startTime + env[i][0]);
      this._envGain.gain.linearRampToValueAtTime(env[i+1][1], startTime + env[i+1][0]);
    }

    // set the final value
    this._envGain.gain.setValueAtTime(env[envLength-1][1], startTime + env[envLength-1][0]);
  }

  /** Execute the release envelope */
  release () {
    var startTime = this._audioCtx.currentTime;
    var env = this._rEnv;
    var envLength = env.length;

    // cancel scheduled values in case attack is still happening
    this._envGain.gain.cancelScheduledValues(startTime);

    // ramp to each subsequent value
    for (var i = 0; i < (envLength - 1); i++) {
      this._envGain.gain.setValueAtTime(env[i][1], startTime + env[i][0]);
      this._envGain.gain.linearRampToValueAtTime(env[i+1][1], startTime + env[i+1][0]);
    }

    // if the gain value at the end is not 0, ramp it down to 0 in 1ms
    if(env[envLength-1][1] !== 0) {
      this._envGain.gain.linearRampToValueAtTime(0, startTime + env[envLength-1][0] + 0.001);
    }
  }
}

export default Envelope
