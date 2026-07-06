// Export layer info for every composition in the project.
function exportLayerInfoForComp(comp, projectName, dateStr, outputFolder) {
    var compName = comp.name.replace(/[\\\/:*?"<>|]/g, "_");
    var fileName = compName + "_layerinfo_" + dateStr + ".txt";
    var outputFile = new File(outputFolder + "/" + fileName);

    // Check if any layer is soloed
    var soloExists = false;
    for (var i = 1; i <= comp.numLayers; i++) {
        if (comp.layer(i).solo === true) {
            soloExists = true;
            break;
        }
    }

    // Build the output text
    var output = "";
    output += "Project Name: " + projectName + "\n";
    output += "Composition:  " + compName + "\n\n";

    for (var j = 1; j <= comp.numLayers; j++) {
        var layer = comp.layer(j);
        // If any solo exists, export only solo layers; otherwise export enabled layers
        if (soloExists) {
            if (!layer.solo) continue;
        } else {
            if (!layer.enabled) continue;
        }
        var layerName  = layer.name;
        var blendMode  = getLayerBlendMode(layer);
        var opacityVal = getLayerOpacity(layer);
        var comment    = layer.comment ? layer.comment : "";

        output += "Layer " + j + ": " + layerName + "\n";
        output += "  Blend Mode: " + blendMode + "\n";
        output += "  Opacity: " + opacityVal + "\n";
        output += "  Comment: " + comment + "\n\n";
    }

    if (outputFile.open("w")) {
        outputFile.write(output);
        outputFile.close();
    } else {
        alert("Could not open file: " + outputFile.fsName);
    }
}

// Helper functions to extract blend mode and opacity
function getLayerBlendMode(layer) {
    try {
        if (layer.blendingMode === undefined) return "N/A";
        return getBlendModeName(layer.blendingMode);
    } catch (e) {
        return "N/A";
    }
}

function getBlendModeName(mode) {
    switch (mode) {
        case BlendingMode.NORMAL:              return "Normal";
        case BlendingMode.ADD:                 return "Add";
        case BlendingMode.MULTIPLY:            return "Multiply";
        case BlendingMode.SCREEN:              return "Screen";
        case BlendingMode.OVERLAY:             return "Overlay";
        case BlendingMode.SOFT_LIGHT:          return "Soft Light";
        case BlendingMode.HARD_LIGHT:          return "Hard Light";
        case BlendingMode.COLOR_DODGE:         return "Color Dodge";
        case BlendingMode.COLOR_BURN:          return "Color Burn";
        case BlendingMode.DARKEN:              return "Darken";
        case BlendingMode.LIGHTEN:             return "Lighten";
        case BlendingMode.DIFFERENCE:          return "Difference";
        case BlendingMode.EXCLUSION:           return "Exclusion";
        case BlendingMode.HUE:                 return "Hue";
        case BlendingMode.SATURATION:          return "Saturation";
        case BlendingMode.COLOR:               return "Color";
        case BlendingMode.LUMINOSITY:          return "Luminosity";
        case BlendingMode.CLASSIC_COLOR_BURN:  return "Classic Color Burn";
        case BlendingMode.CLASSIC_COLOR_DODGE: return "Classic Color Dodge";
        case BlendingMode.CLASSIC_DIFFERENCE:  return "Classic Difference";
        case BlendingMode.CLASSIC_SCREEN:      return "Classic Screen";
        case BlendingMode.LINEAR_BURN:         return "Linear Burn";
        case BlendingMode.LINEAR_DODGE:        return "Linear Dodge";
        case BlendingMode.LINEAR_LIGHT:        return "Linear Light";
        case BlendingMode.VIVID_LIGHT:         return "Vivid Light";
        case BlendingMode.PIN_LIGHT:           return "Pin Light";
        case BlendingMode.HARD_MIX:            return "Hard Mix";
        case BlendingMode.DANCING_DISSOLVE:    return "Dancing Dissolve";
        case BlendingMode.SUBTRACT:            return "Subtract";
        case BlendingMode.DIVIDE:              return "Divide";
        case BlendingMode.DARKER_COLOR:        return "Darker Color";
        case BlendingMode.LIGHTER_COLOR:       return "Lighter Color";
        default:
            return "N/A";
    }
}

function getLayerOpacity(layer) {
    try {
        var transform = layer.property("ADBE Transform Group");
        if (transform) {
            var opacityProp = transform.property("ADBE Opacity");
            if (opacityProp) {
                return opacityProp.value;
            }
        }
        return "N/A";
    } catch(e) {
        return "N/A";
    }
}

// Main function to loop over all compositions in the project
(function exportAllCompsLayerInfo() {
    var project = app.project;
    if (!project) {
        alert("No project open.");
        return;
    }

    // Get project name and determine output folder.
    var projectFile = project.file;
    var projectName = "UnsavedProject";
    var outputFolder;
    if (projectFile) {
        projectName = projectFile.name.replace(/\.[^\.]+$/, "");
        outputFolder = projectFile.path;
    } else {
        // If unsaved, default to the Desktop.
        outputFolder = Folder.myDesktop.fsName;
    }

    // Create a date string in the format YYYYMMDD.
    var now = new Date();
    function zeroPad(num) {
        return (num < 10) ? "0" + num : num.toString();
    }
    var dateStr = now.getFullYear() + zeroPad(now.getMonth() + 1) + zeroPad(now.getDate());

    app.beginUndoGroup("Export Layer Info for All Comps");

    // Loop over all project items and process only those that are compositions.
    for (var i = 1; i <= project.numItems; i++) {
        var item = project.item(i);
        if (item instanceof CompItem) {
            exportLayerInfoForComp(item, projectName, dateStr, outputFolder);
        }
    }

    app.endUndoGroup();
    alert("Layer info exported for all compositions.");
})();
