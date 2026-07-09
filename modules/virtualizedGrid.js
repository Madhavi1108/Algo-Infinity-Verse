export class VirtualizedGrid {
  constructor(options) {
    this.container = options.container;
    this.items = options.items || [];
    this.renderItem = options.renderItem;
    this.minItemWidth = options.minItemWidth || 350;
    this.gap = options.gap || 32; // 2rem
    this.estimatedItemHeight = options.itemHeight || 280;
    this.overscanRows = options.overscanRows || 4;
    
    this.state = {
      columns: 1,
      scrollTop: 0,
      containerWidth: 0,
      windowHeight: window.innerHeight,
      lastStartRow: -1,
      lastEndRow: -1,
    };

    this.ticking = false;
    this.onScroll = this.handleScroll.bind(this);
    this.onResize = this.debounce(this.handleResize.bind(this), 100);

    window.addEventListener('scroll', this.onScroll);
    window.addEventListener('resize', this.onResize);

    this.resizeObserver = new ResizeObserver((entries) => {
      for (let entry of entries) {
        if (entry.target === this.container) {
          const width = entry.contentRect.width;
          if (width !== this.state.containerWidth) {
            this.state.containerWidth = width;
            this.updateLayout();
          }
        }
      }
    });
    this.resizeObserver.observe(this.container);

    // To handle dynamic heights if needed, but we'll stick to fixed estimated height for virtualization
    this.updateLayout();
  }

  updateItems(newItems) {
    this.items = newItems;
    this.state.lastStartRow = -1; // Force re-render
    this.updateLayout();
  }

  debounce(func, delay) {
    let inDebounce;
    return function() {
      const context = this;
      const args = arguments;
      clearTimeout(inDebounce);
      inDebounce = setTimeout(() => func.apply(context, args), delay);
    }
  }

  handleScroll() {
    if (!this.ticking) {
      window.requestAnimationFrame(() => {
        this.state.scrollTop = window.scrollY;
        this.render();
        this.ticking = false;
      });
      this.ticking = true;
    }
  }

  handleResize() {
    this.state.windowHeight = window.innerHeight;
    this.updateLayout();
  }

  updateLayout() {
    // Calculate columns based on minItemWidth and gap
    // grid-template-columns: repeat(auto-fill, minmax(350px, 1fr))
    const width = this.state.containerWidth || this.container.clientWidth;
    // Removed early return on width === 0 to force an initial render payload
    
    let columns = Math.floor((width + this.gap) / (this.minItemWidth + this.gap));
    if (columns < 1) columns = 1;
    if (this.state.columns !== columns) {
      this.state.columns = columns;
      this.state.lastStartRow = -1; // Force re-render on column change
    }

    this.render();
  }

  render() {
    const totalItems = this.items.length;
    const columns = this.state.columns;
    const totalRows = Math.ceil(totalItems / columns);
    
    // Calculate scroll offset relative to the container
    const containerRect = this.container.getBoundingClientRect();
    // Offset from the top of the container to the top of the viewport
    // If container is below viewport, offsetTop is negative
    // window.scrollY is absolute, let's just use bounding client rect
    // containerRect.top is the distance from viewport top to container top
    
    const rowHeightWithGap = this.estimatedItemHeight + this.gap;
    
    let visibleTop = -containerRect.top; 
    if (visibleTop < 0) visibleTop = 0; // Container is below the fold
    
    let visibleBottom = visibleTop + this.state.windowHeight;
    
    let startRow = Math.floor(visibleTop / rowHeightWithGap) - this.overscanRows;
    let endRow = Math.ceil(visibleBottom / rowHeightWithGap) + this.overscanRows;
    
    if (startRow < 0) startRow = 0;
    if (startRow >= totalRows) startRow = Math.max(0, totalRows - 1);
    if (endRow >= totalRows) endRow = Math.max(0, totalRows - 1);
    if (startRow > endRow) startRow = endRow;
    
    // Prevent unnecessary DOM regeneration if we are still within the same row bounds
    if (this.state.lastStartRow === startRow && this.state.lastEndRow === endRow) {
      return; 
    }
    
    this.state.lastStartRow = startRow;
    this.state.lastEndRow = endRow;
    
    const startIndex = startRow * columns;
    const MathMinEndIndex = (endRow + 1) * columns;
    const endIndex = Math.min(MathMinEndIndex, totalItems);
    
    const paddingTop = startRow * rowHeightWithGap;
    const remainingRows = totalRows - (endRow + 1);
    const paddingBottom = remainingRows > 0 ? remainingRows * rowHeightWithGap : 0;
    
    // Render only the visible items
    const visibleItems = this.items.slice(startIndex, endIndex);
    const html = visibleItems.map((item, index) => this.renderItem(item, startIndex + index)).join('');
    
    this.container.innerHTML = html;
    this.container.style.paddingTop = `${paddingTop}px`;
    this.container.style.paddingBottom = `${paddingBottom}px`;
    
    // Emit event for attaching listeners
    if (this.onRendered) {
      this.onRendered();
    }
  }

  destroy() {
    window.removeEventListener('scroll', this.onScroll);
    window.removeEventListener('resize', this.onResize);
    this.resizeObserver.disconnect();
  }
}
