SUDOKU by ADAM
==============

Some notes on a Sudoku game board I made.  Permanent link here: http://www.adamvanlente.com/sudoku

tl;dr: I thought I could probably make a decent Sudoku puzzle with some clever looping/shuffling/calculating different permuatations of numbers based on grid size.  Learned quickly that was not going to work.  Discovered most folks using some kind of backtracking algorithm.  Fine tuned that for a bit.  Spent a good deal of time tinkering with game play/user input.  Would liked to have developed a more sophisticated method of creating the gameboard in an effort to offer (and understand) different difficulty levels in Sudoku.

## Initial design prep

With a basic understanding of the rules of Sudoku in mind, I had a few goals when planning the design of the project:

 - Allow the user to solve the board at any time (eg give up, let the computer solve the board)
 - Find a way to make this solve method run quickly
 - Add a 'difficulty' option (eg easy, medium, hard)
 - Allow for at least one other choice of grid (2x2); eg, build the game &amp; logic to work under different grid sizes.
 - Find some way to make game play easy on smaller screens.  Specifically, I knew I didn't want the user to deal with text inputs for game manipulation

## Building the board

My initial effort to build a board in the UI is basically the same as the final implementation.  Instead of just building w x h squares, I wanted to build a solid board that gave me flexible styling options.  I also knew I wanted every cell to hold an ID that represented its square, row and column.  

Most of my early time was spent trying to correctly populate this board with a solvable puzzle.  All my early efforts calculated a maximum number of squares to fill, and simply validated if they were allowed in their cell.  In the end I realized it made the most sense to solve a blank puzzle, then clear a select number of squares to create a new (definitely solvable) puzzle.

## Game design decisions

I had a few design ambitions early on, but only a few stuck through the process.  
 
 - I knew I wanted the code to support different grid sizes.  For instance, I felt it would be lazy to offer a range of [1,2..9] hard coded into the js.  I wanted to numbers to be generated with range(1..grid.area).
 
 - In the UI, I knew I couldn't use &lt;input type="text"&gt; for the cells; on mobile devices this would be a huge pain for the user (screen zooms in, select number, zoom back out).  I actually considered a dropdown before I realized an onclick/popup was absolutely the way to go.  The screen is a little cramped on a smart phone, but overall I am pleased with this aspect.

## Libraries and structure choices

#### Libraries

 - I included jQuery for DOM manipulation.  I don't always include jQuery, and the point at which I do is usually the need for ajax, but I didn't want to stress over browser compatability/speed for DOM manipulation, so this was an easy choice.
 
 - Underscore.js was included.  I originally had my own shuffle function, but I brought in Underscore because I believed it would improve performance in the critical solveBoard function.  I also like Underscore's simple _.each call for interating on arrays, though I avoided using it where speed was absolutely critical.
 
 - I usually have a grid size in mind when working on a project.  Given the layout of a Sudoku board, I knew I eventually wanted to settle on a grid size, and move the css to SASS to make it easy to scale the grid for different devices/screen sizes.
 
 - I have been looking for an excuse to use the Animate.css library, and this was the perfect opportunity.  It provides some smooth bounce in/out CSS transitions for the different popups/modals.
 
 - I also included a Google webfont.  They are incredibly easy to implement, and I think they improve the look in feel a great deal.  I often use Roboto (used here) or Open Sans.

#### File structure

<pre>
 sudoku
 ------
   index.html : main elements for sudoku game.
   /brainstorming : some early attempts at creating a puzzle
      v0.html
      v1.html
      README.md
   /css
      _sass_globals.sass : global variables for styles
      animate.css : libaray used for animations
      sudoku_style.css : created by sass compiler
      sudoku_styee.sass : sass styles for sudoku board
   /images  
      apple-touch-icon-114x114-precomposed.png : apple home screen icon
      favicon.ico
   /js
      jquery.js : v1.10.0
      sudoku.js : all logic and ui interactions for the game
      underscore.js : library for small tasks like shuffling and readable iteration
   README.md
</pre>
 
## Lessons learned

A lot of stuff happened that I didn't anticipate when designing this board.  

 - I initially thought I could use brute force to solve a puzzle.  My inital approach basically considered the board as 9 squares.  My early attempts took a range of 1-9, and then ran an algorithm to give me an array of every permutation of that number.  I thought I could hold that in memory and iterate over it until an acceptable version of that range worked for a given square.  It actually worked a few times, but most times it shut down the browser.  At that point I discovered most people implementing a backtracking algorithm and set about working that into my code.
 
 - Once I had the backtracking algorithm working to create puzzles, I thought I was home free.  I still had an outstanding performance issue, however, and I couldn't figure out why.  In my main 'solveBoard' function, I was calling to outside functions to remember cell numbers, forget them, or check their validity.  In the end, this did not work reliably.  I found that the outside functions would often get called too late, and invalid numbers were being allowed in squares; the puzzle was not following the rules.  I moved all this functionality inside of the function, which made the method reliable and performant.  It forced me to repeat myself in parts of the code, but I don't believe there was a reasonable alternative.

 - I wasted a lot of time trying to set up a valid starting puzzle.  My early method chose a random amount of squares and filled them with (valid) numbers.  Then I would run my solve algorithm - with widely varying results.  I found that the number of random squares I started with made the puzzle more/less solvable (and often unsolvable).  I eventually setlled on a number grid.area * grid.dimesion (eg 9x3=27 for a standard Sudoku) as the limit of random squares that could be populated to create a starting puzzle.  This seemed pretty reliable, but I still didn't know how to create a puzzle that I knew would be solvable (hardest lesson: just because all filled squares are valid does not mean solutions exist, especially easy to see on a 2x2 sudoku grid).  As soon as I stepped away from this problem it was obvious: I would run my solve algorithm on a empty board to completely fill it out, and then clear away random squares to create a puzzle I knew could be solved.  This increased speed an reliability immensely (see test info at bottom of this file).


## Goals if I had more time

The main unfinished item I had was to determine some kind of difficulty rating.  As I studied Sudoku design methods, the idea was a bit too abstract for me to obsess over, when making the game look slick was a much bigger priority.  I eventually found a puzzle creating method that resulted in a board that was easiest for the computer to solve, but I would have liked to make the game more reliably enjoyable to play as well.

Other unfinished business:

 - If I had an extra day, I may have tried to fit this code into some sort of JS pattern, but only to show that I'm aware of/familiar with such patterns, not because I think the project warranted one.

 - I have a hint mode option that is about 90% functional.  It highlights a cell when the user submits an invalid number (eg 8 in a row where 8 already exists).  When I didn't have time to finish the feature's toggle in the UI, I felt it was better defaulted to OFF.

 - I have the code set up to accept different grid sizes, and I wanted a toggle in the UI that let the user switch between 2x2 grid and the standard 3x3.  2x2 grids are a lot easier, and I had a lot of fun using that size to prototype my board.  The functionality is available but, again, I didn't make the time to put this into the UI.

### Tests

I kept a record of some tests I did while tinkering with setting up a puzzle for solving.  The tables below show how long it took for my 'solveBoard' algorithm to find a solution, how many recursive searches it made, and how many times it backtracked.

#### Random board fill method (fill a random number of squares with valid numbers):

<pre>    Cells Filled    Time    Solve Recurs    Backtracks  
         27           111ms        984             919
                       98ms        923             858
                       52ms        442             377
                       73ms        603             538
                     9863ms    130,666         130,601
                      153ms      2,133           2,068
                       68ms        816             751
                       34ms        487             422
                       43ms        537             472
-----------------------------------------------------------------
       Average       1157ms     15,073          15,008</pre>

#### Strategic board fill method (solve puzzle first, clear random cells):

<pre>    Cells Filled    Time    Solve Recurs    Backtracks  
          27           18ms         257              202
                       50ms         547              592
                       57ms         979              924
                       68ms       1,017              962
                       49ms         810              755
                       72ms       1,268            1,213
                        9ms         118               63
                      423ms       7,827            7,772
                       15ms         198              143
-----------------------------------------------------------------
        Average        78ms       1,334            1,279</pre>

 * As we can see, the second method is an order of magnitude faster on average.  This does not speculate on how easy/difficult the resulting puzzle are to solve for the person playing, but that was not the aim of these tests.  I wanted this part to run fast and reliably, so the latter method is what was implemented.