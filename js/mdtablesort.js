// Initialize sorters on all tables once the DOM is loaded
document.addEventListener('DOMContentLoaded', initializeTableSorters);

function initializeTableSorters() {
  // Inject CSS styles including light/dark mode and hover effects
  injectSortStyles();

  // Select all tables on the page
  const tables = document.querySelectorAll('table');

  tables.forEach((table) => {
    // Identify header row: prefer a <thead> if available
    let headerRow = table.querySelector('thead tr');
    if (!headerRow) {
      headerRow = table.querySelector('tr');
    }
    if (!headerRow) return; // No header row found; skip this table

    // For each header cell, add sort control buttons
    const headerCells = headerRow.querySelectorAll('th, td');
    headerCells.forEach((cell, index) => {
      // Create a container for the sort buttons and assign a class for styling
      const sorterContainer = document.createElement('span');
      sorterContainer.className = 'sorter-container';

      // Create ascending sort button (▲)
      const ascButton = document.createElement('button');
      ascButton.textContent = '▲';
      ascButton.className = 'sort-button';
      ascButton.dataset.sortDirection = 'asc';

      // Create descending sort button (▼)
      const descButton = document.createElement('button');
      descButton.textContent = '▼';
      descButton.className = 'sort-button';
      descButton.dataset.sortDirection = 'desc';

      // Create unsort button (x) to clear sorting on that column
      const unsortButton = document.createElement('button');
      unsortButton.textContent = 'x';
      unsortButton.className = 'sort-button';
      unsortButton.dataset.sortDirection = 'none';

      // Add click event listeners to update sort state and re-sort the table
      ascButton.addEventListener('click', (e) => {
        // Prevent the header cell hover from hiding the buttons immediately
        e.stopPropagation();
        updateSortState(cell, 'asc', table);
      });
      descButton.addEventListener('click', (e) => {
        e.stopPropagation();
        updateSortState(cell, 'desc', table);
      });
      unsortButton.addEventListener('click', (e) => {
        e.stopPropagation();
        updateSortState(cell, 'none', table);
      });

      // Append the buttons to the container and then to the header cell
      sorterContainer.appendChild(ascButton);
      sorterContainer.appendChild(descButton);
      sorterContainer.appendChild(unsortButton);
      cell.appendChild(sorterContainer);

      // Set an initial sort state (none) and record the column index for later use
      cell.dataset.sortDirection = 'none';
      cell.dataset.columnIndex = index;
    });

    // Save the original order for the rows in the <tbody>
    const tbody = table.querySelector('tbody');
    if (tbody) {
      const rows = Array.from(tbody.querySelectorAll('tr'));
      rows.forEach((row, i) => {
        row.dataset.originalIndex = i;
      });
    }
  });
}

function injectSortStyles() {
  const style = document.createElement('style');
  style.textContent = `
  /* Container for the sort buttons */
  .sorter-container {
    float: right;
    font-size: 10px;
    margin-left: 4px;
  }
  /* By default, hide all buttons */
  .sorter-container .sort-button {
    display: none;
    padding: 0;
    margin: 0 2px;
    border: none;
    background: transparent;
    cursor: pointer;
    transition: color 0.2s ease;
  }
  /* On hover over the header cell, show all buttons */
  th:hover .sorter-container .sort-button,
  td:hover .sorter-container .sort-button {
    display: inline-block;
  }
  /* Always show the active sort button even when not hovered */
  .sorter-container .sort-button.active {
    display: inline-block;
  }
  /* Light mode styling */
  @media (prefers-color-scheme: light) {
    .sorter-container .sort-button {
      color: #c0c0c0; /* discreet color in light mode */
    }
    th:hover .sorter-container .sort-button,
    td:hover .sorter-container .sort-button {
      color: #909090; /* more prominent on hover */
    }
  }
  /* Dark mode styling */
  @media (prefers-color-scheme: dark) {
    .sorter-container .sort-button {
      color: #404040; /* discreet color in dark mode */
    }
    th:hover .sorter-container .sort-button,
    td:hover .sorter-container .sort-button {
      color: #606060; /* more prominent on hover */
    }
  }
  `;
  document.head.appendChild(style);
}

// Parse numeric values optionally containing commas and units (e.g. 1,024, 10k, 5 MB/s).
function parseNumberWithUnits(value) {
  if (value === null || value === undefined) return null;

  // Remove thousands separators and normalize spacing
  const cleaned = String(value).replace(/,/g, '').trim();
  if (!cleaned) return null;

  const match = cleaned.match(/^(-?\d+(?:\.\d+)?)(?:\s*([a-zA-Z]+(?:\/s)?|%))?$/);
  if (!match) return null;

  const numberPart = parseFloat(match[1]);
  if (isNaN(numberPart)) return null;

  const unit = (match[2] || '').toLowerCase();

  const unitMultipliers = {
    '': 1,
    '%': 1,
    'k': 1e3,
    'kb': 1024,
    'kib': 1024,
    'kbyte': 1024,
    'kbytes': 1024,
    'kbit': 1e3,
    'kbit/s': 1e3,
    'kb/s': 1e3,
    'kbps': 1e3,
    'm': 1e6,
    'mb': 1024 * 1024,
    'mib': 1024 * 1024,
    'mbyte': 1024 * 1024,
    'mbytes': 1024 * 1024,
    'mbit': 1e6,
    'mbit/s': 1e6,
    'mb/s': 1e6,
    'mbps': 1e6,
    'g': 1e9,
    'gb': 1024 * 1024 * 1024,
    'gib': 1024 * 1024 * 1024,
    'gbyte': 1024 * 1024 * 1024,
    'gbytes': 1024 * 1024 * 1024,
    'gbit': 1e9,
    'gbit/s': 1e9,
    'gb/s': 1e9,
    'gbps': 1e9,
    't': 1e12,
    'tb': 1024 * 1024 * 1024 * 1024,
    'tib': 1024 * 1024 * 1024 * 1024,
    'tbyte': 1024 * 1024 * 1024 * 1024,
    'tbytes': 1024 * 1024 * 1024 * 1024,
    'tbit': 1e12,
    'tbit/s': 1e12,
    'tb/s': 1e12,
    'tbps': 1e12
  };

  const multiplier = unitMultipliers[unit];
  if (multiplier === undefined) return null;

  return numberPart * multiplier;
}

// Parse a semantic version string and return normalized components.
function parseSemVer(value) {
  if (value === null || value === undefined) return null;
  const cleaned = String(value).trim();
  if (!cleaned) return null;

  const match = cleaned.match(
    /^v?(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(?:-([0-9A-Za-z-]+(?:\.[0-9A-Za-z-]+)*))?(?:\+[0-9A-Za-z-]+(?:\.[0-9A-Za-z-]+)*)?$/
  );
  if (!match) return null;

  return {
    major: parseInt(match[1], 10),
    minor: parseInt(match[2], 10),
    patch: parseInt(match[3], 10),
    prerelease: match[4] ? match[4].split('.') : []
  };
}

function isNumericIdentifier(value) {
  return /^\d+$/.test(value);
}

// Compare semantic versions according to SemVer precedence rules.
function compareSemVer(a, b) {
  if (a.major !== b.major) return a.major < b.major ? -1 : 1;
  if (a.minor !== b.minor) return a.minor < b.minor ? -1 : 1;
  if (a.patch !== b.patch) return a.patch < b.patch ? -1 : 1;

  const aHasPre = a.prerelease.length > 0;
  const bHasPre = b.prerelease.length > 0;
  if (!aHasPre && !bHasPre) return 0;
  if (!aHasPre) return 1;
  if (!bHasPre) return -1;

  const len = Math.max(a.prerelease.length, b.prerelease.length);
  for (let i = 0; i < len; i++) {
    const ai = a.prerelease[i];
    const bi = b.prerelease[i];

    if (ai === undefined) return -1;
    if (bi === undefined) return 1;
    if (ai === bi) continue;

    const aiNum = isNumericIdentifier(ai);
    const biNum = isNumericIdentifier(bi);

    if (aiNum && biNum) {
      const aNum = parseInt(ai, 10);
      const bNum = parseInt(bi, 10);
      if (aNum !== bNum) return aNum < bNum ? -1 : 1;
      continue;
    }

    if (aiNum && !biNum) return -1;
    if (!aiNum && biNum) return 1;
    return ai < bi ? -1 : 1;
  }

  return 0;
}

// Add helper function to support "yyyy-MM-dd HH:mm:ss" format.
function parseDate(str) {
  // If the string contains a space but no 'T', replace the first space with 'T'
  if (String(str).indexOf('T') === -1 && String(str).indexOf(' ') !== -1) {
    str = String(str).replace(' ', 'T');
  }
  return Date.parse(String(str));
}

// Update the sort state of a header cell and then re-sort its table
function updateSortState(cell, direction, table) {
  cell.dataset.sortDirection = direction;
  
  // Add or remove 'sorted' class based on the sort direction
  if (direction !== 'none') {
    cell.classList.add('sorted');
  } else {
    cell.classList.remove('sorted');
  }
  
  // Update visual feedback: add "active" class to the active button and remove it from others
  const buttons = cell.querySelectorAll('button');
  buttons.forEach((btn) => {
    if (btn.dataset.sortDirection === direction && direction !== 'none') {
      btn.classList.add('active');
    } else {
      btn.classList.remove('active');
    }
  });
  sortTable(table);
}

// Sort the table rows based on the active sort states in the header cells
function sortTable(table) {
  // Get the header row
  let headerRow = table.querySelector('thead tr');
  if (!headerRow) {
    headerRow = table.querySelector('tr');
  }
  if (!headerRow) return;

  // Build an array of sort criteria based on each header cell (left-to-right order)
  const criteria = [];
  const headerCells = headerRow.querySelectorAll('th, td');
  headerCells.forEach((cell, colIndex) => {
    const dir = cell.dataset.sortDirection;
    if (dir && dir !== 'none') {
      criteria.push({ colIndex: colIndex, direction: dir });
    }
  });

  const tbody = table.querySelector('tbody');
  if (!tbody) return;
  let rows = Array.from(tbody.querySelectorAll('tr'));

  // If no sorting is active, restore the original row order
  if (criteria.length === 0) {
    rows.sort((a, b) => {
      return (parseInt(a.dataset.originalIndex, 10) || 0) - (parseInt(b.dataset.originalIndex, 10) || 0);
    });
  } else {
    // Sort rows based on each active criterion in order
    rows.sort((a, b) => {
      for (let crit of criteria) {
        let cellA = a.children[crit.colIndex];
        let cellB = b.children[crit.colIndex];
        let valA = cellA ? cellA.textContent.trim() : '';
        let valB = cellB ? cellB.textContent.trim() : '';

        // Attempt semantic version parsing before generic date/string checks
        const semverA = parseSemVer(valA);
        const semverB = parseSemVer(valB);
        if (semverA && semverB) {
          const semverCmp = compareSemVer(semverA, semverB);
          if (semverCmp < 0) return crit.direction === 'asc' ? -1 : 1;
          if (semverCmp > 0) return crit.direction === 'asc' ? 1 : -1;
          continue;
        }

        // Attempt date parsing first
        const timeA = parseDate(valA);
        const timeB = parseDate(valB);
        if (!isNaN(timeA) && !isNaN(timeB)) {
          if (timeA < timeB) return crit.direction === 'asc' ? -1 : 1;
          if (timeA > timeB) return crit.direction === 'asc' ? 1 : -1;
          continue;
        }

        // Check if both values are single numbers using regex
        const isNumA = /^\s*-?\d+(\.\d+)?\s*$/.test(valA);
        const isNumB = /^\s*-?\d+(\.\d+)?\s*$/.test(valB);
        if (isNumA && isNumB) {
          let numA = parseFloat(valA);
          let numB = parseFloat(valB);
          if (numA < numB) return crit.direction === 'asc' ? -1 : 1;
          if (numA > numB) return crit.direction === 'asc' ? 1 : -1;
          continue;
        }

        // Attempt parsing numbers with commas or units before falling back to strings
        const parsedA = parseNumberWithUnits(valA);
        const parsedB = parseNumberWithUnits(valB);
        if (parsedA !== null && parsedB !== null) {
          if (parsedA < parsedB) return crit.direction === 'asc' ? -1 : 1;
          if (parsedA > parsedB) return crit.direction === 'asc' ? 1 : -1;
          continue;
        }

        // Fallback to string comparison
        if (valA < valB) return crit.direction === 'asc' ? -1 : 1;
        if (valA > valB) return crit.direction === 'asc' ? 1 : -1;
      }
      // If all criteria result in equality, maintain the original order
      return (parseInt(a.dataset.originalIndex, 10) || 0) - (parseInt(b.dataset.originalIndex, 10) || 0);
    });
  }

  // Append the sorted rows back to the tbody
  rows.forEach(row => tbody.appendChild(row));
}
