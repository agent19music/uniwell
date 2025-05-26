# UniWell Data Visualization

This visualization tool provides a visual representation of the UniWell application's architecture using different types of diagrams:

1. **Entity Relationship Diagram** - Shows the database schema and relationships between different entities
2. **Chen-style ER Diagram** - Traditional entity-relationship diagram with diamond relationships and oval attributes
3. **Data Flow Diagram** - Illustrates how data flows through the application
4. **Context Flow Diagram** - Depicts the relationships between different React contexts and features
5. **UML Use Case Diagrams** - Visualizes different user interactions and system functionality

## How to Use

1. Open `index.html` in a web browser
2. Use the tab buttons at the top to switch between different diagram types
3. For UML Use Case diagrams, select a specific domain from the dropdown menu:
   - Authentication
   - Wellness Tracking
   - Academic Management
   - Community Interaction
   - Therapy Management
4. You can zoom in/out and pan around each diagram as needed

## Technical Details

- The visualizations are created using [Mermaid.js](https://mermaid.js.org/)
- The Chen-style ER diagram uses Mermaid's flowchart capabilities to simulate traditional ER notation
- The diagrams are rendered client-side, so no server is required
- All data is statically defined in the JavaScript, making it easy to update

## Updating the Diagrams

If you need to update the diagrams:

1. Edit the `script.js` file
2. Modify the diagram definitions in the respective render functions:
   - `renderERDiagram()` for the Entity Relationship diagram
   - `renderChenERDiagram()` in the chen-style.js file for the Chen-style ER diagram
   - `renderDataFlowDiagram()` for the Data Flow diagram
   - `renderContextFlowDiagram()` for the Context Flow diagram
   - `renderAuthUseCases()`, `renderWellnessUseCases()`, etc. for the UML Use Case diagrams

## Adding to Documentation

These diagrams are designed to be small enough to fit in a single documentation page. You can:

1. Take screenshots of each diagram
2. Copy the HTML/CSS/JS to embed in your documentation
3. Use the Mermaid code directly in Markdown-based documentation that supports Mermaid 