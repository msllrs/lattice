"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
// Show the UI
figma.showUI(__html__, { width: 300, height: 400 });
// Handle messages from the UI
figma.ui.onmessage = (msg) => __awaiter(void 0, void 0, void 0, function* () {
    if (msg.type === 'create-table') {
        yield createTable(msg.rows, msg.columns);
    }
    else if (msg.type === 'cancel') {
        figma.closePlugin();
    }
});
/**
 * Creates a table with the specified number of rows and columns
 * using components from the published library
 */
function createTable(rows, columns) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            // Find instances on the page
            const instances = figma.currentPage.findAllWithCriteria({
                types: ['INSTANCE']
            });
            console.log(`Found ${instances.length} instances on the page`);
            // Try to find header and body cell instances
            let headerInstance = null;
            let bodyInstance = null;
            for (const instance of instances) {
                const name = instance.name.toLowerCase();
                if (name.includes("header")) {
                    headerInstance = instance;
                    console.log(`Found header instance: ${instance.name}`);
                }
                else if (name.includes("body")) {
                    bodyInstance = instance;
                    console.log(`Found body instance: ${instance.name}`);
                }
            }
            // If we didn't find specific instances, try to use any table cell instances
            if (!headerInstance || !bodyInstance) {
                for (const instance of instances) {
                    const name = instance.name.toLowerCase();
                    if (name.includes("table") && name.includes("cell")) {
                        if (!headerInstance) {
                            headerInstance = instance;
                            console.log(`Using ${instance.name} as header`);
                        }
                        else if (!bodyInstance) {
                            bodyInstance = instance;
                            console.log(`Using ${instance.name} as body`);
                        }
                    }
                }
            }
            // If we still don't have both, show an error
            if (!headerInstance || !bodyInstance) {
                figma.notify("🚨 Please add header and body cell instances on the page first.", { error: true });
                return;
            }
            // Create a frame for the table
            const table = figma.createFrame();
            table.name = "table";
            table.layoutMode = "VERTICAL";
            table.primaryAxisSizingMode = "AUTO";
            table.counterAxisSizingMode = "AUTO";
            table.itemSpacing = 0;
            table.fills = [];
            table.cornerRadius = 0;
            table.paddingLeft = 0;
            table.paddingRight = 0;
            table.paddingTop = 0;
            table.paddingBottom = 0;
            // Create header row
            const headerRow = figma.createFrame();
            headerRow.name = "header";
            headerRow.layoutMode = "HORIZONTAL";
            headerRow.primaryAxisSizingMode = "AUTO";
            headerRow.counterAxisSizingMode = "AUTO";
            headerRow.itemSpacing = 0;
            headerRow.fills = [];
            // Add header cells
            for (let i = 0; i < columns; i++) {
                const cell = headerInstance.clone();
                headerRow.appendChild(cell);
            }
            table.appendChild(headerRow);
            // Create data rows
            for (let i = 0; i < rows - 1; i++) {
                const dataRow = figma.createFrame();
                dataRow.name = `row ${i + 1}`;
                dataRow.layoutMode = "HORIZONTAL";
                dataRow.primaryAxisSizingMode = "AUTO";
                dataRow.counterAxisSizingMode = "AUTO";
                dataRow.itemSpacing = 0;
                dataRow.fills = [];
                // Add body cells
                for (let j = 0; j < columns; j++) {
                    const cell = bodyInstance.clone();
                    dataRow.appendChild(cell);
                }
                table.appendChild(dataRow);
            }
            // Center the table in the viewport
            const centerX = figma.viewport.center.x;
            const centerY = figma.viewport.center.y;
            table.x = centerX - (table.width / 2);
            table.y = centerY - (table.height / 2);
            // Select the table
            figma.currentPage.selection = [table];
            figma.viewport.scrollAndZoomIntoView([table]);
            figma.notify("Table created successfully!");
            figma.closePlugin();
        }
        catch (error) {
            console.error("Error creating table:", error);
            figma.notify(`Error creating table: ${error}`, { error: true });
        }
    });
}
