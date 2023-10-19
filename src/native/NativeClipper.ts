import { NativeClipType, NativeFillRule } from "./nativeEnums";
import { NativePaths } from "./NativePaths";
import { NativePolyTree } from "./NativePolyTree";

export interface NativeClipper {

  reverseSolution: boolean;
  preserveCollinear: boolean
  clear(): void

  addSubject(paths: NativePaths): void;
  AddOpenSubject(paths: NativePaths): void;
  addClip(paths: NativePaths): void;

  executePaths(
    clipType: NativeClipType,
    fillRule: NativeFillRule,
    resultClosedPaths: NativePaths
  ): boolean;
  executePathsOpen(
    clipType: NativeClipType,
    fillRule: NativeFillRule,
    resultClosedPaths: NativePaths,
    resultOpenPaths: NativePaths
  ): boolean;

  executePolyTree(
    clipType: NativeClipType,
    fillRule: NativeFillRule,
    resultPolyTree: NativePolyTree
  ): boolean;
  executePolyTreeOpen(
    clipType: NativeClipType,
    fillRule: NativeFillRule,
    resultPolyTree: NativePolyTree,
    resultOpenPaths: NativePaths
  ): boolean;
}
