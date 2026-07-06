(function exportVisibleLayers() {
    var proj = app.project;
    if (!proj || !proj.file) {
        alert("Please save your project first.");
        return;
    }

    var comp = app.project.activeItem;
    if (!comp || !(comp instanceof CompItem)) {
        alert("Select a composition first.");
        return;
    }

    // Save original Overwrite Output preference and force auto-overwrite,
    // wrapped in try/catch in case the preference is not accessible.
    var originalOverwrite = null;
    try {
        originalOverwrite = app.preferences.getPrefAsLong("Main Pref Section", "Overwrite Output");
        app.preferences.savePrefAsLong("Main Pref Section", "Overwrite Output", 1);
    } catch (e) {
        // If retrieving or setting the preference fails, ignore and continue.
    }

    var layers = comp.layers;
    var renderQueue = app.project.renderQueue;
    var batchNumber = 1;
    var projectPath = proj.file.path;
    var batchFolder;

    app.beginUndoGroup("Export Visible Layers");

    for (var i = 1; i <= layers.length; i++) {
        var layer = layers[i];

        // Skip hidden or guide layers
        if (!layer.enabled || layer.guideLayer) continue;

        // Create a subfolder for each batch (e.g. compName_batch01, compName_batch02, ...)
        var batchFolderName = comp.name + "_batch" + ("00" + batchNumber).slice(-2);
        batchFolder = new Folder(projectPath + "/" + batchFolderName);
        if (!batchFolder.exists) {
            batchFolder.create();
        }

        // Set solo so only the current layer is visible
        for (var j = 1; j <= layers.length; j++) {
            layers[j].solo = (j === i);
        }

        // Add comp to the render queue
        var renderItem = renderQueue.items.add(comp);

        try {
            var outputModule = renderItem.outputModule(1);
            outputModule.applyTemplate("batch_export");

            // Get the extension from the current template setting
            var outputFilePathString = outputModule.file.fsName;
            var outputFileExt = outputFilePathString.substring(outputFilePathString.lastIndexOf("."));

            // Build the output file name inserting a 4-digit frame token before the extension.
            // Example: compName_batch01_[####].exr -> renders as compName_batch01_0001.exr
            var outputFileName = comp.name + "_batch" + ("00" + batchNumber).slice(-2) + "_[####]" + outputFileExt;
            var outputFilePath = new File(batchFolder.fsName + "/" + outputFileName);
            outputModule.file = outputFilePath;

            batchNumber++; // Increment for the next valid layer

        } catch (e) {
            alert("Error: Could not find output module template 'batch_export'. Please create it in AE.");
            return;
        }

        // Render the current item and then remove it from the render queue to avoid duplicate rendering.
        app.project.renderQueue.render();
        renderItem.remove();
    }

    // Reset solo settings for all layers
    for (var k = 1; k <= layers.length; k++) {
        layers[k].solo = false;
    }

    app.endUndoGroup();

    // Restore the original Overwrite Output preference if applicable
    try {
        if (originalOverwrite !== null) {
            app.preferences.savePrefAsLong("Main Pref Section", "Overwrite Output", originalOverwrite);
        }
    } catch (e) {
        // Ignore if restoring fails.
    }
})();
