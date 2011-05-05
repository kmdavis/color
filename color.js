(function () {
  // Initial Setup
  // -------------

  var
    // Save a reference to the global object.
    root = this,

    // Save the previous value of the `Color` variable.
    previousColor = root.Color,

    init = null,

    // Dummy Constructor
    Color = function () {
      init.apply(this, arguments);
    },

    // Save a reference to Underscore
    _ = root._;

  // Require Underscore, if we're on the server, and it's not already present.
  if (!_ && ("undefined" !== typeof(require))) {
    _ = require("underscore")._;
  }

  // Export for both CommonJS and the browser.
  if ("undefined" !== typeof(root.exports)) {
    root.exports = {
      Color: Color
    };
  } else {
    root.Color = Color;
  }

  // Current version of the library.
  // Keep in sync with `package.json`.
  Color.VERSION = [0, 0, 1].join(".");

  // Option to rollback to previous value of `Color` variable.
  // Returns reference to Color
  Color.noConflict = function() {
    root.Color = previousColor;
    return Color;
  };

  (function colorWrapper () {
    /**
     * @method matrixMultiply
     * @params ...Matrices
     * @returns Matrix
     */
    var
      matrixMultiply = function matrixMultiply () {
        var result, matrix1, matrix2, x, y, z, a;

        for (a = 0; a < arguments.length; a += 1) {
          matrix1 = arguments[a];

          if (!result) {

            result = [];

            for (x = 0; x < matrix1.length; x += 1) {

              result[x] = [];

              for (y = 0; y < matrix1[x].length; y += 1) {
                result[x][y] = matrix1[x][y];
              }
            }

          } else {

            matrix2 = result;

            if (matrix1[0].length !== matrix2.length) {
              throw new Error ("Unable to multiply matrices");
            }

            result = [];

            for (x = 0; x < matrix1.length; x += 1) {

              result[x] = [];

              for (y = 0; y < matrix2[0].length; y += 1) {

                result[x][y] = 0;

                for (z = 0; z < matrix2.length; z += 1) {
                  result[x][y] += matrix1[x][z] * matrix2[z][y];
                }
              }
            }
          }
        }

        return result;
      },

      /**
       * For converting linearRGB (R'G'B') to sRGB
       * @param   {Number} c
       * @returns {Number}
       */
      linearToS = function linearToS (c) {
        if (0.31308 >= c) {
          return 32.946 * c;
        } else {
          return ((1 + 0.055) * Math.pow(c / 100, 1 / 2.4) - 0.055) * 255;
        }
      },

      // Observer= 2°, Illuminant= D65
      CIEXYZ_REFERENCE_X = 95.047,
      CIEXYZ_REFERENCE_Y = 100,
      CIEXYZ_REFERENCE_Z = 108.883,

      // Observer= 2°, Illuminant= D50
      //CIEXYZ_REFERENCE_X = 96.422,
      //CIEXYZ_REFERENCE_Y = 100,
      //CIEXYZ_REFERENCE_Z = 82.521,

      TRANSFORMATION_MATRICES = {
        from : {
          "rgb" : { // sRGB
            to : {
              "xyz" : [ // CIEXYZ
                [ 0.4360747,  0.3850649,  0.1430804],
                [ 0.2225045,  0.7168786,  0.0606169],
                [ 0.0139322,  0.0971045,  0.7141733]
              ],

              "yiq" : [
                [ 0.299,      0.587,      0.114    ],
                [ 0.596,     -0.275,     -0.321    ],
                [ 0.212,     -0.523,      0.311    ]
              ],

              "yuv" : [
                [ 0.299,	    0.587,	    0.114    ],
                [-0.147,	   -0.289,	    0.437    ],
                [ 0.615,	   -0.515,	   -0.100    ]
              ],

              "ycbcr" : [ // also need to add [16, 128, 128]
                [ 0.1825858,  0.6142305,  0.1825858],
                [-0.1575243, -0.3385719,  0.4294117],
                [ 0.4392156, -0.3989421, -0.0402735]
              ],

              "ydbdr" : [ // Y'DbDr
                [ 0.299,      0.587,      0.114    ],
                [-0.450,     -0.883,      1.333    ],
                [-1.333,      1.116,      0.217    ]
              ]
            }
          },

          "xyz" : { // CIEXYZ
            to : {
              "rgb2" : [ // sRGB (very similar to most rgb's)
                [ 3.1338561, -1.6168667, -0.4906146],
                [-0.9787684,  1.9161415,  0.0334540],
                [ 0.0719453, -0.2289914,  1.4052427]
              ],

              "rgb" : [
                [ 3.2406,    -1.5372,    -0.4986],
                [-0.9689,     1.8758,     0.0415],
                [ 0.0557,    -0.2040,     1.0570]
              ],

              "adobe_rgb" : [ // Adobe RGB (very similar to ntsc rgb)
                [ 2.0413690, -0.5649464, -0.3446944],
                [-0.9692660,  1.8760108,  0.0415560],
                [ 0.0134474, -0.1183897,  1.0154096]
              ]
            }
          },

          "yiq" : {
            to : {
              "rgb" : [
                [ 1.0,        0.956,      0.621    ],
                [ 1.0,       -0.272,     -0.647    ],
                [ 1.0,       -1.105,      1.702    ]
              ]
            }
          },

          "yuv" : {
            to : {
              "rgb" : [
                [ 1.0,        0.0,        1.140    ],
                [ 1.0        -0.394,     -0.581    ],
                [ 1.0,        2.028,      0.0      ]
              ]
            }
          },

          "ycbcr" : { // Y'CbCr
            to : {
              "rgb" : [
                [ 1.0,        0,          1.402    ],
                [ 1.0,       -0.344136,  -0.714136 ],
                [ 1.0,        1.772,      0        ]
              ]
            }
          },

          "ydbdr" : { // Y'DbDr
            to : {
              "rgb" : [
                [ 1.0,        0.0000923, -0.5259126],
                [ 1.0,       -0.1291329,  0.2678993],
                [ 1.0,        0.6646790, -0.0000792]
              ]
            }
          }
        }
      },

      FORMAT_STRINGS = {
        "rgb"  : "rgb({red}, {green}, {blue})",
        "rgba" : "rgba({red}, {green}, {blue}, {alpha})",
        "hsl"  : "hsv({hue}, {saturation}, {lightness})",
        "hsv"  : "hsv({hue}, {saturation}, {value})",
        "xyz"  : "xyz({x}, {y}, {z})",
        "lab"  : "lab({l}, {a}, {b})",
        "luv"  : "luv({l}, {u}, {v})",
        "uvw"  : "uvw({u}, {v}, {w})",
        "yiq"  : "yiq({luma}, {inPhase}, {quadrature})",
        "yuv"  : "yuv({luma}, {u}, {v})"
      },
      
      NAMED_COLORS = {
        "aliceblue":"#f0f8ff",
        "antiquewhite":"#faebd7",
        "aqua":"#00ffff",
        "aquamarine":"#7fffd4",
        "azure":"#f0ffff",
        "beige":"#f5f5dc",
        "bisque":"#ffe4c4",
        "black":"#000000",
        "blanchedalmond":"#ffebcd",
        "blue":"#0000ff",
        "blueviolet":"#8a2be2",
        "brown":"#a52a2a",
        "burlywood":"#deb887",
        "cadetblue":"#5f9ea0",
        "chartreuse":"#7fff00",
        "chocolate":"#d2691e",
        "coral":"#ff7f50",
        "cornflowerblue":"#6495ed",
        "cornsilk":"#fff8dc",
        "crimson":"#dc143c",
        "cyan":"#00ffff",
        "darkblue":"#00008b",
        "darkcyan":"#008b8b",
        "darkgoldenrod":"#b8860b",
        "darkgray":"#a9a9a9",
        "darkgreen":"#006400",
        "darkkhaki":"#bdb76b",
        "darkmagenta":"#8b008b",
        "darkolivegreen":"#556b2f",
        "darkorange":"#ff8c00",
        "darkorchid":"#9932cc",
        "darkred":"#8b0000",
        "darksalmon":"#e9967a",
        "darkseagreen":"#8fbc8f",
        "darkslateblue":"#483d8b",
        "darkslategray":"#2f4f4f",
        "darkturquoise":"#00ced1",
        "darkviolet":"#9400d3",
        "deeppink":"#ff1493",
        "deepskyblue":"#00bfff",
        "dimgray":"#696969",
        "dodgerblue":"#1e90ff",
        "firebrick":"#b22222",
        "floralwhite":"#fffaf0",
        "forestgreen":"#228b22",
        "fuchsia":"#ff00ff",
        "gainsboro":"#dcdcdc",
        "ghostwhite":"#f8f8ff",
        "gold":"#ffd700",
        "goldenrod":"#daa520",
        "gray":"#808080",
        "green":"#008000",
        "greenyellow":"#adff2f",
        "honeydew":"#f0fff0",
        "hotpink":"#ff69b4",
        "indianred ":"#cd5c5c",
        "indigo ":"#4b0082",
        "ivory":"#fffff0",
        "khaki":"#f0e68c",
        "lavender":"#e6e6fa",
        "lavenderblush":"#fff0f5",
        "lawngreen":"#7cfc00",
        "lemonchiffon":"#fffacd",
        "lightblue":"#add8e6",
        "lightcoral":"#f08080",
        "lightcyan":"#e0ffff",
        "lightgoldenrodyellow":"#fafad2",
        "lightgrey":"#d3d3d3",
        "lightgreen":"#90ee90",
        "lightpink":"#ffb6c1",
        "lightsalmon":"#ffa07a",
        "lightseagreen":"#20b2aa",
        "lightskyblue":"#87cefa",
        "lightslategray":"#778899",
        "lightsteelblue":"#b0c4de",
        "lightyellow":"#ffffe0",
        "lime":"#00ff00",
        "limegreen":"#32cd32",
        "linen":"#faf0e6",
        "magenta":"#ff00ff",
        "maroon":"#800000",
        "mediumaquamarine":"#66cdaa",
        "mediumblue":"#0000cd",
        "mediumorchid":"#ba55d3",
        "mediumpurple":"#9370d8",
        "mediumseagreen":"#3cb371",
        "mediumslateblue":"#7b68ee",
        "mediumspringgreen":"#00fa9a",
        "mediumturquoise":"#48d1cc",
        "mediumvioletred":"#c71585",
        "midnightblue":"#191970",
        "mintcream":"#f5fffa",
        "mistyrose":"#ffe4e1",
        "moccasin":"#ffe4b5",
        "navajowhite":"#ffdead",
        "navy":"#000080",
        "oldlace":"#fdf5e6",
        "olive":"#808000",
        "olivedrab":"#6b8e23",
        "orange":"#ffa500",
        "orangered":"#ff4500",
        "orchid":"#da70d6",
        "palegoldenrod":"#eee8aa",
        "palegreen":"#98fb98",
        "paleturquoise":"#afeeee",
        "palevioletred":"#d87093",
        "papayawhip":"#ffefd5",
        "peachpuff":"#ffdab9",
        "peru":"#cd853f",
        "pink":"#ffc0cb",
        "plum":"#dda0dd",
        "powderblue":"#b0e0e6",
        "purple":"#800080",
        "red":"#ff0000",
        "rosybrown":"#bc8f8f",
        "royalblue":"#4169e1",
        "saddlebrown":"#8b4513",
        "salmon":"#fa8072",
        "sandybrown":"#f4a460",
        "seagreen":"#2e8b57",
        "seashell":"#fff5ee",
        "sienna":"#a0522d",
        "silver":"#c0c0c0",
        "skyblue":"#87ceeb",
        "slateblue":"#6a5acd",
        "slategray":"#708090",
        "snow":"#fffafa",
        "springgreen":"#00ff7f",
        "steelblue":"#4682b4",
        "tan":"#d2b48c",
        "teal":"#008080",
        "thistle":"#d8bfd8",
        "tomato":"#ff6347",
        "turquoise":"#40e0d0",
        "violet":"#ee82ee",
        "wheat":"#f5deb3",
        "white":"#ffffff",
        "whitesmoke":"#f5f5f5",
        "yellow":"#ffff00",
        "yellowgreen":"#9acd32"
      };

    /**
     * @class Color
     * @constructor
     */
    init = function Color () {
      var fromArguments = function (args, name, index, def) {
        if ("object" === typeof (args[0])) {
          return "undefined" === typeof (args[0][name]) ? def : args[0][name];
        } else if ("string" === typeof (args[0])) {
          var
            str = args[0].replace("#", ""),
            val = parseInt(6 <= str.length ? str.substr(index * 2, 2) : (str.substr(index, 1) + str.substr(index, 1)), 16);
          return isNaN(val) ? def : val;
          
        } else if ("number" === typeof (args[index])) {
          return args[index];
        }
        return def;
      };

      this.colorSpaces = {
        rgb: {
          red:   fromArguments(arguments, "red",   0, 255),
          green: fromArguments(arguments, "green", 1, 255),
          blue:  fromArguments(arguments, "blue",  2, 255)
        }
      };

      this.alpha = fromArguments(arguments, "alpha", 3, 1);
      
      this.colorSpace = fromArguments(arguments, "colorSpace", 1000, "rgb");

      if ("rgb" !== this.colorSpace && "object" === typeof(arguments[0])) {
        this.colorSpaces[this.colorSpace] = arguments[0][this.colorSpace];
      }
    };

    /**
     * Create a new Color in the RGB color space
     * @method  fromRGB
     * @static
     * @param   {Number || Object} red    range: [0-255]
     * @option  {Number}           green  range: [0-255]
     * @option  {Number}           blue   range: [0-255]
     * @option  {Number}           alpha  range: [0-1]
     * @returns {Color}
     */
    Color.fromRGB = function fromRGB (red, green, blue, alpha) {
      return new Color({
        red:   red.red   || red.r || red,
        green: red.green || red.g || green,
        blue:  red.blue  || red.b || blue,
        alpha: red.alpha || red.opacity || alpha,
        colorSpace: "rgb"
      });
    };
    
    Color.fromRGBA = Color.fromRGB;

    /**
     * Create a new Color in the CMY color space
     * @method  fromCMY
     * @static
     * @param   {Number || Object} cyan     range: ?
     * @option  {Number}           magenta  range: ?
     * @option  {Number}           yellow   range: ?
     * @option  {Number}           alpha    range: [0-1]
     * @returns {Color}
     */
    Color.fromCMY = function fromCMY (cyan, magenta, yellow, alpha) {
      var
        c1 = cyan.cyan    || cyan.c || cyan,
        c2 = cyan.magenta || cyan.m || magenta,
        c3 = cyan.yellow  || cyan.y || yellow;
      return new Color({
        cmy: {
          cyan:    c1,
          magenta: c2,
          yellow:  c3
        },
        red:   1 - c1,
        green: 1 - c2,
        blue:  1 - c3,
        alpha: cyan.alpha || cyan.opacity || alpha,
        colorSpace: "cmy"
      });
    };

    /**
     * Create a new Color in the CMYK color space
     * @method  fromCMYK
     * @static
     * @param   {Number || Object} cyan     range: [0-100]
     * @option  {Number}           magenta  range: [0-100]
     * @option  {Number}           yellow   range: [0-100]
     * @option  {Number}           black    range: [0-100]
     * @option  {Number}           alpha    range: [0-1]
     * @returns {Color}
     */
    Color.fromCMYK = function fromCMYK (cyan, magenta, yellow, black, alpha) {
      throw new Error("Color.fromCMYK is not implemented yet.");
    };

    /**
     * Create a new Color in the HSL color space
     * @method  fromHSL
     * @alias   fromHSI
     * @alias   fromHLS (with argument reordering)
     * @static
     * @param   {Number || Object} hue         range: [0-360)
     * @option  {Number}           saturation  range: [0-100]
     * @option  {Number}           lightness   range: [0-100]
     * @option  {Number}           alpha       range: [0-1]
     * @returns {Color}
     */
    Color.fromHSL = function fromHSL (hue, saturation, lightness, alpha) {
      var
        c1 = hue.hue        || hue.h || hue,
        c2 = hue.saturation || hue.s || saturation,
        c3 = hue.lightness  || hue.l || hue.intensity || hue.i || lightness,
        red = 0, green = 0, blue = 0;

      while (0 > c1) {
        c1 += 360;
      }

      while (360 < c1) {
        c1 -= 360;
      }

      c2 /= 100;
      c3 /= 100;

      if (120 > c1) {
        red = 120 - c1;
        green = c1;
      } else if (240 > c1) {
        green = 240 - c1;
        blue = c1 - 120
      } else {
        red = c1 - 240;
        blue = 360 - c1;
      }

      red   = 2 * c2 * Math.min(1, red   / 60) + (1 - c2);
      green = 2 * c2 * Math.min(1, green / 60) + (1 - c2);
      blue  = 2 * c2 * Math.min(1, blue  / 60) + (1 - c2);

      if (0.5 > c3) {
        red   = c3 * red * 255;
        green = c3 * green * 255;
        blue  = c3 * blue * 255;
      } else {
        red   = ((1 - c3) * red   + 2 * c3 - 1) * 255;
        green = ((1 - c3) * green + 2 * c3 - 1) * 255;
        blue  = ((1 - c3) * blue  + 2 * c3 - 1) * 255;
      }

      return new Color({
        hsl: {
          hue:    c1,
          saturation: c2,
          lightness:  c3
        },
        red:   red,
        green: green,
        blue:  blue,
        alpha: hue.alpha || hue.opacity || alpha,
        colorSpace: "hsl"
      });
    };

    Color.fromHSI = Color.fromHSL;

    Color.fromHLS = function fromHLS (hue, lightness, saturation, alpha) {
      return Color.fromHSL(hue, saturation, lightness, alpha);
    };

    /**
     * Create a new Color in the HSV color space
     * @method  fromHSV
     * @static
     * @param   {Number || Object} hue         range: [0-360)
     * @option  {Number}           saturation  range: [0-100]
     * @option  {Number}           value       range: [0-100]
     * @option  {Number}           alpha       range: [0-1]
     * @returns {Color}
     */
    Color.fromHSV = function fromHSV (hue, saturation, value, alpha) {
      var
        c1 = hue.hue        || hue.h || hue,
        c2 = hue.saturation || hue.s || saturation,
        c3 = hue.value      || hue.v || hue.blackness || hue.v || value,
        red = 0, green = 0, blue = 0;

      while (0 > c1) {
        c1 += 360;
      }

      while (360 < c1) {
        c1 -= 360;
      }

      c2 /= 100;
      c3 /= 100;

      if (120 > c1) {
        red = 120 - c1;
        green = c1;
      } else if (240 > c1) {
        green = 240 - c1;
        blue = c1 - 120
      } else {
        red = c1 - 240;
        blue = 360 - c1;
      }

      red   = (1 - c2 + c2 * Math.min(1, red   / 60)) * c3 * 255;
      green = (1 - c2 + c2 * Math.min(1, green / 60)) * c3 * 255;
      blue  = (1 - c2 + c2 * Math.min(1, blue  / 60)) * c3 * 255;

      return new Color({
        hsv: {
          hue:    c1,
          saturation: c2,
          value:  c3
        },
        red:   red,
        green: green,
        blue:  blue,
        alpha: hue.alpha || hue.opacity || alpha,
        colorSpace: "hsv"
      });
    };

    Color.fromHSB = Color.fromHSV;

    /**
     * Create a new Color in the XYZ color space
     * @method  fromXYZ
     * @static
     * @param   {Number || Object} x
     * @option  {Number}           y
     * @option  {Number}           z
     * @option  {Number}           alpha  range: [0-1]
     * @returns {Color}
     */
    Color.fromXYZ = function fromXYZ (x, y, z, alpha) {
      var rgb = matrixMultiply([[x.x || x], [x.y || y], [x.z || z]], TRANSFORMATION_MATRICES.from.xyz.to.rgb);

      return new Color({
        xyz: {
          x: x.x || x,
          y: x.y || y,
          z: x.z || z
        },
        red: linearToS(rgb[0][0]),
        green: linearToS(rgb[1][0]),
        blue: linearToS(rgb[2][0]),
        alpha: x.alpha || x.opacity || alpha,
        colorSpace: "xyz"
      });
    };

    /**
     * Create a new Color in the Lab color space
     * @method  fromLab
     * @static
     * @param   {Number || Object} lightness  range: [0-100]
     * @option  {Number}           a          range: (-∞-∞)
     * @option  {Number}           b          range: (-∞-∞)
     * @option  {Number}           alpha      range: [0-1]
     * @returns {Color}
     */
    Color.fromLab = function fromLab (lightness, a, b, alpha) {
      var
        c1 = lightness.lightness || lightness.l || lightness.L || lightness,
        c2 = lightness.a || a,
        c3 = lightness.b || b,

        y = (c1 + 16) / 116,
        x = c2 / 500 + y,
        z = y - c3 / 200,

        rgb;

      x = ((0.008856 < Math.pow(x, 3)) ? Math.pow(x, 3) : ((x - 16 / 116) / 7.787)) * CIEXYZ_REFERENCE_X;
      y = ((0.008856 < Math.pow(y, 3)) ? Math.pow(y, 3) : ((y - 16 / 116) / 7.787)) * CIEXYZ_REFERENCE_Y;
      z = ((0.008856 < Math.pow(z, 3)) ? Math.pow(z, 3) : ((z - 16 / 116) / 7.787)) * CIEXYZ_REFERENCE_Z;

      rgb = matrixMultiply([[x], [y], [z]], TRANSFORMATION_MATRICES.from.xyz.to.rgb);

      return new Color({
        lab: {
          l: c1,
          a: c2,
          b: c3
        },
        red: linearToS(rgb[0][0]),
        green: linearToS(rgb[1][0]),
        blue: linearToS(rgb[2][0]),
        alpha: lightness.alpha || lightness.opacity || alpha,
        colorSpace: "lab"
      });
    };

    /**
     * Create a new Color in the LUV color space
     * @method  fromLUV
     * @static
     * @param   {Number || Object} lightness  range: [0-100]
     * @option  {Number}           u          range: [-134,220]
     * @option  {Number}           v          range: [-140,122]
     * @option  {Number}           alpha      range: [0-1]
     * @returns {Color}
     */
    Color.fromLUV = function fromLUV (lightness, u, v, alpha) {
      var
        c1 = lightness.lightness || lightness.l || lightness.L || lightness,
        c2 = lightness.u || lightness.U || u,
        c3 = lightness.v || lightness.V || v,

        refU = (4 * CIEXYZ_REFERENCE_X) / (CIEXYZ_REFERENCE_X + (15 * CIEXYZ_REFERENCE_Y) + (3 * CIEXYZ_REFERENCE_Z)),
        refV = (9 * CIEXYZ_REFERENCE_Y) / (CIEXYZ_REFERENCE_X + (15 * CIEXYZ_REFERENCE_Y) + (3 * CIEXYZ_REFERENCE_Z)),

        y = (c1 + 16) / 116,
        x, z, U, V, rgb;

      y = 100 * ((0.008856 < (y ^ 3)) ? (y ^ 3) : ((y - 16 / 116) / 7.787)) * CIEXYZ_REFERENCE_Y;

      U /= (13 * c1) + refU;
      V /= (13 * c1) + refV;

      x = - (9 * y * U) / ((U - 4) * V - U * V);
      z = (9 * y - (15 * V & y) - (V * x)) / (3 * V);

      rgb = matrixMultiply([[x], [y], [z]], TRANSFORMATION_MATRICES.from.xyz.to.rgb);

      return new Color({
        luv: {
          l: c1,
          u: c2,
          v: c3
        },
        red: linearToS(rgb[0][0]),
        green: linearToS(rgb[1][0]),
        blue: linearToS(rgb[2][0]),
        alpha: lightness.alpha || lightness.opacity || alpha,
        colorSpace: "luv"
      });
    };

    /**
     * Create a new Color in the UVW color space
     * @method  fromUVW
     * @static
     * @param   {Number || Object} u
     * @option  {Number}           v
     * @option  {Number}           w
     * @option  {Number}           alpha  range: [0-1]
     * @returns {Color}
     */
    Color.fromUVW = function fromUVW (u, v, w, alpha) {
      throw new Error("Color.fromUVW is not implemented yet.");
    };

    /**
     * Create a new Color in the Y'IQ color space
     * Y'IQ is the NTSC form of YUV/Y'DbDr
     * @method  fromYIQ
     * @static
     * @param   {Number || Object} luma        range: [0-255]
     * @option  {Number}           inPhase     range: [0-255]
     * @option  {Number}           quadrature  range: [0-255]
     * @option  {Number}           alpha       range: [0-1]
     * @returns {Color}
     */
    Color.fromYIQ = function fromYIQ (luma, inPhase, quadrature, alpha) {
      var
        c1 = luma.luma       || luma.y || luma.Y || luma.luminance || luma,
        c2 = luma.inPhase    || luma.i || luma.I || inPhase,
        c3 = luma.quadrature || luma.q || luma.Q || quadrature,
        rgb = matrixMultiply([[c1], [c2], [c3]], TRANSFORMATION_MATRICES.from.yiq.to.rgb);

      return new Color({
        yiq: {
          luma:       c1,
          inPhase:    c2,
          quadrature: c3
        },
        red: rgb[0][0],
        green: rgb[1][0],
        blue: rgb[2][0],
        alpha: luma.alpha || luma.opacity || alpha,
        colorSpace: "yiq"
      });
    };

    /**
     * Create a new Color in the Y'UV color space
     * Y'UV is the PAL form of YIQ/Y'DbDr
     * @method  fromYUV
     * @static
     * @param   {Number || Object} luma   range: [16-235]
     * @option  {Number}           u      range: [0-255]
     * @option  {Number}           v      range: [0-255]
     * @option  {Number}           alpha  range: [0-1]
     * @returns {Color}
     */
    Color.fromYUV = function fromYUV (luma, u, v, alpha) {
      var
        c1 = luma.luma || luma.y || luma.Y || luma.luminance || luma,
        c2 = luma.u    || luma.U || u,
        c3 = luma.v    || luma.V || v,
        rgb = matrixMultiply([[c1], [c2], [c3]], TRANSFORMATION_MATRICES.from.yuv.to.rgb);

      return new Color({
        yuv: {
          luma: c1,
          u:    c2,
          v:    c3
        },
        red: rgb[0][0],
        green: rgb[1][0],
        blue: rgb[2][0],
        alpha: luma.alpha || luma.opacity || alpha,
        colorSpace: "yuv"
      });
    };

    /**
     * Create a new Color in the Y'CbCr color space
     * Y'CbCr is a scaled version of YUV
     * @method  fromYCbCr
     * @alias   fromYCC
     * @alias   fromYPbPr
     * @alias   fromYPP
     * @static
     * @param   {Number || Object} luma
     * @option  {Number}           cb
     * @option  {Number}           cr
     * @option  {Number}           alpha  range: [0-1]
     * @returns {Color}
     */
    Color.fromYCbCr = function fromYCbCr (luma, cb, cr, alpha) {
      var
        c1 = luma.luma || luma.y  || luma.Y || luma.luminance || luma,
        c2 = luma.cb   || luma.Cb || cb,
        c3 = luma.cr   || luma.Cr || cr,
        rgb = matrixMultiply([[c1], [c2], [c3]], TRANSFORMATION_MATRICES.from.ycbcr.to.rgb);

      return new Color({
        ycbcr: {
          luma: c1,
          cb:   c2,
          cr:   c3
        },
        red: rgb[0][0],
        green: rgb[1][0],
        blue: rgb[2][0],
        alpha: luma.alpha || luma.opacity || alpha,
        colorSpace: "ycbcr"
      });
    };

    Color.fromYCC = Color.fromYCbCr;

    // Y'PbPr is the analog form of YCbCr
    Color.fromYPbPr = Color.fromYCbCr;

    Color.fromYPP = Color.fromYPbPr;
    
    /**
     * Create a new Color in the Y'DbDr color space
     * Y'DbDr is the SECAM variant of YIQ/YUV
     * @method  fromYDbDr
     * @alias   fromYDD
     * @static
     * @param   {Number || Object} luma
     * @option  {Number}           db
     * @option  {Number}           dr
     * @option  {Number}           alpha  range: [0-1]
     * @returns {Color}
     */
    Color.fromYDbDr = function fromYDbDr (luma, db, dr, alpha) {
      var
        c1 = luma.luma || luma.y  || luma.Y || luma.luminance || luma,
        c2 = luma.db   || luma.Db || db,
        c3 = luma.dr   || luma.Dr || dr,
        rgb = matrixMultiply([[c1], [c2], [c3]], TRANSFORMATION_MATRICES.from.ydbdr.to.rgb);

      return new Color({
        ydbdr: {
          luma: c1,
          db:   c2,
          dr:   c3
        },
        red: rgb[0][0],
        green: rgb[1][0],
        blue: rgb[2][0],
        alpha: luma.alpha || luma.opacity || alpha,
        colorSpace: "ydbdr"
      });
    };
    
    Color.fromYDD = Color.fromYDbDr;

    /**
     * Create a new Color in the xvYCC color space
     * xvYCC is an extra-gamut variant of Y'CbCr
     * @method  fromXvYCC
     * @static
     * @param   {Number || Object} luma
     * @option  {Number}           cb
     * @option  {Number}           cr
     * @option  {Number}           alpha  range: [0-1]
     * @returns {Color}
     */
    Color.fromXvYCC = function fromXvYCC (luma, cb, cr, alpha) {
      throw new Error("Color.fromXvYCC is not implemented yet.");
    };

    /**
     * Create a new Color from a named color
     * @method fromNamedColor
     * @static
     * @param name
     * @returns {Color}
     */
    Color.fromNamedColor = function fromNamedColor (name, list) {
      list = list || NAMED_COLORS;

      var color = list[name.replace(/[\s_]/g, "").toLowerCase()];

      return new Color(color);
    },

    Color.selfTest = function selfTest () {
      var
        tests = [
          ["rgb", "RGB", [ 255,  128, 0],   [255, 128,   0]],
          ["cmy", "CMY", [-254, -127, 1],   [255, 128,   0]],

          ["hsv", "HSV", [30, 100, 100],  [255, 128,   0]],
          ["hsv", "HSV", [60, 100,  50],  [128, 128,   0]],
          ["hsv", "HSV", [60,  50,  50],  [128, 128,  64]],

          ["xyz", "XYZ", [95,    100, 109], [255, 255, 255]],
          ["xyz", "XYZ", [49,   36.7, 4.5], [255, 128,   0]],
          ["xyz", "XYZ", [16.7, 20.1,   3], [128, 128,   0]],
          ["xyz", "XYZ", [17.5, 20.3, 7.9], [128, 128,  64]],
          ["xyz", "XYZ", [0,       0,   0], [0,     0,   0]],

          ["lab", "Lab", [67,      43,   74],  [255, 128,   0]],
          ["lab", "Lab", [51.8, -12.9, 56.7],  [128, 128,   0]],
          ["lab", "Lab", [52.2,  -9.6, 34.2],  [128, 128,  64]]

          // TODO:
          // cmyk
          // hsl
          // luv
          // uvw
          // yiq
          // yuv
          // ycc
          // ydd
          // xvycc
        ], i, c, passed = 0, failed = 0;

      for (i = 0; i < tests.length; i += 1) {
        c = Color["from" + tests[i][1]].apply(null, tests[i][2]);

        if (Math.round(c.colorSpaces.rgb.red)   !== tests[i][3][0] ||
            Math.round(c.colorSpaces.rgb.green) !== tests[i][3][1] ||
            Math.round(c.colorSpaces.rgb.blue)  !== tests[i][3][2]) {

          failed += 1;

          console.error("Color.from%s(%d, %d, %d) produced rgb(%d, %d, %d) instead of rgb(%d, %d, %d)", tests[i][1],
            tests[i][2][0], tests[i][2][1], tests[i][2][2],
            c.colorSpaces.rgb.red, c.colorSpaces.rgb.green, c.colorSpaces.rgb.blue,
            tests[i][3][0], tests[i][3][1], tests[i][3][2]);
        } else {
          passed += 1;
        }
      }

      console.log("Color Tests Complete: %d tests failed out of %d", failed, failed + passed);
    };

    /**
     * Returns a string representation of a Color in the specified color space, or in it's current color space
     * @method toString
     * @option colorSpace
     * @returns {String}
     */
    Color.prototype.toString = function toString (colorSpace) {
      var c = colorSpace || this.colorSpace, str, key;
      if ("hex" === c) {
        return "#" + (16 > Math.round(this.colorSpaces.rgb.red) ? "" : "0")   + Math.round(this.colorSpaces.rgb.red).toString(16)
                   + (16 > Math.round(this.colorSpaces.rgb.green) ? "" : "0") + Math.round(this.colorSpaces.rgb.green).toString(16)
                   + (16 > Math.round(this.colorSpaces.rgb.blue) ? "" : "0")  + Math.round(this.colorSpaces.rgb.blue).toString(16)
      } else {
        str = FORMAT_STRINGS[1 !== this.alpha ? (c + "a") : c] || FORMAT_STRINGS[c];
        if (!str) {
          return "";
        }

        for (key in this.colorSpaces[c]) {
          str = str.replace("{" + key + "}", Math.round(this.colorSpaces[c][key]));
        }

        return str;
      }
    };

    /**
     * Converts a Color to the RGB color space
     * @method toRGB
     * @alias toRGBA
     * @returns this
     */
    Color.prototype.toRGB = function toRGB () {
      return this;
    };

    Color.prototype.toRGBA = Color.prototype.toRGB;

    /**
     * Converts a Color to the CMYK color space
     * @method CMYK
     * @returns this
     */
    Color.prototype.toCMYK = function toCMYK () {
      // todo

      return this;
    };

    /**
     * Converts a Color to the HSL or HSV color space
     * @method toHSL
     * @alias toHSV
     * @returns this
     */
    Color.prototype.toHSL = function toHSL () {
      // todo

      return this;
    };

    Color.prototype.toHSV = Color.prototype.toHSL;

    /**
     * Converts a Color to the HSB color space
     * @method toHSB
     * @returns this
     */
    Color.prototype.toHSB = function toHSB () {
      // todo

      return this;
    };

    /**
     * Converts a Color to the XYZ color space
     * @method toXYZ
     * @returns this
     */
    Color.prototype.toXYZ = function toXYZ () {
      // todo

      return this;
    };

    /**
     * Converts a Color to the Lab color space
     * @method toLab
     * @returns this
     */
    Color.prototype.toLab = function toLab () {
      // todo

      return this;
    };

    /**
     * Converts a Color to the LUV color space
     * @method toLUV
     * @returns this
     */
    Color.prototype.toLUV = function toLUV () {
      // todo

      return this;
    };

    /**
     * Converts a Color to the UVW color space
     * @method toUVW
     * @returns this
     */
    Color.prototype.toUVW = function toUVW () {
      // todo

      return this;
    };

    /**
     * Converts a Color to the YIQ color space
     * @method toYIQ
     * @returns this
     */
    Color.prototype.toYIQ = function toYIQ () {
      // todo

      return this;
    };

    /**
     * Converts a Color to the YUV color space
     * @method toYUV
     * @returns this
     */
    Color.prototype.toYUV = function toYUV () {
      // todo

      return this;
    };

    /**
     * Converts a Color to the nearest named color
     * @method toNamedColor
     * @returns {Color}
     */
    Color.prototype.toNamedColor = function toNamedColor () {
      // todo

      return this;
    };
  }());
}());
