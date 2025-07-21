class ValinorAnimation {
    // Computer animation properties - DISABLED
    // private computerContent: HTMLElement;
    // private computerState: ComputerState = 'idle';
    // private computerTimer: number | null = null;
    // private currentIconIndex: number = 0; // Track which icon is being processed
    // private iconsProcessed: number = 0; // Track how many icons have been processed
    // private progressBarProgress: number = 0;
    // private progressBarInterval: number | null = null;
    constructor() {
        this.animationState = 'vertical-center';
        this.isAnimating = false;
        this.animationId = null;
        this.startTime = 0;
        this.radius = 130; // Distance from center to hexagon vertices
        this.centerX = 500; // Center X for the screen (positioned between computer and left formation)
        this.centerY = 300; // Center Y for the screen
        this.contentBoundaries = [];
        this.ghostIcons = []; // Store ghost elements
        this.originalPositions = []; // Store original positions
        this.webLines = [];
        this.webAnimationId = null;
        this.webStartTime = 0;
        this.isWebAnimating = false;
        this.completedWebLines = new Set(); // Track which lines have completed
        // Aura animation properties
        this.isAuraAnimating = false;
        this.auraAnimationId = null;
        this.auraStartTime = 0;
        // Computer animation properties
        this.isComputerAnimating = false;
        this.computerAnimationId = null;
        this.computerStartTime = 0;
        this.currentCodeLine = 0;
        this.currentPhase = 'tool-call';
        this.currentQuestion = 0;
        this.waitingForResponse = false;
        this.responseDelay = 0;
        // Typing animation properties - DISABLED
        // private currentTypingLine: number = 0;
        // private currentTypingChar: number = 0;
        // private typingSpeed: number = 50; // milliseconds per character
        // private typingTimer: number | null = null;
        this.toolCalls = [
            'Building integration',
            'Developing pipeline',
            'Executing workflow'
        ];
        this.codeSnippets = [
            'const trigger = {',
            '  key: \'new_item\',',
            '  noun: \'Item\',',
            '  display: { label: \'New Item\', description: \'Triggers when a new item is added.\' },',
            '  operation: {',
            '    perform: async (z, bundle)}'
        ];
        this.questions = [
            'Approve automation?',
            'Enable optimization?',
            'Deploy solution?'
        ];
        this.responses = [
            'Approved - proceeding...',
            'Enabled - configuring...',
            'Deployed - monitoring...'
        ];
        this.animateOrbit = (currentTime) => {
            if (!this.startTime)
                this.startTime = currentTime;
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
        this.animateWeb = (currentTime) => {
            if (!this.webStartTime)
                this.webStartTime = currentTime;
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
                }
                else {
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
            // Start computer animation when all center lines are completed
            if (centerLinesCompleted && !this.completedWebLines.has(-1)) {
                this.completedWebLines.add(-1); // Mark that computer animation has started
                // Add 1 second pause before starting computer animation
                setTimeout(() => {
                    this.startComputerAnimation();
                }, 1000);
            }
            if (progress >= 1) {
                this.isWebAnimating = false;
                this.webAnimationId = null;
                return;
            }
            this.webAnimationId = requestAnimationFrame(this.animateWeb);
        };
        this.animateComputer = (currentTime) => {
            if (!this.computerStartTime)
                this.computerStartTime = currentTime;
            const elapsed = currentTime - this.computerStartTime;
            const questionDuration = 1500; // 1.5s for question to show
            const toolCallDelay = 1000; // 1s delay before code starts
            const toolCallDuration = 4000; // 4s for tool call (stays visible during code)
            const codeFlowDuration = 1500; // 1.5s for code to flow (faster)
            const cycleDuration = questionDuration + toolCallDelay + codeFlowDuration;
            // Calculate which cycle we're in (each cycle: question -> tool call -> code)
            const cycleIndex = Math.floor(elapsed / cycleDuration);
            const cycleProgress = elapsed % cycleDuration;
            if (cycleIndex >= this.questions.length) {
                this.isComputerAnimating = false;
                this.computerAnimationId = null;
                return;
            }
            // Determine phase within current cycle
            let phase = 'question';
            let phaseProgress = 0;
            if (cycleProgress < questionDuration) {
                phase = 'question';
                phaseProgress = cycleProgress / questionDuration;
            }
            else if (cycleProgress < questionDuration + toolCallDelay) {
                phase = 'tool-call';
                phaseProgress = 1; // Tool call is fully visible during delay
            }
            else if (cycleProgress < questionDuration + toolCallDelay + codeFlowDuration) {
                phase = 'code';
                phaseProgress = (cycleProgress - questionDuration - toolCallDelay) / codeFlowDuration;
            }
            else {
                phase = 'tool-call';
                phaseProgress = 1; // Tool call remains visible after code
            }
            // Update display if phase or cycle changed
            if (phase !== this.currentPhase || cycleIndex !== this.currentCodeLine) {
                this.currentPhase = phase;
                this.currentCodeLine = cycleIndex;
                this.updateComputerDisplay();
            }
            // Update phase progress for animations
            this.updatePhaseProgress(phase, phaseProgress, cycleIndex);
            this.computerAnimationId = requestAnimationFrame(this.animateComputer);
        };
        this.container = document.getElementById('container');
        this.hexagonGroup = document.getElementById('hexagonGroup');
        this.statusElement = document.getElementById('status');
        this.computerContent = document.getElementById('computerContent');
        this.webCanvas = document.getElementById('webCanvas');
        this.webCtx = this.webCanvas.getContext('2d');
        this.icons = this.initializeIcons();
        this.setupEventListeners();
        this.initializeVerticalFormation();
        this.initializeWebCanvas();
    }
    initializeIcons() {
        const iconElements = document.querySelectorAll('.icon');
        return Array.from(iconElements).map((element, index) => ({
            element: element,
            id: `icon${index + 1}`
        }));
    }
    setupEventListeners() {
        const startButton = document.getElementById('startBtn');
        const resetButton = document.getElementById('resetBtn');
        if (startButton) {
            startButton.addEventListener('click', () => this.startAnimation());
        }
        if (resetButton) {
            resetButton.addEventListener('click', () => this.resetAnimation());
        }
    }
    initializeWebCanvas() {
        // Set canvas size to match container with higher resolution for crisp lines
        this.webCanvas.width = 1200; // Higher resolution for crisp lines
        this.webCanvas.height = 1200;
        // Set canvas style to match container
        this.webCanvas.style.width = '100%';
        this.webCanvas.style.height = '100%';
        // Position canvas to match the coordinate system of the icons
        this.webCanvas.style.position = 'absolute';
        this.webCanvas.style.top = '50%';
        this.webCanvas.style.left = '50%';
        this.webCanvas.style.transform = 'translate(-50%, -50%)';
        this.webCanvas.style.zIndex = '0'; // Place behind icons (icons have z-index: 1)
        // Enable crisp line rendering
        this.webCtx.imageSmoothingEnabled = false;
    }
    initializeVerticalFormation() {
        // Clear any existing ghost icons
        this.ghostIcons.forEach(ghost => ghost.remove());
        this.ghostIcons = [];
        // Clear original positions
        this.originalPositions = [];
        // Start with 2-column linear formation - START POSITION
        this.icons.forEach((icon, index) => {
            // Calculate 2-column, 3-row layout positions
            const column = index % 2;
            const row = Math.floor(index / 2);
            // START POSITION: 2 columns in the center of the screen
            const startX = this.centerX - 75 + (column * 150); // 75px left of center, 150px spacing
            const startY = this.centerY - 150 + (row * 150); // 150px spacing between rows
            // Add visual indicator for content boundaries first
            this.addContentBoundaryIndicator(icon.element, index);
            // Get the visual center offset for this specific icon
            const visualCenterOffset = this.getVisualCenterOffset(index);
            // Calculate final position
            const finalX = startX - visualCenterOffset.x;
            const finalY = startY - visualCenterOffset.y;
            // Store the original position
            this.originalPositions[index] = { x: finalX, y: finalY };
            // Position the icon
            icon.element.style.transform = `translate(${finalX}px, ${finalY}px)`;
        });
        // Add vertical formation class
        this.container.classList.add('vertical-formation');
    }
    transitionToLeftPosition() {
        // Move icons to the LEFT POSITION
        this.icons.forEach((icon, index) => {
            // Calculate 2-column, 3-row layout positions
            const column = index % 2;
            const row = Math.floor(index / 2);
            // LEFT POSITION: Far to the left of the screen
            const leftX = this.centerX - 400 + (column * 150); // 400px left of center, 150px spacing
            const leftY = this.centerY - 150 + (row * 150); // Same Y as start position
            // Get the visual center offset for this specific icon
            const visualCenterOffset = this.getVisualCenterOffset(index);
            // Position the icon
            icon.element.style.transform = `translate(${leftX - visualCenterOffset.x}px, ${leftY - visualCenterOffset.y}px)`;
        });
        // Switch to left formation class
        this.container.classList.remove('vertical-formation');
        this.container.classList.add('left-formation');
    }
    transitionToRightPosition() {
        // Move icons back to their EXACT START POSITION, leaving ghosts behind
        this.icons.forEach((icon, index) => {
            // Recalculate the exact same position as in initializeVerticalFormation to ensure consistency
            const column = index % 2;
            const row = Math.floor(index / 2);
            // EXACT SAME CALCULATION as initializeVerticalFormation
            const startX = this.centerX - 75 + (column * 150); // 75px left of center, 150px spacing
            const startY = this.centerY - 150 + (row * 150); // 150px spacing between rows
            // Get the visual center offset for this specific icon
            const visualCenterOffset = this.getVisualCenterOffset(index);
            // Calculate final position (exact same as original)
            const finalX = startX - visualCenterOffset.x;
            const finalY = startY - visualCenterOffset.y;
            // Position the icon at the exact same location
            icon.element.style.transform = `translate(${finalX}px, ${finalY}px)`;
            // Create ghost at the left position
            const leftX = this.centerX - 400 + (column * 150); // Same as left position
            const leftY = this.centerY - 150 + (row * 150);
            this.createGhostIcon(icon.element, leftX - visualCenterOffset.x, leftY - visualCenterOffset.y, index);
        });
        // Switch back to vertical formation class (same as original)
        this.container.classList.remove('left-formation');
        this.container.classList.add('vertical-formation');
    }
    transitionToHexagon() {
        // Transition icons to hexagon positions
        // Calculate the exact vertical center of the linear formation
        // Linear formation spans from centerY-150 to centerY+150, so center is at centerY
        const linearFormationCenterY = this.centerY;
        // Ensure hexagon uses the exact same vertical center
        this.icons.forEach((icon, index) => {
            const angleOffset = ((index * 60) + 90) * (Math.PI / 180);
            const orbitalX = this.centerX + this.radius * Math.cos(angleOffset);
            const orbitalY = linearFormationCenterY + this.radius * Math.sin(angleOffset);
            // Get the visual center offset for this specific icon based on its SVG content
            const visualCenterOffset = this.getVisualCenterOffset(index);
            // Position the icon so its visual center is at the hexagon point
            icon.element.style.transform = `translate(${orbitalX - visualCenterOffset.x}px, ${orbitalY - visualCenterOffset.y}px)`;
        });
        // Switch to hexagon formation class
        this.container.classList.remove('vertical-formation');
        this.container.classList.add('hexagon-formation');
    }
    getVisualCenterOffset(iconIndex) {
        // Use the centers of the blue bounding boxes as hexagon corner points
        if (this.contentBoundaries[iconIndex]) {
            const boundary = this.contentBoundaries[iconIndex];
            return {
                x: boundary.x, // This is already the center X
                y: boundary.y // This is already the center Y
            };
        }
        // Fallback to default center if boundaries not calculated yet
        return { x: 85.5, y: 85.5 };
    }
    createGhostIcon(originalIcon, x, y, index) {
        // Clone the original icon
        const ghost = originalIcon.cloneNode(true);
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
    addContentBoundaryIndicator(iconElement, iconIndex) {
        // Calculate content boundaries for centering without visual indicators
        const svg = iconElement.querySelector('svg');
        if (svg) {
            const mainGroup = svg.querySelector('g');
            let bbox = { x: 0, y: 0, width: 0, height: 0 };
            if (mainGroup) {
                const allPaths = mainGroup.querySelectorAll('path');
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
                }
                else {
                    bbox = mainGroup.getBBox();
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
                x: visualX + visualWidth / 2,
                y: visualY + visualHeight / 2,
                width: visualWidth,
                height: visualHeight
            };
        }
    }
    updateStatus(message) {
        this.statusElement.textContent = message;
    }
    // Easing function: starts very slow, gentle acceleration in middle, slows at end
    easeInOutQuint(t) {
        return t < 0.5 ? 16 * t * t * t * t * t : 1 - Math.pow(-2 * t + 2, 5) / 2;
    }
    startAnimation() {
        if (this.isAnimating)
            return;
        if (this.animationState === 'vertical-center') {
            this.isAnimating = true;
            this.updateStatus('Moving to left position...');
            // First transition to left formation
            this.transitionToLeftPosition();
            // After transition completes, pause longer at left position
            setTimeout(() => {
                this.updateStatus('Moving to right position...');
                this.transitionToRightPosition();
                // After moving to right, transition to hexagon
                setTimeout(() => {
                    this.updateStatus('Moving to hexagon formation...');
                    this.transitionToHexagon();
                    // After hexagon formation, fade in computer and start web animation
                    setTimeout(() => {
                        const computerContainer = document.getElementById('computerContainer');
                        if (computerContainer) {
                            computerContainer.classList.add('visible');
                        }
                        setTimeout(() => {
                            this.updateStatus('Drawing hex lines...');
                            this.startWebAnimation();
                            // this.startAuraAnimation(); // Disabled aura animation
                            this.isAnimating = false;
                        }, 1000); // Wait 1 second after computer fades in
                    }, 1000); // Wait 1 second after hexagon forms
                }, 1000);
            }, 3000); // 3 seconds pause at left position
        }
    }
    resetAnimation() {
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
        this.container.classList.remove('vertical-formation');
        this.container.classList.remove('left-formation');
        this.container.classList.remove('right-formation');
        this.icons.forEach((icon) => {
            icon.element.style.transform = ''; // Reset transform
        });
        // Clear ghost icons
        this.ghostIcons.forEach(ghost => ghost.remove());
        this.ghostIcons = [];
        this.animationState = 'vertical-center';
        this.isAnimating = false;
        this.startTime = 0;
        // Reset computer animation
        // if (this.computerTimer) {
        //     clearTimeout(this.computerTimer);
        //     this.computerTimer = null;
        // }
        // if (this.progressBarInterval) {
        //     clearInterval(this.progressBarInterval);
        //     this.progressBarInterval = null;
        // }
        // this.computerState = 'idle';
        // this.currentIconIndex = 0;
        // this.progressBarProgress = 0;
        // this.updateComputerContent();
        // Hide computer container
        const computerContainer = document.getElementById('computerContainer');
        if (computerContainer) {
            computerContainer.classList.remove('visible');
        }
        // Reinitialize vertical formation
        this.initializeVerticalFormation();
        setTimeout(() => {
            this.updateStatus('Ready');
        }, 100);
    }
    getState() {
        return this.animationState;
    }
    isInProgress() {
        return this.isAnimating;
    }
    // Web Animation Methods
    startWebAnimation() {
        this.isWebAnimating = true;
        this.webStartTime = 0;
        this.completedWebLines.clear(); // Reset completed lines tracking
        this.createWebLines();
        this.webAnimationId = requestAnimationFrame(this.animateWeb);
    }
    createWebLines() {
        this.webLines = [];
        // Create the original hexagon (theoretical positions)
        const originalHexagonPoints = [];
        for (let i = 0; i < 6; i++) {
            const angleOffset = ((i * 60) + 90) * (Math.PI / 180); // Same angle calculation as icons
            const x = this.centerX + this.radius * Math.cos(angleOffset);
            const y = this.centerY + this.radius * Math.sin(angleOffset);
            originalHexagonPoints.push({ x, y });
        }
        // Generate path for the original hexagon
        this.generateContinuousWebPath(originalHexagonPoints, 'original');
    }
    generateContinuousWebPath(points, type = 'original') {
        console.log(`Creating ${type} web: outer hexagon perimeter + center spokes`);
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
        console.log(`Created ${this.webLines.length} web lines for ${type}: ${points.length} perimeter + ${points.length} center spokes`);
    }
    drawWebLine(line, progress) {
        // Scale coordinates for higher resolution canvas and center them
        const scale = 2; // Canvas is 2x resolution
        const canvasCenterX = this.webCanvas.width / 2;
        const canvasCenterY = this.webCanvas.height / 2;
        // Transform coordinates to center of canvas
        // The canvas covers the entire viewport, so page coordinates map directly to canvas coordinates
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
    clearWebCanvas() {
        this.webCtx.clearRect(0, 0, this.webCanvas.width, this.webCanvas.height);
    }
    startComputerAnimation() {
        this.isComputerAnimating = true;
        this.computerStartTime = performance.now();
        this.currentCodeLine = 0;
        this.computerContent.innerHTML = '';
        this.computerContent.className = 'computer-content running';
        this.computerAnimationId = requestAnimationFrame(this.animateComputer);
    }
    updatePhaseProgress(phase, progress, cycleIndex) {
        const questionElement = this.computerContent.querySelector('.question-bubble');
        const toolCallElement = this.computerContent.querySelector('.tool-call-bubble');
        const codeContainer = this.computerContent.querySelector('.code-flow-container');
        if (phase === 'question') {
            if (questionElement) {
                questionElement.style.opacity = progress < 0.8 ? '1' : (1 - (progress - 0.8) * 5).toString();
            }
        }
        else if (phase === 'tool-call') {
            if (toolCallElement) {
                toolCallElement.style.opacity = '1'; // Keep tool call visible
            }
        }
        else if (phase === 'code') {
            // Keep tool call visible during code execution
            if (toolCallElement) {
                toolCallElement.style.opacity = '1';
            }
            if (codeContainer) {
                const codeLines = codeContainer.querySelectorAll('.code-line');
                const totalLines = this.codeSnippets.length;
                const linesToShow = Math.floor(progress * totalLines);
                const containerHeight = codeContainer.clientHeight;
                const lineHeight = 20; // 20px spacing between lines
                // Show all lines that should be visible with complete content
                codeLines.forEach((line, index) => {
                    const lineElement = line;
                    if (index < linesToShow) {
                        lineElement.classList.add('visible');
                        // Calculate the final position (top to bottom stacking)
                        const finalTopPosition = index * lineHeight;
                        // Calculate animation progress for this specific line
                        const lineProgress = Math.max(0, Math.min(1, (progress * totalLines - index) / 1));
                        // Start from bottom of container and animate to final position
                        const startPosition = containerHeight;
                        const endPosition = finalTopPosition;
                        const currentPosition = startPosition + (endPosition - startPosition) * lineProgress;
                        // Ensure line stays within container bounds
                        const clampedTopPosition = Math.max(0, Math.min(currentPosition, containerHeight - lineHeight));
                        lineElement.style.position = 'absolute';
                        lineElement.style.top = `${clampedTopPosition + 10}px`;
                        lineElement.style.left = '10px';
                        lineElement.style.right = '10px';
                        lineElement.style.overflow = 'hidden';
                        // Fill the line with complete content immediately
                        const typingContent = lineElement.querySelector('.typing-content');
                        if (typingContent && !typingContent.textContent) {
                            // Apply syntax highlighting to the complete line
                            typingContent.innerHTML = this.highlightSyntax(this.codeSnippets[index]);
                        }
                    }
                    else {
                        lineElement.classList.remove('visible');
                    }
                });
                // Keep scroll at bottom to show latest lines
                codeContainer.scrollTop = codeContainer.scrollHeight;
            }
        }
    }
    updateComputerDisplay() {
        // Clear previous content
        this.computerContent.innerHTML = '';
        // Create the current cycle display
        this.createCycleDisplay();
    }
    createCycleDisplay() {
        const cycleIndex = this.currentCodeLine;
        // Add question bubble
        if (cycleIndex < this.questions.length) {
            const questionDiv = document.createElement('div');
            questionDiv.className = 'question-bubble';
            questionDiv.textContent = this.questions[cycleIndex];
            this.computerContent.appendChild(questionDiv);
        }
        // Add tool call bubble with loading symbol
        if (cycleIndex < this.toolCalls.length) {
            const toolCallDiv = document.createElement('div');
            toolCallDiv.className = 'tool-call-bubble';
            // Create loading symbol container
            const loadingContainer = document.createElement('div');
            loadingContainer.className = 'tool-call-loading';
            // Create spinning circle
            const spinner = document.createElement('div');
            spinner.className = 'tool-call-spinner';
            spinner.innerHTML = `
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M 6 1 A 5 5 0 0 1 11 6 A 5 5 0 0 1 6 11 A 5 5 0 0 1 1 6 A 5 5 0 0 1 6 1" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" fill="none" stroke-dasharray="25 8" stroke-dashoffset="0"/>
                </svg>
            `;
            // Create animated dots
            const dotsContainer = document.createElement('div');
            dotsContainer.className = 'tool-call-dots';
            dotsContainer.innerHTML = '<span class="dot">.</span><span class="dot">.</span><span class="dot">.</span>';
            // Add text content
            const textSpan = document.createElement('span');
            textSpan.className = 'tool-call-text';
            textSpan.textContent = this.toolCalls[cycleIndex];
            // Assemble the tool call bubble
            loadingContainer.appendChild(spinner);
            loadingContainer.appendChild(textSpan);
            loadingContainer.appendChild(dotsContainer);
            toolCallDiv.appendChild(loadingContainer);
            this.computerContent.appendChild(toolCallDiv);
        }
        // Add code flow container
        const codeContainer = document.createElement('div');
        codeContainer.className = 'code-flow-container';
        // Add empty code lines (they will be filled with typing)
        this.codeSnippets.forEach((snippet, index) => {
            const codeLine = document.createElement('div');
            codeLine.className = 'code-line';
            codeLine.innerHTML = '<span class="typing-content"></span>';
            codeContainer.appendChild(codeLine);
        });
        this.computerContent.appendChild(codeContainer);
    }
    highlightSyntax(code) {
        // Return code without any syntax highlighting or word replacements
        return code;
    }
    // Hexagon Corner Flash Animation Methods
    // private startAuraAnimation(): void {
    //     this.isAuraAnimating = true;
    //     this.auraStartTime = 0;
    //     this.auraAnimationId = requestAnimationFrame(this.animateGentleBlink); // Go directly to looping animation
    // }
    // private startGentleBlinking(): void {
    //     this.isAuraAnimating = true;
    //     this.auraStartTime = 0;
    //     this.auraAnimationId = requestAnimationFrame(this.animateGentleBlink);
    // }
    // private animateGentleBlink = (currentTime: number): void => {
    //     if (!this.auraStartTime) this.auraStartTime = currentTime;
    //     const elapsed = currentTime - this.auraStartTime;
    //     const firstBlinkDuration = 2000; // 2 seconds for first blink (same as regular)
    //     const regularBlinkDuration = 2000; // 2 seconds for subsequent blinks
    //     // Determine if this is the first blink cycle
    //     const isFirstBlink = elapsed < firstBlinkDuration;
    //     const blinkDuration = isFirstBlink ? firstBlinkDuration : regularBlinkDuration;
    //     // Calculate progress differently for first vs subsequent blinks
    //     let progress: number;
    //     let adjustedElapsed: number = 0;
    //     if (isFirstBlink) {
    //         // First blink: simple 0 to 1 progress over 2 seconds
    //         progress = elapsed / firstBlinkDuration;
    //     } else {
    //         // Subsequent blinks: loop with 2-second cycles
    //         adjustedElapsed = elapsed - firstBlinkDuration;
    //         progress = (adjustedElapsed % regularBlinkDuration) / regularBlinkDuration;
    //     }
    //     // Calculate center line endpoints (where the center lines connect to the web hexagon)
    //     const endpointPoints: Array<{x: number, y: number}> = [];
    //     // Get the endpoints of the center lines (lines 6-11, which are the center spokes)
    //     for (let i = 6; i < 12; i++) {
    //         if (i < this.webLines.length) {
    //             const line = this.webLines[i];
    //             // The endpoint is the end point of each center line
    //             endpointPoints.push({x: line.end.x, y: line.end.y});
    //         }
    //     }
    //     // Clear and redraw web lines
    //     this.webCtx.clearRect(0, 0, this.webCanvas.width, this.webCanvas.height);
    //     this.webLines.forEach(line => {
    //         this.drawWebLine(line, 1);
    //     });
    //     // All center line endpoints glow simultaneously in a loop
    //     endpointPoints.forEach((endpoint) => {
    //         // Create a pulsing glow effect that loops
    //         // Use the same timing formula as the first glow for smooth transition
    //         const intensity = Math.sin(progress * Math.PI) * 0.6 + 0.4; // Match first glow timing
    //         const glowRadius = 12 + intensity * 8; // Same dynamic glow radius
    //         const glowOpacity = intensity * 0.8; // Same opacity calculation
    //         const scale = 2;
    //         const endpointX = endpoint.x * scale;
    //         const endpointY = endpoint.y * scale;
    //         this.webCtx.beginPath();
    //         this.webCtx.arc(endpointX, endpointY, glowRadius, 0, Math.PI * 2);
    //         const gradient = this.webCtx.createRadialGradient(
    //         endpointX, endpointY, 0,
    //         endpointX, endpointY, glowRadius
    //         );
    //         gradient.addColorStop(0, `rgba(255, 255, 255, ${glowOpacity})`);
    //         gradient.addColorStop(0.5, `rgba(255, 255, 255, ${glowOpacity * 0.5})`);
    //         gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
    //         this.webCtx.fillStyle = gradient;
    //         this.webCtx.fill();
    //     });
    //     // Check if we should start computer animation (when second blink begins)
    //     // if (!isFirstBlink && adjustedElapsed < regularBlinkDuration) {
    //     //     // This is the start of the second blink cycle - start computer animation
    //     //     this.startComputerAnimation();
    //     // }
    //     // Continue looping indefinitely (blinking keeps going in background)
    //     this.auraAnimationId = requestAnimationFrame(this.animateGentleBlink);
    // };
    // Computer Animation Methods
    // private startComputerAnimation(): void {
    //     this.currentIconIndex = 0; // Start with first icon
    //     this.progressBarProgress = 0;
    //     this.runComputerSequence();
    // }
    // private async runComputerSequence(): Promise<void> {
    //     // Clear any existing timers
    //     if (this.computerTimer) {
    //         clearTimeout(this.computerTimer);
    //     }
    //     if (this.progressBarInterval) {
    //         clearInterval(this.progressBarInterval);
    //     }
    //     // Show current icon with progress bar
    //     this.setComputerState('running');
    //     this.progressBarProgress = 0;
    //     // Animate progress bar
    //     this.progressBarInterval = window.setInterval(() => {
    //         this.progressBarProgress += 1;
    //         if (this.progressBarProgress >= 100) {
    //             this.progressBarProgress = 100;
    //             clearInterval(this.progressBarInterval!);
    //             this.progressBarInterval = null;
    //             // Fade out the running state
    //             this.fadeOutRunningState();
    //         } else {
    //             this.updateComputerContent();
    //         }
    //     }, 20); // 20ms = 2 seconds total duration
    // }
    // private fadeOutRunningState(): void {
    //     const computerContent = this.computerContent;
    //     computerContent.style.transition = 'opacity 0.5s ease-out';
    //     computerContent.style.opacity = '0';
    //     // After fade out, show completion checkmark
    //     setTimeout(() => {
    //         this.setComputerState('completed');
    //         this.fadeInCompletedState();
    //     }, 500);
    // }
    // private fadeInCompletedState(): void {
    //     const computerContent = this.computerContent;
    //     computerContent.style.opacity = '0';
    //     computerContent.style.transition = 'opacity 0.5s ease-in';
    //     // Trigger fade in
    //     setTimeout(() => {
    //         computerContent.style.opacity = '1';
    //     }, 10);
    //     // After pause, fade out completed state
    //     setTimeout(() => {
    //         this.fadeOutCompletedState();
    //     }, 2000); // 2 second pause
    // }
    // private fadeOutCompletedState(): void {
    //     const computerContent = this.computerContent;
    //     computerContent.style.transition = 'opacity 0.5s ease-out';
    //     computerContent.style.opacity = '0';
    //     // After fade out, move to next icon and fade in
    //     setTimeout(() => {
    //         this.currentIconIndex = (this.currentIconIndex + 1) % 6;
    //         this.fadeInNextIcon();
    //     }, 500);
    // }
    // private fadeInNextIcon(): void {
    //     const computerContent = this.computerContent;
    //     computerContent.style.opacity = '0';
    //     computerContent.style.transition = 'opacity 0.5s ease-in';
    //     // Set to running state for next icon
    //     this.setComputerState('running');
    //     this.progressBarProgress = 0;
    //     // Trigger fade in
    //     setTimeout(() => {
    //         computerContent.style.opacity = '1';
    //         // Start the progress bar animation again
    //         this.progressBarInterval = window.setInterval(() => {
    //             this.progressBarProgress += 1;
    //             if (this.progressBarProgress >= 100) {
    //                 this.progressBarProgress = 100;
    //                 clearInterval(this.progressBarInterval!);
    //                 this.progressBarInterval = null;
    //                 // Fade out the running state
    //                 this.fadeOutRunningState();
    //             } else {
    //                 this.updateComputerContent();
    //             }
    //         }, 20);
    //     }, 10);
    // }
    // private setComputerState(state: ComputerState): void {
    //     this.computerState = state;
    //     this.updateComputerContent();
    // }
    updateComputerContent() {
        // this.computerContent.className = `computer-content ${this.computerState}`;
        // Ensure opacity is set to 1 for content updates (fade transitions are handled separately)
        // this.computerContent.style.opacity = '1';
        // Calculate the computer icon size based on the content boundary width of the current hexagon icon
        // const currentIcon = this.icons[this.currentIconIndex];
        // const contentBoundary = this.contentBoundaries[this.currentIconIndex];
        // const computerIconSize = contentBoundary ? contentBoundary.width * 2 : 342; // 2x the content boundary width
        // For completed state (check icon), use the checkmark
        // if (this.computerState === 'completed') {
        //     this.computerContent.innerHTML = `
        //         <div class="computer-icon-container" style="position: relative; display: flex; align-items: center; justify-content: center; width: 100%; height: 100%;">
        //             <div class="icon" style="width: 171px; height: 171px; display: flex; align-items: center; justify-content: center;">
        //                 <svg width="${computerIconSize}" height="${computerIconSize}" viewBox="0 0 ${computerIconSize} ${computerIconSize}" fill="none" xmlns="http://www.w3.org/2000/svg">
        //                     <g transform="scale(${computerIconSize/290})">
        //                         <g filter="url(#filter0_f_0_1)">
        //                             <path d="M179.801 88H110.433C98.4268 88 88.6937 97.733 88.6937 109.739V179.108C88.6937 191.114 98.4268 200.847 110.433 200.847H179.801C191.808 200.847 201.541 191.114 201.541 179.108V109.739C201.541 97.733 191.808 88 179.801 88Z" fill="url(#paint0_linear_0_1)"/>
        //                         </g>
        //                         <g filter="url(#filter1_d_0_1)">
        //                             <path d="M171.108 88H101.739C89.733 88 80 97.733 80 109.739V179.108C80 191.114 89.733 200.847 101.739 200.847H171.108C183.114 200.847 192.847 191.114 192.847 179.108V109.739C192.847 97.733 183.114 88 171.108 88Z" fill="url(#paint1_linear_0_1)"/>
        //                         </g>
        //                         <foreignObject x="98.1907" y="101.198" width="152.847" height="152.847"><div xmlns="http://www.w3.org/1999/xhtml" style="backdrop-filter:blur(9px);clip-path:url(#bgblur_0_0_1_clip_path);height:100%;width:100%"></div></foreignObject>
        //                         <path data-figma-bg-blur-radius="18" d="M209.298 120.198C221.857 120.198 232.037 130.378 232.037 142.937V212.305C232.037 224.864 221.857 235.044 209.298 235.044H139.93C127.371 235.044 117.191 224.864 117.191 212.305V142.937C117.191 130.378 127.371 120.198 139.93 120.198H209.298Z" fill="url(#paint2_linear_0_1)" stroke="url(#paint3_linear_0_1)" stroke-width="2"/>
        //                         <path d="M211.828 164.216C213.289 165.556 213.399 167.841 212.074 169.319L180.896 204.11V204.11L180.896 204.113L171.306 214.814C169.981 216.292 167.724 216.404 166.263 215.064L155.683 205.355L137.172 188.368C135.711 187.028 135.601 184.743 136.925 183.265L144.119 175.236C145.444 173.758 147.702 173.646 149.162 174.987L165.029 189.548C166.49 190.888 168.747 190.777 170.072 189.299L198.854 157.186C200.178 155.708 202.436 155.596 203.897 156.937L211.828 164.216Z" fill="white"/>
        //                         <defs>
        //                             <filter id="filter0_f_0_1" x="0.693726" y="0" width="288.847" height="288.847" filterUnits="userSpaceOnUse" color-interpolation-filters="sRGB">
        //                                 <feFlood flood-opacity="0" result="BackgroundImageFix"/>
        //                                 <feBlend mode="normal" in="SourceGraphic" in2="BackgroundImageFix" result="shape"/>
        //                                 <feGaussianBlur stdDeviation="44" result="effect1_foregroundBlur_0_1"/>
        //                             </filter>
        //                             <filter id="filter1_d_0_1" x="76" y="88" width="120.847" height="120.847" filterUnits="userSpaceOnUse" color-interpolation-filters="sRGB">
        //                                 <feFlood flood-opacity="0" result="BackgroundImageFix"/>
        //                                 <feColorMatrix in="SourceAlpha" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0" result="hardAlpha"/>
        //                                 <feOffset dy="4"/>
        //                                 <feGaussianBlur stdDeviation="2"/>
        //                                 <feComposite in2="hardAlpha" operator="out"/>
        //                                 <feColorMatrix type="matrix" values="0 0 0 0 0.767184 0 0 0 0 0.480556 0 0 0 0 0.480556 0 0 0 0.25 0"/>
        //                                 <feBlend mode="normal" in2="BackgroundImageFix" result="effect1_dropShadow_0_1"/>
        //                                 <feBlend mode="normal" in="SourceGraphic" in2="effect1_dropShadow_0_1" result="shape"/>
        //                             </filter>
        //                             <clipPath id="bgblur_0_0_1_clip_path" transform="translate(-98.1907 -101.198)"><path d="M209.298 120.198C221.857 120.198 232.037 130.378 232.037 142.937V212.305C232.037 224.864 221.857 235.044 209.298 235.044H139.93C127.371 235.044 117.191 224.864 117.191 212.305V142.937C117.191 130.378 127.371 120.198 139.93 120.198H209.298Z"/></clipPath>
        //                             <linearGradient id="paint0_linear_0_1" x1="193.472" y1="205.331" x2="97.9816" y2="85.054" gradientUnits="userSpaceOnUse">
        //                                 <stop stop-color="#38B32A"/>
        //                                 <stop offset="1" stop-color="#74D25D"/>
        //                             </linearGradient>
        //                             <linearGradient id="paint1_linear_0_1" x1="184.778" y1="205.331" x2="89.2878" y2="85.054" gradientUnits="userSpaceOnUse">
        //                                 <stop stop-color="#79D562"/>
        //                                 <stop offset="1" stop-color="#34B126"/>
        //                             </linearGradient>
        //                             <linearGradient id="paint2_linear_0_1" x1="124.562" y1="227.674" x2="224.667" y2="127.569" gradientUnits="userSpaceOnUse">
        //                                 <stop stop-color="white" stop-opacity="0.2"/>
        //                                 <stop offset="1" stop-color="white" stop-opacity="0.49"/>
        //                             </linearGradient>
        //                             <linearGradient id="paint3_linear_0_1" x1="126.156" y1="130.073" x2="220.486" y2="230.933" gradientUnits="userSpaceOnUse">
        //                                 <stop stop-color="white"/>
        //                                 <stop offset="1" stop-color="white" stop-opacity="0"/>
        //                             </linearGradient>
        //                         </defs>
        //                     </g>
        //                 </svg>
        //             </div>
        //         </div>
        //     `;
        //     return;
        // }
        // For detecting and running states, use the complete hexagon icons with their rectangles
        let iconHTML = '';
        // if (this.computerState === 'detecting') {
        //     // Create a clean copy of the hexagon icon without original positioning
        //     const iconClone = currentIcon.element.cloneNode(true) as HTMLElement;
        //     iconClone.style.position = 'relative';
        //     iconClone.style.left = '0';
        //     iconClone.style.top = '0';
        //     iconClone.style.transform = 'none';
        //     iconHTML = iconClone.outerHTML;
        // } else if (this.computerState === 'running') {
        //     const runningIcon = this.icons[this.currentIconIndex];
        //     // Create a clean copy of the hexagon icon without original positioning
        //     const iconClone = runningIcon.element.cloneNode(true) as HTMLElement;
        //     iconClone.style.position = 'relative';
        //     iconClone.style.left = '0';
        //     iconClone.style.top = '0';
        //     iconClone.style.transform = 'none';
        //     iconHTML = iconClone.outerHTML;
        // }
        // Get the visual center offset for proper centering (same as hexagon positioning)
        // const visualCenterOffset = this.getVisualCenterOffset(this.currentIconIndex);
        // Create the content with complete hexagon icons centered using the same logic as hexagon positioning
        // this.computerContent.innerHTML = `
        //     <div class="computer-icon-container" style="position: relative; display: flex; align-items: center; justify-content: center; width: 100%; height: 100%;">
        //         <div style="width: 171px; height: 171px; display: flex; align-items: center; justify-content: center; position: relative;">
        //             <div style="position: absolute; left: ${85.5 - visualCenterOffset.x}px; top: ${85.5 - visualCenterOffset.y}px;">
        //                 ${iconHTML}
        //             </div>
        //         </div>
        //     </div>
        //     ${this.computerState === 'running' ? `
        //     <div class="computer-progress-container">
        //         <div class="computer-progress-bar">
        //             <div class="computer-progress-fill" style="width: ${this.progressBarProgress}%"></div>
        //         </div>
        //     </div>
        //     ` : ''}
        // `;
    }
    startTypingAnimation(lineElement, lineIndex) {
        // Remove typing animation - lines will appear as complete lines
        // This method is kept for compatibility but does nothing
    }
    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}
let animation;
document.addEventListener('DOMContentLoaded', () => {
    animation = new ValinorAnimation();
    setTimeout(() => {
        animation.updateStatus('Click "Start Animation" to begin');
    }, 500);
});
function startAnimation() {
    if (animation) {
        animation.startAnimation();
    }
}
function resetAnimation() {
    if (animation) {
        animation.resetAnimation();
    }
}
export { ValinorAnimation };
//# sourceMappingURL=animation.js.map