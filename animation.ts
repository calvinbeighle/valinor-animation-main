// Animation state types
type AnimationState = 'hexagon' | 'rotating';
type ComputerState = 'idle' | 'detecting' | 'running' | 'completed';

interface IconElement {
    element: HTMLElement;
    id: string;
}

class ValinorAnimation {
    private container: HTMLElement;
    private hexagonGroup: HTMLElement;
    private statusElement: HTMLElement;
    private icons: IconElement[];
    private animationState: AnimationState = 'hexagon';
    private isAnimating: boolean = false;
    private animationId: number | null = null;
    private startTime: number = 0;
    private radius: number = 130; // Distance from center to hexagon vertices
    private centerX: number = 500; // Center X (moved further right)
    private centerY: number = 300; // Center Y (vertically centered with original linear positions)
    private contentBoundaries: Array<{x: number, y: number, width: number, height: number}> = [];
    private ghostIcons: HTMLElement[] = []; // Store ghost elements

    // Web animation properties
    private webCanvas: HTMLCanvasElement;
    private webCtx: CanvasRenderingContext2D;
    private webLines: Array<{start: {x: number, y: number}, end: {x: number, y: number}, progress: number}> = [];
    private webAnimationId: number | null = null;
    private webStartTime: number = 0;
    private isWebAnimating: boolean = false;
    private completedWebLines: Set<number> = new Set(); // Track which lines have completed

    // Aura animation properties
    private isAuraAnimating: boolean = false;
    private auraAnimationId: number | null = null;
    private auraStartTime: number = 0;

    // Computer animation properties
    private computerContent: HTMLElement;
    private computerState: ComputerState = 'idle';
    private computerTimer: number | null = null;
    private currentIconIndex: number = 0; // Track which icon is being processed
    private iconsProcessed: number = 0; // Track how many icons have been processed
    private progressBarProgress: number = 0;
    private progressBarInterval: number | null = null;

    constructor() {
        this.container = document.getElementById('container') as HTMLElement;
        this.hexagonGroup = document.getElementById('hexagonGroup') as HTMLElement;
        this.statusElement = document.getElementById('status') as HTMLElement;
        this.computerContent = document.getElementById('computerContent') as HTMLElement;

        this.webCanvas = document.getElementById('webCanvas') as HTMLCanvasElement;
        this.webCtx = this.webCanvas.getContext('2d') as CanvasRenderingContext2D;
        this.icons = this.initializeIcons();
        this.setupEventListeners();
        this.initializeHexagonFormation();
        this.initializeWebCanvas();
    }

    private initializeIcons(): IconElement[] {
        const iconElements = document.querySelectorAll('.icon');
        return Array.from(iconElements).map((element, index) => ({
            element: element as HTMLElement,
            id: `icon${index + 1}`
        }));
    }

    private setupEventListeners(): void {
        const startButton = document.getElementById('startBtn');
        const resetButton = document.getElementById('resetBtn');

        if (startButton) {
            startButton.addEventListener('click', () => this.startAnimation());
        }

        if (resetButton) {
            resetButton.addEventListener('click', () => this.resetAnimation());
        }
    }

    private initializeWebCanvas(): void {
        // Set canvas size to match container with higher resolution for crisp lines
        this.webCanvas.width = 1200; // Higher resolution for crisp lines
        this.webCanvas.height = 1200;
        
        // Set canvas style to match container
        this.webCanvas.style.width = '100%';
        this.webCanvas.style.height = '100%';
        
        // Enable crisp line rendering
        this.webCtx.imageSmoothingEnabled = false;
    }

    private initializeHexagonFormation(): void {
        // Clear any existing ghost icons
        this.ghostIcons.forEach(ghost => ghost.remove());
        this.ghostIcons = [];
        
        // Start with 2-column linear configuration to the left of the hexagon
        this.icons.forEach((icon, index) => {
            // Calculate 2-column, 3-row layout positions (positioned to the left of the hexagon)
            const column = index % 2;
            const row = Math.floor(index / 2);
            const startX = this.centerX - 450 + (column * 150); // 450px to the left of center (to prevent overlap with hexagon), 150px spacing between columns
            const startY = this.centerY - 150 + (row * 150); // 150px spacing between rows
            
            // Add visual indicator for content boundaries first
            this.addContentBoundaryIndicator(icon.element, index);
            
            // Get the visual center offset for this specific icon based on its SVG content
            const visualCenterOffset = this.getVisualCenterOffset(index);
            
            // Position the icon so its blue box center is at the grid point
            icon.element.style.transform = `translate(${startX - visualCenterOffset.x}px, ${startY - visualCenterOffset.y}px)`;
            
            // Create ghost element
            this.createGhostIcon(icon.element, startX - visualCenterOffset.x, startY - visualCenterOffset.y, index);
        });
        
        // Add linear formation class
        this.container.classList.add('linear-formation');
    }

    private transitionToHexagon(): void {
        // Transition icons to hexagon positions
        this.icons.forEach((icon, index) => {
            const angleOffset = ((index * 60) + 90) * (Math.PI / 180);
            const orbitalX = this.centerX + this.radius * Math.cos(angleOffset);
            const orbitalY = this.centerY + this.radius * Math.sin(angleOffset);
            
            // Get the visual center offset for this specific icon based on its SVG content
            const visualCenterOffset = this.getVisualCenterOffset(index);
            
            // Position the icon so its visual center is at the hexagon point
            icon.element.style.transform = `translate(${orbitalX - visualCenterOffset.x}px, ${orbitalY - visualCenterOffset.y}px)`;
        });
        
        // Switch to hexagon formation class
        this.container.classList.remove('linear-formation');
        this.container.classList.add('hexagon-formation');
    }

    private getVisualCenterOffset(iconIndex: number): { x: number, y: number } {
        // Use the centers of the blue bounding boxes as hexagon corner points
        if (this.contentBoundaries[iconIndex]) {
            const boundary = this.contentBoundaries[iconIndex];
            return {
                x: boundary.x, // This is already the center X
                y: boundary.y  // This is already the center Y
            };
        }
        
        // Fallback to default center if boundaries not calculated yet
        return { x: 85.5, y: 85.5 };
    }

    private createGhostIcon(originalIcon: HTMLElement, x: number, y: number, index: number): void {
        // Clone the original icon
        const ghost = originalIcon.cloneNode(true) as HTMLElement;
        ghost.className = 'icon ghost-icon';
        ghost.style.position = 'absolute';
        ghost.style.left = '0';
        ghost.style.top = '0';
        ghost.style.transform = `translate(${x}px, ${y}px)`;
        ghost.style.opacity = '0.3';
        ghost.style.filter = 'grayscale(100%) brightness(0.7)';
        ghost.style.pointerEvents = 'none';
        ghost.style.zIndex = '1';
        

        
        // Add to container and store reference
        this.container.appendChild(ghost);
        this.ghostIcons[index] = ghost;
    }

    private addContentBoundaryIndicator(iconElement: HTMLElement, iconIndex: number): void {
        // Calculate content boundaries for centering without visual indicators
        const svg = iconElement.querySelector('svg');
        if (svg) {
            const mainGroup = svg.querySelector('g');
            let bbox = { x: 0, y: 0, width: 0, height: 0 };
            
            if (mainGroup) {
                const allPaths = mainGroup.querySelectorAll('path') as NodeListOf<SVGPathElement>;
                if (allPaths.length > 0) {
                    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
                    
                    allPaths.forEach(path => {
                        const pathBBox = path.getBBox();
                        minX = Math.min(minX, pathBBox.x);
                        minY = Math.min(minY, pathBBox.y);
                        maxX = Math.max(maxX, pathBBox.x + pathBBox.width);
                        maxY = Math.max(maxY, pathBBox.y + pathBBox.height);
                    });
                    
                    bbox = {
                        x: minX,
                        y: minY,
                        width: maxX - minX,
                        height: maxY - minY
                    };
                } else {
                    bbox = (mainGroup as SVGGElement).getBBox();
                }
            }
            
            const transform = mainGroup?.getAttribute('transform');
            let scale = 1;
            let translateX = 0;
            let translateY = 0;
            
            if (transform) {
                const scaleMatch = transform.match(/scale\(([^)]+)\)/);
                const translateMatch = transform.match(/translate\(([^)]+)\)/);
                
                if (scaleMatch) {
                    scale = parseFloat(scaleMatch[1]);
                }
                if (translateMatch) {
                    const coords = translateMatch[1].split(',').map(s => parseFloat(s.trim()));
                    translateX = coords[0] || 0;
                    translateY = coords[1] || 0;
                }
            }
            
            const svgScale = 171 / 300;
            const visualX = (bbox.x * scale + translateX) * svgScale;
            const visualY = (bbox.y * scale + translateY) * svgScale;
            const visualWidth = bbox.width * scale * svgScale;
            const visualHeight = bbox.height * scale * svgScale;
            
            // Store the content boundaries for centering calculations
            this.contentBoundaries[iconIndex] = {
                x: visualX + visualWidth/2,
                y: visualY + visualHeight/2,
                width: visualWidth,
                height: visualHeight
            };
        }
    }

    public updateStatus(message: string): void {
        this.statusElement.textContent = message;
    }

    private animateOrbit = (currentTime: number): void => {
        if (!this.startTime) this.startTime = currentTime;
        
        const elapsed = currentTime - this.startTime;
        const duration = 7000; // 7 seconds total (even slower max speed)
        const progress = Math.min(elapsed / duration, 1); // Clamp to 1 to stop after completion
        
        // Easing function: very slow start, gentle middle, slow end
        const easedProgress = this.easeInOutQuint(progress);
        
        // Calculate positions for each icon in circular orbit
        this.icons.forEach((icon, index) => {
            // Start with upright hexagon: rotate by 90° (π/2) so hexagon points up
            const angleOffset = ((index * 60) + 90) * (Math.PI / 180); // 60 degrees apart, rotated 90°
            const currentAngle = (easedProgress * 3 * 2 * Math.PI) + angleOffset; // 3 full rotations with easing (slower max speed)
            
            // Calculate orbital position centered on container center
            const orbitalX = this.centerX + this.radius * Math.cos(currentAngle);
            const orbitalY = this.centerY + this.radius * Math.sin(currentAngle);
            
            // Get the visual center offset for this specific icon based on its SVG content
            const visualCenterOffset = this.getVisualCenterOffset(index);
            
            // Apply transform to position icon so its visual center is at the orbital point
            icon.element.style.transform = `translate(${orbitalX - visualCenterOffset.x}px, ${orbitalY - visualCenterOffset.y}px)`;
        });
        
        // Stop animation after 3 rotations
        if (progress >= 1) {
            this.updateStatus('Animation complete!');
            this.animationState = 'hexagon';
            this.isAnimating = false;
            
            // Start web animation after completion
            this.startWebAnimation();
            
            return;
        }
        
        this.animationId = requestAnimationFrame(this.animateOrbit);
    };
    
    // Easing function: starts very slow, gentle acceleration in middle, slows at end
    private easeInOutQuint(t: number): number {
        return t < 0.5 ? 16 * t * t * t * t * t : 1 - Math.pow(-2 * t + 2, 5) / 2;
    }

    public startAnimation(): void {
        if (this.isAnimating) return;

        if (this.animationState === 'hexagon') {
            this.isAnimating = true;
            this.updateStatus('Transitioning to hexagon formation...');
            
            // First transition to hexagon formation
            this.transitionToHexagon();
            
            // After transition completes, start orbital animation
            setTimeout(() => {
                this.updateStatus('Starting orbital motion...');
                this.container.classList.add('rotating');
                
                this.startTime = 0;
                this.animationId = requestAnimationFrame(this.animateOrbit);
                this.animationState = 'rotating';
                this.isAnimating = false;
            }, 1000); // Wait for 1 second for the transition to complete
        }
    }

    public resetAnimation(): void {
        this.updateStatus('Resetting animation...');
        
        // Stop the animation
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
            this.animationId = null;
        }
        
        // Stop web animation
        if (this.webAnimationId) {
            cancelAnimationFrame(this.webAnimationId);
            this.webAnimationId = null;
        }
        this.isWebAnimating = false;
        this.clearWebCanvas();
        
        // Stop aura animation
        if (this.auraAnimationId) {
            cancelAnimationFrame(this.auraAnimationId);
            this.auraAnimationId = null;
        }
        this.isAuraAnimating = false;
        
        // Remove any aura effects from icons
        this.icons.forEach(icon => {
            icon.element.style.filter = '';
        });
        
        this.container.classList.remove('rotating');
        this.container.classList.remove('hexagon-formation');
        this.container.classList.remove('linear-formation');
        this.icons.forEach((icon) => {
            icon.element.style.transform = ''; // Reset transform
        });
        
        // Clear ghost icons
        this.ghostIcons.forEach(ghost => ghost.remove());
        this.ghostIcons = [];
        
        this.animationState = 'hexagon';
        this.isAnimating = false;
        this.startTime = 0;
        
        // Reset computer animation
        if (this.computerTimer) {
            clearTimeout(this.computerTimer);
            this.computerTimer = null;
        }
        if (this.progressBarInterval) {
            clearInterval(this.progressBarInterval);
            this.progressBarInterval = null;
        }
        this.computerState = 'idle';
        this.currentIconIndex = 0;
        this.progressBarProgress = 0;
        this.updateComputerContent();
        
        // Reinitialize hexagon formation (starts with linear, then transitions to hexagon)
        this.initializeHexagonFormation();
        
        setTimeout(() => {
            this.updateStatus('Ready');
        }, 100);
    }

    public getState(): AnimationState {
        return this.animationState;
    }

    public isInProgress(): boolean {
        return this.isAnimating;
    }



    // Web Animation Methods
    private startWebAnimation(): void {
        this.isWebAnimating = true;
        this.webStartTime = 0;
        this.completedWebLines.clear(); // Reset completed lines tracking
        this.createWebLines();
        this.webAnimationId = requestAnimationFrame(this.animateWeb);
    }

    private createWebLines(): void {
        this.webLines = [];
        
        // Calculate the center hexagon points (smaller radius for smaller web)
        const webRadius = this.radius * 0.4; // 40% of the icon hexagon radius (smaller web)
        const centerX = this.centerX;
        const centerY = this.centerY;
        
        // Create 6 points forming a perfect hexagon in the center
        const hexagonPoints: Array<{x: number, y: number}> = [];
        for (let i = 0; i < 6; i++) {
            const angleOffset = ((i * 60) + 90) * (Math.PI / 180); // Same angle calculation as icons
            const x = centerX + webRadius * Math.cos(angleOffset);
            const y = centerY + webRadius * Math.sin(angleOffset);
            hexagonPoints.push({x, y});
        }
        
        // Generate a continuous path that visits each node and connects all nodes
        this.generateContinuousWebPath(hexagonPoints);
    }

    private generateContinuousWebPath(points: Array<{x: number, y: number}>): void {
        console.log(`Creating web: outer hexagon perimeter + center spokes`);
        
        // Calculate the center of the hexagon
        const centerX = points.reduce((sum, p) => sum + p.x, 0) / points.length;
        const centerY = points.reduce((sum, p) => sum + p.y, 0) / points.length;
        const center = { x: centerX, y: centerY };
        
        // Step 1: Draw the outer hexagon perimeter
        // Connect each node to the next one in sequence: 0->1->2->3->4->5->0
        for (let i = 0; i < points.length; i++) {
            const nextIndex = (i + 1) % points.length;
            this.webLines.push({
                start: points[i],
                end: points[nextIndex],
                progress: 0
            });
        }
        
        // Step 2: Draw lines from center to each node
        // Start directly from center (no connecting line needed)
        for (let i = 0; i < points.length; i++) {
            this.webLines.push({
                start: center,
                end: points[i],
                progress: 0
            });
        }
        
        console.log(`Created ${this.webLines.length} web lines: ${points.length} perimeter + ${points.length + 1} center spokes`);
    }



    private animateWeb = (currentTime: number): void => {
        if (!this.webStartTime) this.webStartTime = currentTime;
        
        const elapsed = currentTime - this.webStartTime;
        const duration = 3000; // 3 seconds for web animation (faster)
        const progress = Math.min(elapsed / duration, 1);
        
        // Clear canvas
        this.webCtx.clearRect(0, 0, this.webCanvas.width, this.webCanvas.height);
        
        // Track when center lines are completed for glow start
        let centerLinesCompleted = false;
        
        // Update line progress - draw perimeter first, then all center lines simultaneously
        this.webLines.forEach((line, index) => {
            if (index < 6) {
                // Perimeter lines (first 6 lines) - draw one at a time
                const lineDuration = 0.4; // 40% of time for perimeter
                const lineStart = index * (lineDuration / 6);
                const lineEnd = lineStart + (lineDuration / 6);
                const lineProgress = Math.max(0, Math.min(1, (progress - lineStart) / (lineDuration / 6)));
                line.progress = lineProgress;
            } else {
                // Center lines (remaining lines) - all start at 40% progress and draw simultaneously (faster)
                const centerStart = 0.4;
                const centerDuration = 0.4; // 40% of time for center lines (faster)
                const lineProgress = Math.max(0, Math.min(1, (progress - centerStart) / centerDuration));
                line.progress = lineProgress;
                
                // Check if all center lines are completed
                if (line.progress >= 1) {
                    centerLinesCompleted = true;
                }
            }
            
            if (line.progress > 0) {
                this.drawWebLine(line, line.progress);
            }
        });
        
        // Start glowing nodes only when all center lines are completed
        if (centerLinesCompleted && !this.completedWebLines.has(-1)) {
            this.completedWebLines.add(-1); // Mark that glow has started
            // Start aura animation immediately when glow begins to prevent double animation
            this.startAuraAnimation();
        }
        
        // Draw glowing nodes if center lines are completed and aura animation hasn't started yet
        if (this.completedWebLines.has(-1) && !this.isAuraAnimating) {
            this.drawGlowingNodes(Array.from({length: 6}, (_, i) => i), progress);
        }
        
        if (progress >= 1) {
            this.isWebAnimating = false;
            this.webAnimationId = null;
            
            return;
        }
        
        this.webAnimationId = requestAnimationFrame(this.animateWeb);
    };

    private drawWebLine(line: {start: {x: number, y: number}, end: {x: number, y: number}, progress: number}, progress: number): void {
        // Scale coordinates for higher resolution canvas
        const scale = 2; // Canvas is 2x resolution
        const startX = line.start.x * scale;
        const startY = line.start.y * scale;
        const endX = (line.start.x + (line.end.x - line.start.x) * progress) * scale;
        const endY = (line.start.y + (line.end.y - line.start.y) * progress) * scale;
        
        // Draw only the crisp main line - no glow effects
        this.webCtx.strokeStyle = 'rgba(255, 255, 255, 1)'; // Full opacity for maximum crispness
        this.webCtx.lineWidth = 1; // Thinner line for maximum crispness
        this.webCtx.lineCap = 'butt'; // Sharp line caps for maximum crispness
        this.webCtx.beginPath();
        this.webCtx.moveTo(startX, startY);
        this.webCtx.lineTo(endX, endY);
        this.webCtx.stroke();
    }

    private drawGlowingNodes(hexagonPoints: number[], progress: number): void {
        // Calculate the time since center lines completed for glow timing
        const currentTime = performance.now();
        const centerCompleteTime = this.webStartTime + (0.8 * 3000); // Center lines complete at 80% of animation
        const timeSinceCompletion = currentTime - centerCompleteTime;
        const glowProgress = (timeSinceCompletion / 1000) % 2; // 2-second glow cycle
        
        // Create a pulsing glow effect - use same formula as loop animation for smooth transition
        const intensity = Math.sin(glowProgress * Math.PI) * 0.6 + 0.4; // Match loop timing exactly
        const glowRadius = 12 + intensity * 8; // Same dynamic glow radius
        const glowOpacity = intensity * 0.8; // Same opacity calculation
        
        // Draw glow at each of the 6 hexagon points
        hexagonPoints.forEach(pointIndex => {
            // Get the hexagon point coordinates (these are the endpoints of center lines)
            const centerLine = this.webLines[6 + pointIndex]; // Center lines start at index 6
            const endpoint = centerLine.end;
            
            const scale = 2;
            const endpointX = endpoint.x * scale;
            const endpointY = endpoint.y * scale;
            
            this.webCtx.beginPath();
            this.webCtx.arc(endpointX, endpointY, glowRadius, 0, Math.PI * 2);
            
            const gradient = this.webCtx.createRadialGradient(
                endpointX, endpointY, 0,
                endpointX, endpointY, glowRadius
            );
            gradient.addColorStop(0, `rgba(255, 255, 255, ${glowOpacity})`);
            gradient.addColorStop(0.5, `rgba(255, 255, 255, ${glowOpacity * 0.5})`);
            gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
            
            this.webCtx.fillStyle = gradient;
            this.webCtx.fill();
        });
    }

    private clearWebCanvas(): void {
        this.webCtx.clearRect(0, 0, this.webCanvas.width, this.webCanvas.height);
    }

    // Hexagon Corner Flash Animation Methods
    private startAuraAnimation(): void {
        this.isAuraAnimating = true;
        this.auraStartTime = 0;
        this.auraAnimationId = requestAnimationFrame(this.animateGentleBlink); // Go directly to looping animation
    }

    private startGentleBlinking(): void {
        this.isAuraAnimating = true;
        this.auraStartTime = 0;
        this.auraAnimationId = requestAnimationFrame(this.animateGentleBlink);
    }

    private animateGentleBlink = (currentTime: number): void => {
        if (!this.auraStartTime) this.auraStartTime = currentTime;
        
        const elapsed = currentTime - this.auraStartTime;
        const firstBlinkDuration = 2000; // 2 seconds for first blink (same as regular)
        const regularBlinkDuration = 2000; // 2 seconds for subsequent blinks
        
        // Determine if this is the first blink cycle
        const isFirstBlink = elapsed < firstBlinkDuration;
        const blinkDuration = isFirstBlink ? firstBlinkDuration : regularBlinkDuration;
        
        // Calculate progress differently for first vs subsequent blinks
        let progress: number;
        let adjustedElapsed: number = 0;
        if (isFirstBlink) {
            // First blink: simple 0 to 1 progress over 2 seconds
            progress = elapsed / firstBlinkDuration;
        } else {
            // Subsequent blinks: loop with 2-second cycles
            adjustedElapsed = elapsed - firstBlinkDuration;
            progress = (adjustedElapsed % regularBlinkDuration) / regularBlinkDuration;
        }
        
        // Calculate center line endpoints (where the center lines connect to the web hexagon)
        const endpointPoints: Array<{x: number, y: number}> = [];
        
        // Get the endpoints of the center lines (lines 6-11, which are the center spokes)
        for (let i = 6; i < 12; i++) {
            if (i < this.webLines.length) {
                const line = this.webLines[i];
                // The endpoint is the end point of each center line
                endpointPoints.push({x: line.end.x, y: line.end.y});
            }
        }
        
        // Clear and redraw web lines
        this.webCtx.clearRect(0, 0, this.webCanvas.width, this.webCanvas.height);
        this.webLines.forEach(line => {
            this.drawWebLine(line, 1);
        });
        
        // All center line endpoints glow simultaneously in a loop
        endpointPoints.forEach((endpoint) => {
            // Create a pulsing glow effect that loops
            // Use the same timing formula as the first glow for smooth transition
            const intensity = Math.sin(progress * Math.PI) * 0.6 + 0.4; // Match first glow timing
            const glowRadius = 12 + intensity * 8; // Same dynamic glow radius
            const glowOpacity = intensity * 0.8; // Same opacity calculation
            
            const scale = 2;
            const endpointX = endpoint.x * scale;
            const endpointY = endpoint.y * scale;
            
            this.webCtx.beginPath();
            this.webCtx.arc(endpointX, endpointY, glowRadius, 0, Math.PI * 2);
            
            const gradient = this.webCtx.createRadialGradient(
                endpointX, endpointY, 0,
                endpointX, endpointY, glowRadius
            );
            gradient.addColorStop(0, `rgba(255, 255, 255, ${glowOpacity})`);
            gradient.addColorStop(0.5, `rgba(255, 255, 255, ${glowOpacity * 0.5})`);
            gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
            
            this.webCtx.fillStyle = gradient;
            this.webCtx.fill();
        });
        
        // Check if we should start computer animation (when second blink begins)
        if (!isFirstBlink && adjustedElapsed < regularBlinkDuration) {
            // This is the start of the second blink cycle - start computer animation
            this.startComputerAnimation();
        }
        
        // Continue looping indefinitely (blinking keeps going in background)
        this.auraAnimationId = requestAnimationFrame(this.animateGentleBlink);
    };

    // Computer Animation Methods
    private startComputerAnimation(): void {
        this.currentIconIndex = 0; // Start with first icon
        this.progressBarProgress = 0;
        this.runComputerSequence();
    }

    private async runComputerSequence(): Promise<void> {
        // Clear any existing timers
        if (this.computerTimer) {
            clearTimeout(this.computerTimer);
        }
        if (this.progressBarInterval) {
            clearInterval(this.progressBarInterval);
        }

        // Show current icon with progress bar
        this.setComputerState('running');
        this.progressBarProgress = 0;
        
        // Animate progress bar
        this.progressBarInterval = window.setInterval(() => {
            this.progressBarProgress += 1;
            if (this.progressBarProgress >= 100) {
                this.progressBarProgress = 100;
                clearInterval(this.progressBarInterval!);
                this.progressBarInterval = null;
                
                // Fade out the running state
                this.fadeOutRunningState();
            } else {
                this.updateComputerContent();
            }
        }, 20); // 20ms = 2 seconds total duration
    }

    private fadeOutRunningState(): void {
        const computerContent = this.computerContent;
        computerContent.style.transition = 'opacity 0.5s ease-out';
        computerContent.style.opacity = '0';
        
        // After fade out, show completion checkmark
        setTimeout(() => {
            this.setComputerState('completed');
            this.fadeInCompletedState();
        }, 500);
    }

    private fadeInCompletedState(): void {
        const computerContent = this.computerContent;
        computerContent.style.opacity = '0';
        computerContent.style.transition = 'opacity 0.5s ease-in';
        
        // Trigger fade in
        setTimeout(() => {
            computerContent.style.opacity = '1';
        }, 10);
        
        // After pause, fade out completed state
        setTimeout(() => {
            this.fadeOutCompletedState();
        }, 2000); // 2 second pause
    }

    private fadeOutCompletedState(): void {
        const computerContent = this.computerContent;
        computerContent.style.transition = 'opacity 0.5s ease-out';
        computerContent.style.opacity = '0';
        
        // After fade out, move to next icon and fade in
        setTimeout(() => {
            this.currentIconIndex = (this.currentIconIndex + 1) % 6;
            this.fadeInNextIcon();
        }, 500);
    }

    private fadeInNextIcon(): void {
        const computerContent = this.computerContent;
        computerContent.style.opacity = '0';
        computerContent.style.transition = 'opacity 0.5s ease-in';
        
        // Set to running state for next icon
        this.setComputerState('running');
        this.progressBarProgress = 0;
        
        // Trigger fade in
        setTimeout(() => {
            computerContent.style.opacity = '1';
            // Start the progress bar animation again
            this.progressBarInterval = window.setInterval(() => {
                this.progressBarProgress += 1;
                if (this.progressBarProgress >= 100) {
                    this.progressBarProgress = 100;
                    clearInterval(this.progressBarInterval!);
                    this.progressBarInterval = null;
                    
                    // Fade out the running state
                    this.fadeOutRunningState();
                } else {
                    this.updateComputerContent();
                }
            }, 20);
        }, 10);
    }

    private setComputerState(state: ComputerState): void {
        this.computerState = state;
        this.updateComputerContent();
    }



    private updateComputerContent(): void {
        this.computerContent.className = `computer-content ${this.computerState}`;
        
        // Ensure opacity is set to 1 for content updates (fade transitions are handled separately)
        this.computerContent.style.opacity = '1';
        
        // Calculate the computer icon size based on the content boundary width of the current hexagon icon
        const currentIcon = this.icons[this.currentIconIndex];
        const contentBoundary = this.contentBoundaries[this.currentIconIndex];
        const computerIconSize = contentBoundary ? contentBoundary.width * 2 : 342; // 2x the content boundary width
        
        // For completed state (check icon), use the checkmark
        if (this.computerState === 'completed') {
            this.computerContent.innerHTML = `
                <div class="computer-icon-container" style="position: relative; display: flex; align-items: center; justify-content: center; width: 100%; height: 100%;">
                    <div class="icon" style="width: 171px; height: 171px; display: flex; align-items: center; justify-content: center;">
                        <svg width="${computerIconSize}" height="${computerIconSize}" viewBox="0 0 ${computerIconSize} ${computerIconSize}" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <g transform="scale(${computerIconSize/290})">
                                <g filter="url(#filter0_f_0_1)">
                                    <path d="M179.801 88H110.433C98.4268 88 88.6937 97.733 88.6937 109.739V179.108C88.6937 191.114 98.4268 200.847 110.433 200.847H179.801C191.808 200.847 201.541 191.114 201.541 179.108V109.739C201.541 97.733 191.808 88 179.801 88Z" fill="url(#paint0_linear_0_1)"/>
                                </g>
                                <g filter="url(#filter1_d_0_1)">
                                    <path d="M171.108 88H101.739C89.733 88 80 97.733 80 109.739V179.108C80 191.114 89.733 200.847 101.739 200.847H171.108C183.114 200.847 192.847 191.114 192.847 179.108V109.739C192.847 97.733 183.114 88 171.108 88Z" fill="url(#paint1_linear_0_1)"/>
                                </g>
                                <foreignObject x="98.1907" y="101.198" width="152.847" height="152.847"><div xmlns="http://www.w3.org/1999/xhtml" style="backdrop-filter:blur(9px);clip-path:url(#bgblur_0_0_1_clip_path);height:100%;width:100%"></div></foreignObject>
                                <path data-figma-bg-blur-radius="18" d="M209.298 120.198C221.857 120.198 232.037 130.378 232.037 142.937V212.305C232.037 224.864 221.857 235.044 209.298 235.044H139.93C127.371 235.044 117.191 224.864 117.191 212.305V142.937C117.191 130.378 127.371 120.198 139.93 120.198H209.298Z" fill="url(#paint2_linear_0_1)" stroke="url(#paint3_linear_0_1)" stroke-width="2"/>
                                <path d="M211.828 164.216C213.289 165.556 213.399 167.841 212.074 169.319L180.896 204.11V204.11L180.896 204.113L171.306 214.814C169.981 216.292 167.724 216.404 166.263 215.064L155.683 205.355L137.172 188.368C135.711 187.028 135.601 184.743 136.925 183.265L144.119 175.236C145.444 173.758 147.702 173.646 149.162 174.987L165.029 189.548C166.49 190.888 168.747 190.777 170.072 189.299L198.854 157.186C200.178 155.708 202.436 155.596 203.897 156.937L211.828 164.216Z" fill="white"/>
                                <defs>
                                    <filter id="filter0_f_0_1" x="0.693726" y="0" width="288.847" height="288.847" filterUnits="userSpaceOnUse" color-interpolation-filters="sRGB">
                                        <feFlood flood-opacity="0" result="BackgroundImageFix"/>
                                        <feBlend mode="normal" in="SourceGraphic" in2="BackgroundImageFix" result="shape"/>
                                        <feGaussianBlur stdDeviation="44" result="effect1_foregroundBlur_0_1"/>
                                    </filter>
                                    <filter id="filter1_d_0_1" x="76" y="88" width="120.847" height="120.847" filterUnits="userSpaceOnUse" color-interpolation-filters="sRGB">
                                        <feFlood flood-opacity="0" result="BackgroundImageFix"/>
                                        <feColorMatrix in="SourceAlpha" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0" result="hardAlpha"/>
                                        <feOffset dy="4"/>
                                        <feGaussianBlur stdDeviation="2"/>
                                        <feComposite in2="hardAlpha" operator="out"/>
                                        <feColorMatrix type="matrix" values="0 0 0 0 0.767184 0 0 0 0 0.480556 0 0 0 0 0.480556 0 0 0 0.25 0"/>
                                        <feBlend mode="normal" in2="BackgroundImageFix" result="effect1_dropShadow_0_1"/>
                                        <feBlend mode="normal" in="SourceGraphic" in2="effect1_dropShadow_0_1" result="shape"/>
                                    </filter>
                                    <clipPath id="bgblur_0_0_1_clip_path" transform="translate(-98.1907 -101.198)"><path d="M209.298 120.198C221.857 120.198 232.037 130.378 232.037 142.937V212.305C232.037 224.864 221.857 235.044 209.298 235.044H139.93C127.371 235.044 117.191 224.864 117.191 212.305V142.937C117.191 130.378 127.371 120.198 139.93 120.198H209.298Z"/></clipPath>
                                    <linearGradient id="paint0_linear_0_1" x1="193.472" y1="205.331" x2="97.9816" y2="85.054" gradientUnits="userSpaceOnUse">
                                        <stop stop-color="#38B32A"/>
                                        <stop offset="1" stop-color="#74D25D"/>
                                    </linearGradient>
                                    <linearGradient id="paint1_linear_0_1" x1="184.778" y1="205.331" x2="89.2878" y2="85.054" gradientUnits="userSpaceOnUse">
                                        <stop stop-color="#79D562"/>
                                        <stop offset="1" stop-color="#34B126"/>
                                    </linearGradient>
                                    <linearGradient id="paint2_linear_0_1" x1="124.562" y1="227.674" x2="224.667" y2="127.569" gradientUnits="userSpaceOnUse">
                                        <stop stop-color="white" stop-opacity="0.2"/>
                                        <stop offset="1" stop-color="white" stop-opacity="0.49"/>
                                    </linearGradient>
                                    <linearGradient id="paint3_linear_0_1" x1="126.156" y1="130.073" x2="220.486" y2="230.933" gradientUnits="userSpaceOnUse">
                                        <stop stop-color="white"/>
                                        <stop offset="1" stop-color="white" stop-opacity="0"/>
                                    </linearGradient>
                                </defs>
                            </g>
                        </svg>
                    </div>
                </div>
            `;
            

            return;
        }
        
        // For detecting and running states, use the complete hexagon icons with their rectangles
        let iconHTML = '';
        if (this.computerState === 'detecting') {
            // Create a clean copy of the hexagon icon without original positioning
            const iconClone = currentIcon.element.cloneNode(true) as HTMLElement;
            iconClone.style.position = 'relative';
            iconClone.style.left = '0';
            iconClone.style.top = '0';
            iconClone.style.transform = 'none';
            iconHTML = iconClone.outerHTML;
        } else if (this.computerState === 'running') {
            const runningIcon = this.icons[this.currentIconIndex];
            // Create a clean copy of the hexagon icon without original positioning
            const iconClone = runningIcon.element.cloneNode(true) as HTMLElement;
            iconClone.style.position = 'relative';
            iconClone.style.left = '0';
            iconClone.style.top = '0';
            iconClone.style.transform = 'none';
            iconHTML = iconClone.outerHTML;
        }
        
        // Get the visual center offset for proper centering (same as hexagon positioning)
        const visualCenterOffset = this.getVisualCenterOffset(this.currentIconIndex);
        
        // Create the content with complete hexagon icons centered using the same logic as hexagon positioning
        this.computerContent.innerHTML = `
            <div class="computer-icon-container" style="position: relative; display: flex; align-items: center; justify-content: center; width: 100%; height: 100%;">
                <div style="width: 171px; height: 171px; display: flex; align-items: center; justify-content: center; position: relative;">
                    <div style="position: absolute; left: ${85.5 - visualCenterOffset.x}px; top: ${85.5 - visualCenterOffset.y}px;">
                        ${iconHTML}
                    </div>
                </div>
            </div>
            ${this.computerState === 'running' ? `
            <div class="computer-progress-container">
                <div class="computer-progress-bar">
                    <div class="computer-progress-fill" style="width: ${this.progressBarProgress}%"></div>
                </div>
            </div>
            ` : ''}
        `;
    }

    private delay(ms: number): Promise<void> {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

}

let animation: ValinorAnimation;
document.addEventListener('DOMContentLoaded', () => {
    animation = new ValinorAnimation();
    setTimeout(() => {
        animation.updateStatus('Click "Start Animation" to begin');
    }, 500);
});

function startAnimation(): void {
    if (animation) {
        animation.startAnimation();
    }
}

function resetAnimation(): void {
    if (animation) {
        animation.resetAnimation();
    }
}

export { ValinorAnimation };
export type { AnimationState, ComputerState, IconElement }; 