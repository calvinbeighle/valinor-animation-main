# Valinor Animation

A beautiful animation featuring three SVG icons that transform from a vertical row into an equilateral triangle formation and then rotate while maintaining their orientation.

## Features

- **Three distinct SVG icons** with drop shadows and modern styling
- **Smooth transitions** from vertical row to triangle formation
- **Full 360-degree rotation** of the triangle while keeping icons upright
- **Interactive controls** to start and reset the animation
- **Beautiful gradient background** with modern UI elements

## How to Run

### Option 1: Using Python Server (Recommended)
```bash
python3 server.py
```
This will automatically:
- Start a local server on port 8000
- Open your default browser to `http://localhost:8000`

### Option 2: Using Python's Built-in Server
```bash
python3 -m http.server 8000
```
Then open your browser to `http://localhost:8000`

### Option 3: Direct File Opening
Simply open `index.html` in your web browser (though some features may be limited due to CORS policies).

## Animation Sequence

1. **Initial State**: Three icons arranged vertically in a column
2. **Triangle Formation**: Icons smoothly transition to form an equilateral triangle
3. **Rotation**: The entire triangle rotates 360 degrees while maintaining icon orientation
4. **Continuous Loop**: The rotation continues indefinitely

## Controls

- **Start Animation**: Begins the transformation sequence
- **Reset**: Returns to the initial vertical formation

## Technical Details

- Pure HTML, CSS, and JavaScript (no external dependencies)
- Responsive design that works on different screen sizes
- Smooth CSS transitions and animations
- Modern gradient background with glass-morphism effects

## Browser Compatibility

Works in all modern browsers that support:
- CSS Grid and Flexbox
- CSS Transitions and Animations
- SVG rendering
- ES6 JavaScript features 