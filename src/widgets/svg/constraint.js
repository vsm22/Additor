/**
 * Constraint object represents constraints on a value including min, max, and enum.
 * Constraint class also provides static methods for applying constraints to a state
 * object using a map object that represents the constraints of the state.
 *
 * Consider we need to keep track of the state of two pies as they bake.
 * The object representing the state at some time might look like this:
 *
 * state: {
 *   pies: [
 *     {crust: {temp: 200, thickness: 2}, filling: "apple"},
 *     {crust: {temp: 370, thickness: 5}, filling: "cherry"}
 *   ]
 * }
 *
 * Then the constraint map should look something like this:
 * constraint: {
 *   pies: [{
 *     crust: new Constraint({min: 250, max: 350}),
 *     filling: new Constraint({ enum: ["apple", "cherry", "pineapple"]})
 *   }]
 * }
 * @class
 */
class Constraint {

  /**
   * @constructor
   * @param {object=} spec - Spec specifying the constraints.
   * @param {number=} spec.min - Minimum value.
   * @param {number=} spec.max - Maximum value.
   * @param {array=} spec.enum - Array of possible enumerable values.
   * @param {function=} spec.transform - A transformation function to apply to the value.
   */
  constructor(spec) {
    spec = spec || {};

    this.min = spec.min;
    this.max = spec.max;
    this.enum = spec.enum;
    this.transform = spec.transform;
  }

  /**
   * Check a constraint map for constraint specs and apply them to obj.
   * Note: will not mutate the original object. New value is returned.
   * @public @static
   * @param {object} obj - The state object to check
   * @param {object} constraintMap - The constraint map to use
   * @return {number | string | object | array} val - The constrained value.
   */
  static constrain(obj, constraintMap) {
    if (constraintMap instanceof Constraint) {
      return Constraint._applyConstraint(obj, constraintMap);
    } else if (constraintMap instanceof Array && constraintMap[0] instanceof Constraint) {
      if (constraintMap[0] instanceof Constraint) {
        return Constraint._applyConstraint(obj, constraintMap[0]);
      } else {
        return Constraint.constrain(obj[0], constraintMap[0]);
      }
    } else {
      Object.keys(constraintMap).forEach(key => {
        return Constraint.constrain(obj[key], constraintMap[key]);
      });
    }
  }

  /**
   * Apply a constraint.
   * @private @static
   * @param {number | string | object | array} val - The value to constrain.
   * @param {Constraint} constraint - The constraint object to use.
   * @return {number | string | object | array} val - The constrained value.
   */
  static _applyConstraint(val, constraint) {
    if (val instanceof Array) {
      val.forEach(valInst => { Constraint._applyConstraint(valInst, constraint) });
    } else {
      if (constraint.min !== undefined) {
        val = Math.max(val, constraint.min);
      }
      if (constraint.max !== undefined) {
        val = Math.min(val, constraint.max);
      }
      if (constraint.enum !== undefined && constraint.enum instanceof Array) {
        val = (constraint.enum.find(val) !== undefined) ? val : constraint.enum[0];
      }
      if (constraint.transform !== undefined && typeof constraint.transform === "function") {
        val = constraint.transform(val);
      }
    }

    return val;
  }
}

export default Constraint
