var util = require("util"),
    fs   = require("fs"),
    _    = require("underscore");


// Load emojis
var emojis = require("../../../emoji_strategy.json");

// Complement all mapping
var nameToCodepoints = [];
_(emojis).each(function(data, unicode) {
    // Get codepoints
    var codepoints = _(unicode.split("-")).map(function (code) {
        return "0x" + code;
    });

    nameToCodepoints.push({name:data.shortname.slice(1, -1), code:codepoints});

    // append alternates
    _(data.shortname_alternates).each(function(alt) {
        nameToCodepoints.push({name:alt.slice(1, -1), code:codepoints});
    });
});

// Generate Java mapping
var mapping = _(nameToCodepoints).sortBy('name').map(function(data) {
    var codepoints = data.code;

    return '_shortNameToUnicode.put("' + data.name + '", new String(new int[] {' + codepoints.join(', ') + '}, 0, ' + codepoints.length + '));';
});

// split each 100 lines
var funcs = [];
var buf = [];
_(mapping).each(function(line) {
    if (buf.length==0) {
      buf.push("private static void _init" + (funcs.length+1) + "() {");
    }
    buf.push("    " + line);
    if (buf.length > 100) {
        buf.push("}");
        buf.push("");
        buf.push("");
        funcs.push(buf);
        buf = [];
    }
});
if (buf.length >= 1) {
    buf.push("}");
    buf.push("");
    funcs.push(buf);
    buf = [];
}

var methods_mapping = _(funcs).map(function(fun) {
    return fun.join("\n    ");
}).join("");
var static_mapping = _(funcs).map(function(fun, i) {
    return "        _init" + (i+1) + "();";
}).join("\n");

//mapping.join("\n        ");
//exit;





// Generate Java class from template
var input  = fs.readFileSync("./Emojione.java");
var output = _(input.toString()).template()({ methods_mapping: methods_mapping, static_mapping: static_mapping });

// Write Java class to file
var output_path = "../com/emojione/Emojione.java";
fs.writeFileSync(output_path, output);

console.log("Generated " + output_path);
