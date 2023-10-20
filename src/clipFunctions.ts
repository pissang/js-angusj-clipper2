import { Clipper } from "./Clipper";
import { ClipperError } from "./ClipperError";
import { ClipType, PolyFillRule } from "./enums";
import { NativeClipperLibInstance } from "./native/NativeClipperLibInstance";
import { Paths, ReadonlyPaths } from "./Paths";
import { PolyTree } from "./PolyTree";

const devMode =
  typeof process !== "undefined" && process.env && process.env.NODE_ENV !== "production";

/**
 * A single subject input (of multiple possible inputs) for the clipToPaths / clipToPolyTree operations
 *
 * 'Subject' paths may be either open (lines) or closed (polygons) or even a mixture of both.
 * With closed paths, orientation should conform with the filling rule that will be passed via Clipper's execute method.
 */
export interface SubjectInput {
  /**
   * Paths data.
   *
   * Path Coordinate range:
   * Path coordinates must be between ± 9007199254740991, otherwise a range error will be thrown when attempting to add the path to the Clipper object.
   * If coordinates can be kept between ± 0x3FFFFFFF (± 1.0e+9), a modest increase in performance (approx. 15-20%) over the larger range can be achieved by
   * avoiding large integer math.
   *
   * The function operation will throw an error if the path is invalid for clipping. A path is invalid for clipping when:
   * - it has less than 2 vertices
   * - it has 2 vertices but is not an open path
   * - the vertices are all co-linear and it is not an open path
   */
  data: ReadonlyPaths;

  /**
   * If the path/paths is closed or not.
   */
  closed: boolean;
}

/**
 * A single clip input (of multiple possible inputs) for the clipToPaths / clipToPolyTree operations.
 *
 * Clipping paths must always be closed. Clipper allows polygons to clip both lines and other polygons, but doesn't allow lines to clip either lines or polygons.
 * With closed paths, orientation should conform with the filling rule that will be passed via Clipper's execute method.
 */
export interface ClipInput {
  /**
   * Paths data.
   *
   * Path Coordinate range:
   * Path coordinates must be between ± 9007199254740991, otherwise a range error will be thrown when attempting to add the path to the Clipper object.
   * If coordinates can be kept between ± 0x3FFFFFFF (± 1.0e+9), a modest increase in performance (approx. 15-20%) over the larger range can be achieved by
   * avoiding large integer math.
   *
   * The function operation will throw an error if the path is invalid for clipping. A path is invalid for clipping when:
   * - it has less than 2 vertices
   * - it has 2 vertices but is not an open path
   * - the vertices are all co-linear and it is not an open path
   */
  data: ReadonlyPaths;
}

/**
 * Params for the clipToPaths / clipToPolyTree operations.
 *
 * Any number of subject and clip paths can be added to a clipping task.
 *
 * Boolean (clipping) operations are mostly applied to two sets of Polygons, represented in this library as subject and clip polygons. Whenever Polygons
 * are added to the Clipper object, they must be assigned to either subject or clip polygons.
 *
 * UNION operations can be performed on one set or both sets of polygons, but all other boolean operations require both sets of polygons to derive
 * meaningful solutions.
 */
export interface ClipParams {
  /**
   * Clipping operation type (Intersection, Union, Difference or Xor).
   */
  clipType: ClipType;

  /**
   * Winding (fill) rule for polygons.
   */
  fillRule: PolyFillRule;

  /**
   * Subject inputs.
   */
  subjectInputs: SubjectInput[];

  /**
   * Clipping inputs. Not required for union operations, required for others.
   */
  clipInputs?: ClipInput[];

  /**
   * When this property is set to true, polygons returned in the solution parameter of the clip method will have orientations opposite to their normal
   * orientations.
   */
  reverseSolution?: boolean;

  /**
   * By default, when three or more vertices are collinear in input polygons (subject or clip), the Clipper object removes the 'inner' vertices before
   * clipping. When enabled the preserveCollinear property prevents this default behavior to allow these inner vertices to appear in the solution.
   */
  preserveCollinear?: boolean;
}

export function clipToPathsOrPolyTree(
  polyTreeMode: boolean,
  nativeClipperLib: NativeClipperLibInstance,
  params: ClipParams
): Paths | PolyTree {
  if (devMode) {
    if (!polyTreeMode && params.subjectInputs && params.subjectInputs.some((si) => !si.closed)) {
      throw new Error("clip to a PolyTree (not to a Path) when using open paths");
    }
  }

  const clipper = new Clipper(nativeClipperLib);
  if (params.preserveCollinear != null) {
    clipper.preserveCollinear = params.preserveCollinear;
  }
  if (params.reverseSolution != null) {
    clipper.reverseSolution = params.reverseSolution;
  }

  //noinspection UnusedCatchParameterJS
  try {
    params.subjectInputs.forEach(subject => {
      // TODO check validation.
      clipper[subject.closed ? 'addSubject' : 'addOpenSubject'](
        subject.data
      );
    });
    params.clipInputs?.forEach(clip => {
      // TODO check validation.
      clipper.addClip(clip.data);
    });


    let result;
    if (!polyTreeMode) {
      // TODO executeToPathsOpen
      result = clipper.executeToPaths(
        params.clipType,
        params.fillRule
      );
    } else {
      result = clipper.executeToPolyTee(params.clipType, params.fillRule);
    }
    if (result === undefined) {
      throw new ClipperError("error while performing clipping task");
    }
    return result;
  } finally {
    clipper.dispose();
  }
}

export function clipToPaths(nativeClipperLib: NativeClipperLibInstance, params: ClipParams): Paths {
  return clipToPathsOrPolyTree(false, nativeClipperLib, params) as Paths;
}

export function clipToPolyTree(
  nativeClipperLib: NativeClipperLibInstance,
  params: ClipParams
): PolyTree {
  return clipToPathsOrPolyTree(true, nativeClipperLib, params) as PolyTree;
}
