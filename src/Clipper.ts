/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { ClipType, PolyFillRule, PolyType } from "./enums";
import { Rect } from "./Rect";
import { NativeClipper } from "./native/NativeClipper";
import { NativeClipperLibInstance } from "./native/NativeClipperLibInstance";
import {
  clipTypeToNative,
  polyFillRuleToNative,
  polyTypeToNative,
} from "./native/nativeEnumConversion";
import { nativePathsToPaths, pathsToNativePaths } from "./native/PathsToNativePaths";
import { pathToNativePath } from "./native/PathToNativePath";
import { ReadonlyPath } from "./Path";
import { Paths, ReadonlyPaths } from "./Paths";
import { PolyTree } from "./PolyTree";
import { nativeFinalizationRegistry } from "./nativeFinalizationRegistry";

export interface ClipperInitOptions {
  /**
   * When this property is set to true, polygons returned in the solution parameter of the execute() method will have orientations opposite to their normal
   * orientations.
   */
  reverseSolution?: boolean;

  /**
   * When this property is set to true, polygons returned in the solution parameter of the execute() method will have orientations opposite to their normal
   * orientations.
   */
  strictlySimple?: boolean;

  /**
   * By default, when three or more vertices are collinear in input polygons (subject or clip), the Clipper object removes the 'inner' vertices before
   * clipping. When enabled the preserveCollinear property prevents this default behavior to allow these inner vertices to appear in the solution.
   */
  preserveCollinear?: boolean;
}

export class Clipper {
  private _clipper?: NativeClipper;

  /**
   * By default, when three or more vertices are collinear in input polygons (subject or clip), the Clipper object removes the 'inner' vertices before
   * clipping. When enabled the preserveCollinear property prevents this default behavior to allow these inner vertices to appear in the solution.
   *
   * @return {boolean} - true if set, false otherwise
   */
  get preserveCollinear(): boolean {
    return this._clipper!.preserveCollinear;
  }

  /**
   * By default, when three or more vertices are collinear in input polygons (subject or clip), the Clipper object removes the 'inner' vertices before
   * clipping. When enabled the preserveCollinear property prevents this default behavior to allow these inner vertices to appear in the solution.
   *
   * @param value - value to set
   */
  set preserveCollinear(value: boolean) {
    this._clipper!.preserveCollinear = value;
  }

  /**
   * When this property is set to true, polygons returned in the solution parameter of the execute() method will have orientations opposite to their normal
   * orientations.
   *
   * @return {boolean} - true if set, false otherwise
   */
  get reverseSolution(): boolean {
    return this._clipper!.reverseSolution;
  }

  /**
   * When this property is set to true, polygons returned in the solution parameter of the execute() method will have orientations opposite to their normal
   * orientations.
   *
   * @param value - value to set
   */
  set reverseSolution(value: boolean) {
    this._clipper!.reverseSolution = value;
  }

  constructor(private readonly _nativeLib: NativeClipperLibInstance) {
    this._clipper = new _nativeLib.Clipper();
    nativeFinalizationRegistry?.register(this, this._clipper, this);
  }

  addSubject(paths: ReadonlyPaths): void {
    const nativePaths = pathsToNativePaths(this._nativeLib, paths);
    try {
      return this._clipper!.addSubject(nativePaths);
    } finally {
      nativePaths.delete();
    }
  }

  addOpenSubject(paths: ReadonlyPaths): void {
    const nativePaths = pathsToNativePaths(this._nativeLib, paths);
    try {
      return this._clipper!.addOpenSubject(nativePaths);
    } finally {
      nativePaths.delete();
    }
  }

  addClip(paths: ReadonlyPaths): void {
    const nativePaths = pathsToNativePaths(this._nativeLib, paths);
    try {
      return this._clipper!.addClip(nativePaths);
    } finally {
      nativePaths.delete();
    }
  }

  /**
   * The Clear method removes any existing subject and clip polygons allowing the Clipper object to be reused for clipping operations on different polygon sets.
   */
  clear(): void {
    this._clipper!.clear();
  }

  // /**
  //  * This method returns the axis-aligned bounding rectangle of all polygons that have been added to the Clipper object.
  //  *
  //  * @return {{left: number, right: number, top: number, bottom: number}} - Bounds
  //  */
  // getBounds(): Rect {
  //   const nativeBounds = this._clipper!.getBounds();
  //   const rect = {
  //     left: nativeBounds.left,
  //     right: nativeBounds.right,
  //     top: nativeBounds.top,
  //     bottom: nativeBounds.bottom,
  //   };
  //   nativeBounds.delete();
  //   return rect;
  // }

  executeToPaths(
    clipType: ClipType,
    fillRule: PolyFillRule
  ): Paths | undefined {
    const nativeLib = this._nativeLib;
    const outNativePaths = new nativeLib.Paths();
    try {
      const success = this._clipper!.executeToPaths(
        clipTypeToNative(nativeLib, clipType),
        polyFillRuleToNative(nativeLib, fillRule),
        outNativePaths
      );
      if (!success) {
        return undefined;
      } else {
        return nativePathsToPaths(nativeLib, outNativePaths, true); // frees outNativePaths
      }
    } finally {
      if (!outNativePaths.isDeleted()) {
        outNativePaths.delete();
      }
    }
  }

  executeToPolyTee(
    clipType: ClipType,
    fillRule: PolyFillRule,
  ): PolyTree | undefined {
    const nativeLib = this._nativeLib;
    const outNativePolyTree = new nativeLib.PolyPath();
    try {
      const success = this._clipper!.executeToPolyTree(
        clipTypeToNative(nativeLib, clipType),
        polyFillRuleToNative(nativeLib, fillRule),
        outNativePolyTree,
      );
      if (!success) {
        return undefined;
      } else {
        return PolyTree.fromNativePolyTree(nativeLib, outNativePolyTree, true); // frees outNativePolyTree
      }
    } finally {
      if (!outNativePolyTree.isDeleted()) {
        outNativePolyTree.delete();
      }
    }
  }

  /**
   * Checks if the object has been disposed.
   *
   * @return {boolean} - true if disposed, false if not
   */
  isDisposed(): boolean {
    return this._clipper == null || this._clipper.isDeleted();
  }

  /**
   * Since this library uses WASM/ASM.JS internally for speed this means that you must dispose objects after you are done using them or mem leaks will occur.
   * (If the runtime supports FinalizationRegistry then this becomes non-mandatory, but still recommended).
   */
  dispose(): void {
    if (this._clipper) {
      this._clipper.delete();
      nativeFinalizationRegistry?.unregister(this);
      this._clipper = undefined;
    }
  }
}
