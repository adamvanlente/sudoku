/* Namespace for Sudoku game.
 * Contains properties grid, board, game, tools & picker (picks numbers for cells).
 */
var Sudoku = {

  /* Grid: Set up the height and width of the grid, and compute
  * the total area when the script loads.
  */
  grid: {

    // Set the size of the Sudoku board dimensions, eg 3x3, or 2x2.
    dimension: 3,

    // Set some globally needed variables for building the grid.
    getArea: function() {
      this.width = this.dimension;
      this.height = this.dimension;
      this.area = this.width * this.height;
      this.randomCellsAllowed = this.area * this.dimension;
      delete this.getArea;
      return this;
    }

  }.getArea(),


  /* Board: controls setting up the board and filling it with UI elements.
   * the total area when the script loads.  Two priorities drove the decision
   * to structure the functions as I did: 1) to make the squares, rows and columns
   * easy to identify and 2) to create elements that could be assigned simple
   * styling/CSS rules.
   */
  board: {

    // Keep track of current square while the board is being built.
    squareCounter: 0,

    // Reset the board to its original state.
    reset: function() {
      var cells = $('.number-cell');
      _.each(cells, function(cell) {
          Sudoku.board.populateCellHolder(cell.id);
        });
    },

    // Populates an object that holds the ID and value of each cell for easy access.
    populateCellHolder: function(cellId) {
      Sudoku.game.allBoardCells[cellId] = {};
      Sudoku.game.allBoardCells[cellId]["id"] = cellId;
      Sudoku.game.allBoardCells[cellId]["value"] = false;
      $('#' + cellId).attr('class', 'number-cell discovered-auto');
    },

    /* Create the elements of the board.
     * Start by making n rows where n = grid.height.
     */
    createBoard: function() {
      $('#board').html('');
      for (var i = 0; i < Sudoku.grid.height; i++) {
        this.makeBoardRow(i);
      }
      this.reset();
    },

    // Make a row that will hold n squares, where n = grid.width.
    makeBoardRow: function(index) {
      var row = $(document.createElement('div'));
      row.attr('id', 'square-row-' + index);
      row.attr('class', 'square-row');
      for (var i = 0; i < Sudoku.grid.width; i++) {
        this.makeSudokuSquares(row, i, index);
      }
      $('#board').append(row);
    },

    /* Function that makes a Sudoku square.  Square will eventually
     * contain n cells for numbers, where n = grid.area.
     */
    makeSudokuSquares: function(row, boardCols, boardRows) {
      var squareSpan = $(document.createElement('span'));
      var squareId = this.squareCounter;
      squareSpan.attr('id', 'square-' + squareId);
      squareSpan.attr('class', 'sudoku-square');
      for (var i = 0; i < Sudoku.grid.height; i++) {
        this.makeSquareInnerRows(squareSpan, row, squareId, i, boardCols, boardRows);
      }
      this.squareCounter += 1;
      row.append(squareSpan);
    },

    /* Make n rows inside of each square, where n = grid.width.  These rows
     * give the styling of the board more flexibility.
     */
    makeSquareInnerRows: function(square, row, squareId, index, boardCols, boardRows) {
      var squareRow = $(document.createElement('div'));
      squareRow.attr('class', 'square-inner-row');
      for (var i = 0; i < Sudoku.grid.width; i++) {
        this.makeSquareRowCells(squareRow, squareId, i, index, boardCols, boardRows);
      }
      square.append(squareRow);
    },

    // Make a cell inside a square row.  These cells hold an individual number for the game.
    makeSquareRowCells: function(parentRow, squareId, columnId, rowId, boardCols, boardRows) {
      var numberCell = $(document.createElement('label'));
      var columnHelper = boardCols * Sudoku.grid.width;
      columnId += columnHelper;
      var rowHelper = boardRows * Sudoku.grid.width;
      rowId += rowHelper;
      var cellId = squareId + '_' + rowId + '_' + columnId;
      numberCell.attr('id', cellId);
      numberCell.attr('class', 'number-cell');

      // Append an item to our board object for each cell.
      parentRow.append(numberCell);
    }
    // End board object
  },


  /* The tools object stores functions and variables used for creating holders
   * for in-use number, as well as displaying message in the UI.
   */
  tools: {

    /* Make a holder of n items that can remember which squares,
     * rows and columns contain which numbers. n = grid.area.
     */
    makeHolderForMemory: function() {
      var object = {};
      for (var i = 0; i < Sudoku.grid.area; i++) {
        object[i] = [];
      }
      return object;
    },

    // Open/close a UI message.
    message: {

      open: function(messageText) {
        $('#game-message').empty();
        $('#game-message').show();
        $('#game-message').html(messageText);
        $('#game-message').attr('class', 'game-message animated bounceInRight');
        var span = $(document.createElement('span'));
        span.html('dismiss');
        span.click(function() {
            Sudoku.tools.message.close();
          });
        $('#game-message').append(span);
      },

      close: function() {
        $('#game-message').attr('class', 'game-message animated bounceOutRight');
      }

    },

    // Element styles to set on page load.
    pageLoadElements: function() {
      $('#welcome').show();
      $('#welcome').attr('class', 'welcome bounceIn animated');
      $('#solve-button').hide();
      $('#start-button').hide();
      $('#solving-status').hide();
      $('#number-picker').hide();
      $('#game-message').hide();
    },

    // Set main elements in the UI to their resting state/classes.
    setElements: function() {
      $('#solving-status').hide();
      $('#solving-status').attr('class', 'solving-status');
      $('#number-picker').hide();
      $('#game-message').hide();
      $('#solve-button').show();
      $('#start-button').show();
      $('#welcome').attr('class', 'welcome bounceOutUp animated');
    }
    // End tools object
  },

  // Game object handles all game logic, and kicks off several UI interactions.
  game: {

    /* Keep a object that holds all cells.  This object will indicate which cells
     * are filled, and what their value is.
     */
    allBoardCells: {},

    /* Optional hint mode.  Not currently available to user.  Will highlight cells
     * in which illegal values have been placed.
     */
    hintMode: false,

    // Determines if a game is currently in progress.
    inProgress: false,

    // Holder to keep track of a timeout on a solving message (so it can be easily killed).
    solvingTimeout: false,

    /* Start a new game.  Reset all UI & board elements.  Reset occupied
     * memory objects and the allBoardCells object so that a blank board
     * is also represented in memory.  Fill the board with a new puzzle.
     */
    init: function() {
      Sudoku.tools.setElements();
      this.resetMemory();
      this.createSolvablePuzzle();
      clearInterval(this.solvingTimeout);
    },

    /* Clear memory, a) objects holding lists of numbers present in squares,
     * rows and columns, and b) the object holding every ID and available
     * value of each cell.
     */
    resetMemory: function() {
      this.occupied.reset();
      this.allBoardCells = {};
    },

    /* Remember which cells are occupied, and with what.  These occupied
     * holders can be accessed like so: Sudoku.game.occupied.squares[SQUARE_ID]
     * will return a list of all numbers present in square with id SQUARE_ID.
     */
    occupied: {

      reset: function() {
        this.squares = Sudoku.tools.makeHolderForMemory();
        this.rows = Sudoku.tools.makeHolderForMemory();
        this.columns = Sudoku.tools.makeHolderForMemory();
        return this;
      }

    },

    /* Fill an empty board with random numbers to start the game.  Function
     * operates by filling the entire board with a valid, completed Sudoku,
     * then removes random numbers to create a game board.
     */
    createSolvablePuzzle: function() {
      // Reset board, regardless of current state.
      Sudoku.board.reset();

      // Solve a blank puzzle - all cells will contain valid numbers.
      this.solveBoard();

      // Randomly clear board cells, the maximum number of which is pre-determined.
      var cells = $('.number-cell');
      var randCells = _.shuffle(cells);
      var randomCellsToClear = randCells.length - Sudoku.grid.randomCellsAllowed;
      for (var j = 0; j < randomCellsToClear; j++) {
        var cell = randCells[j];
        this.forgetNumber(cell.id);
      }
      this.inProgress = true;
    },

    // Remember a number that has been placed in a cell on the board.
    rememberNumber: function(cellId, number) {
      // Don't allow string as values, just to be safe.
      number = parseInt(number);
      $('#' + cellId).html(number);
      var idArray = cellId.split('_');
      var squareId = idArray[0];
      var rowId = idArray[1];
      var columnId = idArray[2];
      this.occupied.squares[squareId].push(number);
      this.occupied.rows[rowId].push(number);
      this.occupied.columns[columnId].push(number);
      this.allBoardCells[cellId]['value'] = number;
    },

    // Forget a number that has been remembered in a cell on the board. Clear the cell.
    forgetNumber: function(cellId) {
      var targetCell =  $('#' + cellId);

      // Reset the 'unsolved cell' holder's value to false.
      var number = this.allBoardCells[cellId]['value'];
      this.allBoardCells[cellId]["value"] = false;

      // Empty cell on board.
      targetCell.empty();
      targetCell.attr('class', 'number-cell undiscovered-auto');

      // Get cell info.
      var idArray = cellId.split('_');
      var squareId = idArray[0];
      var rowId = idArray[1];
      var columnId = idArray[2];

      // These cells are no longer occupied.
      var squareNumLoc = this.occupied.squares[squareId].indexOf(number);
      this.occupied.squares[squareId].splice(squareNumLoc, 1);
      var rowNumLoc = this.occupied.rows[rowId].indexOf(number);
      this.occupied.rows[rowId].splice(rowNumLoc, 1);
      var colNumLoc = this.occupied.columns[columnId].indexOf(number);
      this.occupied.columns[columnId].splice(colNumLoc, 1);
    },

    // Assign a number to a cell as selected by a user.
    assignCellNumber: function(cellId, number) {
      var className = 'number-cell undiscovered-auto user-input';
      var isValid = this.isValidCellContent(cellId, number);
      className = !isValid && this.hintMode ? className + ' invalid-cell' : className;
      $('#' + cellId).attr('class', className);
      $('#' + cellId).html(number);
      Sudoku.picker.close();
    },

    // Clear a cell of value, if a user has already entered a value into it.
    clearCell: function(cellId) {
      var className = 'number-cell undiscovered-auto';
      $('#' + cellId).attr('class', className);
      $('#' + cellId).empty();
      Sudoku.picker.close();
    },

    // Determine if a value is allowed for a particlar cell.
    isValidCellContent: function(cellId, number) {
      var idArray = cellId.split('_');
      var squareId = idArray[0];
      var rowId = idArray[1];
      var columnId = idArray[2];
      var availableForSquare = this.occupied.squares[squareId].indexOf(number) == -1;
      var availableForRow = this.occupied.rows[rowId].indexOf(number) == -1;
      var availableForColumn = this.occupied.columns[columnId].indexOf(number) == -1;
      return availableForSquare && availableForRow && availableForColumn;
    },

    // Get all valid numbers for a particular cell.
    getValidOptionsForCell: function(id) {
      var range = _.shuffle(_.range(1, Sudoku.grid.area + 1));
      var idArray = id.split('_');
      var squareId = idArray[0];
      var rowId = idArray[1];
      var columnId = idArray[2];
      for (var i = 0; i < range.length; i++) {
        if (!this.isValidCellContent(id, range[i])) {
          range.splice(i, 1);
        }
      }
      return range;
    },

    /* Iterate over all the cells and return the first cell with
     * no value assigned, or return false if no empty cells remain.
     */
    getNextAvailableCell: function() {
      for (var item in this.allBoardCells) {
        var cell = this.allBoardCells[item];
        if (!cell['value']) {
          return cell;
        }
      }
      return false;
    },

    /* When a user attempts to solve a puzzle, determine if there are duplicate
     * values in a particular square, row or column.  If so, deliver a message
     * indicating so.  If not, continue to solving.
     */
    validateBeforeSolve: function() {
      // $('#solving-status').attr('class', 'solving-status');
      Sudoku.picker.close();
      if (!this.inProgress) {
        return false;
      }

      var gridIsValid = Sudoku.game.checkForDuplicateCellContent();
      if (!gridIsValid) {
        var message = 'There are duplicate numbers in some squares, rows or columns';
        Sudoku.tools.message.open(message);
        return false;
      }
      Sudoku.game.rememberUserInput();
    },

    // Before solving, collect all user update fields and remember their values.
    rememberUserInput: function() {
      var userSubmittedCells = $('.user-input');
      for (var i = 0; i < userSubmittedCells.length; i++) {
        var cellId = userSubmittedCells[i].id;
        var number = $('#' + cellId).html();
        this.rememberNumber(cellId, number);
      }
      var emptyCellsRemain = this.getNextAvailableCell();
      this.finishPuzzleValidation(emptyCellsRemain);
    },

    /* If no empty cells remain, puzzle has been solved.  If no duplicate cells were found
     * above, and cells are all filled, it follows that the puzzle has been filled out
     * completely and correctly.  Give the user a message.
     */
    finishPuzzleValidation: function(emptyCellsRemain) {
      if (!emptyCellsRemain) {
        $('#solving-status').show();
        $('#solving-status').html('Congratulations!  You solved the puzzle!');
        var link = $(document.createElement('span'));
        link.html('start another game');
        link.click(function() {
            Sudoku.game.init();
          });
        $('#solving-status').append(link);
        $('#solving-status').addClass('animated bounceInUp');
        this.inProgress = false;
      } else {
        // If empty cells remain and no duplicate values are found, let the algorithm find a solution.
        $('#solving-status').show();
        $('#solving-status').html('Searching for solutions to your puzzle...');
        $('#solving-status').addClass('animated bounceInUp');
        // In some cases, it may take a moment to solve a puzzle.  Give a message div a moment
        // to load before the solver takes all the browsers attention.
        setTimeout(function() {
            Sudoku.game.solveBoard();
          }, 1000);
      }
    },

    /* Validate the user input.  Determine if squares, rows or columns have duplicate values.
     * If no duplicate values are found, no empty cells are found, and all squares, rows &
     * columns have a length of grid.area, puzzle is solved.  The reason we cannot use the
     * standard isValidCellContent function is because we are not ready to commit these values
     * to memory, so we must create new (temporary) holders to check their validity.
     */
    checkForDuplicateCellContent: function() {
      var squares = {};
      var rows = {};
      var columns = {};

      for (var cellId in this.allBoardCells) {
        var number = $('#' + cellId).html();

        var idArray = cellId.split('_');
        var squareId = idArray[0];
        var rowId = idArray[1];
        var columnId = idArray[2];

        // Check for duplicates in Squares.
        if (!squares[squareId]) {
          squares[squareId] = [];
        }
        // If number has already been found, return false.
        if (squares[squareId].indexOf(number) != -1) {
          return false;
        }
        // Record the number.
        if (number != '') {
          squares[squareId].push(number);
        }

        // Check for duplicates in Rows.
        if (!rows[rowId]) {
          rows[rowId] = [];
        }
        if (rows[rowId].indexOf(number) != -1) {
          return false;
        }
        if (number != '') {
          rows[rowId].push(number);
        }

        // Check for duplicates in Columns.
        if (!columns[columnId]) {
          columns[columnId] = [];
        }
        if (columns[columnId].indexOf(number) != -1) {
          return false;
        }
        if (number != '') {
          columns[columnId].push(number);
        }
      }
      // No duplicate were found in any cell.
      return true;
    },

    /* Solve a Sudoku board.  This function navigates over empty squares and tries
     * random values to create a full Sudoku puzzle.  If no allowed value is found
     * in a given square, the function returns to the previous square and continues
     * trying different values.  This function is used 1) When a new board is created.
     * It fills out the entire board, then removes random squares, so a solvable
     * puzzle is assured.  Also, 2) when a user solves an incomplete puzzle, this
     * function will attempt to fill out the board to make it valid.  If the puzzle
     * is already complete, or if it contains duplicate values, this function will
     * not be invoked.
     */
    solveBoard: function() {
      // Determine if there are additional empty cells to navigate.
      var nextAvailableCell = this.getNextAvailableCell();

      // If no empty cells exist, the puzzle is solved.
      if (!nextAvailableCell) {
        this.finishGame();
        return true;
      } else {

        // Available cells remain.  Try a value in the next available cell.
        var cellId = nextAvailableCell.id;
        var idArray = cellId.split('_');
        var squareId = idArray[0];
        var rowId = idArray[1];
        var columnId = idArray[2];
        var targetCell = $('#' + cellId);

        // For this cell, get the values in its local square, row and column.
        var currentSquare = this.occupied.squares[squareId];
        var currentRow = this.occupied.rows[rowId];
        var currentColumn = this.occupied.columns[columnId];

        // Based on its local numbers, determine which numbers are valid entries.
        var newRange = _.range(1, Sudoku.grid.area + 1);
        var availableNumbers = [];
        for (var i = 0; i < newRange.length; i++) {
          var newNumber = newRange[i];
          var validForSquare = currentSquare.indexOf(newNumber) == -1;
          var validForRow = currentRow.indexOf(newNumber) == -1;
          var validForColumn = currentColumn.indexOf(newNumber) == -1;
          if (validForSquare && validForRow && validForColumn) {
            availableNumbers.push(newNumber);
          }
        }
        availableNumbers = _.shuffle(availableNumbers);

        // Loop over available numbers and place one in the cell.
        for (var j = 0; j < availableNumbers.length; j++) {
          var number = availableNumbers[j];

          // Drop number into cell in the UI.
          targetCell.html(number);

          // Remember the value that has been assigned.
          this.occupied.squares[squareId].push(number);
          this.occupied.rows[rowId].push(number);
          this.occupied.columns[columnId].push(number);
          this.allBoardCells[cellId]["value"] = number;

          if (this.solveBoard()) {
            // If this attempt at solving succeeded, puzzle is solved!
            return true;
          
          // Board was not solved on this attempt, backtrack and try again.
          } else {
            
            // Empty cell of its value.
            targetCell.empty();

            // Forget the cell's value in memory.
            var squareIndex = this.occupied.squares[squareId].indexOf(number);
            this.occupied.squares[squareId].splice(squareIndex, 1);
            var rowIndex = this.occupied.rows[rowId].indexOf(number);
            this.occupied.rows[rowId].splice(rowIndex, 1);
            var columnIndex = this.occupied.columns[columnId].indexOf(number);
            this.occupied.columns[columnId].splice(columnIndex, 1);
            this.allBoardCells[cellId]["value"] = false;
          }
        }
        return false;
      }
    },

    // Set a message signaling the end of the game.
    finishGame: function() {
      // If game is not in progress, do not kick off this timer.
      if (Sudoku.game.inProgress) {
        this.solvingTimeout = setTimeout(function(){
            $('#solving-status').attr('class', 'solving-status');
            $('#solving-status').addClass('animated bounceOutUp');
            Sudoku.game.inProgress = false;
          }, 1000);
      }
    },
    // End game object
  },

  /* Picker controls the UI element that allows the user to 
   * enter a number into a cell while solving a puzzle.
   */
  picker: {

    // Sets onclick function for puzzle cells.
    init: function() {
      $('.number-cell').click(function() {
          Sudoku.picker.launchPicker(this);
        });
    },

    // Launch the picker UI element.
    launchPicker: function(cell) {
      // If no game in progress, do not launch.
      if (cell.className == 'number-cell discovered-auto' || !Sudoku.game.inProgress) {
        return false;
      }

      // In case another cell is being edited, reset its appearance.
      this.clearCurrentlyUpdating();

      // Show the picker element.
      $('#number-picker').empty();
      $('#number-picker').show();
      $('#number-picker').addClass('flipInX animated');
      
      // Show that the cell is having its value updated.
      $('#' + cell.id).addClass('currently-updating');
      
      // Fill the picker with available number options.
      for (var i = 0; i < Sudoku.grid.area; i++) {
        var number = i + 1;
        var button = this.makeNumberButton(number, cell.id);
      }

      // Add buttons to close picker and to cancel editing of cell.
      this.closePickerButton();
      this.makeClearButton(cell.id);
    },

    // Close the picker elemnt on cancel/finished editing.
    close: function() {
      $('#number-picker').attr('class', 'number-picker');
      $('#number-picker').addClass('flipOutX animated');
      setTimeout(function() {
          $('#number-picker').hide();
          $('#number-picker').attr('class', 'number-picker');
        }, 800);
      this.clearCurrentlyUpdating();
    },

    // Reset the appearance of any currently editing elements in the puzzle.
    clearCurrentlyUpdating: function() {
      var cells = $('.currently-updating');
      _.each(cells, function(cell) {
        $('#' + cell.id).attr('class', 'number-cell undiscovered-auto');
      });
    },

    // Make a number button for the picker element & append it to the picker.
    makeNumberButton: function(number, cellId) {
      var button = $(document.createElement('button'));
      button.html(number);
      button.click(function(){
          Sudoku.game.assignCellNumber(cellId, number);
        });
      $('#number-picker').append(button);
    },

    // Make a close button for the picker element & append it to the picker.
    closePickerButton: function() {
      var button = $(document.createElement('button'));
      button.html('cancel');
      button.click(function(){
          Sudoku.picker.close();
        });
      $('#number-picker').append(button);
    },

    // Make a 'clear-cell' button for the picker element & append it to the picker.
    makeClearButton: function(cellId) {
      var cellValue = $('#' + cellId).html();
      if (cellValue && cellValue != '') {
        var button = $(document.createElement('button'));
        button.html('clear cell');
        button.click(function(){
            Sudoku.game.clearCell(cellId);
          });
        $('#number-picker').append(button);
      }
    }
    // End picker object
  },

  // Initializer for the page itself.  Sets up an initial board
  init: function() {
    // Create the game board.
    this.board.createBoard();

    // Initialize click listener for Sudoku board cells.
    this.picker.init();

    // Set some UI elements on load
    Sudoku.tools.pageLoadElements();
  }

};

Sudoku.init();
