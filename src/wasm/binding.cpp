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

  class_<Point64>("IntPoint")
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
    .function("getParent", &PolyPath64::JS_GetParent, allow_raw_pointers())
    .function("getChilds", &PolyPath64::JS_GetChilds, allow_raw_pointers());

  // register_vector<std::unique_ptr<PolyPath64>>("vector<PolyPath>");

  // TODO PolyTree64 is same with PolyPath64

  // function("IsPositive", &IsPositive);
  // function("area", select_overload<double(const Path64&)>(&Area));
  // function("pointInPolygon", select_overload<int(const Point64 &, const Path64 &)>(&PointInPolygon));

  // function("simplifyPolygon", &SimplifyPolygon);
  // function("simplifyPolygonsInOut", select_overload<void(const Paths &, Paths &, PolyFillType)>(&SimplifyPolygons));
  // function("simplifyPolygonsOverwrite", select_overload<void(Paths &, PolyFillType)>(&SimplifyPolygons));

  // function("cleanPolygon", select_overload<void(const Path&, Path&, double)>(&CleanPolygon));
  // function("cleanPolygon", select_overload<void(Path&, double)>(&CleanPolygon));
  // function("cleanPolygons", select_overload<void(const Paths&, Paths&, double)>(&CleanPolygons));
  // function("cleanPolygons", select_overload<void(Paths&, double)>(&CleanPolygons));

  // function("minkowskiSumPath", select_overload<void(const Path64&, const Path64&, Paths64&, bool)>(&MinkowskiSum));
  // function("minkowskiSumPaths", select_overload<void(const Path64&, const Paths64&, Paths64&, bool)>(&MinkowskiSum));
  // function("minkowskiDiff", &MinkowskiDiff);

  // function("polyTreeToPaths", &PolyTreeToPaths);
  // function("closedPathsFromPolyTree", &ClosedPathsFromPolyTree);
  // function("openPathsFromPolyTree", &OpenPathsFromPolyTree);

  // function("reversePath", &ReversePath);
  // function("reversePaths", &ReversePaths);

  // class_<IntRect>("IntRect")
  //   .property("left", &IntRect::JS_GetLeft, &IntRect::JS_SetLeft)
  //   .property("top", &IntRect::JS_GetTop, &IntRect::JS_SetTop)
  //   .property("right", &IntRect::JS_GetRight, &IntRect::JS_SetRight)
  //   .property("bottom", &IntRect::JS_GetBottom, &IntRect::JS_SetBottom)
  //   ;

    class_<Clipper64>("Clipper")
      .constructor<>()
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

  // class_<ClipperOffset>("ClipperOffset")
  //   .constructor<double, double>()
  //   .function("addPath", &ClipperOffset::AddPath)
  //   .function("addPaths", &ClipperOffset::AddPaths)
  //   .function("executePaths", select_overload<void(Paths&, double)>(&ClipperOffset::Execute))
  //   .function("executePolyTree", select_overload<void(PolyTree&, double)>(&ClipperOffset::Execute))
  //   .function("clear", &ClipperOffset::Clear)
  //   .property("miterLimit", &ClipperOffset::MiterLimit)
  //   .property("arcTolerance", &ClipperOffset::ArcTolerance)
  //   ;
}
