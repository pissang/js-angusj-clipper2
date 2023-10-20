import { NativeClipperLibInstance } from "./native/NativeClipperLibInstance";
import { NativePolyPath } from "./native/NativePolyPath";
import { nativePathToPath } from "./native/PathToNativePath";
import { ReadonlyPath } from "./Path";

export class PolyPath {
  protected _parent?: PolyPath;
  protected _isHole: boolean;
  protected _index = 0;
  protected _childs: PolyPath[] = [];

  constructor(isHole: boolean) {
    this._isHole = isHole;
  }

  get parent(): PolyPath | undefined {
    return this._parent;
  }

  get childs(): PolyPath[] {
    return this._childs;
  }

  protected _polygon: ReadonlyPath = [];

  get polygon(): ReadonlyPath {
    return this._polygon;
  }

  get index(): number {
    return this._index;
  }

  get isHole(): boolean {
    return this._isHole;
    // if (this._isHole === undefined) {
    //   let result = true;
    //   let node: PolyPath | undefined = this._parent;
    //   while (node !== undefined) {
    //     result = !result;
    //     node = node._parent;
    //   }
    //   this._isHole = result;
    // }

    // return this._isHole;
  }

  getNext(): PolyPath | undefined {
    if (this._childs.length > 0) {
      return this._childs[0];
    } else {
      return this.getNextSiblingUp();
    }
  }

  protected getNextSiblingUp(): PolyPath | undefined {
    if (this._parent === undefined) {
      return undefined;
    } else if (this._index === this._parent._childs.length - 1) {
      //noinspection TailRecursionJS
      return this._parent.getNextSiblingUp();
    } else {
      return this._parent._childs[this._index + 1];
    }
  }

  protected static fillFromNativePolyPath(
    pn: PolyPath,
    nativeLib: NativeClipperLibInstance,
    nativePolyPath: NativePolyPath,
    parent: PolyPath | undefined,
    childIndex: number,
    freeNativePolyPath: boolean
  ): void {
    pn._parent = parent;

    const max = nativePolyPath.count();

    for (let i = 0; i < max; i++) {
      const newChild = PolyPath.fromNativePolyPath(
        nativeLib,
        nativePolyPath.child(i),
        pn,
        i,
        freeNativePolyPath
      );
      pn._childs.push(newChild);
    }

    // do we need to clear the object ourselves? for now let's assume so (seems to work)
    pn._polygon = nativePathToPath(nativeLib, nativePolyPath.polygon(), true);
    pn._index = childIndex;

    if (freeNativePolyPath) {
      nativePolyPath.delete();
    }
  }

  protected static fromNativePolyPath(
    nativeLib: NativeClipperLibInstance,
    nativePolyPath: NativePolyPath,
    parent: PolyPath | undefined,
    childIndex: number,
    freeNativePolyPath: boolean
  ): PolyPath {
    const pn = new PolyPath(nativePolyPath.isHole());
    PolyPath.fillFromNativePolyPath(
      pn,
      nativeLib,
      nativePolyPath,
      parent,
      childIndex,
      freeNativePolyPath
    );
    return pn;
  }
}
