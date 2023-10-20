import { NativeDeletable } from "./NativeDeletable";
import { NativePath } from "./NativePath";

export interface NativePolyPath extends NativeDeletable {
  polygon(): NativePath;
  area(): number;
  parent(): NativePolyPath | null;
  child(index: number): NativePolyPath;
  count(): number;
  isHole(): boolean;
}
