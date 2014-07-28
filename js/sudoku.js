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

  init: function() {
    this.board.createBoard();
  }

};

Sudoku.init();