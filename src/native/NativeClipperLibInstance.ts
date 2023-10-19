import { NativeClipper } from "./NativeClipper";
import { NativeClipperOffset } from "./NativeClipperOffset";
import {
  NativeClipType,
  NativeEndType,
  NativeJoinType,
  NativeFillRule,
} from "./nativeEnums";
import { NativePoint } from "./NativePoint";
import { NativePath } from "./NativePath";
import { NativePaths } from "./NativePaths";
import { NativePolyTree } from "./NativePolyTree";
import { NativePolyPath } from "./NativePolyPath";

export interface NativeClipperLibInstance {
  // custom conversion functions
  toPath(dest: NativePath, coordsPtr: number): void;
  toPaths(dest: NativePaths, pathsPtr: number): void;
  fromPath(path: NativePath): Float64Array;
  fromPaths(paths: NativePaths): Float64Array;

  // memory
  _malloc(nofBytes: number): number;
  _free(ptr: number): void;
  HEAPF64: {
    buffer: ArrayBuffer;
  };

  // types
  Path: new () => NativePath;
  Paths: new () => NativePaths;
  PolyTree: new () => NativePolyTree;
  PolyPath: new () => NativePolyPath;

  Clipper: new () => NativeClipper;
  ClipperOffset: new () => NativeClipperOffset;

  // functions
  // newIntPoint(x: number, y: number): NativeIntPoint;

  orientation(path: NativePath): boolean;
  area(path: NativePath): number;
  pointInPolygon(pt: NativePoint, path: NativePath): number;

  simplifyPath(path: NativePath, epsilon: number, isClosedPath: boolean): NativePath;
  simplifyPaths(paths: NativePaths, epsilon: number, isClosedPath: boolean): NativePath;

  minkowskiSumPath(
    pattern: NativePath,
    path: NativePath,
    isClosed: boolean
  ): NativePath;
  minkowskiDiff(
    pattern: NativePath,
    path: NativePath,
    isClosed: boolean
  ): NativePath;

  polyTreeToPaths(polyTree: NativePolyTree): NativePaths;

  // reversePath(inOutPath: NativePath): void;
  // reversePaths(inOutPaths: NativePaths): void;

  ClipType: NativeClipType;
  FilLRule: NativeFillRule;
  JoinType: NativeJoinType;
  EndType: NativeEndType;
}
