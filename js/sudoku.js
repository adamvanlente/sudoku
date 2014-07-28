/* Namespace for Sudoku game.
* Contains properties grid, board, game, tools & picker (picks numbers for cells).
*/
var Sudoku = {

  /* Grid: Set up the height and width of the grid, and compute
  * the total area when the script loads.
  */
  grid: {

    // Set the size of the Sudoku board dimensions, eg 3x3, or 2x2.
    dimension: 2,

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

    // Identify the board element for easy access and readability.
    boardElement: $('#board'),

    // Keep track of current square while the board is being built.
    squareCounter: 0,

    /* Create the elements of the board.  It will be structured like
     * a table - it will have large rows and columns to hold the squares.
     * Start by making n rows where n = grid.height.
     */
    createBoard: function() {
      this.boardElement.html('');
      for (var i = 0; i < Sudoku.grid.height; i++) {
        this.makeBoardRow(i);
      }
    },

    // Reset the board to its original state.
    reset: function() {
      for (var item in Sudoku.game.currentBoard) {
        $('#' + item).empty();
        Sudoku.game.currentBoard[item] = true;
      }
      this.resetCells();
    },

    // Reset all cells to their initial number-cell class
    resetCells: function() {
      var startingClass = 'number-cell';
      var cells = $('.' + startingClass);
      _.each(cells, function(cell){
          $('#' + cell.id).attr('class', startingClass);
        });
    },

    // Make a row that will hold n squares, where n = grid.width.
    makeBoardRow: function(index) {
      var row = $(document.createElement('div'));
      row.attr('id', 'square-row-' + index);
      row.attr('class', 'square-row');
      for (var i = 0; i < Sudoku.grid.width; i++) {
        this.makeSudokuSquares(row, i, index);
      }
      Sudoku.board.boardElement.append(row);
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
      Sudoku.game.currentBoard[cellId] = true;
      // Hold an item in our board object for each cell.
      parentRow.append(numberCell);
    }
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

    // Display a message in the UI.
    message: function(messageText) {
      $('#game-message').empty();
      $('#game-message').show();
      $('#game-message').html(messageText);
      $('#game-message').addClass('animated bounceInRight');
      var span = $(document.createElement('span'));
      span.html('close');
      span.click(function() {
          Sudoku.tools.closeMessage();
        });
      $('#game-message').append(span);
    },

    // Close the UI message.
    closeMessage: function() {
    $('#game-message').show();
    $('#game-message').attr('class', 'game-message');
    $('#game-message').addClass('animated bounceOutRight');
    setTimeout(function() {
        $('#game-message').attr('class', 'game-message');
        $('#game-message').hide();
      }, 1000);
    },

    // Reset main elements in the UI.
    resetElements: function() {
      $('#solving-status').attr('class', 'solving-status');
      $('#solving-status').hide();
      $('#number-picker').attr('class', 'number-picker');
      $('#number-picker').hide();
      $('#game-message').attr('class', 'game-message');
      $('#game-message').hide();
    }
  },

  // Game object handles all game logic, and kicks off several UI interactions.
  game: {

    // Make a object that represents the current board.
    currentBoard: {},

    /* Keep a object that holds all cells.  This object will indicate which cells
     * are filled, and what their value is.
     */
    allBoardCells: {},

    /* Optional hint mode.  Not currently available to user.  Will highlight cells
     * in which illegal values have been placed.
     */
    hintMode: false,

    // Determines if a game is currently in progress.
    started: false,

    init: function() {
      Sudoku.tools.resetElements();
      Sudoku.board.reset();
      this.occupied.reset();
      this.allBoardCells = {};
      this.fillBoardObject();
    },

    // Remember which cells are occupied, and with what.
    occupied: {

      reset: function() {
        this.squares = Sudoku.tools.makeHolderForMemory();
        this.rows = Sudoku.tools.makeHolderForMemory();
        this.columns = Sudoku.tools.makeHolderForMemory();
        return this;
      }
    },

    /* Fill an empty board with random numbers to start the game.  Function actually
     * operates by filling the entire board with a valid, completed Sudoku, then removes
     * random numbers to create a game board.
     */
    fillBoardObject: function() {
      var cells = $('.number-cell');
      for (var i = 0; i < cells.length; i++) {
        this.populateCellHolder(cells[i]);
      }
      this.solveBoard();
      var randCells = _.shuffle(cells);
      for (var j = 0; j < (randCells.length - Sudoku.grid.randomCellsAllowed); j++) {
        var cell = randCells[j];
        this.forgetNumber(cell.id);
      }
      this.started = true;
    },

    // Populates an object that holds the ID and value of each cell for easy access.
    populateCellHolder: function(cell) {
      this.allBoardCells[cell.id] = {};
      this.allBoardCells[cell.id]["id"] = cell.id;
      this.allBoardCells[cell.id]["value"] = false;
      $('#' + cell.id).attr('class', 'number-cell discovered-auto');
    },

    // Remember a number that has been placed in a cell on the board.
    rememberNumber: function(cellId, number) {
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
      var className = 'number-cell undiscovered-auto value-added';
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
     * indicating so.  If not, continue to 
     */
    validateBeforeSolve: function() {
      $('#solving-status').attr('class', 'solving-status');
      if (!this.started) {
        return false;
      }

      var gridIsValid = Sudoku.game.checkForDuplicateCellContent();
      if (!gridIsValid) {
        var message = 'There are duplicate numbers in some squares, rows or columns';
        Sudoku.tools.message(message);
        return false;
      }
      
      Sudoku.game.rememberUserInput();

      /* If no empty cells remain, puzzle has been solved.  If no duplicate cells were found
       * above, and cells are all filled, it follows that the puzzle has been filled out
       * completely and correctly.  Give the user a message.
       */
      var emptyCellsRemain = this.getNextAvailableCell();
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
        this.started = false;
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

    rememberUserInput: function() {
      var userSubmittedCells = $('.value-added');
      for (var i = 0; i < userSubmittedCells.length; i++) {
        var cellId = userSubmittedCells[i].id;
        var number = $('#' + cellId).html();
        this.rememberNumber(cellId, number);
      }
    },

    // Validate the user input.  Determine if squares, rows or columns have duplicate values.
    // If no duplicate values are found, no empty cells are found, and all squares, rows &
    // columns have a length of grid.area, puzzle is solved.
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

    solveBoard: function() {
      var nextAvailableCell = this.getNextAvailableCell();
      if (!nextAvailableCell) {
        setTimeout(function(){
            if (Sudoku.game.started) {
              $('#solving-status').attr('class', 'solving-status');
              $('#solving-status').addClass('animated bounceOutUp');
              this.started = false;
            }
          }, 2000);
        return true;
      } else {

        // SET CELL ID AND GET ITS LOCATION

        var cellId = nextAvailableCell.id;

        var idArray = cellId.split('_');
        var squareId = idArray[0];
        var rowId = idArray[1];
        var columnId = idArray[2];

        // BE SURE TO KNOW WHICH CELLS ARE OCCUPIED WITH WHAT

        var currentSquare = this.occupied.squares[squareId];
        var currentRow = this.occupied.rows[rowId];
        var currentColumn = this.occupied.columns[columnId];

        //GETTING AVAILABLE NUMBERS;

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

        for (var j = 0; j < availableNumbers.length; j++) {
          var number = availableNumbers[j];

          $('#' + cellId).html(number);

          this.occupied.squares[squareId].push(number);
          this.occupied.rows[rowId].push(number);
          this.occupied.columns[columnId].push(number);

          this.allBoardCells[cellId]["value"] = number;

          if (this.solveBoard()) {
            return true;
          } else {
            // SOMETHING WENT WRONG, FORGET STUFF AND BACKTRACK

            $('#' + cellId).empty();

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
    }
  },

  picker: {

    init: function() {
      this.setNumberPickerOnclick();
    },

    setNumberPickerOnclick: function() {
      $('.number-cell').click(function() {
        Sudoku.picker.launchPicker(this);
      });
    },

    launchPicker: function(cell) {
      if (cell.className == 'number-cell discovered-auto' || !Sudoku.game.started) {
        return false;
      }
      this.clearCurrentlyAdding();
      $('#number-picker').empty();
      $('#number-picker').show();
      $('#number-picker').addClass('flipInX animated');
      // $('#number-picker').attr('class', 'number-picker');
      $('#' + cell.id).addClass('currently-adding');
      for (var i = 0; i < Sudoku.grid.area; i++) {
        var number = i + 1;
        var button = this.makeNumberButton(number, cell.id);
      }
      this.closePickerButton();
      this.makeClearButton(cell.id);
    },

    close: function() {
      $('#number-picker').attr('class', 'number-picker');
      $('#number-picker').addClass('flipOutX animated');
      setTimeout(function() {
          $('#number-picker').hide();
          $('#number-picker').attr('class', 'number-picker');
        }, 800);
      this.clearCurrentlyAdding();
    },

    clearCurrentlyAdding: function() {
      var cells = $('.currently-adding');
      _.each(cells, function(cell) {
        $('#' + cell.id).attr('class', 'number-cell undiscovered-auto');
      });
    },

    makeNumberButton: function(number, cellId) {
      var button = $(document.createElement('button'));
      button.html(number);
      button.click(function(){
          Sudoku.game.assignCellNumber(cellId, number);
        });
      $('#number-picker').append(button);
    },

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
    },

    closePickerButton: function() {
      var button = $(document.createElement('button'));
      button.html('cancel');
      button.click(function(){
          Sudoku.picker.close();
        });
      $('#number-picker').append(button);
    }

  },

  // Initializer for the page itself.  Sets up an initial board
  init: function() {
    // Create the game board.
    this.board.createBoard();

    // Initialize click listener for Sudoku board cells.
    this.picker.init();

    // Reset some UI elements to an original state.
    Sudoku.tools.resetElements();
  }

};

Sudoku.init();