import * as shelljs from "shelljs";
import * as path from "path";
import * as fs from "fs";
import * as commandLineArgs from "command-line-args";

const cmdLineOptions = commandLineArgs([{ name: "env", type: String, defaultValue: "universal" }]);

const wasmSrcDir = path.join(__dirname, "..", "src", "wasm");
const distDir = path.join(__dirname, "..", "dist");
const wasmDistDir = path.join(distDir, "wasm");
console.log(`using "${wasmSrcDir}" as wasm dir`);

function build(wasmMode: boolean, environment: string) {
  const debug = false;

  const options = [
    "--bind",
    "--no-entry",
    // "-s STRICT=1",
    "-s ALLOW_MEMORY_GROWTH=1",
    // "-s EXIT_RUNTIME=0",
    "-s SINGLE_FILE=1",
    "-s INVOKE_RUN=0",
    "-s NODEJS_CATCH_EXIT=0",
    "-s NO_FILESYSTEM=1",
    "-s MODULARIZE=1",
    "-s STRICT_JS=0", // adds "use strict" and breaks module compilation
    "-s EXPORTED_FUNCTIONS=\"['_malloc', '_free']\"", // without this these functions are not exported
    // no speed difference
    // "-s WASM_BIGINT=1",
    // wasm with asmjs fallback, but does not work with SINGLE_FILE
    // "-s WASM=2",
    ...(debug
      ? ["-s DISABLE_EXCEPTION_CATCHING=0", "-O0"]
      : [
          // "-s ASSERTIONS=0",
          // "-s PRECISE_I64_MATH=0",
          // "-s ALIASING_FUNCTION_POINTERS=1",
          "-O3",
        ]),
  ];
  if (environment !== "universal") {
    options.push(`-s ENVIRONMENT=${environment}`);
  }

  if (wasmMode) {
    options.push("-s WASM=1");
  } else {
    options.push("-s WASM=0");
  }

  const output = wasmMode ? `clipper-wasm.js` : `clipper.js`;

  try { fs.mkdirSync(distDir); } catch (e) {}
  try { fs.mkdirSync(wasmDistDir); } catch (e) {}

  const cmd = `em++ ${options.join(
    " "
  )} ${wasmSrcDir}/clipper.cpp -o ${wasmDistDir}/${output}`;
  const returnData = shelljs.exec(cmd);
  if (returnData.code !== 0) {
    console.error(`build failed with error code ${returnData.code}`);
    process.exit(returnData.code);
  }
}

console.log("building asmjs version for env " + cmdLineOptions.env);
build(false, cmdLineOptions.env);
console.log("building wasm version for env " + cmdLineOptions.env);
build(true, cmdLineOptions.env);
