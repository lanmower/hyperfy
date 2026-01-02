import {
  AppValidator,
  BaseFactory,
  BaseManager,
  ControlPriorities,
  DEG2RAD,
  Emotes,
  RAD2DEG,
  Ranks,
  System,
  WorldConfig,
  buttons,
  cls,
  eventemitter3_default,
  hashFile,
  isTouch,
  propToLabel,
  storage,
  uuid
} from "./chunk-ZLSMUQEN.js";
import "./chunk-SLCAO7IU.js";
import {
  StructuredLogger,
  cloneDeep_default,
  debounce_default,
  isBoolean_default,
  orderBy_default,
  sortBy_default,
  three_exports
} from "./chunk-XO74L2WM.js";
import {
  __commonJS,
  __publicField,
  __toESM
} from "./chunk-CZ2APHNW.js";

// node_modules/lodash/lodash.js
var require_lodash = __commonJS({
  "node_modules/lodash/lodash.js"(exports, module) {
    (function() {
      var undefined2;
      var VERSION = "4.17.21";
      var LARGE_ARRAY_SIZE = 200;
      var CORE_ERROR_TEXT = "Unsupported core-js use. Try https://npms.io/search?q=ponyfill.", FUNC_ERROR_TEXT = "Expected a function", INVALID_TEMPL_VAR_ERROR_TEXT = "Invalid `variable` option passed into `_.template`";
      var HASH_UNDEFINED = "__lodash_hash_undefined__";
      var MAX_MEMOIZE_SIZE = 500;
      var PLACEHOLDER = "__lodash_placeholder__";
      var CLONE_DEEP_FLAG = 1, CLONE_FLAT_FLAG = 2, CLONE_SYMBOLS_FLAG = 4;
      var COMPARE_PARTIAL_FLAG = 1, COMPARE_UNORDERED_FLAG = 2;
      var WRAP_BIND_FLAG = 1, WRAP_BIND_KEY_FLAG = 2, WRAP_CURRY_BOUND_FLAG = 4, WRAP_CURRY_FLAG = 8, WRAP_CURRY_RIGHT_FLAG = 16, WRAP_PARTIAL_FLAG = 32, WRAP_PARTIAL_RIGHT_FLAG = 64, WRAP_ARY_FLAG = 128, WRAP_REARG_FLAG = 256, WRAP_FLIP_FLAG = 512;
      var DEFAULT_TRUNC_LENGTH = 30, DEFAULT_TRUNC_OMISSION = "...";
      var HOT_COUNT = 800, HOT_SPAN = 16;
      var LAZY_FILTER_FLAG = 1, LAZY_MAP_FLAG = 2, LAZY_WHILE_FLAG = 3;
      var INFINITY = 1 / 0, MAX_SAFE_INTEGER = 9007199254740991, MAX_INTEGER = 17976931348623157e292, NAN = 0 / 0;
      var MAX_ARRAY_LENGTH = 4294967295, MAX_ARRAY_INDEX = MAX_ARRAY_LENGTH - 1, HALF_MAX_ARRAY_LENGTH = MAX_ARRAY_LENGTH >>> 1;
      var wrapFlags = [
        ["ary", WRAP_ARY_FLAG],
        ["bind", WRAP_BIND_FLAG],
        ["bindKey", WRAP_BIND_KEY_FLAG],
        ["curry", WRAP_CURRY_FLAG],
        ["curryRight", WRAP_CURRY_RIGHT_FLAG],
        ["flip", WRAP_FLIP_FLAG],
        ["partial", WRAP_PARTIAL_FLAG],
        ["partialRight", WRAP_PARTIAL_RIGHT_FLAG],
        ["rearg", WRAP_REARG_FLAG]
      ];
      var argsTag = "[object Arguments]", arrayTag = "[object Array]", asyncTag = "[object AsyncFunction]", boolTag = "[object Boolean]", dateTag = "[object Date]", domExcTag = "[object DOMException]", errorTag = "[object Error]", funcTag = "[object Function]", genTag = "[object GeneratorFunction]", mapTag = "[object Map]", numberTag = "[object Number]", nullTag = "[object Null]", objectTag = "[object Object]", promiseTag = "[object Promise]", proxyTag = "[object Proxy]", regexpTag = "[object RegExp]", setTag = "[object Set]", stringTag = "[object String]", symbolTag = "[object Symbol]", undefinedTag = "[object Undefined]", weakMapTag = "[object WeakMap]", weakSetTag = "[object WeakSet]";
      var arrayBufferTag = "[object ArrayBuffer]", dataViewTag = "[object DataView]", float32Tag = "[object Float32Array]", float64Tag = "[object Float64Array]", int8Tag = "[object Int8Array]", int16Tag = "[object Int16Array]", int32Tag = "[object Int32Array]", uint8Tag = "[object Uint8Array]", uint8ClampedTag = "[object Uint8ClampedArray]", uint16Tag = "[object Uint16Array]", uint32Tag = "[object Uint32Array]";
      var reEmptyStringLeading = /\b__p \+= '';/g, reEmptyStringMiddle = /\b(__p \+=) '' \+/g, reEmptyStringTrailing = /(__e\(.*?\)|\b__t\)) \+\n'';/g;
      var reEscapedHtml = /&(?:amp|lt|gt|quot|#39);/g, reUnescapedHtml = /[&<>"']/g, reHasEscapedHtml = RegExp(reEscapedHtml.source), reHasUnescapedHtml = RegExp(reUnescapedHtml.source);
      var reEscape = /<%-([\s\S]+?)%>/g, reEvaluate = /<%([\s\S]+?)%>/g, reInterpolate = /<%=([\s\S]+?)%>/g;
      var reIsDeepProp = /\.|\[(?:[^[\]]*|(["'])(?:(?!\1)[^\\]|\\.)*?\1)\]/, reIsPlainProp = /^\w*$/, rePropName = /[^.[\]]+|\[(?:(-?\d+(?:\.\d+)?)|(["'])((?:(?!\2)[^\\]|\\.)*?)\2)\]|(?=(?:\.|\[\])(?:\.|\[\]|$))/g;
      var reRegExpChar = /[\\^$.*+?()[\]{}|]/g, reHasRegExpChar = RegExp(reRegExpChar.source);
      var reTrimStart = /^\s+/;
      var reWhitespace = /\s/;
      var reWrapComment = /\{(?:\n\/\* \[wrapped with .+\] \*\/)?\n?/, reWrapDetails = /\{\n\/\* \[wrapped with (.+)\] \*/, reSplitDetails = /,? & /;
      var reAsciiWord = /[^\x00-\x2f\x3a-\x40\x5b-\x60\x7b-\x7f]+/g;
      var reForbiddenIdentifierChars = /[()=,{}\[\]\/\s]/;
      var reEscapeChar = /\\(\\)?/g;
      var reEsTemplate = /\$\{([^\\}]*(?:\\.[^\\}]*)*)\}/g;
      var reFlags = /\w*$/;
      var reIsBadHex = /^[-+]0x[0-9a-f]+$/i;
      var reIsBinary = /^0b[01]+$/i;
      var reIsHostCtor = /^\[object .+?Constructor\]$/;
      var reIsOctal = /^0o[0-7]+$/i;
      var reIsUint = /^(?:0|[1-9]\d*)$/;
      var reLatin = /[\xc0-\xd6\xd8-\xf6\xf8-\xff\u0100-\u017f]/g;
      var reNoMatch = /($^)/;
      var reUnescapedString = /['\n\r\u2028\u2029\\]/g;
      var rsAstralRange = "\\ud800-\\udfff", rsComboMarksRange = "\\u0300-\\u036f", reComboHalfMarksRange = "\\ufe20-\\ufe2f", rsComboSymbolsRange = "\\u20d0-\\u20ff", rsComboRange = rsComboMarksRange + reComboHalfMarksRange + rsComboSymbolsRange, rsDingbatRange = "\\u2700-\\u27bf", rsLowerRange = "a-z\\xdf-\\xf6\\xf8-\\xff", rsMathOpRange = "\\xac\\xb1\\xd7\\xf7", rsNonCharRange = "\\x00-\\x2f\\x3a-\\x40\\x5b-\\x60\\x7b-\\xbf", rsPunctuationRange = "\\u2000-\\u206f", rsSpaceRange = " \\t\\x0b\\f\\xa0\\ufeff\\n\\r\\u2028\\u2029\\u1680\\u180e\\u2000\\u2001\\u2002\\u2003\\u2004\\u2005\\u2006\\u2007\\u2008\\u2009\\u200a\\u202f\\u205f\\u3000", rsUpperRange = "A-Z\\xc0-\\xd6\\xd8-\\xde", rsVarRange = "\\ufe0e\\ufe0f", rsBreakRange = rsMathOpRange + rsNonCharRange + rsPunctuationRange + rsSpaceRange;
      var rsApos = "['\u2019]", rsAstral = "[" + rsAstralRange + "]", rsBreak = "[" + rsBreakRange + "]", rsCombo = "[" + rsComboRange + "]", rsDigits = "\\d+", rsDingbat = "[" + rsDingbatRange + "]", rsLower = "[" + rsLowerRange + "]", rsMisc = "[^" + rsAstralRange + rsBreakRange + rsDigits + rsDingbatRange + rsLowerRange + rsUpperRange + "]", rsFitz = "\\ud83c[\\udffb-\\udfff]", rsModifier = "(?:" + rsCombo + "|" + rsFitz + ")", rsNonAstral = "[^" + rsAstralRange + "]", rsRegional = "(?:\\ud83c[\\udde6-\\uddff]){2}", rsSurrPair = "[\\ud800-\\udbff][\\udc00-\\udfff]", rsUpper = "[" + rsUpperRange + "]", rsZWJ = "\\u200d";
      var rsMiscLower = "(?:" + rsLower + "|" + rsMisc + ")", rsMiscUpper = "(?:" + rsUpper + "|" + rsMisc + ")", rsOptContrLower = "(?:" + rsApos + "(?:d|ll|m|re|s|t|ve))?", rsOptContrUpper = "(?:" + rsApos + "(?:D|LL|M|RE|S|T|VE))?", reOptMod = rsModifier + "?", rsOptVar = "[" + rsVarRange + "]?", rsOptJoin = "(?:" + rsZWJ + "(?:" + [rsNonAstral, rsRegional, rsSurrPair].join("|") + ")" + rsOptVar + reOptMod + ")*", rsOrdLower = "\\d*(?:1st|2nd|3rd|(?![123])\\dth)(?=\\b|[A-Z_])", rsOrdUpper = "\\d*(?:1ST|2ND|3RD|(?![123])\\dTH)(?=\\b|[a-z_])", rsSeq = rsOptVar + reOptMod + rsOptJoin, rsEmoji = "(?:" + [rsDingbat, rsRegional, rsSurrPair].join("|") + ")" + rsSeq, rsSymbol = "(?:" + [rsNonAstral + rsCombo + "?", rsCombo, rsRegional, rsSurrPair, rsAstral].join("|") + ")";
      var reApos = RegExp(rsApos, "g");
      var reComboMark = RegExp(rsCombo, "g");
      var reUnicode = RegExp(rsFitz + "(?=" + rsFitz + ")|" + rsSymbol + rsSeq, "g");
      var reUnicodeWord = RegExp([
        rsUpper + "?" + rsLower + "+" + rsOptContrLower + "(?=" + [rsBreak, rsUpper, "$"].join("|") + ")",
        rsMiscUpper + "+" + rsOptContrUpper + "(?=" + [rsBreak, rsUpper + rsMiscLower, "$"].join("|") + ")",
        rsUpper + "?" + rsMiscLower + "+" + rsOptContrLower,
        rsUpper + "+" + rsOptContrUpper,
        rsOrdUpper,
        rsOrdLower,
        rsDigits,
        rsEmoji
      ].join("|"), "g");
      var reHasUnicode = RegExp("[" + rsZWJ + rsAstralRange + rsComboRange + rsVarRange + "]");
      var reHasUnicodeWord = /[a-z][A-Z]|[A-Z]{2}[a-z]|[0-9][a-zA-Z]|[a-zA-Z][0-9]|[^a-zA-Z0-9 ]/;
      var contextProps = [
        "Array",
        "Buffer",
        "DataView",
        "Date",
        "Error",
        "Float32Array",
        "Float64Array",
        "Function",
        "Int8Array",
        "Int16Array",
        "Int32Array",
        "Map",
        "Math",
        "Object",
        "Promise",
        "RegExp",
        "Set",
        "String",
        "Symbol",
        "TypeError",
        "Uint8Array",
        "Uint8ClampedArray",
        "Uint16Array",
        "Uint32Array",
        "WeakMap",
        "_",
        "clearTimeout",
        "isFinite",
        "parseInt",
        "setTimeout"
      ];
      var templateCounter = -1;
      var typedArrayTags = {};
      typedArrayTags[float32Tag] = typedArrayTags[float64Tag] = typedArrayTags[int8Tag] = typedArrayTags[int16Tag] = typedArrayTags[int32Tag] = typedArrayTags[uint8Tag] = typedArrayTags[uint8ClampedTag] = typedArrayTags[uint16Tag] = typedArrayTags[uint32Tag] = true;
      typedArrayTags[argsTag] = typedArrayTags[arrayTag] = typedArrayTags[arrayBufferTag] = typedArrayTags[boolTag] = typedArrayTags[dataViewTag] = typedArrayTags[dateTag] = typedArrayTags[errorTag] = typedArrayTags[funcTag] = typedArrayTags[mapTag] = typedArrayTags[numberTag] = typedArrayTags[objectTag] = typedArrayTags[regexpTag] = typedArrayTags[setTag] = typedArrayTags[stringTag] = typedArrayTags[weakMapTag] = false;
      var cloneableTags = {};
      cloneableTags[argsTag] = cloneableTags[arrayTag] = cloneableTags[arrayBufferTag] = cloneableTags[dataViewTag] = cloneableTags[boolTag] = cloneableTags[dateTag] = cloneableTags[float32Tag] = cloneableTags[float64Tag] = cloneableTags[int8Tag] = cloneableTags[int16Tag] = cloneableTags[int32Tag] = cloneableTags[mapTag] = cloneableTags[numberTag] = cloneableTags[objectTag] = cloneableTags[regexpTag] = cloneableTags[setTag] = cloneableTags[stringTag] = cloneableTags[symbolTag] = cloneableTags[uint8Tag] = cloneableTags[uint8ClampedTag] = cloneableTags[uint16Tag] = cloneableTags[uint32Tag] = true;
      cloneableTags[errorTag] = cloneableTags[funcTag] = cloneableTags[weakMapTag] = false;
      var deburredLetters = {
        // Latin-1 Supplement block.
        "\xC0": "A",
        "\xC1": "A",
        "\xC2": "A",
        "\xC3": "A",
        "\xC4": "A",
        "\xC5": "A",
        "\xE0": "a",
        "\xE1": "a",
        "\xE2": "a",
        "\xE3": "a",
        "\xE4": "a",
        "\xE5": "a",
        "\xC7": "C",
        "\xE7": "c",
        "\xD0": "D",
        "\xF0": "d",
        "\xC8": "E",
        "\xC9": "E",
        "\xCA": "E",
        "\xCB": "E",
        "\xE8": "e",
        "\xE9": "e",
        "\xEA": "e",
        "\xEB": "e",
        "\xCC": "I",
        "\xCD": "I",
        "\xCE": "I",
        "\xCF": "I",
        "\xEC": "i",
        "\xED": "i",
        "\xEE": "i",
        "\xEF": "i",
        "\xD1": "N",
        "\xF1": "n",
        "\xD2": "O",
        "\xD3": "O",
        "\xD4": "O",
        "\xD5": "O",
        "\xD6": "O",
        "\xD8": "O",
        "\xF2": "o",
        "\xF3": "o",
        "\xF4": "o",
        "\xF5": "o",
        "\xF6": "o",
        "\xF8": "o",
        "\xD9": "U",
        "\xDA": "U",
        "\xDB": "U",
        "\xDC": "U",
        "\xF9": "u",
        "\xFA": "u",
        "\xFB": "u",
        "\xFC": "u",
        "\xDD": "Y",
        "\xFD": "y",
        "\xFF": "y",
        "\xC6": "Ae",
        "\xE6": "ae",
        "\xDE": "Th",
        "\xFE": "th",
        "\xDF": "ss",
        // Latin Extended-A block.
        "\u0100": "A",
        "\u0102": "A",
        "\u0104": "A",
        "\u0101": "a",
        "\u0103": "a",
        "\u0105": "a",
        "\u0106": "C",
        "\u0108": "C",
        "\u010A": "C",
        "\u010C": "C",
        "\u0107": "c",
        "\u0109": "c",
        "\u010B": "c",
        "\u010D": "c",
        "\u010E": "D",
        "\u0110": "D",
        "\u010F": "d",
        "\u0111": "d",
        "\u0112": "E",
        "\u0114": "E",
        "\u0116": "E",
        "\u0118": "E",
        "\u011A": "E",
        "\u0113": "e",
        "\u0115": "e",
        "\u0117": "e",
        "\u0119": "e",
        "\u011B": "e",
        "\u011C": "G",
        "\u011E": "G",
        "\u0120": "G",
        "\u0122": "G",
        "\u011D": "g",
        "\u011F": "g",
        "\u0121": "g",
        "\u0123": "g",
        "\u0124": "H",
        "\u0126": "H",
        "\u0125": "h",
        "\u0127": "h",
        "\u0128": "I",
        "\u012A": "I",
        "\u012C": "I",
        "\u012E": "I",
        "\u0130": "I",
        "\u0129": "i",
        "\u012B": "i",
        "\u012D": "i",
        "\u012F": "i",
        "\u0131": "i",
        "\u0134": "J",
        "\u0135": "j",
        "\u0136": "K",
        "\u0137": "k",
        "\u0138": "k",
        "\u0139": "L",
        "\u013B": "L",
        "\u013D": "L",
        "\u013F": "L",
        "\u0141": "L",
        "\u013A": "l",
        "\u013C": "l",
        "\u013E": "l",
        "\u0140": "l",
        "\u0142": "l",
        "\u0143": "N",
        "\u0145": "N",
        "\u0147": "N",
        "\u014A": "N",
        "\u0144": "n",
        "\u0146": "n",
        "\u0148": "n",
        "\u014B": "n",
        "\u014C": "O",
        "\u014E": "O",
        "\u0150": "O",
        "\u014D": "o",
        "\u014F": "o",
        "\u0151": "o",
        "\u0154": "R",
        "\u0156": "R",
        "\u0158": "R",
        "\u0155": "r",
        "\u0157": "r",
        "\u0159": "r",
        "\u015A": "S",
        "\u015C": "S",
        "\u015E": "S",
        "\u0160": "S",
        "\u015B": "s",
        "\u015D": "s",
        "\u015F": "s",
        "\u0161": "s",
        "\u0162": "T",
        "\u0164": "T",
        "\u0166": "T",
        "\u0163": "t",
        "\u0165": "t",
        "\u0167": "t",
        "\u0168": "U",
        "\u016A": "U",
        "\u016C": "U",
        "\u016E": "U",
        "\u0170": "U",
        "\u0172": "U",
        "\u0169": "u",
        "\u016B": "u",
        "\u016D": "u",
        "\u016F": "u",
        "\u0171": "u",
        "\u0173": "u",
        "\u0174": "W",
        "\u0175": "w",
        "\u0176": "Y",
        "\u0177": "y",
        "\u0178": "Y",
        "\u0179": "Z",
        "\u017B": "Z",
        "\u017D": "Z",
        "\u017A": "z",
        "\u017C": "z",
        "\u017E": "z",
        "\u0132": "IJ",
        "\u0133": "ij",
        "\u0152": "Oe",
        "\u0153": "oe",
        "\u0149": "'n",
        "\u017F": "s"
      };
      var htmlEscapes = {
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;"
      };
      var htmlUnescapes = {
        "&amp;": "&",
        "&lt;": "<",
        "&gt;": ">",
        "&quot;": '"',
        "&#39;": "'"
      };
      var stringEscapes = {
        "\\": "\\",
        "'": "'",
        "\n": "n",
        "\r": "r",
        "\u2028": "u2028",
        "\u2029": "u2029"
      };
      var freeParseFloat = parseFloat, freeParseInt = parseInt;
      var freeGlobal = typeof global == "object" && global && global.Object === Object && global;
      var freeSelf = typeof self == "object" && self && self.Object === Object && self;
      var root = freeGlobal || freeSelf || Function("return this")();
      var freeExports = typeof exports == "object" && exports && !exports.nodeType && exports;
      var freeModule = freeExports && typeof module == "object" && module && !module.nodeType && module;
      var moduleExports = freeModule && freeModule.exports === freeExports;
      var freeProcess = moduleExports && freeGlobal.process;
      var nodeUtil = (function() {
        try {
          var types = freeModule && freeModule.require && freeModule.require("util").types;
          if (types) {
            return types;
          }
          return freeProcess && freeProcess.binding && freeProcess.binding("util");
        } catch (e) {
        }
      })();
      var nodeIsArrayBuffer = nodeUtil && nodeUtil.isArrayBuffer, nodeIsDate = nodeUtil && nodeUtil.isDate, nodeIsMap = nodeUtil && nodeUtil.isMap, nodeIsRegExp = nodeUtil && nodeUtil.isRegExp, nodeIsSet = nodeUtil && nodeUtil.isSet, nodeIsTypedArray = nodeUtil && nodeUtil.isTypedArray;
      function apply(func, thisArg, args) {
        switch (args.length) {
          case 0:
            return func.call(thisArg);
          case 1:
            return func.call(thisArg, args[0]);
          case 2:
            return func.call(thisArg, args[0], args[1]);
          case 3:
            return func.call(thisArg, args[0], args[1], args[2]);
        }
        return func.apply(thisArg, args);
      }
      function arrayAggregator(array, setter, iteratee, accumulator) {
        var index = -1, length2 = array == null ? 0 : array.length;
        while (++index < length2) {
          var value = array[index];
          setter(accumulator, value, iteratee(value), array);
        }
        return accumulator;
      }
      function arrayEach(array, iteratee) {
        var index = -1, length2 = array == null ? 0 : array.length;
        while (++index < length2) {
          if (iteratee(array[index], index, array) === false) {
            break;
          }
        }
        return array;
      }
      function arrayEachRight(array, iteratee) {
        var length2 = array == null ? 0 : array.length;
        while (length2--) {
          if (iteratee(array[length2], length2, array) === false) {
            break;
          }
        }
        return array;
      }
      function arrayEvery(array, predicate) {
        var index = -1, length2 = array == null ? 0 : array.length;
        while (++index < length2) {
          if (!predicate(array[index], index, array)) {
            return false;
          }
        }
        return true;
      }
      function arrayFilter(array, predicate) {
        var index = -1, length2 = array == null ? 0 : array.length, resIndex = 0, result = [];
        while (++index < length2) {
          var value = array[index];
          if (predicate(value, index, array)) {
            result[resIndex++] = value;
          }
        }
        return result;
      }
      function arrayIncludes(array, value) {
        var length2 = array == null ? 0 : array.length;
        return !!length2 && baseIndexOf(array, value, 0) > -1;
      }
      function arrayIncludesWith(array, value, comparator) {
        var index = -1, length2 = array == null ? 0 : array.length;
        while (++index < length2) {
          if (comparator(value, array[index])) {
            return true;
          }
        }
        return false;
      }
      function arrayMap(array, iteratee) {
        var index = -1, length2 = array == null ? 0 : array.length, result = Array(length2);
        while (++index < length2) {
          result[index] = iteratee(array[index], index, array);
        }
        return result;
      }
      function arrayPush(array, values) {
        var index = -1, length2 = values.length, offset = array.length;
        while (++index < length2) {
          array[offset + index] = values[index];
        }
        return array;
      }
      function arrayReduce(array, iteratee, accumulator, initAccum) {
        var index = -1, length2 = array == null ? 0 : array.length;
        if (initAccum && length2) {
          accumulator = array[++index];
        }
        while (++index < length2) {
          accumulator = iteratee(accumulator, array[index], index, array);
        }
        return accumulator;
      }
      function arrayReduceRight(array, iteratee, accumulator, initAccum) {
        var length2 = array == null ? 0 : array.length;
        if (initAccum && length2) {
          accumulator = array[--length2];
        }
        while (length2--) {
          accumulator = iteratee(accumulator, array[length2], length2, array);
        }
        return accumulator;
      }
      function arraySome(array, predicate) {
        var index = -1, length2 = array == null ? 0 : array.length;
        while (++index < length2) {
          if (predicate(array[index], index, array)) {
            return true;
          }
        }
        return false;
      }
      var asciiSize = baseProperty("length");
      function asciiToArray(string) {
        return string.split("");
      }
      function asciiWords(string) {
        return string.match(reAsciiWord) || [];
      }
      function baseFindKey(collection, predicate, eachFunc) {
        var result;
        eachFunc(collection, function(value, key, collection2) {
          if (predicate(value, key, collection2)) {
            result = key;
            return false;
          }
        });
        return result;
      }
      function baseFindIndex(array, predicate, fromIndex, fromRight) {
        var length2 = array.length, index = fromIndex + (fromRight ? 1 : -1);
        while (fromRight ? index-- : ++index < length2) {
          if (predicate(array[index], index, array)) {
            return index;
          }
        }
        return -1;
      }
      function baseIndexOf(array, value, fromIndex) {
        return value === value ? strictIndexOf(array, value, fromIndex) : baseFindIndex(array, baseIsNaN, fromIndex);
      }
      function baseIndexOfWith(array, value, fromIndex, comparator) {
        var index = fromIndex - 1, length2 = array.length;
        while (++index < length2) {
          if (comparator(array[index], value)) {
            return index;
          }
        }
        return -1;
      }
      function baseIsNaN(value) {
        return value !== value;
      }
      function baseMean(array, iteratee) {
        var length2 = array == null ? 0 : array.length;
        return length2 ? baseSum(array, iteratee) / length2 : NAN;
      }
      function baseProperty(key) {
        return function(object) {
          return object == null ? undefined2 : object[key];
        };
      }
      function basePropertyOf(object) {
        return function(key) {
          return object == null ? undefined2 : object[key];
        };
      }
      function baseReduce(collection, iteratee, accumulator, initAccum, eachFunc) {
        eachFunc(collection, function(value, index, collection2) {
          accumulator = initAccum ? (initAccum = false, value) : iteratee(accumulator, value, index, collection2);
        });
        return accumulator;
      }
      function baseSortBy(array, comparer) {
        var length2 = array.length;
        array.sort(comparer);
        while (length2--) {
          array[length2] = array[length2].value;
        }
        return array;
      }
      function baseSum(array, iteratee) {
        var result, index = -1, length2 = array.length;
        while (++index < length2) {
          var current = iteratee(array[index]);
          if (current !== undefined2) {
            result = result === undefined2 ? current : result + current;
          }
        }
        return result;
      }
      function baseTimes(n, iteratee) {
        var index = -1, result = Array(n);
        while (++index < n) {
          result[index] = iteratee(index);
        }
        return result;
      }
      function baseToPairs(object, props) {
        return arrayMap(props, function(key) {
          return [key, object[key]];
        });
      }
      function baseTrim(string) {
        return string ? string.slice(0, trimmedEndIndex(string) + 1).replace(reTrimStart, "") : string;
      }
      function baseUnary(func) {
        return function(value) {
          return func(value);
        };
      }
      function baseValues(object, props) {
        return arrayMap(props, function(key) {
          return object[key];
        });
      }
      function cacheHas(cache, key) {
        return cache.has(key);
      }
      function charsStartIndex(strSymbols, chrSymbols) {
        var index = -1, length2 = strSymbols.length;
        while (++index < length2 && baseIndexOf(chrSymbols, strSymbols[index], 0) > -1) {
        }
        return index;
      }
      function charsEndIndex(strSymbols, chrSymbols) {
        var index = strSymbols.length;
        while (index-- && baseIndexOf(chrSymbols, strSymbols[index], 0) > -1) {
        }
        return index;
      }
      function countHolders(array, placeholder) {
        var length2 = array.length, result = 0;
        while (length2--) {
          if (array[length2] === placeholder) {
            ++result;
          }
        }
        return result;
      }
      var deburrLetter = basePropertyOf(deburredLetters);
      var escapeHtmlChar = basePropertyOf(htmlEscapes);
      function escapeStringChar(chr) {
        return "\\" + stringEscapes[chr];
      }
      function getValue(object, key) {
        return object == null ? undefined2 : object[key];
      }
      function hasUnicode(string) {
        return reHasUnicode.test(string);
      }
      function hasUnicodeWord(string) {
        return reHasUnicodeWord.test(string);
      }
      function iteratorToArray(iterator) {
        var data, result = [];
        while (!(data = iterator.next()).done) {
          result.push(data.value);
        }
        return result;
      }
      function mapToArray(map) {
        var index = -1, result = Array(map.size);
        map.forEach(function(value, key) {
          result[++index] = [key, value];
        });
        return result;
      }
      function overArg(func, transform) {
        return function(arg) {
          return func(transform(arg));
        };
      }
      function replaceHolders(array, placeholder) {
        var index = -1, length2 = array.length, resIndex = 0, result = [];
        while (++index < length2) {
          var value = array[index];
          if (value === placeholder || value === PLACEHOLDER) {
            array[index] = PLACEHOLDER;
            result[resIndex++] = index;
          }
        }
        return result;
      }
      function setToArray(set) {
        var index = -1, result = Array(set.size);
        set.forEach(function(value) {
          result[++index] = value;
        });
        return result;
      }
      function setToPairs(set) {
        var index = -1, result = Array(set.size);
        set.forEach(function(value) {
          result[++index] = [value, value];
        });
        return result;
      }
      function strictIndexOf(array, value, fromIndex) {
        var index = fromIndex - 1, length2 = array.length;
        while (++index < length2) {
          if (array[index] === value) {
            return index;
          }
        }
        return -1;
      }
      function strictLastIndexOf(array, value, fromIndex) {
        var index = fromIndex + 1;
        while (index--) {
          if (array[index] === value) {
            return index;
          }
        }
        return index;
      }
      function stringSize(string) {
        return hasUnicode(string) ? unicodeSize(string) : asciiSize(string);
      }
      function stringToArray(string) {
        return hasUnicode(string) ? unicodeToArray(string) : asciiToArray(string);
      }
      function trimmedEndIndex(string) {
        var index = string.length;
        while (index-- && reWhitespace.test(string.charAt(index))) {
        }
        return index;
      }
      var unescapeHtmlChar = basePropertyOf(htmlUnescapes);
      function unicodeSize(string) {
        var result = reUnicode.lastIndex = 0;
        while (reUnicode.test(string)) {
          ++result;
        }
        return result;
      }
      function unicodeToArray(string) {
        return string.match(reUnicode) || [];
      }
      function unicodeWords(string) {
        return string.match(reUnicodeWord) || [];
      }
      var runInContext = (function runInContext2(context) {
        context = context == null ? root : _.defaults(root.Object(), context, _.pick(root, contextProps));
        var Array2 = context.Array, Date2 = context.Date, Error2 = context.Error, Function2 = context.Function, Math2 = context.Math, Object2 = context.Object, RegExp2 = context.RegExp, String2 = context.String, TypeError = context.TypeError;
        var arrayProto = Array2.prototype, funcProto = Function2.prototype, objectProto = Object2.prototype;
        var coreJsData = context["__core-js_shared__"];
        var funcToString = funcProto.toString;
        var hasOwnProperty2 = objectProto.hasOwnProperty;
        var idCounter = 0;
        var maskSrcKey = (function() {
          var uid = /[^.]+$/.exec(coreJsData && coreJsData.keys && coreJsData.keys.IE_PROTO || "");
          return uid ? "Symbol(src)_1." + uid : "";
        })();
        var nativeObjectToString = objectProto.toString;
        var objectCtorString = funcToString.call(Object2);
        var oldDash = root._;
        var reIsNative = RegExp2(
          "^" + funcToString.call(hasOwnProperty2).replace(reRegExpChar, "\\$&").replace(/hasOwnProperty|(function).*?(?=\\\()| for .+?(?=\\\])/g, "$1.*?") + "$"
        );
        var Buffer = moduleExports ? context.Buffer : undefined2, Symbol = context.Symbol, Uint8Array2 = context.Uint8Array, allocUnsafe = Buffer ? Buffer.allocUnsafe : undefined2, getPrototype = overArg(Object2.getPrototypeOf, Object2), objectCreate = Object2.create, propertyIsEnumerable = objectProto.propertyIsEnumerable, splice = arrayProto.splice, spreadableSymbol = Symbol ? Symbol.isConcatSpreadable : undefined2, symIterator = Symbol ? Symbol.iterator : undefined2, symToStringTag = Symbol ? Symbol.toStringTag : undefined2;
        var defineProperty = (function() {
          try {
            var func = getNative(Object2, "defineProperty");
            func({}, "", {});
            return func;
          } catch (e) {
          }
        })();
        var ctxClearTimeout = context.clearTimeout !== root.clearTimeout && context.clearTimeout, ctxNow = Date2 && Date2.now !== root.Date.now && Date2.now, ctxSetTimeout = context.setTimeout !== root.setTimeout && context.setTimeout;
        var nativeCeil = Math2.ceil, nativeFloor = Math2.floor, nativeGetSymbols = Object2.getOwnPropertySymbols, nativeIsBuffer = Buffer ? Buffer.isBuffer : undefined2, nativeIsFinite = context.isFinite, nativeJoin = arrayProto.join, nativeKeys = overArg(Object2.keys, Object2), nativeMax = Math2.max, nativeMin = Math2.min, nativeNow = Date2.now, nativeParseInt = context.parseInt, nativeRandom = Math2.random, nativeReverse = arrayProto.reverse;
        var DataView2 = getNative(context, "DataView"), Map2 = getNative(context, "Map"), Promise2 = getNative(context, "Promise"), Set2 = getNative(context, "Set"), WeakMap = getNative(context, "WeakMap"), nativeCreate = getNative(Object2, "create");
        var metaMap = WeakMap && new WeakMap();
        var realNames = {};
        var dataViewCtorString = toSource(DataView2), mapCtorString = toSource(Map2), promiseCtorString = toSource(Promise2), setCtorString = toSource(Set2), weakMapCtorString = toSource(WeakMap);
        var symbolProto = Symbol ? Symbol.prototype : undefined2, symbolValueOf = symbolProto ? symbolProto.valueOf : undefined2, symbolToString = symbolProto ? symbolProto.toString : undefined2;
        function lodash(value) {
          if (isObjectLike(value) && !isArray(value) && !(value instanceof LazyWrapper)) {
            if (value instanceof LodashWrapper) {
              return value;
            }
            if (hasOwnProperty2.call(value, "__wrapped__")) {
              return wrapperClone(value);
            }
          }
          return new LodashWrapper(value);
        }
        var baseCreate = /* @__PURE__ */ (function() {
          function object() {
          }
          return function(proto) {
            if (!isObject(proto)) {
              return {};
            }
            if (objectCreate) {
              return objectCreate(proto);
            }
            object.prototype = proto;
            var result2 = new object();
            object.prototype = undefined2;
            return result2;
          };
        })();
        function baseLodash() {
        }
        function LodashWrapper(value, chainAll) {
          this.__wrapped__ = value;
          this.__actions__ = [];
          this.__chain__ = !!chainAll;
          this.__index__ = 0;
          this.__values__ = undefined2;
        }
        lodash.templateSettings = {
          /**
           * Used to detect `data` property values to be HTML-escaped.
           *
           * @memberOf _.templateSettings
           * @type {RegExp}
           */
          "escape": reEscape,
          /**
           * Used to detect code to be evaluated.
           *
           * @memberOf _.templateSettings
           * @type {RegExp}
           */
          "evaluate": reEvaluate,
          /**
           * Used to detect `data` property values to inject.
           *
           * @memberOf _.templateSettings
           * @type {RegExp}
           */
          "interpolate": reInterpolate,
          /**
           * Used to reference the data object in the template text.
           *
           * @memberOf _.templateSettings
           * @type {string}
           */
          "variable": "",
          /**
           * Used to import variables into the compiled template.
           *
           * @memberOf _.templateSettings
           * @type {Object}
           */
          "imports": {
            /**
             * A reference to the `lodash` function.
             *
             * @memberOf _.templateSettings.imports
             * @type {Function}
             */
            "_": lodash
          }
        };
        lodash.prototype = baseLodash.prototype;
        lodash.prototype.constructor = lodash;
        LodashWrapper.prototype = baseCreate(baseLodash.prototype);
        LodashWrapper.prototype.constructor = LodashWrapper;
        function LazyWrapper(value) {
          this.__wrapped__ = value;
          this.__actions__ = [];
          this.__dir__ = 1;
          this.__filtered__ = false;
          this.__iteratees__ = [];
          this.__takeCount__ = MAX_ARRAY_LENGTH;
          this.__views__ = [];
        }
        function lazyClone() {
          var result2 = new LazyWrapper(this.__wrapped__);
          result2.__actions__ = copyArray(this.__actions__);
          result2.__dir__ = this.__dir__;
          result2.__filtered__ = this.__filtered__;
          result2.__iteratees__ = copyArray(this.__iteratees__);
          result2.__takeCount__ = this.__takeCount__;
          result2.__views__ = copyArray(this.__views__);
          return result2;
        }
        function lazyReverse() {
          if (this.__filtered__) {
            var result2 = new LazyWrapper(this);
            result2.__dir__ = -1;
            result2.__filtered__ = true;
          } else {
            result2 = this.clone();
            result2.__dir__ *= -1;
          }
          return result2;
        }
        function lazyValue() {
          var array = this.__wrapped__.value(), dir = this.__dir__, isArr = isArray(array), isRight = dir < 0, arrLength = isArr ? array.length : 0, view = getView(0, arrLength, this.__views__), start = view.start, end = view.end, length2 = end - start, index = isRight ? end : start - 1, iteratees = this.__iteratees__, iterLength = iteratees.length, resIndex = 0, takeCount = nativeMin(length2, this.__takeCount__);
          if (!isArr || !isRight && arrLength == length2 && takeCount == length2) {
            return baseWrapperValue(array, this.__actions__);
          }
          var result2 = [];
          outer:
            while (length2-- && resIndex < takeCount) {
              index += dir;
              var iterIndex = -1, value = array[index];
              while (++iterIndex < iterLength) {
                var data = iteratees[iterIndex], iteratee2 = data.iteratee, type = data.type, computed = iteratee2(value);
                if (type == LAZY_MAP_FLAG) {
                  value = computed;
                } else if (!computed) {
                  if (type == LAZY_FILTER_FLAG) {
                    continue outer;
                  } else {
                    break outer;
                  }
                }
              }
              result2[resIndex++] = value;
            }
          return result2;
        }
        LazyWrapper.prototype = baseCreate(baseLodash.prototype);
        LazyWrapper.prototype.constructor = LazyWrapper;
        function Hash2(entries) {
          var index = -1, length2 = entries == null ? 0 : entries.length;
          this.clear();
          while (++index < length2) {
            var entry = entries[index];
            this.set(entry[0], entry[1]);
          }
        }
        function hashClear() {
          this.__data__ = nativeCreate ? nativeCreate(null) : {};
          this.size = 0;
        }
        function hashDelete(key) {
          var result2 = this.has(key) && delete this.__data__[key];
          this.size -= result2 ? 1 : 0;
          return result2;
        }
        function hashGet(key) {
          var data = this.__data__;
          if (nativeCreate) {
            var result2 = data[key];
            return result2 === HASH_UNDEFINED ? undefined2 : result2;
          }
          return hasOwnProperty2.call(data, key) ? data[key] : undefined2;
        }
        function hashHas(key) {
          var data = this.__data__;
          return nativeCreate ? data[key] !== undefined2 : hasOwnProperty2.call(data, key);
        }
        function hashSet(key, value) {
          var data = this.__data__;
          this.size += this.has(key) ? 0 : 1;
          data[key] = nativeCreate && value === undefined2 ? HASH_UNDEFINED : value;
          return this;
        }
        Hash2.prototype.clear = hashClear;
        Hash2.prototype["delete"] = hashDelete;
        Hash2.prototype.get = hashGet;
        Hash2.prototype.has = hashHas;
        Hash2.prototype.set = hashSet;
        function ListCache(entries) {
          var index = -1, length2 = entries == null ? 0 : entries.length;
          this.clear();
          while (++index < length2) {
            var entry = entries[index];
            this.set(entry[0], entry[1]);
          }
        }
        function listCacheClear() {
          this.__data__ = [];
          this.size = 0;
        }
        function listCacheDelete(key) {
          var data = this.__data__, index = assocIndexOf(data, key);
          if (index < 0) {
            return false;
          }
          var lastIndex = data.length - 1;
          if (index == lastIndex) {
            data.pop();
          } else {
            splice.call(data, index, 1);
          }
          --this.size;
          return true;
        }
        function listCacheGet(key) {
          var data = this.__data__, index = assocIndexOf(data, key);
          return index < 0 ? undefined2 : data[index][1];
        }
        function listCacheHas(key) {
          return assocIndexOf(this.__data__, key) > -1;
        }
        function listCacheSet(key, value) {
          var data = this.__data__, index = assocIndexOf(data, key);
          if (index < 0) {
            ++this.size;
            data.push([key, value]);
          } else {
            data[index][1] = value;
          }
          return this;
        }
        ListCache.prototype.clear = listCacheClear;
        ListCache.prototype["delete"] = listCacheDelete;
        ListCache.prototype.get = listCacheGet;
        ListCache.prototype.has = listCacheHas;
        ListCache.prototype.set = listCacheSet;
        function MapCache(entries) {
          var index = -1, length2 = entries == null ? 0 : entries.length;
          this.clear();
          while (++index < length2) {
            var entry = entries[index];
            this.set(entry[0], entry[1]);
          }
        }
        function mapCacheClear() {
          this.size = 0;
          this.__data__ = {
            "hash": new Hash2(),
            "map": new (Map2 || ListCache)(),
            "string": new Hash2()
          };
        }
        function mapCacheDelete(key) {
          var result2 = getMapData(this, key)["delete"](key);
          this.size -= result2 ? 1 : 0;
          return result2;
        }
        function mapCacheGet(key) {
          return getMapData(this, key).get(key);
        }
        function mapCacheHas(key) {
          return getMapData(this, key).has(key);
        }
        function mapCacheSet(key, value) {
          var data = getMapData(this, key), size2 = data.size;
          data.set(key, value);
          this.size += data.size == size2 ? 0 : 1;
          return this;
        }
        MapCache.prototype.clear = mapCacheClear;
        MapCache.prototype["delete"] = mapCacheDelete;
        MapCache.prototype.get = mapCacheGet;
        MapCache.prototype.has = mapCacheHas;
        MapCache.prototype.set = mapCacheSet;
        function SetCache(values2) {
          var index = -1, length2 = values2 == null ? 0 : values2.length;
          this.__data__ = new MapCache();
          while (++index < length2) {
            this.add(values2[index]);
          }
        }
        function setCacheAdd(value) {
          this.__data__.set(value, HASH_UNDEFINED);
          return this;
        }
        function setCacheHas(value) {
          return this.__data__.has(value);
        }
        SetCache.prototype.add = SetCache.prototype.push = setCacheAdd;
        SetCache.prototype.has = setCacheHas;
        function Stack(entries) {
          var data = this.__data__ = new ListCache(entries);
          this.size = data.size;
        }
        function stackClear() {
          this.__data__ = new ListCache();
          this.size = 0;
        }
        function stackDelete(key) {
          var data = this.__data__, result2 = data["delete"](key);
          this.size = data.size;
          return result2;
        }
        function stackGet(key) {
          return this.__data__.get(key);
        }
        function stackHas(key) {
          return this.__data__.has(key);
        }
        function stackSet(key, value) {
          var data = this.__data__;
          if (data instanceof ListCache) {
            var pairs = data.__data__;
            if (!Map2 || pairs.length < LARGE_ARRAY_SIZE - 1) {
              pairs.push([key, value]);
              this.size = ++data.size;
              return this;
            }
            data = this.__data__ = new MapCache(pairs);
          }
          data.set(key, value);
          this.size = data.size;
          return this;
        }
        Stack.prototype.clear = stackClear;
        Stack.prototype["delete"] = stackDelete;
        Stack.prototype.get = stackGet;
        Stack.prototype.has = stackHas;
        Stack.prototype.set = stackSet;
        function arrayLikeKeys(value, inherited) {
          var isArr = isArray(value), isArg = !isArr && isArguments(value), isBuff = !isArr && !isArg && isBuffer(value), isType = !isArr && !isArg && !isBuff && isTypedArray(value), skipIndexes = isArr || isArg || isBuff || isType, result2 = skipIndexes ? baseTimes(value.length, String2) : [], length2 = result2.length;
          for (var key in value) {
            if ((inherited || hasOwnProperty2.call(value, key)) && !(skipIndexes && // Safari 9 has enumerable `arguments.length` in strict mode.
            (key == "length" || // Node.js 0.10 has enumerable non-index properties on buffers.
            isBuff && (key == "offset" || key == "parent") || // PhantomJS 2 has enumerable non-index properties on typed arrays.
            isType && (key == "buffer" || key == "byteLength" || key == "byteOffset") || // Skip index properties.
            isIndex(key, length2)))) {
              result2.push(key);
            }
          }
          return result2;
        }
        function arraySample(array) {
          var length2 = array.length;
          return length2 ? array[baseRandom(0, length2 - 1)] : undefined2;
        }
        function arraySampleSize(array, n) {
          return shuffleSelf(copyArray(array), baseClamp(n, 0, array.length));
        }
        function arrayShuffle(array) {
          return shuffleSelf(copyArray(array));
        }
        function assignMergeValue(object, key, value) {
          if (value !== undefined2 && !eq(object[key], value) || value === undefined2 && !(key in object)) {
            baseAssignValue(object, key, value);
          }
        }
        function assignValue(object, key, value) {
          var objValue = object[key];
          if (!(hasOwnProperty2.call(object, key) && eq(objValue, value)) || value === undefined2 && !(key in object)) {
            baseAssignValue(object, key, value);
          }
        }
        function assocIndexOf(array, key) {
          var length2 = array.length;
          while (length2--) {
            if (eq(array[length2][0], key)) {
              return length2;
            }
          }
          return -1;
        }
        function baseAggregator(collection, setter, iteratee2, accumulator) {
          baseEach(collection, function(value, key, collection2) {
            setter(accumulator, value, iteratee2(value), collection2);
          });
          return accumulator;
        }
        function baseAssign(object, source) {
          return object && copyObject(source, keys(source), object);
        }
        function baseAssignIn(object, source) {
          return object && copyObject(source, keysIn(source), object);
        }
        function baseAssignValue(object, key, value) {
          if (key == "__proto__" && defineProperty) {
            defineProperty(object, key, {
              "configurable": true,
              "enumerable": true,
              "value": value,
              "writable": true
            });
          } else {
            object[key] = value;
          }
        }
        function baseAt(object, paths) {
          var index = -1, length2 = paths.length, result2 = Array2(length2), skip = object == null;
          while (++index < length2) {
            result2[index] = skip ? undefined2 : get(object, paths[index]);
          }
          return result2;
        }
        function baseClamp(number, lower, upper) {
          if (number === number) {
            if (upper !== undefined2) {
              number = number <= upper ? number : upper;
            }
            if (lower !== undefined2) {
              number = number >= lower ? number : lower;
            }
          }
          return number;
        }
        function baseClone(value, bitmask, customizer, key, object, stack) {
          var result2, isDeep = bitmask & CLONE_DEEP_FLAG, isFlat = bitmask & CLONE_FLAT_FLAG, isFull = bitmask & CLONE_SYMBOLS_FLAG;
          if (customizer) {
            result2 = object ? customizer(value, key, object, stack) : customizer(value);
          }
          if (result2 !== undefined2) {
            return result2;
          }
          if (!isObject(value)) {
            return value;
          }
          var isArr = isArray(value);
          if (isArr) {
            result2 = initCloneArray(value);
            if (!isDeep) {
              return copyArray(value, result2);
            }
          } else {
            var tag = getTag(value), isFunc = tag == funcTag || tag == genTag;
            if (isBuffer(value)) {
              return cloneBuffer(value, isDeep);
            }
            if (tag == objectTag || tag == argsTag || isFunc && !object) {
              result2 = isFlat || isFunc ? {} : initCloneObject(value);
              if (!isDeep) {
                return isFlat ? copySymbolsIn(value, baseAssignIn(result2, value)) : copySymbols(value, baseAssign(result2, value));
              }
            } else {
              if (!cloneableTags[tag]) {
                return object ? value : {};
              }
              result2 = initCloneByTag(value, tag, isDeep);
            }
          }
          stack || (stack = new Stack());
          var stacked = stack.get(value);
          if (stacked) {
            return stacked;
          }
          stack.set(value, result2);
          if (isSet(value)) {
            value.forEach(function(subValue) {
              result2.add(baseClone(subValue, bitmask, customizer, subValue, value, stack));
            });
          } else if (isMap(value)) {
            value.forEach(function(subValue, key2) {
              result2.set(key2, baseClone(subValue, bitmask, customizer, key2, value, stack));
            });
          }
          var keysFunc = isFull ? isFlat ? getAllKeysIn : getAllKeys : isFlat ? keysIn : keys;
          var props = isArr ? undefined2 : keysFunc(value);
          arrayEach(props || value, function(subValue, key2) {
            if (props) {
              key2 = subValue;
              subValue = value[key2];
            }
            assignValue(result2, key2, baseClone(subValue, bitmask, customizer, key2, value, stack));
          });
          return result2;
        }
        function baseConforms(source) {
          var props = keys(source);
          return function(object) {
            return baseConformsTo(object, source, props);
          };
        }
        function baseConformsTo(object, source, props) {
          var length2 = props.length;
          if (object == null) {
            return !length2;
          }
          object = Object2(object);
          while (length2--) {
            var key = props[length2], predicate = source[key], value = object[key];
            if (value === undefined2 && !(key in object) || !predicate(value)) {
              return false;
            }
          }
          return true;
        }
        function baseDelay(func, wait, args) {
          if (typeof func != "function") {
            throw new TypeError(FUNC_ERROR_TEXT);
          }
          return setTimeout2(function() {
            func.apply(undefined2, args);
          }, wait);
        }
        function baseDifference(array, values2, iteratee2, comparator) {
          var index = -1, includes2 = arrayIncludes, isCommon = true, length2 = array.length, result2 = [], valuesLength = values2.length;
          if (!length2) {
            return result2;
          }
          if (iteratee2) {
            values2 = arrayMap(values2, baseUnary(iteratee2));
          }
          if (comparator) {
            includes2 = arrayIncludesWith;
            isCommon = false;
          } else if (values2.length >= LARGE_ARRAY_SIZE) {
            includes2 = cacheHas;
            isCommon = false;
            values2 = new SetCache(values2);
          }
          outer:
            while (++index < length2) {
              var value = array[index], computed = iteratee2 == null ? value : iteratee2(value);
              value = comparator || value !== 0 ? value : 0;
              if (isCommon && computed === computed) {
                var valuesIndex = valuesLength;
                while (valuesIndex--) {
                  if (values2[valuesIndex] === computed) {
                    continue outer;
                  }
                }
                result2.push(value);
              } else if (!includes2(values2, computed, comparator)) {
                result2.push(value);
              }
            }
          return result2;
        }
        var baseEach = createBaseEach(baseForOwn);
        var baseEachRight = createBaseEach(baseForOwnRight, true);
        function baseEvery(collection, predicate) {
          var result2 = true;
          baseEach(collection, function(value, index, collection2) {
            result2 = !!predicate(value, index, collection2);
            return result2;
          });
          return result2;
        }
        function baseExtremum(array, iteratee2, comparator) {
          var index = -1, length2 = array.length;
          while (++index < length2) {
            var value = array[index], current = iteratee2(value);
            if (current != null && (computed === undefined2 ? current === current && !isSymbol(current) : comparator(current, computed))) {
              var computed = current, result2 = value;
            }
          }
          return result2;
        }
        function baseFill(array, value, start, end) {
          var length2 = array.length;
          start = toInteger(start);
          if (start < 0) {
            start = -start > length2 ? 0 : length2 + start;
          }
          end = end === undefined2 || end > length2 ? length2 : toInteger(end);
          if (end < 0) {
            end += length2;
          }
          end = start > end ? 0 : toLength(end);
          while (start < end) {
            array[start++] = value;
          }
          return array;
        }
        function baseFilter(collection, predicate) {
          var result2 = [];
          baseEach(collection, function(value, index, collection2) {
            if (predicate(value, index, collection2)) {
              result2.push(value);
            }
          });
          return result2;
        }
        function baseFlatten(array, depth, predicate, isStrict, result2) {
          var index = -1, length2 = array.length;
          predicate || (predicate = isFlattenable);
          result2 || (result2 = []);
          while (++index < length2) {
            var value = array[index];
            if (depth > 0 && predicate(value)) {
              if (depth > 1) {
                baseFlatten(value, depth - 1, predicate, isStrict, result2);
              } else {
                arrayPush(result2, value);
              }
            } else if (!isStrict) {
              result2[result2.length] = value;
            }
          }
          return result2;
        }
        var baseFor = createBaseFor();
        var baseForRight = createBaseFor(true);
        function baseForOwn(object, iteratee2) {
          return object && baseFor(object, iteratee2, keys);
        }
        function baseForOwnRight(object, iteratee2) {
          return object && baseForRight(object, iteratee2, keys);
        }
        function baseFunctions(object, props) {
          return arrayFilter(props, function(key) {
            return isFunction(object[key]);
          });
        }
        function baseGet(object, path) {
          path = castPath(path, object);
          var index = 0, length2 = path.length;
          while (object != null && index < length2) {
            object = object[toKey(path[index++])];
          }
          return index && index == length2 ? object : undefined2;
        }
        function baseGetAllKeys(object, keysFunc, symbolsFunc) {
          var result2 = keysFunc(object);
          return isArray(object) ? result2 : arrayPush(result2, symbolsFunc(object));
        }
        function baseGetTag(value) {
          if (value == null) {
            return value === undefined2 ? undefinedTag : nullTag;
          }
          return symToStringTag && symToStringTag in Object2(value) ? getRawTag(value) : objectToString(value);
        }
        function baseGt(value, other) {
          return value > other;
        }
        function baseHas(object, key) {
          return object != null && hasOwnProperty2.call(object, key);
        }
        function baseHasIn(object, key) {
          return object != null && key in Object2(object);
        }
        function baseInRange(number, start, end) {
          return number >= nativeMin(start, end) && number < nativeMax(start, end);
        }
        function baseIntersection(arrays, iteratee2, comparator) {
          var includes2 = comparator ? arrayIncludesWith : arrayIncludes, length2 = arrays[0].length, othLength = arrays.length, othIndex = othLength, caches = Array2(othLength), maxLength = Infinity, result2 = [];
          while (othIndex--) {
            var array = arrays[othIndex];
            if (othIndex && iteratee2) {
              array = arrayMap(array, baseUnary(iteratee2));
            }
            maxLength = nativeMin(array.length, maxLength);
            caches[othIndex] = !comparator && (iteratee2 || length2 >= 120 && array.length >= 120) ? new SetCache(othIndex && array) : undefined2;
          }
          array = arrays[0];
          var index = -1, seen = caches[0];
          outer:
            while (++index < length2 && result2.length < maxLength) {
              var value = array[index], computed = iteratee2 ? iteratee2(value) : value;
              value = comparator || value !== 0 ? value : 0;
              if (!(seen ? cacheHas(seen, computed) : includes2(result2, computed, comparator))) {
                othIndex = othLength;
                while (--othIndex) {
                  var cache = caches[othIndex];
                  if (!(cache ? cacheHas(cache, computed) : includes2(arrays[othIndex], computed, comparator))) {
                    continue outer;
                  }
                }
                if (seen) {
                  seen.push(computed);
                }
                result2.push(value);
              }
            }
          return result2;
        }
        function baseInverter(object, setter, iteratee2, accumulator) {
          baseForOwn(object, function(value, key, object2) {
            setter(accumulator, iteratee2(value), key, object2);
          });
          return accumulator;
        }
        function baseInvoke(object, path, args) {
          path = castPath(path, object);
          object = parent(object, path);
          var func = object == null ? object : object[toKey(last(path))];
          return func == null ? undefined2 : apply(func, object, args);
        }
        function baseIsArguments(value) {
          return isObjectLike(value) && baseGetTag(value) == argsTag;
        }
        function baseIsArrayBuffer(value) {
          return isObjectLike(value) && baseGetTag(value) == arrayBufferTag;
        }
        function baseIsDate(value) {
          return isObjectLike(value) && baseGetTag(value) == dateTag;
        }
        function baseIsEqual(value, other, bitmask, customizer, stack) {
          if (value === other) {
            return true;
          }
          if (value == null || other == null || !isObjectLike(value) && !isObjectLike(other)) {
            return value !== value && other !== other;
          }
          return baseIsEqualDeep(value, other, bitmask, customizer, baseIsEqual, stack);
        }
        function baseIsEqualDeep(object, other, bitmask, customizer, equalFunc, stack) {
          var objIsArr = isArray(object), othIsArr = isArray(other), objTag = objIsArr ? arrayTag : getTag(object), othTag = othIsArr ? arrayTag : getTag(other);
          objTag = objTag == argsTag ? objectTag : objTag;
          othTag = othTag == argsTag ? objectTag : othTag;
          var objIsObj = objTag == objectTag, othIsObj = othTag == objectTag, isSameTag = objTag == othTag;
          if (isSameTag && isBuffer(object)) {
            if (!isBuffer(other)) {
              return false;
            }
            objIsArr = true;
            objIsObj = false;
          }
          if (isSameTag && !objIsObj) {
            stack || (stack = new Stack());
            return objIsArr || isTypedArray(object) ? equalArrays(object, other, bitmask, customizer, equalFunc, stack) : equalByTag(object, other, objTag, bitmask, customizer, equalFunc, stack);
          }
          if (!(bitmask & COMPARE_PARTIAL_FLAG)) {
            var objIsWrapped = objIsObj && hasOwnProperty2.call(object, "__wrapped__"), othIsWrapped = othIsObj && hasOwnProperty2.call(other, "__wrapped__");
            if (objIsWrapped || othIsWrapped) {
              var objUnwrapped = objIsWrapped ? object.value() : object, othUnwrapped = othIsWrapped ? other.value() : other;
              stack || (stack = new Stack());
              return equalFunc(objUnwrapped, othUnwrapped, bitmask, customizer, stack);
            }
          }
          if (!isSameTag) {
            return false;
          }
          stack || (stack = new Stack());
          return equalObjects(object, other, bitmask, customizer, equalFunc, stack);
        }
        function baseIsMap(value) {
          return isObjectLike(value) && getTag(value) == mapTag;
        }
        function baseIsMatch(object, source, matchData, customizer) {
          var index = matchData.length, length2 = index, noCustomizer = !customizer;
          if (object == null) {
            return !length2;
          }
          object = Object2(object);
          while (index--) {
            var data = matchData[index];
            if (noCustomizer && data[2] ? data[1] !== object[data[0]] : !(data[0] in object)) {
              return false;
            }
          }
          while (++index < length2) {
            data = matchData[index];
            var key = data[0], objValue = object[key], srcValue = data[1];
            if (noCustomizer && data[2]) {
              if (objValue === undefined2 && !(key in object)) {
                return false;
              }
            } else {
              var stack = new Stack();
              if (customizer) {
                var result2 = customizer(objValue, srcValue, key, object, source, stack);
              }
              if (!(result2 === undefined2 ? baseIsEqual(srcValue, objValue, COMPARE_PARTIAL_FLAG | COMPARE_UNORDERED_FLAG, customizer, stack) : result2)) {
                return false;
              }
            }
          }
          return true;
        }
        function baseIsNative(value) {
          if (!isObject(value) || isMasked(value)) {
            return false;
          }
          var pattern = isFunction(value) ? reIsNative : reIsHostCtor;
          return pattern.test(toSource(value));
        }
        function baseIsRegExp(value) {
          return isObjectLike(value) && baseGetTag(value) == regexpTag;
        }
        function baseIsSet(value) {
          return isObjectLike(value) && getTag(value) == setTag;
        }
        function baseIsTypedArray(value) {
          return isObjectLike(value) && isLength(value.length) && !!typedArrayTags[baseGetTag(value)];
        }
        function baseIteratee(value) {
          if (typeof value == "function") {
            return value;
          }
          if (value == null) {
            return identity;
          }
          if (typeof value == "object") {
            return isArray(value) ? baseMatchesProperty(value[0], value[1]) : baseMatches(value);
          }
          return property(value);
        }
        function baseKeys(object) {
          if (!isPrototype(object)) {
            return nativeKeys(object);
          }
          var result2 = [];
          for (var key in Object2(object)) {
            if (hasOwnProperty2.call(object, key) && key != "constructor") {
              result2.push(key);
            }
          }
          return result2;
        }
        function baseKeysIn(object) {
          if (!isObject(object)) {
            return nativeKeysIn(object);
          }
          var isProto = isPrototype(object), result2 = [];
          for (var key in object) {
            if (!(key == "constructor" && (isProto || !hasOwnProperty2.call(object, key)))) {
              result2.push(key);
            }
          }
          return result2;
        }
        function baseLt(value, other) {
          return value < other;
        }
        function baseMap(collection, iteratee2) {
          var index = -1, result2 = isArrayLike(collection) ? Array2(collection.length) : [];
          baseEach(collection, function(value, key, collection2) {
            result2[++index] = iteratee2(value, key, collection2);
          });
          return result2;
        }
        function baseMatches(source) {
          var matchData = getMatchData(source);
          if (matchData.length == 1 && matchData[0][2]) {
            return matchesStrictComparable(matchData[0][0], matchData[0][1]);
          }
          return function(object) {
            return object === source || baseIsMatch(object, source, matchData);
          };
        }
        function baseMatchesProperty(path, srcValue) {
          if (isKey(path) && isStrictComparable(srcValue)) {
            return matchesStrictComparable(toKey(path), srcValue);
          }
          return function(object) {
            var objValue = get(object, path);
            return objValue === undefined2 && objValue === srcValue ? hasIn(object, path) : baseIsEqual(srcValue, objValue, COMPARE_PARTIAL_FLAG | COMPARE_UNORDERED_FLAG);
          };
        }
        function baseMerge(object, source, srcIndex, customizer, stack) {
          if (object === source) {
            return;
          }
          baseFor(source, function(srcValue, key) {
            stack || (stack = new Stack());
            if (isObject(srcValue)) {
              baseMergeDeep(object, source, key, srcIndex, baseMerge, customizer, stack);
            } else {
              var newValue = customizer ? customizer(safeGet(object, key), srcValue, key + "", object, source, stack) : undefined2;
              if (newValue === undefined2) {
                newValue = srcValue;
              }
              assignMergeValue(object, key, newValue);
            }
          }, keysIn);
        }
        function baseMergeDeep(object, source, key, srcIndex, mergeFunc, customizer, stack) {
          var objValue = safeGet(object, key), srcValue = safeGet(source, key), stacked = stack.get(srcValue);
          if (stacked) {
            assignMergeValue(object, key, stacked);
            return;
          }
          var newValue = customizer ? customizer(objValue, srcValue, key + "", object, source, stack) : undefined2;
          var isCommon = newValue === undefined2;
          if (isCommon) {
            var isArr = isArray(srcValue), isBuff = !isArr && isBuffer(srcValue), isTyped = !isArr && !isBuff && isTypedArray(srcValue);
            newValue = srcValue;
            if (isArr || isBuff || isTyped) {
              if (isArray(objValue)) {
                newValue = objValue;
              } else if (isArrayLikeObject(objValue)) {
                newValue = copyArray(objValue);
              } else if (isBuff) {
                isCommon = false;
                newValue = cloneBuffer(srcValue, true);
              } else if (isTyped) {
                isCommon = false;
                newValue = cloneTypedArray(srcValue, true);
              } else {
                newValue = [];
              }
            } else if (isPlainObject(srcValue) || isArguments(srcValue)) {
              newValue = objValue;
              if (isArguments(objValue)) {
                newValue = toPlainObject(objValue);
              } else if (!isObject(objValue) || isFunction(objValue)) {
                newValue = initCloneObject(srcValue);
              }
            } else {
              isCommon = false;
            }
          }
          if (isCommon) {
            stack.set(srcValue, newValue);
            mergeFunc(newValue, srcValue, srcIndex, customizer, stack);
            stack["delete"](srcValue);
          }
          assignMergeValue(object, key, newValue);
        }
        function baseNth(array, n) {
          var length2 = array.length;
          if (!length2) {
            return;
          }
          n += n < 0 ? length2 : 0;
          return isIndex(n, length2) ? array[n] : undefined2;
        }
        function baseOrderBy(collection, iteratees, orders) {
          if (iteratees.length) {
            iteratees = arrayMap(iteratees, function(iteratee2) {
              if (isArray(iteratee2)) {
                return function(value) {
                  return baseGet(value, iteratee2.length === 1 ? iteratee2[0] : iteratee2);
                };
              }
              return iteratee2;
            });
          } else {
            iteratees = [identity];
          }
          var index = -1;
          iteratees = arrayMap(iteratees, baseUnary(getIteratee()));
          var result2 = baseMap(collection, function(value, key, collection2) {
            var criteria = arrayMap(iteratees, function(iteratee2) {
              return iteratee2(value);
            });
            return { "criteria": criteria, "index": ++index, "value": value };
          });
          return baseSortBy(result2, function(object, other) {
            return compareMultiple(object, other, orders);
          });
        }
        function basePick(object, paths) {
          return basePickBy(object, paths, function(value, path) {
            return hasIn(object, path);
          });
        }
        function basePickBy(object, paths, predicate) {
          var index = -1, length2 = paths.length, result2 = {};
          while (++index < length2) {
            var path = paths[index], value = baseGet(object, path);
            if (predicate(value, path)) {
              baseSet(result2, castPath(path, object), value);
            }
          }
          return result2;
        }
        function basePropertyDeep(path) {
          return function(object) {
            return baseGet(object, path);
          };
        }
        function basePullAll(array, values2, iteratee2, comparator) {
          var indexOf2 = comparator ? baseIndexOfWith : baseIndexOf, index = -1, length2 = values2.length, seen = array;
          if (array === values2) {
            values2 = copyArray(values2);
          }
          if (iteratee2) {
            seen = arrayMap(array, baseUnary(iteratee2));
          }
          while (++index < length2) {
            var fromIndex = 0, value = values2[index], computed = iteratee2 ? iteratee2(value) : value;
            while ((fromIndex = indexOf2(seen, computed, fromIndex, comparator)) > -1) {
              if (seen !== array) {
                splice.call(seen, fromIndex, 1);
              }
              splice.call(array, fromIndex, 1);
            }
          }
          return array;
        }
        function basePullAt(array, indexes) {
          var length2 = array ? indexes.length : 0, lastIndex = length2 - 1;
          while (length2--) {
            var index = indexes[length2];
            if (length2 == lastIndex || index !== previous) {
              var previous = index;
              if (isIndex(index)) {
                splice.call(array, index, 1);
              } else {
                baseUnset(array, index);
              }
            }
          }
          return array;
        }
        function baseRandom(lower, upper) {
          return lower + nativeFloor(nativeRandom() * (upper - lower + 1));
        }
        function baseRange(start, end, step, fromRight) {
          var index = -1, length2 = nativeMax(nativeCeil((end - start) / (step || 1)), 0), result2 = Array2(length2);
          while (length2--) {
            result2[fromRight ? length2 : ++index] = start;
            start += step;
          }
          return result2;
        }
        function baseRepeat(string, n) {
          var result2 = "";
          if (!string || n < 1 || n > MAX_SAFE_INTEGER) {
            return result2;
          }
          do {
            if (n % 2) {
              result2 += string;
            }
            n = nativeFloor(n / 2);
            if (n) {
              string += string;
            }
          } while (n);
          return result2;
        }
        function baseRest(func, start) {
          return setToString(overRest(func, start, identity), func + "");
        }
        function baseSample(collection) {
          return arraySample(values(collection));
        }
        function baseSampleSize(collection, n) {
          var array = values(collection);
          return shuffleSelf(array, baseClamp(n, 0, array.length));
        }
        function baseSet(object, path, value, customizer) {
          if (!isObject(object)) {
            return object;
          }
          path = castPath(path, object);
          var index = -1, length2 = path.length, lastIndex = length2 - 1, nested = object;
          while (nested != null && ++index < length2) {
            var key = toKey(path[index]), newValue = value;
            if (key === "__proto__" || key === "constructor" || key === "prototype") {
              return object;
            }
            if (index != lastIndex) {
              var objValue = nested[key];
              newValue = customizer ? customizer(objValue, key, nested) : undefined2;
              if (newValue === undefined2) {
                newValue = isObject(objValue) ? objValue : isIndex(path[index + 1]) ? [] : {};
              }
            }
            assignValue(nested, key, newValue);
            nested = nested[key];
          }
          return object;
        }
        var baseSetData = !metaMap ? identity : function(func, data) {
          metaMap.set(func, data);
          return func;
        };
        var baseSetToString = !defineProperty ? identity : function(func, string) {
          return defineProperty(func, "toString", {
            "configurable": true,
            "enumerable": false,
            "value": constant(string),
            "writable": true
          });
        };
        function baseShuffle(collection) {
          return shuffleSelf(values(collection));
        }
        function baseSlice(array, start, end) {
          var index = -1, length2 = array.length;
          if (start < 0) {
            start = -start > length2 ? 0 : length2 + start;
          }
          end = end > length2 ? length2 : end;
          if (end < 0) {
            end += length2;
          }
          length2 = start > end ? 0 : end - start >>> 0;
          start >>>= 0;
          var result2 = Array2(length2);
          while (++index < length2) {
            result2[index] = array[index + start];
          }
          return result2;
        }
        function baseSome(collection, predicate) {
          var result2;
          baseEach(collection, function(value, index, collection2) {
            result2 = predicate(value, index, collection2);
            return !result2;
          });
          return !!result2;
        }
        function baseSortedIndex(array, value, retHighest) {
          var low = 0, high = array == null ? low : array.length;
          if (typeof value == "number" && value === value && high <= HALF_MAX_ARRAY_LENGTH) {
            while (low < high) {
              var mid = low + high >>> 1, computed = array[mid];
              if (computed !== null && !isSymbol(computed) && (retHighest ? computed <= value : computed < value)) {
                low = mid + 1;
              } else {
                high = mid;
              }
            }
            return high;
          }
          return baseSortedIndexBy(array, value, identity, retHighest);
        }
        function baseSortedIndexBy(array, value, iteratee2, retHighest) {
          var low = 0, high = array == null ? 0 : array.length;
          if (high === 0) {
            return 0;
          }
          value = iteratee2(value);
          var valIsNaN = value !== value, valIsNull = value === null, valIsSymbol = isSymbol(value), valIsUndefined = value === undefined2;
          while (low < high) {
            var mid = nativeFloor((low + high) / 2), computed = iteratee2(array[mid]), othIsDefined = computed !== undefined2, othIsNull = computed === null, othIsReflexive = computed === computed, othIsSymbol = isSymbol(computed);
            if (valIsNaN) {
              var setLow = retHighest || othIsReflexive;
            } else if (valIsUndefined) {
              setLow = othIsReflexive && (retHighest || othIsDefined);
            } else if (valIsNull) {
              setLow = othIsReflexive && othIsDefined && (retHighest || !othIsNull);
            } else if (valIsSymbol) {
              setLow = othIsReflexive && othIsDefined && !othIsNull && (retHighest || !othIsSymbol);
            } else if (othIsNull || othIsSymbol) {
              setLow = false;
            } else {
              setLow = retHighest ? computed <= value : computed < value;
            }
            if (setLow) {
              low = mid + 1;
            } else {
              high = mid;
            }
          }
          return nativeMin(high, MAX_ARRAY_INDEX);
        }
        function baseSortedUniq(array, iteratee2) {
          var index = -1, length2 = array.length, resIndex = 0, result2 = [];
          while (++index < length2) {
            var value = array[index], computed = iteratee2 ? iteratee2(value) : value;
            if (!index || !eq(computed, seen)) {
              var seen = computed;
              result2[resIndex++] = value === 0 ? 0 : value;
            }
          }
          return result2;
        }
        function baseToNumber(value) {
          if (typeof value == "number") {
            return value;
          }
          if (isSymbol(value)) {
            return NAN;
          }
          return +value;
        }
        function baseToString(value) {
          if (typeof value == "string") {
            return value;
          }
          if (isArray(value)) {
            return arrayMap(value, baseToString) + "";
          }
          if (isSymbol(value)) {
            return symbolToString ? symbolToString.call(value) : "";
          }
          var result2 = value + "";
          return result2 == "0" && 1 / value == -INFINITY ? "-0" : result2;
        }
        function baseUniq(array, iteratee2, comparator) {
          var index = -1, includes2 = arrayIncludes, length2 = array.length, isCommon = true, result2 = [], seen = result2;
          if (comparator) {
            isCommon = false;
            includes2 = arrayIncludesWith;
          } else if (length2 >= LARGE_ARRAY_SIZE) {
            var set2 = iteratee2 ? null : createSet(array);
            if (set2) {
              return setToArray(set2);
            }
            isCommon = false;
            includes2 = cacheHas;
            seen = new SetCache();
          } else {
            seen = iteratee2 ? [] : result2;
          }
          outer:
            while (++index < length2) {
              var value = array[index], computed = iteratee2 ? iteratee2(value) : value;
              value = comparator || value !== 0 ? value : 0;
              if (isCommon && computed === computed) {
                var seenIndex = seen.length;
                while (seenIndex--) {
                  if (seen[seenIndex] === computed) {
                    continue outer;
                  }
                }
                if (iteratee2) {
                  seen.push(computed);
                }
                result2.push(value);
              } else if (!includes2(seen, computed, comparator)) {
                if (seen !== result2) {
                  seen.push(computed);
                }
                result2.push(value);
              }
            }
          return result2;
        }
        function baseUnset(object, path) {
          path = castPath(path, object);
          object = parent(object, path);
          return object == null || delete object[toKey(last(path))];
        }
        function baseUpdate(object, path, updater, customizer) {
          return baseSet(object, path, updater(baseGet(object, path)), customizer);
        }
        function baseWhile(array, predicate, isDrop, fromRight) {
          var length2 = array.length, index = fromRight ? length2 : -1;
          while ((fromRight ? index-- : ++index < length2) && predicate(array[index], index, array)) {
          }
          return isDrop ? baseSlice(array, fromRight ? 0 : index, fromRight ? index + 1 : length2) : baseSlice(array, fromRight ? index + 1 : 0, fromRight ? length2 : index);
        }
        function baseWrapperValue(value, actions) {
          var result2 = value;
          if (result2 instanceof LazyWrapper) {
            result2 = result2.value();
          }
          return arrayReduce(actions, function(result3, action) {
            return action.func.apply(action.thisArg, arrayPush([result3], action.args));
          }, result2);
        }
        function baseXor(arrays, iteratee2, comparator) {
          var length2 = arrays.length;
          if (length2 < 2) {
            return length2 ? baseUniq(arrays[0]) : [];
          }
          var index = -1, result2 = Array2(length2);
          while (++index < length2) {
            var array = arrays[index], othIndex = -1;
            while (++othIndex < length2) {
              if (othIndex != index) {
                result2[index] = baseDifference(result2[index] || array, arrays[othIndex], iteratee2, comparator);
              }
            }
          }
          return baseUniq(baseFlatten(result2, 1), iteratee2, comparator);
        }
        function baseZipObject(props, values2, assignFunc) {
          var index = -1, length2 = props.length, valsLength = values2.length, result2 = {};
          while (++index < length2) {
            var value = index < valsLength ? values2[index] : undefined2;
            assignFunc(result2, props[index], value);
          }
          return result2;
        }
        function castArrayLikeObject(value) {
          return isArrayLikeObject(value) ? value : [];
        }
        function castFunction(value) {
          return typeof value == "function" ? value : identity;
        }
        function castPath(value, object) {
          if (isArray(value)) {
            return value;
          }
          return isKey(value, object) ? [value] : stringToPath(toString(value));
        }
        var castRest = baseRest;
        function castSlice(array, start, end) {
          var length2 = array.length;
          end = end === undefined2 ? length2 : end;
          return !start && end >= length2 ? array : baseSlice(array, start, end);
        }
        var clearTimeout2 = ctxClearTimeout || function(id) {
          return root.clearTimeout(id);
        };
        function cloneBuffer(buffer, isDeep) {
          if (isDeep) {
            return buffer.slice();
          }
          var length2 = buffer.length, result2 = allocUnsafe ? allocUnsafe(length2) : new buffer.constructor(length2);
          buffer.copy(result2);
          return result2;
        }
        function cloneArrayBuffer(arrayBuffer) {
          var result2 = new arrayBuffer.constructor(arrayBuffer.byteLength);
          new Uint8Array2(result2).set(new Uint8Array2(arrayBuffer));
          return result2;
        }
        function cloneDataView(dataView, isDeep) {
          var buffer = isDeep ? cloneArrayBuffer(dataView.buffer) : dataView.buffer;
          return new dataView.constructor(buffer, dataView.byteOffset, dataView.byteLength);
        }
        function cloneRegExp(regexp) {
          var result2 = new regexp.constructor(regexp.source, reFlags.exec(regexp));
          result2.lastIndex = regexp.lastIndex;
          return result2;
        }
        function cloneSymbol(symbol) {
          return symbolValueOf ? Object2(symbolValueOf.call(symbol)) : {};
        }
        function cloneTypedArray(typedArray, isDeep) {
          var buffer = isDeep ? cloneArrayBuffer(typedArray.buffer) : typedArray.buffer;
          return new typedArray.constructor(buffer, typedArray.byteOffset, typedArray.length);
        }
        function compareAscending(value, other) {
          if (value !== other) {
            var valIsDefined = value !== undefined2, valIsNull = value === null, valIsReflexive = value === value, valIsSymbol = isSymbol(value);
            var othIsDefined = other !== undefined2, othIsNull = other === null, othIsReflexive = other === other, othIsSymbol = isSymbol(other);
            if (!othIsNull && !othIsSymbol && !valIsSymbol && value > other || valIsSymbol && othIsDefined && othIsReflexive && !othIsNull && !othIsSymbol || valIsNull && othIsDefined && othIsReflexive || !valIsDefined && othIsReflexive || !valIsReflexive) {
              return 1;
            }
            if (!valIsNull && !valIsSymbol && !othIsSymbol && value < other || othIsSymbol && valIsDefined && valIsReflexive && !valIsNull && !valIsSymbol || othIsNull && valIsDefined && valIsReflexive || !othIsDefined && valIsReflexive || !othIsReflexive) {
              return -1;
            }
          }
          return 0;
        }
        function compareMultiple(object, other, orders) {
          var index = -1, objCriteria = object.criteria, othCriteria = other.criteria, length2 = objCriteria.length, ordersLength = orders.length;
          while (++index < length2) {
            var result2 = compareAscending(objCriteria[index], othCriteria[index]);
            if (result2) {
              if (index >= ordersLength) {
                return result2;
              }
              var order = orders[index];
              return result2 * (order == "desc" ? -1 : 1);
            }
          }
          return object.index - other.index;
        }
        function composeArgs(args, partials, holders, isCurried) {
          var argsIndex = -1, argsLength = args.length, holdersLength = holders.length, leftIndex = -1, leftLength = partials.length, rangeLength = nativeMax(argsLength - holdersLength, 0), result2 = Array2(leftLength + rangeLength), isUncurried = !isCurried;
          while (++leftIndex < leftLength) {
            result2[leftIndex] = partials[leftIndex];
          }
          while (++argsIndex < holdersLength) {
            if (isUncurried || argsIndex < argsLength) {
              result2[holders[argsIndex]] = args[argsIndex];
            }
          }
          while (rangeLength--) {
            result2[leftIndex++] = args[argsIndex++];
          }
          return result2;
        }
        function composeArgsRight(args, partials, holders, isCurried) {
          var argsIndex = -1, argsLength = args.length, holdersIndex = -1, holdersLength = holders.length, rightIndex = -1, rightLength = partials.length, rangeLength = nativeMax(argsLength - holdersLength, 0), result2 = Array2(rangeLength + rightLength), isUncurried = !isCurried;
          while (++argsIndex < rangeLength) {
            result2[argsIndex] = args[argsIndex];
          }
          var offset = argsIndex;
          while (++rightIndex < rightLength) {
            result2[offset + rightIndex] = partials[rightIndex];
          }
          while (++holdersIndex < holdersLength) {
            if (isUncurried || argsIndex < argsLength) {
              result2[offset + holders[holdersIndex]] = args[argsIndex++];
            }
          }
          return result2;
        }
        function copyArray(source, array) {
          var index = -1, length2 = source.length;
          array || (array = Array2(length2));
          while (++index < length2) {
            array[index] = source[index];
          }
          return array;
        }
        function copyObject(source, props, object, customizer) {
          var isNew = !object;
          object || (object = {});
          var index = -1, length2 = props.length;
          while (++index < length2) {
            var key = props[index];
            var newValue = customizer ? customizer(object[key], source[key], key, object, source) : undefined2;
            if (newValue === undefined2) {
              newValue = source[key];
            }
            if (isNew) {
              baseAssignValue(object, key, newValue);
            } else {
              assignValue(object, key, newValue);
            }
          }
          return object;
        }
        function copySymbols(source, object) {
          return copyObject(source, getSymbols(source), object);
        }
        function copySymbolsIn(source, object) {
          return copyObject(source, getSymbolsIn(source), object);
        }
        function createAggregator(setter, initializer) {
          return function(collection, iteratee2) {
            var func = isArray(collection) ? arrayAggregator : baseAggregator, accumulator = initializer ? initializer() : {};
            return func(collection, setter, getIteratee(iteratee2, 2), accumulator);
          };
        }
        function createAssigner(assigner) {
          return baseRest(function(object, sources) {
            var index = -1, length2 = sources.length, customizer = length2 > 1 ? sources[length2 - 1] : undefined2, guard = length2 > 2 ? sources[2] : undefined2;
            customizer = assigner.length > 3 && typeof customizer == "function" ? (length2--, customizer) : undefined2;
            if (guard && isIterateeCall(sources[0], sources[1], guard)) {
              customizer = length2 < 3 ? undefined2 : customizer;
              length2 = 1;
            }
            object = Object2(object);
            while (++index < length2) {
              var source = sources[index];
              if (source) {
                assigner(object, source, index, customizer);
              }
            }
            return object;
          });
        }
        function createBaseEach(eachFunc, fromRight) {
          return function(collection, iteratee2) {
            if (collection == null) {
              return collection;
            }
            if (!isArrayLike(collection)) {
              return eachFunc(collection, iteratee2);
            }
            var length2 = collection.length, index = fromRight ? length2 : -1, iterable = Object2(collection);
            while (fromRight ? index-- : ++index < length2) {
              if (iteratee2(iterable[index], index, iterable) === false) {
                break;
              }
            }
            return collection;
          };
        }
        function createBaseFor(fromRight) {
          return function(object, iteratee2, keysFunc) {
            var index = -1, iterable = Object2(object), props = keysFunc(object), length2 = props.length;
            while (length2--) {
              var key = props[fromRight ? length2 : ++index];
              if (iteratee2(iterable[key], key, iterable) === false) {
                break;
              }
            }
            return object;
          };
        }
        function createBind(func, bitmask, thisArg) {
          var isBind = bitmask & WRAP_BIND_FLAG, Ctor = createCtor(func);
          function wrapper() {
            var fn = this && this !== root && this instanceof wrapper ? Ctor : func;
            return fn.apply(isBind ? thisArg : this, arguments);
          }
          return wrapper;
        }
        function createCaseFirst(methodName) {
          return function(string) {
            string = toString(string);
            var strSymbols = hasUnicode(string) ? stringToArray(string) : undefined2;
            var chr = strSymbols ? strSymbols[0] : string.charAt(0);
            var trailing = strSymbols ? castSlice(strSymbols, 1).join("") : string.slice(1);
            return chr[methodName]() + trailing;
          };
        }
        function createCompounder(callback) {
          return function(string) {
            return arrayReduce(words(deburr(string).replace(reApos, "")), callback, "");
          };
        }
        function createCtor(Ctor) {
          return function() {
            var args = arguments;
            switch (args.length) {
              case 0:
                return new Ctor();
              case 1:
                return new Ctor(args[0]);
              case 2:
                return new Ctor(args[0], args[1]);
              case 3:
                return new Ctor(args[0], args[1], args[2]);
              case 4:
                return new Ctor(args[0], args[1], args[2], args[3]);
              case 5:
                return new Ctor(args[0], args[1], args[2], args[3], args[4]);
              case 6:
                return new Ctor(args[0], args[1], args[2], args[3], args[4], args[5]);
              case 7:
                return new Ctor(args[0], args[1], args[2], args[3], args[4], args[5], args[6]);
            }
            var thisBinding = baseCreate(Ctor.prototype), result2 = Ctor.apply(thisBinding, args);
            return isObject(result2) ? result2 : thisBinding;
          };
        }
        function createCurry(func, bitmask, arity) {
          var Ctor = createCtor(func);
          function wrapper() {
            var length2 = arguments.length, args = Array2(length2), index = length2, placeholder = getHolder(wrapper);
            while (index--) {
              args[index] = arguments[index];
            }
            var holders = length2 < 3 && args[0] !== placeholder && args[length2 - 1] !== placeholder ? [] : replaceHolders(args, placeholder);
            length2 -= holders.length;
            if (length2 < arity) {
              return createRecurry(
                func,
                bitmask,
                createHybrid,
                wrapper.placeholder,
                undefined2,
                args,
                holders,
                undefined2,
                undefined2,
                arity - length2
              );
            }
            var fn = this && this !== root && this instanceof wrapper ? Ctor : func;
            return apply(fn, this, args);
          }
          return wrapper;
        }
        function createFind(findIndexFunc) {
          return function(collection, predicate, fromIndex) {
            var iterable = Object2(collection);
            if (!isArrayLike(collection)) {
              var iteratee2 = getIteratee(predicate, 3);
              collection = keys(collection);
              predicate = function(key) {
                return iteratee2(iterable[key], key, iterable);
              };
            }
            var index = findIndexFunc(collection, predicate, fromIndex);
            return index > -1 ? iterable[iteratee2 ? collection[index] : index] : undefined2;
          };
        }
        function createFlow(fromRight) {
          return flatRest(function(funcs) {
            var length2 = funcs.length, index = length2, prereq = LodashWrapper.prototype.thru;
            if (fromRight) {
              funcs.reverse();
            }
            while (index--) {
              var func = funcs[index];
              if (typeof func != "function") {
                throw new TypeError(FUNC_ERROR_TEXT);
              }
              if (prereq && !wrapper && getFuncName(func) == "wrapper") {
                var wrapper = new LodashWrapper([], true);
              }
            }
            index = wrapper ? index : length2;
            while (++index < length2) {
              func = funcs[index];
              var funcName = getFuncName(func), data = funcName == "wrapper" ? getData(func) : undefined2;
              if (data && isLaziable(data[0]) && data[1] == (WRAP_ARY_FLAG | WRAP_CURRY_FLAG | WRAP_PARTIAL_FLAG | WRAP_REARG_FLAG) && !data[4].length && data[9] == 1) {
                wrapper = wrapper[getFuncName(data[0])].apply(wrapper, data[3]);
              } else {
                wrapper = func.length == 1 && isLaziable(func) ? wrapper[funcName]() : wrapper.thru(func);
              }
            }
            return function() {
              var args = arguments, value = args[0];
              if (wrapper && args.length == 1 && isArray(value)) {
                return wrapper.plant(value).value();
              }
              var index2 = 0, result2 = length2 ? funcs[index2].apply(this, args) : value;
              while (++index2 < length2) {
                result2 = funcs[index2].call(this, result2);
              }
              return result2;
            };
          });
        }
        function createHybrid(func, bitmask, thisArg, partials, holders, partialsRight, holdersRight, argPos, ary2, arity) {
          var isAry = bitmask & WRAP_ARY_FLAG, isBind = bitmask & WRAP_BIND_FLAG, isBindKey = bitmask & WRAP_BIND_KEY_FLAG, isCurried = bitmask & (WRAP_CURRY_FLAG | WRAP_CURRY_RIGHT_FLAG), isFlip = bitmask & WRAP_FLIP_FLAG, Ctor = isBindKey ? undefined2 : createCtor(func);
          function wrapper() {
            var length2 = arguments.length, args = Array2(length2), index = length2;
            while (index--) {
              args[index] = arguments[index];
            }
            if (isCurried) {
              var placeholder = getHolder(wrapper), holdersCount = countHolders(args, placeholder);
            }
            if (partials) {
              args = composeArgs(args, partials, holders, isCurried);
            }
            if (partialsRight) {
              args = composeArgsRight(args, partialsRight, holdersRight, isCurried);
            }
            length2 -= holdersCount;
            if (isCurried && length2 < arity) {
              var newHolders = replaceHolders(args, placeholder);
              return createRecurry(
                func,
                bitmask,
                createHybrid,
                wrapper.placeholder,
                thisArg,
                args,
                newHolders,
                argPos,
                ary2,
                arity - length2
              );
            }
            var thisBinding = isBind ? thisArg : this, fn = isBindKey ? thisBinding[func] : func;
            length2 = args.length;
            if (argPos) {
              args = reorder(args, argPos);
            } else if (isFlip && length2 > 1) {
              args.reverse();
            }
            if (isAry && ary2 < length2) {
              args.length = ary2;
            }
            if (this && this !== root && this instanceof wrapper) {
              fn = Ctor || createCtor(fn);
            }
            return fn.apply(thisBinding, args);
          }
          return wrapper;
        }
        function createInverter(setter, toIteratee) {
          return function(object, iteratee2) {
            return baseInverter(object, setter, toIteratee(iteratee2), {});
          };
        }
        function createMathOperation(operator, defaultValue) {
          return function(value, other) {
            var result2;
            if (value === undefined2 && other === undefined2) {
              return defaultValue;
            }
            if (value !== undefined2) {
              result2 = value;
            }
            if (other !== undefined2) {
              if (result2 === undefined2) {
                return other;
              }
              if (typeof value == "string" || typeof other == "string") {
                value = baseToString(value);
                other = baseToString(other);
              } else {
                value = baseToNumber(value);
                other = baseToNumber(other);
              }
              result2 = operator(value, other);
            }
            return result2;
          };
        }
        function createOver(arrayFunc) {
          return flatRest(function(iteratees) {
            iteratees = arrayMap(iteratees, baseUnary(getIteratee()));
            return baseRest(function(args) {
              var thisArg = this;
              return arrayFunc(iteratees, function(iteratee2) {
                return apply(iteratee2, thisArg, args);
              });
            });
          });
        }
        function createPadding(length2, chars) {
          chars = chars === undefined2 ? " " : baseToString(chars);
          var charsLength = chars.length;
          if (charsLength < 2) {
            return charsLength ? baseRepeat(chars, length2) : chars;
          }
          var result2 = baseRepeat(chars, nativeCeil(length2 / stringSize(chars)));
          return hasUnicode(chars) ? castSlice(stringToArray(result2), 0, length2).join("") : result2.slice(0, length2);
        }
        function createPartial(func, bitmask, thisArg, partials) {
          var isBind = bitmask & WRAP_BIND_FLAG, Ctor = createCtor(func);
          function wrapper() {
            var argsIndex = -1, argsLength = arguments.length, leftIndex = -1, leftLength = partials.length, args = Array2(leftLength + argsLength), fn = this && this !== root && this instanceof wrapper ? Ctor : func;
            while (++leftIndex < leftLength) {
              args[leftIndex] = partials[leftIndex];
            }
            while (argsLength--) {
              args[leftIndex++] = arguments[++argsIndex];
            }
            return apply(fn, isBind ? thisArg : this, args);
          }
          return wrapper;
        }
        function createRange(fromRight) {
          return function(start, end, step) {
            if (step && typeof step != "number" && isIterateeCall(start, end, step)) {
              end = step = undefined2;
            }
            start = toFinite(start);
            if (end === undefined2) {
              end = start;
              start = 0;
            } else {
              end = toFinite(end);
            }
            step = step === undefined2 ? start < end ? 1 : -1 : toFinite(step);
            return baseRange(start, end, step, fromRight);
          };
        }
        function createRelationalOperation(operator) {
          return function(value, other) {
            if (!(typeof value == "string" && typeof other == "string")) {
              value = toNumber(value);
              other = toNumber(other);
            }
            return operator(value, other);
          };
        }
        function createRecurry(func, bitmask, wrapFunc, placeholder, thisArg, partials, holders, argPos, ary2, arity) {
          var isCurry = bitmask & WRAP_CURRY_FLAG, newHolders = isCurry ? holders : undefined2, newHoldersRight = isCurry ? undefined2 : holders, newPartials = isCurry ? partials : undefined2, newPartialsRight = isCurry ? undefined2 : partials;
          bitmask |= isCurry ? WRAP_PARTIAL_FLAG : WRAP_PARTIAL_RIGHT_FLAG;
          bitmask &= ~(isCurry ? WRAP_PARTIAL_RIGHT_FLAG : WRAP_PARTIAL_FLAG);
          if (!(bitmask & WRAP_CURRY_BOUND_FLAG)) {
            bitmask &= ~(WRAP_BIND_FLAG | WRAP_BIND_KEY_FLAG);
          }
          var newData = [
            func,
            bitmask,
            thisArg,
            newPartials,
            newHolders,
            newPartialsRight,
            newHoldersRight,
            argPos,
            ary2,
            arity
          ];
          var result2 = wrapFunc.apply(undefined2, newData);
          if (isLaziable(func)) {
            setData(result2, newData);
          }
          result2.placeholder = placeholder;
          return setWrapToString(result2, func, bitmask);
        }
        function createRound(methodName) {
          var func = Math2[methodName];
          return function(number, precision) {
            number = toNumber(number);
            precision = precision == null ? 0 : nativeMin(toInteger(precision), 292);
            if (precision && nativeIsFinite(number)) {
              var pair = (toString(number) + "e").split("e"), value = func(pair[0] + "e" + (+pair[1] + precision));
              pair = (toString(value) + "e").split("e");
              return +(pair[0] + "e" + (+pair[1] - precision));
            }
            return func(number);
          };
        }
        var createSet = !(Set2 && 1 / setToArray(new Set2([, -0]))[1] == INFINITY) ? noop : function(values2) {
          return new Set2(values2);
        };
        function createToPairs(keysFunc) {
          return function(object) {
            var tag = getTag(object);
            if (tag == mapTag) {
              return mapToArray(object);
            }
            if (tag == setTag) {
              return setToPairs(object);
            }
            return baseToPairs(object, keysFunc(object));
          };
        }
        function createWrap(func, bitmask, thisArg, partials, holders, argPos, ary2, arity) {
          var isBindKey = bitmask & WRAP_BIND_KEY_FLAG;
          if (!isBindKey && typeof func != "function") {
            throw new TypeError(FUNC_ERROR_TEXT);
          }
          var length2 = partials ? partials.length : 0;
          if (!length2) {
            bitmask &= ~(WRAP_PARTIAL_FLAG | WRAP_PARTIAL_RIGHT_FLAG);
            partials = holders = undefined2;
          }
          ary2 = ary2 === undefined2 ? ary2 : nativeMax(toInteger(ary2), 0);
          arity = arity === undefined2 ? arity : toInteger(arity);
          length2 -= holders ? holders.length : 0;
          if (bitmask & WRAP_PARTIAL_RIGHT_FLAG) {
            var partialsRight = partials, holdersRight = holders;
            partials = holders = undefined2;
          }
          var data = isBindKey ? undefined2 : getData(func);
          var newData = [
            func,
            bitmask,
            thisArg,
            partials,
            holders,
            partialsRight,
            holdersRight,
            argPos,
            ary2,
            arity
          ];
          if (data) {
            mergeData(newData, data);
          }
          func = newData[0];
          bitmask = newData[1];
          thisArg = newData[2];
          partials = newData[3];
          holders = newData[4];
          arity = newData[9] = newData[9] === undefined2 ? isBindKey ? 0 : func.length : nativeMax(newData[9] - length2, 0);
          if (!arity && bitmask & (WRAP_CURRY_FLAG | WRAP_CURRY_RIGHT_FLAG)) {
            bitmask &= ~(WRAP_CURRY_FLAG | WRAP_CURRY_RIGHT_FLAG);
          }
          if (!bitmask || bitmask == WRAP_BIND_FLAG) {
            var result2 = createBind(func, bitmask, thisArg);
          } else if (bitmask == WRAP_CURRY_FLAG || bitmask == WRAP_CURRY_RIGHT_FLAG) {
            result2 = createCurry(func, bitmask, arity);
          } else if ((bitmask == WRAP_PARTIAL_FLAG || bitmask == (WRAP_BIND_FLAG | WRAP_PARTIAL_FLAG)) && !holders.length) {
            result2 = createPartial(func, bitmask, thisArg, partials);
          } else {
            result2 = createHybrid.apply(undefined2, newData);
          }
          var setter = data ? baseSetData : setData;
          return setWrapToString(setter(result2, newData), func, bitmask);
        }
        function customDefaultsAssignIn(objValue, srcValue, key, object) {
          if (objValue === undefined2 || eq(objValue, objectProto[key]) && !hasOwnProperty2.call(object, key)) {
            return srcValue;
          }
          return objValue;
        }
        function customDefaultsMerge(objValue, srcValue, key, object, source, stack) {
          if (isObject(objValue) && isObject(srcValue)) {
            stack.set(srcValue, objValue);
            baseMerge(objValue, srcValue, undefined2, customDefaultsMerge, stack);
            stack["delete"](srcValue);
          }
          return objValue;
        }
        function customOmitClone(value) {
          return isPlainObject(value) ? undefined2 : value;
        }
        function equalArrays(array, other, bitmask, customizer, equalFunc, stack) {
          var isPartial = bitmask & COMPARE_PARTIAL_FLAG, arrLength = array.length, othLength = other.length;
          if (arrLength != othLength && !(isPartial && othLength > arrLength)) {
            return false;
          }
          var arrStacked = stack.get(array);
          var othStacked = stack.get(other);
          if (arrStacked && othStacked) {
            return arrStacked == other && othStacked == array;
          }
          var index = -1, result2 = true, seen = bitmask & COMPARE_UNORDERED_FLAG ? new SetCache() : undefined2;
          stack.set(array, other);
          stack.set(other, array);
          while (++index < arrLength) {
            var arrValue = array[index], othValue = other[index];
            if (customizer) {
              var compared = isPartial ? customizer(othValue, arrValue, index, other, array, stack) : customizer(arrValue, othValue, index, array, other, stack);
            }
            if (compared !== undefined2) {
              if (compared) {
                continue;
              }
              result2 = false;
              break;
            }
            if (seen) {
              if (!arraySome(other, function(othValue2, othIndex) {
                if (!cacheHas(seen, othIndex) && (arrValue === othValue2 || equalFunc(arrValue, othValue2, bitmask, customizer, stack))) {
                  return seen.push(othIndex);
                }
              })) {
                result2 = false;
                break;
              }
            } else if (!(arrValue === othValue || equalFunc(arrValue, othValue, bitmask, customizer, stack))) {
              result2 = false;
              break;
            }
          }
          stack["delete"](array);
          stack["delete"](other);
          return result2;
        }
        function equalByTag(object, other, tag, bitmask, customizer, equalFunc, stack) {
          switch (tag) {
            case dataViewTag:
              if (object.byteLength != other.byteLength || object.byteOffset != other.byteOffset) {
                return false;
              }
              object = object.buffer;
              other = other.buffer;
            case arrayBufferTag:
              if (object.byteLength != other.byteLength || !equalFunc(new Uint8Array2(object), new Uint8Array2(other))) {
                return false;
              }
              return true;
            case boolTag:
            case dateTag:
            case numberTag:
              return eq(+object, +other);
            case errorTag:
              return object.name == other.name && object.message == other.message;
            case regexpTag:
            case stringTag:
              return object == other + "";
            case mapTag:
              var convert = mapToArray;
            case setTag:
              var isPartial = bitmask & COMPARE_PARTIAL_FLAG;
              convert || (convert = setToArray);
              if (object.size != other.size && !isPartial) {
                return false;
              }
              var stacked = stack.get(object);
              if (stacked) {
                return stacked == other;
              }
              bitmask |= COMPARE_UNORDERED_FLAG;
              stack.set(object, other);
              var result2 = equalArrays(convert(object), convert(other), bitmask, customizer, equalFunc, stack);
              stack["delete"](object);
              return result2;
            case symbolTag:
              if (symbolValueOf) {
                return symbolValueOf.call(object) == symbolValueOf.call(other);
              }
          }
          return false;
        }
        function equalObjects(object, other, bitmask, customizer, equalFunc, stack) {
          var isPartial = bitmask & COMPARE_PARTIAL_FLAG, objProps = getAllKeys(object), objLength = objProps.length, othProps = getAllKeys(other), othLength = othProps.length;
          if (objLength != othLength && !isPartial) {
            return false;
          }
          var index = objLength;
          while (index--) {
            var key = objProps[index];
            if (!(isPartial ? key in other : hasOwnProperty2.call(other, key))) {
              return false;
            }
          }
          var objStacked = stack.get(object);
          var othStacked = stack.get(other);
          if (objStacked && othStacked) {
            return objStacked == other && othStacked == object;
          }
          var result2 = true;
          stack.set(object, other);
          stack.set(other, object);
          var skipCtor = isPartial;
          while (++index < objLength) {
            key = objProps[index];
            var objValue = object[key], othValue = other[key];
            if (customizer) {
              var compared = isPartial ? customizer(othValue, objValue, key, other, object, stack) : customizer(objValue, othValue, key, object, other, stack);
            }
            if (!(compared === undefined2 ? objValue === othValue || equalFunc(objValue, othValue, bitmask, customizer, stack) : compared)) {
              result2 = false;
              break;
            }
            skipCtor || (skipCtor = key == "constructor");
          }
          if (result2 && !skipCtor) {
            var objCtor = object.constructor, othCtor = other.constructor;
            if (objCtor != othCtor && ("constructor" in object && "constructor" in other) && !(typeof objCtor == "function" && objCtor instanceof objCtor && typeof othCtor == "function" && othCtor instanceof othCtor)) {
              result2 = false;
            }
          }
          stack["delete"](object);
          stack["delete"](other);
          return result2;
        }
        function flatRest(func) {
          return setToString(overRest(func, undefined2, flatten), func + "");
        }
        function getAllKeys(object) {
          return baseGetAllKeys(object, keys, getSymbols);
        }
        function getAllKeysIn(object) {
          return baseGetAllKeys(object, keysIn, getSymbolsIn);
        }
        var getData = !metaMap ? noop : function(func) {
          return metaMap.get(func);
        };
        function getFuncName(func) {
          var result2 = func.name + "", array = realNames[result2], length2 = hasOwnProperty2.call(realNames, result2) ? array.length : 0;
          while (length2--) {
            var data = array[length2], otherFunc = data.func;
            if (otherFunc == null || otherFunc == func) {
              return data.name;
            }
          }
          return result2;
        }
        function getHolder(func) {
          var object = hasOwnProperty2.call(lodash, "placeholder") ? lodash : func;
          return object.placeholder;
        }
        function getIteratee() {
          var result2 = lodash.iteratee || iteratee;
          result2 = result2 === iteratee ? baseIteratee : result2;
          return arguments.length ? result2(arguments[0], arguments[1]) : result2;
        }
        function getMapData(map2, key) {
          var data = map2.__data__;
          return isKeyable(key) ? data[typeof key == "string" ? "string" : "hash"] : data.map;
        }
        function getMatchData(object) {
          var result2 = keys(object), length2 = result2.length;
          while (length2--) {
            var key = result2[length2], value = object[key];
            result2[length2] = [key, value, isStrictComparable(value)];
          }
          return result2;
        }
        function getNative(object, key) {
          var value = getValue(object, key);
          return baseIsNative(value) ? value : undefined2;
        }
        function getRawTag(value) {
          var isOwn = hasOwnProperty2.call(value, symToStringTag), tag = value[symToStringTag];
          try {
            value[symToStringTag] = undefined2;
            var unmasked = true;
          } catch (e) {
          }
          var result2 = nativeObjectToString.call(value);
          if (unmasked) {
            if (isOwn) {
              value[symToStringTag] = tag;
            } else {
              delete value[symToStringTag];
            }
          }
          return result2;
        }
        var getSymbols = !nativeGetSymbols ? stubArray : function(object) {
          if (object == null) {
            return [];
          }
          object = Object2(object);
          return arrayFilter(nativeGetSymbols(object), function(symbol) {
            return propertyIsEnumerable.call(object, symbol);
          });
        };
        var getSymbolsIn = !nativeGetSymbols ? stubArray : function(object) {
          var result2 = [];
          while (object) {
            arrayPush(result2, getSymbols(object));
            object = getPrototype(object);
          }
          return result2;
        };
        var getTag = baseGetTag;
        if (DataView2 && getTag(new DataView2(new ArrayBuffer(1))) != dataViewTag || Map2 && getTag(new Map2()) != mapTag || Promise2 && getTag(Promise2.resolve()) != promiseTag || Set2 && getTag(new Set2()) != setTag || WeakMap && getTag(new WeakMap()) != weakMapTag) {
          getTag = function(value) {
            var result2 = baseGetTag(value), Ctor = result2 == objectTag ? value.constructor : undefined2, ctorString = Ctor ? toSource(Ctor) : "";
            if (ctorString) {
              switch (ctorString) {
                case dataViewCtorString:
                  return dataViewTag;
                case mapCtorString:
                  return mapTag;
                case promiseCtorString:
                  return promiseTag;
                case setCtorString:
                  return setTag;
                case weakMapCtorString:
                  return weakMapTag;
              }
            }
            return result2;
          };
        }
        function getView(start, end, transforms) {
          var index = -1, length2 = transforms.length;
          while (++index < length2) {
            var data = transforms[index], size2 = data.size;
            switch (data.type) {
              case "drop":
                start += size2;
                break;
              case "dropRight":
                end -= size2;
                break;
              case "take":
                end = nativeMin(end, start + size2);
                break;
              case "takeRight":
                start = nativeMax(start, end - size2);
                break;
            }
          }
          return { "start": start, "end": end };
        }
        function getWrapDetails(source) {
          var match2 = source.match(reWrapDetails);
          return match2 ? match2[1].split(reSplitDetails) : [];
        }
        function hasPath(object, path, hasFunc) {
          path = castPath(path, object);
          var index = -1, length2 = path.length, result2 = false;
          while (++index < length2) {
            var key = toKey(path[index]);
            if (!(result2 = object != null && hasFunc(object, key))) {
              break;
            }
            object = object[key];
          }
          if (result2 || ++index != length2) {
            return result2;
          }
          length2 = object == null ? 0 : object.length;
          return !!length2 && isLength(length2) && isIndex(key, length2) && (isArray(object) || isArguments(object));
        }
        function initCloneArray(array) {
          var length2 = array.length, result2 = new array.constructor(length2);
          if (length2 && typeof array[0] == "string" && hasOwnProperty2.call(array, "index")) {
            result2.index = array.index;
            result2.input = array.input;
          }
          return result2;
        }
        function initCloneObject(object) {
          return typeof object.constructor == "function" && !isPrototype(object) ? baseCreate(getPrototype(object)) : {};
        }
        function initCloneByTag(object, tag, isDeep) {
          var Ctor = object.constructor;
          switch (tag) {
            case arrayBufferTag:
              return cloneArrayBuffer(object);
            case boolTag:
            case dateTag:
              return new Ctor(+object);
            case dataViewTag:
              return cloneDataView(object, isDeep);
            case float32Tag:
            case float64Tag:
            case int8Tag:
            case int16Tag:
            case int32Tag:
            case uint8Tag:
            case uint8ClampedTag:
            case uint16Tag:
            case uint32Tag:
              return cloneTypedArray(object, isDeep);
            case mapTag:
              return new Ctor();
            case numberTag:
            case stringTag:
              return new Ctor(object);
            case regexpTag:
              return cloneRegExp(object);
            case setTag:
              return new Ctor();
            case symbolTag:
              return cloneSymbol(object);
          }
        }
        function insertWrapDetails(source, details) {
          var length2 = details.length;
          if (!length2) {
            return source;
          }
          var lastIndex = length2 - 1;
          details[lastIndex] = (length2 > 1 ? "& " : "") + details[lastIndex];
          details = details.join(length2 > 2 ? ", " : " ");
          return source.replace(reWrapComment, "{\n/* [wrapped with " + details + "] */\n");
        }
        function isFlattenable(value) {
          return isArray(value) || isArguments(value) || !!(spreadableSymbol && value && value[spreadableSymbol]);
        }
        function isIndex(value, length2) {
          var type = typeof value;
          length2 = length2 == null ? MAX_SAFE_INTEGER : length2;
          return !!length2 && (type == "number" || type != "symbol" && reIsUint.test(value)) && (value > -1 && value % 1 == 0 && value < length2);
        }
        function isIterateeCall(value, index, object) {
          if (!isObject(object)) {
            return false;
          }
          var type = typeof index;
          if (type == "number" ? isArrayLike(object) && isIndex(index, object.length) : type == "string" && index in object) {
            return eq(object[index], value);
          }
          return false;
        }
        function isKey(value, object) {
          if (isArray(value)) {
            return false;
          }
          var type = typeof value;
          if (type == "number" || type == "symbol" || type == "boolean" || value == null || isSymbol(value)) {
            return true;
          }
          return reIsPlainProp.test(value) || !reIsDeepProp.test(value) || object != null && value in Object2(object);
        }
        function isKeyable(value) {
          var type = typeof value;
          return type == "string" || type == "number" || type == "symbol" || type == "boolean" ? value !== "__proto__" : value === null;
        }
        function isLaziable(func) {
          var funcName = getFuncName(func), other = lodash[funcName];
          if (typeof other != "function" || !(funcName in LazyWrapper.prototype)) {
            return false;
          }
          if (func === other) {
            return true;
          }
          var data = getData(other);
          return !!data && func === data[0];
        }
        function isMasked(func) {
          return !!maskSrcKey && maskSrcKey in func;
        }
        var isMaskable = coreJsData ? isFunction : stubFalse;
        function isPrototype(value) {
          var Ctor = value && value.constructor, proto = typeof Ctor == "function" && Ctor.prototype || objectProto;
          return value === proto;
        }
        function isStrictComparable(value) {
          return value === value && !isObject(value);
        }
        function matchesStrictComparable(key, srcValue) {
          return function(object) {
            if (object == null) {
              return false;
            }
            return object[key] === srcValue && (srcValue !== undefined2 || key in Object2(object));
          };
        }
        function memoizeCapped(func) {
          var result2 = memoize(func, function(key) {
            if (cache.size === MAX_MEMOIZE_SIZE) {
              cache.clear();
            }
            return key;
          });
          var cache = result2.cache;
          return result2;
        }
        function mergeData(data, source) {
          var bitmask = data[1], srcBitmask = source[1], newBitmask = bitmask | srcBitmask, isCommon = newBitmask < (WRAP_BIND_FLAG | WRAP_BIND_KEY_FLAG | WRAP_ARY_FLAG);
          var isCombo = srcBitmask == WRAP_ARY_FLAG && bitmask == WRAP_CURRY_FLAG || srcBitmask == WRAP_ARY_FLAG && bitmask == WRAP_REARG_FLAG && data[7].length <= source[8] || srcBitmask == (WRAP_ARY_FLAG | WRAP_REARG_FLAG) && source[7].length <= source[8] && bitmask == WRAP_CURRY_FLAG;
          if (!(isCommon || isCombo)) {
            return data;
          }
          if (srcBitmask & WRAP_BIND_FLAG) {
            data[2] = source[2];
            newBitmask |= bitmask & WRAP_BIND_FLAG ? 0 : WRAP_CURRY_BOUND_FLAG;
          }
          var value = source[3];
          if (value) {
            var partials = data[3];
            data[3] = partials ? composeArgs(partials, value, source[4]) : value;
            data[4] = partials ? replaceHolders(data[3], PLACEHOLDER) : source[4];
          }
          value = source[5];
          if (value) {
            partials = data[5];
            data[5] = partials ? composeArgsRight(partials, value, source[6]) : value;
            data[6] = partials ? replaceHolders(data[5], PLACEHOLDER) : source[6];
          }
          value = source[7];
          if (value) {
            data[7] = value;
          }
          if (srcBitmask & WRAP_ARY_FLAG) {
            data[8] = data[8] == null ? source[8] : nativeMin(data[8], source[8]);
          }
          if (data[9] == null) {
            data[9] = source[9];
          }
          data[0] = source[0];
          data[1] = newBitmask;
          return data;
        }
        function nativeKeysIn(object) {
          var result2 = [];
          if (object != null) {
            for (var key in Object2(object)) {
              result2.push(key);
            }
          }
          return result2;
        }
        function objectToString(value) {
          return nativeObjectToString.call(value);
        }
        function overRest(func, start, transform2) {
          start = nativeMax(start === undefined2 ? func.length - 1 : start, 0);
          return function() {
            var args = arguments, index = -1, length2 = nativeMax(args.length - start, 0), array = Array2(length2);
            while (++index < length2) {
              array[index] = args[start + index];
            }
            index = -1;
            var otherArgs = Array2(start + 1);
            while (++index < start) {
              otherArgs[index] = args[index];
            }
            otherArgs[start] = transform2(array);
            return apply(func, this, otherArgs);
          };
        }
        function parent(object, path) {
          return path.length < 2 ? object : baseGet(object, baseSlice(path, 0, -1));
        }
        function reorder(array, indexes) {
          var arrLength = array.length, length2 = nativeMin(indexes.length, arrLength), oldArray = copyArray(array);
          while (length2--) {
            var index = indexes[length2];
            array[length2] = isIndex(index, arrLength) ? oldArray[index] : undefined2;
          }
          return array;
        }
        function safeGet(object, key) {
          if (key === "constructor" && typeof object[key] === "function") {
            return;
          }
          if (key == "__proto__") {
            return;
          }
          return object[key];
        }
        var setData = shortOut(baseSetData);
        var setTimeout2 = ctxSetTimeout || function(func, wait) {
          return root.setTimeout(func, wait);
        };
        var setToString = shortOut(baseSetToString);
        function setWrapToString(wrapper, reference, bitmask) {
          var source = reference + "";
          return setToString(wrapper, insertWrapDetails(source, updateWrapDetails(getWrapDetails(source), bitmask)));
        }
        function shortOut(func) {
          var count = 0, lastCalled = 0;
          return function() {
            var stamp = nativeNow(), remaining = HOT_SPAN - (stamp - lastCalled);
            lastCalled = stamp;
            if (remaining > 0) {
              if (++count >= HOT_COUNT) {
                return arguments[0];
              }
            } else {
              count = 0;
            }
            return func.apply(undefined2, arguments);
          };
        }
        function shuffleSelf(array, size2) {
          var index = -1, length2 = array.length, lastIndex = length2 - 1;
          size2 = size2 === undefined2 ? length2 : size2;
          while (++index < size2) {
            var rand = baseRandom(index, lastIndex), value = array[rand];
            array[rand] = array[index];
            array[index] = value;
          }
          array.length = size2;
          return array;
        }
        var stringToPath = memoizeCapped(function(string) {
          var result2 = [];
          if (string.charCodeAt(0) === 46) {
            result2.push("");
          }
          string.replace(rePropName, function(match2, number, quote, subString) {
            result2.push(quote ? subString.replace(reEscapeChar, "$1") : number || match2);
          });
          return result2;
        });
        function toKey(value) {
          if (typeof value == "string" || isSymbol(value)) {
            return value;
          }
          var result2 = value + "";
          return result2 == "0" && 1 / value == -INFINITY ? "-0" : result2;
        }
        function toSource(func) {
          if (func != null) {
            try {
              return funcToString.call(func);
            } catch (e) {
            }
            try {
              return func + "";
            } catch (e) {
            }
          }
          return "";
        }
        function updateWrapDetails(details, bitmask) {
          arrayEach(wrapFlags, function(pair) {
            var value = "_." + pair[0];
            if (bitmask & pair[1] && !arrayIncludes(details, value)) {
              details.push(value);
            }
          });
          return details.sort();
        }
        function wrapperClone(wrapper) {
          if (wrapper instanceof LazyWrapper) {
            return wrapper.clone();
          }
          var result2 = new LodashWrapper(wrapper.__wrapped__, wrapper.__chain__);
          result2.__actions__ = copyArray(wrapper.__actions__);
          result2.__index__ = wrapper.__index__;
          result2.__values__ = wrapper.__values__;
          return result2;
        }
        function chunk(array, size2, guard) {
          if (guard ? isIterateeCall(array, size2, guard) : size2 === undefined2) {
            size2 = 1;
          } else {
            size2 = nativeMax(toInteger(size2), 0);
          }
          var length2 = array == null ? 0 : array.length;
          if (!length2 || size2 < 1) {
            return [];
          }
          var index = 0, resIndex = 0, result2 = Array2(nativeCeil(length2 / size2));
          while (index < length2) {
            result2[resIndex++] = baseSlice(array, index, index += size2);
          }
          return result2;
        }
        function compact(array) {
          var index = -1, length2 = array == null ? 0 : array.length, resIndex = 0, result2 = [];
          while (++index < length2) {
            var value = array[index];
            if (value) {
              result2[resIndex++] = value;
            }
          }
          return result2;
        }
        function concat() {
          var length2 = arguments.length;
          if (!length2) {
            return [];
          }
          var args = Array2(length2 - 1), array = arguments[0], index = length2;
          while (index--) {
            args[index - 1] = arguments[index];
          }
          return arrayPush(isArray(array) ? copyArray(array) : [array], baseFlatten(args, 1));
        }
        var difference = baseRest(function(array, values2) {
          return isArrayLikeObject(array) ? baseDifference(array, baseFlatten(values2, 1, isArrayLikeObject, true)) : [];
        });
        var differenceBy = baseRest(function(array, values2) {
          var iteratee2 = last(values2);
          if (isArrayLikeObject(iteratee2)) {
            iteratee2 = undefined2;
          }
          return isArrayLikeObject(array) ? baseDifference(array, baseFlatten(values2, 1, isArrayLikeObject, true), getIteratee(iteratee2, 2)) : [];
        });
        var differenceWith = baseRest(function(array, values2) {
          var comparator = last(values2);
          if (isArrayLikeObject(comparator)) {
            comparator = undefined2;
          }
          return isArrayLikeObject(array) ? baseDifference(array, baseFlatten(values2, 1, isArrayLikeObject, true), undefined2, comparator) : [];
        });
        function drop(array, n, guard) {
          var length2 = array == null ? 0 : array.length;
          if (!length2) {
            return [];
          }
          n = guard || n === undefined2 ? 1 : toInteger(n);
          return baseSlice(array, n < 0 ? 0 : n, length2);
        }
        function dropRight(array, n, guard) {
          var length2 = array == null ? 0 : array.length;
          if (!length2) {
            return [];
          }
          n = guard || n === undefined2 ? 1 : toInteger(n);
          n = length2 - n;
          return baseSlice(array, 0, n < 0 ? 0 : n);
        }
        function dropRightWhile(array, predicate) {
          return array && array.length ? baseWhile(array, getIteratee(predicate, 3), true, true) : [];
        }
        function dropWhile(array, predicate) {
          return array && array.length ? baseWhile(array, getIteratee(predicate, 3), true) : [];
        }
        function fill(array, value, start, end) {
          var length2 = array == null ? 0 : array.length;
          if (!length2) {
            return [];
          }
          if (start && typeof start != "number" && isIterateeCall(array, value, start)) {
            start = 0;
            end = length2;
          }
          return baseFill(array, value, start, end);
        }
        function findIndex(array, predicate, fromIndex) {
          var length2 = array == null ? 0 : array.length;
          if (!length2) {
            return -1;
          }
          var index = fromIndex == null ? 0 : toInteger(fromIndex);
          if (index < 0) {
            index = nativeMax(length2 + index, 0);
          }
          return baseFindIndex(array, getIteratee(predicate, 3), index);
        }
        function findLastIndex(array, predicate, fromIndex) {
          var length2 = array == null ? 0 : array.length;
          if (!length2) {
            return -1;
          }
          var index = length2 - 1;
          if (fromIndex !== undefined2) {
            index = toInteger(fromIndex);
            index = fromIndex < 0 ? nativeMax(length2 + index, 0) : nativeMin(index, length2 - 1);
          }
          return baseFindIndex(array, getIteratee(predicate, 3), index, true);
        }
        function flatten(array) {
          var length2 = array == null ? 0 : array.length;
          return length2 ? baseFlatten(array, 1) : [];
        }
        function flattenDeep(array) {
          var length2 = array == null ? 0 : array.length;
          return length2 ? baseFlatten(array, INFINITY) : [];
        }
        function flattenDepth(array, depth) {
          var length2 = array == null ? 0 : array.length;
          if (!length2) {
            return [];
          }
          depth = depth === undefined2 ? 1 : toInteger(depth);
          return baseFlatten(array, depth);
        }
        function fromPairs(pairs) {
          var index = -1, length2 = pairs == null ? 0 : pairs.length, result2 = {};
          while (++index < length2) {
            var pair = pairs[index];
            result2[pair[0]] = pair[1];
          }
          return result2;
        }
        function head(array) {
          return array && array.length ? array[0] : undefined2;
        }
        function indexOf(array, value, fromIndex) {
          var length2 = array == null ? 0 : array.length;
          if (!length2) {
            return -1;
          }
          var index = fromIndex == null ? 0 : toInteger(fromIndex);
          if (index < 0) {
            index = nativeMax(length2 + index, 0);
          }
          return baseIndexOf(array, value, index);
        }
        function initial(array) {
          var length2 = array == null ? 0 : array.length;
          return length2 ? baseSlice(array, 0, -1) : [];
        }
        var intersection = baseRest(function(arrays) {
          var mapped = arrayMap(arrays, castArrayLikeObject);
          return mapped.length && mapped[0] === arrays[0] ? baseIntersection(mapped) : [];
        });
        var intersectionBy = baseRest(function(arrays) {
          var iteratee2 = last(arrays), mapped = arrayMap(arrays, castArrayLikeObject);
          if (iteratee2 === last(mapped)) {
            iteratee2 = undefined2;
          } else {
            mapped.pop();
          }
          return mapped.length && mapped[0] === arrays[0] ? baseIntersection(mapped, getIteratee(iteratee2, 2)) : [];
        });
        var intersectionWith = baseRest(function(arrays) {
          var comparator = last(arrays), mapped = arrayMap(arrays, castArrayLikeObject);
          comparator = typeof comparator == "function" ? comparator : undefined2;
          if (comparator) {
            mapped.pop();
          }
          return mapped.length && mapped[0] === arrays[0] ? baseIntersection(mapped, undefined2, comparator) : [];
        });
        function join(array, separator) {
          return array == null ? "" : nativeJoin.call(array, separator);
        }
        function last(array) {
          var length2 = array == null ? 0 : array.length;
          return length2 ? array[length2 - 1] : undefined2;
        }
        function lastIndexOf(array, value, fromIndex) {
          var length2 = array == null ? 0 : array.length;
          if (!length2) {
            return -1;
          }
          var index = length2;
          if (fromIndex !== undefined2) {
            index = toInteger(fromIndex);
            index = index < 0 ? nativeMax(length2 + index, 0) : nativeMin(index, length2 - 1);
          }
          return value === value ? strictLastIndexOf(array, value, index) : baseFindIndex(array, baseIsNaN, index, true);
        }
        function nth(array, n) {
          return array && array.length ? baseNth(array, toInteger(n)) : undefined2;
        }
        var pull = baseRest(pullAll);
        function pullAll(array, values2) {
          return array && array.length && values2 && values2.length ? basePullAll(array, values2) : array;
        }
        function pullAllBy(array, values2, iteratee2) {
          return array && array.length && values2 && values2.length ? basePullAll(array, values2, getIteratee(iteratee2, 2)) : array;
        }
        function pullAllWith(array, values2, comparator) {
          return array && array.length && values2 && values2.length ? basePullAll(array, values2, undefined2, comparator) : array;
        }
        var pullAt = flatRest(function(array, indexes) {
          var length2 = array == null ? 0 : array.length, result2 = baseAt(array, indexes);
          basePullAt(array, arrayMap(indexes, function(index) {
            return isIndex(index, length2) ? +index : index;
          }).sort(compareAscending));
          return result2;
        });
        function remove(array, predicate) {
          var result2 = [];
          if (!(array && array.length)) {
            return result2;
          }
          var index = -1, indexes = [], length2 = array.length;
          predicate = getIteratee(predicate, 3);
          while (++index < length2) {
            var value = array[index];
            if (predicate(value, index, array)) {
              result2.push(value);
              indexes.push(index);
            }
          }
          basePullAt(array, indexes);
          return result2;
        }
        function reverse(array) {
          return array == null ? array : nativeReverse.call(array);
        }
        function slice2(array, start, end) {
          var length2 = array == null ? 0 : array.length;
          if (!length2) {
            return [];
          }
          if (end && typeof end != "number" && isIterateeCall(array, start, end)) {
            start = 0;
            end = length2;
          } else {
            start = start == null ? 0 : toInteger(start);
            end = end === undefined2 ? length2 : toInteger(end);
          }
          return baseSlice(array, start, end);
        }
        function sortedIndex(array, value) {
          return baseSortedIndex(array, value);
        }
        function sortedIndexBy(array, value, iteratee2) {
          return baseSortedIndexBy(array, value, getIteratee(iteratee2, 2));
        }
        function sortedIndexOf(array, value) {
          var length2 = array == null ? 0 : array.length;
          if (length2) {
            var index = baseSortedIndex(array, value);
            if (index < length2 && eq(array[index], value)) {
              return index;
            }
          }
          return -1;
        }
        function sortedLastIndex(array, value) {
          return baseSortedIndex(array, value, true);
        }
        function sortedLastIndexBy(array, value, iteratee2) {
          return baseSortedIndexBy(array, value, getIteratee(iteratee2, 2), true);
        }
        function sortedLastIndexOf(array, value) {
          var length2 = array == null ? 0 : array.length;
          if (length2) {
            var index = baseSortedIndex(array, value, true) - 1;
            if (eq(array[index], value)) {
              return index;
            }
          }
          return -1;
        }
        function sortedUniq(array) {
          return array && array.length ? baseSortedUniq(array) : [];
        }
        function sortedUniqBy(array, iteratee2) {
          return array && array.length ? baseSortedUniq(array, getIteratee(iteratee2, 2)) : [];
        }
        function tail(array) {
          var length2 = array == null ? 0 : array.length;
          return length2 ? baseSlice(array, 1, length2) : [];
        }
        function take(array, n, guard) {
          if (!(array && array.length)) {
            return [];
          }
          n = guard || n === undefined2 ? 1 : toInteger(n);
          return baseSlice(array, 0, n < 0 ? 0 : n);
        }
        function takeRight(array, n, guard) {
          var length2 = array == null ? 0 : array.length;
          if (!length2) {
            return [];
          }
          n = guard || n === undefined2 ? 1 : toInteger(n);
          n = length2 - n;
          return baseSlice(array, n < 0 ? 0 : n, length2);
        }
        function takeRightWhile(array, predicate) {
          return array && array.length ? baseWhile(array, getIteratee(predicate, 3), false, true) : [];
        }
        function takeWhile(array, predicate) {
          return array && array.length ? baseWhile(array, getIteratee(predicate, 3)) : [];
        }
        var union = baseRest(function(arrays) {
          return baseUniq(baseFlatten(arrays, 1, isArrayLikeObject, true));
        });
        var unionBy = baseRest(function(arrays) {
          var iteratee2 = last(arrays);
          if (isArrayLikeObject(iteratee2)) {
            iteratee2 = undefined2;
          }
          return baseUniq(baseFlatten(arrays, 1, isArrayLikeObject, true), getIteratee(iteratee2, 2));
        });
        var unionWith = baseRest(function(arrays) {
          var comparator = last(arrays);
          comparator = typeof comparator == "function" ? comparator : undefined2;
          return baseUniq(baseFlatten(arrays, 1, isArrayLikeObject, true), undefined2, comparator);
        });
        function uniq(array) {
          return array && array.length ? baseUniq(array) : [];
        }
        function uniqBy(array, iteratee2) {
          return array && array.length ? baseUniq(array, getIteratee(iteratee2, 2)) : [];
        }
        function uniqWith(array, comparator) {
          comparator = typeof comparator == "function" ? comparator : undefined2;
          return array && array.length ? baseUniq(array, undefined2, comparator) : [];
        }
        function unzip(array) {
          if (!(array && array.length)) {
            return [];
          }
          var length2 = 0;
          array = arrayFilter(array, function(group) {
            if (isArrayLikeObject(group)) {
              length2 = nativeMax(group.length, length2);
              return true;
            }
          });
          return baseTimes(length2, function(index) {
            return arrayMap(array, baseProperty(index));
          });
        }
        function unzipWith(array, iteratee2) {
          if (!(array && array.length)) {
            return [];
          }
          var result2 = unzip(array);
          if (iteratee2 == null) {
            return result2;
          }
          return arrayMap(result2, function(group) {
            return apply(iteratee2, undefined2, group);
          });
        }
        var without = baseRest(function(array, values2) {
          return isArrayLikeObject(array) ? baseDifference(array, values2) : [];
        });
        var xor = baseRest(function(arrays) {
          return baseXor(arrayFilter(arrays, isArrayLikeObject));
        });
        var xorBy = baseRest(function(arrays) {
          var iteratee2 = last(arrays);
          if (isArrayLikeObject(iteratee2)) {
            iteratee2 = undefined2;
          }
          return baseXor(arrayFilter(arrays, isArrayLikeObject), getIteratee(iteratee2, 2));
        });
        var xorWith = baseRest(function(arrays) {
          var comparator = last(arrays);
          comparator = typeof comparator == "function" ? comparator : undefined2;
          return baseXor(arrayFilter(arrays, isArrayLikeObject), undefined2, comparator);
        });
        var zip = baseRest(unzip);
        function zipObject(props, values2) {
          return baseZipObject(props || [], values2 || [], assignValue);
        }
        function zipObjectDeep(props, values2) {
          return baseZipObject(props || [], values2 || [], baseSet);
        }
        var zipWith = baseRest(function(arrays) {
          var length2 = arrays.length, iteratee2 = length2 > 1 ? arrays[length2 - 1] : undefined2;
          iteratee2 = typeof iteratee2 == "function" ? (arrays.pop(), iteratee2) : undefined2;
          return unzipWith(arrays, iteratee2);
        });
        function chain(value) {
          var result2 = lodash(value);
          result2.__chain__ = true;
          return result2;
        }
        function tap(value, interceptor) {
          interceptor(value);
          return value;
        }
        function thru(value, interceptor) {
          return interceptor(value);
        }
        var wrapperAt = flatRest(function(paths) {
          var length2 = paths.length, start = length2 ? paths[0] : 0, value = this.__wrapped__, interceptor = function(object) {
            return baseAt(object, paths);
          };
          if (length2 > 1 || this.__actions__.length || !(value instanceof LazyWrapper) || !isIndex(start)) {
            return this.thru(interceptor);
          }
          value = value.slice(start, +start + (length2 ? 1 : 0));
          value.__actions__.push({
            "func": thru,
            "args": [interceptor],
            "thisArg": undefined2
          });
          return new LodashWrapper(value, this.__chain__).thru(function(array) {
            if (length2 && !array.length) {
              array.push(undefined2);
            }
            return array;
          });
        });
        function wrapperChain() {
          return chain(this);
        }
        function wrapperCommit() {
          return new LodashWrapper(this.value(), this.__chain__);
        }
        function wrapperNext() {
          if (this.__values__ === undefined2) {
            this.__values__ = toArray(this.value());
          }
          var done = this.__index__ >= this.__values__.length, value = done ? undefined2 : this.__values__[this.__index__++];
          return { "done": done, "value": value };
        }
        function wrapperToIterator() {
          return this;
        }
        function wrapperPlant(value) {
          var result2, parent2 = this;
          while (parent2 instanceof baseLodash) {
            var clone2 = wrapperClone(parent2);
            clone2.__index__ = 0;
            clone2.__values__ = undefined2;
            if (result2) {
              previous.__wrapped__ = clone2;
            } else {
              result2 = clone2;
            }
            var previous = clone2;
            parent2 = parent2.__wrapped__;
          }
          previous.__wrapped__ = value;
          return result2;
        }
        function wrapperReverse() {
          var value = this.__wrapped__;
          if (value instanceof LazyWrapper) {
            var wrapped = value;
            if (this.__actions__.length) {
              wrapped = new LazyWrapper(this);
            }
            wrapped = wrapped.reverse();
            wrapped.__actions__.push({
              "func": thru,
              "args": [reverse],
              "thisArg": undefined2
            });
            return new LodashWrapper(wrapped, this.__chain__);
          }
          return this.thru(reverse);
        }
        function wrapperValue() {
          return baseWrapperValue(this.__wrapped__, this.__actions__);
        }
        var countBy = createAggregator(function(result2, value, key) {
          if (hasOwnProperty2.call(result2, key)) {
            ++result2[key];
          } else {
            baseAssignValue(result2, key, 1);
          }
        });
        function every(collection, predicate, guard) {
          var func = isArray(collection) ? arrayEvery : baseEvery;
          if (guard && isIterateeCall(collection, predicate, guard)) {
            predicate = undefined2;
          }
          return func(collection, getIteratee(predicate, 3));
        }
        function filter2(collection, predicate) {
          var func = isArray(collection) ? arrayFilter : baseFilter;
          return func(collection, getIteratee(predicate, 3));
        }
        var find = createFind(findIndex);
        var findLast = createFind(findLastIndex);
        function flatMap(collection, iteratee2) {
          return baseFlatten(map(collection, iteratee2), 1);
        }
        function flatMapDeep(collection, iteratee2) {
          return baseFlatten(map(collection, iteratee2), INFINITY);
        }
        function flatMapDepth(collection, iteratee2, depth) {
          depth = depth === undefined2 ? 1 : toInteger(depth);
          return baseFlatten(map(collection, iteratee2), depth);
        }
        function forEach(collection, iteratee2) {
          var func = isArray(collection) ? arrayEach : baseEach;
          return func(collection, getIteratee(iteratee2, 3));
        }
        function forEachRight(collection, iteratee2) {
          var func = isArray(collection) ? arrayEachRight : baseEachRight;
          return func(collection, getIteratee(iteratee2, 3));
        }
        var groupBy = createAggregator(function(result2, value, key) {
          if (hasOwnProperty2.call(result2, key)) {
            result2[key].push(value);
          } else {
            baseAssignValue(result2, key, [value]);
          }
        });
        function includes(collection, value, fromIndex, guard) {
          collection = isArrayLike(collection) ? collection : values(collection);
          fromIndex = fromIndex && !guard ? toInteger(fromIndex) : 0;
          var length2 = collection.length;
          if (fromIndex < 0) {
            fromIndex = nativeMax(length2 + fromIndex, 0);
          }
          return isString2(collection) ? fromIndex <= length2 && collection.indexOf(value, fromIndex) > -1 : !!length2 && baseIndexOf(collection, value, fromIndex) > -1;
        }
        var invokeMap = baseRest(function(collection, path, args) {
          var index = -1, isFunc = typeof path == "function", result2 = isArrayLike(collection) ? Array2(collection.length) : [];
          baseEach(collection, function(value) {
            result2[++index] = isFunc ? apply(path, value, args) : baseInvoke(value, path, args);
          });
          return result2;
        });
        var keyBy = createAggregator(function(result2, value, key) {
          baseAssignValue(result2, key, value);
        });
        function map(collection, iteratee2) {
          var func = isArray(collection) ? arrayMap : baseMap;
          return func(collection, getIteratee(iteratee2, 3));
        }
        function orderBy(collection, iteratees, orders, guard) {
          if (collection == null) {
            return [];
          }
          if (!isArray(iteratees)) {
            iteratees = iteratees == null ? [] : [iteratees];
          }
          orders = guard ? undefined2 : orders;
          if (!isArray(orders)) {
            orders = orders == null ? [] : [orders];
          }
          return baseOrderBy(collection, iteratees, orders);
        }
        var partition = createAggregator(function(result2, value, key) {
          result2[key ? 0 : 1].push(value);
        }, function() {
          return [[], []];
        });
        function reduce(collection, iteratee2, accumulator) {
          var func = isArray(collection) ? arrayReduce : baseReduce, initAccum = arguments.length < 3;
          return func(collection, getIteratee(iteratee2, 4), accumulator, initAccum, baseEach);
        }
        function reduceRight(collection, iteratee2, accumulator) {
          var func = isArray(collection) ? arrayReduceRight : baseReduce, initAccum = arguments.length < 3;
          return func(collection, getIteratee(iteratee2, 4), accumulator, initAccum, baseEachRight);
        }
        function reject(collection, predicate) {
          var func = isArray(collection) ? arrayFilter : baseFilter;
          return func(collection, negate(getIteratee(predicate, 3)));
        }
        function sample(collection) {
          var func = isArray(collection) ? arraySample : baseSample;
          return func(collection);
        }
        function sampleSize(collection, n, guard) {
          if (guard ? isIterateeCall(collection, n, guard) : n === undefined2) {
            n = 1;
          } else {
            n = toInteger(n);
          }
          var func = isArray(collection) ? arraySampleSize : baseSampleSize;
          return func(collection, n);
        }
        function shuffle(collection) {
          var func = isArray(collection) ? arrayShuffle : baseShuffle;
          return func(collection);
        }
        function size(collection) {
          if (collection == null) {
            return 0;
          }
          if (isArrayLike(collection)) {
            return isString2(collection) ? stringSize(collection) : collection.length;
          }
          var tag = getTag(collection);
          if (tag == mapTag || tag == setTag) {
            return collection.size;
          }
          return baseKeys(collection).length;
        }
        function some(collection, predicate, guard) {
          var func = isArray(collection) ? arraySome : baseSome;
          if (guard && isIterateeCall(collection, predicate, guard)) {
            predicate = undefined2;
          }
          return func(collection, getIteratee(predicate, 3));
        }
        var sortBy = baseRest(function(collection, iteratees) {
          if (collection == null) {
            return [];
          }
          var length2 = iteratees.length;
          if (length2 > 1 && isIterateeCall(collection, iteratees[0], iteratees[1])) {
            iteratees = [];
          } else if (length2 > 2 && isIterateeCall(iteratees[0], iteratees[1], iteratees[2])) {
            iteratees = [iteratees[0]];
          }
          return baseOrderBy(collection, baseFlatten(iteratees, 1), []);
        });
        var now = ctxNow || function() {
          return root.Date.now();
        };
        function after(n, func) {
          if (typeof func != "function") {
            throw new TypeError(FUNC_ERROR_TEXT);
          }
          n = toInteger(n);
          return function() {
            if (--n < 1) {
              return func.apply(this, arguments);
            }
          };
        }
        function ary(func, n, guard) {
          n = guard ? undefined2 : n;
          n = func && n == null ? func.length : n;
          return createWrap(func, WRAP_ARY_FLAG, undefined2, undefined2, undefined2, undefined2, n);
        }
        function before(n, func) {
          var result2;
          if (typeof func != "function") {
            throw new TypeError(FUNC_ERROR_TEXT);
          }
          n = toInteger(n);
          return function() {
            if (--n > 0) {
              result2 = func.apply(this, arguments);
            }
            if (n <= 1) {
              func = undefined2;
            }
            return result2;
          };
        }
        var bind = baseRest(function(func, thisArg, partials) {
          var bitmask = WRAP_BIND_FLAG;
          if (partials.length) {
            var holders = replaceHolders(partials, getHolder(bind));
            bitmask |= WRAP_PARTIAL_FLAG;
          }
          return createWrap(func, bitmask, thisArg, partials, holders);
        });
        var bindKey = baseRest(function(object, key, partials) {
          var bitmask = WRAP_BIND_FLAG | WRAP_BIND_KEY_FLAG;
          if (partials.length) {
            var holders = replaceHolders(partials, getHolder(bindKey));
            bitmask |= WRAP_PARTIAL_FLAG;
          }
          return createWrap(key, bitmask, object, partials, holders);
        });
        function curry(func, arity, guard) {
          arity = guard ? undefined2 : arity;
          var result2 = createWrap(func, WRAP_CURRY_FLAG, undefined2, undefined2, undefined2, undefined2, undefined2, arity);
          result2.placeholder = curry.placeholder;
          return result2;
        }
        function curryRight(func, arity, guard) {
          arity = guard ? undefined2 : arity;
          var result2 = createWrap(func, WRAP_CURRY_RIGHT_FLAG, undefined2, undefined2, undefined2, undefined2, undefined2, arity);
          result2.placeholder = curryRight.placeholder;
          return result2;
        }
        function debounce(func, wait, options) {
          var lastArgs, lastThis, maxWait, result2, timerId, lastCallTime, lastInvokeTime = 0, leading = false, maxing = false, trailing = true;
          if (typeof func != "function") {
            throw new TypeError(FUNC_ERROR_TEXT);
          }
          wait = toNumber(wait) || 0;
          if (isObject(options)) {
            leading = !!options.leading;
            maxing = "maxWait" in options;
            maxWait = maxing ? nativeMax(toNumber(options.maxWait) || 0, wait) : maxWait;
            trailing = "trailing" in options ? !!options.trailing : trailing;
          }
          function invokeFunc(time) {
            var args = lastArgs, thisArg = lastThis;
            lastArgs = lastThis = undefined2;
            lastInvokeTime = time;
            result2 = func.apply(thisArg, args);
            return result2;
          }
          function leadingEdge(time) {
            lastInvokeTime = time;
            timerId = setTimeout2(timerExpired, wait);
            return leading ? invokeFunc(time) : result2;
          }
          function remainingWait(time) {
            var timeSinceLastCall = time - lastCallTime, timeSinceLastInvoke = time - lastInvokeTime, timeWaiting = wait - timeSinceLastCall;
            return maxing ? nativeMin(timeWaiting, maxWait - timeSinceLastInvoke) : timeWaiting;
          }
          function shouldInvoke(time) {
            var timeSinceLastCall = time - lastCallTime, timeSinceLastInvoke = time - lastInvokeTime;
            return lastCallTime === undefined2 || timeSinceLastCall >= wait || timeSinceLastCall < 0 || maxing && timeSinceLastInvoke >= maxWait;
          }
          function timerExpired() {
            var time = now();
            if (shouldInvoke(time)) {
              return trailingEdge(time);
            }
            timerId = setTimeout2(timerExpired, remainingWait(time));
          }
          function trailingEdge(time) {
            timerId = undefined2;
            if (trailing && lastArgs) {
              return invokeFunc(time);
            }
            lastArgs = lastThis = undefined2;
            return result2;
          }
          function cancel() {
            if (timerId !== undefined2) {
              clearTimeout2(timerId);
            }
            lastInvokeTime = 0;
            lastArgs = lastCallTime = lastThis = timerId = undefined2;
          }
          function flush() {
            return timerId === undefined2 ? result2 : trailingEdge(now());
          }
          function debounced() {
            var time = now(), isInvoking = shouldInvoke(time);
            lastArgs = arguments;
            lastThis = this;
            lastCallTime = time;
            if (isInvoking) {
              if (timerId === undefined2) {
                return leadingEdge(lastCallTime);
              }
              if (maxing) {
                clearTimeout2(timerId);
                timerId = setTimeout2(timerExpired, wait);
                return invokeFunc(lastCallTime);
              }
            }
            if (timerId === undefined2) {
              timerId = setTimeout2(timerExpired, wait);
            }
            return result2;
          }
          debounced.cancel = cancel;
          debounced.flush = flush;
          return debounced;
        }
        var defer = baseRest(function(func, args) {
          return baseDelay(func, 1, args);
        });
        var delay = baseRest(function(func, wait, args) {
          return baseDelay(func, toNumber(wait) || 0, args);
        });
        function flip(func) {
          return createWrap(func, WRAP_FLIP_FLAG);
        }
        function memoize(func, resolver) {
          if (typeof func != "function" || resolver != null && typeof resolver != "function") {
            throw new TypeError(FUNC_ERROR_TEXT);
          }
          var memoized = function() {
            var args = arguments, key = resolver ? resolver.apply(this, args) : args[0], cache = memoized.cache;
            if (cache.has(key)) {
              return cache.get(key);
            }
            var result2 = func.apply(this, args);
            memoized.cache = cache.set(key, result2) || cache;
            return result2;
          };
          memoized.cache = new (memoize.Cache || MapCache)();
          return memoized;
        }
        memoize.Cache = MapCache;
        function negate(predicate) {
          if (typeof predicate != "function") {
            throw new TypeError(FUNC_ERROR_TEXT);
          }
          return function() {
            var args = arguments;
            switch (args.length) {
              case 0:
                return !predicate.call(this);
              case 1:
                return !predicate.call(this, args[0]);
              case 2:
                return !predicate.call(this, args[0], args[1]);
              case 3:
                return !predicate.call(this, args[0], args[1], args[2]);
            }
            return !predicate.apply(this, args);
          };
        }
        function once(func) {
          return before(2, func);
        }
        var overArgs = castRest(function(func, transforms) {
          transforms = transforms.length == 1 && isArray(transforms[0]) ? arrayMap(transforms[0], baseUnary(getIteratee())) : arrayMap(baseFlatten(transforms, 1), baseUnary(getIteratee()));
          var funcsLength = transforms.length;
          return baseRest(function(args) {
            var index = -1, length2 = nativeMin(args.length, funcsLength);
            while (++index < length2) {
              args[index] = transforms[index].call(this, args[index]);
            }
            return apply(func, this, args);
          });
        });
        var partial = baseRest(function(func, partials) {
          var holders = replaceHolders(partials, getHolder(partial));
          return createWrap(func, WRAP_PARTIAL_FLAG, undefined2, partials, holders);
        });
        var partialRight = baseRest(function(func, partials) {
          var holders = replaceHolders(partials, getHolder(partialRight));
          return createWrap(func, WRAP_PARTIAL_RIGHT_FLAG, undefined2, partials, holders);
        });
        var rearg = flatRest(function(func, indexes) {
          return createWrap(func, WRAP_REARG_FLAG, undefined2, undefined2, undefined2, indexes);
        });
        function rest(func, start) {
          if (typeof func != "function") {
            throw new TypeError(FUNC_ERROR_TEXT);
          }
          start = start === undefined2 ? start : toInteger(start);
          return baseRest(func, start);
        }
        function spread(func, start) {
          if (typeof func != "function") {
            throw new TypeError(FUNC_ERROR_TEXT);
          }
          start = start == null ? 0 : nativeMax(toInteger(start), 0);
          return baseRest(function(args) {
            var array = args[start], otherArgs = castSlice(args, 0, start);
            if (array) {
              arrayPush(otherArgs, array);
            }
            return apply(func, this, otherArgs);
          });
        }
        function throttle(func, wait, options) {
          var leading = true, trailing = true;
          if (typeof func != "function") {
            throw new TypeError(FUNC_ERROR_TEXT);
          }
          if (isObject(options)) {
            leading = "leading" in options ? !!options.leading : leading;
            trailing = "trailing" in options ? !!options.trailing : trailing;
          }
          return debounce(func, wait, {
            "leading": leading,
            "maxWait": wait,
            "trailing": trailing
          });
        }
        function unary(func) {
          return ary(func, 1);
        }
        function wrap(value, wrapper) {
          return partial(castFunction(wrapper), value);
        }
        function castArray() {
          if (!arguments.length) {
            return [];
          }
          var value = arguments[0];
          return isArray(value) ? value : [value];
        }
        function clone(value) {
          return baseClone(value, CLONE_SYMBOLS_FLAG);
        }
        function cloneWith(value, customizer) {
          customizer = typeof customizer == "function" ? customizer : undefined2;
          return baseClone(value, CLONE_SYMBOLS_FLAG, customizer);
        }
        function cloneDeep(value) {
          return baseClone(value, CLONE_DEEP_FLAG | CLONE_SYMBOLS_FLAG);
        }
        function cloneDeepWith(value, customizer) {
          customizer = typeof customizer == "function" ? customizer : undefined2;
          return baseClone(value, CLONE_DEEP_FLAG | CLONE_SYMBOLS_FLAG, customizer);
        }
        function conformsTo(object, source) {
          return source == null || baseConformsTo(object, source, keys(source));
        }
        function eq(value, other) {
          return value === other || value !== value && other !== other;
        }
        var gt = createRelationalOperation(baseGt);
        var gte = createRelationalOperation(function(value, other) {
          return value >= other;
        });
        var isArguments = baseIsArguments(/* @__PURE__ */ (function() {
          return arguments;
        })()) ? baseIsArguments : function(value) {
          return isObjectLike(value) && hasOwnProperty2.call(value, "callee") && !propertyIsEnumerable.call(value, "callee");
        };
        var isArray = Array2.isArray;
        var isArrayBuffer = nodeIsArrayBuffer ? baseUnary(nodeIsArrayBuffer) : baseIsArrayBuffer;
        function isArrayLike(value) {
          return value != null && isLength(value.length) && !isFunction(value);
        }
        function isArrayLikeObject(value) {
          return isObjectLike(value) && isArrayLike(value);
        }
        function isBoolean(value) {
          return value === true || value === false || isObjectLike(value) && baseGetTag(value) == boolTag;
        }
        var isBuffer = nativeIsBuffer || stubFalse;
        var isDate = nodeIsDate ? baseUnary(nodeIsDate) : baseIsDate;
        function isElement(value) {
          return isObjectLike(value) && value.nodeType === 1 && !isPlainObject(value);
        }
        function isEmpty(value) {
          if (value == null) {
            return true;
          }
          if (isArrayLike(value) && (isArray(value) || typeof value == "string" || typeof value.splice == "function" || isBuffer(value) || isTypedArray(value) || isArguments(value))) {
            return !value.length;
          }
          var tag = getTag(value);
          if (tag == mapTag || tag == setTag) {
            return !value.size;
          }
          if (isPrototype(value)) {
            return !baseKeys(value).length;
          }
          for (var key in value) {
            if (hasOwnProperty2.call(value, key)) {
              return false;
            }
          }
          return true;
        }
        function isEqual(value, other) {
          return baseIsEqual(value, other);
        }
        function isEqualWith(value, other, customizer) {
          customizer = typeof customizer == "function" ? customizer : undefined2;
          var result2 = customizer ? customizer(value, other) : undefined2;
          return result2 === undefined2 ? baseIsEqual(value, other, undefined2, customizer) : !!result2;
        }
        function isError(value) {
          if (!isObjectLike(value)) {
            return false;
          }
          var tag = baseGetTag(value);
          return tag == errorTag || tag == domExcTag || typeof value.message == "string" && typeof value.name == "string" && !isPlainObject(value);
        }
        function isFinite(value) {
          return typeof value == "number" && nativeIsFinite(value);
        }
        function isFunction(value) {
          if (!isObject(value)) {
            return false;
          }
          var tag = baseGetTag(value);
          return tag == funcTag || tag == genTag || tag == asyncTag || tag == proxyTag;
        }
        function isInteger(value) {
          return typeof value == "number" && value == toInteger(value);
        }
        function isLength(value) {
          return typeof value == "number" && value > -1 && value % 1 == 0 && value <= MAX_SAFE_INTEGER;
        }
        function isObject(value) {
          var type = typeof value;
          return value != null && (type == "object" || type == "function");
        }
        function isObjectLike(value) {
          return value != null && typeof value == "object";
        }
        var isMap = nodeIsMap ? baseUnary(nodeIsMap) : baseIsMap;
        function isMatch(object, source) {
          return object === source || baseIsMatch(object, source, getMatchData(source));
        }
        function isMatchWith(object, source, customizer) {
          customizer = typeof customizer == "function" ? customizer : undefined2;
          return baseIsMatch(object, source, getMatchData(source), customizer);
        }
        function isNaN2(value) {
          return isNumber(value) && value != +value;
        }
        function isNative(value) {
          if (isMaskable(value)) {
            throw new Error2(CORE_ERROR_TEXT);
          }
          return baseIsNative(value);
        }
        function isNull(value) {
          return value === null;
        }
        function isNil(value) {
          return value == null;
        }
        function isNumber(value) {
          return typeof value == "number" || isObjectLike(value) && baseGetTag(value) == numberTag;
        }
        function isPlainObject(value) {
          if (!isObjectLike(value) || baseGetTag(value) != objectTag) {
            return false;
          }
          var proto = getPrototype(value);
          if (proto === null) {
            return true;
          }
          var Ctor = hasOwnProperty2.call(proto, "constructor") && proto.constructor;
          return typeof Ctor == "function" && Ctor instanceof Ctor && funcToString.call(Ctor) == objectCtorString;
        }
        var isRegExp = nodeIsRegExp ? baseUnary(nodeIsRegExp) : baseIsRegExp;
        function isSafeInteger(value) {
          return isInteger(value) && value >= -MAX_SAFE_INTEGER && value <= MAX_SAFE_INTEGER;
        }
        var isSet = nodeIsSet ? baseUnary(nodeIsSet) : baseIsSet;
        function isString2(value) {
          return typeof value == "string" || !isArray(value) && isObjectLike(value) && baseGetTag(value) == stringTag;
        }
        function isSymbol(value) {
          return typeof value == "symbol" || isObjectLike(value) && baseGetTag(value) == symbolTag;
        }
        var isTypedArray = nodeIsTypedArray ? baseUnary(nodeIsTypedArray) : baseIsTypedArray;
        function isUndefined(value) {
          return value === undefined2;
        }
        function isWeakMap(value) {
          return isObjectLike(value) && getTag(value) == weakMapTag;
        }
        function isWeakSet(value) {
          return isObjectLike(value) && baseGetTag(value) == weakSetTag;
        }
        var lt = createRelationalOperation(baseLt);
        var lte = createRelationalOperation(function(value, other) {
          return value <= other;
        });
        function toArray(value) {
          if (!value) {
            return [];
          }
          if (isArrayLike(value)) {
            return isString2(value) ? stringToArray(value) : copyArray(value);
          }
          if (symIterator && value[symIterator]) {
            return iteratorToArray(value[symIterator]());
          }
          var tag = getTag(value), func = tag == mapTag ? mapToArray : tag == setTag ? setToArray : values;
          return func(value);
        }
        function toFinite(value) {
          if (!value) {
            return value === 0 ? value : 0;
          }
          value = toNumber(value);
          if (value === INFINITY || value === -INFINITY) {
            var sign = value < 0 ? -1 : 1;
            return sign * MAX_INTEGER;
          }
          return value === value ? value : 0;
        }
        function toInteger(value) {
          var result2 = toFinite(value), remainder = result2 % 1;
          return result2 === result2 ? remainder ? result2 - remainder : result2 : 0;
        }
        function toLength(value) {
          return value ? baseClamp(toInteger(value), 0, MAX_ARRAY_LENGTH) : 0;
        }
        function toNumber(value) {
          if (typeof value == "number") {
            return value;
          }
          if (isSymbol(value)) {
            return NAN;
          }
          if (isObject(value)) {
            var other = typeof value.valueOf == "function" ? value.valueOf() : value;
            value = isObject(other) ? other + "" : other;
          }
          if (typeof value != "string") {
            return value === 0 ? value : +value;
          }
          value = baseTrim(value);
          var isBinary = reIsBinary.test(value);
          return isBinary || reIsOctal.test(value) ? freeParseInt(value.slice(2), isBinary ? 2 : 8) : reIsBadHex.test(value) ? NAN : +value;
        }
        function toPlainObject(value) {
          return copyObject(value, keysIn(value));
        }
        function toSafeInteger(value) {
          return value ? baseClamp(toInteger(value), -MAX_SAFE_INTEGER, MAX_SAFE_INTEGER) : value === 0 ? value : 0;
        }
        function toString(value) {
          return value == null ? "" : baseToString(value);
        }
        var assign2 = createAssigner(function(object, source) {
          if (isPrototype(source) || isArrayLike(source)) {
            copyObject(source, keys(source), object);
            return;
          }
          for (var key in source) {
            if (hasOwnProperty2.call(source, key)) {
              assignValue(object, key, source[key]);
            }
          }
        });
        var assignIn = createAssigner(function(object, source) {
          copyObject(source, keysIn(source), object);
        });
        var assignInWith = createAssigner(function(object, source, srcIndex, customizer) {
          copyObject(source, keysIn(source), object, customizer);
        });
        var assignWith = createAssigner(function(object, source, srcIndex, customizer) {
          copyObject(source, keys(source), object, customizer);
        });
        var at = flatRest(baseAt);
        function create(prototype, properties) {
          var result2 = baseCreate(prototype);
          return properties == null ? result2 : baseAssign(result2, properties);
        }
        var defaults = baseRest(function(object, sources) {
          object = Object2(object);
          var index = -1;
          var length2 = sources.length;
          var guard = length2 > 2 ? sources[2] : undefined2;
          if (guard && isIterateeCall(sources[0], sources[1], guard)) {
            length2 = 1;
          }
          while (++index < length2) {
            var source = sources[index];
            var props = keysIn(source);
            var propsIndex = -1;
            var propsLength = props.length;
            while (++propsIndex < propsLength) {
              var key = props[propsIndex];
              var value = object[key];
              if (value === undefined2 || eq(value, objectProto[key]) && !hasOwnProperty2.call(object, key)) {
                object[key] = source[key];
              }
            }
          }
          return object;
        });
        var defaultsDeep = baseRest(function(args) {
          args.push(undefined2, customDefaultsMerge);
          return apply(mergeWith, undefined2, args);
        });
        function findKey(object, predicate) {
          return baseFindKey(object, getIteratee(predicate, 3), baseForOwn);
        }
        function findLastKey(object, predicate) {
          return baseFindKey(object, getIteratee(predicate, 3), baseForOwnRight);
        }
        function forIn(object, iteratee2) {
          return object == null ? object : baseFor(object, getIteratee(iteratee2, 3), keysIn);
        }
        function forInRight(object, iteratee2) {
          return object == null ? object : baseForRight(object, getIteratee(iteratee2, 3), keysIn);
        }
        function forOwn(object, iteratee2) {
          return object && baseForOwn(object, getIteratee(iteratee2, 3));
        }
        function forOwnRight(object, iteratee2) {
          return object && baseForOwnRight(object, getIteratee(iteratee2, 3));
        }
        function functions(object) {
          return object == null ? [] : baseFunctions(object, keys(object));
        }
        function functionsIn(object) {
          return object == null ? [] : baseFunctions(object, keysIn(object));
        }
        function get(object, path, defaultValue) {
          var result2 = object == null ? undefined2 : baseGet(object, path);
          return result2 === undefined2 ? defaultValue : result2;
        }
        function has(object, path) {
          return object != null && hasPath(object, path, baseHas);
        }
        function hasIn(object, path) {
          return object != null && hasPath(object, path, baseHasIn);
        }
        var invert = createInverter(function(result2, value, key) {
          if (value != null && typeof value.toString != "function") {
            value = nativeObjectToString.call(value);
          }
          result2[value] = key;
        }, constant(identity));
        var invertBy = createInverter(function(result2, value, key) {
          if (value != null && typeof value.toString != "function") {
            value = nativeObjectToString.call(value);
          }
          if (hasOwnProperty2.call(result2, value)) {
            result2[value].push(key);
          } else {
            result2[value] = [key];
          }
        }, getIteratee);
        var invoke = baseRest(baseInvoke);
        function keys(object) {
          return isArrayLike(object) ? arrayLikeKeys(object) : baseKeys(object);
        }
        function keysIn(object) {
          return isArrayLike(object) ? arrayLikeKeys(object, true) : baseKeysIn(object);
        }
        function mapKeys(object, iteratee2) {
          var result2 = {};
          iteratee2 = getIteratee(iteratee2, 3);
          baseForOwn(object, function(value, key, object2) {
            baseAssignValue(result2, iteratee2(value, key, object2), value);
          });
          return result2;
        }
        function mapValues(object, iteratee2) {
          var result2 = {};
          iteratee2 = getIteratee(iteratee2, 3);
          baseForOwn(object, function(value, key, object2) {
            baseAssignValue(result2, key, iteratee2(value, key, object2));
          });
          return result2;
        }
        var merge = createAssigner(function(object, source, srcIndex) {
          baseMerge(object, source, srcIndex);
        });
        var mergeWith = createAssigner(function(object, source, srcIndex, customizer) {
          baseMerge(object, source, srcIndex, customizer);
        });
        var omit = flatRest(function(object, paths) {
          var result2 = {};
          if (object == null) {
            return result2;
          }
          var isDeep = false;
          paths = arrayMap(paths, function(path) {
            path = castPath(path, object);
            isDeep || (isDeep = path.length > 1);
            return path;
          });
          copyObject(object, getAllKeysIn(object), result2);
          if (isDeep) {
            result2 = baseClone(result2, CLONE_DEEP_FLAG | CLONE_FLAT_FLAG | CLONE_SYMBOLS_FLAG, customOmitClone);
          }
          var length2 = paths.length;
          while (length2--) {
            baseUnset(result2, paths[length2]);
          }
          return result2;
        });
        function omitBy(object, predicate) {
          return pickBy(object, negate(getIteratee(predicate)));
        }
        var pick = flatRest(function(object, paths) {
          return object == null ? {} : basePick(object, paths);
        });
        function pickBy(object, predicate) {
          if (object == null) {
            return {};
          }
          var props = arrayMap(getAllKeysIn(object), function(prop) {
            return [prop];
          });
          predicate = getIteratee(predicate);
          return basePickBy(object, props, function(value, path) {
            return predicate(value, path[0]);
          });
        }
        function result(object, path, defaultValue) {
          path = castPath(path, object);
          var index = -1, length2 = path.length;
          if (!length2) {
            length2 = 1;
            object = undefined2;
          }
          while (++index < length2) {
            var value = object == null ? undefined2 : object[toKey(path[index])];
            if (value === undefined2) {
              index = length2;
              value = defaultValue;
            }
            object = isFunction(value) ? value.call(object) : value;
          }
          return object;
        }
        function set(object, path, value) {
          return object == null ? object : baseSet(object, path, value);
        }
        function setWith(object, path, value, customizer) {
          customizer = typeof customizer == "function" ? customizer : undefined2;
          return object == null ? object : baseSet(object, path, value, customizer);
        }
        var toPairs = createToPairs(keys);
        var toPairsIn = createToPairs(keysIn);
        function transform(object, iteratee2, accumulator) {
          var isArr = isArray(object), isArrLike = isArr || isBuffer(object) || isTypedArray(object);
          iteratee2 = getIteratee(iteratee2, 4);
          if (accumulator == null) {
            var Ctor = object && object.constructor;
            if (isArrLike) {
              accumulator = isArr ? new Ctor() : [];
            } else if (isObject(object)) {
              accumulator = isFunction(Ctor) ? baseCreate(getPrototype(object)) : {};
            } else {
              accumulator = {};
            }
          }
          (isArrLike ? arrayEach : baseForOwn)(object, function(value, index, object2) {
            return iteratee2(accumulator, value, index, object2);
          });
          return accumulator;
        }
        function unset(object, path) {
          return object == null ? true : baseUnset(object, path);
        }
        function update(object, path, updater) {
          return object == null ? object : baseUpdate(object, path, castFunction(updater));
        }
        function updateWith(object, path, updater, customizer) {
          customizer = typeof customizer == "function" ? customizer : undefined2;
          return object == null ? object : baseUpdate(object, path, castFunction(updater), customizer);
        }
        function values(object) {
          return object == null ? [] : baseValues(object, keys(object));
        }
        function valuesIn(object) {
          return object == null ? [] : baseValues(object, keysIn(object));
        }
        function clamp2(number, lower, upper) {
          if (upper === undefined2) {
            upper = lower;
            lower = undefined2;
          }
          if (upper !== undefined2) {
            upper = toNumber(upper);
            upper = upper === upper ? upper : 0;
          }
          if (lower !== undefined2) {
            lower = toNumber(lower);
            lower = lower === lower ? lower : 0;
          }
          return baseClamp(toNumber(number), lower, upper);
        }
        function inRange(number, start, end) {
          start = toFinite(start);
          if (end === undefined2) {
            end = start;
            start = 0;
          } else {
            end = toFinite(end);
          }
          number = toNumber(number);
          return baseInRange(number, start, end);
        }
        function random(lower, upper, floating) {
          if (floating && typeof floating != "boolean" && isIterateeCall(lower, upper, floating)) {
            upper = floating = undefined2;
          }
          if (floating === undefined2) {
            if (typeof upper == "boolean") {
              floating = upper;
              upper = undefined2;
            } else if (typeof lower == "boolean") {
              floating = lower;
              lower = undefined2;
            }
          }
          if (lower === undefined2 && upper === undefined2) {
            lower = 0;
            upper = 1;
          } else {
            lower = toFinite(lower);
            if (upper === undefined2) {
              upper = lower;
              lower = 0;
            } else {
              upper = toFinite(upper);
            }
          }
          if (lower > upper) {
            var temp = lower;
            lower = upper;
            upper = temp;
          }
          if (floating || lower % 1 || upper % 1) {
            var rand = nativeRandom();
            return nativeMin(lower + rand * (upper - lower + freeParseFloat("1e-" + ((rand + "").length - 1))), upper);
          }
          return baseRandom(lower, upper);
        }
        var camelCase = createCompounder(function(result2, word, index) {
          word = word.toLowerCase();
          return result2 + (index ? capitalize(word) : word);
        });
        function capitalize(string) {
          return upperFirst(toString(string).toLowerCase());
        }
        function deburr(string) {
          string = toString(string);
          return string && string.replace(reLatin, deburrLetter).replace(reComboMark, "");
        }
        function endsWith(string, target, position2) {
          string = toString(string);
          target = baseToString(target);
          var length2 = string.length;
          position2 = position2 === undefined2 ? length2 : baseClamp(toInteger(position2), 0, length2);
          var end = position2;
          position2 -= target.length;
          return position2 >= 0 && string.slice(position2, end) == target;
        }
        function escape(string) {
          string = toString(string);
          return string && reHasUnescapedHtml.test(string) ? string.replace(reUnescapedHtml, escapeHtmlChar) : string;
        }
        function escapeRegExp(string) {
          string = toString(string);
          return string && reHasRegExpChar.test(string) ? string.replace(reRegExpChar, "\\$&") : string;
        }
        var kebabCase = createCompounder(function(result2, word, index) {
          return result2 + (index ? "-" : "") + word.toLowerCase();
        });
        var lowerCase = createCompounder(function(result2, word, index) {
          return result2 + (index ? " " : "") + word.toLowerCase();
        });
        var lowerFirst = createCaseFirst("toLowerCase");
        function pad(string, length2, chars) {
          string = toString(string);
          length2 = toInteger(length2);
          var strLength = length2 ? stringSize(string) : 0;
          if (!length2 || strLength >= length2) {
            return string;
          }
          var mid = (length2 - strLength) / 2;
          return createPadding(nativeFloor(mid), chars) + string + createPadding(nativeCeil(mid), chars);
        }
        function padEnd(string, length2, chars) {
          string = toString(string);
          length2 = toInteger(length2);
          var strLength = length2 ? stringSize(string) : 0;
          return length2 && strLength < length2 ? string + createPadding(length2 - strLength, chars) : string;
        }
        function padStart(string, length2, chars) {
          string = toString(string);
          length2 = toInteger(length2);
          var strLength = length2 ? stringSize(string) : 0;
          return length2 && strLength < length2 ? createPadding(length2 - strLength, chars) + string : string;
        }
        function parseInt2(string, radix, guard) {
          if (guard || radix == null) {
            radix = 0;
          } else if (radix) {
            radix = +radix;
          }
          return nativeParseInt(toString(string).replace(reTrimStart, ""), radix || 0);
        }
        function repeat(string, n, guard) {
          if (guard ? isIterateeCall(string, n, guard) : n === undefined2) {
            n = 1;
          } else {
            n = toInteger(n);
          }
          return baseRepeat(toString(string), n);
        }
        function replace2() {
          var args = arguments, string = toString(args[0]);
          return args.length < 3 ? string : string.replace(args[1], args[2]);
        }
        var snakeCase = createCompounder(function(result2, word, index) {
          return result2 + (index ? "_" : "") + word.toLowerCase();
        });
        function split(string, separator, limit) {
          if (limit && typeof limit != "number" && isIterateeCall(string, separator, limit)) {
            separator = limit = undefined2;
          }
          limit = limit === undefined2 ? MAX_ARRAY_LENGTH : limit >>> 0;
          if (!limit) {
            return [];
          }
          string = toString(string);
          if (string && (typeof separator == "string" || separator != null && !isRegExp(separator))) {
            separator = baseToString(separator);
            if (!separator && hasUnicode(string)) {
              return castSlice(stringToArray(string), 0, limit);
            }
          }
          return string.split(separator, limit);
        }
        var startCase = createCompounder(function(result2, word, index) {
          return result2 + (index ? " " : "") + upperFirst(word);
        });
        function startsWith(string, target, position2) {
          string = toString(string);
          position2 = position2 == null ? 0 : baseClamp(toInteger(position2), 0, string.length);
          target = baseToString(target);
          return string.slice(position2, position2 + target.length) == target;
        }
        function template(string, options, guard) {
          var settings = lodash.templateSettings;
          if (guard && isIterateeCall(string, options, guard)) {
            options = undefined2;
          }
          string = toString(string);
          options = assignInWith({}, options, settings, customDefaultsAssignIn);
          var imports = assignInWith({}, options.imports, settings.imports, customDefaultsAssignIn), importsKeys = keys(imports), importsValues = baseValues(imports, importsKeys);
          var isEscaping, isEvaluating, index = 0, interpolate = options.interpolate || reNoMatch, source = "__p += '";
          var reDelimiters = RegExp2(
            (options.escape || reNoMatch).source + "|" + interpolate.source + "|" + (interpolate === reInterpolate ? reEsTemplate : reNoMatch).source + "|" + (options.evaluate || reNoMatch).source + "|$",
            "g"
          );
          var sourceURL = "//# sourceURL=" + (hasOwnProperty2.call(options, "sourceURL") ? (options.sourceURL + "").replace(/\s/g, " ") : "lodash.templateSources[" + ++templateCounter + "]") + "\n";
          string.replace(reDelimiters, function(match2, escapeValue, interpolateValue, esTemplateValue, evaluateValue, offset) {
            interpolateValue || (interpolateValue = esTemplateValue);
            source += string.slice(index, offset).replace(reUnescapedString, escapeStringChar);
            if (escapeValue) {
              isEscaping = true;
              source += "' +\n__e(" + escapeValue + ") +\n'";
            }
            if (evaluateValue) {
              isEvaluating = true;
              source += "';\n" + evaluateValue + ";\n__p += '";
            }
            if (interpolateValue) {
              source += "' +\n((__t = (" + interpolateValue + ")) == null ? '' : __t) +\n'";
            }
            index = offset + match2.length;
            return match2;
          });
          source += "';\n";
          var variable = hasOwnProperty2.call(options, "variable") && options.variable;
          if (!variable) {
            source = "with (obj) {\n" + source + "\n}\n";
          } else if (reForbiddenIdentifierChars.test(variable)) {
            throw new Error2(INVALID_TEMPL_VAR_ERROR_TEXT);
          }
          source = (isEvaluating ? source.replace(reEmptyStringLeading, "") : source).replace(reEmptyStringMiddle, "$1").replace(reEmptyStringTrailing, "$1;");
          source = "function(" + (variable || "obj") + ") {\n" + (variable ? "" : "obj || (obj = {});\n") + "var __t, __p = ''" + (isEscaping ? ", __e = _.escape" : "") + (isEvaluating ? ", __j = Array.prototype.join;\nfunction print() { __p += __j.call(arguments, '') }\n" : ";\n") + source + "return __p\n}";
          var result2 = attempt(function() {
            return Function2(importsKeys, sourceURL + "return " + source).apply(undefined2, importsValues);
          });
          result2.source = source;
          if (isError(result2)) {
            throw result2;
          }
          return result2;
        }
        function toLower(value) {
          return toString(value).toLowerCase();
        }
        function toUpper(value) {
          return toString(value).toUpperCase();
        }
        function trim2(string, chars, guard) {
          string = toString(string);
          if (string && (guard || chars === undefined2)) {
            return baseTrim(string);
          }
          if (!string || !(chars = baseToString(chars))) {
            return string;
          }
          var strSymbols = stringToArray(string), chrSymbols = stringToArray(chars), start = charsStartIndex(strSymbols, chrSymbols), end = charsEndIndex(strSymbols, chrSymbols) + 1;
          return castSlice(strSymbols, start, end).join("");
        }
        function trimEnd(string, chars, guard) {
          string = toString(string);
          if (string && (guard || chars === undefined2)) {
            return string.slice(0, trimmedEndIndex(string) + 1);
          }
          if (!string || !(chars = baseToString(chars))) {
            return string;
          }
          var strSymbols = stringToArray(string), end = charsEndIndex(strSymbols, stringToArray(chars)) + 1;
          return castSlice(strSymbols, 0, end).join("");
        }
        function trimStart(string, chars, guard) {
          string = toString(string);
          if (string && (guard || chars === undefined2)) {
            return string.replace(reTrimStart, "");
          }
          if (!string || !(chars = baseToString(chars))) {
            return string;
          }
          var strSymbols = stringToArray(string), start = charsStartIndex(strSymbols, stringToArray(chars));
          return castSlice(strSymbols, start).join("");
        }
        function truncate(string, options) {
          var length2 = DEFAULT_TRUNC_LENGTH, omission = DEFAULT_TRUNC_OMISSION;
          if (isObject(options)) {
            var separator = "separator" in options ? options.separator : separator;
            length2 = "length" in options ? toInteger(options.length) : length2;
            omission = "omission" in options ? baseToString(options.omission) : omission;
          }
          string = toString(string);
          var strLength = string.length;
          if (hasUnicode(string)) {
            var strSymbols = stringToArray(string);
            strLength = strSymbols.length;
          }
          if (length2 >= strLength) {
            return string;
          }
          var end = length2 - stringSize(omission);
          if (end < 1) {
            return omission;
          }
          var result2 = strSymbols ? castSlice(strSymbols, 0, end).join("") : string.slice(0, end);
          if (separator === undefined2) {
            return result2 + omission;
          }
          if (strSymbols) {
            end += result2.length - end;
          }
          if (isRegExp(separator)) {
            if (string.slice(end).search(separator)) {
              var match2, substring = result2;
              if (!separator.global) {
                separator = RegExp2(separator.source, toString(reFlags.exec(separator)) + "g");
              }
              separator.lastIndex = 0;
              while (match2 = separator.exec(substring)) {
                var newEnd = match2.index;
              }
              result2 = result2.slice(0, newEnd === undefined2 ? end : newEnd);
            }
          } else if (string.indexOf(baseToString(separator), end) != end) {
            var index = result2.lastIndexOf(separator);
            if (index > -1) {
              result2 = result2.slice(0, index);
            }
          }
          return result2 + omission;
        }
        function unescape(string) {
          string = toString(string);
          return string && reHasEscapedHtml.test(string) ? string.replace(reEscapedHtml, unescapeHtmlChar) : string;
        }
        var upperCase = createCompounder(function(result2, word, index) {
          return result2 + (index ? " " : "") + word.toUpperCase();
        });
        var upperFirst = createCaseFirst("toUpperCase");
        function words(string, pattern, guard) {
          string = toString(string);
          pattern = guard ? undefined2 : pattern;
          if (pattern === undefined2) {
            return hasUnicodeWord(string) ? unicodeWords(string) : asciiWords(string);
          }
          return string.match(pattern) || [];
        }
        var attempt = baseRest(function(func, args) {
          try {
            return apply(func, undefined2, args);
          } catch (e) {
            return isError(e) ? e : new Error2(e);
          }
        });
        var bindAll = flatRest(function(object, methodNames) {
          arrayEach(methodNames, function(key) {
            key = toKey(key);
            baseAssignValue(object, key, bind(object[key], object));
          });
          return object;
        });
        function cond(pairs) {
          var length2 = pairs == null ? 0 : pairs.length, toIteratee = getIteratee();
          pairs = !length2 ? [] : arrayMap(pairs, function(pair) {
            if (typeof pair[1] != "function") {
              throw new TypeError(FUNC_ERROR_TEXT);
            }
            return [toIteratee(pair[0]), pair[1]];
          });
          return baseRest(function(args) {
            var index = -1;
            while (++index < length2) {
              var pair = pairs[index];
              if (apply(pair[0], this, args)) {
                return apply(pair[1], this, args);
              }
            }
          });
        }
        function conforms(source) {
          return baseConforms(baseClone(source, CLONE_DEEP_FLAG));
        }
        function constant(value) {
          return function() {
            return value;
          };
        }
        function defaultTo(value, defaultValue) {
          return value == null || value !== value ? defaultValue : value;
        }
        var flow = createFlow();
        var flowRight = createFlow(true);
        function identity(value) {
          return value;
        }
        function iteratee(func) {
          return baseIteratee(typeof func == "function" ? func : baseClone(func, CLONE_DEEP_FLAG));
        }
        function matches(source) {
          return baseMatches(baseClone(source, CLONE_DEEP_FLAG));
        }
        function matchesProperty(path, srcValue) {
          return baseMatchesProperty(path, baseClone(srcValue, CLONE_DEEP_FLAG));
        }
        var method = baseRest(function(path, args) {
          return function(object) {
            return baseInvoke(object, path, args);
          };
        });
        var methodOf = baseRest(function(object, args) {
          return function(path) {
            return baseInvoke(object, path, args);
          };
        });
        function mixin(object, source, options) {
          var props = keys(source), methodNames = baseFunctions(source, props);
          if (options == null && !(isObject(source) && (methodNames.length || !props.length))) {
            options = source;
            source = object;
            object = this;
            methodNames = baseFunctions(source, keys(source));
          }
          var chain2 = !(isObject(options) && "chain" in options) || !!options.chain, isFunc = isFunction(object);
          arrayEach(methodNames, function(methodName) {
            var func = source[methodName];
            object[methodName] = func;
            if (isFunc) {
              object.prototype[methodName] = function() {
                var chainAll = this.__chain__;
                if (chain2 || chainAll) {
                  var result2 = object(this.__wrapped__), actions = result2.__actions__ = copyArray(this.__actions__);
                  actions.push({ "func": func, "args": arguments, "thisArg": object });
                  result2.__chain__ = chainAll;
                  return result2;
                }
                return func.apply(object, arrayPush([this.value()], arguments));
              };
            }
          });
          return object;
        }
        function noConflict() {
          if (root._ === this) {
            root._ = oldDash;
          }
          return this;
        }
        function noop() {
        }
        function nthArg(n) {
          n = toInteger(n);
          return baseRest(function(args) {
            return baseNth(args, n);
          });
        }
        var over = createOver(arrayMap);
        var overEvery = createOver(arrayEvery);
        var overSome = createOver(arraySome);
        function property(path) {
          return isKey(path) ? baseProperty(toKey(path)) : basePropertyDeep(path);
        }
        function propertyOf(object) {
          return function(path) {
            return object == null ? undefined2 : baseGet(object, path);
          };
        }
        var range = createRange();
        var rangeRight = createRange(true);
        function stubArray() {
          return [];
        }
        function stubFalse() {
          return false;
        }
        function stubObject() {
          return {};
        }
        function stubString() {
          return "";
        }
        function stubTrue() {
          return true;
        }
        function times(n, iteratee2) {
          n = toInteger(n);
          if (n < 1 || n > MAX_SAFE_INTEGER) {
            return [];
          }
          var index = MAX_ARRAY_LENGTH, length2 = nativeMin(n, MAX_ARRAY_LENGTH);
          iteratee2 = getIteratee(iteratee2);
          n -= MAX_ARRAY_LENGTH;
          var result2 = baseTimes(length2, iteratee2);
          while (++index < n) {
            iteratee2(index);
          }
          return result2;
        }
        function toPath(value) {
          if (isArray(value)) {
            return arrayMap(value, toKey);
          }
          return isSymbol(value) ? [value] : copyArray(stringToPath(toString(value)));
        }
        function uniqueId(prefix2) {
          var id = ++idCounter;
          return toString(prefix2) + id;
        }
        var add = createMathOperation(function(augend, addend) {
          return augend + addend;
        }, 0);
        var ceil = createRound("ceil");
        var divide = createMathOperation(function(dividend, divisor) {
          return dividend / divisor;
        }, 1);
        var floor = createRound("floor");
        function max(array) {
          return array && array.length ? baseExtremum(array, identity, baseGt) : undefined2;
        }
        function maxBy(array, iteratee2) {
          return array && array.length ? baseExtremum(array, getIteratee(iteratee2, 2), baseGt) : undefined2;
        }
        function mean(array) {
          return baseMean(array, identity);
        }
        function meanBy(array, iteratee2) {
          return baseMean(array, getIteratee(iteratee2, 2));
        }
        function min(array) {
          return array && array.length ? baseExtremum(array, identity, baseLt) : undefined2;
        }
        function minBy(array, iteratee2) {
          return array && array.length ? baseExtremum(array, getIteratee(iteratee2, 2), baseLt) : undefined2;
        }
        var multiply = createMathOperation(function(multiplier, multiplicand) {
          return multiplier * multiplicand;
        }, 1);
        var round = createRound("round");
        var subtract = createMathOperation(function(minuend, subtrahend) {
          return minuend - subtrahend;
        }, 0);
        function sum(array) {
          return array && array.length ? baseSum(array, identity) : 0;
        }
        function sumBy(array, iteratee2) {
          return array && array.length ? baseSum(array, getIteratee(iteratee2, 2)) : 0;
        }
        lodash.after = after;
        lodash.ary = ary;
        lodash.assign = assign2;
        lodash.assignIn = assignIn;
        lodash.assignInWith = assignInWith;
        lodash.assignWith = assignWith;
        lodash.at = at;
        lodash.before = before;
        lodash.bind = bind;
        lodash.bindAll = bindAll;
        lodash.bindKey = bindKey;
        lodash.castArray = castArray;
        lodash.chain = chain;
        lodash.chunk = chunk;
        lodash.compact = compact;
        lodash.concat = concat;
        lodash.cond = cond;
        lodash.conforms = conforms;
        lodash.constant = constant;
        lodash.countBy = countBy;
        lodash.create = create;
        lodash.curry = curry;
        lodash.curryRight = curryRight;
        lodash.debounce = debounce;
        lodash.defaults = defaults;
        lodash.defaultsDeep = defaultsDeep;
        lodash.defer = defer;
        lodash.delay = delay;
        lodash.difference = difference;
        lodash.differenceBy = differenceBy;
        lodash.differenceWith = differenceWith;
        lodash.drop = drop;
        lodash.dropRight = dropRight;
        lodash.dropRightWhile = dropRightWhile;
        lodash.dropWhile = dropWhile;
        lodash.fill = fill;
        lodash.filter = filter2;
        lodash.flatMap = flatMap;
        lodash.flatMapDeep = flatMapDeep;
        lodash.flatMapDepth = flatMapDepth;
        lodash.flatten = flatten;
        lodash.flattenDeep = flattenDeep;
        lodash.flattenDepth = flattenDepth;
        lodash.flip = flip;
        lodash.flow = flow;
        lodash.flowRight = flowRight;
        lodash.fromPairs = fromPairs;
        lodash.functions = functions;
        lodash.functionsIn = functionsIn;
        lodash.groupBy = groupBy;
        lodash.initial = initial;
        lodash.intersection = intersection;
        lodash.intersectionBy = intersectionBy;
        lodash.intersectionWith = intersectionWith;
        lodash.invert = invert;
        lodash.invertBy = invertBy;
        lodash.invokeMap = invokeMap;
        lodash.iteratee = iteratee;
        lodash.keyBy = keyBy;
        lodash.keys = keys;
        lodash.keysIn = keysIn;
        lodash.map = map;
        lodash.mapKeys = mapKeys;
        lodash.mapValues = mapValues;
        lodash.matches = matches;
        lodash.matchesProperty = matchesProperty;
        lodash.memoize = memoize;
        lodash.merge = merge;
        lodash.mergeWith = mergeWith;
        lodash.method = method;
        lodash.methodOf = methodOf;
        lodash.mixin = mixin;
        lodash.negate = negate;
        lodash.nthArg = nthArg;
        lodash.omit = omit;
        lodash.omitBy = omitBy;
        lodash.once = once;
        lodash.orderBy = orderBy;
        lodash.over = over;
        lodash.overArgs = overArgs;
        lodash.overEvery = overEvery;
        lodash.overSome = overSome;
        lodash.partial = partial;
        lodash.partialRight = partialRight;
        lodash.partition = partition;
        lodash.pick = pick;
        lodash.pickBy = pickBy;
        lodash.property = property;
        lodash.propertyOf = propertyOf;
        lodash.pull = pull;
        lodash.pullAll = pullAll;
        lodash.pullAllBy = pullAllBy;
        lodash.pullAllWith = pullAllWith;
        lodash.pullAt = pullAt;
        lodash.range = range;
        lodash.rangeRight = rangeRight;
        lodash.rearg = rearg;
        lodash.reject = reject;
        lodash.remove = remove;
        lodash.rest = rest;
        lodash.reverse = reverse;
        lodash.sampleSize = sampleSize;
        lodash.set = set;
        lodash.setWith = setWith;
        lodash.shuffle = shuffle;
        lodash.slice = slice2;
        lodash.sortBy = sortBy;
        lodash.sortedUniq = sortedUniq;
        lodash.sortedUniqBy = sortedUniqBy;
        lodash.split = split;
        lodash.spread = spread;
        lodash.tail = tail;
        lodash.take = take;
        lodash.takeRight = takeRight;
        lodash.takeRightWhile = takeRightWhile;
        lodash.takeWhile = takeWhile;
        lodash.tap = tap;
        lodash.throttle = throttle;
        lodash.thru = thru;
        lodash.toArray = toArray;
        lodash.toPairs = toPairs;
        lodash.toPairsIn = toPairsIn;
        lodash.toPath = toPath;
        lodash.toPlainObject = toPlainObject;
        lodash.transform = transform;
        lodash.unary = unary;
        lodash.union = union;
        lodash.unionBy = unionBy;
        lodash.unionWith = unionWith;
        lodash.uniq = uniq;
        lodash.uniqBy = uniqBy;
        lodash.uniqWith = uniqWith;
        lodash.unset = unset;
        lodash.unzip = unzip;
        lodash.unzipWith = unzipWith;
        lodash.update = update;
        lodash.updateWith = updateWith;
        lodash.values = values;
        lodash.valuesIn = valuesIn;
        lodash.without = without;
        lodash.words = words;
        lodash.wrap = wrap;
        lodash.xor = xor;
        lodash.xorBy = xorBy;
        lodash.xorWith = xorWith;
        lodash.zip = zip;
        lodash.zipObject = zipObject;
        lodash.zipObjectDeep = zipObjectDeep;
        lodash.zipWith = zipWith;
        lodash.entries = toPairs;
        lodash.entriesIn = toPairsIn;
        lodash.extend = assignIn;
        lodash.extendWith = assignInWith;
        mixin(lodash, lodash);
        lodash.add = add;
        lodash.attempt = attempt;
        lodash.camelCase = camelCase;
        lodash.capitalize = capitalize;
        lodash.ceil = ceil;
        lodash.clamp = clamp2;
        lodash.clone = clone;
        lodash.cloneDeep = cloneDeep;
        lodash.cloneDeepWith = cloneDeepWith;
        lodash.cloneWith = cloneWith;
        lodash.conformsTo = conformsTo;
        lodash.deburr = deburr;
        lodash.defaultTo = defaultTo;
        lodash.divide = divide;
        lodash.endsWith = endsWith;
        lodash.eq = eq;
        lodash.escape = escape;
        lodash.escapeRegExp = escapeRegExp;
        lodash.every = every;
        lodash.find = find;
        lodash.findIndex = findIndex;
        lodash.findKey = findKey;
        lodash.findLast = findLast;
        lodash.findLastIndex = findLastIndex;
        lodash.findLastKey = findLastKey;
        lodash.floor = floor;
        lodash.forEach = forEach;
        lodash.forEachRight = forEachRight;
        lodash.forIn = forIn;
        lodash.forInRight = forInRight;
        lodash.forOwn = forOwn;
        lodash.forOwnRight = forOwnRight;
        lodash.get = get;
        lodash.gt = gt;
        lodash.gte = gte;
        lodash.has = has;
        lodash.hasIn = hasIn;
        lodash.head = head;
        lodash.identity = identity;
        lodash.includes = includes;
        lodash.indexOf = indexOf;
        lodash.inRange = inRange;
        lodash.invoke = invoke;
        lodash.isArguments = isArguments;
        lodash.isArray = isArray;
        lodash.isArrayBuffer = isArrayBuffer;
        lodash.isArrayLike = isArrayLike;
        lodash.isArrayLikeObject = isArrayLikeObject;
        lodash.isBoolean = isBoolean;
        lodash.isBuffer = isBuffer;
        lodash.isDate = isDate;
        lodash.isElement = isElement;
        lodash.isEmpty = isEmpty;
        lodash.isEqual = isEqual;
        lodash.isEqualWith = isEqualWith;
        lodash.isError = isError;
        lodash.isFinite = isFinite;
        lodash.isFunction = isFunction;
        lodash.isInteger = isInteger;
        lodash.isLength = isLength;
        lodash.isMap = isMap;
        lodash.isMatch = isMatch;
        lodash.isMatchWith = isMatchWith;
        lodash.isNaN = isNaN2;
        lodash.isNative = isNative;
        lodash.isNil = isNil;
        lodash.isNull = isNull;
        lodash.isNumber = isNumber;
        lodash.isObject = isObject;
        lodash.isObjectLike = isObjectLike;
        lodash.isPlainObject = isPlainObject;
        lodash.isRegExp = isRegExp;
        lodash.isSafeInteger = isSafeInteger;
        lodash.isSet = isSet;
        lodash.isString = isString2;
        lodash.isSymbol = isSymbol;
        lodash.isTypedArray = isTypedArray;
        lodash.isUndefined = isUndefined;
        lodash.isWeakMap = isWeakMap;
        lodash.isWeakSet = isWeakSet;
        lodash.join = join;
        lodash.kebabCase = kebabCase;
        lodash.last = last;
        lodash.lastIndexOf = lastIndexOf;
        lodash.lowerCase = lowerCase;
        lodash.lowerFirst = lowerFirst;
        lodash.lt = lt;
        lodash.lte = lte;
        lodash.max = max;
        lodash.maxBy = maxBy;
        lodash.mean = mean;
        lodash.meanBy = meanBy;
        lodash.min = min;
        lodash.minBy = minBy;
        lodash.stubArray = stubArray;
        lodash.stubFalse = stubFalse;
        lodash.stubObject = stubObject;
        lodash.stubString = stubString;
        lodash.stubTrue = stubTrue;
        lodash.multiply = multiply;
        lodash.nth = nth;
        lodash.noConflict = noConflict;
        lodash.noop = noop;
        lodash.now = now;
        lodash.pad = pad;
        lodash.padEnd = padEnd;
        lodash.padStart = padStart;
        lodash.parseInt = parseInt2;
        lodash.random = random;
        lodash.reduce = reduce;
        lodash.reduceRight = reduceRight;
        lodash.repeat = repeat;
        lodash.replace = replace2;
        lodash.result = result;
        lodash.round = round;
        lodash.runInContext = runInContext2;
        lodash.sample = sample;
        lodash.size = size;
        lodash.snakeCase = snakeCase;
        lodash.some = some;
        lodash.sortedIndex = sortedIndex;
        lodash.sortedIndexBy = sortedIndexBy;
        lodash.sortedIndexOf = sortedIndexOf;
        lodash.sortedLastIndex = sortedLastIndex;
        lodash.sortedLastIndexBy = sortedLastIndexBy;
        lodash.sortedLastIndexOf = sortedLastIndexOf;
        lodash.startCase = startCase;
        lodash.startsWith = startsWith;
        lodash.subtract = subtract;
        lodash.sum = sum;
        lodash.sumBy = sumBy;
        lodash.template = template;
        lodash.times = times;
        lodash.toFinite = toFinite;
        lodash.toInteger = toInteger;
        lodash.toLength = toLength;
        lodash.toLower = toLower;
        lodash.toNumber = toNumber;
        lodash.toSafeInteger = toSafeInteger;
        lodash.toString = toString;
        lodash.toUpper = toUpper;
        lodash.trim = trim2;
        lodash.trimEnd = trimEnd;
        lodash.trimStart = trimStart;
        lodash.truncate = truncate;
        lodash.unescape = unescape;
        lodash.uniqueId = uniqueId;
        lodash.upperCase = upperCase;
        lodash.upperFirst = upperFirst;
        lodash.each = forEach;
        lodash.eachRight = forEachRight;
        lodash.first = head;
        mixin(lodash, (function() {
          var source = {};
          baseForOwn(lodash, function(func, methodName) {
            if (!hasOwnProperty2.call(lodash.prototype, methodName)) {
              source[methodName] = func;
            }
          });
          return source;
        })(), { "chain": false });
        lodash.VERSION = VERSION;
        arrayEach(["bind", "bindKey", "curry", "curryRight", "partial", "partialRight"], function(methodName) {
          lodash[methodName].placeholder = lodash;
        });
        arrayEach(["drop", "take"], function(methodName, index) {
          LazyWrapper.prototype[methodName] = function(n) {
            n = n === undefined2 ? 1 : nativeMax(toInteger(n), 0);
            var result2 = this.__filtered__ && !index ? new LazyWrapper(this) : this.clone();
            if (result2.__filtered__) {
              result2.__takeCount__ = nativeMin(n, result2.__takeCount__);
            } else {
              result2.__views__.push({
                "size": nativeMin(n, MAX_ARRAY_LENGTH),
                "type": methodName + (result2.__dir__ < 0 ? "Right" : "")
              });
            }
            return result2;
          };
          LazyWrapper.prototype[methodName + "Right"] = function(n) {
            return this.reverse()[methodName](n).reverse();
          };
        });
        arrayEach(["filter", "map", "takeWhile"], function(methodName, index) {
          var type = index + 1, isFilter = type == LAZY_FILTER_FLAG || type == LAZY_WHILE_FLAG;
          LazyWrapper.prototype[methodName] = function(iteratee2) {
            var result2 = this.clone();
            result2.__iteratees__.push({
              "iteratee": getIteratee(iteratee2, 3),
              "type": type
            });
            result2.__filtered__ = result2.__filtered__ || isFilter;
            return result2;
          };
        });
        arrayEach(["head", "last"], function(methodName, index) {
          var takeName = "take" + (index ? "Right" : "");
          LazyWrapper.prototype[methodName] = function() {
            return this[takeName](1).value()[0];
          };
        });
        arrayEach(["initial", "tail"], function(methodName, index) {
          var dropName = "drop" + (index ? "" : "Right");
          LazyWrapper.prototype[methodName] = function() {
            return this.__filtered__ ? new LazyWrapper(this) : this[dropName](1);
          };
        });
        LazyWrapper.prototype.compact = function() {
          return this.filter(identity);
        };
        LazyWrapper.prototype.find = function(predicate) {
          return this.filter(predicate).head();
        };
        LazyWrapper.prototype.findLast = function(predicate) {
          return this.reverse().find(predicate);
        };
        LazyWrapper.prototype.invokeMap = baseRest(function(path, args) {
          if (typeof path == "function") {
            return new LazyWrapper(this);
          }
          return this.map(function(value) {
            return baseInvoke(value, path, args);
          });
        });
        LazyWrapper.prototype.reject = function(predicate) {
          return this.filter(negate(getIteratee(predicate)));
        };
        LazyWrapper.prototype.slice = function(start, end) {
          start = toInteger(start);
          var result2 = this;
          if (result2.__filtered__ && (start > 0 || end < 0)) {
            return new LazyWrapper(result2);
          }
          if (start < 0) {
            result2 = result2.takeRight(-start);
          } else if (start) {
            result2 = result2.drop(start);
          }
          if (end !== undefined2) {
            end = toInteger(end);
            result2 = end < 0 ? result2.dropRight(-end) : result2.take(end - start);
          }
          return result2;
        };
        LazyWrapper.prototype.takeRightWhile = function(predicate) {
          return this.reverse().takeWhile(predicate).reverse();
        };
        LazyWrapper.prototype.toArray = function() {
          return this.take(MAX_ARRAY_LENGTH);
        };
        baseForOwn(LazyWrapper.prototype, function(func, methodName) {
          var checkIteratee = /^(?:filter|find|map|reject)|While$/.test(methodName), isTaker = /^(?:head|last)$/.test(methodName), lodashFunc = lodash[isTaker ? "take" + (methodName == "last" ? "Right" : "") : methodName], retUnwrapped = isTaker || /^find/.test(methodName);
          if (!lodashFunc) {
            return;
          }
          lodash.prototype[methodName] = function() {
            var value = this.__wrapped__, args = isTaker ? [1] : arguments, isLazy = value instanceof LazyWrapper, iteratee2 = args[0], useLazy = isLazy || isArray(value);
            var interceptor = function(value2) {
              var result3 = lodashFunc.apply(lodash, arrayPush([value2], args));
              return isTaker && chainAll ? result3[0] : result3;
            };
            if (useLazy && checkIteratee && typeof iteratee2 == "function" && iteratee2.length != 1) {
              isLazy = useLazy = false;
            }
            var chainAll = this.__chain__, isHybrid = !!this.__actions__.length, isUnwrapped = retUnwrapped && !chainAll, onlyLazy = isLazy && !isHybrid;
            if (!retUnwrapped && useLazy) {
              value = onlyLazy ? value : new LazyWrapper(this);
              var result2 = func.apply(value, args);
              result2.__actions__.push({ "func": thru, "args": [interceptor], "thisArg": undefined2 });
              return new LodashWrapper(result2, chainAll);
            }
            if (isUnwrapped && onlyLazy) {
              return func.apply(this, args);
            }
            result2 = this.thru(interceptor);
            return isUnwrapped ? isTaker ? result2.value()[0] : result2.value() : result2;
          };
        });
        arrayEach(["pop", "push", "shift", "sort", "splice", "unshift"], function(methodName) {
          var func = arrayProto[methodName], chainName = /^(?:push|sort|unshift)$/.test(methodName) ? "tap" : "thru", retUnwrapped = /^(?:pop|shift)$/.test(methodName);
          lodash.prototype[methodName] = function() {
            var args = arguments;
            if (retUnwrapped && !this.__chain__) {
              var value = this.value();
              return func.apply(isArray(value) ? value : [], args);
            }
            return this[chainName](function(value2) {
              return func.apply(isArray(value2) ? value2 : [], args);
            });
          };
        });
        baseForOwn(LazyWrapper.prototype, function(func, methodName) {
          var lodashFunc = lodash[methodName];
          if (lodashFunc) {
            var key = lodashFunc.name + "";
            if (!hasOwnProperty2.call(realNames, key)) {
              realNames[key] = [];
            }
            realNames[key].push({ "name": methodName, "func": lodashFunc });
          }
        });
        realNames[createHybrid(undefined2, WRAP_BIND_KEY_FLAG).name] = [{
          "name": "wrapper",
          "func": undefined2
        }];
        LazyWrapper.prototype.clone = lazyClone;
        LazyWrapper.prototype.reverse = lazyReverse;
        LazyWrapper.prototype.value = lazyValue;
        lodash.prototype.at = wrapperAt;
        lodash.prototype.chain = wrapperChain;
        lodash.prototype.commit = wrapperCommit;
        lodash.prototype.next = wrapperNext;
        lodash.prototype.plant = wrapperPlant;
        lodash.prototype.reverse = wrapperReverse;
        lodash.prototype.toJSON = lodash.prototype.valueOf = lodash.prototype.value = wrapperValue;
        lodash.prototype.first = lodash.prototype.head;
        if (symIterator) {
          lodash.prototype[symIterator] = wrapperToIterator;
        }
        return lodash;
      });
      var _ = runInContext();
      if (typeof define == "function" && typeof define.amd == "object" && define.amd) {
        root._ = _;
        define(function() {
          return _;
        });
      } else if (freeModule) {
        (freeModule.exports = _)._ = _;
        freeExports._ = _;
      } else {
        root._ = _;
      }
    }).call(exports);
  }
});

// node_modules/retry/lib/retry_operation.js
var require_retry_operation = __commonJS({
  "node_modules/retry/lib/retry_operation.js"(exports, module) {
    function RetryOperation(timeouts, options) {
      if (typeof options === "boolean") {
        options = { forever: options };
      }
      this._originalTimeouts = JSON.parse(JSON.stringify(timeouts));
      this._timeouts = timeouts;
      this._options = options || {};
      this._maxRetryTime = options && options.maxRetryTime || Infinity;
      this._fn = null;
      this._errors = [];
      this._attempts = 1;
      this._operationTimeout = null;
      this._operationTimeoutCb = null;
      this._timeout = null;
      this._operationStart = null;
      this._timer = null;
      if (this._options.forever) {
        this._cachedTimeouts = this._timeouts.slice(0);
      }
    }
    module.exports = RetryOperation;
    RetryOperation.prototype.reset = function() {
      this._attempts = 1;
      this._timeouts = this._originalTimeouts.slice(0);
    };
    RetryOperation.prototype.stop = function() {
      if (this._timeout) {
        clearTimeout(this._timeout);
      }
      if (this._timer) {
        clearTimeout(this._timer);
      }
      this._timeouts = [];
      this._cachedTimeouts = null;
    };
    RetryOperation.prototype.retry = function(err) {
      if (this._timeout) {
        clearTimeout(this._timeout);
      }
      if (!err) {
        return false;
      }
      var currentTime = (/* @__PURE__ */ new Date()).getTime();
      if (err && currentTime - this._operationStart >= this._maxRetryTime) {
        this._errors.push(err);
        this._errors.unshift(new Error("RetryOperation timeout occurred"));
        return false;
      }
      this._errors.push(err);
      var timeout = this._timeouts.shift();
      if (timeout === void 0) {
        if (this._cachedTimeouts) {
          this._errors.splice(0, this._errors.length - 1);
          timeout = this._cachedTimeouts.slice(-1);
        } else {
          return false;
        }
      }
      var self2 = this;
      this._timer = setTimeout(function() {
        self2._attempts++;
        if (self2._operationTimeoutCb) {
          self2._timeout = setTimeout(function() {
            self2._operationTimeoutCb(self2._attempts);
          }, self2._operationTimeout);
          if (self2._options.unref) {
            self2._timeout.unref();
          }
        }
        self2._fn(self2._attempts);
      }, timeout);
      if (this._options.unref) {
        this._timer.unref();
      }
      return true;
    };
    RetryOperation.prototype.attempt = function(fn, timeoutOps) {
      this._fn = fn;
      if (timeoutOps) {
        if (timeoutOps.timeout) {
          this._operationTimeout = timeoutOps.timeout;
        }
        if (timeoutOps.cb) {
          this._operationTimeoutCb = timeoutOps.cb;
        }
      }
      var self2 = this;
      if (this._operationTimeoutCb) {
        this._timeout = setTimeout(function() {
          self2._operationTimeoutCb();
        }, self2._operationTimeout);
      }
      this._operationStart = (/* @__PURE__ */ new Date()).getTime();
      this._fn(this._attempts);
    };
    RetryOperation.prototype.try = function(fn) {
      console.log("Using RetryOperation.try() is deprecated");
      this.attempt(fn);
    };
    RetryOperation.prototype.start = function(fn) {
      console.log("Using RetryOperation.start() is deprecated");
      this.attempt(fn);
    };
    RetryOperation.prototype.start = RetryOperation.prototype.try;
    RetryOperation.prototype.errors = function() {
      return this._errors;
    };
    RetryOperation.prototype.attempts = function() {
      return this._attempts;
    };
    RetryOperation.prototype.mainError = function() {
      if (this._errors.length === 0) {
        return null;
      }
      var counts = {};
      var mainError = null;
      var mainErrorCount = 0;
      for (var i2 = 0; i2 < this._errors.length; i2++) {
        var error = this._errors[i2];
        var message = error.message;
        var count = (counts[message] || 0) + 1;
        counts[message] = count;
        if (count >= mainErrorCount) {
          mainError = error;
          mainErrorCount = count;
        }
      }
      return mainError;
    };
  }
});

// node_modules/retry/lib/retry.js
var require_retry = __commonJS({
  "node_modules/retry/lib/retry.js"(exports) {
    var RetryOperation = require_retry_operation();
    exports.operation = function(options) {
      var timeouts = exports.timeouts(options);
      return new RetryOperation(timeouts, {
        forever: options && (options.forever || options.retries === Infinity),
        unref: options && options.unref,
        maxRetryTime: options && options.maxRetryTime
      });
    };
    exports.timeouts = function(options) {
      if (options instanceof Array) {
        return [].concat(options);
      }
      var opts = {
        retries: 10,
        factor: 2,
        minTimeout: 1 * 1e3,
        maxTimeout: Infinity,
        randomize: false
      };
      for (var key in options) {
        opts[key] = options[key];
      }
      if (opts.minTimeout > opts.maxTimeout) {
        throw new Error("minTimeout is greater than maxTimeout");
      }
      var timeouts = [];
      for (var i2 = 0; i2 < opts.retries; i2++) {
        timeouts.push(this.createTimeout(i2, opts));
      }
      if (options && options.forever && !timeouts.length) {
        timeouts.push(this.createTimeout(i2, opts));
      }
      timeouts.sort(function(a, b2) {
        return a - b2;
      });
      return timeouts;
    };
    exports.createTimeout = function(attempt, opts) {
      var random = opts.randomize ? Math.random() + 1 : 1;
      var timeout = Math.round(random * Math.max(opts.minTimeout, 1) * Math.pow(opts.factor, attempt));
      timeout = Math.min(timeout, opts.maxTimeout);
      return timeout;
    };
    exports.wrap = function(obj, options, methods) {
      if (options instanceof Array) {
        methods = options;
        options = null;
      }
      if (!methods) {
        methods = [];
        for (var key in obj) {
          if (typeof obj[key] === "function") {
            methods.push(key);
          }
        }
      }
      for (var i2 = 0; i2 < methods.length; i2++) {
        var method = methods[i2];
        var original = obj[method];
        obj[method] = function retryWrapper(original2) {
          var op = exports.operation(options);
          var args = Array.prototype.slice.call(arguments, 1);
          var callback = args.pop();
          args.push(function(err) {
            if (op.retry(err)) {
              return;
            }
            if (err) {
              arguments[0] = op.mainError();
            }
            callback.apply(this, arguments);
          });
          op.attempt(function() {
            original2.apply(obj, args);
          });
        }.bind(obj, original);
        obj[method].options = options;
      }
    };
  }
});

// node_modules/retry/index.js
var require_retry2 = __commonJS({
  "node_modules/retry/index.js"(exports, module) {
    module.exports = require_retry();
  }
});

// node_modules/async-retry/lib/index.js
var require_lib = __commonJS({
  "node_modules/async-retry/lib/index.js"(exports, module) {
    var retrier = require_retry2();
    function retry(fn, opts) {
      function run(resolve, reject) {
        var options = opts || {};
        var op;
        if (!("randomize" in options)) {
          options.randomize = true;
        }
        op = retrier.operation(options);
        function bail(err) {
          reject(err || new Error("Aborted"));
        }
        function onError(err, num) {
          if (err.bail) {
            bail(err);
            return;
          }
          if (!op.retry(err)) {
            reject(op.mainError());
          } else if (options.onRetry) {
            options.onRetry(err, num);
          }
        }
        function runAttempt(num) {
          var val;
          try {
            val = fn(bail, num);
          } catch (err) {
            onError(err, num);
            return;
          }
          Promise.resolve(val).then(resolve).catch(function catchIt(err) {
            onError(err, num);
          });
        }
        op.attempt(runAttempt);
      }
      return new Promise(run);
    }
    module.exports = retry;
  }
});

// src/client/world-client.js
import * as THREE from "three";
import { useEffect as useEffect33, useMemo as useMemo9, useRef as useRef13, useState as useState36, createElement as h2 } from "react";

// node_modules/@firebolt-dev/css/dist/index.js
import { forwardRef as x } from "react";

// node_modules/stylis/src/Enum.js
var MS = "-ms-";
var MOZ = "-moz-";
var WEBKIT = "-webkit-";
var COMMENT = "comm";
var RULESET = "rule";
var DECLARATION = "decl";
var IMPORT = "@import";
var NAMESPACE = "@namespace";
var KEYFRAMES = "@keyframes";
var LAYER = "@layer";

// node_modules/stylis/src/Utility.js
var abs = Math.abs;
var from = String.fromCharCode;
var assign = Object.assign;
function hash(value, length2) {
  return charat(value, 0) ^ 45 ? (((length2 << 2 ^ charat(value, 0)) << 2 ^ charat(value, 1)) << 2 ^ charat(value, 2)) << 2 ^ charat(value, 3) : 0;
}
function trim(value) {
  return value.trim();
}
function match(value, pattern) {
  return (value = pattern.exec(value)) ? value[0] : value;
}
function replace(value, pattern, replacement) {
  return value.replace(pattern, replacement);
}
function indexof(value, search, position2) {
  return value.indexOf(search, position2);
}
function charat(value, index) {
  return value.charCodeAt(index) | 0;
}
function substr(value, begin, end) {
  return value.slice(begin, end);
}
function strlen(value) {
  return value.length;
}
function sizeof(value) {
  return value.length;
}
function append(value, array) {
  return array.push(value), value;
}
function combine(array, callback) {
  return array.map(callback).join("");
}
function filter(array, pattern) {
  return array.filter(function(value) {
    return !match(value, pattern);
  });
}

// node_modules/stylis/src/Tokenizer.js
var line = 1;
var column = 1;
var length = 0;
var position = 0;
var character = 0;
var characters = "";
function node(value, root, parent, type, props, children, length2, siblings) {
  return { value, root, parent, type, props, children, line, column, length: length2, return: "", siblings };
}
function copy(root, props) {
  return assign(node("", null, null, "", null, null, 0, root.siblings), root, { length: -root.length }, props);
}
function lift(root) {
  while (root.root)
    root = copy(root.root, { children: [root] });
  append(root, root.siblings);
}
function char() {
  return character;
}
function prev() {
  character = position > 0 ? charat(characters, --position) : 0;
  if (column--, character === 10)
    column = 1, line--;
  return character;
}
function next() {
  character = position < length ? charat(characters, position++) : 0;
  if (column++, character === 10)
    column = 1, line++;
  return character;
}
function peek() {
  return charat(characters, position);
}
function caret() {
  return position;
}
function slice(begin, end) {
  return substr(characters, begin, end);
}
function token(type) {
  switch (type) {
    // \0 \t \n \r \s whitespace token
    case 0:
    case 9:
    case 10:
    case 13:
    case 32:
      return 5;
    // ! + , / > @ ~ isolate token
    case 33:
    case 43:
    case 44:
    case 47:
    case 62:
    case 64:
    case 126:
    // ; { } breakpoint token
    case 59:
    case 123:
    case 125:
      return 4;
    // : accompanied token
    case 58:
      return 3;
    // " ' ( [ opening delimit token
    case 34:
    case 39:
    case 40:
    case 91:
      return 2;
    // ) ] closing delimit token
    case 41:
    case 93:
      return 1;
  }
  return 0;
}
function alloc(value) {
  return line = column = 1, length = strlen(characters = value), position = 0, [];
}
function dealloc(value) {
  return characters = "", value;
}
function delimit(type) {
  return trim(slice(position - 1, delimiter(type === 91 ? type + 2 : type === 40 ? type + 1 : type)));
}
function whitespace(type) {
  while (character = peek())
    if (character < 33)
      next();
    else
      break;
  return token(type) > 2 || token(character) > 3 ? "" : " ";
}
function escaping(index, count) {
  while (--count && next())
    if (character < 48 || character > 102 || character > 57 && character < 65 || character > 70 && character < 97)
      break;
  return slice(index, caret() + (count < 6 && peek() == 32 && next() == 32));
}
function delimiter(type) {
  while (next())
    switch (character) {
      // ] ) " '
      case type:
        return position;
      // " '
      case 34:
      case 39:
        if (type !== 34 && type !== 39)
          delimiter(character);
        break;
      // (
      case 40:
        if (type === 41)
          delimiter(type);
        break;
      // \
      case 92:
        next();
        break;
    }
  return position;
}
function commenter(type, index) {
  while (next())
    if (type + character === 47 + 10)
      break;
    else if (type + character === 42 + 42 && peek() === 47)
      break;
  return "/*" + slice(index, position - 1) + "*" + from(type === 47 ? type : next());
}
function identifier(index) {
  while (!token(peek()))
    next();
  return slice(index, position);
}

// node_modules/stylis/src/Parser.js
function compile(value) {
  return dealloc(parse("", null, null, null, [""], value = alloc(value), 0, [0], value));
}
function parse(value, root, parent, rule, rules, rulesets, pseudo, points, declarations) {
  var index = 0;
  var offset = 0;
  var length2 = pseudo;
  var atrule = 0;
  var property = 0;
  var previous = 0;
  var variable = 1;
  var scanning = 1;
  var ampersand = 1;
  var character2 = 0;
  var type = "";
  var props = rules;
  var children = rulesets;
  var reference = rule;
  var characters2 = type;
  while (scanning)
    switch (previous = character2, character2 = next()) {
      // (
      case 40:
        if (previous != 108 && charat(characters2, length2 - 1) == 58) {
          if (indexof(characters2 += replace(delimit(character2), "&", "&\f"), "&\f", abs(index ? points[index - 1] : 0)) != -1)
            ampersand = -1;
          break;
        }
      // " ' [
      case 34:
      case 39:
      case 91:
        characters2 += delimit(character2);
        break;
      // \t \n \r \s
      case 9:
      case 10:
      case 13:
      case 32:
        characters2 += whitespace(previous);
        break;
      // \
      case 92:
        characters2 += escaping(caret() - 1, 7);
        continue;
      // /
      case 47:
        switch (peek()) {
          case 42:
          case 47:
            append(comment(commenter(next(), caret()), root, parent, declarations), declarations);
            if ((token(previous || 1) == 5 || token(peek() || 1) == 5) && strlen(characters2) && substr(characters2, -1, void 0) !== " ") characters2 += " ";
            break;
          default:
            characters2 += "/";
        }
        break;
      // {
      case 123 * variable:
        points[index++] = strlen(characters2) * ampersand;
      // } ; \0
      case 125 * variable:
      case 59:
      case 0:
        switch (character2) {
          // \0 }
          case 0:
          case 125:
            scanning = 0;
          // ;
          case 59 + offset:
            if (ampersand == -1) characters2 = replace(characters2, /\f/g, "");
            if (property > 0 && (strlen(characters2) - length2 || variable === 0 && previous === 47))
              append(property > 32 ? declaration(characters2 + ";", rule, parent, length2 - 1, declarations) : declaration(replace(characters2, " ", "") + ";", rule, parent, length2 - 2, declarations), declarations);
            break;
          // @ ;
          case 59:
            characters2 += ";";
          // { rule/at-rule
          default:
            append(reference = ruleset(characters2, root, parent, index, offset, rules, points, type, props = [], children = [], length2, rulesets), rulesets);
            if (character2 === 123)
              if (offset === 0)
                parse(characters2, root, reference, reference, props, rulesets, length2, points, children);
              else {
                switch (atrule) {
                  // c(ontainer)
                  case 99:
                    if (charat(characters2, 3) === 110) break;
                  // l(ayer)
                  case 108:
                    if (charat(characters2, 2) === 97) break;
                  default:
                    offset = 0;
                  // d(ocument) m(edia) s(upports)
                  case 100:
                  case 109:
                  case 115:
                }
                if (offset) parse(value, reference, reference, rule && append(ruleset(value, reference, reference, 0, 0, rules, points, type, rules, props = [], length2, children), children), rules, children, length2, points, rule ? props : children);
                else parse(characters2, reference, reference, reference, [""], children, 0, points, children);
              }
        }
        index = offset = property = 0, variable = ampersand = 1, type = characters2 = "", length2 = pseudo;
        break;
      // :
      case 58:
        length2 = 1 + strlen(characters2), property = previous;
      default:
        if (variable < 1) {
          if (character2 == 123)
            --variable;
          else if (character2 == 125 && variable++ == 0 && prev() == 125)
            continue;
        }
        switch (characters2 += from(character2), character2 * variable) {
          // &
          case 38:
            ampersand = offset > 0 ? 1 : (characters2 += "\f", -1);
            break;
          // ,
          case 44:
            points[index++] = (strlen(characters2) - 1) * ampersand, ampersand = 1;
            break;
          // @
          case 64:
            if (peek() === 45)
              characters2 += delimit(next());
            atrule = peek(), offset = length2 = strlen(type = characters2 += identifier(caret())), character2++;
            break;
          // -
          case 45:
            if (previous === 45 && strlen(characters2) == 2)
              variable = 0;
        }
    }
  return rulesets;
}
function ruleset(value, root, parent, index, offset, rules, points, type, props, children, length2, siblings) {
  var post = offset - 1;
  var rule = offset === 0 ? rules : [""];
  var size = sizeof(rule);
  for (var i2 = 0, j = 0, k = 0; i2 < index; ++i2)
    for (var x2 = 0, y = substr(value, post + 1, post = abs(j = points[i2])), z = value; x2 < size; ++x2)
      if (z = trim(j > 0 ? rule[x2] + " " + y : replace(y, /&\f/g, rule[x2])))
        props[k++] = z;
  return node(value, root, parent, offset === 0 ? RULESET : type, props, children, length2, siblings);
}
function comment(value, root, parent, siblings) {
  return node(value, root, parent, COMMENT, from(char()), substr(value, 2, -2), 0, siblings);
}
function declaration(value, root, parent, length2, siblings) {
  return node(value, root, parent, DECLARATION, substr(value, 0, length2), substr(value, length2 + 1, -1), length2, siblings);
}

// node_modules/stylis/src/Prefixer.js
function prefix(value, length2, children) {
  switch (hash(value, length2)) {
    // color-adjust
    case 5103:
      return WEBKIT + "print-" + value + value;
    // animation, animation-(delay|direction|duration|fill-mode|iteration-count|name|play-state|timing-function)
    case 5737:
    case 4201:
    case 3177:
    case 3433:
    case 1641:
    case 4457:
    case 2921:
    // text-decoration, filter, clip-path, backface-visibility, column, box-decoration-break
    case 5572:
    case 6356:
    case 5844:
    case 3191:
    case 6645:
    case 3005:
    // background-clip, columns, column-(count|fill|gap|rule|rule-color|rule-style|rule-width|span|width)
    case 4215:
    case 6389:
    case 5109:
    case 5365:
    case 5621:
    case 3829:
    // mask, mask-image, mask-(mode|clip|size), mask-(repeat|origin), mask-position
    case 6391:
    case 5879:
    case 5623:
    case 6135:
    case 4599:
      return WEBKIT + value + value;
    // mask-composite
    case 4855:
      return WEBKIT + value.replace("add", "source-over").replace("substract", "source-out").replace("intersect", "source-in").replace("exclude", "xor") + value;
    // tab-size
    case 4789:
      return MOZ + value + value;
    // appearance, user-select, transform, hyphens, text-size-adjust
    case 5349:
    case 4246:
    case 4810:
    case 6968:
    case 2756:
      return WEBKIT + value + MOZ + value + MS + value + value;
    // writing-mode
    case 5936:
      switch (charat(value, length2 + 11)) {
        // vertical-l(r)
        case 114:
          return WEBKIT + value + MS + replace(value, /[svh]\w+-[tblr]{2}/, "tb") + value;
        // vertical-r(l)
        case 108:
          return WEBKIT + value + MS + replace(value, /[svh]\w+-[tblr]{2}/, "tb-rl") + value;
        // horizontal(-)tb
        case 45:
          return WEBKIT + value + MS + replace(value, /[svh]\w+-[tblr]{2}/, "lr") + value;
      }
    // flex, flex-direction, scroll-snap-type, writing-mode
    case 6828:
    case 4268:
    case 2903:
      return WEBKIT + value + MS + value + value;
    // order
    case 6165:
      return WEBKIT + value + MS + "flex-" + value + value;
    // align-items
    case 5187:
      return WEBKIT + value + replace(value, /(\w+).+(:[^]+)/, WEBKIT + "box-$1$2" + MS + "flex-$1$2") + value;
    // align-self
    case 5443:
      return WEBKIT + value + MS + "flex-item-" + replace(value, /flex-|-self/g, "") + (!match(value, /flex-|baseline/) ? MS + "grid-row-" + replace(value, /flex-|-self/g, "") : "") + value;
    // align-content
    case 4675:
      return WEBKIT + value + MS + "flex-line-pack" + replace(value, /align-content|flex-|-self/g, "") + value;
    // flex-shrink
    case 5548:
      return WEBKIT + value + MS + replace(value, "shrink", "negative") + value;
    // flex-basis
    case 5292:
      return WEBKIT + value + MS + replace(value, "basis", "preferred-size") + value;
    // flex-grow
    case 6060:
      return WEBKIT + "box-" + replace(value, "-grow", "") + WEBKIT + value + MS + replace(value, "grow", "positive") + value;
    // transition
    case 4554:
      return WEBKIT + replace(value, /([^-])(transform)/g, "$1" + WEBKIT + "$2") + value;
    // cursor
    case 6187:
      return replace(replace(replace(value, /(zoom-|grab)/, WEBKIT + "$1"), /(image-set)/, WEBKIT + "$1"), value, "") + value;
    // background, background-image
    case 5495:
    case 3959:
      return replace(value, /(image-set\([^]*)/, WEBKIT + "$1$`$1");
    // justify-content
    case 4968:
      return replace(replace(value, /(.+:)(flex-)?(.*)/, WEBKIT + "box-pack:$3" + MS + "flex-pack:$3"), /space-between/, "justify") + WEBKIT + value + value;
    // justify-self
    case 4200:
      if (!match(value, /flex-|baseline/)) return MS + "grid-column-align" + substr(value, length2) + value;
      break;
    // grid-template-(columns|rows)
    case 2592:
    case 3360:
      return MS + replace(value, "template-", "") + value;
    // grid-(row|column)-start
    case 4384:
    case 3616:
      if (children && children.some(function(element, index) {
        return length2 = index, match(element.props, /grid-\w+-end/);
      })) {
        return ~indexof(value + (children = children[length2].value), "span", 0) ? value : MS + replace(value, "-start", "") + value + MS + "grid-row-span:" + (~indexof(children, "span", 0) ? match(children, /\d+/) : +match(children, /\d+/) - +match(value, /\d+/)) + ";";
      }
      return MS + replace(value, "-start", "") + value;
    // grid-(row|column)-end
    case 4896:
    case 4128:
      return children && children.some(function(element) {
        return match(element.props, /grid-\w+-start/);
      }) ? value : MS + replace(replace(value, "-end", "-span"), "span ", "") + value;
    // (margin|padding)-inline-(start|end)
    case 4095:
    case 3583:
    case 4068:
    case 2532:
      return replace(value, /(.+)-inline(.+)/, WEBKIT + "$1$2") + value;
    // (min|max)?(width|height|inline-size|block-size)
    case 8116:
    case 7059:
    case 5753:
    case 5535:
    case 5445:
    case 5701:
    case 4933:
    case 4677:
    case 5533:
    case 5789:
    case 5021:
    case 4765:
      if (strlen(value) - 1 - length2 > 6)
        switch (charat(value, length2 + 1)) {
          // (m)ax-content, (m)in-content
          case 109:
            if (charat(value, length2 + 4) !== 45)
              break;
          // (f)ill-available, (f)it-content
          case 102:
            return replace(value, /(.+:)(.+)-([^]+)/, "$1" + WEBKIT + "$2-$3$1" + MOZ + (charat(value, length2 + 3) == 108 ? "$3" : "$2-$3")) + value;
          // (s)tretch
          case 115:
            return ~indexof(value, "stretch", 0) ? prefix(replace(value, "stretch", "fill-available"), length2, children) + value : value;
        }
      break;
    // grid-(column|row)
    case 5152:
    case 5920:
      return replace(value, /(.+?):(\d+)(\s*\/\s*(span)?\s*(\d+))?(.*)/, function(_, a, b2, c2, d, e, f) {
        return MS + a + ":" + b2 + f + (c2 ? MS + a + "-span:" + (d ? e : +e - +b2) + f : "") + value;
      });
    // position: sticky
    case 4949:
      if (charat(value, length2 + 6) === 121)
        return replace(value, ":", ":" + WEBKIT) + value;
      break;
    // display: (flex|inline-flex|grid|inline-grid)
    case 6444:
      switch (charat(value, charat(value, 14) === 45 ? 18 : 11)) {
        // (inline-)?fle(x)
        case 120:
          return replace(value, /(.+:)([^;\s!]+)(;|(\s+)?!.+)?/, "$1" + WEBKIT + (charat(value, 14) === 45 ? "inline-" : "") + "box$3$1" + WEBKIT + "$2$3$1" + MS + "$2box$3") + value;
        // (inline-)?gri(d)
        case 100:
          return replace(value, ":", ":" + MS) + value;
      }
      break;
    // scroll-margin, scroll-margin-(top|right|bottom|left)
    case 5719:
    case 2647:
    case 2135:
    case 3927:
    case 2391:
      return replace(value, "scroll-", "scroll-snap-") + value;
  }
  return value;
}

// node_modules/stylis/src/Serializer.js
function serialize(children, callback) {
  var output = "";
  for (var i2 = 0; i2 < children.length; i2++)
    output += callback(children[i2], i2, children, callback) || "";
  return output;
}
function stringify(element, index, children, callback) {
  switch (element.type) {
    case LAYER:
      if (element.children.length) break;
    case IMPORT:
    case NAMESPACE:
    case DECLARATION:
      return element.return = element.return || element.value;
    case COMMENT:
      return "";
    case KEYFRAMES:
      return element.return = element.value + "{" + serialize(element.children, callback) + "}";
    case RULESET:
      if (!strlen(element.value = element.props.join(","))) return "";
  }
  return strlen(children = serialize(element.children, callback)) ? element.return = element.value + "{" + children + "}" : "";
}

// node_modules/stylis/src/Middleware.js
function middleware(collection) {
  var length2 = sizeof(collection);
  return function(element, index, children, callback) {
    var output = "";
    for (var i2 = 0; i2 < length2; i2++)
      output += collection[i2](element, index, children, callback) || "";
    return output;
  };
}
function prefixer(element, index, children, callback) {
  if (element.length > -1) {
    if (!element.return)
      switch (element.type) {
        case DECLARATION:
          element.return = prefix(element.value, element.length, children);
          return;
        case KEYFRAMES:
          return serialize([copy(element, { value: replace(element.value, "@", "@" + WEBKIT) })], callback);
        case RULESET:
          if (element.length)
            return combine(children = element.props, function(value) {
              switch (match(value, callback = /(::plac\w+|:read-\w+)/)) {
                // :read-(only|write)
                case ":read-only":
                case ":read-write":
                  lift(copy(element, { props: [replace(value, /:(read-\w+)/, ":" + MOZ + "$1")] }));
                  lift(copy(element, { props: [value] }));
                  assign(element, { props: filter(children, callback) });
                  break;
                // :placeholder
                case "::placeholder":
                  lift(copy(element, { props: [replace(value, /:(plac\w+)/, ":" + WEBKIT + "input-$1")] }));
                  lift(copy(element, { props: [replace(value, /:(plac\w+)/, ":" + MOZ + "$1")] }));
                  lift(copy(element, { props: [replace(value, /:(plac\w+)/, MS + "input-$1")] }));
                  lift(copy(element, { props: [value] }));
                  assign(element, { props: filter(children, callback) });
                  break;
              }
              return "";
            });
      }
  }
}

// node_modules/@firebolt-dev/css/dist/index.js
import { Fragment as b, jsx as h, jsxs as S } from "react/jsx-runtime";
function i(t) {
  for (var e = 0, n, o = 0, r = t.length; r >= 4; ++o, r -= 4) n = t.charCodeAt(o) & 255 | (t.charCodeAt(++o) & 255) << 8 | (t.charCodeAt(++o) & 255) << 16 | (t.charCodeAt(++o) & 255) << 24, n = (n & 65535) * 1540483477 + ((n >>> 16) * 59797 << 16), n ^= n >>> 24, e = (n & 65535) * 1540483477 + ((n >>> 16) * 59797 << 16) ^ (e & 65535) * 1540483477 + ((e >>> 16) * 59797 << 16);
  switch (r) {
    case 3:
      e ^= (t.charCodeAt(o + 2) & 255) << 16;
    case 2:
      e ^= (t.charCodeAt(o + 1) & 255) << 8;
    case 1:
      e ^= t.charCodeAt(o) & 255, e = (e & 65535) * 1540483477 + ((e >>> 16) * 59797 << 16);
  }
  return e ^= e >>> 13, e = (e & 65535) * 1540483477 + ((e >>> 16) * 59797 << 16), ((e ^ e >>> 15) >>> 0).toString(36);
}
var c = "__FIREBOLT_COMPONENT__";
var l = {};
var w = (t) => {
  let e = t;
  if (l[e]) return l[e];
  let n = i(t), o = `_${n}`, r = `.${o} { ${t} }`, a = serialize(compile(r), middleware([prefixer, stringify])), s = { hash: n, className: o, wrappedCSS: r, string: a, css: t, isStyle: true };
  return l[e] = s, s;
};
var N = x(function(e, n) {
  let o = e[c], r = e.css;
  if (typeof r != "string") throw new Error("invalid css prop value");
  let a = w(r), s = {};
  for (let f in e) hasOwnProperty.call(e, f) && f !== "css" && f !== c && (s[f] = e[f]);
  return s.ref = n, s.className = `${a.className} ${e.className || ""}`, S(b, { children: [h("style", { href: a.hash, precedence: "medium", dangerouslySetInnerHTML: { __html: a.string } }), h(o, { ...s })] });
});
function O(t, ...e) {
  let n = t[0];
  for (let o = 0; o < e.length; o++) {
    let r = e[o];
    r && (r.isStyle && (r = r.css), n += r + t[o + 1]);
  }
  return n;
}

// src/core/plugins/PluginManager.js
var PluginManager = class extends BaseManager {
  constructor() {
    super(null, "PluginManager");
    this.plugins = /* @__PURE__ */ new Map();
    this.hooks = /* @__PURE__ */ new Map();
    this.assetHandlers = /* @__PURE__ */ new Map();
    this.networkHandlers = /* @__PURE__ */ new Map();
    this.scriptGlobals = /* @__PURE__ */ new Map();
    this.serverRoutes = /* @__PURE__ */ new Map();
  }
  register(name, plugin) {
    if (this.plugins.has(name)) {
      this.logger.warn("Plugin already registered", { name });
      return false;
    }
    if (!plugin || typeof plugin !== "object") {
      this.logger.error("Invalid plugin object", { name });
      return false;
    }
    this.plugins.set(name, {
      name,
      version: plugin.version || "1.0.0",
      init: plugin.init || (() => {
      }),
      start: plugin.start || (() => {
      }),
      destroy: plugin.destroy || (() => {
      }),
      api: plugin.api || null
    });
    this.logger.info("Plugin registered", { name, version: plugin.version });
    return true;
  }
  unregister(name) {
    const plugin = this.plugins.get(name);
    if (!plugin) return false;
    plugin.destroy?.();
    this.plugins.delete(name);
    this.assetHandlers.forEach((handlers, type) => {
      if (handlers.has(name)) {
        handlers.delete(name);
      }
    });
    this.networkHandlers.forEach((handlers, msg) => {
      if (handlers.has(name)) {
        handlers.delete(name);
      }
    });
    this.scriptGlobals.forEach((values, id) => {
      if (values.plugin === name) {
        this.scriptGlobals.delete(id);
      }
    });
    this.serverRoutes.forEach((routes, path) => {
      if (routes.plugin === name) {
        this.serverRoutes.delete(path);
      }
    });
    this.logger.info("Plugin unregistered", { name });
    return true;
  }
  getPlugin(name) {
    return this.plugins.get(name);
  }
  getAllPlugins() {
    return Array.from(this.plugins.values());
  }
  registerAssetHandler(pluginName, type, handler) {
    if (!this.plugins.has(pluginName)) {
      this.logger.error("Plugin not registered", { pluginName });
      return false;
    }
    if (!this.assetHandlers.has(type)) {
      this.assetHandlers.set(type, /* @__PURE__ */ new Map());
    }
    this.assetHandlers.get(type).set(pluginName, handler);
    this.logger.info("Asset handler registered", { pluginName, type });
    return true;
  }
  getAssetHandlers(type) {
    const handlers = this.assetHandlers.get(type);
    if (!handlers) return [];
    return Array.from(handlers.values());
  }
  registerNetworkHandler(pluginName, messageType, handler) {
    if (!this.plugins.has(pluginName)) {
      this.logger.error("Plugin not registered", { pluginName });
      return false;
    }
    if (!this.networkHandlers.has(messageType)) {
      this.networkHandlers.set(messageType, /* @__PURE__ */ new Map());
    }
    this.networkHandlers.get(messageType).set(pluginName, handler);
    this.logger.info("Network handler registered", { pluginName, messageType });
    return true;
  }
  getNetworkHandler(messageType) {
    const handlers = this.networkHandlers.get(messageType);
    if (!handlers || handlers.size === 0) return null;
    return handlers.values().next().value;
  }
  registerScriptGlobal(pluginName, name, value) {
    if (!this.plugins.has(pluginName)) {
      this.logger.error("Plugin not registered", { pluginName });
      return false;
    }
    const id = `${pluginName}:${name}`;
    this.scriptGlobals.set(id, {
      name,
      value,
      plugin: pluginName
    });
    this.logger.info("Script global registered", { pluginName, name });
    return true;
  }
  getScriptGlobals() {
    const globals = {};
    this.scriptGlobals.forEach(({ name, value }) => {
      globals[name] = value;
    });
    return globals;
  }
  registerServerRoute(pluginName, path, method, handler) {
    if (!this.plugins.has(pluginName)) {
      this.logger.error("Plugin not registered", { pluginName });
      return false;
    }
    const key = `${method}:${path}`;
    this.serverRoutes.set(key, {
      path,
      method: method.toUpperCase(),
      handler,
      plugin: pluginName
    });
    this.logger.info("Server route registered", { pluginName, path, method });
    return true;
  }
  getServerRoutes() {
    return Array.from(this.serverRoutes.values());
  }
  registerHook(name, type = "action") {
    if (this.hooks.has(name)) {
      this.logger.warn("Hook already registered", { name });
      return;
    }
    this.hooks.set(name, {
      name,
      type,
      before: [],
      action: [],
      after: [],
      filters: []
    });
  }
  before(hook, fn) {
    const hookData = this.hooks.get(hook);
    if (!hookData) {
      this.logger.warn("Hook does not exist", { hook });
      return;
    }
    hookData.before.push(fn);
    return () => {
      const idx = hookData.before.indexOf(fn);
      if (idx !== -1) hookData.before.splice(idx, 1);
    };
  }
  after(hook, fn) {
    const hookData = this.hooks.get(hook);
    if (!hookData) {
      this.logger.warn("Hook does not exist", { hook });
      return;
    }
    hookData.after.push(fn);
    return () => {
      const idx = hookData.after.indexOf(fn);
      if (idx !== -1) hookData.after.splice(idx, 1);
    };
  }
  filter(hook, fn) {
    const hookData = this.hooks.get(hook);
    if (!hookData) {
      this.logger.warn("Hook does not exist", { hook });
      return;
    }
    hookData.filters.push(fn);
    return () => {
      const idx = hookData.filters.indexOf(fn);
      if (idx !== -1) hookData.filters.splice(idx, 1);
    };
  }
  action(hook, fn) {
    const hookData = this.hooks.get(hook);
    if (!hookData) {
      this.logger.warn("Hook does not exist", { hook });
      return;
    }
    hookData.action.push(fn);
    return () => {
      const idx = hookData.action.indexOf(fn);
      if (idx !== -1) hookData.action.splice(idx, 1);
    };
  }
  async executeHook(hook, ...args) {
    const hookData = this.hooks.get(hook);
    if (!hookData) {
      this.logger.warn("Hook does not exist", { hook });
      return args[0];
    }
    try {
      for (const fn of hookData.before) {
        await Promise.resolve(fn(...args));
      }
      let result = args[0];
      for (const fn of hookData.filters) {
        result = await Promise.resolve(fn(result, ...args.slice(1)));
      }
      for (const fn of hookData.action) {
        await Promise.resolve(fn(result, ...args.slice(1)));
      }
      for (const fn of hookData.after) {
        await Promise.resolve(fn(result, ...args.slice(1)));
      }
      return result;
    } catch (error) {
      this.logger.error("Hook execution error", { hook, error: error.message });
      throw error;
    }
  }
  hook(name, fn) {
    if (!this.hooks.has(name)) {
      this.hooks.set(name, {
        name,
        type: "action",
        before: [],
        action: [],
        after: [],
        filters: []
      });
    }
    this.hooks.get(name).action.push(fn);
    return () => {
      const hooks = this.hooks.get(name);
      const idx = hooks.action.indexOf(fn);
      if (idx !== -1) hooks.action.splice(idx, 1);
    };
  }
  async execute(name, ...args) {
    const hooks = this.hooks.get(name);
    if (!hooks) return;
    for (const fn of hooks.action) {
      try {
        await Promise.resolve(fn(...args));
      } catch (error) {
        this.logger.error("Hook execution error", { hook: name, error: error.message });
      }
    }
  }
  listAllPlugins() {
    const list = [];
    this.plugins.forEach((plugin, name) => {
      list.push({
        name,
        version: plugin.version,
        enabled: plugin.enabled || false
      });
    });
    return list;
  }
  getPluginStats() {
    const all = this.plugins.size;
    const handlers = this.assetHandlers.size;
    const networkHandlers = this.networkHandlers.size;
    const globals = this.scriptGlobals.size;
    const routes = this.serverRoutes.size;
    const hooks = this.hooks.size;
    return {
      totalPlugins: all,
      assetHandlers: handlers,
      networkHandlers,
      scriptGlobals: globals,
      serverRoutes: routes,
      hooks
    };
  }
  isPluginLoaded(name) {
    return this.plugins.has(name);
  }
  isPluginEnabled(name) {
    const plugin = this.plugins.get(name);
    return plugin?.api?.enabled !== false;
  }
  getHooks() {
    return Array.from(this.hooks.keys());
  }
  getHookDetails(name) {
    const hook = this.hooks.get(name);
    if (!hook) return null;
    return {
      name: hook.name,
      type: hook.type,
      beforeCount: hook.before.length,
      afterCount: hook.after.length,
      filterCount: hook.filters.length,
      actionCount: hook.action.length
    };
  }
  getAllHooks() {
    const hooks = [];
    this.hooks.forEach((hook, name) => {
      hooks.push({
        name,
        type: hook.type,
        handlers: hook.before.length + hook.after.length + hook.action.length + hook.filters.length
      });
    });
    return hooks;
  }
  getHookCount(name) {
    const hook = this.hooks.get(name);
    if (!hook) return 0;
    return hook.before.length + hook.after.length + hook.action.length + hook.filters.length;
  }
  hasHook(name) {
    return this.hooks.has(name);
  }
  async initInternal() {
  }
  async destroyInternal() {
    for (const plugin of this.plugins.values()) {
      plugin.destroy?.();
    }
    this.plugins.clear();
    this.hooks.clear();
    this.assetHandlers.clear();
    this.networkHandlers.clear();
    this.scriptGlobals.clear();
    this.serverRoutes.clear();
  }
};
var pluginManager = new PluginManager();

// src/core/plugins/PluginRegistry.js
var logger = new StructuredLogger("PluginRegistry");
var PluginRegistry = class {
  constructor() {
    this.plugins = /* @__PURE__ */ new Map();
    this.hooks = /* @__PURE__ */ new Map();
    this.assetHandlers = /* @__PURE__ */ new Map();
    this.networkHandlers = /* @__PURE__ */ new Map();
    this.scriptGlobals = /* @__PURE__ */ new Map();
    this.serverRoutes = /* @__PURE__ */ new Map();
  }
  register(name, plugin) {
    if (this.plugins.has(name)) {
      logger.warn("Plugin already registered", { name });
      return false;
    }
    if (!plugin || typeof plugin !== "object") {
      logger.error("Invalid plugin object", { name });
      return false;
    }
    this.plugins.set(name, {
      name,
      version: plugin.version || "1.0.0",
      init: plugin.init || (() => {
      }),
      start: plugin.start || (() => {
      }),
      destroy: plugin.destroy || (() => {
      }),
      api: plugin.api || null
    });
    logger.info("Plugin registered", { name, version: plugin.version });
    return true;
  }
  unregister(name) {
    const plugin = this.plugins.get(name);
    if (!plugin) return false;
    plugin.destroy?.();
    this.plugins.delete(name);
    this.assetHandlers.forEach((handlers, type) => {
      if (handlers.has(name)) {
        handlers.delete(name);
      }
    });
    this.networkHandlers.forEach((handlers, msg) => {
      if (handlers.has(name)) {
        handlers.delete(name);
      }
    });
    this.scriptGlobals.forEach((values, id) => {
      if (values.plugin === name) {
        this.scriptGlobals.delete(id);
      }
    });
    this.serverRoutes.forEach((routes, path) => {
      if (routes.plugin === name) {
        this.serverRoutes.delete(path);
      }
    });
    logger.info("Plugin unregistered", { name });
    return true;
  }
  getPlugin(name) {
    return this.plugins.get(name);
  }
  getAllPlugins() {
    return Array.from(this.plugins.values());
  }
  registerAssetHandler(pluginName, type, handler) {
    if (!this.plugins.has(pluginName)) {
      logger.error("Plugin not registered", { pluginName });
      return false;
    }
    if (!this.assetHandlers.has(type)) {
      this.assetHandlers.set(type, /* @__PURE__ */ new Map());
    }
    this.assetHandlers.get(type).set(pluginName, handler);
    logger.info("Asset handler registered", { pluginName, type });
    return true;
  }
  getAssetHandlers(type) {
    const handlers = this.assetHandlers.get(type);
    if (!handlers) return [];
    return Array.from(handlers.values());
  }
  registerNetworkHandler(pluginName, messageType, handler) {
    if (!this.plugins.has(pluginName)) {
      logger.error("Plugin not registered", { pluginName });
      return false;
    }
    if (!this.networkHandlers.has(messageType)) {
      this.networkHandlers.set(messageType, /* @__PURE__ */ new Map());
    }
    this.networkHandlers.get(messageType).set(pluginName, handler);
    logger.info("Network handler registered", { pluginName, messageType });
    return true;
  }
  getNetworkHandler(messageType) {
    const handlers = this.networkHandlers.get(messageType);
    if (!handlers || handlers.size === 0) return null;
    return handlers.values().next().value;
  }
  registerScriptGlobal(pluginName, name, value) {
    if (!this.plugins.has(pluginName)) {
      logger.error("Plugin not registered", { pluginName });
      return false;
    }
    const id = `${pluginName}:${name}`;
    this.scriptGlobals.set(id, {
      name,
      value,
      plugin: pluginName
    });
    logger.info("Script global registered", { pluginName, name });
    return true;
  }
  getScriptGlobals() {
    const globals = {};
    this.scriptGlobals.forEach(({ name, value }) => {
      globals[name] = value;
    });
    return globals;
  }
  registerServerRoute(pluginName, path, method, handler) {
    if (!this.plugins.has(pluginName)) {
      logger.error("Plugin not registered", { pluginName });
      return false;
    }
    const key = `${method}:${path}`;
    this.serverRoutes.set(key, {
      path,
      method: method.toUpperCase(),
      handler,
      plugin: pluginName
    });
    logger.info("Server route registered", { pluginName, path, method });
    return true;
  }
  getServerRoutes() {
    return Array.from(this.serverRoutes.values());
  }
  hook(name, fn) {
    if (!this.hooks.has(name)) {
      this.hooks.set(name, []);
    }
    this.hooks.get(name).push(fn);
    return () => {
      const hooks = this.hooks.get(name);
      const idx = hooks.indexOf(fn);
      if (idx !== -1) hooks.splice(idx, 1);
    };
  }
  async execute(name, ...args) {
    const hooks = this.hooks.get(name) || [];
    for (const fn of hooks) {
      try {
        await Promise.resolve(fn(...args));
      } catch (error) {
        logger.error("Hook execution error", { hook: name, error: error.message });
      }
    }
  }
  listAllPlugins() {
    const list = [];
    this.plugins.forEach((plugin, name) => {
      list.push({
        name,
        version: plugin.version,
        enabled: plugin.enabled || false
      });
    });
    return list;
  }
  getPluginStats() {
    const all = this.plugins.size;
    const handlers = this.assetHandlers.size;
    const networkHandlers = this.networkHandlers.size;
    const globals = this.scriptGlobals.size;
    const routes = this.serverRoutes.size;
    return {
      totalPlugins: all,
      assetHandlers: handlers,
      networkHandlers,
      scriptGlobals: globals,
      serverRoutes: routes
    };
  }
  isPluginLoaded(name) {
    return this.plugins.has(name);
  }
  isPluginEnabled(name) {
    const plugin = this.plugins.get(name);
    return plugin?.api?.enabled !== false;
  }
};
var pluginRegistry = new PluginRegistry();

// src/core/plugins/PluginHooks.js
var logger2 = new StructuredLogger("PluginHooks");
var PluginHooks = class {
  constructor() {
    this.hooks = /* @__PURE__ */ new Map();
  }
  register(name, type = "action") {
    if (this.hooks.has(name)) {
      logger2.warn("Hook already registered", { name });
      return;
    }
    this.hooks.set(name, {
      name,
      type,
      before: [],
      action: [],
      after: [],
      filters: []
    });
  }
  before(hook, fn) {
    const hookData = this.hooks.get(hook);
    if (!hookData) {
      logger2.warn("Hook does not exist", { hook });
      return;
    }
    hookData.before.push(fn);
    return () => {
      const idx = hookData.before.indexOf(fn);
      if (idx !== -1) hookData.before.splice(idx, 1);
    };
  }
  after(hook, fn) {
    const hookData = this.hooks.get(hook);
    if (!hookData) {
      logger2.warn("Hook does not exist", { hook });
      return;
    }
    hookData.after.push(fn);
    return () => {
      const idx = hookData.after.indexOf(fn);
      if (idx !== -1) hookData.after.splice(idx, 1);
    };
  }
  filter(hook, fn) {
    const hookData = this.hooks.get(hook);
    if (!hookData) {
      logger2.warn("Hook does not exist", { hook });
      return;
    }
    hookData.filters.push(fn);
    return () => {
      const idx = hookData.filters.indexOf(fn);
      if (idx !== -1) hookData.filters.splice(idx, 1);
    };
  }
  action(hook, fn) {
    const hookData = this.hooks.get(hook);
    if (!hookData) {
      logger2.warn("Hook does not exist", { hook });
      return;
    }
    hookData.action.push(fn);
    return () => {
      const idx = hookData.action.indexOf(fn);
      if (idx !== -1) hookData.action.splice(idx, 1);
    };
  }
  async execute(hook, ...args) {
    const hookData = this.hooks.get(hook);
    if (!hookData) {
      logger2.warn("Hook does not exist", { hook });
      return args[0];
    }
    try {
      for (const fn of hookData.before) {
        await Promise.resolve(fn(...args));
      }
      let result = args[0];
      for (const fn of hookData.filters) {
        result = await Promise.resolve(fn(result, ...args.slice(1)));
      }
      for (const fn of hookData.action) {
        await Promise.resolve(fn(result, ...args.slice(1)));
      }
      for (const fn of hookData.after) {
        await Promise.resolve(fn(result, ...args.slice(1)));
      }
      return result;
    } catch (error) {
      logger2.error("Hook execution error", { hook, error: error.message });
      throw error;
    }
  }
  getHooks() {
    return Array.from(this.hooks.keys());
  }
  getHookDetails(name) {
    const hook = this.hooks.get(name);
    if (!hook) return null;
    return {
      name: hook.name,
      type: hook.type,
      beforeCount: hook.before.length,
      afterCount: hook.after.length,
      filterCount: hook.filters.length,
      actionCount: hook.action.length
    };
  }
  getAllHooks() {
    const hooks = [];
    this.hooks.forEach((hook, name) => {
      hooks.push({
        name,
        type: hook.type,
        handlers: hook.before.length + hook.after.length + hook.action.length + hook.filters.length
      });
    });
    return hooks;
  }
  getHookCount(name) {
    const hook = this.hooks.get(name);
    if (!hook) return 0;
    return hook.before.length + hook.after.length + hook.action.length + hook.filters.length;
  }
  hasHook(name) {
    return this.hooks.has(name);
  }
};
var pluginHooks = new PluginHooks();

// src/core/plugins/PluginAPI.js
var logger3 = new StructuredLogger("PluginAPI");
function validateHandler(fn, name = "handler") {
  if (typeof fn !== "function") {
    throw new Error(`${name} must be a function`);
  }
}
function validateRoute(path, method, handler) {
  if (typeof path !== "string" || typeof method !== "string" || typeof handler !== "function") {
    throw new Error("Invalid route configuration");
  }
}
function validateMessageHandler(type, fn) {
  if (typeof type !== "string" || typeof fn !== "function") {
    throw new Error("Invalid message handler");
  }
}
var PluginAPI = class {
  constructor(world, pluginName) {
    this.world = world;
    this.pluginName = pluginName;
  }
  registerAssetHandler(type, handler) {
    try {
      validateHandler(handler, "asset handler");
    } catch (err) {
      logger3.error(err.message, { plugin: this.pluginName, type });
      return false;
    }
    return pluginRegistry.registerAssetHandler(this.pluginName, type, handler);
  }
  registerNetworkMessage(messageType, handler) {
    try {
      validateMessageHandler(messageType, handler);
    } catch (err) {
      logger3.error(err.message, { plugin: this.pluginName, messageType });
      return false;
    }
    return pluginRegistry.registerNetworkHandler(this.pluginName, messageType, handler);
  }
  registerScriptGlobal(name, value) {
    if (typeof name !== "string") {
      logger3.error("Invalid global name", { plugin: this.pluginName });
      return false;
    }
    return pluginRegistry.registerScriptGlobal(this.pluginName, name, value);
  }
  registerServerRoute(path, method, handler) {
    try {
      validateRoute(path, method, handler);
    } catch (err) {
      logger3.error(err.message, { plugin: this.pluginName, path, method });
      return false;
    }
    return pluginRegistry.registerServerRoute(this.pluginName, path, method, handler);
  }
  onWorldInit(fn) {
    try {
      validateHandler(fn);
    } catch (err) {
      logger3.error(err.message, { plugin: this.pluginName });
      return;
    }
    return pluginHooks.before("world:init", fn);
  }
  onWorldStart(fn) {
    try {
      validateHandler(fn);
    } catch (err) {
      logger3.error(err.message, { plugin: this.pluginName });
      return;
    }
    return pluginHooks.before("world:start", fn);
  }
  onWorldUpdate(fn) {
    try {
      validateHandler(fn);
    } catch (err) {
      logger3.error(err.message, { plugin: this.pluginName });
      return;
    }
    return pluginHooks.action("world:update", fn);
  }
  onEntityCreated(fn) {
    try {
      validateHandler(fn);
    } catch (err) {
      logger3.error(err.message, { plugin: this.pluginName });
      return;
    }
    return pluginHooks.after("entity:created", fn);
  }
  onEntityDestroyed(fn) {
    try {
      validateHandler(fn);
    } catch (err) {
      logger3.error(err.message, { plugin: this.pluginName });
      return;
    }
    return pluginHooks.before("entity:destroyed", fn);
  }
  onScriptError(fn) {
    try {
      validateHandler(fn);
    } catch (err) {
      logger3.error(err.message, { plugin: this.pluginName });
      return;
    }
    return pluginHooks.after("script:error", fn);
  }
  onNetworkMessage(messageType, fn) {
    try {
      validateMessageHandler(messageType, fn);
    } catch (err) {
      logger3.error(err.message, { plugin: this.pluginName, messageType });
      return;
    }
    return pluginHooks.before(`network:${messageType}`, fn);
  }
  filterAssetURL(fn) {
    try {
      validateHandler(fn, "filter handler");
    } catch (err) {
      logger3.error(err.message, { plugin: this.pluginName });
      return;
    }
    return pluginHooks.filter("asset:resolve", fn);
  }
  getSystem(name) {
    return this.world[name] || null;
  }
  getAllSystems() {
    const systems = {};
    const registryKeys = Object.keys(this.world);
    for (const key of registryKeys) {
      if (this.world[key] && typeof this.world[key] === "object") {
        systems[key] = this.world[key];
      }
    }
    return systems;
  }
  registerGlobalFunction(name, fn) {
    try {
      validateHandler(fn, "global function");
    } catch (err) {
      logger3.error(err.message, { plugin: this.pluginName, name });
      return false;
    }
    pluginRegistry.registerScriptGlobal(this.pluginName, name, fn);
    return true;
  }
  onAssetResolve(fn) {
    try {
      validateHandler(fn, "asset resolver");
    } catch (err) {
      logger3.error(err.message, { plugin: this.pluginName });
      return;
    }
    return pluginHooks.filter("asset:resolve", fn);
  }
  onWorldDestroy(fn) {
    try {
      validateHandler(fn);
    } catch (err) {
      logger3.error(err.message, { plugin: this.pluginName });
      return;
    }
    return pluginHooks.before("world:destroy", fn);
  }
  log(level, message, data) {
    const logFn = logger3[level] || logger3.info;
    logFn(`[${this.pluginName}] ${message}`, data);
  }
};
function createPluginAPI(world, pluginName) {
  return new PluginAPI(world, pluginName);
}

// src/core/plugins/index.js
var pluginRegistry2 = new PluginManager();
var pluginHooks2 = pluginHooks;

// src/core/performance/PerformanceBudget.js
var _PerformanceBudget = class _PerformanceBudget {
  static getBudget(category, path) {
    const categoryBudgets = this.BUDGETS[category];
    if (!categoryBudgets) return null;
    const keys = path.split(".");
    let current = categoryBudgets;
    for (const key of keys) {
      current = current?.[key];
      if (current === void 0) return null;
    }
    return current;
  }
  static isBudgetExceeded(category, path, actualTime) {
    const budget = this.getBudget(category, path);
    if (budget === null) return false;
    return actualTime > budget;
  }
  static getExcessAmount(category, path, actualTime) {
    const budget = this.getBudget(category, path);
    if (budget === null) return 0;
    return Math.max(0, actualTime - budget);
  }
  static getExcessPercentage(category, path, actualTime) {
    const budget = this.getBudget(category, path);
    if (budget === null || budget === 0) return 0;
    return (actualTime - budget) / budget * 100;
  }
};
__publicField(_PerformanceBudget, "FRAME_BUDGETS", {
  world: {
    phase: 1,
    total: 16.67
  },
  preTick: 0.5,
  preFixedUpdate: 0.5,
  fixedUpdate: 3,
  postFixedUpdate: 0.5,
  preUpdate: 0.5,
  update: 3,
  postUpdate: 0.5,
  lateUpdate: 3,
  postLateUpdate: 1,
  commit: 2,
  postTick: 0.5
});
__publicField(_PerformanceBudget, "SYSTEM_BUDGETS", {
  preTick: {
    clientGraphics: 0.1,
    animation: 0.2,
    physics: 0.2
  },
  fixedUpdate: {
    physics: 2
  },
  update: {
    clientNetwork: 0.5,
    controls: 0.3,
    animation: 0.2,
    builder: 0.5
  },
  lateUpdate: {
    clientGraphics: 0.5,
    stage: 0.3,
    animation: 0.2
  },
  postLateUpdate: {
    stage: 0.5
  }
});
__publicField(_PerformanceBudget, "ENTITY_BUDGETS", {
  hotIteration: {
    count: 50,
    timePerEntity: 0.02
  },
  playerLocal: {
    fixedUpdate: 0.5,
    update: 0.3,
    lateUpdate: 0.3
  }
});
__publicField(_PerformanceBudget, "INIT_BUDGETS", {
  world: 5e3,
  entitySpawn: 100,
  blueprintLoad: 2e3,
  snapshotProcess: 500,
  systemInit: {
    clientLoader: 2e3,
    clientGraphics: 1e3,
    stage: 500,
    physx: 1e3
  }
});
__publicField(_PerformanceBudget, "NETWORK_BUDGETS", {
  packetProcess: 50,
  handlerProcess: {
    entityAdded: 100,
    entityModified: 20,
    snapshot: 500,
    chatAdded: 10,
    blueprintModified: 50
  },
  upload: 3e4,
  assetPreload: 2e3
});
__publicField(_PerformanceBudget, "ASSET_BUDGETS", {
  modelLoad: 2e3,
  textureLoad: 500,
  scriptLoad: 100,
  avatarLoad: 1e3,
  emoteLoad: 500
});
__publicField(_PerformanceBudget, "BUDGETS", {
  FRAME: _PerformanceBudget.FRAME_BUDGETS,
  SYSTEM: _PerformanceBudget.SYSTEM_BUDGETS,
  ENTITY: _PerformanceBudget.ENTITY_BUDGETS,
  INIT: _PerformanceBudget.INIT_BUDGETS,
  NETWORK: _PerformanceBudget.NETWORK_BUDGETS,
  ASSET: _PerformanceBudget.ASSET_BUDGETS
});
var PerformanceBudget = _PerformanceBudget;

// src/core/performance/PerformanceMonitor.js
var logger4 = new StructuredLogger("PerformanceMonitor");
var PerformanceMonitor = class {
  constructor() {
    this.marks = /* @__PURE__ */ new Map();
    this.measurements = /* @__PURE__ */ new Map();
    this.violations = [];
    this.samples = {
      framePhases: new CircularBuffer(60),
      systemPhases: new CircularBuffer(60),
      entityOperations: new CircularBuffer(60)
    };
    this.enabled = true;
    this.sampleRate = 30, this.frameCount = 0;
  }
  start(label) {
    if (!this.enabled) return;
    const key = `__perf_${label}_${Date.now()}`;
    const mark = {
      label,
      startTime: performance.now(),
      key
    };
    this.marks.set(key, mark);
    return key;
  }
  end(key, category = null, path = null) {
    if (!this.enabled) return null;
    const mark = this.marks.get(key);
    if (!mark) {
      logger4.warn("Performance mark not found", { key });
      return null;
    }
    const duration = performance.now() - mark.startTime;
    this.marks.delete(key);
    const result = {
      label: mark.label,
      duration,
      category,
      path,
      timestamp: Date.now()
    };
    this.recordMeasurement(result);
    this.checkBudget(result);
    return duration;
  }
  measure(label, fn, category = null, path = null) {
    if (!this.enabled) {
      return fn();
    }
    const key = this.start(label);
    try {
      const result = fn();
      this.end(key, category, path);
      return result;
    } catch (error) {
      this.end(key, category, path);
      throw error;
    }
  }
  async measureAsync(label, fn, category = null, path = null) {
    if (!this.enabled) {
      return fn();
    }
    const key = this.start(label);
    try {
      const result = await fn();
      this.end(key, category, path);
      return result;
    } catch (error) {
      this.end(key, category, path);
      throw error;
    }
  }
  recordMeasurement(result) {
    if (!this.measurements.has(result.label)) {
      this.measurements.set(result.label, []);
    }
    const measurements = this.measurements.get(result.label);
    measurements.push({
      duration: result.duration,
      timestamp: result.timestamp
    });
    if (measurements.length > 1e3) {
      measurements.shift();
    }
  }
  checkBudget(result) {
    if (!result.category || !result.path) return;
    if (PerformanceBudget.isBudgetExceeded(result.category, result.path, result.duration)) {
      const excess = PerformanceBudget.getExcessAmount(result.category, result.path, result.duration);
      const percent = PerformanceBudget.getExcessPercentage(result.category, result.path, result.duration);
      const budget = PerformanceBudget.getBudget(result.category, result.path);
      const violation = {
        label: result.label,
        category: result.category,
        path: result.path,
        budget,
        actual: result.duration,
        excess,
        percent: percent.toFixed(1),
        timestamp: result.timestamp
      };
      this.violations.push(violation);
      if (this.violations.length > 100) {
        this.violations.shift();
      }
      if (this.violations.length % 10 === 0) {
        logger4.warn("Performance budget exceeded", {
          label: result.label,
          budget: `${budget}ms`,
          actual: `${result.duration.toFixed(2)}ms`,
          excess: `+${excess.toFixed(2)}ms (${percent.toFixed(1)}%)`
        });
      }
    }
  }
  recordFramePhase(phase, duration) {
    if (this.frameCount % this.sampleRate === 0) {
      this.samples.framePhases.push({
        phase,
        duration,
        timestamp: Date.now()
      });
    }
    this.frameCount++;
  }
  recordSystemPhase(system, phase, duration) {
    if (this.frameCount % this.sampleRate === 0) {
      this.samples.systemPhases.push({
        system,
        phase,
        duration,
        timestamp: Date.now()
      });
    }
  }
  recordEntityOperation(operation, duration, entityCount = 0) {
    if (this.frameCount % this.sampleRate === 0) {
      this.samples.entityOperations.push({
        operation,
        duration,
        entityCount,
        timestamp: Date.now()
      });
    }
  }
  getStats(label) {
    const measurements = this.measurements.get(label);
    if (!measurements || !measurements.length) {
      return null;
    }
    const durations = measurements.map((m) => m.duration);
    const sorted = [...durations].sort((a, b2) => a - b2);
    const sum = durations.reduce((a, b2) => a + b2, 0);
    return {
      label,
      count: durations.length,
      min: sorted[0],
      max: sorted[sorted.length - 1],
      mean: sum / durations.length,
      median: sorted[Math.floor(sorted.length / 2)],
      p95: sorted[Math.floor(sorted.length * 0.95)],
      p99: sorted[Math.floor(sorted.length * 0.99)]
    };
  }
  getAllStats() {
    const stats = {};
    for (const label of this.measurements.keys()) {
      stats[label] = this.getStats(label);
    }
    return stats;
  }
  getViolations(limit = 20) {
    return this.violations.slice(-limit);
  }
  getViolationSummary() {
    const summary = {};
    for (const violation of this.violations) {
      const key = `${violation.category}:${violation.path}`;
      if (!summary[key]) {
        summary[key] = {
          category: violation.category,
          path: violation.path,
          budget: violation.budget,
          count: 0,
          maxExcess: 0,
          totalExcess: 0
        };
      }
      summary[key].count++;
      summary[key].maxExcess = Math.max(summary[key].maxExcess, violation.excess);
      summary[key].totalExcess += violation.excess;
    }
    return Object.values(summary).sort((a, b2) => b2.totalExcess - a.totalExcess);
  }
  clear() {
    this.marks.clear();
    this.measurements.clear();
    this.violations = [];
    this.frameCount = 0;
  }
  enable() {
    this.enabled = true;
  }
  disable() {
    this.enabled = false;
  }
  setSampleRate(rate) {
    this.sampleRate = Math.max(1, rate);
  }
};
var CircularBuffer = class {
  constructor(size) {
    this.buffer = [];
    this.size = size;
    this.index = 0;
  }
  push(item) {
    if (this.buffer.length < this.size) {
      this.buffer.push(item);
    } else {
      this.buffer[this.index] = item;
    }
    this.index = (this.index + 1) % this.size;
  }
  getAll() {
    return [...this.buffer];
  }
  getLast(count) {
    const start = Math.max(0, this.buffer.length - count);
    return this.buffer.slice(start);
  }
  clear() {
    this.buffer = [];
    this.index = 0;
  }
};
var performanceMonitor = new PerformanceMonitor();

// src/core/memory/MemorySnapshot.js
var logger5 = new StructuredLogger("MemorySnapshot");
var MemorySnapshot = class _MemorySnapshot {
  constructor(label = null) {
    this.label = label || `snapshot-${Date.now()}`;
    this.timestamp = Date.now();
    this.heapData = this.captureHeap();
    this.objectCounts = this.countObjects();
    this.checksum = this.calculateChecksum();
  }
  captureHeap() {
    if (typeof process === "undefined" || !process.memoryUsage) {
      return null;
    }
    try {
      const usage = process.memoryUsage();
      return {
        rss: usage.rss,
        heapTotal: usage.heapTotal,
        heapUsed: usage.heapUsed,
        external: usage.external,
        arrayBuffers: usage.arrayBuffers || 0
      };
    } catch (error) {
      logger5.warn("Failed to capture heap data", { error: error.message });
      return null;
    }
  }
  countObjects() {
    const counts = {
      Map: 0,
      Set: 0,
      Array: 0,
      Object: 0,
      Function: 0,
      String: 0,
      Number: 0,
      Boolean: 0,
      Date: 0,
      RegExp: 0,
      Error: 0,
      WeakMap: 0,
      WeakSet: 0,
      WeakRef: 0,
      FinalizationRegistry: 0,
      Symbol: 0,
      BigInt: 0,
      Proxy: 0
    };
    try {
      if (typeof globalThis !== "undefined") {
        this.traverseObject(globalThis, counts, /* @__PURE__ */ new WeakSet(), 0, 100);
      }
    } catch (error) {
      logger5.warn("Failed to count objects", { error: error.message });
    }
    return counts;
  }
  traverseObject(obj, counts, visited, depth, maxDepth) {
    if (depth > maxDepth || visited.has(obj)) return;
    try {
      visited.add(obj);
      const type = obj.constructor.name;
      if (type in counts) {
        counts[type]++;
      }
      if (typeof obj === "object" && obj !== null && depth < maxDepth) {
        for (const key in obj) {
          try {
            const value = obj[key];
            if (typeof value === "object" && value !== null) {
              this.traverseObject(value, counts, visited, depth + 1, maxDepth);
            }
          } catch {
          }
        }
      }
    } catch {
    }
  }
  calculateChecksum() {
    const data = JSON.stringify({
      heapData: this.heapData,
      objectCounts: this.objectCounts,
      timestamp: this.timestamp
    });
    let hash2 = 0;
    for (let i2 = 0; i2 < data.length; i2++) {
      const char2 = data.charCodeAt(i2);
      hash2 = (hash2 << 5) - hash2 + char2;
      hash2 = hash2 & hash2;
    }
    return Math.abs(hash2).toString(16);
  }
  getHeapUsagePercent() {
    if (!this.heapData) return null;
    return this.heapData.heapUsed / this.heapData.heapTotal * 100;
  }
  getObjectCountSum() {
    return Object.values(this.objectCounts).reduce((a, b2) => a + b2, 0);
  }
  getMetadata() {
    return {
      label: this.label,
      timestamp: this.timestamp,
      heapUsagePercent: this.getHeapUsagePercent(),
      totalObjects: this.getObjectCountSum(),
      checksum: this.checksum
    };
  }
  export() {
    return {
      label: this.label,
      timestamp: this.timestamp,
      heapData: this.heapData,
      objectCounts: this.objectCounts,
      checksum: this.checksum,
      metadata: this.getMetadata()
    };
  }
  static import(data) {
    const snapshot = Object.create(_MemorySnapshot.prototype);
    snapshot.label = data.label;
    snapshot.timestamp = data.timestamp;
    snapshot.heapData = data.heapData;
    snapshot.objectCounts = data.objectCounts;
    snapshot.checksum = data.checksum;
    return snapshot;
  }
};

// src/core/memory/MemoryAnalyzer.js
var logger6 = new StructuredLogger("MemoryAnalyzer");
var MemoryAnalyzer = class {
  constructor(maxSnapshots = 20) {
    this.snapshots = [];
    this.maxSnapshots = maxSnapshots;
    this.leakCandidates = /* @__PURE__ */ new Map();
    this.allocationTrends = /* @__PURE__ */ new Map();
  }
  takeSnapshot(label) {
    const snapshot = new MemorySnapshot(label);
    this.snapshots.push(snapshot);
    if (this.snapshots.length > this.maxSnapshots) {
      this.snapshots.shift();
    }
    return snapshot;
  }
  getSnapshot(index) {
    if (index < 0 || index >= this.snapshots.length) return null;
    return this.snapshots[index];
  }
  getAllSnapshots() {
    return [...this.snapshots];
  }
  compareSnapshots(index1, index2) {
    const snap1 = this.getSnapshot(index1);
    const snap2 = this.getSnapshot(index2);
    if (!snap1 || !snap2) {
      logger6.warn("Invalid snapshot indices", { index1, index2 });
      return null;
    }
    return this.calculateDelta(snap1, snap2);
  }
  calculateDelta(snap1, snap2) {
    const delta = {
      timeElapsed: snap2.timestamp - snap1.timestamp,
      heapDelta: null,
      objectCountDeltas: {},
      leakLikelyhood: 0
    };
    if (snap1.heapData && snap2.heapData) {
      delta.heapDelta = {
        rssDelta: snap2.heapData.rss - snap1.heapData.rss,
        heapUsedDelta: snap2.heapData.heapUsed - snap1.heapData.heapUsed,
        heapTotalDelta: snap2.heapData.heapTotal - snap1.heapData.heapTotal,
        externalDelta: snap2.heapData.external - snap1.heapData.external,
        percentChange: (snap2.heapData.heapUsed - snap1.heapData.heapUsed) / snap1.heapData.heapUsed * 100
      };
    }
    for (const type in snap1.objectCounts) {
      const count1 = snap1.objectCounts[type];
      const count2 = snap2.objectCounts[type];
      delta.objectCountDeltas[type] = {
        delta: count2 - count1,
        percentChange: count1 > 0 ? (count2 - count1) / count1 * 100 : 0
      };
    }
    delta.leakLikelyhood = this.assessLeakLikelyhood(delta);
    return delta;
  }
  assessLeakLikelyhood(delta) {
    let score = 0;
    if (delta.heapDelta) {
      const heapChangePercent = Math.abs(delta.heapDelta.percentChange);
      if (heapChangePercent > 20) score += 30;
      if (heapChangePercent > 50) score += 20;
      if (heapChangePercent > 100) score += 20;
      if (delta.heapDelta.percentChange > 0) score += 10;
    }
    for (const type in delta.objectCountDeltas) {
      const typeChange = delta.objectCountDeltas[type].percentChange;
      if (typeChange > 50) score += 5;
      if (typeChange > 100) score += 10;
    }
    return Math.min(100, score);
  }
  detectLeaks() {
    const leaks = [];
    if (this.snapshots.length < 3) {
      logger6.warn("Not enough snapshots to detect leaks (need 3+)");
      return leaks;
    }
    const durations = [];
    for (let i2 = 1; i2 < this.snapshots.length; i2++) {
      const delta = this.calculateDelta(this.snapshots[i2 - 1], this.snapshots[i2]);
      durations.push(delta);
    }
    const consistentGrowth = this.analyzeConsistentGrowth(durations);
    const steadyAccumulation = this.analyzeSteadyAccumulation(durations);
    if (consistentGrowth) leaks.push(consistentGrowth);
    if (steadyAccumulation) leaks.push(steadyAccumulation);
    return leaks;
  }
  analyzeConsistentGrowth(deltas) {
    let positiveCount = 0;
    let totalDelta = 0;
    for (const delta of deltas) {
      if (delta.heapDelta && delta.heapDelta.percentChange > 5) {
        positiveCount++;
        totalDelta += delta.heapDelta.heapUsedDelta;
      }
    }
    const consistencyRatio = positiveCount / deltas.length;
    if (consistencyRatio > 0.7 && totalDelta > 1024 * 1024) {
      return {
        type: "CONSISTENT_GROWTH",
        severity: Math.min(100, totalDelta / (1024 * 1024) * 10),
        description: `Heap consistently growing (${(totalDelta / (1024 * 1024)).toFixed(2)}MB total)`,
        consistencyRatio,
        positiveSnapshots: positiveCount,
        totalSnapshots: deltas.length
      };
    }
    return null;
  }
  analyzeSteadyAccumulation(deltas) {
    const objectTypeAccumulation = {};
    for (const delta of deltas) {
      for (const type in delta.objectCountDeltas) {
        if (!objectTypeAccumulation[type]) {
          objectTypeAccumulation[type] = { positive: 0, total: 0, maxDelta: 0 };
        }
        const typeDelta = delta.objectCountDeltas[type];
        objectTypeAccumulation[type].total++;
        if (typeDelta.delta > 0) {
          objectTypeAccumulation[type].positive++;
          objectTypeAccumulation[type].maxDelta = Math.max(objectTypeAccumulation[type].maxDelta, typeDelta.delta);
        }
      }
    }
    let suspiciousTypes = [];
    for (const type in objectTypeAccumulation) {
      const acc = objectTypeAccumulation[type];
      if (acc.positive / acc.total > 0.7 && acc.maxDelta > 100) {
        suspiciousTypes.push({
          type,
          ratio: acc.positive / acc.total,
          maxDelta: acc.maxDelta
        });
      }
    }
    if (suspiciousTypes.length > 0) {
      return {
        type: "STEADY_ACCUMULATION",
        severity: Math.min(100, suspiciousTypes.length * 15),
        description: `${suspiciousTypes.length} object type(s) accumulating steadily`,
        suspiciousTypes
      };
    }
    return null;
  }
  getGrowthRate(startIndex = 0, endIndex = -1) {
    if (endIndex === -1) endIndex = this.snapshots.length - 1;
    if (startIndex >= endIndex || startIndex < 0 || endIndex >= this.snapshots.length) {
      return null;
    }
    const snap1 = this.snapshots[startIndex];
    const snap2 = this.snapshots[endIndex];
    if (!snap1.heapData || !snap2.heapData) return null;
    const heapGrowth = snap2.heapData.heapUsed - snap1.heapData.heapUsed;
    const timeElapsed = snap2.timestamp - snap1.timestamp;
    return {
      heapGrowth,
      timeElapsed,
      growthPerSecond: heapGrowth / (timeElapsed / 1e3),
      growthPerMinute: heapGrowth / (timeElapsed / 1e3) * 60
    };
  }
  getObjectTypeGrowthTrend(type) {
    const trend = [];
    for (const snapshot of this.snapshots) {
      const count = snapshot.objectCounts[type] || 0;
      trend.push({
        label: snapshot.label,
        timestamp: snapshot.timestamp,
        count
      });
    }
    return trend;
  }
  getHeapTrend() {
    const trend = [];
    for (const snapshot of this.snapshots) {
      if (snapshot.heapData) {
        trend.push({
          label: snapshot.label,
          timestamp: snapshot.timestamp,
          heapUsed: snapshot.heapData.heapUsed,
          heapTotal: snapshot.heapData.heapTotal,
          usagePercent: snapshot.getHeapUsagePercent()
        });
      }
    }
    return trend;
  }
  getReport() {
    const report = {
      snapshotCount: this.snapshots.length,
      timespan: null,
      leaks: this.detectLeaks(),
      growthRate: this.getGrowthRate(),
      heapTrend: this.getHeapTrend(),
      objectTypesWithGrowth: []
    };
    if (this.snapshots.length > 1) {
      report.timespan = {
        start: this.snapshots[0].timestamp,
        end: this.snapshots[this.snapshots.length - 1].timestamp,
        duration: this.snapshots[this.snapshots.length - 1].timestamp - this.snapshots[0].timestamp
      };
    }
    for (const type in this.snapshots[0].objectCounts) {
      const trend = this.getObjectTypeGrowthTrend(type);
      const growth = trend[trend.length - 1].count - trend[0].count;
      if (growth > 0) {
        report.objectTypesWithGrowth.push({
          type,
          totalGrowth: growth,
          trend
        });
      }
    }
    report.objectTypesWithGrowth.sort((a, b2) => b2.totalGrowth - a.totalGrowth);
    return report;
  }
  clear() {
    this.snapshots = [];
    this.leakCandidates.clear();
    this.allocationTrends.clear();
  }
};
var memoryAnalyzer = new MemoryAnalyzer();

// src/core/events/EventAudit.js
var logger7 = new StructuredLogger("EventAudit");
var EventAudit = class {
  constructor() {
    this.emitters = /* @__PURE__ */ new Map();
    this.eventCounts = /* @__PURE__ */ new Map();
    this.eventHistory = /* @__PURE__ */ new Map();
    this.maxHistorySize = 100;
    this.isEnabled = false;
  }
  registerEmitter(name, emitter, eventNames = []) {
    const audit = {
      name,
      emitter,
      eventNames,
      totalListeners: 0,
      totalEvents: 0,
      createdAt: Date.now()
    };
    this.emitters.set(name, audit);
    logger7.info("Event emitter registered", { name, events: eventNames });
    return audit;
  }
  trackEvent(emitterName, eventName, data = null) {
    if (!this.isEnabled) return;
    const key = `${emitterName}:${eventName}`;
    if (!this.eventCounts.has(key)) {
      this.eventCounts.set(key, 0);
      this.eventHistory.set(key, []);
    }
    this.eventCounts.set(key, (this.eventCounts.get(key) || 0) + 1);
    const event = {
      emitter: emitterName,
      event: eventName,
      timestamp: Date.now(),
      dataSize: this.getDataSize(data)
    };
    const history = this.eventHistory.get(key);
    history.push(event);
    if (history.length > this.maxHistorySize) {
      history.shift();
    }
  }
  getDataSize(data) {
    if (data === null || data === void 0) return 0;
    if (typeof data === "string") return data.length;
    if (typeof data === "object") {
      try {
        return JSON.stringify(data).length;
      } catch {
        return 0;
      }
    }
    return 0;
  }
  getEmitterStats(name) {
    const audit = this.emitters.get(name);
    if (!audit) return null;
    const stats = {
      name,
      eventCount: 0,
      eventNames: audit.eventNames || [],
      events: {}
    };
    for (const [key, count] of this.eventCounts) {
      if (key.startsWith(name + ":")) {
        const eventName = key.substring(name.length + 1);
        stats.events[eventName] = count;
        stats.eventCount += count;
      }
    }
    return stats;
  }
  getAllStats() {
    const stats = {};
    for (const [name] of this.emitters) {
      stats[name] = this.getEmitterStats(name);
    }
    return stats;
  }
  getEventHistory(emitterName, eventName, limit = 20) {
    const key = `${emitterName}:${eventName}`;
    const history = this.eventHistory.get(key) || [];
    return history.slice(-limit);
  }
  getTopEvents(limit = 10) {
    const sorted = Array.from(this.eventCounts.entries()).sort((a, b2) => b2[1] - a[1]).slice(0, limit);
    return sorted.map(([key, count]) => {
      const [emitter, event] = key.split(":");
      return { emitter, event, count };
    });
  }
  getEventFrequency(emitterName, eventName, windowMs = 5e3) {
    const key = `${emitterName}:${eventName}`;
    const history = this.eventHistory.get(key) || [];
    const now = Date.now();
    const recentEvents = history.filter((e) => now - e.timestamp < windowMs);
    return {
      emitter: emitterName,
      event: eventName,
      frequencyPer5s: recentEvents.length,
      frequencyPerSecond: (recentEvents.length / (windowMs / 1e3)).toFixed(2)
    };
  }
  getAnomalies(threshold = 100) {
    const anomalies = [];
    for (const [key, count] of this.eventCounts) {
      if (count > threshold) {
        const [emitter, event] = key.split(":");
        anomalies.push({
          emitter,
          event,
          count,
          severity: count > threshold * 2 ? "critical" : "warning"
        });
      }
    }
    return anomalies.sort((a, b2) => b2.count - a.count);
  }
  getReport() {
    const report = {
      timestamp: (/* @__PURE__ */ new Date()).toISOString(),
      emittersCount: this.emitters.size,
      totalEventsFired: Array.from(this.eventCounts.values()).reduce((a, b2) => a + b2, 0),
      emitters: this.getAllStats(),
      topEvents: this.getTopEvents(20),
      anomalies: this.getAnomalies(100)
    };
    return report;
  }
  enable() {
    this.isEnabled = true;
    logger7.info("Event audit enabled");
  }
  disable() {
    this.isEnabled = false;
    logger7.info("Event audit disabled");
  }
  clear() {
    this.eventCounts.clear();
    this.eventHistory.clear();
  }
  reset() {
    this.emitters.clear();
    this.clear();
  }
};
var eventAudit = new EventAudit();

// src/core/events/EventRegistry.js
var logger8 = new StructuredLogger("EventRegistry");
var EventRegistry = class {
  constructor() {
    this.events = /* @__PURE__ */ new Map();
    this.schemas = /* @__PURE__ */ new Map();
    this.categories = /* @__PURE__ */ new Map();
  }
  registerEvent(name, options = {}) {
    const eventDef = {
      name,
      category: options.category || "general",
      description: options.description || "",
      dataSchema: options.dataSchema || null,
      allowBubble: options.allowBubble !== false,
      allowCancelable: options.allowCancelable !== false,
      deprecated: options.deprecated || false,
      replacedBy: options.replacedBy || null,
      version: options.version || "1.0.0"
    };
    this.events.set(name, eventDef);
    if (!this.categories.has(eventDef.category)) {
      this.categories.set(eventDef.category, []);
    }
    this.categories.get(eventDef.category).push(name);
    logger8.debug("Event registered", { name, category: eventDef.category });
    return eventDef;
  }
  registerEventSchema(name, schema) {
    this.schemas.set(name, schema);
    const event = this.events.get(name);
    if (event) {
      event.dataSchema = schema;
    }
    return this;
  }
  getEvent(name) {
    return this.events.get(name) || null;
  }
  getEventsByCategory(category) {
    const eventNames = this.categories.get(category) || [];
    return eventNames.map((name) => this.events.get(name));
  }
  getAllEvents() {
    return Array.from(this.events.values());
  }
  validateEventData(eventName, data) {
    const event = this.events.get(eventName);
    if (!event) {
      return { valid: false, error: `Event ${eventName} not registered` };
    }
    if (!event.dataSchema) {
      return { valid: true };
    }
    const schema = this.schemas.get(eventName);
    if (!schema) {
      return { valid: true };
    }
    try {
      const validate = this.createValidator(schema);
      const valid = validate(data);
      if (!valid) {
        return { valid: false, errors: validate.errors };
      }
      return { valid: true };
    } catch (error) {
      return { valid: false, error: error.message };
    }
  }
  createValidator(schema) {
    return (data) => {
      if (typeof data !== "object" || data === null) {
        return { errors: ["Data must be an object"], __errors: true };
      }
      const errors = [];
      for (const [key, requirement] of Object.entries(schema)) {
        const value = data[key];
        if (requirement.required && (value === null || value === void 0)) {
          errors.push(`Field ${key} is required`);
        }
        if (value !== null && value !== void 0 && requirement.type) {
          if (typeof value !== requirement.type) {
            errors.push(`Field ${key} must be ${requirement.type}, got ${typeof value}`);
          }
        }
      }
      return { errors, __errors: errors.length > 0 };
    };
  }
  deprecateEvent(oldName, newName) {
    const event = this.events.get(oldName);
    if (event) {
      event.deprecated = true;
      event.replacedBy = newName;
      logger8.warn("Event deprecated", { oldName, newName });
    }
  }
  getDeprecatedEvents() {
    return Array.from(this.events.values()).filter((e) => e.deprecated);
  }
  getEventDocumentation(eventName) {
    const event = this.events.get(eventName);
    if (!event) return null;
    const doc = {
      name: event.name,
      category: event.category,
      description: event.description,
      version: event.version,
      dataSchema: this.schemas.get(eventName) || null,
      bubbles: event.allowBubble,
      cancelable: event.allowCancelable,
      deprecated: event.deprecated,
      replacedBy: event.replacedBy
    };
    return doc;
  }
  getAllDocumentation() {
    const docs = {};
    for (const [name] of this.events) {
      docs[name] = this.getEventDocumentation(name);
    }
    return docs;
  }
  getDocumentationByCategory(category) {
    const eventNames = this.categories.get(category) || [];
    const docs = {};
    for (const name of eventNames) {
      docs[name] = this.getEventDocumentation(name);
    }
    return docs;
  }
  exportRegistry() {
    return {
      events: Array.from(this.events.values()),
      schemas: Object.fromEntries(this.schemas),
      categories: Object.fromEntries(this.categories),
      deprecated: this.getDeprecatedEvents(),
      totalEvents: this.events.size
    };
  }
};
var eventRegistry = new EventRegistry();

// src/core/World.js
var logger9 = new StructuredLogger("World");
var World = class extends eventemitter3_default {
  constructor() {
    super();
    __publicField(this, "tick", (time) => {
      this.preTick();
      time /= 1e3;
      let delta = time - this.time;
      if (delta < 0) delta = 0;
      if (delta > this.maxDeltaTime) {
        delta = this.maxDeltaTime;
      }
      this.frame++;
      this.time = time;
      this.accumulator += delta;
      const willFixedStep = this.accumulator >= this.fixedDeltaTime;
      this.preFixedUpdate(willFixedStep);
      while (this.accumulator >= this.fixedDeltaTime) {
        this.fixedUpdate(this.fixedDeltaTime);
        this.postFixedUpdate(this.fixedDeltaTime);
        this.accumulator -= this.fixedDeltaTime;
      }
      const alpha = this.accumulator / this.fixedDeltaTime;
      this.preUpdate(alpha);
      this.update(delta, alpha);
      this.postUpdate(delta);
      this.lateUpdate(delta, alpha);
      this.postLateUpdate(delta);
      this.commit();
      this.postTick();
    });
    __publicField(this, "setupMaterial", (material) => {
      this.environment.csm?.setupMaterial(material);
    });
    this.logger = logger9;
    this.maxDeltaTime = WorldConfig.MAX_DELTA_TIME;
    this.fixedDeltaTime = WorldConfig.FIXED_DELTA_TIME;
    this.frame = 0;
    this.time = 0;
    this.accumulator = 0;
    this.networkRate = 1 / 8;
    this.assetsUrl = null;
    this.assetsDir = null;
    this.hot = /* @__PURE__ */ new Set();
    this.pluginRegistry = pluginRegistry2;
    this.pluginHooks = pluginHooks2;
    this.initializeHooks();
    this.performanceMonitor = performanceMonitor;
    this.performanceBudget = PerformanceBudget;
    this.memoryAnalyzer = memoryAnalyzer;
    this.eventAudit = eventAudit;
    this.eventRegistry = eventRegistry;
    this.rig = new three_exports.Object3D();
    this.camera = new three_exports.PerspectiveCamera(70, 0, 0.2, 1200);
    this.rig.add(this.camera);
  }
  register(key, System2) {
    const system = new System2(this);
    this[key] = system;
    return system;
  }
  initializeHooks() {
    this.pluginHooks.register("world:init", "before");
    this.pluginHooks.register("world:start", "before");
    this.pluginHooks.register("world:update", "action");
    this.pluginHooks.register("world:destroy", "before");
    this.pluginHooks.register("entity:created", "after");
    this.pluginHooks.register("entity:destroyed", "before");
    this.pluginHooks.register("script:error", "after");
    this.pluginHooks.register("asset:resolve", "filter");
  }
  async initializePlugins(pluginList = []) {
    for (const pluginConfig of pluginList) {
      const { name, plugin } = pluginConfig;
      if (!plugin) continue;
      const api = createPluginAPI(this, name);
      plugin.api = api;
      try {
        if (plugin.init) {
          await Promise.resolve(plugin.init(api));
        }
        this.pluginRegistry.register(name, plugin);
        logger9.info("Plugin loaded", { name, version: plugin.version });
      } catch (error) {
        logger9.error("Plugin initialization failed", { name, error: error.message });
      }
    }
  }
  async init(options = {}) {
    this.storage = options.storage;
    this.assetsDir = options.assetsDir;
    this.assetsUrl = options.assetsUrl;
    if (options.plugins) {
      await this.initializePlugins(options.plugins);
    }
    await this.pluginHooks.execute("world:init", this);
    await this.initializeSystems(options);
    await this.startSystems();
    await this.pluginHooks.execute("world:start", this);
  }
  async initializeSystems(options = {}) {
    for (const key in this) {
      const system = this[key];
      if (system && typeof system.init === "function") {
        try {
          await system.init(options);
        } catch (err) {
          logger9.error(`System ${key} init failed`, { error: err.message });
        }
      }
    }
  }
  async startSystems() {
    for (const key in this) {
      const system = this[key];
      if (system && typeof system.start === "function") {
        try {
          await system.start();
        } catch (err) {
          logger9.error(`System ${key} start failed`, { error: err.message });
        }
      }
    }
  }
  invokeSystemLifecycle(method, ...args) {
    for (const key in this) {
      const system = this[key];
      system?.[method]?.(...args);
    }
  }
  invokeHotLifecycle(method, ...args) {
    for (const item of this.hot) {
      item[method]?.(...args);
    }
  }
  preTick() {
    this.invokeSystemLifecycle("preTick");
  }
  preFixedUpdate(willFixedStep) {
    this.invokeSystemLifecycle("preFixedUpdate", willFixedStep);
  }
  fixedUpdate(delta) {
    this.invokeHotLifecycle("fixedUpdate", delta);
    this.invokeSystemLifecycle("fixedUpdate", delta);
  }
  postFixedUpdate(delta) {
    this.invokeSystemLifecycle("postFixedUpdate", delta);
  }
  preUpdate(alpha) {
    this.invokeSystemLifecycle("preUpdate", alpha);
  }
  update(delta) {
    this.invokeHotLifecycle("update", delta);
    this.pluginHooks.execute("world:update", delta);
    const updateStart = performance.now();
    this.invokeSystemLifecycle("update", delta);
    const updateDuration = performance.now() - updateStart;
    if (this.frame % 30 === 0) {
      this.performanceMonitor.recordFramePhase("update", updateDuration);
    }
  }
  postUpdate(delta) {
    this.invokeSystemLifecycle("postUpdate", delta);
  }
  lateUpdate(delta) {
    this.invokeHotLifecycle("lateUpdate", delta);
    const lateUpdateStart = performance.now();
    this.invokeSystemLifecycle("lateUpdate", delta);
    const lateUpdateDuration = performance.now() - lateUpdateStart;
    if (this.frame % 30 === 0) {
      this.performanceMonitor.recordFramePhase("lateUpdate", lateUpdateDuration);
      this.performanceMonitor.recordEntityOperation("hot.lateUpdate", lateUpdateDuration, this.hot.size);
    }
  }
  postLateUpdate(delta) {
    this.invokeHotLifecycle("postLateUpdate", delta);
    this.invokeSystemLifecycle("postLateUpdate", delta);
  }
  commit() {
    this.invokeSystemLifecycle("commit");
  }
  postTick() {
    this.invokeSystemLifecycle("postTick");
  }
  setHot(item, hot) {
    if (hot) {
      this.hot.add(item);
    } else {
      this.hot.delete(item);
    }
  }
  resolveURL(url, allowLocal) {
    if (!url) return url;
    url = url.trim();
    if (url.startsWith("blob")) {
      return url;
    }
    if (url.startsWith("asset://")) {
      const assetPath = url.slice(8);
      if (this.assetsDir && allowLocal) {
        return this.assetsDir + "/" + assetPath;
      } else if (this.assetsUrl) {
        return this.assetsUrl + "/" + assetPath;
      } else {
        logger9.error("resolveURL: no assetsUrl or assetsDir defined", { url });
        return url;
      }
    }
    if (url.match(/^https?:\/\//i)) {
      return url;
    }
    if (url.startsWith("//")) {
      return `https:${url}`;
    }
    if (url.startsWith("/")) {
      return url;
    }
    return `https://${url}`;
  }
  inject(runtime) {
    this.apps.inject(runtime);
  }
  getPlugin(name) {
    return this.pluginRegistry.getPlugin(name);
  }
  listPlugins() {
    return this.pluginRegistry.listAllPlugins();
  }
  getPluginStats() {
    return this.pluginRegistry.getPluginStats();
  }
  isPluginLoaded(name) {
    return this.pluginRegistry.isPluginLoaded(name);
  }
  getPluginAPI(name) {
    const plugin = this.pluginRegistry.getPlugin(name);
    return plugin?.api || null;
  }
  getAllHooks() {
    return this.pluginHooks.getAllHooks();
  }
  getHookCount(name) {
    return this.pluginHooks.getHookCount(name);
  }
  async loadDefaultPlugins() {
    const { createDefaultPlugins } = await import("./defaultPlugins-J63TCOBV.js");
    const plugins = createDefaultPlugins(this);
    await this.initializePlugins(plugins);
    return plugins;
  }
  isPluginEnabled(name) {
    return this.pluginRegistry.isPluginEnabled(name);
  }
  enablePlugin(name) {
    const plugin = this.pluginRegistry.getPlugin(name);
    if (plugin?.enable) {
      plugin.enable();
      return true;
    }
    return false;
  }
  disablePlugin(name) {
    const plugin = this.pluginRegistry.getPlugin(name);
    if (plugin?.disable) {
      plugin.disable();
      return true;
    }
    return false;
  }
  destroy() {
    this.pluginHooks.execute("world:destroy", this);
    this.pluginRegistry.getAllPlugins().forEach((plugin) => {
      this.pluginRegistry.unregister(plugin.name);
    });
    this.destroySystems();
  }
  destroySystems() {
    for (const key in this) {
      const system = this[key];
      if (system && typeof system.destroy === "function") {
        try {
          system.destroy();
        } catch (err) {
          logger9.error(`System ${key} destroy failed`, { error: err.message });
        }
      }
    }
  }
};

// src/client/components/CoreUI.js
import { useEffect as useEffect32, useRef as useRef12, useState as useState35 } from "react";

// src/client/components/AvatarPane.js
import { useEffect as useEffect2, useRef, useState } from "react";

// node_modules/lucide-react/dist/esm/createLucideIcon.js
import { forwardRef as forwardRef2, createElement as createElement2 } from "react";

// node_modules/lucide-react/dist/esm/shared/src/utils.js
var toKebabCase = (string) => string.replace(/([a-z0-9])([A-Z])/g, "$1-$2").toLowerCase();
var mergeClasses = (...classes) => classes.filter((className, index, array) => {
  return Boolean(className) && className.trim() !== "" && array.indexOf(className) === index;
}).join(" ").trim();

// node_modules/lucide-react/dist/esm/Icon.js
import { forwardRef, createElement } from "react";

// node_modules/lucide-react/dist/esm/defaultAttributes.js
var defaultAttributes = {
  xmlns: "http://www.w3.org/2000/svg",
  width: 24,
  height: 24,
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 2,
  strokeLinecap: "round",
  strokeLinejoin: "round"
};

// node_modules/lucide-react/dist/esm/Icon.js
var Icon = forwardRef(
  ({
    color = "currentColor",
    size = 24,
    strokeWidth = 2,
    absoluteStrokeWidth,
    className = "",
    children,
    iconNode,
    ...rest
  }, ref) => {
    return createElement(
      "svg",
      {
        ref,
        ...defaultAttributes,
        width: size,
        height: size,
        stroke: color,
        strokeWidth: absoluteStrokeWidth ? Number(strokeWidth) * 24 / Number(size) : strokeWidth,
        className: mergeClasses("lucide", className),
        ...rest
      },
      [
        ...iconNode.map(([tag, attrs]) => createElement(tag, attrs)),
        ...Array.isArray(children) ? children : [children]
      ]
    );
  }
);

// node_modules/lucide-react/dist/esm/createLucideIcon.js
var createLucideIcon = (iconName, iconNode) => {
  const Component = forwardRef2(
    ({ className, ...props }, ref) => createElement2(Icon, {
      ref,
      iconNode,
      className: mergeClasses(`lucide-${toKebabCase(iconName)}`, className),
      ...props
    })
  );
  Component.displayName = `${iconName}`;
  return Component;
};

// node_modules/lucide-react/dist/esm/icons/blend.js
var Blend = createLucideIcon("Blend", [
  ["circle", { cx: "9", cy: "9", r: "7", key: "p2h5vp" }],
  ["circle", { cx: "15", cy: "15", r: "7", key: "19ennj" }]
]);

// node_modules/lucide-react/dist/esm/icons/box.js
var Box = createLucideIcon("Box", [
  [
    "path",
    {
      d: "M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z",
      key: "hh9hay"
    }
  ],
  ["path", { d: "m3.3 7 8.7 5 8.7-5", key: "g66t2b" }],
  ["path", { d: "M12 22V12", key: "d0xqtd" }]
]);

// node_modules/lucide-react/dist/esm/icons/brick-wall.js
var BrickWall = createLucideIcon("BrickWall", [
  ["rect", { width: "18", height: "18", x: "3", y: "3", rx: "2", key: "afitv7" }],
  ["path", { d: "M12 9v6", key: "199k2o" }],
  ["path", { d: "M16 15v6", key: "8rj2es" }],
  ["path", { d: "M16 3v6", key: "1j6rpj" }],
  ["path", { d: "M3 15h18", key: "5xshup" }],
  ["path", { d: "M3 9h18", key: "1pudct" }],
  ["path", { d: "M8 15v6", key: "1stoo3" }],
  ["path", { d: "M8 3v6", key: "vlvjmk" }]
]);

// node_modules/lucide-react/dist/esm/icons/chevrons-up-down.js
var ChevronsUpDown = createLucideIcon("ChevronsUpDown", [
  ["path", { d: "m7 15 5 5 5-5", key: "1hf1tw" }],
  ["path", { d: "m7 9 5-5 5 5", key: "sgt6xg" }]
]);

// node_modules/lucide-react/dist/esm/icons/circle-arrow-right.js
var CircleArrowRight = createLucideIcon("CircleArrowRight", [
  ["circle", { cx: "12", cy: "12", r: "10", key: "1mglay" }],
  ["path", { d: "M8 12h8", key: "1wcyev" }],
  ["path", { d: "m12 16 4-4-4-4", key: "1i9zcv" }]
]);

// node_modules/lucide-react/dist/esm/icons/circle-help.js
var CircleHelp = createLucideIcon("CircleHelp", [
  ["circle", { cx: "12", cy: "12", r: "10", key: "1mglay" }],
  ["path", { d: "M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3", key: "1u773s" }],
  ["path", { d: "M12 17h.01", key: "p32p05" }]
]);

// node_modules/lucide-react/dist/esm/icons/circle-plus.js
var CirclePlus = createLucideIcon("CirclePlus", [
  ["circle", { cx: "12", cy: "12", r: "10", key: "1mglay" }],
  ["path", { d: "M8 12h8", key: "1wcyev" }],
  ["path", { d: "M12 8v8", key: "napkw2" }]
]);

// node_modules/lucide-react/dist/esm/icons/circle.js
var Circle = createLucideIcon("Circle", [
  ["circle", { cx: "12", cy: "12", r: "10", key: "1mglay" }]
]);

// node_modules/lucide-react/dist/esm/icons/code.js
var Code = createLucideIcon("Code", [
  ["polyline", { points: "16 18 22 12 16 6", key: "z7tu5w" }],
  ["polyline", { points: "8 6 2 12 8 18", key: "1eg1df" }]
]);

// node_modules/lucide-react/dist/esm/icons/crosshair.js
var Crosshair = createLucideIcon("Crosshair", [
  ["circle", { cx: "12", cy: "12", r: "10", key: "1mglay" }],
  ["line", { x1: "22", x2: "18", y1: "12", y2: "12", key: "l9bcsi" }],
  ["line", { x1: "6", x2: "2", y1: "12", y2: "12", key: "13hhkx" }],
  ["line", { x1: "12", x2: "12", y1: "6", y2: "2", key: "10w3f3" }],
  ["line", { x1: "12", x2: "12", y1: "22", y2: "18", key: "15g9kq" }]
]);

// node_modules/lucide-react/dist/esm/icons/download.js
var Download = createLucideIcon("Download", [
  ["path", { d: "M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4", key: "ih7n3h" }],
  ["polyline", { points: "7 10 12 15 17 10", key: "2ggqvy" }],
  ["line", { x1: "12", x2: "12", y1: "15", y2: "3", key: "1vk2je" }]
]);

// node_modules/lucide-react/dist/esm/icons/dumbbell.js
var Dumbbell = createLucideIcon("Dumbbell", [
  ["path", { d: "M14.4 14.4 9.6 9.6", key: "ic80wn" }],
  [
    "path",
    {
      d: "M18.657 21.485a2 2 0 1 1-2.829-2.828l-1.767 1.768a2 2 0 1 1-2.829-2.829l6.364-6.364a2 2 0 1 1 2.829 2.829l-1.768 1.767a2 2 0 1 1 2.828 2.829z",
      key: "nnl7wr"
    }
  ],
  ["path", { d: "m21.5 21.5-1.4-1.4", key: "1f1ice" }],
  ["path", { d: "M3.9 3.9 2.5 2.5", key: "1evmna" }],
  [
    "path",
    {
      d: "M6.404 12.768a2 2 0 1 1-2.829-2.829l1.768-1.767a2 2 0 1 1-2.828-2.829l2.828-2.828a2 2 0 1 1 2.829 2.828l1.767-1.768a2 2 0 1 1 2.829 2.829z",
      key: "yhosts"
    }
  ]
]);

// node_modules/lucide-react/dist/esm/icons/earth.js
var Earth = createLucideIcon("Earth", [
  ["path", { d: "M21.54 15H17a2 2 0 0 0-2 2v4.54", key: "1djwo0" }],
  [
    "path",
    {
      d: "M7 3.34V5a3 3 0 0 0 3 3a2 2 0 0 1 2 2c0 1.1.9 2 2 2a2 2 0 0 0 2-2c0-1.1.9-2 2-2h3.17",
      key: "1tzkfa"
    }
  ],
  ["path", { d: "M11 21.95V18a2 2 0 0 0-2-2a2 2 0 0 1-2-2v-1a2 2 0 0 0-2-2H2.05", key: "14pb5j" }],
  ["circle", { cx: "12", cy: "12", r: "10", key: "1mglay" }]
]);

// node_modules/lucide-react/dist/esm/icons/eye.js
var Eye = createLucideIcon("Eye", [
  [
    "path",
    {
      d: "M2.062 12.348a1 1 0 0 1 0-.696 10.75 10.75 0 0 1 19.876 0 1 1 0 0 1 0 .696 10.75 10.75 0 0 1-19.876 0",
      key: "1nclc0"
    }
  ],
  ["circle", { cx: "12", cy: "12", r: "3", key: "1v7zrd" }]
]);

// node_modules/lucide-react/dist/esm/icons/file-code-2.js
var FileCode2 = createLucideIcon("FileCode2", [
  ["path", { d: "M4 22h14a2 2 0 0 0 2-2V7l-5-5H6a2 2 0 0 0-2 2v4", key: "1pf5j1" }],
  ["path", { d: "M14 2v4a2 2 0 0 0 2 2h4", key: "tnqrlb" }],
  ["path", { d: "m5 12-3 3 3 3", key: "oke12k" }],
  ["path", { d: "m9 18 3-3-3-3", key: "112psh" }]
]);

// node_modules/lucide-react/dist/esm/icons/folder.js
var Folder = createLucideIcon("Folder", [
  [
    "path",
    {
      d: "M20 20a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.9a2 2 0 0 1-1.69-.9L9.6 3.9A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2Z",
      key: "1kt360"
    }
  ]
]);

// node_modules/lucide-react/dist/esm/icons/hammer.js
var Hammer = createLucideIcon("Hammer", [
  ["path", { d: "m15 12-8.373 8.373a1 1 0 1 1-3-3L12 9", key: "eefl8a" }],
  ["path", { d: "m18 15 4-4", key: "16gjal" }],
  [
    "path",
    {
      d: "m21.5 11.5-1.914-1.914A2 2 0 0 1 19 8.172V7l-2.26-2.26a6 6 0 0 0-4.202-1.756L9 2.96l.92.82A6.18 6.18 0 0 1 12 8.4V10l2 2h1.172a2 2 0 0 1 1.414.586L18.5 14.5",
      key: "b7pghm"
    }
  ]
]);

// node_modules/lucide-react/dist/esm/icons/hard-drive.js
var HardDrive = createLucideIcon("HardDrive", [
  ["line", { x1: "22", x2: "2", y1: "12", y2: "12", key: "1y58io" }],
  [
    "path",
    {
      d: "M5.45 5.11 2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z",
      key: "oot6mr"
    }
  ],
  ["line", { x1: "6", x2: "6.01", y1: "16", y2: "16", key: "sgf278" }],
  ["line", { x1: "10", x2: "10.01", y1: "16", y2: "16", key: "1l4acy" }]
]);

// node_modules/lucide-react/dist/esm/icons/hash.js
var Hash = createLucideIcon("Hash", [
  ["line", { x1: "4", x2: "20", y1: "9", y2: "9", key: "4lhtct" }],
  ["line", { x1: "4", x2: "20", y1: "15", y2: "15", key: "vyu0kd" }],
  ["line", { x1: "10", x2: "8", y1: "3", y2: "21", key: "1ggp8o" }],
  ["line", { x1: "16", x2: "14", y1: "3", y2: "21", key: "weycgp" }]
]);

// node_modules/lucide-react/dist/esm/icons/layers.js
var Layers = createLucideIcon("Layers", [
  [
    "path",
    {
      d: "M12.83 2.18a2 2 0 0 0-1.66 0L2.6 6.08a1 1 0 0 0 0 1.83l8.58 3.91a2 2 0 0 0 1.66 0l8.58-3.9a1 1 0 0 0 0-1.83z",
      key: "zw3jo"
    }
  ],
  [
    "path",
    {
      d: "M2 12a1 1 0 0 0 .58.91l8.6 3.91a2 2 0 0 0 1.65 0l8.58-3.9A1 1 0 0 0 22 12",
      key: "1wduqc"
    }
  ],
  [
    "path",
    {
      d: "M2 17a1 1 0 0 0 .58.91l8.6 3.91a2 2 0 0 0 1.65 0l8.58-3.9A1 1 0 0 0 22 17",
      key: "kqbvx6"
    }
  ]
]);

// node_modules/lucide-react/dist/esm/icons/list-tree.js
var ListTree = createLucideIcon("ListTree", [
  ["path", { d: "M21 12h-8", key: "1bmf0i" }],
  ["path", { d: "M21 6H8", key: "1pqkrb" }],
  ["path", { d: "M21 18h-8", key: "1tm79t" }],
  ["path", { d: "M3 6v4c0 1.1.9 2 2 2h3", key: "1ywdgy" }],
  ["path", { d: "M3 10v6c0 1.1.9 2 2 2h3", key: "2wc746" }]
]);

// node_modules/lucide-react/dist/esm/icons/loader-pinwheel.js
var LoaderPinwheel = createLucideIcon("LoaderPinwheel", [
  ["path", { d: "M22 12a1 1 0 0 1-10 0 1 1 0 0 0-10 0", key: "1lzz15" }],
  ["path", { d: "M7 20.7a1 1 0 1 1 5-8.7 1 1 0 1 0 5-8.6", key: "1gnrpi" }],
  ["path", { d: "M7 3.3a1 1 0 1 1 5 8.6 1 1 0 1 0 5 8.6", key: "u9yy5q" }],
  ["circle", { cx: "12", cy: "12", r: "10", key: "1mglay" }]
]);

// node_modules/lucide-react/dist/esm/icons/loader.js
var Loader = createLucideIcon("Loader", [
  ["path", { d: "M12 2v4", key: "3427ic" }],
  ["path", { d: "m16.2 7.8 2.9-2.9", key: "r700ao" }],
  ["path", { d: "M18 12h4", key: "wj9ykh" }],
  ["path", { d: "m16.2 16.2 2.9 2.9", key: "1bxg5t" }],
  ["path", { d: "M12 18v4", key: "jadmvz" }],
  ["path", { d: "m4.9 19.1 2.9-2.9", key: "bwix9q" }],
  ["path", { d: "M2 12h4", key: "j09sii" }],
  ["path", { d: "m4.9 4.9 2.9 2.9", key: "giyufr" }]
]);

// node_modules/lucide-react/dist/esm/icons/magnet.js
var Magnet = createLucideIcon("Magnet", [
  [
    "path",
    {
      d: "m6 15-4-4 6.75-6.77a7.79 7.79 0 0 1 11 11L13 22l-4-4 6.39-6.36a2.14 2.14 0 0 0-3-3L6 15",
      key: "1i3lhw"
    }
  ],
  ["path", { d: "m5 8 4 4", key: "j6kj7e" }],
  ["path", { d: "m12 15 4 4", key: "lnac28" }]
]);

// node_modules/lucide-react/dist/esm/icons/message-square-text.js
var MessageSquareText = createLucideIcon("MessageSquareText", [
  ["path", { d: "M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z", key: "1lielz" }],
  ["path", { d: "M13 8H7", key: "14i4kc" }],
  ["path", { d: "M17 12H7", key: "16if0g" }]
]);

// node_modules/lucide-react/dist/esm/icons/octagon-x.js
var OctagonX = createLucideIcon("OctagonX", [
  ["path", { d: "m15 9-6 6", key: "1uzhvr" }],
  [
    "path",
    {
      d: "M2.586 16.726A2 2 0 0 1 2 15.312V8.688a2 2 0 0 1 .586-1.414l4.688-4.688A2 2 0 0 1 8.688 2h6.624a2 2 0 0 1 1.414.586l4.688 4.688A2 2 0 0 1 22 8.688v6.624a2 2 0 0 1-.586 1.414l-4.688 4.688a2 2 0 0 1-1.414.586H8.688a2 2 0 0 1-1.414-.586z",
      key: "2d38gg"
    }
  ],
  ["path", { d: "m9 9 6 6", key: "z0biqf" }]
]);

// node_modules/lucide-react/dist/esm/icons/person-standing.js
var PersonStanding = createLucideIcon("PersonStanding", [
  ["circle", { cx: "12", cy: "5", r: "1", key: "gxeob9" }],
  ["path", { d: "m9 20 3-6 3 6", key: "se2kox" }],
  ["path", { d: "m6 8 6 2 6-2", key: "4o3us4" }],
  ["path", { d: "M12 10v4", key: "1kjpxc" }]
]);

// node_modules/lucide-react/dist/esm/icons/pin.js
var Pin = createLucideIcon("Pin", [
  ["path", { d: "M12 17v5", key: "bb1du9" }],
  [
    "path",
    {
      d: "M9 10.76a2 2 0 0 1-1.11 1.79l-1.78.9A2 2 0 0 0 5 15.24V16a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-.76a2 2 0 0 0-1.11-1.79l-1.78-.9A2 2 0 0 1 15 10.76V7a1 1 0 0 1 1-1 2 2 0 0 0 0-4H8a2 2 0 0 0 0 4 1 1 0 0 1 1 1z",
      key: "1nkz8b"
    }
  ]
]);

// node_modules/lucide-react/dist/esm/icons/refresh-cw.js
var RefreshCw = createLucideIcon("RefreshCw", [
  ["path", { d: "M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8", key: "v9h5vc" }],
  ["path", { d: "M21 3v5h-5", key: "1q7to0" }],
  ["path", { d: "M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16", key: "3uifl3" }],
  ["path", { d: "M8 16H3v5", key: "1cv678" }]
]);

// node_modules/lucide-react/dist/esm/icons/rocket.js
var Rocket = createLucideIcon("Rocket", [
  [
    "path",
    {
      d: "M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09z",
      key: "m3kijz"
    }
  ],
  [
    "path",
    {
      d: "m12 15-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z",
      key: "1fmvmk"
    }
  ],
  ["path", { d: "M9 12H4s.55-3.03 2-4c1.62-1.08 5 0 5 0", key: "1f8sc4" }],
  ["path", { d: "M12 15v5s3.03-.55 4-2c1.08-1.62 0-5 0-5", key: "qeys4" }]
]);

// node_modules/lucide-react/dist/esm/icons/save.js
var Save = createLucideIcon("Save", [
  [
    "path",
    {
      d: "M15.2 3a2 2 0 0 1 1.4.6l3.8 3.8a2 2 0 0 1 .6 1.4V19a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2z",
      key: "1c8476"
    }
  ],
  ["path", { d: "M17 21v-7a1 1 0 0 0-1-1H8a1 1 0 0 0-1 1v7", key: "1ydtos" }],
  ["path", { d: "M7 3v4a1 1 0 0 0 1 1h7", key: "t51u73" }]
]);

// node_modules/lucide-react/dist/esm/icons/search.js
var Search = createLucideIcon("Search", [
  ["circle", { cx: "11", cy: "11", r: "8", key: "4ej97u" }],
  ["path", { d: "m21 21-4.3-4.3", key: "1qie3q" }]
]);

// node_modules/lucide-react/dist/esm/icons/send-horizontal.js
var SendHorizontal = createLucideIcon("SendHorizontal", [
  [
    "path",
    {
      d: "M3.714 3.048a.498.498 0 0 0-.683.627l2.843 7.627a2 2 0 0 1 0 1.396l-2.842 7.627a.498.498 0 0 0 .682.627l18-8.5a.5.5 0 0 0 0-.904z",
      key: "117uat"
    }
  ],
  ["path", { d: "M6 12h16", key: "s4cdu5" }]
]);

// node_modules/lucide-react/dist/esm/icons/sparkle.js
var Sparkle = createLucideIcon("Sparkle", [
  [
    "path",
    {
      d: "M9.937 15.5A2 2 0 0 0 8.5 14.063l-6.135-1.582a.5.5 0 0 1 0-.962L8.5 9.936A2 2 0 0 0 9.937 8.5l1.582-6.135a.5.5 0 0 1 .963 0L14.063 8.5A2 2 0 0 0 15.5 9.937l6.135 1.581a.5.5 0 0 1 0 .964L15.5 14.063a2 2 0 0 0-1.437 1.437l-1.582 6.135a.5.5 0 0 1-.963 0z",
      key: "4pj2yx"
    }
  ]
]);

// node_modules/lucide-react/dist/esm/icons/square-menu.js
var SquareMenu = createLucideIcon("SquareMenu", [
  ["rect", { width: "18", height: "18", x: "3", y: "3", rx: "2", key: "afitv7" }],
  ["path", { d: "M7 8h10", key: "1jw688" }],
  ["path", { d: "M7 12h10", key: "b7w52i" }],
  ["path", { d: "M7 16h10", key: "wp8him" }]
]);

// node_modules/lucide-react/dist/esm/icons/tag.js
var Tag = createLucideIcon("Tag", [
  [
    "path",
    {
      d: "M12.586 2.586A2 2 0 0 0 11.172 2H4a2 2 0 0 0-2 2v7.172a2 2 0 0 0 .586 1.414l8.704 8.704a2.426 2.426 0 0 0 3.42 0l6.58-6.58a2.426 2.426 0 0 0 0-3.42z",
      key: "vktsd0"
    }
  ],
  ["circle", { cx: "7.5", cy: "7.5", r: ".5", fill: "currentColor", key: "kqv944" }]
]);

// node_modules/lucide-react/dist/esm/icons/trash-2.js
var Trash2 = createLucideIcon("Trash2", [
  ["path", { d: "M3 6h18", key: "d0wm0j" }],
  ["path", { d: "M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6", key: "4alrt4" }],
  ["path", { d: "M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2", key: "v07s0e" }],
  ["line", { x1: "10", x2: "10", y1: "11", y2: "17", key: "1uufr5" }],
  ["line", { x1: "14", x2: "14", y1: "11", y2: "17", key: "xtxkd" }]
]);

// node_modules/lucide-react/dist/esm/icons/triangle.js
var Triangle = createLucideIcon("Triangle", [
  [
    "path",
    { d: "M13.73 4a2 2 0 0 0-3.46 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z", key: "14u9p9" }
  ]
]);

// node_modules/lucide-react/dist/esm/icons/user-x.js
var UserX = createLucideIcon("UserX", [
  ["path", { d: "M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2", key: "1yyitq" }],
  ["circle", { cx: "9", cy: "7", r: "4", key: "nufk8" }],
  ["line", { x1: "17", x2: "22", y1: "8", y2: "13", key: "3nzzx3" }],
  ["line", { x1: "22", x2: "17", y1: "8", y2: "13", key: "1swrse" }]
]);

// node_modules/lucide-react/dist/esm/icons/users.js
var Users = createLucideIcon("Users", [
  ["path", { d: "M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2", key: "1yyitq" }],
  ["circle", { cx: "9", cy: "7", r: "4", key: "nufk8" }],
  ["path", { d: "M22 21v-2a4 4 0 0 0-3-3.87", key: "kshegd" }],
  ["path", { d: "M16 3.13a4 4 0 0 1 0 7.75", key: "1da9ce" }]
]);

// node_modules/lucide-react/dist/esm/icons/volume-2.js
var Volume2 = createLucideIcon("Volume2", [
  [
    "path",
    {
      d: "M11 4.702a.705.705 0 0 0-1.203-.498L6.413 7.587A1.4 1.4 0 0 1 5.416 8H3a1 1 0 0 0-1 1v6a1 1 0 0 0 1 1h2.416a1.4 1.4 0 0 1 .997.413l3.383 3.384A.705.705 0 0 0 11 19.298z",
      key: "uqj9uw"
    }
  ],
  ["path", { d: "M16 9a5 5 0 0 1 0 6", key: "1q6k2b" }],
  ["path", { d: "M19.364 18.364a9 9 0 0 0 0-12.728", key: "ijwkga" }]
]);

// node_modules/lucide-react/dist/esm/icons/x.js
var X = createLucideIcon("X", [
  ["path", { d: "M18 6 6 18", key: "1bl5f8" }],
  ["path", { d: "m6 6 12 12", key: "d8bk6v" }]
]);

// src/client/components/usePane.js
import { useEffect } from "react";
var STORAGE_KEY = "panes";
var info = storage.get(STORAGE_KEY);
if (!info || info.v !== 1) {
  info = {
    v: 1,
    count: 0,
    configs: {}
  };
}
var persist = debounce_default(() => storage.set(STORAGE_KEY, info), 300);

// src/client/AvatarPreview.js
var import_lodash = __toESM(require_lodash(), 1);

// src/client/config/AvatarConfig.js
var MB = 1024 * 1024;
var AvatarConfig = {
  limits: {
    maxFileSize: 10 * MB,
    maxTextureBytes: 32 * MB,
    maxTriangles: 1e5,
    builderFileSize: 5 * MB,
    builderTextureBytes: 16 * MB,
    builderTriangles: 5e4
  },
  preview: {
    canvasWidth: 512,
    canvasHeight: 512,
    cameraFOV: 50,
    cameraDistance: 2.5,
    rotationSpeed: 0.01
  },
  animation: {
    idleAnimationSpeed: 1,
    emoteAnimationSpeed: 1.2,
    transitionDuration: 0.3
  },
  cache: {
    maxCachedAvatars: 50,
    cacheTTL: 36e5
  }
};

// src/core/constants/MathConstants.js
var FOV = 70;
var DEG2RAD2 = three_exports.MathUtils.DEG2RAD;
var RAD2DEG2 = three_exports.MathUtils.RAD2DEG;
var PLANE_ASPECT_RATIO = 16 / 9;

// src/client/AvatarPreview.js
var MAX_UPLOAD_SIZE = 1e12;
var MAX_UPLOAD_SIZE_LABEL = "1LOLS";
var HDR_URL = "/day2.hdr";
var materialSlots = [
  "alphaMap",
  "aoMap",
  "bumpMap",
  "displacementMap",
  "emissiveMap",
  "envMap",
  "lightMap",
  "map",
  "metalnessMap",
  "normalMap",
  "roughnessMap"
];
var v1 = new three_exports.Vector3();
var v2 = new three_exports.Vector3();
var v3 = new three_exports.Vector3();
var renderer = null;
function getRenderer() {
  if (!renderer) {
    renderer = new three_exports.WebGLRenderer({
      antialias: true,
      powerPreference: "high-performance",
      alpha: true
    });
  }
  return renderer;
}
var AvatarPreview = class {
  constructor(world, viewport) {
    __publicField(this, "update", (time) => {
      const delta = (this.lastTime ? time - this.lastTime : 0) / 1e3;
      this.lastTime = time;
      this.node.instance.update(delta);
      this.render();
    });
    this.world = world;
    this.viewport = viewport;
    this.scene = new three_exports.Scene();
    this.size = { width: 1080, height: 900, aspect: 1080 / 900 };
    this.camera = new three_exports.PerspectiveCamera(FOV, this.size.aspect, 0.01, 2e3);
    this.camera.layers.enableAll();
    this.scene.add(this.camera);
    this.sun = new three_exports.DirectionalLight(16777215, 3);
    this.sun.position.fromArray([200, 400, 200]);
    this.sun.target.position.copy(this.camera.position);
    this.scene.add(this.sun);
    this.scene.add(this.sun.target);
    this.renderer = getRenderer();
    this.renderer.setClearColor(16777215, 0);
    this.renderer.setPixelRatio(window.devicePixelRatio || 1);
    this.renderer.setSize(this.size.width, this.size.height);
    this.renderer.outputColorSpace = three_exports.SRGBColorSpace;
    this.renderer.toneMapping = three_exports.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1;
    this.rig = new three_exports.Object3D();
    this.rig.rotation.y = 180 * DEG2RAD2;
    this.scene.add(this.rig);
    this.viewport.appendChild(this.renderer.domElement);
    this.resize(this.viewport.offsetWidth, this.viewport.offsetHeight, false);
    window.preview = this;
  }
  async load(file, url) {
    this.file = file;
    this.url = url;
    if (this.file.size > MAX_UPLOAD_SIZE) {
      return { error: `Max file size ${MAX_UPLOAD_SIZE_LABEL}` };
    }
    const texture = await this.world.loader.load("hdr", HDR_URL);
    texture.mapping = three_exports.EquirectangularReflectionMapping;
    this.scene.environment = texture;
    this.avatar = await this.world.loader.load("avatar", this.url);
    this.node = this.avatar.toNodes({
      camera: this.camera,
      scene: this.scene,
      octree: null,
      loader: this.world.loader
    }).get("avatar");
    this.node.activate({});
    this.node.setEmote(Emotes.IDLE);
    if (!this.renderer) return;
    this.positionCamera(this.node);
    this.render();
    this.info = this.resolveInfo(this.file, this.node);
    this.renderer.setAnimationLoop(this.update);
    return this.info;
  }
  positionCamera(node2) {
    const bbox = new three_exports.Box3().setFromObject(node2.model);
    const center = bbox.getCenter(v1);
    const size = bbox.getSize(v2);
    const maxDim = Math.max(size.x, size.y, size.z);
    const fov = this.camera.fov * DEG2RAD2;
    let distance = maxDim / (2 * Math.tan(fov / 2));
    distance *= 1.2;
    this.camera.position.copy(center);
    this.camera.position.z += distance;
    this.camera.lookAt(center);
    this.camera.updateProjectionMatrix();
  }
  resolveInfo(file, node2) {
    const info2 = {
      file,
      fileSize: file.size,
      rank: Ranks.VISITOR,
      textures: 0,
      textureBytes: 0,
      triangles: 0
    };
    const textures = /* @__PURE__ */ new Set();
    node2.model.traverse((child) => {
      if (child.isMesh) {
        if (child.geometry) {
          const index = child.geometry.index;
          const position2 = child.geometry.attributes.position;
          if (index) {
            info2.triangles += index.count / 3;
          } else if (position2) {
            info2.triangles += position2.count / 3;
          }
        }
        if (child.material) {
          const materials = Array.isArray(child.material) ? child.material : [child.material];
          materials.forEach((material) => {
            materialSlots.forEach((slot) => {
              const texture = material[slot];
              if (texture && texture.image) {
                textures.add(texture);
              }
            });
          });
        }
      }
    });
    info2.textures = textures.size;
    textures.forEach((texture) => {
      if (texture.image) {
        const { width, height } = texture.image;
        const bytesPerPixel = 4;
        info2.textureBytes += width * height * bytesPerPixel;
      }
    });
    if (info2.fileSize > AvatarConfig.limits.maxFileSize || info2.textureBytes > AvatarConfig.limits.maxTextureBytes || info2.triangles > AvatarConfig.limits.maxTriangles) {
      info2.rank = Ranks.ADMIN;
    } else if (info2.fileSize > AvatarConfig.limits.builderFileSize || info2.textureBytes > AvatarConfig.limits.builderTextureBytes || info2.triangles > AvatarConfig.limits.builderTriangles) {
      info2.rank = Ranks.BUILDER;
    }
    return info2;
  }
  resize(width, height, render = true) {
    const planeHeight = 2 * Math.tan(FOV * DEG2RAD2 / 2) * 1;
    const planeWidth = planeHeight * PLANE_ASPECT_RATIO;
    const viewportAspect = width / height;
    let finalWidth, finalHeight;
    if (viewportAspect > PLANE_ASPECT_RATIO) {
      finalHeight = height;
      finalWidth = finalHeight * PLANE_ASPECT_RATIO;
    } else {
      finalWidth = width;
      finalHeight = finalWidth / PLANE_ASPECT_RATIO;
    }
    const left = (width - finalWidth) / 2;
    const bottom = (height - finalHeight) / 2;
    this.camera.setViewOffset(width, height, left, bottom, finalWidth, finalHeight);
    this.camera.aspect = finalWidth / finalHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
    if (render) {
      this.render();
    }
  }
  render() {
    this.renderer.render(this.scene, this.camera);
  }
  capture(width, height) {
    const actualWidth = this.size.width;
    const actualHeight = this.size.height;
    this.resize(width, height);
    const base64 = this.renderer.domElement.toDataURL();
    this.resize(actualWidth, actualHeight);
    return base64;
  }
  async uploadAndEquip(makeDefault) {
    let url = this.url;
    if (!this.isAsset) {
      url = await this.engine.driver.uploadFile(this.file);
    }
    this.engine.urls.route(url, this.url);
    this.engine.driver.changeAvatar(url, this.info.rank, makeDefault);
  }
  destroy() {
    this.node?.deactivate();
    this.viewport.removeChild(this.renderer.domElement);
    this.renderer.setAnimationLoop(null);
    this.renderer.clear();
    this.renderer = null;
  }
};

// src/client/components/AvatarPane.js
var logger10 = new StructuredLogger("AvatarPane");
function AvatarPane({ world, info: info2 }) {
  const viewportRef = useRef();
  const previewRef = useRef();
  const [stats, setStats] = useState(null);
  useEffect2(() => {
    const viewport = viewportRef.current;
    const preview = new AvatarPreview(world, viewport);
    previewRef.current = preview;
    preview.load(info2.file, info2.url).then((stats2) => {
      logger10.info("Avatar loaded", { file: info2.file, stats: JSON.stringify(stats2) });
      setStats(stats2);
    });
    return () => preview.destroy();
  }, []);
  return /* @__PURE__ */ React.createElement(
    "div",
    {
      className: "vpane",
      css: O`
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        width: 16rem;
        background: rgba(11, 10, 21, 0.9);
        border: 1px solid rgba(255, 255, 255, 0.05);
        border-radius: 1.375rem;
        backdrop-filter: blur(5px);
        pointer-events: auto;
        display: flex;
        flex-direction: column;
        font-size: 1rem;
        overflow: hidden;
        .vpane-head {
          height: 3.125rem;
          display: flex;
          align-items: center;
          padding: 0 0.3rem 0 1rem;
          border-bottom: 1px solid rgba(255, 255, 255, 0.03);
          &-title {
            font-size: 1rem;
            font-weight: 500;
            flex: 1;
          }
          &-close {
            width: 2.5rem;
            height: 2.5rem;
            display: flex;
            align-items: center;
            justify-content: center;
            color: #5d6077;
            &:hover {
              cursor: pointer;
              color: white;
            }
          }
        }
        .vpane-content {
          flex: 1;
          position: relative;
        }
        .vpane-viewport {
          height: 17rem;
          position: relative;
        }
        .vpane-viewport-inner {
          position: absolute;
          inset: 0;
        }
        .vpane-actions {
          display: flex;
          align-items: center;
          border-top: 1px solid rgba(255, 255, 255, 0.1);
        }
        .vpane-action {
          flex: 1;
          height: 2.7rem;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 0.9375rem;
          &.bl {
            border-left: 1px solid rgba(255, 255, 255, 0.1);
          }
          &:hover {
            cursor: pointer;
          }
        }
      `
    },
    /* @__PURE__ */ React.createElement("div", { className: "vpane-head" }, /* @__PURE__ */ React.createElement("div", { className: "vpane-head-title" }, "Avatar"), /* @__PURE__ */ React.createElement("div", { className: "vpane-head-close", onClick: () => world.emit("avatar", null) }, /* @__PURE__ */ React.createElement(X, { size: 20 }))),
    /* @__PURE__ */ React.createElement("div", { className: "vpane-content" }, /* @__PURE__ */ React.createElement("div", { className: "vpane-viewport" }, /* @__PURE__ */ React.createElement("div", { className: "vpane-viewport-inner", ref: viewportRef })), /* @__PURE__ */ React.createElement("div", { className: "vpane-actions" }, /* @__PURE__ */ React.createElement("div", { className: "vpane-action", onClick: info2.onEquip }, /* @__PURE__ */ React.createElement("span", null, "Equip")), info2.canPlace && /* @__PURE__ */ React.createElement("div", { className: "vpane-action bl", onClick: info2.onPlace }, /* @__PURE__ */ React.createElement("span", null, "Place"))))
  );
}

// src/client/components/Sidebar.js
import { useEffect as useEffect20, useState as useState24 } from "react";

// src/client/components/Hint.js
import { createContext, useContext, useMemo, useState as useState2 } from "react";
var HintContext = createContext();
function HintProvider({ children }) {
  const [hint, setHint] = useState2(null);
  const api = useMemo(() => {
    return { hint, setHint };
  }, [hint]);
  return /* @__PURE__ */ React.createElement(HintContext.Provider, { value: api }, children);
}

// src/client/components/useRank.js
import { useEffect as useEffect3, useState as useState3 } from "react";
function useRank(world, player) {
  const [perms, setPerms] = useState3(() => {
    const isAdmin = player.isAdmin();
    const isBuilder = player.isBuilder();
    return { isAdmin, isBuilder };
  });
  useEffect3(() => {
    function update() {
      const isAdmin = player.isAdmin();
      const isBuilder = player.isBuilder();
      setPerms({ isAdmin, isBuilder });
    }
    function onSettings(changes) {
      if (changes.rank) {
        update();
      }
    }
    function onRank({ playerId }) {
      if (player.data.id === playerId) {
        update();
      }
    }
    world.settings.on("change", onSettings);
    world.on("rank", onRank);
    return () => {
      world.settings.off("change", onSettings);
      world.off("rank", onRank);
    };
  }, []);
  return perms;
}

// src/client/components/cls.js
function cls2(...args) {
  let str = "";
  for (const arg of args) {
    if (typeof arg === "string") {
      str += " " + arg;
    } else if (typeof arg === "object") {
      for (const key in arg) {
        const value = arg[key];
        if (value) str += " " + key;
      }
    }
  }
  return str;
}

// src/client/components/styles/ComponentStyles.js
var sectionStyles = O`
  background: rgba(11, 10, 21, 0.2);
  border: 1px solid rgba(255, 255, 255, 0.05);
  border-radius: 2rem;
  padding: 0.6875rem 0;
  pointer-events: auto;
  position: relative;
  &.active {
    background: rgba(11, 10, 21, 0.9);
  }
`;
var panelBase = O`
  background: rgba(11, 10, 21, 0.9);
  border: 1px solid rgba(255, 255, 255, 0.05);
  border-radius: 1.375rem;
  display: flex;
  flex-direction: column;
  .panel-head {
    height: 3.125rem;
    padding: 0 1rem;
    border-bottom: 1px solid rgba(255, 255, 255, 0.05);
    display: flex;
    align-items: center;
  }
  .panel-title {
    flex: 1;
    font-weight: 500;
    font-size: 1rem;
    line-height: 1;
  }
  .panel-content {
    flex: 1;
    overflow-y: auto;
  }
`;
var btnStyles = O`
  width: 2.75rem;
  height: 1.875rem;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  position: relative;
  .sidebar-btn-dot {
    display: none;
    position: absolute;
    top: 0.8rem;
    right: 0.2rem;
    width: 0.3rem;
    height: 0.3rem;
    border-radius: 0.15rem;
    background: white;
  }
  &:hover {
    cursor: pointer;
    color: white;
  }
  &.active {
    color: white;
    .sidebar-btn-dot {
      display: block;
    }
  }
  &.suspended {
    .sidebar-btn-dot {
      display: block;
    }
  }
  &.disabled {
    color: rgba(255, 255, 255, 0.3);
  }
  &.muted {
    color: #ff4b4b;
  }
`;
var addStyles = (span, gap) => O`
  background: rgba(11, 10, 21, 0.9);
  border: 1px solid rgba(255, 255, 255, 0.05);
  border-radius: 1.375rem;
  display: flex;
  flex-direction: column;
  min-height: 17rem;
  .add-head {
    height: 3.125rem;
    padding: 0 1rem;
    border-bottom: 1px solid rgba(255, 255, 255, 0.05);
    display: flex;
    align-items: center;
  }
  .add-title {
    font-weight: 500;
    font-size: 1rem;
    line-height: 1;
  }
  .add-content {
    flex: 1;
    overflow-y: auto;
    padding: 1rem;
  }
  .add-items {
    display: flex;
    align-items: stretch;
    flex-wrap: wrap;
    gap: ${gap};
  }
  .add-item {
    flex-basis: calc((100% / ${span}) - (${gap} * (${span} - 1) / ${span}));
    cursor: pointer;
  }
  .add-item-image {
    width: 100%;
    aspect-ratio: 1;
    background-color: #1c1d22;
    background-size: cover;
    border: 1px solid rgba(255, 255, 255, 0.05);
    border-radius: 0.7rem;
    margin: 0 0 0.4rem;
  }
  .add-item-name {
    text-align: center;
    font-size: 0.875rem;
  }
`;
var appsStyles = O`
  background: rgba(11, 10, 21, 0.9);
  border: 1px solid rgba(255, 255, 255, 0.05);
  border-radius: 1.375rem;
  flex: 1;
  display: flex;
  flex-direction: column;
  min-height: 17rem;
  .apps-head {
    height: 3.125rem;
    padding: 0 0.6rem 0 1rem;
    border-bottom: 1px solid rgba(255, 255, 255, 0.05);
    display: flex;
    align-items: center;
  }
  .apps-title {
    flex: 1;
    font-weight: 500;
    font-size: 1rem;
    line-height: 1;
  }
  .apps-search {
    display: flex;
    align-items: center;
    input {
      margin-left: 0.5rem;
      width: 5rem;
      font-size: 0.9375rem;
      &::placeholder {
        color: #5d6077;
      }
      &::selection {
        background-color: white;
        color: rgba(0, 0, 0, 0.8);
      }
    }
  }
  .apps-toggle {
    width: 2rem;
    height: 2rem;
    display: flex;
    align-items: center;
    justify-content: center;
    margin: 0 0 0 1rem;
    color: #5d6077;
    &:hover {
      cursor: pointer;
    }
    &.active {
      color: white;
    }
  }
  .apps-content {
    flex: 1;
    overflow-y: auto;
  }
`;
var appStyles = O`
  background: rgba(11, 10, 21, 0.9);
  border: 1px solid rgba(255, 255, 255, 0.05);
  border-radius: 1.375rem;
  display: flex;
  flex-direction: column;
  min-height: 1rem;
  .app-head {
    height: 3.125rem;
    padding: 0 1rem;
    border-bottom: 1px solid rgba(255, 255, 255, 0.05);
    display: flex;
    align-items: center;
  }
  .app-title {
    flex: 1;
    font-weight: 500;
    font-size: 1rem;
    line-height: 1;
    white-space: nowrap;
    text-overflow: ellipsis;
    overflow: hidden;
  }
  .app-btn {
    width: 2rem;
    height: 2rem;
    display: flex;
    align-items: center;
    justify-content: center;
    color: rgba(255, 255, 255, 0.8);
    &:hover {
      cursor: pointer;
      color: white;
    }
  }
  .app-toggles {
    padding: 0.5rem 1.4rem;
    border-bottom: 1px solid rgba(255, 255, 255, 0.05);
    display: flex;
    align-items: center;
    justify-content: space-between;
  }
  .app-toggle {
    width: 2rem;
    height: 2rem;
    display: flex;
    align-items: center;
    justify-content: center;
    color: #6f7289;
    &:hover:not(.disabled) {
      cursor: pointer;
    }
    &.active {
      color: white;
    }
    &.disabled {
      color: #434556;
    }
  }
  .app-transforms {
    border-bottom: 1px solid rgba(255, 255, 255, 0.05);
  }
  .app-transforms-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 0.4rem;
    &:hover {
      cursor: pointer;
    }
  }
  .app-content {
    flex: 1;
    overflow-y: auto;
  }
`;
var playersStyles = O`
  background: rgba(11, 10, 21, 0.9);
  border: 1px solid rgba(255, 255, 255, 0.05);
  border-radius: 1.375rem;
  display: flex;
  flex-direction: column;
  min-height: 1rem;
  .players-head {
    height: 3.125rem;
    padding: 0 1rem;
    border-bottom: 1px solid rgba(255, 255, 255, 0.05);
    display: flex;
    align-items: center;
  }
  .players-title {
    flex: 1;
    font-weight: 500;
    font-size: 1rem;
    line-height: 1;
    white-space: nowrap;
    text-overflow: ellipsis;
    overflow: hidden;
  }
  .players-content {
    flex: 1;
    overflow-y: auto;
    padding: 0.5rem 0;
  }
  .players-item {
    display: flex;
    align-items: center;
    padding: 0.1rem 0.5rem 0.1rem 1rem;
    height: 36px;
  }
  .players-name {
    flex: 1;
    display: flex;
    align-items: center;
    span {
      white-space: nowrap;
      text-overflow: ellipsis;
      overflow: hidden;
      margin-right: 0.5rem;
    }
    svg {
      color: rgba(255, 255, 255, 0.6);
    }
  }
  .players-btn {
    width: 2rem;
    height: 2rem;
    display: flex;
    align-items: center;
    justify-content: center;
    color: rgba(255, 255, 255, 0.8);
    &:hover:not(.readonly) {
      cursor: pointer;
      color: white;
    }
    &.dim {
      color: #556181;
    }
  }
`;
var worldStyles = O`
  background: rgba(11, 10, 21, 0.9);
  border: 1px solid rgba(255, 255, 255, 0.05);
  border-radius: 1.375rem;
  display: flex;
  flex-direction: column;
  min-height: 12rem;
  .world-head {
    height: 3.125rem;
    padding: 0 1rem;
    border-bottom: 1px solid rgba(255, 255, 255, 0.05);
    display: flex;
    align-items: center;
  }
  .world-title {
    font-weight: 500;
    font-size: 1rem;
    line-height: 1;
  }
  .world-content {
    flex: 1;
    padding: 0.5rem 0;
    overflow-y: auto;
  }
`;
var scriptStyles = O`
  pointer-events: auto;
  align-self: stretch;
  background: rgba(11, 10, 21, 0.9);
  border: 1px solid rgba(255, 255, 255, 0.05);
  border-radius: 1.375rem;
  display: flex;
  flex-direction: column;
  align-items: stretch;
  flex: 1;
  min-height: 23.7rem;
  position: relative;
  .script-head {
    height: 3.125rem;
    padding: 0 1rem;
    display: flex;
    align-items: center;
    border-bottom: 1px solid rgba(255, 255, 255, 0.05);
  }
  .script-title {
    flex: 1;
    font-weight: 500;
    font-size: 1rem;
    line-height: 1;
  }
  .script-btn {
    width: 2rem;
    height: 2rem;
    display: flex;
    align-items: center;
    justify-content: center;
    color: rgba(255, 255, 255, 0.8);
    &:hover {
      cursor: pointer;
      color: white;
    }
  }
  .script-resizer {
    position: absolute;
    top: 0;
    bottom: 0;
    right: -5px;
    width: 10px;
    cursor: ew-resize;
  }
  &.hidden {
    opacity: 0;
    pointer-events: none;
  }
`;
var prefsStyles = O`
  overflow-y: auto;
  background: rgba(11, 10, 21, 0.9);
  border: 1px solid rgba(255, 255, 255, 0.05);
  border-radius: 1.375rem;
  padding: 0.6rem 0;
`;
var contentStyles = O`
  flex: 1;
  .appslist-head {
    position: sticky;
    top: 0;
    display: flex;
    align-items: center;
    padding: 0.6rem 1rem;
    border-bottom: 1px solid rgba(255, 255, 255, 0.05);
    margin: 0 0 0.3125rem;
  }
  .appslist-headitem {
    font-size: 1rem;
    font-weight: 500;
    white-space: nowrap;
    text-overflow: ellipsis;
    overflow: hidden;
    &.name {
      flex: 1;
    }
    &.code {
      width: 3rem;
      text-align: right;
    }
    &.count,
    &.geometries,
    &.triangles {
      width: 4rem;
      text-align: right;
    }
    &.textureSize,
    &.fileSize {
      width: 5rem;
      text-align: right;
    }
    &.actions {
      display: flex;
      align-items: center;
      justify-content: flex-end;
      width: 5.45rem;
    }
    &:hover:not(.active) {
      cursor: pointer;
    }
    &.active {
      color: #4088ff;
    }
  }
  .appslist-rows {
  }
  .appslist-row {
    display: flex;
    align-items: center;
    padding: 0.6rem 1rem;
    &:hover {
      cursor: pointer;
      background: rgba(255, 255, 255, 0.03);
    }
  }
  .appslist-rowitem {
    font-size: 1rem;
    color: rgba(255, 255, 255, 0.8);
    white-space: nowrap;
    text-overflow: ellipsis;
    overflow: hidden;
    &.name {
      flex: 1;
    }
    &.code {
      width: 3rem;
      text-align: right;
    }
    &.count,
    &.geometries,
    &.triangles {
      width: 4rem;
      text-align: right;
    }
    &.textureSize,
    &.fileSize {
      width: 5rem;
      text-align: right;
    }
    &.actions {
      width: 5.45rem;
      display: flex;
      justify-content: flex-end;
    }
  }
  .appslist-action {
    margin-left: 0.625rem;
    color: #5d6077;
    &.active {
      color: white;
    }
    &:hover {
      cursor: pointer;
    }
  }
  &.hideperf {
    .appslist-head {
      display: none;
    }
    .appslist-rowitem {
      &.count,
      &.code,
      &.geometries,
      &.triangles,
      &.textureSize,
      &.fileSize {
        display: none;
      }
    }
  }
`;
var chatStyles = O`
  position: absolute;
  left: calc(2rem + env(safe-area-inset-left));
  bottom: calc(2rem + env(safe-area-inset-bottom));
  width: 20rem;
  font-size: 1rem;
  @media all and (max-width: 1200px) {
    left: calc(1rem + env(safe-area-inset-left));
    bottom: calc(1rem + env(safe-area-inset-bottom));
  }
  .mainchat-msgs {
    padding: 0 0 0.5rem 0.4rem;
  }
  .mainchat-btn {
    pointer-events: auto;
    width: 2.875rem;
    height: 2.875rem;
    display: flex;
    align-items: center;
    justify-content: center;
    background: rgba(11, 10, 21, 0.85);
    border: 0.0625rem solid #2a2b39;
    border-radius: 1rem;
    &:hover {
      cursor: pointer;
    }
    opacity: 0;
  }
  .mainchat-entry {
    height: 2.875rem;
    padding: 0 1rem;
    background: rgba(11, 10, 21, 0.9);
    border: 1px solid rgba(255, 255, 255, 0.05);
    border-radius: 2rem;
    display: flex;
    align-items: center;
    display: none;
    input {
      font-size: 0.9375rem;
      line-height: 1;
    }
  }
  .mainchat-send {
    width: 2.875rem;
    height: 2.875rem;
    display: flex;
    align-items: center;
    justify-content: center;
    margin-right: -0.6rem;
  }
  &.active {
    pointer-events: auto;
    .mainchat-btn {
      display: none;
    }
    .mainchat-entry {
      display: flex;
    }
  }
`;
var addItemImageStyles = (url) => O`
  background-image: url(${url});
`;

// src/client/components/Icons.js
function ChevronRightIcon({ size = 24 }) {
  return /* @__PURE__ */ React.createElement("svg", { width: size, height: size, viewBox: "0 0 24 24", fill: "none", xmlns: "http://www.w3.org/2000/svg" }, /* @__PURE__ */ React.createElement(
    "path",
    {
      d: "M8.58984 16.58L13.1698 12L8.58984 7.41L9.99984 6L15.9998 12L9.99984 18L8.58984 16.58Z",
      fill: "currentColor"
    }
  ));
}
function ChevronLeftIcon({ size = 24 }) {
  return /* @__PURE__ */ React.createElement("svg", { width: size, height: size, viewBox: "0 0 24 24", fill: "none", xmlns: "http://www.w3.org/2000/svg" }, /* @__PURE__ */ React.createElement("path", { d: "M15.41 16.58L10.83 12L15.41 7.41L14 6L8 12L14 18L15.41 16.58Z", fill: "currentColor" }));
}
function MenuIcon({ size = 24 }) {
  return /* @__PURE__ */ React.createElement("svg", { width: size, height: size, viewBox: "0 0 24 24", fill: "none", xmlns: "http://www.w3.org/2000/svg" }, /* @__PURE__ */ React.createElement("path", { d: "M3 6H21V8H3V6ZM3 11H21V13H3V11ZM3 16H21V18H3V16Z", fill: "currentColor" }));
}
function VRIcon({ size = 24 }) {
  return /* @__PURE__ */ React.createElement("svg", { width: size, height: size, viewBox: "0 0 24 24", fill: "none", xmlns: "http://www.w3.org/2000/svg" }, /* @__PURE__ */ React.createElement(
    "path",
    {
      d: "M5 3C3.89 3 3 3.9 3 5V19C3 19.5304 3.21071 20.0391 3.58579 20.4142C3.96086 20.7893 4.46957 21 5 21H19C19.5304 21 20.0391 20.7893 20.4142 20.4142C20.7893 20.0391 21 19.5304 21 19V5C21 4.46957 20.7893 3.96086 20.4142 3.58579C20.0391 3.21071 19.5304 3 19 3H5ZM6 9H7.5L8.5 12.43L9.5 9H11L9.25 15H7.75L6 9ZM13 9H16.5C17.35 9 18 9.65 18 10.5V11.5C18 12.1 17.6 12.65 17.1 12.9L18 15H16.5L15.65 13H14.5V15H13V9ZM14.5 10.5V11.5H16.5V10.5H14.5Z",
      fill: "currentColor"
    }
  ));
}
function MicIcon({ size = 24 }) {
  return /* @__PURE__ */ React.createElement("svg", { width: size, height: size, viewBox: "0 0 24 24", fill: "none", xmlns: "http://www.w3.org/2000/svg" }, /* @__PURE__ */ React.createElement(
    "path",
    {
      d: "M12 2C12.7956 2 13.5587 2.31607 14.1213 2.87868C14.6839 3.44129 15 4.20435 15 5V11C15 11.7956 14.6839 12.5587 14.1213 13.1213C13.5587 13.6839 12.7956 14 12 14C11.2044 14 10.4413 13.6839 9.87868 13.1213C9.31607 12.5587 9 11.7956 9 11V5C9 4.20435 9.31607 3.44129 9.87868 2.87868C10.4413 2.31607 11.2044 2 12 2ZM19 11C19 14.53 16.39 17.44 13 17.93V21H11V17.93C7.61 17.44 5 14.53 5 11H7C7 12.3261 7.52678 13.5979 8.46447 14.5355C9.40215 15.4732 10.6739 16 12 16C13.3261 16 14.5979 15.4732 15.5355 14.5355C16.4732 13.5979 17 12.3261 17 11H19Z",
      fill: "currentColor"
    }
  ));
}
function MicOffIcon({ size = 24 }) {
  return /* @__PURE__ */ React.createElement("svg", { width: size, height: size, viewBox: "0 0 24 24", fill: "none", xmlns: "http://www.w3.org/2000/svg" }, /* @__PURE__ */ React.createElement(
    "path",
    {
      d: "M19 11C19 12.19 18.66 13.3 18.1 14.28L16.87 13.05C17.14 12.43 17.3 11.74 17.3 11H19ZM15 11.16L9 5.18V5C9 4.20435 9.31607 3.44129 9.87868 2.87868C10.4413 2.31607 11.2044 2 12 2C12.7956 2 13.5587 2.31607 14.1213 2.87868C14.6839 3.44129 15 4.20435 15 5V11V11.16ZM4.27 3L21 19.73L19.73 21L15.54 16.81C14.77 17.27 13.91 17.58 13 17.72V21H11V17.72C7.72 17.23 5 14.41 5 11H6.7C6.7 14 9.24 16.1 12 16.1C12.81 16.1 13.6 15.91 14.31 15.58L12.65 13.92L12 14C11.2044 14 10.4413 13.6839 9.87868 13.1213C9.31607 12.5587 9 11.7956 9 11V10.28L3 4.27L4.27 3Z",
      fill: "currentColor"
    }
  ));
}
function HandIcon({ size = 24 }) {
  return /* @__PURE__ */ React.createElement("svg", { width: size, height: size, viewBox: "0 0 24 24", fill: "none", xmlns: "http://www.w3.org/2000/svg" }, /* @__PURE__ */ React.createElement(
    "path",
    {
      d: "M12.0819 22C9.26277 22 6.72901 20.3333 5.68265 17.8333L3.06241 11.475C2.79434 10.8167 3.43426 10.1583 4.13472 10.375L4.81788 10.5917C5.30215 10.75 5.69994 11.1 5.89019 11.5583L7.10951 14.5H7.75808V4.70833C7.75808 4.13333 8.24235 3.66667 8.83903 3.66667C9.43572 3.66667 9.91999 4.13333 9.91999 4.70833V12H10.7847V3.04167C10.7847 2.46667 11.269 2 11.8657 2C12.4624 2 12.9467 2.46667 12.9467 3.04167V12H13.8114V4.29167C13.8114 3.71667 14.2957 3.25 14.8924 3.25C15.4891 3.25 15.9733 3.71667 15.9733 4.29167V12H16.8381V6.79167C16.8381 6.21667 17.3224 5.75 17.919 5.75C18.5157 5.75 19 6.21667 19 6.79167V15.3333C19 19.0167 15.9041 22 12.0819 22Z",
      fill: "currentColor"
    }
  ));
}
function ChevronDoubleUpIcon({ size = 24 }) {
  return /* @__PURE__ */ React.createElement("svg", { width: size, height: size, viewBox: "0 0 24 24", fill: "none", xmlns: "http://www.w3.org/2000/svg" }, /* @__PURE__ */ React.createElement(
    "path",
    {
      d: "M7.41 18.41L6 17L12 11L18 17L16.59 18.41L12 13.83L7.41 18.41ZM7.41 12.41L6 11L12 5L18 11L16.59 12.41L12 7.83L7.41 12.41Z",
      fill: "currentColor"
    }
  ));
}

// src/client/components/SidebarButtonGroups/UserSection.js
function Btn({ disabled, suspended, active, muted, children, ...props }) {
  return /* @__PURE__ */ React.createElement("div", { className: cls2("sidebar-btn", { disabled, suspended, active, muted }), ...props }, children, /* @__PURE__ */ React.createElement("div", { className: "sidebar-btn-dot" }));
}
function UserSection({ world, ui, livekit, activePane }) {
  return /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement(
    Btn,
    {
      active: activePane === "prefs",
      suspended: ui.pane === "prefs" && !activePane,
      onClick: () => world.ui.togglePane("prefs")
    },
    /* @__PURE__ */ React.createElement(MenuIcon, { size: "1.25rem" })
  ), /* @__PURE__ */ React.createElement(
    Btn,
    {
      active: activePane === "controls",
      suspended: ui.pane === "controls" && !activePane,
      onClick: () => world.ui.togglePane("controls")
    },
    /* @__PURE__ */ React.createElement(CircleHelp, { size: "1.25rem" })
  ), /* @__PURE__ */ React.createElement(
    Btn,
    {
      active: activePane === "players",
      suspended: ui.pane === "players" && !activePane,
      onClick: () => world.ui.togglePane("players")
    },
    /* @__PURE__ */ React.createElement(Users, { size: "1.25rem" })
  ), isTouch && /* @__PURE__ */ React.createElement(
    Btn,
    {
      onClick: () => {
        world.emit("sidebar-chat-toggle");
      }
    },
    /* @__PURE__ */ React.createElement(MessageSquareText, { size: "1.25rem" })
  ), livekit.available && !livekit.connected && /* @__PURE__ */ React.createElement(Btn, { disabled: true }, /* @__PURE__ */ React.createElement(MicOffIcon, { size: "1.25rem" })), livekit.available && livekit.connected && /* @__PURE__ */ React.createElement(
    Btn,
    {
      muted: livekit.mic && (livekit.level === "disabled" || livekit.muted),
      onClick: () => {
        world.livekit.setMicrophoneEnabled();
      }
    },
    livekit.mic && livekit.level !== "disabled" && !livekit.muted ? /* @__PURE__ */ React.createElement(MicIcon, { size: "1.25rem" }) : /* @__PURE__ */ React.createElement(MicOffIcon, { size: "1.25rem" })
  ), world.xr?.supportsVR && /* @__PURE__ */ React.createElement(
    Btn,
    {
      onClick: () => {
        world.xr.enter();
      }
    },
    /* @__PURE__ */ React.createElement(VRIcon, { size: "1.25rem" })
  ));
}

// src/client/components/SidebarButtonGroups/BuilderSection.js
function Btn2({ disabled, suspended, active, muted, children, ...props }) {
  return /* @__PURE__ */ React.createElement("div", { className: cls2("sidebar-btn", { disabled, suspended, active, muted }), ...props }, children, /* @__PURE__ */ React.createElement("div", { className: "sidebar-btn-dot" }));
}
function BuilderSection({ world, ui, activePane }) {
  return /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement(
    Btn2,
    {
      active: activePane === "world",
      suspended: ui.pane === "world" && !activePane,
      onClick: () => world.ui.togglePane("world")
    },
    /* @__PURE__ */ React.createElement(Earth, { size: "1.25rem" })
  ), /* @__PURE__ */ React.createElement(
    Btn2,
    {
      active: activePane === "apps",
      suspended: ui.pane === "apps" && !activePane,
      onClick: () => world.ui.togglePane("apps")
    },
    /* @__PURE__ */ React.createElement(Layers, { size: "1.25rem" })
  ), /* @__PURE__ */ React.createElement(
    Btn2,
    {
      active: activePane === "add",
      suspended: ui.pane === "add" && !activePane,
      onClick: () => world.ui.togglePane("add")
    },
    /* @__PURE__ */ React.createElement(CirclePlus, { size: "1.25rem" })
  ));
}

// src/client/components/SidebarButtonGroups/AppSection.js
function Btn3({ disabled, suspended, active, muted, children, ...props }) {
  return /* @__PURE__ */ React.createElement("div", { className: cls2("sidebar-btn", { disabled, suspended, active, muted }), ...props }, children, /* @__PURE__ */ React.createElement("div", { className: "sidebar-btn-dot" }));
}
function AppSection({ world, ui, activePane }) {
  return /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement(
    Btn3,
    {
      active: activePane === "app",
      suspended: ui.pane === "app" && !activePane,
      onClick: () => world.ui.togglePane("app")
    },
    /* @__PURE__ */ React.createElement(SquareMenu, { size: "1.25rem" })
  ), /* @__PURE__ */ React.createElement(
    Btn3,
    {
      active: activePane === "script",
      suspended: ui.pane === "script" && !activePane,
      onClick: () => world.ui.togglePane("script")
    },
    /* @__PURE__ */ React.createElement(Code, { size: "1.25rem" })
  ), /* @__PURE__ */ React.createElement(
    Btn3,
    {
      active: activePane === "nodes",
      suspended: ui.pane === "nodes" && !activePane,
      onClick: () => world.ui.togglePane("nodes")
    },
    /* @__PURE__ */ React.createElement(ListTree, { size: "1.25rem" })
  ), /* @__PURE__ */ React.createElement(
    Btn3,
    {
      active: activePane === "meta",
      suspended: ui.pane === "meta" && !activePane,
      onClick: () => world.ui.togglePane("meta")
    },
    /* @__PURE__ */ React.createElement(Tag, { size: "1.25rem" })
  ));
}

// src/client/components/SidebarButtons.js
function Section({ active, top, bottom, children }) {
  return /* @__PURE__ */ React.createElement("div", { className: cls2("sidebar-section", { active, top, bottom }), css: sectionStyles }, children);
}
function SidebarButtons({ world, ui, isBuilder, livekit, activePane }) {
  return /* @__PURE__ */ React.createElement("div", { className: "sidebar-sections" }, /* @__PURE__ */ React.createElement(Section, { active: activePane, bottom: true }, /* @__PURE__ */ React.createElement(UserSection, { world, ui, livekit, activePane })), isBuilder && /* @__PURE__ */ React.createElement(Section, { active: activePane, top: true, bottom: true }, /* @__PURE__ */ React.createElement(BuilderSection, { world, ui, activePane })), ui.app && /* @__PURE__ */ React.createElement(Section, { active: activePane, top: true, bottom: true }, /* @__PURE__ */ React.createElement(AppSection, { world, ui, activePane })));
}

// src/client/components/hooks/useSyncedState.js
import { useEffect as useEffect4, useState as useState4 } from "react";
function useSyncedState(manager, keys, initialValues = {}) {
  const keysArray = Array.isArray(keys) ? keys : [keys];
  const initial = Array.isArray(keys) ? keysArray.reduce((acc, k) => ({ ...acc, [k]: initialValues[k] ?? manager[k] }), {}) : initialValues ?? manager[keys];
  const [state, setState] = useState4(initial);
  useEffect4(() => {
    const onChange = (changes) => {
      if (Array.isArray(keys)) {
        const updates = {};
        for (const key of keysArray) {
          if (changes[key]) updates[key] = changes[key].value;
        }
        if (Object.keys(updates).length) {
          setState((prev2) => ({ ...prev2, ...updates }));
        }
      } else {
        if (changes[keys]) setState(changes[keys].value);
      }
    };
    manager.on("change", onChange);
    return () => manager.off("change", onChange);
  }, [keys, manager]);
  return state;
}

// src/client/components/hooks/useFileUpload.js
import { useRef as useRef2, useState as useState5 } from "react";

// src/core/extras/downloadFile.js
function downloadFile(data, filename) {
  const blob = new Blob([data]);
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

// src/client/useUpdate.js
import { useEffect as useEffect5 } from "react";
function useUpdate(callback, deps) {
  useEffect5(() => {
    callback?.();
  }, deps);
}

// src/core/utils/network/NetworkUploadUtil.js
var import_async_retry = __toESM(require_lib(), 1);
var logger11 = new StructuredLogger("NetworkUploadUtil");
var NetworkUploadUtil = class {
  static async uploadWithRetry(network, file, options = {}) {
    const {
      maxRetries = 3,
      initialDelay = 1e3,
      maxDelay = 5e3,
      onProgress,
      onRetry
    } = options;
    try {
      if (onProgress) onProgress(0);
      const result = await (0, import_async_retry.default)(
        async (bail) => {
          try {
            const hash2 = await network.uploadFile(file);
            if (onProgress) onProgress(100);
            return hash2;
          } catch (err) {
            if (!this.shouldRetryError(err)) {
              bail(err);
            }
            throw err;
          }
        },
        {
          retries: maxRetries,
          minTimeout: initialDelay,
          maxTimeout: maxDelay,
          onRetry: (err, attempt) => {
            onRetry?.(file, attempt, err.message);
            logger11.warn("Upload retry", { filename: file.name, attempt, error: err.message });
          }
        }
      );
      return { success: true, file, hash: result };
    } catch (err) {
      logger11.error("Upload failed", {
        filename: file.name,
        error: err.message
      });
      throw new Error(`Upload failed after ${maxRetries} retries: ${err.message}`);
    }
  }
  static async uploadBatch(network, files, options = {}) {
    const { onRetry } = options;
    const succeeded = [];
    const failed = [];
    const results = [];
    const uploadPromises = files.map(async (file) => {
      try {
        const result = await this.uploadWithRetry(network, file, { ...options, onRetry });
        succeeded.push(file);
        results.push({ file, success: true, hash: result.hash });
        logger11.info("File uploaded", { filename: file.name });
      } catch (err) {
        failed.push(file);
        results.push({ file, success: false, error: err.message });
        logger11.error("Batch upload item failed", { filename: file.name, error: err.message });
      }
    });
    await Promise.all(uploadPromises);
    if (failed.length > 0 && succeeded.length > 0) {
      logger11.warn("Batch upload has failures, rolling back successes", {
        succeeded: succeeded.length,
        failed: failed.length
      });
      for (const file of succeeded) {
        await this.rollbackUpload(network, file).catch((err) => {
          logger11.error("Rollback failed", { filename: file.name, error: err.message });
        });
      }
      succeeded.length = 0;
    }
    return { succeeded, failed, results };
  }
  static async uploadWithProgress(network, file, onProgress) {
    if (!onProgress) {
      return this.uploadWithRetry(network, file);
    }
    const progressInterval = setInterval(() => {
      const current = Math.min(80, Math.round(Math.random() * 80));
      onProgress(current);
    }, 300);
    try {
      const result = await this.uploadWithRetry(network, file);
      clearInterval(progressInterval);
      onProgress(100);
      return result;
    } catch (err) {
      clearInterval(progressInterval);
      throw err;
    }
  }
  static shouldRetryError(err) {
    const message = err.message?.toLowerCase() || "";
    const isNetworkError = err.name === "TypeError" || message.includes("network") || message.includes("timeout");
    const is5xxError = message.includes("5") || message.includes("500") || message.includes("503") || message.includes("502");
    const isClientError = message.includes("400") || message.includes("403") || message.includes("404") || message.includes("413");
    return (isNetworkError || is5xxError) && !isClientError;
  }
  static async rollbackUpload(network, file) {
    logger11.info("Rolling back upload", { filename: file.name });
  }
};

// src/core/utils/getFileExtension.js
function getFileExtension(filename) {
  return filename.split(".").pop().toLowerCase();
}

// src/client/components/hooks/useFileUpload.js
var logger12 = new StructuredLogger("useFileUpload");
var fileKinds = {
  avatar: { type: "avatar", accept: ".vrm", exts: ["vrm"], placeholder: "vrm" },
  emote: { type: "emote", accept: ".glb", exts: ["glb"], placeholder: "glb" },
  model: { type: "model", accept: ".glb", exts: ["glb"], placeholder: "glb" },
  texture: { type: "texture", accept: ".jpg,.jpeg,.png,.webp", exts: ["jpg", "jpeg", "png", "webp"], placeholder: "jpg,png,webp" },
  image: { type: "image", accept: ".jpg,.jpeg,.png,.webp", exts: ["jpg", "jpeg", "png", "webp"], placeholder: "jpg,png,webp" },
  video: { type: "video", accept: ".mp4", exts: ["mp4"], placeholder: "mp4" },
  hdr: { type: "hdr", accept: ".hdr", exts: ["hdr"], placeholder: "hdr" },
  audio: { type: "audio", accept: ".mp3", exts: ["mp3"], placeholder: "mp3" }
};
function useFileUpload(world, kindName) {
  const nRef = useRef2(0);
  const update = useUpdate();
  const [loading, setLoading] = useState5(null);
  const kind = fileKinds[kindName];
  const set = async (file, onChange) => {
    if (!file) return;
    const n = ++nRef.current;
    update();
    const ext = getFileExtension(file.name);
    if (!kind.exts.includes(ext)) {
      logger12.error("Invalid file extension", { kindName, ext });
      return;
    }
    const hash2 = await hashFile(file);
    const filename = `${hash2}.${ext}`;
    const url = `asset://${filename}`;
    const newValue = {
      type: kind.type,
      name: file.name,
      url
    };
    setLoading(newValue);
    try {
      await NetworkUploadUtil.uploadWithRetry(world.network, file, {
        maxRetries: 3,
        onProgress: (percent) => setLoading({ ...newValue, progress: percent })
      });
    } catch (err) {
      logger12.error("Upload failed after retries", { kindName, ext, error: err.message });
      setLoading(null);
      return;
    }
    if (nRef.current !== n) return;
    world.loader.insert(kind.type, url, file);
    setLoading(null);
    onChange(newValue);
  };
  const remove = (onChange) => {
    onChange(null);
  };
  const handleDownload = async (value) => {
    if (!value?.url) return;
    if (!world.loader.hasFile(value.url)) {
      await world.loader.loadFile(value.url);
    }
    const file = world.loader.getFile(value.url, value.name);
    if (!file) {
      logger12.error("Could not load file", { url: value.url });
      return;
    }
    downloadFile(file);
  };
  return {
    kind,
    loading,
    set,
    remove,
    handleDownload
  };
}

// src/client/components/hooks/useGraphicsOptions.js
import { useMemo as useMemo2 } from "react";
function useGraphicsOptions(world) {
  return useMemo2(() => {
    const dpr = window.devicePixelRatio;
    const options = [];
    const add = (label, val) => {
      options.push({ label, value: val });
    };
    add("0.5x", 0.5);
    add("1x", 1);
    if (dpr >= 2) add("2x", 2);
    if (dpr >= 3) add("3x", dpr);
    return options;
  }, []);
}

// src/client/components/hooks/usePlayerList.js
import { useEffect as useEffect6, useState as useState6 } from "react";
var getPlayers = (world) => {
  const players = [];
  world.entities.players.forEach((player) => {
    players.push(player);
  });
  return sortBy_default(players, (player) => player.enteredAt);
};
var attachListeners = (world, onChange) => {
  const listeners = ["entities:added", "entities:removed", "livekit:speaking", "livekit:muted", "world:rank", "world:name"];
  const attach = (emitter, event, handler) => emitter.on(event, handler);
  const detach = (emitter, event, handler) => emitter.off(event, handler);
  attach(world.entities, "added", onChange);
  attach(world.entities, "removed", onChange);
  attach(world.livekit, "speaking", onChange);
  attach(world.livekit, "muted", onChange);
  attach(world, "rank", onChange);
  attach(world, "name", onChange);
  return () => {
    detach(world.entities, "added", onChange);
    detach(world.entities, "removed", onChange);
    detach(world.livekit, "speaking", onChange);
    detach(world.livekit, "muted", onChange);
    detach(world, "rank", onChange);
    detach(world, "name", onChange);
  };
};
function usePlayerList(world) {
  const [players, setPlayers] = useState6(() => getPlayers(world));
  useEffect6(() => {
    const onChange = () => setPlayers(getPlayers(world));
    return attachListeners(world, onChange);
  }, []);
  return players;
}

// src/client/components/hooks/usePlayerActions.js
function usePlayerActions(world) {
  const localPlayer = world.entities.player;
  const toggleBuilder = (player) => {
    if (player.data.rank === Ranks.BUILDER) {
      world.network.send("modifyRank", { playerId: player.data.id, rank: Ranks.VISITOR });
    } else {
      world.network.send("modifyRank", { playerId: player.data.id, rank: Ranks.BUILDER });
    }
  };
  const toggleMute = (player) => {
    world.network.send("mute", { playerId: player.data.id, muted: !player.isMuted() });
  };
  const kick = (player) => {
    world.network.send("kick", player.data.id);
  };
  const teleportTo = (player) => {
    const position2 = new three_exports.Vector3(0, 0, 1);
    position2.applyQuaternion(player.base.quaternion);
    position2.multiplyScalar(0.6).add(player.base.position);
    localPlayer.teleport({
      position: position2,
      rotationY: player.base.rotation.y
    });
  };
  return {
    toggleBuilder,
    toggleMute,
    kick,
    teleportTo
  };
}

// src/core/extras/appTools.js
async function exportApp(blueprint, resolveFile) {
  blueprint = cloneDeep_default(blueprint);
  const assets = [];
  if (blueprint.model) {
    assets.push({
      type: blueprint.model.endsWith(".vrm") ? "avatar" : "model",
      url: blueprint.model,
      file: await resolveFile(blueprint.model)
    });
  }
  if (blueprint.script) {
    assets.push({
      type: "script",
      url: blueprint.script,
      file: await resolveFile(blueprint.script)
    });
  }
  if (blueprint.image) {
    assets.push({
      type: "texture",
      url: blueprint.image.url,
      file: await resolveFile(blueprint.image.url)
    });
  }
  for (const key in blueprint.props) {
    const value = blueprint.props[key];
    if (value?.url) {
      assets.push({
        type: value.type,
        url: value.url,
        file: await resolveFile(value.url)
      });
    }
  }
  if (blueprint.locked) {
    blueprint.frozen = true;
  }
  if (blueprint.disabled) {
    blueprint.disabled = false;
  }
  const filename = `${blueprint.name || "app"}.hyp`;
  const header = {
    blueprint,
    assets: assets.map((asset) => {
      return {
        type: asset.type,
        url: asset.url,
        size: asset.file.size,
        mime: asset.file.type
      };
    })
  };
  const headerBytes = new TextEncoder().encode(JSON.stringify(header));
  const headerSize = new Uint8Array(4);
  new DataView(headerSize.buffer).setUint32(0, headerBytes.length, true);
  const fileBlobs = await Promise.all(assets.map((asset) => asset.file.arrayBuffer()));
  const file = new File([headerSize, headerBytes, ...fileBlobs], filename, {
    type: "application/octet-stream"
  });
  return file;
}

// src/client/components/hooks/useAppLogic.js
var logger13 = new StructuredLogger("useAppLogic");
var extToType = {
  glb: "model",
  vrm: "avatar"
};
function useAppLogic(world) {
  const download = async (blueprint) => {
    try {
      const file = await exportApp(blueprint, world.loader.loadFile);
      downloadFile(file);
    } catch (err) {
      logger13.error("Failed to download app", { blueprintId: blueprint.id, error: err.message });
    }
  };
  const changeModel = async (blueprint, file) => {
    if (!file) return;
    const ext = getFileExtension(file.name);
    const allowedModels = ["glb", "vrm"];
    if (!allowedModels.includes(ext)) return;
    const hash2 = await hashFile(file);
    const filename = `${hash2}.${ext}`;
    const url = `asset://${filename}`;
    const type = extToType[ext];
    world.loader.insert(type, url, file);
    const version = blueprint.version + 1;
    world.blueprints.modify({ id: blueprint.id, version, model: url });
    try {
      await NetworkUploadUtil.uploadWithRetry(world.network, file, { maxRetries: 3 });
    } catch (err) {
      logger13.error("Model upload failed", { blueprintId: blueprint.id, error: err.message });
      return;
    }
    world.network.send("blueprintModified", { id: blueprint.id, version, model: url });
  };
  const toggleBlueprintKey = (blueprint, key, value) => {
    value = isBoolean_default(value) ? value : !blueprint[key];
    if (blueprint[key] === value) return;
    const version = blueprint.version + 1;
    world.blueprints.modify({ id: blueprint.id, version, [key]: value });
    world.network.send("blueprintModified", { id: blueprint.id, version, [key]: value });
  };
  const toggleEntityPinned = (entity) => {
    const pinned = !entity.data.pinned;
    entity.data.pinned = pinned;
    world.network.send("entityModified", { id: entity.data.id, pinned });
    return pinned;
  };
  return {
    download,
    changeModel,
    toggleBlueprintKey,
    toggleEntityPinned
  };
}

// src/client/components/hooks/useAppStats.js
import { useEffect as useEffect7, useMemo as useMemo3, useState as useState7 } from "react";

// src/core/extras/formatBytes.js
function formatBytes(bytes, decimals = 2) {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i2 = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i2)).toFixed(decimals)) + " " + sizes[i2];
}

// src/client/components/hooks/useAppStats.js
function formatNumber(num) {
  if (num === null || num === void 0 || isNaN(num)) {
    return "0";
  }
  const million = 1e6;
  const thousand = 1e3;
  let result;
  if (num >= million) {
    result = (num / million).toFixed(1) + "M";
  } else if (num >= thousand) {
    result = (num / thousand).toFixed(1) + "K";
  } else {
    result = Math.round(num).toString();
  }
  return result.replace(/\.0+([KM])?$/, "$1").replace(/(\.\d+[1-9])0+([KM])?$/, "$1$2");
}
var aggregateAppStats = (world, refresh) => {
  const itemMap = /* @__PURE__ */ new Map();
  const items = [];
  for (const [_, entity] of world.entities.items) {
    if (!entity.isApp) continue;
    const blueprint = entity.blueprint;
    if (!blueprint || !blueprint.model) continue;
    let item = itemMap.get(blueprint.id);
    if (!item) {
      const type = blueprint.model.endsWith(".vrm") ? "avatar" : "model";
      const model = world.loader.get(type, blueprint.model);
      if (!model) continue;
      const stats = model.getStats();
      const name = blueprint.name || "-";
      item = {
        blueprint,
        keywords: name.toLowerCase(),
        name,
        count: 0,
        geometries: stats.geometries.size,
        triangles: stats.triangles,
        textureBytes: stats.textureBytes,
        textureSize: formatBytes(stats.textureBytes),
        code: blueprint.script ? 1 : 0,
        fileBytes: stats.fileBytes,
        fileSize: formatBytes(stats.fileBytes)
      };
      itemMap.set(blueprint.id, item);
    }
    item.count++;
  }
  for (const [_, item] of itemMap) {
    items.push(item);
  }
  return items;
};
function useAppStats(world, { query, sortKey = "count", ascending = false, refresh = 0 } = {}) {
  const items = useMemo3(() => aggregateAppStats(world, refresh), [refresh]);
  const filtered = useMemo3(() => {
    let newItems = items;
    if (query) {
      const q = query.toLowerCase();
      newItems = newItems.filter((item) => item.keywords.includes(q));
    }
    newItems = orderBy_default(newItems, sortKey, ascending ? "asc" : "desc");
    return newItems;
  }, [items, sortKey, ascending, query]);
  useEffect7(() => {
    function onChange() {
    }
    world.entities.on("added", onChange);
    world.entities.on("removed", onChange);
    return () => {
      world.entities.off("added", onChange);
      world.entities.off("removed", onChange);
    };
  }, []);
  return {
    items: filtered,
    formatNumber
  };
}

// src/client/components/hooks/factories/useEventFactory.js
import { useEffect as useEffect8, useCallback, useRef as useRef3 } from "react";
function useEventFactory(emitter, event, handler, deps = []) {
  const handlerRef = useRef3(handler);
  handlerRef.current = handler;
  useEffect8(() => {
    if (!emitter) return;
    const callback = (...args) => handlerRef.current(...args);
    emitter.on(event, callback);
    return () => emitter.off(event, callback);
  }, [emitter, event, ...deps]);
}
function useEventFactoryMulti(emitter, eventMap, deps = []) {
  const handlersRef = useRef3(eventMap);
  handlersRef.current = eventMap;
  useEffect8(() => {
    if (!emitter) return;
    const callbacks = {};
    for (const [eventName, handler] of Object.entries(handlersRef.current)) {
      callbacks[eventName] = (...args) => handlersRef.current[eventName](...args);
      emitter.on(eventName, callbacks[eventName]);
    }
    return () => {
      for (const [eventName, callback] of Object.entries(callbacks)) {
        emitter.off(eventName, callback);
      }
    };
  }, [emitter, ...deps]);
}

// src/client/components/hooks/useWorldEvent.js
function useWorldEvent(emitter, event, handler, deps = []) {
  useEventFactory(emitter, event, handler, deps);
}
function useWorldEvents(emitter, eventMap, deps = []) {
  useEventFactoryMulti(emitter, eventMap, deps);
}
function usePrefsChange(world, handler) {
  useWorldEvent(world?.prefs, "change", handler, [world]);
}

// src/client/components/hooks/useMenuHint.js
import { useContext as useContext2 } from "react";

// src/client/components/MenuComponents/Menu.js
import { createContext as createContext2, useState as useState8 } from "react";
var MenuContext = createContext2();

// src/client/components/hooks/useFieldHint.js
import { useContext as useContext3 } from "react";
function useFieldHint(hint) {
  const { setHint } = useContext3(HintContext);
  return {
    onPointerEnter: () => setHint(hint),
    onPointerLeave: () => setHint(null)
  };
}

// src/client/components/hooks/useFieldBase.js
import { useEffect as useEffect9, useState as useState9, useCallback as useCallback2, useRef as useRef4 } from "react";
function useFieldBase(initialValue, onChange, options = {}) {
  const { coerce, validate, selectOnFocus = false, multiline = false, instant = false, autoHeight = false } = options;
  const textareaRef = useRef4();
  const [localValue, setLocalValue] = useState9(coerce ? coerce(initialValue ?? "") : initialValue ?? "");
  const [isFocused, setIsFocused] = useState9(false);
  useEffect9(() => {
    if (!isFocused) {
      const coercedValue = coerce ? coerce(initialValue ?? "") : initialValue ?? "";
      if (localValue !== coercedValue) setLocalValue(coercedValue);
    }
  }, [initialValue, isFocused, coerce]);
  useEffect9(() => {
    if (!autoHeight || !textareaRef.current) return;
    const textarea = textareaRef.current;
    function update() {
      textarea.style.height = "auto";
      textarea.style.height = textarea.scrollHeight + "px";
    }
    update();
    textarea.addEventListener("input", update);
    return () => textarea.removeEventListener("input", update);
  }, [autoHeight]);
  const handleCommit = useCallback2((valueToCommit) => {
    if (validate && !validate(valueToCommit)) return;
    onChange(valueToCommit);
  }, [onChange, validate]);
  const handleChange = useCallback2((e) => {
    const newValue = e.target.value;
    setLocalValue(newValue);
    if (instant) handleCommit(newValue);
  }, [instant, handleCommit]);
  const handleFocus = useCallback2((e) => {
    setIsFocused(true);
    if (selectOnFocus) e.target.select();
  }, [selectOnFocus]);
  const handleBlur = useCallback2(() => {
    setIsFocused(false);
    handleCommit(localValue);
  }, [localValue, handleCommit]);
  const handleKeyDown = useCallback2((e) => {
    if (e.code === "Enter" && !multiline) {
      e.preventDefault();
      handleCommit(localValue);
      e.target.blur();
    }
  }, [multiline, localValue, handleCommit]);
  return {
    ref: textareaRef,
    value: localValue,
    isFocused,
    handlers: {
      onChange: handleChange,
      onFocus: handleFocus,
      onBlur: handleBlur,
      onKeyDown: handleKeyDown
    }
  };
}

// src/client/components/hooks/useFieldText.js
function useFieldText(value, onChange) {
  const { value: localValue, handlers } = useFieldBase(value, onChange, { selectOnFocus: true });
  return {
    value: localValue || "",
    onChange: handlers.onChange,
    onFocus: handlers.onFocus,
    onBlur: handlers.onBlur,
    onKeyDown: handlers.onKeyDown
  };
}

// src/client/components/hooks/useFieldNumber.js
import { useCallback as useCallback3 } from "react";

// src/client/components/hooks/parseNumber.js
function parseNumberInput(str, current, { min = -Infinity, max = Infinity } = {}) {
  let num;
  try {
    num = (0, eval)(str);
    if (typeof num !== "number") throw new Error("input number parse fail");
  } catch (err) {
    num = current;
  }
  if (num < min || num > max) num = current;
  return num;
}

// src/client/components/hooks/useFieldNumber.js
var createNumberCoerce = (safeValue, dp) => (v) => {
  const str = typeof v === "number" ? v.toFixed(dp) : v;
  return str === "" ? safeValue.toFixed(dp) : str;
};
var createNumberHandlers = (local, safeValue, min, max, step, bigStep, dp, onChange) => ({
  handleBlur: () => {
    if (local === "") return;
    const num = parseNumberInput(local, safeValue, { min, max });
    onChange(+num.toFixed(dp));
  },
  handleArrowKeys: (e) => {
    if (e.code === "ArrowUp" || e.code === "ArrowDown") {
      const amount = e.shiftKey ? bigStep : step;
      const newNum = safeValue + (e.code === "ArrowUp" ? amount : -amount);
      const clamped = Math.max(min, Math.min(max, newNum));
      onChange(clamped);
    }
  }
});
function useFieldNumber(value, onChange, { dp = 0, min = -Infinity, max = Infinity, step = 1, bigStep = 2 } = {}) {
  const safeValue = value ?? 0;
  const coerce = useCallback3(createNumberCoerce(safeValue, dp), [safeValue, dp]);
  const { value: local, handlers } = useFieldBase(value, onChange, { coerce, selectOnFocus: true });
  const { handleBlur, handleArrowKeys } = createNumberHandlers(local, safeValue, min, max, step, bigStep, dp, onChange);
  const handleKeyDown = useCallback3((e) => {
    if (e.code === "Enter") {
      e.preventDefault();
      handleBlur();
      e.target.blur();
    } else {
      handleArrowKeys(e);
    }
  }, [handleBlur, handleArrowKeys]);
  return {
    value: local,
    onChange: handlers.onChange,
    onFocus: handlers.onFocus,
    onBlur: handleBlur,
    onKeyDown: handleKeyDown
  };
}

// src/client/components/hooks/useFieldVec3.js
import { useCallback as useCallback4 } from "react";
var createVec3Coerce = (current, dp) => (v) => {
  const str = typeof v === "number" ? v.toFixed(dp) : v;
  return str === "" ? current.toFixed(dp) : str;
};
function useFieldVec3(value, onChange, { dp = 0, min = -Infinity, max = Infinity, step = 1, bigStep = 2 } = {}) {
  const [vx, vy, vz] = value || [0, 0, 0];
  const createFieldProps = (idx, current) => {
    const coerce = useCallback4(createVec3Coerce(current, dp), [current, dp]);
    const { value: local, handlers } = useFieldBase(current, (num) => {
      const newVal = [...value || [0, 0, 0]];
      newVal[idx] = num;
      onChange(newVal);
    }, { coerce, selectOnFocus: true });
    const handleKeyDown = useCallback4((e) => {
      if (e.code === "Enter") {
        e.preventDefault();
        const num = parseNumberInput(local, current, { min, max });
        const newVal = [...value || [0, 0, 0]];
        newVal[idx] = +num.toFixed(dp);
        onChange(newVal);
        e.target.blur();
      } else if (e.code === "ArrowUp" || e.code === "ArrowDown") {
        const amount = e.shiftKey ? bigStep : step;
        const newNum = current + (e.code === "ArrowUp" ? amount : -amount);
        const clamped = Math.max(min, Math.min(max, newNum));
        const num = parseNumberInput(clamped.toString(), current, { min, max });
        const newVal = [...value || [0, 0, 0]];
        newVal[idx] = +num.toFixed(dp);
        onChange(newVal);
      }
    }, [local, current, idx, min, max, step, bigStep, dp]);
    return {
      type: "text",
      value: local,
      onChange: handlers.onChange,
      onFocus: handlers.onFocus,
      onBlur: handlers.onBlur,
      onKeyDown: handleKeyDown
    };
  };
  return {
    x: createFieldProps(0, vx),
    y: createFieldProps(1, vy),
    z: createFieldProps(2, vz)
  };
}

// src/client/components/hooks/useFieldRange.js
import { useEffect as useEffect10, useState as useState10, useRef as useRef5, useMemo as useMemo4 } from "react";
function useFieldRange(value, onChange, { min = 0, max = 1, step = 0.05, instant = false } = {}) {
  const trackRef = useRef5();
  const safeValue = value ?? 0;
  const [local, setLocal] = useState10(safeValue);
  const [sliding, setSliding] = useState10(false);
  useEffect10(() => {
    if (!sliding && local !== safeValue) setLocal(safeValue);
  }, [sliding, safeValue]);
  useEffect10(() => {
    const track = trackRef.current;
    if (!track) return;
    const calculateValueFromPointer = (e, el) => {
      const rect = el.getBoundingClientRect();
      const position2 = (e.clientX - rect.left) / rect.width;
      const rawValue = min + position2 * (max - min);
      const steppedValue = Math.round(rawValue / step) * step;
      return Math.max(min, Math.min(max, steppedValue));
    };
    let isSliding = false;
    const onPointerDown = (e) => {
      isSliding = true;
      setSliding(true);
      const newValue = calculateValueFromPointer(e, e.currentTarget);
      setLocal(newValue);
      if (instant) onChange(newValue);
      e.currentTarget.setPointerCapture(e.pointerId);
    };
    const onPointerMove = (e) => {
      if (!isSliding) return;
      const newValue = calculateValueFromPointer(e, e.currentTarget);
      setLocal(newValue);
      if (instant) onChange(newValue);
    };
    const onPointerUp = (e) => {
      if (!isSliding) return;
      isSliding = false;
      setSliding(false);
      const finalValue = calculateValueFromPointer(e, e.currentTarget);
      setLocal(finalValue);
      onChange(finalValue);
      e.currentTarget.releasePointerCapture(e.pointerId);
    };
    track.addEventListener("pointerdown", onPointerDown);
    track.addEventListener("pointermove", onPointerMove);
    track.addEventListener("pointerup", onPointerUp);
    return () => {
      track.removeEventListener("pointerdown", onPointerDown);
      track.removeEventListener("pointermove", onPointerMove);
      track.removeEventListener("pointerup", onPointerUp);
    };
  }, [min, max, step, instant, onChange]);
  const barWidthPercentage = (local - min) / (max - min) * 100;
  const text = useMemo4(() => {
    const decimalDigits = (local.toString().split(".")[1] || "").length;
    return decimalDigits <= 2 ? local.toString() : local.toFixed(2);
  }, [local]);
  return { trackRef, barWidthPercentage, text };
}

// src/client/components/hooks/useFieldSwitch.js
import { useCallback as useCallback5 } from "react";
function useFieldSwitch(options, value, onChange) {
  const safeOptions = options || [];
  const idx = safeOptions.findIndex((o) => o.value === value);
  const selected = safeOptions[idx];
  const prev2 = useCallback5(() => {
    let nextIdx = idx - 1;
    if (nextIdx < 0) nextIdx = safeOptions.length - 1;
    onChange(safeOptions[nextIdx].value);
  }, [idx, safeOptions, onChange]);
  const next2 = useCallback5(() => {
    let nextIdx = idx + 1;
    if (nextIdx > safeOptions.length - 1) nextIdx = 0;
    onChange(safeOptions[nextIdx].value);
  }, [idx, safeOptions, onChange]);
  return { selected, prev: prev2, next: next2 };
}

// src/client/components/hooks/useFieldTextarea.js
function useFieldTextarea(value, onChange) {
  const { value: localValue, ref, handlers } = useFieldBase(value, onChange, { selectOnFocus: true, multiline: true, autoHeight: true });
  return {
    ref,
    value: localValue || "",
    onChange: handlers.onChange,
    onFocus: handlers.onFocus,
    onBlur: handlers.onBlur,
    onKeyDown: handlers.onKeyDown
  };
}

// src/client/components/hooks/useFieldCurve.js
import { useState as useState11, useMemo as useMemo5, useCallback as useCallback6 } from "react";

// src/client/components/hooks/fieldStyles.js
var fieldLabelCss = `
  width: 9.4rem;
  flex-shrink: 0;
  white-space: nowrap;
  text-overflow: ellipsis;
  overflow: hidden;
  font-size: 0.9375rem;
  color: rgba(255, 255, 255, 0.6);
`;
var fieldWrapperCss = `
  display: flex;
  align-items: center;
  height: 2.5rem;
  padding: 0 1rem;
  cursor: text;
  &:hover {
    background-color: rgba(255, 255, 255, 0.03);
  }
`;
var fieldInputCss = `
  font-size: 0.9375rem;
  text-align: right;
  cursor: inherit;
  &::selection {
    background-color: white;
    color: rgba(0, 0, 0, 0.8);
  }
`;

// src/client/components/FieldsComponents/FieldText.js
function FieldText({ label, hint, placeholder, value, onChange }) {
  const hintProps = useFieldHint(hint);
  const inputProps = useFieldText(value, onChange);
  return /* @__PURE__ */ React.createElement(
    "label",
    {
      className: "fieldtext",
      css: O`
        ${fieldWrapperCss}
        .fieldtext-label { ${fieldLabelCss} }
        .fieldtext-field { flex: 1; }
        input { ${fieldInputCss} }
      `,
      ...hintProps
    },
    /* @__PURE__ */ React.createElement("div", { className: "fieldtext-label" }, label),
    /* @__PURE__ */ React.createElement("div", { className: "fieldtext-field" }, /* @__PURE__ */ React.createElement("input", { type: "text", placeholder, ...inputProps }))
  );
}

// src/client/components/FieldsComponents/FieldTextarea.js
function FieldTextarea({ label, hint, placeholder, value, onChange }) {
  const hintProps = useFieldHint(hint);
  const textareaProps = useFieldTextarea(value, onChange);
  return /* @__PURE__ */ React.createElement(
    "label",
    {
      className: "fieldtextarea",
      css: O`
        display: flex;
        align-items: flex-start;
        min-height: 2.5rem;
        padding: 0 1rem;
        cursor: text;
        .fieldtextarea-label { ${fieldLabelCss} padding-top: 0.6rem; }
        .fieldtextarea-field { flex: 1; padding: 0.6rem 0; }
        textarea {
          font-size: 0.9375rem;
          width: 100%;
          text-align: right;
          height: auto;
          overflow: hidden;
          resize: none;
          cursor: inherit;
          &::selection { background-color: white; color: rgba(0, 0, 0, 0.8); }
        }
        &:hover { background-color: rgba(255, 255, 255, 0.03); }
      `,
      ...hintProps
    },
    /* @__PURE__ */ React.createElement("div", { className: "fieldtextarea-label" }, label),
    /* @__PURE__ */ React.createElement("div", { className: "fieldtextarea-field" }, /* @__PURE__ */ React.createElement("textarea", { placeholder, ...textareaProps }))
  );
}

// src/client/components/FieldsComponents/FieldSwitch.js
function FieldSwitch({ label, hint, options, value, onChange }) {
  const hintProps = useFieldHint(hint);
  const { selected, prev: prev2, next: next2 } = useFieldSwitch(options, value, onChange);
  return /* @__PURE__ */ React.createElement(
    "div",
    {
      className: "fieldswitch",
      css: O`
        display: flex;
        align-items: center;
        height: 2.5rem;
        padding: 0 1rem;
        .fieldswitch-label {
          flex: 1;
          white-space: nowrap;
          text-overflow: ellipsis;
          overflow: hidden;
          padding-right: 1rem;
          font-size: 0.9375rem;
          color: rgba(255, 255, 255, 0.6);
        }
        .fieldswitch-btn {
          width: 2.125rem;
          height: 2.125rem;
          display: none;
          align-items: center;
          justify-content: center;
          opacity: 0.2;
          &:hover {
            cursor: pointer;
            opacity: 1;
          }
        }
        .fieldswitch-text {
          font-size: 0.9375rem;
          line-height: 1;
        }
        &:hover {
          padding: 0 0.275rem 0 1rem;
          background-color: rgba(255, 255, 255, 0.03);
          .fieldswitch-btn {
            display: flex;
          }
        }
      `,
      ...hintProps
    },
    /* @__PURE__ */ React.createElement("div", { className: "fieldswitch-label" }, label),
    /* @__PURE__ */ React.createElement("div", { className: "fieldswitch-btn left", onClick: prev2 }, /* @__PURE__ */ React.createElement(ChevronLeftIcon, { size: "1.5rem" })),
    /* @__PURE__ */ React.createElement("div", { className: "fieldswitch-text" }, selected?.label || "???"),
    /* @__PURE__ */ React.createElement("div", { className: "fieldswitch-btn right", onClick: next2 }, /* @__PURE__ */ React.createElement(ChevronRightIcon, { size: "1.5rem" }))
  );
}

// src/client/components/FieldsComponents/FieldToggle.js
function FieldToggle({ label, hint, trueLabel = "Yes", falseLabel = "No", value, onChange }) {
  const hintProps = useFieldHint(hint);
  return /* @__PURE__ */ React.createElement(
    "div",
    {
      className: "fieldtoggle",
      css: O`
        ${fieldWrapperCss}
        cursor: pointer;
        .fieldtoggle-label { ${fieldLabelCss} flex: 1; padding-right: 1rem; }
        .fieldtoggle-text { font-size: 0.9375rem; }
      `,
      ...hintProps,
      onClick: () => onChange(!value)
    },
    /* @__PURE__ */ React.createElement("div", { className: "fieldtoggle-label" }, label),
    /* @__PURE__ */ React.createElement("div", { className: "fieldtoggle-text" }, value ? trueLabel : falseLabel)
  );
}

// src/client/components/FieldsComponents/FieldRange.js
function FieldRange({ label, hint, min = 0, max = 1, step = 0.05, instant, value, onChange }) {
  const hintProps = useFieldHint(hint);
  const { trackRef, barWidthPercentage, text } = useFieldRange(value, onChange, { min, max, step, instant });
  return /* @__PURE__ */ React.createElement(
    "div",
    {
      className: "fieldrange",
      css: O`
        ${fieldWrapperCss}
        .fieldrange-label {
          flex: 1;
          ${fieldLabelCss}
          padding-right: 1rem;
        }
        .fieldrange-text {
          font-size: 0.7rem;
          font-weight: 500;
          color: rgba(255, 255, 255, 0.6);
          margin-right: 0.5rem;
          opacity: 0;
        }
        .fieldrange-track {
          width: 7rem;
          flex-shrink: 0;
          height: 0.5rem;
          border-radius: 0.1rem;
          display: flex;
          align-items: stretch;
          background-color: rgba(255, 255, 255, 0.1);
          &:hover { cursor: pointer; }
        }
        .fieldrange-bar {
          background-color: white;
          border-radius: 0.1rem;
          width: ${barWidthPercentage}%;
        }
        &:hover {
          .fieldrange-text { opacity: 1; }
        }
      `,
      ...hintProps
    },
    /* @__PURE__ */ React.createElement("div", { className: "fieldrange-label" }, label),
    /* @__PURE__ */ React.createElement("div", { className: "fieldrange-text" }, text),
    /* @__PURE__ */ React.createElement("div", { className: "fieldrange-track", ref: trackRef }, /* @__PURE__ */ React.createElement("div", { className: "fieldrange-bar" }))
  );
}

// src/client/components/FieldsComponents/FieldFile.js
function FieldFile({ world, label, hint, kind: kindName, value, onChange }) {
  const hintProps = useFieldHint(hint);
  const { kind, loading, set, remove, handleDownload } = useFileUpload(world, kindName);
  if (!kind) return null;
  const name = loading?.name || value?.name;
  const onRemove = (e) => {
    e.preventDefault();
    e.stopPropagation();
    remove(onChange);
  };
  const onDownload = async (e) => {
    if (e.shiftKey && value?.url) {
      e.preventDefault();
      await handleDownload(value);
    }
  };
  return /* @__PURE__ */ React.createElement(
    "label",
    {
      className: "fieldfile",
      css: O`
        ${fieldWrapperCss}
        overflow: hidden;
        input {
          position: absolute;
          top: -9999px;
          left: -9999px;
          opacity: 0;
        }
        svg { line-height: 0; }
        .fieldfile-label {
          ${fieldLabelCss}
          flex: 1;
          padding-right: 1rem;
        }
        .fieldfile-placeholder { color: rgba(255, 255, 255, 0.3); }
        .fieldfile-name {
          font-size: 0.9375rem;
          text-align: right;
          white-space: nowrap;
          text-overflow: ellipsis;
          overflow: hidden;
          max-width: 9rem;
        }
        .fieldfile-x {
          line-height: 0;
          margin: 0 -0.2rem 0 0.3rem;
          color: rgba(255, 255, 255, 0.3);
          &:hover { color: white; }
        }
        .fieldfile-loading {
          margin: 0 -0.1rem 0 0.3rem;
          display: flex;
          align-items: center;
          justify-content: center;
          @keyframes spin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }
          svg { animation: spin 1s linear infinite; }
        }
      `,
      ...hintProps,
      onClick: onDownload
    },
    /* @__PURE__ */ React.createElement("div", { className: "fieldfile-label" }, label),
    !value && !loading && /* @__PURE__ */ React.createElement("div", { className: "fieldfile-placeholder" }, kind.placeholder),
    name && /* @__PURE__ */ React.createElement("div", { className: "fieldfile-name" }, name),
    value && !loading && /* @__PURE__ */ React.createElement("div", { className: "fieldfile-x" }, /* @__PURE__ */ React.createElement(X, { size: "1rem", onClick: onRemove })),
    loading && /* @__PURE__ */ React.createElement("div", { className: "fieldfile-loading" }, /* @__PURE__ */ React.createElement(Loader, { size: "1rem" })),
    /* @__PURE__ */ React.createElement("input", { type: "file", onChange: (e) => set(e.target.files[0], onChange), accept: kind.accept })
  );
}

// src/client/components/FieldsComponents/FieldNumber.js
function FieldNumber({ label, hint, dp = 0, min = -Infinity, max = Infinity, step = 1, bigStep = 2, value, onChange }) {
  const hintProps = useFieldHint(hint);
  const inputProps = useFieldNumber(value, onChange, { dp, min, max, step, bigStep });
  return /* @__PURE__ */ React.createElement(
    "label",
    {
      className: "fieldnumber",
      css: O`
        ${fieldWrapperCss}
        cursor: pointer;
        .fieldnumber-label { ${fieldLabelCss} }
        .fieldnumber-field { flex: 1; }
        input { ${fieldInputCss} height: 1rem; overflow: hidden; }
      `,
      ...hintProps
    },
    /* @__PURE__ */ React.createElement("div", { className: "fieldnumber-label" }, label),
    /* @__PURE__ */ React.createElement("div", { className: "fieldnumber-field" }, /* @__PURE__ */ React.createElement("input", { type: "text", ...inputProps }))
  );
}

// src/client/components/FieldsComponents/FieldVec3.js
function FieldVec3({ label, hint, dp = 0, min = -Infinity, max = Infinity, step = 1, bigStep = 2, value, onChange }) {
  const hintProps = useFieldHint(hint);
  const inputs = useFieldVec3(value, onChange, { dp, min, max, step, bigStep });
  return /* @__PURE__ */ React.createElement(
    "label",
    {
      className: "fieldvec3",
      css: O`
        ${fieldWrapperCss}
        .fieldvec3-label { ${fieldLabelCss} }
        .fieldvec3-field {
          flex: 1;
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }
        input {
          ${fieldInputCss}
          font-size: 0.9375rem;
          height: 1rem;
          overflow: hidden;
        }
      `,
      ...hintProps
    },
    /* @__PURE__ */ React.createElement("div", { className: "fieldvec3-label" }, label),
    /* @__PURE__ */ React.createElement("div", { className: "fieldvec3-field" }, /* @__PURE__ */ React.createElement("input", { ...inputs.x }), /* @__PURE__ */ React.createElement("input", { ...inputs.y }), /* @__PURE__ */ React.createElement("input", { ...inputs.z }))
  );
}

// src/client/Portal.js
import { createPortal } from "react-dom";

// src/client/components/FieldsComponents/FieldBtn.js
import { useContext as useContext4 } from "react";
function FieldBtn({ label, note, hint, nav, onClick }) {
  const { setHint } = useContext4(HintContext);
  return /* @__PURE__ */ React.createElement(
    "div",
    {
      className: "fieldbtn",
      css: O`
        display: flex;
        align-items: center;
        height: 2.5rem;
        padding: 0 1rem;
        .fieldbtn-label {
          flex: 1;
          white-space: nowrap;
          text-overflow: ellipsis;
          overflow: hidden;
          font-size: 0.9375rem;
          color: rgba(255, 255, 255, 0.6);
        }
        .fieldbtn-note {
          font-size: 0.9375rem;
          color: rgba(255, 255, 255, 0.4);
        }
        &:hover {
          cursor: pointer;
          background: rgba(255, 255, 255, 0.03);
        }
      `,
      onPointerEnter: () => setHint(hint),
      onPointerLeave: () => setHint(null),
      onClick
    },
    /* @__PURE__ */ React.createElement("div", { className: "fieldbtn-label" }, label),
    note && /* @__PURE__ */ React.createElement("div", { className: "fieldbtn-note" }, note),
    nav && /* @__PURE__ */ React.createElement(ChevronRightIcon, { size: "1.5rem" })
  );
}

// src/client/components/SidebarPanes/Prefs.js
import { useState as useState13 } from "react";

// src/client/components/useFullscreen.js
import { useEffect as useEffect11, useMemo as useMemo6, useState as useState12 } from "react";
function useFullscreen(targetRef) {
  const [enabled, setEnabled] = useState12(false);
  const supported = useMemo6(() => {
    const docEl = document.documentElement;
    return !!(docEl.requestFullscreen || docEl.webkitRequestFullscreen || docEl.mozRequestFullScreen || docEl.msRequestFullscreen);
  }, []);
  const toggle = (value) => {
    const element = targetRef?.current || document.documentElement;
    const shouldEnable = isBoolean_default(value) ? value : !enabled;
    if (!supported) return;
    if (shouldEnable) {
      const request = element.requestFullscreen || element.webkitRequestFullscreen || element.mozRequestFullScreen || element.msRequestFullscreen;
      request?.call(element);
    } else {
      const exit = document.exitFullscreen || document.webkitExitFullscreen || document.mozCancelFullScreen || document.msExitFullscreen;
      exit?.call(document);
    }
  };
  useEffect11(() => {
    const handleChange = () => {
      const isFullscreen = document.fullscreenElement || document.webkitFullscreenElement || document.mozFullScreenElement || document.msFullscreenElement;
      setEnabled(!!isFullscreen);
    };
    document.addEventListener("fullscreenchange", handleChange);
    document.addEventListener("webkitfullscreenchange", handleChange);
    document.addEventListener("mozfullscreenchange", handleChange);
    document.addEventListener("MSFullscreenChange", handleChange);
    return () => {
      document.removeEventListener("fullscreenchange", handleChange);
      document.removeEventListener("webkitfullscreenchange", handleChange);
      document.removeEventListener("mozfullscreenchange", handleChange);
      document.removeEventListener("MSFullscreenChange", handleChange);
    };
  }, []);
  return [supported, enabled, toggle];
}

// src/client/components/SidebarPanes/Pane.js
import { useContext as useContext5 } from "react";
function Pane({ width = "20rem", hidden, children }) {
  return /* @__PURE__ */ React.createElement(
    "div",
    {
      className: cls2("sidebarpane", { hidden }),
      css: O`
        width: ${width};
        max-width: 100%;
        display: flex;
        flex-direction: column;
        .sidebarpane-content {
          pointer-events: auto;
          max-height: 100%;
          display: flex;
          flex-direction: column;
        }
        &.hidden {
          opacity: 0;
          pointer-events: none;
        }
      `
    },
    /* @__PURE__ */ React.createElement("div", { className: "sidebarpane-content" }, children),
    /* @__PURE__ */ React.createElement(Hint, null)
  );
}
function Hint() {
  const { hint } = useContext5(HintContext);
  if (!hint) return null;
  return /* @__PURE__ */ React.createElement(
    "div",
    {
      className: "hint",
      css: O`
        margin-top: 0.25rem;
        background: rgba(11, 10, 21, 0.85);
        border: 0.0625rem solid #2a2b39;
        backdrop-filter: blur(5px);
        border-radius: 1rem;
        min-width: 0;
        padding: 1rem;
        font-size: 0.9375rem;
      `
    },
    /* @__PURE__ */ React.createElement("span", null, hint)
  );
}

// src/client/components/SidebarPanes/Group.js
function Group({ label }) {
  return /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement(
    "div",
    {
      css: O`
          height: 0.0625rem;
          background: rgba(255, 255, 255, 0.05);
          margin: 0.6rem 0;
        `
    }
  ), label && /* @__PURE__ */ React.createElement(
    "div",
    {
      css: O`
            font-weight: 500;
            line-height: 1;
            padding: 0.75rem 0 0.75rem 1rem;
            margin-top: -0.6rem;
          `
    },
    label
  ));
}

// src/client/components/SidebarPanes/PrefsInterface.js
function PrefsInterface({ world, prefs, isFullscreen, toggleFullscreen, isBuilder }) {
  return /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement(Group, { label: "Interface" }), /* @__PURE__ */ React.createElement(
    FieldRange,
    {
      label: "Scale",
      hint: "Change the scale of the user interface",
      min: 0.5,
      max: 1.5,
      step: 0.1,
      value: prefs.ui,
      onChange: (ui) => world.prefs.setUI(ui)
    }
  ), /* @__PURE__ */ React.createElement(
    FieldToggle,
    {
      label: "Fullscreen",
      hint: "Toggle fullscreen. Not supported in some browsers",
      value: isFullscreen,
      onChange: (value) => toggleFullscreen(value),
      trueLabel: "Enabled",
      falseLabel: "Disabled"
    }
  ), isBuilder && /* @__PURE__ */ React.createElement(
    FieldToggle,
    {
      label: "Build Prompts",
      hint: "Show or hide action prompts when in build mode",
      value: prefs.actions,
      onChange: (actions) => world.prefs.setActions(actions),
      trueLabel: "Visible",
      falseLabel: "Hidden"
    }
  ), /* @__PURE__ */ React.createElement(
    FieldToggle,
    {
      label: "Stats",
      hint: "Show or hide performance stats",
      value: prefs.stats,
      onChange: (stats) => world.prefs.setStats(stats),
      trueLabel: "Visible",
      falseLabel: "Hidden"
    }
  ), !isTouch && /* @__PURE__ */ React.createElement(
    FieldBtn,
    {
      label: "Hide Interface",
      note: "Z",
      hint: "Hide the user interface. Press Z to re-enable.",
      onClick: () => world.ui.toggleVisible()
    }
  ));
}

// src/client/components/SidebarPanes/PrefsGraphics.js
var shadowOptions = [
  { label: "None", value: "none" },
  { label: "Low", value: "low" },
  { label: "Med", value: "med" },
  { label: "High", value: "high" }
];
function PrefsGraphics({ world, prefs, dprOptions }) {
  return /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement(Group, { label: "Graphics" }), /* @__PURE__ */ React.createElement(
    FieldSwitch,
    {
      label: "Resolution",
      hint: "Change your display resolution",
      options: dprOptions,
      value: prefs.dpr,
      onChange: (dpr) => world.prefs.setDPR(dpr)
    }
  ), /* @__PURE__ */ React.createElement(
    FieldSwitch,
    {
      label: "Shadows",
      hint: "Change the quality of shadows in the world",
      options: shadowOptions,
      value: prefs.shadows,
      onChange: (shadows) => world.prefs.setShadows(shadows)
    }
  ), /* @__PURE__ */ React.createElement(
    FieldToggle,
    {
      label: "Post-processing",
      hint: "Enable or disable all postprocessing effects",
      trueLabel: "On",
      falseLabel: "Off",
      value: prefs.postprocessing,
      onChange: (postprocessing) => world.prefs.setPostprocessing(postprocessing)
    }
  ), /* @__PURE__ */ React.createElement(
    FieldToggle,
    {
      label: "Bloom",
      hint: "Enable or disable the bloom effect",
      trueLabel: "On",
      falseLabel: "Off",
      value: prefs.bloom,
      onChange: (bloom) => world.prefs.setBloom(bloom)
    }
  ), world.settings.ao && /* @__PURE__ */ React.createElement(
    FieldToggle,
    {
      label: "Ambient Occlusion",
      hint: "Enable or disable the ambient occlusion effect",
      trueLabel: "On",
      falseLabel: "Off",
      value: prefs.ao,
      onChange: (ao) => world.prefs.setAO(ao)
    }
  ));
}

// src/client/components/SidebarPanes/PrefsAudio.js
function PrefsAudio({ world, prefs }) {
  return /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement(Group, { label: "Audio" }), /* @__PURE__ */ React.createElement(
    FieldRange,
    {
      label: "Music",
      hint: "Adjust general music volume",
      min: 0,
      max: 2,
      step: 0.05,
      value: prefs.music,
      onChange: (music) => world.prefs.setMusic(music)
    }
  ), /* @__PURE__ */ React.createElement(
    FieldRange,
    {
      label: "SFX",
      hint: "Adjust sound effects volume",
      min: 0,
      max: 2,
      step: 0.05,
      value: prefs.sfx,
      onChange: (sfx) => world.prefs.setSFX(sfx)
    }
  ), /* @__PURE__ */ React.createElement(
    FieldRange,
    {
      label: "Voice",
      hint: "Adjust global voice chat volume",
      min: 0,
      max: 2,
      step: 0.05,
      value: prefs.voice,
      onChange: (voice) => world.prefs.setVoice(voice)
    }
  ));
}

// src/client/components/SidebarPanes/Prefs.js
function Prefs({ world, hidden }) {
  const player = world.entities.player;
  const { isAdmin, isBuilder } = useRank(world, player);
  const [name, setName] = useState13(() => player.data.name);
  const [canFullscreen, isFullscreen, toggleFullscreen] = useFullscreen();
  const dprOptions = useGraphicsOptions(world);
  const prefs = useSyncedState(world.prefs, [
    "dpr",
    "shadows",
    "postprocessing",
    "bloom",
    "ao",
    "music",
    "sfx",
    "voice",
    "ui",
    "actions",
    "stats"
  ]);
  const changeName = (name2) => {
    if (!name2) return setName(player.data.name);
    player.setName(name2);
  };
  return /* @__PURE__ */ React.createElement(Pane, { hidden }, /* @__PURE__ */ React.createElement("div", { className: "prefs noscrollbar", css: prefsStyles }, /* @__PURE__ */ React.createElement(FieldText, { label: "Name", hint: "Change your name", value: name, onChange: changeName }), /* @__PURE__ */ React.createElement(
    PrefsInterface,
    {
      world,
      prefs,
      isFullscreen,
      toggleFullscreen,
      isBuilder
    }
  ), /* @__PURE__ */ React.createElement(
    PrefsGraphics,
    {
      world,
      prefs,
      dprOptions
    }
  ), /* @__PURE__ */ React.createElement(
    PrefsAudio,
    {
      world,
      prefs
    }
  )));
}

// src/client/components/SidebarPanes/World.js
var voiceChatOptions = [
  { label: "Disabled", value: "disabled" },
  { label: "Spatial", value: "spatial" },
  { label: "Global", value: "global" }
];
function World2({ world, hidden }) {
  const player = world.entities.player;
  const { isAdmin } = useRank(world, player);
  const settings = useSyncedState(world.settings, [
    "title",
    "desc",
    "image",
    "avatar",
    "customAvatars",
    "voice",
    "playerLimit",
    "ao",
    "rank"
  ]);
  return /* @__PURE__ */ React.createElement(Pane, { hidden }, /* @__PURE__ */ React.createElement("div", { className: "world", css: worldStyles }, /* @__PURE__ */ React.createElement("div", { className: "world-head" }, /* @__PURE__ */ React.createElement("div", { className: "world-title" }, "World")), /* @__PURE__ */ React.createElement("div", { className: "world-content noscrollbar" }, /* @__PURE__ */ React.createElement(
    FieldText,
    {
      label: "Title",
      hint: "Change the title of this world. Shown in the browser tab and when sharing links",
      placeholder: "World",
      value: settings.title,
      onChange: (value) => world.settings.set("title", value, true)
    }
  ), /* @__PURE__ */ React.createElement(
    FieldText,
    {
      label: "Description",
      hint: "Change the description of this world. Shown in previews when sharing links to this world",
      value: settings.desc,
      onChange: (value) => world.settings.set("desc", value, true)
    }
  ), /* @__PURE__ */ React.createElement(
    FieldFile,
    {
      label: "Image",
      hint: "Change the image of the world. This is shown when loading into or sharing links to this world.",
      kind: "image",
      value: settings.image,
      onChange: (value) => world.settings.set("image", value, true),
      world
    }
  ), /* @__PURE__ */ React.createElement(
    FieldFile,
    {
      label: "Avatar",
      hint: "Change the default avatar everyone spawns into the world with",
      kind: "avatar",
      value: settings.avatar,
      onChange: (value) => world.settings.set("avatar", value, true),
      world
    }
  ), isAdmin && world.settings.hasAdminCode && /* @__PURE__ */ React.createElement(
    FieldToggle,
    {
      label: "Custom Avatars",
      hint: "Allow visitors to drag and drop custom VRM avatars.",
      trueLabel: "On",
      falseLabel: "Off",
      value: settings.customAvatars,
      onChange: (value) => world.settings.set("customAvatars", value, true)
    }
  ), /* @__PURE__ */ React.createElement(
    FieldSwitch,
    {
      label: "Voice Chat",
      hint: "Set the base voice chat mode. Apps are able to modify this using custom rules.",
      options: voiceChatOptions,
      value: settings.voice,
      onChange: (voice) => world.settings.set("voice", voice, true)
    }
  ), /* @__PURE__ */ React.createElement(
    FieldNumber,
    {
      label: "Player Limit",
      hint: "Set a maximum number of players that can be in the world at one time. Zero means unlimited.",
      value: settings.playerLimit,
      onChange: (value) => world.settings.set("playerLimit", value, true)
    }
  ), /* @__PURE__ */ React.createElement(
    FieldToggle,
    {
      label: "Ambient Occlusion",
      hint: `Improves visuals by approximating darkened corners etc. When enabled, users also have an option to disable this on their device for performance.`,
      trueLabel: "On",
      falseLabel: "Off",
      value: settings.ao,
      onChange: (value) => world.settings.set("ao", value, true)
    }
  ), isAdmin && world.settings.hasAdminCode && /* @__PURE__ */ React.createElement(
    FieldToggle,
    {
      label: "Free Build",
      hint: "Allow everyone to build (and destroy) things in the world.",
      trueLabel: "On",
      falseLabel: "Off",
      value: settings.rank >= Ranks.BUILDER,
      onChange: (value) => world.settings.set("rank", value ? Ranks.BUILDER : Ranks.VISITOR, true)
    }
  ))));
}

// src/client/components/SidebarPanes/Apps.js
import { useEffect as useEffect13, useRef as useRef6, useState as useState15 } from "react";

// src/client/components/AppsListComponents/Content.js
import { useEffect as useEffect12, useState as useState14, useMemo as useMemo7 } from "react";

// src/client/components/AppsListComponents/EntityTargeting.js
var EntityTargeting = class {
  constructor(world) {
    this.world = world;
    this.currentTarget = null;
  }
  getClosest(item) {
    const players = Array.from(this.world.entities.items.values()).filter((e) => e.isPlayer);
    const localPlayer = players.find((p) => p.isLocal) || players[0];
    const playerPosition = localPlayer?.base?.position;
    if (!playerPosition) return null;
    let closestEntity;
    let closestDistance = null;
    const allEntities = Array.from(this.world.entities.items.values());
    const blueprintId = item.blueprint?.id || item.blueprint;
    const appEntities = allEntities.filter((e) => e.isApp);
    const matchingEntities = appEntities.filter((e) => {
      const entityBlueprintId = e.data?.blueprint || e.blueprint?.id || e.blueprint;
      const hasPosition = !!e.position || !!e.data?.position;
      return entityBlueprintId === blueprintId && hasPosition;
    });
    for (const entity of matchingEntities) {
      const entityPos = entity.position || entity.data?.position;
      let distance;
      if (Array.isArray(entityPos)) {
        const dx = playerPosition.x - entityPos[0];
        const dy = playerPosition.y - entityPos[1];
        const dz = playerPosition.z - entityPos[2];
        distance = Math.sqrt(dx * dx + dy * dy + dz * dz);
      } else {
        distance = playerPosition.distanceTo(entityPos);
      }
      if (closestDistance === null || closestDistance > distance) {
        closestEntity = entity;
        closestDistance = distance;
      }
    }
    return closestEntity;
  }
  toggle(item) {
    if (this.currentTarget === item) {
      this.world.target?.hide();
      this.currentTarget = null;
      return;
    }
    const entity = this.getClosest(item);
    if (!entity) return;
    const entityPos = entity.position || entity.data?.position;
    const posToShow = Array.isArray(entityPos) ? { x: entityPos[0], y: entityPos[1], z: entityPos[2] } : entityPos;
    this.world.target?.show(posToShow);
    this.currentTarget = item;
  }
  hide() {
    this.world.target?.hide();
    this.currentTarget = null;
  }
  isTargeting(item) {
    return this.currentTarget === item;
  }
};

// src/client/components/AppsListComponents/AppActions.js
var AppActions = class {
  constructor(world, network, blueprints, entityTargeting, setRefresh) {
    this.world = world;
    this.network = network;
    this.blueprints = blueprints;
    this.entityTargeting = entityTargeting;
    this.setRefresh = setRefresh;
  }
  inspect(item) {
    try {
      const entity = this.entityTargeting.getClosest(item);
      if (!entity) return;
      this.world.ui.setApp(entity);
    } catch (e) {
    }
  }
  toggle(item) {
    const blueprint = this.blueprints.get(item.blueprint.id);
    const version = (parseInt(blueprint.version || 0) + 1).toString();
    const disabled = !blueprint.disabled;
    this.blueprints.modify({ id: blueprint.id, version, disabled });
    this.network.send("blueprintModified", { id: blueprint.id, version, disabled });
    this.setRefresh((n) => n + 1);
  }
};

// src/client/components/AppsListComponents/TableHeader.js
function TableHeader({ sort, reorder }) {
  return /* @__PURE__ */ React.createElement("div", { className: "appslist-head" }, /* @__PURE__ */ React.createElement(
    "div",
    {
      className: cls2("appslist-headitem name", { active: sort === "name" }),
      onClick: () => reorder("name"),
      title: "Name"
    },
    /* @__PURE__ */ React.createElement("span", null)
  ), /* @__PURE__ */ React.createElement(
    "div",
    {
      className: cls2("appslist-headitem count", { active: sort === "count" }),
      onClick: () => reorder("count"),
      title: "Instances"
    },
    /* @__PURE__ */ React.createElement(Hash, { size: "1.125rem" })
  ), /* @__PURE__ */ React.createElement(
    "div",
    {
      className: cls2("appslist-headitem geometries", { active: sort === "geometries" }),
      onClick: () => reorder("geometries"),
      title: "Geometries"
    },
    /* @__PURE__ */ React.createElement(Box, { size: "1.125rem" })
  ), /* @__PURE__ */ React.createElement(
    "div",
    {
      className: cls2("appslist-headitem triangles", { active: sort === "triangles" }),
      onClick: () => reorder("triangles"),
      title: "Triangles"
    },
    /* @__PURE__ */ React.createElement(Triangle, { size: "1.125rem" })
  ), /* @__PURE__ */ React.createElement(
    "div",
    {
      className: cls2("appslist-headitem textureSize", { active: sort === "textureBytes" }),
      onClick: () => reorder("textureBytes"),
      title: "Texture Memory Size"
    },
    /* @__PURE__ */ React.createElement(BrickWall, { size: "1.125rem" })
  ), /* @__PURE__ */ React.createElement(
    "div",
    {
      className: cls2("appslist-headitem code", { active: sort === "code" }),
      onClick: () => reorder("code"),
      title: "Code"
    },
    /* @__PURE__ */ React.createElement(FileCode2, { size: "1.125rem" })
  ), /* @__PURE__ */ React.createElement(
    "div",
    {
      className: cls2("appslist-headitem fileSize", { active: sort === "fileBytes" }),
      onClick: () => reorder("fileBytes"),
      title: "File Size"
    },
    /* @__PURE__ */ React.createElement(HardDrive, { size: 16 })
  ), /* @__PURE__ */ React.createElement("div", { className: "appslist-headitem actions" }));
}

// src/client/components/AppsListComponents/TableRow.js
function TableRow({ item, entityTargeting, onInspect, onToggle, onToggleTarget }) {
  return /* @__PURE__ */ React.createElement("div", { key: item.blueprint.id, className: "appslist-row" }, /* @__PURE__ */ React.createElement("div", { className: "appslist-rowitem name", onClick: () => onInspect(item) }, /* @__PURE__ */ React.createElement("span", null, item.name)), /* @__PURE__ */ React.createElement("div", { className: "appslist-rowitem count" }, /* @__PURE__ */ React.createElement("span", null, item.count)), /* @__PURE__ */ React.createElement("div", { className: "appslist-rowitem geometries" }, /* @__PURE__ */ React.createElement("span", null, item.geometries)), /* @__PURE__ */ React.createElement("div", { className: "appslist-rowitem triangles" }, /* @__PURE__ */ React.createElement("span", null, formatNumber(item.triangles))), /* @__PURE__ */ React.createElement("div", { className: "appslist-rowitem textureSize" }, /* @__PURE__ */ React.createElement("span", null, item.textureSize)), /* @__PURE__ */ React.createElement("div", { className: "appslist-rowitem code" }, /* @__PURE__ */ React.createElement("span", null, item.code ? "Yes" : "No")), /* @__PURE__ */ React.createElement("div", { className: "appslist-rowitem fileSize" }, /* @__PURE__ */ React.createElement("span", null, item.fileSize)), /* @__PURE__ */ React.createElement("div", { className: "appslist-rowitem actions" }, !item.blueprint.scene && /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement(
    "div",
    {
      className: cls2("appslist-action", { active: item.blueprint.disabled }),
      onClick: () => onToggle(item)
    },
    /* @__PURE__ */ React.createElement(OctagonX, { size: "1rem" })
  ), /* @__PURE__ */ React.createElement(
    "div",
    {
      className: cls2("appslist-action", { active: entityTargeting.isTargeting(item) }),
      onClick: () => onToggleTarget(item)
    },
    /* @__PURE__ */ React.createElement(Crosshair, { size: "1rem" })
  ))));
}

// src/client/components/AppsListComponents/Content.js
function Content({ world, query, perf, refresh, setRefresh }) {
  const [sort, setSort] = useState14("count");
  const [asc, setAsc] = useState14(false);
  const { items } = useAppStats(world, { query, sortKey: sort, ascending: asc, refresh });
  const entityTargeting = useMemo7(() => new EntityTargeting(world), [world]);
  const appActions = useMemo7(() => new AppActions(world, world.network, world.blueprints, entityTargeting, setRefresh), [world, entityTargeting, setRefresh]);
  const reorder = (key) => {
    if (sort === key) {
      setAsc(!asc);
    } else {
      setSort(key);
      setAsc(false);
    }
  };
  useEffect12(() => {
    return () => entityTargeting.hide();
  }, [entityTargeting]);
  const handleToggleTarget = (item) => {
    entityTargeting.toggle(item);
  };
  const handleInspect = (item) => {
    appActions.inspect(item);
  };
  const handleToggle = (item) => {
    appActions.toggle(item);
  };
  return /* @__PURE__ */ React.createElement("div", { className: cls2("appslist", { hideperf: !perf }), css: contentStyles }, /* @__PURE__ */ React.createElement(TableHeader, { sort, reorder }), /* @__PURE__ */ React.createElement("div", { className: "appslist-rows" }, items.map((item) => /* @__PURE__ */ React.createElement(
    TableRow,
    {
      key: item.blueprint.id,
      item,
      entityTargeting,
      onInspect: handleInspect,
      onToggle: handleToggle,
      onToggleTarget: handleToggleTarget
    }
  ))));
}

// src/client/components/SidebarPanes/Apps.js
var appsState = {
  query: "",
  perf: false,
  scrollTop: 0
};
function Apps({ world, hidden }) {
  const contentRef = useRef6();
  const [query, setQuery] = useState15(appsState.query);
  const [perf, setPerf] = useState15(appsState.perf);
  const [refresh, setRefresh] = useState15(0);
  useEffect13(() => {
    contentRef.current.scrollTop = appsState.scrollTop;
  }, []);
  useEffect13(() => {
    appsState.query = query;
    appsState.perf = perf;
  }, [query, perf]);
  return /* @__PURE__ */ React.createElement(Pane, { width: perf ? "40rem" : "20rem", hidden }, /* @__PURE__ */ React.createElement("div", { className: "apps", css: appsStyles }, /* @__PURE__ */ React.createElement("div", { className: "apps-head" }, /* @__PURE__ */ React.createElement("div", { className: "apps-title" }, "Apps"), /* @__PURE__ */ React.createElement("label", { className: "apps-search" }, /* @__PURE__ */ React.createElement(Search, { size: "1.125rem" }), /* @__PURE__ */ React.createElement("input", { type: "text", placeholder: "Search", value: query, onChange: (e) => setQuery(e.target.value) })), /* @__PURE__ */ React.createElement("div", { className: cls2("apps-toggle", { active: perf }), onClick: () => setPerf(!perf) }, /* @__PURE__ */ React.createElement(Rocket, { size: "1.125rem" }))), /* @__PURE__ */ React.createElement(
    "div",
    {
      ref: contentRef,
      className: "apps-content noscrollbar",
      onScroll: (e) => {
        appsState.scrollTop = contentRef.current.scrollTop;
      }
    },
    /* @__PURE__ */ React.createElement(Content, { world, query, perf, refresh, setRefresh })
  )));
}

// src/core/factories/BlueprintFactory.js
var appValidator = new AppValidator();
var DEFAULT_BLUEPRINT = {
  id: null,
  version: "0",
  name: "",
  image: null,
  author: null,
  url: null,
  desc: null,
  model: null,
  script: null,
  props: {},
  preload: false,
  public: false,
  locked: false,
  frozen: false,
  unique: false,
  scene: false,
  disabled: false
};
var TYPE_DEFAULTS = {
  app: { ...DEFAULT_BLUEPRINT },
  scene: { ...DEFAULT_BLUEPRINT, scene: true },
  model: { ...DEFAULT_BLUEPRINT, model: "asset://model.glb" },
  avatar: { ...DEFAULT_BLUEPRINT, model: "asset://avatar.vrm" }
};
var BlueprintFactory = class extends BaseFactory {
  static create(config = {}) {
    const { type = "app", ...data } = config;
    const defaults = TYPE_DEFAULTS[type] || TYPE_DEFAULTS.app;
    const blueprint = { ...defaults, ...data };
    if (!blueprint.id) {
      blueprint.id = uuid();
    }
    if (blueprint.version !== void 0 && typeof blueprint.version !== "string") {
      blueprint.version = String(blueprint.version);
    }
    this.validate(blueprint);
    return blueprint;
  }
  static validate(blueprint) {
    if (!blueprint) {
      throw new Error("Blueprint is null or undefined");
    }
    if (typeof blueprint !== "object") {
      throw new Error("Blueprint must be an object");
    }
    if (!blueprint.id || typeof blueprint.id !== "string") {
      throw new Error("Blueprint must have a valid id (string)");
    }
    if (blueprint.version === void 0 || typeof blueprint.version !== "string" && typeof blueprint.version !== "number") {
      throw new Error("Blueprint must have a valid version (string or number)");
    }
    if (blueprint.name === void 0 || typeof blueprint.name !== "string") {
      throw new Error("Blueprint must have a valid name (string)");
    }
    const normalized = appValidator.normalizeBlueprint(blueprint);
    const validation = appValidator.validateBlueprint(normalized);
    if (!validation.valid) {
      throw new Error(`Blueprint validation failed: ${validation.error}`);
    }
    return blueprint;
  }
  static createBlueprint(type = "app", data = {}) {
    return this.create({ type, ...data });
  }
  static createDefault(type = "app") {
    return this.create({ type });
  }
  static mergeBlueprintData(defaults = {}, overrides = {}) {
    const merged = { ...defaults, ...overrides };
    this.validate(merged);
    return merged;
  }
  static formatBlueprint(blueprint) {
    const formatted = { ...blueprint };
    if (!formatted.id) {
      formatted.id = uuid();
    }
    if (formatted.version === void 0 || formatted.version === null) {
      formatted.version = "0";
    } else if (typeof formatted.version !== "string") {
      formatted.version = String(formatted.version);
    }
    if (!formatted.name || typeof formatted.name !== "string") {
      formatted.name = "";
    }
    this.validate(formatted);
    return formatted;
  }
};

// src/client/components/SidebarPanes/Add.js
function Add({ world, hidden }) {
  const collection = world.collections.get("default");
  const span = 4;
  const gap = "0.5rem";
  const add = (blueprint) => {
    blueprint = BlueprintFactory.createBlueprint("app", cloneDeep_default(blueprint));
    world.blueprints.add(blueprint, true);
    const transform = world.builder.getSpawnTransform(true);
    world.builder.toggle(true);
    world.builder.control.pointer.lock();
    setTimeout(() => {
      const data = {
        id: uuid(),
        type: "app",
        blueprint: blueprint.id,
        position: transform.position,
        quaternion: transform.quaternion,
        scale: [1, 1, 1],
        mover: world.network.id,
        uploader: null,
        pinned: false,
        state: {}
      };
      const app = world.entities.add(data, true);
      world.builder.select(app);
    }, 100);
  };
  return /* @__PURE__ */ React.createElement(Pane, { hidden }, /* @__PURE__ */ React.createElement("div", { className: "add", css: addStyles(span, gap) }, /* @__PURE__ */ React.createElement("div", { className: "add-head" }, /* @__PURE__ */ React.createElement("div", { className: "add-title" }, "Add")), /* @__PURE__ */ React.createElement("div", { className: "add-content noscrollbar" }, /* @__PURE__ */ React.createElement("div", { className: "add-items" }, collection.blueprints.map((blueprint) => /* @__PURE__ */ React.createElement("div", { className: "add-item", key: blueprint.id, onClick: () => add(blueprint) }, /* @__PURE__ */ React.createElement("div", { className: "add-item-image", css: addItemImageStyles(world.resolveURL(blueprint.image?.url)) }), /* @__PURE__ */ React.createElement("div", { className: "add-item-name" }, blueprint.name)))))));
}

// src/client/components/SidebarPanes/App.js
import { useContext as useContext6, useEffect as useEffect15, useState as useState19 } from "react";

// src/client/AppFields.js
import { useState as useState16, useEffect as useEffect14 } from "react";
function AppFields({ world, app, blueprint }) {
  const [name, setName] = useState16(blueprint.name || "");
  const [description, setDescription] = useState16(blueprint.description || "");
  const [preview, setPreview] = useState16(blueprint.preview || "");
  const [icon, setIcon] = useState16(blueprint.icon || "");
  const [tags, setTags] = useState16(blueprint.tags?.join(", ") || "");
  const [authors, setAuthors] = useState16(blueprint.authors?.join(", ") || "");
  const [listable, setListable] = useState16(blueprint.listable !== false);
  const [public_, setPublic] = useState16(blueprint.public === true);
  const [locked, setLocked] = useState16(blueprint.locked === true);
  const [preload, setPreload] = useState16(blueprint.preload === true);
  const [unique, setUnique] = useState16(blueprint.unique === true);
  const modify = (updates) => {
    const version = blueprint.version + 1;
    world.blueprints.modify({ id: blueprint.id, version, ...updates });
    world.network.send("blueprintModified", { id: blueprint.id, version, ...updates });
  };
  useEffect14(() => {
    const onModify = (bp) => {
      if (bp.id === blueprint.id) {
        setName(bp.name || "");
        setDescription(bp.description || "");
        setPreview(bp.preview || "");
        setIcon(bp.icon || "");
        setTags(bp.tags?.join(", ") || "");
        setAuthors(bp.authors?.join(", ") || "");
        setListable(bp.listable !== false);
        setPublic(bp.public === true);
        setLocked(bp.locked === true);
        setPreload(bp.preload === true);
        setUnique(bp.unique === true);
      }
    };
    world.blueprints.on("modify", onModify);
    return () => world.blueprints.off("modify", onModify);
  }, [blueprint.id]);
  return /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement(
    FieldText,
    {
      label: "Name",
      value: name,
      onChange: (value) => {
        setName(value);
        modify({ name: value });
      }
    }
  ), /* @__PURE__ */ React.createElement(
    FieldTextarea,
    {
      label: "Description",
      value: description,
      onChange: (value) => {
        setDescription(value);
        modify({ description: value });
      }
    }
  ), /* @__PURE__ */ React.createElement(
    FieldText,
    {
      label: "Icon URL",
      value: icon,
      onChange: (value) => {
        setIcon(value);
        modify({ icon: value });
      }
    }
  ), /* @__PURE__ */ React.createElement(
    FieldText,
    {
      label: "Preview Image URL",
      value: preview,
      onChange: (value) => {
        setPreview(value);
        modify({ preview: value });
      }
    }
  ), /* @__PURE__ */ React.createElement(
    FieldText,
    {
      label: "Tags (comma-separated)",
      value: tags,
      onChange: (value) => {
        setTags(value);
        const tagArray = value.split(",").map((t) => t.trim()).filter((t) => t);
        modify({ tags: tagArray });
      }
    }
  ), /* @__PURE__ */ React.createElement(
    FieldText,
    {
      label: "Authors (comma-separated)",
      value: authors,
      onChange: (value) => {
        setAuthors(value);
        const authorArray = value.split(",").map((a) => a.trim()).filter((a) => a);
        modify({ authors: authorArray });
      }
    }
  ), /* @__PURE__ */ React.createElement(
    FieldToggle,
    {
      label: "Listable",
      value: listable,
      onChange: (value) => {
        setListable(value);
        modify({ listable: value });
      }
    }
  ), /* @__PURE__ */ React.createElement(
    FieldToggle,
    {
      label: "Public",
      value: public_,
      onChange: (value) => {
        setPublic(value);
        modify({ public: value });
      }
    }
  ), /* @__PURE__ */ React.createElement(
    FieldToggle,
    {
      label: "Locked",
      value: locked,
      onChange: (value) => {
        setLocked(value);
        modify({ locked: value });
      }
    }
  ), /* @__PURE__ */ React.createElement(
    FieldToggle,
    {
      label: "Preload",
      value: preload,
      onChange: (value) => {
        setPreload(value);
        modify({ preload: value });
      }
    }
  ), /* @__PURE__ */ React.createElement(
    FieldToggle,
    {
      label: "Unique",
      value: unique,
      onChange: (value) => {
        setUnique(value);
        modify({ unique: value });
      }
    }
  ));
}

// src/client/components/SidebarPanes/AppTransformFields.js
import { useState as useState17 } from "react";
var e1 = new three_exports.Euler();
var q1 = new three_exports.Quaternion();
function AppTransformFields({ app }) {
  const [position2, setPosition] = useState17(app.root.position.toArray());
  const [rotation, setRotation] = useState17(app.root.rotation.toArray().map((n) => n * RAD2DEG));
  const [scale, setScale] = useState17(app.root.scale.toArray());
  return /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement(
    FieldVec3,
    {
      label: "Position",
      dp: 1,
      step: 0.1,
      bigStep: 1,
      value: position2,
      onChange: (value) => {
        setPosition(value);
        app.modify({ position: value });
        app.world.network.send("entityModified", { id: app.data.id, position: value });
      }
    }
  ), /* @__PURE__ */ React.createElement(
    FieldVec3,
    {
      label: "Rotation",
      dp: 1,
      step: 1,
      bigStep: 5,
      value: rotation,
      onChange: (value) => {
        setRotation(value);
        value = q1.setFromEuler(e1.fromArray(value.map((n) => n * DEG2RAD))).toArray();
        app.modify({ quaternion: value });
        app.world.network.send("entityModified", { id: app.data.id, quaternion: value });
      }
    }
  ), /* @__PURE__ */ React.createElement(
    FieldVec3,
    {
      label: "Scale",
      dp: 1,
      step: 0.1,
      bigStep: 1,
      value: scale,
      onChange: (value) => {
        setScale(value);
        app.modify({ scale: value });
        app.world.network.send("entityModified", { id: app.data.id, scale: value });
      }
    }
  ));
}

// src/client/components/SidebarPanes/AppModelBtn.js
import { useState as useState18 } from "react";
function AppModelBtn({ value, onChange, children, world }) {
  const [key, setKey] = useState18(0);
  const handleDownload = (e) => {
    if (e.shiftKey) {
      e.preventDefault();
      const file = world.loader.getFile(value);
      if (!file) return;
      downloadFile(file);
    }
  };
  const handleChange = (e) => {
    setKey((n) => n + 1);
    onChange(e.target.files[0]);
  };
  return /* @__PURE__ */ React.createElement(
    "label",
    {
      className: "appmodelbtn",
      css: O`
        overflow: hidden;
        input {
          position: absolute;
          top: -9999px;
        }
      `,
      onClick: handleDownload
    },
    /* @__PURE__ */ React.createElement("input", { key, type: "file", accept: ".glb,.vrm", onChange: handleChange }),
    children
  );
}

// src/client/components/SidebarPanes/App.js
var showTransforms = false;
function App({ world, hidden }) {
  const { setHint } = useContext6(HintContext);
  const app = world.ui.state.app;
  const [pinned, setPinned] = useState19(app.data.pinned);
  const [transforms, setTransforms] = useState19(showTransforms);
  const [blueprint, setBlueprint] = useState19(app.blueprint);
  const { download, changeModel, toggleBlueprintKey, toggleEntityPinned } = useAppLogic(world);
  useEffect15(() => {
    showTransforms = transforms;
  }, [transforms]);
  useEffect15(() => {
    window.app = app;
    const onModify = (bp) => {
      if (bp.id === blueprint.id) setBlueprint(bp);
    };
    world.blueprints.on("modify", onModify);
    return () => {
      world.blueprints.off("modify", onModify);
    };
  }, []);
  const frozen = blueprint.frozen;
  const handleDownload = () => download(blueprint);
  const handleChangeModel = (file) => changeModel(blueprint, file);
  const toggleKey = (key, value) => toggleBlueprintKey(blueprint, key, value);
  const togglePinned = () => {
    const newPinned = toggleEntityPinned(app);
    setPinned(newPinned);
  };
  return /* @__PURE__ */ React.createElement(Pane, { hidden }, /* @__PURE__ */ React.createElement("div", { className: "app", css: appStyles }, /* @__PURE__ */ React.createElement("div", { className: "app-head" }, /* @__PURE__ */ React.createElement("div", { className: "app-title" }, app.blueprint.name), /* @__PURE__ */ React.createElement(
    "div",
    {
      className: "app-btn",
      onClick: handleDownload,
      onPointerEnter: () => setHint("Download this app"),
      onPointerLeave: () => setHint(null)
    },
    /* @__PURE__ */ React.createElement(Download, { size: "1.125rem" })
  ), !frozen && /* @__PURE__ */ React.createElement(AppModelBtn, { value: blueprint.model, onChange: handleChangeModel, world }, /* @__PURE__ */ React.createElement(
    "div",
    {
      className: "app-btn",
      onPointerEnter: () => setHint("Change this apps base model"),
      onPointerLeave: () => setHint(null)
    },
    /* @__PURE__ */ React.createElement(Box, { size: "1.125rem" })
  )), !blueprint.scene && /* @__PURE__ */ React.createElement(
    "div",
    {
      className: "app-btn",
      onClick: () => {
        world.ui.setApp(null);
        app.destroy(true);
      },
      onPointerEnter: () => setHint("Delete this app"),
      onPointerLeave: () => setHint(null)
    },
    /* @__PURE__ */ React.createElement(Trash2, { size: "1.125rem" })
  )), !blueprint.scene && /* @__PURE__ */ React.createElement("div", { className: "app-toggles" }, /* @__PURE__ */ React.createElement(
    "div",
    {
      className: cls2("app-toggle", { active: blueprint.disabled }),
      onClick: () => toggleKey("disabled"),
      onPointerEnter: () => setHint("Disable this app so that it is no longer active in the world."),
      onPointerLeave: () => setHint(null)
    },
    /* @__PURE__ */ React.createElement(OctagonX, { size: "1.125rem" })
  ), /* @__PURE__ */ React.createElement(
    "div",
    {
      className: cls2("app-toggle", { active: pinned }),
      onClick: () => togglePinned(),
      onPointerEnter: () => setHint("Pin this app so it can't accidentally be moved."),
      onPointerLeave: () => setHint(null)
    },
    /* @__PURE__ */ React.createElement(Pin, { size: "1.125rem" })
  ), /* @__PURE__ */ React.createElement(
    "div",
    {
      className: cls2("app-toggle", { active: blueprint.preload }),
      onClick: () => toggleKey("preload"),
      onPointerEnter: () => setHint("Preload this app before entering the world."),
      onPointerLeave: () => setHint(null)
    },
    /* @__PURE__ */ React.createElement(LoaderPinwheel, { size: "1.125rem" })
  ), /* @__PURE__ */ React.createElement(
    "div",
    {
      className: cls2("app-toggle", { active: blueprint.unique }),
      onClick: () => toggleKey("unique"),
      onPointerEnter: () => setHint("Make this app unique so that new duplicates are not linked to this one."),
      onPointerLeave: () => setHint(null)
    },
    /* @__PURE__ */ React.createElement(Sparkle, { size: "1.125rem" })
  )), /* @__PURE__ */ React.createElement("div", { className: "app-content noscrollbar" }, !blueprint.scene && /* @__PURE__ */ React.createElement("div", { className: "app-transforms" }, /* @__PURE__ */ React.createElement("div", { className: "app-transforms-btn", onClick: () => setTransforms(!transforms) }, /* @__PURE__ */ React.createElement(ChevronsUpDown, { size: "1rem" })), transforms && /* @__PURE__ */ React.createElement(AppTransformFields, { app })), /* @__PURE__ */ React.createElement(AppFields, { world, app, blueprint }))));
}

// src/client/components/SidebarPanes/Script.js
import { useEffect as useEffect17, useRef as useRef8, useState as useState21 } from "react";

// src/client/components/ScriptEditorComponents/Editor.js
import { useEffect as useEffect16, useRef as useRef7, useState as useState20 } from "react";

// src/client/utils/monaco/MonacoConfig.js
var MONACO_VERSION = "0.49.0";
var MONACO_CDN = {
  loader: `https://cdnjs.cloudflare.com/ajax/libs/monaco-editor/${MONACO_VERSION}/min/vs/loader.js`,
  baseUrl: `https://cdnjs.cloudflare.com/ajax/libs/monaco-editor/${MONACO_VERSION}/min/vs`
};
var MONACO_MODULES = {
  main: "vs/editor/editor.main"
};

// src/client/utils/monaco/MonacoWorkerInit.js
var MonacoWorkerInit = class {
  constructor() {
    this.scriptLoaded = false;
    this.scriptLoadPromise = null;
  }
  loadScript() {
    if (this.scriptLoaded) {
      return Promise.resolve();
    }
    if (this.scriptLoadPromise) {
      return this.scriptLoadPromise;
    }
    this.scriptLoadPromise = new Promise((resolve, reject) => {
      try {
        const script = document.createElement("script");
        script.src = MONACO_CDN.loader;
        script.type = "text/javascript";
        script.async = true;
        script.onload = () => {
          this.scriptLoaded = true;
          resolve();
        };
        script.onerror = () => {
          const error = handleMonacoError(
            new Error(`Failed to load Monaco script from ${MONACO_CDN.loader}`),
            "scriptLoad"
          );
          reject(error);
        };
        script.onabort = () => {
          const error = handleMonacoError(
            new Error("Monaco script loading was aborted"),
            "scriptAbort"
          );
          reject(error);
        };
        document.head.appendChild(script);
      } catch (err) {
        const error = handleMonacoError(err, "scriptCreation");
        reject(error);
      }
    });
    return this.scriptLoadPromise;
  }
  async initialize() {
    await this.loadScript();
  }
  isInitialized() {
    return this.scriptLoaded && typeof window.require !== "undefined";
  }
  reset() {
    this.scriptLoaded = false;
    this.scriptLoadPromise = null;
  }
};

// src/client/utils/monaco/MonacoModuleLoader.js
var MonacoModuleLoader = class {
  constructor() {
    this.requireConfig = {
      paths: {
        vs: MONACO_CDN.baseUrl
      }
    };
  }
  setupRequire() {
    if (!window.require) {
      window.require = this.requireConfig;
    } else {
      window.require.paths = window.require.paths || {};
      window.require.paths.vs = MONACO_CDN.baseUrl;
    }
  }
  async loadMainModule() {
    return new Promise((resolve, reject) => {
      try {
        this.setupRequire();
        window.require([MONACO_MODULES.main], () => {
          if (!window.monaco) {
            throw new Error("Monaco editor main module loaded but window.monaco not available");
          }
          resolve(window.monaco);
        });
      } catch (err) {
        const error = handleMonacoError(err, "loadMainModule");
        reject(error);
      }
    });
  }
  async loadModule(modulePath) {
    return new Promise((resolve, reject) => {
      try {
        this.setupRequire();
        window.require([modulePath], (module) => {
          resolve(module);
        });
      } catch (err) {
        const error = handleMonacoError(err, `loadModule:${modulePath}`);
        reject(error);
      }
    });
  }
};

// src/client/utils/monaco/MonacoTheme.js
var darkPlusTheme = {
  inherit: true,
  base: "vs-dark",
  rules: [
    { foreground: "#DCDCAA", token: "entity.name.function" },
    { foreground: "#DCDCAA", token: "support.function" },
    { foreground: "#DCDCAA", token: "support.constant.handlebars" },
    { foreground: "#DCDCAA", token: "source.powershell variable.other.member" },
    { foreground: "#DCDCAA", token: "entity.name.operator.custom-literal" },
    { foreground: "#4EC9B0", token: "meta.return-type" },
    { foreground: "#4EC9B0", token: "support.class" },
    { foreground: "#4EC9B0", token: "support.type" },
    { foreground: "#4EC9B0", token: "entity.name.type" },
    { foreground: "#4EC9B0", token: "entity.name.namespace" },
    { foreground: "#4EC9B0", token: "entity.other.attribute" },
    { foreground: "#4EC9B0", token: "entity.name.scope-resolution" },
    { foreground: "#4EC9B0", token: "entity.name.class" },
    { foreground: "#4EC9B0", token: "storage.type.numeric.go" },
    { foreground: "#4EC9B0", token: "storage.type.byte.go" },
    { foreground: "#4EC9B0", token: "storage.type.boolean.go" },
    { foreground: "#4EC9B0", token: "storage.type.string.go" },
    { foreground: "#4EC9B0", token: "storage.type.uintptr.go" },
    { foreground: "#4EC9B0", token: "storage.type.error.go" },
    { foreground: "#4EC9B0", token: "storage.type.rune.go" },
    { foreground: "#4EC9B0", token: "storage.type.cs" },
    { foreground: "#4EC9B0", token: "storage.type.generic.cs" },
    { foreground: "#4EC9B0", token: "storage.type.modifier.cs" },
    { foreground: "#4EC9B0", token: "storage.type.variable.cs" },
    { foreground: "#4EC9B0", token: "storage.type.annotation.java" },
    { foreground: "#4EC9B0", token: "storage.type.generic.java" },
    { foreground: "#4EC9B0", token: "storage.type.java" },
    { foreground: "#4EC9B0", token: "storage.type.object.array.java" },
    { foreground: "#4EC9B0", token: "storage.type.primitive.array.java" },
    { foreground: "#4EC9B0", token: "storage.type.primitive.java" },
    { foreground: "#4EC9B0", token: "storage.type.token.java" },
    { foreground: "#4EC9B0", token: "storage.type.groovy" },
    { foreground: "#4EC9B0", token: "storage.type.annotation.groovy" },
    { foreground: "#4EC9B0", token: "storage.type.parameters.groovy" },
    { foreground: "#4EC9B0", token: "storage.type.generic.groovy" },
    { foreground: "#4EC9B0", token: "storage.type.object.array.groovy" },
    { foreground: "#4EC9B0", token: "storage.type.primitive.array.groovy" },
    { foreground: "#4EC9B0", token: "storage.type.primitive.groovy" },
    { foreground: "#4EC9B0", token: "meta.type.cast.expr" },
    { foreground: "#4EC9B0", token: "meta.type.new.expr" },
    { foreground: "#4EC9B0", token: "support.constant.math" },
    { foreground: "#4EC9B0", token: "support.constant.dom" },
    { foreground: "#4EC9B0", token: "support.constant.json" },
    { foreground: "#4EC9B0", token: "entity.other.inherited-class" },
    { foreground: "#C586C0", token: "keyword.control" },
    { foreground: "#C586C0", token: "source.cpp keyword.operator.new" },
    { foreground: "#C586C0", token: "keyword.operator.delete" },
    { foreground: "#C586C0", token: "keyword.other.using" },
    { foreground: "#C586C0", token: "keyword.other.operator" },
    { foreground: "#C586C0", token: "entity.name.operator" },
    { foreground: "#9CDCFE", token: "variable" },
    { foreground: "#9CDCFE", token: "meta.definition.variable.name" },
    { foreground: "#9CDCFE", token: "support.variable" },
    { foreground: "#9CDCFE", token: "entity.name.variable" },
    { foreground: "#4FC1FF", token: "variable.other.constant" },
    { foreground: "#4FC1FF", token: "variable.other.enummember" },
    { foreground: "#9CDCFE", token: "meta.object-literal.key" },
    { foreground: "#CE9178", token: "support.constant.property-value" },
    { foreground: "#CE9178", token: "support.constant.font-name" },
    { foreground: "#CE9178", token: "support.constant.media-type" },
    { foreground: "#CE9178", token: "support.constant.media" },
    { foreground: "#CE9178", token: "constant.other.color.rgb-value" },
    { foreground: "#CE9178", token: "constant.other.rgb-value" },
    { foreground: "#CE9178", token: "support.constant.color" },
    { foreground: "#CE9178", token: "punctuation.definition.group.regexp" },
    { foreground: "#CE9178", token: "punctuation.definition.group.assertion.regexp" },
    { foreground: "#CE9178", token: "punctuation.definition.character-class.regexp" },
    { foreground: "#CE9178", token: "punctuation.character.set.begin.regexp" },
    { foreground: "#CE9178", token: "punctuation.character.set.end.regexp" },
    { foreground: "#CE9178", token: "keyword.operator.negation.regexp" },
    { foreground: "#CE9178", token: "support.other.parenthesis.regexp" },
    { foreground: "#d16969", token: "constant.character.character-class.regexp" },
    { foreground: "#d16969", token: "constant.other.character-class.set.regexp" },
    { foreground: "#d16969", token: "constant.other.character-class.regexp" },
    { foreground: "#d16969", token: "constant.character.set.regexp" },
    { foreground: "#DCDCAA", token: "keyword.operator.or.regexp" },
    { foreground: "#DCDCAA", token: "keyword.control.anchor.regexp" },
    { foreground: "#d7ba7d", token: "keyword.operator.quantifier.regexp" },
    { foreground: "#569cd6", token: "constant.character" },
    { foreground: "#d7ba7d", token: "constant.character.escape" },
    { foreground: "#C8C8C8", token: "entity.name.label" },
    { foreground: "#569CD6", token: "constant.language" },
    { foreground: "#569CD6", token: "entity.name.tag" },
    { foreground: "#569cd6", token: "storage" }
  ],
  colors: {
    "editor.background": "#00000000"
  },
  encodedTokensColors: []
};
function defineTheme(monaco) {
  if (!monaco || !monaco.editor) {
    throw new Error("Monaco editor not available");
  }
  monaco.editor.defineTheme("default", darkPlusTheme);
  monaco.editor.setTheme("default");
}

// src/client/utils/monaco/Monaco.js
var Monaco = class {
  constructor() {
    this.workerInit = new MonacoWorkerInit();
    this.moduleLoader = new MonacoModuleLoader();
    this.loadPromise = null;
    this.loaded = false;
  }
  async load() {
    if (this.loaded) {
      return window.monaco;
    }
    if (this.loadPromise) {
      return this.loadPromise;
    }
    this.loadPromise = this.initialize();
    return this.loadPromise;
  }
  async initialize() {
    try {
      await this.workerInit.initialize();
      const monaco = await this.moduleLoader.loadMainModule();
      defineTheme(monaco);
      this.loaded = true;
      return monaco;
    } catch (err) {
      const error = handleMonacoError(err, "initialize");
      this.loadPromise = null;
      throw error;
    }
  }
  get() {
    return validateMonacoLoaded();
  }
  isLoaded() {
    return this.loaded;
  }
  reset() {
    this.loaded = false;
    this.loadPromise = null;
    this.workerInit.reset();
  }
};
var monacoInstance = null;
function getMonaco() {
  if (!monacoInstance) {
    monacoInstance = new Monaco();
  }
  return monacoInstance;
}
async function loadMonaco() {
  const monaco = getMonaco();
  return monaco.load();
}

// src/client/utils/monacoLoader.js
var promise;
var load = () => {
  if (promise) return promise;
  promise = loadMonaco();
  return promise;
};

// src/client/components/ScriptEditorComponents/Editor.js
var logger14 = new StructuredLogger("Editor");
var cached = {
  key: null,
  viewState: null,
  value: null,
  model: null
};
function Editor({ app, onHandle }) {
  const key = app.data.id;
  const mountRef = useRef7();
  const codeRef = useRef7();
  const [editor, setEditor] = useState20(null);
  const [fontSize, setFontSize] = useState20(() => 12 * app.world.prefs.ui);
  const save = async () => {
    const world = app.world;
    const blueprint = app.blueprint;
    const code = codeRef.current;
    const blob = new Blob([code], { type: "text/plain" });
    const file = new File([blob], "script.js", { type: "text/plain" });
    const hash2 = await hashFile(file);
    const filename = `${hash2}.js`;
    const url = `asset://${filename}`;
    world.loader.insert("script", url, file);
    const version = blueprint.version + 1;
    world.blueprints.modify({ id: blueprint.id, version, script: url });
    try {
      await NetworkUploadUtil.uploadWithRetry(world.network, file, { maxRetries: 3 });
    } catch (err) {
      logger14.error("Script upload failed", { blueprintId: blueprint.id, error: err.message });
      return;
    }
    world.network.send("blueprintModified", { id: blueprint.id, version, script: url });
  };
  const saveState = () => {
    if (editor) {
      cached.key = key;
      cached.viewState = editor.saveViewState();
      cached.model = editor.getModel();
      cached.value = editor.getValue();
    }
  };
  useEffect16(() => {
    onHandle({ save });
  }, []);
  useEffect16(() => {
    const onPrefsChange = (changes) => {
      if (changes.ui) {
        setFontSize(14 * changes.ui.value);
      }
    };
    app.world.prefs.on("change", onPrefsChange);
    return () => {
      app.world.prefs.off("change", onPrefsChange);
    };
  }, []);
  useEffect16(() => {
    if (editor) {
      editor.updateOptions({ fontSize });
    }
  }, [editor, fontSize]);
  useEffect16(() => {
    return () => {
      saveState();
      editor?.dispose();
    };
  }, [editor]);
  useEffect16(() => {
    let dead;
    load().then((monaco) => {
      if (dead) return;
      const state = cached.key === key ? cached : null;
      const initialCode = state?.value ?? app.script?.code ?? "// \u2026";
      const uri = monaco.Uri.parse(`inmemory://model/${key}`);
      let model = monaco.editor.getModel(uri);
      if (!model) {
        model = monaco.editor.createModel(initialCode, "javascript", uri);
      } else if (model.getValue() !== initialCode) {
        model.setValue(initialCode);
      }
      codeRef.current = initialCode;
      const editor2 = monaco.editor.create(mountRef.current, {
        model,
        language: "javascript",
        scrollBeyondLastLine: true,
        lineNumbers: "on",
        minimap: { enabled: false },
        automaticLayout: true,
        tabSize: 2,
        insertSpaces: true,
        fontSize
      });
      if (state?.viewState) {
        editor2.restoreViewState(state.viewState);
        editor2.focus();
      }
      editor2.onDidChangeModelContent((event) => {
        codeRef.current = editor2.getValue();
      });
      editor2.addAction({
        id: "save",
        label: "Save",
        keybindings: [monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS],
        run: save
      });
      setEditor(editor2);
    });
    return () => {
      dead = true;
    };
  }, []);
  return /* @__PURE__ */ React.createElement(
    "div",
    {
      className: "editor",
      css: O`
        flex: 1;
        position: relative;
        overflow: hidden;
        border-bottom-left-radius: 10px;
        border-bottom-right-radius: 10px;
        .editor-mount {
          position: absolute;
          inset: 0;
        }
        .monaco-editor {
          --vscode-focusBorder: #00000000 !important;
        }
      `
    },
    /* @__PURE__ */ React.createElement("div", { className: "editor-mount", ref: mountRef })
  );
}

// src/client/components/ScriptEditor.js
function ScriptEditor({ app, onHandle }) {
  return /* @__PURE__ */ React.createElement(Editor, { app, onHandle });
}

// src/client/components/SidebarPanes/Script.js
function Script({ world, hidden }) {
  const app = world.ui.state.app;
  const containerRef = useRef8();
  const resizeRef = useRef8();
  const [handle, setHandle] = useState21(null);
  useEffect17(() => {
    const elem = resizeRef.current;
    const container = containerRef.current;
    container.style.width = `${storage.get("code-editor-width", 500)}px`;
    let active;
    function onPointerDown(e) {
      active = true;
      elem.addEventListener("pointermove", onPointerMove);
      elem.addEventListener("pointerup", onPointerUp);
      e.currentTarget.setPointerCapture(e.pointerId);
    }
    function onPointerMove(e) {
      let newWidth = container.offsetWidth + e.movementX;
      if (newWidth < 250) newWidth = 250;
      container.style.width = `${newWidth}px`;
      storage.set("code-editor-width", newWidth);
    }
    function onPointerUp(e) {
      e.currentTarget.releasePointerCapture(e.pointerId);
      elem.removeEventListener("pointermove", onPointerMove);
      elem.removeEventListener("pointerup", onPointerUp);
    }
    elem.addEventListener("pointerdown", onPointerDown);
    return () => {
      elem.removeEventListener("pointerdown", onPointerDown);
    };
  }, []);
  return /* @__PURE__ */ React.createElement("div", { ref: containerRef, className: cls2("script", { hidden }), css: scriptStyles }, /* @__PURE__ */ React.createElement("div", { className: "script-head" }, /* @__PURE__ */ React.createElement("div", { className: "script-title" }, "Script: ", app.blueprint?.name), /* @__PURE__ */ React.createElement("div", { className: "script-btn", onClick: () => handle?.save() }, /* @__PURE__ */ React.createElement(Save, { size: "1.125rem" }))), /* @__PURE__ */ React.createElement(ScriptEditor, { key: app.data.id, app, onHandle: setHandle }), /* @__PURE__ */ React.createElement("div", { className: "script-resizer", ref: resizeRef }));
}

// src/client/components/NodeHierarchy.js
import { useEffect as useEffect18, useMemo as useMemo8, useState as useState22 } from "react";

// src/client/components/NodeHierarchyComponents/Tree.js
var nodeIcons = {
  default: Circle,
  group: Folder,
  mesh: Box,
  rigidbody: Dumbbell,
  collider: Blend,
  lod: Eye,
  avatar: PersonStanding,
  snap: Magnet
};
function renderHierarchy(nodes, depth = 0, selectedNode, setSelectedNode) {
  if (!Array.isArray(nodes)) return null;
  return /* @__PURE__ */ React.createElement(React.Fragment, null, nodes.map((node2, index) => {
    if (!node2) return null;
    const children = node2.children || [];
    const hasChildren = Array.isArray(children) && children.length > 0;
    const isSelected = selectedNode?.id === node2.id;
    const Icon2 = nodeIcons[node2.name] || nodeIcons.default;
    const nodeKey = node2.id || `node-${depth}-${index}`;
    return /* @__PURE__ */ React.createElement("div", { key: nodeKey }, /* @__PURE__ */ React.createElement(
      "div",
      {
        className: cls2("nodehierarchy-item", {
          "nodehierarchy-item-indent": depth > 0,
          selected: isSelected
        }),
        style: { marginLeft: depth * 20 },
        onClick: () => setSelectedNode(node2)
      },
      /* @__PURE__ */ React.createElement(Icon2, { size: 14 }),
      /* @__PURE__ */ React.createElement("span", null, node2.id === "$root" ? "app" : node2.id)
    ), hasChildren && renderHierarchy(children, depth + 1, selectedNode, setSelectedNode));
  }));
}

// src/client/components/NodeHierarchyComponents/Details.js
function HierarchyDetail({ label, value, copy: copy2 }) {
  let handleCopy = copy2 ? () => navigator.clipboard.writeText(value) : null;
  return /* @__PURE__ */ React.createElement("div", { className: "nodehierarchy-detail" }, /* @__PURE__ */ React.createElement("div", { className: "nodehierarchy-detail-label" }, label), /* @__PURE__ */ React.createElement("div", { className: cls2("nodehierarchy-detail-value", { copy: copy2 }), onClick: handleCopy }, value));
}
function DetailsPanel({ selectedNode, getVectorString, hasProperty }) {
  if (!selectedNode) return null;
  return /* @__PURE__ */ React.createElement("div", { className: "nodehierarchy-details" }, /* @__PURE__ */ React.createElement(HierarchyDetail, { label: "ID", value: selectedNode.id, copy: true }), /* @__PURE__ */ React.createElement(HierarchyDetail, { label: "Name", value: selectedNode.name }), hasProperty(selectedNode, "position") && getVectorString(selectedNode.position) && /* @__PURE__ */ React.createElement(HierarchyDetail, { label: "Position", value: getVectorString(selectedNode.position) }), hasProperty(selectedNode, "rotation") && getVectorString(selectedNode.rotation) && /* @__PURE__ */ React.createElement(HierarchyDetail, { label: "Rotation", value: getVectorString(selectedNode.rotation) }), hasProperty(selectedNode, "scale") && getVectorString(selectedNode.scale) && /* @__PURE__ */ React.createElement(HierarchyDetail, { label: "Scale", value: getVectorString(selectedNode.scale) }), hasProperty(selectedNode, "material") && selectedNode.material && /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement(HierarchyDetail, { label: "Material", value: selectedNode.material.type || "Standard" }), hasProperty(selectedNode.material, "color") && selectedNode.material.color && /* @__PURE__ */ React.createElement(
    HierarchyDetail,
    {
      label: "Color",
      value: selectedNode.material.color.getHexString ? `#${selectedNode.material.color.getHexString()}` : "Unknown"
    }
  )), hasProperty(selectedNode, "geometry") && selectedNode.geometry && /* @__PURE__ */ React.createElement(HierarchyDetail, { label: "Geometry", value: selectedNode.geometry.type || "Custom" }));
}

// src/client/components/NodeHierarchy.js
function NodeHierarchy({ app }) {
  const [selectedNode, setSelectedNode] = useState22(null);
  const rootNode = useMemo8(() => app.getNodes(), [app]);
  useEffect18(() => {
    if (rootNode && !selectedNode) {
      setSelectedNode(rootNode);
    }
  }, [rootNode]);
  const getVectorString = (vec) => {
    if (!vec || typeof vec.x !== "number") return null;
    return `${vec.x.toFixed(2)}, ${vec.y.toFixed(2)}, ${vec.z.toFixed(2)}`;
  };
  const hasProperty = (obj, prop) => {
    try {
      return obj && typeof obj[prop] !== "undefined";
    } catch (err) {
      return false;
    }
  };
  return /* @__PURE__ */ React.createElement(
    "div",
    {
      className: "nodehierarchy noscrollbar",
      css: O`
        flex: 1;
        display: flex;
        flex-direction: column;
        overflow: hidden;
        padding-top: 0.5rem;
        .nodehierarchy-tree {
          flex: 1;
          padding: 0 1rem;
          overflow-y: auto;
          margin-bottom: 1.25rem;
        }
        .nodehierarchy-item {
          display: flex;
          align-items: center;
          padding: 0.25rem 0.375rem;
          border-radius: 0.325rem;
          font-size: 0.9375rem;
          cursor: pointer;
          &:hover {
            color: #00a7ff;
          }
          &.selected {
            color: #00a7ff;
            background: rgba(0, 167, 255, 0.1);
          }
          svg {
            margin-right: 0.5rem;
            opacity: 0.5;
            flex-shrink: 0;
          }
          span {
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
          }
          &-indent {
            margin-left: 1.25rem;
          }
        }
        .nodehierarchy-empty {
          color: rgba(255, 255, 255, 0.5);
          text-align: center;
          padding: 1rem;
        }
        .nodehierarchy-details {
          flex-shrink: 0;
          border-top: 0.0625rem solid rgba(255, 255, 255, 0.05);
          padding: 1rem;
          max-height: 40vh;
          overflow-y: auto;
        }
        .nodehierarchy-detail {
          display: flex;
          margin-bottom: 0.5rem;
          font-size: 0.9375rem;
          &-label {
            width: 6.25rem;
            color: rgba(255, 255, 255, 0.5);
            flex-shrink: 0;
          }
          &-value {
            flex: 1;
            word-break: break-word;
            &.copy {
              cursor: pointer;
            }
          }
        }
      `
    },
    /* @__PURE__ */ React.createElement("div", { className: "nodehierarchy-tree" }, rootNode ? renderHierarchy([rootNode], 0, selectedNode, setSelectedNode) : /* @__PURE__ */ React.createElement("div", { className: "nodehierarchy-empty" }, /* @__PURE__ */ React.createElement(Circle, { size: 24 }), /* @__PURE__ */ React.createElement("div", null, "No nodes found"))),
    /* @__PURE__ */ React.createElement(DetailsPanel, { selectedNode, getVectorString, hasProperty })
  );
}

// src/client/components/SidebarPanes/Nodes.js
function Nodes({ world, hidden }) {
  const app = world.ui.state.app;
  return /* @__PURE__ */ React.createElement(Pane, { hidden }, /* @__PURE__ */ React.createElement(
    "div",
    {
      className: "nodes",
      css: O`
          flex: 1;
          background: rgba(11, 10, 21, 0.9);
          border: 1px solid rgba(255, 255, 255, 0.05);
          border-radius: 1.375rem;
          min-height: 23.7rem;
          display: flex;
          flex-direction: column;
          .nodes-head {
            height: 3.125rem;
            padding: 0 1rem;
            border-bottom: 1px solid rgba(255, 255, 255, 0.05);
            display: flex;
            align-items: center;
          }
          .nodes-title {
            font-weight: 500;
            font-size: 1rem;
            line-height: 1;
          }
        `
    },
    /* @__PURE__ */ React.createElement("div", { className: "nodes-head" }, /* @__PURE__ */ React.createElement("div", { className: "nodes-title" }, "Nodes")),
    /* @__PURE__ */ React.createElement(NodeHierarchy, { app })
  ));
}

// src/client/components/SidebarPanes/Meta.js
import { useEffect as useEffect19, useState as useState23 } from "react";
function Meta({ world, hidden }) {
  const app = world.ui.state.app;
  const [blueprint, setBlueprint] = useState23(app.blueprint);
  useEffect19(() => {
    window.app = app;
    const onModify = (bp) => {
      if (bp.id === blueprint.id) setBlueprint(bp);
    };
    world.blueprints.on("modify", onModify);
    return () => {
      world.blueprints.off("modify", onModify);
    };
  }, []);
  const set = async (key, value) => {
    const version = blueprint.version + 1;
    world.blueprints.modify({ id: blueprint.id, version, [key]: value });
    world.network.send("blueprintModified", { id: blueprint.id, version, [key]: value });
  };
  return /* @__PURE__ */ React.createElement(Pane, { hidden }, /* @__PURE__ */ React.createElement(
    "div",
    {
      className: "meta",
      css: O`
          flex: 1;
          background: rgba(11, 10, 21, 0.9);
          border: 1px solid rgba(255, 255, 255, 0.05);
          border-radius: 1.375rem;
          display: flex;
          flex-direction: column;
          min-height: 1rem;
          .meta-head {
            height: 3.125rem;
            padding: 0 1rem;
            border-bottom: 1px solid rgba(255, 255, 255, 0.05);
            display: flex;
            align-items: center;
          }
          .meta-title {
            font-weight: 500;
            font-size: 1rem;
            line-height: 1;
          }
          .meta-content {
            flex: 1;
            overflow-y: auto;
            padding: 0.5rem 0;
          }
        `
    },
    /* @__PURE__ */ React.createElement("div", { className: "meta-head" }, /* @__PURE__ */ React.createElement("div", { className: "meta-title" }, "Metadata")),
    /* @__PURE__ */ React.createElement("div", { className: "meta-content noscrollbar" }, /* @__PURE__ */ React.createElement(
      FieldText,
      {
        label: "Name",
        hint: "The name of this app",
        value: blueprint.name,
        onChange: (value) => set("name", value)
      }
    ), /* @__PURE__ */ React.createElement(
      FieldFile,
      {
        label: "Image",
        hint: "An image/icon for this app",
        kind: "texture",
        value: blueprint.image,
        onChange: (value) => set("image", value),
        world
      }
    ), /* @__PURE__ */ React.createElement(
      FieldText,
      {
        label: "Author",
        hint: "The name of the author that made this app",
        value: blueprint.author,
        onChange: (value) => set("author", value)
      }
    ), /* @__PURE__ */ React.createElement(
      FieldText,
      {
        label: "URL",
        hint: "A url for this app",
        value: blueprint.url,
        onChange: (value) => set("url", value)
      }
    ), /* @__PURE__ */ React.createElement(
      FieldTextarea,
      {
        label: "Description",
        hint: "A description for this app",
        value: blueprint.desc,
        onChange: (value) => set("desc", value)
      }
    ))
  ));
}

// src/client/components/SidebarPanes/Players.js
import { useContext as useContext7 } from "react";
function Players({ world, hidden }) {
  const { setHint } = useContext7(HintContext);
  const localPlayer = world.entities.player;
  const isAdmin = localPlayer.isAdmin();
  const players = usePlayerList(world);
  const { toggleBuilder, toggleMute, kick, teleportTo } = usePlayerActions(world);
  return /* @__PURE__ */ React.createElement(Pane, { hidden }, /* @__PURE__ */ React.createElement("div", { className: "players", css: playersStyles }, /* @__PURE__ */ React.createElement("div", { className: "players-head" }, /* @__PURE__ */ React.createElement("div", { className: "players-title" }, "Players")), /* @__PURE__ */ React.createElement("div", { className: "players-content noscrollbar" }, players.map((player) => /* @__PURE__ */ React.createElement("div", { className: "players-item", key: player.data.id }, /* @__PURE__ */ React.createElement("div", { className: "players-name" }, /* @__PURE__ */ React.createElement("span", null, player.data.name), player.speaking && /* @__PURE__ */ React.createElement(Volume2, { size: "1rem" }), player.isMuted() && /* @__PURE__ */ React.createElement(MicOffIcon, { size: "1rem" })), isAdmin && player.isRemote && !player.isAdmin() && world.settings.rank < Ranks.BUILDER && /* @__PURE__ */ React.createElement(
    "div",
    {
      className: cls2("players-btn", { dim: !player.isBuilder() }),
      onPointerEnter: () => setHint(
        player.isBuilder() ? "Player is not a builder. Click to allow building." : "Player is a builder. Click to revoke."
      ),
      onPointerLeave: () => setHint(null),
      onClick: () => toggleBuilder(player)
    },
    /* @__PURE__ */ React.createElement(Hammer, { size: "1.125rem" })
  ), player.isRemote && localPlayer.outranks(player) && /* @__PURE__ */ React.createElement(
    "div",
    {
      className: "players-btn",
      onPointerEnter: () => setHint("Teleport to player."),
      onPointerLeave: () => setHint(null),
      onClick: () => teleportTo(player)
    },
    /* @__PURE__ */ React.createElement(CircleArrowRight, { size: "1.125rem" })
  ), player.isRemote && localPlayer.outranks(player) && /* @__PURE__ */ React.createElement(
    "div",
    {
      className: "players-btn",
      onPointerEnter: () => setHint(
        player.isMuted() ? "Player is muted. Click to unmute." : "Player is not muted. Click to mute."
      ),
      onPointerLeave: () => setHint(null),
      onClick: () => toggleMute(player)
    },
    player.isMuted() ? /* @__PURE__ */ React.createElement(MicOffIcon, { size: "1.125rem" }) : /* @__PURE__ */ React.createElement(MicIcon, { size: "1.125rem" })
  ), player.isRemote && localPlayer.outranks(player) && /* @__PURE__ */ React.createElement(
    "div",
    {
      className: "players-btn",
      onPointerEnter: () => setHint("Kick this player."),
      onPointerLeave: () => setHint(null),
      onClick: () => kick(player)
    },
    /* @__PURE__ */ React.createElement(UserX, { size: "1.125rem" })
  ))))));
}

// src/client/components/SidebarPanes/Controls.js
function Controls({ hidden }) {
  return /* @__PURE__ */ React.createElement(Pane, { hidden }, /* @__PURE__ */ React.createElement(
    "div",
    {
      css: O`
          padding: 1rem;
          background: rgba(11, 10, 21, 0.85);
          border: 0.0625rem solid #2a2b39;
          border-radius: 1rem;
          backdrop-filter: blur(5px);
          color: rgba(255, 255, 255, 0.9);
          font-size: 0.9375rem;
          line-height: 1.6;
          overflow-y: auto;
          max-height: 100%;
        `
    },
    /* @__PURE__ */ React.createElement("h3", { css: O`margin: 0 0 1rem; font-size: 1.125rem; color: white;` }, "Controls"),
    /* @__PURE__ */ React.createElement("h4", { css: O`margin: 1rem 0 0.5rem; font-size: 1rem; color: rgba(255, 255, 255, 0.8);` }, "Movement"),
    /* @__PURE__ */ React.createElement("div", { css: O`margin-bottom: 1rem;` }, /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("strong", null, "W/A/S/D"), " - Move forward/left/back/right"), /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("strong", null, "Space"), " - Jump"), /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("strong", null, "Mouse"), " - Look around"), /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("strong", null, "Click"), " - Lock/unlock mouse")),
    /* @__PURE__ */ React.createElement("h4", { css: O`margin: 1rem 0 0.5rem; font-size: 1rem; color: rgba(255, 255, 255, 0.8);` }, "Camera"),
    /* @__PURE__ */ React.createElement("div", { css: O`margin-bottom: 1rem;` }, /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("strong", null, "Ctrl + Scroll"), " - Zoom camera"), /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("strong", null, "Shift + Scroll"), " - Scale grab objects")),
    /* @__PURE__ */ React.createElement("h4", { css: O`margin: 1rem 0 0.5rem; font-size: 1rem; color: rgba(255, 255, 255, 0.8);` }, "Interaction"),
    /* @__PURE__ */ React.createElement("div", { css: O`margin-bottom: 1rem;` }, /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("strong", null, "F"), " - Grab/interact"), /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("strong", null, "C"), " - Rotate grab objects"), /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("strong", null, "Right Click"), " - Secondary action")),
    /* @__PURE__ */ React.createElement("h4", { css: O`margin: 1rem 0 0.5rem; font-size: 1rem; color: rgba(255, 255, 255, 0.8);` }, "UI"),
    /* @__PURE__ */ React.createElement("div", { css: O`margin-bottom: 1rem;` }, /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("strong", null, "Z"), " - Toggle UI"), /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("strong", null, "Esc"), " - Close panels"), /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("strong", null, "Enter"), " - Chat"), /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("strong", null, "/"), " - Chat commands"))
  ));
}

// src/client/components/SidebarPanes.js
function SidebarPanes({ world, ui }) {
  return /* @__PURE__ */ React.createElement(React.Fragment, null, ui.pane === "prefs" && /* @__PURE__ */ React.createElement(Prefs, { world, hidden: !ui.active }), ui.pane === "controls" && /* @__PURE__ */ React.createElement(Controls, { hidden: !ui.active }), ui.pane === "world" && /* @__PURE__ */ React.createElement(World2, { world, hidden: !ui.active }), ui.pane === "apps" && /* @__PURE__ */ React.createElement(Apps, { world, hidden: !ui.active }), ui.pane === "add" && /* @__PURE__ */ React.createElement(Add, { world, hidden: !ui.active }), ui.pane === "app" && /* @__PURE__ */ React.createElement(App, { key: ui.app.data.id, world, hidden: !ui.active }), ui.pane === "script" && /* @__PURE__ */ React.createElement(Script, { key: ui.app.data.id, world, hidden: !ui.active }), ui.pane === "nodes" && /* @__PURE__ */ React.createElement(Nodes, { key: ui.app.data.id, world, hidden: !ui.active }), ui.pane === "meta" && /* @__PURE__ */ React.createElement(Meta, { key: ui.app.data.id, world, hidden: !ui.active }), ui.pane === "players" && /* @__PURE__ */ React.createElement(Players, { world, hidden: !ui.active }));
}

// src/client/components/Sidebar.js
function Sidebar({ world, ui }) {
  const player = world.entities?.player;
  const { isAdmin, isBuilder } = useRank(world, player);
  const [livekit, setLiveKit] = useState24(() => world.livekit?.status || { connected: false });
  useEffect20(() => {
    const onLiveKitStatus = (status) => {
      setLiveKit({ ...status });
    };
    world.livekit.on("status", onLiveKitStatus);
    return () => {
      world.livekit.off("status", onLiveKitStatus);
    };
  }, []);
  const activePane = ui.active ? ui.pane : null;
  const isVisible = ui.visible !== false;
  return /* @__PURE__ */ React.createElement(HintProvider, null, /* @__PURE__ */ React.createElement(
    "div",
    {
      className: "sidebar",
      css: O`
          position: absolute;
          font-size: 1rem;
          top: calc(2rem + env(safe-area-inset-top));
          right: calc(2rem + env(safe-area-inset-right));
          bottom: calc(2rem + env(safe-area-inset-bottom));
          left: calc(2rem + env(safe-area-inset-left));
          display: flex;
          gap: 0.625rem;
          z-index: 1;
          transition: opacity 0.2s ease-out;
          opacity: ${isVisible ? 1 : 0};
          pointer-events: ${isVisible ? "auto" : "none"};
          @media all and (max-width: 1200px) {
            top: calc(1rem + env(safe-area-inset-top));
            right: calc(1rem + env(safe-area-inset-right));
            bottom: calc(1rem + env(safe-area-inset-bottom));
            left: calc(1rem + env(safe-area-inset-left));
          }
          .sidebar-sections {
            display: flex;
            flex-direction: column;
            flex-shrink: 0;
            gap: 0.625rem;
          }
        `
    },
    /* @__PURE__ */ React.createElement(SidebarButtons, { world, ui, isBuilder, livekit, activePane }),
    /* @__PURE__ */ React.createElement(SidebarPanes, { world, ui })
  ));
}

// src/client/components/CoreUIComponents/ActionsBlock.js
import { useEffect as useEffect22, useState as useState26 } from "react";

// src/client/components/CoreUIComponents/Actions.js
import { useEffect as useEffect21, useState as useState25 } from "react";

// src/client/components/MouseLeftIcon.js
function MouseLeftIcon({ size = 24 }) {
  return /* @__PURE__ */ React.createElement("svg", { width: size, height: size, viewBox: "0 0 24 24", fill: "none", xmlns: "http://www.w3.org/2000/svg" }, /* @__PURE__ */ React.createElement(
    "path",
    {
      d: "M19 9C19 5.13401 15.866 2 12 2C8.13401 2 5 5.13401 5 9V15C5 18.866 8.13401 22 12 22C15.866 22 19 18.866 19 15V9Z",
      stroke: "currentColor",
      strokeWidth: "2",
      strokeLinecap: "round",
      strokeLinejoin: "round"
    }
  ), /* @__PURE__ */ React.createElement("path", { d: "M7 9C7 6.23858 9.23858 4 12 4V4V9C12 9.55228 11.5523 10 11 10H7V9Z", fill: "currentColor" }));
}

// src/client/components/MouseRightIcon.js
function MouseRightIcon({ size = 24 }) {
  return /* @__PURE__ */ React.createElement("svg", { width: size, height: size, viewBox: "0 0 24 24", fill: "none", xmlns: "http://www.w3.org/2000/svg" }, /* @__PURE__ */ React.createElement(
    "path",
    {
      d: "M19 9C19 5.13401 15.866 2 12 2C8.13401 2 5 5.13401 5 9V15C5 18.866 8.13401 22 12 22C15.866 22 19 18.866 19 15V9Z",
      stroke: "currentColor",
      strokeWidth: "2",
      strokeLinecap: "round",
      strokeLinejoin: "round"
    }
  ), /* @__PURE__ */ React.createElement("path", { d: "M17 9C17 6.23858 14.7614 4 12 4V4V9C12 9.55228 12.4477 10 13 10H17V9Z", fill: "currentColor" }));
}

// src/client/components/MouseWheelIcon.js
function MouseWheelIcon({ size = 24 }) {
  return /* @__PURE__ */ React.createElement("svg", { width: size, height: size, viewBox: "0 0 24 24", fill: "none", xmlns: "http://www.w3.org/2000/svg" }, /* @__PURE__ */ React.createElement(
    "path",
    {
      d: "M19 9C19 5.13401 15.866 2 12 2C8.13401 2 5 5.13401 5 9V15C5 18.866 8.13401 22 12 22C15.866 22 19 18.866 19 15V9Z",
      stroke: "currentColor",
      strokeWidth: "2",
      strokeLinecap: "round",
      strokeLinejoin: "round"
    }
  ), /* @__PURE__ */ React.createElement("path", { d: "M12 6V8", stroke: "currentColor", strokeWidth: "4", strokeLinecap: "round", strokeLinejoin: "round" }));
}

// src/client/components/CoreUIComponents/ActionPill.js
function ActionPill({ label }) {
  return /* @__PURE__ */ React.createElement(
    "div",
    {
      className: "actionpill",
      css: O`
        border: 0.0625rem solid white;
        border-radius: 0.25rem;
        background: rgba(0, 0, 0, 0.1);
        padding: 0.25rem 0.375rem;
        font-size: 0.875em;
        box-shadow: 0 1px 3px rgba(0, 0, 0, 0.3);
        paint-order: stroke fill;
        -webkit-text-stroke: 0.25rem rgba(0, 0, 0, 0.2);
      `
    },
    label
  );
}

// src/client/components/CoreUIComponents/ActionIcon.js
function ActionIcon({ icon: Icon2 }) {
  return /* @__PURE__ */ React.createElement(
    "div",
    {
      className: "actionicon",
      css: O`
        line-height: 0;
        svg {
          filter: drop-shadow(0 1px 3px rgba(0, 0, 0, 0.8));
        }
      `
    },
    /* @__PURE__ */ React.createElement(Icon2, { size: "1.5rem" })
  );
}

// src/client/components/CoreUIComponents/getActionIcon.js
function getActionIcon(action) {
  if (action.type === "custom") {
    return /* @__PURE__ */ React.createElement(ActionPill, { label: action.btn });
  }
  if (action.type === "controlLeft") {
    return /* @__PURE__ */ React.createElement(ActionPill, { label: "Ctrl" });
  }
  if (action.type === "mouseLeft") {
    return /* @__PURE__ */ React.createElement(ActionIcon, { icon: MouseLeftIcon });
  }
  if (action.type === "mouseRight") {
    return /* @__PURE__ */ React.createElement(ActionIcon, { icon: MouseRightIcon });
  }
  if (action.type === "mouseWheel") {
    return /* @__PURE__ */ React.createElement(ActionIcon, { icon: MouseWheelIcon });
  }
  if (buttons.has(action.type)) {
    return /* @__PURE__ */ React.createElement(ActionPill, { label: propToLabel[action.type] });
  }
  return /* @__PURE__ */ React.createElement(ActionPill, { label: "?" });
}

// src/client/components/CoreUIComponents/Actions.js
function Actions({ world }) {
  const [actions, setActions] = useState25(() => world.controls.actions);
  useEffect21(() => {
    world.on("actions", setActions);
    return () => world.off("actions", setActions);
  }, []);
  return /* @__PURE__ */ React.createElement(
    "div",
    {
      className: "actions",
      css: O`
        flex: 1;
        display: flex;
        flex-direction: column;
        justify-content: center;
        .actions-item {
          display: flex;
          align-items: center;
          margin: 0 0 0.5rem;
          &-icon {
          }
          &-label {
            margin-left: 0.625em;
            paint-order: stroke fill;
            -webkit-text-stroke: 0.25rem rgba(0, 0, 0, 0.2);
          }
        }
      `
    },
    actions.map((action) => /* @__PURE__ */ React.createElement("div", { className: "actions-item", key: action.id }, /* @__PURE__ */ React.createElement("div", { className: "actions-item-icon" }, getActionIcon(action)), /* @__PURE__ */ React.createElement("div", { className: "actions-item-label" }, action.label)))
  );
}

// src/client/components/CoreUIComponents/ActionsBlock.js
function ActionsBlock({ world }) {
  const [showActions, setShowActions] = useState26(() => world.prefs?.actions);
  useEffect22(() => {
    const onPrefsChange = (changes) => {
      if (changes.actions) setShowActions(changes.actions.value);
    };
    if (world.prefs) {
      world.prefs.on("change", onPrefsChange);
      return () => {
        world.prefs.off("change", onPrefsChange);
      };
    }
  }, []);
  if (isTouch) return null;
  if (!showActions) return null;
  return /* @__PURE__ */ React.createElement(
    "div",
    {
      css: O`
        position: absolute;
        top: calc(2rem + env(safe-area-inset-top));
        left: calc(2rem + env(safe-area-inset-left));
        bottom: calc(2rem + env(safe-area-inset-bottom));
        display: flex;
        flex-direction: column;
        align-items: center;
        @media all and (max-width: 1200px) {
          top: calc(1rem + env(safe-area-inset-top));
          left: calc(1rem + env(safe-area-inset-left));
          bottom: calc(1rem + env(safe-area-inset-bottom));
        }
      `
    },
    /* @__PURE__ */ React.createElement(Actions, { world })
  );
}

// src/client/components/CoreUIComponents/Chat.js
import { useEffect as useEffect25, useRef as useRef10, useState as useState29 } from "react";

// src/client/components/CoreUIComponents/MiniMessages.js
import { useEffect as useEffect23, useState as useState27 } from "react";

// src/client/components/CoreUIComponents/Message.js
function Message({ msg, now }) {
  return /* @__PURE__ */ React.createElement(
    "div",
    {
      className: "message",
      css: O`
        padding: 0.25rem 0;
        line-height: 1.4;
        font-size: 1rem;
        paint-order: stroke fill;
        -webkit-text-stroke: 0.25rem rgba(0, 0, 0, 0.2);
        .message-from {
          margin-right: 0.25rem;
        }
        .message-body {
        }
      `
    },
    msg.from && /* @__PURE__ */ React.createElement("span", { className: "message-from" }, "[", msg.from, "]"),
    /* @__PURE__ */ React.createElement("span", { className: "message-body" }, msg.body)
  );
}

// src/client/components/CoreUIComponents/MiniMessages.js
function MiniMessages({ world }) {
  const [msg, setMsg] = useState27(null);
  useEffect23(() => {
    let init;
    return world.chat.subscribe((msgs) => {
      if (!init) {
        init = true;
        return;
      }
      const msg2 = msgs[msgs.length - 1];
      if (msg2.fromId === world.network.id) return;
      setMsg(msg2);
    });
  }, []);
  useEffect23(() => {
    const timerId = setTimeout(() => {
      setMsg(null);
    }, 4e3);
    return () => clearTimeout(timerId);
  }, [msg]);
  if (!msg) return null;
  return /* @__PURE__ */ React.createElement(Message, { msg });
}

// src/client/components/CoreUIComponents/Messages.js
import { useEffect as useEffect24, useRef as useRef9, useState as useState28 } from "react";
function Messages({ world, active }) {
  const initRef = useRef9();
  const contentRef = useRef9();
  const spacerRef = useRef9();
  const [msgs, setMsgs] = useState28([]);
  useEffect24(() => {
    return world.chat.subscribe(setMsgs);
  }, []);
  useEffect24(() => {
    if (!msgs.length) return;
    const didInit = !initRef.current;
    if (didInit) {
      spacerRef.current.style.height = contentRef.current.offsetHeight + "px";
    }
    setTimeout(() => {
      contentRef.current?.scroll({
        top: 9999999,
        behavior: didInit ? "instant" : "smooth"
      });
    }, 10);
    initRef.current = true;
  }, [msgs]);
  useEffect24(() => {
    const content = contentRef.current;
    const observer = new ResizeObserver(() => {
      contentRef.current?.scroll({
        top: 9999999,
        behavior: "instant"
      });
    });
    observer.observe(content);
    return () => {
      observer.disconnect();
    };
  }, []);
  return /* @__PURE__ */ React.createElement(
    "div",
    {
      ref: contentRef,
      className: cls("messages noscrollbar", { active }),
      css: O`
        flex: 1;
        max-height: 16rem;
        transition: all 0.15s ease-out;
        display: flex;
        flex-direction: column;
        align-items: stretch;
        overflow-y: auto;
        -webkit-mask-image: linear-gradient(to top, black calc(100% - 10rem), black 10rem, transparent);
        mask-image: linear-gradient(to top, black calc(100% - 10rem), black 10rem, transparent);
        &.active {
          pointer-events: auto;
        }
        .messages-spacer {
          flex-shrink: 0;
        }
      `
    },
    /* @__PURE__ */ React.createElement("div", { className: "messages-spacer", ref: spacerRef }),
    msgs.map((msg) => /* @__PURE__ */ React.createElement(Message, { key: msg.id, msg }))
  );
}

// src/client/components/CoreUIComponents/Chat.js
function Chat({ world }) {
  const inputRef = useRef10();
  const [msg, setMsg] = useState29("");
  const [active, setActive] = useState29(false);
  useWorldEvent(world, "sidebar-chat-toggle", () => setActive((v) => !v));
  useEffect25(() => {
    const control = world.controls.bind({ priority: ControlPriorities.CORE_UI });
    control.slash.onPress = () => {
      if (!active) setActive(true);
    };
    control.enter.onPress = () => {
      if (!active) setActive(true);
    };
    control.mouseLeft.onPress = () => {
      if (control.pointer.locked && active) {
        setActive(false);
      }
    };
    return () => control.release();
  }, [active]);
  useEffect25(() => {
    if (active) {
      inputRef.current?.focus();
    } else {
      inputRef.current?.blur();
    }
  }, [active]);
  const send = async (e) => {
    if (world.controls.pointer.locked) {
      setTimeout(() => setActive(false), 10);
    }
    if (!msg) {
      e.preventDefault();
      return setActive(false);
    }
    setMsg("");
    if (msg.startsWith("/")) {
      world.chat.command(msg);
      return;
    }
    world.chat.send(msg);
    if (isTouch) {
      e.target.blur();
      setTimeout(() => setActive(false), 10);
    }
  };
  return /* @__PURE__ */ React.createElement("div", { className: cls("mainchat", { active }), css: chatStyles }, /* @__PURE__ */ React.createElement("div", { className: "mainchat-msgs" }, isTouch && !active && /* @__PURE__ */ React.createElement(MiniMessages, { world }), (!isTouch || active) && /* @__PURE__ */ React.createElement(Messages, { world, active })), /* @__PURE__ */ React.createElement("div", { className: "mainchat-btn", onClick: () => setActive(true) }, /* @__PURE__ */ React.createElement(MessageSquareText, { size: "1.125rem" })), /* @__PURE__ */ React.createElement("label", { className: "mainchat-entry" }, /* @__PURE__ */ React.createElement(
    "input",
    {
      ref: inputRef,
      className: "side-chatbox-input",
      type: "text",
      placeholder: "Say something...",
      value: msg,
      onChange: (e) => setMsg(e.target.value),
      onKeyDown: (e) => {
        if (e.code === "Escape") {
          setActive(false);
        }
        if (e.code === "Enter" || e.key === "Enter") {
          send(e);
        }
      },
      onBlur: (e) => {
        if (!isTouch) {
          setActive(false);
        }
      }
    }
  ), isTouch && /* @__PURE__ */ React.createElement("div", { className: "mainchat-send", onClick: (e) => send(e) }, /* @__PURE__ */ React.createElement(SendHorizontal, { size: "1.125rem" }))));
}

// src/client/components/CoreUIComponents/Confirm.js
function Confirm({ options }) {
  return /* @__PURE__ */ React.createElement(
    "div",
    {
      className: "confirm",
      css: O`
        position: absolute;
        inset: 0;
        padding: 1rem;
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 999;
        .confirm-dialog {
          pointer-events: auto;
          background: rgba(11, 10, 21, 0.9);
          border: 1px solid rgba(255, 255, 255, 0.05);
          border-radius: 1.375rem;
          backdrop-filter: blur(5px);
          width: 18rem;
        }
        .confirm-content {
          padding: 1.4rem;
        }
        .confirm-title {
          text-align: center;
          font-size: 1.1rem;
          font-weight: 500;
          margin: 0 0 0.7rem;
        }
        .confirm-message {
          text-align: center;
          color: rgba(255, 255, 255, 0.6);
          font-size: 0.9375rem;
          line-height: 1.4;
        }
        .confirm-actions {
          border-top: 1px solid rgba(255, 255, 255, 0.05);
          display: flex;
          align-items: stretch;
        }
        .confirm-action {
          flex: 1;
          min-height: 2.7rem;
          display: flex;
          align-items: center;
          justify-content: center;
          &.left {
            border-right: 1px solid rgba(255, 255, 255, 0.05);
          }
          > span {
            font-size: 0.9375rem;
            color: rgba(255, 255, 255, 0.8);
          }
          &:hover {
            cursor: pointer;
            > span {
              color: white;
            }
          }
        }
      `
    },
    /* @__PURE__ */ React.createElement("div", { className: "confirm-dialog" }, /* @__PURE__ */ React.createElement("div", { className: "confirm-content" }, /* @__PURE__ */ React.createElement("div", { className: "confirm-title" }, options.title), /* @__PURE__ */ React.createElement("div", { className: "confirm-message" }, options.message)), /* @__PURE__ */ React.createElement("div", { className: "confirm-actions" }, /* @__PURE__ */ React.createElement("div", { className: "confirm-action left", onClick: options.confirm }, /* @__PURE__ */ React.createElement("span", null, options.confirmText || "Okay")), /* @__PURE__ */ React.createElement("div", { className: "confirm-action", onClick: options.cancel }, /* @__PURE__ */ React.createElement("span", null, options.cancelText || "Cancel"))))
  );
}

// src/client/components/CoreUIComponents/Disconnected.js
function Disconnected() {
  return /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement(
    "div",
    {
      css: O`
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          backdrop-filter: grayscale(100%);
          pointer-events: none;
          z-index: 9999;
          animation: fadeIn 3s forwards;
          @keyframes fadeIn {
            from {
              opacity: 0;
            }
            to {
              opacity: 1;
            }
          }
        `
    }
  ), /* @__PURE__ */ React.createElement(
    "div",
    {
      css: O`
          pointer-events: auto;
          position: absolute;
          top: 50%;
          left: 50%;
          background: rgba(11, 10, 21, 0.85);
          border: 0.0625rem solid #2a2b39;
          backdrop-filter: blur(5px);
          border-radius: 1rem;
          height: 2.75rem;
          padding: 0 1rem;
          transform: translate(-50%, -50%);
          display: flex;
          align-items: center;
          cursor: pointer;
          > span {
            margin-left: 0.4rem;
          }
        `,
      onClick: () => window.location.reload()
    },
    /* @__PURE__ */ React.createElement(RefreshCw, { size: "1.1rem" }),
    /* @__PURE__ */ React.createElement("span", null, "Reconnect")
  ));
}

// src/client/components/CoreUIComponents/KickedOverlay.js
var kickMessages = {
  duplicate_user: "Player already active on another device or window.",
  player_limit: "Player limit reached.",
  unknown: "You were kicked."
};
function KickedOverlay({ code }) {
  return /* @__PURE__ */ React.createElement(
    "div",
    {
      css: O`
        position: absolute;
        inset: 0;
        background: black;
        display: flex;
        align-items: center;
        justify-content: center;
        pointer-events: auto;
        @keyframes spin {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }
        svg {
          animation: spin 1s linear infinite;
        }
      `
    },
    /* @__PURE__ */ React.createElement("div", null, kickMessages[code] || kickMessages.unknown)
  );
}

// src/client/components/CoreUIComponents/LoadingOverlay.js
import { useEffect as useEffect26, useState as useState30 } from "react";
function LoadingOverlay({ world }) {
  const [progress, setProgress] = useState30(0);
  const [complete, setComplete] = useState30(false);
  const { title, desc, image } = world?.settings || {};
  useEffect26(() => {
    if (!world) return;
    const handleProgress = (p) => {
      setProgress(p);
      if (p >= 100) {
        setComplete(true);
      }
    };
    world.on("progress", handleProgress);
    const timeout = setTimeout(() => {
      if (world && !complete) {
        setComplete(true);
      }
    }, 8e3);
    return () => {
      world.off("progress", handleProgress);
      clearTimeout(timeout);
    };
  }, [world, complete]);
  if (complete) {
    return null;
  }
  return /* @__PURE__ */ React.createElement(
    "div",
    {
      css: O`
        position: absolute;
        inset: 0;
        background: black;
        display: flex;
        pointer-events: auto;
        @keyframes pulse {
          0% {
            transform: scale(1);
          }
          50% {
            transform: scale(1.05);
          }
          100% {
            transform: scale(1);
          }
        }
        .loading-image {
          position: absolute;
          inset: 0;
          background-position: center;
          background-size: cover;
          background-repeat: no-repeat;
          background-image: ${image && world?.resolveURL ? `url(${world.resolveURL(image.url)})` : "none"};
          animation: pulse 5s ease-in-out infinite;
        }
        .loading-shade {
          position: absolute;
          inset: 0;
          background: rgba(0, 0, 0, 0.4);
          backdrop-filter: blur(15px);
        }
        .loading-info {
          position: absolute;
          bottom: 50px;
          left: 50px;
          right: 50px;
          max-width: 28rem;
        }
        .loading-title {
          font-size: 2.4rem;
          line-height: 1.2;
          font-weight: 600;
          margin: 0 0 0.5rem;
        }
        .loading-desc {
          color: rgba(255, 255, 255, 0.9);
          font-size: 1rem;
          margin: 0 0 20px;
        }
        .loading-track {
          height: 5px;
          border-radius: 3px;
          background: rgba(255, 255, 255, 0.1);
          position: relative;
        }
        .loading-bar {
          position: absolute;
          top: 0;
          left: 0;
          bottom: 0;
          width: ${progress}%;
          background: white;
          border-radius: 3px;
          transition: width 0.2s ease-out;
        }
      `
    },
    /* @__PURE__ */ React.createElement("div", { className: "loading-image" }),
    /* @__PURE__ */ React.createElement("div", { className: "loading-shade" }),
    /* @__PURE__ */ React.createElement("div", { className: "loading-info" }, title && /* @__PURE__ */ React.createElement("div", { className: "loading-title" }, title), desc && /* @__PURE__ */ React.createElement("div", { className: "loading-desc" }, desc), /* @__PURE__ */ React.createElement("div", { className: "loading-track" }, /* @__PURE__ */ React.createElement("div", { className: "loading-bar" })))
  );
}

// src/client/components/CoreUIComponents/Reticle.js
import { useEffect as useEffect27, useState as useState31 } from "react";
function Reticle({ world }) {
  const [pointerLocked, setPointerLocked] = useState31(world.controls?.pointer?.locked || false);
  const [buildMode, setBuildMode] = useState31(world.builder?.enabled || false);
  useEffect27(() => {
    world.on("pointer-lock", setPointerLocked);
    world.on("build-mode", setBuildMode);
    return () => {
      world.off("pointer-lock", setPointerLocked);
      world.off("build-mode", setBuildMode);
    };
  }, []);
  const visible = isTouch ? true : pointerLocked;
  if (!visible) return null;
  return /* @__PURE__ */ React.createElement(
    "div",
    {
      className: "reticle",
      css: O`
        position: absolute;
        inset: 0;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 1rem;
        .reticle-item {
          width: 0.25rem;
          height: 0.25rem;
          border-radius: 0.625rem;
          background: ${buildMode ? "#ff4d4d" : "white"};
          border: 0.5px solid rgba(0, 0, 0, 0.3);
        }
      `
    },
    /* @__PURE__ */ React.createElement("div", { className: "reticle-item" })
  );
}

// src/client/components/CoreUIComponents/Toast.js
import { useEffect as useEffect29, useState as useState33 } from "react";

// src/client/components/CoreUIComponents/ToastMsg.js
import { useEffect as useEffect28, useState as useState32 } from "react";
function ToastMsg({ text }) {
  const [visible, setVisible] = useState32(true);
  useEffect28(() => {
    setTimeout(() => setVisible(false), 1e3);
  }, []);
  return /* @__PURE__ */ React.createElement("div", { className: cls("toast-msg", { visible }) }, text);
}

// src/client/components/CoreUIComponents/Toast.js
function Toast({ world }) {
  const [msg, setMsg] = useState33(null);
  useEffect29(() => {
    let ids = 0;
    const onToast = (text) => {
      setMsg({ text, id: ++ids });
    };
    world.on("toast", onToast);
    return () => world.off("toast", onToast);
  }, []);
  if (!msg) return null;
  return /* @__PURE__ */ React.createElement(
    "div",
    {
      className: "toast",
      css: O`
        position: absolute;
        top: calc(50% - 4.375rem);
        left: 0;
        right: 0;
        display: flex;
        justify-content: center;
        @keyframes toastIn {
          from {
            opacity: 0;
            transform: translateY(10px) scale(0.9);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }
        .toast-msg {
          height: 2.875rem;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 0 1rem;
          background: rgba(11, 10, 21, 0.85);
          border: 0.0625rem solid #2a2b39;
          backdrop-filter: blur(5px);
          border-radius: 1.4375rem;
          opacity: 0;
          transform: translateY(0.625rem) scale(0.9);
          transition: all 0.1s ease-in-out;
          &.visible {
            opacity: 1;
            transform: translateY(0) scale(1);
            animation: toastIn 0.1s ease-in-out;
          }
        }
      `
    },
    msg && /* @__PURE__ */ React.createElement(ToastMsg, { key: msg.id, text: msg.text })
  );
}

// src/client/components/CoreUIComponents/TouchBtns.js
import { useEffect as useEffect30, useState as useState34 } from "react";
function TouchBtns({ world }) {
  const [action, setAction] = useState34(world.actions.current.node);
  useEffect30(() => {
    function onChange(isAction) {
      setAction(isAction);
    }
    world.actions.on("change", onChange);
    return () => {
      world.actions.off("change", onChange);
    };
  }, []);
  return /* @__PURE__ */ React.createElement(
    "div",
    {
      className: "touchbtns",
      css: O`
        position: absolute;
        top: calc(1.5rem + env(safe-area-inset-top));
        right: calc(1.5rem + env(safe-area-inset-right));
        bottom: calc(1.5rem + env(safe-area-inset-bottom));
        left: calc(1.5rem + env(safe-area-inset-left));
        .touchbtns-btn {
          pointer-events: auto;
          position: absolute;
          background: rgba(0, 0, 0, 0.3);
          border-radius: 10rem;
          display: flex;
          align-items: center;
          justify-content: center;
          &.jump {
            width: 4rem;
            height: 4rem;
            bottom: 1rem;
            right: 1rem;
          }
          &.action {
            width: 2.5rem;
            height: 2.5rem;
            bottom: 6rem;
            right: 4rem;
          }
        }
      `
    },
    action && /* @__PURE__ */ React.createElement(
      "div",
      {
        className: "touchbtns-btn action",
        onPointerDown: (e) => {
          e.currentTarget.setPointerCapture(e.pointerId);
          world.controls.setTouchBtn("touchB", true);
        },
        onPointerLeave: (e) => {
          world.controls.setTouchBtn("touchB", false);
          e.currentTarget.releasePointerCapture(e.pointerId);
        }
      },
      /* @__PURE__ */ React.createElement(HandIcon, { size: "1.5rem" })
    ),
    /* @__PURE__ */ React.createElement(
      "div",
      {
        className: "touchbtns-btn jump",
        onPointerDown: (e) => {
          e.currentTarget.setPointerCapture(e.pointerId);
          world.controls.setTouchBtn("touchA", true);
        },
        onPointerLeave: (e) => {
          world.controls.setTouchBtn("touchA", false);
          e.currentTarget.releasePointerCapture(e.pointerId);
        }
      },
      /* @__PURE__ */ React.createElement(ChevronDoubleUpIcon, { size: "1.5rem" })
    )
  );
}

// src/client/components/CoreUIComponents/TouchStick.js
import { useEffect as useEffect31, useRef as useRef11 } from "react";
function TouchStick({ world }) {
  const outerRef = useRef11();
  const innerRef = useRef11();
  useEffect31(() => {
    const outer = outerRef.current;
    const inner = innerRef.current;
    function onStick(stick) {
      if (stick) {
        outer.style.left = `${stick.center.x}px`;
        outer.style.top = `${stick.center.y}px`;
        inner.style.left = `${stick.touch.position.x}px`;
        inner.style.top = `${stick.touch.position.y}px`;
        inner.style.opacity = 1;
      } else {
        inner.style.opacity = 0.1;
        const radius = 50;
        if (window.innerWidth < window.innerHeight) {
          outer.style.left = `calc(env(safe-area-inset-left) + ${radius}px + 50px)`;
          outer.style.top = `calc(100dvh - env(safe-area-inset-bottom) - ${radius}px - 50px)`;
          inner.style.left = `calc(env(safe-area-inset-left) + ${radius}px + 50px)`;
          inner.style.top = `calc(100dvh - env(safe-area-inset-bottom) - ${radius}px - 50px)`;
        } else {
          outer.style.left = `calc(env(safe-area-inset-left) + ${radius}px + 90px)`;
          outer.style.top = `calc(100dvh - env(safe-area-inset-bottom) - ${radius}px - 50px)`;
          inner.style.left = `calc(env(safe-area-inset-left) + ${radius}px + 90px)`;
          inner.style.top = `calc(100dvh - env(safe-area-inset-bottom) - ${radius}px - 50px)`;
        }
      }
    }
    onStick(null);
    world.on("stick", onStick);
    return () => {
      world.off("stick", onStick);
    };
  }, []);
  return /* @__PURE__ */ React.createElement(
    "div",
    {
      className: "stick",
      css: O`
        .stick-outer {
          position: absolute;
          width: 100px;
          height: 100px;
          border-radius: 100px;
          background: rgba(0, 0, 0, 0.3);
          transform: translate(-50%, -50%);
        }
        .stick-caret {
          position: absolute;
          width: 20px;
          height: 20px;
          display: flex;
          align-items: center;
          justify-content: center;
          &.n {
            top: 0;
            left: 50%;
            transform: translate(-50%, 0);
          }
          &.e {
            top: 50%;
            right: 0;
            transform: translate(0, -50%) rotate(90deg);
          }
          &.s {
            left: 50%;
            bottom: 0;
            transform: translate(-50%, 0) rotate(180deg);
          }
          &.w {
            top: 50%;
            left: 0;
            transform: translate(0, -50%) rotate(-90deg);
          }
        }
        .stick-inner {
          position: absolute;
          width: 50px;
          height: 50px;
          border-radius: 50px;
          background: white;
          transform: translate(-50%, -50%);
        }
      `
    },
    /* @__PURE__ */ React.createElement("div", { className: "stick-outer", ref: outerRef }),
    /* @__PURE__ */ React.createElement("div", { className: "stick-inner", ref: innerRef })
  );
}

// src/client/components/CoreUI.js
function CoreUI({ world }) {
  const ref = useRef12();
  const [ready, setReady] = useState35(false);
  const [player, setPlayer] = useState35(() => world.entities?.player);
  const [ui, setUI] = useState35(world.ui?.state || { visible: true, active: false, app: null, pane: null, reticleSuppressors: 0 });
  const [menu, setMenu] = useState35(null);
  const [confirm, setConfirm] = useState35(null);
  const [code, setCode] = useState35(false);
  const [avatar, setAvatar] = useState35(null);
  const [disconnected, setDisconnected] = useState35(false);
  const [apps, setApps] = useState35(false);
  const [kicked, setKicked] = useState35(null);
  useWorldEvents(world.events, {
    ready: setReady,
    player: setPlayer,
    ui: setUI,
    menu: setMenu,
    confirm: setConfirm,
    code: setCode,
    apps: setApps,
    avatar: setAvatar,
    kick: setKicked,
    disconnect: setDisconnected
  });
  useEffect32(() => {
    const elem = ref.current;
    const onEvent = (e) => {
      e.isCoreUI = true;
    };
    elem.addEventListener("wheel", onEvent);
    elem.addEventListener("click", onEvent);
    elem.addEventListener("pointerdown", onEvent);
    elem.addEventListener("pointermove", onEvent);
    elem.addEventListener("pointerup", onEvent);
    elem.addEventListener("touchstart", onEvent);
  }, []);
  usePrefsChange(world, (changes) => {
    if (changes.ui) document.documentElement.style.fontSize = `${16 * (world.prefs?.ui || 1)}px`;
  });
  useEffect32(() => {
    document.documentElement.style.fontSize = `${16 * (world.prefs?.ui || 1)}px`;
  }, []);
  return /* @__PURE__ */ React.createElement(
    "div",
    {
      ref,
      className: "coreui",
      css: O`
        position: absolute;
        inset: 0;
        overflow: hidden;
      `
    },
    disconnected && /* @__PURE__ */ React.createElement(Disconnected, null),
    !ui.reticleSuppressors && /* @__PURE__ */ React.createElement(Reticle, { world }),
    /* @__PURE__ */ React.createElement(Toast, { world }),
    ready && /* @__PURE__ */ React.createElement(ActionsBlock, { world }),
    ready && /* @__PURE__ */ React.createElement(Sidebar, { world, ui }),
    ready && /* @__PURE__ */ React.createElement(Chat, { world }),
    avatar && /* @__PURE__ */ React.createElement(AvatarPane, { key: avatar.hash, world, info: avatar }),
    !ready && /* @__PURE__ */ React.createElement(LoadingOverlay, { world }),
    kicked && /* @__PURE__ */ React.createElement(KickedOverlay, { code: kicked }),
    ready && isTouch && /* @__PURE__ */ React.createElement(TouchBtns, { world }),
    ready && isTouch && /* @__PURE__ */ React.createElement(TouchStick, { world }),
    confirm && /* @__PURE__ */ React.createElement(Confirm, { options: confirm }),
    /* @__PURE__ */ React.createElement("div", { id: "core-ui-portal" })
  );
}

// src/client/debug/ConsoleCapture.js
var ConsoleCapture = class {
  constructor(maxLogs = 500) {
    this.maxLogs = maxLogs;
    this.logs = {
      errors: [],
      warnings: [],
      info: []
    };
    this.originalLog = console.log;
    this.originalWarn = console.warn;
    this.originalError = console.error;
    this.hooked = false;
  }
  enable() {
    if (this.hooked) return;
    const self2 = this;
    const pushLog = (arr, item) => {
      arr.push(item);
      if (arr.length > self2.maxLogs) arr.shift();
    };
    console.log = function(...args) {
      pushLog(self2.logs.info, { time: /* @__PURE__ */ new Date(), args });
      return self2.originalLog.apply(console, args);
    };
    console.warn = function(...args) {
      pushLog(self2.logs.warnings, { time: /* @__PURE__ */ new Date(), args });
      return self2.originalWarn.apply(console, args);
    };
    console.error = function(...args) {
      pushLog(self2.logs.errors, { time: /* @__PURE__ */ new Date(), args });
      return self2.originalError.apply(console, args);
    };
    this.hooked = true;
  }
  disable() {
    if (!this.hooked) return;
    console.log = this.originalLog;
    console.warn = this.originalWarn;
    console.error = this.originalError;
    this.hooked = false;
  }
  clear() {
    this.logs.errors.length = 0;
    this.logs.warnings.length = 0;
    this.logs.info.length = 0;
  }
  getLogs() {
    return this.logs;
  }
  getErrors() {
    return this.logs.errors;
  }
  getWarnings() {
    return this.logs.warnings;
  }
  getInfo() {
    return this.logs.info;
  }
};

// src/client/debug/DebugEntity.js
function setupDebugEntity(world) {
  return {
    getEntity: (id) => world.entities.get(id),
    getBlueprint: (id) => world.blueprints.get(id),
    entities: () => Array.from(world.entities.items.values()),
    blueprints: () => Array.from(world.blueprints.items.entries()),
    apps: () => world.entities.apps,
    players: () => world.entities.playerEntities,
    getAppByBlueprint: (blueprintName) => {
      const apps = world.entities.apps;
      return apps.find((app) => {
        const bp = world.blueprints.get(app.data.blueprint);
        return bp?.name === blueprintName;
      });
    },
    getAppState: (appId) => {
      const app = world.entities.get(appId);
      if (!app?.isApp) return null;
      return {
        id: app.data.id,
        blueprint: world.blueprints.get(app.data.blueprint)?.name,
        mode: app.mode,
        childCount: app.root?.children?.length || 0,
        children: app.root?.children?.map((c2) => ({ name: c2.name, type: c2.constructor.name })) || [],
        scriptExecutor: app.scriptExecutor?.context ? "active" : "inactive"
      };
    },
    findNodesByName: (name) => {
      const results = [];
      const apps = world.entities.apps;
      apps.forEach((app) => {
        if (app.root?.children) {
          const found = app.root.children.filter((c2) => c2.name === name);
          results.push({ appId: app.data.id, nodes: found });
        }
      });
      return results;
    },
    getBlueprintStats: () => {
      const bps = Array.from(world.blueprints.items.values());
      return {
        total: bps.length,
        byType: {
          apps: bps.filter((b2) => !b2.model && b2.script).length,
          models: bps.filter((b2) => b2.model && !b2.script).length,
          scenes: bps.filter((b2) => b2.scene).length
        },
        list: bps.map((b2) => ({ id: b2.id, name: b2.name, version: b2.version }))
      };
    }
  };
}

// src/client/debug/DebugPlayer.js
function setupDebugPlayer(world) {
  return {
    player: () => {
      const players = Array.from(world.entities.items.values()).filter((e) => e.isPlayer);
      return players.find((p) => p.isLocal) || players[0];
    },
    getPlayerState: (playerId) => {
      const player = world.entities.get(playerId);
      if (!player?.isPlayer) return null;
      return {
        id: player.data.id,
        isLocal: player.isLocal,
        position: player.data.position,
        mode: player.data.mode,
        hasAvatar: !!player.avatar,
        hasPhysics: !!player.physics
      };
    },
    playerState: () => {
      const player = world.__DEBUG__.player();
      if (!player) return { error: "No player found" };
      return {
        id: player.data.id,
        isLocal: player.isLocal,
        position: { x: player.base.position.x, y: player.base.position.y, z: player.base.position.z },
        quaternion: { x: player.base.quaternion.x, y: player.base.quaternion.y, z: player.base.quaternion.z, w: player.base.quaternion.w },
        hasAvatar: !!player.avatar,
        avatarPosition: player.avatar ? { x: player.avatar.raw?.scene?.position.x, y: player.avatar.raw?.scene?.position.y, z: player.avatar.raw?.scene?.position.z } : null,
        hasPhysics: !!player.physics,
        moving: player.physics?.moving || false,
        grounded: player.physics?.grounded || false,
        jumping: player.physics?.jumping || false,
        falling: player.physics?.falling || false,
        flying: player.physics?.flying || false,
        animationMode: player.mode,
        hasControl: !!player.control,
        firstPerson: player.firstPerson || false,
        cameraZoom: player.control?.camera?.zoom || null,
        cameraDistance: player.control?.camera?.position.distanceTo(player.cam.position) || null
      };
    },
    avatarHierarchy: () => {
      const player = world.__DEBUG__.player();
      if (!player) return { error: "No player found" };
      return {
        basePosition: { x: player.base.position.x, y: player.base.position.y, z: player.base.position.z },
        baseQuaternion: { x: player.base.quaternion.x, y: player.base.quaternion.y, z: player.base.quaternion.z, w: player.base.quaternion.w },
        baseMatrixWorld: player.base.matrixWorld ? "set" : "unset",
        avatar: player.avatar ? {
          hasRaw: !!player.avatar.raw,
          rawScene: player.avatar.raw?.scene ? {
            position: { x: player.avatar.raw.scene.position.x, y: player.avatar.raw.scene.position.y, z: player.avatar.raw.scene.position.z },
            quaternion: { x: player.avatar.raw.scene.quaternion.x, y: player.avatar.raw.scene.quaternion.y, z: player.avatar.raw.scene.quaternion.z, w: player.avatar.raw.scene.quaternion.w },
            visible: player.avatar.raw.scene.visible,
            childCount: player.avatar.raw.scene.children?.length || 0,
            matrixWorld: player.avatar.raw.scene.matrixWorld ? "set" : "unset"
          } : null
        } : null,
        baseParent: player.base.parent?.name || player.base.parent?.constructor.name || "unknown",
        baseInScene: world.stage?.scene?.children.includes(player.base) || false
      };
    },
    testMovement: (direction = "forward", duration = 2e3) => {
      const player = world.__DEBUG__.player();
      if (!player) return { error: "No player found" };
      const startPos = { x: player.base.position.x, y: player.base.position.y, z: player.base.position.z };
      const startTime = Date.now();
      const handleTick = () => {
        const elapsed = Date.now() - startTime;
        if (elapsed >= duration) {
          const endPos = { x: player.base.position.x, y: player.base.position.y, z: player.base.position.z };
          const distance = Math.sqrt(
            Math.pow(endPos.x - startPos.x, 2) + Math.pow(endPos.y - startPos.y, 2) + Math.pow(endPos.z - startPos.z, 2)
          );
          return {
            direction,
            duration,
            startPos,
            endPos,
            distance: distance.toFixed(2),
            moved: distance > 0.01,
            animationMode: player.mode
          };
        }
        requestAnimationFrame(handleTick);
      };
      handleTick();
    },
    playerPerformance: () => {
      const player = world.__DEBUG__.player();
      if (!player) return { error: "No player found" };
      return {
        hasUpdateMatrix: typeof player.avatar?.raw?.scene?.updateMatrix === "function",
        hasUpdateMatrixWorld: typeof player.avatar?.raw?.scene?.updateMatrixWorld === "function",
        avatarVisible: player.avatar?.raw?.scene?.visible || false,
        physicsActive: !!player.physics,
        physicsUpdateRate: player.physics ? "active" : "inactive",
        inputProcessorActive: !!player.inputProcessor,
        animationControllerActive: !!player.animationController,
        networkSynchronizerActive: !!player.networkSynchronizer,
        cameraManagerActive: !!player.cam
      };
    }
  };
}

// src/client/debug/DebugNetwork.js
function setupDebugNetwork(world) {
  return {
    network: {
      id: () => world.network.id,
      isServer: () => world.network.isServer,
      isClient: () => world.network.isClient
    },
    getNetworkStats: () => ({
      id: world.network.id,
      isServer: world.network.isServer,
      isClient: world.network.isClient,
      connected: !!world.network.ws
    })
  };
}

// src/client/debug/DebugPlacement.js
function setupDebugPlacement(world) {
  return {
    placementState: () => {
      const builder = world.builder;
      const composer = builder?.composer;
      const selectionMgr = composer?.selectionManager;
      const stateTransition = composer?.stateTransitionHandler;
      const apps = world.entities.apps.filter((e) => !e.data.id.includes("scene"));
      return {
        builderEnabled: builder?.enabled || false,
        builderSelectedId: builder?.selected?.data?.id || null,
        selectionMgrSelectedId: selectionMgr?.selected?.data?.id || null,
        selectedApp: builder?.selected ? {
          id: builder.selected.data.id,
          mode: builder.selected.mode,
          mover: builder.selected.data.mover,
          position: builder.selected.root.position.toArray(),
          isMover: builder.selected.data.mover === world.network.id
        } : null,
        modelApps: apps.map((app) => ({
          id: app.data.id,
          mode: app.mode,
          mover: app.data.mover,
          isMover: app.data.mover === world.network.id,
          position: app.root.position.toArray()
        })),
        stateMismatch: builder?.selected?.data?.id !== selectionMgr?.selected?.data?.id ? "MISMATCH!" : "OK"
      };
    },
    testPlacementFinalization: (appId) => {
      const app = world.entities.get(appId);
      if (!app?.isApp) return { error: `App ${appId} not found` };
      if (app.data.mover !== world.network.id) return { error: "App not being moved by this client" };
      const beforeMover = app.data.mover;
      const beforeMode = app.mode;
      world.builder.composer.stateTransitionHandler.select(null);
      const afterMover = app.data.mover;
      const afterMode = app.mode;
      return {
        success: afterMover === null && beforeMover === world.network.id,
        beforeMover,
        afterMover,
        beforeMode,
        afterMode,
        moverCleared: afterMover === null
      };
    },
    assertPlacementReady: () => {
      const assertions = [];
      const builder = world.builder;
      const apps = world.entities.apps.filter((e) => !e.data.id.includes("scene"));
      if (!builder) assertions.push("\u274C Builder system missing");
      else assertions.push("\u2705 Builder system available");
      if (!builder?.composer?.selectionManager) assertions.push("\u274C SelectionManager missing");
      else assertions.push("\u2705 SelectionManager available");
      if (!builder?.composer?.stateTransitionHandler) assertions.push("\u274C StateTransitionHandler missing");
      else assertions.push("\u2705 StateTransitionHandler available");
      const modelApps = apps.filter((a) => a.data.blueprint !== "$scene");
      if (modelApps.length === 0) assertions.push("\u26A0\uFE0F  No model apps created yet");
      else assertions.push(`\u2705 ${modelApps.length} model app(s) exist`);
      const movingApps = modelApps.filter((a) => a.data.mover === world.network.id);
      if (movingApps.length > 0) assertions.push(`\u2705 ${movingApps.length} app(s) in MOVING mode`);
      else assertions.push("\u26A0\uFE0F  No apps in MOVING mode");
      return {
        assertions,
        all_pass: assertions.every((a) => a.startsWith("\u2705"))
      };
    }
  };
}

// src/core/lifecycle/DisposableResource.js
var logger15 = new StructuredLogger("DisposableResource");

// src/core/lifecycle/LifecycleCoordinator.js
var logger16 = new StructuredLogger("LifecycleCoordinator");
var LifecycleCoordinator = class {
  constructor() {
    this.resources = /* @__PURE__ */ new Map();
    this.layers = [];
    this.disposed = false;
    this.disposalOrder = [];
  }
  register(name, resource, layer = 0) {
    if (this.resources.has(name)) {
      logger16.warn("Resource already registered", { name });
      return;
    }
    this.resources.set(name, { resource, layer });
    if (!this.layers[layer]) {
      this.layers[layer] = [];
    }
    this.layers[layer].push(name);
    return resource;
  }
  unregister(name) {
    if (this.resources.has(name)) {
      const { layer } = this.resources.get(name);
      this.resources.delete(name);
      if (this.layers[layer]) {
        const index = this.layers[layer].indexOf(name);
        if (index >= 0) {
          this.layers[layer].splice(index, 1);
        }
      }
    }
  }
  get(name) {
    const entry = this.resources.get(name);
    return entry?.resource || null;
  }
  has(name) {
    return this.resources.has(name);
  }
  dispose() {
    if (this.disposed) {
      logger16.warn("LifecycleCoordinator already disposed");
      return;
    }
    this.disposalOrder = [];
    for (let layer = this.layers.length - 1; layer >= 0; layer--) {
      const layerResources = this.layers[layer];
      if (!layerResources) continue;
      for (const name of layerResources) {
        const entry = this.resources.get(name);
        if (!entry) continue;
        try {
          const { resource } = entry;
          if (resource && typeof resource.dispose === "function") {
            resource.dispose();
          }
          this.disposalOrder.push(name);
        } catch (err) {
          logger16.error("Failed to dispose resource", {
            name,
            layer,
            error: err.message
          });
        }
      }
    }
    this.resources.clear();
    this.layers = [];
    this.disposed = true;
    logger16.info("LifecycleCoordinator disposed", {
      resourceCount: this.disposalOrder.length
    });
  }
  getStats() {
    const byLayer = {};
    for (let i2 = 0; i2 < this.layers.length; i2++) {
      if (this.layers[i2]) {
        byLayer[i2] = this.layers[i2].length;
      }
    }
    return {
      totalResources: this.resources.size,
      layers: byLayer,
      disposed: this.disposed,
      disposalOrder: this.disposalOrder
    };
  }
  isDisposed() {
    return this.disposed;
  }
};
var lifecycleCoordinator = new LifecycleCoordinator();

// src/core/lifecycle/CleanupTracker.js
var logger17 = new StructuredLogger("CleanupTracker");
var CleanupTracker = class {
  constructor() {
    this.cleanups = /* @__PURE__ */ new Map();
    this.cleanupStats = {
      total: 0,
      successful: 0,
      failed: 0,
      pending: 0
    };
    this._pendingCount = 0;
  }
  _calculatePendingCount() {
    return Array.from(this.cleanups.values()).reduce((sum, arr) => sum + arr.filter((c2) => !c2.executed).length, 0);
  }
  registerCleanup(name, cleanupFn, priority = 0) {
    if (!this.cleanups.has(name)) {
      this.cleanups.set(name, []);
    }
    this.cleanups.get(name).push({
      fn: cleanupFn,
      priority,
      executed: false,
      error: null,
      executedAt: null,
      duration: null
    });
    this.cleanupStats.pending = this._calculatePendingCount();
    return () => {
      this.deregisterCleanup(name, cleanupFn);
    };
  }
  deregisterCleanup(name, cleanupFn) {
    const items = this.cleanups.get(name);
    if (!items) return;
    const index = items.findIndex((c2) => c2.fn === cleanupFn);
    if (index >= 0) {
      items.splice(index, 1);
    }
    this.cleanupStats.pending = this._calculatePendingCount();
  }
  async executeCleanups(filter2 = null) {
    const results = {
      executed: [],
      failed: [],
      skipped: []
    };
    for (const [name, items] of this.cleanups.entries()) {
      if (filter2 && !filter2.includes(name)) {
        results.skipped.push({ name, count: items.length });
        continue;
      }
      const sorted = items.slice().sort((a, b2) => b2.priority - a.priority);
      for (const item of sorted) {
        if (item.executed) continue;
        const startTime = Date.now();
        try {
          await Promise.resolve(item.fn());
          item.executed = true;
          item.executedAt = startTime;
          item.duration = Date.now() - startTime;
          this.cleanupStats.successful++;
          results.executed.push({ name, duration: item.duration });
        } catch (err) {
          item.error = err.message;
          item.executed = true;
          item.executedAt = startTime;
          item.duration = Date.now() - startTime;
          this.cleanupStats.failed++;
          results.failed.push({ name, error: err.message, duration: item.duration });
          logger17.error("Cleanup failed", { name, error: err.message });
        }
      }
    }
    this.cleanupStats.total = this.cleanupStats.successful + this.cleanupStats.failed;
    this.cleanupStats.pending = this._calculatePendingCount();
    return results;
  }
  getStats() {
    const byName = {};
    for (const [name, items] of this.cleanups.entries()) {
      byName[name] = {
        total: items.length,
        executed: items.filter((c2) => c2.executed).length,
        failed: items.filter((c2) => c2.error).length
      };
    }
    return {
      ...this.cleanupStats,
      byName,
      averageDuration: this.getAverageDuration()
    };
  }
  getAverageDuration() {
    const executed = Array.from(this.cleanups.values()).flat().filter((c2) => c2.executed && c2.duration);
    if (!executed.length) return 0;
    const total = executed.reduce((sum, c2) => sum + c2.duration, 0);
    return Math.round(total / executed.length);
  }
  reset() {
    this.cleanups.clear();
    this.cleanupStats = {
      total: 0,
      successful: 0,
      failed: 0,
      pending: 0
    };
  }
  getDetailedReport() {
    const report = {
      timestamp: (/* @__PURE__ */ new Date()).toISOString(),
      summary: this.cleanupStats,
      cleanups: []
    };
    for (const [name, items] of this.cleanups.entries()) {
      for (const item of items) {
        report.cleanups.push({
          name,
          priority: item.priority,
          executed: item.executed,
          error: item.error,
          duration: item.duration,
          executedAt: item.executedAt ? new Date(item.executedAt).toISOString() : null
        });
      }
    }
    return report;
  }
};
var cleanupTracker = new CleanupTracker();

// src/core/lifecycle/CleanupChecklist.js
var CleanupChecklist = {
  SYSTEM: {
    name: "System Cleanup",
    items: [
      "Clear all event listeners via listeners.clear()",
      "Stop any timers (clearInterval, clearTimeout)",
      "Cancel all pending promises (AbortController)",
      "Detach from world events",
      "Release reference to world",
      "Cleanup child systems or managers",
      "Call super.destroy() to trigger parent cleanup",
      "Log cleanup completion for debugging"
    ],
    template: `
destroy() {
  this.listeners.clear()
  if (this.abortController) this.abortController.abort()
  if (this.interval) clearInterval(this.interval)
  for (const system of this.subsystems) {
    system.destroy()
  }
  super.destroy?.()
}
    `
  },
  NODE: {
    name: "Node Cleanup (Three.js objects)",
    items: [
      "Dispose geometries (geometry.dispose())",
      "Dispose materials (material.dispose() or for array: forEach)",
      "Dispose textures (texture.dispose())",
      "Remove from parent (parent.remove(this))",
      "Clear child references",
      "Stop animations or tweens",
      "Remove event listeners",
      "Clean up sub-controllers (audio, video, etc.)",
      "Call super.dispose() if extending Node"
    ],
    template: `
dispose() {
  if (this.geometry) {
    this.geometry.dispose()
  }
  if (this.material) {
    if (Array.isArray(this.material)) {
      this.material.forEach(m => m.dispose())
    } else {
      this.material.dispose()
    }
  }
  if (this.parent) {
    this.parent.remove(this)
  }
  this.audioController?.cleanup()
  super.dispose?.()
}
    `
  },
  EVENT_EMITTER: {
    name: "Event Emitter Cleanup",
    items: [
      "Use EventListenerManager for automatic tracking",
      "Call listeners.clear() on destroy",
      "Or manually: off() each registered listener",
      "For DOM events: use removeEventListener()",
      "For EE: use off() method",
      "Check that all listeners are removed before disposal"
    ],
    template: `
// Option 1: Automatic via EventListenerManager
destroy() {
  this.listeners.clear()  // Removes all tracked listeners
  super.destroy?.()
}

// Option 2: Manual cleanup
destroy() {
  this.emitter.off('event', this.boundHandler)
  document.removeEventListener('click', this.domHandler)
  super.destroy?.()
}
    `
  },
  ASYNC_OPERATION: {
    name: "Async Operation Cleanup",
    items: [
      "Create AbortController at initialization",
      "Pass signal to fetch() and promises",
      "Call abortController.abort() on cleanup",
      "Catch AbortError gracefully",
      "Clear pending promises",
      "Stop async loops (while loops checking !abortController.signal.aborted)",
      "Cancel timers that drive async work"
    ],
    template: `
constructor() {
  this.abortController = new AbortController()
}

async fetch() {
  return fetch(url, { signal: this.abortController.signal })
}

destroy() {
  this.abortController.abort()
  this.listeners.clear()
  super.destroy?.()
}
    `
  },
  CACHE: {
    name: "Cache Cleanup",
    items: [
      "Clear cache on destroy (cache.clear())",
      "Set max size limits to prevent unbounded growth",
      "Implement LRU (least-recently-used) eviction",
      "Track cache hits/misses for monitoring",
      "Log cache size on destroy"
    ],
    template: `
destroy() {
  const size = this.cache.size
  this.cache.clear()
  logger.info('Cache cleared', { size })
  super.destroy?.()
}
    `
  },
  THREE_TEXTURE: {
    name: "Three.js Texture Cleanup",
    items: [
      "Call texture.dispose() for all textures",
      "Check for textures in materials (material.map, normalMap, etc.)",
      "Clear texture references",
      "Stop loading if in progress (AbortController)",
      "Remove from TextureLoader cache if applicable"
    ],
    template: `
disposeTextures() {
  if (this.material?.map) this.material.map.dispose()
  if (this.material?.normalMap) this.material.normalMap.dispose()
  if (this.material?.metalnessMap) this.material.metalnessMap.dispose()
  if (this.material?.roughnessMap) this.material.roughnessMap.dispose()
}
    `
  },
  THREE_GEOMETRY: {
    name: "Three.js Geometry Cleanup",
    items: [
      "Call geometry.dispose() for all geometries",
      "Check for shared geometries (may be used by multiple meshes)",
      "Use reference counting for shared resources",
      "Clear vertex data after disposal",
      "Log disposal for debugging"
    ],
    template: `
disposeGeometry() {
  if (this.geometry && !this.geometry.isShared) {
    this.geometry.dispose()
    this.geometry = null
  }
}
    `
  },
  INTERVAL_TIMER: {
    name: "Interval/Timer Cleanup",
    items: [
      "Store interval/timeout IDs",
      "Call clearInterval() or clearTimeout() on cleanup",
      "Check if already cleared (id !== null)",
      "Clear ID reference after clearing",
      "Log cleanup if timer was significant"
    ],
    template: `
constructor() {
  this.updateInterval = null
}

start() {
  this.updateInterval = setInterval(() => this.update(), 100)
}

destroy() {
  if (this.updateInterval) {
    clearInterval(this.updateInterval)
    this.updateInterval = null
  }
  super.destroy?.()
}
    `
  },
  WORKER_THREAD: {
    name: "Web Worker Cleanup",
    items: [
      "Store worker reference",
      "Call worker.terminate() on cleanup",
      "Remove message listener (removeEventListener or off)",
      "Don't send messages after termination",
      "Clear worker reference"
    ],
    template: `
constructor() {
  this.worker = new Worker('worker.js')
  this.worker.addEventListener('message', this.handleMessage.bind(this))
}

destroy() {
  this.worker.terminate()
  this.worker = null
  super.destroy?.()
}
    `
  },
  ANIMATION_FRAME: {
    name: "RequestAnimationFrame Cleanup",
    items: [
      "Store animationFrameId",
      "Call cancelAnimationFrame() on cleanup",
      "Check if frame is pending",
      "Clear reference after cancelling",
      "Use AbortController pattern as alternative"
    ],
    template: `
constructor() {
  this.animationFrameId = null
}

start() {
  this.animationFrameId = requestAnimationFrame(() => this.update())
}

destroy() {
  if (this.animationFrameId) {
    cancelAnimationFrame(this.animationFrameId)
    this.animationFrameId = null
  }
  super.destroy?.()
}
    `
  },
  DOM_REFERENCES: {
    name: "DOM Reference Cleanup",
    items: [
      "Clear all DOM element references",
      "Remove event listeners from DOM elements",
      "Remove elements from DOM (parentNode.removeChild)",
      "Set references to null to break cycles",
      "Don't store global references to DOM nodes"
    ],
    template: `
constructor() {
  this.canvas = document.getElementById('canvas')
  this.canvas.addEventListener('click', this.onClick.bind(this))
}

destroy() {
  this.canvas.removeEventListener('click', this.onClick)
  this.canvas.parentNode?.removeChild(this.canvas)
  this.canvas = null
  super.destroy?.()
}
    `
  },
  MEMORY_REFERENCES: {
    name: "Memory Reference Cleanup",
    items: [
      "Break circular references (a.b = null, b.a = null)",
      "Clear large data structures (arrays, maps)",
      "Don't store references to dispose()-d objects",
      "Use WeakMap for cache keys when appropriate",
      "Use WeakRef for optional references"
    ],
    template: `
destroy() {
  this.parent = null
  this.children.clear()
  this.cache.clear()
  this.largeArray = null
  super.destroy?.()
}
    `
  },
  CHECKLIST_PATTERN: {
    name: "Pre-Destroy Checklist",
    items: [
      "1. Identify all resources created in constructor",
      "2. For each resource, determine cleanup requirement",
      "3. Create cleanup code in destroy() method",
      "4. Test that dispose/destroy works (check console)",
      "5. Verify no memory leaks (use ResourceLeakDetector)",
      "6. Add parent class cleanup call (super.destroy)",
      "7. Log cleanup completion if tracking important",
      "8. Remove references to prevent circular dependencies"
    ],
    questions: [
      "Does this class create any timers/intervals?",
      "Does this class register any event listeners?",
      "Does this class create Three.js objects?",
      "Does this class use web workers?",
      "Does this class fetch/stream data?",
      "Does this class modify DOM?",
      "Does this class have circular references?",
      "Does this class spawn child objects?"
    ]
  }
};
function printCleanupGuide(category) {
  const guide = CleanupChecklist[category];
  if (!guide) {
    return "Unknown category. Available: " + Object.keys(CleanupChecklist).join(", ");
  }
  let output = `
=== ${guide.name} ===

`;
  if (guide.items) {
    output += "Checklist:\n";
    guide.items.forEach((item, i2) => {
      output += `${i2 + 1}. ${item}
`;
    });
  }
  if (guide.questions) {
    output += "\nQuestions to ask:\n";
    guide.questions.forEach((q, i2) => {
      output += `${i2 + 1}. ${q}
`;
    });
  }
  if (guide.template) {
    output += `
Template:
${guide.template}
`;
  }
  return output;
}

// src/core/debug/ResourceLeakDetector.js
var logger18 = new StructuredLogger("ResourceLeakDetector");
var ResourceLeakDetector = class {
  constructor() {
    this.enabled = typeof process === "undefined";
    this.tracked = /* @__PURE__ */ new Map();
    this.snapshots = [];
    this.maxSnapshots = 50;
  }
  trackObject(category, object, metadata = {}) {
    if (!this.enabled) return;
    const id = this.generateId();
    const entry = {
      id,
      category,
      object: new WeakRef(object),
      metadata,
      createdAt: Date.now(),
      stackTrace: this.captureStackTrace()
    };
    if (!this.tracked.has(category)) {
      this.tracked.set(category, /* @__PURE__ */ new Map());
    }
    this.tracked.get(category).set(id, entry);
  }
  untrackObject(category, object) {
    if (!this.enabled) return;
    const categoryMap = this.tracked.get(category);
    if (!categoryMap) return;
    for (const [id, entry] of categoryMap.entries()) {
      if (entry.object.deref() === object) {
        categoryMap.delete(id);
        break;
      }
    }
  }
  captureStackTrace() {
    if (typeof Error.captureStackTrace !== "function") {
      return "";
    }
    const obj = {};
    Error.captureStackTrace(obj, this.captureStackTrace);
    return obj.stack || "";
  }
  generateId() {
    return `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
  snapshot() {
    if (!this.enabled) return null;
    const snapshot = {
      timestamp: Date.now(),
      categories: {}
    };
    for (const [category, entries] of this.tracked.entries()) {
      const alive = [];
      const leaked = [];
      for (const [id, entry] of entries.entries()) {
        if (entry.object.deref() === void 0) {
          leaked.push(id);
        } else {
          alive.push({
            id,
            metadata: entry.metadata,
            age: Date.now() - entry.createdAt
          });
        }
      }
      if (alive.length || leaked.length) {
        snapshot.categories[category] = {
          alive: alive.length,
          aliveLists: alive,
          leaked: leaked.length
        };
      }
    }
    this.snapshots.push(snapshot);
    if (this.snapshots.length > this.maxSnapshots) {
      this.snapshots.shift();
    }
    return snapshot;
  }
  getLeakReport(threshold = 10) {
    if (!this.enabled) return null;
    const report = {
      timestamp: Date.now(),
      leaks: [],
      warnings: []
    };
    for (const [category, entries] of this.tracked.entries()) {
      let leakCount = 0;
      const leakedEntries = [];
      for (const [id, entry] of entries.entries()) {
        if (entry.object.deref() === void 0) {
          leakCount++;
          leakedEntries.push(entry);
        }
      }
      if (leakCount >= threshold) {
        report.leaks.push({
          category,
          count: leakCount,
          samples: leakedEntries.slice(0, 3).map((e) => ({
            metadata: e.metadata,
            age: Date.now() - e.createdAt,
            stack: e.stackTrace.split("\n").slice(0, 5).join("\n")
          }))
        });
      } else if (leakCount > 0) {
        report.warnings.push({
          category,
          count: leakCount,
          message: `${leakCount} potential leaks in ${category}`
        });
      }
    }
    if (report.leaks.length) {
      logger18.warn("Resource leaks detected", { leaks: report.leaks.length });
    }
    return report;
  }
  clear() {
    this.tracked.clear();
    this.snapshots = [];
  }
  getStats() {
    if (!this.enabled) return null;
    const stats = {
      totalTracked: 0,
      byCategory: {}
    };
    for (const [category, entries] of this.tracked.entries()) {
      stats.byCategory[category] = entries.size;
      stats.totalTracked += entries.size;
    }
    return stats;
  }
};
var resourceLeakDetector = new ResourceLeakDetector();

// src/core/debug/ResourceTracker.js
var ResourceTracker = class {
  static trackNode(node2, metadata = {}) {
    resourceLeakDetector.trackObject("Node", node2, {
      type: node2.constructor.name,
      name: node2.name,
      ...metadata
    });
  }
  static untrackNode(node2) {
    resourceLeakDetector.untrackObject("Node", node2);
  }
  static trackMaterial(material, metadata = {}) {
    resourceLeakDetector.trackObject("Material", material, {
      type: material.constructor.name,
      ...metadata
    });
  }
  static untrackMaterial(material) {
    resourceLeakDetector.untrackObject("Material", material);
  }
  static trackGeometry(geometry, metadata = {}) {
    resourceLeakDetector.trackObject("Geometry", geometry, {
      type: geometry.constructor.name,
      ...metadata
    });
  }
  static untrackGeometry(geometry) {
    resourceLeakDetector.untrackObject("Geometry", geometry);
  }
  static trackEntity(entity, metadata = {}) {
    resourceLeakDetector.trackObject("Entity", entity, {
      type: entity.constructor.name,
      id: entity.data?.id,
      ...metadata
    });
  }
  static untrackEntity(entity) {
    resourceLeakDetector.untrackObject("Entity", entity);
  }
  static trackApp(app, metadata = {}) {
    resourceLeakDetector.trackObject("App", app, {
      blueprintId: app.data?.blueprint,
      id: app.data?.id,
      ...metadata
    });
  }
  static untrackApp(app) {
    resourceLeakDetector.untrackObject("App", app);
  }
  static trackTexture(texture, metadata = {}) {
    resourceLeakDetector.trackObject("Texture", texture, {
      type: texture.constructor.name,
      ...metadata
    });
  }
  static untrackTexture(texture) {
    resourceLeakDetector.untrackObject("Texture", texture);
  }
  static trackListener(emitter, event, handler, metadata = {}) {
    resourceLeakDetector.trackObject("Listener", handler, {
      emitterType: emitter.constructor.name,
      event,
      ...metadata
    });
  }
  static untrackListener(emitter, event, handler) {
    resourceLeakDetector.untrackObject("Listener", handler);
  }
  static snapshot() {
    return resourceLeakDetector.snapshot();
  }
  static getReport(threshold = 10) {
    return resourceLeakDetector.getLeakReport(threshold);
  }
  static getStats() {
    return resourceLeakDetector.getStats();
  }
  static clear() {
    resourceLeakDetector.clear();
  }
};

// src/client/debug/DebugSystems.js
function setupDebugSystems(world, consoleLogs) {
  return {
    systems: {
      loader: () => world.loader,
      scripts: () => world.scripts,
      blueprints: () => world.blueprints,
      entities: () => world.entities,
      controls: () => world.controls,
      environment: () => world.environment,
      physics: () => world.physics,
      network: () => world.network,
      stage: () => world.stage
    },
    getScriptErrors: () => consoleLogs.errors.filter((e) => String(e.args[0]).includes("Script")),
    getScriptWarnings: () => consoleLogs.warnings.filter((w2) => String(w2.args[0]).includes("Script")),
    getPerformanceMetrics: () => ({
      entitiesCount: world.entities.items.size,
      blueprintsCount: world.blueprints.items.size,
      appsCount: world.entities.apps.length,
      playersCount: world.entities.playerEntities.length
    }),
    checkSceneApp: () => {
      const apps = world.entities.apps;
      const sceneApp = apps.find((app) => app.data.id.includes("scene"));
      if (!sceneApp) return { error: "Scene app not found" };
      const blueprint = world.blueprints.get(sceneApp.data.blueprint);
      return {
        appId: sceneApp.data.id,
        mode: sceneApp.mode,
        blueprintName: blueprint?.name,
        childCount: sceneApp.root?.children?.length || 0,
        hasErrors: consoleLogs.errors.length > 0,
        lastError: consoleLogs.errors[consoleLogs.errors.length - 1]?.args[0]
      };
    },
    resources: {
      snapshot: () => ResourceTracker.snapshot(),
      getReport: (threshold = 10) => ResourceTracker.getReport(threshold),
      getStats: () => ResourceTracker.getStats(),
      clear: () => ResourceTracker.clear(),
      trackNode: (node2, metadata) => ResourceTracker.trackNode(node2, metadata),
      trackEntity: (entity, metadata) => ResourceTracker.trackEntity(entity, metadata),
      trackApp: (app, metadata) => ResourceTracker.trackApp(app, metadata)
    },
    cleanup: {
      getStats: () => cleanupTracker.getStats(),
      getReport: () => cleanupTracker.getDetailedReport(),
      register: (name, fn, priority) => cleanupTracker.registerCleanup(name, fn, priority),
      execute: (filter2) => cleanupTracker.executeCleanups(filter2),
      printGuide: (category) => printCleanupGuide(category),
      reset: () => cleanupTracker.reset()
    }
  };
}

// src/client/debug/DebugPlugins.js
function setupDebugPlugins(world) {
  return {
    plugins: {
      getAll: () => world.pluginRegistry?.getAllPlugins() || [],
      get: (name) => world.pluginRegistry?.getPlugin(name) || null,
      getAssetHandlers: (type) => world.pluginRegistry?.getAssetHandlers(type) || [],
      getNetworkHandler: (messageType) => world.pluginRegistry?.getNetworkHandler(messageType) || null,
      getScriptGlobals: () => world.pluginRegistry?.getScriptGlobals() || {},
      getServerRoutes: () => world.pluginRegistry?.getServerRoutes() || [],
      getHooks: () => world.pluginHooks?.getHooks() || [],
      getHookDetails: (hookName) => world.pluginHooks?.getHookDetails(hookName) || null,
      listAllHooks: () => {
        const hooks = world.pluginHooks?.getHooks() || [];
        return hooks.map((name) => ({
          name,
          details: world.pluginHooks.getHookDetails(name)
        }));
      }
    }
  };
}

// src/client/debug/DebugMonitoring.js
function setupDebugMonitoring(world) {
  return {
    getFeatures: () => world.features || {},
    getCapabilities: () => world.capabilities || {},
    getDegradationStatus: () => ({
      audio: world.audio?.degraded || false,
      livekit: world.livekit?.degraded || false,
      network: world.network?.offlineMode || false,
      features: world.features || {},
      capabilities: world.capabilities || {}
    }),
    getFallbackLog: () => world.loader?.getFallbackLog?.() || [],
    performance: {
      getStats: (label) => world.performanceMonitor?.getStats(label) || null,
      getAllStats: () => world.performanceMonitor?.getAllStats() || {},
      getViolations: (limit) => world.performanceMonitor?.getViolations(limit) || [],
      getViolationSummary: () => world.performanceMonitor?.getViolationSummary() || [],
      getBudget: (category, path) => world.performanceBudget?.getBudget(category, path) || null,
      getBudgets: () => world.performanceBudget?.BUDGETS || {},
      isEnabled: () => world.performanceMonitor?.enabled || false,
      enable: () => world.performanceMonitor?.enable(),
      disable: () => world.performanceMonitor?.disable(),
      setSampleRate: (rate) => world.performanceMonitor?.setSampleRate(rate),
      clear: () => world.performanceMonitor?.clear(),
      getSampleData: () => ({
        framePhases: world.performanceMonitor?.samples.framePhases.getAll() || [],
        systemPhases: world.performanceMonitor?.samples.systemPhases.getAll() || [],
        entityOperations: world.performanceMonitor?.samples.entityOperations.getAll() || []
      })
    },
    memory: {
      takeSnapshot: (label) => world.memoryAnalyzer?.takeSnapshot(label)?.export(),
      getSnapshot: (index) => world.memoryAnalyzer?.getSnapshot(index)?.export() || null,
      getAllSnapshots: () => world.memoryAnalyzer?.getAllSnapshots().map((s) => s.export()) || [],
      compareSnapshots: (index1, index2) => world.memoryAnalyzer?.compareSnapshots(index1, index2) || null,
      getLeaks: () => world.memoryAnalyzer?.detectLeaks() || [],
      getReport: () => world.memoryAnalyzer?.getReport() || null,
      getGrowthRate: (startIndex, endIndex) => world.memoryAnalyzer?.getGrowthRate(startIndex, endIndex) || null,
      getHeapTrend: () => world.memoryAnalyzer?.getHeapTrend() || [],
      getObjectTypeTrend: (type) => world.memoryAnalyzer?.getObjectTypeGrowthTrend(type) || [],
      clear: () => world.memoryAnalyzer?.clear(),
      getMetadata: () => {
        const snapshots = world.memoryAnalyzer?.getAllSnapshots() || [];
        return {
          snapshotCount: snapshots.length,
          totalCapacity: world.memoryAnalyzer?.maxSnapshots || 0,
          timespan: snapshots.length > 1 ? {
            start: snapshots[0].timestamp,
            end: snapshots[snapshots.length - 1].timestamp,
            duration: snapshots[snapshots.length - 1].timestamp - snapshots[0].timestamp
          } : null
        };
      }
    },
    degradation: {
      registerFeature: (name, options) => world.degradation?.registerFeature(name, options),
      enableFeature: (name, testFn) => world.degradation?.enableFeature(name, testFn),
      getFeatureStatus: (name) => world.degradation?.getFeatureStatus(name),
      getAllStatus: () => world.degradation?.getAllStatus(),
      getDegradationStatus: () => world.degradation?.getDegradationStatus(),
      isFeatureAvailable: (name) => world.degradation?.isFeatureAvailable(name),
      isFeatureDegraded: (name) => world.degradation?.isFeatureDegraded(name),
      canContinue: (name) => world.degradation?.canContinue(name),
      getReport: () => world.degradation?.getReport(),
      activateFallback: (name) => world.degradation?.activateFallback(name)
    },
    dashboard: {
      getDashboard: () => world.dashboard?.getDashboard(),
      getMetric: (name) => world.dashboard?.getMetric(name),
      getAllMetrics: () => world.dashboard?.getAllMetrics(),
      getMetricHistory: (name, limit) => world.dashboard?.getMetricHistory(name, limit),
      getMetricStats: (name) => world.dashboard?.getMetricStats(name),
      getActiveAlerts: () => world.dashboard?.getActiveAlerts(),
      acknowledgeAlert: (alertId) => world.dashboard?.acknowledgeAlert(alertId),
      clearAlerts: () => world.dashboard?.clearAlerts(),
      getSummary: () => world.dashboard?.getSummary(),
      getTrends: () => world.dashboard?.getTrends(),
      getTopMetrics: (limit) => world.dashboard?.getTopMetrics(limit),
      startCollection: () => world.metricsCollector?.setupDefaultCollectors().setupThresholds().start(),
      stopCollection: () => world.metricsCollector?.stop(),
      getHealthReport: () => world.metricsCollector?.getHealthReport(),
      getMetricsByCategory: () => world.metricsCollector?.getMetricsByCategory(),
      setThreshold: (metric, value, severity) => world.dashboard?.setThreshold(metric, value, severity)
    },
    events: {
      getEmitterStats: (name) => world.eventAudit?.getEmitterStats(name),
      getAllStats: () => world.eventAudit?.getAllStats(),
      getEventHistory: (emitter, event, limit) => world.eventAudit?.getEventHistory(emitter, event, limit),
      getTopEvents: (limit) => world.eventAudit?.getTopEvents(limit),
      getAnomalies: (threshold) => world.eventAudit?.getAnomalies(threshold),
      getAuditReport: () => world.eventAudit?.getReport(),
      enableAudit: () => world.eventAudit?.enable(),
      disableAudit: () => world.eventAudit?.disable(),
      clearAudit: () => world.eventAudit?.clear(),
      registerEvent: (name, options) => world.eventRegistry?.registerEvent(name, options),
      getEvent: (name) => world.eventRegistry?.getEvent(name),
      getEventsByCategory: (category) => world.eventRegistry?.getEventsByCategory(category),
      getAllEvents: () => world.eventRegistry?.getAllEvents(),
      getDocumentation: (name) => world.eventRegistry?.getEventDocumentation(name),
      getAllDocumentation: () => world.eventRegistry?.getAllDocumentation(),
      validateEventData: (name, data) => world.eventRegistry?.validateEventData(name, data),
      exportRegistry: () => world.eventRegistry?.exportRegistry()
    }
  };
}

// src/client/debug/DebugAPI.js
var logger19 = new StructuredLogger("DebugAPI");
function setupDebugGlobals(world) {
  if (typeof window === "undefined") return;
  const consoleCapture = new ConsoleCapture(500);
  consoleCapture.enable();
  window.__DEBUG__ = {
    world,
    logs: consoleCapture.logs,
    ...setupDebugEntity(world),
    ...setupDebugPlayer(world),
    ...setupDebugNetwork(world),
    ...setupDebugPlacement(world),
    ...setupDebugSystems(world, consoleCapture.logs),
    ...setupDebugPlugins(world),
    ...setupDebugMonitoring(world)
  };
  logger19.info("Global debug utilities available at window.__DEBUG__");
  logger19.info("Player: window.__DEBUG__.player() | playerState() | avatarHierarchy() | playerPerformance()");
  logger19.info("Quick check: window.__DEBUG__.checkSceneApp() | getPerformanceMetrics()");
  logger19.info('Apps: window.__DEBUG__.apps() | getAppState("app-id") | findNodesByName("sky")');
}

// src/core/FeatureDetector.js
var logger20 = new StructuredLogger("FeatureDetector");
var FeatureDetector = class {
  constructor() {
    this.features = {};
    this.detectionComplete = false;
  }
  async detect() {
    if (this.detectionComplete) return this.features;
    this.features = {
      webgl: this.detectWebGL(),
      webgl2: this.detectWebGL2(),
      webAudio: this.detectWebAudio(),
      webSocket: this.detectWebSocket(),
      webRTC: this.detectWebRTC(),
      webWorker: this.detectWebWorker(),
      indexedDB: this.detectIndexedDB(),
      localStorage: this.detectLocalStorage(),
      fetch: this.detectFetch(),
      audioContext: await this.detectAudioContext(),
      microphone: await this.detectMicrophone(),
      camera: await this.detectCamera(),
      gamepad: this.detectGamepad(),
      pointerLock: this.detectPointerLock(),
      fullscreen: this.detectFullscreen(),
      webXR: await this.detectWebXR(),
      offscreenCanvas: this.detectOffscreenCanvas()
    };
    this.detectionComplete = true;
    logger20.info("Detection complete", { features: Object.keys(this.features) });
    return this.features;
  }
  detectWebGL() {
    try {
      const canvas = document.createElement("canvas");
      return !!(canvas.getContext("webgl") || canvas.getContext("experimental-webgl"));
    } catch (e) {
      return false;
    }
  }
  detectWebGL2() {
    try {
      const canvas = document.createElement("canvas");
      return !!canvas.getContext("webgl2");
    } catch (e) {
      return false;
    }
  }
  detectWebAudio() {
    return !!(window.AudioContext || window.webkitAudioContext);
  }
  detectWebSocket() {
    return typeof WebSocket !== "undefined";
  }
  detectWebRTC() {
    return !!(window.RTCPeerConnection || window.webkitRTCPeerConnection || window.mozRTCPeerConnection);
  }
  detectWebWorker() {
    return typeof Worker !== "undefined";
  }
  detectIndexedDB() {
    return !!(window.indexedDB || window.mozIndexedDB || window.webkitIndexedDB || window.msIndexedDB);
  }
  detectLocalStorage() {
    try {
      const test = "__test__";
      localStorage.setItem(test, test);
      localStorage.removeItem(test);
      return true;
    } catch (e) {
      return false;
    }
  }
  detectFetch() {
    return typeof fetch !== "undefined";
  }
  async detectAudioContext() {
    try {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      if (!AudioContextClass) return false;
      const ctx = new AudioContextClass();
      await ctx.close();
      return true;
    } catch (e) {
      return false;
    }
  }
  async detectMicrophone() {
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) return false;
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach((track) => track.stop());
      return true;
    } catch (e) {
      return false;
    }
  }
  async detectCamera() {
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) return false;
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      stream.getTracks().forEach((track) => track.stop());
      return true;
    } catch (e) {
      return false;
    }
  }
  detectGamepad() {
    return !!(navigator.getGamepads || navigator.webkitGetGamepads);
  }
  detectPointerLock() {
    const el = document.createElement("div");
    return !!(el.requestPointerLock || el.mozRequestPointerLock || el.webkitRequestPointerLock);
  }
  detectFullscreen() {
    const el = document.createElement("div");
    return !!(el.requestFullscreen || el.mozRequestFullScreen || el.webkitRequestFullscreen || el.msRequestFullscreen);
  }
  async detectWebXR() {
    try {
      if (!navigator.xr) return false;
      const supported = await navigator.xr.isSessionSupported("immersive-vr");
      return supported;
    } catch (e) {
      return false;
    }
  }
  detectOffscreenCanvas() {
    return typeof OffscreenCanvas !== "undefined";
  }
  getFeatures() {
    return this.features;
  }
  hasFeature(feature) {
    return !!this.features[feature];
  }
  getCapabilities() {
    return {
      canUseAudio: this.features.webAudio && this.features.audioContext,
      canUseVoiceChat: this.features.webRTC && this.features.microphone,
      canUseVideoChat: this.features.webRTC && this.features.camera,
      canUsePhysics: this.features.webWorker,
      canUseWebSocket: this.features.webSocket,
      canUseStorage: this.features.indexedDB || this.features.localStorage,
      canUseXR: this.features.webXR,
      canUseGamepad: this.features.gamepad,
      canUsePointerLock: this.features.pointerLock,
      canUseFullscreen: this.features.fullscreen,
      canRender3D: this.features.webgl || this.features.webgl2
    };
  }
};

// src/client/world-client.js
var logger21 = new StructuredLogger("WorldClient");
function Client({ wsUrl, onSetup }) {
  const viewportRef = useRef13();
  const uiRef = useRef13();
  const world = useMemo9(() => {
    const w2 = new World();
    w2.isClient = true;
    return w2;
  }, []);
  const [ui, setUI] = useState36(world.ui?.state || { visible: true, active: false, app: null, pane: null, reticleSuppressors: 0 });
  useEffect33(() => {
    world.on("ui", setUI);
    return () => {
      world.off("ui", setUI);
    };
  }, []);
  useEffect33(() => {
    const init = async () => {
      try {
        logger21.info("World initialization started", {});
        const featureDetector = new FeatureDetector();
        const features = await featureDetector.detect();
        const capabilities = featureDetector.getCapabilities();
        logger21.info("Client feature detection complete", { capabilities });
        if (!capabilities.canRender3D) {
          logger21.error("WebGL not supported - cannot render 3D content", {});
          return;
        }
        if (!capabilities.canUseWebSocket) {
          logger21.warn("WebSocket not supported - entering offline mode", {});
        }
        world.features = features;
        world.capabilities = capabilities;
        const viewport = viewportRef.current;
        const ui2 = uiRef.current;
        const baseEnvironment = {
          model: "/base-environment.glb",
          bg: null,
          hdr: "/Clear_08_4pm_LDR.hdr",
          rotationY: 0,
          sunDirection: new THREE.Vector3(-1, -2, -2).normalize(),
          sunIntensity: 1,
          sunColor: 16777215,
          fogNear: null,
          fogFar: null,
          fogColor: null
        };
        if (typeof wsUrl === "function") {
          wsUrl = wsUrl();
          if (wsUrl instanceof Promise) wsUrl = await wsUrl;
        }
        const config = { viewport, ui: ui2, wsUrl, baseEnvironment, assetsUrl: "/assets", capabilities };
        logger21.info("Calling onSetup and initializing debug globals", {});
        onSetup?.(world, config);
        setupDebugGlobals(world);
        const initPromise = (async () => {
          logger21.info("Starting world initialization", {});
          await world.init(config);
          logger21.info("World initialization completed", {});
        })();
        await initPromise;
        const tick = (time) => {
          world.tick(time);
          requestAnimationFrame(tick);
        };
        requestAnimationFrame(tick);
      } catch (err) {
        logger21.error("World initialization error", { error: err.message });
        logger21.error("Unable to start application - check logs for details", {});
      }
    };
    init();
  }, []);
  return h2(
    "div",
    {
      className: "App",
      css: O`
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      height: 100vh;
      height: 100dvh;
      .App__viewport {
        position: absolute;
        inset: 0;
      }
      .App__ui {
        position: absolute;
        inset: 0;
        pointer-events: none;
        user-select: none;
        display: ${ui.visible ? "block" : "none"};
      }
    `
    },
    h2(
      "div",
      { className: "App__viewport", ref: viewportRef },
      h2(
        "div",
        { className: "App__ui", ref: uiRef },
        h2(CoreUI, { world })
      )
    )
  );
}
export {
  Client,
  System
};
/*! Bundled license information:

lodash/lodash.js:
  (**
   * @license
   * Lodash <https://lodash.com/>
   * Copyright OpenJS Foundation and other contributors <https://openjsf.org/>
   * Released under MIT license <https://lodash.com/license>
   * Based on Underscore.js 1.8.3 <http://underscorejs.org/LICENSE>
   * Copyright Jeremy Ashkenas, DocumentCloud and Investigative Reporters & Editors
   *)

lucide-react/dist/esm/shared/src/utils.js:
lucide-react/dist/esm/defaultAttributes.js:
lucide-react/dist/esm/Icon.js:
lucide-react/dist/esm/createLucideIcon.js:
lucide-react/dist/esm/icons/blend.js:
lucide-react/dist/esm/icons/box.js:
lucide-react/dist/esm/icons/brick-wall.js:
lucide-react/dist/esm/icons/chevrons-up-down.js:
lucide-react/dist/esm/icons/circle-arrow-right.js:
lucide-react/dist/esm/icons/circle-help.js:
lucide-react/dist/esm/icons/circle-plus.js:
lucide-react/dist/esm/icons/circle.js:
lucide-react/dist/esm/icons/code.js:
lucide-react/dist/esm/icons/crosshair.js:
lucide-react/dist/esm/icons/download.js:
lucide-react/dist/esm/icons/dumbbell.js:
lucide-react/dist/esm/icons/earth.js:
lucide-react/dist/esm/icons/eye.js:
lucide-react/dist/esm/icons/file-code-2.js:
lucide-react/dist/esm/icons/folder.js:
lucide-react/dist/esm/icons/hammer.js:
lucide-react/dist/esm/icons/hard-drive.js:
lucide-react/dist/esm/icons/hash.js:
lucide-react/dist/esm/icons/layers.js:
lucide-react/dist/esm/icons/list-tree.js:
lucide-react/dist/esm/icons/loader-pinwheel.js:
lucide-react/dist/esm/icons/loader.js:
lucide-react/dist/esm/icons/magnet.js:
lucide-react/dist/esm/icons/message-square-text.js:
lucide-react/dist/esm/icons/octagon-x.js:
lucide-react/dist/esm/icons/person-standing.js:
lucide-react/dist/esm/icons/pin.js:
lucide-react/dist/esm/icons/refresh-cw.js:
lucide-react/dist/esm/icons/rocket.js:
lucide-react/dist/esm/icons/save.js:
lucide-react/dist/esm/icons/search.js:
lucide-react/dist/esm/icons/send-horizontal.js:
lucide-react/dist/esm/icons/sparkle.js:
lucide-react/dist/esm/icons/square-menu.js:
lucide-react/dist/esm/icons/tag.js:
lucide-react/dist/esm/icons/trash-2.js:
lucide-react/dist/esm/icons/triangle.js:
lucide-react/dist/esm/icons/user-x.js:
lucide-react/dist/esm/icons/users.js:
lucide-react/dist/esm/icons/volume-2.js:
lucide-react/dist/esm/icons/x.js:
lucide-react/dist/esm/lucide-react.js:
  (**
   * @license lucide-react v0.469.0 - ISC
   *
   * This source code is licensed under the ISC license.
   * See the LICENSE file in the root directory of this source tree.
   *)
*/
