import { NativeDeletable } from "./NativeDeletable";
import { NativeClipType, NativeFillRule } from "./nativeEnums";
import { NativePaths } from "./NativePaths";
import { NativePolyTree } from "./NativePolyTree";

export interface NativeClipper extends NativeDeletable {

  reverseSolution: boolean;
  preserveCollinear: boolean
  clear(): void

  addSubject(paths: NativePaths): void;
  addOpenSubject(paths: NativePaths): void;
  addClip(paths: NativePaths): void;

  executeToPaths(
    clipType: NativeClipType,
    fillRule: NativeFillRule,
    resultClosedPaths: NativePaths
  ): boolean;
  executeToPathsOpen(
    clipType: NativeClipType,
    fillRule: NativeFillRule,
    resultClosedPaths: NativePaths,
    resultOpenPaths: NativePaths
  ): boolean;

  executeToPolyTree(
    clipType: NativeClipType,
    fillRule: NativeFillRule,
    resultPolyTree: NativePolyTree
  ): boolean;
  executeToPolyTreeOpen(
    clipType: NativeClipType,
    fillRule: NativeFillRule,
    resultPolyTree: NativePolyTree,
    resultOpenPaths: NativePaths
  ): boolean;
}
