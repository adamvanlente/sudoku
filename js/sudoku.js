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
      this.randomCellsAllowed = this.area * 1.8;
      delete this.getArea;
      return this;
    }

   }.getArea(),

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
     // Hold an item in our board object for each cell.
     parentRow.append(numberCell);
    }
  },



  game: {

    
    //!! Seems calling to outside functions here can ruin performance/ability to find a solution.
    // EG call out to this.rememeberNumber cannot, then immediately to this.forgetNumber often
    // fails to remember/remove number properly.  Seeing many weird errors.  Likely have to leave
    // code as is to continue seeing reliable performance (will be repeating code in a handful of places
    //  as a result).
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

          // NOTE: Cannot make call to outside function - does not perform quickly enough.
          this.occupied.squares[squareId].push(number);
          this.occupied.rows[rowId].push(number);
          this.occupied.columns[columnId].push(number);

          this.allBoardCells[cellId]["value"] = number;

          if (this.solveBoard()) {
            return true;
          } else {
            
            // BACKITUP

            // NOTE: Cannot make call to outside function - does not perform quickly enough.
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


  init: function() {
    this.board.createBoard();
  }

};

Sudoku.init();