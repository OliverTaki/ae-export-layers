(function () {
    // Global array to store mapping between exported layers and their batch numbers.
    var exportedLayerMapping = [];
    
    // Validate project and active composition.
    var proj = app.project;
    if (!proj || !proj.file) {
        alert("Please save your project first.");
        return;
    }
    var comp = proj.activeItem;
    if (!comp || !(comp instanceof CompItem)) {
        alert("Select a composition first.");
        return;
    }
    
    // Helper: Pad number with zero.
    function zeroPad(num) {
        return (num < 10) ? "0" + num : num.toString();
    }
    
    // Compute current date (mmdd) and clean composition name.
    var now = new Date();
    var dateStr = zeroPad(now.getMonth() + 1) + zeroPad(now.getDate());
    var compName = comp.name.replace(/[\\\/:*?"<>|]/g, "_");
    
    // Create a parent folder named: compName_mmdd in the project folder (or on Desktop if unsaved).
    var parentFolderName = compName + "_" + dateStr;
    var parentFolder;
    if (proj.file) {
        parentFolder = new Folder(proj.file.path + "/" + parentFolderName);
    } else {
        parentFolder = new Folder("~/Desktop/" + parentFolderName);
    }
    if (!parentFolder.exists) {
        parentFolder.create();
    }
    
    //=========================================================================
    // Function: exportVisibleLayers
    // Exports each visible (non-guide) layer into its own batch folder inside the parent folder.
    // Records the layer index and batch number in exportedLayerMapping.
    //=========================================================================
    function exportVisibleLayers() {
        // Save original Overwrite Output preference and force auto-overwrite.
        var originalOverwrite = null;
        try {
            originalOverwrite = app.preferences.getPrefAsLong("Main Pref Section", "Overwrite Output");
            app.preferences.savePrefAsLong("Main Pref Section", "Overwrite Output", 1);
        } catch (e) { }
        
        var layers = comp.layers;
        var renderQueue = proj.renderQueue;
        var batchNumber = 1;
    
        app.beginUndoGroup("Export Visible Layers");
    
        for (var i = 1; i <= layers.length; i++) {
            var layer = layers[i];
    
            // Skip hidden or guide layers.
            if (!layer.enabled || layer.guideLayer) continue;
    
            // Record this layer’s index and batch number.
            exportedLayerMapping.push({ layerIndex: i, batch: batchNumber });
    
            // Create a subfolder for this batch inside the parent folder.
            var batchFolderName = compName + "_batch" + ("00" + batchNumber).slice(-2);
            var batchFolder = new Folder(parentFolder.fsName + "/" + batchFolderName);
            if (!batchFolder.exists) {
                batchFolder.create();
            }
    
            // Set the solo property for each layer only if enabled.
            for (var j = 1; j <= layers.length; j++) {
                if (layers[j].enabled) {
                    layers[j].solo = (j === i);
                }
            }
    
            // Add the composition to the render queue.
            var renderItem = renderQueue.items.add(comp);
    
            try {
                var outputModule = renderItem.outputModule(1);
                outputModule.applyTemplate("batch_export");
    
                // Get the extension from the current template setting.
                var outputFilePathString = outputModule.file.fsName;
                var outputFileExt = outputFilePathString.substring(outputFilePathString.lastIndexOf("."));
    
                // Build the output file name with a 4-digit frame token inserted before the extension.
                // For example: MyComp_batch01_[####].exr renders as MyComp_batch01_0001.exr
                var outputFileName = compName + "_batch" + ("00" + batchNumber).slice(-2) + "_[####]" + outputFileExt;
                var outputFilePath = new File(batchFolder.fsName + "/" + outputFileName);
                outputModule.file = outputFilePath;
    
                batchNumber++; // Increment for the next valid layer.
    
            } catch (e) {
                alert("Error: Could not find output module template 'batch_export'. Please create it in AE.");
                return;
            }
    
            // Render the current item and remove it from the render queue.
            app.project.renderQueue.render();
            renderItem.remove();
        }
    
        // Reset solo settings for all layers.
        for (var k = 1; k <= layers.length; k++) {
            if (layers[k].enabled) layers[k].solo = false;
        }
    
        app.endUndoGroup();
    
        // Restore the original Overwrite Output preference if applicable.
        try {
            if (originalOverwrite !== null) {
                app.preferences.savePrefAsLong("Main Pref Section", "Overwrite Output", originalOverwrite);
            }
        } catch (e) { }
    }
    
    //=========================================================================
    // Function: exportCompNameAndDate
    // Creates a text file with exported layer information.
    // The file is saved in the parent folder and includes for each exported layer:
    // "Batch XX - layer YY" (first line), then the layer name and its properties.
    //=========================================================================
    function exportCompNameAndDate() {
        var fileName = compName + "_layerinfo_" + dateStr + ".txt";
        var outputFile = new File(parentFolder.fsName + "/" + fileName);
    
        // Helper: Convert blend mode to string.
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
    
        function getLayerBlendMode(layer) {
            try {
                if (layer.blendingMode === undefined) {
                    return "N/A";
                }
                return getBlendModeName(layer.blendingMode);
            } catch (e) {
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
            } catch (e) {
                return "N/A";
            }
        }
    
        function getLayerComment(layer) {
            return layer.comment ? layer.comment : "";
        }
    
        // Assemble the text output using exportedLayerMapping.
        var output = "";
        output += "Composition: " + compName + "\n\n";
    
        if (exportedLayerMapping.length === 0) {
            output += "No layers were exported.\n";
        } else {
            for (var i = 0; i < exportedLayerMapping.length; i++) {
                var mapping = exportedLayerMapping[i];
                var layer = comp.layer(mapping.layerIndex);
                // First line: "Batch XX - layer YY"
                output += "Batch " + ("00" + mapping.batch).slice(-2) + " - layer " + ("00" + mapping.layerIndex).slice(-2) + "\n";
                // Next line: layer name and properties.
                output += layer.name + "\n";
                output += "  Blend Mode: " + getLayerBlendMode(layer) + "\n";
                output += "  Opacity: " + getLayerOpacity(layer) + "\n";
                output += "  Comment: " + getLayerComment(layer) + "\n\n";
            }
        }
    
        // Write the text file.
        if (outputFile.open("w")) {
            outputFile.write(output);
            outputFile.close();
            alert("Layer info exported to:\n" + outputFile.fsName);
        } else {
            alert("Could not open the file for writing.");
        }
    }
    
    // Execute the functions in sequence.
    exportVisibleLayers();
    exportCompNameAndDate();
})();
