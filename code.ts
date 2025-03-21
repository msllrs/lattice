// Show the UI
figma.showUI(__html__, { width: 300, height: 500 });

// Handle messages from the UI
figma.ui.onmessage = async (msg) => {
  if (msg.type === 'create-table') {
    await createTable(msg.rows, msg.columns, msg.columnTypes);
  } else if (msg.type === 'cancel') {
    figma.closePlugin();
  }
};

/**
 * Creates a table with the specified number of rows and columns
 * using the table-cell component with appropriate variants
 */
async function createTable(rows: number, columns: number, columnTypes: string[]): Promise<void> {
  try {
    // Find table-cell instances on the page
    const instances = figma.currentPage.findAllWithCriteria({
      types: ['INSTANCE']
    });
    
    console.log(`Found ${instances.length} instances on the page`);
    
    // Try to find a table-cell instance
    let tableCellInstance: InstanceNode | null = null;
    
    for (const instance of instances) {
      if (instance.name.toLowerCase() === "table-cell") {
        tableCellInstance = instance;
        console.log(`Found table-cell instance: ${instance.name}`);
        break;
      }
    }
    
    // If we didn't find a specific instance, show an error
    if (!tableCellInstance) {
      figma.notify("🚨 Please add a table-cell instance on the page first.", { error: true });
      return;
    }
    
    // Check if the instance has the variant property
    if (!tableCellInstance.componentProperties || 
        !tableCellInstance.componentProperties["variant"]) {
      figma.notify("🚨 The table-cell instance doesn't have the required 'variant' property.", { error: true });
      return;
    }
    
    // Create a frame for the table
    const table = figma.createFrame();
    table.name = "table";
    table.layoutMode = "VERTICAL";
    table.primaryAxisSizingMode = "AUTO";
    table.counterAxisSizingMode = "FIXED";
    table.itemSpacing = 0;
    table.fills = [];
    table.cornerRadius = 0;
    table.paddingLeft = 0;
    table.paddingRight = 0;
    table.paddingTop = 0;
    table.paddingBottom = 0;
    
    // Set a reasonable width for the table
    table.resize(800, table.height);
    
    // Create header row
    const headerRow = figma.createFrame();
    headerRow.name = "header";
    headerRow.layoutMode = "HORIZONTAL";
    headerRow.primaryAxisSizingMode = "FIXED";
    headerRow.counterAxisSizingMode = "AUTO";
    headerRow.itemSpacing = 0;
    headerRow.fills = [];
    headerRow.resize(table.width, headerRow.height);
    
    // Add header cells based on column types
    for (let i = 0; i < columns; i++) {
      const cell = tableCellInstance.clone();
      const columnType = i < columnTypes.length ? columnTypes[i] : "header";
      
      // Set the variant based on column type
      cell.setProperties({
        "variant": columnType
      });
      
      // Rename the cell based on its type
      if (columnType === "checkbox") {
        cell.name = "check";
        
        // Make checkbox layer visible
        makeSpecificLayerVisible(cell, "checkbox");
      } else if (columnType === "icon") {
        cell.name = "icon";
        
        // Make iconWrapper layer visible
        makeSpecificLayerVisible(cell, "iconWrapper");
        
        // Set the icon to more-horizontal
        setIconToMoreHorizontal(cell);
      } else {
        cell.name = "cell"; // For header cells in the header row
      }
      
      // Set layout properties based on column type
      if (columnType === "checkbox" || columnType === "icon") {
        // Fixed width for checkbox and icon cells
        cell.layoutAlign = "INHERIT";
        cell.layoutGrow = 0;
      } else {
        // Fill for header and body cells
        cell.layoutAlign = "STRETCH";
        cell.layoutGrow = 1;
      }
      
      headerRow.appendChild(cell);
    }
    
    table.appendChild(headerRow);
    
    // Create data rows
    for (let i = 0; i < rows - 1; i++) {
      const dataRow = figma.createFrame();
      dataRow.name = `row ${i + 1}`;
      dataRow.layoutMode = "HORIZONTAL";
      dataRow.primaryAxisSizingMode = "FIXED";
      dataRow.counterAxisSizingMode = "AUTO";
      dataRow.itemSpacing = 0;
      dataRow.fills = [];
      dataRow.resize(table.width, dataRow.height);
      
      // Add body cells based on column types
      for (let j = 0; j < columns; j++) {
        const cell = tableCellInstance.clone();
        let cellType = "body";
        
        // Match the column type
        if (j < columnTypes.length) {
          // For checkbox and icon columns, use the same variant in the body
          if (columnTypes[j] === "checkbox" || columnTypes[j] === "icon") {
            cellType = columnTypes[j];
          }
        }
        
        // Set the variant
        cell.setProperties({
          "variant": cellType
        });
        
        // Rename the cell based on its type
        if (cellType === "checkbox") {
          cell.name = "check";
        } else if (cellType === "icon") {
          cell.name = "icon";
        } else {
          cell.name = "cell"; // For body cells
        }
        
        // Set layout properties based on cell type
        if (cellType === "checkbox" || cellType === "icon") {
          // Fixed width for checkbox and icon cells
          cell.layoutAlign = "INHERIT";
          cell.layoutGrow = 0;
        } else {
          // Fill for header and body cells
          cell.layoutAlign = "STRETCH";
          cell.layoutGrow = 1;
        }
        
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
  } catch (error) {
    console.error("Error creating table:", error);
    figma.notify(`Error creating table: ${error}`, { error: true });
  }
}

/**
 * Makes a specific layer visible by name within a node
 */
function makeSpecificLayerVisible(node: SceneNode, layerName: string): void {
  if ('children' in node) {
    for (const child of node.children) {
      // Make the specific layer visible if it matches the name
      if (child.name === layerName) {
        child.visible = true;
      }
      
      // Continue searching in children
      if ('children' in child) {
        makeSpecificLayerVisible(child, layerName);
      }
    }
  }
}

/**
 * Sets the icon to more-horizontal in the button-icon component
 */
function setIconToMoreHorizontal(node: SceneNode): void {
  if ('children' in node) {
    for (const child of node.children) {
      // Find the iconWrapper
      if (child.name === "iconWrapper") {
        // Navigate to button-icon
        if ('children' in child) {
          for (const buttonIcon of child.children) {
            if (buttonIcon.name === "button-icon" && buttonIcon.type === "INSTANCE") {
              // Check if the button-icon has an "icon" property
              if (buttonIcon.componentProperties && 'icon' in buttonIcon.componentProperties) {
                // Set the icon property to more-horizontal
                buttonIcon.setProperties({
                  "icon": "more-horizontal"
                });
                return; // Exit after setting the property
              }
            }
          }
        }
      }
      
      // Continue searching in children
      if ('children' in child) {
        setIconToMoreHorizontal(child);
      }
    }
  }
}
