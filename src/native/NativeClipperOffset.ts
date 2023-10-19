import { NativeDeletable } from "./NativeDeletable";
import { NativeEndType, NativeJoinType } from "./nativeEnums";
import { NativePath } from "./NativePath";
import { NativePaths } from "./NativePaths";
import { NativePolyTree } from "./NativePolyTree";

export interface NativeClipperOffset extends NativeDeletable {
  addPath(path: NativePath, joinType: NativeJoinType, endType: NativeEndType): void;
  addPaths(paths: NativePaths, joinType: NativeJoinType, endType: NativeEndType): void;
  executePaths(delta: number, resultPaths: NativePaths): void;
  executePolyTree(delta: number, resultPolyTree: NativePolyTree): void;
  clear(): void;

  miterLimit: number;
  arcTolerance: number;
  preserveCollinear: boolean;
  reverseSolution: boolean;
}
