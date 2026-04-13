#!/usr/bin/env node

/**
 * PlexIQ v4.0 - Terminal User Interface (TUI)
 * ProxMenux-inspired menu-driven interface
 *
 * Design Philosophy:
 * - Clean, dialog-based navigation (like ProxMenux)
 * - THE ONE SLIDER in ASCII form
 * - Keyboard-driven interaction
 * - Real-time status monitoring
 */

const blessed = require('blessed');
const contrib = require('blessed-contrib');

class PlexIQTUI {
  constructor() {
    this.threshold = 0.70;
    this.selectedLibrary = null;
    this.stats = null;

    this.initScreen();
    this.initComponents();
    this.render();
  }

  initScreen() {
    this.screen = blessed.screen({
      smartCSR: true,
      title: 'PlexIQ v4.0 - ProxMenux Edition',
      fullUnicode: true,
    });

    // Keyboard bindings
    this.screen.key(['escape', 'q', 'C-c'], () => {
      return process.exit(0);
    });
  }

  initComponents() {
    // Main container with gradient effect
    this.mainBox = blessed.box({
      parent: this.screen,
      top: 0,
      left: 0,
      width: '100%',
      height: '100%',
      style: {
        bg: 'black',
      },
    });

    // Header
    this.header = blessed.box({
      parent: this.mainBox,
      top: 0,
      left: 0,
      width: '100%',
      height: 3,
      content: '{center}{bold}PlexIQ v4.0{/bold} - ProxMenux Edition{/center}',
      tags: true,
      style: {
        fg: 'yellow',
        bg: '#1a1a1a',
        border: {
          fg: '#444444',
        },
      },
      border: {
        type: 'line',
        bottom: true,
      },
    });

    // Left Panel - Controls
    this.controlPanel = blessed.box({
      parent: this.mainBox,
      top: 3,
      left: 0,
      width: '40%',
      height: '100%-5',
      border: {
        type: 'line',
      },
      style: {
        fg: 'white',
        bg: '#1a1a1a',
        border: {
          fg: '#444444',
        },
      },
      label: ' Controls ',
    });

    // Library Selection
    this.libraryLabel = blessed.text({
      parent: this.controlPanel,
      top: 1,
      left: 2,
      content: 'Select Library:',
      style: {
        fg: 'cyan',
        bold: true,
      },
    });

    this.libraryList = blessed.list({
      parent: this.controlPanel,
      top: 3,
      left: 2,
      width: '95%',
      height: 8,
      items: ['Movies', 'TV Shows', '4K Movies', 'Music'],
      keys: true,
      vi: true,
      mouse: true,
      border: {
        type: 'line',
      },
      style: {
        fg: 'white',
        bg: '#2a2a2a',
        border: {
          fg: '#555555',
        },
        selected: {
          bg: 'yellow',
          fg: 'black',
          bold: true,
        },
      },
    });

    this.libraryList.on('select', (item) => {
      this.selectedLibrary = item.getText();
      this.updateStatus();
    });

    // THE ONE SLIDER Section
    this.sliderLabel = blessed.text({
      parent: this.controlPanel,
      top: 12,
      left: 2,
      content: '{bold}THE ONE SLIDER{/bold}\nDeletion Threshold',
      tags: true,
      style: {
        fg: 'yellow',
        bold: true,
      },
    });

    this.sliderValue = blessed.text({
      parent: this.controlPanel,
      top: 15,
      left: 'center',
      content: `${this.threshold.toFixed(2)}`,
      style: {
        fg: 'yellow',
        bold: true,
      },
    });

    this.sliderBar = blessed.box({
      parent: this.controlPanel,
      top: 16,
      left: 2,
      width: '95%',
      height: 1,
      content: this.renderSlider(),
      style: {
        fg: 'yellow',
      },
    });

    this.sliderDesc = blessed.text({
      parent: this.controlPanel,
      top: 18,
      left: 2,
      width: '95%',
      content: this.getThresholdDescription(),
      style: {
        fg: 'gray',
      },
    });

    // Action Buttons
    this.analyzeButton = blessed.button({
      parent: this.controlPanel,
      top: 21,
      left: 2,
      width: '95%',
      height: 3,
      content: '{center}🔍  ANALYZE LIBRARY{/center}',
      tags: true,
      mouse: true,
      keys: true,
      shrink: true,
      border: {
        type: 'line',
      },
      style: {
        fg: 'black',
        bg: 'yellow',
        bold: true,
        border: {
          fg: 'yellow',
        },
        focus: {
          bg: 'white',
          fg: 'black',
        },
      },
    });

    this.analyzeButton.on('press', () => {
      this.runAnalysis();
    });

    this.dryRunButton = blessed.button({
      parent: this.controlPanel,
      top: 25,
      left: 2,
      width: '95%',
      height: 3,
      content: '{center}🗑️  DELETE (DRY RUN){/center}',
      tags: true,
      mouse: true,
      keys: true,
      border: {
        type: 'line',
      },
      style: {
        fg: 'white',
        bg: '#2a2a2a',
        border: {
          fg: '#555555',
        },
        focus: {
          bg: '#444444',
        },
      },
    });

    // Right Panel - Stats & Results
    this.statsPanel = blessed.box({
      parent: this.mainBox,
      top: 3,
      left: '40%',
      width: '60%',
      height: '100%-5',
      border: {
        type: 'line',
      },
      style: {
        fg: 'white',
        bg: '#1a1a1a',
        border: {
          fg: '#444444',
        },
      },
      label: ' Library Statistics ',
    });

    this.statsContent = blessed.box({
      parent: this.statsPanel,
      top: 1,
      left: 2,
      width: '95%',
      height: '100%-2',
      scrollable: true,
      alwaysScroll: true,
      keys: true,
      vi: true,
      mouse: true,
      scrollbar: {
        ch: ' ',
        track: {
          bg: '#2a2a2a',
        },
        style: {
          inverse: true,
        },
      },
      tags: true,
      content: this.renderWelcome(),
    });

    // Footer
    this.footer = blessed.box({
      parent: this.mainBox,
      bottom: 0,
      left: 0,
      width: '100%',
      height: 2,
      content: '{center}[↑↓] Navigate | [Enter] Select | [+/-] Adjust Slider | [Q] Quit{/center}',
      tags: true,
      style: {
        fg: 'gray',
        bg: '#1a1a1a',
        border: {
          fg: '#444444',
        },
      },
      border: {
        type: 'line',
        top: true,
      },
    });

    // Slider adjustment with +/- keys
    this.screen.key(['+', '='], () => {
      this.threshold = Math.min(1.0, this.threshold + 0.05);
      this.updateSlider();
    });

    this.screen.key(['-', '_'], () => {
      this.threshold = Math.max(0.0, this.threshold - 0.05);
      this.updateSlider();
    });
  }

  renderSlider() {
    const width = 50;
    const position = Math.floor(this.threshold * width);
    let bar = '';

    for (let i = 0; i < width; i++) {
      if (i === position) {
        bar += '●';
      } else if (i < position) {
        bar += '─';
      } else {
        bar += '─';
      }
    }

    return `0.0 ├${bar}┤ 1.0`;
  }

  getThresholdDescription() {
    if (this.threshold >= 0.8) return 'Very Aggressive - Delete most unwatched';
    if (this.threshold >= 0.7) return 'Aggressive - Recommended default';
    if (this.threshold >= 0.6) return 'Moderate - Balanced approach';
    if (this.threshold >= 0.5) return 'Conservative - Only obvious candidates';
    return 'Very Conservative - Minimal deletions';
  }

  updateSlider() {
    this.sliderValue.setContent(`${this.threshold.toFixed(2)}`);
    this.sliderBar.setContent(this.renderSlider());
    this.sliderDesc.setContent(this.getThresholdDescription());
    this.screen.render();
  }

  renderWelcome() {
    return `
{center}{bold}Welcome to PlexIQ v4.0{/bold}{/center}
{center}ProxMenux-Inspired Media Management{/center}

{yellow-fg}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━{/yellow-fg}

{bold}THE ONE SLIDER Philosophy{/bold}

Simple. Powerful. Beautiful.
Everything you need to manage your Plex library
intelligently. No complexity. No confusion.
Just results.

{yellow-fg}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━{/yellow-fg}

{bold}Getting Started:{/bold}

1. Select a library from the list
2. Adjust the deletion threshold (0.0-1.0)
3. Click "Analyze Library" to begin
4. Review recommendations
5. Run dry-run before deletion

{green-fg}🛡️  Safety First{/green-fg}
All operations default to dry-run.
Highly-rated content (≥8.0) never deleted.

{yellow-fg}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━{/yellow-fg}
`;
  }

  renderStats() {
    if (!this.stats) return this.renderWelcome();

    return `
{center}{bold}Library: ${this.stats.name}{/bold}{/center}

{yellow-fg}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━{/yellow-fg}

{bold}Library Statistics{/bold}

Total Items:          ${this.stats.itemCount.toLocaleString()}
Library Size:         ${this.formatSize(this.stats.totalSize)}
Average Score:        ${this.stats.avgScore.toFixed(2)}

{yellow-fg}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━{/yellow-fg}

{bold}{yellow-fg}Deletion Candidates{/yellow-fg}{/bold}

Items to Delete:      ${this.stats.deletionCandidates.toLocaleString()}
Potential Space:      {green-fg}${this.formatSize(this.stats.potentialSpaceSaved)}{/green-fg}

{yellow-fg}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━{/yellow-fg}

{bold}Top Recommendations:{/bold}

${this.renderTopItems()}

{yellow-fg}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━{/yellow-fg}
`;
  }

  renderTopItems() {
    const items = [
      { title: 'Unwatched Movie 1', score: 0.89, size: '2.4 GB' },
      { title: 'Old TV Show S01E01', score: 0.85, size: '1.2 GB' },
      { title: 'Low Rated Film', score: 0.82, size: '3.1 GB' },
      { title: 'Duplicate Content', score: 0.78, size: '2.8 GB' },
      { title: 'Ancient Recording', score: 0.75, size: '1.9 GB' },
    ];

    return items
      .map((item, i) => {
        return `${i + 1}. ${item.title.padEnd(25)} ${item.score.toFixed(2)}  ${item.size}`;
      })
      .join('\n');
  }

  formatSize(bytes) {
    const units = ['B', 'KB', 'MB', 'GB', 'TB'];
    let size = bytes;
    let unitIndex = 0;

    while (size >= 1024 && unitIndex < units.length - 1) {
      size /= 1024;
      unitIndex++;
    }

    return `${size.toFixed(2)} ${units[unitIndex]}`;
  }

  async runAnalysis() {
    if (!this.selectedLibrary) {
      this.statsContent.setContent('\n\n{center}{red-fg}Please select a library first!{/red-fg}{/center}');
      this.screen.render();
      return;
    }

    // Show progress
    this.statsContent.setContent(`
{center}{bold}Analyzing ${this.selectedLibrary}...{/bold}{/center}

{yellow-fg}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━{/yellow-fg}

🔍  Connecting to Plex server...
📊  Collecting metadata...
🎬  Enriching with external ratings...
🧮  Calculating deletion scores...

{yellow-fg}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━{/yellow-fg}

{center}Please wait...{/center}
`);
    this.screen.render();

    // Simulate analysis
    await new Promise(resolve => setTimeout(resolve, 3000));

    // Mock stats
    this.stats = {
      name: this.selectedLibrary,
      itemCount: 1247,
      totalSize: 5_432_109_876_543,
      avgScore: 0.65,
      deletionCandidates: 342,
      potentialSpaceSaved: 1_234_567_890_123,
    };

    this.statsContent.setContent(this.renderStats());
    this.screen.render();
  }

  updateStatus() {
    this.screen.render();
  }

  render() {
    this.screen.render();
  }
}

// Launch the TUI
console.log('Starting PlexIQ TUI v4.0...');
const app = new PlexIQTUI();
