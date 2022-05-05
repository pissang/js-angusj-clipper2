import * as clipperLib from "../src";

// another port of clipper in pure js
export const pureJsClipperLib = require("./external-libs/clipper");

export interface PureJsPoint {
  X: number;
  Y: number;
}

export type PureJsPath = PureJsPoint[];
export type PureJsPaths = PureJsPath[];

function isPureJsPaths(path: PureJsPath | PureJsPaths): path is PureJsPaths {
  return Array.isArray(path) && Array.isArray(path[0]);
}

export function pureJsTestPolyOperation(
  clipType: clipperLib.ClipType,
  subjectFillType: clipperLib.PolyFillType,
  subjectInput: PureJsPath | PureJsPaths,
  clipInput: PureJsPath | PureJsPaths,
  subjectClosed = true
) {
  const cl = new pureJsClipperLib.Clipper();
  if (isPureJsPaths(subjectInput)) {
    cl.AddPaths(subjectInput, pureJsClipperLib.PolyType.ptSubject, subjectClosed);
  } else {
    cl.AddPath(subjectInput, pureJsClipperLib.PolyType.ptSubject, subjectClosed);
  }
  if (isPureJsPaths(clipInput)) {
    cl.AddPaths(clipInput, pureJsClipperLib.PolyType.ptClip, true);
  } else {
    cl.AddPath(clipInput, pureJsClipperLib.PolyType.ptClip, true);
  }

  const solutionPaths = new pureJsClipperLib.Paths();
  cl.Execute(
    clipTypeToPureJs(clipType),
    solutionPaths,
    polyFillTypeToPureJs(subjectFillType),
    polyFillTypeToPureJs(subjectFillType)
  );

  return solutionPaths;
}

export function pureJsTestOffset(
  input: PureJsPath | PureJsPaths,
  joinType: clipperLib.JoinType,
  endType: clipperLib.EndType,
  delta: number
) {
  const co = new pureJsClipperLib.ClipperOffset();
  if (isPureJsPaths(input)) {
    co.AddPaths(input, joinTypeToPureJs(joinType), endTypeToPureJs(endType));
  } else {
    co.AddPath(input, joinTypeToPureJs(joinType), endTypeToPureJs(endType));
  }

  const solutionPaths = new pureJsClipperLib.Paths();
  co.Execute(solutionPaths, delta);

  return solutionPaths;
}

export function pathToPureJs(path: clipperLib.ReadonlyPath): PureJsPath {
  return path.map((p) => ({
    X: p.x,
    Y: p.y,
  }));
}

export function pathsToPureJs(paths: clipperLib.ReadonlyPaths): PureJsPaths {
  return paths.map((p) => pathToPureJs(p));
}

export function clipTypeToPureJs(clipType: clipperLib.ClipType): number {
  switch (clipType) {
    case clipperLib.ClipType.Difference:
      return pureJsClipperLib.ClipType.ctDifference;
    case clipperLib.ClipType.Intersection:
      return pureJsClipperLib.ClipType.ctIntersection;
    case clipperLib.ClipType.Union:
      return pureJsClipperLib.ClipType.ctUnion;
    case clipperLib.ClipType.Xor:
      return pureJsClipperLib.ClipType.ctXor;
    default:
      return -1;
  }
}

export function polyFillTypeToPureJs(polyFillType: clipperLib.PolyFillType): number {
  switch (polyFillType) {
    case clipperLib.PolyFillType.EvenOdd:
      return pureJsClipperLib.PolyFillType.pftEvenOdd;
    case clipperLib.PolyFillType.Negative:
      return pureJsClipperLib.PolyFillType.pftNegative;
    case clipperLib.PolyFillType.NonZero:
      return pureJsClipperLib.PolyFillType.pftNonZero;
    case clipperLib.PolyFillType.Positive:
      return pureJsClipperLib.PolyFillType.pftPositive;
    default:
      return -1;
  }
}

export function joinTypeToPureJs(joinType: clipperLib.JoinType): number {
  switch (joinType) {
    case clipperLib.JoinType.Miter:
      return pureJsClipperLib.JoinType.jtMiter;
    case clipperLib.JoinType.Round:
      return pureJsClipperLib.JoinType.jtRound;
    case clipperLib.JoinType.Square:
      return pureJsClipperLib.JoinType.jtSquare;
    default:
      return -1;
  }
}

export function endTypeToPureJs(endType: clipperLib.EndType): number {
  switch (endType) {
    case clipperLib.EndType.ClosedLine:
      return pureJsClipperLib.EndType.etClosedLine;
    case clipperLib.EndType.ClosedPolygon:
      return pureJsClipperLib.EndType.etClosedPolygon;
    case clipperLib.EndType.OpenButt:
      return pureJsClipperLib.EndType.etOpenButt;
    case clipperLib.EndType.OpenRound:
      return pureJsClipperLib.EndType.etOpenRound;
    case clipperLib.EndType.OpenSquare:
      return pureJsClipperLib.EndType.etOpenSquare;
    default:
      return -1;
  }
}
