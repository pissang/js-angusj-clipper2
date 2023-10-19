export interface NativeEnum {
  value: number;
}

// native enum
export interface NativeClipType {
  None: NativeEnum & NativeClipType;
  Intersection: NativeEnum & NativeClipType;
  Union: NativeEnum & NativeClipType;
  Difference: NativeEnum & NativeClipType;
  Xor: NativeEnum & NativeClipType;
}

// native enum
export interface NativeFillRule {
  EvenOdd: NativeEnum & NativeFillRule;
  NonZero: NativeEnum & NativeFillRule;
  Positive: NativeEnum & NativeFillRule;
  Negative: NativeEnum & NativeFillRule;
}

// native enum
export interface NativeJoinType {
  Square: NativeEnum & NativeJoinType;
  Round: NativeEnum & NativeJoinType;
  Miter: NativeEnum & NativeJoinType;
}

// native enum
export interface NativeEndType {
  Butt: NativeEnum & NativeEndType;
  Joined: NativeEnum & NativeEndType;
  Polygon: NativeEnum & NativeEndType;
  Round: NativeEnum & NativeEndType;
  Square: NativeEnum & NativeEndType;
}
