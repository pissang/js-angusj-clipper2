#include <emscripten/bind.h>
#include <emscripten/val.h>

#include "clipper2/clipper.h"

using namespace emscripten;
using namespace Clipper2Lib;

#ifdef use_xyz
int coordsPerPoint = 3;
#else
int coordsPerPoint = 2;
#endif

typedef unsigned int intPtr;

size_t JS_DoublesForPath(Path64 &path) {
  return 1 + (path.size() * coordsPerPoint);
}

size_t JS_DoublesForPaths(Paths64 &paths) {
  size_t nofPaths = paths.size();
  int items = 1; // for path count
  for (size_t i = 0; i < nofPaths; i++) {
    items += JS_DoublesForPath(paths[i]);
  }
  return items;
}

double* JS_ToPathHelper(Path64 &dest, double* coords) {
  // first double in array is nof coords
  double* pointer = coords;
  size_t nofCoords = *pointer; pointer++;
  dest.clear();
  dest.resize(nofCoords);
  Point64 p;
  for (size_t i = 0; i < nofCoords; ++i) {
    p.x = *pointer; pointer++;
    p.y = *pointer; pointer++;
#ifdef use_xyz
    p.Z = *pointer; pointer++;
#endif
    dest[i] = p;
  }

  return pointer;
}

void JS_ToPath(Path64 &dest, intPtr coordsPtr) {
  JS_ToPathHelper(dest, reinterpret_cast<double*>(coordsPtr));
}

void JS_ToPathsHelper(Paths64 &dest, double* p) {
  // first double in array has nof paths
  // then each path

  size_t nofPaths = *p; ++p;
  dest.clear();
  dest.reserve(nofPaths);
  for (size_t i = 0; i < nofPaths; ++i) {
    Path64 path;
    p = JS_ToPathHelper(path, p);
    dest.push_back(path);
  }
}

void JS_ToPaths(Paths64 &dest, intPtr pathsPtr) {
  JS_ToPathsHelper(dest, reinterpret_cast<double*>(pathsPtr));
}

double* JS_WriteFromPath(Path64 &path, double* p) {
  // first double in array is nof coords

  size_t size = path.size();
  double* p2 = p;

  *p2 = size; p2++;
  for (size_t i = 0; i < size; ++i) {
    Point64 *point = &path[i];
    *p2 = point->x; p2++;
    *p2 = point->y; p2++;
#ifdef use_xyz
    *p2 = point->Z; p2++;
#endif
  }

  return p2;
}

double* JS_FromPathHelper(Path64 &path) {
  // first double in array is nof coords

  size_t size = path.size();
  size_t nofBytes = JS_DoublesForPath(path) * sizeof(double);
  double* p = (double*)malloc(nofBytes);
  JS_WriteFromPath(path, p);
  return p;
}

val JS_FromPath(Path64 &path) {
  double* p = JS_FromPathHelper(path);
  return val(typed_memory_view(JS_DoublesForPath(path), p));
}

double* JS_FromPathsHelper(Paths64 &paths) {
  // first double in array is nof paths

  size_t size = paths.size();
  size_t nofBytes = JS_DoublesForPaths(paths) * sizeof(double);
  double* p = (double*)malloc(nofBytes);
  double* p2 = p;

  *p2 = size; p2++;

  for (size_t i = 0; i < size; ++i) {
    p2 = JS_WriteFromPath(paths[i], p2);
  }

  return p;
}

val JS_FromPaths(Paths64 &paths) {
  return val(typed_memory_view(JS_DoublesForPaths(paths), JS_FromPathsHelper(paths)));
}



EMSCRIPTEN_BINDINGS(Clipper2Lib) {
  function("toPath", &JS_ToPath);
  function("toPaths", &JS_ToPaths);
  function("fromPath", &JS_FromPath);
  function("fromPaths", &JS_FromPaths);

  enum_<ClipType>("ClipType")
    .value("None", ClipType::None)
    .value("Intersection", ClipType::Intersection)
    .value("Union", ClipType::Union)
    .value("Difference", ClipType::Difference)
    .value("Xor", ClipType::Xor);

  enum_<FillRule>("FillRule")
    .value("EvenOdd", FillRule::EvenOdd)
    .value("NonZero", FillRule::NonZero)
    .value("Positive", FillRule::Positive)
    .value("Negative", FillRule::Negative)
    ;

  class_<Point64>("Point")
    .property("x", &Point64::JS_GetX, &Point64::JS_SetX)
    .property("y", &Point64::JS_GetY, &Point64::JS_SetY)
#ifdef use_xyz
    .property("z", &IntPoint::JS_GetZ, &IntPoint::JS_SetZ)
#endif
    ;
  // function("newIntPoint", &NewIntPoint);

  register_vector<Point64>("Path64");
  register_vector<Path64>("Paths");

#ifdef use_xyz
  // TODO: ZFillCallback?
#endif

  // enum_<InitOptions>("InitOptions")
  //   .value("ReverseSolution", ioReverseSolution)
  //   .value("StrictlySimple", ioStrictlySimple)
  //   .value("PreserveCollinear", ioPreserveCollinear)
  //   ;

  enum_<JoinType>("JoinType")
    .value("Square", JoinType::Square)
    .value("Round", JoinType::Round)
    .value("Miter", JoinType::Miter);

  enum_<EndType>("EndType")
    .value("Butt", EndType::Butt)
    .value("Joined", EndType::Joined)
    .value("Polygon", EndType::Polygon)
    .value("Round", EndType::Round)
    .value("Square", EndType::Square);

  class_<PolyPath64>("PolyPath")
    .constructor<PolyPath64*>()
    .function("polygon", &PolyPath64::Polygon)
    .function("area", &PolyPath64::Area)
    .function("count", &PolyPath64::Count)
    .function("isHole", &PolyPath64::IsHole)
    .function("parent", &PolyPath64::JS_GetParent, allow_raw_pointers())
    .function("child", &PolyPath64::Child, allow_raw_pointers());
    // .function("getChilds", &PolyPath64::JS_GetChilds, allow_raw_pointers());

  // register_vector<std::unique_ptr<PolyPath64>>("vector<PolyPath>");

  // TODO PolyTree64 is same with PolyPath64

  // function("area", select_overload<double(const Path64&)>(&Area));
  function("isPositive", &IsPositive<int64_t>);
  function("pointInPolygon", &PointInPolygon<int64_t>);

  function("simplifyPath", &SimplifyPath<int64_t>);
  function("simplifyPaths", &SimplifyPaths<int64_t>);


  function("minkowskiSumPath", select_overload<Paths64(const Path64&, const Path64&, bool)>(&MinkowskiSum));
  function("minkowskiDiff", select_overload<Paths64(const Path64&, const Path64&, bool)>(&MinkowskiDiff));

  function("polyTreeToPaths", &PolyTreeToPaths64);

  // TODO
  // class_<Rect64>("Rect")
    // .constructor<int64_t, int64_t, int64_t, int64_t>()
    // .property("left", &Rect64::JS_GetLeft, &Rect64::JS_SetLeft);
    // .property("top", &Rect64::JS_GetTop, &Rect64::JS_SetTop)
    // .property("right", &Rect64::JS_GetRight, &Rect64::JS_SetRight)
    // .property("bottom", &Rect64::JS_GetBottom, &Rect64::JS_SetBottom);

  class_<Clipper64>("Clipper")
    .function("clear", &ClipperBase::Clear)
    // .function("getBounds", &ClipperBase::GetBounds)
    .property("preserveCollinear",
      &ClipperBase::JS_GetPreserveCollinear,
      &ClipperBase::JS_SetPreserveCollinear
    )
    .property("reverseSolution",
      &ClipperBase::JS_GetReverseSolution,
      &ClipperBase::JS_SetReverseSolution
    )
    .function("addSubject", &Clipper64::AddSubject)
    .function("addOpenSubject", &Clipper64::AddOpenSubject)
    .function("addClip", &Clipper64::AddClip)
    .function("executePaths", select_overload<bool(ClipType, FillRule, Paths64 &)>(&Clipper64::Execute))
    .function("executePathsOpen", select_overload<bool(ClipType, FillRule, Paths64 &, Paths64 &)>(&Clipper64::Execute))
    .function("executePolyTree", select_overload<bool(ClipType, FillRule, PolyTree64 &)>(&Clipper64::Execute))
    .function("executePolyTreeOpen", select_overload<bool(ClipType, FillRule, PolyTree64 &, Paths64 &)>(&Clipper64::Execute))
#ifdef use_xyz
    // .function("zFillFunction", &Clipper::ZFillFunction)
#endif
    ;

  class_<ClipperOffset>("ClipperOffset")
      .function("addPath", &ClipperOffset::AddPath)
      .function("addPaths", &ClipperOffset::AddPaths)
      .function("executePaths", select_overload<void(double, Paths64&)>(&ClipperOffset::Execute))
      .function("executePolyTree", select_overload<void(double, PolyTree64&)>(&ClipperOffset::Execute))
      .function("clear", &ClipperOffset::Clear)
      .property("miterLimit", &ClipperOffset::GetMiterLimit, &ClipperOffset::SetMiterLimit)
      .property("arcTolerance", &ClipperOffset::GetArcTolerance, &ClipperOffset::SetArcTolerance)
      .property("preserveCollinear", &ClipperOffset::GetPreserveCollinear, &ClipperOffset::SetPreserveCollinear)
      .property("reverseSolution", &ClipperOffset::GetReverseSolution, &ClipperOffset::SetReverseSolution);
}
