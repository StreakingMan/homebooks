import { Viewport } from 'pixi-viewport';
import { Application, Container, Graphics, Sprite, Text, TextStyle, Texture, type FederatedPointerEvent } from 'pixi.js';
import { ref, watch, onUnmounted, type Ref } from 'vue';

// Types
interface Book {
  _id: string;
  title: string;
  author?: string;
  isbn?: string;
  img?: string;
  pages?: string | number;
  position?: {
    row: number;
    col: number;
    order?: number;
  };
}

interface WallConfig {
  rows: number;
  cols: number;
  name: string;
}

interface Cell {
  id: string;
  row: number;
  col: number;
  books: Book[];
}

interface UsePixiBookWallOptions {
  cells: Ref<Cell[]>;
  config: Ref<WallConfig | null>;
  onBookClick?: (book: Book) => void;
  onBookDrop?: (book: Book, newPosition: { row: number; col: number; order: number }) => void;
}

// Color palette for book spines
const SPINE_COLORS = [
  0x7f1d1d, // red-900
  0x991b1b, // red-800
  0x1e3a8a, // blue-900
  0x1e40af, // blue-800
  0x14532d, // green-900
  0x166534, // green-800
  0x78350f, // amber-900
  0x92400e, // amber-800
  0x1e293b, // slate-800
  0x334155, // slate-700
  0x292524, // stone-800
  0x44403c, // stone-700
  0x312e81, // indigo-900
  0x581c87, // purple-900
];

// Hash function for consistent random values
function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  return Math.abs(hash);
}

// Get spine color based on title
function getSpineColor(title: string): number {
  const hash = hashString(title || 'Unknown');
  return SPINE_COLORS[hash % SPINE_COLORS.length] ?? 0x5d4037;
}

// Get spine height percentage (85-100%)
function getSpineHeightPercent(title: string): number {
  const hash = hashString(title || 'Unknown');
  return 85 + (hash % 16);
}

// Get spine width based on pages or random
function getSpineWidth(book: Book): number {
  const pages = parseInt(String(book.pages || '').replace(/[^\d]/g, ''), 10);
  if (!isNaN(pages) && pages > 0) {
    return Math.min(Math.max(Math.floor(pages / 15), 16), 50);
  }
  // Random width based on title hash
  const widths = [24, 28, 32, 36] as const;
  const hash = hashString(book.title || 'Unknown');
  return widths[hash % widths.length] ?? 28;
}

export function usePixiBookWall(containerRef: Ref<HTMLElement | null>, options: UsePixiBookWallOptions) {
  const { cells, config, onBookDrop } = options;

  let app: Application | null = null;
  let viewport: Viewport | null = null;
  let shelfContainer: Container | null = null;
  let booksContainer: Container | null = null;

  // Drag state
  let draggedBook: { sprite: Container; book: Book; originalPos: { x: number; y: number }; originalCell: Cell } | null = null;
  let dropPreview: Graphics | null = null;

  // Layout constants
  const CELL_PADDING = 8;
  const CELL_GAP = 12; // Gap between cells (wood frame width)
  const BOOK_GAP = 2;
  const FRAME_WIDTH = 12; // Wood frame thickness
  const TOP_SAFE_AREA = 80; // TopBar safe area
  const BOTTOM_SAFE_AREA = 120; // ChatBar safe area

  // Computed cell dimensions
  const cellWidth = ref(160);
  const cellHeight = ref(90); // 16:9 aspect ratio

  const isInitialized = ref(false);

  // Calculate cell dimensions based on config
  function updateCellDimensions() {
    if (!config.value || !containerRef.value) return;

    const container = containerRef.value;
    // Account for frame on both sides and safe areas
    const availableW = container.clientWidth - FRAME_WIDTH * 2 - 100;
    const availableH = container.clientHeight - FRAME_WIDTH * 2 - TOP_SAFE_AREA - BOTTOM_SAFE_AREA;

    const { cols, rows } = config.value;

    // Calculate max cell width based on width constraint
    const wByWidth = (availableW - (cols - 1) * CELL_GAP) / cols;

    // Calculate max cell width based on height constraint (16:9 aspect)
    const wByHeight = ((availableH - (rows - 1) * CELL_GAP) / rows) * (16 / 9);

    // Choose smaller to fit both constraints
    const newCellWidth = Math.min(wByWidth, wByHeight);
    cellWidth.value = Math.max(newCellWidth, 80); // Min 80px
    cellHeight.value = (cellWidth.value * 9) / 16;
  }

  // Animation state for each book sprite
  interface BookAnimationState {
    targetScale: number;
    targetY: number;
    isHovered: boolean;
    popoverProgress: number; // 0 = hidden, 1 = fully visible
    targetPopover: number;
  }

  // Load image via proxy and return Texture for PixiJS
  async function loadImageTexture(url: string): Promise<Texture | null> {
    if (!url) return null;
    try {
      const proxyUrl = url.startsWith('/') || url.startsWith('data:') ? url : `/api/proxy/image?url=${encodeURIComponent(url)}`;
      const response = await fetch(proxyUrl);
      if (!response.ok) return null;
      const blob = await response.blob();
      const blobUrl = URL.createObjectURL(blob);

      return new Promise((resolve) => {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.onload = () => {
          const texture = Texture.from(img);
          URL.revokeObjectURL(blobUrl);
          resolve(texture);
        };
        img.onerror = () => {
          URL.revokeObjectURL(blobUrl);
          resolve(null);
        };
        img.src = blobUrl;
      });
    } catch {
      return null;
    }
  }

  // Create a book spine sprite with popover cover effect
  function createBookSprite(book: Book, maxHeight: number): Container {
    const container = new Container();
    container.eventMode = 'passive'; // Container doesn't handle events

    const width = getSpineWidth(book);
    const heightPercent = getSpineHeightPercent(book.title);
    const height = (maxHeight * heightPercent) / 100;
    const color = getSpineColor(book.title);

    // Cover dimensions (popover size)
    const coverWidth = Math.max(width * 3, 80);
    const coverHeight = height * 1.2;

    // Animation state
    const animState: BookAnimationState = {
      targetScale: 1,
      targetY: 0,
      isHovered: false,
      popoverProgress: 0,
      targetPopover: 0,
    };
    const animSpeed = 0.12;
    const popoverSpeed = 0.18;

    // === Spine Container (handles events) ===
    const spineContainer = new Container();
    spineContainer.eventMode = 'static';
    spineContainer.cursor = 'pointer';

    // Main spine rectangle
    const spine = new Graphics();
    spine.roundRect(0, 0, width, height, 2);
    spine.fill(color);

    // Decorative lines
    const decoTop = new Graphics();
    decoTop.rect(0, 8, width, 1);
    decoTop.fill({ color: 0xffffff, alpha: 0.2 });

    const decoBottom = new Graphics();
    decoBottom.rect(0, height - 16, width, 1);
    decoBottom.fill({ color: 0xffffff, alpha: 0.2 });

    // Title text - vertical Chinese (each character on new line)
    const titleText = book.title || 'Unknown';
    const maxChars = Math.floor((height - 20) / 14);
    const displayTitle = titleText.length > maxChars ? titleText.slice(0, maxChars - 1) + '…' : titleText;
    const verticalTitle = displayTitle.split('').join('\n');

    const titleStyle = new TextStyle({
      fontFamily: '"Noto Serif SC", "Source Han Serif CN", serif',
      fontSize: 12,
      fill: 0xffffff,
      align: 'center',
      lineHeight: 14,
    });

    const title = new Text({ text: verticalTitle, style: titleStyle });
    title.resolution = 2; // High resolution for sharp text
    title.anchor.set(0.5, 0);
    title.x = width / 2;
    title.y = 10;
    title.alpha = 0.9;

    spineContainer.addChild(spine, decoTop, decoBottom, title);

    // === Popover Cover Container (appears on hover) ===
    const popoverContainer = new Container();
    popoverContainer.eventMode = 'none'; // Don't intercept events
    popoverContainer.alpha = 0;
    popoverContainer.scale.set(0.8);
    popoverContainer.x = width / 2 - coverWidth / 2;
    popoverContainer.y = -coverHeight - 10;

    // Shadow
    const shadow = new Graphics();
    shadow.roundRect(4, 4, coverWidth, coverHeight, 6);
    shadow.fill({ color: 0x000000, alpha: 0.3 });
    popoverContainer.addChild(shadow);

    // Cover background
    const coverBg = new Graphics();
    coverBg.roundRect(0, 0, coverWidth, coverHeight, 6);
    coverBg.fill(0x2a2a2a);
    coverBg.roundRect(0, 0, coverWidth, coverHeight, 6);
    coverBg.stroke({ color: 0x444444, width: 1 });
    popoverContainer.addChild(coverBg);

    // Loading text
    const loadingText = new Text({
      text: '...',
      style: new TextStyle({ fontFamily: 'sans-serif', fontSize: 14, fill: 0x666666 }),
    });
    loadingText.anchor.set(0.5, 0.5);
    loadingText.x = coverWidth / 2;
    loadingText.y = coverHeight / 2;
    popoverContainer.addChild(loadingText);

    // Load cover image
    if (book.img) {
      loadImageTexture(book.img)
        .then((texture) => {
          if (!texture || !texture.width || !texture.height) {
            popoverContainer.removeChild(loadingText);
            showFallbackTitle();
            return;
          }
          popoverContainer.removeChild(loadingText);
          const coverSprite = new Sprite(texture);
          const imgAspect = texture.width / texture.height;
          const coverAspect = (coverWidth - 8) / (coverHeight - 8);
          if (imgAspect > coverAspect) {
            coverSprite.width = coverWidth - 8;
            coverSprite.height = (coverWidth - 8) / imgAspect;
          } else {
            coverSprite.height = coverHeight - 8;
            coverSprite.width = (coverHeight - 8) * imgAspect;
          }
          coverSprite.x = (coverWidth - coverSprite.width) / 2;
          coverSprite.y = (coverHeight - coverSprite.height) / 2;
          popoverContainer.addChild(coverSprite);
        })
        .catch(() => {
          popoverContainer.removeChild(loadingText);
          showFallbackTitle();
        });
    } else {
      popoverContainer.removeChild(loadingText);
      showFallbackTitle();
    }

    function showFallbackTitle() {
      const coverTitle = new Text({
        text: titleText,
        style: new TextStyle({
          fontFamily: '"Noto Serif SC", serif',
          fontSize: 12,
          fill: 0xcccccc,
          wordWrap: true,
          wordWrapWidth: coverWidth - 16,
          align: 'center',
        }),
      });
      coverTitle.resolution = 2;
      coverTitle.anchor.set(0.5, 0.5);
      coverTitle.x = coverWidth / 2;
      coverTitle.y = coverHeight / 2;
      popoverContainer.addChild(coverTitle);
    }

    // Add to container
    container.addChild(spineContainer, popoverContainer);

    // Position from bottom
    container.pivot.y = height;

    // Store book data
    (container as any).bookData = book;
    (container as any).originalWidth = width;
    (container as any).originalHeight = height;
    (container as any).animState = animState;

    // Animation ticker callback
    const tickerCallback = () => {
      // Smooth scale animation
      const scaleDiff = animState.targetScale - spineContainer.scale.x;
      if (Math.abs(scaleDiff) > 0.001) {
        spineContainer.scale.set(spineContainer.scale.x + scaleDiff * animSpeed);
      }

      // Smooth Y position animation
      const currentTargetY = animState.isHovered ? -8 : 0;
      const yDiff = currentTargetY - animState.targetY;
      if (Math.abs(yDiff) > 0.1) {
        animState.targetY += yDiff * animSpeed;
        const baseY = (container as any)._baseY || container.y;
        if (!(container as any)._baseY) (container as any)._baseY = container.y;
        container.y = baseY + animState.targetY;
      }

      // Popover animation (scale + opacity)
      const popoverDiff = animState.targetPopover - animState.popoverProgress;
      if (Math.abs(popoverDiff) > 0.01) {
        animState.popoverProgress += popoverDiff * popoverSpeed;
        const eased = 1 - Math.pow(1 - animState.popoverProgress, 3);
        popoverContainer.alpha = eased;
        popoverContainer.scale.set(0.8 + 0.2 * eased);
        popoverContainer.y = -coverHeight - 10 + (1 - eased) * 15;
      }
    };

    // Register ticker
    if (app) {
      app.ticker.add(tickerCallback);
      (container as any)._tickerCallback = tickerCallback;
    }

    // Click handler
    spineContainer.on('pointerdown', (e: FederatedPointerEvent) => {
      if (e.button === 0) {
        startDrag(container, book, e);
      }
    });

    // Hover effects - show popover
    spineContainer.on('pointerover', () => {
      if (!draggedBook) {
        animState.isHovered = true;
        animState.targetScale = 1.05;
        animState.targetPopover = 1;
      }
    });

    spineContainer.on('pointerout', () => {
      if (!draggedBook || draggedBook.sprite !== container) {
        animState.isHovered = false;
        animState.targetScale = 1;
        animState.targetPopover = 0;
      }
    });

    return container;
  }

  // Cleanup ticker callback when book sprite is removed
  function cleanupBookSprite(sprite: Container) {
    const callback = (sprite as any)._tickerCallback;
    if (callback && app) {
      app.ticker.remove(callback);
    }
  }

  // Start dragging a book
  function startDrag(sprite: Container, book: Book, _e: FederatedPointerEvent) {
    if (!viewport || !booksContainer) return;

    // Find the cell this book belongs to
    const cell = cells.value.find((c) => book.position && c.row === book.position.row && c.col === book.position.col);
    if (!cell) return;

    draggedBook = {
      sprite,
      book,
      originalPos: { x: sprite.x, y: sprite.y },
      originalCell: cell,
    };

    // Move to top
    booksContainer.removeChild(sprite);
    booksContainer.addChild(sprite);

    // Create drop preview
    dropPreview = new Graphics();
    dropPreview.rect(0, 0, (sprite as any).originalWidth, (sprite as any).originalHeight);
    dropPreview.fill({ color: 0x22d3ee, alpha: 0.3 });
    dropPreview.stroke({ color: 0x22d3ee, width: 2 });
    dropPreview.visible = false;
    booksContainer.addChildAt(dropPreview, 0);

    // Disable viewport drag
    viewport.pause = true;

    // Add move and up listeners
    viewport.on('pointermove', onDragMove);
    viewport.on('pointerup', onDragEnd);
    viewport.on('pointerupoutside', onDragEnd);
  }

  // Handle drag move
  function onDragMove(e: FederatedPointerEvent) {
    if (!draggedBook || !viewport || !shelfContainer) return;

    const pos = viewport.toWorld(e.global);
    draggedBook.sprite.x = pos.x - (draggedBook.sprite as any).originalWidth / 2;
    draggedBook.sprite.y = pos.y;

    // Find target cell
    const targetCell = findCellAtPosition(pos.x, pos.y);
    if (targetCell && dropPreview) {
      const cellPos = getCellPosition(targetCell.row, targetCell.col);
      const insertIndex = calculateInsertIndex(targetCell, pos.x);

      // Position drop preview
      let previewX = cellPos.x + CELL_PADDING;
      for (let i = 0; i < insertIndex; i++) {
        const b = targetCell.books[i];
        if (b && b._id !== draggedBook.book._id) {
          previewX += getSpineWidth(b) + BOOK_GAP;
        }
      }

      dropPreview.x = previewX;
      dropPreview.y = cellPos.y + cellHeight.value - CELL_PADDING - (draggedBook.sprite as any).originalHeight;
      dropPreview.visible = true;
    } else if (dropPreview) {
      dropPreview.visible = false;
    }
  }

  // Handle drag end
  function onDragEnd(e: FederatedPointerEvent) {
    if (!draggedBook || !viewport || !booksContainer) return;

    const pos = viewport.toWorld(e.global);
    const targetCell = findCellAtPosition(pos.x, pos.y);

    if (targetCell) {
      const insertIndex = calculateInsertIndex(targetCell, pos.x);
      onBookDrop?.(draggedBook.book, {
        row: targetCell.row,
        col: targetCell.col,
        order: insertIndex,
      });
    } else {
      // Return to original position
      draggedBook.sprite.x = draggedBook.originalPos.x;
      draggedBook.sprite.y = draggedBook.originalPos.y;
    }

    // Cleanup
    if (dropPreview) {
      booksContainer.removeChild(dropPreview);
      dropPreview.destroy();
      dropPreview = null;
    }

    viewport.off('pointermove', onDragMove);
    viewport.off('pointerup', onDragEnd);
    viewport.off('pointerupoutside', onDragEnd);
    viewport.pause = false;

    draggedBook = null;

    // Re-render to update positions
    renderBooks();
  }

  // Find cell at world position
  function findCellAtPosition(x: number, y: number): Cell | null {
    if (!config.value) return null;

    for (const cell of cells.value) {
      const pos = getCellPosition(cell.row, cell.col);
      if (x >= pos.x && x <= pos.x + cellWidth.value && y >= pos.y && y <= pos.y + cellHeight.value) {
        return cell;
      }
    }
    return null;
  }

  // Calculate insert index based on x position within cell
  function calculateInsertIndex(cell: Cell, worldX: number): number {
    const cellPos = getCellPosition(cell.row, cell.col);
    const relativeX = worldX - cellPos.x - CELL_PADDING;

    let accumulatedWidth = 0;
    for (let i = 0; i < cell.books.length; i++) {
      const book = cell.books[i];
      if (!book) continue;
      const bookWidth = getSpineWidth(book);
      if (relativeX < accumulatedWidth + bookWidth / 2) {
        return i;
      }
      accumulatedWidth += bookWidth + BOOK_GAP;
    }
    return cell.books.length;
  }

  // Get cell position in world coordinates (offset by frame width)
  function getCellPosition(row: number, col: number): { x: number; y: number } {
    return {
      x: FRAME_WIDTH + col * (cellWidth.value + CELL_GAP),
      y: FRAME_WIDTH + row * (cellHeight.value + CELL_GAP),
    };
  }

  // Walnut wood colors
  const WALNUT_COLORS = {
    main: 0x5d4037, // Main walnut brown
    highlight: 0x8d6e63, // Wood grain highlight
    shadow: 0x3e2723, // Wood grain shadow
    cellBg: 0x2d1f1a, // Cell background (dark)
    cellInner: 0x1a1210, // Inner shadow
  };

  // Draw wood grain texture on a graphics object
  function drawWoodGrain(g: Graphics, x: number, y: number, width: number, height: number, isVertical: boolean) {
    // Base wood color
    g.rect(x, y, width, height);
    g.fill(WALNUT_COLORS.main);

    // Wood grain lines
    const grainCount = isVertical ? Math.floor(height / 8) : Math.floor(width / 8);
    for (let i = 0; i < grainCount; i++) {
      const offset = i * 8 + Math.random() * 4;
      const grainWidth = 1 + Math.random() * 2;
      const alpha = 0.1 + Math.random() * 0.15;

      if (isVertical) {
        // Vertical grain lines
        const grainX = x + 2 + Math.random() * (width - 4);
        g.rect(grainX, y + offset, grainWidth, 4 + Math.random() * 8);
        g.fill({ color: i % 2 === 0 ? WALNUT_COLORS.highlight : WALNUT_COLORS.shadow, alpha });
      } else {
        // Horizontal grain lines
        const grainY = y + 2 + Math.random() * (height - 4);
        g.rect(x + offset, grainY, 4 + Math.random() * 8, grainWidth);
        g.fill({ color: i % 2 === 0 ? WALNUT_COLORS.highlight : WALNUT_COLORS.shadow, alpha });
      }
    }

    // Edge highlights and shadows for 3D effect
    // Top/Left highlight
    g.rect(x, y, isVertical ? width : 2, isVertical ? 2 : height);
    g.fill({ color: WALNUT_COLORS.highlight, alpha: 0.3 });

    // Bottom/Right shadow
    if (isVertical) {
      g.rect(x, y + height - 2, width, 2);
    } else {
      g.rect(x + width - 2, y, 2, height);
    }
    g.fill({ color: WALNUT_COLORS.shadow, alpha: 0.4 });
  }

  // Render shelf grid with walnut wood frame
  function renderShelves() {
    if (!shelfContainer || !config.value) return;

    shelfContainer.removeChildren();

    const { rows, cols } = config.value;
    const totalWidth = cols * (cellWidth.value + CELL_GAP) + FRAME_WIDTH;
    const totalHeight = rows * (cellHeight.value + CELL_GAP) + FRAME_WIDTH;

    // Draw cell backgrounds first (dark recessed areas)
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const pos = getCellPosition(r, c);

        // Cell background (recessed dark area)
        const cellBg = new Graphics();
        cellBg.roundRect(pos.x, pos.y, cellWidth.value, cellHeight.value, 2);
        cellBg.fill(WALNUT_COLORS.cellBg);

        // Inner shadow effect (top and left darker)
        const innerShadow = new Graphics();
        innerShadow.rect(pos.x, pos.y, cellWidth.value, 3);
        innerShadow.fill({ color: WALNUT_COLORS.cellInner, alpha: 0.6 });
        innerShadow.rect(pos.x, pos.y, 3, cellHeight.value);
        innerShadow.fill({ color: WALNUT_COLORS.cellInner, alpha: 0.4 });

        // Bottom highlight (shelf reflection)
        const bottomHighlight = new Graphics();
        bottomHighlight.rect(pos.x, pos.y + cellHeight.value - 2, cellWidth.value, 2);
        bottomHighlight.fill({ color: WALNUT_COLORS.highlight, alpha: 0.1 });

        shelfContainer.addChild(cellBg, innerShadow, bottomHighlight);
      }
    }

    // Draw horizontal beams (rows + 1)
    for (let r = 0; r <= rows; r++) {
      const beam = new Graphics();
      const beamY = r === 0 ? 0 : FRAME_WIDTH + r * (cellHeight.value + CELL_GAP) - CELL_GAP;
      const beamHeight = FRAME_WIDTH;

      drawWoodGrain(beam, 0, beamY, totalWidth, beamHeight, false);
      shelfContainer.addChild(beam);
    }

    // Draw vertical pillars (cols + 1)
    for (let c = 0; c <= cols; c++) {
      const pillar = new Graphics();
      const pillarX = c === 0 ? 0 : FRAME_WIDTH + c * (cellWidth.value + CELL_GAP) - CELL_GAP;
      const pillarWidth = FRAME_WIDTH;

      drawWoodGrain(pillar, pillarX, 0, pillarWidth, totalHeight, true);

      // Draw joint decorations at intersections
      for (let r = 0; r <= rows; r++) {
        const jointY = r === 0 ? 0 : FRAME_WIDTH + r * (cellHeight.value + CELL_GAP) - CELL_GAP;
        const joint = new Graphics();
        joint.roundRect(pillarX + 1, jointY + 1, pillarWidth - 2, FRAME_WIDTH - 2, 1);
        joint.fill({ color: WALNUT_COLORS.shadow, alpha: 0.3 });
        shelfContainer.addChild(joint);
      }

      shelfContainer.addChild(pillar);
    }

    // Outer frame shadow (for depth)
    const outerShadow = new Graphics();
    outerShadow.rect(-4, -4, totalWidth + 8, totalHeight + 8);
    outerShadow.fill({ color: 0x000000, alpha: 0 });
    outerShadow.stroke({ color: 0x000000, alpha: 0.3, width: 8 });
    shelfContainer.addChildAt(outerShadow, 0);
  }

  // Render all books
  function renderBooks() {
    if (!booksContainer || !config.value) return;

    // Cleanup old book sprites (remove ticker callbacks)
    for (const child of booksContainer.children) {
      cleanupBookSprite(child as Container);
    }
    booksContainer.removeChildren();

    for (const cell of cells.value) {
      const cellPos = getCellPosition(cell.row, cell.col);
      const maxBookHeight = cellHeight.value - CELL_PADDING * 2;

      let xOffset = cellPos.x + CELL_PADDING;

      for (const book of cell.books) {
        const bookSprite = createBookSprite(book, maxBookHeight);
        bookSprite.x = xOffset;
        bookSprite.y = cellPos.y + cellHeight.value - CELL_PADDING;

        booksContainer.addChild(bookSprite);

        xOffset += (bookSprite as any).originalWidth + BOOK_GAP;
      }
    }
  }

  // Initialize PixiJS application
  async function init() {
    if (!containerRef.value || isInitialized.value) return;

    const container = containerRef.value;

    // Create application
    app = new Application();
    await app.init({
      background: 0x2d1f1a, // Dark walnut background
      resizeTo: container,
      antialias: true,
      resolution: window.devicePixelRatio || 1,
      autoDensity: true,
    });

    container.appendChild(app.canvas);

    // Calculate initial dimensions
    updateCellDimensions();

    // Calculate content size (including frame)
    const contentWidth = config.value ? config.value.cols * (cellWidth.value + CELL_GAP) + FRAME_WIDTH : 800;
    const contentHeight = config.value ? config.value.rows * (cellHeight.value + CELL_GAP) + FRAME_WIDTH : 600;

    // Create viewport
    viewport = new Viewport({
      screenWidth: container.clientWidth,
      screenHeight: container.clientHeight,
      worldWidth: contentWidth + 100,
      worldHeight: contentHeight + 100,
      events: app.renderer.events,
    });

    app.stage.addChild(viewport);

    // Enable interactions - no position clamping, only zoom limits
    viewport.drag().pinch().wheel({ smooth: 3 }).decelerate({ friction: 0.95 }).clampZoom({
      minScale: 0.3,
      maxScale: 2.5,
    });

    // Create containers
    shelfContainer = new Container();
    booksContainer = new Container();

    viewport.addChild(shelfContainer);
    viewport.addChild(booksContainer);

    // Initial render
    renderShelves();
    renderBooks();

    // Fit content to screen
    viewport.fit();
    viewport.moveCenter(contentWidth / 2, contentHeight / 2);

    isInitialized.value = true;
  }

  // Handle resize
  function onResize() {
    if (!app || !viewport || !containerRef.value) return;

    const container = containerRef.value;
    viewport.resize(container.clientWidth, container.clientHeight);

    updateCellDimensions();

    const contentWidth = config.value ? config.value.cols * (cellWidth.value + CELL_GAP) + FRAME_WIDTH : 800;
    const contentHeight = config.value ? config.value.rows * (cellHeight.value + CELL_GAP) + FRAME_WIDTH : 600;

    viewport.worldWidth = contentWidth + 100;
    viewport.worldHeight = contentHeight + 100;

    // Update world size for bounce
    viewport.worldWidth = contentWidth + 100;
    viewport.worldHeight = contentHeight + 100;

    renderShelves();
    renderBooks();
  }

  // Cleanup
  function destroy() {
    if (app) {
      app.destroy(true, { children: true, texture: true });
      app = null;
    }
    viewport = null;
    shelfContainer = null;
    booksContainer = null;
    isInitialized.value = false;
  }

  // Watch for data changes
  watch(
    cells,
    () => {
      if (isInitialized.value) {
        renderBooks();
      }
    },
    { deep: true },
  );

  watch(config, () => {
    if (isInitialized.value) {
      updateCellDimensions();
      renderShelves();
      renderBooks();
    }
  });

  // Setup resize listener
  if (typeof window !== 'undefined') {
    window.addEventListener('resize', onResize);
  }

  onUnmounted(() => {
    if (typeof window !== 'undefined') {
      window.removeEventListener('resize', onResize);
    }
    destroy();
  });

  return {
    init,
    destroy,
    isInitialized,
  };
}
